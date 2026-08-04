import mysql from 'mysql2/promise';

const api=(process.env.UAT_API_BASE||'http://127.0.0.1:8078/api').replace(/\/+$/,'');
if(!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD)throw new Error('ADMIN_CREDENTIALS_REQUIRED');
const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
let offerId,customerId,product,productChanged=false;
async function call(path,{method='GET',body,token,expected=200}={}){const response=await fetch(`${api}${path}`,{method,headers:{...(token?{authorization:`Bearer ${token}`} :{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const payload=response.status===204?null:await response.json().catch(()=>null);if(response.status!==expected)throw new Error(`${method} ${path} expected=${expected} actual=${response.status} body=${JSON.stringify(payload)}`);return payload;}
try{
  const [[selected]]=await db.execute("SELECT id,kod,ad,birim,birim_fiyat FROM urunler WHERE is_active=1 AND kategori='urun' ORDER BY created_at LIMIT 1");
  if(!selected)throw new Error('ACTIVE_PRODUCT_REQUIRED');product=selected;
  const auth=await call('/auth/token',{method:'POST',body:{email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD}});const token=auth.access_token;
  const marker=`E2E-TEKLIF-SNAPSHOT-${Date.now()}`;
  const offer=await call('/admin/teklifler',{method:'POST',token,expected:201,body:{yeniMusteri:{ad:marker},paraBirimi:'TRY'}});offerId=offer.id;customerId=offer.musteriId;
  const withProduct=await call(`/admin/teklifler/${offerId}/kalemler`,{method:'POST',token,expected:201,body:{urunId:product.id,aciklama:'ERP ürün snapshot UAT',miktar:2,birimFiyat:0,iskontoOrani:0}});
  const productLine=withProduct.kalemler.find(x=>x.urunId===product.id);
  if(!productLine||productLine.urunKod!==product.kod||productLine.urunAd!==product.ad||productLine.birim!==(product.birim||'adet')||productLine.birimFiyat!==Number(product.birim_fiyat))throw new Error('PRODUCT_SNAPSHOT_FAILED');
  const withManual=await call(`/admin/teklifler/${offerId}/kalemler`,{method:'POST',token,expected:201,body:{aciklama:'Manuel hizmet kalemi',birim:'hizmet',miktar:1,birimFiyat:125,iskontoOrani:0}});
  const manual=withManual.kalemler.find(x=>x.aciklama==='Manuel hizmet kalemi');if(!manual||manual.urunId!==null||manual.birimFiyat!==125)throw new Error('MANUAL_LINE_FAILED');
  await db.execute("UPDATE teklifler SET durum='gonderildi' WHERE id=?",[offerId]);
  await db.execute('UPDATE urunler SET ad=? WHERE id=?',[`${product.ad} [UAT-DEGISIK]`,product.id]);productChanged=true;
  const sent=await call(`/admin/teklifler/${offerId}`,{token});const unchanged=sent.kalemler.find(x=>x.id===productLine.id);
  if(sent.durum!=='gonderildi'||unchanged?.urunAd!==product.ad)throw new Error('SENT_SNAPSHOT_MUTATED');
  await call(`/admin/teklifler/${offerId}/kalemler`,{method:'POST',token,expected:409,body:{aciklama:'engellenmeli',miktar:1,birimFiyat:1}});
  console.log(JSON.stringify({ok:true,productSnapshot:true,manualLine:true,sentOfferUnchanged:true,sentEditGuard:409,lineCount:sent.kalemler.length}));
}finally{
  if(productChanged&&product)await db.execute('UPDATE urunler SET ad=? WHERE id=?',[product.ad,product.id]);
  if(offerId)await db.execute('DELETE FROM teklifler WHERE id=?',[offerId]);
  if(customerId)await db.execute('DELETE FROM musteriler WHERE id=?',[customerId]);
  await db.end();
}
