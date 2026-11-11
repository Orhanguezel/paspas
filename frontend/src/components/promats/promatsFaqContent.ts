import type { Product } from '@/lib/promats/api';

import type { PromatsFaqItem } from './PromatsFaqSection';

export type PromatsFaqContent = {
  locale: 'tr' | 'en';
  eyebrow: string;
  title: string;
  intro: string;
  items: PromatsFaqItem[];
};

const shell = (locale: string, title: string, intro: string, items: PromatsFaqItem[]): PromatsFaqContent => {
  const language = locale === 'en' ? 'en' : 'tr';
  return {
    locale: language,
    eyebrow: language === 'en' ? 'FREQUENTLY ASKED QUESTIONS' : 'SIKÇA SORULAN SORULAR',
    title,
    intro,
    items,
  };
};

export function homeFaq(locale: string, productCount: number): PromatsFaqContent {
  if (locale === 'en') {
    return shell(locale, 'About Promats products and requests', 'Short answers based on the current Promats catalogue and published manufacturing information.', [
      { question: 'Which products are listed on the Promats website?', answer: `The current catalogue contains ${productCount} active PVC universal car mat series. Each series page explains the available design, material and technical information recorded for that product family.` },
      { question: 'How should I compare product series?', answer: 'Compare the intended use, surface design, colour options and any dimensions or weights published on the series page. Exact suitability and current availability should be reconfirmed with Promats before an order decision.' },
      { question: 'How can I request a quotation or discuss OEM manufacturing?', answer: 'Use the contact form, select the relevant series and state the target market, approximate quantity and private-label requirement. Commercial terms are confirmed through the appropriate business process.' },
    ]);
  }
  return shell(locale, 'Promats ürünleri ve talepler hakkında', 'Yanıtlar güncel Promats kataloğu ve yayımlanmış üretim bilgilerine dayanır.', [
    { question: 'Promats sitesinde hangi ürünler listeleniyor?', answer: `Güncel katalogda ${productCount} aktif PVC universal oto paspas serisi bulunur. Her seri sayfası, o ürün ailesi için kayıtlı tasarım, malzeme ve teknik bilgileri açıklar.` },
    { question: 'Ürün serileri nasıl karşılaştırılmalı?', answer: 'Kullanım amacı, yüzey tasarımı, renk seçenekleri ile seri sayfasında yayımlanan ölçü ve ağırlık bilgilerini karşılaştırın. Kesin uyumluluk ve güncel bulunabilirlik sipariş kararından önce Promats ile yeniden teyit edilmelidir.' },
    { question: 'Teklif veya OEM üretim talebi nasıl iletilir?', answer: 'İletişim formunda ilgili seriyi seçip hedef pazarı, yaklaşık miktarı ve private label ihtiyacını belirtin. Ticari koşullar ilgili iş sürecinde ayrıca teyit edilir.' },
  ]);
}

export function aboutFaq(locale: string): PromatsFaqContent {
  if (locale === 'en') {
    return shell(locale, 'About Promats', 'Corporate answers are limited to information published and maintained by Promats.', [
      { question: 'When was Promats established?', answer: 'The Promats corporate record starts in 2017. The company develops and manufactures PVC universal car mat series.' },
      { question: 'Which capabilities does Promats describe?', answer: 'Promats describes product development, material selection, moulding, process control and shipment preparation as connected parts of its manufacturing approach.' },
      { question: 'How should current corporate or quality documents be verified?', answer: 'Website information is an introduction. Request the current document, scope and commercial confirmation directly from Promats when a purchasing, distributor or OEM decision depends on it.' },
    ]);
  }
  return shell(locale, 'Promats hakkında', 'Kurumsal yanıtlar Promats tarafından yayımlanan ve sürdürülen bilgilerle sınırlıdır.', [
    { question: 'Promats ne zaman kuruldu?', answer: 'Promats kurumsal kaydı 2017 yılında başlar. Şirket PVC universal oto paspas serileri geliştirir ve üretir.' },
    { question: 'Promats hangi yetkinlikleri açıklıyor?', answer: 'Promats; ürün geliştirme, malzeme seçimi, kalıplama, süreç kontrolü ve sevkiyat hazırlığını üretim yaklaşımının birbirini tamamlayan parçaları olarak açıklar.' },
    { question: 'Güncel kurumsal veya kalite belgeleri nasıl doğrulanmalı?', answer: 'Web sitesi bilgileri bir giriş niteliğindedir. Satın alma, distribütörlük veya OEM kararı bir belgeye bağlıysa güncel belgeyi, kapsamı ve ticari teyidi doğrudan Promats ekibinden isteyin.' },
  ]);
}

