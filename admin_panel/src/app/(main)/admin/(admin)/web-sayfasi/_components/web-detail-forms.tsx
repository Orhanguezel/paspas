'use client';

// Banner ve "Neden Promats" kayitlari icin yapilandirilmis formlar (G1).
// Alanlar duzenlenir, HTML her degisiklikte sablondan yeniden uretilir;
// frontend'in regex sozlesmesi kullanicinin eline hic gecmez.

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  buildHeroDetail,
  buildNedenDetail,
  type HeroFields,
  type NedenFields,
} from '../_lib/promats-detail-html';

export function HeroBannerForm({ initial, onChange }: { initial: HeroFields; onChange: (html: string) => void }) {
  const [fields, setFields] = useState<HeroFields>(initial);

  const update = (patch: Partial<HeroFields>) => {
    const next = { ...fields, ...patch };
    setFields(next);
    onChange(buildHeroDetail(next));
  };

  return (
    <div className="space-y-4 rounded-xl border bg-muted/10 p-4">
      <div>
        <div className="font-medium">Slayt metni</div>
        <p className="text-muted-foreground text-xs">
          Başlık, alt metin ve düğme ayrı alanlardan yönetilir; sayfa yapısı otomatik korunur.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="hero-line1">Başlık 1. satır</Label>
          <Input id="hero-line1" value={fields.line1} onChange={(e) => update({ line1: e.target.value })} placeholder="MODERN TASARIM," />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hero-line2">Başlık 2. satır</Label>
          <Input id="hero-line2" value={fields.line2} onChange={(e) => update({ line2: e.target.value })} placeholder="GÜNLÜK KONFOR" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hero-text">Alt metin</Label>
        <Textarea id="hero-text" className="min-h-24" value={fields.text} onChange={(e) => update({ text: e.target.value })} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="hero-btn-label">Düğme yazısı</Label>
          <Input id="hero-btn-label" value={fields.buttonLabel} onChange={(e) => update({ buttonLabel: e.target.value })} placeholder="Serileri İncele" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hero-btn-url">Düğme bağlantısı</Label>
          <Input id="hero-btn-url" value={fields.buttonUrl} onChange={(e) => update({ buttonUrl: e.target.value })} placeholder="/tr/urunler" />
        </div>
      </div>
    </div>
  );
}

export function NedenPromatsForm({ initial, onChange }: { initial: NedenFields; onChange: (html: string) => void }) {
  const [fields, setFields] = useState<NedenFields>(initial);

  const update = (next: NedenFields) => {
    setFields(next);
    onChange(buildNedenDetail(next));
  };

  return (
    <div className="space-y-4 rounded-xl border bg-muted/10 p-4">
      <div>
        <div className="font-medium">Neden Promats bölümü</div>
        <p className="text-muted-foreground text-xs">
          Metin ve turuncu rozet barı ayrı alanlardan yönetilir; sayfa yapısı otomatik korunur.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="neden-title">Bölüm başlığı</Label>
        <Input id="neden-title" value={fields.title} onChange={(e) => update({ ...fields, title: e.target.value })} placeholder="NEDEN PROMATS?" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="neden-paragraphs">Metin</Label>
        <Textarea
          id="neden-paragraphs"
          className="min-h-40"
          value={fields.paragraphs}
          onChange={(e) => update({ ...fields, paragraphs: e.target.value })}
        />
        <p className="text-muted-foreground text-xs">Paragrafları bir boş satırla ayırın.</p>
      </div>
      <div className="space-y-2">
        <Label>Rozet barı</Label>
        {fields.badges.map((badge, index) => (
          <div key={index} className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
            <div className="min-w-40 flex-1 space-y-1">
              <Label className="text-xs" htmlFor={`badge-label-${index}`}>Etiket</Label>
              <Input
                id={`badge-label-${index}`}
                value={badge.label}
                onChange={(e) => {
                  const badges = fields.badges.map((item, i) => (i === index ? { ...item, label: e.target.value } : item));
                  update({ ...fields, badges });
                }}
              />
            </div>
            <div className="min-w-52 flex-1 space-y-1">
              <Label className="text-xs" htmlFor={`badge-image-${index}`}>İkon yolu</Label>
              <Input
                id={`badge-image-${index}`}
                value={badge.image}
                onChange={(e) => {
                  const badges = fields.badges.map((item, i) => (i === index ? { ...item, image: e.target.value } : item));
                  update({ ...fields, badges });
                }}
              />
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Rozeti sil"
              onClick={() => update({ ...fields, badges: fields.badges.filter((_, i) => i !== index) })}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => update({ ...fields, badges: [...fields.badges, { image: '', label: '' }] })}
        >
          <Plus className="mr-1 size-4" /> Rozet ekle
        </Button>
      </div>
    </div>
  );
}
