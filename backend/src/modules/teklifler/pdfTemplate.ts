// =============================================================
// FILE: src/modules/teklifler/pdfTemplate.ts
// Teklif PDF — sunucu-taraflı HTML şablonu (panel yazdırma formuyla aynı tasarım)
// =============================================================

type Kalem = {
  urunKod: string | null; birim: string; aciklama: string;
  miktar: number; birimFiyat: number; iskontoOrani: number; satirToplam: number;
};

export type TeklifPdfInput = {
  teklif: {
    teklifNo: string; durum: string; paraBirimi: string;
    dil?: string; revizyonNo?: number;
    araToplam: number; iskontoOrani: number; iskontoTutari: number;
    kdvOrani: number; kdvDahil: boolean; kdvTutari: number; nakliye: number; genelToplam: number;
    gecerlilikTarihi: string | null; createdAt: unknown;
    odemeKosullari: string | null; teslimKosullari: string | null; aciklama: string | null;
    musteriAd: string | null;
    kalemler: Kalem[];
  };
  musteri: { ad: string | null; adres: string | null; telefon: string | null; email: string | null } | null;
  firma: {
    companyName: string | null; legalName: string | null; taxOffice: string | null; taxNumber: string | null;
    phone: string | null; email: string | null; website: string | null;
    address: string | null; district: string | null; city: string | null;
    iban: string | null; bankName: string | null;
  };
  logoDataUri: string | null;
};

function esc(v: string | null | undefined): string {
  return String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}
type PdfLanguage = 'tr' | 'en' | 'de';
const TEXT = {
  tr: { locale:'tr-TR', offer:'TEKLİF', offerNo:'Teklif No', date:'Tarih', validity:'Geçerlilik', currency:'Para Birimi', dear:'Sayın', summary:'Teklif Özeti', lines:'Kalem sayısı', quantity:'Toplam adet', vat:'KDV', included:'Dahil', excluded:'Hariç', product:'Ürün / Açıklama', qty:'Miktar', unitPrice:'Birim Fiyat', discountShort:'İsk.', amount:'Tutar', empty:'Kalem bulunmuyor.', subtotal:'Ara Toplam', discount:'İskonto', freight:'Nakliye', vatBase:'KDV Matrahı', grandTotal:'Genel Toplam', paymentInfo:'Ödeme Bilgileri', bank:'Banka', accountTitle:'Hesap Ünvanı', terms:'Koşullar', payment:'Ödeme', delivery:'Teslim', revision:'Revizyon', validUntil:(date:string)=>`Bu teklif <b style="color:var(--ink)">${date}</b> tarihine kadar geçerlidir. Fiyatlar ve teslim süreleri bu tarihten sonra değişebilir.`, noValidity:'Bu teklifin geçerlilik süresi belirtilmemiştir.', snapshot:'Teklif kalemleri, hazırlandığı andaki ürün bilgileriyle sabitlenmiştir.', tag:'Otomotiv Paspas Üretim' },
  en: { locale:'en-GB', offer:'QUOTATION', offerNo:'Quotation No', date:'Date', validity:'Valid Until', currency:'Currency', dear:'Customer', summary:'Quotation Summary', lines:'Line items', quantity:'Total quantity', vat:'VAT', included:'Included', excluded:'Excluded', product:'Product / Description', qty:'Quantity', unitPrice:'Unit Price', discountShort:'Disc.', amount:'Amount', empty:'No line items.', subtotal:'Subtotal', discount:'Discount', freight:'Freight', vatBase:'VAT Base', grandTotal:'Grand Total', paymentInfo:'Payment Details', bank:'Bank', accountTitle:'Account Name', terms:'Terms', payment:'Payment', delivery:'Delivery', revision:'Revision', validUntil:(date:string)=>`This quotation is valid until <b style="color:var(--ink)">${date}</b>. Prices and delivery times may change after this date.`, noValidity:'No validity date has been specified for this quotation.', snapshot:'Line items are fixed using the product information available when this quotation was prepared.', tag:'Automotive Mat Manufacturing' },
  de: { locale:'de-DE', offer:'ANGEBOT', offerNo:'Angebotsnr.', date:'Datum', validity:'Gültig bis', currency:'Währung', dear:'Kunde', summary:'Angebotsübersicht', lines:'Positionen', quantity:'Gesamtmenge', vat:'MwSt.', included:'Inkl.', excluded:'Exkl.', product:'Produkt / Beschreibung', qty:'Menge', unitPrice:'Einzelpreis', discountShort:'Rabatt', amount:'Betrag', empty:'Keine Positionen.', subtotal:'Zwischensumme', discount:'Rabatt', freight:'Fracht', vatBase:'MwSt.-Basis', grandTotal:'Gesamtsumme', paymentInfo:'Zahlungsinformationen', bank:'Bank', accountTitle:'Kontoinhaber', terms:'Bedingungen', payment:'Zahlung', delivery:'Lieferung', revision:'Revision', validUntil:(date:string)=>`Dieses Angebot ist bis zum <b style="color:var(--ink)">${date}</b> gültig. Preise und Lieferzeiten können sich danach ändern.`, noValidity:'Für dieses Angebot wurde keine Gültigkeitsdauer angegeben.', snapshot:'Die Positionen basieren auf den Produktinformationen zum Zeitpunkt der Angebotserstellung.', tag:'Herstellung von Automatten' },
} as const;
function language(value: string | undefined): PdfLanguage { return value === 'en' || value === 'de' ? value : 'tr'; }
function money(n: number, cur: string, locale: string): string {
  try { return new Intl.NumberFormat(locale, { style: 'currency', currency: cur || 'TRY' }).format(n); }
  catch { return `${n.toLocaleString(locale)} ${cur}`; }
}
function qty(n: number, locale: string): string { return n.toLocaleString(locale, { maximumFractionDigits: 4 }); }
function formatDate(v: unknown, locale: string): string {
  if (!v) return '—';
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
  return d.toLocaleDateString(locale);
}

