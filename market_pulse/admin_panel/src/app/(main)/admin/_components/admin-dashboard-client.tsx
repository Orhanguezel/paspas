'use client';

// =============================================================
// FILE: src/app/(main)/admin/_components/admin-dashboard-client.tsx
// FINAL — Admin Dashboard (POLISHED)
// Tema: design tokens (site_settings / CSS variables)
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import { RefreshCcw, TrendingUp, Users, Calendar, Wallet, ArrowRight, Activity, ShieldCheck } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

import { useGetDashboardSummaryAdminQuery } from '@/integrations/hooks';
import type { DashboardRangeKey } from '@/integrations/shared';

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { useAdminSettings } from './admin-settings-provider';

const ROUTE_MAP: Record<string, string> = {
  site_settings: '/admin/site-settings',
  users: '/admin/users',
  user_roles: '/admin/user-roles',
  notifications: '/admin/notifications',
  market: '/admin/market',
};

const KPI_CHART_CONFIG = {
  revenue_total: { label: 'Gelir', color: 'var(--gm-gold)' },
} satisfies ChartConfig;

const SERVICE_CHART_CONFIG = {
  bookings_total: { label: 'Randevu', color: 'var(--gm-primary)' },
} satisfies ChartConfig;

const RANGES: DashboardRangeKey[] = ['7d', '30d', '90d'];

function formatMoney(v: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(v || 0);
}

function labelForBucket(v: string): string {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
}

