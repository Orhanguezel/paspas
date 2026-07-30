'use client';

import { ImagePlus, MessageSquare, MessageSquarePlus, Send, X } from 'lucide-react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

export type PageFeedbackStatus = 'open' | 'needs_info' | 'in_review' | 'planned' | 'resolved' | 'closed';
export type PageFeedbackPriority = 'low' | 'normal' | 'high' | 'critical';
export type PageFeedbackMessageType = 'report' | 'comment' | 'question' | 'answer' | 'solution' | 'system';

export type PageFeedbackAttachment = {
  assetId: string;
  url: string;
  name: string;
  mime: string;
  size: number;
};

export type FeedbackComment = {
  id: string;
  threadId?: string;
  messageType: PageFeedbackMessageType;
  body: string;
  attachments: PageFeedbackAttachment[];
  createdByUserId?: string | null;
  createdByName?: string | null;
  createdAt: string;
};

export type FeedbackThread = {
  id: string;
  pagePath: string;
  pageTitle: string | null;
  subject: string;
  status: PageFeedbackStatus;
  priority: PageFeedbackPriority;
  createdByUserId?: string | null;
  createdByName?: string | null;
  assignedToUserId?: string | null;
  lastCommentAt?: string;
  createdAt: string;
  updatedAt?: string;
  comments: FeedbackComment[];
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Acik',
  needs_info: 'Bilgi bekliyor',
  in_review: 'Incelemede',
  planned: 'Planlandi',
  resolved: 'Cozuldu',
  closed: 'Kapali',
};

const PRIORITY_LABELS: Record<PageFeedbackPriority, string> = {
  low: 'Dusuk',
  normal: 'Normal',
  high: 'Yuksek',
  critical: 'Kritik',
};

