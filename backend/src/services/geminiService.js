import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL_ID = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export function initModel() {
  return genAI.getGenerativeModel({ model: MODEL_ID });
}
export function buildSystemPrompt(context = {}) {
  const { examTitle, subjectTitle, chapterTitle, topicTitle, studentName, difficulty } = context;

  let prompt = 'You are an expert exam preparation tutor.';

  if (studentName) prompt += ` You are tutoring ${studentName}.`;

  prompt += ' Help the student understand concepts, solve problems, and prepare effectively.';
  prompt += ' Be concise, clear, and encouraging. Use examples and step-by-step explanations where helpful.';

  const lines = [];
  if (examTitle)    lines.push(`Exam: ${examTitle}`);
  if (subjectTitle) lines.push(`Subject: ${subjectTitle}`);
  if (chapterTitle) lines.push(`Chapter: ${chapterTitle}`);
  if (topicTitle)   lines.push(`Current Topic: ${topicTitle}`);
  if (difficulty)   lines.push(`Difficulty Level: ${difficulty}`);

  if (lines.length) {
    prompt += '\n\nStudy context:\n' + lines.join('\n');
  }

  return prompt;
}

export async function chat(messages, context = {}) {
  const model = initModel();
  const systemPrompt = buildSystemPrompt(context);

  // All messages except the last (which is the new user turn)
  const priorMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  const history = [
    { role: 'user',  parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: "Understood! I'm ready to help you prepare." }] },
    ...priorMessages.map((m) => ({
      role:  m.role === 'USER' ? 'user' : 'model',
      parts: [{ text: m.message }],
    })),
  ];

  const session = model.startChat({ history });
  const result  = await session.sendMessage(currentMessage.message);
  return result.response.text();
}

export async function generateQuestions(topicTitle, subject, exam, count, difficulty) {
  const model = initModel();

  const prompt = `Generate ${count} ${difficulty} multiple-choice questions about "${topicTitle}".
${subject ? `Subject: ${subject}` : ''}
${exam ? `Exam: ${exam}` : ''}

Return ONLY a JSON array, no markdown:
[
  {
    "question": "Question text",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "correctAnswer": "A",
    "explanation": "Why this answer is correct",
    "difficulty": "${difficulty}"
  }
]`;

  const result = await model.generateContent(prompt);
  const text   = result.response.text().trim().replace(/```json\n?|\n?```/g, '');

  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

export async function generateStudyPlan(examDate, hoursPerDay, subjects, weakAreas = []) {
  const model = initModel();

  const daysLeft = Math.max(
    1,
    Math.ceil((new Date(examDate) - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  const subjectNames = subjects.map(s => s.name || s).join(', ');

  const prompt = `Create a concise study plan.
- Days: ${daysLeft}, Hours/day: ${hoursPerDay}
- Subjects: ${subjectNames}
${weakAreas.length ? `- Focus areas: ${weakAreas.join(', ')}` : ''}

Return ONLY this JSON, no markdown, keep values brief:
{
  "overview": "2-sentence summary",
  "totalDays": ${daysLeft},
  "hoursPerDay": ${hoursPerDay},
  "phases": [
    {
      "name": "Phase name",
      "startDay": 1,
      "endDay": 7,
      "goal": "One sentence goal",
      "subjects": [
        { "name": "Subject", "dailyHours": 2, "chapters": ["Topic 1", "Topic 2"] }
      ]
    }
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "references": [
    { "title": "Resource name", "type": "book|website|video|article", "url": "optional URL or empty string" }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text   = result.response.text().trim().replace(/```json\n?|\n?```/g, '');

  try {
    return JSON.parse(text);
  } catch {
    return { overview: text, totalDays: daysLeft, hoursPerDay, phases: [], tips: [] };
  }
}

export async function getTrendingSuggestions(examTitle, category) {
  const model = initModel();

  const prompt = `What are the most important and trending skills, technologies, or topics \
that someone preparing for "${examTitle}" (category: ${category || 'general'}) should focus on right now?

Return ONLY a JSON array with 6–8 items, no markdown:
[
  {
    "title": "Topic or skill name",
    "description": "Why it is important and trending",
    "priority": "HIGH | MEDIUM | LOW",
    "type": "SKILL | TECHNOLOGY | CONCEPT | TOOL"
  }
]`;

  const result = await model.generateContent(prompt);
  const text   = result.response.text().trim().replace(/```json\n?|\n?```/g, '');

  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}
