'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Camera, Loader2, Save } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { useStatusQuery, useAuthUpdateMutation } from '@/integrations/hooks';
import { useGetMyProfileQuery, useUpsertMyProfileMutation } from '@/integrations/hooks';
import { useCreateAssetAdminMutation } from '@/integrations/endpoints/admin/storage_admin.endpoints';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

export function ProfileForm() {
  const t = useAdminT();
  const { data: statusData } = useStatusQuery();
  const { data: profileData, isLoading: isProfileLoading } = useGetMyProfileQuery();
  const [upsertProfile, { isLoading: isUpdatingProfile }] = useUpsertMyProfileMutation();
  const [updateAuthUser, { isLoading: isUpdatingAuth }] = useAuthUpdateMutation();
  const [createAsset, { isLoading: isUploading }] = useCreateAssetAdminMutation();

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState('');

  React.useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name || '');
      setAvatarUrl(profileData.avatar_url || '');
    }
  }, [profileData]);

  React.useEffect(() => {
    if (statusData?.user) {
      setEmail(statusData.user.email || '');
    }
  }, [statusData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const asset = await createAsset({
        file,
        bucket: 'avatars',
        folder: 'profiles',
      }).unwrap();

      if (asset.url) {
        setAvatarUrl(asset.url);
        toast.success(t('admin.profile.avatarUploaded') || 'Profil resmi yüklendi.');
      }
    } catch (err) {
      toast.error(t('admin.profile.avatarUploadFailed') || 'Resim yüklenemedi.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const trimmedName = fullName.trim();
      const trimmedAvatar = avatarUrl.trim();

      // 1. Update Profile (Full Name, Avatar)
      await upsertProfile({
        profile: {
          ...(trimmedName ? { full_name: trimmedName } : {}),
          ...(trimmedAvatar ? { avatar_url: trimmedAvatar } : {}),
        },
      }).unwrap();

      // 2. Update Auth User (Email)
      if (email !== statusData?.user?.email) {
        await updateAuthUser({
          email,
        }).unwrap();
      }

      toast.success(t('admin.profile.updated') || 'Profil başarıyla güncellendi.');
    } catch (err) {
      toast.error(t('admin.profile.updateFailed') || 'Profil güncellenemedi.');
    }
  };

  const isAnyLoading = isProfileLoading || isUpdatingProfile || isUpdatingAuth || isUploading;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.profile.personalInfo') || 'Kişisel Bilgiler'}</CardTitle>
          <CardDescription>
            {t('admin.profile.personalInfoDesc') || 'Adınız, e-posta adresiniz ve profil resminiz.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-muted">
                <AvatarImage src={avatarUrl || undefined} alt={fullName} />
                <AvatarFallback className="text-xl">{getInitials(fullName || email || 'A')}</AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
                disabled={isAnyLoading}
              />
            </div>
            <div className="flex-1 space-y-1 text-center sm:text-left">
              <h4 className="font-semibold">{fullName || email || 'Admin'}</h4>
              <p className="text-sm text-muted-foreground">
                {avatarUrl ? (t('admin.profile.avatarSet') || 'Özel profil resmi ayarlandı') : (t('admin.profile.noAvatar') || 'Varsayılan avatar kullanılıyor')}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">{t('admin.profile.name') || 'Tam Ad'}</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                disabled={isAnyLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('admin.profile.email') || 'E-posta'}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={isAnyLoading}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isAnyLoading} className="w-full sm:w-auto">
            {isUpdatingProfile || isUpdatingAuth ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('admin.common.saving') || 'Kaydediliyor...'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('admin.common.save') || 'Kaydet'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
