export type Taraf = 'sag' | 'sol' | 'parca';

export interface MamulEmri {
  id: string;
  partiNo: string | null;
  mamulUrunId: string;
  urunId: string;
  taraf: Taraf | null;
  planlananMiktar: number;
  uretilenMiktar: number;
  durum: string;
}

export interface MamulGrup<T extends MamulEmri = MamulEmri> {
  key: string;
  partiNo: string | null;
  mamulUrunId: string;
  emirler: T[];
}

export function mamulGrupKey(emir: Pick<MamulEmri, 'id' | 'partiNo' | 'mamulUrunId'>): string {
  // Partisiz emirler tek kovada birleştirilmez — her emir kendi grubudur.
  // Canlı doğrulama (2026-08-18): partisiz kayıtların hiçbiri gerçek Sağ/Sol
  // çifti değil; ortak kova alakasız emirleri aynı gruba sokar.
  // Admin panel eşleniği: admin_panel/src/integrations/shared/erp/uretim_emirleri.types.ts
  if (!emir.partiNo) return `emir::${emir.id}`;
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
  // Asimetrik planlanan miktar canlıda gerçekleşebilir (kısmi revizyon vb.) —
  // hata fırlatılmaz; en büyük hedef döner, asimetri `grupAsimetrik` ile sorgulanır.
  // (Önceki davranış `asimetrik_planlanan_miktar` throw'uydu; canlıda partisiz
  // kayıtların yanlış gruplanmasıyla birleşince admin listesini çökertti — 2026-08-18.)
  return grup.emirler.reduce((max, emir) => Math.max(max, emir.planlananMiktar), 0);
}

export function grupAsimetrik(grup: MamulGrup): boolean {
  return new Set(grup.emirler.map((emir) => emir.planlananMiktar)).size > 1;
}
