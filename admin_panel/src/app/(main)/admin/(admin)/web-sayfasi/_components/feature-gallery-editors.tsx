'use client';

// Urun ozellikleri (web_promats_product_features) ve ozel sayfa galerisi
// (web_promats_special_page_gallery) icin satir editorleri (G5).
// Kayit PATCH govdesinde `features` / `gallery` dizisi olarak gider; backend
// replaceProductFeatures / replacePageGallery ile tabloyu yeniden kurar.

import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Row = Record<string, unknown>;

const FEATURE_TYPES = [
  { value: '1', label: 'Renk' },
  { value: '2', label: 'İkonlu Özellik' },
];

function mediaPreviewUrl(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) return raw;
  return `/userfiles/${raw.replace(/^\/+/, '')}`;
}

function move<T>(rows: T[], from: number, to: number): T[] {
  if (to < 0 || to >= rows.length) return rows;
  const next = [...rows];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

function UploadButton({ onUpload, onDone }: {
  onUpload: (file: File) => Promise<string>;
  onDone: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setBusy(true);
          try {
            const url = await onUpload(file);
            if (url) onDone(url);
          } catch {
            // ust bilesen toast gosterir
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button type="button" size="icon" variant="outline" aria-label="Görsel yükle" disabled={busy} onClick={() => inputRef.current?.click()}>
        <Upload className={`size-4 ${busy ? 'animate-pulse' : ''}`} />
      </Button>
    </>
  );
}

function RowShell({ index, count, image, onMove, onRemove, children }: {
  index: number;
  count: number;
  image: unknown;
  onMove: (to: number) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const preview = mediaPreviewUrl(image);
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
      {preview ? (
        <img src={preview} alt="" className="size-12 shrink-0 rounded-md border object-contain" />
      ) : (
        <div className="size-12 shrink-0 rounded-md border bg-muted" />
      )}
      {children}
      <div className="flex gap-1">
        <Button type="button" size="icon" variant="outline" aria-label="Yukarı taşı" disabled={index === 0} onClick={() => onMove(index - 1)}>
          <ArrowUp className="size-4" />
        </Button>
        <Button type="button" size="icon" variant="outline" aria-label="Aşağı taşı" disabled={index === count - 1} onClick={() => onMove(index + 1)}>
          <ArrowDown className="size-4" />
        </Button>
        <Button type="button" size="icon" variant="destructive" aria-label="Satırı sil" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/** Urun ozellikleri: tip + metin + gorsel; sira ok tuslariyla. Kaydedince tablo yeniden kurulur. */
export function ProductFeaturesEditor({ features, onChange, onUploadImage }: {
  features: Row[];
  onChange: (next: Row[]) => void;
  onUploadImage: (file: File) => Promise<string>;
}) {
  const apply = (rows: Row[]) => onChange(rows.map((row, index) => ({ ...row, sort_order: index })));

  return (
    <div className="space-y-3">
      <div>
        <div className="font-medium">Ürün Özellikleri</div>
        <p className="text-muted-foreground text-xs">
          "Renk" satırları ürün sayfasındaki renk listesini, "İkonlu Özellik" satırları ikonlu özellik
          şeridini besler. Renk formatı: <code>Siyah / Black|1112 101</code>.
        </p>
      </div>
      {features.map((row, index) => (
        <RowShell
          key={String(row.id ?? `new-${index}`)}
          index={index}
          count={features.length}
          image={row.image}
          onMove={(to) => apply(move(features, index, to))}
          onRemove={() => apply(features.filter((_, i) => i !== index))}
        >
          <div className="w-40 space-y-1">
            <Label className="text-xs">Tip</Label>
            <Select
              value={String(row.type ?? 2)}
              onValueChange={(value) => apply(features.map((item, i) => (i === index ? { ...item, type: Number(value) } : item)))}
            >
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FEATURE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-48 flex-1 space-y-1">
            <Label className="text-xs">Metin</Label>
            <Input
              value={String(row.feature ?? '')}
              onChange={(e) => apply(features.map((item, i) => (i === index ? { ...item, feature: e.target.value } : item)))}
            />
          </div>
          <div className="min-w-48 flex-1 space-y-1">
            <Label className="text-xs">Görsel yolu</Label>
            <Input
              value={String(row.image ?? '')}
              onChange={(e) => apply(features.map((item, i) => (i === index ? { ...item, image: e.target.value } : item)))}
            />
          </div>
          <UploadButton
            onUpload={onUploadImage}
            onDone={(url) => apply(features.map((item, i) => (i === index ? { ...item, image: url } : item)))}
          />
        </RowShell>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => apply([...features, { type: 2, image: '', feature: '', status: 0 }])}
      >
        <Plus className="mr-1 size-4" /> Özellik ekle
      </Button>
    </div>
  );
}

/** Ozel sayfa galerisi: gorsel listesi; sira ok tuslariyla. */
export function PageGalleryEditor({ gallery, onChange, onUploadImage }: {
  gallery: Row[];
  onChange: (next: Row[]) => void;
  onUploadImage: (file: File) => Promise<string>;
}) {
  const apply = (rows: Row[]) => onChange(rows.map((row, index) => ({ ...row, sort_order: index })));

  return (
    <div className="space-y-3">
      <div>
        <div className="font-medium">Sayfa Galerisi</div>
        <p className="text-muted-foreground text-xs">Sayfada gösterilen görsel listesi; boş görselli satırlar kaydedilmez.</p>
      </div>
      {gallery.map((row, index) => (
        <RowShell
          key={String(row.id ?? `new-${index}`)}
          index={index}
          count={gallery.length}
          image={row.image}
          onMove={(to) => apply(move(gallery, index, to))}
          onRemove={() => apply(gallery.filter((_, i) => i !== index))}
        >
          <div className="min-w-64 flex-1 space-y-1">
            <Label className="text-xs">Görsel yolu</Label>
            <Input
              value={String(row.image ?? '')}
              onChange={(e) => apply(gallery.map((item, i) => (i === index ? { ...item, image: e.target.value } : item)))}
            />
          </div>
          <UploadButton
            onUpload={onUploadImage}
            onDone={(url) => apply(gallery.map((item, i) => (i === index ? { ...item, image: url } : item)))}
          />
        </RowShell>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => apply([...gallery, { image: '', status: 0 }])}>
        <Plus className="mr-1 size-4" /> Görsel ekle
      </Button>
    </div>
  );
}
