'use client';

// =============================================================
// FILE: src/components/common/AdminImageUploadField.tsx
// FINAL — Admin Image Upload Field (App Router + shadcn)
// - Bootstrap yok, inline style minimum (sadece zorunlu yerlerde)
// - Multiple preview: one image per row
// - Cover cannot be removed
// - URL truncated + full on hover + copy
// - previewAspect + previewObjectFit (single preview)
// - SVG preview support (+ Cloudinary sanitize) + ICO destekli
// - Cloudinary raw/upload uzantısız => svg sayılmaz
// =============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Copy, FileText, Image as ImageIcon, Library, Upload, Star, Trash2, X } from 'lucide-react';

import { useCreateAssetAdminMutation, useListAssetsAdminQuery } from '@/integrations/hooks';
import { resolveMediaUrl } from '@/lib/media-url';
import { BASE_URL } from '@/integrations/apiBase';
import type { StorageAsset } from '@/integrations/shared';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type AdminImageUploadFieldProps = {
  label?: string;
  helperText?: React.ReactNode;

  bucket?: string;
  folder?: string;
  metadata?: Record<string, string | number | boolean>;

  value?: string;
  onChange?: (url: string) => void;
  onSelectAsset?: (selection: { url: string; assetId: string | null }) => void;

  values?: string[];
  onChangeMultiple?: (urls: string[]) => void;

  onSelectAsCover?: (url: string) => void;
  coverValue?: string;

  /** URL → medya tipi haritası. URL uzantısından tespit edilemeyen PDF'ler için. */
  valueTypes?: Record<string, string>;
  /** URL → storage asset id haritası. PDF gibi provider URL'lerini same-origin stream etmek için. */
  valueAssetIds?: Record<string, string>;

  disabled?: boolean;

  openLibraryHref?: string;
  onOpenLibraryClick?: () => void;

  multiple?: boolean;

  previewAspect?: '16x9' | '4x3' | '1x1';
  previewObjectFit?: 'cover' | 'contain';
};

const LIBRARY_PAGE_SIZE = 24;

const norm = (v: unknown) => String(v ?? '').trim();

const isSvgUrl = (raw: string | undefined | null): boolean => {
  const s = norm(raw);
  if (!s) return false;

  const lower = s.toLowerCase();
  const base = lower.split('?')[0].split('#')[0];

  if (base.endsWith('.svg')) return true;
  if (lower.startsWith('data:image/svg+xml')) return true;
  if (lower.includes('format=svg') || lower.includes('f_svg')) return true;

  // raw/upload + uzantısız (favicon gibi) artık svg değil
  return false;
};

const isPdfUrl = (raw: string | undefined | null): boolean => {
  const s = norm(raw);
  if (!s) return false;
  const base = s.toLowerCase().split('?')[0].split('#')[0];
  return base.endsWith('.pdf');
};

/**
 * Cloudinary PDF → ilk sayfa JPEG thumbnail URL'i.
 * Sadece resource_type="image" ile yüklenen PDF'lerde çalışır.
 * /raw/upload/ veya Cloudinary dışı URL'lerde null döner.
 */
const cloudinaryPdfThumbUrl = (raw: string): string | null => {
  const s = norm(raw);
  if (!s || !s.includes('res.cloudinary.com')) return null;
  if (s.includes('/raw/upload/')) return null;
  const marker = '/upload/';
  const idx = s.indexOf(marker);
  if (idx < 0) return null;
  const before = s.slice(0, idx + marker.length);
  const after = s.slice(idx + marker.length);
  return `${before}f_jpg,pg_1/${after}`;
};

const withCloudinarySanitizeIfSvg = (raw: string): string => {
  const s = norm(raw);
  if (!s) return '';
  if (!isSvgUrl(s)) return s;

  if (s.startsWith('data:image/svg+xml')) return s;
  if (!s.includes('res.cloudinary.com')) return s;

  // raw/upload ise hiç dokunma
  if (s.includes('/raw/upload/')) return s;
  if (s.includes('fl_sanitize')) return s;

  const marker = '/upload/';
  const idx = s.indexOf(marker);
  if (idx < 0) return s;

  const before = s.slice(0, idx + marker.length);
  const after = s.slice(idx + marker.length);

  const firstSeg = after.split('/')[0] || '';
  const rest = after.slice(firstSeg.length);

  if (firstSeg.startsWith('v')) {
    return `${before}fl_sanitize/${after}`;
  }

  return `${before}${firstSeg},fl_sanitize${rest}`;
};

