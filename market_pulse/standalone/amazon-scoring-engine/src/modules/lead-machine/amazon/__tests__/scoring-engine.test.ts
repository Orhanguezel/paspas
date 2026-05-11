import { describe, expect, test } from 'bun:test';
import { scoreAmazonCategory } from '../amazon.scoring-engine';
import { products } from './fixtures/scoring-fixtures';

describe('amazon scoring engine', () => {
  test('creates full 5-dimensional risk report', () => {
    const report = scoreAmazonCategory({
      keyword: 'silikon paspas',
      marketplace: 'de',
      products: products(50),
      reviewProblemScore: 6,
      reviewProblemFlags: ['quality', 'return'],
    });

    expect(report.keyword).toBe('silikon paspas');
    expect(report.data_points).toBe(50);
    expect(report.scores.category_risk.confidence).toBe('HIGH');
    expect(report.composite_score).toBeNumber();
    expect(['GUVENLI', 'DIKKATLI_OL', 'GIRME', 'MIXED_SIGNAL']).toContain(report.decision);
  });

  test('includes outreach_priority between 1 and 10', () => {
    const report = scoreAmazonCategory({
      keyword: 'silikon paspas',
      marketplace: 'de',
      products: products(50),
    });

    expect(report.outreach_priority).toBeGreaterThanOrEqual(1);
    expect(report.outreach_priority).toBeLessThanOrEqual(10);
  });

  test('includes non-empty persuasion_points', () => {
    const report = scoreAmazonCategory({
      keyword: 'silikon paspas',
      marketplace: 'de',
      products: products(50),
      reviewProblemScore: 7,
    });

    expect(Array.isArray(report.persuasion_points)).toBe(true);
    expect(report.persuasion_points.length).toBeGreaterThan(0);
  });

  test('includes brand_context and enrichment defaults', () => {
    const report = scoreAmazonCategory({ keyword: 'test', marketplace: 'de', products: products(50) });

    expect(report.brand_context.brand_aggregated).toBe(false);
    expect(report.brand_context.brand_name).toBeNull();
    expect(report.enrichment).toBeNull();
  });

  test('does not create composite score when confidence is insufficient', () => {
    const report = scoreAmazonCategory({ keyword: 'x', marketplace: 'de', products: products(5) });

    expect(report.composite_score).toBeNull();
    expect(report.decision).toBe('INSUFFICIENT_DATA');
  });
});
