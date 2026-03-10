"use client";

// =============================================================
// FILE: src/app/(main)/admin/_components/common/MediaGalleryField.tsx
// Paspas ERP — Shared media gallery field (image/video/url)
// Uses AdminImageUploadField for images, manual URL input for video/url
// =============================================================

import { useCallback, useState } from "react";

import {
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Star,
  Trash2,
  ChevronUp,
  ChevronDown,
  Video,
} from "lucide-react";

import { AdminImageUploadField } from "@/components/common/AdminImageUploadField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// ── Types ────────────────────────────────────────────────────

export type MedyaTip = "image" | "video" | "url";

export interface MediaItem {
  id?: string;
  tip: MedyaTip;
  url: string;
  storageAssetId?: string;
  baslik?: string;
  sira: number;
  isCover: boolean;
}

export interface MediaGalleryFieldProps {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  disabled?: boolean;
  bucket?: string;
  folder?: string;
  maxItems?: number;
}

// ── Helpers ──────────────────────────────────────────────────

const TIP_ICON: Record<MedyaTip, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  url: LinkIcon,
};

const TIP_LABEL: Record<MedyaTip, string> = {
  image: "Resim",
  video: "Video",
  url: "URL",
};

function reorder(items: MediaItem[]): MediaItem[] {
  return items.map((item, idx) => ({ ...item, sira: idx + 1 }));
}

function isImageUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".webp") ||
    lower.includes(".gif") ||
    lower.includes(".svg") ||
    lower.includes(".avif")
  );
}

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes(".mp4") ||
    lower.includes(".webm") ||
    lower.includes(".mov") ||
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("vimeo.com")
  );
}

// ── Component ────────────────────────────────────────────────

