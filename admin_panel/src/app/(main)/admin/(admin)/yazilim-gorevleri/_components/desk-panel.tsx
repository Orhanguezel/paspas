'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, ImagePlus, Mic, Send, Square, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useAddPageFeedbackCommentMutation, useCreateAssetAdminMutation,
  useListPageFeedbackActionsQuery, useListPageFeedbackReleasesQuery,
  useListPageFeedbackWatcherCandidatesQuery, useListPageFeedbackWatchersQuery,
  useSetPageFeedbackActionMutation, useSetPageFeedbackReleaseMutation,
  useAddPageFeedbackWatcherMutation, useRemovePageFeedbackWatcherMutation,
} from '@/integrations/hooks';
import type { PageFeedbackAttachment, PageFeedbackMessageType, PageFeedbackStatus, PageFeedbackThread } from '@/integrations/shared';
import { resolveMediaUrl } from '@/lib/media-url';

const statusLabels: Record<PageFeedbackStatus, string> = { open: 'Açık', needs_info: 'Bilgi Bekliyor', in_review: 'İncelemede', planned: 'Planlandı', resolved: 'Çözüldü', closed: 'Kapandı' };
const priorityLabels = { low: 'Düşük', normal: 'Normal', high: 'Yüksek', critical: 'Kritik' };
const partyLabels: Record<string, string> = { biz: 'Aktif360', talep_sahibi: 'Talep sahibi', baska: 'Başka sorumlu', kimse: 'Kimse' };
const fieldClass = 'h-9 min-w-0 rounded-lg border border-blue-200 bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400';

