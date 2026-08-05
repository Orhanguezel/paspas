'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Download, ExternalLink, FileSpreadsheet, Image as ImageIcon, MessageSquare,
  Mic, Paperclip, Plus, RefreshCcw, Square, Upload, X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateAssetAdminMutation, useCreatePageFeedbackMutation,
  useListPageFeedbackQuery, useUpdatePageFeedbackMutation,
} from '@/integrations/hooks';
import type {
  PageFeedbackAttachment, PageFeedbackPriority, PageFeedbackStatus, PageFeedbackThread,
} from '@/integrations/shared';
import { resolveMediaUrl } from '@/lib/media-url';

const COLUMNS: Array<{ status: PageFeedbackStatus; label: string; color: string }> = [
  { status: 'open', label: 'Açık', color: 'bg-blue-500' },
  { status: 'needs_info', label: 'Bilgi Bekliyor', color: 'bg-amber-500' },
  { status: 'in_review', label: 'İncelemede', color: 'bg-violet-500' },
  { status: 'planned', label: 'Planlandı', color: 'bg-cyan-500' },
  { status: 'resolved', label: 'Çözüldü', color: 'bg-emerald-500' },
  { status: 'closed', label: 'Kapandı', color: 'bg-slate-500' },
];

function moduleName(thread: PageFeedbackThread) {
  return thread.pageTitle?.trim()
    || thread.pagePath.split('?')[0]?.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ')
    || 'Genel';
}

function sourceLabel(thread: PageFeedbackThread) {
  return thread.sourceApp === 'promats-web' ? 'Promats Web' : 'Paspas ERP';
}

