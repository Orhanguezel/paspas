import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import { pool } from '../dist/db/client.js';
import { repoAddKalem, repoGetTeklif, repoPatchKalem, repoPatchTeklif, repoSetTeklifDurum } from '../dist/modules/teklifler/repository.js';

const db = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
const firstCustomerId = randomUUID(), secondCustomerId = randomUUID(), offerId = randomUUID();
try {
  const [users] = await db.execute('SELECT id FROM users WHERE is_active=1 ORDER BY created_at LIMIT 1');
  const owner = users[0]?.id;
  if (!owner) throw new Error('UAT_USER_NOT_FOUND');
  for (const [id, suffix] of [[firstCustomerId, 'A'], [secondCustomerId, 'B']]) {
    await db.execute("INSERT INTO musteriler(id,tur,musteri_durumu,kod,ad,is_active) VALUES(?,'musteri','aktif',?,?,1)", [id, `UAT-EDITOR-${suffix}-${id.slice(0, 6)}`, `Teklif Editor UAT ${suffix}`]);
  }
  await db.execute("INSERT INTO teklifler(id,teklif_no,musteri_id,durum,dil,para_birimi,created_by) VALUES(?,?,?,'taslak','tr','TRY',?)", [offerId, `UAT-EDITOR-${Date.now()}`, firstCustomerId, owner]);
  await repoPatchTeklif(offerId, { musteriId: secondCustomerId, dil: 'en', paraBirimi: 'EUR', kdvOrani: 18, kdvDahil: false, iskontoOrani: 5, nakliye: 125, gecerlilikTarihi: '2026-09-30', odemeKosullari: '30 gün', teslimKosullari: 'Depo teslim', aciklama: 'Editör UAT' });
  const withLine = await repoAddKalem(offerId, { aciklama: 'UAT ürünü', birim: 'adet', miktar: 2, birimFiyat: 400, iskontoOrani: 10 });
  const lineId = withLine?.kalemler?.[0]?.id;
  if (!lineId) throw new Error('UAT_LINE_NOT_CREATED');
  await repoPatchKalem(offerId, lineId, { miktar: 3, birimFiyat: 450 });
  const draft = await repoGetTeklif(offerId);
  await repoSetTeklifDurum(offerId, 'gonderildi', undefined, 'admin');
  let headerLocked = false, lineLocked = false;
  try { await repoPatchTeklif(offerId, { dil: 'de' }); } catch (error) { headerLocked = error instanceof Error && error.message === 'sadece_taslak_duzenlenir'; }
  try { await repoAddKalem(offerId, { aciklama: 'Yasak', miktar: 1 }); } catch (error) { lineLocked = error instanceof Error && error.message === 'sadece_taslak_duzenlenir'; }
  const completeDraft = draft?.musteriId === secondCustomerId && draft.dil === 'en' && draft.paraBirimi === 'EUR' && draft.kdvOrani === 18 && draft.iskontoOrani === 5 && draft.nakliye === 125 && draft.odemeKosullari === '30 gün' && draft.teslimKosullari === 'Depo teslim' && draft.kalemler?.[0]?.miktar === 3;
  if (!completeDraft || !headerLocked || !lineLocked) throw new Error('TEKLIF_EDITOR_UAT_FAILED');
  console.log(JSON.stringify({ ok: true, customerSelector: true, language: true, completeDraft: true, sentImmutable: true }));
} finally {
  await db.execute('DELETE FROM teklifler WHERE id=?', [offerId]);
  await db.execute('DELETE FROM musteriler WHERE id IN (?,?)', [firstCustomerId, secondCustomerId]);
  await db.end();
  await pool.end();
}
