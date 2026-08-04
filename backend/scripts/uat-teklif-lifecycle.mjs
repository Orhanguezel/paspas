import { createHash, randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';

import { pool } from '../dist/db/client.js';
import {
  repoAddKalem, repoCreateRevizyon, repoCreateTeklif, repoGetTeklif, repoLogGonderim,
  repoOnayaGonder, repoOnaylaIskonto, repoPatchTeklif, repoSetTeklifDurum,
  repoTeklifiSipariseDonustur,
} from '../dist/modules/teklifler/repository.js';
import { expireDueOffers, notifyOfferAdmins } from '../dist/modules/teklifler/maintenance.js';

const db = await mysql.createConnection({ host:process.env.DB_HOST, port:Number(process.env.DB_PORT || 3306), user:process.env.DB_USER, password:process.env.DB_PASSWORD, database:process.env.DB_NAME });
const customerId = randomUUID();
const offerIds = [];
let orderId;
let notificationOfferNo;
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
  const primaryOffer=await repoAddKalem(offerId, { urunId:product.id, aciklama:'Lifecycle ürünü', birim:'adet', miktar:2, birimFiyat:500, iskontoOrani:10 });
  const primaryKalemId=primaryOffer?.kalemler.find((item)=>item.aciklama==='Lifecycle ürünü')?.id;if(!primaryKalemId)throw new Error('PRIMARY_ITEM_MISSING');
  await repoPatchTeklif(offerId, { iskontoOrani:11, nakliye:50 });
  const priced = await repoGetTeklif(offerId);
  if (priced?.araToplam !== 900 || priced.iskontoTutari !== 99 || priced.kdvTutari !== 170.2 || priced.genelToplam !== 1021.2) throw new Error('TOTALS_FAILED');

  const apiBase=process.env.UAT_API_BASE||'http://127.0.0.1:8078/api';
  const login=await fetch(`${apiBase}/auth/token`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD})});
  const access=(await login.json()).access_token;const auth={authorization:`Bearer ${access}`};
  await repoOnayaGonder(offerId,'sevkiyatci');await notifyOfferAdmins('İskonto onayı bekliyor',`${priced.teklifNo} numaralı teklif yönetici onayı bekliyor.`,'teklif_onay');
  const approvalResponse=await fetch(`${apiBase}/admin/teklifler/${offerId}/onayla`,{method:'POST',headers:auth});if(!approvalResponse.ok)throw new Error(`DISCOUNT_APPROVAL_HTTP_FAILED_${approvalResponse.status}_${await approvalResponse.text()}`);
  const approved=await repoGetTeklif(offerId);if(!approved?.iskontoOnaylandi||!approved.iskontoOnaylayanUserId)throw new Error('DISCOUNT_APPROVAL_FAILED');
  await repoPatchTeklif(offerId,{iskontoOrani:12});
  const resetApproval=await repoGetTeklif(offerId);if(resetApproval?.iskontoOnaylandi||resetApproval?.iskontoOnaylayanUserId||resetApproval?.iskontoOnayAt)throw new Error('DISCOUNT_APPROVAL_RESET_FAILED');
  await repoOnayaGonder(offerId,'sevkiyatci');
  if(!(await fetch(`${apiBase}/admin/teklifler/${offerId}/onay-reddet`,{method:'POST',headers:{...auth,'content-type':'application/json'},body:JSON.stringify({neden:'Lifecycle audit red UAT'})})).ok)throw new Error('DISCOUNT_REJECTION_HTTP_FAILED');
  await repoOnayaGonder(offerId,'sevkiyatci');
  if(!(await fetch(`${apiBase}/admin/teklifler/${offerId}/onayla`,{method:'POST',headers:auth})).ok)throw new Error('DISCOUNT_REAPPROVAL_HTTP_FAILED');
  const [[approvalAudit]]=await db.execute("SELECT COUNT(*) count FROM admin_audit_logs WHERE resource_id=? AND action IN ('CRM_OFFER_DISCOUNT_APPROVED','CRM_OFFER_DISCOUNT_REJECTED')",[offerId]);
  if(Number(approvalAudit.count)!==3)throw new Error('DISCOUNT_AUDIT_FAILED');
  await repoSetTeklifDurum(offerId, 'gonderildi', undefined, 'sevkiyatci');
  await repoLogGonderim(offerId, 'email', 'uat@example.invalid', 'hata', 'UAT kontrollü gönderim hatası', user.id);
  const sent = await repoGetTeklif(offerId);
  notificationOfferNo=sent?.teklifNo;
  if (!sent?.goruntulemeToken || !sent.goruntulemeTokenExpiresAt) throw new Error('TOKEN_FAILED');
  const firstPublic=await fetch(`${apiBase}/web/promats/teklif/${sent.goruntulemeToken}`);
  if(!firstPublic.ok||!firstPublic.headers.get('content-type')?.includes('application/pdf'))throw new Error('TOKEN_PUBLIC_PDF_FAILED');
  const firstViewed=await repoGetTeklif(offerId);if(!firstViewed?.ilkGoruntulemeAt||firstViewed.durum!=='goruntulendi')throw new Error('TOKEN_FIRST_VIEW_FAILED');
  const revokedResponse=await fetch(`${apiBase}/admin/teklifler/${offerId}/public-link`,{method:'POST',headers:{...auth,'content-type':'application/json'},body:JSON.stringify({islem:'iptal'})});
  if(!revokedResponse.ok||(await fetch(`${apiBase}/web/promats/teklif/${sent.goruntulemeToken}`)).status!==404)throw new Error('TOKEN_REVOKE_FAILED');
  const refreshResponse=await fetch(`${apiBase}/admin/teklifler/${offerId}/public-link`,{method:'POST',headers:{...auth,'content-type':'application/json'},body:JSON.stringify({islem:'yenile',gun:1})});
  const refreshed=await refreshResponse.json();if(!refreshResponse.ok||!refreshed.goruntulemeToken||refreshed.goruntulemeToken===sent.goruntulemeToken||refreshed.goruntulemeTokenRevokedAt)throw new Error('TOKEN_REFRESH_FAILED');
  await db.execute('UPDATE teklifler SET goruntuleme_token_expires_at=DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 1 SECOND) WHERE id=?',[offerId]);
  if((await fetch(`${apiBase}/web/promats/teklif/${refreshed.goruntulemeToken}`)).status!==404)throw new Error('TOKEN_EXPIRY_FAILED');

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
  const revisionDetail=await fetch(`${apiBase}/admin/teklifler/${offerId}/revizyonlar/0`,{headers:auth});
  const revisionPdf=await fetch(`${apiBase}/admin/teklifler/${offerId}/revizyonlar/0/pdf`,{headers:auth});
  const revisionPdfBytes=Buffer.from(await revisionPdf.arrayBuffer());
  if(!revisionDetail.ok||!(await revisionDetail.json()).snapshot||!revisionPdf.ok||!revisionPdf.headers.get('content-type')?.includes('application/pdf')||revisionPdfBytes.length<10_000||revisionPdfBytes.subarray(0,5).toString()!=='%PDF-')throw new Error('REVISION_HTTP_FAILED');
  await repoPatchTeklif(offerId,{aciklama:'R1 sonrası taslak'});
  await repoAddKalem(offerId,{urunId:product.id,aciklama:'Seçilmeyecek lifecycle ürünü',birim:'adet',miktar:1,birimFiyat:25,iskontoOrani:0});
  await repoSetTeklifDurum(offerId, 'gonderildi', undefined, 'sevkiyatci');
  const acceptResponse=await fetch(`${apiBase}/admin/teklifler/${offerId}/durum`,{method:'POST',headers:{...auth,'content-type':'application/json'},body:JSON.stringify({durum:'kabul',kararNedeni:'Müşteri yazılı kabul verdi'})});if(!acceptResponse.ok)throw new Error('OFFER_ACCEPT_HTTP_FAILED');
  const order = await repoTeklifiSipariseDonustur(offerId,[primaryKalemId]); orderId = order.siparisId;
  let duplicateBlocked = false;
  try { await repoTeklifiSipariseDonustur(offerId); } catch (error) { duplicateBlocked = error instanceof Error && error.message === 'teklif_zaten_donustu'; }
  const [[errorSend], [permissions]] = await Promise.all([
    db.execute("SELECT COUNT(*) count FROM teklif_gonderimleri WHERE teklif_id=? AND durum='hata'", [offerId]).then(([rows]) => rows),
    db.execute("SELECT COUNT(*) count FROM role_permissions WHERE permission_key IN ('admin.teklifler.create','admin.teklif_onay.create')").then(([rows]) => rows),
  ]);
  await repoSetTeklifDurum(offerIds[1],'gonderildi',undefined,'admin',user.id);
  const rejectResponse=await fetch(`${apiBase}/admin/teklifler/${offerIds[1]}/durum`,{method:'POST',headers:{...auth,'content-type':'application/json'},body:JSON.stringify({durum:'red',redNedeni:'Lifecycle müşteri reddi'})});if(!rejectResponse.ok)throw new Error('OFFER_REJECT_HTTP_FAILED');
  await repoPatchTeklif(offerIds[2],{gecerlilikTarihi:'2020-01-01'});await repoSetTeklifDurum(offerIds[2],'gonderildi',undefined,'admin',user.id);const expiredCount=await expireDueOffers();
  const [[decisionCounts],[orderLink],[orderItems],[expiredOffer],[lifecycleAudit],[approvalNotifications]]=await Promise.all([
    db.execute("SELECT SUM(karar='kabul') accepted,SUM(karar='red') rejected FROM teklif_kararlari WHERE teklif_id IN (?,?)",[offerId,offerIds[1]]).then(([rows])=>rows),
    db.execute('SELECT id FROM teklifler WHERE id=? AND donusen_siparis_id=?',[offerId,orderId]).then(([rows])=>rows),
    db.execute('SELECT COUNT(*) count FROM siparis_kalemleri WHERE siparis_id=?',[orderId]).then(([rows])=>rows),
    db.execute("SELECT durum FROM teklifler WHERE id=?",[offerIds[2]]).then(([rows])=>rows),
    db.execute("SELECT COUNT(*) count FROM admin_audit_logs WHERE resource_id IN (?,?,?) AND action IN ('CRM_OFFER_FIRST_VIEWED','CRM_OFFER_REVISION_CREATED','CRM_OFFER_ACCEPTED','CRM_OFFER_REJECTED','CRM_OFFER_EXPIRED')",[offerId,offerIds[1],offerIds[2]]).then(([rows])=>rows),
    db.execute("SELECT COUNT(*) count FROM notifications WHERE type='teklif_onay' AND message LIKE ?",[`%${sent.teklifNo}%`]).then(([rows])=>rows),
  ]);
  if (!duplicateBlocked || Number(errorSend.count) !== 1 || Number(permissions.count) < 2||Number(decisionCounts.accepted)!==1||Number(decisionCounts.rejected)!==1||!orderLink.id||Number(orderItems.count)!==1||expiredCount<1||expiredOffer.durum!=='suresi_doldu'||Number(lifecycleAudit.count)<4||Number(approvalNotifications.count)<1) throw new Error('LIFECYCLE_ASSERTION_FAILED');
  console.log(JSON.stringify({ ok:true, totals:true, transitions:true,discountApproval:true,approvalResetOnChange:true,approvalAudit:true, immutableSnapshot:true, revisionSequence:'R0,R1',snapshotCoverage:true,revisionDetail:true,revisionPdf:true,revisionPdfBytes:revisionPdfBytes.length,concurrentNumbers:8, numberFormat:`TK-${new Date().getFullYear()}-NNNN`, consecutiveBlock:true, permissions:true, sendFailure:true, publicToken:true,tokenFirstView:true,tokenRevocation:true,tokenRefresh:true,tokenExpiry:true,decisionHistory:true,selectedOrderItems:true,twoWayOrderLink:true,lifecycleAudit:true,adminNotification:true,offerExpiry:true, orderConversion:true, duplicateBlocked:true }));
} finally {
  if (orderId) {
    await db.execute('UPDATE teklifler SET donusen_siparis_id=NULL WHERE donusen_siparis_id=?', [orderId]);
    await db.execute('DELETE FROM satis_siparisleri WHERE id=?', [orderId]);
  }
  if (offerIds.length) {
    if(notificationOfferNo)await db.query("DELETE FROM notifications WHERE type='teklif_onay' AND message LIKE ?",[`%${notificationOfferNo}%`]);
    await db.query(`DELETE FROM admin_audit_logs WHERE resource_id IN (${offerIds.map(() => '?').join(',')})`,offerIds);
    await db.query(`DELETE FROM teklifler WHERE id IN (${offerIds.map(() => '?').join(',')})`, offerIds);
  }
  await db.execute('DELETE FROM musteriler WHERE id=?', [customerId]);
  await db.end(); await pool.end();
}
