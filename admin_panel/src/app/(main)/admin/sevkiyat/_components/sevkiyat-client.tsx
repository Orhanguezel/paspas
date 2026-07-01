'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, ChevronRight, Package, Pencil, RefreshCcw, Search, Send, Truck, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

import { useLocaleContext } from '@/i18n/LocaleProvider';
import {
  useListBekleyenlerAdminQuery,
  useListSiparissizAdminQuery,
  useListSevkEmirleriAdminQuery,
  useCreateSevkEmriAdminMutation,
  useUpdateSevkEmriAdminMutation,
} from '@/integrations/endpoints/admin/erp/sevkiyat_admin.endpoints';
import { useListMusterilerAdminQuery } from '@/integrations/endpoints/admin/erp/musteriler_admin.endpoints';
import { useStatusQuery } from '@/integrations/endpoints/users/auth_public.endpoints';
import type { BekleyenSatirDto, SevkEmriDto, SiparissizUrunDto } from '@/integrations/shared/erp/sevkiyat.types';
import { SEVK_DURUM_LABELS, SEVK_DURUM_BADGE } from '@/integrations/shared/erp/sevkiyat.types';
import type { AuthStatusResponse } from '@/integrations/shared/users/auth.public';
import { normalizeMeFromStatus } from '@/integrations/shared/users/auth.public';

type Gruplama = 'musteri' | 'urun' | 'duz';
type SevkDurum = 'bekliyor' | 'onaylandi' | 'sevk_edildi' | 'iptal';
type EmirDurumFilter = 'aktif' | 'all' | SevkDurum;

const AKTIF_SEVK_DURUMLARI = new Set(['bekliyor', 'onaylandi']);

function getApiErrorMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'data' in error &&
    error.data &&
    typeof error.data === 'object' &&
    'error' in error.data &&
    error.data.error &&
    typeof error.data.error === 'object' &&
    'message' in error.data.error &&
    typeof error.data.error.message === 'string'
  ) {
    return error.data.error.message;
  }
  return null;
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export default function SevkiyatClient() {
  const { t } = useLocaleContext();
  const statusQ = useStatusQuery();
  const currentUser = normalizeMeFromStatus(statusQ.data as AuthStatusResponse | undefined);
  const isAdmin = currentUser?.isAdmin ?? false;
  const currentRole = currentUser?.role as string | undefined;
  // Sevkiyatçı rolü DB'de 'sevkiyatci' olarak tutulur; panelde 'nakliyeci'ye
  // eşlenir. İkisini de kapsa — aksi halde 'sevkiyatci' kullanıcı admin
  // sekmelerini (Sevk Bekleyenler / Sevk Emirleri) görüyordu.
  const isNakliyeciOnly = !isAdmin && (currentRole === 'nakliyeci' || currentRole === 'sevkiyatci');
  const [tab, setTab] = useState<string>(isAdmin ? 'bekleyenler' : isNakliyeciOnly ? 'yukle' : 'emirler');
  const effectiveTab = isNakliyeciOnly ? 'yukle' : isAdmin ? tab : 'emirler';

  if (isNakliyeciOnly) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 overflow-x-hidden pb-8">
        <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Truck className="size-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black leading-tight">Yükle/Sevket</h1>
              <p className="mt-1 text-sm text-white/70">Onaylı sevk emirlerini yükle ve sevk et.</p>
            </div>
          </div>
        </div>

        <EmirleriTab shipperMode />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">{t('admin.erp.sevkiyat.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.erp.sevkiyat.description')}</p>
      </div>

      <Tabs value={effectiveTab} onValueChange={setTab}>
        <TabsList>
          {isAdmin && (
            <TabsTrigger value="bekleyenler">
              <Package className="size-4 mr-2" />
              {t('admin.erp.sevkiyat.tabs.bekleyenler')}
            </TabsTrigger>
          )}
          {!isNakliyeciOnly && (
            <TabsTrigger value="emirler">
              <Truck className="size-4 mr-2" />
              {t('admin.erp.sevkiyat.tabs.emirler')}
            </TabsTrigger>
          )}
          {isNakliyeciOnly && (
            <TabsTrigger value="yukle">
              <Truck className="size-4 mr-2" />
              Yükle/Sevket
            </TabsTrigger>
          )}
        </TabsList>

        {isAdmin && (
          <TabsContent value="bekleyenler">
            <BekleyenlerTab />
          </TabsContent>
        )}
        <TabsContent value="emirler">
          <EmirleriTab />
        </TabsContent>
        <TabsContent value="yukle">
          <EmirleriTab shipperMode />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Bekleyenler Tab ──────────────────────────────────────────
function BekleyenlerTab() {
  const { t } = useLocaleContext();
  const [q, setQ] = useState('');
  const [stokFiltre, setStokFiltre] = useState<'stoklu' | 'tumu'>('stoklu');
  const [gruplama, setGruplama] = useState<Gruplama>('musteri');
  const [dialogSatir, setDialogSatir] = useState<BekleyenSatirDto | null>(null);
  const [siparissizDialog, setSiparissizDialog] = useState<SiparissizUrunDto | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useListBekleyenlerAdminQuery({
    q: q.trim() || undefined,
    stokFiltre,
    limit: 200,
  });
  const { data: siparissizData } = useListSiparissizAdminQuery(
    gruplama === 'urun' ? { q: q.trim() || undefined, limit: 200 } : undefined,
    { skip: gruplama !== 'urun' },
  );

  const items = data?.items ?? [];
  const siparissizItems = siparissizData?.items ?? [];

  // Gruplama
  const grouped = useMemo(() => {
    if (gruplama === 'musteri') {
      const map = new Map<string, { label: string; items: BekleyenSatirDto[] }>();
      for (const item of items) {
        const key = item.musteriId;
        if (!map.has(key)) map.set(key, { label: item.musteriAd || '—', items: [] });
        map.get(key)!.items.push(item);
      }
      return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'tr'));
    }
    if (gruplama === 'urun') {
      const map = new Map<string, { label: string; kod: string; items: BekleyenSatirDto[] }>();
      for (const item of items) {
        const key = item.urunId;
        if (!map.has(key)) map.set(key, { label: item.urunAd || '—', kod: item.urunKod || '', items: [] });
        map.get(key)!.items.push(item);
      }
      return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'tr'));
    }
    return null;
  }, [items, gruplama]);

  return (
    <div className="space-y-3">
      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('admin.erp.sevkiyat.filters.ara')}</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('admin.erp.sevkiyat.filters.araPlaceholder')}
              className="pl-7 w-64 h-8"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('admin.erp.sevkiyat.filters.stok')}</Label>
          <Select value={stokFiltre} onValueChange={(v) => setStokFiltre(v as 'stoklu' | 'tumu')}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stoklu">{t('admin.erp.sevkiyat.filters.stoklu')}</SelectItem>
              <SelectItem value="tumu">{t('admin.erp.sevkiyat.filters.tumu')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('admin.erp.sevkiyat.gruplama.label')}</Label>
          <Select value={gruplama} onValueChange={(v) => setGruplama(v as Gruplama)}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="musteri">{t('admin.erp.sevkiyat.gruplama.musteri')}</SelectItem>
              <SelectItem value="urun">{t('admin.erp.sevkiyat.gruplama.urun')}</SelectItem>
              <SelectItem value="duz">{t('admin.erp.sevkiyat.gruplama.duz')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
        </Button>

        <div className="ml-auto text-sm text-muted-foreground">
          {data?.total ?? 0} {t('admin.erp.sevkiyat.satirBekliyor')}
        </div>
      </div>

      {/* Tablo */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error) ?? t('admin.erp.common.operationFailed')} onRetry={() => refetch()} />
      ) : items.length === 0 && siparissizItems.length === 0 ? (
        <div className="rounded-md border py-12 text-center text-sm text-muted-foreground">
          {t('admin.erp.sevkiyat.noData')}
        </div>
      ) : gruplama === 'duz' ? (
        <FlatTable items={items} onSevkEt={setDialogSatir} />
      ) : gruplama === 'musteri' && grouped ? (
        <div className="space-y-2">
          {grouped.map((group) => (
            <GroupSection key={group.label} title={group.label} count={group.items.length}>
              <FlatTable items={group.items} onSevkEt={setDialogSatir} compact />
            </GroupSection>
          ))}
        </div>
      ) : gruplama === 'urun' && grouped ? (
        <div className="space-y-2">
          {grouped.map((group) => (
            <GroupSection key={group.label} title={`${'kod' in group ? group.kod : ''} — ${group.label}`} count={group.items.length}>
              <UrunGrupTable items={group.items} onSevkEt={setDialogSatir} />
            </GroupSection>
          ))}
          {siparissizItems.length > 0 && (
            <GroupSection title={t('admin.erp.sevkiyat.siparissiz.title')} count={siparissizItems.length} defaultOpen={false}>
              <SiparissizTable items={siparissizItems} onSevkEt={setSiparissizDialog} />
            </GroupSection>
          )}
        </div>
      ) : null}

      <SevkEmriDialog satir={dialogSatir} onClose={() => setDialogSatir(null)} />
      <SiparissizSevkDialog urun={siparissizDialog} onClose={() => setSiparissizDialog(null)} />
    </div>
  );
}

// ─── Collapsible Group Section ────────────────────────────────
function GroupSection({ title, count, children, defaultOpen = true }: {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-md border">
      <button
        type="button"
        className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        <span className="truncate">{title}</span>
        <Badge variant="secondary" className="ml-auto text-[10px]">{count}</Badge>
      </button>
      {open && <div className="border-t">{children}</div>}
    </div>
  );
}

