import { randomUUID } from 'node:crypto';

import type { FastifyInstance, FastifyRequest } from 'fastify';

import { insertAdminAuditLog } from '@/modules/admin_audit/repository';

const AUDIT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REDACTED_KEYS = new Set([
  'password',
  'pass',
  'token',
  'refresh_token',
  'authorization',
  'cookie',
  'secret',
  'api_key',
]);

type JwtLikeUser = {
  sub?: string;
  id?: string;
  email?: string;
  role?: string;
  roles?: string[];
};

function shouldAudit(req: FastifyRequest): boolean {
  if (!AUDIT_METHODS.has(req.method.toUpperCase())) return false;
  return req.url.startsWith('/api/admin');
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (depth > 4) return '[truncated_depth]';
  if (typeof value === 'string') {
    if (value.length > 1000) return `${value.slice(0, 1000)}...[truncated]`;
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 100).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [rawKey, rawVal] of Object.entries(value as Record<string, unknown>)) {
      const key = rawKey.toLowerCase();
      if (REDACTED_KEYS.has(key)) {
        out[rawKey] = '[redacted]';
        continue;
      }
      out[rawKey] = sanitizeValue(rawVal, depth + 1);
    }
    return out;
  }
  return String(value);
}

function pickResourceFromUrl(url: string): { resource: string | null; resourceId: string | null } {
  const pathWithoutQuery = url.split('?')[0] ?? '';
  const segments = pathWithoutQuery.split('/').filter(Boolean);
  const adminIdx = segments.indexOf('admin');
  if (adminIdx === -1) return { resource: null, resourceId: null };

  const resource = segments[adminIdx + 1] ?? null;
  const maybeId = segments[adminIdx + 2] ?? null;
  const resourceId = maybeId && UUID_RE.test(maybeId) ? maybeId : null;

  return { resource, resourceId };
}

function extractActor(req: FastifyRequest): { userId: string | null; email: string | null; role: string | null } {
  const user = ((req as unknown as { user?: JwtLikeUser }).user ?? {}) as JwtLikeUser;
  const roleFromArray = Array.isArray(user.roles) ? user.roles[0] : null;
  return {
    userId: user.sub ?? user.id ?? null,
    email: user.email ?? null,
    role: user.role ?? roleFromArray ?? null,
  };
}

export function registerAdminAuditHook(app: FastifyInstance): void {
  app.addHook('onResponse', async (req, reply) => {
    if (!shouldAudit(req)) return;
    if (process.env.ADMIN_AUDIT_ENABLED === '0') return;

    try {
      const actor = extractActor(req);
      const { resource, resourceId } = pickResourceFromUrl(req.url);
      const routePattern = (req as any).routeOptions?.url ?? null;
      const routeForAction = routePattern || req.url.split('?')[0] || 'unknown';

      await insertAdminAuditLog({
        id: randomUUID(),
        actor_user_id: actor.userId,
        actor_email: actor.email,
        actor_role: actor.role,
        action: `${req.method.toUpperCase()} ${routeForAction}`,
        resource,
        resource_id: resourceId,
        method: req.method.toUpperCase(),
        path: req.url.split('?')[0] ?? req.url,
        route: routePattern,
        status_code: reply.statusCode,
        request_id: req.id ?? null,
        ip: req.ip ?? null,
        user_agent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
        payload: sanitizeValue({
          params: req.params ?? null,
          query: req.query ?? null,
          body: req.body ?? null,
        }),
      });
    } catch (error) {
      req.log.warn({ error }, 'admin_audit_log_failed');
    }
  });
}
