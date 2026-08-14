'use client';

// =============================================================
// FILE: src/app/(main)/admin/teklifler/[id]/_components/teklif-editor-client.tsx
// Paspas ERP — Teklif Modülü — Teklif düzenleme / detay sayfası
// =============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, RefreshCcw, Plus, Pencil, Trash2, Printer, FileDown, ShoppingCart, Mail, Share2, Save, Link2Off,
  CircleDollarSign, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocaleContext } from '@/i18n/LocaleProvider';
import { resolveBaseUrl } from '@/integrations/apiBase';
import { tokenStore } from '@/integrations/core/token';
import { useStatusQuery } from '@/integrations/hooks';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  useGetTeklifAdminQuery,
  useUpdateTeklifAdminMutation,
  useSetTeklifDurumAdminMutation,
  useGonderTeklifAdminMutation,
  useUpdateTeklifPublicLinkAdminMutation,
  useOnayaGonderTeklifAdminMutation,
  useOnaylaIskontoAdminMutation,
  useReddetIskontoAdminMutation,
  useCreateTeklifRevizyonAdminMutation,
  useConvertTeklifToSiparisAdminMutation,
  usePatchTeklifKalemAdminMutation,
  useDeleteTeklifKalemAdminMutation,
} from '@/integrations/endpoints/admin/erp/teklifler_admin.endpoints';
import { useListMusterilerAdminQuery } from '@/integrations/endpoints/admin/erp/musteriler_admin.endpoints';
import type { TeklifDurum, TeklifKalemDto, TeklifPatchPayload } from '@/integrations/shared/erp/teklifler.types';
import { TEKLIF_DURUM_BADGE, TEKLIF_DURUM_GECISLERI, TEKLIF_ISKONTO_LIMITLERI_UI } from '@/integrations/shared/erp/teklifler.types';
import TeklifKalemDialog from './teklif-kalem-dialog';
import TeklifPrint from './teklif-print';

const PARA_BIRIMLERI = ['TRY', 'USD', 'EUR'] as const;
const DILLER = ['tr', 'en', 'de'] as const;

const DURUM_ACTION_KEY: Record<TeklifDurum, string> = {
  taslak:        'taslagaDondur',
  onay_bekliyor: 'onayaGonder',
  gonderildi:    'gonderildiIsaretle',
  goruntulendi:  'goruntulendiIsaretle',
  revizyon:      'revizyonaAl',
  kabul:         'kabulEt',
  red:           'reddet',
  suresi_doldu:  'suresiDolduIsaretle',
};

interface HeaderFormState {
  musteriId: string;
  paraBirimi: string;
  dil: string;
  kdvOrani: string;
  kdvDahil: boolean;
  iskontoOrani: string;
  nakliye: string;
  gecerlilikTarihi: string;
  odemeKosullari: string;
  teslimKosullari: string;
  aciklama: string;
}

const EMPTY_FORM: HeaderFormState = {
  musteriId: '',
  paraBirimi: 'TRY',
  dil: 'tr',
  kdvOrani: '20',
  kdvDahil: true,
  iskontoOrani: '0',
  nakliye: '0',
  gecerlilikTarihi: '',
  odemeKosullari: '',
  teslimKosullari: '',
  aciklama: '',
};

function money(n: number, currency: string): string {
  return n.toLocaleString('tr-TR', { style: 'currency', currency: currency || 'TRY' });
}

function apiErrorMessage(err: unknown): string | undefined {
  if (typeof err !== 'object' || !err || !('data' in err)) return undefined;
  return (err as { data?: { error?: { message?: string } } }).data?.error?.message;
}

const GONDERIM_HATALARI: Record<string, string> = {
  iskonto_onayi_gerekli: 'İskonto için yönetici onayı alınmadan teklif gönderilemez.',
  pdf_servisi_kullanilamiyor: 'PDF servisi şu anda kullanılamıyor. Birkaç dakika sonra yeniden deneyin.',
  gecersiz_istek_govdesi: 'Alıcı e-posta adresini kontrol edin.',
  teklif_bulunamadi: 'Teklif bulunamadı veya artık erişilemiyor.',
};

