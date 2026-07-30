import { notFound, redirect } from 'next/navigation';
import WebSayfasiClient from '../web-sayfasi-client';

const sectionTabs = {
  urunler: 'products',
  sayfalar: 'pages',
  'sayfa-icerikleri': 'page-content',
  makaleler: 'articles',
  menu: 'menu',
  'sabit-yazilar': 'texts',
  tema: 'theme',
  'ana-sayfa': 'home-sections',
  dosyalar: 'files',
} as const;

export function generateStaticParams() {
  return [...Object.keys(sectionTabs), 'ayarlar'].map((section) => ({ section }));
}

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === 'ayarlar') {
    redirect('/admin/sistem?tab=site-ayarlari');
  }
  const tab = sectionTabs[section as keyof typeof sectionTabs];
  if (!tab) notFound();
  return <WebSayfasiClient initialTab={tab} />;
}
