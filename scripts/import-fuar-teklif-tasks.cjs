const crypto = require('node:crypto');
const fs = require('node:fs');
const mysql = require('mysql2/promise');

const publicBase = '/uploads/page-feedback/fuar-teklif-2026-07-30';
const diskBase = '/var/www/paspas/uploads/page-feedback/fuar-teklif-2026-07-30';
const priorityMap = {
  Kritik: 'critical',
  Yüksek: 'high',
  Normal: 'normal',
  Düşük: 'low',
};

async function readInput() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const rows = JSON.parse(input);
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Görev satırları JSON dizisi olarak stdin üzerinden verilmelidir.');
  }
  return rows;
}

function sourceAttachment() {
  const name = 'Fuar_Teklif_Yazilim_Gorevleri.xlsx';
  return [{
    assetId: crypto.randomUUID(),
    url: `${publicBase}/${name}`,
    name,
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: fs.statSync(`${diskBase}/${name}`).size,
  }];
}

async function run() {
  const rows = await readInput();
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const results = [];
  await connection.beginTransaction();
  try {
    for (const [index, row] of rows.entries()) {
      const subject = `[Fuar] ${row.title}`;
      const [existing] = await connection.query(
        'SELECT id,status FROM page_feedback_threads WHERE source_app=? AND subject=? LIMIT 1',
        ['paspas', subject],
      );
      if (existing.length) {
        results.push({ subject, status: existing[0].status, action: 'kept' });
        continue;
      }
      const id = crypto.randomUUID();
      const body = [
        row.description,
        '',
        `İş paketi: ${row.module}`,
        `Proje: ${row.project}`,
        `Arayüz referansı: ${row.reference}`,
        '',
        'Bu görev Fuar Teklif Modülü altında, mevcut üretim yazılımından ayrı proje olarak takip edilir.',
      ].join('\n');
      await connection.query(
        'INSERT INTO page_feedback_threads (id,page_path,page_title,source_app,subject,status,priority,created_by_name) VALUES (?,?,?,?,?,?,?,?)',
        [
          id,
          '/admin/fuar-teklif',
          `Fuar — ${row.module}`,
          'paspas',
          subject,
          'open',
          priorityMap[row.priority] || 'normal',
          'Fuar Teklif Görev Dosyası',
        ],
      );
      await connection.query(
        'INSERT INTO page_feedback_comments (id,thread_id,message_type,body,attachments,created_by_name) VALUES (?,?,?,?,?,?)',
        [
          crypto.randomUUID(),
          id,
          'report',
          body,
          JSON.stringify(index === 0 ? sourceAttachment() : []),
          'Fuar Teklif Görev Dosyası',
        ],
      );
      results.push({ subject, status: 'open', action: 'inserted' });
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
  console.log(JSON.stringify(results, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
