import { randomUUID } from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '@/db/client';
import type { DealCreate, DealList, DealPatch, TalepToDeal } from './validation';

type Row = RowDataPacket & Record<string, unknown>;

async function defaultPipeline() {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.id pipeline_id,s.id stage_id,s.probability FROM crm_pipelines p
     JOIN crm_stages s ON s.pipeline_id=p.id
     ORDER BY p.is_default DESC,p.sort,s.sort LIMIT 1`,
  );
  if (!rows[0]) throw new Error('varsayilan_pipeline_bulunamadi');
  return rows[0] as RowDataPacket & { pipeline_id: string; stage_id: string; probability: number };
}

export async function listPipelines() {
  const [pipelines] = await pool.execute<RowDataPacket[]>('SELECT * FROM crm_pipelines ORDER BY sort,created_at');
  const [stages] = await pool.execute<RowDataPacket[]>('SELECT * FROM crm_stages ORDER BY pipeline_id,sort');
  return pipelines.map((p) => ({ ...p, stages: stages.filter((s) => s.pipeline_id === p.id) }));
}

export async function listDeals(q: DealList) {
  const where = ['1=1']; const values: unknown[] = [];
  for (const [column, value] of [['d.pipeline_id', q.pipelineId], ['d.stage_id', q.stageId], ['d.musteri_id', q.musteriId], ['d.owner_user_id', q.ownerUserId], ['d.status', q.status]] as const) {
    if (value) { where.push(`${column}=?`); values.push(value); }
  }
  if (q.q) { where.push('(d.title LIKE ? OR m.ad LIKE ?)'); values.push(`%${q.q}%`, `%${q.q}%`); }
  const from = `FROM crm_deals d LEFT JOIN musteriler m ON m.id=d.musteri_id JOIN crm_pipelines p ON p.id=d.pipeline_id JOIN crm_stages s ON s.id=d.stage_id WHERE ${where.join(' AND ')}`;
  const [items] = await pool.execute<Row[]>(`SELECT d.*,m.ad musteri_adi,p.name pipeline_name,s.name stage_name,s.renk stage_color ${from} ORDER BY d.updated_at DESC LIMIT ${q.limit} OFFSET ${q.offset}`, values);
  const [counts] = await pool.execute<Row[]>(`SELECT COUNT(*) count ${from}`, values);
  return { items, total: Number(counts[0]?.count ?? 0) };
}

export async function getDeal(id: string) {
  const [rows] = await pool.execute<Row[]>(
    `SELECT d.*,m.ad musteri_adi,p.name pipeline_name,s.name stage_name,s.renk stage_color
     FROM crm_deals d LEFT JOIN musteriler m ON m.id=d.musteri_id JOIN crm_pipelines p ON p.id=d.pipeline_id JOIN crm_stages s ON s.id=d.stage_id WHERE d.id=?`, [id],
  );
  return rows[0] ?? null;
}

export async function createDeal(body: DealCreate, userId: string | null) {
  const defaults = await defaultPipeline();
  const pipelineId = body.pipelineId ?? defaults.pipeline_id;
  const stageId = body.stageId ?? defaults.stage_id;
  const [stage] = await pool.execute<Row[]>('SELECT probability FROM crm_stages WHERE id=? AND pipeline_id=?', [stageId, pipelineId]);
  if (!stage[0]) throw new Error('asama_pipeline_uyumsuz');
  const id = randomUUID();
  await pool.execute(
    `INSERT INTO crm_deals(id,pipeline_id,stage_id,musteri_id,talep_id,title,amount,currency,probability,expected_close_date,owner_user_id,source,created_by)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id,pipelineId,stageId,body.musteriId??null,body.talepId??null,body.title,body.amount,body.currency,body.probability??stage[0].probability,body.expectedCloseDate??null,body.ownerUserId??userId,body.source??null,userId],
  );
  return getDeal(id);
}

