import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, breadcrumbSchema, graph } from '@/seo/jsonld';
import { getEditorialPolicyCopy } from '@/lib/page-copy';
import {
  getEditorialTeamName,
  getPublicAppName,
  getPublicSiteOrigin,
  titleWithAppName,
} from '@/lib/site-config';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const app = getPublicAppName();
  const copy = await getEditorialPolicyCopy(locale, app);
  return {
    title: titleWithAppName(copy.title),
    description: copy.description,
  };
}

export default async function EditorialPolicyPage({ params }: Props) {
  const { locale } = await params;
  const app = getPublicAppName();
  const siteUrl = getPublicSiteOrigin();
  const copy = await getEditorialPolicyCopy(locale, app);
  const pageUrl = `${siteUrl}/${locale}/editorial-policy`;
  const editorialName = getEditorialTeamName();

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] px-4 py-24 text-[var(--gm-text)] md:py-32">
      <JsonLd
        id="editorial-policy"
        data={graph([
          breadcrumbSchema([
            { name: app, item: `${siteUrl}/${locale}` },
            { name: locale === 'tr' ? 'Hakkımızda' : 'About', item: `${siteUrl}/${locale}/about` },
            { name: copy.title, item: pageUrl },
          ]),
          articleSchema({
            headline: copy.title,
            description: copy.description,
            datePublished: '2026-04-30T00:00:00.000Z',
            dateModified: '2026-04-30T00:00:00.000Z',
            author: { name: editorialName, url: `${siteUrl}/${locale}/about` },
            publisherId: `${siteUrl}/#org`,
            url: pageUrl,
            speakableSelectors: ['h1', '[data-speakable]'],
            inLanguage: locale,
          }),
        ])}
      />

      <div className="mx-auto max-w-4xl">
        <Link href={`/${locale}/about`} className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gm-gold)]">
          {copy.back}
        </Link>
        <section data-speakable className="mt-8 rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/60 p-6 md:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--gm-gold-dim)]">{app}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">{copy.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--gm-text-dim)]">{copy.description}</p>
        </section>

        <div className="mt-10 space-y-6">
          {copy.sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/45 p-6 md:p-8">
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              <div className="mt-5 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-relaxed text-[var(--gm-text-dim)]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/45 p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gm-gold)]">{copy.authorRoleTitle}</p>
          <h2 className="mt-2 text-2xl font-semibold">{editorialName}</h2>
          <p className="mt-4 leading-relaxed text-[var(--gm-text-dim)]">{copy.description}</p>
          <p className="mt-4 text-sm text-[var(--gm-muted)]">{copy.credentialsNote}</p>
        </section>
      </div>
    </main>
  );
}
