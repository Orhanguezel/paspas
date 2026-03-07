'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/notifications/admin-notifications-client.tsx
// FINAL — Admin Notifications List (App Router + shadcn)
// ✅ Select error fixed + Tailwind warnings fixed
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, RefreshCcw, Search, Trash2, Pencil, CheckCheck, Bell, BellOff } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { NotificationView, NotificationsListParams } from '@/integrations/shared';
import {
  useListNotificationsQuery,
  useDeleteNotificationMutation,
  useMarkAllReadMutation,
  useUpdateNotificationMutation,
} from '@/integrations/hooks';

type ReadFilter = 'all' | 'read' | 'unread';

type Filters = {
  search: string;
  readFilter: ReadFilter;
  type: string;
};

// function getErrMsg(e: unknown): string { ... } moved inside or adapted
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

function getErrMsg(e: unknown, t: (k: string) => string): string {
  const anyErr = e as any;
  return (
    anyErr?.data?.error?.message ||
    anyErr?.data?.message ||
    anyErr?.message ||
    t('notifications.messages.operationFailed')
  );
}

const localeMapping: Record<string, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
};

function fmtDate(val: string | null | undefined, localeStr: string) {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    const loc = localeMapping[localeStr] || 'tr-TR';
    return d.toLocaleString(loc, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(val);
  }
}

function truncate(text: string, max = 60) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

