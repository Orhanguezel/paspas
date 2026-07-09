export type VardiyaTipi = 'gunduz' | 'gece';

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

export function normalizeShiftName(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function inferVardiyaTipi(ad: string, baslangicSaati: string, bitisSaati: string): VardiyaTipi {
  const normalizedName = normalizeShiftName(ad);
  if (normalizedName.includes('gece')) return 'gece';
  if (normalizedName.includes('gunduz')) return 'gunduz';

  const baslangic = parseClockToMinutes(baslangicSaati);
  const bitis = parseClockToMinutes(bitisSaati);
  if (baslangic > bitis) return 'gece';
  return baslangic >= (12 * 60) ? 'gece' : 'gunduz';
}

export function createDateForClock(reference: Date, clock: string): Date {
  const [hour, minute] = clock.split(':').map(Number);
  const date = new Date(reference);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function buildShiftWindowForTime(time: Date, tanim: VardiyaTanimi): { baslangic: Date; bitis: Date } {
  const baslangicMinutes = parseClockToMinutes(tanim.baslangicSaati);
  const bitisMinutes = parseClockToMinutes(tanim.bitisSaati);
  const currentMinutes = (time.getHours() * 60) + time.getMinutes();
  const overnight = baslangicMinutes >= bitisMinutes;

  const baslangic = createDateForClock(time, tanim.baslangicSaati);
  const bitis = createDateForClock(time, tanim.bitisSaati);

  if (overnight) {
    if (currentMinutes >= baslangicMinutes) {
      bitis.setDate(bitis.getDate() + 1);
    } else {
      baslangic.setDate(baslangic.getDate() - 1);
    }
  }

  return { baslangic, bitis };
}

export function clampDate(date: Date, min: Date, max: Date): Date {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

function ymdLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function slotFromWindow(tanim: VardiyaTanimi, pencere: { baslangic: Date; bitis: Date }): VardiyaSlot {
  return {
    gun: ymdLocal(pencere.baslangic),
    vardiyaTipi: tanim.vardiyaTipi,
    baslangic: pencere.baslangic,
    bitis: pencere.bitis,
  };
}

export function assignVardiya(kayitTarihi: Date, tanimlar: VardiyaTanimi[]): VardiyaSlot {
  const gunduz = tanimlar.find((tanim) => tanim.vardiyaTipi === 'gunduz');
  const gece = tanimlar.find((tanim) => tanim.vardiyaTipi === 'gece');

  if (gunduz && gece) {
    const gunduzBaslangic = parseClockToMinutes(gunduz.baslangicSaati);
    const current = (kayitTarihi.getHours() * 60) + kayitTarihi.getMinutes();
    const hybridEnd = gunduzBaslangic + 120;
    if (current >= gunduzBaslangic && current < hybridEnd) {
      const oncekiGeceReferans = createDateForClock(kayitTarihi, gece.baslangicSaati);
      if (parseClockToMinutes(gece.baslangicSaati) < gunduzBaslangic) {
        oncekiGeceReferans.setDate(oncekiGeceReferans.getDate() - 1);
      } else {
        oncekiGeceReferans.setDate(oncekiGeceReferans.getDate() - 1);
      }
      return slotFromWindow(gece, buildShiftWindowForTime(oncekiGeceReferans, gece));
    }
  }

  for (const tanim of tanimlar) {
    const pencere = buildShiftWindowForTime(kayitTarihi, tanim);
    if (kayitTarihi >= pencere.baslangic && kayitTarihi < pencere.bitis) {
      return slotFromWindow(tanim, pencere);
    }
  }

  const fallback = tanimlar[0];
  if (!fallback) {
    throw new Error('vardiya_tanimi_yok');
  }
  return slotFromWindow(fallback, buildShiftWindowForTime(kayitTarihi, fallback));
}

export function vardiyaSlotKey(slot: VardiyaSlot): string {
  return `${slot.vardiyaTipi}-${slot.baslangic.toISOString()}`;
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

export function partitionByVardiya(kayitlar: UretimKaydi[], tanimlar: VardiyaTanimi[]): Map<string, UretimKaydi[]> {
  const map = new Map<string, UretimKaydi[]>();
  for (const kayit of kayitlar) {
    const slot = assignVardiya(kayit.kayitTarihi, tanimlar);
    const key = vardiyaSlotKey(slot);
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
