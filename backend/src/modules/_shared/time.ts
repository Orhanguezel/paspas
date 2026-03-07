// ===================================================================
// FILE: src/modules/dashboard/_utils/time.ts
// FINAL — Dashboard range/window helpers (YMD string safe)
// ===================================================================

import type { RangeKey, TrendBucket } from './dashboar_admin.types';

function addDaysUtc(d: Date, days: number) {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

export function toYmdUtc(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function parseRange(raw: unknown): RangeKey {
  const r = String(raw ?? '').trim();
  if (r === '7d' || r === '30d' || r === '90d') return r;
  return '30d';
}

export function computeWindow(range: RangeKey) {
  const now = new Date();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;

  // inclusive start (string compare works for YYYY-MM-DD)
  const from = addDaysUtc(now, -days);
  // exclusive end = tomorrow (prevents partial-day confusion)
  const toExclusive = addDaysUtc(now, 1);

  const bucket: TrendBucket = range === '90d' ? 'week' : 'day';
  return {
    fromYmd: toYmdUtc(from),
    toYmdExclusive: toYmdUtc(toExclusive),
    bucket,
  };
}
