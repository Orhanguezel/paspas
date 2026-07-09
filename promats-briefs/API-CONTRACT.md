# API CONTRACT — Promats

> **Mimar (Claude) teslimatı.** Codex backend endpoint'lerini ve frontend veri çekimini bu kontrata göre yazar.
> **Standart:** Tüm iş endpoint'leri `/api/v1/...` altında (sablon_proje kuralı). Zod ile validate; response tipleri frontend ile paylaşılır (`packages/shared-types` veya yerel).
> Eşlik eden şema: [`SCHEMA-CONTRACT.md`](./SCHEMA-CONTRACT.md).
>
> **🔄 GERÇEK DURUMA GÖRE GÜNCELLENDİ (Claude, 2026-06-20):** Aşağıdaki DTO'lar canlı API'den (8186) doğrulanmış **gerçek** şekillerdir; ilk taslaktaki ham kolon adları (`urun`/`etiket`/`s1_1_text`) yerine geçer.
>
> **DTO konvansiyonu (kanonik):** API ham DB kolonlarını **camelCase semantik DTO'ya** çevirir. DB tarafı tüm s-alanlarını birebir korur (bkz. SCHEMA-CONTRACT), API bunları anlamlı isimlere map'ler:
> `dil → languageId` · `dil_grup → sourceLanguageId` · `sira → sortOrder` · `konum → position` · `urun → name` · `etiket → slug` · `target → targetBlank` · `durum` (sadece filtre, DTO'da yok).

---

## Ortak

- **Dil parametresi:** Her public endpoint `?lang=tr|en` alır → `dil` (1|2) eşlenir. Varsayılan `tr`.
- **Response zarfı:** `{ ok: boolean, data?: T, error?: string }`. Hata mesajları **Türkçe**.
- **Görünürlük:** Public endpoint'ler yalnızca `durum=0` döndürür.
- **Sıralama:** `ORDER BY sira ASC, id DESC` (orijinal davranış).

---

## Public Endpoint'ler

### Ürünler
| Method | Path | Açıklama | Query/Param |
|--------|------|----------|-------------|
| GET | `/api/v1/products` | Ürün listesi (vitrin + header dropdown) | `lang` |
| GET | `/api/v1/products/:slug` | Ürün detay + özellikler | `slug`, `lang` |
| GET | `/api/v1/products/search` | Ürün arama | `q`, `lang` |

**Product (liste öğesi)** → `{ id, languageId, sortOrder, name, slug, hero, sections }`

**Product detail** (gerçek DTO) →
```ts
{
  id: number; languageId: number; sortOrder: number;
  name: string;          // ← urun
  slug: string;          // ← etiket
  hero: {
    title1: string;      // ← s1_1_text
    title2: string;      // ← s1_2_text
    description: string; // ← s1_3_text
    image: string;       // ← s1_4_resim
  };
  sections: {
    conceptImage: string;       // ← s2_1_resim
    conceptTitle: string;       // ← s2_2_text
    conceptSubtitle: string;    // ← s2_3_text
    conceptLabel: string;       // ← s2_4_text
    conceptDescription: string; // ← s2_5_text
    detailImage: string;        // ← s3_1_resim
    backgroundImage: string;    // ← s3_2_resim
    setImage: string;           // ← s4_1_resim
    dimensions: string[];       // ← [s5_1_text … s5_5_text] (5 eleman)
  };
  features: Array<{ id; productId; type: 1|2; sortOrder; image; feature: string }>;
}
```
**✅ Parite garantisi:** 17 orijinal s-alanının tamamı DTO'da karşılanır (hero 4 + sections 8 + dimensions 5). Atlanan alan yok.

**features** (düz dizi — frontend `type`'a göre ayırır):
- `type=1` renk/varyant → `feature` = `"Ad / Name|Kod"` (ör. `"Siyah / Black|1112 101"`); frontend `feature.split('|')` = `[ad, kod]`.
- `type=2` özellik ikonu → `image` + `feature` metni.

**Search** → `name LIKE %q%` → liste öğeleri (Product liste şekli).

### İçerik / Sayfalar
| Method | Path | Açıklama | Query/Param |
|--------|------|----------|-------------|
| GET | `/api/v1/banners` | Anasayfa slider/banner | `lang`, `konum` (default 1) |
| GET | `/api/v1/pages/:etiket` | Özel sayfa (hakkımızda vb.) + galeri | `etiket`, `lang` |

**Banner (liste öğesi)** → `{ id, languageId, sortOrder, position, title, image, detail, url, slug }`

**Page** (gerçek DTO) → `{ id, languageId, sortOrder, position, title, image, detail, url, slug, gallery }`
- `title` ← sayfa · `detail` (HTML-encoded) ← detay · `image` ← resim · `slug` ← etiket
- `gallery` = `special_page_gallery WHERE special_page_id=page.id AND status=0` → `Array<{ id, sortOrder, image }>`
- `detail` HTML-encoded → frontend'de decode + güvenli render (sanitize).

### Menü & Sabit Yazı
| Method | Path | Açıklama | Query |
|--------|------|----------|-------|
| GET | `/api/v1/menu` | Menü öğeleri | `lang`, `konum` (opsiyonel) |
| GET | `/api/v1/settings` | Sabit yazılar (key→value map) | `lang` |

**menu (liste öğesi)** → `{ id, languageId, sortOrder, position, title, url, targetBlank }`

**settings** → `Record<anahtar, deger>` (düz key→value map) → `SabitYaziFunc(key)` = `map[key] ?? key`.
- Anahtar = orijinal Türkçe metin (ör. `"ANASAYFA"`, `"İLETİŞİM"`, `"Bizi Takip Edin"`).
- `gt_*` globalleri map içinde **doğrulandı**: `gt_facebook`, `gt_instagram`, `gt_whatsapp_link` (+ adres/tel anahtarları). Header/Footer sosyal linkler bu map'ten beslenir (hard-code yok).

### İletişim
| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/api/v1/contact` | İletişim formu → mail (Nodemailer) |

**Body (Zod):** `{ ad: string(min1), eposta: string.email, telefon?: string, mesaj: string(min1) }`
- Lokal: console/Mailtrap transport yeter (deploy ertelendi). Orijinal `islemler.asp?islem=mailgonder` + `mail-gonder.asp` karşılığı.
- Spam koruması: basit honeypot/rate-limit (orijinalde session token vardı).

---

## Admin Endpoint'leri (TAM CRUD — auth zorunlu)

> Şablonun auth/JWT'si kullanılır (authsuz istek 401). Her kaynak için standart CRUD; `languageId` ve `sourceLanguageId` ile çeviri çiftleri yönetilir.
> Mevcut implementasyon generic CRUD ile geliyor: `/api/v1/admin/promats/:table` (+ `/summary`); aşağıdaki mantıksal kaynak eşlemeleri bunun üzerine oturur.

| Kaynak | Base path | Operasyonlar |
|--------|-----------|--------------|
| Ürünler | `/api/v1/admin/products` | list, get, create, update, delete (+ section alanları + görsel yükleme) |
| Ürün özellikleri | `/api/v1/admin/products/:id/features` | list, create, update, delete (tip 1/2) |
| Özel sayfalar | `/api/v1/admin/pages` | CRUD + galeri alt-kaynağı |
| Galeri | `/api/v1/admin/pages/:id/gallery` | list, create, delete |
| Menü | `/api/v1/admin/menu` | CRUD |
| Sabit yazı | `/api/v1/admin/settings` | list, update (anahtar/deger) |

- Görsel yükleme: `backend/uploads/` (şablonda mevcut) → `userfiles/` paritesi. Yol DB'ye göreceli yazılır.
- Validasyon: Zod şemaları create/update için; `any` yasak.

---

## Frontend Route ↔ Endpoint eşleme

| Route | Veri kaynağı |
|-------|--------------|
| `/[locale]` (anasayfa) | `/banners` (konum=1) + `/products` (vitrin) |
| `/[locale]/urunler/[slug]` | `/products/:slug` |
| `/[locale]/arama?q=` | `/products/search` |
| `/[locale]/iletisim` | `/settings` (adres/tel/harita) + `POST /contact` |
| `/[locale]/[slug]` (özel sayfa) | `/pages/:slug` |
| Header/Footer (her sayfa) | `/menu` + `/settings` + `/products` (dropdown) |

---

## Legacy URL Redirect Haritası (SEO sürekliliği)

Orijinal IIS rewrite: ürün **ve** özel sayfa ikisi de `/{etiket}.html` ile servis ediliyordu.

| Eski URL | Yeni URL | Yöntem |
|----------|----------|--------|
| `/index.html` | `/tr` | 301 |
| `/iletisim.html` | `/tr/iletisim` | 301 |
| `/hakkimizda.html` | `/tr/{etiket}` (özel sayfa) | 301 |
| `/{etiket}.html` (ürün) | `/tr/urunler/{etiket}` | 301 (middleware: önce products'ta ara) |
| `/{etiket}.html` (sayfa) | `/tr/{etiket}` | 301 (products'ta yoksa pages'te ara) |
| `/404.html` | `not-found` | — |
| `/DilSec.asp?id=2` | next-intl `en` locale | — |

> Next.js `middleware.ts`: `.html` ile biten eski yolları yakala → `etiket`i çıkar → products mı page mi olduğunu tespit edip 301 yönlendir. (Deploy ertelendiği için lokal düşük öncelik; ama route yapısı buna uygun kurulmalı.)

---

## Doğrulama (2026-06-20 — canlı API'den teyit edildi ✅)
- Tüm public endpoint'ler TR ve EN için 200 + doğru `languageId` satırları. ✅
- `/products/:slug` detayı 17 s-alanını eksiksiz map'liyor (hero+sections+dimensions); `features` `type` ile renk/ikon ayrımı yapıyor. ✅
- `/settings` map'i `SabitYaziFunc` davranışını karşılıyor; `gt_facebook/gt_instagram/gt_whatsapp_link` mevcut. ✅
- `/menu`, `/banners`, `/pages/:slug` DTO'ları yukarıdaki şekillerle eşleşiyor. ✅
- `/contact` Zod validasyonu + mail (lokal transport) — backend modülünde mevcut.
