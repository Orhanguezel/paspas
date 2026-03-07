'use client';

import Link from 'next/link';
import { Suspense } from 'react';

import { LoginForm } from '../../_components/login-form';
import { useLoginBranding } from '../../_components/use-login-branding';

function LoginFormFallback() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export default function SellerLoginPage() {
  const { loginLogo, appName } = useLoginBranding();

  return (
    <div className="flex min-h-dvh">
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            {loginLogo ? (
              <div className="relative mx-auto size-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={loginLogo} alt={appName} className="size-full object-contain" />
              </div>
            ) : (
              <div className="mx-auto flex size-24 items-center justify-center rounded-xl bg-primary-foreground/10">
                <span className="text-3xl font-bold text-primary-foreground">{appName.charAt(0)}</span>
              </div>
            )}
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-primary-foreground">Satici Girisi</h1>
              <p className="text-xl text-primary-foreground/80">Magazanizi ve kampanyalarinizi yonetin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">Satici Hesabina Giris</div>
            <div className="mx-auto max-w-xl text-muted-foreground">Bu alan sadece satici hesaplari icindir.</div>
          </div>

          <div className="space-y-4">
            <Suspense fallback={<LoginFormFallback />}>
              <LoginForm mode="seller" fallbackNext="/admin/dashboard" />
            </Suspense>

            <p className="text-center text-muted-foreground text-xs">
              Hesabin yok mu?{' '}
              <Link prefetch={false} href="/auth/seller/register" className="text-primary underline-offset-4 hover:underline">
                Satici kaydi olustur
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
