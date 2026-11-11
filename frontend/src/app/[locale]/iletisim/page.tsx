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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string; requestType?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const query = await searchParams;
  const content = await getPageContent<{ meta: { title: string; description: string } }>(locale, 'contact');
  const metadata = await buildPageMetadata({
    locale,
    pageKey: 'contact',
    pathname: '/iletisim',
    fallback: { ...content.meta, ogImage: '/assets/images/uretim/sunum.jpg' },
  });
  if (query.product || query.requestType) {
    metadata.robots = { index: false, follow: true };
  }
  return metadata;
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string; requestType?: string }>;
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
  const selectedProduct = products.find((product) => product.slug === query.product);
  const quoteSubject = t(settings, 'Teklif Talebi');

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
  const contactGuide = isEn
    ? {
        title: 'How Promats handles your request',
        paragraphs: [
          'Choose the relevant product series and explain the intended market, quantity range or private-label requirement. This gives the Promats team the context needed to route a product, quotation or OEM request correctly.',
          'For technical questions, include the product name and the feature you want to compare. For distribution or OEM discussions, describe the target market and requested support without sending confidential production data through the public form.',
          'A clear request helps the team distinguish a general product enquiry from a quotation or manufacturing discussion. Promats reviews the submitted contact details and message together; final dimensions, commercial terms and application claims are confirmed separately through the appropriate business process.',
          'Do not include passwords, payment-card data or other unnecessary sensitive information in your message.',
        ],
      }
    : {
        title: 'Talebiniz Promats ekibine nasıl iletilir?',
        paragraphs: [
          'İlgilendiğiniz ürün serisini seçip hedef pazar, yaklaşık miktar veya private label ihtiyacınızı açıklayın. Bu bilgi; ürün, teklif ya da OEM talebinizin doğru ekibe yönlendirilmesini sağlar.',
          'Teknik sorularda ürün adını ve karşılaştırmak istediğiniz özelliği belirtin. Distribütörlük veya OEM görüşmelerinde hedef pazarı ve beklediğiniz desteği yazın; gizli üretim verilerini herkese açık form üzerinden göndermeyin.',
          'Açık bir talep, genel ürün sorusu ile teklif veya üretim görüşmesinin ayrılmasını kolaylaştırır. Promats ekibi iletişim bilgileriyle mesajı birlikte değerlendirir; kesin ölçü, ticari koşul ve kullanım beyanları ilgili iş sürecinde ayrıca teyit edilir.',
          'Mesajınıza parola, ödeme kartı bilgisi veya talep için gerekmeyen başka hassas veriler eklemeyin.',
        ],
      };

  return (
    <>
      <section className="section8_bg promats-contact-main position-relative" id="iletisimform">
        <DevNote section="contact-form" title="İletişim Formu" />
        <div className="container">
          <div className="promats-contact-main__grid">
            <div className="promats-contact-copy" data-aos="fade-up" data-aos-delay="100">
              <span className="promats-contact-hero-eyebrow">{hero.eyebrow}</span>
              <h1 className="promats-contact-hero-title">{hero.title}</h1>
              <p className="promats-contact-hero-desc">{hero.description}</p>
              <ul className="promats-contact-hero-list">
                {hero.bullets.map((item) => (
                  <li key={item}><span className="promats-contact-hero-check" aria-hidden="true">✓</span>{item}</li>
                ))}
              </ul>
            </div>
            <div className="promats-contact-form-card" data-aos="fade-up" data-aos-delay="160">
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
                products={products.map((product) => ({ id: String(product.id), slug: product.slug, name: product.name }))}
                defaultProduct={selectedProduct?.slug}
                defaultSubject={query.requestType === 'quote' && selectedProduct ? quoteSubject : undefined}
                locale={locale}
                sourcePage={selectedProduct ? `/${locale}/urunler/${selectedProduct.slug}` : `/${locale}/iletisim`}
                quoteSubjectValues={[quoteSubject, t(settings, 'OEM & Private Label')]}
                subjectOptions={[
                  t(settings, 'Ürün Bilgisi'),
                  quoteSubject,
                  t(settings, 'OEM & Private Label'),
                  t(settings, 'İş Ortaklığı'),
                ]}
              />
            </div>
          </div>
        </div>
      </section>
      <section className="pm-section promats-contact-guide position-relative">
        <div className="container pm-prose">
          <h2>{contactGuide.title}</h2>
          {contactGuide.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </section>
      {contactMapEmbedUrl ? (
        <section className="contact_us promats-contact-location position-relative">
          <DevNote section="contact-map" title="İletişim Harita" />
          <div className="container promats-contact-location__grid">
            <aside className="promats-contact-address">
              <div className="footer">
                <ul className="list-group list-group-flush">
                  {address ? <li className="list-group-item"><i className="icon-map-marker" />{address}</li> : null}
                  {phone ? <li className="list-group-item"><i className="icon-headset_mic" />{phone}</li> : null}
                  {email ? <li className="list-group-item"><i className="icon-envelope-o" /><a href={`mailto:${email}`}>{email}</a></li> : null}
                </ul>
              </div>
              <PromatsSocialLinks socials={siteConfig.socials} label={t(settings, 'Bizi Takip Edin')} className="text-center social-media" />
            </aside>
            <div>
              <div className="promats-contact-map-wrap"><iframe allowFullScreen frameBorder="0" src={contactMapEmbedUrl} title={t(settings, 'Promats harita')} /></div>
              <a className="btn btn-yellow promats-directions-btn" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">{t(settings, 'Yol Tarifi Al')}</a>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
