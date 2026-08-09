import { randomUUID } from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { Database } from '../db';
import type { ProductCreate, ProductUpdate } from './schema';

const columns = {
  code: 'code', name: 'name', category: 'category', supplyType: 'supply_type', unit: 'unit', productGroup: 'product_group',
  productSubgroup: 'product_subgroup', description: 'description', priceTry: 'price_try', priceUsd: 'price_usd', priceEur: 'price_eur',
  vatRate: 'vat_rate', setsPerCarton: 'sets_per_carton', cartonsPerPallet: 'cartons_per_pallet', moqAmount: 'moq_amount', moqUnit: 'moq_unit',
  cartonWidthCm: 'carton_width_cm', cartonLengthCm: 'carton_length_cm', cartonHeightCm: 'carton_height_cm',
  palletWidthCm: 'pallet_width_cm', palletLengthCm: 'pallet_length_cm', palletHeightCm: 'pallet_height_cm',
  netWeightPerSetKg: 'net_weight_per_set_kg', grossWeightPerCartonKg: 'gross_weight_per_carton_kg', palletTareKg: 'pallet_tare_kg',
  hsCode: 'hs_code', originCountry: 'origin_country', isActive: 'is_active',
} as const;

function mapRow(row: RowDataPacket) {
  return Object.fromEntries([
    ['id', row.id], ...Object.entries(columns).map(([key, column]) => [key, column === 'is_active' ? Boolean(row[column]) : row[column]]),
    ['createdAt', row.created_at], ['updatedAt', row.updated_at],
  ]);
}
function entries(input: ProductCreate | ProductUpdate) {
  return Object.entries(input).filter(([, value]) => value !== undefined) as Array<[keyof typeof columns, unknown]>;
}
function valueOf(key: keyof typeof columns, value: unknown) { return key === 'isActive' ? (value ? 1 : 0) : value; }

export async function listProducts(db: Database, filter: { q?: string; limit: number; offset: number; active?: string }) {
  const where: string[] = []; const values: unknown[] = [];
  if (filter.q) { where.push('(code LIKE ? OR name LIKE ?)'); values.push(`%${filter.q}%`, `%${filter.q}%`); }
  if (filter.active) { where.push('is_active = ?'); values.push(filter.active === 'true' ? 1 : 0); }
  const clause = where.length ? ` WHERE ${where.join(' AND ')}` : '';
  const [[countRows], [rows]] = await Promise.all([
    db.query<RowDataPacket[]>(`SELECT COUNT(*) total FROM products${clause}`, values),
    db.query<RowDataPacket[]>(`SELECT * FROM products${clause} ORDER BY name LIMIT ? OFFSET ?`, [...values, filter.limit, filter.offset]),
  ]);
  return { items: rows.map(mapRow), total: Number(countRows[0]?.total || 0) };
}
export async function getProduct(db: Database, id: string) {
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
}
export async function createProduct(db: Database, input: ProductCreate) {
  const id = randomUUID(); const fields = entries(input);
  await db.query(`INSERT INTO products (id, ${fields.map(([key]) => columns[key]).join(', ')}) VALUES (?, ${fields.map(() => '?').join(', ')})`, [id, ...fields.map(([key, value]) => valueOf(key, value))]);
  return getProduct(db, id);
}
export async function updateProduct(db: Database, id: string, input: ProductUpdate) {
  const fields = entries(input);
  const [result] = await db.query<ResultSetHeader>(`UPDATE products SET ${fields.map(([key]) => `${columns[key]} = ?`).join(', ')} WHERE id = ?`, [...fields.map(([key, value]) => valueOf(key, value)), id]);
  return result.affectedRows ? getProduct(db, id) : null;
}
export async function archiveProduct(db: Database, id: string) {
  const [result] = await db.query<ResultSetHeader>('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
