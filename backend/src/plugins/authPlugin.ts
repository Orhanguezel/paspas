import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

const authPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (req, reply) => {
    // CORS preflight
    if (req.method === "OPTIONS") return;

    // İsteğe bağlı bypass (örn. DISABLE_AUTH=1)
    if (process.env.DISABLE_AUTH === "1") return;

    // Sadece config.auth === true olan rotalarda koruma uygula
    const cfg = (req.routeOptions?.config as any) ?? {};
    const needsAuth = cfg.auth === true;
    if (!needsAuth) return;

    // Header veya cookie kabul et
    const hasAuthHeader = typeof req.headers.authorization === "string";
    const hasCookie = Boolean(req.cookies?.access_token);
    if (!hasAuthHeader && !hasCookie) {
      return reply.code(401).send({ error: { message: "no_token" } });
    }

    try {
      // fastify-jwt header veya cookie'den token’ı doğrular
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ error: { message: "invalid_token" } });
    }
  });
};

export default fp(authPlugin);
