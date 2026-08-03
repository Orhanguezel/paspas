'use client';

// =============================================================
// FILE: src/app/(main)/admin/teklifler/[id]/_components/teklif-print.tsx
// Paspas ERP — Teklif Modülü — Yazdırılabilir teklif formu (A4)
// Örnek Promats teklif tasarımı — logo + firma bilgisi ayarlardan dinamik.
// =============================================================

import { Printer, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { useGetMusteriAdminQuery } from '@/integrations/endpoints/admin/erp/musteriler_admin.endpoints';
import { useGetTeklifFirmaProfiliAdminQuery } from '@/integrations/endpoints/admin/erp/teklifler_admin.endpoints';
import type { TeklifDto } from '@/integrations/shared/erp/teklifler.types';

interface Props {
  open: boolean;
  onClose: () => void;
  teklif: TeklifDto;
}

function money(n: number, currency: string): string {
  return n.toLocaleString('tr-TR', { style: 'currency', currency: currency || 'TRY' });
}
function qty(n: number): string {
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
}
function formatTarih(v: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('tr-TR');
}

export default function TeklifPrint({ open, onClose, teklif }: Props) {
  const { data: musteri } = useGetMusteriAdminQuery(teklif.musteriId, { skip: !open || !teklif.musteriId });
  const { data: firma } = useGetTeklifFirmaProfiliAdminQuery(undefined, { skip: !open });
  const kalemler = [...(teklif.kalemler ?? [])].sort((a, b) => a.sira - b.sira);

  const cur = teklif.paraBirimi || 'TRY';
  const firmaAd = firma?.companyName || firma?.legalName || 'Firma';
  const firmaAdres = [firma?.address, [firma?.district, firma?.city].filter(Boolean).join(' / ')]
    .filter(Boolean).join(', ');
  const firmaIletisim = [firma?.phone, firma?.email, firma?.website].filter(Boolean).join(' · ');
  const vknSatiri = [firma?.taxOffice ? `${firma.taxOffice} V.D.` : null, firma?.taxNumber ? `VKN ${firma.taxNumber}` : null]
    .filter(Boolean).join(' · ');

  const musteriAd = teklif.musteriAd ?? musteri?.ad ?? '—';
  const toplamAdet = kalemler.reduce((s, k) => s + (Number(k.miktar) || 0), 0);
  const matrah = teklif.araToplam - teklif.iskontoTutari + teklif.nakliye;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-4xl p-0 max-h-[92vh] overflow-y-auto">
        <style>{`
          .tp-scope { --tp-ink:#17191e; --tp-muted:#626a75; --tp-faint:#8b929c; --tp-line:#dfe3e9;
            --tp-line2:#b9c0c9; --tp-accent:#0d4657; --tp-accent-ink:#0a3543; --tp-accent-soft:#eef4f6;
            --tp-sans:"Helvetica Neue","Arial Nova",Arial,"Segoe UI",system-ui,sans-serif;
            --tp-mono:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace; }
          .tp-sheet { background:#fff; color:var(--tp-ink); font-family:var(--tp-sans);
            width:210mm; max-width:100%; margin:0 auto; padding:18mm 16mm 14mm;
            -webkit-font-smoothing:antialiased; }
          .tp-head { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
          .tp-brand { display:flex; align-items:center; gap:13px; }
          .tp-logo { max-height:52px; width:auto; object-fit:contain; }
          .tp-mark { width:46px; height:46px; flex:none; }
          .tp-name { font-size:28px; font-weight:800; letter-spacing:-.02em; line-height:1; }
          .tp-name span { color:var(--tp-accent); }
          .tp-tag { margin-top:5px; font-size:10px; letter-spacing:.15em; text-transform:uppercase; color:var(--tp-faint); }
          .tp-doc { text-align:right; min-width:210px; }
          .tp-kicker { display:inline-flex; align-items:baseline; gap:8px; font-size:22px; font-weight:800; letter-spacing:.04em; }
          .tp-badge { font:600 9px/1 var(--tp-sans); letter-spacing:.12em; text-transform:uppercase; color:var(--tp-accent);
            border:1px solid var(--tp-accent); border-radius:4px; padding:3px 6px; }
          .tp-meta { margin-top:12px; font-size:12px; }
          .tp-meta div { display:flex; justify-content:flex-end; gap:12px; padding:2.5px 0; }
          .tp-meta dt { color:var(--tp-muted); }
          .tp-meta dd { margin:0; min-width:96px; text-align:right; font-variant-numeric:tabular-nums; font-weight:600; }
          .tp-rule { height:2px; background:var(--tp-ink); margin-top:16px; }
          .tp-parties { display:grid; grid-template-columns:1.15fr 1fr; gap:28px; margin-top:20px; }
          .tp-eyebrow { font-size:10px; letter-spacing:.15em; text-transform:uppercase; color:var(--tp-faint); margin-bottom:7px; }
          .tp-who { font-size:15px; font-weight:700; }
          .tp-line { font-size:12px; color:var(--tp-muted); margin-top:3px; line-height:1.5; }
          .tp-party.seller { border-left:3px solid var(--tp-accent); padding-left:16px; }
          .tp-kv { font-size:12px; line-height:1.7; margin:0; }
          .tp-kv div { display:flex; justify-content:space-between; gap:16px; }
          .tp-kv dt { color:var(--tp-muted); } .tp-kv dd { margin:0; font-weight:600; font-variant-numeric:tabular-nums; }
          .tp-items { width:100%; border-collapse:collapse; margin-top:26px; font-size:12px; }
          .tp-items thead th { text-align:right; font-size:10px; letter-spacing:.08em; text-transform:uppercase;
            color:var(--tp-muted); font-weight:700; padding:0 0 8px; border-bottom:2px solid var(--tp-ink); }
          .tp-items thead th.l { text-align:left; }
          .tp-items tbody td { padding:11px 0; border-bottom:1px solid var(--tp-line); vertical-align:top;
            text-align:right; font-variant-numeric:tabular-nums; }
          .tp-items tbody td.l { text-align:left; }
          .tp-items .idx { color:var(--tp-faint); width:26px; }
          .tp-items .desc { font-weight:600; }
          .tp-items .code { font:500 11px/1.3 var(--tp-mono); color:var(--tp-muted); margin-top:3px; }
          .tp-items .amt { font-weight:700; }
          .tp-unit { color:var(--tp-faint); }
          .tp-totrow { display:flex; justify-content:flex-end; margin-top:18px; }
          .tp-totals { width:300px; max-width:100%; margin:0; }
          .tp-totals .r { display:flex; justify-content:space-between; gap:20px; font-size:12px; padding:5px 0; }
          .tp-totals .r dt { color:var(--tp-muted); } .tp-totals .r dd { margin:0; font-variant-numeric:tabular-nums; font-weight:600; }
          .tp-totals .disc dd { color:var(--tp-accent-ink); }
          .tp-grand { margin-top:8px; padding:12px 14px; background:var(--tp-accent-soft); border-radius:8px;
            display:flex; justify-content:space-between; align-items:baseline; gap:16px; }
          .tp-grand dt { font-size:12px; letter-spacing:.04em; text-transform:uppercase; color:var(--tp-accent-ink); font-weight:700; }
          .tp-grand dd { margin:0; font-size:19px; font-weight:800; color:var(--tp-accent-ink); font-variant-numeric:tabular-nums; }
          .tp-lower { display:grid; grid-template-columns:1fr 1fr; gap:22px; margin-top:30px; }
          .tp-pay { border:1px solid var(--tp-line2); border-radius:9px; padding:14px 16px; }
          .tp-pay .row { display:flex; justify-content:space-between; gap:14px; font-size:12px; padding:3px 0; }
          .tp-pay .lbl { color:var(--tp-muted); } .tp-pay .val { font-weight:600; text-align:right; }
          .tp-iban { font-family:var(--tp-mono); font-size:12px; letter-spacing:.02em; }
          .tp-terms p { margin:0 0 8px; font-size:12px; color:#3d434c; line-height:1.55; }
          .tp-terms p b { color:var(--tp-ink); }
          .tp-validity { margin-top:26px; padding-top:12px; border-top:1px solid var(--tp-line);
            font-size:11px; color:var(--tp-muted); line-height:1.5; }
          .tp-foot { margin-top:14px; padding-top:12px; border-top:2px solid var(--tp-ink);
            display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; font-size:10.5px; color:var(--tp-muted); }
          .tp-foot b { color:var(--tp-ink); font-weight:700; } .tp-foot .r { text-align:right; }
          @media (max-width:640px){ .tp-sheet{padding:12mm 8mm;} .tp-parties,.tp-lower{grid-template-columns:1fr;gap:18px;} .tp-name{font-size:22px;} }
          @media print {
            body * { visibility:hidden; }
            #teklif-print-area, #teklif-print-area * { visibility:visible; }
            #teklif-print-area { position:absolute; top:0; left:0; width:100%; }
            .teklif-print-no-print { display:none !important; }
            .tp-sheet { width:100%; padding:12mm 10mm; }
            @page { size:A4; margin:10mm; }
          }
        `}</style>

        {/* Toolbar — yazdırılmaz */}
        <div className="teklif-print-no-print sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-3">
          <span className="text-sm text-muted-foreground">
            Yazdırma önizlemesi — logo ve firma bilgisi ayarlardan gelir.
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="mr-1 size-4" /> Yazdır / PDF
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="mr-1 size-4" /> Kapat
            </Button>
          </div>
        </div>

        {/* A4 içerik */}
        <div id="teklif-print-area" className="tp-scope">
          <div className="tp-sheet">
            {/* Header */}
            <header className="tp-head">
              <div className="tp-brand">
                {firma?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={firma.logoUrl} alt={firmaAd} className="tp-logo" />
                ) : (
                  <>
                    <svg className="tp-mark" viewBox="0 0 48 48" role="img" aria-label={firmaAd}>
                      <rect x="1.5" y="1.5" width="45" height="45" rx="10" fill="#0d4657" />
                      <g stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".92">
                        <line x1="12" y1="16" x2="36" y2="16" />
                        <line x1="12" y1="24" x2="36" y2="24" />
                        <line x1="12" y1="32" x2="36" y2="32" />
                      </g>
                    </svg>
                    <div>
                      <div className="tp-name">{firmaAd}</div>
                      <div className="tp-tag">Otomotiv Paspas Üretim</div>
                    </div>
                  </>
                )}
              </div>
              <div className="tp-doc">
                <div className="tp-kicker">TEKLİF</div>
                <dl className="tp-meta">
                  <div><dt>Teklif No</dt><dd>{teklif.teklifNo}</dd></div>
                  <div><dt>Tarih</dt><dd>{formatTarih(teklif.createdAt)}</dd></div>
                  <div><dt>Geçerlilik</dt><dd>{formatTarih(teklif.gecerlilikTarihi)}</dd></div>
                  <div><dt>Para Birimi</dt><dd>{cur}</dd></div>
                </dl>
              </div>
            </header>
            <div className="tp-rule" />

            {/* Taraflar */}
            <section className="tp-parties">
              <div className="tp-party">
                <div className="tp-eyebrow">Sayın</div>
                <div className="tp-who">{musteriAd}</div>
                <div className="tp-line">
                  {musteri?.adres && <>{musteri.adres}<br /></>}
                  {[musteri?.telefon, musteri?.email].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="tp-party">
                <div className="tp-eyebrow">Teklif Özeti</div>
                <dl className="tp-kv">
                  <div><dt>Kalem sayısı</dt><dd>{kalemler.length}</dd></div>
                  <div><dt>Toplam adet</dt><dd>{qty(toplamAdet)}</dd></div>
                  <div><dt>KDV</dt><dd>%{teklif.kdvOrani} · {teklif.kdvDahil ? 'Dahil' : 'Hariç'}</dd></div>
                </dl>
              </div>
            </section>

            {/* Kalemler */}
            <table className="tp-items">
              <colgroup>
                <col style={{ width: '4%' }} /><col /><col style={{ width: '12%' }} />
                <col style={{ width: '17%' }} /><col style={{ width: '9%' }} /><col style={{ width: '18%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="l">#</th><th className="l">Ürün / Açıklama</th>
                  <th>Miktar</th><th>Birim Fiyat</th><th>İsk.</th><th>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {kalemler.length === 0 && (
                  <tr><td className="l" colSpan={6} style={{ padding: '24px 0', textAlign: 'center', color: 'var(--tp-muted)' }}>Kalem bulunmuyor.</td></tr>
                )}
                {kalemler.map((k, idx) => (
                  <tr key={k.id}>
                    <td className="l idx">{idx + 1}</td>
                    <td className="l">
                      <div className="desc">{k.aciklama}</div>
                      {(k.urunKod || k.birim) && (
                        <div className="code">{[k.urunKod, k.birim].filter(Boolean).join(' · ')}</div>
                      )}
                    </td>
                    <td>{qty(k.miktar)} <span className="tp-unit">{k.birim || 'ad.'}</span></td>
                    <td>{money(k.birimFiyat, cur)}</td>
                    <td>{k.iskontoOrani > 0 ? `%${k.iskontoOrani}` : '—'}</td>
                    <td className="amt">{money(k.satirToplam, cur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Toplamlar */}
            <div className="tp-totrow">
              <dl className="tp-totals">
                <div className="r"><dt>Ara Toplam</dt><dd>{money(teklif.araToplam, cur)}</dd></div>
                {teklif.iskontoTutari > 0 && (
                  <div className="r disc"><dt>İskonto (%{teklif.iskontoOrani})</dt><dd>−{money(teklif.iskontoTutari, cur)}</dd></div>
                )}
                {teklif.nakliye > 0 && (
                  <div className="r"><dt>Nakliye</dt><dd>{money(teklif.nakliye, cur)}</dd></div>
                )}
                {(teklif.iskontoTutari > 0 || teklif.nakliye > 0) && (
                  <div className="r"><dt>KDV Matrahı</dt><dd>{money(matrah, cur)}</dd></div>
                )}
                <div className="r"><dt>KDV (%{teklif.kdvOrani}{teklif.kdvDahil ? ' — dahil' : ''})</dt><dd>{money(teklif.kdvTutari, cur)}</dd></div>
                <div className="tp-grand"><dt>Genel Toplam</dt><dd>{money(teklif.genelToplam, cur)}</dd></div>
              </dl>
            </div>

            {/* Alt bloklar */}
            <section className="tp-lower">
              {(firma?.iban || firma?.bankName) && (
                <div className="tp-pay">
                  <div className="tp-eyebrow">Ödeme Bilgileri</div>
                  {firma?.bankName && <div className="row"><span className="lbl">Banka</span><span className="val">{firma.bankName}</span></div>}
                  {firma?.iban && <div className="row"><span className="lbl">IBAN</span><span className="val tp-iban">{firma.iban}</span></div>}
                  <div className="row"><span className="lbl">Hesap Ünvanı</span><span className="val">{firma?.legalName || firmaAd}</span></div>
                </div>
              )}
              {(teklif.odemeKosullari || teklif.teslimKosullari || teklif.aciklama) && (
                <div className="tp-terms">
                  <div className="tp-eyebrow">Koşullar</div>
                  {teklif.odemeKosullari && <p><b>Ödeme:</b> {teklif.odemeKosullari}</p>}
                  {teklif.teslimKosullari && <p><b>Teslim:</b> {teklif.teslimKosullari}</p>}
                  {teklif.aciklama && <p>{teklif.aciklama}</p>}
                </div>
              )}
            </section>

            {/* Geçerlilik */}
            <p className="tp-validity">
              {teklif.gecerlilikTarihi
                ? <>Bu teklif <b style={{ color: 'var(--tp-ink)' }}>{formatTarih(teklif.gecerlilikTarihi)}</b> tarihine kadar geçerlidir. Fiyatlar ve teslim süreleri bu tarihten sonra değişebilir.</>
                : 'Bu teklifin geçerlilik süresi belirtilmemiştir.'}
              {' '}Teklif kalemleri, hazırlandığı andaki ürün bilgileriyle sabitlenmiştir.
            </p>

            {/* Alt bilgi */}
            <footer className="tp-foot">
              <div>
                {firma?.legalName && <><b>{firma.legalName}</b><br /></>}
                {[firmaAdres, vknSatiri].filter(Boolean).join(' · ')}
              </div>
              <div className="r">
                {firmaAd}{firma?.website ? ` · ${firma.website}` : ''}<br />
                {firmaIletisim}
              </div>
            </footer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
