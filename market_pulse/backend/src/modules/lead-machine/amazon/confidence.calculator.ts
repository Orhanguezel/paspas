import type { Confidence } from './amazon.types';

export function calculateConfidence(dataPoints: number): Confidence {
  if (dataPoints < 10) return 'INSUFFICIENT_DATA';
  if (dataPoints <= 30) return 'LOW';
  if (dataPoints <= 45) return 'MEDIUM';
  return 'HIGH';
}

export function canMakeDecision(confidence: Confidence) {
  return confidence === 'HIGH' || confidence === 'MEDIUM';
}
