'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, KeyRound, LogIn, RefreshCcw, Route, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetGirisAyarlariAdminQuery, useUpdateGirisAyarlariAdminMutation } from '@/integrations/endpoints/admin/erp/giris_ayarlari_admin.endpoints';
import type { LoginRole } from '@/integrations/shared/erp/giris_ayarlari.types';

const ROLE_LABELS: Record<LoginRole, string> = {
  admin: 'Admin',
  sevkiyatci: 'Sevkiyat',
  operator: 'Operatör',
  satin_almaci: 'Satın Alma',
};

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function GirisAyarlariClient() {
  const query = useGetGirisAyarlariAdminQuery();
  const [updateSettings, updateState] = useUpdateGirisAyarlariAdminMutation();

  const [showQuickLogin, setShowQuickLogin] = useState(true);
  const [allowPasswordLogin, setAllowPasswordLogin] = useState(true);
  const [roleCardsEnabled, setRoleCardsEnabled] = useState(true);
  const [passwordMinLength, setPasswordMinLength] = useState('8');
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireSpecialChar, setRequireSpecialChar] = useState(false);
  const [enabledRoles, setEnabledRoles] = useState<LoginRole[]>(['admin', 'sevkiyatci', 'operator', 'satin_almaci']);
  const [redirects, setRedirects] = useState<Record<LoginRole, string>>({
    admin: '/admin/dashboard',
    sevkiyatci: '/admin/satis-siparisleri',
    operator: '/admin/operator',
    satin_almaci: '/admin/satin-alma',
  });

  useEffect(() => {
    const data = query.data;
    if (!data) return;
    setShowQuickLogin(data.settings.showQuickLogin);
    setAllowPasswordLogin(data.settings.allowPasswordLogin);
    setRoleCardsEnabled(data.settings.roleCardsEnabled);
    setPasswordMinLength(String(data.settings.passwordPolicy.minLength));
    setRequireUppercase(data.settings.passwordPolicy.requireUppercase);
    setRequireNumber(data.settings.passwordPolicy.requireNumber);
    setRequireSpecialChar(data.settings.passwordPolicy.requireSpecialChar);
    setEnabledRoles(data.settings.enabledRoles);
    setRedirects(data.settings.redirects);
  }, [query.data]);

  async function handleSave() {
    const parsedMinLength = Number(passwordMinLength);
    if (!Number.isFinite(parsedMinLength) || parsedMinLength < 6) {
      toast.error('Minimum şifre uzunluğu en az 6 olmalı.');
      return;
    }

    try {
      await updateSettings({
        showQuickLogin,
        allowPasswordLogin,
        roleCardsEnabled,
        passwordPolicy: {
          minLength: parsedMinLength,
          requireUppercase,
          requireNumber,
          requireSpecialChar,
        },
        enabledRoles,
        redirects,
      }).unwrap();
      toast.success('Giriş ayarları güncellendi.');
    } catch (error: any) {
      toast.error(error?.data?.error?.message ?? 'Giriş ayarları güncellenemedi.');
    }
  }

  function toggleRole(role: LoginRole, checked: boolean) {
    setEnabledRoles((current) => {
      if (checked) return Array.from(new Set([...current, role]));
      return current.filter((item) => item !== role);
    });
  }

  const data = query.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Giriş Ayarları</h1>
          <p className="text-sm text-muted-foreground">Admin, sevkiyat, operatör ve satın alma giriş akışlarını tek ekrandan izleyin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCcw className={`mr-2 size-4${query.isFetching ? ' animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={updateState.isLoading || query.isLoading}>
            Kaydet
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard title="Toplam Giriş Kullanıcısı" value={String(data?.summary.totalLoginUsers ?? 0)} icon={Users} />
        <InfoCard title="Aktif Hesap" value={String(data?.summary.activeLoginUsers ?? 0)} icon={ShieldCheck} />
        <InfoCard title="Pasif Hesap" value={String(data?.summary.passiveLoginUsers ?? 0)} icon={AlertTriangle} danger />
        <InfoCard title="Geçici Login" value={data?.runtime.tempLoginEnabled ? 'Açık' : 'Kapalı'} icon={KeyRound} danger={data?.runtime.tempLoginEnabled === true} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Canlı Auth Durumu</CardTitle>
            <CardDescription>Ortam ve yönlendirme bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {query.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <Row label="Frontend URL" value={data?.runtime.frontendUrl ?? '—'} />
                <Row label="Public URL" value={data?.runtime.publicUrl ?? '—'} />
                <Row label="CORS" value={(data?.runtime.corsOrigins ?? []).join(', ') || '—'} />
                <Row label="Login Logo" value={data?.branding.loginLogoUrl ?? 'Tanımlı değil'} />
                <Row label="Admin Allowlist" value={(data?.runtime.adminAllowlist ?? []).join(', ') || 'Tanımlı değil'} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ERP Login Tercihleri</CardTitle>
            <CardDescription>DB üzerinden yönetilen panel davranışları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow label="Hızlı giriş butonlarını göster" checked={showQuickLogin} onCheckedChange={setShowQuickLogin} />
            <ToggleRow label="Şifre ile girişe izin ver" checked={allowPasswordLogin} onCheckedChange={setAllowPasswordLogin} />
            <ToggleRow label="Rol kartlarını göster" checked={roleCardsEnabled} onCheckedChange={setRoleCardsEnabled} />

            <div className="space-y-3 rounded-md border p-3">
              <div>
                <Label>Şifre Politikası</Label>
                <p className="text-xs text-muted-foreground">ERP paneline giriş yapan tüm kullanıcılar için temel parola kuralları.</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Minimum Şifre Uzunluğu</Label>
                <Input
                  type="number"
                  min={6}
                  max={64}
                  value={passwordMinLength}
                  onChange={(event) => setPasswordMinLength(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <ToggleRow label="En az 1 büyük harf zorunlu" checked={requireUppercase} onCheckedChange={setRequireUppercase} />
                <ToggleRow label="En az 1 rakam zorunlu" checked={requireNumber} onCheckedChange={setRequireNumber} />
                <ToggleRow label="Özel karakter zorunlu" checked={requireSpecialChar} onCheckedChange={setRequireSpecialChar} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Aktif Rol Kartları</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(ROLE_LABELS) as LoginRole[]).map((role) => (
                  <div key={role} className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm">{ROLE_LABELS[role]}</span>
                    <Switch checked={enabledRoles.includes(role)} onCheckedChange={(checked) => toggleRole(role, checked)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rol Yönlendirmeleri</Label>
              <div className="grid gap-3">
                {(Object.keys(ROLE_LABELS) as LoginRole[]).map((role) => (
                  <div key={role} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</Label>
                    <Input value={redirects[role]} onChange={(event) => setRedirects((current) => ({ ...current, [role]: event.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rol Bazlı Giriş Hesapları</CardTitle>
          <CardDescription>Admin, sevkiyat, operatör ve satın alma için aktif kullanıcı durumu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol</TableHead>
                  <TableHead>Birincil Kullanıcı</TableHead>
                  <TableHead>Aktif / Toplam</TableHead>
                  <TableHead>Son Giriş</TableHead>
                  <TableHead>Hedef Route</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading && Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={`login-role-skeleton-${index}`}>
                    {Array.from({ length: 5 }).map((__, cellIndex) => (
                      <TableCell key={`login-role-skeleton-cell-${cellIndex}`}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}
                {!query.isLoading && (data?.roles ?? []).map((role) => (
                  <TableRow key={role.role}>
                    <TableCell><Badge variant="secondary">{ROLE_LABELS[role.role]}</Badge></TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium">{role.primaryUserName ?? 'Tanımlı değil'}</div>
                        <div className="text-xs text-muted-foreground">{role.primaryUserEmail ?? '—'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{role.activeCount} / {role.totalCount}</TableCell>
                    <TableCell>{formatDateTime(role.lastLoginAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{redirects[role.role]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mevcut Durum ve Eksikler</CardTitle>
          <CardDescription>Canlı sistemden türetilen açık noktalar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(data?.gaps ?? []).length === 0 ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Kritik bir giriş açığı görünmüyor.
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.gaps ?? []).map((gap) => (
                <div key={gap} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {gap}
                </div>
              ))}
            </div>
          )}
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            Bu modül şu an canlı auth durumunu izler ve ERP login tercihlerini yönetir. Şifre politikası eklendi; 2FA, IP kısıtları ve kullanıcı bazlı login exception kuralları henüz yok.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({
  title,
  value,
  icon: Icon,
  danger = false,
}: {
  title: string;
  value: string;
  icon: typeof LogIn;
  danger?: boolean;
}) {
  return (
    <Card className={danger ? 'border-amber-200 bg-amber-50/50' : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className={`size-4 ${danger ? 'text-amber-700' : 'text-muted-foreground'}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right">{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
