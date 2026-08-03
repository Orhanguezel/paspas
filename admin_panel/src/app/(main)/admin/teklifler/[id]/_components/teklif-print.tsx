'use client';

// =============================================================
// FILE: src/app/(main)/admin/teklifler/[id]/_components/teklif-print.tsx
// Paspas ERP — Teklif Modülü — Yazdırılabilir teklif formu (A4 önizleme)
// Örnek Promats teklif formu — deliverable
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

  const firmaAd = firma?.companyName || firma?.legalName || 'Firma';
  const firmaAdresSatiri = [firma?.address, [firma?.district, firma?.city].filter(Boolean).join(' / ')]
    .filter(Boolean).join(', ');
  const firmaIletisim = [
    firma?.phone && `Tel: ${firma.phone}`,
    firma?.email,
    firma?.website,
  ].filter(Boolean).join(' · ');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl p-0 max-h-[90vh] overflow-y-auto"
      >
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #teklif-print-area, #teklif-print-area * { visibility: visible; }
            #teklif-print-area {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            .teklif-print-no-print { display: none !important; }
          }
        `}</style>

        {/* Ekran üstü aksiyon çubuğu — yazdırılmaz */}
        <div className="teklif-print-no-print sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-3">
          <span className="text-sm font-medium text-muted-foreground">Yazdırma Önizlemesi</span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="mr-1 size-4" /> Yazdır
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="mr-1 size-4" /> Kapat
            </Button>
          </div>
        </div>

        {/* A4 içerik */}
        <div id="teklif-print-area" className="bg-white text-black p-10 mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
          {/* Firma başlığı — logo ve firma bilgisi ayarlardan (site_settings) */}
          <div className="flex items-start justify-between border-b-2 border-black pb-4">
            <div>
              {firma?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firma.logoUrl} alt={firmaAd} className="mb-2 max-h-16 w-auto object-contain" />
              ) : null}
              <h1 className="text-2xl font-bold tracking-tight">{firmaAd}</h1>
              {firma?.legalName && firma.legalName !== firmaAd && (
                <p className="text-xs text-neutral-600 mt-0.5">{firma.legalName}</p>
              )}
              {firmaAdresSatiri && <p className="text-xs text-neutral-600 mt-1">{firmaAdresSatiri}</p>}
              {firmaIletisim && <p className="text-xs text-neutral-600">{firmaIletisim}</p>}
              {(firma?.taxOffice || firma?.taxNumber) && (
                <p className="text-xs text-neutral-600">
                  {firma?.taxOffice ? `${firma.taxOffice} V.D. · ` : ''}VKN: {firma?.taxNumber ?? '—'}
                </p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-lg font-semibold">TEKLİF</h2>
              <p className="text-sm mt-1"><span className="text-neutral-500">Teklif No:</span> <strong>{teklif.teklifNo}</strong></p>
              <p className="text-sm"><span className="text-neutral-500">Tarih:</span> {formatTarih(teklif.createdAt)}</p>
              <p className="text-sm"><span className="text-neutral-500">Geçerlilik:</span> {formatTarih(teklif.gecerlilikTarihi)}</p>
            </div>
          </div>

          {/* Müşteri bilgisi */}
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase text-neutral-500 mb-1">Sayın</p>
              <p className="font-medium">{teklif.musteriAd ?? musteri?.ad ?? '—'}</p>
              {musteri?.adres && <p className="text-sm text-neutral-700">{musteri.adres}</p>}
              {musteri?.telefon && <p className="text-sm text-neutral-700">Tel: {musteri.telefon}</p>}
              {musteri?.email && <p className="text-sm text-neutral-700">{musteri.email}</p>}
            </div>
            <div className="text-right text-sm text-neutral-700">
              <p><span className="text-neutral-500">Para Birimi:</span> {teklif.paraBirimi}</p>
              <p><span className="text-neutral-500">KDV:</span> {teklif.kdvDahil ? 'Fiyatlara Dahildir' : 'Fiyatlara Dahil Değildir'} (%{teklif.kdvOrani})</p>
            </div>
          </div>

          {/* Kalemler tablosu */}
          <table className="mt-6 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 text-left font-semibold">#</th>
                <th className="py-2 text-left font-semibold">Açıklama</th>
                <th className="py-2 text-right font-semibold">Miktar</th>
                <th className="py-2 text-right font-semibold">Birim Fiyat</th>
                <th className="py-2 text-right font-semibold">İskonto</th>
                <th className="py-2 text-right font-semibold">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {kalemler.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-500">Kalem bulunmuyor.</td>
                </tr>
              )}
              {kalemler.map((k, idx) => (
                <tr key={k.id} className="border-b border-neutral-300">
                  <td className="py-2 align-top">{idx + 1}</td>
                  <td className="py-2 align-top">
                    <div>{k.aciklama}</div>
                    {k.urunKod && <div className="text-xs text-neutral-500">{k.urunKod}</div>}
                  </td>
                  <td className="py-2 text-right align-top tabular-nums">
                    {k.miktar.toLocaleString('tr-TR', { maximumFractionDigits: 4 })} {k.birim ?? ''}
                  </td>
                  <td className="py-2 text-right align-top tabular-nums">{money(k.birimFiyat, teklif.paraBirimi)}</td>
                  <td className="py-2 text-right align-top tabular-nums">{k.iskontoOrani > 0 ? `%${k.iskontoOrani}` : '—'}</td>
                  <td className="py-2 text-right align-top tabular-nums font-medium">{money(k.satirToplam, teklif.paraBirimi)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Toplamlar */}
          <div className="mt-4 flex justify-end">
            <div className="w-72 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Ara Toplam</span>
                <span className="tabular-nums">{money(teklif.araToplam, teklif.paraBirimi)}</span>
              </div>
              {teklif.iskontoTutari > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">İskonto (%{teklif.iskontoOrani})</span>
                  <span className="tabular-nums">-{money(teklif.iskontoTutari, teklif.paraBirimi)}</span>
                </div>
              )}
              {teklif.nakliye > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Nakliye</span>
                  <span className="tabular-nums">{money(teklif.nakliye, teklif.paraBirimi)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-600">KDV (%{teklif.kdvOrani}{teklif.kdvDahil ? ' — dahil' : ''})</span>
                <span className="tabular-nums">{money(teklif.kdvTutari, teklif.paraBirimi)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-black pt-1 text-base font-bold">
                <span>Genel Toplam</span>
                <span className="tabular-nums">{money(teklif.genelToplam, teklif.paraBirimi)}</span>
              </div>
            </div>
          </div>

          {/* Koşullar */}
          {(teklif.odemeKosullari || teklif.teslimKosullari || teklif.aciklama) && (
            <div className="mt-8 space-y-3 text-sm">
              {teklif.odemeKosullari && (
                <div>
                  <p className="font-semibold">Ödeme Koşulları</p>
                  <p className="text-neutral-700 whitespace-pre-line">{teklif.odemeKosullari}</p>
                </div>
              )}
              {teklif.teslimKosullari && (
                <div>
                  <p className="font-semibold">Teslim Koşulları</p>
                  <p className="text-neutral-700 whitespace-pre-line">{teklif.teslimKosullari}</p>
                </div>
              )}
              {teklif.aciklama && (
                <div>
                  <p className="font-semibold">Açıklama</p>
                  <p className="text-neutral-700 whitespace-pre-line">{teklif.aciklama}</p>
                </div>
              )}
            </div>
          )}

          {/* Banka / ödeme bilgisi — ayarlardan */}
          {(firma?.iban || firma?.bankName) && (
            <div className="mt-8 rounded border border-neutral-300 p-3 text-sm">
              <p className="font-semibold">Ödeme Bilgileri</p>
              {firma?.bankName && <p className="text-neutral-700">Banka: {firma.bankName}</p>}
              {firma?.iban && <p className="text-neutral-700">IBAN: <span className="font-mono">{firma.iban}</span></p>}
              <p className="text-neutral-700">Hesap Ünvanı: {firma?.legalName || firmaAd}</p>
            </div>
          )}

          {/* Geçerlilik notu */}
          <p className="mt-8 text-xs text-neutral-500 border-t pt-3">
            {teklif.gecerlilikTarihi
              ? `Bu teklif ${formatTarih(teklif.gecerlilikTarihi)} tarihine kadar geçerlidir. Fiyatlar ve teslim süreleri bu tarihten sonra değişebilir.`
              : 'Bu teklifin geçerlilik süresi belirtilmemiştir.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
