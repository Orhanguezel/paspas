import mysql from 'mysql2/promise';

const dryRun = process.argv.includes('--dry-run');
const sourceDb = process.env.PROMATS_SOURCE_DB || 'promats_site';
const targetDb = process.env.DB_NAME || 'promats_erp';
const tables = [
  ['languages', 'web_promats_languages'],
  ['promats_menu_items', 'web_promats_menu_items'],
  ['static_texts', 'web_promats_static_texts'],
  ['special_pages', 'web_promats_special_pages'],
  ['special_page_gallery', 'web_promats_special_page_gallery'],
  ['products', 'web_promats_products'],
  ['product_features', 'web_promats_product_features'],
  ['articles', 'web_promats_articles'],
  ['home_sections', 'web_promats_home_sections'],
];

if (!/^[a-zA-Z0-9_]+$/.test(sourceDb) || !/^[a-zA-Z0-9_]+$/.test(targetDb)) {
  throw new Error('Gecersiz DB adi');
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'app',
  password: process.env.DB_PASSWORD || 'app',
  database: targetDb,
});

async function rowCount(dbName, table) {
  const [rows] = await connection.query(`SELECT COUNT(*) count FROM \`${dbName}\`.\`${table}\``);
  return Number(rows[0]?.count || 0);
}

try {
  const report = [];
  for (const [source, target] of tables) {
    report.push({
      source,
      target,
      sourceCount: await rowCount(sourceDb, source),
      targetBefore: await rowCount(targetDb, target),
    });
  }
  if (dryRun) {
    console.log(JSON.stringify({ dryRun, sourceDb, targetDb, tables: report }, null, 2));
    process.exit(0);
  }

  await connection.beginTransaction();
  for (const [source, target] of tables) {
    try {
      const [columns] = await connection.query(
        `SELECT column_name AS columnName
           FROM information_schema.columns
          WHERE table_schema=? AND table_name=?
          ORDER BY ordinal_position`,
        [targetDb, target],
      );
      const names = columns.map((row) => row.columnName);
      if (!names.length) throw new Error(`Hedef tablo bulunamadi: ${target}`);
      const columnSql = names.map((name) => `\`${name}\``).join(',');
      const updates = names.filter((name) => name !== 'id')
        .map((name) => `\`${name}\`=VALUES(\`${name}\`)`).join(',');
      await connection.query(
        `INSERT INTO \`${targetDb}\`.\`${target}\` (${columnSql})
         SELECT ${columnSql} FROM \`${sourceDb}\`.\`${source}\`
         ON DUPLICATE KEY UPDATE ${updates}`,
      );
    } catch (error) {
      throw new Error(
        `Web migrasyonu tablo asamasinda durdu: ${source} -> ${target}: ${
          error instanceof Error ? error.message : 'bilinmeyen_hata'
        }`,
      );
    }
  }
  await connection.commit();

  for (const row of report) row.targetAfter = await rowCount(targetDb, row.target);
  console.log(JSON.stringify({ dryRun, sourceDb, targetDb, tables: report }, null, 2));
} catch (error) {
  await connection.rollback().catch(() => undefined);
  throw error;
} finally {
  await connection.end();
}
