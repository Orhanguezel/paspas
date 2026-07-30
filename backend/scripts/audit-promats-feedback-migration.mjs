import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'promats_erp',
});

async function query(sql, params = []) {
  const [rows] = await connection.query(sql, params);
  return rows;
}

try {
  const columns = await query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema='promats_site' AND table_name='page_feedback_threads'`,
  );
  const hasThreadBody = columns.some((item) => item.column_name === 'body');
  let nonEmptyThreadBodies = 0;
  if (hasThreadBody) {
    const [row] = await query(
      `SELECT COUNT(*) count
         FROM promats_site.page_feedback_threads
        WHERE body IS NOT NULL AND TRIM(body) <> ''`,
    );
    nonEmptyThreadBodies = Number(row.count);
  }

  const [invalidEnums] = await query(
    `SELECT
       SUM(status NOT IN ('open','needs_info','in_review','planned','resolved','closed')) invalidStatus,
       SUM(priority NOT IN ('low','normal','high','critical')) invalidPriority
       FROM promats_site.page_feedback_threads`,
  );
  const [userMapping] = await query(
    `SELECT
       COUNT(*) total,
       SUM(s.created_by_user_id IS NOT NULL) sourceWithUser,
       SUM(t.created_by_user_id IS NOT NULL) targetWithUser,
       SUM(t.created_by_name IS NOT NULL AND TRIM(t.created_by_name) <> '') targetWithName
       FROM promats_site.page_feedback_threads s
       JOIN promats_erp.page_feedback_threads t ON t.id=s.id`,
  );
  const [threadMismatch] = await query(
    `SELECT COUNT(*) count
       FROM promats_site.page_feedback_threads s
       JOIN promats_erp.page_feedback_threads t ON t.id=s.id
      WHERE BINARY s.page_path <> BINARY t.page_path
         OR BINARY COALESCE(s.page_title,'') <> BINARY COALESCE(t.page_title,'')
         OR BINARY COALESCE(s.subject,s.title,'') <> BINARY t.subject
         OR BINARY s.status <> BINARY t.status
         OR BINARY s.priority <> BINARY t.priority
         OR s.created_at <> t.created_at
         OR s.updated_at <> t.updated_at`,
  );
  const [commentMismatch] = await query(
    `SELECT COUNT(*) count
       FROM promats_site.page_feedback_comments s
       JOIN promats_erp.page_feedback_comments t ON t.id=s.id
      WHERE BINARY s.body <> BINARY t.body
         OR BINARY COALESCE(s.message_type,'comment') <> BINARY t.message_type
         OR s.created_at <> t.created_at`,
  );
  const samples = await query(
    `SELECT id, created_at
       FROM (
         (SELECT id,created_at FROM promats_site.page_feedback_threads ORDER BY created_at,id LIMIT 1)
         UNION
         (SELECT id,created_at FROM promats_site.page_feedback_threads ORDER BY created_at,id LIMIT 1 OFFSET 19)
         UNION
         (SELECT id,created_at FROM promats_site.page_feedback_threads ORDER BY created_at DESC,id DESC LIMIT 1)
       ) selected
      ORDER BY created_at,id`,
  );
  const assets = await query(
    `SELECT path
       FROM promats_site.storage_assets
      WHERE bucket='page-feedback'`,
  );
  let sourceMissing = 0;
  let targetMissing = 0;
  for (const asset of assets) {
    const relativePath = String(asset.path).replace(/^\/+/, '');
    if (!fs.existsSync(path.join('/var/www/promats/backend/uploads', relativePath))) sourceMissing += 1;
    if (!fs.existsSync(path.join('/var/www/paspas/uploads/web-promats', relativePath))) targetMissing += 1;
  }

  console.log(JSON.stringify({
    threadBody: { columnExists: hasThreadBody, nonEmpty: nonEmptyThreadBodies },
    invalidEnums: {
      status: Number(invalidEnums.invalidStatus),
      priority: Number(invalidEnums.invalidPriority),
    },
    userMapping: {
      total: Number(userMapping.total),
      sourceWithUser: Number(userMapping.sourceWithUser),
      targetWithUser: Number(userMapping.targetWithUser),
      targetWithName: Number(userMapping.targetWithName),
    },
    exactContent: {
      threadMismatch: Number(threadMismatch.count),
      commentMismatch: Number(commentMismatch.count),
      oldestMiddleNewestSampleIds: samples.map((item) => item.id),
    },
    assetFiles: {
      total: assets.length,
      sourceMissing,
      targetMissing,
    },
  }, null, 2));
} finally {
  await connection.end();
}
