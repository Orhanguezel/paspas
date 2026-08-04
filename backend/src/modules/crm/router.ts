import type { FastifyInstance } from 'fastify';
import { makeAdminPermissionGuard } from '@/common/middleware/permissions';
import { dealCreate, dealDelete, dealGet, dealMove, deals, dealUpdate, pipelines, talepConvert } from './controller';

export async function registerCrm(app: FastifyInstance) {
  const read = makeAdminPermissionGuard('admin.crm_firsatlar');
  app.get('/crm/pipelines', { preHandler: read }, pipelines);
  app.get('/crm/firsatlar', { preHandler: read }, deals);
  app.post('/crm/firsatlar', { preHandler: read }, dealCreate);
  app.get('/crm/firsatlar/:id', { preHandler: read }, dealGet);
  app.patch('/crm/firsatlar/:id', { preHandler: read }, dealUpdate);
  app.delete('/crm/firsatlar/:id', { preHandler: read }, dealDelete);
  app.patch('/crm/firsatlar/:id/asama', { preHandler: read }, dealMove);
  app.post('/crm/talepler/:id/firsata-donustur', { preHandler: read }, talepConvert);
}
