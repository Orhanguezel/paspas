import { canMakeDecision } from './confidence.calculator';
import type { AmazonRiskReport, Decision, DimensionScore } from './amazon.types';

export type CompositeWeights = {
  category_risk: number;
  price_war_risk: number;
  sku_chaos: number;
  brand_reliability: number;
  operational_risk: number;
};

export const defaultCompositeWeights: CompositeWeights = {
  category_risk: 0.25,
  price_war_risk: 0.25,
  sku_chaos: 0.20,
  brand_reliability: 0.15,
  operational_risk: 0.15,
};

export class CompositeScorer {
  constructor(private readonly weights: CompositeWeights = defaultCompositeWeights) {}

  score(scores: AmazonRiskReport['scores']) {
    const entries = Object.entries(scores) as Array<[keyof CompositeWeights, DimensionScore]>;
    const usable = entries.filter(([, value]) => canMakeDecision(value.confidence));
    if (!usable.length) {
      return { compositeScore: null, decision: 'INSUFFICIENT_DATA' as const };
    }

    const weightTotal = usable.reduce((sum, [key]) => sum + this.weights[key], 0);
    const weighted = usable.reduce((sum, [key, value]) => sum + value.score * this.weights[key], 0);
    const compositeScore = Number((weighted / weightTotal).toFixed(1));
    return { compositeScore, decision: decide(compositeScore) };
  }
}

export function decide(score: number): Decision {
  if (score <= 3) return 'GUVENLI';
  if (score <= 6) return 'DIKKATLI_OL';
  return 'GIRME';
}
