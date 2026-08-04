'use client';

// =============================================================
// FILE: src/app/(main)/admin/teklif-talepleri/_components/talep-detay-sheet.tsx
// Paspas ERP — Teklif Talebi detay paneli
// =============================================================

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { useListUsersAdminQuery } from '@/integrations/endpoints/admin/users/auth_admin.endpoints';
import { useGetTeklifTalebiAdminQuery, usePatchTeklifTalebiAdminMutation } from '@/integrations/endpoints/admin/erp/teklifler_admin.endpoints';
import type { TalepDto, TalepDurum } from '@/integrations/shared/erp/teklifler.types';
import { TALEP_DURUM_BADGE } from '@/integrations/shared/erp/teklifler.types';
import TalepDonusturDialog from './talep-donustur-dialog';

const DURUM_VALUES: TalepDurum[] = [
  'yeni', 'inceleniyor', 'musteriye_donustu', 'teklife_donustu', 'istenmeyen', 'kapandi',
];

interface Props {
  talep: TalepDto | null;
  onClose: () => void;
}

export default function TalepDetaySheet({ talep: initialTalep, onClose }: Props) {
  const { t } = useLocaleContext();
  const [donusturOpen, setDonusturOpen] = useState(false);
  const { data: freshTalep } = useGetTeklifTalebiAdminQuery(initialTalep?.id ?? '', { skip: !initialTalep });
  const talep = freshTalep ?? initialTalep;
  const { data: usersData } = useListUsersAdminQuery(undefined, { skip: !initialTalep });
  const [patchTalep, patchState] = usePatchTeklifTalebiAdminMutation();

  if (!talep) return null;

  const users = usersData ?? [];

  async function handleDurumChange(durum: TalepDurum) {
    if (!talep) return;
    try {
      await patchTalep({ id: talep.id, body: { durum } }).unwrap();
      toast.success(t('admin.erp.common.updated', { item: t('admin.erp.teklifTalepleri.singular') }));
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t('admin.erp.common.operationFailed'));
    }
  }

  async function handleAssign(userId: string) {
    if (!talep) return;
    try {
      await patchTalep({ id: talep.id, body: { atananUserId: userId === 'none' ? null : userId } }).unwrap();
      toast.success(t('admin.erp.common.updated', { item: t('admin.erp.teklifTalepleri.singular') }));
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t('admin.erp.common.operationFailed'));
    }
  }

  const canDonustur = talep.durum !== 'teklife_donustu' && talep.durum !== 'istenmeyen';

  return (
    <>
      <Sheet open={!!talep} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {talep.firma || talep.ad}
              <Badge variant={TALEP_DURUM_BADGE[talep.durum]}>
                {t(`admin.erp.teklifTalepleri.statuses.${talep.durum}`)}
              </Badge>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5 px-4 pb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Ad</p>
                <p className="font-medium">{talep.ad || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Firma</p>
                <p className="font-medium">{talep.firma || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">E-Posta</p>
                <p className="font-medium">{talep.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefon</p>
                <p className="font-medium">{talep.telefon || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kaynak</p>
                <p className="font-medium">{talep.kaynakSayfa || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tarih</p>
                <p className="font-medium">{talep.createdAt ? talep.createdAt.slice(0, 10) : '—'}</p>
              </div>
            </div>

            <Separator />

            {talep.konu && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Konu</p>
                <p className="text-sm">{talep.konu}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('admin.erp.teklifTalepleri.detail.mesaj')}</p>
              <p className="text-sm whitespace-pre-line">{talep.mesaj || '—'}</p>
            </div>

            {talep.seciliUrunler.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t('admin.erp.teklifTalepleri.detail.seciliUrunler')}</p>
                <ul className="list-disc pl-4 text-sm space-y-0.5">
                  {talep.seciliUrunler.map((u, i) => (
                    <li key={i}>{u.ad ?? u.urunId}{u.miktar != null ? ` — ${u.miktar}` : ''}</li>
                  ))}
                </ul>
              </div>
            )}

            {talep.utm && Object.keys(talep.utm).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t('admin.erp.teklifTalepleri.detail.utmBilgisi')}</p>
                <pre className="rounded-md bg-muted/40 p-2 text-xs overflow-x-auto">{JSON.stringify(talep.utm, null, 2)}</pre>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t('admin.erp.teklifTalepleri.columns.durum')}</p>
                <Select value={talep.durum} onValueChange={(v) => handleDurumChange(v as TalepDurum)} disabled={patchState.isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURUM_VALUES.map((d) => (
                      <SelectItem key={d} value={d}>{t(`admin.erp.teklifTalepleri.statuses.${d}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t('admin.erp.teklifTalepleri.detail.atananKullanici')}</p>
                <Select value={talep.atananUserId ?? 'none'} onValueChange={handleAssign} disabled={patchState.isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('admin.erp.common.notSelected')}</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.full_name || u.email || u.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {talep.teklifId ? (
              <Button asChild className="w-full">
                <Link href={`/admin/teklifler/${talep.teklifId}`}>{t('admin.erp.teklifler.title')} →</Link>
              </Button>
            ) : (
              <Button className="w-full" onClick={() => setDonusturOpen(true)} disabled={!canDonustur}>
                {t('admin.erp.teklifTalepleri.detail.donusturBaslik')}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <TalepDonusturDialog open={donusturOpen} onClose={() => setDonusturOpen(false)} talep={talep} />
    </>
  );
}