// ─── Flat Table (düz/müşteri grup içi) ───────────────────────
function FlatTable({ items, onSevkEt, compact }: {
  items: BekleyenSatirDto[];
  onSevkEt: (s: BekleyenSatirDto) => void;
  compact?: boolean;
}) {
  const { t } = useLocaleContext();
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">{t('admin.erp.sevkiyat.columns.siparisNo')}</TableHead>
            {!compact && <TableHead>{t('admin.erp.sevkiyat.columns.musteri')}</TableHead>}
            <TableHead>{t('admin.erp.sevkiyat.columns.urunKod')}</TableHead>
            <TableHead>{t('admin.erp.sevkiyat.columns.urunAd')}</TableHead>
            <TableHead className="text-right">{t('admin.erp.sevkiyat.columns.siparisMiktar')}</TableHead>
            <TableHead className="text-right">{t('admin.erp.sevkiyat.columns.sevkEdilen')}</TableHead>
            <TableHead className="text-right">{t('admin.erp.sevkiyat.columns.onayli')}</TableHead>
            <TableHead className="text-right">{t('admin.erp.sevkiyat.columns.acikEmir')}</TableHead>
            <TableHead className="text-right">{t('admin.erp.sevkiyat.columns.kalan')}</TableHead>
            <TableHead className="text-right">{t('admin.erp.sevkiyat.columns.stok')}</TableHead>
            <TableHead className="w-24">{t('admin.erp.sevkiyat.columns.termin')}</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => {
            const stokYetersiz = row.stokMiktar < row.kalanMiktar;
            return (
              <TableRow key={row.siparisKalemId}>
                <TableCell className="font-mono text-xs">{row.siparisNo}</TableCell>
                {!compact && <TableCell className="text-xs truncate max-w-[150px]">{row.musteriAd}</TableCell>}
                <TableCell className="font-mono text-xs">{row.urunKod}</TableCell>
                <TableCell className="text-xs truncate max-w-[180px]">{row.urunAd}</TableCell>
                <TableCell className="text-right text-xs">{row.siparisMiktar}</TableCell>
                <TableCell className="text-right text-xs">{row.sevkEdilenMiktar}</TableCell>
                <TableCell className="text-right text-xs font-medium text-violet-700">{row.onayliSevkEmriMiktar}</TableCell>
                <TableCell className="text-right text-xs font-medium text-sky-700">{row.acikSevkEmriMiktar}</TableCell>
                <TableCell className="text-right text-xs font-medium">{row.kalanMiktar}</TableCell>
                <TableCell className={`text-right text-xs ${stokYetersiz ? 'text-amber-600 font-medium' : ''}`}>
                  {row.stokMiktar}
                  {stokYetersiz && <AlertTriangle className="inline-block size-3 ml-1 -mt-0.5" />}
                </TableCell>
                <TableCell className="text-xs">{formatShortDate(row.terminTarihi)}</TableCell>
                <TableCell>
                  {row.acikSevkEmriMiktar > 0 ? (
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary" className="h-6 whitespace-nowrap text-[10px]">
                        {t('admin.erp.sevkiyat.actions.sevkEmriVar')}
                      </Badge>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onSevkEt(row)}>
                        <Send className="size-3 mr-1" />
                        Yeni Sevk Emri Oluştur
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onSevkEt(row)}>
                      <Send className="size-3 mr-1" />
                      {t('admin.erp.sevkiyat.actions.olustur')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Ürün Grup İçi Table (müşteri + miktar) ──────────────────
function UrunGrupTable({ items, onSevkEt }: {
  items: BekleyenSatirDto[];
  onSevkEt: (s: BekleyenSatirDto) => void;
}) {
  const { t } = useLocaleContext();
  const toplamKalan = items.reduce((s, i) => s + i.kalanMiktar, 0);
  const stokMiktar = items[0]?.stokMiktar ?? 0;
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">{t('admin.erp.sevkiyat.columns.siparisNo')}</TableHead>
            <TableHead>{t('admin.erp.sevkiyat.columns.musteri')}</TableHead>
            <TableHead className="text-right">{t('admin.erp.sevkiyat.columns.siparisMiktar')}</TableHead>
            <TableHead className="text-right">{t('admin.erp.sevkiyat.columns.sevkEdilen')}</TableHead>
            <TableHead className="text-right">{t('admin.erp.sevkiyat.columns.onayli')}</TableHead>
            <TableHead className="text-right">{t('admin.erp.sevkiyat.columns.acikEmir')}</TableHead>
            <TableHead className="text-right">{t('admin.erp.sevkiyat.columns.kalan')}</TableHead>
            <TableHead className="w-24">{t('admin.erp.sevkiyat.columns.termin')}</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.siparisKalemId}>
              <TableCell className="font-mono text-xs">{row.siparisNo}</TableCell>
              <TableCell className="text-xs truncate max-w-[150px]">{row.musteriAd}</TableCell>
              <TableCell className="text-right text-xs">{row.siparisMiktar}</TableCell>
              <TableCell className="text-right text-xs">{row.sevkEdilenMiktar}</TableCell>
              <TableCell className="text-right text-xs font-medium text-violet-700">{row.onayliSevkEmriMiktar}</TableCell>
              <TableCell className="text-right text-xs font-medium text-sky-700">{row.acikSevkEmriMiktar}</TableCell>
              <TableCell className="text-right text-xs font-medium">{row.kalanMiktar}</TableCell>
              <TableCell className="text-xs">{formatShortDate(row.terminTarihi)}</TableCell>
              <TableCell>
                {row.acikSevkEmriMiktar > 0 ? (
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="h-6 whitespace-nowrap text-[10px]">
                      {t('admin.erp.sevkiyat.actions.sevkEmriVar')}
                    </Badge>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onSevkEt(row)}>
                      <Send className="size-3 mr-1" />
                      Yeni Sevk Emri Oluştur
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onSevkEt(row)}>
                    <Send className="size-3 mr-1" />
                    {t('admin.erp.sevkiyat.actions.olustur')}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center gap-4 px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30">
        <span>{t('admin.erp.sevkiyat.columns.toplamKalan')}: <strong>{toplamKalan}</strong></span>
        <span className={stokMiktar < toplamKalan ? 'text-amber-600 font-medium' : ''}>
          {t('admin.erp.sevkiyat.columns.stok')}: <strong>{stokMiktar}</strong>
          {stokMiktar < toplamKalan && <AlertTriangle className="inline-block size-3 ml-1 -mt-0.5" />}
        </span>
      </div>
    </div>
  );
}

// ─── Siparişsiz Ürünler Tablosu ──────────────────────────────
function SiparissizTable({ items, onSevkEt }: {
  items: SiparissizUrunDto[];
  onSevkEt: (u: SiparissizUrunDto) => void;
}) {
  const { t } = useLocaleContext();
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin.erp.sevkiyat.columns.urunKod')}</TableHead>
            <TableHead>{t('admin.erp.sevkiyat.columns.urunAd')}</TableHead>
            <TableHead className="text-right">{t('admin.erp.sevkiyat.columns.stok')}</TableHead>
            <TableHead>{t('admin.erp.sevkiyat.columns.birim')}</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((u) => (
            <TableRow key={u.urunId}>
              <TableCell className="font-mono text-xs">{u.urunKod}</TableCell>
              <TableCell className="text-xs">{u.urunAd}</TableCell>
              <TableCell className="text-right text-xs font-medium">{u.stokMiktar}</TableCell>
              <TableCell className="text-xs">{u.birim}</TableCell>
              <TableCell>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onSevkEt(u)}>
                  <Send className="size-3 mr-1" /> {t('admin.erp.sevkiyat.actions.sevkEt')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Sevk Emri Oluşturma Dialog (siparişli) ──────────────────
function SevkEmriDialog({ satir, onClose }: { satir: BekleyenSatirDto | null; onClose: () => void }) {
  const { t } = useLocaleContext();
  const [miktar, setMiktar] = useState('');
  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10));
  const [notlar, setNotlar] = useState('');
  const [create, { isLoading }] = useCreateSevkEmriAdminMutation();

  const open = !!satir;
  const miktarNum = Number(miktar);
  const stokAsimi = satir ? miktarNum > satir.stokMiktar : false;

  function handleOpen() {
    if (satir) {
      setMiktar(String(satir.kalanMiktar));
      setTarih(new Date().toISOString().slice(0, 10));
      setNotlar('');
    }
  }

  async function handleSubmit() {
    if (!satir || !miktarNum || miktarNum <= 0) return;
    try {
      await create({
        siparisId: satir.siparisId,
        siparisKalemId: satir.siparisKalemId,
        musteriId: satir.musteriId,
        urunId: satir.urunId,
        miktar: miktarNum,
        tarih,
        notlar: notlar.trim() || undefined,
      }).unwrap();
      toast.success(t('admin.erp.sevkiyat.messages.sevkEmriOlusturuldu'));
      onClose();
    } catch {
      toast.error(t('admin.erp.sevkiyat.messages.hata'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); else handleOpen(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin.erp.sevkiyat.dialog.title')}</DialogTitle>
          <DialogDescription>
            {satir?.urunKod} — {satir?.urunAd}
          </DialogDescription>
        </DialogHeader>

        {satir && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">{t('admin.erp.sevkiyat.columns.musteri')}:</span>
                <span className="ml-1 font-medium">{satir.musteriAd}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('admin.erp.sevkiyat.columns.siparisNo')}:</span>
                <span className="ml-1 font-mono">{satir.siparisNo}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('admin.erp.sevkiyat.columns.kalan')}:</span>
                <span className="ml-1 font-medium">{satir.kalanMiktar}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('admin.erp.sevkiyat.columns.stok')}:</span>
                <span className="ml-1 font-medium">{satir.stokMiktar}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.erp.sevkiyat.dialog.miktar')}</Label>
              <Input
                type="number"
                value={miktar}
                onChange={(e) => setMiktar(e.target.value)}
                min={0.0001}
                step="any"
              />
              {stokAsimi && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="size-3" />
                  {t('admin.erp.sevkiyat.dialog.stokUyari')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('admin.erp.sevkiyat.dialog.tarih')}</Label>
              <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t('admin.erp.sevkiyat.dialog.notlar')}</Label>
              <Input
                value={notlar}
                onChange={(e) => setNotlar(e.target.value)}
                placeholder={t('admin.erp.sevkiyat.dialog.notlarPlaceholder')}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('admin.erp.sevkiyat.actions.iptal')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !miktarNum || miktarNum <= 0}>
            <Send className="size-4 mr-2" />
            {t('admin.erp.sevkiyat.actions.olustur')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Siparişsiz Sevk Dialog (müşteri seçimi gerekli) ─────────
function SiparissizSevkDialog({ urun, onClose }: { urun: SiparissizUrunDto | null; onClose: () => void }) {
  const { t } = useLocaleContext();
  const [miktar, setMiktar] = useState('');
  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10));
  const [musteriId, setMusteriId] = useState('');
  const [notlar, setNotlar] = useState('');
  const [create, { isLoading }] = useCreateSevkEmriAdminMutation();
  const { data: musterilerData } = useListMusterilerAdminQuery({ tur: 'musteri' });
  const musteriler = musterilerData?.items ?? [];

  const open = !!urun;
  const miktarNum = Number(miktar);
  const stokAsimi = urun ? miktarNum > urun.stokMiktar : false;

  function handleOpen() {
    if (urun) {
      setMiktar('1');
      setTarih(new Date().toISOString().slice(0, 10));
      setMusteriId('');
      setNotlar('');
    }
  }

  async function handleSubmit() {
    if (!urun || !miktarNum || miktarNum <= 0 || !musteriId) return;
    try {
      await create({
        musteriId,
        urunId: urun.urunId,
        miktar: miktarNum,
        tarih,
        notlar: notlar.trim() || undefined,
      }).unwrap();
      toast.success(t('admin.erp.sevkiyat.messages.sevkEmriOlusturuldu'));
      onClose();
    } catch {
      toast.error(t('admin.erp.sevkiyat.messages.hata'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); else handleOpen(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin.erp.sevkiyat.siparissiz.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {urun?.urunKod} — {urun?.urunAd} (Stok: {urun?.stokMiktar})
          </DialogDescription>
        </DialogHeader>

        {urun && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.erp.sevkiyat.siparissiz.musteriLabel')}</Label>
              <Select value={musteriId || '_none'} onValueChange={(v) => setMusteriId(v === '_none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.erp.sevkiyat.siparissiz.musteriPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none" disabled>{t('admin.erp.sevkiyat.siparissiz.musteriPlaceholder')}</SelectItem>
                  {musteriler.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.ad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.erp.sevkiyat.dialog.miktar')}</Label>
              <Input
                type="number"
                value={miktar}
                onChange={(e) => setMiktar(e.target.value)}
                min={0.0001}
                step="any"
              />
              {stokAsimi && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="size-3" />
                  {t('admin.erp.sevkiyat.dialog.stokUyari')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('admin.erp.sevkiyat.dialog.tarih')}</Label>
              <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t('admin.erp.sevkiyat.dialog.notlar')}</Label>
              <Input
                value={notlar}
                onChange={(e) => setNotlar(e.target.value)}
                placeholder={t('admin.erp.sevkiyat.dialog.notlarPlaceholder')}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('admin.erp.sevkiyat.actions.iptal')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !miktarNum || miktarNum <= 0 || !musteriId}>
            <Send className="size-4 mr-2" />
            {t('admin.erp.sevkiyat.actions.olustur')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sevk Emirleri Tab ────────────────────────────────────────
function EmirleriTab({ shipperMode = false }: { shipperMode?: boolean }) {
  const { t } = useLocaleContext();
  const statusQ = useStatusQuery();
  const currentUser = normalizeMeFromStatus(statusQ.data as AuthStatusResponse | undefined);
  const isAdmin = currentUser?.isAdmin ?? false;
  const currentRole = currentUser?.role as string | undefined;
  const canShipPhysically = isAdmin || currentRole === 'sevkiyatci' || currentRole === 'nakliyeci';
  const [q, setQ] = useState('');
  const [durumFilter, setDurumFilter] = useState<EmirDurumFilter>('aktif');
  const [physicalShipTarget, setPhysicalShipTarget] = useState<SevkEmriDto | null>(null);
  const [editTarget, setEditTarget] = useState<SevkEmriDto | null>(null);
  const [updateEmri, updateState] = useUpdateSevkEmriAdminMutation();

  const { data, isLoading, isFetching, isError, error, refetch } = useListSevkEmirleriAdminQuery({
    q: q.trim() || undefined,
    durum: durumFilter === 'aktif' || durumFilter === 'all' ? undefined : durumFilter,
    limit: 100,
  });
  const items = useMemo(() => {
    const rawItems = data?.items ?? [];
    if (durumFilter !== 'aktif') return rawItems;
    return rawItems.filter((row) => AKTIF_SEVK_DURUMLARI.has(row.durum));
  }, [data?.items, durumFilter]);
  const visibleTotal = durumFilter === 'aktif' ? items.length : (data?.total ?? items.length);

  async function handleDurumChange(id: string, durum: SevkDurum, miktar?: number) {
    try {
      await updateEmri({ id, body: { durum, miktar } }).unwrap();
      toast.success(t('admin.erp.sevkiyat.messages.durumGuncellendi', { durum: SEVK_DURUM_LABELS[durum]?.toLowerCase() ?? durum }));
      setPhysicalShipTarget(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error) ?? t('admin.erp.sevkiyat.messages.durumHata'));
    }
  }

  return (
    <div className={shipperMode ? 'space-y-4 overflow-x-hidden' : 'space-y-3'}>
      {shipperMode ? (
        <div className="space-y-3 rounded-2xl border bg-card p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-muted-foreground">Aktif sevk emirleri</div>
              <div className="mt-1 text-2xl font-black leading-none">{visibleTotal}</div>
            </div>
            <Button variant="outline" className="h-12 shrink-0 rounded-xl px-4" onClick={() => refetch()} disabled={isFetching} aria-label="Yenile">
              <RefreshCcw className={`size-5${isFetching ? ' animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('admin.erp.sevkiyat.filters.araPlaceholder')}
              className="h-12 rounded-xl pl-10 text-base"
            />
          </div>
        </div>
      ) : <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('admin.erp.sevkiyat.filters.ara')}</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('admin.erp.sevkiyat.filters.araPlaceholder')}
              className="pl-7 w-64 h-8"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('admin.erp.sevkiyat.filters.durum')}</Label>
          <Select value={durumFilter} onValueChange={(v) => setDurumFilter(v as EmirDurumFilter)}>
            <SelectTrigger className="w-48 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aktif">{t('admin.erp.sevkiyat.filters.aktifDurumlar')}</SelectItem>
              <SelectItem value="all">{t('admin.erp.sevkiyat.filters.tumDurumlar')}</SelectItem>
              <SelectItem value="bekliyor">{t('admin.erp.sevkiyat.durumlar.bekliyor')}</SelectItem>
              <SelectItem value="onaylandi">{t('admin.erp.sevkiyat.durumlar.onaylandi')}</SelectItem>
              <SelectItem value="sevk_edildi">{t('admin.erp.sevkiyat.durumlar.sevk_edildi')}</SelectItem>
              <SelectItem value="iptal">{t('admin.erp.sevkiyat.durumlar.iptal')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
        </Button>

        <div className="ml-auto text-sm text-muted-foreground">
          {visibleTotal} {t('admin.erp.sevkiyat.sevkEmri')}
        </div>
      </div>}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className={shipperMode ? 'h-56 w-full rounded-xl' : 'h-10 w-full'} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error) ?? t('admin.erp.common.operationFailed')} onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <div className="rounded-xl border py-12 text-center text-sm text-muted-foreground">
          {t('admin.erp.sevkiyat.noData')}
        </div>
      ) : shipperMode ? (
        <div className="grid grid-cols-1 gap-4">
          {items.map((row) => {
            const stokYetersiz = row.stokMiktar < row.miktar;
            return (
              <div key={row.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <div className="font-mono text-xs font-semibold text-muted-foreground">{row.sevkEmriNo}</div>
                      <div className="break-words text-xl font-black leading-tight text-foreground">{row.musteriAd ?? '—'}</div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {row.otomatikOlusturuldu && (
                        <Badge variant="outline" className="text-[10px]">
                          Otomatik
                        </Badge>
                      )}
                      <Badge variant={SEVK_DURUM_BADGE[row.durum] ?? 'outline'} className="px-3 py-1 text-xs">
                        {SEVK_DURUM_LABELS[row.durum] ?? row.durum}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/35 p-3">
                    <div className="break-words text-base font-bold leading-snug">{row.urunAd ?? '—'}</div>
                    <div className="mt-1 break-words font-mono text-sm text-muted-foreground">{row.urunKod ?? '—'}</div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border bg-background p-3">
                      <div className="text-xs font-medium text-muted-foreground">Miktar</div>
                      <div className="mt-1 text-2xl font-black tabular-nums">{row.miktar}</div>
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                      <div className="text-xs font-medium text-muted-foreground">Stok</div>
                      <div className={`mt-1 flex items-center gap-2 text-2xl font-black tabular-nums ${stokYetersiz ? 'text-amber-600' : ''}`}>
                        {row.stokMiktar}
                        {stokYetersiz && <AlertTriangle className="size-5" />}
                      </div>
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                      <div className="text-xs font-medium text-muted-foreground">Tarih</div>
                      <div className="mt-2 text-lg font-bold tabular-nums">{formatShortDate(row.tarih)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-1 text-xs font-semibold uppercase text-muted-foreground">
                    <div className="h-px bg-border" />
                    <span>Yükle / Sevk Et</span>
                    <div className="h-px bg-border" />
                  </div>
                </div>

                <div className="border-t bg-muted/20 p-4">
                  {row.durum === 'bekliyor' ? (
                    <Button className="min-h-14 w-full rounded-xl text-base font-bold" variant="outline" disabled>
                      <Check className="size-5" />
                      Admin onayı bekliyor
                    </Button>
                  ) : row.durum === 'onaylandi' ? (
                    <Button
                      className="min-h-16 w-full rounded-xl text-lg font-black"
                      onClick={() => setPhysicalShipTarget(row)}
                      disabled={updateState.isLoading || !canShipPhysically}
                    >
                      <Truck className="size-6" />
                      Yükle / Sevk Et
                    </Button>
                  ) : (
                    <Button className="min-h-14 w-full rounded-xl text-base font-bold" variant="secondary" disabled>
                      {SEVK_DURUM_LABELS[row.durum] ?? row.durum}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">{t('admin.erp.sevkiyat.columns.sevkEmriNo')}</TableHead>
                <TableHead>{t('admin.erp.sevkiyat.columns.musteri')}</TableHead>
                <TableHead>{t('admin.erp.sevkiyat.columns.urunKod')}</TableHead>
                <TableHead>{t('admin.erp.sevkiyat.columns.urunAd')}</TableHead>
                <TableHead className="text-right">{t('admin.erp.sevkiyat.columns.miktar')}</TableHead>
                <TableHead className="w-24">{t('admin.erp.sevkiyat.columns.tarih')}</TableHead>
                <TableHead className="w-24">{t('admin.erp.sevkiyat.columns.durum')}</TableHead>
                <TableHead className="w-32">{t('admin.erp.sevkiyat.columns.islem')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.sevkEmriNo}</TableCell>
                  <TableCell className="text-xs truncate max-w-[150px]">{row.musteriAd ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{row.urunKod ?? '—'}</TableCell>
                  <TableCell className="text-xs truncate max-w-[180px]">{row.urunAd ?? '—'}</TableCell>
                  <TableCell className="text-right text-xs">{row.miktar}</TableCell>
                  <TableCell className="text-xs">{formatShortDate(row.tarih)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      {row.otomatikOlusturuldu && (
                        <Badge variant="outline" className="text-[10px]">
                          Otomatik
                        </Badge>
                      )}
                      <Badge variant={SEVK_DURUM_BADGE[row.durum] ?? 'outline'} className="text-[10px]">
                        {SEVK_DURUM_LABELS[row.durum] ?? row.durum}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {row.durum === 'bekliyor' && isAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[10px] px-2"
                            onClick={() => handleDurumChange(row.id, 'onaylandi')}
                            disabled={updateState.isLoading}
                          >
                            <Check className="size-3 mr-0.5" /> {t('admin.erp.sevkiyat.actions.onayla')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] px-1 text-destructive hover:text-destructive"
                            onClick={() => handleDurumChange(row.id, 'iptal')}
                            disabled={updateState.isLoading}
                          >
                            <X className="size-3" />
                          </Button>
                        </>
                      )}
                      {row.durum === 'bekliyor' && !isAdmin && (
                        <span className="text-[10px] text-muted-foreground">
                          {t('admin.erp.sevkiyat.messages.adminOnayiBekleniyor')}
                        </span>
                      )}
                      {row.durum === 'onaylandi' && canShipPhysically && (
                        <>
                          <Button
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={() => setPhysicalShipTarget(row)}
                            disabled={updateState.isLoading}
                          >
                            <Truck className="size-3 mr-0.5" /> {t('admin.erp.sevkiyat.actions.fizikselSevkEt')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] px-1 text-destructive hover:text-destructive"
                            onClick={() => handleDurumChange(row.id, 'iptal')}
                            disabled={updateState.isLoading}
                          >
                            <X className="size-3" />
                          </Button>
                        </>
                      )}
                      {row.durum === 'onaylandi' && !canShipPhysically && (
                        <span className="text-[10px] text-muted-foreground">
                          {t('admin.erp.sevkiyat.messages.fizikselSevkBekliyor')}
                        </span>
                      )}
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          onClick={() => setEditTarget(row)}
                          disabled={updateState.isLoading}
                        >
                          <Pencil className="size-3 mr-0.5" /> {t('admin.erp.sevkiyat.actions.duzenle')}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <PhysicalShipDialog
        row={physicalShipTarget}
        onClose={() => setPhysicalShipTarget(null)}
        onSubmit={(row, miktar) => handleDurumChange(row.id, 'sevk_edildi', miktar)}
      />
      <EditSevkEmriDialog
        row={editTarget}
        isLoading={updateState.isLoading}
        onClose={() => setEditTarget(null)}
        onSubmit={async (row, patch) => {
          try {
            await updateEmri({
              id: row.id,
              body: { durum: patch.durum, miktar: patch.miktar, tarih: patch.tarih || undefined },
            }).unwrap();
            toast.success(t('admin.erp.sevkiyat.messages.durumGuncellendi', { durum: SEVK_DURUM_LABELS[patch.durum]?.toLowerCase() ?? patch.durum }));
            setEditTarget(null);
          } catch (error) {
            toast.error(getApiErrorMessage(error) ?? t('admin.erp.sevkiyat.messages.durumHata'));
          }
        }}
      />
    </div>
  );
}

function EditSevkEmriDialog({
  row,
  isLoading,
  onClose,
  onSubmit,
}: {
  row: SevkEmriDto | null;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (row: SevkEmriDto, patch: { durum: SevkDurum; miktar: number; tarih: string }) => Promise<void>;
}) {
  const { t } = useLocaleContext();
  const [miktar, setMiktar] = useState('');
  const [durum, setDurum] = useState<SevkDurum>('bekliyor');
  const [tarih, setTarih] = useState('');

  useEffect(() => {
    if (!row) {
      setMiktar('');
      setDurum('bekliyor');
      setTarih('');
      return;
    }
    setMiktar(String(row.miktar));
    setDurum(row.durum as SevkDurum);
    setTarih(row.tarih ? String(row.tarih).slice(0, 10) : '');
  }, [row]);

  const miktarNum = Number(miktar);

  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.erp.sevkiyat.dialog.editTitle')}</DialogTitle>
          <DialogDescription>
            {row?.sevkEmriNo ?? ''}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>{t('admin.erp.sevkiyat.dialog.miktar')}</Label>
            <Input
              type="number"
              value={miktar}
              onChange={(e) => setMiktar(e.target.value)}
              min={0.0001}
              step="any"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('admin.erp.sevkiyat.dialog.tarih')}</Label>
            <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{t('admin.erp.sevkiyat.filters.durum')}</Label>
            <Select value={durum} onValueChange={(value) => setDurum(value as SevkDurum)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bekliyor">{t('admin.erp.sevkiyat.durumlar.bekliyor')}</SelectItem>
                <SelectItem value="onaylandi">{t('admin.erp.sevkiyat.durumlar.onaylandi')}</SelectItem>
                <SelectItem value="sevk_edildi">{t('admin.erp.sevkiyat.durumlar.sevk_edildi')}</SelectItem>
                <SelectItem value="iptal">{t('admin.erp.sevkiyat.durumlar.iptal')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('admin.erp.sevkiyat.actions.iptal')}
          </Button>
          <Button
            onClick={() => row && onSubmit(row, { durum, miktar: miktarNum, tarih })}
            disabled={isLoading || !miktarNum || miktarNum <= 0}
          >
            {t('admin.erp.sevkiyat.actions.kaydet')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhysicalShipDialog({
  row,
  onClose,
  onSubmit,
}: {
  row: SevkEmriDto | null;
  onClose: () => void;
  onSubmit: (row: SevkEmriDto, miktar: number) => void;
}) {
  const { t } = useLocaleContext();
  const [koli, setKoli] = useState('');
  const [takim, setTakim] = useState('');

  const carpan = row?.koliCarpan && row.koliCarpan > 0 ? row.koliCarpan : null;
  const anaBirim = row?.urunBirim || 'takım';

  useEffect(() => {
    // Varsayılan: emrin miktarını ana birim (takım) alanına koy, koli boş.
    setKoli('');
    setTakim(row ? String(row.miktar) : '');
  }, [row]);

  // Toplam ana birim = koli × çarpan + takım. Koli dönüşümü yoksa sadece takım.
  const koliNum = Number(koli) || 0;
  const takimNum = Number(takim) || 0;
  const toplamMiktar = carpan ? koliNum * carpan + takimNum : takimNum;
  const stokAsimi = row ? toplamMiktar > row.stokMiktar : false;

  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t('admin.erp.sevkiyat.actions.fizikselSevkEt')}</DialogTitle>
          <DialogDescription>{row ? `${row.sevkEmriNo} · ${row.urunKod ?? ''} ${row.urunAd ?? ''}` : ''}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {carpan ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Koli</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    value={koli}
                    onChange={(e) => setKoli(e.target.value)}
                    placeholder="0"
                    className="h-12 rounded-xl text-base font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{anaBirim.charAt(0).toUpperCase() + anaBirim.slice(1)}</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.0001"
                    value={takim}
                    onChange={(e) => setTakim(e.target.value)}
                    placeholder="0"
                    className="h-12 rounded-xl text-base font-semibold"
                  />
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                1 koli = {carpan} {anaBirim} · Toplam:{' '}
                <span className="font-semibold text-foreground">{toplamMiktar} {anaBirim}</span>
              </p>
            </>
          ) : (
            <>
              <Label>Sevk Miktarı ({anaBirim})</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.0001"
                value={takim}
                onChange={(e) => setTakim(e.target.value)}
                className="h-12 rounded-xl text-base font-semibold"
              />
            </>
          )}
          {row && (
            <p className={stokAsimi ? 'text-amber-600 text-sm' : 'text-muted-foreground text-sm'}>
              Stok: {row.stokMiktar}
              {stokAsimi ? ' · Stok yetersiz; sevk edilebilir, stok eksiye düşer (üretim girilince düzelir).' : ''}
            </p>
          )}
        </div>
        <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" className="h-12 rounded-xl" onClick={onClose}>İptal</Button>
          <Button
            className="h-12 rounded-xl font-bold"
            disabled={!row || toplamMiktar <= 0}
            onClick={() => row && onSubmit(row, toplamMiktar)}
          >
            <Truck className="size-4 mr-2" />
            {t('admin.erp.sevkiyat.actions.fizikselSevkEt')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useLocaleContext();

  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm">
      <div className="flex items-center gap-2 font-medium text-destructive">
        <AlertTriangle className="size-4" />
        <span>{t('admin.erp.common.operationFailed')}</span>
      </div>
      <p className="mt-2 text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        <RefreshCcw className="mr-2 size-4" />
        {t('admin.erp.common.refresh')}
      </Button>
    </div>
  );
}