const toMeta = (metadata?: Record<string, string | number | boolean>) => {
  if (!metadata) return undefined;
  return Object.fromEntries(Object.entries(metadata).map(([k, v]) => [k, String(v)]));
};

const uniqAppend = (arr: string[], items: string[]) => {
  const set = new Set(arr.map((x) => norm(x)));
  const out = [...arr];
  for (const it of items) {
    const v = norm(it);
    if (v && !set.has(v)) {
      set.add(v);
      out.push(v);
    }
  }
  return out;
};

const displayUrl = (raw: string, max = 72) => {
  const s = norm(raw);
  if (!s) return '';
  if (s.length <= max) return s;

  try {
    const u = new URL(s);
    const host = u.host;
    const path = u.pathname || '';
    const last = path.split('/').filter(Boolean).pop() || '';
    const short = `${host}/…/${last}`;
    if (short.length <= max) return short;
  } catch {
    // ignore
  }

  const head = s.slice(0, Math.max(18, Math.floor(max * 0.55)));
  const tail = s.slice(-Math.max(12, Math.floor(max * 0.25)));
  return `${head}…${tail}`;
};

const ratioOf = (aspect: '16x9' | '4x3' | '1x1') => {
  if (aspect === '4x3') return 4 / 3;
  if (aspect === '1x1') return 1;
  return 16 / 9;
};

/** Encode path segments for URL */
const encodeAssetPath = (p: string | null | undefined): string => {
  const s = norm(p);
  if (!s) return '';
  return s.split('/').map(encodeURIComponent).join('/');
};

/**
 * Resolve preview URL for a storage asset.
 * Prefers Cloudinary/absolute URLs, falls back to /storage/{bucket}/{path}
 * which does a 302 redirect on the backend — works for both local and cloudinary.
 */
const getAdminAssetPreviewUrl = (asset: Pick<StorageAsset, 'url' | 'bucket' | 'path'>): string => {
  const rawUrl = norm(asset.url);

  // Absolute URLs (Cloudinary etc.) — use directly
  if (rawUrl && /^https?:\/\//i.test(rawUrl)) return rawUrl;

  // Fallback: /storage/{bucket}/{path} endpoint (does 302 redirect)
  const bucket = norm(asset.bucket);
  const path = encodeAssetPath(asset.path);
  if (bucket && path) {
    const base = BASE_URL.replace(/\/+$/, '');
    return `${base}/storage/${encodeURIComponent(bucket)}/${path}`;
  }

  // Last resort: try resolveMediaUrl on the raw url
  if (rawUrl) return resolveMediaUrl(rawUrl);

  return '';
};

/** PDF thumbnail: önce Cloudinary'den ilk sayfa JPEG dene, başarısızsa PDF ikonu göster. */
const PdfPreviewCell: React.FC<{ url: string }> = ({ url }) => {
  const thumb = cloudinaryPdfThumbUrl(url);
  const [thumbOk, setThumbOk] = React.useState(!!thumb);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted/30">
      {thumbOk && thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt="PDF önizleme"
          className="h-full w-full object-contain"
          onError={() => setThumbOk(false)}
        />
      ) : (
        <>
          <FileText className="size-10 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">PDF</span>
        </>
      )}
    </div>
  );
};

const UrlLine: React.FC<{ url: string; disabled?: boolean }> = ({ url, disabled }) => {
  const safe = norm(url);
  if (!safe) return null;

  const shown = displayUrl(safe, 80);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(safe);
      toast.success('URL kopyalandı.');
    } catch {
      toast.error('Kopyalanamadı.');
    }
  };

  return (
    <div className="mt-2 flex min-w-0 items-center gap-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs text-muted-foreground" title={safe}>
          {shown}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={copy}
        disabled={disabled}
        title="Kopyala"
      >
        <Copy className="mr-2 size-4" />
        Kopyala
      </Button>
    </div>
  );
};

