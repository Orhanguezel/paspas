import { randomUUID } from 'node:crypto';

import type { FastifyInstance, FastifyRequest } from 'fastify';

import { env } from '@/core/env';

const REQUEST_START_TIME = Symbol('requestStartTime');

function parseRequestId(req: FastifyRequest): string {
  const incoming = req.headers['x-request-id'];
  if (typeof incoming === 'string' && incoming.trim()) return incoming.trim();
  if (Array.isArray(incoming) && incoming[0]?.trim()) return incoming[0].trim();
  return randomUUID();
}

export function buildLoggerOptions() {
  const defaultLevel = env.NODE_ENV === 'production' ? 'info' : 'debug';

  return {
    level: process.env.LOG_LEVEL || defaultLevel,
    messageKey: 'message',
    base: {
      service: 'paspas-backend',
      env: env.NODE_ENV,
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-api-key"]',
        'req.headers["x-admin-token"]',
        'res.headers["set-cookie"]',
        'headers.authorization',
        'headers.cookie',
        '*.password',
        '*.token',
        '*.refreshToken',
      ],
      remove: true,
    },
  } as const;
}

export function buildRequestLoggerConfig() {
  return {
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: parseRequestId,
  } as const;
}

export function registerRequestLoggingHooks(app: FastifyInstance): void {
  app.addHook('onRequest', async (req, reply) => {
    (req as any)[REQUEST_START_TIME] = process.hrtime.bigint();
    reply.header('x-request-id', req.id);
  });

  app.addHook('onResponse', async (req, reply) => {
    const startTime = (req as any)[REQUEST_START_TIME] as bigint | undefined;
    const durationMs = startTime
      ? Number((process.hrtime.bigint() - startTime) / 1_000_000n)
      : undefined;

    const logPayload = {
      event: 'http_response',
      method: req.method,
      url: req.url,
      route: (req as any).routeOptions?.url ?? null,
      statusCode: reply.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    };

    if (reply.statusCode >= 500) {
      req.log.error(logPayload, 'request_completed');
      return;
    }
    if (reply.statusCode >= 400) {
      req.log.warn(logPayload, 'request_completed');
      return;
    }
    req.log.info(logPayload, 'request_completed');
  });
}
