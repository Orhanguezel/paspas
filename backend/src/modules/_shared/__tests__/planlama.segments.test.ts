import { describe, expect, it } from 'bun:test';

import {
  isWorkingDay,
  splitIntoWorkingSegments,
  toDateKey,
  type HolidaySet,
  type MakineWorkConfig,
  type Segment,
  type WeekendPlanMap,
} from '../planlama';

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

function dt(day: number, hour: number, minute = 0): Date {
  return new Date(2026, 2, day, hour, minute, 0, 0);
}

function minutes(segment: Segment): number {
  return (segment.bitis.getTime() - segment.baslangic.getTime()) / 60_000;
}

function assertInvariants(
  segments: Segment[],
  baslangic: Date,
  bitis: Date,
  config: MakineWorkConfig,
  holidays: HolidaySet = new Set(),
  weekendPlans: WeekendPlanMap = new Map(),
) {
  let totalMinutes = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    expect(segment.baslangic >= baslangic).toBe(true);
    expect(segment.bitis <= bitis).toBe(true);
    expect(segment.bitis > segment.baslangic).toBe(true);
    expect(isWorkingDay(segment.baslangic, config.makineId, holidays, weekendPlans)).toBe(true);

    if (!config.calisir24Saat) {
      expect(segment.baslangic.getHours()).toBeGreaterThanOrEqual(config.workStartHour);
      expect(segment.bitis.getHours()).toBeLessThanOrEqual(config.workEndHour);
    }

    if (i > 0) {
      expect(segments[i].baslangic >= segments[i - 1].bitis).toBe(true);
    }

    totalMinutes += minutes(segment);
  }

  expect(totalMinutes).toBeLessThanOrEqual((bitis.getTime() - baslangic.getTime()) / 60_000);
}

describe('splitIntoWorkingSegments', () => {
  it('Cuma 14:00 → Pazartesi 10:00 araliginda hafta sonunu atlar', () => {
    const baslangic = dt(20, 14); // Cuma
    const bitis = dt(23, 10); // Pazartesi
    const cfg = config8h();

    const segments = splitIntoWorkingSegments(baslangic, bitis, cfg, new Set(), new Map());

    expect(segments.map((s) => [toDateKey(s.baslangic), s.baslangic.getHours(), s.bitis.getHours()])).toEqual([
      ['2026-03-20', 14, 17],
      ['2026-03-23', 8, 10],
    ]);
    assertInvariants(segments, baslangic, bitis, cfg);
  });

  it('ortadaki tatil gununu segment uretmeden atlar', () => {
    const baslangic = dt(16, 10); // Pazartesi
    const bitis = dt(18, 12); // Carsamba
    const holidays = new Set(['2026-03-17']);
    const cfg = config8h();

    const segments = splitIntoWorkingSegments(baslangic, bitis, cfg, holidays, new Map());

    expect(segments.map((s) => toDateKey(s.baslangic))).toEqual(['2026-03-16', '2026-03-18']);
    assertInvariants(segments, baslangic, bitis, cfg, holidays);
  });

  it('hafta sonu override plani olan makinede Cumartesi segmenti uretir', () => {
    const baslangic = dt(20, 16); // Cuma
    const bitis = dt(21, 11); // Cumartesi
    const weekendPlans = new Map([['2026-03-21', new Set([MAKINE_ID])]]);
    const cfg = config8h();

    const segments = splitIntoWorkingSegments(baslangic, bitis, cfg, new Set(), weekendPlans);

    expect(segments.map((s) => [toDateKey(s.baslangic), s.baslangic.getHours(), s.bitis.getHours()])).toEqual([
      ['2026-03-20', 16, 17],
      ['2026-03-21', 8, 11],
    ]);
    assertInvariants(segments, baslangic, bitis, cfg, new Set(), weekendPlans);
  });

  it('24 saat makinede gun ici saat kisiti uygulamaz ama calisma disi gunleri atlar', () => {
    const baslangic = dt(20, 22); // Cuma
    const bitis = dt(23, 2); // Pazartesi
    const cfg = config24h();

    const segments = splitIntoWorkingSegments(baslangic, bitis, cfg, new Set(), new Map());

    expect(segments.map((s) => [toDateKey(s.baslangic), s.baslangic.getHours(), toDateKey(s.bitis), s.bitis.getHours()])).toEqual([
      ['2026-03-20', 22, '2026-03-21', 0],
      ['2026-03-23', 0, '2026-03-23', 2],
    ]);
    assertInvariants(segments, baslangic, bitis, cfg);
  });

  it('bitis baslangictan once veya esitse bos dizi doner', () => {
    const cfg = config8h();

    expect(splitIntoWorkingSegments(dt(16, 10), dt(16, 10), cfg, new Set(), new Map())).toEqual([]);
    expect(splitIntoWorkingSegments(dt(16, 10), dt(16, 9), cfg, new Set(), new Map())).toEqual([]);
  });
});
