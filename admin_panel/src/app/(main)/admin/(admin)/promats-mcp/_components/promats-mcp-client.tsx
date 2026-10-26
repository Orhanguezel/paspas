'use client';

import { useState } from 'react';
import { Bot, Copy, Plus, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MatiMotionMark } from '@/app/(main)/admin/(admin)/yazilim-gorevleri/_components/mati-motion-mark';
import { useCreatePromatsMcpJetonMutation, useListPromatsMcpHistoryQuery, useListPromatsMcpJetonlarQuery, useRevokePromatsMcpJetonMutation, type PromatsMcpCreate, type PromatsMcpJeton } from '@/integrations/endpoints/admin/promats_mcp.endpoints';

const formatDate = (value: string | null) => value ? new Date(value).toLocaleString('tr-TR') : 'Henüz kullanılmadı';
const SCOPES = ['okuma', 'not'] as const;

export default function PromatsMcpClient() {
  const [all, setAll] = useState(false);
  const [includeRevoked, setIncludeRevoked] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<('okuma' | 'not')[]>(['okuma']);
  const [days, setDays] = useState(90);
  const [created, setCreated] = useState<PromatsMcpCreate | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<PromatsMcpJeton | null>(null);
  const list = useListPromatsMcpJetonlarQuery({ hepsi: all, iptalDahil: includeRevoked });
  const history = useListPromatsMcpHistoryQuery({ hepsi: all });
  const [create, creating] = useCreatePromatsMcpJetonMutation();
  const [revoke, revoking] = useRevokePromatsMcpJetonMutation();

  function close() { setOpen(false); setCreated(null); setName(''); setScopes(['okuma']); setDays(90); }
  async function createToken() {
    try {
      const value = await create({ ad: name.trim(), kapsamlar: scopes, gun: days }).unwrap();
      setCreated(value);
      void list.refetch();
      toast.success('Jeton oluşturuldu; yalnız bu ekranda bir kez gösterilir.');
    } catch { toast.error('Jeton oluşturulamadı. Ad, kapsam ve süreyi kontrol edin.'); }
  }
  async function revokeToken() {
    if (!revokeTarget) return;
    try { await revoke(revokeTarget.id).unwrap(); setRevokeTarget(null); void list.refetch(); toast.success('Jeton iptal edildi.'); }
    catch { toast.error('Jeton iptal edilemedi.'); }
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); toast.success('Kopyalandı.'); }
    catch { toast.error('Kopyalanamadı; metni seçerek kopyalayın.'); }
  }
  const codexCommand = created && list.data?.mcpUrl
    ? `export PROMATS_MCP_TOKEN='${created.jeton}'\ncodex mcp add promats --url ${list.data.mcpUrl} --bearer-token-env-var PROMATS_MCP_TOKEN`
    : '';

  return <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden pb-8">
    <div className="rounded-2xl border bg-card/60 px-5 py-5 sm:px-7">
      <div className="flex flex-wrap items-start gap-4"><MatiMotionMark /><div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">Sistem &gt; Promats MCP</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Promats Bağlantıları</h1>
        <p className="mt-1 text-sm text-muted-foreground">Claude Code ve Codex CLI için kişisel MCP bağlantıları. Görev değişiklikleri önce önizlenir, açık onayla uygulanır.</p>
      </div></div>
      <div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => setOpen(true)}><Plus className="mr-2 size-4" /> Yeni jeton</Button>
        <Button variant="outline" onClick={() => { void list.refetch(); void history.refetch(); }} disabled={list.isFetching}><RefreshCcw className="mr-2 size-4" /> Yenile</Button></div>
    </div>

    <Card className="min-w-0 space-y-3 p-4">
      <div className="flex items-center gap-2"><Bot className="size-5" /><h2 className="font-semibold">Bağlantı bilgileri</h2></div>
      <p className="text-sm text-muted-foreground">Jetonunuzu oluşturunca Claude Code ve Codex CLI komutları gösterilir. Jeton daha sonra tekrar görüntülenemez.</p>
      <div className="flex min-w-0 flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">MCP sunucu adresi</span><code className="min-w-0 break-all rounded bg-muted px-2 py-1 text-xs">{list.data?.mcpUrl ?? 'Yükleniyor…'}</code>
        {list.data?.mcpUrl && <Button size="sm" variant="outline" aria-label="MCP adresini kopyala" onClick={() => void copy(list.data!.mcpUrl)}><Copy className="size-4" /></Button>}</div>
      <p className="text-xs text-muted-foreground">Kapsamlar: ürün, sipariş, stok, üretim emri ve yazılım görevlerini okuma; görev açma, yorum ve durum değişikliği için önizleme/onay. ERP yazma işlemleri bu bağlantıya kapalıdır.</p>
    </Card>

    {list.data?.oauth && <Card className="min-w-0 space-y-3 p-4">
      <h2 className="font-semibold">Claude.ai veya ChatGPT (web ve mobil) ile bağlan</h2>
      <p className="text-sm text-muted-foreground">Asistanın bağlantı ayarlarında özel MCP sunucusu ekleyin. Bağlantı isteği açıldığında bu panelde kapsamları ve süreyi onaylayın.</p>
      {([['Sunucu adresi', list.data.oauth.url], ['OAuth Client ID', list.data.oauth.clientId]] as const).map(([label, value]) => <div key={label} className="flex min-w-0 flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">{label}</span><code className="min-w-0 break-all rounded bg-muted px-2 py-1 text-xs">{value}</code><Button size="sm" variant="outline" aria-label={`${label} kopyala`} onClick={() => void copy(value)}><Copy className="size-4" /></Button></div>)}
      <p className="text-xs text-muted-foreground">ChatGPT istemcisi dinamik kayıt kullanabilir. Claude için yukarıdaki Client ID alanını girin.</p>
    </Card>}

    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="inline-flex rounded-lg border p-0.5"><Button size="sm" variant={!all ? 'secondary' : 'ghost'} onClick={() => setAll(false)}>Jetonlarım</Button><Button size="sm" variant={all ? 'secondary' : 'ghost'} onClick={() => setAll(true)}>Tüm jetonlar</Button></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeRevoked} onChange={(event) => setIncludeRevoked(event.target.checked)} />İptal edilenleri göster</label>
    </div>

    <Card className="min-w-0 overflow-hidden">
      {list.isLoading ? <p className="p-5 text-sm text-muted-foreground">Jetonlar yükleniyor…</p>
        : list.isError ? <p role="alert" className="p-5 text-sm text-destructive">Jeton listesi alınamadı.</p>
        : !list.data?.items.length ? <p className="p-5 text-sm text-muted-foreground">Gösterilecek jeton yok.</p>
        : <div className="divide-y">{list.data.items.map((item) => <div key={item.id} className="flex min-w-0 flex-wrap items-start gap-3 p-4">
          <div className="min-w-48 flex-1 space-y-1"><div className="flex flex-wrap items-center gap-2"><strong className="break-words text-sm">{item.ad}</strong>
            <Badge variant={item.iptalAt || new Date(item.sonKullanma).getTime() <= Date.now() ? 'outline' : 'secondary'}>{item.iptalAt ? 'İptal' : new Date(item.sonKullanma).getTime() <= Date.now() ? 'Süresi doldu' : 'Aktif'}</Badge></div>
            {all && <p className="text-xs text-muted-foreground">{item.kullanici.ad} · {item.kullanici.email}</p>}
            <p className="font-mono text-xs text-muted-foreground">{item.onek}…</p>
            <div className="flex flex-wrap gap-1">{item.kapsamlar.map((scope) => <Badge key={scope} variant="outline">{scope === 'okuma' ? 'ERP okuma' : 'Görev (onaylı)'}</Badge>)}</div>
            <p className="text-xs text-muted-foreground">Oluşturma: {formatDate(item.createdAt)} · Bitiş: {formatDate(item.sonKullanma)} · Son kullanım: {formatDate(item.sonKullanimAt)} · {item.kullanimSayisi} kullanım</p>
          </div>{!item.iptalAt && <Button size="sm" variant="outline" onClick={() => setRevokeTarget(item)}>İptal et</Button>}
        </div>)}</div>}
    </Card>

    <Card className="space-y-3 p-4"><h2 className="font-semibold">İşlem geçmişi</h2>
      {history.isLoading ? <p className="text-sm text-muted-foreground">Yükleniyor…</p>
        : history.isError ? <p role="alert" className="text-sm text-destructive">Geçmiş alınamadı.</p>
        : !history.data?.items.length ? <p className="text-sm text-muted-foreground">Henüz işlem yok.</p>
        : <div className="divide-y">{history.data.items.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><span>{item.islem.replaceAll('_', ' ')} · {formatDate(item.createdAt)}</span><Badge variant="outline">{item.kullanildiAt ? 'Onay kullanıldı' : new Date(item.sonKullanma).getTime() < Date.now() ? 'Süresi doldu' : 'Onay bekliyor'}</Badge></div>)}</div>}
    </Card>

    <Sheet open={open} onOpenChange={(value) => { if (!value) close(); else setOpen(true); }}><SheetContent className="w-full overflow-y-auto sm:max-w-lg">
      <SheetHeader><SheetTitle>{created ? 'Yeni jeton hazır' : 'Yeni MCP jetonu'}</SheetTitle><SheetDescription>{created ? 'Jetonu ve bağlantı komutlarını şimdi kopyalayın.' : 'Kişisel, süreli ve iptal edilebilir bir bağlantı oluşturun.'}</SheetDescription></SheetHeader>
      {created ? <div className="space-y-5 px-4 pb-8"><p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Bu jeton bir daha gösterilmeyecek.</p>
        {[['Jeton', created.jeton], ['Claude Code bağlantı komutu', created.komut], ['Codex CLI bağlantı komutu', codexCommand]].map(([label, value]) => <div key={label} className="min-w-0 space-y-2"><label className="text-sm font-medium">{label}</label><code className="block min-w-0 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-3 text-xs select-all">{value}</code><Button size="sm" variant="outline" onClick={() => void copy(value)}><Copy className="mr-2 size-4" /> Kopyala</Button></div>)}
        <Button onClick={close}>Tamam</Button></div>
      : <form className="space-y-5 px-4 pb-8" onSubmit={(event) => { event.preventDefault(); void createToken(); }}>
        <div className="space-y-2"><label htmlFor="mcp-name" className="text-sm font-medium">Jeton adı</label><Input id="mcp-name" minLength={3} maxLength={80} required value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn. Orhan · Codex" /></div>
        <fieldset className="space-y-2"><legend className="text-sm font-medium">Kapsamlar</legend>{SCOPES.map((scope) => <label key={scope} className="flex items-start gap-2 rounded-lg border p-3 text-sm"><input type="checkbox" checked={scopes.includes(scope)} onChange={(event) => setScopes((current) => event.target.checked ? [...current, scope] : current.filter((value) => value !== scope))} /><span><strong>{scope === 'okuma' ? 'ERP ve görev okuma' : 'Yazılım görevi (onaylı)'}</strong><span className="block text-xs text-muted-foreground">{scope === 'okuma' ? 'Ürün, sipariş, stok, üretim emri ve görevler.' : 'Görev açma, yorum ve durum için önizleme ve açık onay.'}</span></span></label>)}</fieldset>
        <div className="space-y-2"><label htmlFor="mcp-days" className="text-sm font-medium">Geçerlilik süresi</label><select id="mcp-days" className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={days} onChange={(event) => setDays(Number(event.target.value))}>{[30, 90, 180, 365].map((value) => <option key={value} value={value}>{value} gün</option>)}</select></div>
        <Button type="submit" disabled={creating.isLoading || scopes.length === 0}>{creating.isLoading ? 'Oluşturuluyor…' : 'Jeton oluştur'}</Button>
      </form>}
    </SheetContent></Sheet>

    <AlertDialog open={Boolean(revokeTarget)} onOpenChange={(value) => { if (!value) setRevokeTarget(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Jeton iptal edilsin mi?</AlertDialogTitle><AlertDialogDescription>{revokeTarget?.ad} bağlantısı anında kapanır.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Vazgeç</AlertDialogCancel><AlertDialogAction disabled={revoking.isLoading} onClick={() => void revokeToken()}>İptal et</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
