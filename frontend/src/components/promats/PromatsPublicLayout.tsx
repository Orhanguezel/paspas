import type { ReactNode } from 'react';

import AOSInit from '@/components/common/AOSInit';
import PromatsFooter from './PromatsFooter';
import PromatsHeader from './PromatsHeader';

import { getMenu, getProducts, getSettings } from '@/lib/promats/api';
import { getSiteConfig } from '@/lib/promats/site-config.server';

type Props = {
  children: ReactNode;
  locale: string;
  title?: string;
};

// Menü position: 1 = header, 2 = footer. sortOrder'a göre sıralı.
const MENU_POSITION = { header: 1, footer: 2 } as const;

export default async function PromatsPublicLayout({ children, locale, title }: Props) {
  const [products, settings, siteConfig, menu] = await Promise.all([
    getProducts(locale),
    getSettings(locale),
    getSiteConfig(locale),
    getMenu(locale),
  ]);

  const byPosition = (position: number) =>
    menu
      .filter((item) => item.position === position && item.title && item.url)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({ title: item.title as string, url: item.url as string, targetBlank: item.targetBlank }));

  const headerMenu = byPosition(MENU_POSITION.header);
  const footerMenu = byPosition(MENU_POSITION.footer);

  return (
    <div className="promats-public promats-legacy-active">
      <AOSInit />
      <PromatsHeader
        locale={locale}
        products={products}
        settings={settings}
        siteConfig={siteConfig}
        menu={headerMenu}
        title={title}
      />
      <main id="main-content">{children}</main>
      <PromatsFooter locale={locale} settings={settings} siteConfig={siteConfig} menu={footerMenu} />
    </div>
  );
}