const MESSAGE_TYPE_LABELS: Record<PageFeedbackMessageType, string> = {
  report: 'Bildirim',
  comment: 'Yorum',
  question: 'Soru',
  answer: 'Cevap',
  solution: 'Cozum',
  system: 'Sistem',
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function isImage(attachment: PageFeedbackAttachment): boolean {
  return attachment.mime.startsWith('image/');
}

function AttachmentPreview({ attachment }: { attachment: PageFeedbackAttachment }) {
  return (
    <a href={attachment.url} target="_blank" rel="noreferrer" className="devnote-attachment">
      {isImage(attachment) ? (
        <Image src={attachment.url} alt={attachment.name} width={320} height={180} unoptimized />
      ) : (
        <span>{attachment.name}</span>
      )}
    </a>
  );
}

function FilePills({ files, onRemove }: { files: File[]; onRemove: (index: number) => void }) {
  if (!files.length) return null;
  return (
    <div className="devnote-file-pills">
      {files.map((file, index) => (
        <span key={`${file.name}-${file.size}-${file.lastModified}`}>
          {file.name}
          <button type="button" onClick={() => onRemove(index)} aria-label={`${file.name} dosyasini kaldir`}>
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
}

type ThreadCardProps = {
  thread: FeedbackThread;
  comment: string;
  messageType: PageFeedbackMessageType;
  files: File[];
  busy: boolean;
  onCommentChange: (value: string) => void;
  onMessageTypeChange: (value: PageFeedbackMessageType) => void;
  onFilesChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onSubmitComment: () => void;
  onStatus: (status: 'in_review' | 'resolved') => void;
};

function ThreadCard({
  thread,
  comment,
  messageType,
  files,
  busy,
  onCommentChange,
  onMessageTypeChange,
  onFilesChange,
  onRemoveFile,
  onSubmitComment,
  onStatus,
}: ThreadCardProps) {
  return (
    <div className="devnote-thread-card">
      <div className="devnote-thread-card__head">
        <div>
          <p>{thread.subject}</p>
          <span>{thread.pagePath}</span>
        </div>
        <div className="devnote-badges">
          <Badge variant={thread.status === 'resolved' ? 'secondary' : 'outline'}>
            {STATUS_LABELS[thread.status] ?? thread.status}
          </Badge>
          <Badge variant={thread.priority === 'critical' || thread.priority === 'high' ? 'destructive' : 'outline'}>
            {PRIORITY_LABELS[thread.priority]}
          </Badge>
        </div>
      </div>

      <div className="devnote-messages">
        {thread.comments.map((item) => (
          <div key={item.id} className="devnote-message">
            <Badge variant={item.messageType === 'question' ? 'destructive' : 'outline'} className="devnote-message__type">
              {MESSAGE_TYPE_LABELS[item.messageType] ?? item.messageType}
            </Badge>
            <p>{item.body}</p>
            {item.attachments.length ? (
              <div className="devnote-attachments">
                {item.attachments.map((attachment) => (
                  <AttachmentPreview key={attachment.assetId} attachment={attachment} />
                ))}
              </div>
            ) : null}
            <span>{formatDate(item.createdAt)}</span>
          </div>
        ))}
      </div>

      <div className="devnote-comment-form">
        <Textarea
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder="Bu not icin yorum ekle"
          className="devnote-textarea"
        />
        <FilePills files={files} onRemove={onRemoveFile} />
        <div className="devnote-form-row">
          <div className="devnote-form-actions">
            <select value={messageType} onChange={(event) => onMessageTypeChange(event.target.value as PageFeedbackMessageType)}>
              <option value="comment">Yorum</option>
              <option value="question">Netlestirme sorusu</option>
              <option value="answer">Cevap</option>
              <option value="solution">Cozum notu</option>
            </select>
            <label className="devnote-file-button">
              <ImagePlus size={16} />
              Resim ekle
              <input type="file" multiple accept="image/*" onChange={(event) => onFilesChange(Array.from(event.target.files ?? []))} />
            </label>
          </div>
          <div className="devnote-form-actions">
            {thread.status !== 'in_review' ? (
              <Button type="button" variant="outline" size="sm" onClick={() => onStatus('in_review')} disabled={busy}>
                Incele
              </Button>
            ) : null}
            {thread.status !== 'resolved' ? (
              <Button type="button" variant="outline" size="sm" onClick={() => onStatus('resolved')} disabled={busy}>
                Cozuldu
              </Button>
            ) : null}
            <Button type="button" size="sm" onClick={onSubmitComment} disabled={busy || (!comment.trim() && files.length === 0)}>
              <Send size={16} />
              Yorum
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagePath: string;
  pageTitle: string;
  title: string;
  section: string;
  threads: FeedbackThread[];
  subject: string;
  onSubjectChange: (value: string) => void;
  body: string;
  onBodyChange: (value: string) => void;
  priority: PageFeedbackPriority;
  onPriorityChange: (value: PageFeedbackPriority) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  commentDrafts: Record<string, string>;
  commentTypes: Record<string, PageFeedbackMessageType>;
  commentFiles: Record<string, File[]>;
  onCommentChange: (threadId: string, value: string) => void;
  onCommentTypeChange: (threadId: string, value: PageFeedbackMessageType) => void;
  onCommentFilesChange: (threadId: string, files: File[]) => void;
  onRemoveCommentFile: (threadId: string, index: number) => void;
  onSubmitNew: () => void;
  onSubmitComment: (threadId: string) => void;
  onStatus: (threadId: string, status: 'in_review' | 'resolved') => void;
  loading: boolean;
  fetching: boolean;
};

export default function DevNotePanel({
  open,
  onOpenChange,
  pagePath,
  pageTitle,
  title,
  section,
  threads,
  subject,
  onSubjectChange,
  body,
  onBodyChange,
  priority,
  onPriorityChange,
  files,
  onFilesChange,
  onRemoveFile,
  commentDrafts,
  commentTypes,
  commentFiles,
  onCommentChange,
  onCommentTypeChange,
  onCommentFilesChange,
  onRemoveCommentFile,
  onSubmitNew,
  onSubmitComment,
  onStatus,
  loading,
  fetching,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="devnote-sheet">
        <SheetHeader>
          <SheetTitle>Sayfa notlari</SheetTitle>
          <SheetDescription>Bu bolumdeki sorun, yorum ve gorseller yazilimci icin bolum yoluyla kaydedilir.</SheetDescription>
        </SheetHeader>

        <div className="devnote-sheet__body">
          <div className="devnote-context">
            <MessageSquare size={18} />
            <div>
              <strong>{title || section}</strong>
              <span>{pagePath}</span>
            </div>
          </div>

          <div className="devnote-new-card">
            <div className="devnote-card-title">
              <MessageSquarePlus size={16} />
              Yeni not
            </div>
            <div className="devnote-card-fields">
              <Input value={subject} onChange={(event) => onSubjectChange(event.target.value)} placeholder="Konu" />
              <Textarea
                value={body}
                onChange={(event) => onBodyChange(event.target.value)}
                placeholder="Yazilimciya not / sorun aciklamasi"
                className="devnote-textarea devnote-textarea--new"
              />
              <div className="devnote-form-row">
                <select value={priority} onChange={(event) => onPriorityChange(event.target.value as PageFeedbackPriority)}>
                  <option value="low">Dusuk</option>
                  <option value="normal">Normal</option>
                  <option value="high">Yuksek</option>
                  <option value="critical">Kritik</option>
                </select>
                <label className="devnote-file-button">
                  <ImagePlus size={16} />
                  Resim ekle
                  <input type="file" multiple accept="image/*" onChange={(event) => onFilesChange(Array.from(event.target.files ?? []))} />
                </label>
              </div>
              <FilePills files={files} onRemove={onRemoveFile} />
              <Button type="button" onClick={onSubmitNew} disabled={loading || !subject.trim() || !body.trim()} className="devnote-submit">
                <Send size={16} />
                Notu kaydet
              </Button>
            </div>
          </div>

          <div className="devnote-list-head">
            <p>Bu bolumdeki notlar</p>
            <span className={fetching ? 'is-loading' : ''}>{threads.length} kayit</span>
          </div>

          <div className="devnote-thread-list">
            {threads.length ? (
              threads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  comment={commentDrafts[thread.id] ?? ''}
                  messageType={commentTypes[thread.id] ?? 'comment'}
                  files={commentFiles[thread.id] ?? []}
                  busy={loading}
                  onCommentChange={(value) => onCommentChange(thread.id, value)}
                  onMessageTypeChange={(value) => onCommentTypeChange(thread.id, value)}
                  onFilesChange={(nextFiles) => onCommentFilesChange(thread.id, nextFiles)}
                  onRemoveFile={(index) => onRemoveCommentFile(thread.id, index)}
                  onSubmitComment={() => onSubmitComment(thread.id)}
                  onStatus={(status) => onStatus(thread.id, status)}
                />
              ))
            ) : (
              <div className="devnote-empty">Bu bolum icin henuz not yok.</div>
            )}
          </div>

          <span className="devnote-page-title">{pageTitle}</span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
