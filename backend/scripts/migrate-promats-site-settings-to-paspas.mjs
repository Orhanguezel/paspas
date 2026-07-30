import { createHash } from 'node:crypto';
import mysql from 'mysql2/promise';

const dryRun = process.argv.includes('--dry-run');
const sourceDb = process.env.PROMATS_SOURCE_DB || 'promats_site';
const targetDb = process.env.DB_NAME || 'promats_erp';
const FRONTEND_PREFIX = 'web.promats.frontend.';
const ADMIN_PREFIX = 'web.promats.admin.';

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

function targetKey(sourceKey) {
  const adminOnly = sourceKey === 'ui_admin_config' || sourceKey.startsWith('admin_');
  return `${adminOnly ? ADMIN_PREFIX : FRONTEND_PREFIX}${sourceKey}`;
}

function stableId(key, locale) {
  return `wps-${createHash('sha256').update(`${key}:${locale}`).digest('hex').slice(0, 32)}`;
}

function keyWithLocale(key, locale) {
  return locale && locale !== '*' ? `${key}.locale.${locale}` : key;
}

try {
  const [settings] = await connection.query(
    `SELECT \`key\`,locale,value,created_at,updated_at
       FROM \`${sourceDb}\`.site_settings ORDER BY \`key\`,locale`,
  );
  const [themeRows] = await connection.query(
    `SELECT config,created_at,updated_at FROM \`${sourceDb}\`.theme_config
      WHERE is_active=1 ORDER BY updated_at DESC LIMIT 1`,
  );

  const rows = settings.map((row) => {
    const key = targetKey(row.key);
    const localizedKey = keyWithLocale(key, row.locale);
    return { ...row, id: stableId(key, row.locale), targetKey: localizedKey };
  });
  if (themeRows[0]) {
    const key = `${FRONTEND_PREFIX}theme_config`;
    rows.push({
      id: stableId(key, '*'),
      targetKey: key,
      locale: '*',
      value: typeof themeRows[0].config === 'string'
        ? themeRows[0].config
        : JSON.stringify(themeRows[0].config),
      created_at: themeRows[0].created_at,
      updated_at: themeRows[0].updated_at,
    });
  }

  const [beforeRows] = await connection.query(
    `SELECT COUNT(*) count FROM \`${targetDb}\`.site_settings
      WHERE \`key\` LIKE 'web.promats.frontend.%'
         OR \`key\` LIKE 'web.promats.admin.%'`,
  );
  const report = {
    dryRun,
    sourceDb,
    targetDb,
    sourceSettings: settings.length,
    activeThemeRows: themeRows.length,
    targetBefore: Number(beforeRows[0]?.count || 0),
    frontendKeys: rows.filter((row) => row.targetKey.startsWith(FRONTEND_PREFIX)).length,
    adminKeys: rows.filter((row) => row.targetKey.startsWith(ADMIN_PREFIX)).length,
  };
  if (dryRun) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  await connection.beginTransaction();
  for (const row of rows) {
    await connection.query(
      `INSERT INTO \`${targetDb}\`.site_settings
       (id,\`key\`,value,created_at,updated_at)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE value=VALUES(value),updated_at=VALUES(updated_at)`,
      [
        row.id, row.targetKey, row.value,
        row.created_at || new Date(), row.updated_at || new Date(),
      ],
    );
  }
  await connection.commit();

  const [afterRows] = await connection.query(
    `SELECT COUNT(*) count FROM \`${targetDb}\`.site_settings
      WHERE \`key\` LIKE 'web.promats.frontend.%'
         OR \`key\` LIKE 'web.promats.admin.%'`,
  );
  console.log(JSON.stringify({
    ...report,
    targetAfter: Number(afterRows[0]?.count || 0),
  }, null, 2));
} catch (error) {
  await connection.rollback().catch(() => undefined);
  throw error;
} finally {
  await connection.end();
}
