'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/audit/admin-audit-client.tsx
// Admin Audit (Requests / Auth Events / Daily Metrics / Map)
// - i18n: useAdminT() ile tüm statikler dil kontrollü
// - Tabs: requests | auth | metrics | map
// - URL state: filters + pagination
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Activity,
  ShieldCheck,
  UserCheck,
  RefreshCcw,
  Search,
  Calendar,
  Filter,
  Loader2,
  Globe,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { AuditDailyChart } from '@/components/admin/audit/AuditDailyChart';
import { AuditGeoMap } from './AuditGeoMap';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import type {
  AuditAuthEvent,
  AuditAuthEventDto,
  AuditRequestLogDto,
  AuditListResponse,
  AuditMetricsDailyResponseDto,
  AuditGeoStatsResponseDto,
} from '@/integrations/shared';
import { AUDIT_AUTH_EVENTS } from '@/integrations/shared';
import {
  useListAuditRequestLogsAdminQuery,
  useListAuditAuthEventsAdminQuery,
  useGetAuditMetricsDailyAdminQuery,
  useGetAuditGeoStatsAdminQuery,
  useClearAuditLogsAdminMutation,
} from '@/integrations/hooks';

/* ----------------------------- helpers ----------------------------- */

type TabKey = 'requests' | 'auth' | 'metrics' | 'map';

function safeText(v: unknown, fb = ''): string {
  const s = String(v ?? '').trim();
  return s ? s : fb;
}

function safeInt(v: string | null, fb: number): number {
  const n = Number(v ?? '');
  return Number.isFinite(n) && n >= 0 ? n : fb;
}

function parseStatusCode(v: string): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  if (n < 100 || n > 599) return undefined;
  return Math.floor(n);
}

function normalizeTab(v: string | null): TabKey {
  const s = String(v ?? '').toLowerCase();
  if (s === 'auth') return 'auth';
  if (s === 'metrics') return 'metrics';
  if (s === 'map') return 'map';
  return 'requests';
}

function normalizeBoolLike(v: string | null): boolean {
  return v === '1' || v === 'true';
}

function toQS(next: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(next).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

function getErrMessage(err: unknown, fallback: string): string {
  const anyErr = err as any;
  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;
  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;
  const m3 = anyErr?.error;
  if (typeof m3 === 'string' && m3.trim()) return m3;
  return fallback;
}

function fmtWhen(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function statusVariant(code: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (code >= 500) return 'destructive';
  if (code >= 400) return 'secondary';
  if (code >= 300) return 'outline';
  return 'default';
}

function authEventVariant(ev: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (ev === 'login_success') return 'default';
  if (ev === 'login_failed') return 'destructive';
  if (ev === 'logout') return 'secondary';
  return 'outline';
}

function truncate(s: string | null | undefined, max = 60): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) + '…' : s;
}

function geoLabel(country: string | null | undefined, city: string | null | undefined): string {
  if (country === 'LOCAL') return 'Localhost';
  const parts: string[] = [];
  if (city) parts.push(city);
  if (country) parts.push(country);
  return parts.join(', ') || '';
}

type SortKey = 'created_at' | 'response_time_ms' | 'status_code';

/* ----------------------------- component ----------------------------- */

