'use client';

import { 
  AlertTriangle, 
  BarChart3, 
  CheckCircle2, 
  CircleAlert, 
  Clock, 
  ExternalLink, 
  Info, 
  Radar as RadarIcon, 
  Star, 
  TrendingUp, 
  Users,
  ShieldAlert
} from 'lucide-react';
import { 
  CartesianGrid, 
  Line, 
  LineChart, 
  PolarAngleAxis, 
  PolarGrid, 
  Radar, 
  RadarChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

function flagLabel(flag: string) {
  const labels: Record<string, string> = {
    return: 'İade şikayeti',
    quality: 'Kalite sorunu',
    broke: 'Kırılma sorunu',
    fit: 'Uyum problemi',
    slippery: 'Kayma problemi',
    smell: 'Koku şikayeti',
    thin: 'İnce malzeme',
    loose: 'Gevşek ürün',
    cheap: 'Ucuz kalite algısı',
    disappointed: 'Memnuniyetsizlik',
  };
  return labels[flag] ?? flag;
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

function DimensionRow({ label, item, flags }: { label: string; item: AmazonDimensionScore; flags?: string[] }) {
  const width = `${Math.min(100, Math.max(0, item.score * 10))}%`;
  const state = scoreStatus(item.score);
  return (
    <details className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4 transition-all duration-300 open:bg-gm-surface/20">
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
      <div className="mt-4 space-y-4">
        <div className="h-2 overflow-hidden rounded-full bg-gm-bg-deep">
          <div className={cn('h-full rounded-full transition-all duration-700', scoreColor(item.score))} style={{ width }} />
        </div>
        <p className="text-sm leading-6 text-gm-muted">{item.reason}</p>
        
        {flags && flags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {flags.map((flag) => (
              <Badge key={flag} variant="outline" className="rounded-full border-gm-error/20 bg-gm-error/5 text-[10px] text-gm-error">
                <AlertTriangle className="mr-1 size-3" />
                {flagLabel(flag)}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

export function RiskScoreCard({ report, compact }: { report: AmazonRiskReport; compact?: boolean }) {
  const Icon = report.decision === 'GUVENLI' ? CheckCircle2 : report.decision === 'GIRME' ? CircleAlert : AlertTriangle;
  const radarData = (Object.entries(report.scores) as Array<[keyof AmazonRiskReport['scores'], AmazonDimensionScore]>).map(([key, item]) => ({
    subject: DIMENSION_LABELS[key],
    A: item.score,
    fullMark: 10,
  }));
  const keepaTrend = report.keepa_trend;

  if (compact) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-gm-border-soft bg-gm-surface/10 p-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-gm-gold" />
          <span className="text-xs font-bold text-gm-text">{report.composite_score?.toFixed(1) ?? '—'}</span>
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
    <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CardContent className="space-y-8 p-8">
        {/* Header Section */}
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gm-gold/10 p-2 text-gm-gold">
                <RadarIcon className="size-6" />
              </div>
              <h2 className="font-serif text-3xl text-gm-text">Amazon Ticari Karar Motoru</h2>
            </div>
            <p className="text-base italic leading-7 text-gm-muted">{report.summary}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-surface/10 py-1 text-xs text-gm-muted">
                <Users className="mr-1.5 size-3.5" />
                {report.data_points} veri noktası
              </Badge>
              <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-surface/10 py-1 text-xs text-gm-muted">
                <Clock className="mr-1.5 size-3.5" />
                {new Date(report.scanned_at).toLocaleString('tr-TR')}
              </Badge>
            </div>
          </div>
          
          <div className="flex min-w-48 flex-col items-center justify-center rounded-[2rem] border border-gm-border-soft bg-gm-bg-deep/50 p-8 shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gm-muted">Composite Score</p>
            <p className="mt-2 font-serif text-6xl text-gm-text tracking-tighter">
              {report.composite_score?.toFixed(1) ?? '—'}
            </p>
            <Badge variant="outline" className={cn('mt-6 scale-110 rounded-full py-1.5 px-4 text-[10px] font-bold tracking-widest', decisionClass(report.decision))}>
              <Icon className="mr-2 size-4" />
              {DECISION_LABELS[report.decision] ?? report.decision}
            </Badge>
          </div>
        </div>

        {report.decision === 'MIXED_SIGNAL' ? (
          <div className="flex gap-4 rounded-3xl border border-gm-warning/30 bg-gm-warning/10 p-5 text-sm leading-7 text-gm-warning shadow-lg">
            <AlertTriangle className="mt-1 size-5 shrink-0" />
            <div>
              <p className="font-bold">Karışık Sinyal Tespit Edildi</p>
              <p className="opacity-90">Risk boyutları arasında belirgin tutarsızlık var. Bu durum genellikle "niche" kategorilerde veya veri kaynağı kısıtlı olduğunda görülür. Manuel inceleme önerilir.</p>
            </div>
          </div>
        ) : null}

        {/* Charts Section */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative h-80 rounded-[2.5rem] border border-gm-border-soft bg-gm-surface/5 p-6 shadow-xl overflow-hidden group">
            <div className="absolute top-6 left-6 z-10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gm-muted">Risk Profili (5 Boyut)</h3>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Radar
                  name="Risk"
                  dataKey="A"
                  stroke="#D4AF37"
                  fill="#D4AF37"
                  fillOpacity={0.4}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f1115', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#D4AF37' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
             <h3 className="text-xs font-bold uppercase tracking-widest text-gm-muted px-2">Risk Boyutları Detay</h3>
             <div className="grid gap-3">
              {(Object.entries(report.scores) as Array<[keyof AmazonRiskReport['scores'], AmazonDimensionScore]>).map(([key, item]) => (
                <DimensionRow 
                  key={key} 
                  label={DIMENSION_LABELS[key]} 
                  item={item} 
                  flags={key === 'operational_risk' ? report.problem_flags : undefined}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Enrichment Tabs Section */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 rounded-full bg-gm-bg-deep p-1">
            <TabsTrigger value="products" className="rounded-full data-[state=active]:bg-gm-gold data-[state=active]:text-black">Ürün Kanıtları</TabsTrigger>
            <TabsTrigger value="sellers" className="rounded-full data-[state=active]:bg-gm-gold data-[state=active]:text-black">Satıcılar</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-full data-[state=active]:bg-gm-gold data-[state=active]:text-black">Trendler</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6 space-y-4">
            <div className="rounded-[2rem] border border-gm-border-soft bg-gm-surface/5 overflow-hidden shadow-xl">
              <Table>
                <TableHeader className="bg-gm-bg-deep/50">
                  <TableRow className="border-gm-border-soft hover:bg-transparent">
                    <TableHead className="text-xs uppercase text-gm-muted">Ürün</TableHead>
                    <TableHead className="text-xs uppercase text-gm-muted">Fiyat</TableHead>
                    <TableHead className="text-xs uppercase text-gm-muted">Rating</TableHead>
                    <TableHead className="text-xs uppercase text-gm-muted">Yorum</TableHead>
                    <TableHead className="text-xs uppercase text-gm-muted">Satıcı</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.products?.map((p, idx) => (
                    <TableRow 
                      key={idx} 
                      className="border-gm-border-soft hover:bg-gm-surface/10 transition-colors cursor-pointer"
                      onClick={() => p.product_url && window.open(p.product_url, '_blank')}
                    >
                      <TableCell className="max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-gm-text">{p.title}</p>
                            <p className="text-[10px] text-gm-muted font-mono uppercase">{p.asin}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gm-text">
                        {p.price ? `$${p.price.toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="size-3 text-gm-gold fill-gm-gold" />
                          <span className="text-sm">{p.rating?.toFixed(1) ?? '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gm-muted">
                        {p.review_count?.toLocaleString('tr-TR')}
                      </TableCell>
                      <TableCell className="text-sm text-gm-muted truncate max-w-40">
                        {p.seller_name || 'Amazon'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {p.product_url && (
                          <a href={p.product_url} target="_blank" rel="noopener noreferrer" className="text-gm-muted hover:text-gm-gold transition-colors">
                            <ExternalLink className="size-4" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="sellers" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {report.top_sellers?.map((s, idx) => (
                <Card key={idx} className="border-gm-border-soft bg-gm-surface/5 rounded-3xl overflow-hidden hover:border-gm-gold/30 transition-all">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="rounded-full bg-gm-gold/10 p-2 text-gm-gold">
                        <Users className="size-5" />
                      </div>
                      <Badge variant="outline" className="rounded-full border-gm-gold/20 text-[10px] text-gm-gold">Top {idx + 1}</Badge>
                    </div>
                    <div>
                      <h4 className="font-serif text-lg text-gm-text truncate">{s.seller_name}</h4>
                      <p className="text-xs text-gm-muted mt-1 uppercase tracking-wider">{s.product_count} Ürün Yayında</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gm-border-soft">
                      <span className="text-xs text-gm-muted">Ort. Fiyat</span>
                      <span className="font-mono text-gm-text">{s.avg_price === null ? '—' : `$${s.avg_price.toFixed(2)}`}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {Array.isArray(keepaTrend) && keepaTrend.length > 0 ? (
                <div className="rounded-[2.5rem] border border-gm-border-soft bg-gm-surface/5 p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col">
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gm-muted">Fiyat Geçmişi (Keepa)</h3>
                      {report.buy_box_change_count !== undefined && (
                        <p className="text-[10px] text-gm-gold mt-1">Buy Box Değişimi: {report.buy_box_change_count}</p>
                      )}
                    </div>
                    <TrendingUp className="size-4 text-gm-gold" />
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={keepaTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f1115', borderColor: '#27272a', borderRadius: '12px' }}
                        />
                        <Line type="monotone" dataKey="price" stroke="#D4AF37" strokeWidth={3} dot={{ r: 4, fill: '#D4AF37', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <Card className="border-gm-border-soft bg-gm-surface/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="rounded-full bg-gm-bg-deep p-4 text-gm-muted">
                    <TrendingUp className="size-8" />
                  </div>
                  <p className="text-sm text-gm-muted max-w-xs">Bu keyword için henüz Keepa fiyat trend verisi toplanmadı.</p>
                </Card>
              )}

              <Card className="border-gm-border-soft bg-gm-surface/5 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
                <div className="flex items-center gap-3">
                   <Info className="size-5 text-gm-gold" />
                   <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gm-text">Bilgi Notu</h3>
                </div>
                <div className="space-y-4 text-sm leading-7 text-gm-muted italic">
                  <p>"Ürün Kanıtları" bölümü, risk puanı hesaplanırken kullanılan en yüksek etkili (en çok yorum alan) ürünleri gösterir.</p>
                  <p>"Satıcılar" bölümü, kategorideki pazar payı ve fiyat rekabeti oluşturan ana aktörleri listeler.</p>
                  {report.problem_flags && report.problem_flags.length > 0 && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-gm-error/10 p-3 text-gm-error not-italic">
                      <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold uppercase">Operasyonel risk altında kritik şikayetler tespit edildi.</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