export function renderTeklifHtml(input: TeklifPdfInput): string {
  const { teklif: t, musteri, firma, logoDataUri } = input;
  const lang = language(t.dil);
  const text = TEXT[lang];
  const locale = text.locale;
  const cur = t.paraBirimi || 'TRY';
  const firmaAd = firma.companyName || firma.legalName || 'Firma';
  const firmaAdres = [firma.address, [firma.district, firma.city].filter(Boolean).join(' / ')].filter(Boolean).join(', ');
  const firmaIletisim = [firma.phone, firma.email, firma.website].filter(Boolean).join(' · ');
  const vknSatiri = [firma.taxOffice ? `${firma.taxOffice} V.D.` : null, firma.taxNumber ? `VKN ${firma.taxNumber}` : null].filter(Boolean).join(' · ');
  const musteriAd = t.musteriAd ?? musteri?.ad ?? '—';
  const kalemler = [...t.kalemler];
  const toplamAdet = kalemler.reduce((s, k) => s + (Number(k.miktar) || 0), 0);
  const matrah = t.araToplam - t.iskontoTutari + t.nakliye;

  const logoBlok = logoDataUri
    ? `<img class="logo" src="${logoDataUri}" alt="${esc(firmaAd)}" />`
    : `<div class="wordmark"><span class="mark"></span><div><div class="name">${esc(firmaAd)}</div><div class="tag">${text.tag}</div></div></div>`;

  const satirlar = kalemler.length === 0
    ? `<tr><td class="l" colspan="6" style="padding:24px 0;text-align:center;color:var(--muted)">${text.empty}</td></tr>`
    : kalemler.map((k, i) => `
      <tr>
        <td class="l idx">${i + 1}</td>
        <td class="l"><div class="desc">${esc(k.aciklama)}</div>${(k.urunKod || k.birim) ? `<div class="code">${esc([k.urunKod, k.birim].filter(Boolean).join(' · '))}</div>` : ''}</td>
        <td>${qty(k.miktar, locale)} <span class="unit">${esc(k.birim || 'ad.')}</span></td>
        <td>${money(k.birimFiyat, cur, locale)}</td>
        <td>${k.iskontoOrani > 0 ? `%${k.iskontoOrani}` : '—'}</td>
        <td class="amt">${money(k.satirToplam, cur, locale)}</td>
      </tr>`).join('');

  const iskontoRow = t.iskontoTutari > 0
    ? `<div class="r disc"><dt>${text.discount} (%${t.iskontoOrani})</dt><dd>−${money(t.iskontoTutari, cur, locale)}</dd></div>` : '';
  const nakliyeRow = t.nakliye > 0
    ? `<div class="r"><dt>${text.freight}</dt><dd>${money(t.nakliye, cur, locale)}</dd></div>` : '';
  const matrahRow = (t.iskontoTutari > 0 || t.nakliye > 0)
    ? `<div class="r"><dt>${text.vatBase}</dt><dd>${money(matrah, cur, locale)}</dd></div>` : '';

  const payBlok = (firma.iban || firma.bankName) ? `
    <div class="pay">
      <div class="eyebrow">${text.paymentInfo}</div>
      ${firma.bankName ? `<div class="row"><span class="lbl">${text.bank}</span><span class="val">${esc(firma.bankName)}</span></div>` : ''}
      ${firma.iban ? `<div class="row"><span class="lbl">IBAN</span><span class="val iban">${esc(firma.iban)}</span></div>` : ''}
      <div class="row"><span class="lbl">${text.accountTitle}</span><span class="val">${esc(firma.legalName || firmaAd)}</span></div>
    </div>` : '';

  const termsBlok = (t.odemeKosullari || t.teslimKosullari || t.aciklama) ? `
    <div class="terms">
      <div class="eyebrow">${text.terms}</div>
      ${t.odemeKosullari ? `<p><b>${text.payment}:</b> ${esc(t.odemeKosullari)}</p>` : ''}
      ${t.teslimKosullari ? `<p><b>${text.delivery}:</b> ${esc(t.teslimKosullari)}</p>` : ''}
      ${t.aciklama ? `<p>${esc(t.aciklama)}</p>` : ''}
    </div>` : '';

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8" />
<style>
  :root { --ink:#17191e; --muted:#626a75; --faint:#8b929c; --line:#dfe3e9; --line2:#b9c0c9;
    --accent:#0d4657; --accent-ink:#0a3543; --accent-soft:#eef4f6;
    --sans:"Helvetica Neue",Arial,"DejaVu Sans","Liberation Sans",sans-serif;
    --mono:"DejaVu Sans Mono","Liberation Mono",monospace; }
  * { box-sizing:border-box; }
  html,body { margin:0; padding:0; }
  body { background:#fff; color:var(--ink); font-family:var(--sans); font-size:12px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .sheet { padding:6mm 4mm; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
  .logo { max-height:54px; width:auto; object-fit:contain; }
  .wordmark { display:flex; align-items:center; gap:13px; }
  .mark { width:44px; height:44px; border-radius:10px; background:var(--accent); display:inline-block; }
  .name { font-size:28px; font-weight:800; letter-spacing:-.02em; line-height:1; }
  .tag { margin-top:5px; font-size:10px; letter-spacing:.15em; text-transform:uppercase; color:var(--faint); }
  .doc { text-align:right; min-width:210px; }
  .kicker { font-size:22px; font-weight:800; letter-spacing:.04em; }
  .meta { margin-top:12px; font-size:12px; }
  .meta div { display:flex; justify-content:flex-end; gap:12px; padding:2.5px 0; }
  .meta dt { color:var(--muted); } .meta dd { margin:0; min-width:96px; text-align:right; font-weight:600; }
  .rule { height:2px; background:var(--ink); margin-top:16px; }
  .parties { display:flex; gap:28px; margin-top:20px; }
  .parties > div { flex:1; }
  .eyebrow { font-size:10px; letter-spacing:.15em; text-transform:uppercase; color:var(--faint); margin-bottom:7px; }
  .who { font-size:15px; font-weight:700; }
  .pline { font-size:12px; color:var(--muted); margin-top:3px; line-height:1.5; }
  .kv { font-size:12px; line-height:1.7; margin:0; }
  .kv div { display:flex; justify-content:space-between; gap:16px; }
  .kv dt { color:var(--muted); } .kv dd { margin:0; font-weight:600; }
  table.items { width:100%; border-collapse:collapse; margin-top:26px; font-size:12px; }
  .items thead th { text-align:right; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); font-weight:700; padding:0 0 8px; border-bottom:2px solid var(--ink); }
  .items thead th.l { text-align:left; }
  .items tbody td { padding:11px 0; border-bottom:1px solid var(--line); vertical-align:top; text-align:right; }
  .items tbody td.l { text-align:left; }
  .items .idx { color:var(--faint); width:26px; }
  .items .desc { font-weight:600; } .items .code { font:500 11px/1.3 var(--mono); color:var(--muted); margin-top:3px; }
  .items .amt { font-weight:700; } .unit { color:var(--faint); }
  .totrow { display:flex; justify-content:flex-end; margin-top:18px; }
  .totals { width:300px; margin:0; }
  .totals .r { display:flex; justify-content:space-between; gap:20px; font-size:12px; padding:5px 0; }
  .totals .r dt { color:var(--muted); } .totals .r dd { margin:0; font-weight:600; }
  .totals .disc dd { color:var(--accent-ink); }
  .grand { margin-top:8px; padding:12px 14px; background:var(--accent-soft); border-radius:8px; display:flex; justify-content:space-between; align-items:baseline; gap:16px; }
  .grand dt { font-size:12px; letter-spacing:.04em; text-transform:uppercase; color:var(--accent-ink); font-weight:700; }
  .grand dd { margin:0; font-size:19px; font-weight:800; color:var(--accent-ink); }
  .lower { display:flex; gap:22px; margin-top:30px; }
  .lower > div { flex:1; }
  .pay { border:1px solid var(--line2); border-radius:9px; padding:14px 16px; }
  .pay .row { display:flex; justify-content:space-between; gap:14px; font-size:12px; padding:3px 0; }
  .pay .lbl { color:var(--muted); } .pay .val { font-weight:600; text-align:right; }
  .iban { font-family:var(--mono); letter-spacing:.02em; }
  .terms p { margin:0 0 8px; font-size:12px; color:#3d434c; line-height:1.55; }
  .terms p b { color:var(--ink); }
  .validity { margin-top:26px; padding-top:12px; border-top:1px solid var(--line); font-size:11px; color:var(--muted); line-height:1.5; }
  .foot { margin-top:14px; padding-top:12px; border-top:2px solid var(--ink); display:flex; justify-content:space-between; gap:16px; font-size:10.5px; color:var(--muted); }
  .foot b { color:var(--ink); font-weight:700; } .foot .r { text-align:right; }
</style></head>
<body><div class="sheet">
  <div class="head">
    ${logoBlok}
    <div class="doc">
      <div class="kicker">${text.offer}</div>
      <dl class="meta">
        <div><dt>${text.offerNo}</dt><dd>${esc(t.teklifNo)}</dd></div>
        <div><dt>${text.revision}</dt><dd>R${Number(t.revizyonNo ?? 0)}</dd></div>
        <div><dt>${text.date}</dt><dd>${formatDate(t.createdAt, locale)}</dd></div>
        <div><dt>${text.validity}</dt><dd>${formatDate(t.gecerlilikTarihi, locale)}</dd></div>
        <div><dt>${text.currency}</dt><dd>${esc(cur)}</dd></div>
      </dl>
    </div>
  </div>
  <div class="rule"></div>
  <div class="parties">
    <div>
      <div class="eyebrow">${text.dear}</div>
      <div class="who">${esc(musteriAd)}</div>
      <div class="pline">${musteri?.adres ? esc(musteri.adres) + '<br/>' : ''}${esc([musteri?.telefon, musteri?.email].filter(Boolean).join(' · '))}</div>
    </div>
    <div>
      <div class="eyebrow">${text.summary}</div>
      <dl class="kv">
        <div><dt>${text.lines}</dt><dd>${kalemler.length}</dd></div>
        <div><dt>${text.quantity}</dt><dd>${qty(toplamAdet, locale)}</dd></div>
        <div><dt>${text.vat}</dt><dd>%${t.kdvOrani} · ${t.kdvDahil ? text.included : text.excluded}</dd></div>
      </dl>
    </div>
  </div>
  <table class="items">
    <thead><tr><th class="l">#</th><th class="l">${text.product}</th><th>${text.qty}</th><th>${text.unitPrice}</th><th>${text.discountShort}</th><th>${text.amount}</th></tr></thead>
    <tbody>${satirlar}</tbody>
  </table>
  <div class="totrow"><dl class="totals">
    <div class="r"><dt>${text.subtotal}</dt><dd>${money(t.araToplam, cur, locale)}</dd></div>
    ${iskontoRow}${nakliyeRow}${matrahRow}
    <div class="r"><dt>${text.vat} (%${t.kdvOrani}${t.kdvDahil ? ` — ${text.included.toLowerCase()}` : ''})</dt><dd>${money(t.kdvTutari, cur, locale)}</dd></div>
    <div class="grand"><dt>${text.grandTotal}</dt><dd>${money(t.genelToplam, cur, locale)}</dd></div>
  </dl></div>
  <div class="lower">${payBlok}${termsBlok}</div>
  <p class="validity">${t.gecerlilikTarihi ? text.validUntil(formatDate(t.gecerlilikTarihi, locale)) : text.noValidity} ${text.snapshot}</p>
  <div class="foot">
    <div>${firma.legalName ? `<b>${esc(firma.legalName)}</b><br/>` : ''}${esc([firmaAdres, vknSatiri].filter(Boolean).join(' · '))}</div>
    <div class="r">${esc(firmaAd)}${firma.website ? ' · ' + esc(firma.website) : ''}<br/>${esc(firmaIletisim)}</div>
  </div>
</div></body></html>`;
}
