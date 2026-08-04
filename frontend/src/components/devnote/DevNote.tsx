'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

import type {
  FeedbackThread,
  PageFeedbackAttachment,
  PageFeedbackMessageType,
  PageFeedbackPriority,
} from './DevNotePanel';

const DEV_NOTES_BUILD_ENABLED = process.env.NEXT_PUBLIC_DEV_NOTES === '1';
const DevNotePanel = dynamic(() => import('./DevNotePanel'));

type FeedbackListResponse = { items: FeedbackThread[]; total: number };
type LegacyEnvelope<T> = { ok: true; data: T };

function devNotesEnabledForCurrentHost(): boolean {
  if (DEV_NOTES_BUILD_ENABLED) return true;
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'panel.avrasyaotomotiv.net';
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('mh_access_token') : '';
  return {
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {}),
  };
}

function hasDevNoteCredentials(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.localStorage.getItem('mh_access_token')) return true;
  return document.cookie.split(';').some((cookie) => cookie.trim() === 'promats_auth=1');
}

function pageTitleFallback(pathname: string): string {
  const last = pathname.split('/').filter(Boolean).at(-1) || 'promats';
  return last.replaceAll('-', ' ');
}

function getDocumentTitle(pathname: string): string {
  if (typeof document === 'undefined') return pageTitleFallback(pathname);
  return document.title || pageTitleFallback(pathname);
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`.slice(0, 36);
}

function safeFolder(pathname: string): string {
  return pathname.replace(/^\/+/, '').replace(/[^\w/-]+/g, '_') || 'home';
}

function normalizeThreads(payload: unknown): FeedbackThread[] {
  if (Array.isArray(payload)) return payload as FeedbackThread[];
  const maybeEnvelope = payload as Partial<LegacyEnvelope<FeedbackThread[]>>;
  if (maybeEnvelope.ok && Array.isArray(maybeEnvelope.data)) return maybeEnvelope.data;
  const maybeList = payload as Partial<FeedbackListResponse>;
  if (Array.isArray(maybeList.items)) return maybeList.items;
  return [];
}

async function fetchThreads(pagePath: string): Promise<FeedbackThread[] | null> {
  const query = new URLSearchParams({ pagePath, sourceApp: 'promats-web', limit: '20' });
  const res = await fetch(`/api/admin/page-feedback?${query}`, {
    cache: 'no-store',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  return normalizeThreads(await res.json());
}

async function uploadFiles(pathname: string, files: File[]): Promise<PageFeedbackAttachment[]> {
  const attachments: PageFeedbackAttachment[] = [];
  for (const file of files) {
    const fd = new FormData();
    fd.append('bucket', 'page-feedback');
    fd.append('folder', `promats-web/${safeFolder(pathname)}`);
    fd.append('metadata', JSON.stringify({ sourceApp: 'promats-web', tenant: 'promats' }));
    fd.append('file', file, file.name);

    const res = await fetch('/api/admin/storage/assets', {
      method: 'POST',
      body: fd,
      credentials: 'include',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('upload_failed');

    const data = (await res.json()) as { id?: string; url?: string; path?: string };
    attachments.push({
      assetId: data.id || randomId(),
      url: data.url || `/uploads/${data.path || ''}`,
      name: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
    });
  }
  return attachments;
}

async function createThread(input: {
  pagePath: string;
  pageTitle: string;
  subject: string;
  body: string;
  priority: PageFeedbackPriority;
  attachments: PageFeedbackAttachment[];
}): Promise<void> {
  const res = await fetch('/api/admin/page-feedback', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ ...input, sourceApp: 'promats-web', messageType: 'report' }),
  });
  if (!res.ok) throw new Error('create_feedback_failed');
}

async function createComment(input: {
  threadId: string;
  body: string;
  messageType: PageFeedbackMessageType;
  attachments: PageFeedbackAttachment[];
}): Promise<void> {
  const res = await fetch(`/api/admin/page-feedback/${encodeURIComponent(input.threadId)}/comments`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({
      body: input.body || 'Ek dosya eklendi.',
      messageType: input.messageType,
      attachments: input.attachments,
    }),
  });
  if (!res.ok) throw new Error('create_feedback_comment_failed');
}

async function updateThreadStatus(threadId: string, status: 'in_review' | 'resolved'): Promise<void> {
  const res = await fetch(`/api/admin/page-feedback/${encodeURIComponent(threadId)}`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('update_feedback_failed');
}

export default function DevNote({ section, title }: { section: string; title?: string }) {
  const pathname = usePathname();
  const pagePath = useMemo(() => `${pathname || '/'}::${section}`, [pathname, section]);
  const pageTitle = useMemo(() => getDocumentTitle(pathname || '/'), [pathname]);
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<FeedbackThread[]>([]);
  const [subject, setSubject] = useState(title || section);
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<PageFeedbackPriority>('normal');
  const [files, setFiles] = useState<File[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentTypes, setCommentTypes] = useState<Record<string, PageFeedbackMessageType>>({});
  const [commentFiles, setCommentFiles] = useState<Record<string, File[]>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [enabled, setEnabled] = useState(DEV_NOTES_BUILD_ENABLED);
  const [authorized, setAuthorized] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled || !hasDevNoteCredentials()) return;
    setFetching(true);
    try {
      const result = await fetchThreads(pagePath);
      setAuthorized(result !== null);
      if (result) setThreads(result);
    } finally {
      setFetching(false);
    }
  }, [enabled, pagePath]);

  useEffect(() => {
    setEnabled(devNotesEnabledForCurrentHost());
  }, []);

  useEffect(() => {
    setSubject(title || section);
  }, [section, title]);

  useEffect(() => {
    if (enabled && hasDevNoteCredentials()) void reload();
  }, [enabled, reload]);

  if (!enabled || !authorized) return null;

  const openCount = threads.filter((thread) => thread.status !== 'resolved' && thread.status !== 'closed').length;

  const removeNewFile = (index: number) => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));

  async function submitNew() {
    if (!subject.trim() || !body.trim()) return;
    setLoading(true);
    try {
      const attachments = await uploadFiles(pathname || '/', files);
      await createThread({
        pagePath,
        pageTitle,
        subject: subject.trim(),
        body: body.trim(),
        priority,
        attachments,
      });
      setSubject(title || section);
      setBody('');
      setPriority('normal');
      setFiles([]);
      await reload();
    } finally {
      setLoading(false);
    }
  }

  async function submitComment(threadId: string) {
    const comment = (commentDrafts[threadId] ?? '').trim();
    const selectedFiles = commentFiles[threadId] ?? [];
    if (!comment && selectedFiles.length === 0) return;

    setLoading(true);
    try {
      const attachments = await uploadFiles(pathname || '/', selectedFiles);
      await createComment({
        threadId,
        body: comment,
        messageType: commentTypes[threadId] ?? 'comment',
        attachments,
      });
      setCommentDrafts((current) => ({ ...current, [threadId]: '' }));
      setCommentTypes((current) => ({ ...current, [threadId]: 'comment' }));
      setCommentFiles((current) => ({ ...current, [threadId]: [] }));
      await reload();
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(threadId: string, status: 'in_review' | 'resolved') {
    setLoading(true);
    try {
      await updateThreadStatus(threadId, status);
      await reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`devnote-marker ${openCount > 0 ? 'devnote-marker--active' : ''}`}
        onClick={() => setOpen(true)}
        aria-label={`${title || section} yazilimci notu`}
      >
        {openCount > 0 ? openCount : '!'}
      </button>
      {open ? (
        <DevNotePanel
          open={open}
          onOpenChange={setOpen}
          pagePath={pagePath}
          pageTitle={pageTitle}
          title={title || section}
          section={section}
          threads={threads}
          subject={subject}
          onSubjectChange={setSubject}
          body={body}
          onBodyChange={setBody}
          priority={priority}
          onPriorityChange={setPriority}
          files={files}
          onFilesChange={setFiles}
          onRemoveFile={removeNewFile}
          commentDrafts={commentDrafts}
          commentTypes={commentTypes}
          commentFiles={commentFiles}
          onCommentChange={(threadId, value) => setCommentDrafts((current) => ({ ...current, [threadId]: value }))}
          onCommentTypeChange={(threadId, value) => setCommentTypes((current) => ({ ...current, [threadId]: value }))}
          onCommentFilesChange={(threadId, nextFiles) => setCommentFiles((current) => ({ ...current, [threadId]: nextFiles }))}
          onRemoveCommentFile={(threadId, index) =>
            setCommentFiles((current) => ({
              ...current,
              [threadId]: (current[threadId] ?? []).filter((_, itemIndex) => itemIndex !== index),
            }))
          }
          onSubmitNew={submitNew}
          onSubmitComment={submitComment}
          onStatus={setStatus}
          loading={loading}
          fetching={fetching}
        />
      ) : null}
    </>
  );
}
