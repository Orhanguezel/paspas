// src/app/(main)/auth/login/page.tsx
'use client';

import Link from 'next/link';
import { Suspense } from 'react';

import { LoginForm } from '../_components/login-form';
import { QuickLoginButtons } from '../_components/quick-login-buttons';
import { useLoginBranding } from '../_components/use-login-branding';
import { useLocaleContext } from '@/i18n';

function LoginFormFallback() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
    </div>
  );
}

export default function Login() {
  const { t } = useLocaleContext();
  const { loginLogo, appName } = useLoginBranding();

  return (
    <div className="flex min-h-dvh">
      {/* Sol (marka) */}
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            {loginLogo ? (
              <div className="mx-auto size-48 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={loginLogo}
                  alt={appName}
                  className="size-full object-contain"
                />
              </div>
            ) : (
              <div className="mx-auto flex size-48 items-center justify-center rounded-xl bg-primary-foreground/10">
                <span className="text-3xl font-bold text-primary-foreground">
                  {appName.charAt(0)}
                </span>
              </div>
            )}
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-primary-foreground">
                {t('admin.auth.login.welcomeBack')}
              </h1>
              <p className="text-primary-foreground/80 text-xl">
                {t('admin.auth.login.continueLogin')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sağ (form) */}
      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">{t('admin.auth.login.title')}</div>
            <div className="mx-auto max-w-xl text-muted-foreground">
              {t('admin.auth.login.description')}
            </div>
            <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
              Bu bir deneme
            </div>
          </div>

          <div className="space-y-4">
            {/* ✅ Next 16: useSearchParams kullanan client component Suspense ister */}
            <Suspense fallback={<LoginFormFallback />}>
              <LoginForm />
            </Suspense>

            <QuickLoginButtons />

            {/* Admin-only: self-register yok */}
            <p className="text-center text-muted-foreground text-xs">
              {t('admin.auth.login.noAccess')}{' '}
              <Link
                prefetch={false}
                href="/auth/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t('admin.auth.login.contactAdmin')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
