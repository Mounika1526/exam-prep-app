import { z } from 'zod';

export const createQuestionSchema = z.object({
  text: z.string().min(5),
  type: z.enum(['MCQ', 'TRUE_FALSE', 'FILL_IN_BLANK']).default('MCQ'),
  options: z.record(z.string()).optional(),
  answer: z.string().min(1),
  explanation: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  tags: z.array(z.string()).optional(),
  topicId: z.string().cuid().optional(),
  subjectId: z.string().cuid().optional(),
  examId: z.string().cuid().optional(),
});
