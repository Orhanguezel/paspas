import mysql from 'mysql2/promise';

const marker = process.argv[2];
if (!marker?.startsWith('E2E-TEKLIF-')) throw new Error('SAFE_E2E_MARKER_REQUIRED');
const db = await mysql.createConnection({ host:process.env.DB_HOST, port:Number(process.env.DB_PORT || 3306), user:process.env.DB_USER, password:process.env.DB_PASSWORD, database:process.env.DB_NAME });
try {
  const [customers] = await db.execute('SELECT id FROM musteriler WHERE ad=?', [marker]);
  const customerIds = customers.map((row) => row.id);
  if (customerIds.length) {
    const placeholders = customerIds.map(() => '?').join(',');
    const [offers] = await db.query(`SELECT id,donusen_siparis_id FROM teklifler WHERE musteri_id IN (${placeholders})`, customerIds);
    const orderIds = offers.map((row) => row.donusen_siparis_id).filter(Boolean);
    if (offers.length) await db.query(`UPDATE teklifler SET donusen_siparis_id=NULL WHERE id IN (${offers.map(() => '?').join(',')})`, offers.map((row) => row.id));
    if (orderIds.length) await db.query(`DELETE FROM satis_siparisleri WHERE id IN (${orderIds.map(() => '?').join(',')})`, orderIds);
    if (offers.length) await db.query(`DELETE FROM teklifler WHERE id IN (${offers.map(() => '?').join(',')})`, offers.map((row) => row.id));
    await db.query(`DELETE FROM teklif_talepleri WHERE musteri_id IN (${placeholders}) OR firma=? OR ad=?`, [...customerIds, marker, marker]);
    await db.query(`DELETE FROM musteriler WHERE id IN (${placeholders})`, customerIds);
  } else {
    await db.execute('DELETE FROM teklif_talepleri WHERE firma=? OR ad=?', [marker, marker]);
  }
  console.log(JSON.stringify({ ok:true, cleaned:marker }));
} finally { await db.end(); }
