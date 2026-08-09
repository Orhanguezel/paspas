import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../auth';
import type { Database } from '../db';
import { createQuote, listQuotes } from './repository';
import { quoteCreateSchema } from './schema';

export async function registerQuoteRoutes(app: FastifyInstance, db: Database) {
  app.get('/api/fuar/v1/quotes', { preHandler: requireAdmin }, async () => ({ items: await listQuotes(db) }));
  app.post('/api/fuar/v1/quotes', { preHandler: requireAdmin }, async (request, reply) => { const parsed = quoteCreateSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } }); try { return reply.code(201).send(await createQuote(db, parsed.data)); } catch (error) { const message = error instanceof Error ? error.message : 'quote_failed'; if (['customer_not_found','product_not_found','product_price_missing','moq_not_met','full_carton_required'].includes(message)) return reply.code(400).send({ error: { message } }); throw error; } });
}
