import type { Metadata } from 'next';

import { DevNote } from '@/components/devnote';
import PromatsContactForm from '@/components/promats/PromatsContactForm';
import PromatsSocialLinks from '@/components/promats/PromatsSocialLinks';
import { getPageContent, getProducts, getSettings, t } from '@/lib/promats/api';
import { getSiteConfig } from '@/lib/promats/site-config.server';
import { buildPageMetadata } from '@/seo/serverMetadata';

const PROMATS_LOCALES = ['tr', 'en'] as const;

export const revalidate = 60;

export function generateStaticParams() {
  return PROMATS_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const content = await getPageContent<{ meta: { title: string; description: string } }>(locale, 'contact');
  return buildPageMetadata({
    locale,
    pageKey: 'contact',
    pathname: '/iletisim',
    fallback: content.meta,
  });
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const [settings, siteConfig, products] = await Promise.all([
    getSettings(locale),
    getSiteConfig(locale),
    getProducts(locale),
  ]);
  const { address, phone, email } = siteConfig.contact;
  const contactMapEmbedUrl = settings.contact_map_embed_url;

  // İletişim hero metni (docx R3 d25090ff). Sayfa açılınca ortada harita yerine
  // en başta iletişim kutusu gelsin. Editoryal pazarlama kopyası; locale bazlı.
  const isEn = locale === 'en';
  const hero = isEn
    ? {
        eyebrow: 'CONTACT US',
        title: "WE'RE HERE FOR THE RIGHT SOLUTION",
        description:
          'Whether you would like information about our products, want to request a price quote, or wish to explore custom manufacturing options for your brand — our team will be glad to help.',
        bullets: ['Fast response', 'Product & price support', 'Custom manufacturing for your brand'],
      }
    : {
        eyebrow: 'BİZE ULAŞIN',
        title: 'DOĞRU ÇÖZÜM İÇİN BURADAYIZ',
        description:
          'İster ürünlerimiz hakkında bilgi almak, ister fiyat teklifi talep etmek ya da markanıza özel üretim seçeneklerini değerlendirmek isteyin; ekibimiz size yardımcı olmaktan memnuniyet duyacaktır.',
        bullets: ['Hızlı geri dönüş', 'Ürün ve fiyat desteği', 'Markanıza özel üretim'],
      };

  return (
    <>
      <section className="promats-contact-hero position-relative">
        <DevNote section="contact-hero" title="İletişim Hero" />
        <div className="container">
          <span className="promats-contact-hero-eyebrow">{hero.eyebrow}</span>
          <h1 className="promats-contact-hero-title">{hero.title}</h1>
          <p className="promats-contact-hero-desc">{hero.description}</p>
          <ul className="promats-contact-hero-list">
            {hero.bullets.map((item) => (
              <li key={item}><span className="promats-contact-hero-check" aria-hidden="true">✔</span>{item}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section8_bg position-relative">
        <DevNote section="contact-form" title="İletişim Formu" />
        <div className="container">
          <div className="row">
            <div className="col-12 col-lg-4 mx-auto address" data-aos="fade-up" data-aos-delay="200">
              <div className="footer">
                <ul className="list-group list-group-flush">
                  {address ? <li className="list-group-item"><i className="icon-map-marker" />{address}</li> : null}
                  {phone ? <li className="list-group-item"><i className="icon-headset_mic" />{phone}</li> : null}
                  {email ? <li className="list-group-item"><i className="icon-envelope-o" /><a href={`mailto:${email}`}>{email}</a></li> : null}
                </ul>
              </div>
              <PromatsSocialLinks socials={siteConfig.socials} label={t(settings, 'Bizi Takip Edin')} className="text-center social-media" />
            </div>
            <div className="border-right d-none d-lg-block"><br /></div>
            <div className="col-12 col-lg-5 offset-lg-1 mt-5 mt-lg-0" data-aos="fade-up" data-aos-delay="100">
              <h2>{t(settings, 'İletişim Formu')}</h2>
              <PromatsContactForm
                labels={{
                  name: t(settings, 'İsim, Soyisim'),
                  email: t(settings, 'E-Mail'),
                  phone: t(settings, 'Telefon'),
                  message: t(settings, 'Mesajınız...'),
                  submit: t(settings, 'Gönder'),
                  success: t(settings, 'Mesajınız alındı.'),
                  error: t(settings, 'Mesaj gönderilemedi.'),
                  products: t(settings, 'İlgilenilen Ürün Grubu'),
                  subject: t(settings, 'Konu Başlığı'),
                }}
                products={products.map((product) => ({ slug: product.slug, name: product.name }))}
                defaultProduct={products.find((product) => product.slug === query.product)?.name}
                subjectOptions={[
                  t(settings, 'Ürün Bilgisi'),
                  t(settings, 'Teklif Talebi'),
                  t(settings, 'OEM & Private Label'),
                  t(settings, 'İş Ortaklığı'),
                ]}
              />
            </div>
          </div>
        </div>
      </section>
      {contactMapEmbedUrl ? (
        <section className="contact_us promats-contact-map-section position-relative" id="iletisimform">
          <DevNote section="contact-map" title="İletişim Harita" />
          <div className="promats-contact-map-wrap"><iframe
            allowFullScreen
            frameBorder="0"
            height="420"
            src={contactMapEmbedUrl}
            style={{ border: 0 }}
            width="100%"
            title={t(settings, 'Promats harita')}
          /></div>
          <a className="btn btn-yellow promats-directions-btn" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">
            {t(settings, 'Yol Tarifi Al')}
          </a>
        </section>
      ) : null}
    </>
  );
}
