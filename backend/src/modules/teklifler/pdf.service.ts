// =============================================================
// FILE: src/modules/teklifler/pdf.service.ts
// Teklif PDF — puppeteer-core ile sistem Chrome üzerinden render
// =============================================================

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import puppeteer from 'puppeteer-core';

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable';

/** Chrome bulunamaz/başlatılamazsa fırlatılır → controller 503 döner. */
export class PdfUnavailableError extends Error {}

/**
 * Logo URL'sini PDF'e gömülebilir data URI'ye çevirir.
 * - http(s)/data ise olduğu gibi döner.
 * - `/logo/..` gibi panel-göreli ise admin_panel/public'ten okur (backend ile kardeş dizin).
 * - Bulamazsa null → şablon metin wordmark'a düşer.
 */
export async function resolveLogoDataUri(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null;
  if (/^(https?:|data:)/i.test(logoUrl)) return logoUrl;
  if (!logoUrl.startsWith('/')) return null;
  const relativePath = logoUrl.replace(/^\/+/, '');
  const candidates = [
    path.join(process.cwd(), 'public', relativePath),
    path.join(process.cwd(), '..', 'admin', 'admin_panel', 'public', relativePath),
    path.join(process.cwd(), '..', 'admin_panel', 'public', relativePath),
  ];
  for (const file of candidates) {
    try {
      const buf = await readFile(file);
      const ext = path.extname(file).toLowerCase();
      const mime = ext === '.svg' ? 'image/svg+xml'
        : ext === '.png' ? 'image/png'
        : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
        : 'application/octet-stream';
      return `data:${mime};base64,${buf.toString('base64')}`;
    } catch {
      // Atomik release, kaynak repo ve yerel geliştirme dizilimlerini sırayla dene.
    }
  }
  return null;
}

export async function renderPdf(html: string): Promise<Buffer> {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>>;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
  } catch (err) {
    throw new PdfUnavailableError(err instanceof Error ? err.message : String(err));
  }
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
