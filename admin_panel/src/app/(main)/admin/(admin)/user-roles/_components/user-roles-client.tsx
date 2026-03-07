'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Check, Plus, RefreshCcw, Save, Shield, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import type { AdminUserView, Permission, Role, UserRole, UserRoleName, UserRolesListParams } from '@/integrations/shared';
import {
  useAdminGetQuery,
  useAdminListQuery,
  useAdminUserRoleCreateMutation,
  useAdminUserRoleDeleteMutation,
  useAdminUserRolesListQuery,
  useListPermissionsAdminQuery,
  useListRolesAdminQuery,
  useSetRolePermissionsAdminMutation,
} from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

type UserOption = { id: string; name: string };

function roleLabel(t: ReturnType<typeof useAdminT>, role: UserRoleName): string {
  if (role === 'admin') return t('roles.admin');
  if (role === 'operator') return t('roles.operator');
  if (role === 'satin_almaci') return t('roles.satin_almaci');
  return t('roles.sevkiyatci');
}

function userName(u: Pick<AdminUserView, 'full_name' | 'erp_personel_kodu'>): string {
  const name = String(u.full_name ?? '').trim() || 'Isimsiz Kullanici';
  return u.erp_personel_kodu ? `${name} (${u.erp_personel_kodu})` : name;
}