export default function AdminDashboardClient() {
  const { copy } = useAdminUiCopy();
  const t = useAdminT();
  const page = copy.pages?.dashboard ?? {};
  const { pageMeta } = useAdminSettings();

  const [range, setRange] = React.useState<DashboardRangeKey>('30d');
  const q = useGetDashboardSummaryAdminQuery({ range });

  const analytics = q.data;

  const kpis = React.useMemo(() => {
    const totals = analytics?.totals;
    if (!totals) return [];
    return [
      { key: 'revenue_total', label: 'Toplam Ciro', value: formatMoney(totals.revenue_total), icon: Wallet, color: 'var(--gm-gold)' },
      { key: 'today_bookings', label: 'Bugünkü Randevular', value: String(totals.today_bookings), icon: Calendar, color: 'var(--gm-primary)' },
      { key: 'consultants_active', label: 'Aktif Danışmanlar', value: String(totals.consultants_active), icon: ShieldCheck, color: 'var(--gm-success)' },
      { key: 'users_total', label: 'Toplam Üye', value: String(totals.users_total), icon: Users, color: 'var(--gm-info)' },
    ];
  }, [analytics?.totals]);

  return (
    <div className="space-y-12 pb-24">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-12 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.3em] uppercase">Sistem Özeti</span>
          </div>
          <h1 className="font-serif text-5xl text-foreground leading-tight tracking-tight">Dashboard</h1>
          <p className="text-gm-muted text-lg mt-3 font-serif italic max-w-2xl leading-relaxed">
            Platform performansını ve büyüme verilerini anlık takip edin. Editorial bakış açısıyla verilerinizi yorumlayın.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gm-surface/30 p-1.5 rounded-full border border-gm-border-soft backdrop-blur-sm">
          {RANGES.map((key) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-8 py-2.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-300 ${
                range === key ? 'bg-gm-gold text-gm-bg shadow-lg shadow-gm-gold/20' : 'text-gm-muted hover:text-foreground hover:bg-gm-gold/5'
              }`}
            >
              {key === '7d' ? 'Haftalık' : key === '30d' ? 'Aylık' : '3 Aylık'}
            </button>
          ))}
          <div className="w-px h-5 bg-gm-border-soft mx-2" />
          <button 
            onClick={() => q.refetch()} 
            disabled={q.isFetching}
            className="p-2.5 hover:bg-gm-gold/10 rounded-full transition-all group active:scale-95"
          >
            <RefreshCcw className={`size-4 text-gm-gold transition-all ${q.isFetching ? 'animate-spin opacity-100' : 'opacity-60 group-hover:opacity-100'}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {q.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-[32px] bg-gm-surface/20" />
          ))
        ) : (
          kpis.map((item) => (
            <Card key={item.key} className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden relative group hover:border-gm-gold/30 transition-all duration-500 backdrop-blur-sm shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] group-hover:scale-125 transition-all duration-1000 text-gm-gold">
                <item.icon size={84} strokeWidth={1} />
              </div>
              <CardHeader className="pb-2 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-gm-surface/60 border border-gm-border-soft flex items-center justify-center shadow-inner">
                    <item.icon size={18} style={{ color: item.color }} />
                  </div>
                  <CardTitle className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">{item.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="text-4xl font-serif text-foreground tracking-tight group-hover:text-gm-gold transition-colors duration-500">{item.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-8 xl:grid-cols-2">
        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[40px] overflow-hidden backdrop-blur-sm shadow-2xl">
          <CardHeader className="p-10 pb-6 border-b border-gm-border-soft bg-gm-surface/40">
            <div className="flex items-center gap-4 mb-3">
              <TrendingUp className="w-5 h-5 text-gm-gold" />
              <CardTitle className="font-serif text-3xl tracking-tight">Gelir Analizi</CardTitle>
            </div>
            <CardDescription className="font-serif italic text-base opacity-70 text-gm-muted">Seçili dönemdeki toplam ciro değişimi.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-8">
            {q.isLoading ? (
              <Skeleton className="h-[340px] w-full rounded-3xl bg-gm-surface/20" />
            ) : analytics?.revenueTrend.length ? (
              <ChartContainer config={KPI_CHART_CONFIG} className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.revenueTrend} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--gm-gold)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--gm-gold)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--gm-border-soft)" />
                    <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickFormatter={labelForBucket} tick={{ fontSize: 10, fill: 'var(--gm-muted)', fontWeight: 600 }} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `₺${v}`} tick={{ fontSize: 10, fill: 'var(--gm-muted)', fontWeight: 600 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent 
                        labelFormatter={(l) => labelForBucket(String(l))} 
                        formatter={(v) => formatMoney(Number(v))} 
                      />} 
                    />
                    <Area type="monotone" dataKey="revenue_total" stroke="var(--gm-gold)" strokeWidth={4} fill="url(#colorRev)" animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[340px] flex items-center justify-center text-base text-gm-muted font-serif italic opacity-40">Henüz grafik verisi bulunamadı.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[40px] overflow-hidden backdrop-blur-sm shadow-2xl">
          <CardHeader className="p-10 pb-6 border-b border-gm-border-soft bg-gm-surface/40">
            <div className="flex items-center gap-4 mb-3">
              <Activity className="w-5 h-5 text-gm-primary" />
              <CardTitle className="font-serif text-3xl tracking-tight">Randevu Yoğunluğu</CardTitle>
            </div>
            <CardDescription className="font-serif italic text-base opacity-70 text-gm-muted">Kategori bazlı randevu dağılımı.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-8">
            {q.isLoading ? (
              <Skeleton className="h-[340px] w-full rounded-3xl bg-gm-surface/20" />
            ) : analytics?.services.length ? (
              <ChartContainer config={SERVICE_CHART_CONFIG} className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.services} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--gm-border-soft)" />
                    <XAxis dataKey="service_name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--gm-muted)', fontWeight: 600 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--gm-muted)', fontWeight: 600 }} />
                    <ChartTooltip content={<ChartTooltipContent labelFormatter={(l) => String(l)} />} />
                    <Bar dataKey="bookings_total" fill="var(--gm-primary)" radius={[12, 12, 4, 4]} barSize={48} animationDuration={2500} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[340px] flex items-center justify-center text-base text-gm-muted font-serif italic opacity-40">Henüz randevu verisi bulunamadı.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Modules Section */}
      <div className="grid gap-8 xl:grid-cols-2">
        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[40px] overflow-hidden backdrop-blur-sm shadow-xl">
          <CardHeader className="p-10 pb-6 border-b border-gm-border-soft bg-gm-surface/40">
            <CardTitle className="font-serif text-2xl tracking-tight">Hızlı Erişim</CardTitle>
            <CardDescription className="font-serif italic text-base opacity-70 text-gm-muted">Yönetim modüllerine anında ulaşın.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 grid grid-cols-2 gap-4">
            {Object.entries(ROUTE_MAP).map(([key, href]) => (
              <Link key={key} href={href} className="flex items-center justify-between p-5 rounded-3xl bg-gm-surface/40 border border-gm-border-soft hover:border-gm-gold/40 hover:bg-gm-surface/80 transition-all duration-300 group">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gm-muted group-hover:text-gm-gold transition-colors">{key.replace('_', ' ')}</span>
                <ArrowRight className="w-4 h-4 text-gm-gold opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[40px] overflow-hidden backdrop-blur-sm shadow-xl">
          <CardHeader className="p-10 pb-6 border-b border-gm-border-soft bg-gm-surface/40">
            <CardTitle className="font-serif text-2xl tracking-tight">Performans Özeti</CardTitle>
            <CardDescription className="font-serif italic text-base opacity-70 text-gm-muted">Uzmanlık bazlı ciro verileri.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-4 max-h-[340px] overflow-y-auto custom-scrollbar">
            {analytics?.services.length ? analytics.services.map((svc) => (
              <div key={svc.service_id} className="flex items-center justify-between p-5 rounded-3xl border border-gm-border-soft bg-gm-surface/30 hover:bg-gm-surface/50 transition-colors group">
                <div className="flex items-center gap-4">
                   <div className="size-3 rounded-full bg-gm-gold shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
                   <div>
                    <div className="font-serif text-xl text-foreground group-hover:text-gm-gold transition-colors">{svc.service_name}</div>
                    <div className="text-[9px] font-bold text-gm-muted uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                      <Calendar size={10} className="text-gm-primary" />
                      {svc.bookings_total} Randevu
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-serif text-gm-gold drop-shadow-sm">{formatMoney(svc.revenue_total)}</div>
              </div>
            )) : (
              <div className="text-base text-gm-muted font-serif italic text-center py-16 opacity-40">Yeterli performans verisi yok.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
