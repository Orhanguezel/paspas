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
  const map: Record<string, unknown> = { title: body.title, musteri_id: body.musteriId, amount: body.amount, currency: body.currency, probability: body.probability, expected_close_date: body.expectedCloseDate, owner_user_id: body.ownerUserId, source: body.source, status: body.status, lost_reason: body.lostReason };
  const entries = Object.entries(map).filter(([,v]) => v !== undefined);
  if (body.status === 'lost' && !body.lostReason) throw new Error('kaybetme_nedeni_gerekli');
  if (entries.length) await pool.execute(`UPDATE crm_deals SET ${entries.map(([k]) => `${k}=?`).join(',')} WHERE id=?`, [...entries.map(([,v]) => v), id]);
  return getDeal(id);
}

export async function moveDeal(id: string, stageId: string, lostReason: string | undefined) {
  const [stages] = await pool.execute<Row[]>('SELECT pipeline_id,probability,is_won,is_lost FROM crm_stages WHERE id=?', [stageId]);
  const stage = stages[0]; if (!stage) throw new Error('asama_bulunamadi');
  if (Number(stage.is_lost) === 1 && !lostReason) throw new Error('kaybetme_nedeni_gerekli');
  const status = Number(stage.is_won) === 1 ? 'won' : Number(stage.is_lost) === 1 ? 'lost' : 'open';
  const [result] = await pool.execute<ResultSetHeader>('UPDATE crm_deals SET pipeline_id=?,stage_id=?,probability=?,status=?,lost_reason=? WHERE id=?', [stage.pipeline_id,stageId,stage.probability,status,status==='lost'?lostReason:null,id]);
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
