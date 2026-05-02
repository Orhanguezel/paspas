# CLAUDE.md — Paspas Üretim ERP

Bu dosya Claude Code'un bu projede çalışırken uyması gereken tüm kuralları tanımlar.
Tüm alt projeler (admin_panel, backend) bu dosyayı miras alır; her biri kendi ek kurallarını kendi CLAUDE.md dosyasında tutar.

---

## 🔔 KRITIK İŞ HATIRLATMASI — Lead/Competitor Monitoring Pilot

> Claude'un bu repoyu acarken kontrol etmesi gereken: `Today's date` ile asagidaki tarihleri karsilastir, vakti gelmis maddeleri kullaniciya **proaktif olarak** hatirlat.

**Konu:** Paspas musterisi bayi izleme icin somut talepte bulundu. Bu talep **gelir ureten** ilk pilot olarak isleniyor (199-499 EUR/ay). Detayli plan: [`docs/tartisma/14-lead-monitoring-pilot.md`](./docs/tartisma/14-lead-monitoring-pilot.md)

**Aktif aksiyonlar:**
- 🔔 **2026-05-02 → 2026-05-09 (BU HAFTA):** Paspas sunum dosyasi duzenleme + musteri gorusmesi + ilk teklif. Sunum kalitesi yetersizdi, kullanici duzenleme yapacak.
- 🔔 **2026-05-09:** Ilk fatura kesimi hedefi (manuel rapor + 199 EUR teklif)
- 🔔 **2026-05-16:** Pilot durum degerlendirmesi
- 🔔 **2026-05-23:** Ikinci musteriye teklif (Ensotek/Vista/Konig)

**Cross-references:**
- Detay teknik mimari: [`docs/tartisma/13-bayi-scraping-churn.md`](./docs/tartisma/13-bayi-scraping-churn.md)
- Workspace strateji: `/home/orhan/Documents/Projeler/BUSINESS-STRATEGY.md`
- Mevcut altyapi: scraper-service (LIVE) — `~/.claude/.../memory/scraper_service.md`

---

## Proje Özeti

Plastik enjeksiyon kalıplama fabrikası için tam kapsamlı **Üretim ERP sistemi**.
Hammaddeden müşteri sevkiyatına tüm süreci yönetir.

| Katman | Teknoloji | Dizin |
|--------|-----------|-------|
| Admin Panel | Next.js 16, React 19, Shadcn/UI, Redux Toolkit, RTK Query, Tailwind 4 | `admin_panel/` |
| Backend | Fastify 5, Drizzle ORM, MySQL, Bun, Zod | `backend/` |

---

## ERP Modülleri

Proje şu 14 modülden oluşur. Her modül backend + admin panel olmak üzere iki tarafta da karşılık bulur.

| # | Modül | Backend Route Prefix | Admin Panel Route |
|---|-------|---------------------|-------------------|
| 1 | Dashboard | `/admin/dashboard` | `/admin/dashboard` |
| 2 | Ürünler | `/admin/urunler` | `/admin/urunler` |
| 3 | Reçeteler | `/admin/receteler` | `/admin/receteler` |
| 4 | Müşteriler | `/admin/musteriler` | `/admin/musteriler` |
| 5 | Satış Siparişleri | `/admin/satis-siparisleri` | `/admin/satis-siparisleri` |
| 6 | Üretim Emirleri | `/admin/uretim-emirleri` | `/admin/uretim-emirleri` |
| 7 | Makine Havuzu | `/admin/makine-havuzu` | `/admin/makine-havuzu` |
| 8 | Makine İş Yükleri | `/admin/is-yukler` | `/admin/is-yukler` |
| 9 | Gantt Planı | `/admin/gantt` | `/admin/gantt` |
| 10 | Malzeme Stokları | `/admin/stoklar` | `/admin/stoklar` |
| 11 | Satın Alma | `/admin/satin-alma` | `/admin/satin-alma` |
| 12 | Hareketler | `/admin/hareketler` | `/admin/hareketler` |
| 13 | Operatör Ekranı | `/admin/operator` | `/admin/operator` |
| 14 | Tanımlar | `/admin/tanimlar` | `/admin/tanimlar` |

---

## Temel Kod Kuralları (Her İki Taraf İçin)

### 1. DRY — Tekrar Yok
- Aynı mantık iki yerde **asla** yazılmaz.
- Ortak yardımcı fonksiyonlar `_shared/` veya `lib/` içinde tek yerde yaşar.
- Birden fazla modulde kullanılan tip/şema merkezi bir dosyada tanımlanır ve import edilir.

### 2. Deterministik
- Fonksiyonlar aynı girdiye her zaman aynı çıktıyı verir.
- Yan etki (side effect) içeren kod açıkça işaretlenir ve izole edilir.
- Global mutasyon yasaktır; değişiklikler bağımlılık zinciri üzerinden iletilir.

### 3. Import Düzeni
Her dosyada import sırası şöyle olmalı:
```
1. Node / runtime built-ins
2. Framework (react, next, fastify)
3. Üçüncü taraf kütüphaneler (zod, drizzle, sonner…)
4. İç modüller — @/ veya @/modules/...
5. Aynı modülden göreceli importlar (./schema, ./validation…)
```
- Wildcard import (`import * as X`) kullanılmaz.
- Barrel index dosyaları (`index.ts`) sadece modül sınırında kullanılır, iç klasörlerde kullanılmaz.
- Tip importları ayrı tutulur: `import type { Foo } from '...'`

### 4. Bileşen / Fonksiyon Boyutu
- Bir dosya tek bir sorumluluğa sahip olur.
- React bileşeni > 200 satır → alt bileşenlere bölünür.
- Backend controller fonksiyonu > 60 satır → service katmanına taşınır.

### 5. TypeScript
- `any` tip yasaktır; zorunluysa `// eslint-disable` yorumuyla gerekçelendirilir.
- Her fonksiyon parametresi ve dönüş tipi açıkça yazılır.
- Zod şemaları hem backend validasyonunda hem de frontend tip üretiminde kullanılır.

### 6. Hata Yönetimi
- Backend: tüm async route handler'lar `try/catch` ile sarılır.
- Frontend: RTK Query `.unwrap()` çağrıları `try/catch` içindedir; hata `toast.error()` ile gösterilir.
- Kullanıcıya gösterilen hata mesajları Türkçe ve anlamlıdır.

### 7. Türkçe / İngilizce Kural
- Kod (değişken, fonksiyon, dosya adı): **İngilizce**
- UI metinleri ve locale anahtarları: **Türkçe**
- Yorum satırları: kısa olanlar İngilizce, açıklayıcı olanlar Türkçe olabilir

---

## Proje Kural Önceliği

```
Bu CLAUDE.md  >  admin_panel/CLAUDE.md  >  backend/CLAUDE.md  >  Claude'un varsayılanları
```

## Portfolio Metadata Rule

- Proje kokunde `project.portfolio.json` dosyasi zorunludur.
- Proje ozeti, teknoloji yigini, kategori, servisler, repo/live URL bilgileri degistiginde bu dosya guncellenir.
- `/home/orhan/Documents/Projeler` portfolio standardi geregi bu dosya guncellenmeden is tamamlanmis sayilmaz.
