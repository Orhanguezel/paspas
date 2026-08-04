import { createHash, randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';

import { pool } from '../dist/db/client.js';
import {
  repoAddKalem, repoCreateRevizyon, repoCreateTeklif, repoGetTeklif, repoLogGonderim,
  repoOnayaGonder, repoOnaylaIskonto, repoPatchTeklif, repoSetTeklifDurum,
  repoTeklifByToken, repoTeklifiSipariseDonustur,
} from '../dist/modules/teklifler/repository.js';

const db = await mysql.createConnection({ host:process.env.DB_HOST, port:Number(process.env.DB_PORT || 3306), user:process.env.DB_USER, password:process.env.DB_PASSWORD, database:process.env.DB_NAME });
const customerId = randomUUID();
const offerIds = [];
let orderId;
try {
  const [[user], [product]] = await Promise.all([
    db.query('SELECT id FROM users WHERE is_active=1 ORDER BY created_at LIMIT 1').then(([rows]) => rows),
    db.query('SELECT id FROM urunler WHERE is_active=1 ORDER BY created_at LIMIT 1').then(([rows]) => rows),
  ]);
  if (!user?.id || !product?.id) throw new Error('UAT_FIXTURE_MISSING');
  await db.execute("INSERT INTO musteriler(id,tur,musteri_durumu,kod,ad,is_active) VALUES(?,'musteri','aday',?,'Teklif Lifecycle UAT',1)", [customerId, `UAT-LIFE-${customerId.slice(0, 8)}`]);

  const concurrent = await Promise.all(Array.from({ length: 8 }, () => repoCreateTeklif({ musteriId:customerId, paraBirimi:'TRY', dil:'tr', kdvOrani:20, kdvDahil:false }, user.id)));
  offerIds.push(...concurrent.map((offer) => offer.id));
  if (new Set(concurrent.map((offer) => offer.teklifNo)).size !== concurrent.length) throw new Error('NUMBER_RACE_FAILED');

  const offerId = offerIds[0];
  await repoAddKalem(offerId, { urunId:product.id, aciklama:'Lifecycle ürünü', birim:'adet', miktar:2, birimFiyat:500, iskontoOrani:10 });
  await repoPatchTeklif(offerId, { iskontoOrani:11, nakliye:50 });
  const priced = await repoGetTeklif(offerId);
  if (priced?.araToplam !== 900 || priced.iskontoTutari !== 99 || priced.kdvTutari !== 170.2 || priced.genelToplam !== 1021.2) throw new Error('TOTALS_FAILED');

  await repoOnayaGonder(offerId, 'sevkiyatci');
  await repoOnaylaIskonto(offerId, user.id);
  await repoSetTeklifDurum(offerId, 'gonderildi', undefined, 'sevkiyatci');
  await repoLogGonderim(offerId, 'email', 'uat@example.invalid', 'hata', 'UAT kontrollü gönderim hatası', user.id);
  const sent = await repoGetTeklif(offerId);
  if (!sent?.goruntulemeToken || !(await repoTeklifByToken(sent.goruntulemeToken))) throw new Error('TOKEN_FAILED');

  await repoCreateRevizyon(offerId, 'Lifecycle snapshot UAT', user.id);
  const [[revision]] = await db.execute('SELECT snapshot FROM teklif_revizyonlari WHERE teklif_id=? ORDER BY revizyon_no DESC LIMIT 1', [offerId]);
  const before = createHash('sha256').update(JSON.stringify(revision.snapshot)).digest('hex');
  await repoPatchTeklif(offerId, { aciklama:'Snapshot sonrası değişiklik' });
  const [[sameRevision]] = await db.execute('SELECT snapshot FROM teklif_revizyonlari WHERE teklif_id=? ORDER BY revizyon_no DESC LIMIT 1', [offerId]);
  const after = createHash('sha256').update(JSON.stringify(sameRevision.snapshot)).digest('hex');
  if (before !== after) throw new Error('SNAPSHOT_MUTATED');

  await repoSetTeklifDurum(offerId, 'gonderildi', undefined, 'sevkiyatci');
  await repoSetTeklifDurum(offerId, 'kabul', undefined, 'admin');
  const order = await repoTeklifiSipariseDonustur(offerId); orderId = order.siparisId;
  let duplicateBlocked = false;
  try { await repoTeklifiSipariseDonustur(offerId); } catch (error) { duplicateBlocked = error instanceof Error && error.message === 'teklif_zaten_donustu'; }
  const [[errorSend], [permissions]] = await Promise.all([
    db.execute("SELECT COUNT(*) count FROM teklif_gonderimleri WHERE teklif_id=? AND durum='hata'", [offerId]).then(([rows]) => rows),
    db.execute("SELECT COUNT(*) count FROM role_permissions WHERE permission_key IN ('admin.teklifler.create','admin.teklif_onay.create')").then(([rows]) => rows),
  ]);
  if (!duplicateBlocked || Number(errorSend.count) !== 1 || Number(permissions.count) < 2) throw new Error('LIFECYCLE_ASSERTION_FAILED');
  console.log(JSON.stringify({ ok:true, totals:true, transitions:true, immutableSnapshot:true, concurrentNumbers:8, permissions:true, sendFailure:true, publicToken:true, orderConversion:true, duplicateBlocked:true }));
} finally {
  if (orderId) {
    await db.execute('UPDATE teklifler SET donusen_siparis_id=NULL WHERE donusen_siparis_id=?', [orderId]);
    await db.execute('DELETE FROM satis_siparisleri WHERE id=?', [orderId]);
  }
  if (offerIds.length) await db.query(`DELETE FROM teklifler WHERE id IN (${offerIds.map(() => '?').join(',')})`, offerIds);
  await db.execute('DELETE FROM musteriler WHERE id=?', [customerId]);
  await db.end(); await pool.end();
}
