import { fetchSetting } from '@/i18n/server';
export const dynamic = 'force-dynamic';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function lines(value: unknown): string[] {
  return String(value ?? '').split('\n').map((line) => line.trim()).filter(Boolean);
}

export async function GET(request: Request) {
  const [trRow, enRow] = await Promise.all([
    fetchSetting('geo_seo', 'tr', { revalidate: 300 }),
    fetchSetting('geo_seo', 'en', { revalidate: 300 }),
  ]);
  const tr = record(trRow?.value);
  const en = record(enRow?.value);
  const config = en.llms_enabled === true ? en : tr;
  if (config.llms_enabled !== true) {
    return new Response('Not Found', { status: 404 });
  }

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}/promats`
    : new URL(request.url).origin;
  const output = [
    `# ${String(config.entity_name || 'Promats')}`,
    '',
    `> ${String(config.llms_description || config.entity_description || '')}`,
    '',
    '## Official Website',
    `- ${origin}`,
    `- Turkish: ${origin}/tr`,
    `- English: ${origin}/en`,
    '',
    '## Industry',
    String(config.industry || ''),
    '',
    '## Expertise',
    ...lines(config.expertise).map((item) => `- ${item}`),
    '',
    '## Service Areas',
    ...lines(config.service_areas).map((item) => `- ${item}`),
    '',
    '## Verified Facts',
    ...lines(config.verified_facts).map((item) => `- ${item}`),
    '',
    '## Approved Sources',
    ...lines(config.approved_sources).map((item) => `- ${item}`),
    '',
    String(config.llms_sections || ''),
  ].join('\n');

  return new Response(output, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
