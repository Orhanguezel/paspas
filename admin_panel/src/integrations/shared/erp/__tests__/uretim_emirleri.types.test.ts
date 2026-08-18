import { describe, expect, it } from 'vitest';

import {
  grupAsimetrik,
  grupPlanlanan,
  mamulGrupKey,
  type UretimEmriDto,
} from '../uretim_emirleri.types';

// Canlı "Application Error" regresyonu (YN 977aa834, 2026-08-15):
// "Tamamlananları Göster" açılınca partisiz tamamlanmış emirler tek kovada
// birleşiyor, asimetrik planlanan miktar grupPlanlanan'ı throw ettirip
// React ağacını çökertiyordu. Bu test canlıdaki gerçek seti taklit eder.

function emir(overrides: Partial<UretimEmriDto>): UretimEmriDto {
  return {
    id: 'ue-x',
    emirNo: 'UE-2026-0000',
    partiNo: null,
    operasyonlar: [],
    siparisKalemIds: [],
    siparisNo: null,
    siparisUrunKod: null,
    siparisUrunAd: null,
    siparisUrunGorsel: null,
    urunId: 'urun-1',
    mamulUrunId: 'mamul-1',
    taraf: null,
    urunKod: null,
    urunAd: null,
    mamulKod: null,
    mamulAd: null,
    mamulGorsel: null,
    receteId: null,
    receteAd: null,
    planlananMiktar: 0,
    uretilenMiktar: 0,
    baslangicTarihi: null,
    bitisTarihi: null,
    terminTarihi: null,
    planlananBitisTarihi: null,
    musteriAd: null,
    musteriDetay: null,
    musteriOzetTipi: 'manuel',
    terminRiski: false,
    makineAtamaSayisi: 0,
    makineAdlari: null,
    silinebilir: false,
    silmeNedeni: null,
    durum: 'tamamlandi',
    isActive: true,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    urunGorsel: null,
    ...overrides,
  } as UretimEmriDto;
}

describe('mamulGrupKey — partisiz emirler', () => {
  it('partisiz emirleri tek kovada birlestirmez (canli cokme senaryosu)', () => {
    // Canlı set: UE-2026-0013/0023/0025/0028/0055/0058 — aynı mamul, parti yok,
    // 6 farklı planlanan miktar. Eski anahtar hepsini tek gruba sokuyordu.
    const canliSet = [3500, 4000, 3000, 2000, 1700, 1000].map((miktar, i) =>
      emir({ id: `ue-${i}`, mamulUrunId: '8d90dbf5', planlananMiktar: miktar }),
    );
    const keys = new Set(canliSet.map((e) => mamulGrupKey(e)));
    expect(keys.size).toBe(canliSet.length);
  });

  it('parti dolu Sag/Sol cifti ayni anahtari alir (gruplama korunur)', () => {
    const sag = emir({ id: 'ue-a', partiNo: 'UP-2026-0036', mamulUrunId: 'pars', taraf: 'sag' });
    const sol = emir({ id: 'ue-b', partiNo: 'UP-2026-0036', mamulUrunId: 'pars', taraf: 'sol' });
    expect(mamulGrupKey(sag)).toBe(mamulGrupKey(sol));
  });
});

describe('grupPlanlanan — asimetrik miktar', () => {
  it('asimetrik sette throw etmez, max doner', () => {
    const grup = [emir({ id: 'a', planlananMiktar: 2020 }), emir({ id: 'b', planlananMiktar: 2250 })];
    expect(() => grupPlanlanan(grup)).not.toThrow();
    expect(grupPlanlanan(grup)).toBe(2250);
    expect(grupAsimetrik(grup)).toBe(true);
  });

  it('simetrik sette miktari doner, asimetri isareti vermez', () => {
    const grup = [emir({ id: 'a', planlananMiktar: 4100 }), emir({ id: 'b', planlananMiktar: 4100 })];
    expect(grupPlanlanan(grup)).toBe(4100);
    expect(grupAsimetrik(grup)).toBe(false);
  });
});
