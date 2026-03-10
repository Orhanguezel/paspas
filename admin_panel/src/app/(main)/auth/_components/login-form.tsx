'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { useAuthTokenMutation } from '@/integrations/hooks';
import { useAdminTranslations } from '@/i18n';
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { ROLE_HOME } from '@/navigation/permissions';
import type { PanelRole } from '@/navigation/permissions';

type FormValues = {
  email: string;
  password: string;
  remember?: boolean;
};

function safeNext(next: string | null | undefined, fallback: string): string {
  const v = String(next ?? '').trim();
  if (!v || !v.startsWith('/')) return fallback;
  if (v.startsWith('//')) return fallback;
  return v;
}

function getErrMessage(err: unknown, fallback: string): string {
  const anyErr = err as any;

  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;

  const m1b = anyErr?.data?.error;
  if (typeof m1b === 'string' && m1b.trim()) return m1b;

  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;

  const m3 = anyErr?.error;
  if (typeof m3 === 'string' && m3.trim()) return m3;

  return fallback;
}

type LoginFormProps = {
  mode?: 'admin' | 'seller';
  fallbackNext?: string;
};

export function LoginForm({ mode = 'admin', fallbackNext }: LoginFormProps = {}) {
  const router = useRouter();
  const sp = useSearchParams();
  const locale = useLocaleShort();
  const t = useAdminTranslations(locale);

  const [login, loginState] = useAuthTokenMutation();

  const FormSchema = z.object({
    email: z.string().email({ message: t('admin.auth.login.emailRequired') }),
    password: z.string().min(6, { message: t('admin.auth.login.passwordMinLength') }),
    remember: z.boolean().optional(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await login({
        grant_type: 'password',
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }).unwrap();

      const role = String(res?.user?.role ?? 'user').trim().toLowerCase();
      const ERP_ROLES = new Set(['admin', 'sevkiyatci', 'operator', 'satin_almaci']);
      const isAdmin = role === 'admin';
      const isSeller = role === 'seller';
      const allowed = mode === 'seller' ? isSeller || isAdmin : ERP_ROLES.has(role);
      if (!allowed) {
        toast.error(t('admin.auth.login.loginFailed'));
        return;
      }

      toast.success(t('admin.auth.login.loginSuccess'));

      const ROLE_MAP: Record<string, PanelRole> = {
        admin: 'admin',
        sevkiyatci: 'nakliyeci',
        operator: 'operator',
        satin_almaci: 'satin_almaci',
      };
      const panelRole = ROLE_MAP[role] ?? 'admin';
      const defaultNext = fallbackNext ?? (mode === 'seller' ? '/seller' : ROLE_HOME[panelRole]);
      const next = safeNext(sp?.get('next'), defaultNext);
      router.replace(next);
      router.refresh();
    } catch (err) {
      toast.error(getErrMessage(err, t('admin.auth.login.loginFailed')));
    }
  };

  const isBusy = loginState.isLoading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.auth.login.emailLabel')}</FormLabel>
              <FormControl>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('admin.auth.login.emailPlaceholder')}
                  autoComplete="email"
                  disabled={isBusy}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.auth.login.passwordLabel')}</FormLabel>
              <FormControl>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('admin.auth.login.passwordPlaceholder')}
                  autoComplete="current-password"
                  disabled={isBusy}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* UI-only remember */}
        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center">
              <FormControl>
                <Checkbox
                  id="login-remember"
                  checked={!!field.value}
                  onCheckedChange={(v) => field.onChange(!!v)}
                  disabled={isBusy}
                  className="size-4"
                />
              </FormControl>
              <FormLabel
                htmlFor="login-remember"
                className="ml-1 font-medium text-muted-foreground text-sm"
              >
                {t('admin.auth.login.rememberMe')}
              </FormLabel>
            </FormItem>
          )}
        />

        <Button className="w-full" type="submit" disabled={isBusy}>
          {isBusy ? t('admin.auth.login.loggingIn') : t('admin.auth.login.loginButton')}
        </Button>
      </form>
    </Form>
  );
}
