// "Sayfa Icerikleri" (page_content JSON) kayitlari icin alan bazli form semalari.
//
// Sema bilinen page_key'ler icin JSON'un hangi yollarinin hangi etiketle
// duzenlenecegini tanimlar; PageContentEditor bu semayi forma cevirir. Semasi
// olmayan sayfalar (oem, partner, resources...) ham JSON editorunde kalir.

export type PcFieldKind = 'text' | 'area' | 'lines';

export type PcField = {
  /** JSON icindeki nokta yolu (liste alanlarinda madde icine goreli). */
  path: string;
  label: string;
  kind?: PcFieldKind;
  hint?: string;
};

export type PcList = {
  path: string;
  label: string;
  /** Yeni madde eklenirken kullanilacak bos sablon. */
  template: Record<string, unknown>;
  item: PcField[];
};

export type PcGroup = { title: string; fields?: PcField[]; lists?: PcList[] };
export type PcSchema = PcGroup[];

const LINES_HINT = 'Her satır ayrı madde/satır olarak gösterilir.';

const META_GROUP: PcGroup = {
  title: 'SEO / Meta',
  fields: [
    { path: 'meta.title', label: 'Sayfa başlığı (sekme/Google)' },
    { path: 'meta.description', label: 'Meta açıklama', kind: 'area' },
  ],
};

function heroGroup(): PcGroup {
  return {
    title: 'Üst Bölüm (Hero)',
    fields: [
      { path: 'hero.eyebrow', label: 'Üst etiket' },
      { path: 'hero.headline', label: 'Başlık satırları', kind: 'lines', hint: LINES_HINT },
      { path: 'hero.text', label: 'Tanıtım metni', kind: 'area' },
    ],
  };
}

function statsGroup(): PcGroup {
  return {
    title: 'İstatistik Kutuları',
    lists: [{
      path: 'stats',
      label: 'Kutular',
      template: { value: '', label: '' },
      item: [
        { path: 'value', label: 'Değer (ör. 35+)' },
        { path: 'label', label: 'Etiket' },
      ],
    }],
  };
}

function contactGroup(): PcGroup {
  return {
    title: 'İletişim Bloğu',
    fields: [
      { path: 'contact.title', label: 'Başlık' },
      { path: 'contact.text', label: 'Tanıtım metni', kind: 'area' },
      { path: 'contact.name', label: 'Ad alanı etiketi' },
      { path: 'contact.email', label: 'E-posta alanı etiketi' },
      { path: 'contact.phone', label: 'Telefon alanı etiketi' },
      { path: 'contact.message', label: 'Mesaj alanı etiketi' },
      { path: 'contact.submit', label: 'Gönder düğmesi' },
      { path: 'contact.success', label: 'Başarı mesajı' },
      { path: 'contact.error', label: 'Hata mesajı' },
    ],
  };
}

const PRODUCTS_SCHEMA: PcSchema = [
  META_GROUP,
  heroGroup(),
  statsGroup(),
  {
    title: 'Seri Listesi Bölümü',
    fields: [
      { path: 'list.titleLine1', label: 'Başlık üst satır' },
      { path: 'list.titleLine2', label: 'Başlık alt satır' },
      { path: 'list.intro', label: 'Giriş metni', kind: 'area' },
      { path: 'list.cta', label: 'Kart düğme yazısı' },
      { path: 'list.colorsLabel', label: 'Renkler etiketi' },
    ],
  },
  {
    title: 'Ortak Özellikler Bölümü',
    fields: [
      { path: 'features.titleLine1', label: 'Başlık üst satır' },
      { path: 'features.titleLine2', label: 'Başlık alt satır' },
      { path: 'features.intro', label: 'Giriş metni', kind: 'area' },
    ],
  },
  contactGroup(),
];

