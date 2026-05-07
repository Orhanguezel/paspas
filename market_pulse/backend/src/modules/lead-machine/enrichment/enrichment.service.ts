import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { env } from '@/core/env';
import { getCandidate } from '../_shared/db';
import { scrape, type LeadPageData } from '../_shared/scraper.client';

function domainFromUrl(url: string | null) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] ?? '';
  }
}

export async function enrichCandidate(candidateId: string) {
  const candidate = await getCandidate(candidateId);
  if (!candidate) throw new Error('CANDIDATE_NOT_FOUND');
  const domain = domainFromUrl(candidate.website);
  let decisionMaker: unknown = null;
  let sourceVendor = 'scraped';

  if (env.APOLLO_API_KEY && domain) {
    const res = await fetch('https://api.apollo.io/v1/people/match', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.APOLLO_API_KEY },
      body: JSON.stringify({ domain, title: 'Owner CEO Purchasing Manager Category Manager Import Manager' }),
    });
    if (res.ok) {
      decisionMaker = await res.json() as unknown;
      sourceVendor = 'apollo';
    }
  }

  if (!decisionMaker && candidate.website) {
    try {
      const page = await scrape(candidate.website, { profile: 'lead-page', return_text: true });
      const data = page.data as unknown as LeadPageData;
      const email = data.contact_emails?.[0] ?? null;
      const phone = data.contact_phones?.[0] ?? null;
      decisionMaker = { email, phone };
    } catch {
      decisionMaker = null;
    }
  }

  const id = randomUUID();
  await pool.execute(
    `INSERT INTO lead_enrichment (id, candidate_id, decision_maker, source_vendor)
     VALUES (?, ?, CAST(? AS JSON), ?)`,
    [id, candidateId, JSON.stringify(decisionMaker), sourceVendor],
  );
  return { id, candidateId, decisionMaker, sourceVendor };
}
