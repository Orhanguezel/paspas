import type { FastifyInstance } from 'fastify';

import { requireAuth } from '@/common/middleware/auth';
import { requireAdmin } from '@/common/middleware/roles';
import { addWatcher, listActions, listReleases, listWatcherCandidates, listWatchers, removeWatcher, setAction, setRelease } from './desk';

import {
  addPageFeedbackComment,
  createPageFeedback,
  getPageFeedback,
  listPageFeedback,
  updatePageFeedback,
} from './controller';

export async function registerPageFeedbackAdmin(app: FastifyInstance) {
  const BASE = '/page-feedback';

  app.get(`${BASE}/watcher-candidates`, { preHandler: [requireAuth, requireAdmin] }, listWatcherCandidates);
  app.get(BASE, { preHandler: [requireAuth] }, listPageFeedback);
  app.post(BASE, { preHandler: [requireAuth] }, createPageFeedback);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, getPageFeedback);
  app.patch(`${BASE}/:id`, { preHandler: [requireAuth] }, updatePageFeedback);
  app.post(`${BASE}/:id/comments`, { preHandler: [requireAuth] }, addPageFeedbackComment);
  app.get(`${BASE}/:id/actions`, { preHandler: [requireAuth] }, listActions);
  app.post(`${BASE}/:id/actions`, { preHandler: [requireAuth, requireAdmin] }, setAction);
  app.get(`${BASE}/:id/releases`, { preHandler: [requireAuth] }, listReleases);
  app.post(`${BASE}/:id/releases`, { preHandler: [requireAuth, requireAdmin] }, setRelease);
  app.get(`${BASE}/:id/watchers`, { preHandler: [requireAuth] }, listWatchers);
  app.post(`${BASE}/:id/watchers`, { preHandler: [requireAuth, requireAdmin] }, addWatcher);
  app.delete(`${BASE}/:id/watchers/:userId`, { preHandler: [requireAuth, requireAdmin] }, removeWatcher);
}
