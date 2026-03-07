'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  useCreateVardiyaAdminMutation,
  useUpdateVardiyaAdminMutation,
} from '@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints';
import type { VardiyaDto } from '@/integrations/shared/erp/tanimlar.types';

const schema = z.object({
  ad:             z.string().trim().min(1, 'Zorunlu').max(100),
  baslangicSaati: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM formatında giriniz'),
  bitisSaati:     z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM formatında giriniz'),
  aciklama:       z.string().optional(),
  isActive:       z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface Props { open: boolean; onClose: () => void; vardiya: VardiyaDto | null; }

export default function VardiyaForm({ open, onClose, vardiya }: Props) {
  const isEdit = !!vardiya;
  const [create, createState] = useCreateVardiyaAdminMutation();
  const [update, updateState] = useUpdateVardiyaAdminMutation();
  const loading = createState.isLoading || updateState.isLoading;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const isActive = watch('isActive');

  useEffect(() => {
    if (open) {
      reset(vardiya
        ? {
            ad:             vardiya.ad,
            baslangicSaati: vardiya.baslangicSaati,
            bitisSaati:     vardiya.bitisSaati,
            aciklama:       vardiya.aciklama ?? '',
            isActive:       vardiya.isActive,
          }
        : {
            ad:             '',
            baslangicSaati: '07:30',
            bitisSaati:     '19:30',
            aciklama:       '',
            isActive:       true,
          });
    }
  }, [open, vardiya, reset]);

  async function onSubmit(values: FormValues) {
    const payload = { ...values, aciklama: values.aciklama || undefined };
    try {
      if (isEdit) {
        await update({ id: vardiya.id, body: payload }).unwrap();
        toast.success('Vardiya güncellendi');
      } else {
        await create(payload).unwrap();
        toast.success('Vardiya eklendi');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? 'İşlem başarısız');
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>{isEdit ? 'Vardiyayı Düzenle' : 'Yeni Vardiya'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="space-y-1">
              <Label>Ad *</Label>
              <Input {...register('ad')} placeholder="örn. Gündüz Vardiyası" />
              {errors.ad && <p className="text-xs text-destructive">{errors.ad.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Başlangıç Saati *</Label>
                <Input type="time" {...register('baslangicSaati')} />
                {errors.baslangicSaati && <p className="text-xs text-destructive">{errors.baslangicSaati.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Bitiş Saati *</Label>
                <Input type="time" {...register('bitisSaati')} />
                {errors.bitisSaati && <p className="text-xs text-destructive">{errors.bitisSaati.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Açıklama</Label>
              <Textarea {...register('aciklama')} rows={2} placeholder="İsteğe bağlı açıklama" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={isActive}
                onCheckedChange={(v) => setValue('isActive', v === true)}
              />
              <span className="text-sm">Aktif</span>
            </label>
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