export default function AdminNotificationsClient() {
  const router = useRouter();
  const t = useAdminT();
  const adminLocale = usePreferencesStore((s) => s.adminLocale);

  const [filters, setFilters] = React.useState<Filters>({
    search: '',
    readFilter: 'all',
    type: 'all', // ✅ FIX: Changed from '' to 'all'
  });

  const is_read = React.useMemo(() => {
    if (filters.readFilter === 'all') return undefined;
    return filters.readFilter === 'read' ? 1 : 0;
  }, [filters.readFilter]);

  const queryParams = React.useMemo(() => {
    const qp: NotificationsListParams = {
      is_read,
      type: filters.type === 'all' ? undefined : filters.type, // ✅ FIX: Check for 'all'
      limit: 200,
      offset: 0,
    };
    return qp;
  }, [is_read, filters.type]);

  const {
    data: items = [],
    isLoading,
    isFetching,
    refetch,
  } = useListNotificationsQuery(queryParams);

  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllReadMutation();
  const [updateNotification] = useUpdateNotificationMutation();

  const busy = isLoading || isFetching || isDeleting || isMarkingAll;

  // Client-side search filter
  const filteredItems = React.useMemo(() => {
    if (!filters.search.trim()) return items;
    const q = filters.search.toLowerCase();
    return items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q)
    );
  }, [items, filters.search]);

  const handleRefresh = () => {
    refetch();
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
      toast.success(t('notifications.messages.markAllSuccess'));
    } catch (err) {
      toast.error(getErrMsg(err, t));
    }
  };

  const handleToggleRead = async (item: NotificationView) => {
    try {
      await updateNotification({ id: item.id, body: { is_read: !item.is_read } }).unwrap();
      toast.success(
        item.is_read
          ? t('notifications.messages.markedUnread')
          : t('notifications.messages.markedRead')
      );
    } catch (err) {
      toast.error(getErrMsg(err, t));
    }
  };

  const handleDelete = async (item: NotificationView) => {
    if (
      !confirm(
        t('notifications.messages.deleteConfirm').replace('{title}', item.title)
      )
    )
      return;

    try {
      await deleteNotification({ id: item.id }).unwrap();
      toast.success(t('notifications.messages.deleteSuccess'));
    } catch (err) {
      toast.error(getErrMsg(err, t));
    }
  };

  const handleCreate = () => {
    router.push('/admin/notifications/new');
  };

  const handleEdit = (item: NotificationView) => {
    router.push(`/admin/notifications/${encodeURIComponent(item.id)}`);
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  // Unique types for filter
  const typeOptions = React.useMemo(() => {
    const types = new Set(items.map((n) => n.type));
    return Array.from(types).sort();
  }, [items]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{t('notifications.title')}</CardTitle>
              <CardDescription>
                {t('notifications.description')
                  .replace('{count}', String(filteredItems.length))
                  .replace('{unread}', String(unreadCount))}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleMarkAllRead} disabled={busy || unreadCount === 0} size="sm">
                <CheckCheck className="mr-2 size-4" />
                {t('notifications.actions.markAllRead')}
              </Button>
              <Button onClick={handleRefresh} disabled={busy} variant="outline" size="sm">
                <RefreshCcw className={cn('mr-2 size-4', busy && 'animate-spin')} />
                {t('notifications.actions.refresh')}
              </Button>
              <Button onClick={handleCreate} size="sm">
                <Plus className="mr-2 size-4" />
                {t('notifications.actions.create')}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{t('notifications.filters.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">{t('notifications.filters.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  className="pl-9"
                  placeholder={t('notifications.filters.searchPlaceholder')}
                  value={filters.search}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                />
              </div>
            </div>

            {/* Read Filter */}
            <div className="space-y-2">
              <Label htmlFor="readFilter">{t('notifications.filters.status')}</Label>
              <Select
                value={filters.readFilter}
                onValueChange={(v) => setFilters((p) => ({ ...p, readFilter: v as ReadFilter }))}
              >
                <SelectTrigger id="readFilter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('notifications.filters.all')}</SelectItem>
                  <SelectItem value="read">{t('notifications.filters.read')}</SelectItem>
                  <SelectItem value="unread">{t('notifications.filters.unread')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter - ✅ FIXED: No empty string value */}
            <div className="space-y-2">
              <Label htmlFor="type">{t('notifications.filters.type')}</Label>
              <Select
                value={filters.type}
                onValueChange={(v) => setFilters((p) => ({ ...p, type: v }))}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder={t('notifications.filters.typePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('notifications.filters.all')}</SelectItem>
                  {typeOptions.map((tVal) => (
                    <SelectItem key={tVal} value={tVal}>
                      {t(`notifications.types.${tVal}`, {}, tVal)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table - ✅ FIXED: Tailwind canonical classes */}
          <div className="hidden overflow-auto xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{t('notifications.table.status')}</TableHead>
                  <TableHead className="w-52">{t('notifications.table.title')}</TableHead>
                  <TableHead className="w-80">{t('notifications.table.message')}</TableHead>
                  <TableHead className="w-32">{t('notifications.table.type')}</TableHead>
                  <TableHead className="w-48">{t('notifications.table.date')}</TableHead>
                  <TableHead className="w-52 text-right">{t('notifications.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {busy ? t('notifications.table.loading') : t('notifications.table.noRecords')}
                    </TableCell>
                  </TableRow>
                )}
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      'cursor-pointer hover:bg-muted/50',
                      !item.is_read && 'bg-blue-50/50 dark:bg-blue-950/20'
                    )}
                    onClick={() => handleEdit(item)}
                  >
                    <TableCell>
                      {item.is_read ? (
                        <BellOff className="size-4 text-muted-foreground" />
                      ) : (
                        <Bell className="size-4 text-blue-600" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {truncate(item.title, 40)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {truncate(item.message, 60)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(`notifications.types.${item.type}`, {}, item.type)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDate(item.created_at, adminLocale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRead(item);
                          }}
                          disabled={busy}
                        >
                          {item.is_read
                            ? t('notifications.actions.markUnread')
                            : t('notifications.actions.markRead')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                          disabled={busy}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item);
                          }}
                          disabled={busy}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col gap-3 p-4 xl:hidden">
            {filteredItems.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                {busy ? t('notifications.table.loading') : t('notifications.table.noRecords')}
              </div>
            )}
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/50',
                  !item.is_read && 'border-l-4 border-l-blue-600'
                )}
                onClick={() => handleEdit(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {item.is_read ? (
                          <BellOff className="size-4 text-muted-foreground" />
                        ) : (
                          <Bell className="size-4 text-blue-600" />
                        )}
                        <p className="font-semibold">{item.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.message}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {t(`notifications.types.${item.type}`, {}, item.type)}
                        </Badge>
                        <span>•</span>

                        <span>{fmtDate(item.created_at, adminLocale)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRead(item);
                      }}
                      disabled={busy}
                      className="flex-1"
                    >
                      {item.is_read
                        ? t('notifications.actions.markUnread')
                        : t('notifications.actions.markRead')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(item);
                      }}
                      disabled={busy}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      disabled={busy}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}