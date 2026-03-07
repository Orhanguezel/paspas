'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  useCreateTatilAdminMutation,
  useUpdateTatilAdminMutation,
} from '@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints';
import type { TatilDto } from '@/integrations/shared/erp/tanimlar.types';

const schema = z.object({
  ad:       z.string().min(1, 'Zorunlu'),
  tarih:    z.string().min(1, 'Zorunlu'),
  baslangicSaati: z.string().min(1, 'Zorunlu'),
  bitisSaati: z.string().min(1, 'Zorunlu'),
  aciklama: z.string().optional(),
}).refine((value) => value.baslangicSaati < value.bitisSaati, {
  message: 'Bitiş, başlangıçtan sonra olmalı',
  path: ['bitisSaati'],
});

type FormValues = z.infer<typeof schema>;

interface Props { open: boolean; onClose: () => void; tatil: TatilDto | null; }

function toDateInputValue(value: string | null | undefined) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export default function TatilForm({ open, onClose, tatil }: Props) {
  const { t } = useLocaleContext();
  const isEdit = !!tatil;
  const [create, createState] = useCreateTatilAdminMutation();
  const [update, updateState] = useUpdateTatilAdminMutation();
  const loading = createState.isLoading || updateState.isLoading;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset(tatil
        ? {
            ad: tatil.ad,
            tarih: toDateInputValue(tatil.tarih),
            baslangicSaati: tatil.baslangicSaati,
            bitisSaati: tatil.bitisSaati,
            aciklama: tatil.aciklama ?? '',
          }
        : {
            ad: '',
            tarih: '',
            baslangicSaati: '08:00',
            bitisSaati: '18:00',
            aciklama: '',
          });
    }
  }, [open, tatil, reset]);

  async function onSubmit(values: FormValues) {
    const payload = { ...values, aciklama: values.aciklama || undefined };
    try {
      if (isEdit) {
        await update({ id: tatil.id, body: payload }).unwrap();
        toast.success(t('admin.erp.common.updated', { item: t('admin.erp.tanimlar.tatiller.singular') }));
      } else {
        await create(payload).unwrap();
        toast.success(t('admin.erp.common.created', { item: t('admin.erp.tanimlar.tatiller.singular') }));
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t('admin.erp.common.operationFailed2'));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>{isEdit ? t('admin.erp.tanimlar.tatiller.editItem') : t('admin.erp.tanimlar.tatiller.newItem')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="space-y-1">
            <Label>{t('admin.erp.tanimlar.tatiller.form.ad')} *</Label>
            <Input {...register('ad')} placeholder={t('admin.erp.tanimlar.tatiller.form.adPlaceholder')} />
            {errors.ad && <p className="text-xs text-destructive">{errors.ad.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>{t('admin.erp.tanimlar.tatiller.form.tarih')} *</Label>
            <Input type="date" {...register('tarih')} />
            {errors.tarih && <p className="text-xs text-destructive">{errors.tarih.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('admin.erp.tanimlar.tatiller.form.baslangicSaati')} *</Label>
              <Input type="time" {...register('baslangicSaati')} />
              {errors.baslangicSaati && <p className="text-xs text-destructive">{errors.baslangicSaati.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.tanimlar.tatiller.form.bitisSaati')} *</Label>
              <Input type="time" {...register('bitisSaati')} />
              {errors.bitisSaati && <p className="text-xs text-destructive">{errors.bitisSaati.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('admin.erp.tanimlar.tatiller.form.aciklama')}</Label>
            <Textarea {...register('aciklama')} rows={2} />
          </div>
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" onClick={onClose}>{t('admin.common.cancel')}</Button>
            <Button type="submit" disabled={loading}>{loading ? t('admin.erp.common.saving') : isEdit ? t('admin.common.save') : t('admin.common.save')}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
