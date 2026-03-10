import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

function getModel() {
  return genAI.getGenerativeModel({ model: MODEL });
}

/**
 * Generate a tutor AI response.
 * @param {string} userMessage
 * @param {Array<{role: string, message: string}>} history
 * @param {string} context - topic content for grounding
 */
export async function generateAiResponse(userMessage, history = [], context = '') {
  const model = getModel();

  const systemPrompt = `You are an expert exam preparation tutor. You help students understand concepts,
solve problems, and prepare for exams. Be concise, clear, and encouraging.
${context ? `\n\nContext for this session:\n${context}` : ''}`;

  // Build chat history for Gemini
  const chatHistory = history.map((h) => ({
    role: h.role === 'USER' ? 'user' : 'model',
    parts: [{ text: h.message }],
  }));

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood! I\'m ready to help with exam preparation.' }] },
      ...chatHistory,
    ],
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

/**
 * Generate a personalized study plan.
 */
export async function generateStudyPlanAi(exam, examDate, hoursPerDay) {
  const model = getModel();

  const subjects = exam.subjects.map((s) => ({
    name: s.title,
    chapters: s.chapters.map((c) => ({
      name: c.title,
      topics: c._count.topics,
    })),
  }));

  const daysLeft = Math.ceil((new Date(examDate) - Date.now()) / (1000 * 60 * 60 * 24));

  const prompt = `Create a structured study plan for the ${exam.title} exam.

Details:
- Days until exam: ${daysLeft}
- Available hours per day: ${hoursPerDay}
- Total study hours available: ${daysLeft * hoursPerDay}

Subjects and chapters:
${JSON.stringify(subjects, null, 2)}

Return a JSON object with this structure:
{
  "overview": "Brief plan summary",
  "totalDays": ${daysLeft},
  "hoursPerDay": ${hoursPerDay},
  "phases": [
    {
      "name": "Phase name",
      "startDay": 1,
      "endDay": 10,
      "goal": "Phase objective",
      "subjects": [
        {
          "name": "Subject name",
          "dailyHours": 2,
          "chapters": ["Chapter 1", "Chapter 2"],
          "techniques": ["Active recall", "Practice problems"]
        }
      ]
    }
  ],
  "dailySchedule": {
    "morning": "What to study in morning",
    "afternoon": "What to study in afternoon",
    "evening": "Review and practice"
  },
  "weeklyMilestones": [
    { "week": 1, "goal": "Complete Phase 1 topics" }
  ],
  "tips": ["Tip 1", "Tip 2"]
}

Respond with ONLY the JSON object, no markdown.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
  } catch {
    return { overview: text, phases: [], tips: [] };
  }
}

/**
 * Generate practice questions for a topic.
 */
export async function generateQuestionsAi(topic, count, difficulty, type) {
  const model = getModel();

  const prompt = `Generate ${count} ${difficulty} ${type} questions about the topic: "${topic.title}".

Topic content:
${topic.content || topic.title}

Return a JSON array with this structure:
[
  {
    "question": "Question text",
    "type": "${type}",
    "options": ${type === 'MCQ' ? '{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}' : 'null'},
    "answer": "${type === 'MCQ' ? 'A' : type === 'TRUE_FALSE' ? 'True' : 'answer text'}",
    "explanation": "Why this is correct",
    "difficulty": "${difficulty}"
  }
]

Respond with ONLY the JSON array, no markdown.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
  } catch {
    return [];
  }
}

/**
 * Generate study suggestions based on weak areas.
 */
export async function generateSuggestionsAi(weakTopics, examId) {
  const model = getModel();

  const topicList = weakTopics.map((p) => p.topic.title).join(', ');

  const prompt = `A student is struggling with these topics: ${topicList || 'general exam concepts'}.

Generate 5 actionable study suggestions.

Return a JSON array:
[
  {
    "title": "Suggestion title",
    "description": "Detailed advice",
    "priority": "HIGH|MEDIUM|LOW",
    "estimatedTime": "e.g., 2 hours",
    "type": "REVIEW|PRACTICE|CONCEPT"
  }
]

Respond with ONLY the JSON array.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
  } catch {
    return [];
  }
}

/**
 * Handle WebSocket Live Interview session.
 * @param {import('ws').WebSocket} ws
 * @param {import('http').IncomingMessage} req
 */
export function handleInterviewWS(ws, req) {
  const model = getModel();
  let chat = null;

  const genericGreeting = "Hello! I'm your AI interviewer. What role or exam are you preparing for today?";
  const genericPrompt = `You are an expert technical interviewer conducting a mock interview.
Ask questions, evaluate answers, provide feedback, and guide the candidate.
Be professional, fair, and constructive.`;

  const initGeneric = () => {
    chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: genericPrompt }] },
        { role: 'model', parts: [{ text: genericGreeting }] },
      ],
    });
  };

  const initWithContext = (context = {}) => {
    const { name, targetExam, avgScore, completedTopics, weakTopics } = context;
    const firstName = name ? name.split(' ')[0] : null;

    const personalizedPrompt = `You are an expert technical interviewer conducting a mock interview.
${name ? `The candidate's name is ${name}.` : ''}
${targetExam ? `They are preparing for: ${targetExam}.` : ''}
${avgScore != null ? `Their average test score is ${avgScore}%. ${avgScore < 50 ? 'They need improvement in core concepts.' : avgScore < 70 ? 'They have moderate understanding.' : 'They have a strong foundation.'}` : ''}
${completedTopics ? `They have completed ${completedTopics} study topics.` : ''}
${weakTopics?.length ? `Weak areas to focus interview questions on: ${weakTopics.join(', ')}.` : ''}
Ask targeted questions based on their exam and weak areas. Evaluate each answer with specific feedback before moving on.`;

    const greeting = `Hello${firstName ? ` ${firstName}` : ''}! I'm your AI interviewer.${
      targetExam ? ` I can see you're preparing for ${targetExam}.` : ''
    }${weakTopics?.length ? ` We'll pay special attention to ${weakTopics.slice(0, 2).join(' and ')}.` : ''} Are you ready to begin?`;

    chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: personalizedPrompt }] },
        { role: 'model', parts: [{ text: greeting }] },
      ],
    });

    return greeting;
  };

  ws.on('message', async (data) => {
    try {
      const { type, message, context } = JSON.parse(data.toString());

      if (type === 'start') {
        const greeting = initWithContext(context || {});
        ws.send(JSON.stringify({ type: 'greeting', message: greeting }));
        return;
      }

      if (type === 'reset') {
        initGeneric();
        ws.send(JSON.stringify({ type: 'greeting', message: genericGreeting }));
        return;
      }

      if (type === 'message' && message) {
        if (!chat) initGeneric();
        const result = await chat.sendMessage(message);
        const response = result.response.text();
        ws.send(JSON.stringify({ type: 'response', message: response }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: 'AI error: ' + err.message }));
    }
  });
}
