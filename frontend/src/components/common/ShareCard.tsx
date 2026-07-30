'use client';

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import {
  Share2,
  Copy,
  Download,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  X as XIcon,
} from 'lucide-react';
import {
  getPublicAppName,
  getPublicSiteOrigin,
  getShareCardFooterTagline,
  getSiteDisplayHostname,
} from '@/lib/site-config';

const SHARE_THEME = {
  bg: 'var(--gm-sand-900)',
  bgAlt: 'var(--gm-sand-800)',
  surface: 'var(--gm-surface)',
  text: 'var(--gm-sand-50)',
  textMuted: 'var(--gm-muted)',
  textSoft: 'var(--gm-sand-200)',
  gold: 'var(--gm-gold)',
  blue: 'var(--gm-info)',
  red: 'var(--gm-error)',
  green: 'var(--gm-success)',
};

interface ShareCardProps {
  title: string;
  description?: string;
  shareText: string;
  shareUrl?: string;
  variant: 'insight' | 'session' | 'profile' | 'reflection' | 'analysis';
  data: any;
  trigger?: React.ReactNode;
}

export default function ShareCard({
  title,
  description,
  shareText,
  shareUrl,
  variant,
  data,
  trigger,
}: ShareCardProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : getPublicSiteOrigin());
  const enc = encodeURIComponent;

  async function generatePng(): Promise<{ blob: Blob; file: File } | null> {
    if (!cardRef.current) return null;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: SHARE_THEME.bg,
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `share-${variant}-${Date.now()}.png`, { type: 'image/png' });
      return { blob, file };
    } catch (e) {
      console.error('toPng failed', e);
      return null;
    }
  }

  async function nativeShare() {
    setBusy(true);
    try {
      const result = await generatePng();
      const shareData: ShareData = { title, text: shareText, url };
      if (result && (navigator as any).canShare?.({ files: [result.file] })) {
        await navigator.share({ ...shareData, files: [result.file] });
      } else if ((navigator as any).share) {
        await navigator.share(shareData);
      } else {
        await copyLink();
      }
    } catch {
      // User cancelled
    } finally {
      setBusy(false);
    }
  }

  async function downloadImage() {
    setBusy(true);
    try {
      const result = await generatePng();
      if (!result) {
        toast.error('Görsel oluşturulamadı');
        return;
      }
      const link = document.createElement('a');
      link.href = URL.createObjectURL(result.blob);
      link.download = result.file.name;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Görsel indirildi');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      toast.success('Link kopyalandı');
    } catch {
      toast.error('Kopyalanamadı');
    }
  }

  function withUtm(baseUrl: string, source: string): string {
    try {
      const u = new URL(baseUrl);
      u.searchParams.set('utm_source', source);
      u.searchParams.set('utm_medium', 'social_share');
      u.searchParams.set('utm_campaign', variant);
      return u.toString();
    } catch {
      return baseUrl;
    }
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(withUtm(url, 'twitter'))}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${enc(withUtm(url, 'facebook'))}&quote=${enc(shareText)}`;
  const whatsappUrl = `https://wa.me/?text=${enc(`${shareText}\n${withUtm(url, 'whatsapp')}`)}`;

  const variantTitle =
    variant === 'insight'
      ? 'İçgörü kartım'
      : variant === 'session'
        ? 'İşlem özetim'
        : variant === 'profile'
          ? 'Profil özetim'
          : variant === 'reflection'
            ? 'Yansıtma notum'
            : 'Analiz özetim';

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-(--gm-gold) bg-(--gm-gold)/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-(--gm-gold-deep) transition-colors hover:bg-(--gm-gold) hover:text-(--gm-bg-deep)"
        >
          <Share2 size={14} />
          Paylaş
        </button>
      )}

      <div className="fixed -left-[9999px] -top-[9999px]">
        <div
          ref={cardRef}
          style={{
            width: 1080,
            height: 1350,
            background: `linear-gradient(135deg, ${SHARE_THEME.bgAlt} 0%, color-mix(in srgb, ${SHARE_THEME.bgAlt} 65%, ${SHARE_THEME.gold}) 60%, ${SHARE_THEME.bg} 100%)`,
            color: SHARE_THEME.text,
            padding: 80,
            fontFamily: 'Cinzel, Georgia, serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 60, right: 60, opacity: 0.45 }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="98" fill="none" stroke={SHARE_THEME.gold} strokeWidth="0.5" strokeDasharray="3 3"/>
              <circle cx="100" cy="100" r="70" fill="none" stroke={SHARE_THEME.gold} strokeWidth="0.5"/>
              <circle cx="100" cy="100" r="40" fill="none" stroke={SHARE_THEME.gold} strokeWidth="0.5"/>
              <circle cx="100" cy="100" r="4" fill={SHARE_THEME.gold}/>
            </svg>
          </div>

          <div>
            <div style={{ fontSize: 18, letterSpacing: 8, color: SHARE_THEME.gold, textTransform: 'uppercase', marginBottom: 24 }}>
              {getPublicAppName()}
            </div>
            <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 64, fontStyle: 'italic', lineHeight: 1.05, marginBottom: 16, color: SHARE_THEME.text }}>
              {variantTitle}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40 }}>
            <GenericShareContent data={data} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 18, color: SHARE_THEME.textMuted, fontFamily: 'Manrope, sans-serif' }}>
              {getSiteDisplayHostname()}
            </div>
            <div style={{ fontSize: 14, letterSpacing: 4, color: SHARE_THEME.gold, textTransform: 'uppercase' }}>
              {getShareCardFooterTagline()}
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-(--gm-text-dim) hover:bg-(--gm-bg-deep) hover:text-(--gm-text)"
            >
              <XIcon size={16} />
            </button>

            <div className="mb-6">
              <div className="font-display text-[10px] tracking-[0.32em] text-(--gm-gold-deep) uppercase">
                Paylaş
              </div>
              <h3 className="mt-1 font-serif text-2xl text-(--gm-text)">
                {title}
              </h3>
              {description && (
                <p className="mt-2 text-sm text-(--gm-text-dim)">
                  {description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={nativeShare}
                disabled={busy}
                className="inline-flex flex-col items-center gap-2 rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-4 text-(--gm-text) transition-colors hover:border-(--gm-gold)/50 disabled:opacity-50"
              >
                <Share2 size={20} className="text-(--gm-gold-deep)" />
                <span className="text-xs font-medium">Hızlı paylaş</span>
              </button>
              <button
                type="button"
                onClick={downloadImage}
                disabled={busy}
                className="inline-flex flex-col items-center gap-2 rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-4 text-(--gm-text) transition-colors hover:border-(--gm-gold)/50 disabled:opacity-50"
              >
                <Download size={20} className="text-(--gm-gold-deep)" />
                <span className="text-xs font-medium">Görseli indir</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              <a href={twitterUrl}    target="_blank" rel="noopener noreferrer" className={iconBtn} title="X (Twitter)">
                <Twitter size={18} />
              </a>
              <a href={facebookUrl}   target="_blank" rel="noopener noreferrer" className={iconBtn} title="Facebook">
                <Facebook size={18} />
              </a>
              <a href={whatsappUrl}   target="_blank" rel="noopener noreferrer" className={iconBtn} title="WhatsApp">
                <MessageCircle size={18} />
              </a>
              <button type="button" onClick={() => { downloadImage(); toast.info('Görseli indirip Instagram\'a yükleyebilirsin'); }} className={iconBtn} title="Instagram">
                <Instagram size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={copyLink}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) px-4 py-3 text-sm text-(--gm-text-dim) transition-colors hover:text-(--gm-text)"
            >
              <Copy size={14} />
              Linki kopyala
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const iconBtn = 'inline-flex items-center justify-center rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-3 text-(--gm-text-dim) transition-colors hover:border-(--gm-gold)/50 hover:text-(--gm-gold-deep)';

function GenericShareContent({ data }: { data: any }) {
  const chips = Array.isArray(data?.highlights) ? data.highlights : [];
  const quote =
    data?.summary ||
    data?.excerpt ||
    data?.description ||
    data?.message ||
    '';
  return (
    <div style={{ gap: 40, display: 'flex', flexDirection: 'column' }}>
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {chips.slice(0, 6).map((s: string, i: number) => (
            <div key={i} style={{ padding: '12px 24px', border: `1px solid ${SHARE_THEME.gold}`, borderRadius: 40, color: SHARE_THEME.gold, fontSize: 20 }}>
              {s}
            </div>
          ))}
        </div>
      )}
      {quote ? (
        <div style={{ fontSize: 32, fontFamily: 'Fraunces', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.4, color: SHARE_THEME.textSoft }}>
          &ldquo;{quote}&rdquo;
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
          <NumBox label="Odak" value={data?.focus ?? '-'} color={SHARE_THEME.blue} />
          <NumBox label="İlerleme" value={data?.progress ?? '-'} color={SHARE_THEME.gold} />
          <NumBox label="Ritim" value={data?.rhythm ?? '-'} color={SHARE_THEME.green} />
        </div>
      )}
    </div>
  );
}

function NumBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ 
      width: 200, 
      backgroundColor: 'color-mix(in srgb, var(--gm-surface) 3%, transparent)', 
      border: `1px solid ${color}44`, 
      borderRadius: 24, 
      padding: '30px 20px', 
      textAlign: 'center' 
    }}>
      <div style={{ fontSize: 56, fontWeight: 'bold', color: color, marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: SHARE_THEME.textMuted }}>{label}</div>
    </div>
  );
}
