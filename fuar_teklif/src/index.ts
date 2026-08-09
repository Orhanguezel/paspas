import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { calculateLineTotal, calculateLogistics, calculateTotals, convertQuantity } from './domain/calculator';

const app = Fastify({ logger: true });
await app.register(cors, { origin: false });

app.get('/health', async () => ({ ok: true, service: 'paspas-fuar-teklif' }));

const previewSchema = z.object({
  amount: z.number().int().positive(),
  unit: z.enum(['set', 'carton', 'pallet']),
  conversion: z.object({ setsPerCarton: z.number().int().positive(), cartonsPerPallet: z.number().int().positive() }),
  unitPricePerSet: z.number().nonnegative(),
  loadingType: z.enum(['loose', 'palletized']),
  packageFacts: z.object({
    cartonWidthCm: z.number().positive(), cartonLengthCm: z.number().positive(), cartonHeightCm: z.number().positive(),
    palletWidthCm: z.number().positive(), palletLengthCm: z.number().positive(), palletHeightCm: z.number().positive(),
    netWeightPerSetKg: z.number().nonnegative(), grossWeightPerCartonKg: z.number().nonnegative(), palletTareKg: z.number().nonnegative(),
  }),
  customerDiscountPercent: z.number().min(0).max(100).default(0),
  extraDiscountPercent: z.number().min(0).max(100).default(0),
  freight: z.number().nonnegative().default(0),
  deliveryMethod: z.enum(['EXW', 'FOB', 'CIF']).default('EXW'),
});

app.post('/api/v1/calculations/preview', async (req, reply) => {
  const parsed = previewSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.flatten() });
  try {
    const quantity = convertQuantity(parsed.data.amount, parsed.data.unit, parsed.data.conversion);
    const lineTotal = calculateLineTotal(quantity, parsed.data.unitPricePerSet);
    return { quantity, logistics: calculateLogistics(quantity, parsed.data.loadingType, parsed.data.packageFacts), totals: calculateTotals({ ...parsed.data, grossProductTotal: lineTotal }) };
  } catch (error) {
    return reply.code(400).send({ error: error instanceof Error ? error.message : 'calculation_failed' });
  }
});

const port = Number(process.env.PORT || 8090);
const host = process.env.HOST || '127.0.0.1';
await app.listen({ port, host });