export default function MediaGalleryField({
  items,
  onChange,
  disabled = false,
  bucket = "public",
  folder = "product-media",
  maxItems = 50,
}: MediaGalleryFieldProps) {
  const [addUrlMode, setAddUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlTitleInput, setUrlTitleInput] = useState("");

  // ── Derived ────────────────────────────────────────────────
  const imageItems = items.filter((i) => i.tip === "image");
  const nonImageItems = items.filter((i) => i.tip !== "image");
  const imageUrls = imageItems.map((i) => i.url);
  const coverUrl = items.find((i) => i.isCover)?.url ?? imageUrls[0] ?? "";

  // ── Image upload via AdminImageUploadField (multiple) ──────
  const handleImageUrlsChange = useCallback(
    (newUrls: string[]) => {
      // Map existing images by URL for identity preservation
      const existingMap = new Map(imageItems.map((item) => [item.url, item]));

      const updatedImages: MediaItem[] = newUrls.map((url, idx) => {
        const existing = existingMap.get(url);
        return existing
          ? { ...existing, sira: idx + 1 }
          : {
              tip: "image" as const,
              url,
              sira: idx + 1,
              isCover: false,
              baslik: undefined,
            };
      });

      // Merge: images first, then non-images
      const merged = reorder([...updatedImages, ...nonImageItems]);

      // Ensure there's a cover
      if (merged.length > 0 && !merged.some((m) => m.isCover)) {
        merged[0] = { ...merged[0], isCover: true };
      }

      onChange(merged);
    },
    [imageItems, nonImageItems, onChange],
  );

  const handleCoverChange = useCallback(
    (url: string) => {
      const updated = items.map((item) => ({
        ...item,
        isCover: item.url === url,
      }));
      onChange(updated);
    },
    [items, onChange],
  );

  const handleImageSelect = useCallback(
    (selection: { url: string; assetId: string | null }) => {
      // Find matching item and update storageAssetId
      const updated = items.map((item) =>
        item.url === selection.url && selection.assetId
          ? { ...item, storageAssetId: selection.assetId }
          : item,
      );
      onChange(updated);
    },
    [items, onChange],
  );

  // ── URL add handler ────────────────────────────────────────
  const handleAddUrl = useCallback(() => {
    const url = urlInput.trim();
    if (!url) return;
    if (items.length >= maxItems) return;

    let tip: MedyaTip = "url";
    if (isImageUrl(url)) tip = "image";
    else if (isVideoUrl(url)) tip = "video";

    const newItem: MediaItem = {
      tip,
      url,
      baslik: urlTitleInput.trim() || undefined,
      sira: items.length + 1,
      isCover: items.length === 0,
    };

    onChange(reorder([...items, newItem]));
    setUrlInput("");
    setUrlTitleInput("");
    setAddUrlMode(false);
  }, [urlInput, urlTitleInput, items, maxItems, onChange]);

  // ── Non-image item actions ─────────────────────────────────
  const handleRemoveNonImage = useCallback(
    (url: string) => {
      const removed = items.find((i) => i.url === url);
      const newItems = items.filter((i) => i.url !== url);
      if (removed?.isCover && newItems.length > 0) {
        newItems[0] = { ...newItems[0], isCover: true };
      }
      onChange(reorder(newItems));
    },
    [items, onChange],
  );

  const handleMoveNonImage = useCallback(
    (url: string, dir: -1 | 1) => {
      const idx = items.findIndex((i) => i.url === url);
      if (idx < 0) return;
      const target = idx + dir;
      if (target < 0 || target >= items.length) return;
      const arr = [...items];
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      onChange(reorder(arr));
    },
    [items, onChange],
  );

  const handleNonImageTitleChange = useCallback(
    (url: string, baslik: string) => {
      const updated = items.map((item) =>
        item.url === url ? { ...item, baslik } : item,
      );
      onChange(updated);
    },
    [items, onChange],
  );

  return (
    <div className="space-y-4">
      {/* ── Image upload (AdminImageUploadField multiple) ── */}
      <div className="space-y-2">
        <AdminImageUploadField
          label="Görseller"
          helperText="Birden fazla görsel yükleyebilir veya kütüphaneden seçebilirsiniz."
          multiple
          bucket={bucket}
          folder={folder}
          values={imageUrls}
          onChangeMultiple={handleImageUrlsChange}
          coverValue={coverUrl}
          onSelectAsCover={handleCoverChange}
          onSelectAsset={handleImageSelect}
          disabled={disabled}
        />
      </div>

      {/* ── Non-image items (video / url) ─────────────────── */}
      {nonImageItems.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Video / URL
            </Label>
            {nonImageItems.map((item) => {
              const Icon = TIP_ICON[item.tip];
              return (
                <Card key={item.url} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Icon className="size-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          {TIP_LABEL[item.tip]}
                        </span>
                        <Input
                          value={item.baslik || ""}
                          onChange={(e) =>
                            handleNonImageTitleChange(item.url, e.target.value)
                          }
                          placeholder="Başlık (opsiyonel)"
                          className="h-7 text-xs"
                          disabled={disabled}
                        />
                        <p className="text-xs text-muted-foreground truncate">
                          {item.url}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => handleMoveNonImage(item.url, -1)}
                          disabled={disabled}
                          title="Yukarı"
                        >
                          <ChevronUp className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => handleMoveNonImage(item.url, 1)}
                          disabled={disabled}
                          title="Aşağı"
                        >
                          <ChevronDown className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          onClick={() => handleRemoveNonImage(item.url)}
                          disabled={disabled}
                          title="Kaldır"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* ── Add URL/video button ──────────────────────────── */}
      {!addUrlMode && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAddUrlMode(true)}
          disabled={disabled}
        >
          <LinkIcon className="size-3 mr-1.5" />
          Video / URL Ekle
        </Button>
      )}

      {addUrlMode && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <Label className="text-xs">URL</Label>
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              disabled={disabled}
              autoFocus
            />
            <Label className="text-xs">Başlık (opsiyonel)</Label>
            <Input
              value={urlTitleInput}
              onChange={(e) => setUrlTitleInput(e.target.value)}
              placeholder="Medya başlığı"
              disabled={disabled}
            />
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                onClick={handleAddUrl}
                disabled={disabled || !urlInput.trim()}
              >
                <Plus className="size-3 mr-1" />
                Ekle
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAddUrlMode(false);
                  setUrlInput("");
                  setUrlTitleInput("");
                }}
              >
                İptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
