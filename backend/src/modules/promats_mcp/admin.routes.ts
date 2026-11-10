import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '@/common/middleware/auth';
import { pool } from '@/db/client';
import type { RowDataPacket } from 'mysql2';
import { KAPSAMLAR, SURELER, jetonIptal, jetonListele, jetonOlustur } from './jeton';
import { oauthAyar, registerPromatsOAuthOnay } from './oauth';

function userId(req: FastifyRequest): string {
  const user = req.user as { sub?: string } | undefined;
  if (!user?.sub) throw Object.assign(new Error('unauthorized'), { statusCode: 401 });
  return user.sub;
}
const bodySchema = z.object({
  ad: z.string().trim().min(3).max(80),
  kapsamlar: z.array(z.enum(['okuma', 'not'])).min(1).max(2).refine((v) => new Set(v).size === v.length),
  gun: z.number().int().refine((v) => (SURELER as readonly number[]).includes(v)),
}).strict();
const protectedRoute = { preHandler: [requireAuth, requireAdmin] };
function samePanelOrigin(req: FastifyRequest) {
  const origin = req.headers.origin;
  if (origin && !['https://panel.avrasyaotomotiv.net', 'https://panel.promats.com.tr'].includes(origin))
    throw Object.assign(new Error('origin_reddedildi'), { statusCode: 403 });
}

export async function registerPromatsMcpAdmin(app: FastifyInstance) {
  app.get('/promats-mcp/jetonlar', protectedRoute, async (req) => {
    const query = z.object({ hepsi: z.enum(['0', '1']).optional(), iptalDahil: z.enum(['0', '1']).optional() }).parse(req.query);
    return { items: await jetonListele(userId(req), query.hepsi === '1', query.iptalDahil === '1'),
      kapsamSecenekleri: KAPSAMLAR, mcpUrl: process.env.PROMATS_MCP_URL || 'https://panel.avrasyaotomotiv.net/api/mcp',
      oauth: oauthAyar() ? { url: oauthAyar()!.resource, clientId: oauthAyar()!.clientId } : null, yonetici: true };
  });
  app.post('/promats-mcp/jetonlar', protectedRoute, async (req, reply) => {
    samePanelOrigin(req);
    const body = bodySchema.parse(req.body);
    const result = await jetonOlustur(userId(req), body.ad, body.kapsamlar, body.gun);
    return reply.code(201).header('Cache-Control', 'no-store').send({ ...result,
      komut: `claude mcp add --transport http --scope user promats ${process.env.PROMATS_MCP_URL || 'https://panel.avrasyaotomotiv.net/api/mcp'} --header "Authorization: Bearer ${result.jeton}"` });
  });
  app.delete<{ Params: { id: string } }>('/promats-mcp/jetonlar/:id', protectedRoute, async (req, reply) => {
    samePanelOrigin(req);
    if (!z.string().uuid().safeParse(req.params.id).success) return reply.code(400).send({ error: 'gecersiz_id' });
    if (!(await jetonIptal(req.params.id, userId(req), true))) return reply.code(404).send({ error: 'jeton_bulunamadi' });
    return { ok: true };
  });
  app.get('/promats-mcp/gecmis', protectedRoute, async (req) => {
    const query = z.object({ hepsi: z.enum(['0', '1']).optional() }).parse(req.query);
    const [rows] = await pool.query<(RowDataPacket & { id: string; islem: string; created_at: Date; kullanildi_at: Date | null; son_kullanma: Date; user_id: string })[]>(
      `SELECT id,islem,created_at,kullanildi_at,son_kullanma,user_id FROM promats_mcp_onay
       ${query.hepsi === '1' ? '' : 'WHERE user_id=?'} ORDER BY created_at DESC LIMIT 100`, query.hepsi === '1' ? [] : [userId(req)]);
    return { items: rows.map((row) => ({ id: row.id, islem: row.islem, createdAt: row.created_at,
      kullanildiAt: row.kullanildi_at, sonKullanma: row.son_kullanma, userId: row.user_id })) };
  });
  await app.register(async (secured) => {
    secured.addHook('preHandler', requireAuth);
    secured.addHook('preHandler', requireAdmin);
    await registerPromatsOAuthOnay(secured, { userId });
  });
}