export default function AdminAuditClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useAdminT('admin.audit');

  const tab = normalizeTab(sp.get('tab'));

  const q = sp.get('q') ?? '';
  const method = sp.get('method') ?? '';
  const status = sp.get('status') ?? '';
  const from = sp.get('from') ?? '';
  const to = sp.get('to') ?? '';
  const onlyAdmin = normalizeBoolLike(sp.get('only_admin'));

  const reqUserId = sp.get('req_user_id') ?? '';
  const reqIp = sp.get('req_ip') ?? '';
  const sort = (sp.get('sort') ?? 'created_at') as SortKey;
  const orderDir = (sp.get('orderDir') ?? 'desc') as 'asc' | 'desc';

  const event = sp.get('event') ?? '';
  const email = sp.get('email') ?? '';
  const user_id = sp.get('user_id') ?? '';
  const ip = sp.get('ip') ?? '';

  const days = String(safeInt(sp.get('days'), 14) || 14);
  const path_prefix = sp.get('path_prefix') ?? '';

  const limit = safeInt(sp.get('limit'), 50) || 50;
  const offset = safeInt(sp.get('offset'), 0);

  // local state for request filters
  const [qText, setQText] = React.useState(q);
  const [methodText, setMethodText] = React.useState(method);
  const [statusText, setStatusText] = React.useState(status);
  const [fromText, setFromText] = React.useState(from);
  const [toText, setToText] = React.useState(to);
  const [onlyAdminFlag, setOnlyAdminFlag] = React.useState(onlyAdmin);
  const [reqUserIdText, setReqUserIdText] = React.useState(reqUserId);
  const [reqIpText, setReqIpText] = React.useState(reqIp);
  const [sortText, setSortText] = React.useState<SortKey>(sort);
  const [orderDirText, setOrderDirText] = React.useState<'asc' | 'desc'>(orderDir);

  // local state for auth filters
  const [eventText, setEventText] = React.useState(event);
  const [emailText, setEmailText] = React.useState(email);
  const [userIdText, setUserIdText] = React.useState(user_id);
  const [ipText, setIpText] = React.useState(ip);

  // local state for metrics
  const [daysText, setDaysText] = React.useState(days);
  const [pathPrefixText, setPathPrefixText] = React.useState(path_prefix);

  React.useEffect(() => setQText(q), [q]);
  React.useEffect(() => setMethodText(method), [method]);
  React.useEffect(() => setStatusText(status), [status]);
  React.useEffect(() => setFromText(from), [from]);
  React.useEffect(() => setToText(to), [to]);
  React.useEffect(() => setOnlyAdminFlag(onlyAdmin), [onlyAdmin]);
  React.useEffect(() => setReqUserIdText(reqUserId), [reqUserId]);
  React.useEffect(() => setReqIpText(reqIp), [reqIp]);
  React.useEffect(() => setSortText(sort), [sort]);
  React.useEffect(() => setOrderDirText(orderDir), [orderDir]);

  React.useEffect(() => setEventText(event), [event]);
  React.useEffect(() => setEmailText(email), [email]);
  React.useEffect(() => setUserIdText(user_id), [user_id]);
  React.useEffect(() => setIpText(ip), [ip]);

  React.useEffect(() => setDaysText(days), [days]);
  React.useEffect(() => setPathPrefixText(path_prefix), [path_prefix]);

  function apply(next: Partial<Record<string, any>>) {
    const merged = {
      tab,
      q,
      method,
      status,
      from,
      to,
      only_admin: onlyAdmin ? '1' : '',
      req_user_id: reqUserId,
      req_ip: reqIp,
      sort,
      orderDir,
      event,
      email,
      user_id,
      ip,
      days,
      path_prefix,
      limit,
      offset,
      ...next,
    };

    if (next.offset == null) merged.offset = 0;

    const qs = toQS({
      tab: merged.tab,
      q: merged.q || undefined,
      method: merged.method || undefined,
      status: merged.status || undefined,
      from: merged.from || undefined,
      to: merged.to || undefined,
      only_admin: merged.only_admin || undefined,
      req_user_id: merged.req_user_id || undefined,
      req_ip: merged.req_ip || undefined,
      sort: merged.sort !== 'created_at' ? merged.sort : undefined,
      orderDir: merged.orderDir !== 'desc' ? merged.orderDir : undefined,
      event: merged.event && merged.event !== ALL ? merged.event : undefined,
      email: merged.email || undefined,
      user_id: merged.user_id || undefined,
      ip: merged.ip || undefined,
      days: merged.days || undefined,
      path_prefix: merged.path_prefix || undefined,
      limit: merged.limit || undefined,
      offset: merged.offset || undefined,
    });

    router.push(`/admin/audit${qs}`);
  }

  function onTabChange(next: string) {
    apply({ tab: next, offset: 0 });
  }

  function onSubmitRequests(e: React.FormEvent) {
    e.preventDefault();
    apply({
      tab: 'requests',
      q: qText.trim(),
      method: methodText.trim().toUpperCase(),
      status: statusText.trim(),
      from: fromText.trim(),
      to: toText.trim(),
      only_admin: onlyAdminFlag ? '1' : '',
      req_user_id: reqUserIdText.trim(),
      req_ip: reqIpText.trim(),
      sort: sortText,
      orderDir: orderDirText,
      offset: 0,
    });
  }

  function onResetRequests() {
    setQText('');
    setMethodText('');
    setStatusText('');
    setFromText('');
    setToText('');
    setOnlyAdminFlag(false);
    setReqUserIdText('');
    setReqIpText('');
    setSortText('created_at');
    setOrderDirText('desc');
    apply({
      tab: 'requests',
      q: '',
      method: '',
      status: '',
      from: '',
      to: '',
      only_admin: '',
      req_user_id: '',
      req_ip: '',
      sort: 'created_at',
      orderDir: 'desc',
      offset: 0,
    });
  }

  function onSubmitAuth(e: React.FormEvent) {
    e.preventDefault();
    apply({
      tab: 'auth',
      event: eventText,
      email: emailText.trim(),
      user_id: userIdText.trim(),
      ip: ipText.trim(),
      from: fromText.trim(),
      to: toText.trim(),
      offset: 0,
    });
  }

  function onResetAuth() {
    setEventText('');
    setEmailText('');
    setUserIdText('');
    setIpText('');
    setFromText('');
    setToText('');
    apply({
      tab: 'auth',
      event: '',
      email: '',
      user_id: '',
      ip: '',
      from: '',
      to: '',
      offset: 0,
    });
  }

  function onSubmitMetrics(e: React.FormEvent) {
    e.preventDefault();
    const d = String(safeInt(daysText, 14) || 14);
    setDaysText(d);
    apply({
      tab: 'metrics',
      days: d,
      path_prefix: pathPrefixText.trim(),
      only_admin: onlyAdminFlag ? '1' : '',
    });
  }

  function onResetMetrics() {
    setDaysText('14');
    setPathPrefixText('');
    setOnlyAdminFlag(false);
    apply({
      tab: 'metrics',
      days: '14',
      path_prefix: '',
      only_admin: '',
    });
  }

  /* ----------------------------- queries ----------------------------- */

  const reqParams = React.useMemo(() => {
    const code = parseStatusCode(status);
    return {
      q: q || undefined,
      method: method || undefined,
      status_code: code,
      user_id: reqUserId || undefined,
      ip: reqIp || undefined,
      only_admin: onlyAdmin ? 1 : undefined,
      created_from: from || undefined,
      created_to: to || undefined,
      sort: sort as 'created_at' | 'response_time_ms' | 'status_code',
      orderDir: orderDir as 'asc' | 'desc',
      limit,
      offset,
    };
  }, [q, method, status, reqUserId, reqIp, onlyAdmin, from, to, sort, orderDir, limit, offset]);

  const authParams = React.useMemo(() => {
    const ev = event && event !== ALL ? event : undefined;
    return {
      event: ev as AuditAuthEvent | undefined,
      email: email || undefined,
      user_id: user_id || undefined,
      ip: ip || undefined,
      created_from: from || undefined,
      created_to: to || undefined,
      sort: 'created_at' as const,
      orderDir: 'desc' as const,
      limit,
      offset,
    };
  }, [event, email, user_id, ip, from, to, limit, offset]);

  const metricsParams = React.useMemo(() => {
    const d = safeInt(days, 14) || 14;
    return {
      days: d,
      only_admin: onlyAdmin ? 1 : undefined,
      path_prefix: path_prefix || undefined,
    };
  }, [days, onlyAdmin, path_prefix]);

  const reqQ = useListAuditRequestLogsAdminQuery(
    tab === 'requests' ? (reqParams as any) : (undefined as any),
    { skip: tab !== 'requests', refetchOnFocus: true } as any,
  ) as any;

  const authQ = useListAuditAuthEventsAdminQuery(
    tab === 'auth' ? (authParams as any) : (undefined as any),
    { skip: tab !== 'auth', refetchOnFocus: true } as any,
  ) as any;

  const metricsQ = useGetAuditMetricsDailyAdminQuery(
    tab === 'metrics' ? (metricsParams as any) : (undefined as any),
    { skip: tab !== 'metrics', refetchOnFocus: true } as any,
  ) as any;

  const geoParams = React.useMemo(() => {
    const d = safeInt(days, 30) || 30;
    return {
      days: d,
      only_admin: onlyAdmin ? 1 : undefined,
      source: 'requests' as const,
    };
  }, [days, onlyAdmin]);

  const geoQ = useGetAuditGeoStatsAdminQuery(
    tab === 'map' ? (geoParams as any) : (undefined as any),
    { skip: tab !== 'map', refetchOnFocus: true } as any,
  ) as any;

  const reqData = (reqQ.data as AuditListResponse<AuditRequestLogDto> | undefined) ?? {
    items: [],
    total: 0,
  };
  const authData = (authQ.data as AuditListResponse<AuditAuthEventDto> | undefined) ?? {
    items: [],
    total: 0,
  };
  const metricsData = (metricsQ.data as AuditMetricsDailyResponseDto | undefined) ?? { days: [] };
  const geoData = (geoQ.data as AuditGeoStatsResponseDto | undefined) ?? { items: [] };

  const reqLoading = reqQ.isLoading || reqQ.isFetching;
  const authLoading = authQ.isLoading || authQ.isFetching;
  const metricsLoading = metricsQ.isLoading || metricsQ.isFetching;
  const geoLoading = geoQ.isLoading || geoQ.isFetching;

  const reqTotal = reqData.total ?? 0;
  const authTotal = authData.total ?? 0;

  const canPrev = offset > 0;
  const canNextReq = offset + limit < reqTotal;
  const canNextAuth = offset + limit < authTotal;

  const ALL = '__all__' as const;

  const [clearAuditLogs, { isLoading: isClearing }] = useClearAuditLogsAdminMutation();

  async function onRefresh() {
    try {
      if (tab === 'requests') await reqQ.refetch();
      if (tab === 'auth') await authQ.refetch();
      if (tab === 'metrics') await metricsQ.refetch();
      if (tab === 'map') await geoQ.refetch();
      toast.success(t('refreshed'));
    } catch (err) {
      toast.error(getErrMessage(err, t('error')));
    }
  }

  async function onClearLogs() {
    if (!window.confirm(t('clear.dialogDescription'))) return;
    const target = tab === 'requests' ? 'requests' : tab === 'auth' ? 'auth' : 'all';
    try {
      const data = await clearAuditLogs({ target }).unwrap();
      const total = (data.deletedRequests ?? 0) + (data.deletedAuth ?? 0);
      toast.success(t('clear.success', { count: String(total) }));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('error'));
    }
  }

  const anyLoading = reqLoading || authLoading || metricsLoading || geoLoading || isClearing;

  return (
    <div className="space-y-6">
      {/* ---- HEADER ---- */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{t('header.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('header.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={anyLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t('refresh')}
          </Button>
          <Button variant="destructive" onClick={onClearLogs} disabled={isClearing}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('clear.button')}
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="requests">
            <Activity className="mr-2 h-4 w-4" /> {t('tabs.requests')}
          </TabsTrigger>
          <TabsTrigger value="auth">
            <UserCheck className="mr-2 h-4 w-4" /> {t('tabs.auth')}
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <ShieldCheck className="mr-2 h-4 w-4" /> {t('tabs.metrics')}
          </TabsTrigger>
          <TabsTrigger value="map">
            <Globe className="mr-2 h-4 w-4" /> {t('tabs.map')}
          </TabsTrigger>
        </TabsList>

        {/* ==================== REQUESTS TAB ==================== */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" /> {t('requests.filtersTitle')}
              </CardTitle>
              <CardDescription>{t('requests.filtersDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitRequests} className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t('requests.search')}</Label>
                  <Input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="/api/orders" />
                </div>
                <div className="space-y-2">
                  <Label>{t('requests.method')}</Label>
                  <Input value={methodText} onChange={(e) => setMethodText(e.target.value)} placeholder="GET" />
                </div>
                <div className="space-y-2">
                  <Label>{t('requests.status')}</Label>
                  <Input value={statusText} onChange={(e) => setStatusText(e.target.value)} placeholder="200" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.from')}</Label>
                  <Input type="datetime-local" value={fromText} onChange={(e) => setFromText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.to')}</Label>
                  <Input type="datetime-local" value={toText} onChange={(e) => setToText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.userId')}</Label>
                  <Input value={reqUserIdText} onChange={(e) => setReqUserIdText(e.target.value)} placeholder={t('common.userId')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.ip')}</Label>
                  <Input value={reqIpText} onChange={(e) => setReqIpText(e.target.value)} placeholder="192.168.1.1" />
                </div>
                <div className="space-y-2">
                  <Label>{t('requests.sort')}</Label>
                  <div className="flex gap-2">
                    <Select value={sortText} onValueChange={(v) => setSortText(v as SortKey)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">{t('requests.sortDate')}</SelectItem>
                        <SelectItem value="response_time_ms">{t('requests.sortResponseTime')}</SelectItem>
                        <SelectItem value="status_code">{t('requests.sortStatusCode')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={orderDirText} onValueChange={(v) => setOrderDirText(v as 'asc' | 'desc')}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">{t('common.desc')}</SelectItem>
                        <SelectItem value="asc">{t('common.asc')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span>{t('common.onlyAdmin')}</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={onlyAdminFlag} onCheckedChange={setOnlyAdminFlag} />
                    <span className="text-sm text-muted-foreground">{t('common.adminRequests')}</span>
                  </div>
                </div>

                <div className="md:col-span-3 flex flex-wrap items-center gap-2">
                  <Button type="submit">
                    <Search className="mr-2 h-4 w-4" /> {t('common.apply')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={onResetRequests}>
                    {t('common.reset')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{t('requests.logsTitle')}</CardTitle>
                  <CardDescription>
                    {t('common.totalRecords', { count: String(reqTotal) })}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {reqLoading ? t('common.loading') : t('common.recordCount', { count: String(reqData.items.length) })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {reqQ.error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  {getErrMessage(reqQ.error, t('error'))}
                </div>
              )}

              <div className="mt-3 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('columns.date')}</TableHead>
                      <TableHead>{t('columns.request')}</TableHead>
                      <TableHead>{t('columns.status')}</TableHead>
                      <TableHead>{t('columns.ipUser')}</TableHead>
                      <TableHead>{t('columns.location')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('columns.userAgent')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reqData.items.length === 0 && !reqLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                          {t('common.noRecords')}
                        </TableCell>
                      </TableRow>
                    )}

                    {reqData.items.map((r) => {
                      const code = Number(r.status_code ?? 0);
                      const geo = geoLabel(r.country, r.city);
                      return (
                        <TableRow key={String(r.id)}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {fmtWhen(r.created_at)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="font-medium">{safeText(r.method)}</div>
                            <div className="text-muted-foreground">{safeText(r.path)}</div>
                            {r.referer && (
                              <div className="text-muted-foreground text-xs">ref: {truncate(r.referer, 40)}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(code)}>{code || '—'}</Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {Number(r.response_time_ms ?? 0)}ms
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="font-medium">{safeText(r.ip)}</div>
                            <div className="text-muted-foreground">
                              {r.user_id ? `uid:${r.user_id}` : t('common.anon')}
                              {r.is_admin ? ' · admin' : ''}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {geo || '—'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[200px] truncate" title={r.user_agent ?? ''}>
                            {truncate(r.user_agent, 50) || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {reqTotal === 0 ? '0' : `${offset + 1}-${Math.min(offset + limit, reqTotal)}`}
                  {' / '} {reqTotal}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPrev}
                    onClick={() => apply({ offset: Math.max(0, offset - limit) })}
                  >
                    {t('common.prev')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canNextReq}
                    onClick={() => apply({ offset: offset + limit })}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== AUTH TAB ==================== */}
        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" /> {t('auth.filtersTitle')}
              </CardTitle>
              <CardDescription>{t('auth.filtersDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitAuth} className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t('auth.event')}</Label>
                  <Select value={eventText || ''} onValueChange={setEventText}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>{t('common.all')}</SelectItem>
                      {AUDIT_AUTH_EVENTS.map((ev) => (
                        <SelectItem key={ev} value={ev}>
                          {ev}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('auth.email')}</Label>
                  <Input value={emailText} onChange={(e) => setEmailText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.userId')}</Label>
                  <Input value={userIdText} onChange={(e) => setUserIdText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.ip')}</Label>
                  <Input value={ipText} onChange={(e) => setIpText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.from')}</Label>
                  <Input type="datetime-local" value={fromText} onChange={(e) => setFromText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.to')}</Label>
                  <Input type="datetime-local" value={toText} onChange={(e) => setToText(e.target.value)} />
                </div>

                <div className="md:col-span-3 flex flex-wrap items-center gap-2">
                  <Button type="submit">
                    <Search className="mr-2 h-4 w-4" /> {t('common.apply')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={onResetAuth}>
                    {t('common.reset')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{t('auth.eventsTitle')}</CardTitle>
                  <CardDescription>
                    {t('common.totalRecords', { count: String(authTotal) })}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {authLoading ? t('common.loading') : t('common.recordCount', { count: String(authData.items.length) })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {authQ.error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  {getErrMessage(authQ.error, t('error'))}
                </div>
              )}

              <div className="mt-3 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('columns.date')}</TableHead>
                      <TableHead>{t('auth.event')}</TableHead>
                      <TableHead>{t('columns.user')}</TableHead>
                      <TableHead>{t('common.ip')}</TableHead>
                      <TableHead>{t('columns.location')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('columns.userAgent')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {authData.items.length === 0 && !authLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                          {t('common.noRecords')}
                        </TableCell>
                      </TableRow>
                    )}

                    {authData.items.map((r) => {
                      const geo = geoLabel(r.country, r.city);
                      return (
                        <TableRow key={String(r.id)}>
                          <TableCell className="whitespace-nowrap text-sm">{fmtWhen(r.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant={authEventVariant(r.event)}>{safeText(r.event)}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="font-medium">{safeText(r.email || r.user_id || '—')}</div>
                            <div className="text-muted-foreground">{r.user_id ? `uid:${r.user_id}` : ''}</div>
                          </TableCell>
                          <TableCell className="text-sm">{safeText(r.ip)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {geo || '—'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[200px] truncate" title={r.user_agent ?? ''}>
                            {truncate(r.user_agent, 50) || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {authTotal === 0 ? '0' : `${offset + 1}-${Math.min(offset + limit, authTotal)}`}
                  {' / '} {authTotal}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPrev}
                    onClick={() => apply({ offset: Math.max(0, offset - limit) })}
                  >
                    {t('common.prev')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canNextAuth}
                    onClick={() => apply({ offset: offset + limit })}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== METRICS TAB ==================== */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" /> {t('metrics.title')}
              </CardTitle>
              <CardDescription>{t('metrics.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitMetrics} className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t('metrics.days')}</Label>
                  <Select value={daysText} onValueChange={setDaysText}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">{t('metrics.nDays', { n: '7' })}</SelectItem>
                      <SelectItem value="14">{t('metrics.nDays', { n: '14' })}</SelectItem>
                      <SelectItem value="30">{t('metrics.nDays', { n: '30' })}</SelectItem>
                      <SelectItem value="60">{t('metrics.nDays', { n: '60' })}</SelectItem>
                      <SelectItem value="90">{t('metrics.nDays', { n: '90' })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('metrics.pathPrefix')}</Label>
                  <Input value={pathPrefixText} onChange={(e) => setPathPrefixText(e.target.value)} placeholder="/api" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.onlyAdmin')}</Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={onlyAdminFlag} onCheckedChange={setOnlyAdminFlag} />
                    <span className="text-sm text-muted-foreground">{t('common.adminRequests')}</span>
                  </div>
                </div>

                <div className="md:col-span-3 flex flex-wrap items-center gap-2">
                  <Button type="submit">
                    <Filter className="mr-2 h-4 w-4" /> {t('common.apply')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={onResetMetrics}>
                    {t('common.reset')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{t('metrics.chartTitle')}</CardTitle>
                  <CardDescription>{t('metrics.lastNDays', { n: String(metricsData.days?.length ?? 0) })}</CardDescription>
                </div>
                {metricsLoading && (
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> {t('common.loading')}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {metricsQ.error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  {getErrMessage(metricsQ.error, t('error'))}
                </div>
              )}
              <AuditDailyChart rows={metricsData.days ?? []} loading={metricsLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== MAP TAB ==================== */}
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4" /> {t('map.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('map.description', { days: String(geoParams.days) })}
                  </CardDescription>
                </div>
                {geoLoading && (
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> {t('common.loading')}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {geoQ.error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  {getErrMessage(geoQ.error, t('error'))}
                </div>
              )}
              <AuditGeoMap items={geoData.items ?? []} loading={geoLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
