import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const API = process.env.E2E_API_BASE ?? 'http://localhost:8078/api';
const marker = `E2E-TEKLIF-${Date.now()}`;

test.afterAll(() => {
  execFileSync('node', [resolve(__dirname, '../../backend/scripts/cleanup-teklif-e2e.mjs'), marker], {
    cwd: resolve(__dirname, '../../backend'), env: process.env, stdio: 'inherit',
  });
});

test('web talebi admin üzerinden siparişe kadar ilerler', async ({ page, request }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });

  const productsRes = await request.get(`${API}/web/promats/products?limit=1&lang=tr`);
  expect(productsRes.ok()).toBeTruthy();
  const productsBody = await productsRes.json();
  const product = (productsBody.data ?? productsBody)[0];
  expect(product?.id).toBeTruthy();

  const intakeRes = await request.post(`${API}/web/promats/teklif-talebi`, { data: {
    kaynakSayfa:'/tr/urunler/e2e', dil:'tr', ad:marker, firma:marker,
    email:`${marker.toLowerCase()}@example.invalid`, telefon:'05000000000', konu:'Teklif Talebi',
    mesaj:'Playwright uçtan uca teklif testi', seciliUrunler:[{ urunId:String(product.id), slug:product.slug, ad:product.name, miktar:2 }],
    kvkkOnay:true, website:'',
  } });
  expect(intakeRes.status()).toBe(201);

  await page.goto('/admin/teklif-talepleri');
  await expect(page).toHaveTitle(/Paspas|Promats|Admin/i);
  await page.getByPlaceholder(/Ad, firma veya e-posta ara/i).fill(marker);
  const leadRow = page.getByRole('row').filter({ hasText:marker });
  await expect(leadRow).toBeVisible();
  await leadRow.click();
  await expect(page.getByText('Playwright uçtan uca teklif testi')).toBeVisible();
  await page.getByRole('button', { name:/Müşteri \+ Taslak Teklife Dönüştür/i }).click();
  const conversionDialog = page.getByRole('dialog');
  await expect(conversionDialog.locator('input').first()).toHaveValue(marker);
  await conversionDialog.getByRole('button', { name:'Teklife Dönüştür' }).click();
  await expect(page).toHaveURL(/\/admin\/teklifler\/[0-9a-f-]+/);

  const offerId = page.url().split('/').pop()!;
  let offerRes = await request.get(`${API}/admin/teklifler/${offerId}`);
  let offer = await offerRes.json();
  expect(offer.kalemler).toHaveLength(1);
  const lineId = offer.kalemler[0].id;
  expect((await request.patch(`${API}/admin/teklifler/${offerId}/kalemler/${lineId}`, { data:{ birimFiyat:500 } })).ok()).toBeTruthy();
  await page.reload();
  await expect(page.getByText('Genel Toplam')).toBeVisible();
  await expect(page.getByText(product.name).first()).toBeVisible();

  const pdfRes = await request.get(`${API}/admin/teklifler/${offerId}/pdf`);
  expect(pdfRes.ok()).toBeTruthy();
  expect(pdfRes.headers()['content-type']).toContain('application/pdf');

  expect((await request.post(`${API}/admin/teklifler/${offerId}/gonder`, { data:{ kanal:'manuel' } })).ok()).toBeTruthy();
  offerRes = await request.get(`${API}/admin/teklifler/${offerId}`); offer = await offerRes.json();
  expect(offer.durum).toBe('gonderildi');
  expect(offer.goruntulemeToken).toBeTruthy();
  const publicRes = await request.get(`${API}/web/promats/teklif/${offer.goruntulemeToken}`);
  expect(publicRes.ok()).toBeTruthy();
  expect((await request.post(`${API}/admin/teklifler/${offerId}/durum`, { data:{ durum:'kabul' } })).ok()).toBeTruthy();

  await page.reload();
  await expect(page.getByRole('button', { name:/Siparişe Dönüştür/i })).toBeVisible();
  await page.getByRole('button', { name:/Siparişe Dönüştür/i }).click();
  await expect(page).toHaveURL(/\/admin\/satis-siparisleri\/[0-9a-f-]+/);
  await expect(page.getByText(marker).first()).toBeVisible();
  await page.screenshot({ path:'/tmp/teklif-e2e-siparis.png', fullPage:false });
  expect(consoleErrors).toEqual([]);
});
