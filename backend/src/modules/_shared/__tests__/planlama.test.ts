import { describe, expect, it } from 'bun:test';

import {
  isWorkingDay,
  skipToNextWorkingDay,
  addWorkingMinutes,
  toDateKey,
  type MakineWorkConfig,
  type HolidaySet,
  type WeekendPlanMap,
} from '../planlama';

// ── Test yardimcilari ────────────────────────────────────────────────

const MAKINE_ID = 'test-makine-001';

function config8h(makineId = MAKINE_ID): MakineWorkConfig {
  return {
    makineId,
    calisir24Saat: false,
    workStartHour: 8,
    workEndHour: 17,
    dailyWorkMinutes: 540,
  };
}

function config24h(makineId = MAKINE_ID): MakineWorkConfig {
  return {
    makineId,
    calisir24Saat: true,
    workStartHour: 0,
    workEndHour: 24,
    dailyWorkMinutes: 1440,
  };
}

function noHolidays(): HolidaySet {
  return new Set();
}

function noWeekendPlans(): WeekendPlanMap {
  return new Map();
}

/** 2026-03-16 = Pazartesi */
function mon(hour = 8, min = 0): Date {
  return new Date(2026, 2, 16, hour, min, 0);
}

/** 2026-03-17 = Sali */
function tue(hour = 8, min = 0): Date {
  return new Date(2026, 2, 17, hour, min, 0);
}

/** 2026-03-20 = Cuma */
function fri(hour = 8, min = 0): Date {
  return new Date(2026, 2, 20, hour, min, 0);
}

/** 2026-03-21 = Cumartesi */
function sat(hour = 8, min = 0): Date {
  return new Date(2026, 2, 21, hour, min, 0);
}

/** 2026-03-22 = Pazar */
function sun(hour = 8, min = 0): Date {
  return new Date(2026, 2, 22, hour, min, 0);
}

/** 2026-03-23 = Pazartesi (sonraki hafta) */
function nextMon(hour = 8, min = 0): Date {
  return new Date(2026, 2, 23, hour, min, 0);
}

// ── toDateKey ────────────────────────────────────────────────────────

