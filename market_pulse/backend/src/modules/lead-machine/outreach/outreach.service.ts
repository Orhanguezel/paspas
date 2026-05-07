import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { askBestAvailable } from '../_shared/ai.client';
import { getCandidate } from '../_shared/db';

export async function generateOutreachEmail(candidateId: string) {
  const candidate = await getCandidate(candidateId);
  if (!candidate) throw new Error('CANDIDATE_NOT_FOUND');
  const prompt = `
Şirket: ${candidate.name}
Ülke: ${candidate.country ?? 'bilinmiyor'}
Kanal: ${candidate.channel}
Tespit edilen içgörü: ${candidate.ai_summary ?? JSON.stringify(candidate.raw_data)}
Ürünlerimiz: Oto paspas, plastik enjeksiyon parçaları

Kısa, kişiselleştirilmiş B2B tanıtım e-postası yaz. Hook müşteri sorununu belirtsin, ürün uyumunu açıkla, CTA numune talebi veya görüşme olsun. Maksimum 150 kelime. Subject ve Body başlıklarıyla dön.
`;
  const content = await askBestAvailable(prompt, 'gpt-4o-mini');
  const subject = content.match(/subject\s*:\s*(.+)/i)?.[1]?.trim() || `${candidate.name} için tedarik görüşmesi`;
  const body = content.replace(/subject\s*:\s*.+/i, '').replace(/body\s*:\s*/i, '').trim() || content;
  const id = randomUUID();
  await pool.execute(
    'INSERT INTO lead_outreach_drafts (id, candidate_id, subject, body, ai_model) VALUES (?, ?, ?, ?, ?)',
    [id, candidateId, subject.slice(0, 300), body, 'best_available'],
  );
  return { id, candidateId, subject, body };
}

export async function listOutreachDrafts(candidateId?: string, marketLeadId?: string) {
  const where: string[] = [];
  const values: unknown[] = [];
  if (candidateId) {
    where.push('candidate_id = ?');
    values.push(candidateId);
  }
  if (marketLeadId) {
    where.push('market_lead_id = ?');
    values.push(marketLeadId);
  }
  const [rows] = await pool.execute(
    `SELECT * FROM lead_outreach_drafts ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT 100`,
    values as never[],
  );
  return rows;
}

export async function updateOutreachDraft(id: string, data: { subject?: string; body?: string; status?: string }) {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (data.subject !== undefined) {
    sets.push('subject = ?');
    values.push(data.subject);
  }
  if (data.body !== undefined) {
    sets.push('body = ?');
    values.push(data.body);
  }
  if (data.status !== undefined) {
    sets.push('status = ?');
    values.push(data.status);
  }
  if (!sets.length) return null;
  values.push(id);
  await pool.execute(`UPDATE lead_outreach_drafts SET ${sets.join(', ')} WHERE id = ?`, values as never[]);
  const [rows] = await pool.execute('SELECT * FROM lead_outreach_drafts WHERE id = ? LIMIT 1', [id]);
  return (rows as unknown[])[0] ?? null;
}
