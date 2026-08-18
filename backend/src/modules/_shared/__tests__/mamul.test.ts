import { describe, expect, it } from 'bun:test';

import { groupByMamul, grupAsimetrik, grupPlanlanan, mamulGrupKey, type MamulEmri } from '../mamul';

function emir(overrides: Partial<MamulEmri> = {}): MamulEmri {
  return {
    id: 'ue-1',
    partiNo: 'UP-2026-0017',
    mamulUrunId: 'pars',
    urunId: '1118-101-R',
    taraf: 'sag',
    planlananMiktar: 2020,
    uretilenMiktar: 0,
    durum: 'planlandi',
    ...overrides,
  };
}

describe('mamul gruplama', () => {
  it('ayni yari mamulu ayni partide farkli mamuller icin ayri gruplar', () => {
    const groups = groupByMamul([
      emir({ id: 'UE-0099', mamulUrunId: 'pars' }),
      emir({ id: 'UE-0101', mamulUrunId: 'vector' }),
    ]);
    expect(groups).toHaveLength(2);
  });

  it('ayni parti ve mamulu siparis bagindan bagimsiz tek gruplar', () => {
    const groups = groupByMamul([
      emir({ id: 'UE-0099', taraf: 'sag' }),
      emir({ id: 'UE-0100', taraf: 'sol', urunId: '1118-101-L' }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.emirler).toHaveLength(2);
    expect(mamulGrupKey(groups[0]!.emirler[0]!)).toBe('UP-2026-0017::pars');
  });

  // Kasıtlı davranış değişikliği (2026-08-18): asimetrik planlanan miktar
  // artık throw ETMEZ — canlıda gerçekleşebiliyor ve render'ı çökertiyordu
  // (YN 977aa834). Max döner, asimetri grupAsimetrik ile işaretlenir.
  it('asimetrik planlanan miktarda throw etmez, max doner ve asimetriyi isaretler', () => {
    const [group] = groupByMamul([
      emir({ id: 'UE-0099', planlananMiktar: 2020 }),
      emir({ id: 'UE-0100', planlananMiktar: 2250, taraf: 'sol' }),
    ]);
    expect(grupPlanlanan(group!)).toBe(2250);
    expect(grupAsimetrik(group!)).toBe(true);
  });

  it('simetrik grupta asimetri isareti vermez', () => {
    const [group] = groupByMamul([
      emir({ id: 'UE-0099', planlananMiktar: 2020 }),
      emir({ id: 'UE-0100', planlananMiktar: 2020, taraf: 'sol' }),
    ]);
    expect(grupPlanlanan(group!)).toBe(2020);
    expect(grupAsimetrik(group!)).toBe(false);
  });

  // Canlı doğrulama (2026-08-18): partisiz kayıtların hiçbiri gerçek çift değil;
  // ortak "partisiz" kovası alakasız emirleri aynı gruba sokup listeyi çökertiyordu.
  it('partisiz emirleri tek kovada birlestirmez — her emir kendi grubu', () => {
    const groups = groupByMamul([
      emir({ id: 'UE-0007', partiNo: null, planlananMiktar: 200 }),
      emir({ id: 'UE-0024', partiNo: null, planlananMiktar: 5000 }),
      emir({ id: 'UE-0047', partiNo: null, planlananMiktar: 3200 }),
    ]);
    expect(groups).toHaveLength(3);
    for (const group of groups) {
      expect(group.emirler).toHaveLength(1);
      expect(grupAsimetrik(group)).toBe(false);
    }
  });

  it('tek tarafli emri tek elemanli grup yapar', () => {
    const groups = groupByMamul([
      emir({ taraf: null, urunId: 'mamul-1', mamulUrunId: 'mamul-1' }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.emirler).toHaveLength(1);
  });
});
