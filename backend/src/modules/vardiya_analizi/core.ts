export type VardiyaTipi = 'gunduz' | 'gece';

/** Türkiye sabit UTC+3 (2016'dan beri DST yok). Ortam TZ'sine ASLA güvenme. */
export const VARDIYA_TZ_OFFSET_DK = 180;

export type VardiyaTanimi = {
  vardiyaTipi: VardiyaTipi;
  ad: string;
  baslangicSaati: string;
  bitisSaati: string;
};

export type UretimKaydi = {
  id: string;
  makineId: string;
  makineKod: string | null;
  makineAd: string;
  kayitTarihi: Date;
  net: number;
  fire: number;
  ek: number;
  montaj: boolean;
  urunId: string;
  urunKod: string | null;
  urunAd: string;
  operasyonId: string | null;
  operasyonAdi: string;
  operasyonTipi: string | null;
  kalipId: string | null;
  kalipKod: string | null;
  kalipAd: string | null;
  cevrimSn: number | null;
  operatorUserId: string | null;
  operatorAd: string | null;
  gunlukDurum: string;
  notlar: string | null;
  uretimEmriId: string;
  emirNo: string;
  planlananMiktar: number;
  uretilenMiktar: number;
  operasyonBaslangic: Date | null;
  operasyonBitis: Date | null;
  vardiyaKayitId: string | null;
  vardiyaSlotOverride?: VardiyaSlot;
};

export type VardiyaSlot = {
  gun: string;
  vardiyaTipi: VardiyaTipi;
  baslangic: Date;
  bitis: Date;
};

export type UrunKirilim = { urunId: string; urunAd: string; urunKod: string | null; miktar: number };

export type OperasyonKirilim = {
  operasyonId: string | null;
  operasyonAdi: string;
  operasyonTipi: string | null;
  kalipId: string | null;
  kalipKod: string | null;
  kalipAd: string | null;
  miktar: number;
};

export type ReduceOzet = {
  net: number;
  fire: number;
  kayitSayisi: number;
  baskiNet: number;
  baskiFire: number;
  montajNet: number;
  montajKayitSayisi: number;
  urunKirilimi: UrunKirilim[];
  operasyonKirilimi: OperasyonKirilim[];
  montajOperasyonKirilimi: OperasyonKirilim[];
  idealCalismaSn: number;
  hasCycle: boolean;
  ortCevrimSn: number | null;
};

export function roundRatio(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Number(value.toFixed(3));
}

export function calculateOee(input: {
  planlananSureDk: number;
  calismaSuresiDk: number;
  net: number;
  fire: number;
  idealCalismaSn: number;
  hasCycle: boolean;
}): number | null {
  if (input.planlananSureDk <= 0 || input.net + input.fire <= 0) return null;
  const availability = input.calismaSuresiDk / input.planlananSureDk;
  const quality = input.net / (input.net + input.fire);
  const performance = input.hasCycle && input.calismaSuresiDk > 0
    ? input.idealCalismaSn / (input.calismaSuresiDk * 60)
    : 1;
  return roundRatio(Math.max(0, Math.min(1, availability * performance * quality)));
}

export function calculateVerimlilik(input: { net: number; sureDk: number; cevrimSn: number | null }): number | null {
  if (!input.cevrimSn || input.cevrimSn <= 0 || input.sureDk <= 0) return null;
  const teorik = (input.sureDk * 60) / input.cevrimSn;
  return teorik > 0 ? roundRatio(input.net / teorik) : null;
}

export function resolveNet(
  netMiktar: number | string | null,
  ekMiktar: number | string | null,
  fireMiktar: number | string | null,
): number {
  const net = Number(netMiktar ?? 0);
  if (net !== 0) return net;
  const ek = Number(ekMiktar ?? 0);
  const fire = Number(fireMiktar ?? 0);
  return Math.max(0, ek - fire);
}

export function diffMinutes(a: Date, b: Date): number {
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 60000));
}

export function parseClockToMinutes(clock: string): number {
  const [hour, minute] = clock.split(':').map(Number);
  return (hour * 60) + minute;
}

export function toLocal(d: Date, tzOffsetDk: number): Date {
  return new Date(d.getTime() + tzOffsetDk * 60_000);
}

export function fromLocal(d: Date, tzOffsetDk: number): Date {
  return new Date(d.getTime() - tzOffsetDk * 60_000);
}

