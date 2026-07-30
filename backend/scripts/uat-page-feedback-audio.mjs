import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import Fastify from 'fastify';
import jwtPlugin from '@fastify/jwt';
import mysql from 'mysql2/promise';

const sourceAudio = process.env.UAT_AUDIO_FILE;
if (!sourceAudio) throw new Error('UAT_AUDIO_FILE zorunludur');

const apiBase = (process.env.UAT_API_BASE || 'https://panel.avrasyaotomotiv.net/api').replace(/\/+$/, '');
const storageRoot = process.env.LOCAL_STORAGE_ROOT || '/var/www/paspas/uploads';
const assetId = randomUUID();
const targetRelative = `page-feedback/codex-sesli-uat-${assetId}.wav`;
const targetFile = path.join(storageRoot, targetRelative);
const publicUrl = `/uploads/${targetRelative}`;
let threadId = null;

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

try {
  await fs.mkdir(path.dirname(targetFile), { recursive: true });
  await fs.copyFile(sourceAudio, targetFile);
  const stat = await fs.stat(targetFile);

  const [admins] = await connection.query(
    `SELECT u.id
       FROM users u
       JOIN user_roles r ON r.user_id=u.id
      WHERE r.role='admin'
      LIMIT 1`,
  );
  const adminId = admins[0]?.id;
  if (!adminId) throw new Error('Admin kullanıcı bulunamadı');

  await connection.execute(
    `INSERT INTO storage_assets
     (id,user_id,name,bucket,path,folder,mime,size,url,provider,metadata)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      assetId, adminId, path.basename(targetFile), 'page-feedback', targetRelative,
      'page-feedback', 'audio/wav', stat.size, publicUrl, 'local',
      JSON.stringify({ sourceApp: 'codex-uat' }),
    ],
  );

  const app = Fastify();
  await app.register(jwtPlugin, { secret: process.env.JWT_SECRET });
  await app.ready();
  const token = app.jwt.sign({ sub: adminId, role: 'admin', is_admin: true });
  await app.close();

  const createResponse = await fetch(`${apiBase}/admin/page-feedback`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      pagePath: '/admin/yazilim-gorevleri',
      sourceApp: 'paspas',
      subject: '[Codex UAT] Sesli not',
      body: 'Sesli sorun kaydı eklendi.',
      attachments: [{
        assetId,
        url: publicUrl,
        name: path.basename(targetFile),
        mime: 'audio/wav',
        size: stat.size,
      }],
    }),
  });
  if (!createResponse.ok) throw new Error(`Feedback create -> ${createResponse.status}`);
  const created = await createResponse.json();
  threadId = created.id;

  let transcript = 'Sesli sorun kaydı eklendi.';
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    const response = await fetch(`${apiBase}/admin/page-feedback/${threadId}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Feedback get -> ${response.status}`);
    const item = await response.json();
    transcript = item.comments[0]?.body || transcript;
    if (transcript !== 'Sesli sorun kaydı eklendi.') break;
  }

  const audioResponse = await fetch(new URL(publicUrl, apiBase));
  if (!audioResponse.ok) throw new Error(`Audio public URL -> ${audioResponse.status}`);
  if (transcript === 'Sesli sorun kaydı eklendi.') throw new Error('Transkript zaman aşımına uğradı');

  console.log(JSON.stringify({
    ok: true,
    audioHttp: audioResponse.status,
    transcript,
  }));
} finally {
  if (threadId) {
    await connection.execute('DELETE FROM page_feedback_comments WHERE thread_id=?', [threadId]);
    await connection.execute('DELETE FROM page_feedback_threads WHERE id=?', [threadId]);
  }
  await connection.execute('DELETE FROM storage_assets WHERE id=?', [assetId]);
  await fs.rm(targetFile, { force: true });
  await connection.end();
}
