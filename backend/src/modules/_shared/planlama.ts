// ===================================================================
// FILE: src/modules/_shared/planlama.ts
// Merkezi makine kuyruk tarih hesaplama motoru.
// Tum moduller (makine_havuzu, is_yukler) bu fonksiyonu kullanir.
// ===================================================================

import { and, asc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { makineKuyrugu, makineler } from '@/modules/makine_havuzu/schema';
import { uretimEmriOperasyonlari } from '@/modules/uretim_emirleri/schema';
import { tatiller, haftaSonuPlanlari } from '@/modules/tanimlar/schema';

// ── Sabitler ──────────────────────────────────────────────────────────

/** Varsayilan calisma saatleri (calisir_24_saat = 0 icin) */
const DEFAULT_WORK_START_HOUR = 8;
const DEFAULT_WORK_END_HOUR = 17;
const DEFAULT_DAILY_WORK_MINUTES = (DEFAULT_WORK_END_HOUR - DEFAULT_WORK_START_HOUR) * 60; // 540 dk

/** Sonsuz donguyu engellemek icin maksimum gun atlama */
const MAX_SKIP_DAYS = 90;

// ── Yardimci tipler ──────────────────────────────────────────────────

type MakineWorkConfig = {
  makineId: string;
  calisir24Saat: boolean;
  workStartHour: number;
  workEndHour: number;
  dailyWorkMinutes: number;
};

type HolidaySet = Set<string>; // 'YYYY-MM-DD' formatinda

type WeekendPlanMap = Map<string, Set<string>>; // tarih -> calisan makine id'leri

// ── On-bellek: tatil ve hafta sonu verilerini toplu cek ──────────────

async function loadHolidays(): Promise<HolidaySet> {
  const rows = await db
    .select({ tarih: tatiller.tarih })
    .from(tatiller);
  const set = new Set<string>();
  for (const row of rows) {
    if (row.tarih) {
      const d = row.tarih instanceof Date
        ? row.tarih.toISOString().slice(0, 10)
        : String(row.tarih).slice(0, 10);
      set.add(d);
    }
  }
  return set;
}

async function loadWeekendPlans(): Promise<WeekendPlanMap> {
  const rows = await db
    .select({
      haftaBaslangic: haftaSonuPlanlari.hafta_baslangic,
      makineId: haftaSonuPlanlari.makine_id,
      cumartesiCalisir: haftaSonuPlanlari.cumartesi_calisir,
      pazarCalisir: haftaSonuPlanlari.pazar_calisir,
    })
    .from(haftaSonuPlanlari);

  const map = new Map<string, Set<string>>();

  for (const row of rows) {
    if (!row.haftaBaslangic || !row.makineId) continue;

    const hb = row.haftaBaslangic instanceof Date
      ? row.haftaBaslangic
      : new Date(String(row.haftaBaslangic));

    // Cumartesi = haftaBaslangic + 5 (Pazartesi bazli)
    if (row.cumartesiCalisir === 1) {
      const cumartesi = new Date(hb);
      cumartesi.setDate(cumartesi.getDate() + 5);
      const key = toDateKey(cumartesi);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(row.makineId);
    }

    // Pazar = haftaBaslangic + 6
    if (row.pazarCalisir === 1) {
      const pazar = new Date(hb);
      pazar.setDate(pazar.getDate() + 6);
      const key = toDateKey(pazar);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(row.makineId);
    }
  }

  return map;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Calisma gunu kontrolleri ─────────────────────────────────────────

function isWorkingDay(
  date: Date,
  makineId: string,
  holidays: HolidaySet,
  weekendPlans: WeekendPlanMap,
): boolean {
  const dateStr = toDateKey(date);

  // Tatil kontrolu
  if (holidays.has(dateStr)) return false;

  const dayOfWeek = date.getDay(); // 0=Pazar, 6=Cumartesi

  // Hafta ici (1-5) = calisma gunu
  if (dayOfWeek >= 1 && dayOfWeek <= 5) return true;

  // Hafta sonu: override plani var mi?
  const makineler = weekendPlans.get(dateStr);
  if (makineler && makineler.has(makineId)) return true;

  return false;
}

function skipToNextWorkingDay(
  date: Date,
  makineId: string,
  config: MakineWorkConfig,
  holidays: HolidaySet,
  weekendPlans: WeekendPlanMap,
): Date {
  let current = new Date(date);

  for (let i = 0; i < MAX_SKIP_DAYS; i++) {
    if (isWorkingDay(current, makineId, holidays, weekendPlans)) {
      // Calisma saati kontrolu (24 saat makineler icin gerek yok)
      if (!config.calisir24Saat) {
        const hour = current.getHours();
        if (hour >= config.workEndHour) {
          // Is gunu bitmis, ertesi gune gec
          current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, config.workStartHour, 0, 0);
          continue;
        }
        if (hour < config.workStartHour) {
          // Is gunu henuz baslamadi
          current = new Date(current.getFullYear(), current.getMonth(), current.getDate(), config.workStartHour, 0, 0);
        }
      }
      return current;
    }

    // Sonraki gune gec (is basi saatinde)
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, config.workStartHour, 0, 0);
  }

  return current;
}

