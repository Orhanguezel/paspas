import { describe, expect, it } from 'bun:test';

import {
  assignVardiya,
  calculateOee,
  calculateVerimlilik,
  partitionByVardiya,
  reduceOzet,
  resolveNet,
  type UretimKaydi,
  type VardiyaTanimi,
} from '../core';

const tanimlar: VardiyaTanimi[] = [
  { vardiyaTipi: 'gunduz', ad: 'Gündüz', baslangicSaati: '07:30', bitisSaati: '19:30' },
  { vardiyaTipi: 'gece', ad: 'Gece', baslangicSaati: '19:30', bitisSaati: '07:30' },
];

function kayit(partial: Partial<UretimKaydi> & { id: string; kayitTarihi: string; net: number; montaj?: boolean }): UretimKaydi {
  return {
    id: partial.id,
    makineId: partial.makineId ?? 'makine-1',
    makineKod: partial.makineKod ?? 'Enjeksiyon 1',
    makineAd: partial.makineAd ?? '900 T (ÖN)',
    kayitTarihi: new Date(partial.kayitTarihi),
    net: partial.net,
    fire: partial.fire ?? 0,
    ek: partial.ek ?? partial.net + (partial.fire ?? 0),
    montaj: partial.montaj ?? false,
    urunId: partial.urunId ?? 'urun-1',
    urunKod: partial.urunKod ?? 'UR-1',
    urunAd: partial.urunAd ?? 'Ürün 1',
    operasyonId: partial.operasyonId ?? 'op-1',
    operasyonAdi: partial.operasyonAdi ?? (partial.montaj ? 'Montaj' : 'Baskı'),
    operasyonTipi: partial.operasyonTipi ?? 'tek_tarafli',
    kalipId: partial.kalipId ?? 'kalip-1',
    kalipKod: partial.kalipKod ?? 'K-1',
    kalipAd: partial.kalipAd ?? 'Kalıp 1',
    cevrimSn: partial.cevrimSn ?? 30,
    operatorUserId: partial.operatorUserId ?? 'user-1',
    operatorAd: partial.operatorAd ?? 'Operatör',
    gunlukDurum: partial.gunlukDurum ?? 'tamamlandi',
    notlar: partial.notlar ?? null,
    uretimEmriId: partial.uretimEmriId ?? 'emir-1',
    emirNo: partial.emirNo ?? 'UE-1',
    planlananMiktar: partial.planlananMiktar ?? 1000,
    uretilenMiktar: partial.uretilenMiktar ?? 0,
    operasyonBaslangic: partial.operasyonBaslangic ?? null,
    operasyonBitis: partial.operasyonBitis ?? null,
  };
}

describe('vardiya_analizi core', () => {
  it('partitions every record into exactly one shift slot', () => {
    const kayitlar = Array.from({ length: 20 }, (_, index) => {
      const hour = (index * 3) % 24;
      const day = 6 + Math.floor(index / 8);
      return kayit({
        id: `k-${index}`,
        kayitTarihi: `2026-07-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:15:00`,
        net: index + 1,
      });
    });

    const partition = partitionByVardiya(kayitlar, tanimlar);
    const total = Array.from(partition.values()).reduce((sum, rows) => sum + rows.length, 0);

    expect(total).toBe(20);
  });

  it('keeps total net equal across all records and shift reductions', () => {
    const kayitlar = [
      kayit({ id: 'k-1', kayitTarihi: '2026-07-06T10:00:00', net: 100 }),
      kayit({ id: 'k-2', kayitTarihi: '2026-07-06T20:00:00', net: 200 }),
      kayit({ id: 'k-3', kayitTarihi: '2026-07-07T04:00:00', net: 300 }),
      kayit({ id: 'k-4', kayitTarihi: '2026-07-07T08:15:00', net: 400 }),
    ];
    const partition = partitionByVardiya(kayitlar, tanimlar);
    const slotNet = Array.from(partition.values()).reduce((sum, rows) => sum + reduceOzet(rows).net, 0);

    expect(reduceOzet(kayitlar).net).toBe(slotNet);
    expect(slotNet).toBe(1000);
  });

  it('includes assembly in net but excludes it from baskiNet', () => {
    const ozet = reduceOzet([
      kayit({ id: 'baski-1', kayitTarihi: '2026-07-06T10:00:00', net: 120, fire: 5 }),
      kayit({ id: 'montaj-1', kayitTarihi: '2026-07-06T11:00:00', net: 80, fire: 2, montaj: true }),
    ]);

    expect(ozet.net).toBe(200);
    expect(ozet.fire).toBe(7);
    expect(ozet.baskiNet).toBe(120);
    expect(ozet.baskiFire).toBe(5);
    expect(ozet.montajNet).toBe(80);
  });

  it('assigns hybrid and boundary times deterministically', () => {
    expect(assignVardiya(new Date('2026-07-07T08:15:00'), tanimlar)).toMatchObject({
      vardiyaTipi: 'gece',
      gun: '2026-07-06',
    });
    expect(assignVardiya(new Date('2026-07-07T09:45:00'), tanimlar)).toMatchObject({
      vardiyaTipi: 'gunduz',
      gun: '2026-07-07',
    });
    expect(assignVardiya(new Date('2026-07-07T19:29:00'), tanimlar)).toMatchObject({
      vardiyaTipi: 'gunduz',
      gun: '2026-07-07',
    });
    expect(assignVardiya(new Date('2026-07-07T19:31:00'), tanimlar)).toMatchObject({
      vardiyaTipi: 'gece',
      gun: '2026-07-07',
    });
    expect(assignVardiya(new Date('2026-07-08T03:00:00'), tanimlar)).toMatchObject({
      vardiyaTipi: 'gece',
      gun: '2026-07-07',
    });
  });

  it('resolves net with fallback and floors negative values', () => {
    expect(resolveNet(10, 99, 3)).toBe(10);
    expect(resolveNet(0, 25, 4)).toBe(21);
    expect(resolveNet(0, 3, 8)).toBe(0);
  });

  it('uses only baskiNet for efficiency and OEE inputs in mixed assembly reductions', () => {
    const ozet = reduceOzet([
      kayit({ id: 'baski-1', kayitTarihi: '2026-07-06T10:00:00', net: 120, fire: 0, cevrimSn: 30 }),
      kayit({ id: 'montaj-1', kayitTarihi: '2026-07-06T11:00:00', net: 120, fire: 0, cevrimSn: 30, montaj: true }),
    ]);

    expect(calculateVerimlilik({ net: ozet.baskiNet, sureDk: 60, cevrimSn: ozet.ortCevrimSn })).toBe(1);
    expect(calculateOee({
      planlananSureDk: 60,
      calismaSuresiDk: 60,
      net: ozet.baskiNet,
      fire: ozet.baskiFire,
      idealCalismaSn: ozet.idealCalismaSn,
      hasCycle: ozet.hasCycle,
    })).toBe(1);
  });
});
