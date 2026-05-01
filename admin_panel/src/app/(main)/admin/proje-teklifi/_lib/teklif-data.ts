// MatPortal Proje Teklifi — Sunum Verisi
// Faz, doküman, modül, KPI, mimari katman bilgileri

export type DocItem = {
  key: string;
  title: string;
  file: string;
  group: "main" | "tartisma";
  description?: string;
};

export const TEKLIF_DOCS: DocItem[] = [
  { key: "index", title: "Ana Sayfa", file: "index.html", group: "main", description: "Genel bakış ve doküman indeksi" },
  { key: "ozet", title: "Tek Sayfa Özet", file: "tek-sayfa-ozet.html", group: "main", description: "A4 yönetim sunum özeti" },
  { key: "00", title: "00 — Yönetici Özeti", file: "00-yonetici-ozeti.html", group: "main", description: "11 fazlı vizyon stratejik özet" },
  { key: "01", title: "01 — Pazar ve Müşteri", file: "01-pazar-ve-musteri-analizi.html", group: "main", description: "Pazar fırsatı, bayi tabanı, SWOT" },
  { key: "02", title: "02 — Çözüm Genel Bakış", file: "02-cozum-genel-bakis.html", group: "main", description: "7 katmanlı mimari, 11 faz haritası" },
  { key: "03", title: "03 — Mimari ve Teknoloji", file: "03-mimari-ve-teknoloji.html", group: "main", description: "Stack, deployment, güvenlik" },
  { key: "04", title: "04 — Kullanıcı Yolculukları", file: "04-kullanici-yolculuklari.html", group: "main", description: "10 senaryo (bayi, yönetici, saha)" },
  { key: "05", title: "05 — Fonksiyonel Kapsam", file: "05-fonksiyonel-kapsam.html", group: "main", description: "260 özellik MVP/Genişleme/Vizyon" },
  { key: "06", title: "06 — Veri Modeli", file: "06-veri-modeli.html", group: "main", description: "30+ yeni tablo, ER, retention" },
  { key: "07", title: "07 — Yol Haritası", file: "07-yol-haritasi.html", group: "main", description: "Hafta-hafta plan, milestone" },
  { key: "08", title: "08 — Bütçe ve Kaynak", file: "08-butce-kaynak.html", group: "main", description: "3 senaryo bütçe ($50-1.800/ay)" },
  { key: "09", title: "09 — Risk Yönetimi", file: "09-risk.html", group: "main", description: "30+ risk, mitigation, acil prosedür" },
  { key: "10", title: "10 — Başarı ve KPI", file: "10-basari-kpi.html", group: "main", description: "7 kategori, 30+ KPI" },
  { key: "11", title: "11 — Ek Belgeler", file: "11-ek-belgeler.html", group: "main", description: "Sözlük, KVKK, sözleşme klozu" },
];

export const TARTISMA_DOCS: DocItem[] = [
  { key: "t-index", title: "Tartışma İndeksi", file: "tartisma/index.html", group: "tartisma" },
  { key: "t-00", title: "00 — Vizyon", file: "tartisma/00-vizyon.html", group: "tartisma" },
  { key: "t-01", title: "01 — Talep & Tahmin Motoru", file: "tartisma/01-talep-tahmin-motoru.html", group: "tartisma" },
  { key: "t-02", title: "02 — Müşteri Keşif", file: "tartisma/02-musteri-kesif.html", group: "tartisma" },
  { key: "t-03", title: "03 — Tedarikçi Yönetimi", file: "tartisma/03-tedarikci-yonetimi.html", group: "tartisma" },
  { key: "t-04", title: "04 — Stok Tahmin", file: "tartisma/04-stok-tahmin-otomasyonu.html", group: "tartisma" },
  { key: "t-05", title: "05 — Veri Toplama Altyapısı", file: "tartisma/05-veri-toplama-altyapisi.html", group: "tartisma" },
  { key: "t-06", title: "06 — Yol Haritası (ilk taslak)", file: "tartisma/06-yol-haritasi.html", group: "tartisma" },
  { key: "t-07", title: "07 — Konversasyonel Katman", file: "tartisma/07-konversasyonel-katman.html", group: "tartisma" },
  { key: "t-08", title: "08 — SaaS Bütçe Analizi", file: "tartisma/08-saas-butce-analizi.html", group: "tartisma" },
  { key: "t-09", title: "09 — Otomasyon Eşikleri", file: "tartisma/09-otomasyon-esikleri.html", group: "tartisma" },
  { key: "t-10", title: "10 — CRM Kararı", file: "tartisma/10-crm-karari.html", group: "tartisma" },
  { key: "t-11", title: "11 — B2B Bayi Portalı", file: "tartisma/11-b2b-bayi-portali.html", group: "tartisma" },
  { key: "t-12", title: "12 — Faz 2 Tahmin (deep)", file: "tartisma/12-tahmin-motoru-derinlemesine.html", group: "tartisma" },
  { key: "t-13", title: "13 — Faz 5 Bayi Scraping & Churn", file: "tartisma/13-bayi-scraping-churn.html", group: "tartisma" },
  { key: "t-14", title: "14 — Faz 7 MLOps", file: "tartisma/14-egitilebilir-modeller-mlops.html", group: "tartisma" },
  { key: "t-15", title: "15 — Faz 8+ Genişleme", file: "tartisma/15-genisletme-sinyalleri.html", group: "tartisma" },
];