export const AdminImageUploadField: React.FC<AdminImageUploadFieldProps> = ({
  label = 'Görsel',
  helperText,
  bucket = 'default',
  folder = 'uploads',
  metadata,

  value,
  onChange,
  onSelectAsset,

  values,
  onChangeMultiple,
  onSelectAsCover,
  coverValue,
  valueTypes,
  valueAssetIds,

  disabled,
  openLibraryHref,
  onOpenLibraryClick,
  multiple = false,

  previewAspect = '16x9',
  previewObjectFit = 'cover',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [createAssetAdmin, { isLoading: isUploading }] = useCreateAssetAdminMutation();

  // PDF inline preview dialog
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [libraryPage, setLibraryPage] = useState(1);
  const libraryOffset = (libraryPage - 1) * LIBRARY_PAGE_SIZE;

  // Fetch library assets (global storage list: all buckets/folders)
  const {
    data: assetsData,
    isLoading: isLoadingAssets,
    isError: isAssetsError,
    error: assetsError,
  } = useListAssetsAdminQuery(
    { limit: LIBRARY_PAGE_SIZE, offset: libraryOffset, sort: 'created_at', order: 'desc' },
    { skip: !isModalOpen || activeTab !== 'library' }
  );

  useEffect(() => {
    if (!isModalOpen) {
      setLibraryPage(1);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (activeTab !== 'library') {
      setLibraryPage(1);
    }
  }, [activeTab]);

  const libraryTotal = Number(assetsData?.total ?? 0);
  const libraryPageCount = Math.max(1, Math.ceil(libraryTotal / LIBRARY_PAGE_SIZE));
  const canPrevPage = libraryPage > 1;
  const canNextPage = libraryPage < libraryPageCount;

  const meta = useMemo(() => toMeta(metadata), [metadata]);
  const gallery = useMemo(
    () => (Array.isArray(values) ? values.map(norm).filter(Boolean) : []),
    [values],
  );

  const busy = !!disabled || isUploading;

  const handlePickClick = () => {
    if (busy) return;
    setActiveTab('upload');
    setIsModalOpen(true);
  };

  const handleDirectFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSelectFromLibrary = (url: string, assetId?: string | null) => {
    if (!url) return;

    if (multiple && onChangeMultiple) {
      onChangeMultiple(uniqAppend(gallery, [url]));
      toast.success('Görsel eklendi.');
    } else if (onChange) {
      onChange(url);
      onSelectAsset?.({ url, assetId: assetId ?? null });
      toast.success('Görsel seçildi.');
    }

    setIsModalOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;

    if (!multiple) {
      const file = files[0];
      console.debug('[AdminImageUpload] file selected:', {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      // SVG dosya için MIME type düzeltmesi
      // Bazı tarayıcılar SVG'yi doğru MIME ile göndermeyebilir
      let uploadFile: File = file;
      if (
        file.name.toLowerCase().endsWith('.svg') &&
        file.type !== 'image/svg+xml'
      ) {
        console.debug('[AdminImageUpload] fixing SVG MIME type:', file.type, '→ image/svg+xml');
        uploadFile = new File([file], file.name, { type: 'image/svg+xml' });
      }

      try {
        const res = await createAssetAdmin({
          file: uploadFile,
          bucket,
          folder,
          metadata: meta,
        } as any).unwrap();
        const url = norm((res as any)?.url);
        const assetId = norm((res as any)?.id) || null;
        if (!url) throw new Error("Görsel URL'i alınamadı.");
        onChange?.(url);
        onSelectAsset?.({ url, assetId });
        toast.success('Görsel yüklendi.');
        setIsModalOpen(false);
      } catch (err: any) {
        console.error('[AdminImageUpload] upload failed:', JSON.stringify(err, null, 2), err);
        const msg =
          err?.data?.error?.message ||
          err?.data?.message ||
          err?.error ||
          err?.message ||
          'Görsel yüklenirken hata oluştu.';
        toast.error(typeof msg === 'string' ? msg : 'Görsel yüklenirken hata oluştu.');
      }
      return;
    }

    const uploadedUrls: string[] = [];
    let successCount = 0;

    for (const file of files) {
      // SVG dosya için MIME type düzeltmesi
      let uploadFile: File = file;
      if (
        file.name.toLowerCase().endsWith('.svg') &&
        file.type !== 'image/svg+xml'
      ) {
        uploadFile = new File([file], file.name, { type: 'image/svg+xml' });
      }

      try {
        const res = await createAssetAdmin({
          file: uploadFile,
          bucket,
          folder,
          metadata: meta,
        } as any).unwrap();
        const url = norm((res as any)?.url);
        if (url) {
          uploadedUrls.push(url);
          successCount += 1;
        }
      } catch (err: any) {
        console.error('[AdminImageUpload] bulk upload failed:', JSON.stringify(err, null, 2), err);
        const emsg =
          err?.data?.error?.message ||
          err?.data?.message ||
          err?.error ||
          err?.message ||
          'Bazı görseller yüklenirken hata oluştu.';
        toast.error(
          typeof emsg === 'string' ? emsg : 'Bazı görseller yüklenirken hata oluştu.',
        );
      }
    }

    if (successCount > 0) {
      if (onChangeMultiple) {
        onChangeMultiple(uniqAppend(gallery, uploadedUrls));
      } else {
        onChange?.(uploadedUrls[0]);
      }
      toast.success(successCount === 1 ? 'Görsel yüklendi.' : `${successCount} görsel yüklendi.`);
      setIsModalOpen(false);
    }
  };

  const handleOpenLibrary = (e: React.MouseEvent) => {
    if (onOpenLibraryClick) {
      e.preventDefault();
      onOpenLibraryClick();
    }
  };

  const removeAt = (idx: number) => {
    if (!onChangeMultiple) return;

    const url = gallery[idx];
    const isCover = !!coverValue && norm(coverValue) === url;

    if (isCover) {
      toast.error('Kapak görseli silinemez. Önce başka bir kapak seç.');
      return;
    }
    onChangeMultiple(gallery.filter((_, i) => i !== idx));
  };

  const aspect = ratioOf(previewAspect);
  const getPdfPreviewUrl = (url: string) => {
    const assetId = valueAssetIds?.[url];
    return assetId ? `/api/admin/storage/assets/${encodeURIComponent(assetId)}/inline` : resolveMediaUrl(url);
  };

  const SinglePreview = () => {
    if (!value) {
      return (
        <div className="rounded-md border bg-muted/20 p-3 text-center text-sm text-muted-foreground">
          Henüz görsel seçilmedi.
        </div>
      );
    }

    const svg = isSvgUrl(value);
    const pdf = isPdfUrl(value) || valueTypes?.[value] === 'pdf';
    const previewUrlRaw = svg ? withCloudinarySanitizeIfSvg(value) : value;
    const previewUrl = resolveMediaUrl(previewUrlRaw);

    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Önizleme</div>

        <div className="overflow-hidden rounded-md border bg-background">
          <AspectRatio ratio={aspect}>
            {pdf ? (
              <PdfPreviewCell url={value} />
            ) : svg ? (
              <object
                data={previewUrl}
                type="image/svg+xml"
                className="h-full w-full"
                aria-label="SVG preview"
              >
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  SVG önizleme açılamadı.
                </div>
              </object>
            ) : (
              <div className="relative h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Görsel"
                  className="h-full w-full"
                  style={{ objectFit: previewObjectFit }}
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.style.display = 'none';
                    const parent = img.parentElement;
                    if (parent && !parent.querySelector('.error-placeholder')) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className =
                        'error-placeholder absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/50';
                      errorDiv.innerHTML = `
                        <svg class="size-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span class="text-xs text-muted-foreground">Görsel yüklenemedi</span>
                      `;
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
              </div>
            )}
          </AspectRatio>
        </div>

        {pdf && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPdfPreviewUrl(getPdfPreviewUrl(value))}
          >
            <FileText className="mr-2 size-4" />
            PDF'i Görüntüle
          </Button>
        )}

        {/* Full URL display */}
        <div className="rounded-md border bg-muted/50 p-2">
          <div className="mb-1 text-xs font-medium text-muted-foreground">URL:</div>
          <code className="block wrap-break-word text-xs font-mono leading-relaxed text-foreground">
            {value}
          </code>
        </div>

        <UrlLine url={value} disabled={busy} />
      </div>
    );
  };

  const MultiPreview = () => {
    if (!gallery.length) {
      return (
        <div className="rounded-md border bg-muted/20 p-3 text-center text-sm text-muted-foreground">
          Henüz galeri görseli yok.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Galeri</div>

        <div className="flex flex-col gap-2">
          {gallery.map((u, idx) => {
            const isCover = !!coverValue && norm(coverValue) === u;
            const svg = isSvgUrl(u);
            const pdf = isPdfUrl(u) || valueTypes?.[u] === 'pdf';
            const previewUrlRaw = svg ? withCloudinarySanitizeIfSvg(u) : u;
            const previewUrl = resolveMediaUrl(previewUrlRaw);

            return (
              <div
                key={`${u}-${idx}`}
                className={cn('rounded-md border p-2', isCover && 'border-primary')}
              >
                <div className="flex gap-3">
                  <div className="w-35 shrink-0">
                    <div className="overflow-hidden rounded-md border bg-background">
                      <AspectRatio ratio={16 / 9}>
                        {pdf ? (
                          <PdfPreviewCell url={u} />
                        ) : svg ? (
                          <object
                            data={previewUrl}
                            type="image/svg+xml"
                            className="h-full w-full"
                            aria-label={`SVG image ${idx + 1}`}
                          >
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                              SVG yüklenemedi.
                            </div>
                          </object>
                        ) : (
                          <div className="relative h-full w-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrl}
                              alt={`image-${idx + 1}`}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                img.style.display = 'none';
                                const parent = img.parentElement;
                                if (parent && !parent.querySelector('.error-placeholder')) {
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className =
                                    'error-placeholder absolute inset-0 flex items-center justify-center bg-muted/50';
                                  errorDiv.innerHTML = `
                                    <svg class="size-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  `;
                                  parent.appendChild(errorDiv);
                                }
                              }}
                            />
                          </div>
                        )}
                      </AspectRatio>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium" title={u}>
                          {pdf ? 'PDF' : isCover ? 'Kapak' : `Görsel ${idx + 1}`}
                        </div>
                        {isCover ? (
                          <Badge variant="secondary" className="mt-1">
                            Kapak
                          </Badge>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {pdf ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            title="PDF'i görüntüle"
                            onClick={() => setPdfPreviewUrl(getPdfPreviewUrl(u))}
                          >
                            <FileText className="mr-2 size-4" />
                            Görüntüle
                          </Button>
                        ) : onSelectAsCover ? (
                          <Button
                            type="button"
                            variant={isCover ? 'default' : 'outline'}
                            size="sm"
                            disabled={busy}
                            onClick={() => onSelectAsCover(u)}
                            title="Kapak yap"
                          >
                            <Star className="mr-2 size-4" />
                            Kapak
                          </Button>
                        ) : null}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy || !onChangeMultiple || isCover}
                          onClick={() => removeAt(idx)}
                          title={isCover ? 'Kapak silinemez' : 'Sil'}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Sil
                        </Button>
                      </div>
                    </div>

                    <UrlLine url={u} disabled={busy} />

                    {!onChangeMultiple ? (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Not: <code>onChangeMultiple</code> verilmediği için galeri parent tarafından
                        yönetilmiyor.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">{label}</div>
            {helperText ? <div className="text-xs text-muted-foreground">{helperText}</div> : null}
          </div>
          {isUploading ? <Badge variant="secondary">Yükleniyor…</Badge> : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <Label className="sr-only">Upload</Label>
        <Input
          ref={fileInputRef as any}
          type="file"
          accept="image/*,.svg,.ico,application/pdf,.pdf,video/*,.mp4,.webm,.mov"
          multiple={!!multiple}
          className="hidden"
          onChange={handleFileChange}
          disabled={busy}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={handlePickClick} disabled={busy}>
            <Upload className="mr-2 size-4" />
            {multiple ? 'Görseller Yükle' : 'Görsel Yükle'}
          </Button>
        </div>

        {!multiple ? <SinglePreview /> : <MultiPreview />}

        {/* Upload/Library Modal */}
        <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
          <SheetContent side="right" className="w-full p-0 sm:max-w-[94vw]">
            <SheetHeader className="border-b px-4 py-4 sm:px-6">
              <SheetTitle>{multiple ? 'Görseller Yükle' : 'Görsel Yükle'}</SheetTitle>
              <SheetDescription>
                Bilgisayarınızdan yükleyin veya kütüphaneden seçin.
              </SheetDescription>
            </SheetHeader>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'library')} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">
                  <Upload className="mr-2 size-4" />
                  Yükle
                </TabsTrigger>
                <TabsTrigger value="library">
                  <Library className="mr-2 size-4" />
                  Kütüphane
                </TabsTrigger>
              </TabsList>

              {/* Upload Tab */}
              <TabsContent value="upload" className="space-y-4">
                <div className="rounded-lg border bg-muted/20 p-6 text-center">
                  <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Upload className="size-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">Görsel seçin</h3>
                      <p className="text-sm text-muted-foreground">
                        {multiple
                          ? 'Birden fazla görsel yükleyebilirsiniz.'
                          : 'Tek bir görsel yükleyebilirsiniz.'}
                      </p>
                    </div>
                    <Button type="button" onClick={handleDirectFileSelect} disabled={busy} size="lg">
                      <Upload className="mr-2 size-4" />
                      Dosya Seç
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Library Tab */}
              <TabsContent value="library" className="space-y-4">
                {isLoadingAssets ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-sm text-muted-foreground">Yükleniyor...</div>
                  </div>
                ) : isAssetsError ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center gap-2">
                      <h3 className="font-semibold">Kütüphane yüklenemedi</h3>
                      <p className="text-sm text-muted-foreground">
                        {(assetsError as any)?.data?.error?.message ||
                          (assetsError as any)?.data?.message ||
                          'Storage listesi alınırken bir hata oluştu.'}
                      </p>
                    </div>
                  </div>
                ) : !assetsData?.items?.length ? (
                  <div className="rounded-lg border bg-muted/20 p-6 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                      <div className="rounded-full bg-muted p-3">
                        <ImageIcon className="size-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Kütüphane boş</h3>
                        <p className="text-sm text-muted-foreground">
                          Henüz yüklenmiş görsel yok. "Yükle" sekmesinden görsel yükleyebilirsiniz.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {assetsData.items.map((asset) => {
                      const previewUrl = getAdminAssetPreviewUrl(asset);
                      const selectUrl = previewUrl || asset.url || '';
                      const isSelected = multiple
                        ? gallery.some((g) => g === asset.url || g === previewUrl)
                        : (value === asset.url || value === previewUrl);

                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => handleSelectFromLibrary(selectUrl, asset.id)}
                          disabled={busy}
                          className={cn(
                            'group relative overflow-hidden rounded-lg border transition-all hover:border-primary',
                            isSelected && 'border-primary ring-2 ring-primary/20'
                          )}
                        >
                          <AspectRatio ratio={1}>
                            {isPdfUrl(selectUrl) ? (
                              <div className="flex size-full flex-col items-center justify-center gap-1 bg-muted/30">
                                <FileText className="size-8 text-muted-foreground transition-colors group-hover:text-primary" />
                                <span className="truncate px-1 text-xs text-muted-foreground">PDF</span>
                              </div>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewUrl}
                                alt={asset.name || 'Asset'}
                                className="size-full object-cover transition-transform group-hover:scale-105"
                                onError={(e) => {
                                  const img = e.currentTarget as HTMLImageElement;
                                  img.style.display = 'none';
                                  const parent = img.parentElement;
                                  if (parent && !parent.querySelector('.error-placeholder')) {
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className =
                                      'error-placeholder absolute inset-0 flex items-center justify-center bg-muted/50';
                                    errorDiv.innerHTML = `
                                      <svg class="size-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    `;
                                    parent.appendChild(errorDiv);
                                  }
                                }}
                              />
                            )}
                          </AspectRatio>
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                              <Badge>Seçildi</Badge>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {!isLoadingAssets && !isAssetsError && libraryTotal > 0 ? (
                  <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
                    <div className="text-xs text-muted-foreground">
                      Toplam {libraryTotal} görsel, sayfa {libraryPage}/{libraryPageCount}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canPrevPage}
                        onClick={() => setLibraryPage((p) => Math.max(1, p - 1))}
                      >
                        Önceki
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canNextPage}
                        onClick={() => setLibraryPage((p) => Math.min(libraryPageCount, p + 1))}
                      >
                        Sonraki
                      </Button>
                    </div>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </SheetContent>
        </Sheet>

        {/* PDF Inline Preview Dialog */}
        <Dialog open={!!pdfPreviewUrl} onOpenChange={(open) => { if (!open) setPdfPreviewUrl(null); }}>
          <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-4 py-3 border-b shrink-0">
              <DialogTitle className="text-sm font-medium">PDF Önizleme</DialogTitle>
            </DialogHeader>
            {pdfPreviewUrl && (
              <div className="flex-1 min-h-0">
                <object
                  data={pdfPreviewUrl}
                  type="application/pdf"
                  className="h-full w-full"
                  aria-label="PDF önizleme"
                >
                  <iframe
                    src={pdfPreviewUrl}
                    className="h-full w-full border-0"
                    title="PDF önizleme"
                  />
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <FileText className="size-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      PDF önizlemesi bu tarayıcıda gömülü açılamadı.
                    </p>
                    <Button asChild type="button" variant="outline">
                      <a href={pdfPreviewUrl} target="_blank" rel="noreferrer">
                        Yeni sekmede aç
                      </a>
                    </Button>
                  </div>
                </object>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminImageUploadField;
