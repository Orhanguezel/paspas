import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import { pool } from '../dist/db/client.js';
import { repoListTalepler, repoPatchTalep } from '../dist/modules/teklifler/repository.js';

const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
const ids=[randomUUID(),randomUUID(),randomUUID(),randomUUID()];
try{
  const[users]=await db.execute('SELECT id FROM users WHERE is_active=1 ORDER BY created_at LIMIT 1');const userId=users[0]?.id;if(!userId)throw new Error('UAT_USER_NOT_FOUND');
  const rows=[
    [ids[0],'tr','Inbox Arama Alpha','Firma A','alpha@example.invalid','Yeni ürün','yeni',userId,'2026-07-01 10:00:00'],
    [ids[1],'en','Inbox Beta','Firma B','beta@example.invalid','Spare parts','inceleniyor',userId,'2026-07-02 10:00:00'],
    [ids[2],'de','Inbox Gamma','Firma C','gamma@example.invalid','Angebot','teklife_donustu',null,'2026-07-03 10:00:00'],
    [ids[3],'tr','Inbox Spam','Firma D','spam@example.invalid','Reklam','istenmeyen',null,'2026-07-04 10:00:00'],
  ];
  for(const r of rows)await db.execute('INSERT INTO teklif_talepleri(id,dil,ad,firma,email,konu,durum,atanan_user_id,created_at)VALUES(?,?,?,?,?,?,?,?,?)',r);
  const base={limit:50,offset:0};
  const[newBox,reviewBox,convertedBox,spamBox,search,dateLanguageSubject,owner]=await Promise.all([
    repoListTalepler({...base,durumGrubu:'yeni'}),repoListTalepler({...base,durumGrubu:'inceleniyor'}),repoListTalepler({...base,durumGrubu:'donusturuldu'}),repoListTalepler({...base,durumGrubu:'spam'}),repoListTalepler({...base,q:'Alpha'}),repoListTalepler({...base,dateFrom:'2026-07-02',dateTo:'2026-07-03',dil:'en',konu:'Spare'}),repoListTalepler({...base,ownerUserId:userId}),
  ]);
  const assigned=await repoPatchTalep(ids[3],{atananUserId:userId,durum:'inceleniyor'});const cleared=await repoPatchTalep(ids[3],{atananUserId:null});
  if(!newBox.items.some(x=>x.id===ids[0])||!reviewBox.items.some(x=>x.id===ids[1])||!convertedBox.items.some(x=>x.id===ids[2])||!spamBox.items.some(x=>x.id===ids[3])||search.items.length!==1||dateLanguageSubject.items.length!==1||!owner.items.some(x=>x.id===ids[0])||assigned?.durum!=='inceleniyor'||cleared?.atananUserId!==null)throw new Error('TEKLIF_INBOX_UAT_FAILED');
  console.log(JSON.stringify({ok:true,inboxGroups:true,search:true,dateLanguageSubject:true,owner:true,statusAndAssignment:true,unassign:true}));
}finally{await db.execute('DELETE FROM teklif_talepleri WHERE id IN (?,?,?,?)',ids);await db.end();await pool.end();}
