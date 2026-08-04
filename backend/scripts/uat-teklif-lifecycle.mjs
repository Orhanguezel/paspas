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
  const numbers = concurrent.map((offer) => {
    const match = offer.teklifNo.match(new RegExp(`^TK-${new Date().getFullYear()}-(\\d{4,})$`));
    if (!match) throw new Error(`NUMBER_FORMAT_FAILED_${offer.teklifNo}`);
    return Number(match[1]);
  }).sort((a,b) => a-b);
  if (new Set(numbers).size !== concurrent.length || numbers.some((value,index) => index > 0 && value !== numbers[index-1] + 1)) throw new Error('NUMBER_RACE_FAILED');

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
  await repoCreateRevizyon(offerId, 'Lifecycle R1 UAT', user.id);
  const [revisionNumbers]=await db.execute('SELECT revizyon_no FROM teklif_revizyonlari WHERE teklif_id=? ORDER BY revizyon_no',[offerId]);
  if(JSON.stringify(revisionNumbers.map((row)=>row.revizyon_no))!==JSON.stringify([0,1]))throw new Error('REVISION_SEQUENCE_FAILED');
  const [[snapshotCoverage]]=await db.execute("SELECT JSON_EXTRACT(snapshot,'$.musteri.adres') adres,JSON_EXTRACT(snapshot,'$.pdfSablon.id') sablon FROM teklif_revizyonlari WHERE teklif_id=? AND revizyon_no=0",[offerId]);
  if(snapshotCoverage.adres===undefined||!snapshotCoverage.sablon)throw new Error('REVISION_SNAPSHOT_COVERAGE_FAILED');
  const login=await fetch(`${process.env.UAT_API_BASE||'http://127.0.0.1:8078/api'}/auth/token`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD})});
  const access=(await login.json()).access_token;const auth={authorization:`Bearer ${access}`};
  const revisionDetail=await fetch(`${process.env.UAT_API_BASE||'http://127.0.0.1:8078/api'}/admin/teklifler/${offerId}/revizyonlar/0`,{headers:auth});
  const revisionPdf=await fetch(`${process.env.UAT_API_BASE||'http://127.0.0.1:8078/api'}/admin/teklifler/${offerId}/revizyonlar/0/pdf`,{headers:auth});
  if(!revisionDetail.ok||!(await revisionDetail.json()).snapshot||!revisionPdf.ok||!revisionPdf.headers.get('content-type')?.includes('application/pdf'))throw new Error('REVISION_HTTP_FAILED');
  await repoPatchTeklif(offerId,{aciklama:'R1 sonrası taslak'});
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
  console.log(JSON.stringify({ ok:true, totals:true, transitions:true, immutableSnapshot:true, revisionSequence:'R0,R1',snapshotCoverage:true,revisionDetail:true,revisionPdf:true,concurrentNumbers:8, numberFormat:`TK-${new Date().getFullYear()}-NNNN`, consecutiveBlock:true, permissions:true, sendFailure:true, publicToken:true, orderConversion:true, duplicateBlocked:true }));
} finally {
  if (orderId) {
    await db.execute('UPDATE teklifler SET donusen_siparis_id=NULL WHERE donusen_siparis_id=?', [orderId]);
    await db.execute('DELETE FROM satis_siparisleri WHERE id=?', [orderId]);
  }
  if (offerIds.length) await db.query(`DELETE FROM teklifler WHERE id IN (${offerIds.map(() => '?').join(',')})`, offerIds);
  await db.execute('DELETE FROM musteriler WHERE id=?', [customerId]);
  await db.end(); await pool.end();
}
