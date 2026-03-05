import { z } from 'zod';

export const createExamSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().min(1),
});

export const createSubjectSchema = z.object({
  examId: z.string().cuid(),
  title: z.string().min(2).max(200),
  order: z.number().int().min(0).optional(),
  icon: z.string().max(10).optional(),
});

export const createChapterSchema = z.object({
  subjectId: z.string().cuid(),
  title: z.string().min(2).max(200),
  order: z.number().int().min(0).optional(),
  description: z.string().max(1000).optional(),
});

export const createTopicSchema = z.object({
  chapterId: z.string().cuid(),
  title: z.string().min(2).max(200),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  order: z.number().int().min(0).optional(),
  estimatedMins: z.number().int().min(1).optional(),
});
