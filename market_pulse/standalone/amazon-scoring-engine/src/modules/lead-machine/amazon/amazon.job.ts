import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { getJob, markJobRunning, markJobDone, markJobFailed } from '@/db/job-store';
import { analyzeProductReviews } from './review.analyzer';
import { scrapeAmazonProducts, type AmazonFilters } from './amazon.scraper';
import type { AmazonProduct } from './amazon.scraper';
import { filterEligibleProducts, deduplicateByAsin } from './signal.validator';
import { scoreAmazonCategory } from './amazon.scoring-engine';
import { calculateCategoryStats, upsertAmazonCategoryStats } from './category.normalizer';
import { shouldFetchKeepa, enqueueKeepaAsins, processKeepaQueue, isKeepaConfigured } from './keepa.client';
import type { AmazonRiskReport } from './amazon.types';

interface AmazonJobParams extends AmazonFilters {
  keyword?: string;
  marketplace?: string;
}

function extractAsin(productUrl?: string | null) {
  return productUrl?.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/)?.[1] ?? null;
}

async function saveAmazonProducts(jobId: string, products: AmazonProduct[]) {
  for (const product of products) {
    await pool.execute(
      `INSERT INTO amazon_products (
        id, job_id, title, price, rating, review_count, seller_name, seller_url, product_url, asin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(), jobId,
        product.product_title,
        product.price ?? null,
        product.rating ?? null,
        product.review_count ?? 0,
        product.seller_name ?? null,
        product.seller_url ?? null,
        product.product_url ?? null,
        extractAsin(product.product_url),
      ],
    );
  }
}

async function saveRiskScore(jobId: string, report: AmazonRiskReport) {
  const id = randomUUID();
  await pool.execute(
    `INSERT INTO amazon_risk_scores (
      id, job_id, keyword,
      category_risk_score, category_risk_confidence, category_risk_reason,
      sku_chaos_score, sku_chaos_confidence, sku_chaos_reason,
      price_war_score, price_war_confidence, price_war_reason,
      brand_reliability_score, brand_reliability_confidence, brand_reliability_reason,
      operational_risk_score, operational_risk_confidence, operational_risk_reason,
      composite_score, decision, summary, data_points,
      outreach_priority, persuasion_points, brand_id, brand_name, enrichment
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, jobId, report.keyword,
      report.scores.category_risk.score,     report.scores.category_risk.confidence,    report.scores.category_risk.reason,
      report.scores.sku_chaos.score,         report.scores.sku_chaos.confidence,         report.scores.sku_chaos.reason,
      report.scores.price_war_risk.score,    report.scores.price_war_risk.confidence,    report.scores.price_war_risk.reason,
      report.scores.brand_reliability.score, report.scores.brand_reliability.confidence, report.scores.brand_reliability.reason,
      report.scores.operational_risk.score,  report.scores.operational_risk.confidence,  report.scores.operational_risk.reason,
      report.composite_score, report.decision, report.summary, report.data_points,
      report.outreach_priority,
      JSON.stringify(report.persuasion_points),
      null,
      report.brand_context.brand_name,
      report.enrichment !== null ? JSON.stringify(report.enrichment) : null,
    ],
  );
}

async function logJobError(jobId: string, errorMessage: string): Promise<void> {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count FROM amazon_job_error_logs WHERE job_id = ?`,
    [jobId],
  );
  const previous = Number((rows as Array<{ count?: number | string }>)[0]?.count ?? 0);
  const errorType = errorMessage.split(':')[0].slice(0, 100) || 'UNKNOWN_ERROR';
  await pool.execute(
    `INSERT INTO amazon_job_error_logs (id, job_id, error_type, error_msg, retry_count) VALUES (?, ?, ?, ?, ?)`,
    [randomUUID(), jobId, errorType, errorMessage, previous + 1],
  );
}

export async function runAmazonJob(jobId: string) {
  const job = await getJob(jobId);
  if (!job) throw new Error('JOB_NOT_FOUND');

  const keyword = job.keyword;
  const marketplace = job.marketplace;
  const params = {} as AmazonJobParams;

  await markJobRunning(jobId);

  try {
    const allProducts = await scrapeAmazonProducts(keyword, marketplace, params);
    const deduped = deduplicateByAsin(allProducts);
    const eligible = filterEligibleProducts(deduped);
    await saveAmazonProducts(jobId, eligible);

    const categoryStats = calculateCategoryStats(keyword, marketplace, eligible);
    await upsertAmazonCategoryStats(categoryStats);

    const page1Prices = allProducts.slice(0, 10).map(p => p.price).filter((p): p is number => typeof p === 'number');
    const page3Prices = allProducts.slice(20, 30).map(p => p.price).filter((p): p is number => typeof p === 'number');
    const pageOneAvg   = page1Prices.length ? page1Prices.reduce((a, b) => a + b, 0) / page1Prices.length : null;
    const pageThreeAvg = page3Prices.length ? page3Prices.reduce((a, b) => a + b, 0) / page3Prices.length : null;

    const firstWithUrl = eligible.find(p => p.product_url);
    const reviewAnalysis = firstWithUrl?.product_url
      ? await analyzeProductReviews(firstWithUrl.product_url, marketplace).catch(() => ({ problem_flags: [], problem_score: 0, ai_summary: '' }))
      : { problem_flags: [], problem_score: 0, ai_summary: '' };

    const report = scoreAmazonCategory({
      keyword,
      marketplace,
      products: eligible,
      pageOneAveragePrice: pageOneAvg,
      pageThreeAveragePrice: pageThreeAvg,
      reviewProblemScore: reviewAnalysis.problem_score,
      reviewProblemFlags: reviewAnalysis.problem_flags,
    });

    await saveRiskScore(jobId, report);

    if (
      isKeepaConfigured()
      && shouldFetchKeepa({ confidence: report.scores.price_war_risk.confidence, score: report.composite_score })
    ) {
      const asins = eligible.map(p => extractAsin(p.product_url)).filter(Boolean) as string[];
      await enqueueKeepaAsins(jobId, asins.slice(0, 20));
      await processKeepaQueue(20);
    }

    await markJobDone(jobId, report.data_points);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN_ERROR';
    try { await logJobError(jobId, msg); } catch { /* log hatası ana akışı engellemez */ }
    await markJobFailed(jobId, msg);
  }
}
