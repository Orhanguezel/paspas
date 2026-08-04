import{randomUUID}from'node:crypto';import mysql from'mysql2/promise';
import{createActivity,deleteActivity,timeline,updateActivity}from'../dist/modules/crm/activities.repository.js';
const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
const customerId=randomUUID(),ids=[];
try{await db.execute("INSERT INTO musteriler(id,tur,musteri_durumu,kod,ad,is_active)VALUES(?,'musteri','aday',?,'CRM Aktivite UAT',1)",[customerId,`UAT-${customerId.slice(0,8)}`]);
for(const [type,subject]of[['call','Telefon görüşmesi'],['email','Teklif e-postası'],['whatsapp','WhatsApp takibi']]){const a=await createActivity({refType:'musteri',refId:customerId,type,subject,plannedStartAt:new Date().toISOString()},null);ids.push(a.id);}
await updateActivity(ids[0],{done:true,result:'Görüşüldü',durationMinutes:12,nextActionAt:new Date(Date.now()+86400000).toISOString()});
const rows=await timeline('musteri',customerId);if(rows.length!==3||Number(rows.find(x=>x.id===ids[0])?.done)!==1||!rows.find(x=>x.type==='whatsapp'))throw new Error('CRM_ACTIVITY_UAT_FAILED');
console.log(JSON.stringify({ok:true,timeline:rows.length,completed:true,types:true}));}
finally{for(const id of ids)await deleteActivity(id);await db.execute('DELETE FROM musteriler WHERE id=?',[customerId]);await db.end();}
