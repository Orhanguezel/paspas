import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const talepId = randomUUID();
let musteriId = null;
let dealId = null;

try {
  await connection.execute(
    `INSERT INTO teklif_talepleri(id,dil,ad,firma,email,durum,kvkk_onay)
     VALUES(?,'tr','CRM UAT','CRM UAT Firma','crm-uat@example.invalid','yeni',1)`,
    [talepId],
  );

  const { convertTalepToDeal, moveDeal } = await import('../dist/modules/crm/repository.js');
  const converted = await convertTalepToDeal(talepId, {
    yeniMusteri: { ad: 'CRM UAT Firma', email: 'crm-uat@example.invalid' },
    title: 'CRM UAT Fırsatı', amount: 12500, currency: 'EUR',
  }, null);
  musteriId = converted.musteriId;
  dealId = converted.dealId;

  let duplicateBlocked = false;
  try {
    await convertTalepToDeal(talepId, { musteriId, amount: 0, currency: 'TRY' }, null);
  } catch (error) {
    duplicateBlocked = error instanceof Error && error.message === 'talep_zaten_firsata_donustu';
  }

  const [lostStages] = await connection.execute(
    'SELECT id FROM crm_stages WHERE is_lost=1 ORDER BY sort LIMIT 1',
  );
  let lostReasonBlocked = false;
  try {
    await moveDeal(dealId, lostStages[0].id, undefined);
  } catch (error) {
    lostReasonBlocked = error instanceof Error && error.message === 'kaybetme_nedeni_gerekli';
  }

  const [rows] = await connection.execute(
    `SELECT d.id,td.donusen_firsat_id,t.musteri_id
     FROM crm_deals d JOIN crm_talep_detaylari td ON td.talep_id=d.talep_id
     JOIN teklif_talepleri t ON t.id=d.talep_id WHERE d.id=?`, [dealId],
  );
  if (rows.length !== 1 || !duplicateBlocked || !lostReasonBlocked) throw new Error('CRM_UAT_FAILED');
  console.log(JSON.stringify({ ok: true, linked: true, duplicateBlocked, lostReasonBlocked }));
} finally {
  if (talepId) await connection.execute('DELETE FROM crm_talep_detaylari WHERE talep_id=?', [talepId]);
  if (dealId) await connection.execute('DELETE FROM crm_deals WHERE id=?', [dealId]);
  if (talepId) await connection.execute('DELETE FROM teklif_talepleri WHERE id=?', [talepId]);
  if (musteriId) await connection.execute('DELETE FROM musteriler WHERE id=?', [musteriId]);
  await connection.end();
}
