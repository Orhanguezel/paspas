import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../../market/__tests__/helpers/mock-db';
import type { AmazonProduct } from '../amazon.scraper';

const dbMock = createDbMock();

const env = {
  OXYLABS_USERNAME: 'user',
  OXYLABS_PASSWORD: 'pass',
  GROQ_API_KEY: '',
  OPENAI_API_KEY: '',
  KEEPA_API_KEY: '',
  KEEPA_DAILY_TOKEN_BUDGET: 1000,
};

const scrapeAmazonProductsMock = mock(async (): Promise<AmazonProduct[]> => makeProducts());
const analyzeProductReviewsMock = mock(async () => ({
  problem_flags: ['fit', 'quality', 'return'],
  problem_score: 7,
  ai_summary: 'Recurring fit and quality complaints.',
}));

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env }));

mock.module('../amazon.scraper', () => ({
  scrapeAmazonProducts: scrapeAmazonProductsMock,
}));

mock.module('../review.analyzer', () => ({
  analyzeProductReviews: analyzeProductReviewsMock,
}));

mock.module('../keepa.client', () => ({
  isKeepaConfigured: () => false,
  shouldFetchKeepa: () => false,
  enqueueKeepaAsins: async () => 0,
  processKeepaQueue: async () => ({ processed: 0, skippedByBudget: 0 }),
}));

const { runAmazonJob } = await import('../amazon.job');

beforeEach(() => {
  dbMock.reset();
  scrapeAmazonProductsMock.mockClear();
  scrapeAmazonProductsMock.mockImplementation(async () => makeProducts());
  analyzeProductReviewsMock.mockClear();
});

describe('amazon job e2e integration flow', () => {
  test('runs scrape to DB full-flow and persists dimension reasons', async () => {
    // getJob → SELECT FROM amazon_scan_jobs
    dbMock.queuePoolExecute([jobRow()]);

    await runAmazonJob('job-e2e');

    // scraper çağrıldı
    expect(scrapeAmazonProductsMock).toHaveBeenCalledWith('thermal labels', 'com', expect.any(Object));
    // review analizi çağrıldı
    expect(analyzeProductReviewsMock).toHaveBeenCalledTimes(1);

    // amazon_products INSERT (30 ürün)
    const productInserts = dbMock.poolExecutions.filter(e => e.sql.includes('INSERT INTO amazon_products'));
    expect(productInserts).toHaveLength(30);
    expect(productInserts[0]?.values).toEqual(expect.arrayContaining(['job-e2e', 'Thermal Label 1']));

    // amazon_category_stats UPSERT
    expect(dbMock.poolExecutions.some(e => e.sql.includes('amazon_category_stats'))).toBe(true);

    // amazon_risk_scores INSERT — 22 param, reason kolonları var
    const riskInsert = dbMock.poolExecutions.find(e => e.sql.includes('INSERT INTO amazon_risk_scores'));
    expect(riskInsert?.sql).toContain('category_risk_reason');
    expect(riskInsert?.sql).toContain('sku_chaos_reason');
    expect(riskInsert?.sql).toContain('price_war_reason');
    expect(riskInsert?.sql).toContain('brand_reliability_reason');
    expect(riskInsert?.sql).toContain('operational_risk_reason');
    // reason değerleri string olmalı (index 5, 8, 11, 14, 17)
    const vals = riskInsert?.values as unknown[];
    expect(vals?.[5]).toEqual(expect.any(String));
    expect(vals?.[8]).toEqual(expect.any(String));
    expect(vals?.[11]).toEqual(expect.any(String));
    expect(vals?.[14]).toEqual(expect.any(String));
    expect(vals?.[17]).toEqual(expect.any(String));

    // markJobDone → UPDATE amazon_scan_jobs (status='done' embedded in SQL)
    expect(dbMock.poolExecutions.some(e =>
      e.sql.includes("SET status = 'done'") && (e.values as unknown[])?.includes('job-e2e'),
    )).toBe(true);
  });

  test('records error log and marks job failed when scraper throws', async () => {
    dbMock.queuePoolExecute([jobRow()]);
    // logJobError → SELECT COUNT için
    dbMock.queuePoolExecute([{ count: 0 }]);

    scrapeAmazonProductsMock.mockImplementation(async () => {
      throw new Error('OXYLABS_AMAZON_SEARCH_FAILED_500');
    });

    await runAmazonJob('job-e2e');

    // error log kaydedildi
    expect(dbMock.poolExecutions.some(e => e.sql.includes('INSERT INTO amazon_job_error_logs'))).toBe(true);

    // markJobFailed → UPDATE amazon_scan_jobs SET status = 'failed', error_msg = ?, ...
    // values: [errorMsg, jobId]
    const failUpdate = dbMock.poolExecutions.find(e =>
      e.sql.includes("SET status = 'failed'") && (e.values as unknown[])?.includes('job-e2e'),
    );
    expect(failUpdate).toBeDefined();
    expect((failUpdate?.values as string[])?.[0]).toBe('OXYLABS_AMAZON_SEARCH_FAILED_500');
  });

  test('insufficient data job completes without throwing', async () => {
    dbMock.queuePoolExecute([jobRow()]);
    // 0 ürün döner → filterEligibleProducts sonrası data_points = 0
    scrapeAmazonProductsMock.mockImplementation(async () => []);

    await expect(runAmazonJob('job-e2e')).resolves.toBeUndefined();

    const riskInsert = dbMock.poolExecutions.find(e => e.sql.includes('INSERT INTO amazon_risk_scores'));
    expect(riskInsert).toBeDefined();
    const vals = riskInsert?.values as unknown[];
    // decision: INSUFFICIENT_DATA, composite_score: null
    expect(vals?.[19]).toBe('INSUFFICIENT_DATA');
    expect(vals?.[18]).toBeNull();
  });
});

function jobRow() {
  return {
    id: 'job-e2e',
    keyword: 'thermal labels',
    marketplace: 'com',
    status: 'pending',
  };
}

function makeProducts(): AmazonProduct[] {
  return Array.from({ length: 30 }, (_, index) => ({
    product_title: `Thermal Label ${index + 1}`,
    price: 34 + (index >= 20 ? -8 : index >= 10 ? -3 : 0) + (index % 5),
    rating: 4.1 + ((index % 4) * 0.1),
    review_count: 80 + (index * 9),
    product_url: `https://www.amazon.com/dp/B0E2E${String(index).padStart(5, '0')}`,
    seller_name: `Seller ${index % 12}`,
    seller_url: `https://www.amazon.com/sp?seller=${index % 12}`,
  }));
}
