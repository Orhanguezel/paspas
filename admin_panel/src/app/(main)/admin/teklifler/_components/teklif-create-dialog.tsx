'use client';

// =============================================================
// FILE: src/app/(main)/admin/teklifler/_components/teklif-create-dialog.tsx
// Paspas ERP — Teklif Modülü — Yeni Teklif oluşturma dialogu
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
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { useListMusterilerAdminQuery } from '@/integrations/endpoints/admin/erp/musteriler_admin.endpoints';
import { useCreateTeklifAdminMutation } from '@/integrations/endpoints/admin/erp/teklifler_admin.endpoints';

const PARA_BIRIMLERI = ['TRY', 'USD', 'EUR'] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TeklifCreateDialog({ open, onClose }: Props) {
  const { t } = useLocaleContext();
  const router = useRouter();

  const { data: musterilerData } = useListMusterilerAdminQuery({ tur: 'musteri' });
  const musteriler = musterilerData?.items ?? [];

  const [musteriId, setMusteriId] = useState('');
  const [paraBirimi, setParaBirimi] = useState<string>('TRY');
  const [kdvOrani, setKdvOrani] = useState('20');
  const [kdvDahil, setKdvDahil] = useState(true);
  const [gecerlilikTarihi, setGecerlilikTarihi] = useState('');

  const [create, { isLoading }] = useCreateTeklifAdminMutation();

  useEffect(() => {
    if (open) {
      setMusteriId('');
      setParaBirimi('TRY');
      setKdvOrani('20');
      setKdvDahil(true);
      setGecerlilikTarihi('');
    }
  }, [open]);

  async function handleSubmit() {
    if (!musteriId) {
      toast.error(t('admin.erp.teklifler.form.musteriPlaceholder'));
      return;
    }
    try {
      const teklif = await create({
        musteriId,
        paraBirimi,
        kdvOrani: Number(kdvOrani) || 0,
        kdvDahil,
        gecerlilikTarihi: gecerlilikTarihi || undefined,
      }).unwrap();
      toast.success(t('admin.erp.common.created', { item: t('admin.erp.teklifler.singular') }));
      onClose();
      router.push(`/admin/teklifler/${teklif.id}`);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.erp.teklifler.newItem')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t('admin.erp.teklifler.form.musteri')}</Label>
            <Select value={musteriId || 'none'} onValueChange={(v) => setMusteriId(v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.erp.teklifler.form.musteriPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  {t('admin.erp.teklifler.form.musteriPlaceholder')}
                </SelectItem>
                {musteriler.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.ad}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.kdvOrani')}</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={kdvOrani}
                onChange={(e) => setKdvOrani(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t('admin.erp.teklifler.form.gecerlilikTarihi')}</Label>
            <Input
              type="date"
              value={gecerlilikTarihi}
              onChange={(e) => setGecerlilikTarihi(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label className="cursor-pointer" onClick={() => setKdvDahil((v) => !v)}>
              {t('admin.erp.teklifler.form.kdvDahil')}
            </Label>
            <button
              type="button"
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${kdvDahil ? 'bg-primary' : 'bg-input'}`}
              onClick={() => setKdvDahil((v) => !v)}
            >
              <span
                className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${kdvDahil ? 'translate-x-4' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            {t('admin.common.cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? t('admin.erp.common.saving') : t('admin.common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
