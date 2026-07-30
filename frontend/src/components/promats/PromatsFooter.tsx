import type { MenuLink, SiteConfig } from '@/lib/promats/api';
import { t } from '@/lib/promats/api';
import { DevNote } from '@/components/devnote';

import PromatsImage from './PromatsImage';
import PromatsSocialLinks from './PromatsSocialLinks';
import { localeHref as href } from '@/lib/promats/links';

type Props = {
  locale: string;
  settings: Record<string, string>;
  siteConfig: SiteConfig;
  menu: MenuLink[];
};

// Footer'ın TÜM verisi DB'den: site_settings (iletişim/sosyal/logo/copyright/e-katalog)
// + menu_items (menü) + static_texts (t etiketleri). Hard-code YOK.
export default function PromatsFooter({ locale, settings, siteConfig, menu }: Props) {
  const { contact, socials, logoDark, copyright, ekatalogUrl } = siteConfig;
  const ekatalogIcon = settings.footer_ekatalog_icon;
  const localizedCopyright = t(settings, 'Promats A.Ş Tüm Hakları Saklıdır.');
  const footerCopyright =
    localizedCopyright === 'Promats A.Ş Tüm Hakları Saklıdır.'
      ? copyright
      : localizedCopyright;

  return (
    <footer className="untree_co--site-footer footer position-relative">
      <DevNote section="footer" title="Footer" />
      <div className="container">
        <div className="row">
          <div className="col-8 offset-2 col-lg-3 offset-lg-0 order-1 order-lg-1">
            {logoDark ? (
              <PromatsImage src={logoDark} alt="Promats" className="img-fluid" width={204} height={65} assetBase="/assets" />
            ) : null}
          </div>
          <div className="col-12 col-lg-6 d-none d-lg-block order-lg-2 footer-menu">
            <ul className="nav justify-content-center">
              {menu.map((item) => (
                <li className="nav-item" key={`${item.url}-${item.title}`}>
                  <a
                    className="nav-link"
                    href={href(locale, item.url)}
                    target={item.targetBlank ? '_blank' : undefined}
                    rel={item.targetBlank ? 'noreferrer' : undefined}
                  >
                    {item.title.toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US').replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : 'en-US'))}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-8 offset-2 col-lg-3 offset-lg-0 order-2 order-lg-3 mt-4 mt-lg-0">
            <ul className="list-group list-group-flush">
              {contact.address ? <li className="list-group-item"><i className="icon-map-marker" />{contact.address}</li> : null}
              {contact.phone ? <li className="list-group-item"><i className="icon-headset_mic" />{contact.phone}</li> : null}
              {contact.email ? (
                <li className="list-group-item"><i className="icon-envelope-o" /><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="row no-gutters mt-3 pt-3 align-items-center">
          <div className="col-3 text-md-left copyright d-none d-lg-block">
            {footerCopyright ? <p>{footerCopyright}</p> : null}
          </div>
          <PromatsSocialLinks
            socials={socials}
            label={t(settings, 'Bizi Takip Edin')}
            className="col-8 offset-2 col-lg-6 offset-lg-0 text-center social-media order-2 order-lg-1 mt-4 mt-lg-0 mb-4 mb-lg-0"
          />
          <div className="col-8 offset-2 col-lg-3 offset-lg-0 text-center order-1 order-lg-2">
            {ekatalogUrl && ekatalogIcon ? (
              <a href={ekatalogUrl} className="e-katalog" target="_blank" rel="noreferrer">
                <span>{t(settings, 'E-Katalog İndir')}</span>
                <PromatsImage src={ekatalogIcon} alt="" width={40} height={40} />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
