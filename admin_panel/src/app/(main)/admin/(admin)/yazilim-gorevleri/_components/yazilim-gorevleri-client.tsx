'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Download, ExternalLink, FileSpreadsheet, Image as ImageIcon, MessageSquare,
  Mic, Paperclip, Plus, RefreshCcw, Search, Square, Upload, X,
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
import { MatiMotionMark } from './mati-motion-mark';
import { DeskPanel } from './desk-panel';

const COLUMNS: Array<{ status: PageFeedbackStatus; label: string; color: string; header: string }> = [
  { status: 'open', label: 'Açık', color: 'bg-blue-500', header: 'border-blue-200 bg-blue-100/80' },
  { status: 'needs_info', label: 'Bilgi Bekliyor', color: 'bg-amber-500', header: 'border-amber-200 bg-amber-100/80' },
  { status: 'in_review', label: 'İncelemede', color: 'bg-blue-500', header: 'border-blue-200 bg-blue-100/80' },
  { status: 'planned', label: 'Planlandı', color: 'bg-blue-500', header: 'border-blue-200 bg-blue-100/80' },
  { status: 'resolved', label: 'Çözüldü', color: 'bg-emerald-500', header: 'border-emerald-200 bg-emerald-100/80' },
  { status: 'closed', label: 'Kapandı', color: 'bg-slate-500', header: 'border-slate-200 bg-slate-100/80' },
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
  const [view, setView] = useState<'chat' | 'tasks' | 'releases'>('tasks');
  const [layout, setLayout] = useState<'board' | 'list'>('board');
  const [query, setQuery] = useState('');
  const [pathQuery, setPathQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PageFeedbackStatus | 'all'>('all');
  const [recentOnly, setRecentOnly] = useState(false);
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'ongoing' | 'approval' | 'unclassified'>('all');
  const [actionFilter, setActionFilter] = useState<'all' | 'biz' | 'talep_sahibi' | 'baska' | 'kimse' | 'unclassified'>('all');
  const [releaseQuery, setReleaseQuery] = useState('');
  const visibleItems = useMemo(() => {
    const text = query.trim().toLocaleLowerCase('tr-TR');
    const path = pathQuery.trim().toLocaleLowerCase('tr-TR');
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return items.filter((item) =>
      (statusFilter === 'all' || item.status === statusFilter)
      && (!text || [item.subject, item.pageTitle, item.pagePath, item.id, ...item.comments.map((comment) => comment.body)].join(' ').toLocaleLowerCase('tr-TR').includes(text))
      && (!path || item.pagePath.toLocaleLowerCase('tr-TR').includes(path))
      && (!recentOnly || new Date(item.updatedAt).getTime() >= cutoff)
      && (phaseFilter === 'all' || (phaseFilter === 'unclassified' ? !item.nextAction?.workPhase : item.nextAction?.workPhase === phaseFilter))
      && (actionFilter === 'all' || (actionFilter === 'unclassified' ? !item.nextAction : item.nextAction?.party === actionFilter))
    );
  }, [items, query, pathQuery, statusFilter, recentOnly, phaseFilter, actionFilter]);
  const releaseItems = useMemo(() => items.flatMap((item) => item.comments
    .filter((comment) => comment.messageType === 'solution')
    .map((comment) => ({ item, comment })))
    .filter(({ item, comment }) => `${item.subject} ${item.pagePath} ${comment.body}`.toLocaleLowerCase('tr-TR').includes(releaseQuery.toLocaleLowerCase('tr-TR')))
    .sort((a, b) => b.comment.createdAt.localeCompare(a.comment.createdAt)), [items, releaseQuery]);
  const selected = items.find((item) => item.id === selectedId);
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedId(undefined); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);
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
      <div className="rounded-2xl border bg-card/60 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start gap-4">
          <MatiMotionMark />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Çalışma Alanı &gt; Aktif360 Desk</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Aktif360 Desk</h1>
            <p className="mt-1 text-sm text-muted-foreground">Paspas ERP ve Promats Web sayfalarından gelen fikirleri ve sorunları takip edin; yorumları ve çözümü aynı konuşmada görün.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2" role="tablist" aria-label="Aktif360 Desk bölümleri">
          <Button role="tab" aria-selected={view === 'chat'} variant={view === 'chat' ? 'default' : 'outline'} onClick={() => setView('chat')}><MessageSquare className="mr-2 size-4" />Sohbet</Button>
          <Button role="tab" aria-selected={view === 'tasks'} variant={view === 'tasks' ? 'default' : 'outline'} onClick={() => setView('tasks')}>Görevler</Button>
          <Button role="tab" aria-selected={view === 'releases'} variant={view === 'releases' ? 'default' : 'outline'} onClick={() => setView('releases')}>Sürüm notları</Button>
          <div className="ml-auto flex flex-wrap gap-2">
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
      </div>

      {view === 'tasks' && <div className="space-y-2 rounded-2xl border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-52 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <span className="sr-only">Aktif360 Desk notlarında ara</span>
            <Input aria-label="Aktif360 Desk notlarında ara" className="pl-9" placeholder="Not no, başlık veya yorum ara" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <Input aria-label="Sayfa yolunu filtrele" className="min-w-48 flex-1 sm:max-w-xs" placeholder="Sayfa yolu filtrele: /admin/..." value={pathQuery} onChange={(event) => setPathQuery(event.target.value)} />
          <div className="flex max-w-full gap-1 overflow-x-auto pb-1" aria-label="Durum filtresi">
            {([{ status: 'all', label: 'Tümü' }, ...COLUMNS] as Array<{ status: PageFeedbackStatus | 'all'; label: string }>).map(({ status, label }) => <button key={status} type="button" aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${statusFilter === status ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>{label}</button>)}
          </div>
          <Button type="button" size="sm" variant={recentOnly ? 'default' : 'outline'} onClick={() => setRecentOnly((value) => !value)}>Son 24 saat</Button>
          <select aria-label="İş aşaması filtresi" className="h-9 min-w-40 rounded-lg border bg-background px-3 text-sm" value={phaseFilter} onChange={(event) => setPhaseFilter(event.target.value as typeof phaseFilter)}><option value="all">Tüm aşamalar</option><option value="ongoing">Çalışma sürüyor</option><option value="approval">Test/onay bekleniyor</option><option value="unclassified">Aşama belirlenmedi</option></select>
          <select aria-label="Aksiyon sahibi filtresi" className="h-9 min-w-40 rounded-lg border bg-background px-3 text-sm" value={actionFilter} onChange={(event) => setActionFilter(event.target.value as typeof actionFilter)}><option value="all">Tüm aksiyonlar</option><option value="biz">Aktif360</option><option value="talep_sahibi">Talep sahibi</option><option value="baska">Başka sorumlu</option><option value="kimse">Kimse</option><option value="unclassified">Belirlenmedi</option></select>
          <div className="inline-flex rounded-lg border p-0.5" aria-label="Not görünümü">
            <Button type="button" size="sm" variant={layout === 'board' ? 'secondary' : 'ghost'} onClick={() => setLayout('board')}>Pano</Button>
            <Button type="button" size="sm" variant={layout === 'list' ? 'secondary' : 'ghost'} onClick={() => setLayout('list')}>Liste</Button>
          </div>
        </div>
        {(query || pathQuery || statusFilter !== 'all' || recentOnly || phaseFilter !== 'all' || actionFilter !== 'all') && <p role="status" className="px-1 text-xs text-muted-foreground">{visibleItems.length} görev gösteriliyor.</p>}
      </div>}

      {view === 'releases' ? <div className="space-y-3">
        <Input aria-label="Sürüm notlarında ara" placeholder="Konu, modül veya çözüm ara" value={releaseQuery} onChange={(event) => setReleaseQuery(event.target.value)} />
        {releaseItems.map(({ item, comment }) => <Card key={comment.id} className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><button type="button" className="text-left font-semibold hover:underline" onClick={() => setSelectedId(item.id)}>{item.subject}</button><span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString('tr-TR')}</span></div>
          <p className="text-xs text-muted-foreground">{sourceLabel(item)} · {item.pagePath} · {COLUMNS.find((column) => column.status === item.status)?.label}</p>
          <div><p className="text-xs font-semibold">İlk talep</p><p className="whitespace-pre-wrap text-sm">{item.comments.find((entry) => entry.messageType === 'report')?.body ?? item.comments[0]?.body}</p></div>
          <div><p className="text-xs font-semibold text-emerald-600">Uygulanan çözüm</p><p className="whitespace-pre-wrap text-sm">{comment.body}</p></div>
          <Button size="sm" variant="outline" onClick={() => setSelectedId(item.id)}>Tüm görüşmeleri aç</Button>
        </Card>)}
        {!releaseItems.length && <Card className="p-6 text-center text-sm text-muted-foreground">Sürüm notu bulunamadı.</Card>}
      </div> : view === 'chat' ? <Card className="space-y-2 p-3">
        <h2 className="text-sm font-semibold">Son konuşmalar</h2>
        {items.filter((item) => item.comments.length).sort((a, b) => b.lastCommentAt.localeCompare(a.lastCommentAt)).slice(0, 50).map((item) => {
          const last = item.comments.at(-1);
          return <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className="w-full rounded-xl border border-blue-100 p-3 text-left hover:bg-blue-50/60"><span className="flex items-center justify-between gap-2 text-sm font-medium"><span>{item.subject}</span><span className="text-xs text-muted-foreground">{new Date(item.lastCommentAt).toLocaleString('tr-TR')}</span></span><span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">{last?.createdByName || 'Kullanıcı'}: {last?.body}</span></button>;
        })}
        {!items.length && <p className="py-6 text-center text-sm text-muted-foreground">Henüz konuşma yok.</p>}
      </Card> : layout === 'list' ? <Card className="overflow-x-auto p-2">
        <table className="w-full min-w-[1180px] text-left text-sm"><thead className="bg-slate-100 text-xs text-muted-foreground"><tr><th className="p-3">Not no</th><th className="p-3">Başlık</th><th className="p-3">Talep sahibi</th><th className="p-3">Durum</th><th className="p-3">Yayın kanıtı</th><th className="p-3">Sıradaki aksiyon</th><th className="p-3">Son mesajı yazan</th><th className="p-3">Son işlem</th><th className="p-3">Son mesaj</th></tr></thead><tbody>{visibleItems.map((item) => { const last = item.comments.at(-1); return <tr key={item.id} className="border-t align-top"><td className="whitespace-nowrap p-3 font-mono text-xs">{item.id.slice(0, 8).toUpperCase()}</td><td className="min-w-52 p-3"><button type="button" className="text-left font-medium text-blue-600 hover:underline" onClick={() => setSelectedId(item.id)}>{item.subject}</button><p className="text-xs text-muted-foreground">{sourceLabel(item)} · {moduleName(item)}</p></td><td className="p-3">{item.createdByName || 'Kullanıcı'}</td><td className="whitespace-nowrap p-3">{COLUMNS.find((column) => column.status === item.status)?.label}</td><td className="max-w-48 p-3 text-xs">{item.release ? `${item.release.state === 'deployed' ? 'Yayın doğrulandı' : item.release.state === 'withdrawn' ? 'Yayından kaldırıldı' : 'Yayınlanmadı'} · ${item.release.evidence}` : 'Yayın doğrulanmadı'}</td><td className="p-3">{item.nextAction?.party === 'biz' ? 'Aktif360' : item.nextAction?.party === 'talep_sahibi' ? 'Talep sahibi' : item.nextAction?.party === 'baska' ? 'Başka sorumlu' : item.nextAction?.party === 'kimse' ? 'Kimse' : 'Belirlenmedi'}</td><td className="p-3">{last?.createdByName || 'Kullanıcı'}</td><td className="whitespace-nowrap p-3 text-xs">{new Date(item.updatedAt).toLocaleString('tr-TR')}</td><td className="max-w-64 p-3 text-xs"><p className="line-clamp-3">{last?.body}</p></td></tr>; })}</tbody></table>
        {!visibleItems.length && <p className="p-6 text-center text-sm text-muted-foreground">Bu filtrede yazılım görevi yok.</p>}
      </Card> : <div className="min-w-0 overflow-x-auto pb-2">
        <div className="grid min-w-[1320px] grid-cols-6 gap-3">
          {COLUMNS.filter((column) => statusFilter === 'all' || statusFilter === column.status).map((column) => {
            const cards = visibleItems.filter((item) => item.status === column.status);
            return <section key={column.status} className="min-w-0 rounded-2xl border border-blue-100 bg-slate-50/70 p-2" aria-label={column.label}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const draggedId = event.dataTransfer.getData('text/plain') || draggingIdRef.current;
                if (draggedId) void move(draggedId, column.status);
                draggingIdRef.current = null; setDragging(undefined);
              }}>
              <div className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium ${column.header}`}><span>{column.label}</span><Badge variant="secondary" className="rounded-full">{cards.length}</Badge></div>
              <div className="mt-2 max-h-[700px] min-h-32 space-y-2 overflow-y-auto pr-0.5">
                {cards.length ? cards.map((item) => {
                  const last = item.comments.at(-1);
                  return <article key={item.id} role="button" tabIndex={0} aria-label={`${item.subject} notunu aç`}
                    draggable onDragStart={(event) => { draggingIdRef.current = item.id; setDragging(item.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', item.id); }}
                    onDragEnd={() => { draggingIdRef.current = null; setDragging(undefined); }}
                    onClick={() => setSelectedId(item.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(item.id); } }}
                    className={`cursor-pointer rounded-2xl border bg-card p-3 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${['high', 'critical'].includes(item.priority) ? 'border-red-300 bg-red-50/50' : 'border-blue-100'} ${dragging === item.id ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between gap-1"><h3 className="line-clamp-3 text-sm font-medium leading-5">{item.subject}</h3><span className="shrink-0 text-[10px] text-muted-foreground">{item.comments.length} yorum</span></div>
                    <p className="mt-2 line-clamp-5 break-words text-xs leading-4 text-muted-foreground">{sourceLabel(item)} · {moduleName(item)} · {item.pagePath} · Son işlem: {new Date(item.updatedAt).toLocaleString('tr-TR')} · Sıradaki: {item.nextAction?.party === 'biz' ? 'Aktif360' : item.nextAction?.party === 'talep_sahibi' ? 'Talep sahibi' : item.nextAction?.party === 'baska' ? 'Başka sorumlu' : item.nextAction?.party === 'kimse' ? 'Kimse' : 'Belirlenmedi'} · Son mesaj: {last?.createdByName || 'Kullanıcı'} · {last?.body || ''}</p>
                    <select aria-label={`${item.subject} durumunu değiştir`} value={item.status} onClick={(event) => event.stopPropagation()} onChange={(event) => { event.stopPropagation(); void move(item.id, event.target.value as PageFeedbackStatus); }} className="mt-2 h-9 w-full rounded-lg border bg-background px-2 text-xs">{COLUMNS.map((option) => <option key={option.status} value={option.status}>{option.label}</option>)}</select>
                  </article>;
                }) : <p className="rounded-xl border border-dashed border-blue-100 bg-card/60 px-3 py-5 text-center text-xs text-muted-foreground">Bu durumda yazılım görevi yok.</p>}
              </div>
            </section>;
          })}
        </div>
      </div>}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(undefined)}>
        <SheetContent className="w-full overflow-y-auto bg-slate-50 sm:max-w-[760px]">
          {selected ? <>
            <SheetHeader>
              <SheetTitle className="font-serif text-2xl">Aktif360 Desk notu</SheetTitle>
              <SheetDescription className="sr-only">Seçilen yazılım görevi, aksiyon, yayın kanıtı ve konuşma.</SheetDescription>
            </SheetHeader>
            <DeskPanel key={selected.id} thread={selected} onStatus={(status) => void move(selected.id, status)} />
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
