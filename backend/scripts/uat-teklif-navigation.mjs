import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import { pool } from '../dist/db/client.js';
import { repoListTalepler, repoListTeklifler } from '../dist/modules/teklifler/repository.js';
import { repoGetKaynakTeklif } from '../dist/modules/satis_siparisleri/repository.js';

const db = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
const customerId = randomUUID(), requestId = randomUUID(), offerId = randomUUID(), orderId = randomUUID();
try {
  const [users] = await db.execute('SELECT id FROM users WHERE is_active=1 ORDER BY created_at LIMIT 1');
  const owner = users[0]?.id;
  if (!owner) throw new Error('UAT_USER_NOT_FOUND');
  await db.execute("INSERT INTO musteriler(id,tur,musteri_durumu,kod,ad,is_active) VALUES(?,'musteri','aktif',?,'Navigasyon UAT',1)", [customerId, `UAT-NAV-${customerId.slice(0, 8)}`]);
  await db.execute("INSERT INTO teklif_talepleri(id,dil,ad,konu,durum,musteri_id,created_at) VALUES(?,'tr','Navigasyon UAT','UAT talep','teklife_donustu',?,NOW())", [requestId, customerId]);
  await db.execute("INSERT INTO satis_siparisleri(id,siparis_no,musteri_id,siparis_tarihi,durum) VALUES(?,?,?,CURRENT_DATE,'taslak')", [orderId, `UAT-NAV-${Date.now()}`, customerId]);
  await db.execute("INSERT INTO teklifler(id,teklif_no,musteri_id,talep_id,durum,dil,para_birimi,donusen_siparis_id,created_by) VALUES(?,?,?,?,'kabul','tr','TRY',?,?)", [offerId, `UAT-NAV-${Date.now()}`, customerId, requestId, orderId, owner]);
  await db.execute('UPDATE teklif_talepleri SET teklif_id=? WHERE id=?', [offerId, requestId]);
  const offers = await repoListTeklifler({ musteriId: customerId, limit: 10, offset: 0, sort: 'updated_at', order: 'desc' });
  const requests = await repoListTalepler({ musteriId: customerId, limit: 10, offset: 0 });
  const source = await repoGetKaynakTeklif(orderId);
  const ok = offers.items.some((item) => item.id === offerId) && requests.items.some((item) => item.id === requestId) && source?.id === offerId && source.revizyonNo === 0;
  if (!ok) throw new Error('TEKLIF_NAVIGATION_UAT_FAILED');
  console.log(JSON.stringify({ ok: true, customerOffers: true, customerRequests: true, orderSourceOffer: true, revisionLink: true }));
} finally {
  await db.execute('DELETE FROM teklifler WHERE id=?', [offerId]);
  await db.execute('DELETE FROM satis_siparisleri WHERE id=?', [orderId]);
  await db.execute('DELETE FROM teklif_talepleri WHERE id=?', [requestId]);
  await db.execute('DELETE FROM musteriler WHERE id=?', [customerId]);
  await db.end();
  await pool.end();
}
