import { WebSocket } from 'ws';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../utils/prisma.js';

const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || 'models/gemini-2.0-flash-live-001';

// ─── Context loader ───────────────────────────────────────────────────────────

async function loadContext(userId, topicId, examId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!user) throw new Error('User not found');

  const [topic, exam] = await Promise.all([
    topicId
      ? prisma.topic.findUnique({
          where: { id: topicId },
          select: {
            id: true,
            title: true,
            content: true,
            chapter: {
              select: {
                title: true,
                subject: {
                  select: {
                    title: true,
                    exam: { select: { title: true } },
                  },
                },
              },
            },
          },
        })
      : null,
    examId && !topicId
      ? prisma.exam.findUnique({
          where: { id: examId },
          select: { id: true, title: true, description: true },
        })
      : null,
  ]);

  return { user, topic, exam };
}

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt({ user, topic, exam }) {
  let contextBlock = '';

  if (topic) {
    const breadcrumb = [
      topic.chapter?.subject?.exam?.title,
      topic.chapter?.subject?.title,
      topic.chapter?.title,
      topic.title,
    ]
      .filter(Boolean)
      .join(' › ');

    contextBlock = `\n\nThe student is currently studying: ${breadcrumb}`;

    if (topic.content) {
      // Trim to avoid overflowing the context window
      contextBlock += `\n\nTopic content (use this to ground your answers):\n${topic.content.substring(0, 3000)}`;
    }
  } else if (exam) {
    contextBlock = `\n\nThe student is preparing for: "${exam.title}"`;
    if (exam.description) contextBlock += `\n${exam.description}`;
  }

  return (
    `You are an expert AI tutor helping ${user.name} prepare for their exams through a live voice conversation. ` +
    `Be concise, clear, and encouraging. Since this is spoken audio, keep responses conversational — ` +
    `avoid bullet lists or markdown. Adapt your pace and depth to what the student needs. ` +
    `Use examples and analogies freely.` +
    contextBlock
  );
}

// ─── Client → Gemini message transformer ─────────────────────────────────────

/**
 * Translate the client's spec format into the Gemini Live API wire format.
 * Returns the transformed JSON string, or the original string as a passthrough.
 *
 * Supported client types:
 *   { type: "audio", data: "<base64 PCM>" }
 *   { type: "end_of_turn" }
 */
function transformClientMessage(raw) {
  try {
    const m = JSON.parse(raw);

    if (m.type === 'audio' && m.data) {
      return JSON.stringify({
        realtime_input: {
          media_chunks: [{ mime_type: 'audio/pcm', data: m.data }],
        },
      });
    }

    if (m.type === 'end_of_turn') {
      return JSON.stringify({
        client_content: {
          turns: [{ role: 'user', parts: [{ text: '' }] }],
          turn_complete: true,
        },
      });
    }
  } catch {
    // Non-JSON — passthrough as-is
  }

  return raw;
}

// ─── WebSocket handler ────────────────────────────────────────────────────────

/**
 * Handle a single client WebSocket connection as a proxy to Gemini Live API.
 *
 * Protocol:
 *   1. Client sends first message: { type: "auth", token: "<JWT>", topicId?: "...", examId?: "..." }
 *   2. Server verifies token, loads context, opens Gemini WS, sends setup.
 *   3. Server sends { type: "ready" } once Gemini confirms setupComplete.
 *   4. Client sends { type: "audio", data: b64 } chunks and { type: "end_of_turn" }.
 *   5. Server sends back { type: "audio" }, { type: "text" }, { type: "turn_complete" }.
 *   6. On disconnect, accumulated AI text turns are saved to AiConversation.
 *
 * @param {import('ws').WebSocket} ws
 */
