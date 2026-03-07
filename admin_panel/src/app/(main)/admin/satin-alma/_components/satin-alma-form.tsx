'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import {
  Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import {
  useCreateSatinAlmaAdminMutation,
  useUpdateSatinAlmaAdminMutation,
  useGetNextSiparisNoQuery,
} from '@/integrations/endpoints/admin/erp/satin_alma_admin.endpoints';
import { useListTedarikciAdminQuery } from '@/integrations/endpoints/admin/erp/tedarikci_admin.endpoints';
import type { SatinAlmaSiparisDto } from '@/integrations/shared/erp/satin_alma.types';

const schema = z.object({
  siparisNo:    z.string().min(1, 'Zorunlu'),
  tedarikciId:  z.string().min(1, 'Tedarikçi seçiniz'),
  siparisTarihi: z.string().min(1, 'Zorunlu'),
  terminTarihi: z.string().optional(),
  durum:        z.enum(['taslak', 'onaylandi', 'siparis_verildi', 'kismen_teslim', 'tamamlandi', 'iptal']).default('taslak'),
  aciklama:     z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  siparis: SatinAlmaSiparisDto | null;
}

export default function SatinAlmaForm({ open, onClose, siparis }: Props) {
  const { t } = useLocaleContext();
  const isEdit = !!siparis;
  const [create, createState] = useCreateSatinAlmaAdminMutation();
  const [update, updateState] = useUpdateSatinAlmaAdminMutation();
  const loading = createState.isLoading || updateState.isLoading;

  const { data: nextNoData } = useGetNextSiparisNoQuery(undefined, { skip: isEdit || !open });
  const { data: tedarikciData } = useListTedarikciAdminQuery({});
  const tedarikciler = tedarikciData?.items ?? [];

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { durum: 'taslak' },
  });

  useEffect(() => {
    if (open) {
      if (siparis) {
        reset({
          siparisNo:    siparis.siparisNo,
          tedarikciId:  siparis.tedarikciId,
          siparisTarihi: siparis.siparisTarihi,
          terminTarihi: siparis.terminTarihi ?? '',
          durum:        siparis.durum,
          aciklama:     siparis.aciklama ?? '',
        });
      } else {
        reset({
          durum: 'taslak',
          siparisTarihi: new Date().toISOString().split('T')[0],
          siparisNo: nextNoData?.siparisNo ?? '',
          tedarikciId: '',
          terminTarihi: '',
          aciklama: '',
        });
      }
    }
  }, [open, siparis, reset, nextNoData]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      terminTarihi: values.terminTarihi || undefined,
      aciklama:     values.aciklama || undefined,
    };
    try {
      if (isEdit) {
        await update({ id: siparis.id, body: payload }).unwrap();
        toast.success(t('admin.erp.common.updated', { item: t('admin.erp.satinAlma.singular') }));
      } else {
        await create({ ...payload, items: [] }).unwrap();
        toast.success(t('admin.erp.common.created', { item: t('admin.erp.satinAlma.singular') }));
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t('admin.erp.common.operationFailed2'));
    }
  }

  const durumVal = watch('durum');
  const tedarikciVal = watch('tedarikciId');

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>{isEdit ? t('admin.erp.satinAlma.editItem') : t('admin.erp.satinAlma.newItem')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t('admin.erp.satinAlma.form.siparisNo')} *</Label>
                <Input
                  {...register('siparisNo')}
                  placeholder={t('admin.erp.satinAlma.form.siparisNoPlaceholder')}
                  readOnly={!isEdit}
                  className={!isEdit ? 'bg-muted' : ''}
                />
                {errors.siparisNo && <p className="text-xs text-destructive">{errors.siparisNo.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>{t('admin.erp.satinAlma.form.durum')}</Label>
                <Select value={durumVal} onValueChange={(v) => setValue('durum', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['taslak', 'onaylandi', 'siparis_verildi', 'kismen_teslim', 'tamamlandi', 'iptal'] as const).map((d) => (
                      <SelectItem key={d} value={d}>{t(`admin.erp.satinAlma.statuses.${d}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>{t('admin.erp.satinAlma.form.tedarikci')} *</Label>
              <Select value={tedarikciVal || ''} onValueChange={(v) => setValue('tedarikciId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.erp.satinAlma.form.tedarikciPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {tedarikciler.map((td) => (
                    <SelectItem key={td.id} value={td.id}>{td.ad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tedarikciId && <p className="text-xs text-destructive">{errors.tedarikciId.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t('admin.erp.satinAlma.form.siparisTarihi')} *</Label>
                <Input type="date" {...register('siparisTarihi')} />
                {errors.siparisTarihi && <p className="text-xs text-destructive">{errors.siparisTarihi.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>{t('admin.erp.satinAlma.form.terminTarihi')}</Label>
                <Input type="date" {...register('terminTarihi')} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{t('admin.erp.satinAlma.form.aciklama')}</Label>
              <Textarea {...register('aciklama')} rows={2} placeholder={t('admin.erp.satinAlma.form.aciklamaPlaceholder')} />
            </div>
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" onClick={onClose}>{t('admin.common.cancel')}</Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('admin.erp.common.saving') : t('admin.common.save')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
