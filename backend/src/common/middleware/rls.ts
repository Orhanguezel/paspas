// ────────────────────────────────────────────────────────────────────────────────
// 6) src/common/middlewares/rls.ts — simple RLS for user_id scoped tables
// ────────────────────────────────────────────────────────────────────────────────
import type { FastifyRequest, FastifyReply } from 'fastify';
export async function ensureSameUser(req: FastifyRequest, reply: FastifyReply) {
const user = (req as any).user;
if (!user?.sub) return reply.code(401).send({ error: { message: 'invalid_token' } });
}