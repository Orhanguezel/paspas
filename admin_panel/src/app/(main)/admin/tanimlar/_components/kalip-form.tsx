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
import { Switch } from '@/components/ui/switch';

import {
  useCreateKalipAdminMutation,
  useUpdateKalipAdminMutation,
} from '@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints';
import type { KalipDto } from '@/integrations/shared/erp/tanimlar.types';

const schema = z.object({
  kod:      z.string().min(1, 'Zorunlu'),
  ad:       z.string().min(1, 'Zorunlu'),
  aciklama: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface Props { open: boolean; onClose: () => void; kalip: KalipDto | null; }

export default function KalipForm({ open, onClose, kalip }: Props) {
  const { t } = useLocaleContext();
  const isEdit = !!kalip;
  const [create, createState] = useCreateKalipAdminMutation();
  const [update, updateState] = useUpdateKalipAdminMutation();
  const loading = createState.isLoading || updateState.isLoading;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });

  useEffect(() => {
    if (open) {
      reset(kalip
        ? { kod: kalip.kod, ad: kalip.ad, aciklama: kalip.aciklama ?? '', isActive: kalip.isActive }
        : { isActive: true });
    }
  }, [open, kalip, reset]);

  async function onSubmit(values: FormValues) {
    const payload = { ...values, aciklama: values.aciklama || undefined };
    try {
      if (isEdit) {
        await update({ id: kalip.id, body: payload }).unwrap();
        toast.success(t('admin.erp.common.updated', { item: t('admin.erp.tanimlar.kaliplar.singular') }));
      } else {
        await create(payload).unwrap();
        toast.success(t('admin.erp.common.created', { item: t('admin.erp.tanimlar.kaliplar.singular') }));
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t('admin.erp.common.operationFailed2'));
    }
  }

  const isActiveVal = watch('isActive');

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>{isEdit ? t('admin.erp.tanimlar.kaliplar.editItem') : t('admin.erp.tanimlar.kaliplar.newItem')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('admin.erp.tanimlar.kaliplar.form.kod')} *</Label>
              <Input {...register('kod')} placeholder={t('admin.erp.tanimlar.kaliplar.form.kodPlaceholder')} />
              {errors.kod && <p className="text-xs text-destructive">{errors.kod.message}</p>}
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch checked={isActiveVal} onCheckedChange={(v) => setValue('isActive', v)} />
              <Label>{t('admin.erp.tanimlar.kaliplar.form.aktif')}</Label>
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('admin.erp.tanimlar.kaliplar.form.ad')} *</Label>
            <Input {...register('ad')} />
            {errors.ad && <p className="text-xs text-destructive">{errors.ad.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>{t('admin.erp.tanimlar.kaliplar.form.aciklama')}</Label>
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
