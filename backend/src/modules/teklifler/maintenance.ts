import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';

import { pool } from '@/db/client';
import { writeCrmAudit } from '@/modules/crm/audit';

type Row = RowDataPacket & Record<string, unknown>;

export async function notifyOfferAdmins(title:string,message:string,type:string):Promise<number>{
  const[users]=await pool.execute<Row[]>("SELECT DISTINCT u.id FROM users u JOIN user_roles ur ON ur.user_id=u.id WHERE u.is_active=1 AND ur.role='admin'");
  for(const user of users)await pool.execute('INSERT INTO notifications(id,user_id,title,message,type,is_read)VALUES(?,?,?,?,?,0)',[randomUUID(),user.id,title,message,type]);
  return users.length;
}

export async function expireDueOffers(now=new Date()):Promise<number>{
  const[rows]=await pool.execute<Row[]>("SELECT id,teklif_no,durum,gecerlilik_tarihi FROM teklifler WHERE durum IN ('gonderildi','goruntulendi') AND gecerlilik_tarihi IS NOT NULL AND gecerlilik_tarihi<? ORDER BY gecerlilik_tarihi LIMIT 500",[now]);
  let expired=0;
  for(const row of rows){
    const[result]=await pool.execute<import('mysql2').ResultSetHeader>("UPDATE teklifler SET durum='suresi_doldu' WHERE id=? AND durum IN ('gonderildi','goruntulendi')",[row.id]);
    if(!result.affectedRows)continue;
    expired++;
    await writeCrmAudit({actorUserId:null,action:'CRM_OFFER_EXPIRED',resource:'offers',resourceId:String(row.id),before:{durum:row.durum,gecerlilikTarihi:row.gecerlilik_tarihi},after:{durum:'suresi_doldu'},meta:{scheduler:true}});
  }
  return expired;
}
