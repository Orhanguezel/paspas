import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import { createDeal, createDealProduct, convertDealToOffer, getDeal } from '../dist/modules/crm/repository.js';
import { repoTeklifiSipariseDonustur } from '../dist/modules/teklifler/repository.js';
import { pool } from '../dist/db/client.js';

const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
const customerId=randomUUID(),productionId=randomUUID(),shipmentId=randomUUID(),junctionId=randomUUID();let dealId,offerId,orderId;
try{
  await db.execute("INSERT INTO musteriler(id,tur,musteri_durumu,kod,ad,is_active) VALUES(?,'musteri','aday',?,'CRM ERP Akış UAT',1)",[customerId,`UAT-${customerId.slice(0,8)}`]);
  const[products]=await db.execute('SELECT id FROM urunler WHERE is_active=1 ORDER BY created_at LIMIT 1');const productId=products[0]?.id;if(!productId)throw new Error('UAT_URUN_YOK');
  const deal=await createDeal({musteriId:customerId,title:'CRM ERP Akış UAT',amount:0,currency:'TRY'},null);dealId=deal.id;
  await createDealProduct(dealId,{urunId:productId,miktar:2,birimFiyat:100,paraBirimi:'TRY',sira:0});
  const offer=await convertDealToOffer(dealId,{dil:'tr',kdvOrani:20},null);offerId=offer.teklifId;
  await db.execute("UPDATE teklifler SET durum='kabul' WHERE id=?",[offerId]);
  const order=await repoTeklifiSipariseDonustur(offerId);orderId=order.siparisId;
  const[items]=await db.execute('SELECT id FROM siparis_kalemleri WHERE siparis_id=?',[orderId]);const itemId=items[0]?.id;if(!itemId)throw new Error('UAT_SIPARIS_KALEMI_YOK');
  await db.execute("INSERT INTO uretim_emirleri(id,emir_no,siparis_id,siparis_kalem_id,urun_id,mamul_urun_id,planlanan_miktar,durum) VALUES(?,?,?,?,?,?,2,'uretiliyor')",[productionId,`UAT-UE-${productionId.slice(0,8)}`,orderId,itemId,productId,productId]);
  await db.execute('INSERT INTO uretim_emri_siparis_kalemleri(id,uretim_emri_id,siparis_kalem_id,miktar) VALUES(?,?,?,2)',[junctionId,productionId,itemId]);
  await db.execute("INSERT INTO sevk_emirleri(id,sevk_emri_no,siparis_id,siparis_kalem_id,musteri_id,urun_id,miktar,tarih,durum) VALUES(?,?,?,?,?,?,2,CURRENT_DATE,'bekliyor')",[shipmentId,`UAT-SE-${shipmentId.slice(0,8)}`,orderId,itemId,customerId,productId]);
  const flow=await getDeal(dealId);const[reverse]=await db.execute('SELECT dt.firsat_id FROM teklifler t JOIN crm_deal_teklifleri dt ON dt.teklif_id=t.id WHERE t.donusen_siparis_id=?',[orderId]);
  let duplicateBlocked=false;try{await repoTeklifiSipariseDonustur(offerId);}catch(e){duplicateBlocked=e instanceof Error&&e.message==='teklif_zaten_donustu';}
  if(flow?.status!=='won'||flow.erpAkisi.offers.length!==1||flow.erpAkisi.orders.length!==1||flow.erpAkisi.production.length!==1||flow.erpAkisi.shipments.length!==1||reverse[0]?.firsat_id!==dealId||!duplicateBlocked)throw new Error('CRM_ERP_FLOW_UAT_FAILED');
  console.log(JSON.stringify({ok:true,dealWon:true,forwardLinks:true,reverseLink:true,productionVisible:true,shipmentVisible:true,duplicateBlocked}));
}finally{
  await db.execute('DELETE FROM sevk_emirleri WHERE id=?',[shipmentId]);await db.execute('DELETE FROM uretim_emri_siparis_kalemleri WHERE id=?',[junctionId]);await db.execute('DELETE FROM uretim_emirleri WHERE id=?',[productionId]);
  if(offerId)await db.execute('UPDATE teklifler SET donusen_siparis_id=NULL WHERE id=?',[offerId]);if(orderId)await db.execute('DELETE FROM satis_siparisleri WHERE id=?',[orderId]);if(offerId)await db.execute('DELETE FROM teklifler WHERE id=?',[offerId]);if(dealId)await db.execute('DELETE FROM crm_deals WHERE id=?',[dealId]);await db.execute('DELETE FROM musteriler WHERE id=?',[customerId]);await db.end();await pool.end();
}
