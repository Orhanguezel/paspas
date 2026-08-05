'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BookOpen, Eye, FileDown, X } from 'lucide-react';

import type { MenuLink, Product, SiteConfig } from '@/lib/promats/api';
import { DevNote } from '@/components/devnote';
import { t } from '@/lib/promats/api';
import { PROMATS_STICKY_NAV } from '@/lib/promats/animation-config';
import { localeHref } from '@/lib/promats/links';
import PromatsImage from './PromatsImage';
import PromatsSocialLinks from './PromatsSocialLinks';

type Props = {
  locale: string;
  products: Product[];
  settings: Record<string, string>;
  siteConfig: SiteConfig;
  menu: MenuLink[];
  title?: string;
};

export default function PromatsHeader({ locale, products, settings, siteConfig, menu, title }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [productsOpen, setProductsOpen] = useState(true);
  const [catalogViewerOpen, setCatalogViewerOpen] = useState(false);
  const catalogRef = useRef<HTMLDetailsElement>(null);

  // Anasayfa header'i koyu hero uzerinde seffaf durur; diger tum sayfalarda
  // (bg-light hero) header solid siyah (black-header) olur → tek/tutarli header.
  const pathname = usePathname();
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const darkHeader = Boolean(title) || !isHome;
  const searchIcon = settings.header_icon_search;
  const menuIcon = settings.header_icon_menu;
  const catalogPdfUrl = locale === 'tr'
    ? '/userfiles/files/e-katalog-tr.pdf'
    : (siteConfig.ekatalogUrl || '/userfiles/files/e-catalogue.pdf');

  useEffect(() => {
    // Orijinal tema offcanvas mekanizmasi: body.offcanvas -> panel translateX(0) + body:before karartma.
    if (menuOpen) {
      document.body.classList.add('offcanvas');
    } else {
      document.body.classList.remove('offcanvas');
    }
    return () => document.body.classList.remove('offcanvas');
  }, [menuOpen]);

  // E-Katalog menüsü (native <details> değil): dışarı tıklayınca ve Escape ile
  // kapanır. <details> müşteri notunda "dışarı tıklayınca kapanmıyor" idi.
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) {
        catalogRef.current.removeAttribute('open');
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') catalogRef.current?.removeAttribute('open');
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (!catalogViewerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCatalogViewerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [catalogViewerOpen]);

  useEffect(() => {
    const onScroll = () => {
      setSticky(window.scrollY > PROMATS_STICKY_NAV.scrollThresholdPx);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* Legacy tema yükleme perdesi: orijinal main.js bunu 700ms sonra fadeOut ederdi.
          Load perdesi artık <SplashScreen/> tarafından yönetiliyor; bu div sadece o
          curtain içindi (mobil menü arka planı ayrı `body.offcanvas:before` pseudo-element'tir).
          Gizli tutulmazsa `#untree_co--overlayer { background:#fff; z-index:7100 }` kuralı
          tüm sayfayı beyaza boyar → boş ekran. */}
      <div id="untree_co--overlayer" style={{ display: 'none' }} />
      <div className="loader" style={{ display: 'none' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">{t(settings, 'Yükleniyor')}...</span>
        </div>
      </div>

      <nav className="untree_co--site-mobile-menu">
        <div className="close-wrap d-flex">
          <div className="language">
            <a href={localeHref('tr', '/')} className={locale === 'tr' ? 'active' : undefined}>TR</a>
            <a href={localeHref('en', '/')} className={locale === 'en' ? 'active' : undefined}>EN</a>
          </div>
          <a
            href="#close"
            className="close-menu js-menu-toggle promats-close-x"
            onClick={(e) => { e.preventDefault(); setMenuOpen(false); }}
            aria-label={locale === 'en' ? 'Close menu' : 'Menüyü kapat'}
            role="button"
          >
            <span aria-hidden="true">×</span>
          </a>
        </div>
        <div className="site-mobile-inner">
          <ul className="site-nav-wrap">
            {menu.map((item) => {
              // ÜRÜNLER öğesi (url=/urunler) ürün alt menüsünü (dropdown) taşır.
              if (item.url === '/urunler') {
                return (
                  <li className={`has-children ${productsOpen ? '' : 'collapsed'}`} key={item.url}>
                    <a href={localeHref(locale, item.url)}>{item.title}</a>
                    <span
                      className={`arrow-collapse ${productsOpen ? '' : 'collapsed'}`}
                      onClick={() => setProductsOpen((v) => !v)}
                      role="button"
                      aria-label={locale === 'en' ? 'Toggle products' : 'Ürünleri aç/kapat'}
                      aria-expanded={productsOpen}
                    />
                    <ul className="promats-sub-menu" style={{ display: productsOpen ? 'block' : 'none' }}>
                      {products.map((product) => (
                        <li key={product.id}>
                          <a href={localeHref(locale, `/urunler/${product.slug}`)}>{product.name}</a>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }
              return (
                <li key={`${item.url}-${item.title}`}>
                  <a
                    href={localeHref(locale, item.url)}
                    target={item.targetBlank ? '_blank' : undefined}
                    rel={item.targetBlank ? 'noreferrer' : undefined}
                  >
                    {item.title}
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="text-center social-media mt-4">
            <PromatsSocialLinks socials={siteConfig.socials} label={t(settings, 'Bizi Takip Edin')} />
          </div>
        </div>
      </nav>

      {/* Orijinal jQuery .sticky() plugin'i nav'i .sticky-wrapper ile sariyordu; header'in
          TUM konum/stil CSS'i (.sticky-wrapper .untree_co--site-nav: fixed, seffaf, ikon konumu)
          bu sarmalayiciya bagli. React'te wrapper'i elle koyuyoruz; is-sticky scroll'da wrapper'a. */}
      <div className={`sticky-wrapper position-relative ${sticky ? 'is-sticky' : ''}`}>
      <DevNote section="header" title="Header" />
      <nav className={`untree_co--site-nav js-sticky-nav ${darkHeader ? 'black-header' : ''}`}>
        <div className="container d-flex align-items-center">
          <div className="logo-wrap">
            <a href={localeHref(locale, '/')} className="untree_co--site-logo">
              {siteConfig.logo ? (
                <PromatsImage src={siteConfig.logo} alt="Promats" width={204} height={65} priority assetBase="/assets" />
              ) : null}
            </a>
          </div>
          {title ? <div className="header d-none d-lg-block"><h1>{title}</h1></div> : null}
          <div className="icons-wrap text-md-right">
            {siteConfig.ekatalogUrl ? (
              <details className="promats-header-catalog d-none d-lg-inline-block" ref={catalogRef}>
                <summary
                  className="promats-header-catalog-toggle"
                >
                  <span>{t(settings, 'E-Katalog')}</span>
                  <BookOpen aria-hidden="true" />
                </summary>
                <div className="promats-header-catalog-menu">
                  <button
                    type="button"
                    onClick={() => {
                      catalogRef.current?.removeAttribute('open');
                      setCatalogViewerOpen(true);
                    }}
                  >
                    <span className="promats-catalog-option-icon"><Eye aria-hidden="true" /></span>
                    <strong>{t(settings, 'Görüntüle')}</strong>
                    <small>{t(settings, 'Online incele')}</small>
                  </button>
                  <a
                    href={catalogPdfUrl}
                    download
                    onClick={() => catalogRef.current?.removeAttribute('open')}
                  >
                    <span className="promats-catalog-option-icon"><FileDown aria-hidden="true" /></span>
                    <strong>{t(settings, 'PDF İndir')}</strong>
                    <small>{t(settings, 'Kataloğu indir')}</small>
                  </a>
                </div>
              </details>
            ) : null}
            <ul className="icons-top d-lg-block">
              {searchIcon ? <li>
                <button type="button" className="js-search-toggle" onClick={() => setSearchOpen(true)} aria-label={locale === 'en' ? 'Open search' : 'Aramayı aç'}>
                  <PromatsImage src={searchIcon} alt="" width={38} height={39} />
                </button>
              </li> : null}
              {menuIcon ? <li>
                <button type="button" className="js-menu-toggle" onClick={() => setMenuOpen(true)} aria-label={locale === 'en' ? 'Open menu' : 'Menüyü aç'}>
                  <PromatsImage src={menuIcon} alt="" width={38} height={38} />
                </button>
              </li> : null}
            </ul>
          </div>
        </div>
      </nav>
      </div>

      <div id="menu_search" className={`search-wrap ${searchOpen ? 'active' : ''}`}>
        <button type="button" className="close-search js-search-toggle" onClick={() => setSearchOpen(false)} aria-label={locale === 'en' ? 'Close search' : 'Aramayı kapat'}>
          <span>Close</span>
        </button>
        <div className="container">
          <div className="row justify-content-center align-items-center text-center">
            <div className="col-12">
              <form action={localeHref(locale, '/arama')} method="get">
                <div className="row">
                  <div className="col-9">
                    <label className="sr-only" htmlFor="promats-header-search">{t(settings, 'Aranacak kelimeyi yazınız')}</label>
                    <input id="promats-header-search" type="search" name="q" placeholder={`${t(settings, 'Aranacak kelimeyi yazınız')}...`} autoComplete="off" />
                  </div>
                  <div className="col-3">
                    <button type="submit" className="btn btn-yellow px-4 text-white mt-3" aria-label={locale === 'en' ? 'Search' : 'Ara'}>
                      <i className="icon-search2 h2" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {catalogViewerOpen ? (
        <div
          className="promats-catalog-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={t(settings, 'Katalog Görüntüle')}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCatalogViewerOpen(false);
          }}
        >
          <div className="promats-catalog-viewer-panel">
            <div className="promats-catalog-viewer-header">
              <span><BookOpen aria-hidden="true" />{t(settings, 'E-Katalog')}</span>
              <div>
                <a href={catalogPdfUrl} download>
                  <FileDown aria-hidden="true" />
                  {t(settings, 'PDF İndir')}
                </a>
                <button
                  type="button"
                  onClick={() => setCatalogViewerOpen(false)}
                  aria-label={locale === 'en' ? 'Close catalogue' : 'Kataloğu kapat'}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            </div>
            <iframe
              src={`${catalogPdfUrl}#page=1&view=FitH`}
              title={t(settings, 'Katalog Görüntüle')}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