function relatedUrl(thread: PageFeedbackThread) {
  const path = thread.pagePath.split('::')[0] || '/';
  if (/^https?:\/\//i.test(path)) return path;
  if (thread.sourceApp === 'paspas' || path.startsWith('/promats')) return path;
  if (path.startsWith('/admin')) return '/admin/web-sayfasi';
  return `/promats${path.startsWith('/') ? path : `/${path}`}`;
}

function date(value: string) { return new Date(value).toLocaleString('tr-TR'); }

export function DeskPanel({ thread, onStatus }: { thread: PageFeedbackThread; onStatus: (status: PageFeedbackStatus) => void }) {
  const actions = useListPageFeedbackActionsQuery(thread.id);
  const releases = useListPageFeedbackReleasesQuery(thread.id);
  const watchers = useListPageFeedbackWatchersQuery(thread.id);
  const candidates = useListPageFeedbackWatcherCandidatesQuery();
  const [setAction, actionState] = useSetPageFeedbackActionMutation();
  const [setRelease, releaseState] = useSetPageFeedbackReleaseMutation();
  const [addWatcher, addWatcherState] = useAddPageFeedbackWatcherMutation();
  const [removeWatcher] = useRemovePageFeedbackWatcherMutation();
  const [addComment, commentState] = useAddPageFeedbackCommentMutation();
  const [upload] = useCreateAssetAdminMutation();
  const [party, setParty] = useState('');
  const [phase, setPhase] = useState('');
  const [expected, setExpected] = useState('');
  const [release, setReleaseChoice] = useState('');
  const [evidence, setEvidence] = useState('');
  const [watcherId, setWatcherId] = useState('');
  const [comment, setComment] = useState('');
  const [messageType, setMessageType] = useState<PageFeedbackMessageType>('comment');
  const [files, setFiles] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);

  useEffect(() => {
    setParty(thread.nextAction?.party ?? '');
    setPhase(thread.nextAction?.workPhase ?? '');
    setExpected(thread.nextAction?.expectedAction ?? '');
    setReleaseChoice(thread.release?.state ?? '');
    setEvidence(thread.release?.evidence ?? '');
    setWatcherId(''); setComment(''); setFiles([]);
  }, [thread.id]);

  async function saveAction() {
    if (!party) return;
    try { await setAction({ id: thread.id, party, workPhase: phase || null, expectedAction: expected.trim() || null }).unwrap(); toast.success('Aksiyon kaydedildi.'); }
    catch { toast.error('Aksiyon kaydedilemedi.'); }
  }
  async function saveRelease() {
    if (!release || evidence.trim().length < 10) return;
    try { await setRelease({ id: thread.id, releaseState: release, evidence: evidence.trim() }).unwrap(); toast.success('Yayın kanıtı kaydedildi.'); }
    catch { toast.error('Yayın kanıtı kaydedilemedi.'); }
  }
  async function saveWatcher() {
    if (!watcherId) return;
    try { await addWatcher({ id: thread.id, userId: watcherId }).unwrap(); setWatcherId(''); toast.success('Bilgi kişisi eklendi.'); }
    catch { toast.error('Bilgi kişisi eklenemedi.'); }
  }
  async function saveComment() {
    if (!comment.trim() && !files.length) return;
    try {
      const attachments: PageFeedbackAttachment[] = [];
      for (const file of files) {
        const asset = await upload({ file, bucket: 'page-feedback', folder: `software-tasks/${thread.sourceApp}`, metadata: { sourceApp: thread.sourceApp, usage: 'software-task-comment' } }).unwrap();
        attachments.push({ assetId: asset.id, url: asset.url || `/uploads/${asset.path}`, name: asset.name || file.name, mime: asset.mime || file.type || 'application/octet-stream', size: Number(asset.size || file.size) });
      }
      await addComment({ id: thread.id, body: { body: comment.trim() || 'Ek dosya eklendi.', messageType, attachments } }).unwrap();
      setComment(''); setFiles([]); setMessageType('comment'); toast.success('Mesaj kaydedildi.');
    } catch { toast.error('Mesaj kaydedilemedi.'); }
  }
  async function startRecording() {
    if (recording) { recorder?.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { toast.error('Tarayıcı ses kaydını desteklemiyor.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ['audio/webm;codecs=opus', 'audio/webm'].find((value) => MediaRecorder.isTypeSupported(value));
      const media = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      media.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      media.onstop = () => { const blob = new Blob(chunks, { type: media.mimeType || 'audio/webm' }); if (blob.size) setFiles((current) => [...current, new File([blob], `sesli-not-${Date.now()}.webm`, { type: blob.type })]); stream.getTracks().forEach((track) => track.stop()); setRecording(false); setRecorder(null); };
      media.start(); setRecorder(media); setRecording(true);
    } catch { toast.error('Mikrofon izni alınamadı.'); }
  }

  const selectedWatchers = watchers.data?.items ?? [];
  return <div className="space-y-4 px-4 pb-8">
    <section className="space-y-2 rounded-2xl border border-blue-200 bg-blue-50/30 p-3">
      <h3 className="text-sm font-semibold">Sıradaki aksiyon kimde?</h3>
      <p className="text-xs text-muted-foreground">Durum ve son mesaj yazarı tek başına aksiyon sahibi sayılmaz. Belirlenmemiş notlar ayrıca incelenir.</p>
      <p className="text-sm">{thread.nextAction ? `${partyLabels[thread.nextAction.party]}${thread.nextAction.expectedAction ? ` · ${thread.nextAction.expectedAction}` : ''}` : 'Belirlenmedi'}</p>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Sıradaki aksiyon sahibi" className={fieldClass} value={party} onChange={(event) => setParty(event.target.value)}><option value="">Belirlenmedi — açıkça seçin</option><option value="biz">Aktif360</option><option value="talep_sahibi">Talep sahibi</option><option value="baska">Başka sorumlu</option><option value="kimse">Kimse</option></select>
        <select aria-label="İş aşaması" className={fieldClass} value={phase} onChange={(event) => setPhase(event.target.value)}><option value="">Aşama belirlenmedi</option><option value="ongoing">Çalışma sürüyor</option><option value="approval">Test/onay bekleniyor</option></select>
      </div>
      <Input aria-label="Beklenen cevap veya aksiyon" maxLength={1000} className={fieldClass + ' w-full'} placeholder="Beklenen cevap veya aksiyon" value={expected} onChange={(event) => setExpected(event.target.value)} />
      <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" disabled={!party || actionState.isLoading} onClick={() => void saveAction()}>Aksiyonu kaydet</Button>
      <details><summary className="cursor-pointer text-xs text-muted-foreground">Değişiklik geçmişi</summary><ol className="mt-2 space-y-1 text-xs text-muted-foreground">{(actions.data?.items ?? []).map((item) => <li key={item.id}>{date(item.changedAt)} · {item.changedByName || 'Aktif360'} · {partyLabels[item.party] || item.party}{item.expectedAction ? ` · ${item.expectedAction}` : ''}</li>)}</ol></details>
    </section>
    <section className="space-y-2 rounded-2xl border border-blue-200 bg-blue-50/30 p-3">
      <h3 className="text-sm font-semibold">Yayın kanıtı</h3>
      <p className="text-xs text-muted-foreground">Notun çözülmesi yayına alındığını kanıtlamaz. Tarihsel yorumlardan otomatik yayın durumu çıkarılmaz.</p>
      <p className="text-sm">{thread.release ? `${thread.release.state === 'deployed' ? 'Yayın doğrulandı' : thread.release.state === 'withdrawn' ? 'Yayından kaldırıldı' : 'Yayınlanmadı'} · ${thread.release.evidence}` : 'Yayın doğrulanmadı'}</p>
      <select aria-label="Yayın durumu" className={fieldClass} value={release} onChange={(event) => setReleaseChoice(event.target.value)}><option value="">Durum seçin</option><option value="deployed">Yayın doğrulandı</option><option value="not_deployed">Yayınlanmadı</option><option value="withdrawn">Yayından kaldırıldı</option></select>
      <Input aria-label="Yayın kanıtı" maxLength={1000} className={fieldClass + ' w-full'} placeholder="Canlı kaynak/rota ve kabul kanıtını yazın" value={evidence} onChange={(event) => setEvidence(event.target.value)} />
      <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" disabled={!release || evidence.trim().length < 10 || releaseState.isLoading} onClick={() => void saveRelease()}>Yayın kanıtını kaydet</Button>
      <details><summary className="cursor-pointer text-xs text-muted-foreground">Yayın geçmişi</summary><ol className="mt-2 space-y-1 text-xs text-muted-foreground">{(releases.data?.items ?? []).map((item) => <li key={item.id}>{date(item.changedAt)} · {item.changedByName || 'Aktif360'} · {item.state} · {item.evidence}</li>)}</ol></details>
    </section>
    <section className="rounded-2xl border border-blue-200 bg-blue-50/30 p-3">
      <h3 className="text-sm font-semibold">Bilgi kişileri</h3>
      <div className="mt-2 flex flex-wrap gap-2">{selectedWatchers.map((item) => <span key={item.userId} className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs">{item.name}<button aria-label={`${item.name} kişisini kaldır`} type="button" onClick={() => void removeWatcher({ id: thread.id, userId: item.userId }).unwrap().catch(() => toast.error('Bilgi kişisi kaldırılamadı.'))}><X className="size-3" /></button></span>)}</div>
      <div className="mt-3 flex gap-2"><select aria-label="Bilgi kişisi seç" className={fieldClass + ' min-w-0 flex-1'} value={watcherId} onChange={(event) => setWatcherId(event.target.value)}><option value="">Bilgi kişisi seçin</option>{(candidates.data?.items ?? []).filter((item) => !selectedWatchers.some((watcher) => watcher.userId === item.userId)).map((item) => <option key={item.userId} value={item.userId}>{item.name}</option>)}</select><Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" disabled={!watcherId || addWatcherState.isLoading} onClick={() => void saveWatcher()}>Ekle</Button></div>
    </section>
    <section className="rounded-2xl border border-blue-200 bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="text-sm font-semibold text-blue-600">Not No: {thread.id.slice(0, 8).toUpperCase()}</p><p className="mt-1 font-medium">{thread.subject}</p><p className="text-xs text-muted-foreground">Talep sahibi: {thread.createdByName || 'Kullanıcı'}<br />{thread.pagePath}</p></div><div className="flex gap-1"><Badge variant="outline">{statusLabels[thread.status]}</Badge><Badge variant="outline">{priorityLabels[thread.priority]}</Badge></div></div>
      <Button asChild variant="outline" size="sm" className="mt-3 w-full"><Link href={relatedUrl(thread)}><ExternalLink className="mr-2 size-4" />İlgili modüle git</Link></Button>
      <div className="mt-3 space-y-3 border-t pt-3">{thread.comments.map((item) => <div key={item.id} className="rounded-xl border border-blue-100 bg-blue-50/40 p-3"><p className="text-xs font-medium">{item.createdByName || 'Kullanıcı'} <span className="font-normal text-muted-foreground">· {date(item.createdAt)}</span></p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.body}</p>{item.attachments.map((attachment) => { const url = resolveMediaUrl(attachment.url); return attachment.mime.startsWith('image/') ? <a key={attachment.assetId} href={url} target="_blank" rel="noreferrer"><img src={url} alt={attachment.name} className="mt-2 max-h-72 rounded-lg border object-contain" /></a> : attachment.mime.startsWith('audio/') ? <audio key={attachment.assetId} controls src={url} className="mt-2 w-full" /> : <a key={attachment.assetId} href={url} target="_blank" rel="noreferrer" className="mt-2 block text-sm underline">{attachment.name}</a>; })}</div>)}</div>
      <div className="mt-4 space-y-2 rounded-xl border p-2"><Textarea aria-label="Mesaj yaz" className="min-h-20 resize-y border-0 shadow-none" placeholder="Mesaj yazın… (Ctrl+Enter gönderir)" value={comment} onChange={(event) => setComment(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); void saveComment(); } }} /><div className="flex flex-wrap gap-2">{files.map((file, index) => <span key={`${file.name}-${index}`} className="rounded-full border px-2 py-1 text-xs">{file.name}<button aria-label={`${file.name} dosyasını kaldır`} onClick={() => setFiles((current) => current.filter((_, position) => position !== index))}><X className="ml-1 inline size-3" /></button></span>)}</div><div className="flex flex-wrap items-center gap-2"><select aria-label="Mesaj türü" className={fieldClass} value={messageType} onChange={(event) => setMessageType(event.target.value as PageFeedbackMessageType)}><option value="comment">Yorum</option><option value="question">Netleştirme sorusu</option><option value="answer">Cevap</option><option value="solution">Çözüm notu</option></select><label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1.5 text-sm"><ImagePlus className="size-4" /> Dosya ekle<input className="hidden" type="file" multiple onChange={(event) => setFiles((current) => [...current, ...Array.from(event.target.files ?? [])])} /></label><Button variant="outline" size="sm" onClick={() => void startRecording()}>{recording ? <><Square className="mr-1 size-4" />Durdur</> : <><Mic className="mr-1 size-4" />Ses kaydı</>}</Button><Button size="sm" className="ml-auto" disabled={commentState.isLoading || (!comment.trim() && !files.length)} onClick={() => void saveComment()}><Send className="mr-1 size-4" />Gönder</Button></div></div>
      <div className="mt-3 flex flex-wrap gap-2"><select aria-label="Görev durumu" className={fieldClass} value={thread.status} onChange={(event) => onStatus(event.target.value as PageFeedbackStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    </section>
  </div>;
}