export async function updateDeal(id: string, body: DealPatch) {
  const map: Record<string, unknown> = { title: body.title, musteri_id: body.musteriId, amount: body.amount, currency: body.currency, probability: body.probability, expected_close_date: body.expectedCloseDate, owner_user_id: body.ownerUserId, source: body.source };
  const entries = Object.entries(map).filter(([,v]) => v !== undefined);
  if (entries.length) await pool.execute(`UPDATE crm_deals SET ${entries.map(([k]) => `${k}=?`).join(',')} WHERE id=?`, [...entries.map(([,v]) => v), id]);
  return getDeal(id);
}

export async function moveDeal(id: string, stageId: string, lostReasonId: string | undefined) {
  const [stages] = await pool.execute<Row[]>('SELECT pipeline_id,probability,is_won,is_lost FROM crm_stages WHERE id=?', [stageId]);
  const stage = stages[0]; if (!stage) throw new Error('asama_bulunamadi');
  const [deals]=await pool.execute<Row[]>('SELECT musteri_id FROM crm_deals WHERE id=?',[id]);if(!deals[0])return null;
  let lostReason:string|null=null;if(Number(stage.is_lost)===1){if(!lostReasonId)throw new Error('kaybetme_nedeni_gerekli');const[reasons]=await pool.execute<Row[]>('SELECT name FROM crm_loss_reasons WHERE id=? AND is_active=1',[lostReasonId]);if(!reasons[0])throw new Error('kaybetme_nedeni_gecersiz');lostReason=String(reasons[0].name);}
  if(Number(stage.is_won)===1&&!deals[0].musteri_id)throw new Error('kazanilan_firsat_musterisi_gerekli');
  const status = Number(stage.is_won) === 1 ? 'won' : Number(stage.is_lost) === 1 ? 'lost' : 'open';
  const [result] = await pool.execute<ResultSetHeader>('UPDATE crm_deals SET pipeline_id=?,stage_id=?,probability=?,status=?,lost_reason=?,lost_reason_id=?,closed_at=? WHERE id=?', [stage.pipeline_id,stageId,stage.probability,status,status==='lost'?lostReason:null,status==='lost'?lostReasonId:null,status==='won'||status==='lost'?new Date():null,id]);
  return result.affectedRows ? getDeal(id) : null;
}

export async function deleteDeal(id: string) {
  const [result] = await pool.execute<ResultSetHeader>('DELETE FROM crm_deals WHERE id=?', [id]);
  return result.affectedRows > 0;
}

