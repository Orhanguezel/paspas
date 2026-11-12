import type { ReactNode } from 'react';

import AOSInit from '@/components/common/AOSInit';
import PromatsFooter from './PromatsFooter';
import PromatsHeader from './PromatsHeader';
import PromatsDiscoveryLinks from './PromatsDiscoveryLinks';

import { getMenu, getProducts, getSettings } from '@/lib/promats/api';
import { getSiteConfig } from '@/lib/promats/site-config.server';
import { organizationReference, websiteReference } from '@/seo/promatsStructuredData';

type Props = {
  children: ReactNode;
  locale: string;
  title?: string;
};

// Menü position: 1 = header, 2 = footer. sortOrder'a göre sıralı.
const MENU_POSITION = { header: 1, footer: 2 } as const;
const SHELL_SETTING_KEYS = [
  'Yükleniyor', 'Bizi Takip Edin', 'E-Katalog', 'Görüntüle', 'Online incele',
  'PDF İndir', 'Kataloğu indir', 'Aranacak kelimeyi yazınız', 'Katalog Görüntüle',
  'Promats A.Ş Tüm Hakları Saklıdır.',
] as const;

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
  // Client header only needs navigation identity. Serializing all product detail,
  // feature and editorial fields into every page's RSC payload added ~93 KB.
  const navigationProducts = products.map(({ id, name, slug }) => ({ id, name, slug }));
  const shellSettings = Object.fromEntries(
    SHELL_SETTING_KEYS.flatMap((key) => settings[key] == null ? [] : [[key, settings[key]]]),
  );
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [organizationReference(siteConfig), websiteReference()],
  };

  return (
    <div className="promats-public promats-legacy-active">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AOSInit />
      <PromatsHeader
        locale={locale}
        products={navigationProducts}
        settings={shellSettings}
        siteConfig={siteConfig}
        menu={headerMenu}
        title={title}
      />
      <main id="main-content">
        {children}
        <PromatsDiscoveryLinks locale={locale} productCount={products.length} />
      </main>
      <PromatsFooter locale={locale} settings={shellSettings} siteConfig={siteConfig} menu={footerMenu} />
    </div>
  );
}
