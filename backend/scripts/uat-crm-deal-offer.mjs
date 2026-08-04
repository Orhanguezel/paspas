import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import { createDeal, createDealProduct, convertDealToOffer } from '../dist/modules/crm/repository.js';

const db = await mysql.createConnection({ host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME });
const customerId=randomUUID(); let dealId=null; let offerId=null;
try {
  await db.execute("INSERT INTO musteriler(id,tur,musteri_durumu,kod,ad,is_active) VALUES(?,'musteri','aday',?,'CRM Teklif UAT',1)",[customerId,`UAT-${customerId.slice(0,8)}`]);
  const [products]=await db.execute('SELECT id,kod,ad FROM urunler WHERE is_active=1 ORDER BY created_at LIMIT 1');
  if(!products[0])throw new Error('UAT_URUN_YOK');
  const deal=await createDeal({musteriId:customerId,title:'CRM Ürün UAT',amount:0,currency:'EUR'},null); dealId=deal.id;
  await createDealProduct(dealId,{urunId:products[0].id,miktar:3,birimFiyat:1250,paraBirimi:'EUR',aciklama:'UAT snapshot',sira:0});
  const offer=await convertDealToOffer(dealId,{dil:'tr',kdvOrani:20},null); offerId=offer.teklifId;
  const [rows]=await db.execute(`SELECT t.ara_toplam,t.kdv_tutari,t.genel_toplam,k.urun_kod,k.urun_ad,k.miktar,k.birim_fiyat
    FROM teklifler t JOIN teklif_kalemleri k ON k.teklif_id=t.id JOIN crm_deal_teklifleri l ON l.teklif_id=t.id WHERE l.firsat_id=?`,[dealId]);
  const row=rows[0]; if(!row||Number(row.ara_toplam)!==3750||Number(row.genel_toplam)!==4500||row.urun_kod!==products[0].kod)throw new Error('CRM_DEAL_OFFER_UAT_FAILED');
  let duplicateBlocked=false;try{await convertDealToOffer(dealId,{dil:'tr',kdvOrani:20},null);}catch(e){duplicateBlocked=e instanceof Error&&e.message==='firsat_zaten_teklife_donustu';}
  if(!duplicateBlocked)throw new Error('CRM_DEAL_OFFER_DUPLICATE_FAILED');
  console.log(JSON.stringify({ok:true,snapshot:true,totals:true,duplicateBlocked}));
} finally {
  if(offerId)await db.execute('DELETE FROM teklifler WHERE id=?',[offerId]);
  if(dealId)await db.execute('DELETE FROM crm_deals WHERE id=?',[dealId]);
  await db.execute('DELETE FROM musteriler WHERE id=?',[customerId]);
  await db.end();
}
