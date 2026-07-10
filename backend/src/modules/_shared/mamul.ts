export type Taraf = 'sag' | 'sol' | 'parca';

export interface MamulEmri {
  id: string;
  partiNo: string;
  mamulUrunId: string;
  urunId: string;
  taraf: Taraf | null;
  planlananMiktar: number;
  uretilenMiktar: number;
  durum: string;
}

export interface MamulGrup<T extends MamulEmri = MamulEmri> {
  key: string;
  partiNo: string;
  mamulUrunId: string;
  emirler: T[];
}

export function mamulGrupKey(emir: Pick<MamulEmri, 'partiNo' | 'mamulUrunId'>): string {
  return `${emir.partiNo}::${emir.mamulUrunId}`;
}

export function groupByMamul<T extends MamulEmri>(emirler: T[]): MamulGrup<T>[] {
  const groups = new Map<string, MamulGrup<T>>();
  for (const emir of emirler) {
    const key = mamulGrupKey(emir);
    const existing = groups.get(key);
    if (existing) {
      existing.emirler.push(emir);
      continue;
    }
    groups.set(key, {
      key,
      partiNo: emir.partiNo,
      mamulUrunId: emir.mamulUrunId,
      emirler: [emir],
    });
  }
  return [...groups.values()];
}

const TARAF_SIRASI: Record<Taraf, number> = { sag: 0, sol: 1, parca: 2 };

export function taraflar<T extends MamulEmri>(grup: MamulGrup<T>): T[] {
  return [...grup.emirler].sort((a, b) => {
    const aSira = a.taraf ? TARAF_SIRASI[a.taraf] : 3;
    const bSira = b.taraf ? TARAF_SIRASI[b.taraf] : 3;
    return aSira - bSira;
  });
}

export function grupPlanlanan(grup: MamulGrup): number {
  const miktarlar = new Set(grup.emirler.map((emir) => emir.planlananMiktar));
  if (miktarlar.size !== 1) {
    throw new Error(`asimetrik_planlanan_miktar:${grup.key}`);
  }
  return grup.emirler[0]?.planlananMiktar ?? 0;
}
