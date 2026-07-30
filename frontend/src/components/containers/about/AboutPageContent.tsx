// =============================================================
// FILE: src/components/containers/about/AboutPageContent.tsx
// About Page Content (SINGLE PAGE) (I18N + SAFE; marka site-config)
// =============================================================

'use client';

import React, { useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// RTK – Custom Pages Public
import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/shared';
import { downgradeH1ToH2, pickPage, toCdnSrc } from '@/integrations/shared';

// Helpers
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { getPublicAppName } from '@/lib/site-config';
import { injectAppName } from '@/lib/page-copy';
import aboutPageCopy from '@/config/pages/about-page-copy.json';

type AboutCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  founderTitle: string;
  founderParagraphs: string[];
  methodologyTitle: string;
  methodologyParagraphs: string[];
  experienceTitle: string;
  experienceParagraphs: string[];
  differentiatorsTitle: string;
  differentiators: Array<{ title: string; body: string }>;
  authorBio: string;
};

type AboutCopyMap = Record<string, AboutCopy>;

function personalizeAboutCopy(copy: AboutCopy, app: string): AboutCopy {
  const r = (s: string) => injectAppName(s, app);
  return {
    eyebrow: r(copy.eyebrow),
    title: r(copy.title),
    lead: r(copy.lead),
    founderTitle: r(copy.founderTitle),
    founderParagraphs: copy.founderParagraphs.map(r),
    methodologyTitle: r(copy.methodologyTitle),
    methodologyParagraphs: copy.methodologyParagraphs.map(r),
    experienceTitle: r(copy.experienceTitle),
    experienceParagraphs: copy.experienceParagraphs.map(r),
    differentiatorsTitle: r(copy.differentiatorsTitle),
    differentiators: copy.differentiators.map((d) => ({ title: r(d.title), body: r(d.body) })),
    authorBio: r(copy.authorBio),
  };
}

function getAboutCopy(locale: string): AboutCopy {
  const raw = aboutPageCopy as AboutCopyMap;
  const base = raw[locale] || raw[locale.split('-')[0]] || raw.tr;
  return personalizeAboutCopy(base, getPublicAppName());
}

const AboutPageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_about', locale as any);
  const copy = getAboutCopy(locale);

  const t = useCallback((key: string, fallback: any) => ui(key, fallback), [ui]);

  const readUi = useCallback(
    (key: string, fallback: any) => {
      const v = t(key, fallback);
      if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return fallback;
        if (s === key) return fallback;
      }
      return v;
    },
    [t],
  );

  const { data, isLoading } = useListCustomPagesPublicQuery({
    module_key: 'about',
    locale,
    limit: 10,
    sort: 'created_at',
    orderDir: 'asc',
  });

  const page = useMemo<CustomPageDto | null>(
    () => pickPage(data?.items ?? []),
    [data],
  );

  const headerSubtitlePrefix = useMemo(
    () => String(readUi('ui_about_subprefix', 'Spiritüel Rehberlik') || '').trim() || 'Spiritüel Rehberlik',
    [readUi],
  );

  const headerSubtitleLabel = useMemo(() => {
    const v = String(readUi('ui_about_sublabel', '') || '').trim();
    return v;
  }, [readUi]);

  const headerTitle = useMemo(() => {
    const v = String(readUi('ui_about_page_title', '') || '').trim();
    if (v) return v;
    if (locale === 'de') return 'Über mich';
    if (locale === 'tr') return 'Hakkımda';
    return 'About';
  }, [readUi, locale]);

  const headerLead = useMemo(() => String(readUi('ui_about_page_lead', '') || '').trim(), [readUi]);

  const html = useMemo(() => {
    const raw = page?.content_html || page?.content || '';
    return raw ? downgradeH1ToH2(raw) : '';
  }, [page]);

  const featuredImageRaw = useMemo(
    () => (page?.featured_image ?? '').trim(),
    [page],
  );

  const imgSrc = useMemo(() => {
    if (!featuredImageRaw) return '';
    const cdn = toCdnSrc(featuredImageRaw, 1200, 800, 'fill');
    return (cdn || featuredImageRaw) as any;
  }, [featuredImageRaw]);

  const imgAlt = useMemo(() => {
    const alt = (page?.featured_image_alt ?? '').trim();
    return alt || 'about image';
  }, [page]);

  const galleryThumbs = useMemo(() => {
    const images = page?.images ?? [];
    const unique = Array.from(new Set(images.filter(Boolean)));
    return unique.filter((x) => x !== featuredImageRaw).slice(0, 3);
  }, [page, featuredImageRaw]);

  return (
    <section className="relative py-16 md:py-24 z-10 bg-[var(--gm-bg)] text-[var(--gm-text)]">
      {/* Tema-aware accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px] opacity-50"
        style={{
          background:
            'radial-gradient(70% 60% at 50% 0%, color-mix(in srgb, var(--gm-primary) 16%, transparent) 0%, transparent 75%)',
        }}
      />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4">
            <span className="block text-[var(--gm-primary)] font-bold uppercase tracking-[0.32em] mb-3 text-[10px] md:text-xs">
              <span>{headerSubtitlePrefix}</span>
              {headerSubtitleLabel ? ` ${headerSubtitleLabel}` : null}
            </span>

            <h2 className="text-3xl md:text-5xl font-serif font-light text-[var(--gm-text)] leading-tight max-w-3xl mx-auto">
              {headerTitle}
            </h2>

            {headerLead ? (
              <p className="mt-5 mb-0 text-[var(--gm-text-dim)] max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-serif italic">{headerLead}</p>
            ) : null}

            <div className="mt-8 inline-flex items-center gap-3">
              <span className="h-px w-12 bg-[var(--gm-primary)]/40" />
              <span className="text-[var(--gm-primary)] text-xs">✦</span>
              <span className="h-px w-12 bg-[var(--gm-primary)]/40" />
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="mb-10 max-w-4xl mx-auto">
            <div className="h-4 bg-[var(--gm-bg-deep)] rounded w-full mb-2.5 animate-pulse" aria-hidden />
            <div className="h-4 bg-[var(--gm-bg-deep)] rounded w-4/5 mb-2.5 animate-pulse" aria-hidden />
            <div className="h-4 bg-[var(--gm-bg-deep)] rounded w-3/5 animate-pulse" aria-hidden />
          </div>
        )}

        {!!page && !isLoading && (
          <>
            {/* Hero image — full-width with elegant framing */}
            {imgSrc && (
              <div
                className="mb-12 max-w-5xl mx-auto"
                data-aos="fade-up"
                data-aos-delay={100}
              >
                <div className="relative overflow-hidden shadow-medium bg-bg-secondary border border-border-light">
                  <div className="w-full aspect-16/7 md:aspect-16/6 relative">
                    <Image
                      src={imgSrc}
                      alt={imgAlt}
                      fill
                      className="object-cover"

                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1100px"
                      priority
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Content — centered, readable width */}
            <div
              className="max-w-3xl mx-auto mb-12"
              data-aos="fade-up"
              data-aos-delay={200}
            >
              {html ? (
                <div
                  className="prose prose-lg prose-rose text-text-secondary max-w-none
                    prose-h2:font-serif prose-h2:text-text-primary prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-0 prose-h2:mb-6
                    prose-h3:font-serif prose-h3:text-text-primary prose-h3:text-xl prose-h3:md:text-2xl prose-h3:mt-10 prose-h3:mb-4
                    prose-p:leading-relaxed prose-p:mb-5
                    prose-li:leading-relaxed
                    prose-strong:text-text-primary
                    prose-em:text-brand-primary/80
                    prose-a:text-brand-primary"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <div>
                  <p className="mb-0">
                    {readUi('ui_about_empty_text', 'Content will be published here.')}
                  </p>
                </div>
              )}
            </div>

            {/* Gallery thumbnails — elegant grid */}
            {galleryThumbs.length > 0 && (
              <div
                className="max-w-5xl mx-auto"
                data-aos="fade-up"
                data-aos-delay={300}
              >
                <div className={`grid gap-4 md:gap-6 ${
                  galleryThumbs.length === 1
                    ? 'grid-cols-1 max-w-2xl mx-auto'
                    : galleryThumbs.length === 2
                      ? 'grid-cols-2 max-w-4xl mx-auto'
                      : 'grid-cols-2 md:grid-cols-3'
                }`}>
                  {galleryThumbs.map((src, i) => (
                    <div
                      key={src}
                      className={`relative overflow-hidden border border-border-light bg-bg-secondary shadow-soft
                        transition-transform duration-500 hover:scale-[1.02] hover:shadow-medium
                        ${galleryThumbs.length === 3 && i === 0 ? 'col-span-2 md:col-span-1' : ''}`}
                    >
                      <div className="aspect-4/3 relative">
                        <Image
                          src={src}
                          alt={`${imgAlt} ${i + 1}`}
                          fill
                          className="object-cover"
    
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 350px"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mx-auto max-w-4xl">
          {/* Manifesto card — mor accent + soft glow */}
          <div className="rounded-3xl border border-[var(--gm-primary)]/25 bg-[var(--gm-surface)] p-7 md:p-12 shadow-[var(--gm-shadow-card)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--gm-primary)] via-[var(--gm-accent)] to-[var(--gm-gold)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[var(--gm-primary)]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-4 text-3xl font-serif leading-tight text-[var(--gm-text)] md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--gm-text-dim)] font-serif italic">{copy.lead}</p>
          </div>

          <div className="mt-10 space-y-8">
            {[
              { title: copy.founderTitle, paragraphs: copy.founderParagraphs },
              { title: copy.methodologyTitle, paragraphs: copy.methodologyParagraphs },
              { title: copy.experienceTitle, paragraphs: copy.experienceParagraphs },
            ].map((section, idx) => (
              <section
                key={section.title}
                className="rounded-3xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-7 md:p-10 shadow-[var(--gm-shadow-soft)] hover:border-[var(--gm-primary)]/30 hover:shadow-[var(--gm-shadow-card)] transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--gm-primary)]/10 text-[var(--gm-primary)] font-serif text-lg font-bold">
                    {idx + 1}
                  </span>
                  <h2 className="text-2xl font-serif text-[var(--gm-text)]">{section.title}</h2>
                </div>
                <div className="space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-relaxed text-[var(--gm-text-dim)]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-12">
            <div className="text-center mb-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[var(--gm-primary)] mb-2">
                ✦ {locale === 'tr' ? 'Farkımız' : locale === 'de' ? 'Unsere Stärke' : 'Our Edge'} ✦
              </p>
              <h2 className="text-2xl md:text-3xl font-serif text-[var(--gm-text)]">{copy.differentiatorsTitle}</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {copy.differentiators.map((item) => (
                <article
                  key={item.title}
                  className="group rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-6 hover:border-[var(--gm-primary)]/40 hover:shadow-[var(--gm-shadow-gold)] hover:-translate-y-1 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--gm-primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--gm-primary)]/20 transition-colors">
                    <span className="text-[var(--gm-primary)] text-lg">✦</span>
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-[var(--gm-text)]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--gm-text-dim)]">{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-12 rounded-3xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-7 md:p-10 shadow-[var(--gm-shadow-soft)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gm-primary)]">
              {locale === 'tr' ? 'Editoryal ekip' : locale === 'de' ? 'Redaktionsteam' : 'Editorial team'}
            </p>
            <h2 className="mt-2 text-2xl font-serif text-[var(--gm-text)]">{getPublicAppName()}</h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--gm-text-dim)]">{copy.authorBio}</p>
          </div>

          <div className="mt-10 text-center">
            <Link
              href={localizePath(locale, '/editorial-policy')}
              className="inline-flex items-center gap-3 rounded-full bg-[var(--gm-primary)] hover:bg-[var(--gm-primary-dark)] px-8 py-4 text-xs font-bold uppercase tracking-[0.24em] text-white shadow-[var(--gm-shadow-card)] hover:shadow-[var(--gm-shadow-gold)] transition-all"
            >
              {locale === 'tr' ? 'Editoryal politika ve metodoloji' : locale === 'de' ? 'Redaktionelle Richtlinie und Methodik' : 'Editorial policy and methodology'}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPageContent;
