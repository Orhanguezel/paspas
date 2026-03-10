'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import {
  Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import {
  useCreateSatinAlmaAdminMutation,
  useGetSatinAlmaAdminQuery,
  useUpdateSatinAlmaAdminMutation,
  useGetNextSiparisNoQuery,
} from '@/integrations/endpoints/admin/erp/satin_alma_admin.endpoints';
import { useListTedarikciAdminQuery } from '@/integrations/endpoints/admin/erp/tedarikci_admin.endpoints';
import { useListUrunlerAdminQuery } from '@/integrations/endpoints/admin/erp/urunler_admin.endpoints';
import type { SatinAlmaSiparisDto, SatinAlmaKalemPayload } from '@/integrations/shared/erp/satin_alma.types';

interface KalemRow {
  urunId: string;
  miktar: string;
  birimFiyat: string;
}

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
  const { data: detailSiparis } = useGetSatinAlmaAdminQuery(siparis?.id ?? '', {
    skip: !open || !siparis?.id,
  });
  const [create, createState] = useCreateSatinAlmaAdminMutation();
  const [update, updateState] = useUpdateSatinAlmaAdminMutation();
  const loading = createState.isLoading || updateState.isLoading;

  const { data: nextNoData } = useGetNextSiparisNoQuery(undefined, { skip: isEdit || !open });
  const { data: tedarikciData } = useListTedarikciAdminQuery({});
  const tedarikciler = tedarikciData?.items ?? [];

  const { data: urunlerData } = useListUrunlerAdminQuery(
    { limit: 500 },
    { skip: !open },
  );
  const urunler = urunlerData?.items ?? [];

  const [kalemler, setKalemler] = useState<KalemRow[]>([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { durum: 'taslak' },
  });

  useEffect(() => {
    if (open) {
      const activeSiparis =
        siparis && detailSiparis?.id === siparis.id
          ? detailSiparis
          : siparis;
      if (activeSiparis) {
        reset({
          siparisNo:    activeSiparis.siparisNo,
          tedarikciId:  activeSiparis.tedarikciId,
          siparisTarihi: activeSiparis.siparisTarihi,
          terminTarihi: activeSiparis.terminTarihi ?? '',
          durum:        activeSiparis.durum,
          aciklama:     activeSiparis.aciklama ?? '',
        });
        setKalemler(
          (activeSiparis.items ?? []).map((k) => ({
            urunId: k.urunId,
            miktar: String(k.miktar),
            birimFiyat: String(k.birimFiyat),
          })),
        );
      } else {
        reset({
          durum: 'taslak',
          siparisTarihi: new Date().toISOString().split('T')[0],
          siparisNo: nextNoData?.siparisNo ?? '',
          tedarikciId: '',
          terminTarihi: '',
          aciklama: '',
        });
        setKalemler([]);
      }
    }
  }, [open, siparis, detailSiparis, reset, nextNoData]);

  function addKalem() {
    setKalemler((prev) => [...prev, { urunId: '', miktar: '1', birimFiyat: '0' }]);
  }

  function removeKalem(idx: number) {
    setKalemler((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateKalem(idx: number, field: keyof KalemRow, value: string) {
    setKalemler((prev) => prev.map((k, i) => (i === idx ? { ...k, [field]: value } : k)));
  }

  async function onSubmit(values: FormValues) {
    const items: SatinAlmaKalemPayload[] = kalemler
      .filter((k) => k.urunId.length > 0)
      .map((k, i) => ({
        urunId: k.urunId,
        miktar: Number(k.miktar) || 0,
        birimFiyat: Number(k.birimFiyat) || 0,
        sira: i + 1,
      }));

    if (!isEdit && items.length === 0) {
      toast.error('En az bir kalem ekleyin');
      return;
    }

    const payload = {
      ...values,
      terminTarihi: values.terminTarihi || undefined,
      aciklama:     values.aciklama || undefined,
    };
    try {
      if (isEdit) {
        await update({ id: siparis.id, body: { ...payload, items } }).unwrap();
        toast.success(t('admin.erp.common.updated', { item: t('admin.erp.satinAlma.singular') }));
      } else {
        await create({ ...payload, items }).unwrap();
        toast.success(t('admin.erp.common.created', { item: t('admin.erp.satinAlma.singular') }));
      }
      onClose();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      toast.error(msg ?? t('admin.erp.common.operationFailed2'));
    }
  }

  const durumVal = watch('durum');
  const tedarikciVal = watch('tedarikciId');

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-2xl">
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
                <Select value={durumVal} onValueChange={(v) => setValue('durum', v as FormValues['durum'])}>
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
              <Select value={tedarikciVal || 'none'} onValueChange={(v) => setValue('tedarikciId', v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.erp.satinAlma.form.tedarikciPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('admin.erp.satinAlma.form.tedarikciPlaceholder')}</SelectItem>
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

            <Separator />

            {/* Kalemler */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Malzeme Kalemleri</Label>
                <Button type="button" variant="outline" size="sm" onClick={addKalem}>
                  <Plus className="mr-1 size-3.5" /> Kalem Ekle
                </Button>
              </div>

              {kalemler.length === 0 && (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  Henüz kalem eklenmedi. Yukarıdaki butona tıklayarak malzeme ekleyin.
                </p>
              )}

              {kalemler.map((kalem, idx) => (
                <div key={`kalem-${idx}`} className="flex items-end gap-2 rounded-md border p-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Malzeme</Label>
                    <Select
                      value={kalem.urunId || 'none'}
                      onValueChange={(v) => updateKalem(idx, 'urunId', v === 'none' ? '' : v)}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Malzeme seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Malzeme seçin</SelectItem>
                        {urunler.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.kod} — {u.ad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">Miktar</Label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      className="h-9 text-sm"
                      value={kalem.miktar}
                      onChange={(e) => updateKalem(idx, 'miktar', e.target.value)}
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Birim Fiyat</Label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      className="h-9 text-sm"
                      value={kalem.birimFiyat}
                      onChange={(e) => updateKalem(idx, 'birimFiyat', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 size-9 text-destructive hover:text-destructive"
                    onClick={() => removeKalem(idx)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}

              {kalemler.length > 0 && (
                <div className="flex justify-end text-sm text-muted-foreground">
                  Toplam: {kalemler.reduce((s, k) => s + (Number(k.miktar) || 0) * (Number(k.birimFiyat) || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                </div>
              )}
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
