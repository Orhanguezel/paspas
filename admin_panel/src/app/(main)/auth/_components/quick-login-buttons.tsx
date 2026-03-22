'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Shield, Truck, Wrench, ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuthTokenMutation } from '@/integrations/hooks';
import { useLocaleContext } from '@/i18n';
import { ROLE_HOME } from '@/navigation/permissions';
import type { PanelRole } from '@/navigation/permissions';

const DEMO_ACCOUNTS = [
  {
    key: 'admin',
    localeKey: 'admin.auth.login.quickLoginAdmin',
    email: 'admin@promats.com',
    icon: Shield,
    panelRole: 'admin' as PanelRole,
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    key: 'sevkiyat',
    localeKey: 'admin.auth.login.quickLoginSevkiyat',
    email: 'sevkiyat@promats.com',
    icon: Truck,
    panelRole: 'nakliyeci' as PanelRole,
    color: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  {
    key: 'operator',
    localeKey: 'admin.auth.login.quickLoginOperator',
    email: 'operator@promats.com',
    icon: Wrench,
    panelRole: 'operator' as PanelRole,
    color: 'bg-green-600 hover:bg-green-700 text-white',
  },
  {
    key: 'satinAlma',
    localeKey: 'admin.auth.login.quickLoginSatinAlma',
    email: 'satinalma@promats.com',
    icon: ShoppingCart,
    panelRole: 'satin_almaci' as PanelRole,
    color: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
];

const PASSWORD = 'admin123';

type LoginConfig = { showQuickLogin: boolean; enabledRoles: string[] };

export function QuickLoginButtons() {
  const { t } = useLocaleContext();
  const router = useRouter();
  const [login] = useAuthTokenMutation();
  const [busy, setBusy] = useState<string | null>(null);
  const [config, setConfig] = useState<LoginConfig | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    fetch(`${apiBase}/api/public/login-config`)
      .then((res) => res.json())
      .then((data: LoginConfig) => setConfig(data))
      .catch(() => setConfig({ showQuickLogin: false, enabledRoles: [] }));
  }, []);

  // Config yuklenmedi veya kapaliysa hicbir sey gosterme
  if (!config || !config.showQuickLogin) return null;

  const handleQuickLogin = async (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setBusy(account.key);
    try {
      await login({
        grant_type: 'password',
        email: account.email,
        password: PASSWORD,
      }).unwrap();

      toast.success(t('admin.auth.login.loginSuccess'));
      router.replace(ROLE_HOME[account.panelRole]);
      router.refresh();
    } catch {
      toast.error(t('admin.auth.login.loginFailed'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t('admin.auth.login.quickLogin')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {DEMO_ACCOUNTS.map((account) => {
          const Icon = account.icon;
          const isBusy = busy === account.key;
          const label = t(account.localeKey);
          return (
            <Button
              key={account.key}
              variant="outline"
              className={`h-10 ${account.color} border-0`}
              disabled={busy !== null}
              onClick={() => handleQuickLogin(account)}
            >
              <Icon className={`mr-1.5 size-4${isBusy ? ' animate-spin' : ''}`} />
              {isBusy ? '...' : label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
