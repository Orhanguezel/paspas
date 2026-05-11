import type { AmazonRiskReport } from './amazon.types';
import { FILTER_CONFIG, MIXED_SIGNAL_CONFIG as MS } from './scoring.config';

export function filterEligibleProducts<T extends { review_count?: number }>(products: T[]) {
  return products.filter((product) => (product.review_count ?? 0) >= FILTER_CONFIG.MIN_REVIEW_COUNT);
}

export function validateSignals(report: Pick<AmazonRiskReport, 'scores' | 'decision'>, context: { pageCount?: number; hasPriceData?: boolean } = {}) {
  const dimensionScores = Object.values(report.scores).map((item) => item.score);
  const highCount = dimensionScores.filter((score) => score >= MS.HIGH_SCORE_MIN).length;
  const lowCount = dimensionScores.filter((score) => score <= MS.LOW_SCORE_MAX).length;
  const notes: string[] = [];
  let decision = report.decision;

  if (highCount === MS.HIGH_COUNT_TRIGGER && lowCount >= MS.LOW_COUNT_TRIGGER) {
    decision = 'MIXED_SIGNAL';
    notes.push('Tek sinyal yüksek, diğer sinyaller düşük; manuel kontrol gerekir.');
  }
  if (context.pageCount === 1) notes.push('Tek sayfa sonuç var; kategori analizi referans amaçlıdır.');
  if (context.hasPriceData === false) notes.push('Fiyat verisi eksik; price war skoru karar dışı bırakılmalıdır.');

  return { decision, notes };
}
