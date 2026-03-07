// src/types/fastify-fixes.d.ts
import 'fastify';

declare module 'fastify' {
  interface FastifyContextConfig {
    public?: boolean;
    auth?: boolean;
    rateLimit?: {
      max: number;
      timeWindow: string;
    };
  }

  // Bazı TS kombinasyonlarında bu alanlar tipten "kaybolabiliyor".
  interface FastifyRequest {
    headers: Record<string, string | string[] | undefined>;
    protocol?: string;
    cookies: Record<string, string | undefined>;
  }

  interface FastifyReply {
    status(code: number): this;
    code(code: number): this;
    send(payload?: any): this;
    header(name: string, value: any): this;
    setCookie(name: string, value: string, options?: any): this;
    clearCookie(name: string, options?: any): this;
     // Overload'ları ekle:
    redirect(url: string): this;
    redirect(url: string, statusCode: number): this;
    redirect(statusCode: number, url: string): this;
  }
}