const PRODUCTION_SCHEMA: PcSchema = [
  META_GROUP,
  heroGroup(),
  statsGroup(),
  {
    title: 'Galeri Bölümü',
    fields: [
      { path: 'galleryHeading.titleLine1', label: 'Başlık üst satır' },
      { path: 'galleryHeading.titleLine2', label: 'Başlık alt satır' },
      { path: 'galleryHeading.intro', label: 'Giriş metni', kind: 'area' },
    ],
    lists: [{
      path: 'gallery',
      label: 'Görseller',
      template: { image: '', alt: '', title: '', text: '' },
      item: [
        { path: 'image', label: 'Görsel yolu' },
        { path: 'alt', label: 'Görsel alt metni' },
        { path: 'title', label: 'Alt başlık' },
        { path: 'text', label: 'Açıklama', kind: 'area' },
      ],
    }],
  },
  {
    title: 'Yetkinlikler',
    fields: [
      { path: 'capabilities.titleLine1', label: 'Başlık üst satır' },
      { path: 'capabilities.titleLine2', label: 'Başlık alt satır' },
      { path: 'capabilities.intro', label: 'Giriş metni', kind: 'area' },
    ],
    lists: [{
      path: 'capabilities.items',
      label: 'Yetkinlik kartları',
      template: { icon: 'product', label: [] },
      item: [
        { path: 'icon', label: 'İkon anahtarı (product/material/injection/quality)' },
        { path: 'label', label: 'Etiket satırları', kind: 'lines', hint: LINES_HINT },
      ],
    }],
  },
  {
    title: 'Süreç Bölümleri',
    lists: [{
      path: 'sections',
      label: 'Bölümler',
      template: { title: [], image: '', alt: '', paragraphs: [], items: [] },
      item: [
        { path: 'title', label: 'Başlık satırları', kind: 'lines', hint: LINES_HINT },
        { path: 'image', label: 'Görsel yolu' },
        { path: 'alt', label: 'Görsel alt metni' },
        { path: 'paragraphs', label: 'Paragraflar', kind: 'lines', hint: 'Her satır ayrı paragraf.' },
        { path: 'items', label: 'Madde listesi', kind: 'lines', hint: LINES_HINT },
      ],
    }],
  },
  {
    title: 'Kalite Kontrol',
    fields: [
      { path: 'quality.title', label: 'Başlık' },
      { path: 'quality.image', label: 'Görsel yolu' },
      { path: 'quality.alt', label: 'Görsel alt metni' },
      { path: 'quality.items', label: 'Kontrol maddeleri', kind: 'lines', hint: LINES_HINT },
      { path: 'quality.text', label: 'Açıklama', kind: 'area' },
    ],
  },
  {
    title: 'Sevkiyat',
    fields: [
      { path: 'shipping.title', label: 'Başlık satırları', kind: 'lines', hint: LINES_HINT },
      { path: 'shipping.image', label: 'Görsel yolu' },
      { path: 'shipping.alt', label: 'Görsel alt metni' },
      { path: 'shipping.paragraphs', label: 'Paragraflar', kind: 'lines', hint: 'Her satır ayrı paragraf.' },
      { path: 'shipping.cta', label: 'Düğme yazısı' },
    ],
  },
  contactGroup(),
];

