import { randomUUID } from 'node:crypto';
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import type { Database } from '../db';
import { assertMoq, calculateLineTotal, calculateTotals, convertQuantity } from '../domain/calculator';
import type { QuoteCreate } from './schema';

export async function listQuotes(db: Database) {
  const [rows] = await db.query<RowDataPacket[]>('SELECT q.*, c.name customer_name FROM quotes q JOIN customers c ON c.id=q.customer_id ORDER BY q.created_at DESC LIMIT 100');
  return rows.map((row) => ({ id: row.id, quoteNo: row.quote_no, customerId: row.customer_id, customerName: row.customer_name, status: row.status, currency: row.currency, deliveryMethod: row.delivery_method, currentRevision: row.current_revision, createdAt: row.created_at }));
}
async function nextQuoteNo(connection: PoolConnection) {
  const year = new Date().getFullYear();
  await connection.query('INSERT INTO quote_sequences (sequence_year,current_value) VALUES (?,1) ON DUPLICATE KEY UPDATE current_value=LAST_INSERT_ID(current_value+1)', [year]);
  const [rows] = await connection.query<RowDataPacket[]>('SELECT current_value FROM quote_sequences WHERE sequence_year=? FOR UPDATE', [year]);
  return `FQ-${year}-${String(rows[0].current_value).padStart(4, '0')}`;
}
export async function createQuote(db: Database, input: QuoteCreate) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [customers] = await connection.query<RowDataPacket[]>('SELECT * FROM customers WHERE id=? AND is_active=1', [input.customerId]);
    if (!customers[0]) throw new Error('customer_not_found');
    const ids = input.lines.map((line) => line.productId); const placeholders = ids.map(() => '?').join(',');
    const [products] = await connection.query<RowDataPacket[]>(`SELECT * FROM products WHERE id IN (${placeholders}) AND is_active=1`, ids);
    const productMap = new Map(products.map((product) => [product.id, product]));
    const lines = input.lines.map((line) => {
      const product = productMap.get(line.productId); if (!product) throw new Error('product_not_found');
      const conversion = { setsPerCarton: product.sets_per_carton, cartonsPerPallet: product.cartons_per_pallet };
      const quantity = convertQuantity(line.amount, line.unit, conversion); assertMoq(quantity, product.moq_amount, product.moq_unit, conversion);
      const price = line.unitPricePerSet ?? product[`price_${input.currency.toLowerCase()}`];
      if (price == null) throw new Error('product_price_missing');
      return { product: { id: product.id, code: product.code, name: product.name }, amount: line.amount, unit: line.unit, quantity, unitPricePerSet: Number(price), lineTotal: calculateLineTotal(quantity, Number(price)) };
    });
    const grossProductTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const totals = calculateTotals({ grossProductTotal, customerDiscountPercent: Number(customers[0].default_discount_percent), extraDiscountPercent: input.extraDiscountPercent, freight: input.freight, deliveryMethod: input.deliveryMethod });
    const id = randomUUID(); const revisionId = randomUUID(); const quoteNo = await nextQuoteNo(connection);
    const snapshot = { quoteNo, customer: { id: customers[0].id, code: customers[0].code, name: customers[0].name, discountPercent: Number(customers[0].default_discount_percent) }, ...input, lines };
    await connection.query('INSERT INTO quotes (id,quote_no,customer_id,currency,delivery_method,delivery_time,destination,current_revision) VALUES (?,?,?,?,?,?,?,1)', [id, quoteNo, input.customerId, input.currency, input.deliveryMethod, input.deliveryTime, input.destination ?? null]);
    await connection.query('INSERT INTO quote_revisions (id,quote_id,revision_no,snapshot,totals_snapshot) VALUES (?,?,1,?,?)', [revisionId, id, JSON.stringify(snapshot), JSON.stringify(totals)]);
    await connection.commit(); return { id, quoteNo, revisionNo: 1, snapshot, totals };
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}
