// =============================================================
// FILE: src/modules/teklifler/teklif-pdf.ts
// Teklif PDF derleme — indir/e-posta/public görüntüleme için ortak
// =============================================================

import { repoGetById as repoGetMusteriById } from '@/modules/musteriler/repository';
import { getErpBrandingLogoUrl, getErpCompanyProfile } from '@/modules/siteSettings/service';

import { renderPdf, resolveLogoDataUri } from './pdf.service';
import { renderTeklifHtml } from './pdfTemplate';
import { repoGetTeklif } from './repository';

export async function buildTeklifPdf(id: string): Promise<{ pdf: Buffer; teklifNo: string } | null> {
  const teklif = await repoGetTeklif(id);
  if (!teklif) return null;

  const [company, logoUrl, musteriRow] = await Promise.all([
    getErpCompanyProfile(), getErpBrandingLogoUrl(), repoGetMusteriById(teklif.musteriId),
  ]);
  const logoDataUri = await resolveLogoDataUri(logoUrl);
  const html = renderTeklifHtml({
    teklif,
    musteri: musteriRow
      ? { ad: musteriRow.ad, adres: musteriRow.adres ?? null, telefon: musteriRow.telefon ?? null, email: musteriRow.email ?? null }
      : null,
    firma: company,
    logoDataUri,
  });
  const pdf = await renderPdf(html);
  return { pdf, teklifNo: teklif.teklifNo };
}
