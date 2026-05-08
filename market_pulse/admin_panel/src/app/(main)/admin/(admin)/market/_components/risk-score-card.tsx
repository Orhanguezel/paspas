'use client';

import { AlertTriangle, BarChart3, CheckCircle2, CircleAlert } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AmazonDimensionScore, AmazonRiskReport } from '@/integrations/endpoints/admin/market_admin.endpoints';
import { cn } from '@/lib/utils';

const DECISION_LABELS: Record<string, string> = {
  GUVENLI: 'Güvenli',
  DIKKATLI_OL: 'Dikkatli Ol',
  GIRME: 'Girme',
  MIXED_SIGNAL: 'Karışık Sinyal',
  INSUFFICIENT_DATA: 'Yetersiz Veri',
};

const DIMENSION_LABELS: Record<keyof AmazonRiskReport['scores'], string> = {
  category_risk: 'Kategori Riski',
  sku_chaos: 'SKU Karmaşası',
  price_war_risk: 'Fiyat Savaşı',
  brand_reliability: 'Marka Güveni',
  operational_risk: 'Operasyonel Risk',
};

function decisionClass(decision: string) {
  if (decision === 'GUVENLI') return 'border-gm-success/40 bg-gm-success/10 text-gm-success';
  if (decision === 'DIKKATLI_OL' || decision === 'MIXED_SIGNAL') return 'border-gm-warning/40 bg-gm-warning/10 text-gm-warning';
  if (decision === 'GIRME') return 'border-gm-error/40 bg-gm-error/10 text-gm-error';
  return 'border-gm-border-soft bg-gm-surface/20 text-gm-muted';
}

function scoreColor(score: number) {
  if (score <= 3) return 'bg-gm-success';
  if (score <= 6) return 'bg-gm-warning';
  return 'bg-gm-error';
}

function scoreStatus(score: number): 'GUVENLI' | 'DIKKATLI_OL' | 'GIRME' {
  if (score <= 3) return 'GUVENLI';
  if (score <= 6) return 'DIKKATLI_OL';
  return 'GIRME';
}

function scoreStatusClass(status: 'GUVENLI' | 'DIKKATLI_OL' | 'GIRME') {
  if (status === 'GUVENLI') return 'border-gm-success/40 bg-gm-success/10 text-gm-success';
  if (status === 'DIKKATLI_OL') return 'border-gm-warning/40 bg-gm-warning/10 text-gm-warning';
  return 'border-gm-error/40 bg-gm-error/10 text-gm-error';
}

function DimensionRow({ label, item }: { label: string; item: AmazonDimensionScore }) {
  const width = `${Math.min(100, Math.max(0, item.score * 10))}%`;
  const state = scoreStatus(item.score);
  return (
    <details className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-lg text-gm-text">{label}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', scoreStatusClass(state))}>
              {DECISION_LABELS[state]}
            </Badge>
            <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-bg-deep/50 text-[9px] font-bold uppercase tracking-widest text-gm-muted">
              {item.confidence}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="rounded-full border-gm-border-soft bg-gm-bg-deep/50 font-mono text-gm-text">
            {item.score.toFixed(1)}
          </Badge>
        </div>
      </summary>
      <div className="mt-4 space-y-3">
        <div className="h-2 overflow-hidden rounded-full bg-gm-bg-deep">
          <div className={cn('h-full rounded-full', scoreColor(item.score))} style={{ width }} />
        </div>
        <p className="text-sm leading-6 text-gm-muted">{item.reason}</p>
      </div>
    </details>
  );
}

export function RiskScoreCard({ report, compact }: { report: AmazonRiskReport; compact?: boolean }) {
  const Icon = report.decision === 'GUVENLI' ? CheckCircle2 : report.decision === 'GIRME' ? CircleAlert : AlertTriangle;
  const chartData = (Object.entries(report.scores) as Array<[keyof AmazonRiskReport['scores'], AmazonDimensionScore]>).map(([key, item]) => ({
    name: DIMENSION_LABELS[key],
    score: Number(item.score.toFixed(1)),
  }));
  const keepaTrend = (report as AmazonRiskReport & { keepa_trend?: Array<{ label: string; price: number }> }).keepa_trend;

  if (compact) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-gm-border-soft bg-gm-surface/10 p-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-gm-gold" />
          <span className="text-xs font-bold text-gm-text">{report.composite_score?.toFixed(1) ?? '-'}</span>
        </div>
        <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', decisionClass(report.decision))}>
          <Icon className="mr-1 size-3" />
          {DECISION_LABELS[report.decision] ?? report.decision}
        </Badge>
        <span className="text-[10px] text-gm-muted">Data: {report.data_points}</span>
      </div>
    );
  }

  return (
    <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl">
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <BarChart3 className="size-5 text-gm-gold" />
              <h2 className="font-serif text-2xl text-gm-text">5 Boyutlu Risk Raporu</h2>
            </div>
            <p className="text-sm leading-6 text-gm-muted">{report.summary}</p>
          </div>
          <div className="min-w-40 rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Composite</p>
            <p className="mt-2 font-serif text-4xl text-gm-text">{report.composite_score?.toFixed(1) ?? '-'}</p>
            <Badge variant="outline" className={cn('mt-3 rounded-full', decisionClass(report.decision))}>
              <Icon className="mr-1 size-3" />
              {DECISION_LABELS[report.decision] ?? report.decision}
            </Badge>
          </div>
        </div>

        {report.decision === 'MIXED_SIGNAL' ? (
          <div className="flex gap-3 rounded-2xl border border-gm-warning/30 bg-gm-warning/10 p-4 text-sm leading-6 text-gm-warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>Risk boyutları birbirini doğrulamıyor. Bu sonuç otomatik karar yerine manuel kontrol gerektirir.</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-surface/10 text-gm-muted">
            Data points: {report.data_points}
          </Badge>
          <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-surface/10 text-gm-muted">
            {new Date(report.scanned_at).toLocaleString('tr-TR')}
          </Badge>
        </div>

        <div className="h-64 rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} interval={0} angle={-12} textAnchor="end" height={64} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip />
              <Bar dataKey="score" fill="#D4AF37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {Array.isArray(keepaTrend) && keepaTrend.length > 0 ? (
          <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Keepa Fiyat Trendi</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {keepaTrend.map((point) => (
                <Badge key={point.label} variant="outline" className="rounded-full border-gm-border-soft bg-gm-bg-deep/50 text-gm-text">
                  {point.label}: {point.price}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 xl:grid-cols-2">
          {(Object.entries(report.scores) as Array<[keyof AmazonRiskReport['scores'], AmazonDimensionScore]>).map(([key, item]) => (
            <DimensionRow key={key} label={DIMENSION_LABELS[key]} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
