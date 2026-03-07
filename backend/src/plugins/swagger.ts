import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import type { FastifyInstance } from 'fastify';

import { env } from '@/core/env';

function normalizePublicUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  const publicUrl = normalizePublicUrl(env.PUBLIC_URL || `http://localhost:${env.PORT}`);

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Paspas ERP API',
        description: 'Paspas Uretim ERP backend API dokumantasyonu',
        version: '1.0.0',
      },
      servers: [
        { url: `${publicUrl}/api`, description: 'API Base URL' },
      ],
      tags: [
        { name: 'system', description: 'Sistem endpointleri' },
        { name: 'admin', description: 'ERP admin endpointleri' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
    transformSpecificationClone: true,
  });

  app.get('/api/docs/openapi.json', { schema: { tags: ['system'] } }, async () => app.swagger());
}