/**
 * Verilen baslangictan itibaren calisma saatleri icinde sure ekler.
 * 24 saat makinelerde lineer ekler. 8-17 makinelerde gun sinirlarina uyar.
 */
function addWorkingMinutes(
  start: Date,
  minutes: number,
  config: MakineWorkConfig,
  holidays: HolidaySet,
  weekendPlans: WeekendPlanMap,
): Date {
  if (minutes <= 0) return new Date(start);

  // 24 saat calisma: tatil/hafta sonu atlayarak lineer ekle
  if (config.calisir24Saat) {
    let remaining = minutes;
    let cursor = new Date(start);

    while (remaining > 0) {
      if (!isWorkingDay(cursor, config.makineId, holidays, weekendPlans)) {
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 0, 0, 0);
        continue;
      }

      // Gunde kalan dakika
      const endOfDay = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 0, 0, 0);
      const remainingInDay = Math.floor((endOfDay.getTime() - cursor.getTime()) / 60_000);
      const consume = Math.min(remaining, remainingInDay);

      remaining -= consume;
      if (remaining <= 0) {
        return new Date(cursor.getTime() + consume * 60_000);
      }

      // Sonraki gune gec
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 0, 0, 0);
    }

    return cursor;
  }

  // 8-17 calisma saatleri
  let remaining = minutes;
  let cursor = new Date(start);

  while (remaining > 0) {
    cursor = skipToNextWorkingDay(cursor, config.makineId, config, holidays, weekendPlans);

    // Gunde kalan calisma dakikasi
    const endOfWorkDay = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), config.workEndHour, 0, 0);
    const remainingInDay = Math.max(0, Math.floor((endOfWorkDay.getTime() - cursor.getTime()) / 60_000));

    if (remainingInDay <= 0) {
      // Is gunu bitmis, ertesi gune gec
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, config.workStartHour, 0, 0);
      continue;
    }

    const consume = Math.min(remaining, remainingInDay);
    remaining -= consume;

    if (remaining <= 0) {
      return new Date(cursor.getTime() + consume * 60_000);
    }

    // Ertesi is gunu basina gec
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, config.workStartHour, 0, 0);
  }

  return cursor;
}

// ── Public yardimci: Tek tarih icin calisma gunu kontrolu ────────────

/**
 * Belirtilen tarihte makine calisabilir mi?
 * repoCalculateCapacity gibi dis fonksiyonlarin kullanmasi icin export edilir.
 */
export async function isMakineWorkingDay(makineId: string, date: Date): Promise<boolean> {
  const holidays = await loadHolidays();
  const weekendPlans = await loadWeekendPlans();
  return isWorkingDay(date, makineId, holidays, weekendPlans);
}

