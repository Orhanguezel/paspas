import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import { pool } from '../dist/db/client.js';
import { repoDonusturTalep } from '../dist/modules/teklifler/repository.js';

const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});const talepId=randomUUID();let customerId,offerId;
try{
  const[users]=await db.execute('SELECT id FROM users WHERE is_active=1 ORDER BY created_at LIMIT 1');const userId=users[0]?.id;if(!userId)throw new Error('UAT_USER_NOT_FOUND');const[products]=await db.execute('SELECT id,ad FROM urunler WHERE is_active=1 ORDER BY created_at LIMIT 1');const product=products[0];if(!product)throw new Error('UAT_URUN_YOK');
  const selected=[{urunId:product.id,ad:product.ad,miktar:3},{slug:'web-only-product',ad:'Web eşleşmemiş ürün',miktar:2}];
  await db.execute("INSERT INTO teklif_talepleri(id,kaynak_sayfa,dil,ad,firma,email,telefon,konu,mesaj,secili_urunler,utm,kvkk_onay,durum)VALUES(?,'/uat-product','tr','UAT Yetkili','UAT Yeni Müşteri','uat-conversion@example.invalid','+900000000','UAT teklif','Fiyatları doğrulayın',?,JSON_OBJECT('utm_source','uat'),1,'yeni')",[talepId,JSON.stringify(selected)]);
  const result=await repoDonusturTalep(talepId,{yeniMusteri:{ad:'UAT Yeni Müşteri',email:'uat-conversion@example.invalid',telefon:'+900000000'},paraBirimi:'EUR'},userId);customerId=result.musteriId;offerId=result.teklifId;
  const[[customer],[offer],[lead],[lines]]=await Promise.all([db.execute('SELECT musteri_durumu,email FROM musteriler WHERE id=?',[customerId]),db.execute('SELECT durum,dil,para_birimi,talep_id FROM teklifler WHERE id=?',[offerId]),db.execute('SELECT musteri_id,teklif_id,durum FROM teklif_talepleri WHERE id=?',[talepId]),db.execute('SELECT urun_id,urun_ad,miktar,birim_fiyat FROM teklif_kalemleri WHERE teklif_id=? ORDER BY sira',[offerId])]);
  let duplicateBlocked=false;try{await repoDonusturTalep(talepId,{musteriId:customerId,paraBirimi:'TRY'},userId);}catch(e){duplicateBlocked=e instanceof Error&&e.message==='talep_zaten_donustu';}
  if(customer[0]?.musteri_durumu!=='aday'||offer[0]?.durum!=='taslak'||offer[0]?.dil!=='tr'||offer[0]?.para_birimi!=='EUR'||offer[0]?.talep_id!==talepId||lead[0]?.musteri_id!==customerId||lead[0]?.teklif_id!==offerId||lead[0]?.durum!=='teklife_donustu'||lines.length!==2||lines[0]?.urun_id!==product.id||Number(lines[0]?.miktar)!==3||Number(lines[0]?.birim_fiyat)!==0||lines[1]?.urun_id!==null||result.aktarilanKalemSayisi!==2||!duplicateBlocked)throw new Error('TEKLIF_TALEP_CONVERSION_UAT_FAILED');
  console.log(JSON.stringify({ok:true,singleTransactionLinks:true,newCandidateCustomer:true,draftOffer:true,productSuggestions:true,manualFallback:true,pricesRequireReview:true,duplicateBlocked:true}));
}finally{if(offerId)await db.execute('DELETE FROM teklifler WHERE id=?',[offerId]);await db.execute('DELETE FROM teklif_talepleri WHERE id=?',[talepId]);if(customerId)await db.execute('DELETE FROM musteriler WHERE id=?',[customerId]);await db.end();await pool.end();}