export const ALL_DOCS = [...TEKLIF_DOCS, ...TARTISMA_DOCS];

export function findDoc(key: string): DocItem | undefined {
  return ALL_DOCS.find((d) => d.key === key);
}

// 11 Faz Tanımı
export type Faz = {
  no: number;
  baslik: string;
  ozet: string;
  durum: "tamam" | "devam" | "planli" | "vizyon";
  sure: string;
  modulSayisi: number;
  ana: string[]; // Ana çıktılar
  renk: string; // Tailwind renk class'ı tone (text/bg)
  ikon: string; // Lucide icon name
  detayDokuman: string; // doc key
};

export const FAZLAR: Faz[] = [
  {
    no: 0,
    baslik: "Paspas Tamamlanma",
    ozet: "Mevcut 14 modülün polish'i, stabilite, bug=0, test coverage ≥%70",
    durum: "devam",
    sure: "4 hafta",
    modulSayisi: 14,
    ana: ["Stabilite", "Test", "Backup", "Monitoring"],
    renk: "red",
    ikon: "Wrench",
    detayDokuman: "07",
  },
  {
    no: 1,
    baslik: "Talep Toplama",
    ozet: "Bayi/müşteri taleplerini merkezi havuzda topla, LLM ile yapılandır",
    durum: "planli",
    sure: "4 hafta",
    modulSayisi: 1,
    ana: ["Talep havuzu", "LLM yapılandırma", "Kanban UI"],
    renk: "amber",
    ikon: "Inbox",
    detayDokuman: "t-01",
  },
  {
    no: 2,
    baslik: "Sipariş Tahmin Motoru",
    ozet: "Bayi-ürün × dönem tahmin · Naive→Prophet→XGBoost",
    durum: "planli",
    sure: "8 hafta",
    modulSayisi: 1,
    ana: ["4 algoritma", "Champion/challenger", "Excel upload", "MAPE <%35"],
    renk: "blue",
    ikon: "TrendingUp",
    detayDokuman: "t-12",
  },
  {
    no: 3,
    baslik: "Müşteri Keşif",
    ozet: "TOBB + sanayim.net + Apollo · yurt içi/dışı lead pipeline",
    durum: "planli",
    sure: "6 hafta",
    modulSayisi: 1,
    ana: ["Lead havuzu", "ML benzerlik skoru", "Outreach LLM"],
    renk: "indigo",
    ikon: "UserSearch",
    detayDokuman: "t-02",
  },
  {
    no: 4,
    baslik: "Stok & Tedarik Otomasyonu",
    ozet: "Tüketim hızı + ROP + tedarikçi performans + otomatik PO",
    durum: "planli",
    sure: "6 hafta",
    modulSayisi: 1,
    ana: ["ROP otomatik", "PO taslağı", "Tedarikçi skoru"],
    renk: "emerald",
    ikon: "Package",
    detayDokuman: "t-04",
  },
  {
    no: 5,
    baslik: "Bayi Scraping & Churn",
    ozet: "Crawlee+Playwright · 11 sinyal · XGBoost churn modeli",
    durum: "planli",
    sure: "8 hafta",
    modulSayisi: 1,
    ana: ["Web scraping", "Sosyal medya", "Churn skoru", "Aksiyon önerisi"],
    renk: "rose",
    ikon: "Radar",
    detayDokuman: "t-13",
  },
  {
    no: 6,
    baslik: "B2B Bayi Portalı",
    ozet: "Bayinin 7/24 sipariş + cari + katalog görüntülediği kurumsal portal",
    durum: "planli",
    sure: "8 hafta",
    modulSayisi: 10,
    ana: ["Katalog + araç", "Sepet + sipariş", "Cari hesap", "Sipariş takip"],
    renk: "violet",
    ikon: "Store",
    detayDokuman: "t-11",
  },
  {
    no: 7,
    baslik: "MLOps & Eğitilebilir Modeller",
    ozet: "Excel'den eğitim · Champion/challenger · SHAP · auto-rollback",
    durum: "planli",
    sure: "8 hafta",
    modulSayisi: 1,
    ana: ["MLflow + S3", "A/B test", "Active learning", "Multi-deployment"],
    renk: "purple",
    ikon: "Brain",
    detayDokuman: "t-14",
  },
  {
    no: 8,
    baslik: "Konversasyonel Katman",
    ozet: "Yönetici/bayi sohbetle iş yapsın · risk skorlu onay · audit'li",
    durum: "vizyon",
    sure: "6 hafta",
    modulSayisi: 1,
    ana: ["LLM multi-provider", "Niyet çıkarımı", "Onay matrisi", "Kill-switch"],
    renk: "fuchsia",
    ikon: "MessagesSquare",
    detayDokuman: "t-07",
  },
  {
    no: 9,
    baslik: "Mobil & Saha CRM",
    ozet: "Saha satış mobil + bayi PWA + ses kaydı + churn feed-in",
    durum: "vizyon",
    sure: "8 hafta",
    modulSayisi: 3,
    ana: ["Flutter saha", "Bayi PWA", "Whisper ses", "Push FCM"],
    renk: "cyan",
    ikon: "Smartphone",
    detayDokuman: "07",
  },
  {
    no: 10,
    baslik: "Genişleme (10 ek modül)",
    ozet: "Rakip · fiyat · OCR · lojistik · CBAM · API entegrasyonları",
    durum: "vizyon",
    sure: "ihtiyaca göre",
    modulSayisi: 10,
    ana: ["AI belge OCR", "e-Fatura", "Rakip izleme", "Karbon ayakizi"],
    renk: "slate",
    ikon: "Sparkles",
    detayDokuman: "t-15",
  },
];

