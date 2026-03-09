import { z } from 'zod';

export const joinSchema = z.object({
  joinCode: z
    .string()
    .min(1, 'Join code is required')
    .length(6, 'Join code must be 6 characters'),
});
