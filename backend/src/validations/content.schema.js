import { z } from 'zod';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Coerce "true"/"false" strings from multipart form data to booleans
const coerceBool = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((v) => v === 'true'),
]);

// ─── Exam ─────────────────────────────────────────────────────────────────────

export const createExamSchema = z.object({
  title:       z.string({ required_error: 'Title is required' }).min(2).max(200),
  description: z.string().max(1000).optional(),
  category:    z.string({ required_error: 'Category is required' }).min(1).max(100),
});

export const updateExamSchema = z
  .object({
    title:       z.string().min(2).max(200).optional(),
    description: z.string().max(1000).nullish(),
    category:    z.string().min(1).max(100).optional(),
    isActive:    coerceBool.optional(),
  })
  .strict();

// ─── Subject ──────────────────────────────────────────────────────────────────

export const createSubjectSchema = z.object({
  examId: z.string({ required_error: 'examId is required' }).cuid('Invalid exam ID'),
  title:  z.string({ required_error: 'Title is required' }).min(2).max(200),
  order:  z.number().int().min(0).optional().default(0),
  icon:   z.string().max(10).optional(),
});

export const updateSubjectSchema = z
  .object({
    title: z.string().min(2).max(200).optional(),
    order: z.number().int().min(0).optional(),
    icon:  z.string().max(10).nullish(),
  })
  .strict();

// ─── Chapter ──────────────────────────────────────────────────────────────────

export const createChapterSchema = z.object({
  subjectId:   z.string({ required_error: 'subjectId is required' }).cuid('Invalid subject ID'),
  title:       z.string({ required_error: 'Title is required' }).min(2).max(200),
  order:       z.number().int().min(0).optional().default(0),
  description: z.string().max(1000).optional(),
});

export const updateChapterSchema = z
  .object({
    title:       z.string().min(2).max(200).optional(),
    order:       z.number().int().min(0).optional(),
    description: z.string().max(1000).nullish(),
  })
  .strict();

// ─── Topic ────────────────────────────────────────────────────────────────────

// Empty string → null for optional URL fields
const nullableUrl = z
  .string()
  .url('Invalid URL')
  .optional()
  .or(z.literal(''))
  .transform((v) => v || null);

export const createTopicSchema = z.object({
  chapterId:    z.string({ required_error: 'chapterId is required' }).cuid('Invalid chapter ID'),
  title:        z.string({ required_error: 'Title is required' }).min(2).max(200),
  content:      z.string().optional(),
  resources:    z.record(z.any()).optional(),
  videoUrl:     nullableUrl,
  order:        z.number().int().min(0).optional().default(0),
  estimatedMins: z.number().int().min(1).max(480).optional(),
});

export const updateTopicSchema = z
  .object({
    title:        z.string().min(2).max(200).optional(),
    content:      z.string().nullish(),
    resources:    z.record(z.any()).nullish(),
    videoUrl:     nullableUrl,
    order:        z.number().int().min(0).optional(),
    estimatedMins: z.number().int().min(1).max(480).nullish(),
  })
  .strict();

// ─── Question ─────────────────────────────────────────────────────────────────

export const createQuestionSchema = z
  .object({
    text:        z.string({ required_error: 'Question text is required' }).min(5),
    type:        z.enum(['MCQ', 'TRUE_FALSE', 'FILL_IN_BLANK']).default('MCQ'),
    options:     z.record(z.string()).optional(),
    answer:      z.string({ required_error: 'Answer is required' }).min(1),
    explanation: z.string().optional(),
    difficulty:  z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    tags:        z.array(z.string()).optional().default([]),
    topicId:     z.string().cuid('Invalid topic ID').optional(),
    subjectId:   z.string().cuid('Invalid subject ID').optional(),
    examId:      z.string().cuid('Invalid exam ID').optional(),
  })
  .refine((d) => d.topicId || d.subjectId || d.examId, {
    message: 'At least one of topicId, subjectId, or examId is required',
  });

export const updateQuestionSchema = z
  .object({
    text:        z.string().min(5).optional(),
    type:        z.enum(['MCQ', 'TRUE_FALSE', 'FILL_IN_BLANK']).optional(),
    options:     z.record(z.string()).nullish(),
    answer:      z.string().min(1).optional(),
    explanation: z.string().nullish(),
    difficulty:  z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    tags:        z.array(z.string()).optional(),
  })
  .strict();

export const bulkQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        text:        z.string().min(5),
        type:        z.enum(['MCQ', 'TRUE_FALSE', 'FILL_IN_BLANK']).default('MCQ'),
        options:     z.record(z.string()).optional(),
        answer:      z.string().min(1),
        explanation: z.string().optional(),
        difficulty:  z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
        tags:        z.array(z.string()).optional().default([]),
        topicId:     z.string().cuid().optional(),
        subjectId:   z.string().cuid().optional(),
        examId:      z.string().cuid().optional(),
      })
    )
    .min(1, 'At least one question is required')
    .max(100, 'Maximum 100 questions per bulk operation'),
});
