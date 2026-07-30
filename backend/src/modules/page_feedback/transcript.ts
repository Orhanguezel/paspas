import fs from 'node:fs';
import path from 'node:path';
import type { RowDataPacket } from 'mysql2';

import { env } from '@/core/env';
import { transkriptEt } from '@/core/transkript';
import { pool } from '@/db/client';
import type { PageFeedbackAttachment } from './schema';

type AssetRow = RowDataPacket & { path: string; provider: string };

export async function transcribeAudio(
  commentId: string | undefined,
  initialBody: string,
  attachments: PageFeedbackAttachment[],
): Promise<void> {
  if (!commentId) return;
  const audio = attachments.filter((item) => item.mime.toLowerCase().startsWith('audio/'));
  if (!audio.length) return;

  const root = path.resolve(env.LOCAL_STORAGE_ROOT || path.join(process.cwd(), 'uploads'));
  const texts: string[] = [];
  for (const attachment of audio) {
    const [rows] = await pool.query<AssetRow[]>(
      'SELECT path, provider FROM storage_assets WHERE id=? LIMIT 1',
      [attachment.assetId],
    );
    const asset = rows[0];
    if (!asset || asset.provider !== 'local') continue;
    const candidate = path.resolve(root, asset.path);
    if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) continue;
    const actual = [candidate, candidate.replace(/\.[^./\\]+$/, '')]
      .find((item) => fs.existsSync(item) && fs.statSync(item).isFile());
    if (!actual) continue;
    const text = await transkriptEt(actual, {
      mime: attachment.mime,
      fileName: attachment.name,
    });
    if (text) texts.push(text);
  }
  if (!texts.length) return;

  const transcript = texts.join('\n');
  const body = initialBody.trim() === 'Sesli sorun kaydı eklendi.'
    ? transcript
    : `${initialBody.trim()}\n[Ses çözümü] ${transcript}`;
  await pool.query('UPDATE page_feedback_comments SET body=? WHERE id=?', [body, commentId]);
}
