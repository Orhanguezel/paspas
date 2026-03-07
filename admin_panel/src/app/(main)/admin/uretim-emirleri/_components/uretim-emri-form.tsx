'use client';

// =============================================================
// FILE: src/app/(main)/admin/uretim-emirleri/_components/uretim-emri-form.tsx
// Paspas ERP — Üretim Emri oluştur / düzenle formu
// Sipariş kalemlerinden çoklu seçim destekli
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AlertTriangle } from 'lucide-react';

import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';

import {
  useCreateUretimEmriAdminMutation,
  useGetNextEmirNoAdminQuery,
  useListUretimEmriAdaylariAdminQuery,
  useUpdateUretimEmriAdminMutation,
} from '@/integrations/endpoints/admin/erp/uretim_emirleri_admin.endpoints';
import { useListUrunlerAdminQuery } from '@/integrations/endpoints/admin/erp/urunler_admin.endpoints';
import type { UretimEmriAdayDto, UretimEmriDto, UretimEmriDurum } from '@/integrations/shared/erp/uretim_emirleri.types';

const durumValues = ['planlandi', 'hazirlaniyor', 'uretimde', 'tamamlandi', 'iptal'] as const;

const schema = z.object({
  emirNo:          z.string().min(1, 'Zorunlu'),
  urunId:          z.string().min(1, 'Ürün seçiniz'),
  planlananMiktar: z.coerce.number().positive('0\'dan büyük olmalı'),
  uretilenMiktar:  z.coerce.number().min(0).default(0),
  baslangicTarihi: z.string().optional(),
  bitisTarihi:     z.string().optional(),
  terminTarihi:    z.string().optional(),
  durum:           z.enum(durumValues).default('planlandi'),
  musteriOzet:     z.string().optional(),
  musteriDetay:    z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  emri: UretimEmriDto | null;
}

// Group adaylar by urunId for display
function groupByUrun(adaylar: UretimEmriAdayDto[]): Map<string, UretimEmriAdayDto[]> {
  const map = new Map<string, UretimEmriAdayDto[]>();
  for (const a of adaylar) {
    const existing = map.get(a.urunId);
    if (existing) existing.push(a);
    else map.set(a.urunId, [a]);
  }
  return map;
}

export default function UretimEmriForm({ open, onClose, emri }: Props) {
  const { t } = useLocaleContext();
  const isEdit = !!emri;
  const [kaynakTipi, setKaynakTipi] = useState<'manuel' | 'siparis'>('manuel');
  const [selectedKalemIds, setSelectedKalemIds] = useState<Set<string>>(new Set());
  const [create, createState] = useCreateUretimEmriAdminMutation();
  const [update, updateState] = useUpdateUretimEmriAdminMutation();
  const loading = createState.isLoading || updateState.isLoading;

  const { data: urunlerData } = useListUrunlerAdminQuery({ limit: 500 });
  const { data: adaylar = [] } = useListUretimEmriAdaylariAdminQuery();
  const { data: nextNoData } = useGetNextEmirNoAdminQuery(undefined, { skip: isEdit });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { durum: 'planlandi', uretilenMiktar: 0 },
  });

  const selectedUrunId = watch('urunId');
  const durumVal = watch('durum');

  const urunler = urunlerData?.items ?? [];
  const grouped = useMemo(() => groupByUrun(adaylar), [adaylar]);

  // Derive form values from selected kalemleri
  const selectedAdaylar = useMemo(
    () => adaylar.filter((a) => selectedKalemIds.has(a.siparisKalemId)),
    [adaylar, selectedKalemIds],
  );

  // When selections change, auto-fill form fields
  useEffect(() => {
    if (kaynakTipi !== 'siparis' || selectedAdaylar.length === 0) return;

    const firstUrunId = selectedAdaylar[0].urunId;
    const totalMiktar = selectedAdaylar.reduce((sum, a) => sum + a.miktar, 0);
    const minTermin = selectedAdaylar
      .map((a) => a.terminTarihi)
      .filter((t): t is string => !!t)
      .sort()[0] ?? '';

    // musteriOzet: single customer name or "Toplam sipariş"
    const uniqueCustomers = [...new Set(selectedAdaylar.map((a) => a.musteriAd))];
    const musteriOzet = uniqueCustomers.length === 1 ? uniqueCustomers[0] : 'Toplam sipariş';
    // musteriDetay: "Müşteri: miktar | Müşteri2: miktar"
    const musteriDetay = selectedAdaylar.map((a) => `${a.musteriAd}: ${a.miktar}`).join(' | ');

    setValue('urunId', firstUrunId, { shouldDirty: true, shouldValidate: true });
    setValue('planlananMiktar', totalMiktar, { shouldDirty: true, shouldValidate: true });
    setValue('terminTarihi', minTermin, { shouldDirty: true });
    setValue('musteriOzet', musteriOzet, { shouldDirty: true });
    setValue('musteriDetay', musteriDetay, { shouldDirty: true });
  }, [selectedAdaylar, kaynakTipi, setValue]);

  useEffect(() => {
    if (!open) return;
    if (emri) {
      const hasSiparis = emri.siparisKalemIds.length > 0;
      setKaynakTipi(hasSiparis ? 'siparis' : 'manuel');
      setSelectedKalemIds(new Set(emri.siparisKalemIds));
      reset({
        emirNo:          emri.emirNo,
        urunId:          emri.urunId,
        planlananMiktar: emri.planlananMiktar,
        uretilenMiktar:  emri.uretilenMiktar,
        baslangicTarihi: emri.baslangicTarihi ?? '',
        bitisTarihi:     emri.bitisTarihi ?? '',
        terminTarihi:    emri.terminTarihi ?? '',
        durum:           emri.durum as FormValues['durum'],
        musteriOzet:     emri.musteriAd ?? '',
        musteriDetay:    emri.musteriDetay ?? '',
      });
    } else {
      setKaynakTipi('manuel');
      setSelectedKalemIds(new Set());
      reset({
        emirNo: nextNoData?.emirNo ?? '',
        durum: 'planlandi',
        uretilenMiktar: 0,
        urunId: '',
        terminTarihi: '',
        musteriOzet: '',
        musteriDetay: '',
        baslangicTarihi: '',
        bitisTarihi: '',
        planlananMiktar: 0,
      });
    }
  }, [open, emri, reset, nextNoData]);

  function handleKaynakTipiChange(value: 'manuel' | 'siparis') {
    setKaynakTipi(value);
    setSelectedKalemIds(new Set());
    if (value === 'manuel') {
      setValue('musteriOzet', '');
      setValue('musteriDetay', '');
    } else {
      setValue('urunId', '');
      setValue('planlananMiktar', 0);
      setValue('terminTarihi', '');
    }
  }

  function handleKalemToggle(kalem: UretimEmriAdayDto, checked: boolean) {
    setSelectedKalemIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        // Enforce same product: if selecting a different product, clear previous selections
        const currentUrunId = selectedAdaylar.length > 0 ? selectedAdaylar[0].urunId : null;
        if (currentUrunId && currentUrunId !== kalem.urunId) {
          next.clear();
        }
        next.add(kalem.siparisKalemId);
      } else {
        next.delete(kalem.siparisKalemId);
      }
      return next;
    });
  }

  // Which urunId is currently "locked" by selection
  const lockedUrunId = selectedAdaylar.length > 0 ? selectedAdaylar[0].urunId : null;

  async function onSubmit(values: FormValues) {
    const kalemIds = Array.from(selectedKalemIds);
    const payload = {
      ...values,
      siparisKalemIds: kaynakTipi === 'siparis' && kalemIds.length > 0 ? kalemIds : undefined,
      musteriOzet: values.musteriOzet || undefined,
      musteriDetay: values.musteriDetay || undefined,
      baslangicTarihi: values.baslangicTarihi || undefined,
      bitisTarihi:     values.bitisTarihi     || undefined,
      terminTarihi:    values.terminTarihi    || undefined,
    };
    try {
      if (isEdit && emri) {
        await update({ id: emri.id, body: payload }).unwrap();
        toast.success(t('admin.erp.common.updated', { item: t('admin.erp.uretimEmirleri.singular') }));
      } else {
        await create(payload).unwrap();
        toast.success(t('admin.erp.common.created', { item: t('admin.erp.uretimEmirleri.singular') }));
      }
      onClose();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err && 'data' in err
          ? (err as { data?: { error?: { message?: string } } }).data?.error?.message
          : undefined;
      toast.error(message ?? t('admin.erp.common.operationFailed'));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-2xl flex flex-col">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>{isEdit ? t('admin.erp.uretimEmirleri.editItem') : t('admin.erp.uretimEmirleri.newItem')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" {...register('urunId')} />
          <input type="hidden" {...register('musteriOzet')} />
          <input type="hidden" {...register('musteriDetay')} />
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            {/* Emir No + Durum */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t('admin.erp.uretimEmirleri.form.emirNo')} *</Label>
                <Input {...register('emirNo')} placeholder={t('admin.erp.uretimEmirleri.form.emirNoPlaceholder')} />
                {errors.emirNo && <p className="text-destructive text-xs">{errors.emirNo.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>{t('admin.erp.uretimEmirleri.form.durum')}</Label>
                <Select value={durumVal} onValueChange={(v) => setValue('durum', v as UretimEmriDurum)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {durumValues.map((d) => (
                      <SelectItem key={d} value={d}>{t(`admin.erp.uretimEmirleri.statuses.${d}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Kaynak Tipi */}
            <div className="space-y-2 rounded-md border p-3">
              <Label>{t('admin.erp.uretimEmirleri.form.kaynak')}</Label>
              <Select value={kaynakTipi} onValueChange={(v) => handleKaynakTipiChange(v as 'manuel' | 'siparis')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manuel">{t('admin.erp.uretimEmirleri.form.kaynakManuel')}</SelectItem>
                  <SelectItem value="siparis">{t('admin.erp.uretimEmirleri.form.kaynakSiparis')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sipariş kalemleri — checkbox multi-select */}
            {kaynakTipi === 'siparis' && (
              <div className="space-y-2">
                <Label>{t('admin.erp.uretimEmirleri.form.siparisAdaylari')}</Label>
                {adaylar.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {t('admin.erp.uretimEmirleri.form.adayYok')}
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-md border">
                    {[...grouped.entries()].map(([urunId, kalemleri]) => {
                      const first = kalemleri[0];
                      const isDisabled = lockedUrunId !== null && lockedUrunId !== urunId;
                      return (
                        <div key={urunId} className="border-b last:border-b-0">
                          <div className="bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                            {first.urunAd ?? first.urunKod ?? urunId}
                            {first.urunKod && <span className="ml-1 font-mono">({first.urunKod})</span>}
                          </div>
                          {kalemleri.map((kalem) => {
                            const isChecked = selectedKalemIds.has(kalem.siparisKalemId);
                            return (
                              <label
                                key={kalem.siparisKalemId}
                                className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-accent/50 transition-colors ${isDisabled && !isChecked ? 'opacity-40 pointer-events-none' : ''}`}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(v) => handleKalemToggle(kalem, v === true)}
                                  disabled={isDisabled && !isChecked}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{kalem.musteriAd}</span>
                                    <span className="text-muted-foreground text-xs">{kalem.siparisNo}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-mono font-medium">{kalem.miktar}</span>
                                  <span className="text-muted-foreground text-xs ml-1">ad.</span>
                                </div>
                                {kalem.terminTarihi && (
                                  <span className="text-muted-foreground text-xs shrink-0">
                                    {kalem.terminTarihi}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selection summary */}
                {selectedAdaylar.length > 0 && (
                  <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.erp.uretimEmirleri.form.seciliKalem')}</span>
                      <span className="font-medium">{selectedAdaylar.length} kalem</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.erp.uretimEmirleri.form.toplamMiktar')}</span>
                      <span className="font-mono font-medium">
                        {selectedAdaylar.reduce((s, a) => s + a.miktar, 0)} ad.
                      </span>
                    </div>
                    {selectedAdaylar.length > 1 && (
                      <div className="text-xs text-muted-foreground pt-1 border-t">
                        {selectedAdaylar.map((a) => `${a.musteriAd}: ${a.miktar} ad.`).join(' | ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Ürün seçimi */}
            <div className="space-y-1">
              <Label>{t('admin.erp.uretimEmirleri.form.urunId')} *</Label>
              <Select
                value={selectedUrunId || 'none'}
                onValueChange={(v) => setValue('urunId', v === 'none' ? '' : v, { shouldDirty: true, shouldValidate: true })}
                disabled={kaynakTipi === 'siparis' && selectedAdaylar.length > 0}
              >
                <SelectTrigger><SelectValue placeholder={t('admin.erp.uretimEmirleri.form.urunPlaceholder')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('admin.erp.uretimEmirleri.form.urunPlaceholder')}</SelectItem>
                  {urunler.map((urun) => (
                    <SelectItem key={urun.id} value={urun.id}>
                      {urun.ad} {urun.kod ? `(${urun.kod})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.urunId && <p className="text-destructive text-xs">{errors.urunId.message}</p>}
            </div>

            {/* Miktar */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t('admin.erp.uretimEmirleri.form.planlananMiktar')} *</Label>
                <Input type="number" step="0.0001" {...register('planlananMiktar')} />
                {errors.planlananMiktar && <p className="text-destructive text-xs">{errors.planlananMiktar.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>{t('admin.erp.uretimEmirleri.form.uretilenMiktar')}</Label>
                <Input type="number" step="0.0001" {...register('uretilenMiktar')} />
              </div>
            </div>

            {/* Tarihler */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('admin.erp.uretimEmirleri.form.baslangicTarihi')}</Label>
                <Input type="date" {...register('baslangicTarihi')} />
              </div>
              <div className="space-y-1">
                <Label>{t('admin.erp.uretimEmirleri.form.bitisTarihi')}</Label>
                <Input type="date" {...register('bitisTarihi')} />
              </div>
              <div className="space-y-1">
                <Label>{t('admin.erp.uretimEmirleri.form.terminTarihi')}</Label>
                <Input type="date" {...register('terminTarihi')} />
              </div>
            </div>

            {/* Termin riski uyarısı (edit modunda) */}
            {isEdit && emri?.terminRiski && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{t('admin.erp.uretimEmirleri.form.terminRiskiUyari')}</span>
              </div>
            )}
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
