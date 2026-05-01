import type { FastifyInstance } from 'fastify';

import { requireAuth } from '@/common/middleware/auth';

import {
  addPageFeedbackComment,
  createPageFeedback,
  getPageFeedback,
  listPageFeedback,
  updatePageFeedback,
} from './controller';

export async function registerPageFeedbackAdmin(app: FastifyInstance) {
  const BASE = '/page-feedback';

  app.get(BASE, { preHandler: [requireAuth] }, listPageFeedback);
  app.post(BASE, { preHandler: [requireAuth] }, createPageFeedback);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, getPageFeedback);
  app.patch(`${BASE}/:id`, { preHandler: [requireAuth] }, updatePageFeedback);
  app.post(`${BASE}/:id/comments`, { preHandler: [requireAuth] }, addPageFeedbackComment);
}
