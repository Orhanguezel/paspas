/**
 * Auth setup — admin user ile login olup storage state kaydeder.
 * Tüm e2e testleri bu state'i miras alır.
 *
 * Çalışmadan önce backend (port 8078) ve admin panel (port 3000) dev server'ları
 * çalışıyor olmalı. Admin kimliği `backend/.env` üzerinden okunur:
 *   ADMIN_EMAIL, ADMIN_PASSWORD
 *
 * Test yazıldığı tarihte authentication akışı:
 *   POST /api/auth/token { email, password } → access_token cookie set
 */
import { test as setup, expect } from '@playwright/test';

const STORAGE_PATH = './e2e/.auth/admin.json';

setup('admin login', async ({ page, context, request }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? 'admin@admin.com';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? 'admin';

  // 1. Direkt API ile login (login sayfasının form alanlarına bağımlı kalmaz)
  const apiBase = process.env.E2E_API_BASE ?? 'http://localhost:8078/api';
  const loginRes = await request.post(`${apiBase}/auth/token`, {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(loginRes.ok(), `login_failed status=${loginRes.status()}`).toBe(true);

  // Set-Cookie üzerinden gelen access_token / refresh_token'i context'e taşı.
  const setCookieHeader = loginRes.headers()['set-cookie'] ?? '';
  const cookies = setCookieHeader
    .split(/,(?=\s*\w+=)/)
    .map((raw) => raw.trim())
    .map((raw) => {
      const [pair, ...rest] = raw.split(';');
      const [name, value] = pair.split('=');
      const opts: Record<string, string> = {};
      for (const part of rest) {
        const [k, v] = part.trim().split('=');
        opts[k.toLowerCase()] = v ?? '';
      }
      return {
        name: name.trim(),
        value: value ?? '',
        domain: opts.domain ?? 'localhost',
        path: opts.path ?? '/',
        httpOnly: 'httponly' in opts,
        secure: 'secure' in opts,
        sameSite: 'Lax' as const,
      };
    })
    .filter((c) => c.name);

  if (cookies.length === 0) {
    // Fallback: response body'sinde access_token varsa manuel cookie ekle
    const body = (await loginRes.json().catch(() => null)) as { access_token?: string } | null;
    if (body?.access_token) {
      cookies.push({
        name: 'access_token',
        value: body.access_token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      });
    }
  }

  await context.addCookies(cookies);

  // 2. Cookie'lerin admin paneli açabildiğini doğrula
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/admin\/dashboard/);

  // 3. Storage state'i kaydet
  await context.storageState({ path: STORAGE_PATH });
});