export default function TeklifEditorClient({ id }: { id: string }) {
  const { t } = useLocaleContext();
  const { data, isLoading, isFetching, refetch } = useGetTeklifAdminQuery(id);
  const { data: musterilerData } = useListMusterilerAdminQuery({ tur: 'musteri' });
  const musteriler = musterilerData?.items ?? [];
  const [updateTeklif, updateState] = useUpdateTeklifAdminMutation();
  const [setDurum, setDurumState] = useSetTeklifDurumAdminMutation();
  const [convert, convertState] = useConvertTeklifToSiparisAdminMutation();
  const [gonder, gonderState] = useGonderTeklifAdminMutation();
  const [updatePublicLink, publicLinkState] = useUpdateTeklifPublicLinkAdminMutation();
  const [onayaGonder, onayaGonderState] = useOnayaGonderTeklifAdminMutation();
  const [onaylaIskonto, onaylaState] = useOnaylaIskontoAdminMutation();
  const [reddetIskonto, reddetState] = useReddetIskontoAdminMutation();
  const [createRevizyon, revizyonState] = useCreateTeklifRevizyonAdminMutation();
  const [aliciEmail, setAliciEmail] = useState('');
  const router = useRouter();

  const { data: statusData } = useStatusQuery();
  const currentRole = (statusData as { user?: { role?: string } } | undefined)?.user?.role ?? 'operator';

  async function handleOnayaGonder() {
    try {
      await onayaGonder(id).unwrap();
      await refetch();
      toast.success('Teklif onaya gönderildi.');
    } catch (err: unknown) {
      const msg = typeof err === 'object' && err && 'data' in err
        ? ((err as { data?: { error?: { message?: string } } }).data?.error?.message) : undefined;
      toast.error(msg === 'onay_gerekmiyor' ? 'Bu teklifin iskontosu onay gerektirmiyor.' : 'Onaya gönderilemedi.');
    }
  }

  async function handleOnayla() {
    try {
      await onaylaIskonto(id).unwrap();
      await refetch();
      toast.success('İskonto onaylandı; teklif taslağa döndü, gönderebilirsiniz.');
    } catch { toast.error('Onaylanamadı.'); }
  }

  async function confirmIskontoRed() {
    if (!iskontoRedNedeni.trim()) { toast.error('Red nedeni zorunlu.'); return; }
    try {
      await reddetIskonto({ id, body: { neden: iskontoRedNedeni.trim() } }).unwrap();
      await refetch();
      setIskontoRedDialogOpen(false);
      toast.success('İskonto reddedildi; teklif taslağa döndü.');
    } catch (err: unknown) { toast.error(apiErrorMessage(err) ?? 'Reddedilemedi.'); }
  }

  async function confirmRevizyon() {
    if (!revizyonNedeni.trim()) { toast.error('Revizyon nedeni zorunlu.'); return; }
    try {
      await createRevizyon({ id, body: { neden: revizyonNedeni.trim() } }).unwrap();
      await refetch();
      setRevizyonDialogOpen(false);
      toast.success('Yeni revizyon oluşturuldu; teklif taslağa döndü.');
    } catch (err: unknown) {
      const msg = typeof err === 'object' && err && 'data' in err
        ? ((err as { data?: { error?: { message?: string } } }).data?.error?.message) : undefined;
      toast.error(msg === 'gecersiz_teklif_gecisi' ? 'Bu durumda revizyon oluşturulamaz.' : 'Revizyon oluşturulamadı.');
    }
  }

  function publicLink(token: string): string {
    return `${resolveBaseUrl()}/web/promats/teklif/${token}`;
  }

  async function handleGonderEmail() {
    if (!aliciEmail.trim()) { toast.error('Alıcı e-posta girin.'); return; }
    try {
      await gonder({ id, body: { kanal: 'email', aliciEmail: aliciEmail.trim() } }).unwrap();
      await refetch();
      toast.success('Teklif e-posta ile gönderildi (PDF ekli).');
      setAliciEmail('');
    } catch (err: unknown) {
      const msg = typeof err === 'object' && err && 'data' in err
        ? ((err as { data?: { error?: { message?: string; detail?: string } } }).data?.error) : undefined;
      toast.error(msg?.message === 'eposta_gonderilemedi'
        ? `E-posta gönderilemedi${msg?.detail ? `: ${msg.detail}` : '.'}`
        : (GONDERIM_HATALARI[msg?.message ?? ''] ?? 'Teklif gönderilemedi. Lütfen yeniden deneyin.'));
    }
  }

  async function handleWhatsapp() {
    try {
      const refreshed = await updatePublicLink({ id, body: { islem: 'yenile', gun: 30 } }).unwrap();
      if (!refreshed.goruntulemeToken) throw new Error('token_yenilenemedi');
      const link = publicLink(refreshed.goruntulemeToken);
      await gonder({ id, body: { kanal: 'whatsapp_link' } }).unwrap();
      await refetch();
      let copied = true;
      try { await navigator.clipboard.writeText(link); } catch { copied = false; }
      window.open(`https://wa.me/?text=${encodeURIComponent(`Teklifimiz: ${link}`)}`, '_blank', 'noopener');
      toast.success(copied ? 'Link kopyalandı ve WhatsApp açıldı.' : 'WhatsApp açıldı; bağlantıyı mesajdan paylaşabilirsiniz.');
    } catch (err: unknown) {
      const message = apiErrorMessage(err);
      toast.error(GONDERIM_HATALARI[message ?? ''] ?? 'WhatsApp bağlantısı kaydedilemedi.');
    }
  }

  async function handlePublicLink(islem: 'yenile' | 'iptal') {
    try {
      await updatePublicLink({ id, body: islem === 'yenile' ? { islem, gun: 30 } : { islem } }).unwrap();
      await refetch();
      toast.success(islem === 'yenile' ? '30 günlük yeni public bağlantı oluşturuldu.' : 'Public bağlantı iptal edildi.');
    } catch (err: unknown) { toast.error(apiErrorMessage(err) ?? 'Public bağlantı güncellenemedi.'); }
  }

  async function handleConvert() {
    try {
      const res = await convert(id).unwrap();
      toast.success(`Siparişe dönüştürüldü: ${res.siparisNo}`);
      router.push(`/admin/satis-siparisleri/${res.siparisId}`);
    } catch (err: unknown) {
      const msg = typeof err === 'object' && err && 'data' in err
        ? ((err as { data?: { error?: { message?: string } } }).data?.error?.message) : undefined;
      const map: Record<string, string> = {
        teklif_kabul_edilmemis: 'Yalnız kabul edilmiş teklif siparişe dönüştürülebilir.',
        teklif_zaten_donustu: 'Bu teklif zaten siparişe dönüştürülmüş.',
        urun_esmesi_gerekli: 'Kalemlerde ürün seçili değil; siparişe dönüştürülemez.',
      };
      toast.error(map[msg ?? ''] ?? 'Siparişe dönüştürülemedi.');
    }
  }
  const [deleteKalem, deleteKalemState] = useDeleteTeklifKalemAdminMutation();

  const [form, setForm] = useState<HeaderFormState>(EMPTY_FORM);
  const [kalemDialogOpen, setKalemDialogOpen] = useState(false);
  const [editingKalem, setEditingKalem] = useState<TeklifKalemDto | null>(null);
  const [deleteKalemTarget, setDeleteKalemTarget] = useState<TeklifKalemDto | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [iskontoRedDialogOpen, setIskontoRedDialogOpen] = useState(false);
  const [iskontoRedNedeni, setIskontoRedNedeni] = useState('');
  const [revizyonDialogOpen, setRevizyonDialogOpen] = useState(false);
  const [revizyonNedeni, setRevizyonNedeni] = useState('');
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [patchKalem, patchKalemState] = usePatchTeklifKalemAdminMutation();

  async function handlePdf(mode: 'preview' | 'download') {
    setPdfLoading(true);
    try {
      const token = tokenStore.get();
      const res = await fetch(`${resolveBaseUrl()}/admin/teklifler/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null) as { error?: { message?: string } } | null;
        throw new Error(payload?.error?.message ?? String(res.status));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (mode === 'preview') window.open(url, '_blank', 'noopener');
      else {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${data?.teklifNo ?? 'teklif'}.pdf`;
        anchor.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      toast.error(GONDERIM_HATALARI[message] ?? 'PDF oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setPdfLoading(false);
    }
  }
  const [redDialogOpen, setRedDialogOpen] = useState(false);
  const [redNedeni, setRedNedeni] = useState('');

  const isLocked = data ? data.durum !== 'taslak' : true;

  useEffect(() => {
    if (!data?.kalemler) return;
    setPriceDrafts(Object.fromEntries(data.kalemler.map((kalem) => [kalem.id, String(kalem.birimFiyat)])));
  }, [data?.kalemler]);

  useEffect(() => {
    if (!data) return;
    setForm({
      musteriId: data.musteriId,
      paraBirimi: data.paraBirimi,
      dil: data.dil,
      kdvOrani: String(data.kdvOrani),
      kdvDahil: data.kdvDahil,
      iskontoOrani: String(data.iskontoOrani),
      nakliye: String(data.nakliye),
      gecerlilikTarihi: data.gecerlilikTarihi ?? '',
      odemeKosullari: data.odemeKosullari ?? '',
      teslimKosullari: data.teslimKosullari ?? '',
      aciklama: data.aciklama ?? '',
    });
  }, [data]);

  function patch<K extends keyof HeaderFormState>(key: K, value: HeaderFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveHeader() {
    const body: TeklifPatchPayload = {
      musteriId: form.musteriId,
      paraBirimi: form.paraBirimi,
      dil: form.dil,
      kdvOrani: Number(form.kdvOrani) || 0,
      kdvDahil: form.kdvDahil,
      iskontoOrani: Number(form.iskontoOrani) || 0,
      nakliye: Number(form.nakliye) || 0,
      gecerlilikTarihi: form.gecerlilikTarihi || undefined,
      odemeKosullari: form.odemeKosullari || undefined,
      teslimKosullari: form.teslimKosullari || undefined,
      aciklama: form.aciklama || undefined,
    };
    try {
      await updateTeklif({ id, body }).unwrap();
      toast.success(t('admin.erp.common.updated', { item: t('admin.erp.teklifler.singular') }));
    } catch (err: any) {
      const message = err?.data?.error?.message;
      toast.error(
        message === 'sadece_taslak_duzenlenir'
          ? t('admin.erp.teklifler.form.taslakDisindaBilgi')
          : (message ?? t('admin.erp.common.operationFailed')),
      );
    }
  }

  async function savePrices() {
    if (!data || isLocked) return;
    const changed = (data.kalemler ?? []).filter((kalem) => {
      const value = Number(priceDrafts[kalem.id]);
      return Number.isFinite(value) && value >= 0 && value !== kalem.birimFiyat;
    });
    const invalid = (data.kalemler ?? []).some((kalem) => {
      const value = Number(priceDrafts[kalem.id]);
      return !Number.isFinite(value) || value < 0;
    });
    if (invalid) {
      toast.error('Birim fiyatlar sıfır veya daha büyük bir sayı olmalıdır.');
      return;
    }
    if (changed.length === 0) {
      toast.info('Değişen bir fiyat yok.');
      return;
    }
    try {
      // Her kalem güncellemesi teklif toplamını yeniden hesapladığı için yarış
      // oluşturmadan sırayla kaydediyoruz.
      for (const kalem of changed) {
        await patchKalem({
          id,
          kalemId: kalem.id,
          body: { birimFiyat: Number(priceDrafts[kalem.id]) },
        }).unwrap();
      }
      await refetch();
      toast.success(`${changed.length} kalemin fiyatı kaydedildi.`);
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err) ?? 'Fiyatlar kaydedilemedi.');
    }
  }

  async function handleDurumChange(next: TeklifDurum) {
    if (next === 'red') {
      setRedNedeni('');
      setRedDialogOpen(true);
      return;
    }
    try {
      await setDurum({ id, body: { durum: next } }).unwrap();
      await refetch();
      toast.success(t('admin.erp.teklifler.durumAksiyonlari.durumGuncellendi'));
    } catch (err: any) {
      const message = err?.data?.error?.message;
      toast.error(
        message === 'gecersiz_teklif_gecisi'
          ? t('admin.erp.teklifler.durumAksiyonlari.durumGuncellenemedi')
          : (message ?? t('admin.erp.common.operationFailed')),
      );
    }
  }

  async function confirmRed() {
    if (!redNedeni.trim()) {
      toast.error(t('admin.erp.teklifler.durumAksiyonlari.redNedeniZorunlu'));
      return;
    }
    try {
      await setDurum({ id, body: { durum: 'red', redNedeni: redNedeni.trim() } }).unwrap();
      await refetch();
      toast.success(t('admin.erp.teklifler.durumAksiyonlari.durumGuncellendi'));
      setRedDialogOpen(false);
    } catch (err: any) {
      const message = err?.data?.error?.message;
      toast.error(message ?? t('admin.erp.common.operationFailed'));
    }
  }

  function openAddKalem() { setEditingKalem(null); setKalemDialogOpen(true); }
  function openEditKalem(k: TeklifKalemDto) { setEditingKalem(k); setKalemDialogOpen(true); }

  async function confirmDeleteKalem() {
    if (!deleteKalemTarget) return;
    try {
      await deleteKalem({ id, kalemId: deleteKalemTarget.id }).unwrap();
      toast.success(t('admin.erp.common.deleted', { item: t('admin.erp.teklifler.form.kalemler') }));
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t('admin.erp.common.deleteFailed'));
    } finally {
      setDeleteKalemTarget(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        {t('admin.erp.teklifler.detail.notFound')}{' '}
        <Link href="/admin/teklifler" className="underline">{t('admin.erp.common.goBack')}</Link>
      </div>
    );
  }

  const kalemler = [...(data.kalemler ?? [])].sort((a, b) => a.sira - b.sira);
  // 'onay_bekliyor' aşağıdaki özel İskonto Onayı bloğuyla (gerçek ihtiyaç kontrolüyle) yönetilir.
  const gecisler = (TEKLIF_DURUM_GECISLERI[data.durum] ?? []).filter((d) => d !== 'onay_bekliyor');
  const iskontoLimiti = TEKLIF_ISKONTO_LIMITLERI_UI[currentRole] ?? 0;
  const iskontoOnayGerekiyor = data.iskontoOrani > iskontoLimiti && !data.iskontoOnaylandi;
  const revizyonUygunDurumlar: TeklifDurum[] = ['gonderildi', 'goruntulendi', 'red', 'suresi_doldu'];
  const changedPriceCount = kalemler.filter((kalem) => Number(priceDrafts[kalem.id]) !== kalem.birimFiyat).length;
  const unpricedCount = kalemler.filter((kalem) => kalem.birimFiyat <= 0).length;

  return (
    <div className="space-y-6">
      {/* Üst bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/teklifler"><ArrowLeft className="size-4" /></Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{data.teklifNo}</h1>
            <p className="text-xs text-muted-foreground">{data.musteriAd ?? '—'}</p>
          </div>
          <Badge variant={TEKLIF_DURUM_BADGE[data.durum]}>
            {t(`admin.erp.teklifler.statuses.${data.durum}`)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
            <Printer className="mr-1 size-4" /> Önizle / Yazdır
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePdf('preview')} disabled={pdfLoading}>
            <FileDown className="mr-1 size-4" /> {pdfLoading ? 'PDF…' : 'PDF Önizle'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePdf('download')} disabled={pdfLoading}>
            <FileDown className="mr-1 size-4" /> {pdfLoading ? 'PDF…' : 'PDF İndir'}
          </Button>
        </div>
      </div>

      {/* Durum aksiyonları */}
      {gecisler.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {gecisler.map((next) => (
            <Button
              key={next}
              size="sm"
              variant={next === 'red' ? 'destructive' : 'outline'}
              onClick={() => handleDurumChange(next)}
              disabled={setDurumState.isLoading}
            >
              {t(`admin.erp.teklifler.durumAksiyonlari.${DURUM_ACTION_KEY[next]}`)}
            </Button>
          ))}
        </div>
      )}

      {/* İskonto onayı — rol limitini aşan genel iskonto admin onayı gerektirir */}
      {data.durum === 'taslak' && iskontoOnayGerekiyor && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm text-amber-900">
            Bu teklifin iskontosu (%{data.iskontoOrani}) yetki limitinizi (%{iskontoLimiti}) aşıyor. Gönderebilmek için önce onaya gönderin.
          </p>
          <Button size="sm" onClick={handleOnayaGonder} disabled={onayaGonderState.isLoading}>
            Onaya Gönder
          </Button>
        </div>
      )}
      {data.durum === 'onay_bekliyor' && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm text-amber-900">
            İskonto onayı bekleniyor (%{data.iskontoOrani}). Yalnız yönetici onaylayabilir/reddedebilir.
          </p>
          {currentRole === 'admin' && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleOnayla} disabled={onaylaState.isLoading}>Onayla</Button>
              <Button size="sm" variant="destructive" onClick={() => { setIskontoRedNedeni(''); setIskontoRedDialogOpen(true); }} disabled={reddetState.isLoading}>Reddet</Button>
            </div>
          )}
        </div>
      )}
      {data.iskontoOnaylandi && data.iskontoOnayAt && (
        <p className="text-xs text-muted-foreground">
          İskonto onaylandı · {new Date(data.iskontoOnayAt).toLocaleString('tr-TR')}
        </p>
      )}

      {data.revizyonlar && data.revizyonlar.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Revizyon Geçmişi</CardTitle></CardHeader>
          <CardContent className="divide-y text-sm">
            {data.revizyonlar.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2">
                <span>R{r.revizyonNo} · {r.neden}</span>
                <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString('tr-TR')}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Siparişe dönüştür — kabul edilmiş ve henüz dönüştürülmemiş teklif */}
      {data.durum === 'kabul' && !data.donusenSiparisId && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-3">
          <p className="text-sm text-emerald-900">
            Teklif kabul edildi. Ürünlü kalemleri satış siparişine dönüştürebilirsiniz; aday müşteri otomatik aktif müşteriye yükselir.
          </p>
          <Button size="sm" onClick={handleConvert} disabled={convertState.isLoading}>
            <ShoppingCart className="mr-1 size-4" />
            {convertState.isLoading ? 'Dönüştürülüyor…' : 'Siparişe Dönüştür'}
          </Button>
        </div>
      )}
      {data.donusenSiparisId && (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">Bu teklif satış siparişine dönüştürüldü.</p>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/satis-siparisleri/${data.donusenSiparisId}`}>Siparişi Aç</Link>
          </Button>
        </div>
      )}

      {/* Ana çalışma alanı: kullanıcı ilk ekranda ürünü, miktarı ve fiyatı görür. */}
      <Card className="overflow-hidden border-primary/20 shadow-sm">
        <CardHeader className="border-b bg-muted/20 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CircleDollarSign className="size-5 text-primary" />
                Ürünler ve Fiyatlandırma
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Miktarı kontrol edin, birim fiyatı girin ve teklif toplamını oluşturun.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isLocked ? (
                <>
                  <Button size="sm" variant="outline" onClick={openAddKalem}>
                    <Plus className="mr-1 size-4" /> Ürün Ekle
                  </Button>
                  <Button size="sm" onClick={savePrices} disabled={patchKalemState.isLoading || changedPriceCount === 0}>
                    <Save className="mr-1 size-4" />
                    {patchKalemState.isLoading ? 'Kaydediliyor…' : changedPriceCount > 0 ? `Fiyatları Kaydet (${changedPriceCount})` : 'Fiyatlar Kayıtlı'}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {unpricedCount > 0 ? (
            <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle className="size-4 shrink-0" />
              <strong>{unpricedCount} ürünün birim fiyatı henüz girilmemiş.</strong>
            </div>
          ) : null}
          {isLocked ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Bu teklif {t(`admin.erp.teklifler.statuses.${data.durum}`).toLocaleLowerCase('tr-TR')} durumda. Eski kaydı koruyarak fiyat değiştirmek için yeni revizyon açın.
              </p>
              {revizyonUygunDurumlar.includes(data.durum) ? (
                <Button size="sm" onClick={() => { setRevizyonNedeni('Fiyatlandırma güncellemesi'); setRevizyonDialogOpen(true); }} disabled={revizyonState.isLoading}>
                  Yeni Revizyon Aç ve Fiyatlandır
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün / Açıklama</TableHead>
                  <TableHead className="w-36 text-right">Miktar</TableHead>
                  <TableHead className="w-52">Birim Fiyat ({data.paraBirimi})</TableHead>
                  <TableHead className="w-40 text-right">Satır Toplamı</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {kalemler.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Teklif kalemi bulunmuyor.</TableCell></TableRow>
                ) : null}
                {kalemler.map((kalem) => (
                  <TableRow key={kalem.id} className={kalem.birimFiyat <= 0 ? 'bg-amber-50/40' : undefined}>
                    <TableCell>
                      <div className="font-medium">{kalem.aciklama}</div>
                      {kalem.urunKod ? <div className="text-xs text-muted-foreground">{kalem.urunKod} · {kalem.urunAd}</div> : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{kalem.miktar.toLocaleString('tr-TR')} {kalem.birim ?? ''}</TableCell>
                    <TableCell>
                      <Input
                        className="h-9 text-right font-semibold tabular-nums"
                        type="number"
                        min="0"
                        step="0.01"
                        aria-label={`${kalem.aciklama} birim fiyat`}
                        value={priceDrafts[kalem.id] ?? String(kalem.birimFiyat)}
                        onChange={(event) => setPriceDrafts((current) => ({ ...current, [kalem.id]: event.target.value }))}
                        disabled={isLocked || patchKalemState.isLoading}
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{money(kalem.satirToplam, data.paraBirimi)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditKalem(kalem)} disabled={isLocked} aria-label="Kalemi düzenle"><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteKalemTarget(kalem)} disabled={isLocked} aria-label="Kalemi sil"><Trash2 className="size-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {kalemler.length > 0 ? (
                <TableFooter>
                  <TableRow><TableCell colSpan={3} className="text-right">Ara Toplam</TableCell><TableCell colSpan={2} className="text-right font-semibold tabular-nums">{money(data.araToplam, data.paraBirimi)}</TableCell></TableRow>
                  <TableRow className="border-t-2"><TableCell colSpan={3} className="text-right text-base font-bold">Genel Toplam</TableCell><TableCell colSpan={2} className="text-right text-lg font-bold tabular-nums">{money(data.genelToplam, data.paraBirimi)}</TableCell></TableRow>
                </TableFooter>
              ) : null}
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Gönder & Paylaş */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gönder & Paylaş</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-56 flex-1 space-y-1">
              <Label className="text-xs">Alıcı e-posta</Label>
              <Input type="email" value={aliciEmail} onChange={(e) => setAliciEmail(e.target.value)} placeholder="musteri@ornek.com" />
            </div>
            <Button size="sm" onClick={handleGonderEmail} disabled={gonderState.isLoading}>
              <Mail className="mr-1 size-4" /> E-posta ile Gönder (PDF)
            </Button>
            <Button size="sm" variant="outline" onClick={handleWhatsapp} disabled={gonderState.isLoading || publicLinkState.isLoading}>
              <Share2 className="mr-1 size-4" /> WhatsApp linki
            </Button>
            <Button size="sm" variant="outline" onClick={() => handlePublicLink('yenile')} disabled={publicLinkState.isLoading}>
              <RefreshCcw className="mr-1 size-4" /> Linki yenile
            </Button>
            <Button size="sm" variant="outline" onClick={() => handlePublicLink('iptal')} disabled={publicLinkState.isLoading || !!data.goruntulemeTokenRevokedAt}>
              <Link2Off className="mr-1 size-4" /> Linki iptal et
            </Button>
          </div>
          {data.goruntulemeToken && (
            <p className="break-all text-xs text-muted-foreground">
              Public görüntüleme linki: <span className="font-mono">{publicLink(data.goruntulemeToken)}</span>
              {' · '}{data.goruntulemeTokenRevokedAt ? 'İptal edildi' : data.goruntulemeTokenExpiresAt ? `${new Date(data.goruntulemeTokenExpiresAt).toLocaleString('tr-TR')} tarihine kadar geçerli` : 'Süre bilgisi yok'}
            </p>
          )}
          {data.ilkGoruntulemeAt && (
            <p className="text-xs text-emerald-700">
              Müşteri ilk görüntüleme: {new Date(data.ilkGoruntulemeAt).toLocaleString('tr-TR')}
            </p>
          )}
          {data.gonderimler && data.gonderimler.length > 0 && (
            <div className="divide-y rounded-md border text-sm">
              {data.gonderimler.map((g) => (
                <div key={g.id} className="flex items-center justify-between px-3 py-2">
                  <span>
                    {g.kanal === 'email' ? 'E-posta' : g.kanal === 'whatsapp_link' ? 'WhatsApp linki' : 'Manuel'}
                    {g.aliciEmail ? ` · ${g.aliciEmail}` : ''}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {g.durum === 'hata' ? 'Hata' : 'Başarılı'} · {new Date(g.createdAt).toLocaleString('tr-TR')}
                  </span>
                  {g.durum === 'hata' && g.hataMesaji && (
                    <span className="max-w-xs text-xs text-destructive" title={g.hataMesaji}>{g.hataMesaji}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {data.redNedeni && data.durum === 'red' && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-3 text-sm text-destructive">
            <strong>{t('admin.erp.teklifler.durumAksiyonlari.redNedeni')}:</strong> {data.redNedeni}
          </CardContent>
        </Card>
      )}

      {isLocked && (
        <p className="text-xs text-amber-600">{t('admin.erp.teklifler.form.taslakDisindaBilgi')}</p>
      )}

      {/* Header alanları */}
      <details className="group rounded-lg border bg-card shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold">
          <span>Teklif Koşulları ve Diğer Ayarlar</span>
          <span className="text-xs font-normal text-muted-foreground group-open:hidden">Göster</span>
          <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">Gizle</span>
        </summary>
      <Card className="rounded-none border-x-0 border-b-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Müşteri, vergi, teslimat ve ödeme bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Müşteri</Label>
              <Select value={form.musteriId} onValueChange={(v) => patch('musteriId', v)} disabled={isLocked}>
                <SelectTrigger><SelectValue placeholder="Müşteri seçin" /></SelectTrigger>
                <SelectContent>
                  {musteriler.map((m) => <SelectItem key={m.id} value={m.id}>{m.kod} — {m.ad}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Dil</Label>
              <Select value={form.dil} onValueChange={(v) => patch('dil', v)} disabled={isLocked}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DILLER.map((dil) => <SelectItem key={dil} value={dil}>{dil.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.paraBirimi')}</Label>
              <Select value={form.paraBirimi} onValueChange={(v) => patch('paraBirimi', v)} disabled={isLocked}>
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
                type="number" min="0" max="100" step="0.01"
                value={form.kdvOrani}
                onChange={(e) => patch('kdvOrani', e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.gecerlilikTarihi')}</Label>
              <Input
                type="date"
                value={form.gecerlilikTarihi}
                onChange={(e) => patch('gecerlilikTarihi', e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.iskontoOrani')}</Label>
              <Input
                type="number" min="0" max="100" step="0.01"
                value={form.iskontoOrani}
                onChange={(e) => patch('iskontoOrani', e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.nakliye')}</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.nakliye}
                onChange={(e) => patch('nakliye', e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3 self-end">
              <Label className="cursor-pointer">{t('admin.erp.teklifler.form.kdvDahil')}</Label>
              <Switch checked={form.kdvDahil} onCheckedChange={(v) => patch('kdvDahil', v)} disabled={isLocked} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.odemeKosullari')}</Label>
              <Textarea
                value={form.odemeKosullari}
                onChange={(e) => patch('odemeKosullari', e.target.value)}
                placeholder={t('admin.erp.teklifler.form.odemeKosullariPlaceholder')}
                disabled={isLocked}
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.teslimKosullari')}</Label>
              <Textarea
                value={form.teslimKosullari}
                onChange={(e) => patch('teslimKosullari', e.target.value)}
                placeholder={t('admin.erp.teklifler.form.teslimKosullariPlaceholder')}
                disabled={isLocked}
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t('admin.erp.teklifler.form.aciklama')}</Label>
            <Textarea
              value={form.aciklama}
              onChange={(e) => patch('aciklama', e.target.value)}
              placeholder={t('admin.erp.teklifler.form.aciklamaPlaceholder')}
              disabled={isLocked}
              rows={2}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={saveHeader} disabled={isLocked || updateState.isLoading}>
              <Save className="mr-1 size-4" />
              {updateState.isLoading ? t('admin.erp.common.saving') : t('admin.common.save')}
            </Button>
          </div>
        </CardContent>
      </Card>
      </details>

      <TeklifKalemDialog
        open={kalemDialogOpen}
        onClose={() => setKalemDialogOpen(false)}
        teklifId={id}
        kalem={editingKalem}
      />

      <TeklifPrint open={printOpen} onClose={() => setPrintOpen(false)} teklif={data} />

      <AlertDialog open={!!deleteKalemTarget} onOpenChange={(v) => !v && setDeleteKalemTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.erp.teklifler.form.kalemler')} — {t('admin.common.delete')}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.erp.common.deleteDescriptionIrreversible', { name: deleteKalemTarget?.aciklama ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteKalem}
              disabled={deleteKalemState.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteKalemState.isLoading ? t('admin.erp.common.deleting') : t('admin.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={redDialogOpen} onOpenChange={setRedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.erp.teklifler.durumAksiyonlari.reddet')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <Label>{t('admin.erp.teklifler.durumAksiyonlari.redNedeni')}</Label>
            <Textarea
              value={redNedeni}
              onChange={(e) => setRedNedeni(e.target.value)}
              placeholder={t('admin.erp.teklifler.durumAksiyonlari.redNedeniPlaceholder')}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedDialogOpen(false)} disabled={setDurumState.isLoading}>
              {t('admin.common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmRed} disabled={setDurumState.isLoading}>
              {setDurumState.isLoading ? t('admin.erp.common.saving') : t('admin.erp.teklifler.durumAksiyonlari.reddet')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={iskontoRedDialogOpen} onOpenChange={setIskontoRedDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>İskonto Onayını Reddet</DialogTitle></DialogHeader>
          <div className="space-y-1">
            <Label>Red nedeni</Label>
            <Textarea value={iskontoRedNedeni} onChange={(e) => setIskontoRedNedeni(e.target.value)} placeholder="Satış ekibinin göreceği açıklama" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIskontoRedDialogOpen(false)} disabled={reddetState.isLoading}>İptal</Button>
            <Button variant="destructive" onClick={confirmIskontoRed} disabled={reddetState.isLoading}>
              {reddetState.isLoading ? 'Kaydediliyor…' : 'Reddet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revizyonDialogOpen} onOpenChange={setRevizyonDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Revizyon Oluştur</DialogTitle></DialogHeader>
          <div className="space-y-1">
            <Label>Revizyon nedeni</Label>
            <Textarea value={revizyonNedeni} onChange={(e) => setRevizyonNedeni(e.target.value)} placeholder="Fiyat veya koşul değişikliğini açıklayın" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevizyonDialogOpen(false)} disabled={revizyonState.isLoading}>İptal</Button>
            <Button onClick={confirmRevizyon} disabled={revizyonState.isLoading}>
              {revizyonState.isLoading ? 'Oluşturuluyor…' : 'Revizyon Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
