/**
 * E2E: Reçete görsel büyütme (lightbox) akışı
 *
 * Senaryo:
 *   1. Ürünler sayfasına git
 *   2. Görseli olan ilk ürünün satırındaki thumbnail'a tıkla
 *   3. Lightbox dialog'unun açıldığını doğrula
 *   4. Lightbox'ı kapat — sayfa hala üründe
 *
 * Smoke test mantığında: tıkla-açıl-kapan akışı çalışıyor mu?
 */
import { test, expect } from '@playwright/test';

test.describe('reçete görsel lightbox', () => {
  test('ürünler listesinde thumbnail tıklayınca lightbox açılır', async ({ page }) => {
    await page.goto('/admin/urunler');

    // Tablo yüklenince ilk image thumbnail'i bul (h-10 w-10 ölçülü, object-cover sınıflı)
    const thumb = page.locator('img.h-10.w-10').first();
    await expect(thumb).toBeVisible({ timeout: 10_000 });

    await thumb.click();

    // Lightbox: custom fixed-overlay div. İçinde alt="Büyük görsel" img var.
    const bigImage = page.getByAltText('Büyük görsel');
    await expect(bigImage).toBeVisible();

    // Görsel <img> max-h-[90vh] sınıflı — büyütme aktif
    await expect(bigImage).toHaveClass(/max-h-\[90vh\]/);

    // Overlay'a tıklayarak kapat (lightbox div'in arka planına)
    const overlay = bigImage.locator('xpath=ancestor::div[contains(@class, "fixed")]');
    await overlay.click({ position: { x: 5, y: 5 } });
    await expect(bigImage).toBeHidden();
  });

  test('PDF olmayan görsellerin src değeri /uploads veya https ile başlar', async ({ page }) => {
    await page.goto('/admin/urunler');
    const thumbs = page.locator('img.h-10.w-10');
    const first = thumbs.first();
    await expect(first).toBeVisible({ timeout: 10_000 });
    const src = await first.getAttribute('src');
    expect(src, 'thumbnail src boş olmamalı').toBeTruthy();
    expect(src!).toMatch(/^(https?:\/\/|http:\/\/localhost:8078\/uploads\/|\/uploads\/)/);
  });
});
