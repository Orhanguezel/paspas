import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { RowDataPacket } from 'mysql2';
import { z } from 'zod';

import { requireAuth } from '@/common/middleware/auth';
import { pool } from '@/db/client';

const keys = z.array(z.string().regex(/^[a-z0-9_]{1,80}$/)).max(100);
const schema = z.object({
  favorites: keys,
  hidden: keys,
  groupOrder: keys,
  itemOrder: z.record(keys),
}).strict();

function userId(req: FastifyRequest): string {
  const user = req.user as { sub?: string; id?: string } | undefined;
  return user?.sub ?? user?.id ?? '';
}

export async function registerMenuPreferencesAdmin(app: FastifyInstance) {
  app.get('/menu-preference', { preHandler: [requireAuth] }, async (req, reply) => {
    const id = userId(req);
    if (!id) return reply.code(401).send({ error: { message: 'unauthorized' } });
    const [rows] = await pool.query<(RowDataPacket & { value: string })[]>(
      'SELECT CAST(`value` AS CHAR) AS value FROM admin_menu_preferences WHERE user_id=?', [id],
    );
    const parsed = schema.safeParse(rows[0]?.value ? JSON.parse(rows[0].value) : null);
    return { value: parsed.success ? parsed.data : null };
  });

  app.put('/menu-preference', { preHandler: [requireAuth] }, async (req, reply) => {
    const id = userId(req);
    if (!id) return reply.code(401).send({ error: { message: 'unauthorized' } });
    const parsed = schema.safeParse((req.body as { value?: unknown } | null)?.value);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_menu_preference' } });
    const json = JSON.stringify(parsed.data);
    if (Buffer.byteLength(json, 'utf8') > 16 * 1024) return reply.code(400).send({ error: { message: 'menu_preference_too_large' } });
    await pool.query(
      'INSERT INTO admin_menu_preferences (user_id, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)',
      [id, json],
    );
    return { value: parsed.data };
  });
}
