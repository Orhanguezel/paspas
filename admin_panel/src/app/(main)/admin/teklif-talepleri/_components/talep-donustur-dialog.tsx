'use client';

// =============================================================
// FILE: src/app/(main)/admin/teklif-talepleri/_components/talep-donustur-dialog.tsx
// Paspas ERP — Teklif Talebi → Müşteri + Taslak Teklife Dönüştür
// =============================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { useListMusterilerAdminQuery } from '@/integrations/endpoints/admin/erp/musteriler_admin.endpoints';
import { useDonusturTeklifTalebiAdminMutation } from '@/integrations/endpoints/admin/erp/teklifler_admin.endpoints';
import type { TalepDto } from '@/integrations/shared/erp/teklifler.types';

const PARA_BIRIMLERI = ['TRY', 'USD', 'EUR'] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  talep: TalepDto;
}

export default function TalepDonusturDialog({ open, onClose, talep }: Props) {
  const { t } = useLocaleContext();
  const router = useRouter();

  const { data: musterilerData } = useListMusterilerAdminQuery({ tur: 'musteri' });
  const musteriler = musterilerData?.items ?? [];

  const [mode, setMode] = useState<'mevcut' | 'yeni'>('yeni');
  const [musteriId, setMusteriId] = useState('');
  const [yeniAd, setYeniAd] = useState('');
  const [yeniTelefon, setYeniTelefon] = useState('');
  const [yeniEmail, setYeniEmail] = useState('');
  const [yeniAdres, setYeniAdres] = useState('');
  const [paraBirimi, setParaBirimi] = useState<string>('TRY');

  const [donustur, { isLoading }] = useDonusturTeklifTalebiAdminMutation();

  useEffect(() => {
    if (open) {
      setMode(talep.musteriId ? 'mevcut' : 'yeni');
      setMusteriId(talep.musteriId ?? '');
      setYeniAd(talep.firma || talep.ad || '');
      setYeniTelefon(talep.telefon ?? '');
      setYeniEmail(talep.email ?? '');
      setYeniAdres('');
      setParaBirimi('TRY');
    }
  }, [open, talep]);

  async function handleSubmit() {
    if (mode === 'mevcut' && !musteriId) {
      toast.error(t('admin.erp.teklifTalepleri.detail.musteriSec'));
      return;
    }
    if (mode === 'yeni' && !yeniAd.trim()) {
      toast.error(t('admin.erp.common.nameRequired'));
      return;
    }
    try {
      const res = await donustur({
        id: talep.id,
        body: {
          paraBirimi,
          ...(mode === 'mevcut'
            ? { musteriId }
            : {
                yeniMusteri: {
                  ad: yeniAd.trim(),
                  telefon: yeniTelefon || undefined,
                  email: yeniEmail || undefined,
                  adres: yeniAdres || undefined,
                },
              }),
        },
      }).unwrap();
      toast.success(t('admin.erp.teklifTalepleri.detail.donusturuldu'));
      onClose();
      router.push(`/admin/teklifler/${res.teklifId}`);
    } catch (err: unknown) {
      const errorData =
        typeof err === 'object' && err !== null && 'data' in err && typeof (err as any).data === 'object'
          ? ((err as any).data as { error?: { message?: string } })
          : undefined;
      toast.error(errorData?.error?.message ?? t('admin.erp.common.operationFailed'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('admin.erp.teklifTalepleri.detail.donusturBaslik')}</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'mevcut' | 'yeni')}>
          <TabsList>
            <TabsTrigger value="yeni">{t('admin.erp.teklifTalepleri.detail.yeniMusteri')}</TabsTrigger>
            <TabsTrigger value="mevcut">{t('admin.erp.teklifTalepleri.detail.mevcutMusteri')}</TabsTrigger>
          </TabsList>

          <TabsContent value="yeni" className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifTalepleri.detail.yeniMusteriAdi')}</Label>
              <Input value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('admin.erp.teklifTalepleri.detail.yeniMusteriTelefon')}</Label>
                <Input value={yeniTelefon} onChange={(e) => setYeniTelefon(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('admin.erp.teklifTalepleri.detail.yeniMusteriEmail')}</Label>
                <Input value={yeniEmail} onChange={(e) => setYeniEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifTalepleri.detail.yeniMusteriAdres')}</Label>
              <Input value={yeniAdres} onChange={(e) => setYeniAdres(e.target.value)} />
            </div>
          </TabsContent>

          <TabsContent value="mevcut" className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.musteri')}</Label>
              <Select value={musteriId || 'none'} onValueChange={(v) => setMusteriId(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.erp.teklifTalepleri.detail.musteriSec')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>{t('admin.erp.teklifTalepleri.detail.musteriSec')}</SelectItem>
                  {musteriler.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.ad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-1">
          <Label>{t('admin.erp.teklifler.form.paraBirimi')}</Label>
          <Select value={paraBirimi} onValueChange={setParaBirimi}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARA_BIRIMLERI.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            {t('admin.common.cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? t('admin.erp.teklifTalepleri.detail.donusturuluyor') : t('admin.erp.teklifTalepleri.detail.donustur')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