export function normalizeShiftName(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function inferVardiyaTipi(ad: string, baslangicSaati: string, bitisSaati: string, _tzOffsetDk: number = VARDIYA_TZ_OFFSET_DK): VardiyaTipi {
  const normalizedName = normalizeShiftName(ad);
  if (normalizedName.includes('gece')) return 'gece';
  if (normalizedName.includes('gunduz')) return 'gunduz';

  const baslangic = parseClockToMinutes(baslangicSaati);
  const bitis = parseClockToMinutes(bitisSaati);
  if (baslangic > bitis) return 'gece';
  return baslangic >= (12 * 60) ? 'gece' : 'gunduz';
}

export function createDateForClock(reference: Date, clock: string, tzOffsetDk: number = VARDIYA_TZ_OFFSET_DK): Date {
  const [hour, minute] = clock.split(':').map(Number);
  const local = toLocal(reference, tzOffsetDk);
  return fromLocal(new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), hour, minute, 0, 0)), tzOffsetDk);
}

function addLocalDays(date: Date, days: number, tzOffsetDk: number): Date {
  const local = toLocal(date, tzOffsetDk);
  return fromLocal(new Date(Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() + days,
    local.getUTCHours(),
    local.getUTCMinutes(),
    local.getUTCSeconds(),
    local.getUTCMilliseconds(),
  )), tzOffsetDk);
}

function localMinutes(date: Date, tzOffsetDk: number): number {
  const local = toLocal(date, tzOffsetDk);
  return (local.getUTCHours() * 60) + local.getUTCMinutes();
}

export function buildShiftWindowForTime(time: Date, tanim: VardiyaTanimi, tzOffsetDk: number = VARDIYA_TZ_OFFSET_DK): { baslangic: Date; bitis: Date } {
  const baslangicMinutes = parseClockToMinutes(tanim.baslangicSaati);
  const bitisMinutes = parseClockToMinutes(tanim.bitisSaati);
  const currentMinutes = localMinutes(time, tzOffsetDk);
  const overnight = baslangicMinutes >= bitisMinutes;

  let baslangic = createDateForClock(time, tanim.baslangicSaati, tzOffsetDk);
  let bitis = createDateForClock(time, tanim.bitisSaati, tzOffsetDk);

  if (overnight) {
    if (currentMinutes >= baslangicMinutes) {
      bitis = addLocalDays(bitis, 1, tzOffsetDk);
    } else {
      baslangic = addLocalDays(baslangic, -1, tzOffsetDk);
    }
  }

  return { baslangic, bitis };
}

