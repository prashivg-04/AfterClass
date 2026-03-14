import { z } from 'zod';

export const doubtSchema = z.object({
  question: z
    .string()
    .min(1, 'Question is required')
    .min(10, 'Question must be at least 10 characters')
    .max(1000, 'Question must be at most 1000 characters'),
});

export const replySchema = z.object({
  teacher_reply: z
    .string()
    .min(1, 'Reply is required')
    .min(5, 'Reply must be at least 5 characters')
    .max(2000, 'Reply must be at most 2000 characters'),
});