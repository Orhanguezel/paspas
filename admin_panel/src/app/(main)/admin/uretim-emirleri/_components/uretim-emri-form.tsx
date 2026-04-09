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

import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { UretimEmriAdayDto, UretimEmriDto } from '@/integrations/shared/erp/uretim_emirleri.types';

const schema = z.object({
  emirNo:          z.string().min(1, 'Zorunlu'),
  urunId:          z.string().min(1, 'Ürün seçiniz'),
  planlananMiktar: z.coerce.number().positive('0\'dan büyük olmalı'),
  uretilenMiktar:  z.coerce.number().min(0).default(0),
  baslangicTarihi: z.string().optional(),
  bitisTarihi:     z.string().optional(),
  terminTarihi:    z.string().optional(),
  musteriOzet:     z.string().optional(),
  musteriDetay:    z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  emri: UretimEmriDto | null;
  initialKaynak?: 'manuel' | 'siparis';
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

export default function UretimEmriForm({ open, onClose, emri, initialKaynak = 'siparis' }: Props) {
  const { t } = useLocaleContext();
  const isEdit = !!emri;
  const [kaynakTipi, setKaynakTipi] = useState<'manuel' | 'siparis'>('siparis');
  const [selectedKalemIds, setSelectedKalemIds] = useState<Set<string>>(new Set());
  const [create, createState] = useCreateUretimEmriAdminMutation();
  const [update, updateState] = useUpdateUretimEmriAdminMutation();
  const loading = createState.isLoading || updateState.isLoading;

  const { data: urunlerData } = useListUrunlerAdminQuery({ limit: 500, kategori: 'urun' });
  const { data: adaylar = [] } = useListUretimEmriAdaylariAdminQuery();
  const { data: nextNoData } = useGetNextEmirNoAdminQuery(undefined, { skip: isEdit, refetchOnMountOrArgChange: true });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { uretilenMiktar: 0 },
  });

  const selectedUrunId = watch('urunId');

  const urunler = urunlerData?.items ?? [];
  const urunOptions = useMemo(
    () =>
      urunler.map((urun) => ({
        value: urun.id,
        label: `${urun.ad}${urun.kod ? ` (${urun.kod})` : ''}`,
      })),
    [urunler],
  );
  const grouped = useMemo(() => groupByUrun(adaylar), [adaylar]);

  // Derive form values from selected kalemleri
  const selectedAdaylar = useMemo(
    () => adaylar.filter((a) => selectedKalemIds.has(a.siparisKalemId)),
    [adaylar, selectedKalemIds],
  );
  const selectedToplamMiktar = useMemo(
    () => selectedAdaylar.reduce((sum, aday) => sum + aday.miktar, 0),
    [selectedAdaylar],
  );
  const selectedEnErkenTermin = useMemo(
    () =>
      selectedAdaylar
        .map((aday) => aday.terminTarihi)
        .filter((tarih): tarih is string => Boolean(tarih))
        .sort()[0] ?? '',
    [selectedAdaylar],
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
        musteriOzet:     emri.musteriAd ?? '',
        musteriDetay:    emri.musteriDetay ?? '',
      });
    } else {
      setKaynakTipi(initialKaynak);
      setSelectedKalemIds(new Set());
      reset({
        emirNo: nextNoData?.emirNo ?? '',
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
  }, [open, emri, reset, nextNoData, initialKaynak]);

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
    const kalemIds = Array.from(selectedKalemIds).filter((id) => id.trim() !== '');
    const payload = {
      emirNo: values.emirNo,
      urunId: values.urunId,
      planlananMiktar: values.planlananMiktar,
      siparisKalemIds: kaynakTipi === 'siparis' && kalemIds.length > 0 ? kalemIds : undefined,
      musteriOzet: values.musteriOzet || undefined,
      musteriDetay: values.musteriDetay || undefined,
      terminTarihi: values.terminTarihi || undefined,
    };
    // Debug: log what we send to backend
    if (process.env.NODE_ENV === 'development') {
      console.log('[UretimEmriForm] payload:', JSON.parse(JSON.stringify(payload)));
    }
    try {
      if (isEdit && emri) {
        await update({ id: emri.id, body: payload }).unwrap();
        toast.success(t('admin.erp.common.updated', { item: t('admin.erp.uretimEmirleri.singular') }));
      } else {
        const result = await create(payload).unwrap();
        toast.success(t('admin.erp.common.created', { item: t('admin.erp.uretimEmirleri.singular') }));
        // Hammadde yetersizlik uyarısı göster
        if (result.hammaddeUyarilari?.length > 0) {
          const eksikler = result.hammaddeUyarilari
            .map((u) => `${u.urunKod} (${u.urunAd}): ${u.eksikMiktar.toLocaleString('tr-TR')} eksik`)
            .join('\n');
          toast.warning(`Hammadde stok yetersiz!\n${eksikler}`, { duration: 8000 });
        }
      }
      onClose();
    } catch (err: unknown) {
      const errData = typeof err === 'object' && err && 'data' in err
        ? (err as { data?: { error?: { message?: string; issues?: { fieldErrors?: Record<string, string[]> } } } }).data?.error
        : undefined;
      let message = errData?.message;
      // Show field-level validation errors from backend
      if (errData?.issues?.fieldErrors) {
        const fields = Object.entries(errData.issues.fieldErrors)
          .filter(([, msgs]) => msgs && msgs.length > 0)
          .map(([field, msgs]) => `${field}: ${msgs!.join(', ')}`)
          .join('\n');
        if (fields) message = `${message ?? 'Hata'}\n${fields}`;
      }
      toast.error(message ?? t('admin.erp.common.operationFailed'));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-2xl flex flex-col">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>
            {isEdit 
              ? t('admin.erp.uretimEmirleri.editItem') 
              : (kaynakTipi === 'manuel' ? 'Yeni Stoka Üretim Emri' : 'Siparişe Dayalı Üretim Emri')
            }
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" {...register('urunId')} />
          <input type="hidden" {...register('musteriOzet')} />
          <input type="hidden" {...register('musteriDetay')} />
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            {/* Emir No */}
            <div className="space-y-1">
              <Label>{t('admin.erp.uretimEmirleri.form.emirNo')} *</Label>
              <Input {...register('emirNo')} placeholder={t('admin.erp.uretimEmirleri.form.emirNoPlaceholder')} />
              {errors.emirNo && <p className="text-destructive text-xs">{errors.emirNo.message}</p>}
            </div>

            {/* Kaynak Tipi */}
            <div className="space-y-3 rounded-md border p-3">
              <Label>{t('admin.erp.uretimEmirleri.form.kaynak')}</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {(['siparis', 'manuel'] as const).map((secenek) => {
                  const selected = kaynakTipi === secenek;
                  const titleKey =
                    secenek === 'siparis'
                      ? 'admin.erp.uretimEmirleri.form.kaynakSiparis'
                      : 'admin.erp.uretimEmirleri.form.kaynakManuel';
                  const descKey =
                    secenek === 'siparis'
                      ? 'admin.erp.uretimEmirleri.form.kaynakSiparisDesc'
                      : 'admin.erp.uretimEmirleri.form.kaynakManuelDesc';
                  return (
                    <button
                      key={secenek}
                      type="button"
                      onClick={() => handleKaynakTipiChange(secenek)}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                      }`}
                    >
                      <div className="font-medium">{t(titleKey)}</div>
                      <div className="mt-1 text-muted-foreground text-xs">{t(descKey)}</div>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {kaynakTipi === 'siparis'
                  ? t('admin.erp.uretimEmirleri.form.kaynakSiparisBilgi')
                  : t('admin.erp.uretimEmirleri.form.kaynakManuelBilgi')}
              </div>
            </div>

            {/* Sipariş kalemleri — checkbox multi-select */}
            {kaynakTipi === 'siparis' && (
              <div className="space-y-3">
                <Label>{t('admin.erp.uretimEmirleri.form.siparisAdaylari')}</Label>
                {selectedAdaylar.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border bg-muted/20 px-3 py-3">
                      <div className="text-[11px] text-muted-foreground">
                        {t('admin.erp.uretimEmirleri.form.seciliKalem')}
                      </div>
                      <div className="mt-1 font-semibold tabular-nums">{selectedAdaylar.length}</div>
                    </div>
                    <div className="rounded-md border bg-muted/20 px-3 py-3">
                      <div className="text-[11px] text-muted-foreground">
                        {t('admin.erp.uretimEmirleri.form.toplamMiktar')}
                      </div>
                      <div className="mt-1 font-semibold tabular-nums">{selectedToplamMiktar}</div>
                    </div>
                    <div className="rounded-md border bg-muted/20 px-3 py-3">
                      <div className="text-[11px] text-muted-foreground">
                        {t('admin.erp.uretimEmirleri.form.enErkenTermin')}
                      </div>
                      <div className="mt-1 font-semibold tabular-nums">{selectedEnErkenTermin || '—'}</div>
                    </div>
                  </div>
                )}
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
                          <div className="bg-muted/50 px-3 py-2.5 flex items-center gap-2">
                            <span className="font-bold text-sm">{first.urunAd ?? first.urunKod ?? urunId}</span>
                            {first.urunKod && <span className="text-xs font-mono text-muted-foreground">({first.urunKod})</span>}
                            <span className="ml-auto text-muted-foreground text-xs">{kalemleri.length} kalem</span>
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
                                  <div className="text-muted-foreground text-xs">
                                    {kalem.musteriAd} — {kalem.siparisNo}
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
                        {selectedToplamMiktar} ad.
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

            {kaynakTipi === 'manuel' && (
              <div className="rounded-md border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
                {t('admin.erp.uretimEmirleri.form.manuelUretimBilgi')}
              </div>
            )}

            {/* Ürün seçimi */}
            <div className="space-y-1">
              <Label>{t('admin.erp.uretimEmirleri.form.urunId')} *</Label>
              <Combobox
                options={urunOptions}
                value={selectedUrunId || 'none'}
                onValueChange={(v) => setValue('urunId', v === 'none' ? '' : v, { shouldDirty: true, shouldValidate: true })}
                disabled={kaynakTipi === 'siparis' && selectedAdaylar.length > 0}
                placeholder={t('admin.erp.uretimEmirleri.form.urunPlaceholder')}
                searchPlaceholder={t('admin.erp.uretimEmirleri.form.urunPlaceholder')}
                emptyText={t('admin.common.noData')}
              />
              {errors.urunId && <p className="text-destructive text-xs">{errors.urunId.message}</p>}
            </div>

            {/* Miktar */}
            <div className="space-y-1">
              <Label>{t('admin.erp.uretimEmirleri.form.planlananMiktar')} *</Label>
              <Input type="number" step="0.0001" {...register('planlananMiktar')} />
              {errors.planlananMiktar && <p className="text-destructive text-xs">{errors.planlananMiktar.message}</p>}
            </div>

            {/* Hidden fields — tarihler ve üretilen miktar başka yerden yönetilecek */}
            <input type="hidden" {...register('terminTarihi')} />
            <input type="hidden" {...register('uretilenMiktar')} />
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
