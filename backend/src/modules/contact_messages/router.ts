import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '@/common/middleware/auth';

const publicSchema = z.object({
  ad: z.string().trim().min(1).max(160),
  eposta: z.string().trim().email().max(191).optional().or(z.literal('')),
  telefon: z.string().trim().min(1).max(64),
  konu: z.string().trim().max(191).optional(),
  mesaj: z.string().trim().max(10000).optional(),
  website: z.string().max(255).optional(),
  locale: z.string().max(8).optional(),
  sourcePage: z.string().max(512).optional(),
  kvkkOnay: z.literal(true),
});

const patchSchema = z.object({
  status: z.enum(['new', 'in_progress', 'closed']).optional(),
  is_resolved: z.boolean().optional(),
  admin_note: z.string().max(10000).nullable().optional(),
  assigned_to_user_id: z.string().uuid().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0);

function view(row: Record<string, unknown>) {
  return { ...row, email: row.email ?? '', subject: row.subject ?? '', message: row.message ?? '', is_resolved: Boolean(row.is_resolved) };
}

export async function registerContactMessagesPublic(app: FastifyInstance) {
  app.post('/contact', async (req, reply) => {
    const parsed = publicSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    if (parsed.data.website) return reply.code(202).send({ ok: true });
    const ip = req.ip;
    const [[rate]] = await app.mysql.query<any[]>(
      'SELECT COUNT(*) total FROM contact_messages WHERE ip=? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)', [ip],
    );
    if (Number(rate?.total ?? 0) >= 5) return reply.code(429).send({ error: { message: 'cok_fazla_istek' } });
    const key = String(req.headers['x-idempotency-key'] ?? '').trim().slice(0, 80) || null;
    if (key) {
      const [[existing]] = await app.mysql.query<any[]>('SELECT * FROM contact_messages WHERE idempotency_key=? LIMIT 1', [key]);
      if (existing) return reply.code(200).send(view(existing));
    }
    const id = randomUUID();
    const reference = `MSG-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${id.slice(0, 6).toUpperCase()}`;
    await app.mysql.query(
      `INSERT INTO contact_messages
       (id,reference_no,idempotency_key,name,email,phone,subject,message,ip,user_agent,website,locale,source_page,kvkk_accepted_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [id, reference, key, parsed.data.ad, parsed.data.eposta || null, parsed.data.telefon,
        parsed.data.konu || null, parsed.data.mesaj || null, ip, String(req.headers['user-agent'] ?? '').slice(0, 255),
        null, parsed.data.locale || null, parsed.data.sourcePage || null],
    );
    const [[created]] = await app.mysql.query<any[]>('SELECT * FROM contact_messages WHERE id=?', [id]);
    return reply.code(201).send(view(created));
  });
}

export async function registerContactMessagesAdmin(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireAdmin);
  app.get('/contacts', async (req) => {
    const q = req.query as { status?: string; search?: string; limit?: string; offset?: string };
    const where: string[] = []; const args: unknown[] = [];
    if (q.status) { where.push('status=?'); args.push(q.status); }
    if (q.search) { where.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR subject LIKE ? OR message LIKE ?)'); args.push(...Array(5).fill(`%${q.search}%`)); }
    const limit = Math.min(200, Math.max(1, Number(q.limit) || 100));
    const offset = Math.max(0, Number(q.offset) || 0);
    const [rows] = await app.mysql.query<any[]>(`SELECT * FROM contact_messages ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...args, limit, offset]);
    return rows.map(view);
  });
  app.get('/contacts/:id', async (req, reply) => {
    const [[row]] = await app.mysql.query<any[]>('SELECT * FROM contact_messages WHERE id=?', [(req.params as { id: string }).id]);
    return row ? view(row) : reply.code(404).send({ error: { message: 'kayit_bulunamadi' } });
  });
  app.patch('/contacts/:id', async (req, reply) => {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi' } });
    const fields: string[] = []; const args: unknown[] = [];
    for (const [key, value] of Object.entries(parsed.data)) { fields.push(`${key}=?`); args.push(key === 'is_resolved' ? Number(value) : value); }
    if (parsed.data.status === 'closed' && parsed.data.is_resolved === undefined) { fields.push('is_resolved=1'); }
    args.push((req.params as { id: string }).id);
    const [result] = await app.mysql.query<any>(`UPDATE contact_messages SET ${fields.join(',')} WHERE id=?`, args);
    if (!result.affectedRows) return reply.code(404).send({ error: { message: 'kayit_bulunamadi' } });
    const [[row]] = await app.mysql.query<any[]>('SELECT * FROM contact_messages WHERE id=?', [args.at(-1)]);
    return view(row);
  });
}
