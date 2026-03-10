import { describe, expect, it } from 'bun:test';

import { updateSchema } from '../validation';

describe('giris ayarlari validation', () => {
  it('accepts valid payload', () => {
    const result = updateSchema.safeParse({
      showQuickLogin: true,
      allowPasswordLogin: true,
      roleCardsEnabled: true,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumber: true,
        requireSpecialChar: false,
      },
      redirects: {
        admin: '/admin/dashboard',
        sevkiyatci: '/admin/sevkiyat',
        operator: '/admin/operator',
        satin_almaci: '/admin/satin-alma',
      },
      enabledRoles: ['admin', 'sevkiyatci', 'operator', 'satin_almaci'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid redirect path', () => {
    const result = updateSchema.safeParse({
      showQuickLogin: true,
      allowPasswordLogin: true,
      roleCardsEnabled: true,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumber: true,
        requireSpecialChar: false,
      },
      redirects: {
        admin: 'admin/dashboard',
        sevkiyatci: '/admin/sevkiyat',
        operator: '/admin/operator',
        satin_almaci: '/admin/satin-alma',
      },
      enabledRoles: ['admin'],
    });
    expect(result.success).toBe(false);
  });
});