export function productionFaq(locale: string): PromatsFaqContent {
  if (locale === 'en') {
    return shell(locale, 'Manufacturing process', 'These answers summarize the process descriptions shown on this page.', [
      { question: 'Which stages are covered by the Promats manufacturing process?', answer: 'The published flow covers product development, material and mould preparation, manufacturing controls, quality checks and shipment preparation.' },
      { question: 'How is quality information presented?', answer: 'The page explains control points used during production and before shipment. Project-specific acceptance criteria and current documents must be agreed separately for each commercial request.' },
      { question: 'Can OEM or private-label requirements be discussed?', answer: 'Yes. Send the intended market, relevant product family and approximate quantity through the contact channel so the requirement can be evaluated in the correct business process.' },
    ]);
  }
  return shell(locale, 'Üretim süreci', 'Bu yanıtlar sayfada yayımlanan üretim süreci açıklamalarını özetler.', [
    { question: 'Promats üretim süreci hangi aşamaları kapsıyor?', answer: 'Yayımlanan akış; ürün geliştirme, malzeme ve kalıp hazırlığı, üretim kontrolleri, kalite kontrol ve sevkiyat hazırlığı aşamalarını kapsar.' },
    { question: 'Kalite bilgileri nasıl sunuluyor?', answer: 'Sayfa, üretim sırasında ve sevkiyat öncesinde uygulanan kontrol noktalarını açıklar. Projeye özel kabul kriterleri ve güncel belgeler her ticari talep için ayrıca kararlaştırılmalıdır.' },
    { question: 'OEM veya private label ihtiyaçları görüşülebilir mi?', answer: 'Evet. İhtiyacın doğru iş sürecinde değerlendirilebilmesi için hedef pazarı, ilgili ürün ailesini ve yaklaşık miktarı iletişim kanalından iletin.' },
  ]);
}

export function productsFaq(locale: string, productCount: number): PromatsFaqContent {
  if (locale === 'en') {
    return shell(locale, 'Choosing a product series', 'Use the catalogue as a comparison guide and confirm order-specific details before purchase.', [
      { question: 'How many active series are in the current catalogue?', answer: `This page lists ${productCount} active PVC universal car mat series. The catalogue count is generated from the products currently published by Promats.` },
      { question: 'Are all dimensions and weights the same?', answer: 'No. Published dimensions and weights are series-specific and appear only where a catalogue record is available. Do not transfer a value from one series to another.' },
      { question: 'Are colours and availability guaranteed by the website?', answer: 'The website presents recorded product options. Current colour, availability, quantity and commercial terms must be reconfirmed when requesting a quotation.' },
    ]);
  }
  return shell(locale, 'Ürün serisi seçimi', 'Kataloğu karşılaştırma rehberi olarak kullanın; siparişe özel ayrıntıları satın alma öncesinde teyit edin.', [
    { question: 'Güncel katalogda kaç aktif seri var?', answer: `Bu sayfada ${productCount} aktif PVC universal oto paspas serisi listelenir. Katalog sayısı Promats tarafından o anda yayımlanan ürün kayıtlarından üretilir.` },
    { question: 'Tüm serilerin ölçü ve ağırlıkları aynı mı?', answer: 'Hayır. Yayımlanan ölçü ve ağırlıklar seriye özeldir ve yalnız katalog kaydı bulunan ürünlerde gösterilir. Bir serinin değerini başka bir seriye taşımayın.' },
    { question: 'Renkler ve bulunabilirlik web sitesiyle kesinleşir mi?', answer: 'Web sitesi kayıtlı ürün seçeneklerini sunar. Güncel renk, bulunabilirlik, miktar ve ticari koşullar teklif talebi sırasında yeniden teyit edilmelidir.' },
  ]);
}

