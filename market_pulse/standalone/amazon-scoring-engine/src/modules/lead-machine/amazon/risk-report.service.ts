import { pool } from '@/db/client';

export async function getLatestAmazonRiskReport(keyword: string, marketplace = 'com') {
  const [rows] = await pool.execute(
    `SELECT ars.*, asj.keyword, asj.marketplace, asj.created_at AS scanned_at
     FROM amazon_risk_scores ars
     JOIN amazon_scan_jobs asj ON asj.id = ars.job_id
     WHERE asj.keyword = ? AND asj.marketplace = ?
     ORDER BY ars.created_at DESC
     LIMIT 1`,
    [keyword, marketplace],
  );
  const row = (rows as Record<string, unknown>[])[0];
  if (!row) return null;

  const [keepaRows] = await pool.execute(
    `SELECT aks.price_30d_min, aks.price_30d_max, aks.price_90d_avg
     FROM amazon_keepa_snapshots aks
     WHERE aks.asin IN (
       SELECT ap.asin FROM amazon_products ap WHERE ap.job_id = ? AND ap.asin IS NOT NULL
     )
     ORDER BY aks.fetched_at DESC
     LIMIT 20`,
    [String(row.job_id)],
  );
  const keepaTrend = buildKeepaTrend(keepaRows as Array<Record<string, unknown>>);

  return {
    keyword: row.keyword,
    scanned_at: row.scanned_at,
    data_points: Number(row.data_points ?? 0),
    scores: {
      category_risk: {
        score: Number(row.category_risk_score ?? 0),
        confidence: row.category_risk_confidence,
        reason: String(row.category_risk_reason ?? 'Kategori yoğunluğu ve satıcı dağılımı değerlendirildi.'),
      },
      sku_chaos: {
        score: Number(row.sku_chaos_score ?? 0),
        confidence: row.sku_chaos_confidence,
        reason: String(row.sku_chaos_reason ?? 'Fiyat aralığı, sigma ve varyant baskısı değerlendirildi.'),
      },
      price_war_risk: {
        score: Number(row.price_war_score ?? 0),
        confidence: row.price_war_confidence,
        reason: String(row.price_war_reason ?? 'Fiyat kırılımı ve düşük fiyat kümesi değerlendirildi.'),
      },
      brand_reliability: {
        score: Number(row.brand_reliability_score ?? 0),
        confidence: row.brand_reliability_confidence,
        reason: String(row.brand_reliability_reason ?? 'Marka tutarlılığı ve listing kalitesi değerlendirildi.'),
      },
      operational_risk: {
        score: Number(row.operational_risk_score ?? 0),
        confidence: row.operational_risk_confidence,
        reason: String(row.operational_risk_reason ?? 'Yorum problem skoru ve kritik şikayetler değerlendirildi.'),
      },
    },
    composite_score: row.composite_score === null || row.composite_score === undefined ? null : Number(row.composite_score),
    decision: row.decision,
    summary: row.summary ?? '',
    outreach_priority: row.outreach_priority !== null && row.outreach_priority !== undefined ? Number(row.outreach_priority) : 1,
    persuasion_points: row.persuasion_points
      ? (typeof row.persuasion_points === 'string' ? JSON.parse(row.persuasion_points) : row.persuasion_points) as string[]
      : [],
    brand_context: {
      brand_aggregated: false,
      brand_name: (row.brand_name as string | null) ?? null,
      sku_count: null,
    },
    enrichment: row.enrichment
      ? (typeof row.enrichment === 'string' ? JSON.parse(row.enrichment) : row.enrichment) as Record<string, unknown>
      : null,
    ...(keepaTrend.length ? { keepa_trend: keepaTrend } : {}),
  };
}

function buildKeepaTrend(rows: Array<Record<string, unknown>>) {
  const avg = (key: string) => {
    const values = rows
      .map((row) => Number(row[key]))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (!values.length) return null;
    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
  };
  const points = [
    { label: '30d min', price: avg('price_30d_min') },
    { label: '90d avg', price: avg('price_90d_avg') },
    { label: '30d max', price: avg('price_30d_max') },
  ];
  return points.filter((point): point is { label: string; price: number } => point.price !== null);
}