const HAKKIMIZDA_SCHEMA: PcSchema = [
  META_GROUP,
  {
    title: 'Üst Bölüm (Hero)',
    fields: [
      { path: 'hero.eyebrow', label: 'Üst etiket' },
      { path: 'hero.headline', label: 'Başlık satırları', kind: 'lines', hint: LINES_HINT },
      { path: 'hero.text', label: 'Tanıtım metni', kind: 'area' },
      { path: 'hero.cta', label: 'Düğme yazısı' },
    ],
  },
  {
    title: 'Kurumsal Kimliğimiz',
    fields: [
      { path: 'kimlik.eyebrow', label: 'Üst etiket' },
      { path: 'kimlik.heading', label: 'Başlık' },
      { path: 'kimlik.paragraphs', label: 'Paragraflar', kind: 'lines', hint: 'Her satır ayrı paragraf.' },
      { path: 'kimlik.image', label: 'Görsel yolu' },
      { path: 'kimlik.imageAlt', label: 'Görsel alt metni' },
    ],
  },
  {
    title: 'Temel Yetkinliklerimiz',
    fields: [
      { path: 'yetkinlik.eyebrowLine', label: 'Üst etiket' },
      { path: 'yetkinlik.headingLine', label: 'Başlık' },
    ],
    lists: [{
      path: 'yetkinlik.items',
      label: 'Yetkinlik kartları',
      template: { no: '', icon: 'product', title: '', body: '' },
      item: [
        { path: 'no', label: 'Sıra no (01…)' },
        { path: 'icon', label: 'İkon anahtarı (product/material/injection/quality)' },
        { path: 'title', label: 'Başlık' },
        { path: 'body', label: 'Açıklama', kind: 'area' },
      ],
    }],
  },
  {
    title: 'Süreç Anlayışı',
    fields: [
      { path: 'surec.eyebrowLine', label: 'Üst etiket' },
      { path: 'surec.headingLine', label: 'Başlık' },
      { path: 'surec.intro', label: 'Giriş metni', kind: 'area' },
    ],
    lists: [{
      path: 'surec.steps',
      label: 'Süreç adımları',
      template: { no: '', title: '', body: '' },
      item: [
        { path: 'no', label: 'Adım no' },
        { path: 'title', label: 'Başlık' },
        { path: 'body', label: 'Açıklama', kind: 'area' },
      ],
    }],
  },
  {
    title: 'Değerlerimiz',
    fields: [
      { path: 'degerler.eyebrowLine', label: 'Üst etiket' },
      { path: 'degerler.headingLine', label: 'Başlık' },
    ],
    lists: [{
      path: 'degerler.items',
      label: 'Değer kartları',
      template: { mark: '✓', title: '', body: '' },
      item: [
        { path: 'mark', label: 'İşaret (✓ gibi)' },
        { path: 'title', label: 'Başlık' },
        { path: 'body', label: 'Açıklama', kind: 'area' },
      ],
    }],
  },
  {
    title: 'Kalite Yönetim Sistemi',
    fields: [
      { path: 'sertifikalar.eyebrowLine', label: 'Üst etiket' },
      { path: 'sertifikalar.headingLine', label: 'Başlık' },
      { path: 'sertifikalar.intro', label: 'Açıklama', kind: 'area' },
      { path: 'sertifikalar.badge.image', label: 'Rozet görseli yolu' },
      { path: 'sertifikalar.badge.alt', label: 'Rozet alt metni' },
    ],
  },
  {
    title: "Promats'ın Yolculuğu",
    fields: [
      { path: 'yolculuk.eyebrowLine', label: 'Üst etiket' },
      { path: 'yolculuk.headingLine', label: 'Başlık' },
    ],
    lists: [{
      path: 'yolculuk.items',
      label: 'Zaman çizelgesi',
      template: { year: '', body: '' },
      item: [
        { path: 'year', label: 'Yıl' },
        { path: 'body', label: 'Açıklama', kind: 'area' },
      ],
    }],
  },
  // "Kapanis Bandi" grubu kaldirildi (2026-08-28): footer menusunu tekrarlayan koyu
  // bant sitede artik render edilmiyor; panelde duzenletmek kafa karistirirdi.
];

export const PAGE_CONTENT_SCHEMAS: Record<string, PcSchema> = {
  products: PRODUCTS_SCHEMA,
  production: PRODUCTION_SCHEMA,
  hakkimizda: HAKKIMIZDA_SCHEMA,
};

/** Nokta yolundan deger okur ("hero.headline" → obj.hero.headline). */
export function pcGet(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

/** Nokta yoluna deger yazar; yol uzerindeki nesneleri kopyalayarak yeni kok dondurur. */
export function pcSet<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const root: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
  let cursor = root;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i]!;
    const current = cursor[key];
    cursor[key] = current && typeof current === 'object' && !Array.isArray(current)
      ? { ...(current as Record<string, unknown>) }
      : {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]!] = value;
  return root as T;
}
