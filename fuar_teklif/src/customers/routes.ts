import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../auth';
import type { Database } from '../db';
import { archiveCustomer, createCustomer, listCustomers, updateCustomer } from './repository';
import { customerCreateSchema, customerListSchema, customerUpdateSchema } from './schema';

export async function registerCustomerRoutes(app: FastifyInstance, db: Database) {
  app.get('/api/fuar/v1/customers', { preHandler: requireAdmin }, async (request, reply) => { const parsed = customerListSchema.safeParse(request.query); if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_query' } }); const result = await listCustomers(db, parsed.data); reply.header('x-total-count', String(result.total)); return result; });
  app.post('/api/fuar/v1/customers', { preHandler: requireAdmin }, async (request, reply) => { const parsed = customerCreateSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } }); try { return reply.code(201).send(await createCustomer(db, parsed.data)); } catch (error) { if ((error as { code?: string }).code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'customer_code_exists' } }); throw error; } });
  app.patch('/api/fuar/v1/customers/:id', { preHandler: requireAdmin }, async (request, reply) => { const parsed = customerUpdateSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body' } }); const customer = await updateCustomer(db, (request.params as { id: string }).id, parsed.data); return customer ?? reply.code(404).send({ error: { message: 'not_found' } }); });
  app.delete('/api/fuar/v1/customers/:id', { preHandler: requireAdmin }, async (request, reply) => { const ok = await archiveCustomer(db, (request.params as { id: string }).id); return ok ? reply.code(204).send() : reply.code(404).send({ error: { message: 'not_found' } }); });
}