function recordedDimensions(product: Product): string[] {
  return [...new Set(product.sections.dimensions.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

export function productFaq(locale: string, product: Product): PromatsFaqContent {
  const dimensions = recordedDimensions(product);
  const dimensionAnswer = locale === 'en'
    ? dimensions.length
      ? `The catalogue record for this series publishes these measurements or weights: ${dimensions.join(', ')}. Confirm the intended use and current production record with Promats before ordering.`
      : 'No series-specific measurement is published in the current catalogue record. Request the current technical confirmation from Promats instead of applying values from another series.'
    : dimensions.length
      ? `Bu serinin katalog kaydında şu ölçü veya ağırlıklar yayımlanır: ${dimensions.join(', ')}. Siparişten önce kullanım amacını ve güncel üretim kaydını Promats ile teyit edin.`
      : 'Güncel katalog kaydında bu seriye özel bir ölçü yayımlanmıyor. Başka bir serinin değerini kullanmak yerine Promats ekibinden güncel teknik teyit isteyin.';

  if (locale === 'en') {
    return shell(locale, `${product.name} questions`, 'Answers use only the information recorded for this product family.', [
      { question: `Where can I verify the measurements for ${product.name}?`, answer: dimensionAnswer },
      { question: 'Does a universal series fit every vehicle without checking?', answer: 'Universal describes the product family, not an automatic fit decision for every vehicle. Review the series information and confirm the intended application before ordering.' },
      { question: 'How can I request current colours, quantity or OEM terms?', answer: `Select ${product.name} in the contact form and state the target market, approximate quantity and requested support. Current availability and commercial terms are confirmed separately.` },
    ]);
  }
  return shell(locale, `${product.name} hakkında`, 'Yanıtlar yalnız bu ürün ailesi için kayıtlı bilgilere dayanır.', [
    { question: `${product.name} ölçüleri nereden doğrulanabilir?`, answer: dimensionAnswer },
    { question: 'Universal seri her araca kontrol etmeden uyar mı?', answer: 'Universal ifadesi ürün ailesini tanımlar; her araç için otomatik uyumluluk kararı değildir. Siparişten önce seri bilgilerini inceleyin ve kullanım amacını teyit edin.' },
    { question: 'Güncel renk, miktar veya OEM koşulları nasıl istenir?', answer: `İletişim formunda ${product.name} serisini seçip hedef pazarı, yaklaşık miktarı ve beklediğiniz desteği belirtin. Güncel bulunabilirlik ve ticari koşullar ayrıca teyit edilir.` },
  ]);
}

export function resourcesFaq(locale: string, articleCount: number): PromatsFaqContent {
  if (locale === 'en') {
    return shell(locale, 'Using technical resources', 'The resource library explains products and manufacturing topics without replacing project-specific confirmation.', [
      { question: 'What is the scope of the resource library?', answer: `The current library contains ${articleCount} published resources based on Promats product-family records and manufacturing explanations.` },
      { question: 'Can a resource article replace a current technical specification?', answer: 'No. Articles provide context. Current specifications, availability and intended application must be confirmed when a purchasing or manufacturing decision depends on them.' },
      { question: 'Who owns and publishes these resources?', answer: 'Promats is the visible author and publisher of the resource articles. Each article displays its available publication date.' },
    ]);
  }
  return shell(locale, 'Teknik kaynakların kullanımı', 'Kaynak kütüphanesi ürün ve üretim konularını açıklar; projeye özel teyidin yerini almaz.', [
    { question: 'Kaynak kütüphanesinin kapsamı nedir?', answer: `Güncel kütüphanede Promats ürün ailesi kayıtları ve üretim açıklamalarına dayanan ${articleCount} yayımlanmış kaynak bulunur.` },
    { question: 'Kaynak yazısı güncel teknik şartnamenin yerini tutar mı?', answer: 'Hayır. Yazılar bağlam sağlar. Satın alma veya üretim kararı bunlara bağlıysa güncel teknik özellikler, bulunabilirlik ve kullanım amacı ayrıca teyit edilmelidir.' },
    { question: 'Bu kaynakların içerik sahibi ve yayıncısı kimdir?', answer: 'Kaynak yazılarında görünür yazar ve yayıncı Promats’tır. Mevcut yayın tarihi her yazıda ayrıca gösterilir.' },
  ]);
}

export function contactFaq(locale: string): PromatsFaqContent {
  if (locale === 'en') {
    return shell(locale, 'Contact and quotation requests', 'Providing the right context helps Promats route the request without collecting unnecessary data.', [
      { question: 'Which details should a product request contain?', answer: 'State the product series, intended market, approximate quantity and whether the request concerns product information, a quotation, distribution or OEM manufacturing.' },
      { question: 'Are dimensions and commercial terms confirmed through the public form?', answer: 'The form starts the request. Final dimensions, availability, pricing and commercial terms are confirmed separately by the appropriate Promats process.' },
      { question: 'Which information should not be sent?', answer: 'Do not send passwords, payment-card data or confidential production information that is not necessary to evaluate the request.' },
    ]);
  }
  return shell(locale, 'İletişim ve teklif talepleri', 'Doğru bağlamı vermek, gereksiz veri toplamadan talebin ilgili sürece yönlendirilmesini sağlar.', [
    { question: 'Ürün talebinde hangi bilgiler bulunmalı?', answer: 'Ürün serisini, hedef pazarı, yaklaşık miktarı ve talebin ürün bilgisi, teklif, distribütörlük veya OEM üretim konularından hangisiyle ilgili olduğunu belirtin.' },
    { question: 'Ölçüler ve ticari koşullar herkese açık form üzerinden kesinleşir mi?', answer: 'Form talebi başlatır. Kesin ölçü, bulunabilirlik, fiyat ve ticari koşullar ilgili Promats iş sürecinde ayrıca teyit edilir.' },
    { question: 'Hangi bilgiler gönderilmemeli?', answer: 'Parola, ödeme kartı verisi veya talebi değerlendirmek için gerekmeyen gizli üretim bilgilerini göndermeyin.' },
  ]);
}
