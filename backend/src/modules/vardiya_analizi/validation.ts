import { z } from 'zod';

export const listQuerySchema = z.object({
  tarih: z.string().date().optional(),
  baslangicTarih: z.string().date().optional(),
  bitisTarih: z.string().date().optional(),
  makineId: z.string().trim().max(36).optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export const detayQuerySchema = z.object({
  vardiyaKayitId: z.string().trim().max(36).optional(),
  makineId: z.string().trim().max(36).optional(),
  tarih: z.string().date().optional(),
});

export type DetayQuery = z.infer<typeof detayQuerySchema>;

export const trendQuerySchema = z.object({
  gunSayisi: z.coerce.number().int().min(1).max(90).default(7),
  makineId: z.string().trim().max(36).optional(),
});

export type TrendQuery = z.infer<typeof trendQuerySchema>;