// 7 Katmanlı Mimari
export type Katman = {
  kod: "G" | "F" | "E" | "D" | "C" | "B" | "A";
  baslik: string;
  altbaslik: string;
  fazlar: number[];
  renk: string;
  ikon: string;
};

export const KATMANLAR: Katman[] = [
  {
    kod: "G",
    baslik: "Konversasyonel",
    altbaslik: "Yönetici/bayi sohbet · risk skorlu onay",
    fazlar: [8],
    renk: "fuchsia",
    ikon: "MessagesSquare",
  },
  {
    kod: "F",
    baslik: "Uygulama",
    altbaslik: "Bayi Portal · Mobil · Saha CRM",
    fazlar: [6, 9],
    renk: "violet",
    ikon: "AppWindow",
  },
  {
    kod: "E",
    baslik: "MLOps",
    altbaslik: "Champion/Challenger · Excel upload · A/B test",
    fazlar: [7],
    renk: "purple",
    ikon: "Brain",
  },
  {
    kod: "D",
    baslik: "Tahmin Motorları",
    altbaslik: "Sipariş · Stok · Churn · Naive→Prophet→XGBoost",
    fazlar: [2, 4, 5],
    renk: "blue",
    ikon: "TrendingUp",
  },
  {
    kod: "C",
    baslik: "Sinyal Toplama",
    altbaslik: "Crawlee + Playwright + Apify · KVKK uyumlu",
    fazlar: [5],
    renk: "emerald",
    ikon: "Radar",
  },
  {
    kod: "B",
    baslik: "Talep & Keşif",
    altbaslik: "Talep havuzu · Lead pipeline · TOBB+Apollo",
    fazlar: [1, 3],
    renk: "amber",
    ikon: "Inbox",
  },
  {
    kod: "A",
    baslik: "Paspas ERP",
    altbaslik: "14 modül · mevcut · dokunulmaz",
    fazlar: [0],
    renk: "red",
    ikon: "Database",
  },
];

