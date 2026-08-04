import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const API = process.env.E2E_API_BASE ?? 'http://localhost:8078/api';
const WEB = process.env.PROMATS_WEB_BASE ?? 'https://promats.com.tr';
const marker = `E2E-TEKLIF-${Date.now()}`;

test.afterAll(() => {
  execFileSync('node', [resolve(__dirname, '../../backend/scripts/cleanup-teklif-e2e.mjs'), marker], {
    cwd: resolve(__dirname, '../../backend'), env: process.env, stdio: 'inherit',
  });
});

test('genel iletişim eski contact endpointini kullanmaya devam eder', async ({ page, request }) => {
  const legacyRoute = await request.post(`${API}/web/promats/contact`, { data: {} });
  expect(legacyRoute.status()).toBe(400);

  let submittedUrl = '';
  await page.route('**/api/web/promats/contact', async (route) => {
    submittedUrl = route.request().url();
    await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.goto(`${WEB}/tr/iletisim`);
  await page.locator('#promats-contact-name').fill(`${marker}-CONTACT`);
  await page.locator('#promats-contact-subject').selectOption({ label: 'Ürün Bilgisi' });
  await page.locator('#promats-contact-phone').fill('05000000000');
  await page.locator('#promats-contact-kvkk').check();
  await page.locator('form').filter({ has: page.locator('#promats-contact-name') }).getByRole('button', { name: /gönder/i }).click();
  await expect(page.getByRole('status')).toBeVisible();
  expect(new URL(submittedUrl).pathname).toBe('/api/web/promats/contact');
});

test('teklif konusu yeni kayıt endpointine gider', async ({ page }) => {
  await page.goto(`${WEB}/tr/iletisim`);
  await page.locator('#promats-contact-name').fill(marker);
  await page.locator('#promats-contact-subject').selectOption({ label: 'Teklif Talebi' });
  await page.locator('#promats-contact-phone').fill('05000000000');
  await page.locator('#promats-contact-message').fill('Geriye uyumluluk canlı testi');
  await page.locator('#promats-contact-kvkk').check();
  const responsePromise = page.waitForResponse((response) => response.url().endsWith('/api/web/promats/teklif-talebi') && response.request().method() === 'POST');
  await page.locator('form').filter({ has: page.locator('#promats-contact-name') }).getByRole('button', { name: /gönder/i }).click();
  expect((await responsePromise).status()).toBe(201);
  await expect(page.getByRole('status')).toContainText(/Referans:/i);
});

test('OEM formu yeni teklif endpointini kullanır', async ({ page }) => {
  await page.goto(`${WEB}/en/oem-manufacturing`);
  await page.locator('#oem-company').fill(marker);
  await page.locator('#oem-country').fill('Germany');
  await page.locator('#oem-email').fill(`${marker.toLowerCase()}@example.invalid`);
  await page.locator('#oem-phone').fill('05000000000');
  await page.locator('#oem-message').fill('OEM endpoint routing test');
  await page.locator('#oem-kvkk').check();
  const responsePromise = page.waitForResponse((response) => response.url().endsWith('/api/web/promats/teklif-talebi') && response.request().method() === 'POST');
  await page.locator('form').filter({ has: page.locator('#oem-company') }).getByRole('button', { name: /submit|send|request/i }).click();
  expect((await responsePromise).status()).toBe(201);
  await expect(page.locator('.oem-inquiry-form .alert-success')).toBeVisible();
});
