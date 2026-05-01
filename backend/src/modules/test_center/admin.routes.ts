import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import {
  createAiTemplate,
  createTestCase,
  createTestRun,
  deleteAiTemplate,
  getAiTemplate,
  listAiTemplates,
  listRunAnalysisHistory,
  listTestCases,
  listTestRuns,
  runAllTests,
  triggerRunAnalysis,
  updateAiTemplate,
  updateTestCase,
} from './controller';

export async function registerTestCenterAdmin(app: FastifyInstance) {
  const guard = makeAdminPermissionGuard('admin.db_admin');
  const BASE = '/test-center';

  app.get(`${BASE}/cases`, { preHandler: guard }, listTestCases);
  app.post(`${BASE}/cases`, { preHandler: guard }, createTestCase);
  app.patch(`${BASE}/cases/:id`, { preHandler: guard }, updateTestCase);
  app.get(`${BASE}/runs`, { preHandler: guard }, listTestRuns);
  app.post(`${BASE}/runs`, { preHandler: guard }, createTestRun);
  app.post(`${BASE}/run-all`, { preHandler: guard }, runAllTests);

  // AI şablonları (CRUD)
  app.get(`${BASE}/ai-templates`, { preHandler: guard }, listAiTemplates);
  app.get(`${BASE}/ai-templates/:id`, { preHandler: guard }, getAiTemplate);
  app.post(`${BASE}/ai-templates`, { preHandler: guard }, createAiTemplate);
  app.patch(`${BASE}/ai-templates/:id`, { preHandler: guard }, updateAiTemplate);
  app.delete(`${BASE}/ai-templates/:id`, { preHandler: guard }, deleteAiTemplate);

  // Run AI analizi
  app.post(`${BASE}/runs/:runId/analyses`, { preHandler: guard }, triggerRunAnalysis);
  app.get(`${BASE}/runs/:runId/analyses`, { preHandler: guard }, listRunAnalysisHistory);
}
