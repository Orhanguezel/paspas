import { describe, expect, it } from 'vitest';

import {
  grupAsimetrik,
  grupPlanlanan,
  grupUretilen,
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

// Üretilen (Takım) kuralı — kullanıcı netleştirmesi 2026-08-18:
// montaj = sağ+sol birleştirme/paketleme; takım orada doğar. Sipariş daima
// takıma verilir. Enjeksiyon parça sayar, montaj takım sayar.
function op(over: Partial<UretimEmriDto['operasyonlar'][number]>) {
  return {
    operasyonAdi: 'op', makineAd: null, montaj: false,
    planlananMiktar: 0, uretilenMiktar: 0, durum: 'tamamlandi',
    planlananBitis: null, gercekBitis: null,
    ...over,
  };
}

const emir_ = emir;

describe('grupUretilen — takım adedi', () => {
  it('montajli operasyon varsa onun uretileni doner, TOPLAM ALMAZ', () => {
    // Canli UE-2026-0155: enjeksiyon 90 + montaj 2176. Toplam 2266 yanlis olurdu.
    const emir = emir_({
      id: 'ue-155', uretilenMiktar: 2176,
      operasyonlar: [
        op({ operasyonAdi: 'Profesyonel Sag', montaj: false, uretilenMiktar: 90 }),
        op({ operasyonAdi: 'Maximum Sol', montaj: true, uretilenMiktar: 2176 }),
      ],
    });
    expect(grupUretilen([emir])).toEqual({ miktar: 2176, birim: 'Takım' });
  });

  it('montaj operasyonunun sirasi onemli degil (bayraga gore okunur)', () => {
    // UE-2026-0156 deseninde montaj 1. sirada.
    const emir = emir_({
      id: 'ue-156',
      operasyonlar: [
        op({ montaj: true, uretilenMiktar: 2176 }),
        op({ montaj: false, uretilenMiktar: 2000 }),
      ],
    });
    expect(grupUretilen([emir]).miktar).toBe(2176);
  });

  it('iki ayri emirli grupta montajli tarafin uretileni doner', () => {
    // Canli UE-2026-0158 (sag, montajsiz 1300) + UE-2026-0159 (sol, montajli 2000).
    const sag = emir_({ id: 'a', uretilenMiktar: 1300, operasyonlar: [op({ montaj: false, uretilenMiktar: 1300 })] });
    const sol = emir_({ id: 'b', uretilenMiktar: 2000, operasyonlar: [op({ montaj: true, uretilenMiktar: 2000 })] });
    expect(grupUretilen([sag, sol])).toEqual({ miktar: 2000, birim: 'Takım' });
  });

  it('montajsiz cift taraflida tam cift sayisi (min) doner', () => {
    // Canli UP-2026-0007: Pars Bej 700/660 — iki tarafta da montaj yok.
    const a = emir_({ id: 'a', uretilenMiktar: 700, operasyonlar: [op({ montaj: false, uretilenMiktar: 700 })] });
    const b = emir_({ id: 'b', uretilenMiktar: 660, operasyonlar: [op({ montaj: false, uretilenMiktar: 660 })] });
    expect(grupUretilen([a, b])).toEqual({ miktar: 660, birim: 'Takım' });
  });

  it('montajsiz tek emirde birim Adet olur', () => {
    const tek = emir_({ id: 'x', uretilenMiktar: 450, operasyonlar: [op({ montaj: false, uretilenMiktar: 450 })] });
    expect(grupUretilen([tek])).toEqual({ miktar: 450, birim: 'Adet' });
  });

  it('plan asimini kirpmaz (S4)', () => {
    // Canli UE-2026-0148: 794 uretilen / 690 planlanan.
    const emir = emir_({ id: 'y', planlananMiktar: 690, uretilenMiktar: 794, operasyonlar: [op({ montaj: true, uretilenMiktar: 794 })] });
    expect(grupUretilen([emir]).miktar).toBe(794);
  });
});