export async function convertTalepToDeal(talepId: string, body: TalepToDeal, userId: string | null) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<Row[]>('SELECT * FROM teklif_talepleri WHERE id=? FOR UPDATE', [talepId]);
    const talep = rows[0]; if (!talep) throw new Error('talep_bulunamadi');
    const [links] = await connection.execute<Row[]>('SELECT donusen_firsat_id FROM crm_talep_detaylari WHERE talep_id=? FOR UPDATE', [talepId]);
    if (links[0]?.donusen_firsat_id) throw new Error('talep_zaten_firsata_donustu');
    let musteriId = body.musteriId;
    if (!musteriId && body.yeniMusteri) {
      musteriId = randomUUID();
      const kod = `MUS-${musteriId.replaceAll('-', '').slice(0, 12).toUpperCase()}`;
      await connection.execute('INSERT INTO musteriler(id,tur,musteri_durumu,kod,ad,ilgili_kisi,telefon,email,adres) VALUES(?,\'musteri\',\'aday\',?,?,?,?,?,?)', [musteriId,kod,body.yeniMusteri.ad,String(talep.ad??''),body.yeniMusteri.telefon??talep.telefon??null,body.yeniMusteri.email??talep.email??null,body.yeniMusteri.adres??null]);
    }
    if (!musteriId) throw new Error('musteri_gerekli');
    const [pipelineRows] = await connection.execute<Row[]>(
      `SELECT p.id pipeline_id,s.id stage_id,s.probability FROM crm_pipelines p
       JOIN crm_stages s ON s.pipeline_id=p.id
       ORDER BY p.is_default DESC,p.sort,s.sort LIMIT 1 FOR UPDATE`,
    );
    const defaults = pipelineRows[0];
    if (!defaults) throw new Error('varsayilan_pipeline_bulunamadi');
    const dealId = randomUUID();
    await connection.execute(
      `INSERT INTO crm_deals(id,pipeline_id,stage_id,musteri_id,talep_id,title,amount,currency,probability,owner_user_id,source,created_by)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
      [dealId,defaults.pipeline_id,defaults.stage_id,musteriId,talepId,body.title??talep.firma??talep.ad,body.amount,body.currency,defaults.probability,body.ownerUserId??talep.atanan_user_id??userId,'teklif_talebi',userId],
    );
    await connection.execute(
      `INSERT INTO crm_talep_detaylari(talep_id,source,channel,product_interest,owner_user_id,donusen_firsat_id,converted_at)
       VALUES(?,'web','form',?,?,?,CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE owner_user_id=VALUES(owner_user_id),donusen_firsat_id=VALUES(donusen_firsat_id),converted_at=CURRENT_TIMESTAMP`,
      [talepId,talep.secili_urunler??null,body.ownerUserId??talep.atanan_user_id??userId,dealId],
    );
    await connection.execute('UPDATE teklif_talepleri SET durum=\'musteriye_donustu\',musteri_id=? WHERE id=?', [musteriId,talepId]);
    await connection.commit(); return { talepId, musteriId, dealId };
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

export async function listDealProducts(dealId: string) {
  const [rows] = await pool.execute<Row[]>(
    `SELECT f.*,u.kod urun_kodu,u.ad urun_adi,u.birim
     FROM firsat_urunleri f JOIN urunler u ON u.id=f.urun_id WHERE f.firsat_id=? ORDER BY f.sira,f.created_at`, [dealId],
  );
  return rows;
}

async function recalcDealAmount(dealId: string) {
  await pool.execute(
    `UPDATE crm_deals d SET d.amount=(SELECT COALESCE(SUM(f.miktar*COALESCE(f.birim_fiyat,0)),0) FROM firsat_urunleri f WHERE f.firsat_id=d.id) WHERE d.id=?`, [dealId],
  );
}

export async function createDealProduct(dealId: string, body: { urunId:string;miktar:number;birimFiyat?:number|null;paraBirimi:string;aciklama?:string|null;sira:number }) {
  if (!await getDeal(dealId)) throw new Error('firsat_bulunamadi');
  const id=randomUUID();
  await pool.execute('INSERT INTO firsat_urunleri(id,firsat_id,urun_id,miktar,birim_fiyat,para_birimi,aciklama,sira) VALUES(?,?,?,?,?,?,?,?)', [id,dealId,body.urunId,body.miktar,body.birimFiyat??null,body.paraBirimi,body.aciklama??null,body.sira]);
  await recalcDealAmount(dealId); return (await listDealProducts(dealId)).find((x)=>x.id===id);
}

export async function updateDealProduct(dealId:string,id:string,body:Record<string,unknown>) {
  const map:Record<string,unknown>={urun_id:body.urunId,miktar:body.miktar,birim_fiyat:body.birimFiyat,para_birimi:body.paraBirimi,aciklama:body.aciklama,sira:body.sira};
  const entries=Object.entries(map).filter(([,v])=>v!==undefined);
  const [result]=await pool.execute<ResultSetHeader>(`UPDATE firsat_urunleri SET ${entries.map(([k])=>`${k}=?`).join(',')} WHERE id=? AND firsat_id=?`,[...entries.map(([,v])=>v),id,dealId]);
  if(!result.affectedRows)return null; await recalcDealAmount(dealId); return (await listDealProducts(dealId)).find((x)=>x.id===id)??null;
}

export async function deleteDealProduct(dealId:string,id:string) {
  const [result]=await pool.execute<ResultSetHeader>('DELETE FROM firsat_urunleri WHERE id=? AND firsat_id=?',[id,dealId]);
  if(result.affectedRows)await recalcDealAmount(dealId); return result.affectedRows>0;
}

export async function upsertDealNeed(dealId:string,body:{ihtiyacNotu?:string|null;teslimBeklentisi?:string|null}) {
  if (!await getDeal(dealId)) throw new Error('firsat_bulunamadi');
  await pool.execute(`INSERT INTO crm_deal_ihtiyaclari(firsat_id,ihtiyac_notu,teslim_beklentisi) VALUES(?,?,?)
    ON DUPLICATE KEY UPDATE ihtiyac_notu=VALUES(ihtiyac_notu),teslim_beklentisi=VALUES(teslim_beklentisi)`,[dealId,body.ihtiyacNotu??null,body.teslimBeklentisi??null]);
  const [rows]=await pool.execute<Row[]>('SELECT * FROM crm_deal_ihtiyaclari WHERE firsat_id=?',[dealId]); return rows[0];
}

export async function convertDealToOffer(dealId:string,body:{dil:string;kdvOrani:number},userId:string|null) {
  const connection=await pool.getConnection();
  try{
    await connection.beginTransaction();
    const [deals]=await connection.execute<Row[]>('SELECT * FROM crm_deals WHERE id=? FOR UPDATE',[dealId]); const deal=deals[0];
    if(!deal)throw new Error('firsat_bulunamadi'); if(!deal.musteri_id)throw new Error('firsat_musterisi_gerekli');
    const [linked]=await connection.execute<Row[]>('SELECT teklif_id FROM crm_deal_teklifleri WHERE firsat_id=?',[dealId]);
    if(linked[0])throw new Error('firsat_zaten_teklife_donustu');
    const [items]=await connection.execute<Row[]>(`SELECT f.*,u.kod urun_kodu,u.ad urun_adi,u.birim
      FROM firsat_urunleri f JOIN urunler u ON u.id=f.urun_id WHERE f.firsat_id=? ORDER BY f.sira FOR UPDATE`,[dealId]);
    if(!items.length)throw new Error('firsat_urunu_gerekli');
    const year=new Date().getFullYear();
    await connection.execute('INSERT INTO teklif_no_sayaclari(yil,son_no) VALUES(?,LAST_INSERT_ID(1)) ON DUPLICATE KEY UPDATE son_no=LAST_INSERT_ID(son_no+1)',[year]);
    const [numbers]=await connection.execute<Row[]>('SELECT LAST_INSERT_ID() no'); const teklifNo=`TK-${year}-${String(numbers[0].no).padStart(4,'0')}`;
    const teklifId=randomUUID(); const paraBirimi=String(deal.currency||items[0].para_birimi||'TRY');
    const araToplam=items.reduce((sum,x)=>sum+Number(x.miktar)*Number(x.birim_fiyat??0),0); const kdv=araToplam*body.kdvOrani/100;
    await connection.execute(`INSERT INTO teklifler(id,teklif_no,musteri_id,durum,dil,para_birimi,ara_toplam,kdv_orani,kdv_tutari,genel_toplam,aciklama,goruntuleme_token,created_by)
      VALUES(?,?,?,'taslak',?,?,?,?,?,?,?,?,?)`,[teklifId,teklifNo,deal.musteri_id,body.dil,paraBirimi,araToplam,body.kdvOrani,kdv,araToplam+kdv,`CRM fırsatı: ${deal.title}`,randomUUID(),userId]);
    for(const item of items)await connection.execute(`INSERT INTO teklif_kalemleri(id,teklif_id,urun_id,urun_kod,urun_ad,aciklama,birim,miktar,birim_fiyat,iskonto_orani,satir_toplam,sira)
      VALUES(?,?,?,?,?,?,?,?,?,0,?,?)`,[randomUUID(),teklifId,item.urun_id,item.urun_kodu,item.urun_adi,item.aciklama??item.urun_adi,item.birim??'adet',item.miktar,item.birim_fiyat??0,Number(item.miktar)*Number(item.birim_fiyat??0),item.sira]);
    await connection.execute('INSERT INTO crm_deal_teklifleri(firsat_id,teklif_id) VALUES(?,?)',[dealId,teklifId]);
    await connection.commit(); return {dealId,teklifId,teklifNo};
  }catch(error){await connection.rollback();throw error;}finally{connection.release();}
}