// ── Ana fonksiyon: Makine kuyruk tarihlerini yeniden hesapla ─────────

/**
 * Belirtilen makinenin kuyruğundaki tum bekliyor/calisiyor islerinin
 * planlanan_baslangic ve planlanan_bitis tarihlerini yeniden hesaplar.
 *
 * Hesaplamada dikkate alinanlar:
 * - Makinenin calisma modeli (8h/24h)
 * - Tatil gunleri
 * - Hafta sonu calisma planlari (makine bazli)
 * - Sira numarasi (kuyruk sirasi)
 * - Calisan isin gercek baslangici
 */
export async function recalcMakineKuyrukTarihleri(makineId: string): Promise<void> {
  // 1. Makine bilgisini al
  const [makine] = await db
    .select({
      calisir24Saat: makineler.calisir_24_saat,
    })
    .from(makineler)
    .where(eq(makineler.id, makineId))
    .limit(1);

  const config: MakineWorkConfig = {
    makineId,
    calisir24Saat: makine?.calisir24Saat === 1,
    workStartHour: DEFAULT_WORK_START_HOUR,
    workEndHour: DEFAULT_WORK_END_HOUR,
    dailyWorkMinutes: DEFAULT_DAILY_WORK_MINUTES,
  };

  // 2. Kuyruktaki aktif isleri al
  const items = await db
    .select({
      id: makineKuyrugu.id,
      sira: makineKuyrugu.sira,
      planlananSureDk: makineKuyrugu.planlanan_sure_dk,
      hazirlikSuresiDk: makineKuyrugu.hazirlik_suresi_dk,
      durum: makineKuyrugu.durum,
      gercekBaslangic: makineKuyrugu.gercek_baslangic,
      gercekBitis: makineKuyrugu.gercek_bitis,
      emirOperasyonId: makineKuyrugu.emir_operasyon_id,
    })
    .from(makineKuyrugu)
    .where(
      and(
        eq(makineKuyrugu.makine_id, makineId),
        inArray(makineKuyrugu.durum, ['bekliyor', 'calisiyor']),
      ),
    )
    .orderBy(asc(makineKuyrugu.sira));

  if (items.length === 0) return;

  // 3. Tatil ve hafta sonu verilerini toplu cek (N+1 sorgu onlemi)
  const holidays = await loadHolidays();
  const weekendPlans = await loadWeekendPlans();

  // 4. Cursor: simdiki zaman, is basina ayarla
  let cursor = skipToNextWorkingDay(new Date(), makineId, config, holidays, weekendPlans);

  // 5. Her is icin tarih hesapla
  for (const item of items) {
    const totalDk = Number(item.hazirlikSuresiDk ?? 0) + Number(item.planlananSureDk ?? 0);

    let baslangic: Date;
    let bitis: Date;

    if (item.durum === 'calisiyor') {
      // Calisan is: gercek baslangic varsa onu kullan
      baslangic = item.gercekBaslangic ? new Date(item.gercekBaslangic) : cursor;
      bitis = addWorkingMinutes(baslangic, totalDk, config, holidays, weekendPlans);
    } else {
      // Bekleyen is: onceki isin bitisinden baslat, calisma gunu kontrolu yap
      baslangic = skipToNextWorkingDay(cursor, makineId, config, holidays, weekendPlans);
      bitis = addWorkingMinutes(baslangic, totalDk, config, holidays, weekendPlans);
    }

    // Kuyruk kaydini guncelle
    await db
      .update(makineKuyrugu)
      .set({
        planlanan_baslangic: baslangic,
        planlanan_bitis: bitis,
      })
      .where(eq(makineKuyrugu.id, item.id));

    // Emir operasyonunu da guncelle
    if (item.emirOperasyonId) {
      await db
        .update(uretimEmriOperasyonlari)
        .set({
          planlanan_baslangic: baslangic,
          planlanan_bitis: bitis,
        })
        .where(eq(uretimEmriOperasyonlari.id, item.emirOperasyonId));
    }

    cursor = bitis;
  }
}
