import { z } from 'zod';

export const trendQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(180).default(30),
});

export type TrendQuery = z.infer<typeof trendQuerySchema>;
