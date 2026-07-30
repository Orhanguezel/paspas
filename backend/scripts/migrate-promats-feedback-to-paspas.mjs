import mysql from 'mysql2/promise';

const dryRun = process.argv.includes('--dry-run');
const sourceDb = process.env.PROMATS_SOURCE_DB || 'promats_site';
const targetDb = process.env.DB_NAME || 'promats_erp';

if (!/^[a-zA-Z0-9_]+$/.test(sourceDb) || !/^[a-zA-Z0-9_]+$/.test(targetDb)) {
  throw new Error('Gecersiz DB adi');
}
if (sourceDb === targetDb) throw new Error('Kaynak ve hedef DB ayni olamaz');

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'app',
  password: process.env.DB_PASSWORD || 'app',
  database: targetDb,
});

function parseAttachments(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function rewriteUrl(value) {
  return typeof value === 'string'
    ? value.replace(/^\/promats\/uploads\//, '/uploads/web-promats/')
    : value;
}

function normalizeAttachments(row) {
  const current = parseAttachments(row.attachments);
  const legacy = parseAttachments(row.attachments_json);
  const attachments = (current.length ? current : legacy).map((item) => ({
    ...item,
    url: rewriteUrl(item?.url),
  }));
  if (!attachments.length && row.attachment_url) {
    attachments.push({
      assetId: `legacy-${row.id}`.slice(0, 36),
      url: rewriteUrl(row.attachment_url),
      name: String(row.attachment_url).split('/').at(-1) || 'ek',
      mime: 'application/octet-stream',
      size: 0,
    });
  }
  return attachments;
}

async function count(table, dbName = targetDb) {
  const [rows] = await connection.query(`SELECT COUNT(*) count FROM \`${dbName}\`.\`${table}\``);
  return Number(rows[0]?.count || 0);
}

try {
  const [columns] = await connection.query(
    `SELECT column_name AS columnName FROM information_schema.columns
      WHERE table_schema=? AND table_name='page_feedback_threads'`,
    [targetDb],
  );
  if (!columns.some((row) => row.columnName === 'source_app')) {
    throw new Error('Hedefte page_feedback_threads.source_app yok; once 216 migrasyonunu calistirin');
  }

  const [threads] = await connection.query(
    `SELECT * FROM \`${sourceDb}\`.page_feedback_threads ORDER BY created_at,id`,
  );
  const [comments] = await connection.query(
    `SELECT * FROM \`${sourceDb}\`.page_feedback_comments ORDER BY created_at,id`,
  );
  const [assets] = await connection.query(
    `SELECT * FROM \`${sourceDb}\`.storage_assets WHERE bucket='page-feedback' ORDER BY created_at,id`,
  );

  const before = {
    threads: await count('page_feedback_threads'),
    comments: await count('page_feedback_comments'),
    assets: await count('storage_assets'),
  };
  const [threadOverlapRows] = await connection.query(
    `SELECT COUNT(*) count FROM \`${sourceDb}\`.page_feedback_threads s
      JOIN \`${targetDb}\`.page_feedback_threads t ON t.id=s.id`,
  );
  const [commentOverlapRows] = await connection.query(
    `SELECT COUNT(*) count FROM \`${sourceDb}\`.page_feedback_comments s
      JOIN \`${targetDb}\`.page_feedback_comments t ON t.id=s.id`,
  );

  const report = {
    dryRun,
    sourceDb,
    targetDb,
    source: { threads: threads.length, comments: comments.length, assets: assets.length },
    overlap: {
      threads: Number(threadOverlapRows[0]?.count || 0),
      comments: Number(commentOverlapRows[0]?.count || 0),
    },
    before,
  };

  if (dryRun) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  await connection.beginTransaction();
  for (const asset of assets) {
    const newPath = `web-promats/${String(asset.path).replace(/^\/+/, '')}`;
    const newUrl = `/uploads/${newPath}`;
    const metadata = typeof asset.metadata === 'string'
      ? JSON.parse(asset.metadata || 'null')
      : asset.metadata;
    await connection.query(
      `INSERT IGNORE INTO \`${targetDb}\`.storage_assets
       (id,user_id,name,bucket,path,folder,mime,size,width,height,url,hash,provider,
        provider_public_id,provider_resource_type,provider_format,provider_version,etag,
        metadata,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        asset.id, null, asset.name, 'page-feedback', newPath,
        asset.folder ? `web-promats/${asset.folder}` : 'web-promats',
        asset.mime, asset.size, asset.width, asset.height, newUrl, asset.hash, asset.provider,
        asset.provider_public_id, asset.provider_resource_type, asset.provider_format,
        asset.provider_version, asset.etag,
        JSON.stringify({ ...(metadata || {}), sourceApp: 'promats-web', sourcePath: asset.path }),
        asset.created_at, asset.updated_at,
      ],
    );
  }

  for (const thread of threads) {
    const subject = String(thread.subject || thread.title || 'Promats Web notu').trim();
    await connection.query(
      `INSERT IGNORE INTO \`${targetDb}\`.page_feedback_threads
       (id,page_path,page_title,source_app,subject,status,priority,created_by_user_id,created_by_name,
        assigned_to_user_id,last_comment_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        thread.id, thread.page_path, thread.page_title || null, 'promats-web', subject,
        thread.status || 'open', thread.priority || 'normal', null, thread.created_by_name || null, null,
        thread.last_comment_at || thread.updated_at || thread.created_at,
        thread.created_at, thread.updated_at,
      ],
    );
  }

  for (const comment of comments) {
    const attachments = normalizeAttachments(comment);
    await connection.query(
      `INSERT IGNORE INTO \`${targetDb}\`.page_feedback_comments
       (id,thread_id,message_type,body,attachments,created_by_user_id,created_by_name,created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        comment.id, comment.thread_id, comment.message_type || 'comment',
        comment.body, attachments.length ? JSON.stringify(attachments) : null,
        null, comment.created_by_name || null, comment.created_at,
      ],
    );
  }
  await connection.commit();

  const after = {
    threads: await count('page_feedback_threads'),
    comments: await count('page_feedback_comments'),
    assets: await count('storage_assets'),
  };
  console.log(JSON.stringify({
    ...report,
    after,
    inserted: {
      threads: after.threads - before.threads,
      comments: after.comments - before.comments,
      assets: after.assets - before.assets,
    },
  }, null, 2));
} catch (error) {
  await connection.rollback().catch(() => undefined);
  throw error;
} finally {
  await connection.end();
}
