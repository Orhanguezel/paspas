'use client';

// =============================================================
// FILE: src/app/(main)/admin/musteriler/_components/musteri-form.tsx
// Paspas ERP — Müşteri oluştur / düzenle formu
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
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import {
  useCreateMusteriAdminMutation,
  useUpdateMusteriAdminMutation,
} from '@/integrations/endpoints/admin/erp/musteriler_admin.endpoints';
import type { MusteriDto } from '@/integrations/shared/erp/musteriler.types';

const schema = z.object({
  tur:      z.enum(['musteri', 'tedarikci']).default('musteri'),
  kod:      z.string().min(1, 'Kod zorunlu').optional(),
  ad:       z.string().min(1, 'Ad zorunlu'),
  ilgiliKisi: z.string().optional(),
  telefon:  z.string().optional(),
  email:    z.string().email('Gecerli e-posta girin').optional().or(z.literal('')),
  adres:    z.string().optional(),
  cariKodu: z.string().optional(),
  sevkiyatNotu: z.string().optional(),
  iskonto:  z.preprocess(
    (v) => (v === '' || v == null ? 0 : Number(v)),
    z.number().min(0).max(100).default(0),
  ),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface MusteriFormProps {
  open: boolean;
  onClose: () => void;
  musteri?: MusteriDto | null;
}

export default function MusteriForm({ open, onClose, musteri }: MusteriFormProps) {
  const { t } = useLocaleContext();
  const isEdit = !!musteri;
  const [create, createState] = useCreateMusteriAdminMutation();
  const [update, updateState] = useUpdateMusteriAdminMutation();
  const busy = createState.isLoading || updateState.isLoading;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tur: 'musteri', kod: '', ad: '', ilgiliKisi: '', telefon: '', email: '', adres: '', cariKodu: '', sevkiyatNotu: '', iskonto: 0, isActive: true },
  });

  useEffect(() => {
    if (musteri) {
      form.reset({
        tur:      musteri.tur,
        kod:      musteri.kod,
        ad:       musteri.ad,
        ilgiliKisi: musteri.ilgiliKisi ?? '',
        telefon:  musteri.telefon ?? '',
        email:    musteri.email ?? '',
        adres:    musteri.adres ?? '',
        cariKodu: musteri.cariKodu ?? '',
        sevkiyatNotu: musteri.sevkiyatNotu ?? '',
        iskonto:  musteri.iskonto,
        isActive: musteri.isActive,
      });
    } else {
      form.reset({ tur: 'musteri', kod: '', ad: '', ilgiliKisi: '', telefon: '', email: '', adres: '', cariKodu: '', sevkiyatNotu: '', iskonto: 0, isActive: true });
    }
  }, [musteri, open]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      kod: values.kod?.trim() || undefined,
      ilgiliKisi: values.ilgiliKisi?.trim() || undefined,
      telefon: values.telefon?.trim() || undefined,
      email: values.email?.trim() || undefined,
      adres: values.adres?.trim() || undefined,
      cariKodu: values.cariKodu?.trim() || undefined,
      sevkiyatNotu: values.sevkiyatNotu?.trim() || undefined,
    };
    try {
      if (isEdit && musteri) {
        await update({ id: musteri.id, body: payload }).unwrap();
        toast.success(t('admin.erp.common.updated', { item: t('admin.erp.musteriler.singular') }));
      } else {
        await create(payload).unwrap();
        toast.success(t('admin.erp.common.created', { item: t('admin.erp.musteriler.singular') }));
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t('admin.erp.common.operationFailed'));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? t('admin.erp.musteriler.editItem') : t('admin.erp.musteriler.newItem')}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Tür */}
          <div className="space-y-1">
            <Label>{t('admin.erp.musteriler.form.tur')}</Label>
            <Select
              value={form.watch('tur')}
              onValueChange={(v) => form.setValue('tur', v as 'musteri' | 'tedarikci')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="musteri">{t('admin.erp.musteriler.form.turMusteri')}</SelectItem>
                <SelectItem value="tedarikci">{t('admin.erp.musteriler.form.turTedarikci')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t('admin.erp.musteriler.form.kod')}</Label>
              <Input {...form.register('kod')} placeholder={t('admin.erp.musteriler.form.kodPlaceholder')} />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.musteriler.form.ad')} *</Label>
              <Input {...form.register('ad')} placeholder={t('admin.erp.musteriler.form.adPlaceholder')} />
              {form.formState.errors.ad && (
                <p className="text-xs text-destructive">{form.formState.errors.ad.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t('admin.erp.musteriler.form.ilgiliKisi')}</Label>
              <Input {...form.register('ilgiliKisi')} placeholder={t('admin.erp.musteriler.form.ilgiliKisiPlaceholder')} />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.musteriler.form.email')}</Label>
              <Input {...form.register('email')} placeholder={t('admin.erp.musteriler.form.emailPlaceholder')} />
            </div>
          </div>

          {/* Telefon */}
          <div className="space-y-1">
            <Label>{t('admin.erp.musteriler.form.telefon')}</Label>
            <Input {...form.register('telefon')} placeholder={t('admin.erp.musteriler.form.telefonPlaceholder')} />
          </div>

          {/* Adres */}
          <div className="space-y-1">
            <Label>{t('admin.erp.musteriler.form.adres')}</Label>
            <Input {...form.register('adres')} placeholder={t('admin.erp.musteriler.form.adresPlaceholder')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t('admin.erp.musteriler.form.cariKodu')}</Label>
              <Input {...form.register('cariKodu')} placeholder={t('admin.erp.musteriler.form.cariKoduPlaceholder')} />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.musteriler.form.sevkiyatNotu')}</Label>
              <Textarea
                {...form.register('sevkiyatNotu')}
                rows={3}
                placeholder={t('admin.erp.musteriler.form.sevkiyatNotuPlaceholder')}
              />
            </div>
          </div>

          {/* İskonto */}
          <div className="space-y-1">
            <Label>{t('admin.erp.musteriler.form.iskonto')}</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              {...form.register('iskonto')}
              placeholder={t('admin.erp.musteriler.form.iskontoPlaceholder')}
            />
          </div>

          {/* Aktif */}
          <div className="flex items-center gap-3">
            <Switch
              checked={form.watch('isActive')}
              onCheckedChange={(v) => form.setValue('isActive', v)}
            />
            <Label>{t('admin.erp.musteriler.form.aktif')}</Label>
          </div>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              {t('admin.common.cancel')}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t('admin.erp.common.saving') : isEdit ? t('admin.common.save') : t('admin.common.save')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
