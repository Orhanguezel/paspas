'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, ArrowUpDown, CheckCircle2, RefreshCcw, Search, ShieldAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useListAdminAuditLogsQuery } from '@/integrations/endpoints/admin/erp/audit_logs_admin.endpoints';
import type { AdminAuditLogDto } from '@/integrations/shared/erp/audit_logs.types';

const LIMIT = 25;

const MODULE_OPTIONS = [
  { value: 'all', label: 'Tum Moduller' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'musteriler', label: 'Musteriler' },
  { value: 'urunler', label: 'Urunler' },
  { value: 'satis_siparisleri', label: 'Satis Siparisleri' },
  { value: 'uretim_emirleri', label: 'Uretim Emirleri' },
  { value: 'makine_havuzu', label: 'Makine Havuzu' },
  { value: 'is_yukler', label: 'Makine Is Yukleri' },
  { value: 'gantt', label: 'Gantt' },
  { value: 'stoklar', label: 'Stoklar' },
  { value: 'satin_alma', label: 'Satin Alma' },
  { value: 'hareketler', label: 'Hareketler' },
  { value: 'operator', label: 'Operator' },
  { value: 'tanimlar', label: 'Tanimlar' },
  { value: 'tedarikci', label: 'Tedarikci' },
  { value: 'kullanicilar', label: 'Kullanicilar' },
  { value: 'site_ayarlari', label: 'Site Ayarlari' },
  { value: 'medyalar', label: 'Medyalar' },
  { value: 'veritabani', label: 'Veritabani' },
  { value: 'audit', label: 'Audit' },
  { value: 'diger', label: 'Diger' },
] as const;

type SortKey = 'created_at' | 'status_code' | 'action';

function statusBadge(statusCode: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (statusCode >= 500) return 'destructive';
  if (statusCode >= 400) return 'secondary';
  if (statusCode >= 300) return 'outline';
  return 'default';
}

function impactBadge(level: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (level === 'kritik') return 'destructive';
  if (level === 'uyari') return 'secondary';
  return 'outline';
}

function formatDate(value: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('tr-TR');
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2);
}

function payloadSection(payload: unknown, key: 'params' | 'query' | 'body'): unknown {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  return (payload as Record<string, unknown>)[key] ?? null;
}

function impactText(item: AdminAuditLogDto): string {
  if (item.status_code >= 500) return 'Sunucu hatasi veya kritik islem basarisiz.';
  if (item.status_code >= 400) return 'Istek reddedildi veya validation hatasi olustu.';
  if (item.method === 'DELETE') return 'Silme islemi kaydi etkiliyor.';
  if (item.method === 'PATCH' || item.method === 'PUT') return 'Kayit guncelleme islemi basarili.';
  if (item.method === 'POST') return 'Yeni kayit veya is akisi olusturma islemi basarili.';
  return 'Bilgilendirici islem kaydi.';
}

function SummaryCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function AuditLogsClient() {
  const [q, setQ] = useState('');
  const [method, setMethod] = useState<'all' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('all');
  const [moduleKey, setModuleKey] = useState<string>('all');
  const [statusCode, setStatusCode] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogDto | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const params = useMemo(() => {
    const offset = (page - 1) * LIMIT;
    const status = statusCode.trim() ? Number(statusCode) : undefined;

    return {
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(method !== 'all' ? { method } : {}),
      ...(moduleKey !== 'all' ? { moduleKey } : {}),
      ...(Number.isFinite(status) ? { statusCode: status } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      limit: LIMIT,
      offset,
      order: 'desc' as const,
    };
  }, [q, method, moduleKey, statusCode, dateFrom, dateTo, page]);

  const { data, isLoading, isFetching, refetch } = useListAdminAuditLogsQuery(params);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const summary = data?.summary;

  const sortedItems = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'created_at') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortKey === 'status_code') {
        cmp = a.status_code - b.status_code;
      } else {
        cmp = (a.action || '').localeCompare(b.action || '', 'tr');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [items, sortKey, sortDir]);

  const hasPrev = page > 1;
  const hasNext = page * LIMIT < total;

  function resetFilters() {
    setQ('');
    setMethod('all');
    setModuleKey('all');
    setStatusCode('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(nextKey);
    setSortDir('asc');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Audit Loglari</h1>
          <p className="text-sm text-muted-foreground">Toplam {total} kayit, ERP islemlerinin iz kaydi</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Filtreleri Sifirla
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Toplam Kayit"
          value={String(summary?.totalKayit ?? 0)}
          hint={`${summary?.bugun ?? 0} kayit bugun olustu`}
          icon={<CheckCircle2 className="size-4 text-muted-foreground" />}
        />
        <SummaryCard
          title="Basarili Islem"
          value={String(summary?.basarili ?? 0)}
          hint="HTTP < 400"
          icon={<CheckCircle2 className="size-4 text-emerald-600" />}
        />
        <SummaryCard
          title="Hatali Islem"
          value={String(summary?.hatali ?? 0)}
          hint="Validation veya izin hatalari dahil"
          icon={<AlertTriangle className="size-4 text-amber-600" />}
        />
        <SummaryCard
          title="Kritik Islem"
          value={String(summary?.kritik ?? 0)}
          hint="Sunucu seviyesinde 5xx hata"
          icon={<ShieldAlert className="size-4 text-red-600" />}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_180px_220px_170px_170px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Kullanici, action, path, request id ara"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={method}
          onValueChange={(v) => {
            setMethod(v as 'all' | 'POST' | 'PUT' | 'PATCH' | 'DELETE');
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tum Methodlar</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={moduleKey}
          onValueChange={(value) => {
            setModuleKey(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="ERP Modulu" />
          </SelectTrigger>
          <SelectContent>
            {MODULE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Status"
          value={statusCode}
          onChange={(e) => {
            setStatusCode(e.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_200px]">
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
        />
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          Moduller icin hazir filtre: satis, uretim, stok, satin alma, operator, ayarlar
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort('created_at')} type="button">
                  Tarih <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>Modul</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort('action')} type="button">
                  Islem <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>Kullanici</TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort('status_code')} type="button">
                  Status <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Audit kaydi bulunamadi
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              sortedItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedLog(item)}
                >
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(item.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.module_label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.method}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate font-mono text-xs">{item.path}</TableCell>
                  <TableCell className="max-w-[240px] truncate">{item.action}</TableCell>
                  <TableCell className="text-sm">
                    {item.actor_email || item.actor_user_id || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadge(item.status_code)}>{item.status_code}</Badge>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-4xl">
          <SheetHeader className="border-b px-4 py-4 sm:px-6">
            <SheetTitle>Kayit Detayi</SheetTitle>
            <SheetDescription>
              {selectedLog ? `${selectedLog.method} ${selectedLog.path}` : ''}
            </SheetDescription>
          </SheetHeader>

          {selectedLog && (
            <div className="space-y-4 px-4 py-4 text-sm sm:px-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Modul</CardTitle>
                  </CardHeader>
                  <CardContent>{selectedLog.module_label}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Etki Seviyesi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={impactBadge(selectedLog.impact_level)}>{selectedLog.impact_level}</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={statusBadge(selectedLog.status_code)}>{selectedLog.status_code}</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sonuc</CardTitle>
                  </CardHeader>
                  <CardContent>{selectedLog.success ? 'Basarili' : 'Hata'}</CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Islem Ozeti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid gap-2 md:grid-cols-2">
                    <div><span className="text-muted-foreground">Tarih:</span> {formatDate(selectedLog.created_at)}</div>
                    <div><span className="text-muted-foreground">Role:</span> {selectedLog.actor_role || '-'}</div>
                    <div><span className="text-muted-foreground">Kullanici:</span> {selectedLog.actor_email || selectedLog.actor_user_id || '-'}</div>
                    <div><span className="text-muted-foreground">Request ID:</span> {selectedLog.request_id || '-'}</div>
                    <div><span className="text-muted-foreground">Kaynak:</span> {selectedLog.resource || '-'}</div>
                    <div><span className="text-muted-foreground">Kaynak ID:</span> {selectedLog.resource_id || '-'}</div>
                    <div><span className="text-muted-foreground">IP:</span> {selectedLog.ip || '-'}</div>
                    <div><span className="text-muted-foreground">Route:</span> {selectedLog.route || '-'}</div>
                    <div className="md:col-span-2"><span className="text-muted-foreground">Etki:</span> {impactText(selectedLog)}</div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 xl:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Params</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-72 overflow-auto rounded-md border bg-muted p-3 text-xs">
                      {prettyJson(payloadSection(selectedLog.payload, 'params'))}
                    </pre>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Query</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-72 overflow-auto rounded-md border bg-muted p-3 text-xs">
                      {prettyJson(payloadSection(selectedLog.payload, 'query'))}
                    </pre>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Body</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-72 overflow-auto rounded-md border bg-muted p-3 text-xs">
                      {prettyJson(payloadSection(selectedLog.payload, 'body'))}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Sayfa {page} / {Math.max(1, Math.ceil(total / LIMIT))}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!hasPrev || isFetching} onClick={() => setPage((p) => p - 1)}>
            Onceki
          </Button>
          <Button variant="outline" size="sm" disabled={!hasNext || isFetching} onClick={() => setPage((p) => p + 1)}>
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  );
}
