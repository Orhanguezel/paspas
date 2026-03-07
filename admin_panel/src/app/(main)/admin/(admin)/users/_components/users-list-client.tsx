'use client';

// =============================================================
// FILE: src/app/(main)/admin/users/_components/users-list-client.tsx
// FINAL — Admin Users List (users_admin.endpoints uyumlu)
// - route: /admin/users
// - roles: admin | operator | satin_almaci | sevkiyatci
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, RefreshCcw, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import type { UserRoleName, AdminUserView, AdminUsersListParams } from '@/integrations/shared';
import { useListUsersAdminQuery, useCreateUserAdminMutation } from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

function boolParam(v: string | null): boolean | undefined {
  if (v == null) return undefined;
  const s = v.trim();
  if (s === '1' || s === 'true') return true;
  if (s === '0' || s === 'false') return false;
  return undefined;
}

function safeInt(v: string | null, fb: number): number {
  const n = Number(v ?? '');
  return Number.isFinite(n) && n >= 0 ? n : fb;
}

function pickQuery(sp: URLSearchParams): AdminUsersListParams {
  const q = sp.get('q') ?? undefined;
  const role = (sp.get('role') ?? undefined) as UserRoleName | undefined;
  const is_active = boolParam(sp.get('is_active'));
  const limit = safeInt(sp.get('limit'), 20) || 20;
  const offset = safeInt(sp.get('offset'), 0);

  const sort = (sp.get('sort') ?? undefined) as AdminUsersListParams['sort'] | undefined;
  const order = (sp.get('order') ?? undefined) as AdminUsersListParams['order'] | undefined;

  return {
    ...(q ? { q } : {}),
    ...(role ? { role } : {}),
    ...(typeof is_active === 'boolean' ? { is_active } : {}),
    limit,
    offset,
    ...(sort ? { sort } : {}),
    ...(order ? { order } : {}),
  };
}

function toSearchParams(p: AdminUsersListParams): string {
  const sp = new URLSearchParams();
  if (p.q) sp.set('q', p.q);
  if (p.role) sp.set('role', p.role);
  if (typeof p.is_active === 'boolean') sp.set('is_active', p.is_active ? '1' : '0');
  if (p.limit != null) sp.set('limit', String(p.limit));
  if (p.offset != null) sp.set('offset', String(p.offset));
  if (p.sort) sp.set('sort', p.sort);
  if (p.order) sp.set('order', p.order);
  return sp.toString();
}

