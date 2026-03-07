'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Key, Loader2, Save } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { useAuthUpdateMutation } from '@/integrations/hooks';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PasswordForm() {
  const t = useAdminT();
  const [updateUser, { isLoading }] = useAuthUpdateMutation();

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error(t('admin.profile.passwordRequired') || 'Yeni şifre gerekli.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('admin.profile.passwordsDontMatch') || 'Şifreler uyuşmuyor.');
      return;
    }

    try {
      await updateUser({
        password,
      }).unwrap();

      setPassword('');
      setConfirmPassword('');
      toast.success(t('admin.profile.passwordUpdated') || 'Şifre başarıyla güncellendi.');
    } catch (err) {
      toast.error(t('admin.profile.passwordUpdateFailed') || 'Şifre güncellenemedi.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.profile.security') || 'Güvenlik'}</CardTitle>
          <CardDescription>
            {t('admin.profile.securityDesc') || 'Hesap güvenliğiniz için şifrenizi güncelleyin.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="new-password">{t('admin.profile.newPassword') || 'Yeni Şifre'}</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">{t('admin.profile.confirmPassword') || 'Şifreyi Onayla'}</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('admin.common.saving') || 'Kaydediliyor...'}
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                {t('admin.profile.changePassword') || 'Şifre Değiştir'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
