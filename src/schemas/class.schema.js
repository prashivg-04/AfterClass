import { z } from 'zod';

export const classSchema = z.object({
  className: z
    .string()
    .min(1, 'Class title is required')
    .min(3, 'Class title must be at least 3 characters'),
  topics: z
    .array(z.string())
    .min(1, 'At least one topic is required'),
  classDate: z
    .string()
    .min(1, 'Date is required'),
  summary: z
    .string()
    .max(500, 'Summary must be at most 500 characters')
    .optional()
    .or(z.literal('')),
});
