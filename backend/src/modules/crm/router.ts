import type { FastifyInstance } from 'fastify';
import { makeAdminPermissionGuard } from '@/common/middleware/permissions';
import { dealCreate, dealDelete, dealGet, dealMove, deals, dealUpdate, pipelines, talepConvert, products, productCreate, productUpdate, productDelete, needUpdate, dealToOffer } from './controller';

export async function registerCrm(app: FastifyInstance) {
  const read = makeAdminPermissionGuard('admin.crm_firsatlar');
  app.get('/crm/pipelines', { preHandler: read }, pipelines);
  app.get('/crm/firsatlar', { preHandler: read }, deals);
  app.post('/crm/firsatlar', { preHandler: read }, dealCreate);
  app.get('/crm/firsatlar/:id', { preHandler: read }, dealGet);
  app.patch('/crm/firsatlar/:id', { preHandler: read }, dealUpdate);
  app.delete('/crm/firsatlar/:id', { preHandler: read }, dealDelete);
  app.patch('/crm/firsatlar/:id/asama', { preHandler: read }, dealMove);
  app.get('/crm/firsatlar/:id/urunler', { preHandler: read }, products);
  app.post('/crm/firsatlar/:id/urunler', { preHandler: read }, productCreate);
  app.patch('/crm/firsatlar/:id/urunler/:productId', { preHandler: read }, productUpdate);
  app.delete('/crm/firsatlar/:id/urunler/:productId', { preHandler: read }, productDelete);
  app.put('/crm/firsatlar/:id/ihtiyac', { preHandler: read }, needUpdate);
  app.post('/crm/firsatlar/:id/teklif-olustur', { preHandler: read }, dealToOffer);
  app.post('/crm/talepler/:id/firsata-donustur', { preHandler: read }, talepConvert);
}
