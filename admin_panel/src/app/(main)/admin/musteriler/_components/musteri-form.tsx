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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  useCreateMusteriAdminMutation,
  useUpdateMusteriAdminMutation,
  useGetNextMusteriKodAdminQuery,
} from '@/integrations/endpoints/admin/erp/musteriler_admin.endpoints';
import type { MusteriDto } from '@/integrations/shared/erp/musteriler.types';

const schema = z.object({
  tur:      z.enum(['musteri', 'tedarikci']).default('musteri'),
  kod:      z.string().min(1, 'kodRequired').optional(),
  ad:       z.string().min(1, 'adRequired'),
  ilgiliKisi: z.string().optional(),
  telefon:  z.string().optional(),
  email:    z.string().email('invalidEmail').optional().or(z.literal('')),
  adres:    z.string().optional(),
  cariKodu: z.string().optional(),
  sevkiyatNotu: z.string().optional(),
  websiteUrl: z.string().url('invalidUrl').optional().or(z.literal('')),
  googleMapsUrl: z.string().url('invalidUrl').optional().or(z.literal('')),
  instagramUrl: z.string().url('invalidUrl').optional().or(z.literal('')),
  facebookUrl: z.string().url('invalidUrl').optional().or(z.literal('')),
  bayiSegment: z.enum(['toptanci', 'otomotiv', 'kucuk_bayi', 'ihracat', 'kurumsal', 'diger']).optional().or(z.literal('')),
  krediLimit: z.preprocess((v) => (v === '' || v == null ? 0 : Number(v)), z.number().min(0).default(0)),
  mevcutBakiye: z.preprocess((v) => (v === '' || v == null ? 0 : Number(v)), z.number().default(0)),
  vadeGunu: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().int().min(0).max(365).optional()),
  portalEnabled: z.boolean().default(false),
  portalStatus: z.enum(['not_invited', 'invited', 'active', 'suspended']).default('not_invited'),
  publicVeriIzni: z.boolean().default(false),
  iskonto:  z.preprocess(
    (v) => (v === '' || v == null ? 0 : Number(v)),
    z.number().min(0).max(100).default(0),
  ),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

const emptyDefaults: FormValues = {
  tur: 'musteri',
  kod: '',
  ad: '',
  ilgiliKisi: '',
  telefon: '',
  email: '',
  adres: '',
  cariKodu: '',
  sevkiyatNotu: '',
  websiteUrl: '',
  googleMapsUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  bayiSegment: '',
  krediLimit: 0,
  mevcutBakiye: 0,
  vadeGunu: undefined,
  portalEnabled: false,
  portalStatus: 'not_invited',
  publicVeriIzni: false,
  iskonto: 0,
  isActive: true,
};

interface MusteriFormProps {
  open: boolean;
  onClose: () => void;
  musteri?: MusteriDto | null;
}

export default function MusteriForm({ open, onClose, musteri }: MusteriFormProps) {
  const { t } = useLocaleContext();
  const tValidation = (key: string) => t(`admin.erp.musteriler.validation.${key}`);
  const isEdit = !!musteri;
  const [create, createState] = useCreateMusteriAdminMutation();
  const [update, updateState] = useUpdateMusteriAdminMutation();
  const busy = createState.isLoading || updateState.isLoading;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyDefaults,
  });

  const watchTur = form.watch('tur');
  const { data: nextKodData } = useGetNextMusteriKodAdminQuery(
    { tur: watchTur },
    { skip: isEdit },
  );

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
        websiteUrl: musteri.websiteUrl ?? '',
        googleMapsUrl: musteri.googleMapsUrl ?? '',
        instagramUrl: musteri.instagramUrl ?? '',
        facebookUrl: musteri.facebookUrl ?? '',
        bayiSegment: musteri.bayiSegment ?? '',
        krediLimit: musteri.krediLimit,
        mevcutBakiye: musteri.mevcutBakiye,
        vadeGunu: musteri.vadeGunu ?? undefined,
        portalEnabled: musteri.portalEnabled,
        portalStatus: musteri.portalStatus,
        publicVeriIzni: musteri.publicVeriIzni,
        iskonto:  musteri.iskonto,
        isActive: musteri.isActive,
      });
    } else {
      form.reset(emptyDefaults);
    }
  }, [musteri, open]);

  // Yeni eklemede tur değiştiğinde veya nextKodData geldiğinde kod alanını güncelle
  useEffect(() => {
    if (!isEdit && nextKodData?.kod && open) {
      const currentKod = form.getValues('kod');
      if (!currentKod || currentKod.startsWith('MUS-') || currentKod.startsWith('TED-')) {
        form.setValue('kod', nextKodData.kod);
      }
    }
  }, [nextKodData, isEdit, open]);

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
      websiteUrl: values.websiteUrl?.trim() || undefined,
      googleMapsUrl: values.googleMapsUrl?.trim() || undefined,
      instagramUrl: values.instagramUrl?.trim() || undefined,
      facebookUrl: values.facebookUrl?.trim() || undefined,
      bayiSegment: values.bayiSegment || undefined,
      vadeGunu: values.vadeGunu ?? undefined,
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

  function suggestWebsite() {
    const email = form.getValues('email')?.trim();
    const domain = email?.includes('@') ? email.split('@').at(-1) : '';
    if (domain && !['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'].includes(domain.toLowerCase())) {
      form.setValue('websiteUrl', `https://www.${domain.toLowerCase()}`, { shouldDirty: true, shouldValidate: true });
      return;
    }

    const slug = form.getValues('ad')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i')
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 48);
    if (slug) {
      form.setValue('websiteUrl', `https://www.${slug}.com.tr`, { shouldDirty: true, shouldValidate: true });
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-lg flex flex-col">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>{isEdit ? t('admin.erp.musteriler.editItem') : t('admin.erp.musteriler.newItem')}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-4">
            {/* Kod + Ad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('admin.erp.musteriler.form.kod')}</Label>
                <Input 
                  {...form.register('kod')} 
                  placeholder={nextKodData?.kod || t('admin.erp.musteriler.form.kodPlaceholder')} 
                />
                <p className="text-xs text-muted-foreground">
                  {t('admin.erp.musteriler.form.suggestedCode', { kod: nextKodData?.kod || '...' })}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t('admin.erp.musteriler.form.ad')} *</Label>
                <Input {...form.register('ad')} placeholder={t('admin.erp.musteriler.form.adPlaceholder')} />
                {form.formState.errors.ad && (
                  <p className="text-xs text-destructive">{tValidation(form.formState.errors.ad.message ?? 'adRequired')}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('admin.erp.musteriler.form.ilgiliKisi')}</Label>
                <Input {...form.register('ilgiliKisi')} placeholder={t('admin.erp.musteriler.form.ilgiliKisiPlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.erp.musteriler.form.email')}</Label>
                <Input {...form.register('email')} placeholder={t('admin.erp.musteriler.form.emailPlaceholder')} />
              </div>
            </div>

            {/* Telefon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('admin.erp.musteriler.form.telefon')}</Label>
                <Input {...form.register('telefon')} placeholder={t('admin.erp.musteriler.form.telefonPlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.erp.musteriler.form.websiteUrl')}</Label>
                <div className="flex gap-2">
                  <Input {...form.register('websiteUrl')} placeholder={t('admin.erp.musteriler.form.websiteUrlPlaceholder')} />
                  <Button type="button" variant="outline" onClick={suggestWebsite}>
                    {t('admin.erp.musteriler.form.suggestWebsite')}
                  </Button>
                </div>
                {form.formState.errors.websiteUrl && (
                  <p className="text-xs text-destructive">{tValidation(form.formState.errors.websiteUrl.message ?? 'invalidUrl')}</p>
                )}
              </div>
            </div>

            {/* Adres */}
            <div className="space-y-2">
              <Label>{t('admin.erp.musteriler.form.adres')}</Label>
              <Input {...form.register('adres')} placeholder={t('admin.erp.musteriler.form.adresPlaceholder')} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* V2: Cari Kodu — müşteri talebiyle kaldırıldı
              <div className="space-y-2">
                <Label>{t('admin.erp.musteriler.form.cariKodu')}</Label>
                <Input {...form.register('cariKodu')} placeholder={t('admin.erp.musteriler.form.cariKoduPlaceholder')} />
              </div>
              */}
              <div className="space-y-2">
                <Label>{t('admin.erp.musteriler.form.sevkiyatNotu')}</Label>
                <Textarea
                  {...form.register('sevkiyatNotu')}
                  rows={3}
                  placeholder={t('admin.erp.musteriler.form.sevkiyatNotuPlaceholder')}
                />
              </div>
            </div>

            <div className="rounded-md border p-3">
              <h3 className="text-sm font-medium">{t('admin.erp.musteriler.form.dealerProfile')}</h3>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin.erp.musteriler.form.bayiSegment')}</Label>
                  <Select
                    value={form.watch('bayiSegment') || 'none'}
                    onValueChange={(v) => form.setValue('bayiSegment', v === 'none' ? '' : v as FormValues['bayiSegment'])}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('admin.erp.common.notSelected')}</SelectItem>
                      <SelectItem value="toptanci">{t('admin.erp.musteriler.segments.toptanci')}</SelectItem>
                      <SelectItem value="otomotiv">{t('admin.erp.musteriler.segments.otomotiv')}</SelectItem>
                      <SelectItem value="kucuk_bayi">{t('admin.erp.musteriler.segments.kucuk_bayi')}</SelectItem>
                      <SelectItem value="ihracat">{t('admin.erp.musteriler.segments.ihracat')}</SelectItem>
                      <SelectItem value="kurumsal">{t('admin.erp.musteriler.segments.kurumsal')}</SelectItem>
                      <SelectItem value="diger">{t('admin.erp.musteriler.segments.diger')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.erp.musteriler.form.portalStatus')}</Label>
                  <Select
                    value={form.watch('portalStatus')}
                    onValueChange={(v) => form.setValue('portalStatus', v as FormValues['portalStatus'])}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_invited">{t('admin.erp.musteriler.portalStatuses.not_invited')}</SelectItem>
                      <SelectItem value="invited">{t('admin.erp.musteriler.portalStatuses.invited')}</SelectItem>
                      <SelectItem value="active">{t('admin.erp.musteriler.portalStatuses.active')}</SelectItem>
                      <SelectItem value="suspended">{t('admin.erp.musteriler.portalStatuses.suspended')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.erp.musteriler.form.krediLimit')}</Label>
                  <Input type="number" min={0} step="0.01" {...form.register('krediLimit')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.erp.musteriler.form.mevcutBakiye')}</Label>
                  <Input type="number" step="0.01" {...form.register('mevcutBakiye')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.erp.musteriler.form.vadeGunu')}</Label>
                  <Input type="number" min={0} max={365} {...form.register('vadeGunu')} placeholder="30" />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={form.watch('portalEnabled')} onCheckedChange={(v) => form.setValue('portalEnabled', v)} />
                  <Label>{t('admin.erp.musteriler.form.portalEnabled')}</Label>
                </div>
              </div>
            </div>

            <div className="rounded-md border p-3">
              <h3 className="text-sm font-medium">{t('admin.erp.musteriler.form.publicSignals')}</h3>
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('admin.erp.musteriler.form.googleMapsUrl')}</Label>
                    <Input {...form.register('googleMapsUrl')} placeholder="https://maps.google.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.erp.musteriler.form.instagramUrl')}</Label>
                    <Input {...form.register('instagramUrl')} placeholder="https://instagram.com/..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.erp.musteriler.form.facebookUrl')}</Label>
                  <Input {...form.register('facebookUrl')} placeholder="https://facebook.com/..." />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.watch('publicVeriIzni')} onCheckedChange={(v) => form.setValue('publicVeriIzni', v)} />
                  <Label>{t('admin.erp.musteriler.form.publicVeriIzni')}</Label>
                </div>
              </div>
            </div>

            {/* İskonto */}
            <div className="space-y-2">
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
          </div>

          <SheetFooter className="border-t px-4 py-4 sm:px-6 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy} className="flex-1">
              {t('admin.common.cancel')}
            </Button>
            <Button type="submit" disabled={busy} className="flex-1">
              {busy ? t('admin.erp.common.saving') : t('admin.common.save')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
