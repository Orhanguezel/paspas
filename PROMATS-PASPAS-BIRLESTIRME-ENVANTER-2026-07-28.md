# Promats → Paspas Birleştirme Envanteri

**Alınma zamanı:** 2026-07-28 09:55 Europe/Berlin  
**Canlı sunucu:** `vps-paspas`  
**Hedef DB:** `promats_erp`  
**Kaynak DB:** `promats_site`

## Güvenli başlangıç yedeği

Sunucu dizini:

`/var/backups/promats-paspas-merge-20260728-095508`

İçerik:

| Dosya | Boyut | Kapsam |
|---|---:|---|
| `paspas-target.sql` | 384 KB | Hedef page feedback, site settings ve storage |
| `promats-source.sql` | 168 KB | Kaynak feedback ve bütün Promats web içerik tabloları |
| `promats-uploads.tar.gz` | 6.8 MB | Kaynak Promats backend upload dosyaları |
| `SHA256SUMS` | 4 KB | Yedek bütünlük doğrulama değerleri |

Tüm dosyalar `chmod 600`, yedek dizini `chmod 700` olarak oluşturuldu.

## Yazılımcı notu canlı baz değerleri

| Ölçüm | Paspas hedef | Promats kaynak |
|---|---:|---:|
| Thread | 129 | 39 |
| Comment | 289 | 77 |
| Ortak thread UUID | 0 | 0 |
| Ortak comment UUID | 0 | 0 |

Kaynak Promats thread durumları:

| Durum | Sayı |
|---|---:|
| `open` | 1 |
| `resolved` | 38 |

Kaynak Promats öncelikleri:

| Öncelik | Sayı |
|---|---:|
| `normal` | 39 |

Hedef Paspas thread durumları:

| Durum | Sayı |
|---|---:|
| `open` | 9 |
| `resolved` | 120 |

Hedef Paspas öncelikleri:

| Öncelik | Sayı |
|---|---:|
| `critical` | 1 |
| `high` | 1 |
| `normal` | 127 |

## Promats web içerik baz değerleri

| Kaynak tablo | Satır |
|---|---:|
| `languages` | 2 |
| `promats_menu_items` | 25 |
| `static_texts` | 84 |
| `special_pages` | 24 |
| `special_page_gallery` | 2 |
| `products` | 16 |
| `product_features` | 153 |
| `articles` | 4 |
| `home_sections` | 5 |
| `site_settings` | 43 |
| `storage_assets` | 26 |
| `theme_config` | 0 |

`information_schema.table_rows` yaklaşık değer verdiğinden final migrasyon doğrulamasında
her tablo için doğrudan `COUNT(*)` tekrar alınacaktır.

## Public Promats frontend API sözleşmesi

Promats frontend'in doğrudan kullandığı proje endpoint'leri:

- `GET /products`
- `GET /products/search`
- `GET /products/:slug`
- `GET /banners`
- `GET /content`
- `GET /pages/:slug`
- `GET /articles`
- `GET /articles/:slug`
- `GET /menu`
- `GET /settings`
- `POST /contact`
- `GET /home/layout`

Ortak altyapı endpoint'leri:

- `GET /site_settings/:key`
- `GET /theme`
- storage/upload URL'leri

## Admin Promats API sözleşmesi

- `GET /admin/promats/summary`
- `GET/POST /admin/promats/:table`
- `GET/PATCH/DELETE /admin/promats/:table/:id`
- `GET/POST /admin/home/sections`
- `POST /admin/home/sections/reorder`
- `GET/PATCH/DELETE /admin/home/sections/:id`
- site settings admin endpoint'leri
- theme admin endpoint'leri
- storage admin endpoint'leri

## İlk uygulama kararları

1. Promats web tabloları Paspas DB'ye `web_promats_*` prefix'iyle eklenecek.
2. Tek Paspas `site_settings` tablosu kullanılacak.
3. Promats frontend ayarları `web.promats.frontend.*`, Web Sayfası admin ayarları
   `web.promats.admin.*` namespace'iyle ayrılacak.
4. Promats content API DTO ve URL davranışı korunacak.
5. Geçişte eski frontend'i kırmamak için Paspas backend hem namespace'li yeni route'u
   hem geçici uyumluluk route'unu sunabilecek.
6. Page feedback UUID kesişimi sıfır olduğu için kaynak UUID'ler korunacak.
7. Taşınan feedback kayıtları kaynak uygulamayı ayırt etmek için şema seviyesinde
   `source_app` alanı taşıyacak.
8. Eski Promats admin/backend bu aşamada silinmeyecek.
9. `storage_assets`, kullanıcı/roller, bildirimler ve `page_feedback_*` için ikinci
   altyapı tablosu oluşturulmayacak; Paspas ana tabloları kullanılacak.