export function clampDate(date: Date, min: Date, max: Date): Date {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

function ymdLocal(date: Date, tzOffsetDk: number = VARDIYA_TZ_OFFSET_DK): string {
  const local = toLocal(date, tzOffsetDk);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function slotFromWindow(tanim: VardiyaTanimi, pencere: { baslangic: Date; bitis: Date }, tzOffsetDk: number = VARDIYA_TZ_OFFSET_DK): VardiyaSlot {
  return {
    gun: ymdLocal(pencere.baslangic, tzOffsetDk),
    vardiyaTipi: tanim.vardiyaTipi,
    baslangic: pencere.baslangic,
    bitis: pencere.bitis,
  };
}

export function assignVardiya(kayitTarihi: Date, tanimlar: VardiyaTanimi[], tzOffsetDk: number = VARDIYA_TZ_OFFSET_DK): VardiyaSlot {
  const gunduz = tanimlar.find((tanim) => tanim.vardiyaTipi === 'gunduz');
  const gece = tanimlar.find((tanim) => tanim.vardiyaTipi === 'gece');

  if (gunduz && gece) {
    const gunduzBaslangic = parseClockToMinutes(gunduz.baslangicSaati);
    const current = localMinutes(kayitTarihi, tzOffsetDk);
    const hybridEnd = gunduzBaslangic + 120;
    if (current >= gunduzBaslangic && current < hybridEnd) {
      const oncekiGeceReferans = addLocalDays(createDateForClock(kayitTarihi, gece.baslangicSaati, tzOffsetDk), -1, tzOffsetDk);
      return slotFromWindow(gece, buildShiftWindowForTime(oncekiGeceReferans, gece, tzOffsetDk), tzOffsetDk);
    }
  }

  for (const tanim of tanimlar) {
    const pencere = buildShiftWindowForTime(kayitTarihi, tanim, tzOffsetDk);
    if (kayitTarihi >= pencere.baslangic && kayitTarihi < pencere.bitis) {
      return slotFromWindow(tanim, pencere, tzOffsetDk);
    }
  }

  const fallback = tanimlar[0];
  if (!fallback) {
    throw new Error('vardiya_tanimi_yok');
  }
  return slotFromWindow(fallback, buildShiftWindowForTime(kayitTarihi, fallback, tzOffsetDk), tzOffsetDk);
}

export function vardiyaSlotKey(slot: VardiyaSlot, _tzOffsetDk: number = VARDIYA_TZ_OFFSET_DK): string {
  return `${slot.gun}-${slot.vardiyaTipi}`;
}

function operasyonKey(kayit: UretimKaydi): string {
  return `${kayit.operasyonId ?? 'null'}-${kayit.kalipId ?? 'null'}-${kayit.operasyonTipi ?? 'null'}`;
}

function addOperasyon(map: Map<string, OperasyonKirilim>, kayit: UretimKaydi) {
  const key = operasyonKey(kayit);
  const mevcut = map.get(key);
  if (mevcut) {
    mevcut.miktar += kayit.net;
    return;
  }
  map.set(key, {
    operasyonId: kayit.operasyonId,
    operasyonAdi: kayit.operasyonAdi,
    operasyonTipi: kayit.operasyonTipi,
    kalipId: kayit.kalipId,
    kalipKod: kayit.kalipKod,
    kalipAd: kayit.kalipAd,
    miktar: kayit.net,
  });
}

export function reduceOzet(kayitlar: UretimKaydi[]): ReduceOzet {
  const urunMap = new Map<string, UrunKirilim>();
  const operasyonMap = new Map<string, OperasyonKirilim>();
  const montajOperasyonMap = new Map<string, OperasyonKirilim>();
  let net = 0;
  let fire = 0;
  let baskiNet = 0;
  let baskiFire = 0;
  let montajNet = 0;
  let montajKayitSayisi = 0;
  let idealCalismaSn = 0;
  let hasCycle = false;

  for (const kayit of kayitlar) {
    net += kayit.net;
    fire += kayit.fire;

    const urun = urunMap.get(kayit.urunId);
    if (urun) {
      urun.miktar += kayit.net;
    } else {
      urunMap.set(kayit.urunId, {
        urunId: kayit.urunId,
        urunAd: kayit.urunAd,
        urunKod: kayit.urunKod,
        miktar: kayit.net,
      });
    }

    if (kayit.montaj) {
      montajNet += kayit.net;
      montajKayitSayisi += 1;
      addOperasyon(montajOperasyonMap, kayit);
    } else {
      baskiNet += kayit.net;
      baskiFire += kayit.fire;
      addOperasyon(operasyonMap, kayit);
      if (kayit.cevrimSn && kayit.cevrimSn > 0 && kayit.net > 0) {
        idealCalismaSn += kayit.net * kayit.cevrimSn;
        hasCycle = true;
      }
    }
  }

  const sortOperasyon = (items: OperasyonKirilim[]) =>
    items.sort((a, b) => b.miktar - a.miktar || a.operasyonAdi.localeCompare(b.operasyonAdi, 'tr'));

  return {
    net,
    fire,
    kayitSayisi: kayitlar.length,
    baskiNet,
    baskiFire,
    montajNet,
    montajKayitSayisi,
    urunKirilimi: Array.from(urunMap.values()),
    operasyonKirilimi: sortOperasyon(Array.from(operasyonMap.values())),
    montajOperasyonKirilimi: sortOperasyon(Array.from(montajOperasyonMap.values())),
    idealCalismaSn,
    hasCycle,
    ortCevrimSn: hasCycle && baskiNet > 0 ? idealCalismaSn / baskiNet : null,
  };
}

export function partitionByVardiya(kayitlar: UretimKaydi[], tanimlar: VardiyaTanimi[], tzOffsetDk: number = VARDIYA_TZ_OFFSET_DK): Map<string, UretimKaydi[]> {
  const map = new Map<string, UretimKaydi[]>();
  for (const kayit of kayitlar) {
    const slot = kayit.vardiyaSlotOverride ?? assignVardiya(kayit.kayitTarihi, tanimlar, tzOffsetDk);
    const key = vardiyaSlotKey(slot, tzOffsetDk);
    const existing = map.get(key);
    if (existing) existing.push(kayit);
    else map.set(key, [kayit]);
  }
  return map;
}

export function partitionByMakine(kayitlar: UretimKaydi[]): Map<string, UretimKaydi[]> {
  const map = new Map<string, UretimKaydi[]>();
  for (const kayit of kayitlar) {
    const existing = map.get(kayit.makineId);
    if (existing) existing.push(kayit);
    else map.set(kayit.makineId, [kayit]);
  }
  return map;
}
