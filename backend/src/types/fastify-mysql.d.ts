// src/types/fastify-mysql.d.ts
import "fastify";

type MySQL = {
  query<T = unknown[]>(
    sql: string,
    params?: unknown[]
  ): Promise<[T, unknown]>;
};

declare module "fastify" {
  interface FastifyInstance {
    // ✅ opsiyonel değil
    mysql: MySQL;
    // ✅ mysql alias'ı olarak plugin'de decorate ediyoruz
    db: MySQL;
    // Projede mariadb kullanılmıyorsa bunu opsiyonel bırakabilirsin
    mariadb?: MySQL;
  }
  interface FastifyRequest {
    mysql: MySQL;
  }
}
