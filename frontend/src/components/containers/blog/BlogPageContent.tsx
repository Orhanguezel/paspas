'use client';

import React, { useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import { safeStr, toCdnSrc, excerpt } from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { getPublicAppName } from '@/lib/site-config';
import blogFallbackPosts from '@/config/pages/blog-fallback-posts.json';

type FallbackBlogPost = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  featured_image: string;
  created_at: string;
};

const BLOG_IMAGE_FALLBACKS: Record<string, string> = {
  '/img/module-chart.png': '/img/placeholder.svg',
  '/img/guide-cover.png': '/img/placeholder.svg',
  '/img/session-cover.png': '/img/placeholder.svg',
};

function normalizeBlogImage(src: string): string {
  return BLOG_IMAGE_FALLBACKS[src] || src;
}

const BlogPageContent: React.FC = () => {
  const app = getPublicAppName();
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_blog', locale as any);
  const t = useCallback((k: string, fb: string) => ui(k, fb), [ui]);

  const { data, isLoading } = useListCustomPagesPublicQuery({
    module_key: 'blog', sort: 'created_at', order: 'desc', locale, limit: 12,
  } as any);

  const items = useMemo(() => {
    const raw = (data as any)?.items ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const renderedItems = useMemo(() => {
    if (items.length > 0) return items;
    const raw = blogFallbackPosts as Record<string, FallbackBlogPost[]>;
    return raw[locale] || raw[locale.split('-')[0]] || raw.en || [];
  }, [items, locale]);

  const blogListHref = useMemo(() => localizePath(locale, '/blog'), [locale]);

  const readMore = t('ui_blog_read_more',
    locale === 'de' ? 'Weiterlesen' : locale === 'tr' ? 'Devamini oku' : 'Read more'
  );

  return (
    <section className="bg-[var(--gm-bg)] min-h-screen relative" style={{ padding: '3rem 4% 7rem' }}>
      {/* Tema-aware accent glow — her preset'te primary rengi parlatır */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-50"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, var(--gm-primary) 18%, transparent) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-[1300px] mx-auto relative">
        {/* Hero header — eyebrow + lead */}
        <header className="text-center mb-14 md:mb-20">
          <p className="text-[10px] md:text-[11px] font-bold tracking-[0.32em] uppercase text-[var(--gm-primary)] mb-4">
            {t(
              'ui_blog_eyebrow',
              locale === 'tr'
                ? `${app} günlüğü`
                : locale === 'de'
                  ? `${app} Journal`
                  : `${app} journal`,
            )}
          </p>
          <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] text-[var(--gm-text)] max-w-3xl mx-auto mb-5">
            {t(
              'ui_blog_hero_title',
              locale === 'tr'
                ? 'Şablon, içerik ve ürün notları'
                : locale === 'de'
                  ? 'Artikel zu Vorlage, Inhalt und Produkt'
                  : 'Articles on templates, content, and product',
            )}
          </h1>
          <p className="text-base md:text-lg text-[var(--gm-text-dim)] max-w-2xl mx-auto leading-relaxed font-serif italic">
            {t(
              'ui_blog_hero_lead',
              locale === 'tr'
                ? 'Yeni projenin içerik yapısını kurmaya yardımcı kısa notlar ve rehberler.'
                : locale === 'de'
                  ? 'Kurze Hinweise und Leitfäden für die Inhaltsstruktur neuer Projekte.'
                  : 'Short notes and guides for shaping a new project content structure.',
            )}
          </p>
          <div className="mt-8 inline-flex items-center gap-3">
            <span className="h-px w-12 bg-[var(--gm-primary)]/40" />
            <span className="text-[var(--gm-primary)] text-xs">✦</span>
            <span className="h-px w-12 bg-[var(--gm-primary)]/40" />
          </div>
        </header>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-2xl overflow-hidden">
                <div className="h-56 bg-[var(--gm-bg-deep)] animate-pulse" />
                <div className="p-7 space-y-4">
                  <div className="h-5 bg-[var(--gm-bg-deep)] rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-[var(--gm-bg-deep)] rounded w-full animate-pulse" />
                  <div className="h-4 bg-[var(--gm-bg-deep)] rounded w-5/6 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        {!isLoading && renderedItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderedItems.map((post: any, i: number) => {
              const title = safeStr(post.title) || t('ui_blog_untitled', 'Untitled');
              const summary = excerpt(safeStr(post.summary) || safeStr(post.content_html) || '', 120);
              const slug = safeStr(post.slug);
              const href = slug ? localizePath(locale, `/blog/${slug}`) : blogListHref;
              const imgRaw = normalizeBlogImage(safeStr(post.featured_image));
              const imgSrc = imgRaw ? toCdnSrc(imgRaw, 600, 400, 'fill') || imgRaw : '';
              const dateStr = post.created_at
                ? new Date(post.created_at).toLocaleDateString(locale === 'de' ? 'de-DE' : locale === 'tr' ? 'tr-TR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : '';

              return (
                <article
                  key={String(post.id ?? slug)}
                  className={`group bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-2xl overflow-hidden transition-all duration-500 hover:border-[var(--gm-primary)]/40 hover:shadow-[var(--gm-shadow-card)] hover:-translate-y-1 flex flex-col reveal reveal-delay-${(i % 3) + 1}`}
                >
                  {/* Image */}
                  <Link href={href} className="relative h-56 overflow-hidden bg-[var(--gm-bg-deep)] block no-underline">
                    {imgSrc ? (
                      <Image
                        src={imgSrc as any}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[var(--gm-muted)] text-sm">(No image)</div>
                    )}
                    {/* Mor gradient overlay — tema-aware (her preset'te primary tonunda) */}
                    <div
                      aria-hidden
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(to top, color-mix(in srgb, var(--gm-primary) 35%, transparent) 0%, transparent 60%)',
                      }}
                    />
                  </Link>

                  {/* Content */}
                  <div className="flex flex-col grow p-7">
                    {dateStr && (
                      <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[var(--gm-muted)] mb-3">{dateStr}</p>
                    )}

                    <h2 className="font-serif text-xl font-light leading-[1.3] mb-3 text-[var(--gm-text)] group-hover:text-[var(--gm-primary)] transition-colors">
                      <Link href={href} className="no-underline">{title}</Link>
                    </h2>

                    {summary && (
                      <p className="text-[0.9rem] text-[var(--gm-text-dim)] font-light leading-[1.7] mb-5 grow">{summary}</p>
                    )}

                    <div className="pt-4 border-t border-[var(--gm-border-soft)] mt-auto">
                      <Link
                        href={href}
                        className="text-[0.78rem] tracking-[0.15em] uppercase text-[var(--gm-primary)] hover:text-[var(--gm-primary-dark)] transition-colors inline-flex items-center gap-2 no-underline font-bold"
                      >
                        {readMore}
                        <span className="sr-only">: {title}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                          className="transition-transform group-hover:translate-x-1">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogPageContent;
