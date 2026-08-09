import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../auth';
import type { Database } from '../db';
import { archiveProduct, createProduct, getProduct, listProducts, updateProduct } from './repository';
import { productCreateSchema, productListSchema, productUpdateSchema } from './schema';

export async function registerProductRoutes(app: FastifyInstance, db: Database) {
  app.get('/api/fuar/v1/products', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = productListSchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    const result = await listProducts(db, parsed.data); reply.header('x-total-count', String(result.total)); return result;
  });
  app.get('/api/fuar/v1/products/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const product = await getProduct(db, (request.params as { id: string }).id);
    return product ?? reply.code(404).send({ error: { message: 'not_found' } });
  });
  app.post('/api/fuar/v1/products', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = productCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
    try { return reply.code(201).send(await createProduct(db, parsed.data)); }
    catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'product_code_exists' } });
      throw error;
    }
  });
  app.patch('/api/fuar/v1/products/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = productUpdateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
    const product = await updateProduct(db, (request.params as { id: string }).id, parsed.data);
    return product ?? reply.code(404).send({ error: { message: 'not_found' } });
  });
  app.delete('/api/fuar/v1/products/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const archived = await archiveProduct(db, (request.params as { id: string }).id);
    return archived ? reply.code(204).send() : reply.code(404).send({ error: { message: 'not_found' } });
  });
}