export function handleVoiceWS(ws) {
  /** @type {import('ws').WebSocket | null} */
  let geminiWs = null;
  let setupComplete = false;

  // Populated after successful auth
  let context = null;
  let msgCtx  = null; // { topicId, examId }

  // AI text turns accumulated during the session for DB persistence on disconnect
  const transcript = [];

  // Messages received from client before Gemini setup is complete
  const pendingFromClient = [];

  // Guard against double-cleanup (client error + close fire together)
  let cleanupCalled = false;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function sendToClient(payload) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
    }
  }

  async function cleanup() {
    if (cleanupCalled) return;
    cleanupCalled = true;

    // Persist AI text turns from this session
    if (context && transcript.length > 0) {
      try {
        await prisma.aiConversation.createMany({
          data: transcript.map((t) => ({
            userId:  context.user.id,
            topicId: msgCtx?.topicId ?? null,
            examId:  msgCtx?.examId  ?? null,
            role:    t.role,
            message: t.text,
          })),
        });
        console.log(`[VoiceWS] Saved ${transcript.length} transcript turns for user ${context.user.id}`);
      } catch (err) {
        console.error('[VoiceWS] Transcript save failed:', err.message);
      }
    }

    if (geminiWs) {
      const s = geminiWs.readyState;
      if (s === WebSocket.OPEN || s === WebSocket.CONNECTING) geminiWs.close();
      geminiWs = null;
    }
  }

  // ── Step 1: Auth ─────────────────────────────────────────────────────────────
  // .once so this handler is removed after the first message; the relay
  // handler registered inside takes over for all subsequent messages.
  ws.once('message', async (rawData) => {
    // ── Parse auth message ────────────────────────────────────────────────────
    let msg;
    try {
      msg = JSON.parse(rawData.toString());
    } catch {
      sendToClient({ type: 'error', message: 'First message must be JSON' });
      ws.close(1008, 'Bad message');
      return;
    }

    if (msg.type !== 'auth' || !msg.token) {
      sendToClient({ type: 'error', message: 'First message must be { type: "auth", token: "..." }' });
      ws.close(1008, 'Auth required');
      return;
    }

    // ── Verify JWT ────────────────────────────────────────────────────────────
    let payload;
    try {
      payload = verifyAccessToken(msg.token);
    } catch {
      sendToClient({ type: 'error', message: 'Invalid or expired token' });
      ws.close(1008, 'Unauthorized');
      return;
    }

    // ── Load DB context ───────────────────────────────────────────────────────
    try {
      context = await loadContext(
        payload.id,
        msg.topicId ?? null,
        msg.examId  ?? null,
      );
      msgCtx = { topicId: msg.topicId ?? null, examId: msg.examId ?? null };
    } catch (err) {
      console.error('[VoiceWS] Context load failed:', err.message);
      sendToClient({ type: 'error', message: 'Failed to load session context' });
      ws.close(1011, 'Server error');
      return;
    }

    // ── Guard: API key ────────────────────────────────────────────────────────
    if (!process.env.GEMINI_API_KEY) {
      sendToClient({ type: 'error', message: 'Gemini API key not configured on server' });
      ws.close(1011, 'Server error');
      return;
    }

    // ── Step 2: Open Gemini Live WS ───────────────────────────────────────────
    const geminiUrl =
      `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent` +
      `?key=${process.env.GEMINI_API_KEY}`;

    geminiWs = new WebSocket(geminiUrl);

    geminiWs.on('open', () => {
      console.log(`[VoiceWS] Gemini connected for user ${context.user.id}`);
      geminiWs.send(
        JSON.stringify({
          setup: {
            model: LIVE_MODEL,
            generationConfig: { responseModalities: ['AUDIO', 'TEXT'] },
            systemInstruction: { parts: [{ text: buildSystemPrompt(context) }] },
          },
        }),
      );
    });

    // ── Step 3: Relay Gemini → Client ─────────────────────────────────────────
    geminiWs.on('message', (data, isBinary) => {
      // Binary frames — passthrough as-is
      if (isBinary) {
        if (ws.readyState === WebSocket.OPEN) ws.send(data, { binary: true });
        return;
      }

      const text = data.toString();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Non-JSON frame — relay raw
        if (ws.readyState === WebSocket.OPEN) ws.send(text);
        return;
      }

      // Intercept setupComplete before relay starts
      if (!setupComplete) {
        if ('setupComplete' in parsed) {
          setupComplete = true;
          sendToClient({ type: 'ready' });
          // Flush any messages the client sent before we were ready
          for (const queued of pendingFromClient) {
            if (geminiWs.readyState === WebSocket.OPEN) geminiWs.send(queued);
          }
          pendingFromClient.length = 0;
        }
        // Don't relay other pre-setup frames (e.g. partial setup acks) to client
        return;
      }

      // Transform serverContent responses into spec-format messages
      if (parsed.serverContent) {
        const parts = parsed.serverContent.modelTurn?.parts ?? [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            sendToClient({ type: 'audio', data: part.inlineData.data });
          } else if (typeof part.text === 'string' && part.text) {
            transcript.push({ role: 'ASSISTANT', text: part.text });
            sendToClient({ type: 'text', data: part.text });
          }
        }
        if (parsed.serverContent.turnComplete) {
          sendToClient({ type: 'turn_complete' });
        }
        return;
      }

      // Any other Gemini message shape — relay as-is so the client can handle it
      sendToClient(parsed);
    });

    geminiWs.on('error', (err) => {
      console.error('[VoiceWS] Gemini error:', err.message);
      sendToClient({ type: 'error', message: 'Gemini connection error' });
      if (ws.readyState === WebSocket.OPEN) ws.close();
    });

    geminiWs.on('close', (code) => {
      console.log(`[VoiceWS] Gemini closed (${code})`);
      if (ws.readyState === WebSocket.OPEN) ws.close();
    });

    // ── Step 4: Relay Client → Gemini ─────────────────────────────────────────
    ws.on('message', (data, isBinary) => {
      if (!geminiWs) return;

      // Binary frames — forward raw (e.g. raw PCM without JSON wrapper)
      if (isBinary) {
        if (geminiWs.readyState === WebSocket.OPEN) geminiWs.send(data, { binary: true });
        return;
      }

      // Transform spec client format into Gemini API format, then queue or send
      const transformed = transformClientMessage(data.toString());

      if (!setupComplete) {
        pendingFromClient.push(transformed);
        return;
      }

      if (geminiWs.readyState === WebSocket.OPEN) geminiWs.send(transformed);
    });
  });

  // ── Cleanup on client disconnect ──────────────────────────────────────────
  ws.on('close', () => cleanup());
  ws.on('error', (err) => {
    console.error('[VoiceWS] Client error:', err.message);
    cleanup();
  });
}
