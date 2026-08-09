import { randomUUID } from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { Database } from '../db';
import type { CustomerCreate, CustomerUpdate } from './schema';

const columns = { code: 'code', name: 'name', contactName: 'contact_name', phone: 'phone', mobile: 'mobile', email: 'email', website: 'website', defaultDiscountPercent: 'default_discount_percent', address: 'address', country: 'country', city: 'city', isForeign: 'is_foreign', isActive: 'is_active' } as const;
function mapRow(row: RowDataPacket) { return Object.fromEntries([['id', row.id], ...Object.entries(columns).map(([key, column]) => [key, column.startsWith('is_') ? Boolean(row[column]) : row[column]]), ['createdAt', row.created_at], ['updatedAt', row.updated_at]]); }
function entries(input: CustomerCreate | CustomerUpdate) { return Object.entries(input).filter(([, value]) => value !== undefined) as Array<[keyof typeof columns, unknown]>; }
function valueOf(key: keyof typeof columns, value: unknown) { return key === 'isForeign' || key === 'isActive' ? (value ? 1 : 0) : value; }
export async function listCustomers(db: Database, filter: { q?: string; limit: number; offset: number }) {
  const clause = filter.q ? ' WHERE code LIKE ? OR name LIKE ? OR contact_name LIKE ?' : ''; const values = filter.q ? [`%${filter.q}%`, `%${filter.q}%`, `%${filter.q}%`] : [];
  const [[counts], [rows]] = await Promise.all([db.query<RowDataPacket[]>(`SELECT COUNT(*) total FROM customers${clause}`, values), db.query<RowDataPacket[]>(`SELECT * FROM customers${clause} ORDER BY name LIMIT ? OFFSET ?`, [...values, filter.limit, filter.offset])]);
  return { items: rows.map(mapRow), total: Number(counts[0]?.total || 0) };
}
export async function getCustomer(db: Database, id: string) { const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM customers WHERE id=? LIMIT 1', [id]); return rows[0] ? mapRow(rows[0]) : null; }
export async function createCustomer(db: Database, input: CustomerCreate) { const id = randomUUID(); const fields = entries(input); await db.query(`INSERT INTO customers (id, ${fields.map(([key]) => columns[key]).join(',')}) VALUES (?,${fields.map(() => '?').join(',')})`, [id, ...fields.map(([key, value]) => valueOf(key, value))]); return getCustomer(db, id); }
export async function updateCustomer(db: Database, id: string, input: CustomerUpdate) { const fields = entries(input); const [result] = await db.query<ResultSetHeader>(`UPDATE customers SET ${fields.map(([key]) => `${columns[key]}=?`).join(',')} WHERE id=?`, [...fields.map(([key, value]) => valueOf(key, value)), id]); return result.affectedRows ? getCustomer(db, id) : null; }
export async function archiveCustomer(db: Database, id: string) { const [result] = await db.query<ResultSetHeader>('UPDATE customers SET is_active=0 WHERE id=?', [id]); return result.affectedRows > 0; }
