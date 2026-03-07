import "fastify";
import "@fastify/jwt";
import type { JwtUser } from "@/common/middleware/auth";

declare module "fastify" {
  interface FastifyRequest {
    user: JwtUser;
  }
}
