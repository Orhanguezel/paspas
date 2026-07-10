import { describe, expect, it } from 'bun:test';

import { groupByMamul, grupPlanlanan, mamulGrupKey, type MamulEmri } from '../mamul';

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

  it('asimetrik planlanan miktari reddeder', () => {
    const [group] = groupByMamul([
      emir({ id: 'UE-0099', planlananMiktar: 2020 }),
      emir({ id: 'UE-0100', planlananMiktar: 2250, taraf: 'sol' }),
    ]);
    expect(() => grupPlanlanan(group!)).toThrow('asimetrik_planlanan_miktar');
  });

  it('tek tarafli emri tek elemanli grup yapar', () => {
    const groups = groupByMamul([
      emir({ taraf: null, urunId: 'mamul-1', mamulUrunId: 'mamul-1' }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.emirler).toHaveLength(1);
  });
});