function groupPermissions(items: Permission[]) {
  return items.reduce<Record<string, Permission[]>>((acc, item) => {
    const key = item.group ?? 'Diger';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function PermissionMatrix({
  roles,
  permissions,
  onSave,
  loading,
}: {
  roles: Role[];
  permissions: Permission[];
  onSave: (slug: string, permissions: string[]) => Promise<void>;
  loading: boolean;
}) {
  const grouped = React.useMemo(() => groupPermissions(permissions), [permissions]);
  const [drafts, setDrafts] = React.useState<Record<string, Set<string>>>({});

  React.useEffect(() => {
    const next: Record<string, Set<string>> = {};
    for (const role of roles) next[role.slug] = new Set(role.permissions);
    setDrafts(next);
  }, [roles]);

  function toggle(roleSlug: string, permissionKey: string, checked: boolean) {
    setDrafts((prev) => {
      const next = { ...prev };
      const current = new Set(next[roleSlug] ?? []);
      if (checked) current.add(permissionKey);
      else current.delete(permissionKey);
      next[roleSlug] = current;
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Permission Matrisi</CardTitle>
        <CardDescription>Her rol icin goruntule / olustur / guncelle / sil yetkilerini modul bazinda yonetin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(grouped).map(([group, groupItems]) => (
          <div key={group} className="space-y-3">
            <div className="text-sm font-medium">{group}</div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Yetki</TableHead>
                    {roles.map((role) => (
                      <TableHead key={role.slug}>{role.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupItems.map((permission) => (
                    <TableRow key={permission.key}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-medium">{permission.name}</div>
                          <div className="text-xs text-muted-foreground">{permission.description ?? permission.key}</div>
                        </div>
                      </TableCell>
                      {roles.map((role) => {
                        const checked = drafts[role.slug]?.has(permission.key) ?? false;
                        return (
                          <TableCell key={`${role.slug}-${permission.key}`}>
                            <Checkbox
                              checked={checked}
                              disabled={loading}
                              onCheckedChange={(value) => toggle(role.slug, permission.key, value === true)}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}

        <div className="flex flex-wrap justify-end gap-2">
          {roles.map((role) => (
            <Button
              key={role.slug}
              variant="outline"
              disabled={loading}
              onClick={() => void onSave(role.slug, Array.from(drafts[role.slug] ?? []))}
            >
              <Save className="mr-2 size-4" />
              {role.name} Kaydet
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserRolesClient() {
  const t = useAdminT('admin.userRoles');

  const usersQ = useAdminListQuery({ limit: 200, offset: 0, sort: 'created_at', order: 'desc' }, { refetchOnMountOrArgChange: true });
  const rolesQ = useAdminUserRolesListQuery({ order: 'created_at', direction: 'desc', limit: 100, offset: 0 } satisfies UserRolesListParams);
  const roleDefsQ = useListRolesAdminQuery();
  const permissionsQ = useListPermissionsAdminQuery();

  const [createRole, createState] = useAdminUserRoleCreateMutation();
  const [deleteRole, deleteState] = useAdminUserRoleDeleteMutation();
  const [setRolePermissions, setRolePermissionsState] = useSetRolePermissionsAdminMutation();

  const [newUserId, setNewUserId] = React.useState('');
  const [newRole, setNewRole] = React.useState<UserRoleName>('operator');

  const userOptions = React.useMemo<UserOption[]>(
    () =>
      (usersQ.data ?? [])
        .map((u) => ({ id: u.id, name: userName(u) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'tr')),
    [usersQ.data],
  );

  const userIds = React.useMemo(() => Array.from(new Set((rolesQ.data ?? []).map((row) => row.user_id))), [rolesQ.data]);
  const [queueId, setQueueId] = React.useState('');
  const [cache, setCache] = React.useState<Map<string, AdminUserView>>(new Map());
  const userGetQ = useAdminGetQuery({ id: queueId }, { skip: !queueId, refetchOnMountOrArgChange: true });

  React.useEffect(() => {
    if (!usersQ.data?.length) return;
    setCache((prev) => {
      const next = new Map(prev);
      for (const user of usersQ.data ?? []) next.set(user.id, user);
      return next;
    });
  }, [usersQ.data]);

  React.useEffect(() => {
    if (queueId || userIds.length === 0) return;
    const missing = userIds.find((id) => !cache.has(id));
    if (missing) setQueueId(missing);
  }, [queueId, userIds, cache]);

  React.useEffect(() => {
    if (!queueId) return;
    if (userGetQ.data) {
      setCache((prev) => {
        const next = new Map(prev);
        next.set(queueId, userGetQ.data!);
        return next;
      });
      setQueueId('');
      return;
    }
    if (userGetQ.isError) setQueueId('');
  }, [queueId, userGetQ.data, userGetQ.isError]);

  async function onCreateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserId) {
      toast.error(t('create.selectUser'));
      return;
    }
    try {
      await createRole({ user_id: newUserId, role: newRole }).unwrap();
      toast.success(t('create.added'));
      setNewUserId('');
      setNewRole('operator');
      rolesQ.refetch();
    } catch (error: any) {
      toast.error(error?.data?.error?.message ?? t('errorFallback'));
    }
  }

  async function onDeleteRole(row: UserRole) {
    const targetUser = cache.get(row.user_id);
    if (!confirm(t('table.deleteConfirm', { user: targetUser ? userName(targetUser) : row.user_id, role: roleLabel(t, row.role as UserRoleName) }))) return;
    try {
      await deleteRole({ id: row.id }).unwrap();
      toast.success(t('table.deleted'));
      rolesQ.refetch();
    } catch (error: any) {
      toast.error(error?.data?.error?.message ?? t('errorFallback'));
    }
  }

  async function onSavePermissions(slug: string, permissions: string[]) {
    try {
      await setRolePermissions({ slug, permissions }).unwrap();
      toast.success(`${slug} yetkileri kaydedildi`);
      roleDefsQ.refetch();
    } catch (error: any) {
      toast.error(error?.data?.error?.message ?? t('errorFallback'));
    }
  }

  const busy = createState.isLoading || deleteState.isLoading || setRolePermissionsState.isLoading;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Rol ve Permission Yonetimi</h1>
        <p className="text-sm text-muted-foreground">Kullanici rollerini atayin, ardindan rol bazli yetki matrisini guncelleyin.</p>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => { rolesQ.refetch(); roleDefsQ.refetch(); permissionsQ.refetch(); usersQ.refetch(); }} disabled={busy}>
          <RefreshCcw className="mr-2 size-4" />
          Yenile
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('create.title')}</CardTitle>
          <CardDescription>{t('create.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreateRole} className="grid gap-3 md:grid-cols-3 md:items-end">
            <div className="space-y-2 md:col-span-2">
              <Label>{t('create.userLabel')}</Label>
              <Select value={newUserId} onValueChange={setNewUserId} disabled={busy}>
                <SelectTrigger>
                  <SelectValue placeholder={t('create.userPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {userOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('create.roleLabel')}</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRoleName)} disabled={busy}>
                <SelectTrigger>
                  <SelectValue placeholder={t('create.rolePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{roleLabel(t, 'admin')}</SelectItem>
                  <SelectItem value="operator">{roleLabel(t, 'operator')}</SelectItem>
                  <SelectItem value="satin_almaci">{roleLabel(t, 'satin_almaci')}</SelectItem>
                  <SelectItem value="sevkiyatci">{roleLabel(t, 'sevkiyatci')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={busy}>
                <Plus className="mr-2 size-4" />
                {t('create.addButton')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('list.title')}</CardTitle>
          <CardDescription>Kullaniciya atanmis roller. Bir kullanicida birden fazla rol olabilir; en yuksek rol etkili olur.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.userColumn')}</TableHead>
                  <TableHead>{t('table.roleColumn')}</TableHead>
                  <TableHead>{t('table.createdColumn')}</TableHead>
                  <TableHead>{t('table.actionColumn')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rolesQ.data ?? []).map((row) => {
                  const currentUser = cache.get(row.user_id);
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{currentUser ? userName(currentUser) : row.user_id}</TableCell>
                      <TableCell>
                        <Badge variant={row.role === 'admin' ? 'default' : 'secondary'}>
                          {roleLabel(t, row.role as UserRoleName)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(String(row.created_at)).toLocaleString('tr-TR')}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => void onDeleteRole(row)} disabled={busy}>
                          <Trash2 className="mr-2 size-4" />
                          {t('table.deleteButton')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!rolesQ.isFetching && (rolesQ.data?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      {t('list.noRecords')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {roleDefsQ.data && permissionsQ.data ? (
        <PermissionMatrix
          roles={roleDefsQ.data}
          permissions={permissionsQ.data}
          onSave={onSavePermissions}
          loading={busy}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="size-4" />
              Permission Matrisi
            </CardTitle>
            <CardDescription>Yetki kataloğu yukleniyor...</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yetki Kurali</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Check className="size-4 text-emerald-600" /> GET istekleri `goruntule`, POST istekleri `olustur`, PATCH/PUT istekleri `guncelle`, DELETE istekleri `sil` yetkisine baglidir.</div>
          <div className="flex items-center gap-2"><Check className="size-4 text-emerald-600" /> Bir rol icin matriste kayit varsa backend artik statik rol dagilimi yerine bu matrisi esas alir.</div>
        </CardContent>
      </Card>
    </div>
  );
}
