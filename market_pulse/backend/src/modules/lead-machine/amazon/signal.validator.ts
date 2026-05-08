import type { AmazonRiskReport } from './amazon.types';

export function filterEligibleProducts<T extends { review_count?: number }>(products: T[]) {
  return products.filter((product) => (product.review_count ?? 0) >= 10);
}

export function validateSignals(report: AmazonRiskReport, context: { pageCount?: number; hasPriceData?: boolean } = {}) {
  const dimensionScores = Object.values(report.scores).map((item) => item.score);
  const highCount = dimensionScores.filter((score) => score >= 7).length;
  const lowCount = dimensionScores.filter((score) => score <= 3).length;
  const notes: string[] = [];
  let decision = report.decision;

  if (highCount === 1 && lowCount >= 3) {
    decision = 'MIXED_SIGNAL';
    notes.push('Tek sinyal yüksek, diğer sinyaller düşük; manuel kontrol gerekir.');
  }
  if (context.pageCount === 1) notes.push('Tek sayfa sonuç var; kategori analizi referans amaçlıdır.');
  if (context.hasPriceData === false) notes.push('Fiyat verisi eksik; price war skoru karar dışı bırakılmalıdır.');

  return { decision, notes };
}
