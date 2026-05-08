import type { AmazonScoreInput, DimensionScore } from '../amazon.types';
import { calculateConfidence } from '../confidence.calculator';

export function scoreCategoryRisk(input: AmazonScoreInput): DimensionScore {
  const { stats, products } = input;
  const dataPoints = products.length;
  const confidence = calculateConfidence(dataPoints);

  if (confidence === 'INSUFFICIENT_DATA') {
    return { score: 0, confidence, reason: 'Yetersiz veri: kategori analizi yapılamadı.' };
  }

  const reasons: string[] = [];
  let score = 0;

  // Satıcı yoğunluğu: 50+ satıcı yüksek rekabet
  const sellerDensityScore = Math.min(10, (stats.sellerCount / 5));
  score += sellerDensityScore * 0.4;
  if (stats.sellerCount > 50) reasons.push(`Yüksek satıcı yoğunluğu (${stats.sellerCount} satıcı)`);

  // Dominant brand oranı: tek marka %40+ pazar payına sahipse yüksek engel
  const brandScore = stats.dominantBrandRatio > 0.4 ? 8 : stats.dominantBrandRatio > 0.25 ? 5 : 2;
  score += brandScore * 0.35;
  if (stats.dominantBrandRatio > 0.4) reasons.push(`Dominant marka oranı yüksek (%${Math.round(stats.dominantBrandRatio * 100)})`);

  // Review dağılımı: çoğu ürün 500+ yorumsa giriş zorlaşır
  const highReviewProducts = products.filter(p => (p.review_count ?? 0) > 500).length;
  const highReviewRatio = dataPoints > 0 ? highReviewProducts / dataPoints : 0;
  const reviewBarrierScore = highReviewRatio > 0.5 ? 8 : highReviewRatio > 0.25 ? 5 : 2;
  score += reviewBarrierScore * 0.25;
  if (highReviewRatio > 0.5) reasons.push('Ürünlerin yarısından fazlasında 500+ yorum mevcut');

  const final = Math.min(10, Math.round(score * 10) / 10);
  return {
    score: final,
    confidence,
    reason: reasons.length > 0 ? reasons.join('; ') : 'Normal kategori yoğunluğu.',
  };
}
