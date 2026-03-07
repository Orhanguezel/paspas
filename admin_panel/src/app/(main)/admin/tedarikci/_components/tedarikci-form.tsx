'use client';

// =============================================================
// FILE: src/app/(main)/admin/tedarikci/_components/tedarikci-form.tsx
// Paspas ERP — Tedarikçi oluştur / düzenle formu
// =============================================================

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';

import {
  useCreateTedarikciAdminMutation,
  useUpdateTedarikciAdminMutation,
} from '@/integrations/endpoints/admin/erp/tedarikci_admin.endpoints';
import type { TedarikciDto } from '@/integrations/shared/erp/tedarikci.types';

const schema = z.object({
  kod:      z.string().min(1, 'Kod zorunlu'),
  ad:       z.string().min(1, 'Ad zorunlu'),
  ilgiliKisi: z.string().optional(),
  telefon:  z.string().optional(),
  email:    z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
  adres:    z.string().optional(),
  iskonto:  z.preprocess(
    (v) => (v === '' || v == null ? 0 : Number(v)),
    z.number().min(0).max(100).default(0),
  ),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface TedarikciFormProps {
  open: boolean;
  onClose: () => void;
  tedarikci?: TedarikciDto | null;
}

export default function TedarikciForm({ open, onClose, tedarikci }: TedarikciFormProps) {
  const { t } = useLocaleContext();
  const isEdit = !!tedarikci;
  const [create, createState] = useCreateTedarikciAdminMutation();
  const [update, updateState] = useUpdateTedarikciAdminMutation();
  const busy = createState.isLoading || updateState.isLoading;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { kod: '', ad: '', ilgiliKisi: '', telefon: '', email: '', adres: '', iskonto: 0, isActive: true },
  });

  useEffect(() => {
    if (open) {
      if (tedarikci) {
        reset({
          kod:      tedarikci.kod,
          ad:       tedarikci.ad,
          ilgiliKisi: tedarikci.ilgiliKisi ?? '',
          telefon:  tedarikci.telefon ?? '',
          email:    tedarikci.email ?? '',
          adres:    tedarikci.adres ?? '',
          iskonto:  tedarikci.iskonto,
          isActive: tedarikci.isActive,
        });
      } else {
        reset({ kod: '', ad: '', ilgiliKisi: '', telefon: '', email: '', adres: '', iskonto: 0, isActive: true });
      }
    }
  }, [tedarikci, open, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      ilgiliKisi: values.ilgiliKisi?.trim() || undefined,
      telefon: values.telefon?.trim() || undefined,
      email: values.email?.trim() || undefined,
      adres: values.adres?.trim() || undefined,
    };

    try {
      if (isEdit && tedarikci) {
        await update({ id: tedarikci.id, body: payload }).unwrap();
        toast.success(t('admin.erp.common.updated', { item: t('admin.erp.tedarikci.singular') }));
      } else {
        await create(payload).unwrap();
        toast.success(t('admin.erp.common.created', { item: t('admin.erp.tedarikci.singular') }));
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t('admin.erp.common.operationFailed'));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>{isEdit ? t('admin.erp.tedarikci.editItem') : t('admin.erp.tedarikci.newItem')}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="space-y-1">
              <Label>{t('admin.erp.tedarikci.form.kod')} *</Label>
              <Input {...register('kod')} placeholder={t('admin.erp.tedarikci.form.kodPlaceholder')} />
              {errors.kod && (
                <p className="text-xs text-destructive">{errors.kod.message}</p>
              )}
            </div>

            {/* Ad */}
            <div className="space-y-1">
              <Label>{t('admin.erp.tedarikci.form.ad')} *</Label>
              <Input {...register('ad')} placeholder={t('admin.erp.tedarikci.form.adPlaceholder')} />
              {errors.ad && (
                <p className="text-xs text-destructive">{errors.ad.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>{t('admin.erp.tedarikci.form.ilgiliKisi')}</Label>
              <Input {...register('ilgiliKisi')} placeholder={t('admin.erp.tedarikci.form.ilgiliKisiPlaceholder')} />
            </div>

            {/* Telefon */}
            <div className="space-y-1">
              <Label>{t('admin.erp.tedarikci.form.telefon')}</Label>
              <Input {...register('telefon')} placeholder={t('admin.erp.tedarikci.form.telefonPlaceholder')} />
            </div>

            <div className="space-y-1">
              <Label>{t('admin.erp.tedarikci.form.email')}</Label>
              <Input {...register('email')} placeholder={t('admin.erp.tedarikci.form.emailPlaceholder')} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Adres */}
            <div className="space-y-1">
              <Label>{t('admin.erp.tedarikci.form.adres')}</Label>
              <Input {...register('adres')} placeholder={t('admin.erp.tedarikci.form.adresPlaceholder')} />
            </div>

            {/* İskonto */}
            <div className="space-y-1">
              <Label>{t('admin.erp.tedarikci.form.iskonto')}</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                {...register('iskonto')}
                placeholder={t('admin.erp.tedarikci.form.iskontoPlaceholder')}
              />
            </div>

            {/* Aktif */}
            <div className="flex items-center gap-3">
              <Switch
                checked={watch('isActive')}
                onCheckedChange={(v) => setValue('isActive', v)}
              />
              <Label>{t('admin.erp.tedarikci.form.aktif')}</Label>
            </div>
          </div>

          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              {t('admin.common.cancel')}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t('admin.erp.common.saving') : t('admin.common.save')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
