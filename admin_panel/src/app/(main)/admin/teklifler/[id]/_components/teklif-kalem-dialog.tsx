'use client';

// =============================================================
// FILE: src/app/(main)/admin/teklifler/[id]/_components/teklif-kalem-dialog.tsx
// Paspas ERP — Teklif Modülü — Kalem ekle / düzenle dialogu
// =============================================================

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { useListUrunlerAdminQuery } from '@/integrations/endpoints/admin/erp/urunler_admin.endpoints';
import {
  useAddTeklifKalemAdminMutation,
  usePatchTeklifKalemAdminMutation,
} from '@/integrations/endpoints/admin/erp/teklifler_admin.endpoints';
import type { TeklifKalemDto } from '@/integrations/shared/erp/teklifler.types';

interface Props {
  open: boolean;
  onClose: () => void;
  teklifId: string;
  kalem?: TeklifKalemDto | null;
}

export default function TeklifKalemDialog({ open, onClose, teklifId, kalem }: Props) {
  const { t } = useLocaleContext();
  const isEdit = !!kalem;

  const { data: urunlerData } = useListUrunlerAdminQuery({
    kategori: 'urun',
    isActive: true,
    limit: 500,
    sort: 'kod',
    order: 'asc',
  });
  const urunler = urunlerData?.items ?? [];

  const [urunId, setUrunId] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [birim, setBirim] = useState('');
  const [miktar, setMiktar] = useState('1');
  const [birimFiyat, setBirimFiyat] = useState('0');
  const [iskontoOrani, setIskontoOrani] = useState('0');
  const [comboOpen, setComboOpen] = useState(false);

  const [addKalem, { isLoading: adding }] = useAddTeklifKalemAdminMutation();
  const [patchKalem, { isLoading: patching }] = usePatchTeklifKalemAdminMutation();
  const busy = adding || patching;

  useEffect(() => {
    if (!open) return;
    if (isEdit && kalem) {
      setUrunId(kalem.urunId ?? '');
      setAciklama(kalem.aciklama ?? '');
      setBirim(kalem.birim ?? '');
      setMiktar(String(kalem.miktar));
      setBirimFiyat(String(kalem.birimFiyat));
      setIskontoOrani(String(kalem.iskontoOrani));
    } else {
      setUrunId('');
      setAciklama('');
      setBirim('');
      setMiktar('1');
      setBirimFiyat('0');
      setIskontoOrani('0');
    }
  }, [open, isEdit, kalem]);

  function handleUrunChange(id: string) {
    setUrunId(id);
    const urun = urunler.find((u) => u.id === id);
    if (urun) {
      if (!aciklama) setAciklama(urun.ad);
      if (urun.birim) setBirim(urun.birim);
      if (urun.birimFiyat != null) setBirimFiyat(String(urun.birimFiyat));
    }
    setComboOpen(false);
  }

  async function handleSubmit() {
    if (!aciklama.trim()) {
      toast.error(t('admin.erp.teklifler.form.kalemAciklamaPlaceholder'));
      return;
    }
    const body = {
      urunId: urunId || undefined,
      aciklama: aciklama.trim(),
      birim: birim.trim() || undefined,
      miktar: Number(miktar) || 0,
      birimFiyat: Number(birimFiyat) || 0,
      iskontoOrani: Number(iskontoOrani) || 0,
    };
    try {
      if (isEdit && kalem) {
        await patchKalem({ id: teklifId, kalemId: kalem.id, body }).unwrap();
        toast.success(t('admin.erp.common.updated', { item: t('admin.erp.teklifler.form.kalemler') }));
      } else {
        await addKalem({ id: teklifId, body }).unwrap();
        toast.success(t('admin.erp.common.created', { item: t('admin.erp.teklifler.form.kalemler') }));
      }
      onClose();
    } catch (err: unknown) {
      const errorData =
        typeof err === 'object' && err !== null && 'data' in err && typeof (err as any).data === 'object'
          ? ((err as any).data as { error?: { message?: string } })
          : undefined;
      toast.error(errorData?.error?.message ?? t('admin.erp.common.operationFailed'));
    }
  }

  const selectedUrun = urunler.find((u) => u.id === urunId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('admin.erp.common.edit') : t('admin.erp.teklifler.form.kalemEkle')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t('admin.erp.teklifler.form.urun')}</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="h-9 w-full justify-between text-sm font-normal">
                  <span className="truncate">
                    {selectedUrun ? `${selectedUrun.kod} — ${selectedUrun.ad}` : t('admin.erp.teklifler.form.urunPlaceholder')}
                  </span>
                  <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Ürün ara..." />
                  <CommandList>
                    <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="__none__" onSelect={() => { setUrunId(''); setComboOpen(false); }}>
                        <Check className={`mr-2 size-4 ${!urunId ? 'opacity-100' : 'opacity-0'}`} />
                        {t('admin.erp.common.notSelected')}
                      </CommandItem>
                      {urunler.map((u) => (
                        <CommandItem key={u.id} value={`${u.kod} ${u.ad}`} onSelect={() => handleUrunChange(u.id)}>
                          <Check className={`mr-2 size-4 ${urunId === u.id ? 'opacity-100' : 'opacity-0'}`} />
                          {u.kod} — {u.ad}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label>{t('admin.erp.teklifler.form.kalemAciklama')} *</Label>
            <Textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder={t('admin.erp.teklifler.form.kalemAciklamaPlaceholder')}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.miktar')}</Label>
              <Input type="number" step="0.0001" min="0.0001" value={miktar} onChange={(e) => setMiktar(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.birim')}</Label>
              <Input value={birim} onChange={(e) => setBirim(e.target.value)} placeholder="adet / kg / m" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.fiyat')}</Label>
              <Input type="number" step="0.01" min="0" value={birimFiyat} onChange={(e) => setBirimFiyat(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.kalemIskonto')}</Label>
              <Input type="number" step="0.01" min="0" max="100" value={iskontoOrani} onChange={(e) => setIskontoOrani(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            {t('admin.common.cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={busy}>
            {busy ? t('admin.erp.common.saving') : t('admin.common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
