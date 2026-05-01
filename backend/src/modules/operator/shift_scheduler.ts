// =============================================================
// FILE: src/modules/operator/shift_scheduler.ts
// Vardiya otomatik kapanma scheduler'ı
// =============================================================
//
// Lazy-close pattern (`closeExpiredOpenShiftForMachine`) bir sonraki üretim
// girişinde açık vardiyaları kapatıyor. Bu scheduler proaktif olarak periyodik
// çağrı yapar ve hiç üretim girişi olmasa bile vardiya bitiş saatinde kapatır.
//
// Backend startup'ında `startShiftAutoCloseScheduler()` çağrılır.
// Test ortamında (NODE_ENV=test) başlatılmaz — testlerin zamanlamayla yarışmasını
// önlemek için.

import { closeAllExpiredOpenShifts } from './repository';

const DEFAULT_INTERVAL_MS = 5 * 60_000; // 5 dakika

let timer: ReturnType<typeof setInterval> | null = null;

export type ShiftSchedulerOpts = {
  intervalMs?: number;
  /** Logger çağrısı — Fastify logger veya console */
  log?: (info: { closed: number; error?: string }) => void;
};

/** Scheduler'ı başlatır. NODE_ENV=test ise no-op. */
export function startShiftAutoCloseScheduler(opts: ShiftSchedulerOpts = {}): void {
  if (process.env.NODE_ENV === 'test') return;
  if (timer) return; // zaten çalışıyor

  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const log = opts.log ?? (() => {});

  const tick = async () => {
    try {
      const closed = await closeAllExpiredOpenShifts(new Date());
      if (closed > 0) log({ closed });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log({ closed: 0, error: message });
    }
  };

  // İlk çalışma startup'tan kısa süre sonra (DB hazır olduğunda)
  setTimeout(() => void tick(), 10_000);
  timer = setInterval(() => void tick(), intervalMs);
}

/** Scheduler'ı durdurur — test cleanup veya graceful shutdown için. */
export function stopShiftAutoCloseScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
