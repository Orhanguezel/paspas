import React from 'react';
import { getPublicAppName } from '@/lib/site-config';
import homePromises from '@/config/pages/home-promises.json';

type PromisesCopy = {
  eyebrow: string;
  title: string;
  promises: { num: string; title: string; text: string; target: string }[];
};

export default function PromisesSection({ locale = 'tr' }: { locale?: string }) {
  const appName = getPublicAppName();
  const raw = homePromises as Record<string, PromisesCopy>;
  const copy = raw[locale] || raw[locale.split('-')[0]] || raw.tr;
  const titleHtml = copy.title.replace(/\{\{appName\}\}/g, appName);

  return (
    <section className="py-32 px-6 bg-[var(--gm-bg)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-24 reveal">
          <span className="section-label">{copy.eyebrow}</span>
          <h2 
            className="font-serif text-[clamp(2.5rem,5vw,4rem)] italic font-light text-[var(--gm-text)] leading-tight"
            dangerouslySetInnerHTML={{ __html: titleHtml }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--gm-border-soft)] border border-[var(--gm-border-soft)]">
          {copy.promises.map((p, i) => (
            <div key={i} className="bg-[var(--gm-bg)] p-12 hover:bg-[var(--gm-bg-deep)] transition-colors group reveal">
              <span className="font-display text-6xl text-[var(--gm-gold)] opacity-30 block mb-8 group-hover:opacity-50 transition-opacity">
                {p.num}
              </span>
              <h3 className="font-serif text-2xl text-[var(--gm-text)] mb-4">{p.title}</h3>
              <p className="text-[var(--gm-text-dim)] leading-relaxed mb-8">{p.text}</p>
              <span className="font-display text-[10px] tracking-[0.32em] text-[var(--gm-muted)] uppercase">
                {p.target}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
