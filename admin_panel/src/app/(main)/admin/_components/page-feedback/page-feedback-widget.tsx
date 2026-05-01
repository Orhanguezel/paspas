"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
import { usePathname } from "next/navigation";

import { Bug, ImagePlus, MessageSquarePlus, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddPageFeedbackCommentMutation,
  useCreateAssetAdminMutation,
  useCreatePageFeedbackMutation,
  useListPageFeedbackQuery,
  useUpdatePageFeedbackMutation,
} from "@/integrations/hooks";
import type {
  PageFeedbackAttachment,
  PageFeedbackMessageType,
  PageFeedbackPriority,
  PageFeedbackThread,
  StorageAsset,
} from "@/integrations/shared";
import { resolveMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  open: "Acik",
  needs_info: "Bilgi bekliyor",
  in_review: "Incelemede",
  planned: "Planlandi",
  resolved: "Cozuldu",
  closed: "Kapali",
};

const PRIORITY_LABELS: Record<PageFeedbackPriority, string> = {
  low: "Dusuk",
  normal: "Normal",
  high: "Yuksek",
  critical: "Kritik",
};

const MESSAGE_TYPE_LABELS: Record<PageFeedbackMessageType, string> = {
  report: "Bildirim",
  comment: "Yorum",
  question: "Soru",
  answer: "Cevap",
  solution: "Cozum",
  system: "Sistem",
};

function pageTitleFallback(pathname: string) {
  const last = pathname.split("/").filter(Boolean).at(-1) || "admin";
  return last.replaceAll("-", " ");
}

function assetToAttachment(asset: StorageAsset): PageFeedbackAttachment {
  return {
    assetId: asset.id,
    url: asset.url || `/storage/${asset.bucket}/${asset.path}`,
    name: asset.name,
    mime: asset.mime,
    size: Number(asset.size || 0),
  };
}

function AttachmentPreview({ attachment }: { attachment: PageFeedbackAttachment }) {
  const url = resolveMediaUrl(attachment.url);
  const isImage = attachment.mime.startsWith("image/");

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border bg-muted">
        <Image
          src={url}
          alt={attachment.name}
          width={320}
          height={180}
          unoptimized
          className="aspect-video w-full object-cover"
        />
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="block rounded-md border bg-muted px-3 py-2 text-xs">
      {attachment.name}
    </a>
  );
}

