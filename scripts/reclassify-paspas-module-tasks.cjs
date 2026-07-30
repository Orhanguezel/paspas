const mysql = require('mysql2/promise');

function stripKnownPrefix(subject) {
  return String(subject)
    .replace(/^\[Promats Teklif Modülü\]\s*/, '')
    .replace(/^\[Promats Revize 1\]\s*/, '')
    .replace(/^\[Fuar Teklif Modülü\]\s*/, '');
}

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [combined] = await db.query(
    `SELECT id,subject,page_title
       FROM page_feedback_threads
      WHERE subject LIKE '[Promats Teklif Modülü]%'`,
  );
  const [webRevisions] = await db.query(
    `SELECT id,subject,page_title
       FROM page_feedback_threads
      WHERE subject LIKE '[Promats Revize 1]%'`,
  );
  const [fair] = await db.query(
    `SELECT id,subject,page_title
       FROM page_feedback_threads
      WHERE subject LIKE '[Fuar Teklif Modülü]%'`,
  );

  const webTitles = new Set([
    'Web teklif talepleri veri modeli',
    'Public teklif talebi endpointi',
    'İletişim ve teklif talebi ayrımı',
    'Frontend teklif payload sözleşmesi',
    'İletişim ve OEM formlarını yeni akışa bağla',
    'Ürün detayından teklif isteme',
    'Frontend form UX, spam ve analitik',
    'Eski contact endpointi için geriye uyum',
  ]);

  await db.beginTransaction();
  try {
    for (const row of combined) {
      const title = stripKnownPrefix(row.subject);
      const currentPhase = String(row.page_title || '').replace(/^Promats Teklif Modülü — /, '');
      const isCrm = currentPhase.startsWith('CRM');
      const module = isCrm ? 'CRM' : webTitles.has(title) ? 'Web' : 'Teklif';
      await db.query(
        'UPDATE page_feedback_threads SET subject=?,page_title=?,source_app=? WHERE id=?',
        [`[${module}] ${title}`, `${module} — ${currentPhase}`, 'paspas', row.id],
      );
    }
    for (const row of webRevisions) {
      const title = stripKnownPrefix(row.subject);
      await db.query(
        'UPDATE page_feedback_threads SET subject=?,page_title=?,source_app=? WHERE id=?',
        [`[Web] ${title}`, `Web — ${row.page_title || 'Promats Revizyon'}`, 'paspas', row.id],
      );
    }
    for (const row of fair) {
      const title = stripKnownPrefix(row.subject);
      const currentPhase = String(row.page_title || '').replace(/^Fuar Teklif — /, '');
      await db.query(
        'UPDATE page_feedback_threads SET subject=?,page_title=?,source_app=? WHERE id=?',
        [`[Fuar] ${title}`, `Fuar — ${currentPhase}`, 'paspas', row.id],
      );
    }
    await db.commit();
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    await db.end();
  }

  console.log(JSON.stringify({
    crmTeklifWeb: combined.length,
    webRevisions: webRevisions.length,
    fair: fair.length,
    total: combined.length + webRevisions.length + fair.length,
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
