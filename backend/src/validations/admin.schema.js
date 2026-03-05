import { z } from 'zod';

export const updateUserSchema = z
  .object({
    role:     z.enum(['ADMIN', 'STUDENT']).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((d) => d.role !== undefined || d.isActive !== undefined, {
    message: 'Provide at least one field: role or isActive',
  });
