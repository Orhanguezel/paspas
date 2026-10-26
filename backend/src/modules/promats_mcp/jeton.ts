import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '@/db/client';

export const KAPSAMLAR = [
  { kod: 'okuma', ad: 'ERP ve görev okuma', aciklama: 'Ürün, sipariş, stok, üretim emri ve yazılım görevlerini okur.' },
  { kod: 'not', ad: 'Yazılım görevi (onaylı)', aciklama: 'Görev açma, yorum ve durum değişikliği için önce önizleme hazırlar.' },
] as const;
export type Kapsam = typeof KAPSAMLAR[number]['kod'];
export const SURELER = [30, 90, 180, 365] as const;
export const AKTIF_KAPSAMLAR = KAPSAMLAR.map((scope) => scope.kod) as Kapsam[];
const TOKEN_PATTERN = /^pmcp_[A-Za-z0-9_-]{43}$/;
const digest = (value: string) => createHash('sha256').update(value).digest('hex');

type JetonRow = RowDataPacket & {
  id: string; user_id: string; ad: string; onek: string; kapsamlar: string | Kapsam[];
  son_kullanma: Date; son_kullanim_at: Date | null; son_kullanim_ip: string | null;
  kullanim_sayisi: number; iptal_at: Date | null; created_at: Date; kullanici_ad: string | null; kullanici_email: string;
};
export type JetonDto = {
  id: string; ad: string; onek: string; kapsamlar: Kapsam[]; sonKullanma: string;
  sonKullanimAt: string | null; sonKullanimIp: string | null; kullanimSayisi: number;
  iptalAt: string | null; createdAt: string; kullanici: { id: string; ad: string; email: string };
};
export type JetonBaglami = { jetonId: string; userId: string; onek: string; kapsamlar: Kapsam[] };

function parseScopes(value: string | Kapsam[]): Kapsam[] {
  let parsed: unknown = value;
  if (typeof value === 'string') { try { parsed = JSON.parse(value); } catch { return []; } }
  return Array.isArray(parsed) ? parsed.filter((v): v is Kapsam => v === 'okuma' || v === 'not') : [];
}
const iso = (value: Date | null) => value ? new Date(value).toISOString() : null;
function dto(row: JetonRow): JetonDto {
  return { id: row.id, ad: row.ad, onek: row.onek, kapsamlar: parseScopes(row.kapsamlar),
    sonKullanma: iso(row.son_kullanma)!, sonKullanimAt: iso(row.son_kullanim_at),
    sonKullanimIp: row.son_kullanim_ip, kullanimSayisi: Number(row.kullanim_sayisi),
    iptalAt: iso(row.iptal_at), createdAt: iso(row.created_at)!,
    kullanici: { id: row.user_id, ad: row.kullanici_ad || row.kullanici_email, email: row.kullanici_email } };
}
const SELECT = `SELECT j.*, u.full_name AS kullanici_ad, u.email AS kullanici_email
  FROM promats_mcp_jeton j JOIN users u ON u.id = j.user_id`;