describe('toDateKey', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 2, 14))).toBe('2026-03-14');
  });

  it('pads single digit month and day', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

// ── isWorkingDay ─────────────────────────────────────────────────────

describe('isWorkingDay', () => {
  it('Pazartesi-Cuma calisma gunu', () => {
    expect(isWorkingDay(mon(), MAKINE_ID, noHolidays(), noWeekendPlans())).toBe(true);
    expect(isWorkingDay(tue(), MAKINE_ID, noHolidays(), noWeekendPlans())).toBe(true);
    expect(isWorkingDay(fri(), MAKINE_ID, noHolidays(), noWeekendPlans())).toBe(true);
  });

  it('Cumartesi/Pazar varsayilan calisma yok', () => {
    expect(isWorkingDay(sat(), MAKINE_ID, noHolidays(), noWeekendPlans())).toBe(false);
    expect(isWorkingDay(sun(), MAKINE_ID, noHolidays(), noWeekendPlans())).toBe(false);
  });

  it('tatil gunleri calisma yok', () => {
    const holidays = new Set(['2026-03-16']); // Pazartesi tatil
    expect(isWorkingDay(mon(), MAKINE_ID, holidays, noWeekendPlans())).toBe(false);
  });

  it('tatil olmayan gun etkilenmez', () => {
    const holidays = new Set(['2026-03-16']);
    expect(isWorkingDay(tue(), MAKINE_ID, holidays, noWeekendPlans())).toBe(true);
  });

  it('hafta sonu plani olan Cumartesi calisma gunu', () => {
    const weekendPlans: WeekendPlanMap = new Map([
      ['2026-03-21', new Set([MAKINE_ID])],
    ]);
    expect(isWorkingDay(sat(), MAKINE_ID, noHolidays(), weekendPlans)).toBe(true);
  });

  it('hafta sonu plani farkli makine icin — bu makine calisma yok', () => {
    const weekendPlans: WeekendPlanMap = new Map([
      ['2026-03-21', new Set(['baska-makine'])],
    ]);
    expect(isWorkingDay(sat(), MAKINE_ID, noHolidays(), weekendPlans)).toBe(false);
  });

  it('hafta sonu plani + tatil cakisirsa tatil oncelikli', () => {
    const holidays = new Set(['2026-03-21']); // Cumartesi tatil
    const weekendPlans: WeekendPlanMap = new Map([
      ['2026-03-21', new Set([MAKINE_ID])],
    ]);
    expect(isWorkingDay(sat(), MAKINE_ID, holidays, weekendPlans)).toBe(false);
  });
});

// ── skipToNextWorkingDay ─────────────────────────────────────────────

describe('skipToNextWorkingDay', () => {
  it('calisma gununde ve saatinde aynen doner', () => {
    const result = skipToNextWorkingDay(mon(10), MAKINE_ID, config8h(), noHolidays(), noWeekendPlans());
    expect(result.getTime()).toBe(mon(10).getTime());
  });

  it('Cumartesi → Pazartesi 08:00', () => {
    const result = skipToNextWorkingDay(sat(), MAKINE_ID, config8h(), noHolidays(), noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-23'); // Pazartesi
    expect(result.getHours()).toBe(8);
  });

  it('Pazar → Pazartesi 08:00', () => {
    const result = skipToNextWorkingDay(sun(), MAKINE_ID, config8h(), noHolidays(), noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-23');
    expect(result.getHours()).toBe(8);
  });

  it('is gunu bitmis (saat 17+) → ertesi gun 08:00', () => {
    const result = skipToNextWorkingDay(mon(18), MAKINE_ID, config8h(), noHolidays(), noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-17'); // Sali
    expect(result.getHours()).toBe(8);
  });

  it('is gunu baslamadan (saat 6) → ayni gun 08:00', () => {
    const result = skipToNextWorkingDay(mon(6), MAKINE_ID, config8h(), noHolidays(), noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-16'); // Pazartesi
    expect(result.getHours()).toBe(8);
  });

  it('tatil gununu atlar', () => {
    const holidays = new Set(['2026-03-16']); // Pazartesi tatil
    const result = skipToNextWorkingDay(mon(), MAKINE_ID, config8h(), holidays, noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-17'); // Sali
  });

  it('ardisik tatiller atlanir', () => {
    const holidays = new Set(['2026-03-16', '2026-03-17', '2026-03-18']); // Pzt-Sal-Car tatil
    const result = skipToNextWorkingDay(mon(), MAKINE_ID, config8h(), holidays, noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-19'); // Persembe
  });

  it('Cuma saat 17 sonrasi + hafta sonu → Pazartesi', () => {
    const result = skipToNextWorkingDay(fri(18), MAKINE_ID, config8h(), noHolidays(), noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-23'); // Pazartesi
  });

  it('24h makine hafta sonunu atlar ama saati degistirmez', () => {
    const result = skipToNextWorkingDay(sat(14), MAKINE_ID, config24h(), noHolidays(), noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-23'); // Pazartesi
  });

  it('hafta sonu plani olan Cumartesi icin atlamaz', () => {
    const weekendPlans: WeekendPlanMap = new Map([
      ['2026-03-21', new Set([MAKINE_ID])],
    ]);
    const result = skipToNextWorkingDay(sat(10), MAKINE_ID, config8h(), noHolidays(), weekendPlans);
    expect(toDateKey(result)).toBe('2026-03-21'); // Cumartesi (calisma gunu)
    expect(result.getHours()).toBe(10);
  });
});

// ── addWorkingMinutes (8h modu) ──────────────────────────────────────

describe('addWorkingMinutes — 8h modu', () => {
  const cfg = config8h();

  it('0 dakika → ayni tarih', () => {
    const result = addWorkingMinutes(mon(10), 0, cfg, noHolidays(), noWeekendPlans());
    expect(result.getTime()).toBe(mon(10).getTime());
  });

  it('60 dakika, gun icinde kalir', () => {
    const result = addWorkingMinutes(mon(10), 60, cfg, noHolidays(), noWeekendPlans());
    expect(result.getHours()).toBe(11);
    expect(toDateKey(result)).toBe('2026-03-16');
  });

  it('540 dakika (tam gun) → ayni gun saat 17:00', () => {
    const result = addWorkingMinutes(mon(8), 540, cfg, noHolidays(), noWeekendPlans());
    expect(result.getHours()).toBe(17);
    expect(toDateKey(result)).toBe('2026-03-16');
  });

  it('gun sonuna yakin baslarsa ertesi gune sarkar', () => {
    // Saat 16:00, 120dk = 1 saat bugun + 1 saat yarin
    const result = addWorkingMinutes(mon(16), 120, cfg, noHolidays(), noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-17'); // Sali
    expect(result.getHours()).toBe(9); // 08:00 + 60dk = 09:00
  });

  it('Cuma gun sonu → hafta sonunu atlar, Pazartesiye sarkar', () => {
    // Cuma 16:00, 120dk = 60dk bugun + 60dk Pazartesi
    const result = addWorkingMinutes(fri(16), 120, cfg, noHolidays(), noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-23'); // Pazartesi
    expect(result.getHours()).toBe(9);
  });

  it('cok gunluk is dogru hesaplanir', () => {
    // 3 tam gun = 3 * 540 = 1620 dk. Pazartesi 08:00 basla → Carsamba 17:00
    const result = addWorkingMinutes(mon(8), 1620, cfg, noHolidays(), noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-18'); // Carsamba
    expect(result.getHours()).toBe(17);
  });

  it('tatil gununu atlar', () => {
    const holidays = new Set(['2026-03-17']); // Sali tatil
    // Pazartesi 16:00, 120dk → 60dk bugun + Sali tatil → 60dk Carsamba
    const result = addWorkingMinutes(mon(16), 120, cfg, holidays, noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-18'); // Carsamba
    expect(result.getHours()).toBe(9);
  });

  it('hafta sonu + tatil birlikte dogru atlanir', () => {
    const holidays = new Set(['2026-03-23']); // Pazartesi tatil
    // Cuma 16:00, 120dk → 60dk Cuma + CmtPzr atla + Pazartesi tatil atla → 60dk Sali
    const result = addWorkingMinutes(fri(16), 120, cfg, holidays, noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-24'); // Sali
    expect(result.getHours()).toBe(9);
  });
});

// ── addWorkingMinutes (24h modu) ─────────────────────────────────────

describe('addWorkingMinutes — 24h modu', () => {
  const cfg = config24h();

  it('60 dakika, gun icinde kalir', () => {
    const result = addWorkingMinutes(mon(10), 60, cfg, noHolidays(), noWeekendPlans());
    expect(result.getHours()).toBe(11);
    expect(toDateKey(result)).toBe('2026-03-16');
  });

  it('24 saat = 1440 dk → ertesi gun ayni saat', () => {
    const result = addWorkingMinutes(mon(10), 1440, cfg, noHolidays(), noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-17'); // Sali
    expect(result.getHours()).toBe(10);
  });

  it('hafta sonunu atlar', () => {
    // Cuma 23:00, 120dk → 60dk Cuma gece + Cumartesi atla + Pazar atla → 60dk Pazartesi
    const result = addWorkingMinutes(fri(23), 120, cfg, noHolidays(), noWeekendPlans());
    expect(toDateKey(result)).toBe('2026-03-23'); // Pazartesi
    expect(result.getHours()).toBe(1); // 00:00 + 60dk = 01:00
  });

  it('hafta sonu plani olan gun atlanmaz', () => {
    const weekendPlans: WeekendPlanMap = new Map([
      ['2026-03-21', new Set([MAKINE_ID])],
    ]);
    // Cuma 23:00, 120dk → 60dk Cuma gece + Cumartesi calisma gunu (plan var)
    const result = addWorkingMinutes(fri(23), 120, cfg, noHolidays(), weekendPlans);
    expect(toDateKey(result)).toBe('2026-03-21'); // Cumartesi
    expect(result.getHours()).toBe(1);
  });
});

// ── Siralama degismesi senaryosu ─────────────────────────────────────

describe('siralama degisince son isin bitis tarihi', () => {
  const cfg = config8h();

  it('iki isin sirasi degisince toplam sure ayni kalir', () => {
    const start = mon(8);

    // Is A: 300dk, Is B: 240dk — sira: A, B
    const bitisA = addWorkingMinutes(start, 300, cfg, noHolidays(), noWeekendPlans());
    const bitisB_afterA = addWorkingMinutes(bitisA, 240, cfg, noHolidays(), noWeekendPlans());

    // Sira degis: B, A
    const bitisB_first = addWorkingMinutes(start, 240, cfg, noHolidays(), noWeekendPlans());
    const bitisA_afterB = addWorkingMinutes(bitisB_first, 300, cfg, noHolidays(), noWeekendPlans());

    // Son isin bitis tarihi ayni olmali
    expect(bitisB_afterA.getTime()).toBe(bitisA_afterB.getTime());
  });

  it('uc isin herhangi bir permutasyonunda son bitis ayni', () => {
    const start = mon(8);
    const sureler = [180, 300, 120]; // 3 is

    function hesaplaSonBitis(siralanmis: number[]): number {
      let cursor = new Date(start);
      for (const dk of siralanmis) {
        cursor = addWorkingMinutes(cursor, dk, cfg, noHolidays(), noWeekendPlans());
      }
      return cursor.getTime();
    }

    const permutasyonlar = [
      [0, 1, 2], [0, 2, 1], [1, 0, 2],
      [1, 2, 0], [2, 0, 1], [2, 1, 0],
    ];

    const sonuclar = permutasyonlar.map((p) => hesaplaSonBitis(p.map((i) => sureler[i])));
    const hepsiAyni = sonuclar.every((s) => s === sonuclar[0]);
    expect(hepsiAyni).toBe(true);
  });
});
