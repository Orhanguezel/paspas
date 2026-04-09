'use client';

// =============================================================
// FILE: src/app/(main)/admin/users/[id]/_components/user-detail-client.tsx
// FINAL — Admin User Detail (RTK auth_admin.endpoints uyumlu)
// - roles: admin | operator | satin_almaci | sevkiyatci
// - mutations payload: AdminUpdateUserBody, AdminSetActiveBody, etc.
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, ShieldCheck, KeyRound, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import type { UserRoleName, AdminUserView } from '@/integrations/shared';

import {
  useGetUserAdminQuery,
  useUpdateUserAdminMutation,
  useSetUserActiveAdminMutation,
  useSetUserRolesAdminMutation,
  useSetUserPasswordAdminMutation,
  useRemoveUserAdminMutation,
} from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { useListMakinelerAdminQuery } from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';

const ALL_ROLES: UserRoleName[] = ['admin', 'operator', 'satin_almaci', 'sevkiyatci'];

function isAdminFromView(u: AdminUserView): boolean {
  return u.roles.includes('admin');
}

export default function UserDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const t = useAdminT();

  function getErrMessage(err: unknown): string {
    const anyErr = err as any;
    const m1 = anyErr?.data?.error?.message;
    if (typeof m1 === 'string' && m1.trim()) return m1;
    const m2 = anyErr?.data?.message;
    if (typeof m2 === 'string' && m2.trim()) return m2;
    const m3 = anyErr?.error;
    if (typeof m3 === 'string' && m3.trim()) return m3;
    return t('admin.users.detail.errorFallback');
  }

  function roleLabel(r: UserRoleName) {
    if (r === 'admin') return t('admin.users.detail.roles.admin');
    if (r === 'operator') return t('admin.users.detail.roles.operator');
    if (r === 'satin_almaci') return t('admin.users.detail.roles.satin_almaci');
    return t('admin.users.detail.roles.sevkiyatci');
  }

  const userQ = useGetUserAdminQuery({ id });
  const makinelerQ = useListMakinelerAdminQuery({ durum: 'aktif' });

  const [updateUser, updateState] = useUpdateUserAdminMutation();
  const [setActive, setActiveState] = useSetUserActiveAdminMutation();
  const [setRoles, setRolesState] = useSetUserRolesAdminMutation();
  const [setPassword, setPasswordState] = useSetUserPasswordAdminMutation();
  const [removeUser, removeState] = useRemoveUserAdminMutation();

  const u = userQ.data;

  // form state
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [personelKodu, setPersonelKodu] = React.useState('');
  const [departman, setDepartman] = React.useState('');
  const [ekip, setEkip] = React.useState('');
  const [varsayilanMakineId, setVarsayilanMakineId] = React.useState('');
  const [erpNotlar, setErpNotlar] = React.useState('');
  const [password, setPasswordLocal] = React.useState('');
  const [active, setActiveLocal] = React.useState(true);

  const [roles, setRolesLocal] = React.useState<UserRoleName[]>([]);

  React.useEffect(() => {
    if (!u) return;
    setFullName(u.full_name ?? '');
    setPhone(u.phone ?? '');
    setEmail(u.email ?? '');
    setPersonelKodu(u.erp_personel_kodu ?? '');
    setDepartman(u.erp_departman ?? '');
    setEkip(u.erp_ekip ?? '');
    setVarsayilanMakineId(u.varsayilan_makine_id ?? '');
    setErpNotlar(u.erp_notlar ?? '');
    setActiveLocal(!!u.is_active);

    setRolesLocal(u.roles.length > 0 ? u.roles : ['operator']);
  }, [u, id]);

  const busy =
    userQ.isFetching ||
    updateState.isLoading ||
    setActiveState.isLoading ||
    setRolesState.isLoading ||
    setPasswordState.isLoading ||
    removeState.isLoading;

  async function onSaveProfile() {
    try {
      await updateUser({
        id,
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || undefined,
        erp_personel_kodu: personelKodu.trim() || null,
        erp_departman: departman.trim() || null,
        erp_ekip: ekip.trim() || null,
        varsayilan_makine_id: varsayilanMakineId || null,
        erp_notlar: erpNotlar.trim() || null,
      }).unwrap();

      toast.success(t('admin.users.detail.profile.saved'));
      userQ.refetch();
    } catch (err) {
      toast.error(getErrMessage(err));
    }
  }

  async function onToggleActive(next: boolean) {
    const prev = active;
    try {
      setActiveLocal(next);
      await setActive({ id, is_active: next }).unwrap();
      toast.success(next ? t('admin.users.detail.status.activated') : t('admin.users.detail.status.deactivated'));
      userQ.refetch();
    } catch (err) {
      setActiveLocal(prev);
      toast.error(getErrMessage(err));
    }
  }

  async function onSaveRoles() {
    // backend: roles: UserRoleName[] (set)
    // UI'da single-select gibi davranıyoruz; yine de array gönderiyoruz.
    try {
      await setRoles({ id, roles }).unwrap();
      toast.success(t('admin.users.detail.roles.saved'));
      userQ.refetch();
    } catch (err) {
      toast.error(getErrMessage(err));
    }
  }

  async function onSetPassword() {
    const p = password.trim();
    if (p.length < 8) {
      toast.error(t('admin.users.detail.password.minLengthError'));
      return;
    }
    try {
      await setPassword({ id, password: p }).unwrap();
      toast.success(t('admin.users.detail.password.updated'));
      setPasswordLocal('');
    } catch (err) {
      toast.error(getErrMessage(err));
    }
  }

  async function onDeleteUser() {
    if (!confirm(t('admin.users.detail.delete.confirm'))) return;
    try {
      await removeUser({ id }).unwrap();
      toast.success(t('admin.users.detail.delete.deleted'));
      router.replace('/admin/users');
      router.refresh();
    } catch (err) {
      toast.error(getErrMessage(err));
    }
  }

  // çoklu rol seçimi – payload array olarak kaydedilir
  function chooseRole(r: UserRoleName) {
    setRolesLocal((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  }

  if (userQ.isError) {
    return (
      <div className="space-y-3">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 size-4" />
          {t('admin.users.detail.backButton')}
        </Button>
        <div className="rounded-md border p-4 text-sm">
          {t('admin.users.detail.loadError')}{' '}
          <Button variant="link" className="px-1" onClick={() => userQ.refetch()}>
            {t('admin.users.detail.retryButton')}
          </Button>
        </div>
      </div>
    );
  }

  if (!u) {
    return (
      <div className="space-y-3">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 size-4" />
          {t('admin.users.detail.backButton')}
        </Button>
        <div className="rounded-md border p-4 text-sm text-muted-foreground">{t('admin.users.detail.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()} disabled={busy}>
              <ArrowLeft className="mr-2 size-4" />
              {t('admin.users.detail.backButton')}
            </Button>
            <h1 className="text-lg font-semibold">{t('admin.users.detail.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {u.full_name ? u.full_name : t('admin.users.detail.unknownUser')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isAdminFromView(u) ? 'default' : 'secondary'}>
            {roleLabel((u.roles[0] ?? 'operator') as UserRoleName)}
          </Badge>
          {u.is_active ? (
            <Badge variant="secondary">{t('admin.users.detail.statusActive')}</Badge>
          ) : (
            <Badge variant="destructive">{t('admin.users.detail.statusInactive')}</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.users.detail.profile.title')}</CardTitle>
          <CardDescription>
            {t('admin.users.detail.profile.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="email">{t('admin.users.detail.profile.emailLabel')}</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">{t('admin.users.detail.profile.fullNameLabel')}</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('admin.users.detail.profile.phoneLabel')}</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="personel_kodu">{t('admin.users.detail.erp.personelKodu')}</Label>
              <Input id="personel_kodu" value={personelKodu} onChange={(e) => setPersonelKodu(e.target.value)} disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departman">{t('admin.users.detail.erp.departman')}</Label>
              <Input id="departman" value={departman} onChange={(e) => setDepartman(e.target.value)} disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ekip">{t('admin.users.detail.erp.ekip')}</Label>
              <Input id="ekip" value={ekip} onChange={(e) => setEkip(e.target.value)} disabled={busy} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('admin.users.detail.erp.varsayilanMakine')}</Label>
              <Select
                value={varsayilanMakineId || 'none'}
                onValueChange={(value) => setVarsayilanMakineId(value === 'none' ? '' : value)}
              >
                <SelectTrigger disabled={busy || makinelerQ.isFetching}>
                  <SelectValue placeholder={t('admin.users.detail.erp.varsayilanMakinePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('admin.users.detail.erp.varsayilanMakineNone')}</SelectItem>
                  {(makinelerQ.data?.items ?? []).map((makine) => (
                    <SelectItem key={makine.id} value={makine.id}>
                      {makine.kod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.users.detail.erp.atananRolOzeti')}</Label>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                {roleLabel(currentRole)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="erp_notlar">{t('admin.users.detail.erp.notlar')}</Label>
            <Textarea id="erp_notlar" rows={3} value={erpNotlar} onChange={(e) => setErpNotlar(e.target.value)} disabled={busy} />
          </div>

          <div className="flex justify-end">
            <Button onClick={onSaveProfile} disabled={busy}>
              <Save className="mr-2 size-4" />
              {t('admin.users.detail.profile.saveButton')}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">{t('admin.users.detail.status.title')}</div>
              <div className="text-sm text-muted-foreground">{t('admin.users.detail.status.description')}</div>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">{active ? t('admin.users.detail.status.active') : t('admin.users.detail.status.inactive')}</Label>
              <Switch checked={active} onCheckedChange={onToggleActive} disabled={busy} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.users.detail.roles.title')}</CardTitle>
          <CardDescription>{t('admin.users.detail.roles.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map((r) => {
              const checked = roles.includes(r);
              return (
                <Button
                  key={r}
                  type="button"
                  variant={checked ? 'default' : 'outline'}
                  onClick={() => chooseRole(r)}
                  disabled={busy}
                >
                  <ShieldCheck className="mr-2 size-4" />
                  {roleLabel(r)}
                </Button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            {t('admin.users.detail.roles.currentRole')}
            {roles.length === 0
              ? <Badge className="ml-1" variant="secondary">—</Badge>
              : roles.map((r) => (
                  <Badge key={r} className="ml-1" variant={r === 'admin' ? 'default' : 'secondary'}>
                    {roleLabel(r as UserRoleName)}
                  </Badge>
                ))
            }
          </div>

          <div className="flex justify-end">
            <Button onClick={onSaveRoles} disabled={busy}>
              <Save className="mr-2 size-4" />
              {t('admin.users.detail.roles.saveButton')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.users.detail.password.title')}</CardTitle>
          <CardDescription>{t('admin.users.detail.password.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">{t('admin.users.detail.password.label')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('admin.users.detail.password.placeholder')}
                value={password}
                onChange={(e) => setPasswordLocal(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onSetPassword} disabled={busy}>
              <KeyRound className="mr-2 size-4" />
              {t('admin.users.detail.password.updateButton')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base">{t('admin.users.detail.delete.title')}</CardTitle>
          <CardDescription>{t('admin.users.detail.delete.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end">
          <Button variant="destructive" onClick={onDeleteUser} disabled={busy}>
            <Trash2 className="mr-2 size-4" />
            {t('admin.users.detail.delete.button')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