export async function jetonListele(userId: string, hepsi: boolean, iptalDahil: boolean): Promise<JetonDto[]> {
  const where = [hepsi ? '1=1' : 'j.user_id = ?', ...(!iptalDahil ? ['j.iptal_at IS NULL'] : [])].join(' AND ');
  const [rows] = await pool.query<JetonRow[]>(`${SELECT} WHERE ${where} ORDER BY j.created_at DESC LIMIT 500`, hepsi ? [] : [userId]);
  return rows.map(dto);
}
export async function jetonOlustur(userId: string, ad: string, kapsamlar: Kapsam[], gun: number) {
  const jeton = `pmcp_${randomBytes(32).toString('base64url')}`;
  const id = randomUUID();
  await pool.query<ResultSetHeader>(
    'INSERT INTO promats_mcp_jeton (id,user_id,ad,onek,ozet,kapsamlar,son_kullanma) VALUES (?,?,?,?,?,?,DATE_ADD(NOW(3), INTERVAL ? DAY))',
    [id, userId, ad, jeton.slice(0, 12), digest(jeton), JSON.stringify(kapsamlar), gun],
  );
  const [rows] = await pool.query<JetonRow[]>(`${SELECT} WHERE j.id=?`, [id]);
  return { jeton, item: dto(rows[0]!) };
}
export async function jetonIptal(id: string, userId: string, hepsi = false): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE promats_mcp_jeton SET iptal_at=NOW(3) WHERE id=? AND (user_id=? OR ?=1) AND iptal_at IS NULL', [id, userId, hepsi ? 1 : 0]);
  return result.affectedRows === 1;
}
export async function jetonDogrula(jeton: string, ip: string): Promise<JetonBaglami | null> {
  if (!TOKEN_PATTERN.test(jeton)) return null;
  const [rows] = await pool.query<(RowDataPacket & { id: string; user_id: string; onek: string; kapsamlar: string | Kapsam[] })[]>(
    `SELECT j.id,j.user_id,j.onek,j.kapsamlar FROM promats_mcp_jeton j
      JOIN users u ON u.id=j.user_id AND u.is_active=1
      JOIN user_roles r ON r.user_id=u.id AND r.role='admin'
      WHERE j.ozet=? AND j.iptal_at IS NULL AND j.son_kullanma>NOW(3) LIMIT 1`, [digest(jeton)]);
  const row = rows[0];
  if (!row) return null;
  await pool.query('UPDATE promats_mcp_jeton SET son_kullanim_at=NOW(3), son_kullanim_ip=?, kullanim_sayisi=kullanim_sayisi+1 WHERE id=?', [ip.slice(0, 64), row.id]);
  return { jetonId: row.id, userId: row.user_id, onek: row.onek, kapsamlar: parseScopes(row.kapsamlar) };
}

export async function jetonBaglamiById(jetonId: string, ip: string | null): Promise<JetonBaglami | null> {
  const [rows] = await pool.query<(RowDataPacket & { id: string; user_id: string; onek: string; kapsamlar: string | Kapsam[] })[]>(
    `SELECT j.id,j.user_id,j.onek,j.kapsamlar FROM promats_mcp_jeton j
      JOIN users u ON u.id=j.user_id AND u.is_active=1 JOIN user_roles r ON r.user_id=u.id AND r.role='admin'
      WHERE j.id=? AND j.iptal_at IS NULL AND j.son_kullanma>NOW(3) LIMIT 1`, [jetonId]);
  const row = rows[0];
  if (!row) return null;
  await pool.query('UPDATE promats_mcp_jeton SET son_kullanim_at=NOW(3),son_kullanim_ip=?,kullanim_sayisi=kullanim_sayisi+1 WHERE id=?', [ip?.slice(0, 64) ?? null, row.id]);
  return { jetonId: row.id, userId: row.user_id, onek: row.onek, kapsamlar: parseScopes(row.kapsamlar) };
}

export async function baglantiSatiriAc(input: { userId: string; ad: string; onek: string; kapsamlar: Kapsam[]; gun: number }): Promise<JetonDto> {
  const id = randomUUID();
  await pool.query<ResultSetHeader>(
    'INSERT INTO promats_mcp_jeton (id,user_id,ad,onek,ozet,kapsamlar,son_kullanma) VALUES (?,?,?,?,?,?,DATE_ADD(NOW(3),INTERVAL ? DAY))',
    [id, input.userId, input.ad, input.onek.slice(0, 16), digest(`oauth:${randomBytes(32).toString('hex')}`), JSON.stringify(input.kapsamlar), input.gun]);
  const [rows] = await pool.query<JetonRow[]>(`${SELECT} WHERE j.id=?`, [id]);
  return dto(rows[0]!);
}

export function codeDigest(code: string) { return digest(code); }
