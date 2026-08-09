import type { FastifyReply, FastifyRequest } from 'fastify';

type JwtUser = { role?: string; roles?: string[]; is_admin?: boolean };

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify<JwtUser>();
    const user = request.user as JwtUser;
    const isAdmin = user.is_admin === true || user.role === 'admin' || user.roles?.includes('admin') === true;
    if (!isAdmin) return reply.code(403).send({ error: { message: 'forbidden' } });
  } catch {
    return reply.code(401).send({ error: { message: 'invalid_token' } });
  }
}