const ALL_ROLES: UserRoleName[] = ['admin', 'operator', 'satin_almaci', 'sevkiyatci'];

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const t = useAdminT('admin.users');
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [createUser, { isLoading }] = useCreateUserAdminMutation();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [role, setRole] = React.useState<UserRoleName>('operator');

  function reset() {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setRole('operator');
  }

  function roleLabel(r: UserRoleName) {
    if (r === 'admin') return t('roles.admin');
    if (r === 'operator') return t('roles.operator');
    if (r === 'satin_almaci') return t('roles.satin_almaci');
    return t('roles.sevkiyatci');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    try {
      const created = await createUser({
        email: email.trim(),
        password: password.trim(),
        full_name: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        role,
      }).unwrap();
      toast.success(t('create.success'));
      reset();
      setOpen(false);
      onCreated();
      router.push(`/admin/users/${encodeURIComponent(created.id)}`);
    } catch (err: unknown) {
      const anyErr = err as Record<string, unknown>;
      const status = (anyErr?.status as number) ?? 0;
      if (status === 409) {
        toast.error(t('create.errorExists'));
      } else {
        toast.error(t('create.errorFallback'));
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          {t('create.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('create.title')}</DialogTitle>
            <DialogDescription>{t('create.description')}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">{t('create.emailLabel')}</Label>
              <Input
                id="create-email"
                type="email"
                placeholder={t('create.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">{t('create.passwordLabel')}</Label>
              <Input
                id="create-password"
                type="password"
                placeholder={t('create.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-fullname">{t('create.fullNameLabel')}</Label>
                <Input
                  id="create-fullname"
                  placeholder={t('create.fullNamePlaceholder')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">{t('create.phoneLabel')}</Label>
                <Input
                  id="create-phone"
                  placeholder={t('create.phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('create.roleLabel')}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRoleName)}>
                <SelectTrigger disabled={isLoading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              {t('create.cancelButton')}
            </Button>
            <Button type="submit" disabled={isLoading || !email.trim() || !password.trim()}>
              {t('create.saveButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersListClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useAdminT('admin.users');

  function roleLabel(r: UserRoleName) {
    if (r === 'admin') return t('roles.admin');
    if (r === 'operator') return t('roles.operator');
    if (r === 'satin_almaci') return t('roles.satin_almaci');
    return t('roles.sevkiyatci');
  }

  function statusBadge(u: AdminUserView) {
    if (!u.is_active) return <Badge variant="destructive">{t('list.table.statusInactive')}</Badge>;
    return <Badge variant="secondary">{t('list.table.statusActive')}</Badge>;
  }

  function displayName(u: Pick<AdminUserView, 'full_name'>) {
    const n = String(u.full_name ?? '').trim();
    return n || t('list.table.unknownUser');
  }

  const params = React.useMemo(() => pickQuery(sp), [sp]);
  const usersQ = useListUsersAdminQuery(params);

  // UI state (controlled) – URL ile senkron
  const [q, setQ] = React.useState(params.q ?? '');
  const [role, setRole] = React.useState<UserRoleName | 'all'>((params.role as any) ?? 'all');
  const [onlyActive, setOnlyActive] = React.useState<boolean | 'all'>(
    typeof params.is_active === 'boolean' ? (params.is_active ? true : false) : 'all',
  );

  React.useEffect(() => {
    setQ(params.q ?? '');
    setRole((params.role as any) ?? 'all');
    setOnlyActive(
      typeof params.is_active === 'boolean' ? (params.is_active ? true : false) : 'all',
    );
  }, [params.q, params.role, params.is_active]);

  function apply(next: Partial<AdminUsersListParams>) {
    const merged: AdminUsersListParams = {
      ...params,
      ...next,
      offset: next.offset != null ? next.offset : 0,
    };

    if (!merged.q) delete (merged as any).q;
    if (!merged.role) delete (merged as any).role;
    if (typeof merged.is_active !== 'boolean') delete (merged as any).is_active;

    const qs = toSearchParams(merged);
    router.push(qs ? `/admin/users?${qs}` : `/admin/users`);
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    apply({ q: q.trim() || undefined });
  }

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;

  const canPrev = offset > 0;
  const canNext = (usersQ.data?.length ?? 0) >= limit;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{t('list.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('list.description')}
          </p>
        </div>
        <CreateUserDialog onCreated={() => usersQ.refetch()} />
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{t('list.filters.title')}</CardTitle>
          <CardDescription>{t('list.filters.description')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={onSearchSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="q">{t('list.filters.searchLabel')}</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('list.filters.searchPlaceholder')}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="w-full space-y-2 lg:w-56">
              <Label>{t('list.filters.roleLabel')}</Label>
              <Select
                value={role}
                onValueChange={(v) => {
                  const vv = v as UserRoleName | 'all';
                  setRole(vv);
                  apply({ role: vv === 'all' ? undefined : (vv as UserRoleName) });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('list.filters.rolePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('roles.all')}</SelectItem>
                  <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                  <SelectItem value="operator">{t('roles.operator')}</SelectItem>
                  <SelectItem value="satin_almaci">{t('roles.satin_almaci')}</SelectItem>
                  <SelectItem value="sevkiyatci">{t('roles.sevkiyatci')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Label className="text-sm">{t('list.filters.onlyActive')}</Label>
              <Switch
                checked={onlyActive === true}
                onCheckedChange={(v) => {
                  const next = v ? true : 'all';
                  setOnlyActive(next);
                  apply({ is_active: v ? true : undefined });
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={usersQ.isFetching}>
                {t('list.filters.searchButton')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQ('');
                  setRole('all');
                  setOnlyActive('all');
                  router.push('/admin/users');
                }}
                disabled={usersQ.isFetching}
              >
                {t('list.filters.resetButton')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => usersQ.refetch()}
                disabled={usersQ.isFetching}
                title={t('list.filters.refreshButton')}
              >
                <RefreshCcw className="size-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('list.table.title')}</CardTitle>
          <CardDescription>
            {usersQ.isFetching
              ? t('list.table.loading')
              : t('list.table.totalRecords', { count: usersQ.data?.length ?? 0 })}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {usersQ.isError ? (
            <div className="rounded-md border p-4 text-sm">
              {t('list.table.loadError')}{' '}
              <Button
                variant="link"
                className="px-1"
                onClick={() => {
                  toast.error(t('list.table.loadError'));
                  usersQ.refetch();
                }}
              >
                {t('list.table.retryButton')}
              </Button>
            </div>
          ) : null}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('list.table.personelKodu')}</TableHead>
                  <TableHead>{t('list.table.fullName')}</TableHead>
                  <TableHead>{t('list.table.departmanEkip')}</TableHead>
                  <TableHead>{t('list.table.defaultMachine')}</TableHead>
                  <TableHead>{t('list.table.email')}</TableHead>
                  <TableHead>{t('list.table.phone')}</TableHead>
                  <TableHead>{t('list.table.status')}</TableHead>
                  <TableHead>{t('list.table.role')}</TableHead>
                  <TableHead className="text-right">{t('list.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {(usersQ.data ?? []).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{u.erp_personel_kodu ?? '—'}</TableCell>
                    <TableCell className="font-medium">{displayName(u)}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div>{u.erp_departman ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{u.erp_ekip ?? '—'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{u.varsayilan_makine_kod ?? '—'}</TableCell>
                    <TableCell>{u.email ?? '—'}</TableCell>
                    <TableCell>{u.phone ?? '—'}</TableCell>
                    <TableCell>{statusBadge(u)}</TableCell>
                    <TableCell>
                      <Badge variant={u.roles.includes('admin') ? 'default' : 'secondary'}>
                        {roleLabel((u.roles[0] ?? 'operator') as UserRoleName)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link prefetch={false} href={`/admin/users/${encodeURIComponent(u.id)}`}>
                          {t('list.table.viewButton')}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!usersQ.isFetching && (usersQ.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      {t('list.table.noRecords')}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {t('list.pagination.offset', { offset })} • {t('list.pagination.limit', { limit })}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canPrev || usersQ.isFetching}
                onClick={() => apply({ offset: Math.max(0, offset - limit) })}
              >
                <ChevronLeft className="mr-1 size-4" />
                {t('list.pagination.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canNext || usersQ.isFetching}
                onClick={() => apply({ offset: offset + limit })}
              >
                {t('list.pagination.next')}
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
