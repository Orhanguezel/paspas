import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const listMakineKapaliAraliklarQuerySchema = z.object({
  makineId: z.string().uuid().optional(),
});

export const createMakineKapaliAralikSchema = z
  .object({
    makineId: z.string().uuid(),
    baslangicTarih: dateOnly,
    bitisTarih: dateOnly,
    aciklama: z.string().trim().max(255).optional().nullable(),
  })
  .refine((value) => value.baslangicTarih <= value.bitisTarih, {
    message: 'bitis_tarihi_baslangictan_once_olamaz',
    path: ['bitisTarih'],
  });

export const patchMakineKapaliAralikSchema = z
  .object({
    makineId: z.string().uuid().optional(),
    baslangicTarih: dateOnly.optional(),
    bitisTarih: dateOnly.optional(),
    aciklama: z.string().trim().max(255).optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'bos_guncelleme' })
  .refine(
    (value) =>
      value.baslangicTarih === undefined ||
      value.bitisTarih === undefined ||
      value.baslangicTarih <= value.bitisTarih,
    {
      message: 'bitis_tarihi_baslangictan_once_olamaz',
      path: ['bitisTarih'],
    },
  );

export type ListMakineKapaliAraliklarQuery = z.infer<typeof listMakineKapaliAraliklarQuerySchema>;
export type CreateMakineKapaliAralikBody = z.infer<typeof createMakineKapaliAralikSchema>;
export type PatchMakineKapaliAralikBody = z.infer<typeof patchMakineKapaliAralikSchema>;