function relatedUrl(thread: PageFeedbackThread) {
  const pagePath = thread.pagePath.split('::')[0] || '/';
  if (/^https?:\/\//i.test(pagePath)) return pagePath;
  if (thread.sourceApp === 'paspas') return pagePath;
  if (pagePath.startsWith('/promats')) return pagePath;
  if (pagePath.startsWith('/admin')) return '/admin/web-sayfasi';
  return `/promats${pagePath.startsWith('/') ? pagePath : `/${pagePath}`}`;
}

const STATUS_ALIASES: Record<string, PageFeedbackStatus> = {
  açık: 'open', acik: 'open', open: 'open',
  'bilgi bekliyor': 'needs_info', needs_info: 'needs_info',
  incelemede: 'in_review', in_review: 'in_review',
  planlandı: 'planned', planlandi: 'planned', planned: 'planned',
  çözüldü: 'resolved', cozuldu: 'resolved', resolved: 'resolved',
  kapandı: 'closed', kapandi: 'closed', closed: 'closed',
};

const PRIORITY_ALIASES: Record<string, PageFeedbackPriority> = {
  düşük: 'low', dusuk: 'low', low: 'low',
  normal: 'normal',
  yüksek: 'high', yuksek: 'high', high: 'high',
  kritik: 'critical', critical: 'critical',
};

function attachmentFromUrl(url: string, index: number): PageFeedbackAttachment {
  const clean = url.trim();
  const name = clean.split('/').pop()?.split('?')[0] || `ek-${index + 1}`;
  const lower = name.toLowerCase();
  const mime = /\.(png|jpe?g|gif|webp|svg)$/.test(lower)
    ? `image/${lower.endsWith('svg') ? 'svg+xml' : lower.endsWith('jpg') || lower.endsWith('jpeg') ? 'jpeg' : lower.split('.').pop()}`
    : /\.(mp3|wav|ogg|webm)$/.test(lower)
      ? `audio/${lower.split('.').pop()}`
      : 'application/octet-stream';
  return { assetId: crypto.randomUUID(), url: clean, name, mime, size: 0 };
}

export default function YazilimGorevleriClient() {
  const list = useListPageFeedbackQuery({ limit: 500 });
  const [update] = useUpdatePageFeedbackMutation();
  const [create] = useCreatePageFeedbackMutation();
  const [uploadAsset] = useCreateAssetAdminMutation();
  const [selectedId, setSelectedId] = useState<string>();
  const [dragging, setDragging] = useState<string>();
  const draggingIdRef = useRef<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [pagePath, setPagePath] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [sourceApp, setSourceApp] = useState<'paspas' | 'promats-web'>('promats-web');
  const [priority, setPriority] = useState<PageFeedbackPriority>('normal');
  const [files, setFiles] = useState<File[]>([]);
  const importRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderStreamRef = useRef<MediaStream | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const items = list.data?.items ?? [];
  const selected = items.find((item) => item.id === selectedId);
  const stats = useMemo(() => ({
    active: items.filter((item) => !['resolved', 'closed'].includes(item.status)).length,
    critical: items.filter((item) => item.priority === 'critical').length,
    promats: items.filter((item) => item.sourceApp === 'promats-web').length,
  }), [items]);

  async function move(id: string, status: PageFeedbackStatus) {
    try {
      await update({ id, body: { status } }).unwrap();
      toast.success('Görev durumu güncellendi.');
    } catch {
      toast.error('Durum güncellenemedi.');
    }
  }

  function resetCreateForm() {
    setSubject('');
    setDescription('');
    setPagePath('');
    setPageTitle('');
    setSourceApp('promats-web');
    setPriority('normal');
    setFiles([]);
  }

  async function uploadFiles(input: File[]): Promise<PageFeedbackAttachment[]> {
    const attachments: PageFeedbackAttachment[] = [];
    for (const file of input) {
      const asset = await uploadAsset({
        file,
        bucket: 'page-feedback',
        folder: `software-tasks/${sourceApp}`,
        metadata: { sourceApp, usage: 'software-task', tenant: sourceApp === 'promats-web' ? 'promats' : 'paspas' },
      }).unwrap();
      attachments.push({
        assetId: asset.id,
        url: asset.url || `/uploads/${asset.path}`,
        name: asset.name || file.name,
        mime: asset.mime || file.type || 'application/octet-stream',
        size: Number(asset.size || file.size),
      });
    }
    return attachments;
  }

  async function submitTask() {
    if (!subject.trim() || !description.trim() || !pagePath.trim()) {
      toast.error('Başlık, açıklama ve ilgili sayfa linki zorunludur.');
      return;
    }
    setSaving(true);
    try {
      const attachments = await uploadFiles(files);
      await create({
        subject: subject.trim(),
        body: description.trim(),
        pagePath: pagePath.trim(),
        pageTitle: pageTitle.trim() || subject.trim(),
        sourceApp,
        priority,
        messageType: 'report',
        attachments,
      }).unwrap();
      toast.success('Yeni yazılım görevi oluşturuldu.');
      setCreateOpen(false);
      resetCreateForm();
    } catch {
      toast.error('Görev oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Tarayıcı ses kaydını desteklemiyor.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
        .find((item) => MediaRecorder.isTypeSupported(item));
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderStreamRef.current = stream;
      recorderRef.current = recorder;
      recorderChunksRef.current = [];
      recorder.ondataavailable = (event) => event.data.size && recorderChunksRef.current.push(event.data);
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const extension = type.includes('ogg') ? 'ogg' : 'webm';
        const blob = new Blob(recorderChunksRef.current, { type });
        if (blob.size) setFiles((current) => [...current, new File([blob], `sesli-gorev-${Date.now()}.${extension}`, { type })]);
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };
      recorder.start();
      setRecording(true);
    } catch {
      toast.error('Mikrofon izni alınamadı.');
    }
  }

  async function downloadTemplate() {
    const XLSX = await import('xlsx');
    const rows = [{
      'Görev Başlığı': 'Örnek: Ürün sayfası mobil düzenleme',
      Açıklama: 'Yapılacak işi ayrıntılı olarak yazın.',
      'İlgili Sayfa Linki': 'https://panel.avrasyaotomotiv.net/promats/tr/urunler',
      'Sayfa / Modül': 'Ürünler',
      Proje: 'Promats Web',
      Öncelik: 'Normal',
      Durum: 'Açık',
      'Ek URL’leri': 'https://ornek.com/ekran.png',
    }];
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = [28, 50, 55, 24, 18, 14, 18, 55].map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(workbook, sheet, 'Görev Şablonu');
    const info = XLSX.utils.aoa_to_sheet([
      ['Kullanım', 'Her satır bir görev oluşturur. Görev Başlığı, Açıklama ve İlgili Sayfa Linki zorunludur.'],
      ['Proje', 'Promats Web veya Paspas ERP'],
      ['Öncelik', 'Düşük, Normal, Yüksek, Kritik'],
      ['Durum', 'Açık, Bilgi Bekliyor, İncelemede, Planlandı, Çözüldü, Kapandı'],
      ['Ek URL’leri', 'Birden fazla URL için virgül veya yeni satır kullanın.'],
    ]);
    info['!cols'] = [{ wch: 20 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(workbook, info, 'Açıklamalar');
    XLSX.writeFile(workbook, 'yazilim-gorevleri-sablonu.xlsx');
  }

  async function exportExcel() {
    const XLSX = await import('xlsx');
    const rows = items.map((item) => ({
      ID: item.id,
      'Görev Başlığı': item.subject,
      Açıklama: item.comments[0]?.body || '',
      'İlgili Sayfa Linki': relatedUrl(item),
      'Sayfa / Modül': moduleName(item),
      Proje: sourceLabel(item),
      Öncelik: item.priority,
      Durum: COLUMNS.find((column) => column.status === item.status)?.label || item.status,
      'Ek URL’leri': item.comments.flatMap((comment) => comment.attachments.map((attachment) => attachment.url)).join('\n'),
      Oluşturan: item.createdByName || '',
      'Oluşturma Tarihi': new Date(item.createdAt).toLocaleString('tr-TR'),
      'Güncelleme Tarihi': new Date(item.updatedAt).toLocaleString('tr-TR'),
    }));
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = [38, 32, 55, 55, 24, 18, 14, 18, 60, 22, 22, 22].map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(workbook, sheet, 'Yazılım Görevleri');
    XLSX.writeFile(workbook, `yazilim-gorevleri-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async function importExcel(file: File | undefined) {
    if (!file) return;
    setSaving(true);
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      let created = 0;
      const errors: string[] = [];
      for (const [index, row] of rows.entries()) {
        const taskSubject = String(row['Görev Başlığı'] ?? '').trim();
        const taskBody = String(row.Açıklama ?? '').trim();
        const taskPath = String(row['İlgili Sayfa Linki'] ?? '').trim();
        if (!taskSubject || !taskBody || !taskPath) {
          errors.push(`${index + 2}. satır: zorunlu alan eksik`);
          continue;
        }
        const project = String(row.Proje ?? '').toLocaleLowerCase('tr');
        const taskSource = project.includes('promats') ? 'promats-web' : 'paspas';
        const taskPriority = PRIORITY_ALIASES[String(row.Öncelik ?? 'normal').trim().toLocaleLowerCase('tr')] || 'normal';
        const taskStatus = STATUS_ALIASES[String(row.Durum ?? 'açık').trim().toLocaleLowerCase('tr')] || 'open';
        const attachments = String(row['Ek URL’leri'] ?? '')
          .split(/[,\n;]/).map((url) => url.trim()).filter(Boolean)
          .map(attachmentFromUrl);
        try {
          const createdTask = await create({
            subject: taskSubject,
            body: taskBody,
            pagePath: taskPath,
            pageTitle: String(row['Sayfa / Modül'] ?? taskSubject).trim(),
            sourceApp: taskSource,
            priority: taskPriority,
            messageType: 'report',
            attachments,
          }).unwrap();
          if (taskStatus !== 'open') await update({ id: createdTask.id, body: { status: taskStatus } }).unwrap();
          created += 1;
        } catch {
          errors.push(`${index + 2}. satır: kayıt oluşturulamadı`);
        }
      }
      if (created) toast.success(`${created} görev Excel’den oluşturuldu.`);
      if (errors.length) toast.error(`${errors.length} satır aktarılamadı: ${errors.slice(0, 3).join(', ')}`);
    } catch {
      toast.error('Excel dosyası okunamadı. Verilen şablonu kullanın.');
    } finally {
      setSaving(false);
      if (importRef.current) importRef.current.value = '';
    }
  }

  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Yazılım Takibi</p>
          <h1 className="text-3xl font-semibold">Yazılım Görevleri</h1>
          <p className="mt-1 text-sm text-muted-foreground">Paspas ERP ve Promats Web notlarını tek Kanban'da yönetin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={importRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(event) => void importExcel(event.target.files?.[0])} />
          <Button variant="outline" onClick={() => void downloadTemplate()}><FileSpreadsheet className="mr-2 size-4" /> Şablon</Button>
          <Button variant="outline" onClick={() => importRef.current?.click()} disabled={saving}><Upload className="mr-2 size-4" /> Excel’den al</Button>
          <Button variant="outline" onClick={() => void exportExcel()} disabled={!items.length}><Download className="mr-2 size-4" /> Excel’e aktar</Button>
          <Button variant="outline" onClick={() => void list.refetch()} disabled={list.isFetching}>
            <RefreshCcw className={`mr-2 size-4 ${list.isFetching ? 'animate-spin' : ''}`} /> Yenile
          </Button>
          <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 size-4" /> Yeni görev</Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Card className="p-3"><div className="text-xs text-muted-foreground">Aktif görev</div><strong className="text-xl">{stats.active}</strong></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Kritik görev</div><strong className="text-xl text-destructive">{stats.critical}</strong></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Promats Web</div><strong className="text-xl">{stats.promats}</strong></Card>
      </div>

      <Card className="min-w-0 overflow-hidden p-2">
        <div className="grid min-w-0 gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr))]">
          {COLUMNS.map((column) => {
            const cards = items.filter((item) => item.status === column.status);
            return (
              <fieldset
                key={column.status}
                className="min-w-0 rounded-lg border bg-muted/20"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const draggedId = event.dataTransfer.getData('text/plain') || draggingIdRef.current;
                  if (draggedId) void move(draggedId, column.status);
                  draggingIdRef.current = null;
                  setDragging(undefined);
                }}
              >
                <div className="flex items-center justify-between border-b bg-card p-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <i className={`size-2 rounded-full ${column.color}`} />{column.label}
                  </span>
                  <Badge variant="secondary">{cards.length}</Badge>
                </div>
                <div className="min-h-24 space-y-1.5 p-1.5">
                  {cards.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        draggingIdRef.current = item.id;
                        setDragging(item.id);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', item.id);
                      }}
                      onDragEnd={() => {
                        draggingIdRef.current = null;
                        setDragging(undefined);
                      }}
                      onClick={() => setSelectedId(item.id)}
                      className={`min-w-0 w-full rounded-md border bg-card p-2 text-left shadow-sm hover:border-primary/50 ${['high', 'critical'].includes(item.priority) ? 'border-destructive/50' : ''}`}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-[10px]">{sourceLabel(item)}</Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><MessageSquare className="size-3" />{item.comments.length}</span>
                      </div>
                      <span className="line-clamp-2 break-words text-xs font-medium leading-5">{item.subject}</span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">{moduleName(item)} · {item.pagePath}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </div>
      </Card>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(undefined)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {selected ? <>
            <SheetHeader>
              <SheetTitle>{selected.subject}</SheetTitle>
              <SheetDescription>{sourceLabel(selected)} · {moduleName(selected)} · {selected.pagePath}</SheetDescription>
            </SheetHeader>
            <div className="space-y-3 px-4 pb-6">
              <div className="grid gap-2 sm:grid-cols-2">
                <Select value={selected.status} onValueChange={(value) => void move(selected.id, value as PageFeedbackStatus)}>
                  <SelectTrigger><SelectValue placeholder="Durum seçin" /></SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((column) => <SelectItem key={column.status} value={column.status}>{column.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button asChild variant="outline">
                  <Link href={relatedUrl(selected)}><ExternalLink className="mr-2 size-4" />İlgili sayfaya git</Link>
                </Button>
              </div>
                  {selected.comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border p-3">
                  <div className="mb-2 text-xs text-muted-foreground">{comment.createdByName || 'Kullanıcı'} · {new Date(comment.createdAt).toLocaleString('tr-TR')}</div>
                  <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
                  {comment.attachments.map((attachment) => {
                    const url = resolveMediaUrl(attachment.url);
                    return attachment.mime.startsWith('audio/')
                      // biome-ignore lint/a11y/useMediaCaption: Kullanıcı sesli notları için ayrı altyazı dosyası bulunmaz.
                      ? <audio key={attachment.assetId} controls src={url} className="mt-3 w-full" />
                      : attachment.mime.startsWith('image/')
                        ? <a key={attachment.assetId} href={url} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-lg border"><img src={url} alt={attachment.name} className="max-h-72 w-full object-contain" /></a>
                        : <a key={attachment.assetId} href={url} target="_blank" rel="noreferrer" className="mt-2 block text-xs underline">{attachment.name}</a>;
                  })}
                </div>
              ))}
            </div>
          </> : null}
        </SheetContent>
      </Sheet>

      <Sheet open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (!open && !saving) resetCreateForm();
      }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Yeni yazılım görevi</SheetTitle>
            <SheetDescription>İlgili sayfayı, yapılacak işi ve destekleyici dosyaları tek görevde kaydedin.</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-8">
            <div className="space-y-2">
              <Label htmlFor="task-subject">Görev başlığı *</Label>
              <Input id="task-subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Örn. Ürün detay mobil görünümü düzeltilecek" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Açıklama *</Label>
              <Textarea id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-36" placeholder="Beklenen sonucu ve mevcut problemi ayrıntılı yazın..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-url">İlgili sayfa linki *</Label>
              <Input id="task-url" value={pagePath} onChange={(event) => setPagePath(event.target.value)} placeholder="https://... veya /admin/..." />
              {pagePath.trim() ? <a href={pagePath} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-primary underline"><ExternalLink className="mr-1 size-3" /> Linki kontrol et</a> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-module">Sayfa / modül adı</Label>
              <Input id="task-module" value={pageTitle} onChange={(event) => setPageTitle(event.target.value)} placeholder="Örn. Promats Ürünler" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Proje</Label>
                <Select value={sourceApp} onValueChange={(value) => setSourceApp(value as 'paspas' | 'promats-web')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promats-web">Promats Web</SelectItem>
                    <SelectItem value="paspas">Paspas ERP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Öncelik</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as PageFeedbackPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="critical">Kritik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3 rounded-xl border p-4">
              <div>
                <div className="font-medium">Görsel, ses ve dosyalar</div>
                <p className="text-xs text-muted-foreground">Bilgisayardan birden fazla dosya seçebilir veya doğrudan ses kaydedebilirsiniz.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Label className="inline-flex h-9 cursor-pointer items-center rounded-md border px-3 text-sm hover:bg-muted">
                  <Paperclip className="mr-2 size-4" /> Dosya / görsel ekle
                  <input type="file" multiple className="hidden" onChange={(event) => {
                    setFiles((current) => [...current, ...Array.from(event.target.files ?? [])]);
                    event.target.value = '';
                  }} />
                </Label>
                <Button type="button" variant={recording ? 'destructive' : 'outline'} size="sm" onClick={() => void toggleRecording()}>
                  {recording ? <Square className="mr-2 size-4" /> : <Mic className="mr-2 size-4" />}
                  {recording ? 'Kaydı durdur' : 'Ses kaydet'}
                </Button>
              </div>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center gap-3 rounded-lg border p-2">
                    {file.type.startsWith('image/') ? <ImageIcon className="size-4 text-violet-600" /> : file.type.startsWith('audio/') ? <Mic className="size-4 text-red-600" /> : <Paperclip className="size-4" />}
                    <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{Math.ceil(file.size / 1024)} KB</span>
                    <Button type="button" size="icon" variant="ghost" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X className="size-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Vazgeç</Button>
              <Button onClick={() => void submitTask()} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Görevi oluştur'}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
