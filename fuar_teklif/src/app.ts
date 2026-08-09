import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import Fastify from 'fastify';
import { z } from 'zod';
import { requireAdmin } from './auth';
import type { Database } from './db';
import { createDatabase } from './db';
import { calculateLineTotal, calculateLogistics, calculateTotals, convertQuantity } from './domain/calculator';
import { registerCustomerRoutes } from './customers/routes';
import { registerProductRoutes } from './products/routes';
import { registerQuoteRoutes } from './quotes/routes';

const previewSchema = z.object({
  amount: z.number().int().positive(), unit: z.enum(['set', 'carton', 'pallet']),
  conversion: z.object({ setsPerCarton: z.number().int().positive(), cartonsPerPallet: z.number().int().positive() }),
  unitPricePerSet: z.number().nonnegative(), loadingType: z.enum(['loose', 'palletized']),
  packageFacts: z.object({
    cartonWidthCm: z.number().positive(), cartonLengthCm: z.number().positive(), cartonHeightCm: z.number().positive(),
    palletWidthCm: z.number().positive(), palletLengthCm: z.number().positive(), palletHeightCm: z.number().positive(),
    netWeightPerSetKg: z.number().nonnegative(), grossWeightPerCartonKg: z.number().nonnegative(), palletTareKg: z.number().nonnegative(),
  }),
  customerDiscountPercent: z.number().min(0).max(100).default(0), extraDiscountPercent: z.number().min(0).max(100).default(0),
  freight: z.number().nonnegative().default(0), deliveryMethod: z.enum(['EXW', 'FOB', 'CIF']).default('EXW'),
});

export async function createApp(database?: Database) {
  const app = Fastify({ logger: true }); const db = database ?? createDatabase();
  await app.register(cors, { origin: false }); await app.register(cookie);
  await app.register(jwt, { secret: process.env.JWT_SECRET || 'development-only', cookie: { cookieName: 'access_token', signed: false } });
  app.addHook('onClose', async () => { if (!database) await db.end(); });
  app.get('/health', async () => ({ ok: true, service: 'paspas-fuar-teklif' }));
  await registerProductRoutes(app, db);
  await registerCustomerRoutes(app, db);
  await registerQuoteRoutes(app, db);
  app.post('/api/fuar/v1/calculations/preview', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = previewSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
    try {
      const quantity = convertQuantity(parsed.data.amount, parsed.data.unit, parsed.data.conversion);
      const lineTotal = calculateLineTotal(quantity, parsed.data.unitPricePerSet);
      return { quantity, logistics: calculateLogistics(quantity, parsed.data.loadingType, parsed.data.packageFacts), totals: calculateTotals({ ...parsed.data, grossProductTotal: lineTotal }) };
    } catch (error) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'calculation_failed' }); }
  });
  return app;
}
