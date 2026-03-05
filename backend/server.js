import 'dotenv/config';
import http from 'http';
import { WebSocketServer } from 'ws';
import app from './src/app.js';
import { handleInterviewWS } from './src/services/ai.service.js';
import { handleVoiceWS } from './src/services/geminiLiveService.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server from Express app
const server = http.createServer(app);

// ─── WebSocket: Text Interview ───────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws/interview' });

wss.on('connection', (ws, req) => {
  console.log('[WS] New interview connection');
  handleInterviewWS(ws, req);

  ws.on('close', () => console.log('[WS] Interview connection closed'));
  ws.on('error', (err) => console.error('[WS] Error:', err.message));
});

// ─── WebSocket: Gemini Live Voice ─────────────────────────────────────────────
const voiceWss = new WebSocketServer({ server, path: '/ws/ai-voice' });

voiceWss.on('connection', (ws) => {
  console.log('[VoiceWS] New voice connection');
  handleVoiceWS(ws);

  ws.on('close', () => console.log('[VoiceWS] Voice connection closed'));
  ws.on('error', (err) => console.error('[VoiceWS] Error:', err.message));
});

// ─── Start ───────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket (interview) on ws://localhost:${PORT}/ws/interview`);
  console.log(`🎙️  WebSocket (voice)    on ws://localhost:${PORT}/ws/ai-voice`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}\n`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
