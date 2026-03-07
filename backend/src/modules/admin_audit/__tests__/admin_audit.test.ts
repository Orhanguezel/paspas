import { describe, expect, it } from 'bun:test';

import { listAdminAuditLogs } from '../controller';
import { listAuditQuerySchema } from '../validation';

type FakeReply = {
  statusCode?: number;
  payload?: unknown;
  code: (statusCode: number) => FakeReply;
  send: (payload: unknown) => unknown;
};

function createFakeReply(): FakeReply {
  return {
    code(statusCode: number) {
      this.statusCode = statusCode;
      return this;
    },
    send(payload: unknown) {
      this.payload = payload;
      return payload;
    },
  };
}

describe('admin_audit validation', () => {
  it('applies default pagination', () => {
    const parsed = listAuditQuerySchema.parse({});
    expect(parsed.limit).toBe(100);
    expect(parsed.offset).toBe(0);
    expect(parsed.order).toBe('desc');
  });

  it('rejects invalid query values', () => {
    expect(listAuditQuerySchema.safeParse({ actorUserId: '' }).success).toBe(false);
    expect(listAuditQuerySchema.safeParse({ method: 'GET' }).success).toBe(false);
    expect(listAuditQuerySchema.safeParse({ moduleKey: 'foo' }).success).toBe(false);
    expect(listAuditQuerySchema.safeParse({ statusCode: 99 }).success).toBe(false);
    expect(listAuditQuerySchema.safeParse({ dateFrom: '04-03-2026' }).success).toBe(false);
  });
});

describe('admin_audit controller', () => {
  it('returns 400 on invalid list query', async () => {
    const req = {
      query: { actorUserId: '' },
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await listAdminAuditLogs(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: 'gecersiz_sorgu_parametreleri' },
    });
  });
});