// KPI Hedefleri
export type Kpi = {
  kategori: string;
  baslik: string;
  baseline: string;
  hedef: string;
  fark: string;
  yon: "yukari" | "asagi";
  renk: string;
};

export const KPI_LIST: Kpi[] = [
  {
    kategori: "Bayi Adopt",
    baslik: "Sipariş frekansı",
    baseline: "~150/ay",
    hedef: "+%30-40",
    fark: "~250-300/ay",
    yon: "yukari",
    renk: "violet",
  },
  {
    kategori: "Bayi Adopt",
    baslik: "Portal payı",
    baseline: "0",
    hedef: "%70",
    fark: "12 ay",
    yon: "yukari",
    renk: "violet",
  },
  {
    kategori: "Tahmin",
    baslik: "MAPE",
    baseline: "ölçülmedi",
    hedef: "<%20",
    fark: "olgunluk",
    yon: "asagi",
    renk: "blue",
  },
  {
    kategori: "Operasyon",
    baslik: "Sipariş hatası",
    baseline: "8-12/ay",
    hedef: "<3/ay",
    fark: "-%80",
    yon: "asagi",
    renk: "emerald",
  },
  {
    kategori: "Operasyon",
    baslik: "Satış zamanı",
    baseline: "3-4 sa/gün",
    hedef: "<1.5 sa",
    fark: "-%65",
    yon: "asagi",
    renk: "emerald",
  },
  {
    kategori: "Stratejik",
    baslik: "Churn oranı",
    baseline: "bilinmiyor",
    hedef: "<%5/yıl",
    fark: "yeni metrik",
    yon: "asagi",
    renk: "rose",
  },
];

// Teknoloji Stack
export type TechItem = {
  isim: string;
  kategori: "backend" | "frontend" | "ml" | "scraping" | "infra" | "mobile" | "ai";
  versiyon?: string;
};

export const TECH_STACK: TechItem[] = [
  { isim: "Fastify 5", kategori: "backend", versiyon: "5.x" },
  { isim: "Bun", kategori: "backend" },
  { isim: "Drizzle ORM", kategori: "backend" },
  { isim: "MySQL 8", kategori: "backend" },
  { isim: "Zod", kategori: "backend" },
  { isim: "Next.js 16", kategori: "frontend", versiyon: "16.x" },
  { isim: "React 19", kategori: "frontend" },
  { isim: "Tailwind 4", kategori: "frontend" },
  { isim: "Shadcn/UI", kategori: "frontend" },
  { isim: "Redux Toolkit", kategori: "frontend" },
  { isim: "Python FastAPI", kategori: "ml" },
  { isim: "scikit-learn", kategori: "ml" },
  { isim: "Prophet", kategori: "ml" },
  { isim: "XGBoost", kategori: "ml" },
  { isim: "MLflow", kategori: "ml" },
  { isim: "SHAP", kategori: "ml" },
  { isim: "Crawlee", kategori: "scraping" },
  { isim: "Playwright", kategori: "scraping" },
  { isim: "Apify", kategori: "scraping" },
  { isim: "Anthropic Claude", kategori: "ai" },
  { isim: "OpenAI", kategori: "ai" },
  { isim: "Groq", kategori: "ai" },
  { isim: "Whisper", kategori: "ai" },
  { isim: "Flutter", kategori: "mobile" },
  { isim: "Firebase FCM", kategori: "mobile" },
  { isim: "Docker", kategori: "infra" },
  { isim: "Redis + BullMQ", kategori: "infra" },
  { isim: "S3 / MinIO", kategori: "infra" },
  { isim: "Cloudflare", kategori: "infra" },
];

// Üst düzey istatistikler
export const STATS = {
  fazSayisi: 11,
  modulSayisi: 17,
  ozellikSayisi: 260,
  veriTablosuSayisi: 30,
  aiSinyaliSayisi: 11,
  toplamSure: "~14-15 ay",
  pilotBayi: 5,
  mevcutBayi: 35,
  hedefBayi: "50-65",
};