function FilePills({ files, onRemove }: { files: File[]; onRemove: (index: number) => void }) {
  if (!files.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file, index) => (
        <span
          key={`${file.name}-${file.size}-${file.lastModified}`}
          className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
        >
          {file.name}
          <button type="button" onClick={() => onRemove(index)} className="text-muted-foreground hover:text-foreground">
            <X className="size-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

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
}: {
  thread: PageFeedbackThread;
  comment: string;
  messageType: PageFeedbackMessageType;
  files: File[];
  busy: boolean;
  onCommentChange: (value: string) => void;
  onMessageTypeChange: (value: PageFeedbackMessageType) => void;
  onFilesChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onSubmitComment: () => void;
  onStatus: (status: "in_review" | "resolved") => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm">{thread.subject}</p>
          <p className="text-muted-foreground text-xs">{thread.pagePath}</p>
        </div>
        <div className="flex gap-1">
          <Badge variant={thread.status === "resolved" ? "secondary" : "outline"}>
            {STATUS_LABELS[thread.status] ?? thread.status}
          </Badge>
          <Badge variant={thread.priority === "critical" || thread.priority === "high" ? "destructive" : "outline"}>
            {PRIORITY_LABELS[thread.priority]}
          </Badge>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {thread.comments.map((item) => (
          <div key={item.id} className="rounded-md bg-muted/50 p-3">
            <Badge variant={item.messageType === "question" ? "destructive" : "outline"} className="mb-2">
              {MESSAGE_TYPE_LABELS[item.messageType] ?? item.messageType}
            </Badge>
            <p className="whitespace-pre-wrap text-sm leading-6">{item.body}</p>
            {item.attachments.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {item.attachments.map((attachment) => (
                  <AttachmentPreview key={attachment.assetId} attachment={attachment} />
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-muted-foreground text-xs">{new Date(item.createdAt).toLocaleString("tr-TR")}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        <Textarea
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder="Bu not icin yorum ekle"
          className="min-h-20"
        />
        <FilePills files={files} onRemove={onRemoveFile} />
        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <select
              value={messageType}
              onChange={(event) => onMessageTypeChange(event.target.value as PageFeedbackMessageType)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="comment">Yorum</option>
              <option value="question">Netlestirme sorusu</option>
              <option value="answer">Cevap</option>
              <option value="solution">Cozum notu</option>
            </select>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
              <ImagePlus className="size-4" />
              Resim ekle
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(event) => onFilesChange(Array.from(event.target.files ?? []))}
              />
            </label>
          </div>
          <div className="flex gap-2">
            {thread.status !== "in_review" ? (
              <Button type="button" variant="outline" size="sm" onClick={() => onStatus("in_review")} disabled={busy}>
                Incele
              </Button>
            ) : null}
            {thread.status !== "resolved" ? (
              <Button type="button" variant="outline" size="sm" onClick={() => onStatus("resolved")} disabled={busy}>
                Cozuldu
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              onClick={onSubmitComment}
              disabled={busy || (!comment.trim() && files.length === 0)}
            >
              <Send className="mr-1 size-4" />
              Yorum
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageFeedbackWidget() {
  const pathname = usePathname();
  const pageTitle = useMemo(
    () =>
      typeof document === "undefined" ? pageTitleFallback(pathname) : document.title || pageTitleFallback(pathname),
    [pathname],
  );
  const { data, isFetching } = useListPageFeedbackQuery({ pagePath: pathname, limit: 20 });
  const [createAsset] = useCreateAssetAdminMutation();
  const [createFeedback, { isLoading: creating }] = useCreatePageFeedbackMutation();
  const [addComment, { isLoading: commenting }] = useAddPageFeedbackCommentMutation();
  const [updateFeedback, { isLoading: updating }] = useUpdatePageFeedbackMutation();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<PageFeedbackPriority>("normal");
  const [files, setFiles] = useState<File[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentTypes, setCommentTypes] = useState<Record<string, PageFeedbackMessageType>>({});
  const [commentFiles, setCommentFiles] = useState<Record<string, File[]>>({});

  const threads = data?.items ?? [];
  const openCount = threads.filter((item) => item.status !== "resolved" && item.status !== "closed").length;
  const busy = creating || commenting || updating;

  const uploadFiles = async (items: File[]) => {
    const uploaded: PageFeedbackAttachment[] = [];
    for (const file of items) {
      const asset = await createAsset({
        file,
        bucket: "page-feedback",
        folder: pathname.replace(/^\/+/, "").replace(/[^\w/-]+/g, "_"),
        metadata: { pagePath: pathname, source: "page_feedback" },
      }).unwrap();
      uploaded.push(assetToAttachment(asset));
    }
    return uploaded;
  };

  const removeNewFile = (index: number) => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const submitNew = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Konu ve not zorunlu.");
      return;
    }

    try {
      const attachments = await uploadFiles(files);
      await createFeedback({
        pagePath: pathname,
        pageTitle,
        subject: subject.trim(),
        body: body.trim(),
        priority,
        messageType: "report",
        attachments,
      }).unwrap();
      setSubject("");
      setBody("");
      setPriority("normal");
      setFiles([]);
      toast.success("Yazilimci notu kaydedildi.");
    } catch {
      toast.error("Not kaydedilemedi.");
    }
  };

  const submitComment = async (threadId: string) => {
    const comment = (commentDrafts[threadId] ?? "").trim();
    const messageType = commentTypes[threadId] ?? "comment";
    const selectedFiles = commentFiles[threadId] ?? [];
    if (!comment && selectedFiles.length === 0) return;

    try {
      const attachments = await uploadFiles(selectedFiles);
      await addComment({
        id: threadId,
        body: { body: comment || "Ek dosya eklendi.", messageType, attachments },
      }).unwrap();
      setCommentDrafts((current) => ({ ...current, [threadId]: "" }));
      setCommentTypes((current) => ({ ...current, [threadId]: "comment" }));
      setCommentFiles((current) => ({ ...current, [threadId]: [] }));
      toast.success("Yorum eklendi.");
    } catch {
      toast.error("Yorum eklenemedi.");
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed right-5 bottom-5 z-40 gap-2 shadow-lg" size="sm">
          <Bug className="size-4" />
          Yazilimci Notu
          {openCount ? <Badge variant="secondary">{openCount}</Badge> : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Sayfa notlari</SheetTitle>
          <SheetDescription>
            Bu ekrandaki sorun, yorum ve gorseller yazilimci icin sayfa yoluyla kaydedilir.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          <div className="rounded-lg border bg-card p-3">
            <div className="mb-3 flex items-center gap-2 text-muted-foreground text-sm">
              <MessageSquarePlus className="size-4" />
              Yeni not
            </div>
            <div className="space-y-3">
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Konu" />
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Yazilimciya not / sorun aciklamasi"
                className="min-h-28"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as PageFeedbackPriority)}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="low">Dusuk</option>
                  <option value="normal">Normal</option>
                  <option value="high">Yuksek</option>
                  <option value="critical">Kritik</option>
                </select>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                  <ImagePlus className="size-4" />
                  Resim ekle
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                  />
                </label>
              </div>
              <FilePills files={files} onRemove={removeNewFile} />
              <Button type="button" onClick={submitNew} disabled={busy} className="w-full">
                <Send className="mr-1 size-4" />
                Notu kaydet
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">Bu sayfadaki notlar</p>
              <span className={cn("text-muted-foreground text-xs", isFetching && "animate-pulse")}>
                {threads.length} kayit
              </span>
            </div>
            {threads.length ? (
              threads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  comment={commentDrafts[thread.id] ?? ""}
                  messageType={commentTypes[thread.id] ?? "comment"}
                  files={commentFiles[thread.id] ?? []}
                  busy={busy}
                  onCommentChange={(value) => setCommentDrafts((current) => ({ ...current, [thread.id]: value }))}
                  onMessageTypeChange={(value) => setCommentTypes((current) => ({ ...current, [thread.id]: value }))}
                  onFilesChange={(nextFiles) => setCommentFiles((current) => ({ ...current, [thread.id]: nextFiles }))}
                  onRemoveFile={(index) =>
                    setCommentFiles((current) => ({
                      ...current,
                      [thread.id]: (current[thread.id] ?? []).filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                  onSubmitComment={() => submitComment(thread.id)}
                  onStatus={(status) =>
                    updateFeedback({ id: thread.id, body: { status } })
                      .unwrap()
                      .catch(() => toast.error("Durum guncellenemedi."))
                  }
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed py-8 text-center text-muted-foreground text-sm">
                Bu sayfa icin henuz not yok.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
