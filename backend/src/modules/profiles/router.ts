import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import { getMyProfile, upsertMyProfile, type ProfileUpsertRequest } from './controller';

export async function registerProfiles(app: FastifyInstance) {
  // Backward-compatible alias
  app.get('/profiles/me', { preHandler: [requireAuth] }, getMyProfile);
  app.get('/profiles/v1/me', { preHandler: [requireAuth] }, getMyProfile);

  // Backward-compatible alias
  app.put<{ Body: ProfileUpsertRequest }>(
    '/profiles/me',
    { preHandler: [requireAuth] },
    upsertMyProfile,
  );

  app.put<{ Body: ProfileUpsertRequest }>(
    '/profiles/v1/me',
    { preHandler: [requireAuth] },
    upsertMyProfile,
  );
}
