import { z } from 'zod';

export const tuitionSchema = z.object({
  tuitionName: z
    .string()
    .min(3, 'Tuition name must be at least 3 characters'),
  subject: z
    .string()
    .min(1, 'Subject is required'),
  grade: z
    .string()
    .min(1, 'Grade is required'),
  batch: z
    .string()
    .min(1, 'Batch is required'),
  description: z
    .string()
    .max(300, 'Description must be at most 300 characters')
    .optional()
    .or(z.literal('')),
});
