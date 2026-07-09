import { describe, expect, it } from 'bun:test';

import {
  assignVardiya,
  calculateOee,
  calculateVerimlilik,
  partitionByVardiya,
  reduceOzet,
  resolveNet,
  VARDIYA_TZ_OFFSET_DK,
  type UretimKaydi,
  type VardiyaTanimi,
  type VardiyaTipi,
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
    vardiyaKayitId: partial.vardiyaKayitId ?? null,
    vardiyaSlotOverride: partial.vardiyaSlotOverride,
  };
}

function trDate(day: number, hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 6, day, hour, minute, 0, 0) - VARDIYA_TZ_OFFSET_DK * 60_000);
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

  it('assigns TR local hybrid and boundary times independently from process timezone', () => {
    const cases: Array<{ at: Date; vardiyaTipi: VardiyaTipi; gun: string }> = [
      { at: trDate(7, 19, 33), vardiyaTipi: 'gece', gun: '2026-07-07' },
      { at: trDate(7, 20, 0), vardiyaTipi: 'gece', gun: '2026-07-07' },
      { at: trDate(7, 11, 0), vardiyaTipi: 'gunduz', gun: '2026-07-07' },
      { at: trDate(7, 8, 53), vardiyaTipi: 'gece', gun: '2026-07-06' },
      { at: trDate(7, 7, 29), vardiyaTipi: 'gece', gun: '2026-07-06' },
      { at: trDate(7, 9, 31), vardiyaTipi: 'gunduz', gun: '2026-07-07' },
      { at: trDate(8, 3, 0), vardiyaTipi: 'gece', gun: '2026-07-07' },
    ];

    for (const item of cases) {
      expect(assignVardiya(item.at, tanimlar, VARDIYA_TZ_OFFSET_DK)).toMatchObject({
        vardiyaTipi: item.vardiyaTipi,
        gun: item.gun,
      });
    }
  });

  it('uses explicit vardiya slot override before timestamp inference', () => {
    const kayitlar = [
      kayit({
        id: 'bagli',
        kayitTarihi: trDate(7, 11, 0).toISOString(),
        net: 50,
        vardiyaKayitId: 'vk-gece',
        vardiyaSlotOverride: {
          gun: '2026-07-06',
          vardiyaTipi: 'gece',
          baslangic: trDate(6, 19, 30),
          bitis: trDate(7, 7, 30),
        },
      }),
    ];

    const partition = partitionByVardiya(kayitlar, tanimlar, VARDIYA_TZ_OFFSET_DK);

    expect(Array.from(partition.keys())).toEqual(['2026-07-06-gece']);
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
