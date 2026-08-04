import{randomUUID}from'node:crypto';import mysql from'mysql2/promise';
import{createReminder,processDueReminders}from'../dist/modules/crm/reminders.repository.js';
import{pool}from'../dist/db/client.js';
const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
const customerId=randomUUID(),activityId=randomUUID(),key=`uat-reminder-${randomUUID()}`,title=`CRM Hatırlatma UAT ${Date.now()}`;let reminderId;
try{const[users]=await db.execute('SELECT id FROM users ORDER BY created_at LIMIT 1');if(!users[0])throw new Error('UAT_USER_NOT_FOUND');const userId=users[0].id;
await db.execute("INSERT INTO musteriler(id,tur,musteri_durumu,kod,ad,is_active)VALUES(?,'musteri','aday',?,'CRM Hatırlatma UAT',1)",[customerId,`UAT-${customerId.slice(0,8)}`]);
await db.execute("INSERT INTO crm_activities(id,ref_type,ref_id,type,subject,owner_user_id,created_by)VALUES(?,'musteri',?,'task','Hatırlatma UAT',?,?)",[activityId,customerId,userId,userId]);
const body={sourceType:'activity',sourceId:activityId,remindAt:new Date(Date.now()-60000).toISOString(),channel:'app',title,message:'Tek sefer bildirim testi'};const first=await createReminder(userId,body,key);const duplicate=await createReminder(userId,body,key);reminderId=first.id;if(first.id!==duplicate.id)throw new Error('CRM_REMINDER_IDEMPOTENCY_FAILED');
const once=await processDueReminders(userId),twice=await processDueReminders(userId);const[notifications]=await db.execute('SELECT COUNT(*) count FROM notifications WHERE user_id=? AND title=?',[userId,title]);if(once.sent!==1||twice.sent!==0||Number(notifications[0].count)!==1)throw new Error('CRM_REMINDER_ONCE_FAILED');
console.log(JSON.stringify({ok:true,idempotent:true,once:true,first:once,second:twice}));}
finally{await db.execute('DELETE FROM notifications WHERE title=?',[title]);if(reminderId)await db.execute('DELETE FROM crm_reminders WHERE id=?',[reminderId]);await db.execute('DELETE FROM crm_activities WHERE id=?',[activityId]);await db.execute('DELETE FROM musteriler WHERE id=?',[customerId]);await db.end();await pool.end();}
