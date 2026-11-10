import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import { pool } from '@/db/client';

type Row = RowDataPacket & Record<string, unknown>;

export async function listCompanyResearch(search = '') {
  const query = search.trim();
  const [rows] = await pool.execute<Row[]>(`SELECT r.id,r.customer_id,r.finding,r.information_type,r.source_url,r.source_label,r.observed_at,r.verification_status,r.created_at,m.ad company_name,m.kod company_code
    FROM crm_company_research r JOIN musteriler m ON m.id=r.customer_id
    WHERE (?='' OR m.ad LIKE CONCAT('%',?,'%') OR r.finding LIKE CONCAT('%',?,'%'))
    ORDER BY r.created_at DESC,r.id DESC LIMIT 200`, [query,query,query]);
  return rows;
}

export async function getCompanyDesk(customerId: string) {
  const [[company], [profile], [contacts], [research], [products], [activities]] = await Promise.all([
    pool.execute<Row[]>('SELECT id, ad, kod, musteri_durumu FROM musteriler WHERE id=? AND tur=?', [customerId, 'musteri']),
    pool.execute<Row[]>('SELECT * FROM crm_company_profiles WHERE customer_id=?', [customerId]),
    pool.execute<Row[]>('SELECT * FROM crm_company_contacts WHERE customer_id=? ORDER BY created_at, id', [customerId]),
    pool.execute<Row[]>('SELECT * FROM crm_company_research WHERE customer_id=? ORDER BY created_at DESC, id DESC', [customerId]),
    pool.execute<Row[]>('SELECT * FROM crm_company_product_interest WHERE customer_id=? ORDER BY FIELD(product_group,\'PROMATS\',\'MEFATECH\',\'WOGEN\')', [customerId]),
    pool.execute<Row[]>('SELECT id,type,subject,body,result,done,done_at,planned_start_at,due_at,created_at FROM crm_activities WHERE ref_type=? AND ref_id=? ORDER BY created_at DESC', ['musteri', customerId]),
  ]);
  if (!company[0]) return null;
  return { company: company[0], profile: profile[0] ?? null, contacts, research, products, activities };
}

export async function saveCompanyProfile(customerId: string, body: { buyerType?: string | null; companyNote?: string | null }) {
  const current = await getCompanyDesk(customerId);
  if (!current) return null;
  await pool.execute(`INSERT INTO crm_company_profiles (customer_id,buyer_type,company_note) VALUES (?,?,?)
    ON DUPLICATE KEY UPDATE buyer_type=VALUES(buyer_type),company_note=VALUES(company_note)`,
  [customerId, body.buyerType === undefined ? current.profile?.buyer_type ?? null : body.buyerType, body.companyNote === undefined ? current.profile?.company_note ?? null : body.companyNote]);
  return (await getCompanyDesk(customerId))?.profile;
}

export async function addCompanyContact(customerId: string, body: { name: string; title?: string | null; email?: string | null; phone?: string | null; linkedinUrl?: string | null; note?: string | null }) {
  if (!await getCompanyDesk(customerId)) return null;
  const id = randomUUID();
  await pool.execute('INSERT INTO crm_company_contacts (id,customer_id,name,title,email,phone,linkedin_url,note) VALUES (?,?,?,?,?,?,?,?)',
    [id, customerId, body.name, body.title ?? null, body.email ?? null, body.phone ?? null, body.linkedinUrl ?? null, body.note ?? null]);
  const [rows] = await pool.execute<Row[]>('SELECT * FROM crm_company_contacts WHERE id=?', [id]);
  return rows[0];
}

export async function addCompanyResearch(customerId: string, body: { finding: string; informationType: 'research' | 'customer_statement'; sourceUrl?: string | null; sourceLabel?: string | null; observedAt?: string | null; verificationStatus: 'unverified' | 'verified' | 'disputed' }) {
  if (!await getCompanyDesk(customerId)) return null;
  const id = randomUUID();
  await pool.execute('INSERT INTO crm_company_research (id,customer_id,finding,information_type,source_url,source_label,observed_at,verification_status) VALUES (?,?,?,?,?,?,?,?)',
    [id, customerId, body.finding, body.informationType, body.sourceUrl ?? null, body.sourceLabel ?? null, body.observedAt ?? null, body.verificationStatus]);
  const [rows] = await pool.execute<Row[]>('SELECT * FROM crm_company_research WHERE id=?', [id]);
  return rows[0];
}

export async function saveCompanyProduct(customerId: string, body: { productGroup: 'PROMATS' | 'MEFATECH' | 'WOGEN'; interestStatus: 'unknown' | 'possible' | 'confirmed' | 'not_interested'; currentSupplier?: string | null; blocker?: string | null; purchaseTiming?: string | null; evidenceNote?: string | null }) {
  if (!await getCompanyDesk(customerId)) return null;
  const id = randomUUID();
  await pool.execute(`INSERT INTO crm_company_product_interest (id,customer_id,product_group,interest_status,current_supplier,blocker,purchase_timing,evidence_note)
    VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE interest_status=VALUES(interest_status),current_supplier=VALUES(current_supplier),blocker=VALUES(blocker),purchase_timing=VALUES(purchase_timing),evidence_note=VALUES(evidence_note)`,
    [id, customerId, body.productGroup, body.interestStatus, body.currentSupplier ?? null, body.blocker ?? null, body.purchaseTiming ?? null, body.evidenceNote ?? null]);
  const [rows] = await pool.execute<Row[]>('SELECT * FROM crm_company_product_interest WHERE customer_id=? AND product_group=?', [customerId, body.productGroup]);
  return rows[0];
}
