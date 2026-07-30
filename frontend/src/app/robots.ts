// frontend/src/app/robots.ts
//
// AI crawler explicit allow politikası — T31-A2
// AI sistemleri (ChatGPT, Claude, Perplexity, Google AI Overviews, Bing Copilot)
// için marka içeriğinin alıntılanabilir olduğunu net olarak belirtir.

import { MetadataRoute } from 'next';
import { getPublicSiteOrigin } from '@/lib/site-config';
import { fetchSetting } from '@/i18n/server';

const BASE_URL = getPublicSiteOrigin();

const COMMON_DISALLOW = ['/api/', '/admin/', '/_next/', '/me/'];

/** AI crawler bot listesi — explicit allow ile site içeriğine erişim onaylanır. */
const AI_BOTS = [
  // OpenAI
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  // Anthropic
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  // Perplexity
  'PerplexityBot',
  'Perplexity-User',
  // Google AI (Gemini, AI Overviews — Google-Extended ayrı bir token, Googlebot ile birlikte gelir)
  'Google-Extended',
  // Common Crawl (LLM eğitim verisi kaynağı)
  'CCBot',
  // Apple Intelligence
  'Applebot-Extended',
  // Meta AI
  'FacebookBot',
  'Meta-ExternalAgent',
  // Cohere
  'cohere-ai',
];

/** Geleneksel arama motoru bot'ları — explicit listede tutulması SEO sinyali için faydalı. */
const SEARCH_BOTS = ['Googlebot', 'Googlebot-Image', 'Bingbot', 'Slurp', 'DuckDuckBot', 'YandexBot'];

function lines(value: unknown): string[] {
  return String(value ?? '').split('\n').map((line) => line.trim()).filter(Boolean);
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const row = await fetchSetting('geo_seo', 'en', { revalidate: 300 });
  const geo = row?.value && typeof row.value === 'object' && !Array.isArray(row.value)
    ? row.value as Record<string, unknown>
    : {};
  const allowedAiBots = lines(geo.crawler_allow).length ? lines(geo.crawler_allow) : AI_BOTS;
  const blockedBots = lines(geo.crawler_block);
  const disallow = lines(geo.crawler_disallow).length ? lines(geo.crawler_disallow) : COMMON_DISALLOW;
  return {
    rules: [
      // Default catch-all — diğer tüm crawler'lar
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      ...SEARCH_BOTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow,
      })),
      ...allowedAiBots.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow,
      })),
      ...blockedBots.map((userAgent) => ({ userAgent, disallow: '/' })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
