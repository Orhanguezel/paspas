# Promats → Paspas Canlı Geçiş ve Gözlem Raporu

## Gözlem başlangıcı

- Kontrol zamanı: `2026-07-28T14:03:27+00:00`
- Eski Promats API için erişim logunda görülen son istek:
  `2026-07-28T09:53:10+00:00`
- 48 saatlik trafiksiz gözlem için güvenli baseline:
  `2026-07-28T14:03:27+00:00`
- En erken silme kapısı kontrolü:
  `2026-07-30T14:03:27+00:00`
- Eski `promats-api` ve `promats-admin` süreçleri gözlem süresince online ve
  rollback için hazır tutuluyor. Henüz durdurulmadı veya silinmedi.

### Ara gözlem

- `2026-07-28T14:19:12+00:00`: eski `/promats/api/` ve `/promats-admin`
  erişimleri tekrar tarandı.
- Son eski API isteği halen `2026-07-28T09:53:10+00:00`; baseline sonrasında
  yeni eski-backend/admin trafiği görülmedi.
- Paspas public Web API ve admin dokümantasyon sayfası HTTP 200.
- Yeni deploy sonrasında production backend error logunda yeni Promats/Whisper
  kaynaklı hata görülmedi.
- `2026-07-28T14:41:20+00:00`: eski route'un son isteği halen
  `2026-07-28T09:53:10+00:00`; yeni trafik yok. Paspas API/panel ve Promats
  frontend online, `nginx -t` başarılı.
- Gerçek sayfa UAT'sinde eksik iki opsiyonel setting için oluşan beklenen 404
  logları (`site_favicon`, `bing_site_verification`) giderildi. Endpoint artık
  `200` ve `value:null` döndürüyor; frontend fallback davranışı korunuyor.
- `2026-07-28T15:01:55+00:00`: eski route'un son isteği değişmedi
  (`2026-07-28T09:53:10+00:00`). 48 saatlik gözlem devam ediyor.

## Nihai yedek

Canlı sunucudaki son geçiş yedeği:

`/var/backups/promats-paspas-merge-final-20260728-1115`

İçerik:

- `paspas-target-final.sql`
- `promats-source-final.sql`
- `promats-uploads-final.tar.gz`
- `SHA256SUMS`

SHA-256 doğrulaması başarılıdır. Dizin yaklaşık 25 MB, dizin izni `700`, dosya
izinleri `600` olarak doğrulanmıştır.

## Nihai veri sayımları

### Yazılımcı notları

| Ölçüm | Promats kaynak | Paspas hedef toplam | Hedefte kaynakla eşleşen |
|---|---:|---:|---:|
| Thread | 39 | 168 | 39 |
| Comment | 77 | 366 | 77 |
| Feedback asset | 30 | 525 | 30 |

Son idempotency çalıştırmasında eklenen thread/comment/asset sayısı `0/0/0`;
kaynakta sonradan oluşmuş taşınmamış delta bulunmadı.

### Web içeriği

| Kaynak → hedef | Kaynak | Hedef |
|---|---:|---:|
| `languages` → `web_promats_languages` | 2 | 2 |
| `promats_menu_items` → `web_promats_menu_items` | 26 | 26 |
| `static_texts` → `web_promats_static_texts` | 90 | 90 |
| `special_pages` → `web_promats_special_pages` | 24 | 24 |
| `special_page_gallery` → `web_promats_special_page_gallery` | 2 | 2 |
| `products` → `web_promats_products` | 16 | 16 |
| `product_features` → `web_promats_product_features` | 153 | 153 |
| `articles` → `web_promats_articles` | 4 | 4 |
| `home_sections` → `web_promats_home_sections` | 5 | 5 |

Site settings hedef toplamı `47`: `46` frontend namespace kaydı ve `1` admin
namespace kaydıdır. Promats web ayarları ana Paspas `site_settings` tablosunda
`web.promats.frontend.*` ve `web.promats.admin.*` anahtarlarıyla tutuluyor.

## Bütünlük kontrolleri

- Yetim feedback comment: `0`
- Yetim özel sayfa galeri kaydı: `0`
- Yetim menü dili: `0`
- Yetim sabit metin dili: `0`
- Yetim ürün dili: `0`
- Kaynak metadata'sı `promats-web` olan taşınmış feedback asset: `30`
- Ürün özelliklerinde eksik üst ürün ilişkisi: `34`

Son madde migrasyon kaynaklı değildir. Kaynak `promats_site` DB'de de aynı 34
kayıt, aynı eksik üst ürün kimlikleriyle (`6, 8, 14, 18`) bulunmaktadır. Veri
kaybına yol açmamak için bu tarihsel kayıtlar aynen korunmuş ve şemada bu ilişki
için zorlayıcı FK eklenmemiştir.

### Fiziksel asset düzeltmesi

İlk ayrıntılı disk audit'inde 30 asset'in DB kayıtlarının taşındığı fakat hedef
`/var/www/paspas/uploads/web-promats` dizinine fiziksel kopyanın yapılmadığı
tespit edildi. Kaynak dosyalar yerindeydi; tamamı hedefe kopyalandı.

- Kaynak asset: `30`, kaynak eksik: `0`
- Hedef asset: `30`, hedef eksik: `0`
- Örnek hedef asset URL: HTTP 200
- Hedef fiziksel arşiv:
  `paspas-web-promats-assets-final.tar.gz` (`6.8 MB`)
- Arşiv final backup dizinindeki `SHA256SUMS` dosyasına eklendi ve bütün
  checksum'lar tekrar doğrulandı.

Binary içerik audit'inde 39 thread ve 77 yorum için kaynak/hedef alan
uyuşmazlığı `0/0` bulundu. En eski, ortanca ve en yeni thread kimlikleri ayrıca
örnekleme alındı. Kaynak status/priority enum dışı kayıt sayısı `0/0`; kaynak
thread tablosunda ayrı bir `body` kolonu yoktur.

## Canlı doğrulamalar

- Paspas API, panel ve Promats frontend PM2 süreçleri online.
- Promats TR ve EN sayfaları HTTP 200.
- Public web API'leri HTTP 200.
- Admin API yetki kontrolleri anonim kullanıcıda 401, yetersiz rolde 403.
- Geçici CMS kaydı public API'de görüldü; silindikten sonra kaybolduğu doğrulandı.
- Revalidate hem doğrudan frontend endpoint'inde hem Paspas admin endpoint'inde
  HTTP 200 döndürdü.
- `web-promats` bucket'ına geçici görsel yüklendi, metadata ve public URL HTTP 200
  doğrulandı, sonra başarıyla silindi.
- Nginx yapılandırma testi başarılı.
- Backend build, page-feedback testleri, admin typecheck/build, Promats frontend
  build ve `git diff --check` başarılı.
- Yeni Web API DTO/yazma güvenliği testleri yerelde ve canlı sunucuda `7/7`
  başarılı. Testlerin ardından backend yeniden derlendi, PM2 online ve public
  ürün endpoint'i HTTP 200 doğrulandı.
- Yeni feedback kayıtlarında kullanıcı adı Paspas `users` tablosundan çözülüyor.
  Telegram ve uygulama içi bildirimlerde kaynak uygulama açıkça `Paspas` veya
  `Promats Web` olarak yazılıyor.
- Production feedback UAT'sinde Paspas ve Promats Web kaynaklı iki not
  oluşturuldu; soru `needs_info`, çözüm `planned`, durum güncellemesi `resolved`
  olarak doğrulandı. Yazar `Orhan Güzel`, kaynak etiketleri doğru döndü. Test
  thread/comment kayıtları sonrasında silindi.
- Production CMS UAT'si ürün, sayfa, makale, TR/EN sabit yazı, menü, site ayarı,
  tema ve ana sayfa bölümünde create/update/status/public API/gerçek sayfa
  kontrollerini geçti. Değiştirilen mevcut değerler geri yüklendi; geçici
  kayıtların kalan sayısı `0`.
- Taşınmış gerçek görsel geçici UAT ürününe bağlandı; DTO görsel URL'si, dosya
  HTTP 200 ve gerçek ürün sayfası doğrulandı.
- İletişim formu `Codex UAT` etiketiyle HTTP 202 döndü; Paspas notification
  tablosunda test bildirimi oluştu ve Telegram gönderim zinciri çalıştırıldı.
- Telegram yapılandırması eksik ve ağ hatası senaryoları otomatik testte
  fail-open sonuç verdi; toplam hedefli backend test sonucu `21/21` başarılıdır.
- Production sesli not UAT'sinde gerçek WAV feedback attachment olarak
  kaydedildi, public audio URL HTTP 200 döndü ve gövde yerel Whisper tarafından
  asenkron Türkçe transkriptle güncellendi. Test thread/comment/asset/dosya
  temizliği tamamlandı.
- Bu UAT sırasında `LOCAL_STORAGE_ROOT` ile Nginx `/uploads/` alias'ının farklı
  dizinleri gösterdiği tespit edildi. `/var/www/paspas/backend/uploads` içindeki
  43 dosya, silme yapılmadan servis edilen `/var/www/paspas/uploads` ağacına
  merge edildi; production env ve PM2 process env
  `LOCAL_STORAGE_ROOT=/var/www/paspas/uploads` olarak eşitlendi. Tekrar UAT
  başarılıdır.
- Repo geneli lint, geçiş dışındaki mevcut/generated dosyalardaki eski bulgular
  nedeniyle temiz değildir. Yeni Web/Kanban dosyalarının hedefli lint kontrolünde
  hata yoktur.

## Açık kapılar

- 48 saatlik trafik/log gözlemi tamamlanmadı.
- Gerçek kullanıcı kabul testi tamamlanmadı.
- Yerel faster-whisper production kurulumu tamamlandı:
  - Python/venv: `/opt/paspas-whisper`
  - Script: `/opt/paspas-whisper/transkript.py`
  - Model: `small`, CPU `int8`
  - Model/cache dahil disk kullanımı: yaklaşık `897 MB`
  - `WHISPER_PY`, `WHISPER_SCRIPT`, `WHISPER_MODEL` ve
    `WHISPER_MODEL_DIR` production env'e eklendi.
- Türkçe sentetik WAV dosyası doğrudan Python scriptiyle ve Paspas
  `transkriptEt` helper'ıyla gerçek production sunucusunda metne çevrildi.
- Transkript zinciri yerel Whisper → OpenAI → Groq sırasındadır ve tamamen
  fail-open çalışır. OpenAI gerçek testinde `429 insufficient_quota`, Groq gerçek
  testinde `401 expired_api_key` verdi; bu credential sorunları yerel Whisper
  çalıştığı için sesli not transkriptini engellemiyor. Anahtarlar yenilendiğinde
  kod değişmeden uzaktan fallback olarak kullanılabilir.
- Güncel endpoint/model sözleşmesi resmi OpenAI ve Groq dokümantasyonuyla
  doğrulandı; transkript testleri `6/6`, page-feedback testleri `6/6` geçti.
- Eski PM2 süreçlerini durdurma, Nginx eski route'larını kaldırma ve eski
  klasörleri arşivleme/silme yalnız 48 saat gözlem ve ayrıca kullanıcı onayından
  sonra yapılacaktır.

## Rollback komut kontrolü

Rollback hedefleri read-only kontrollerle doğrulandı:

- Eski API PM2 adı: `promats-api`
- Eski admin PM2 adı: `promats-admin`
- Eski API çalışma dizini: `/var/www/promats/backend`
- Eski admin çalışma dizini: `/var/www/promats/admin_panel/admin_panel`
- Eski API upstream: `127.0.0.1:8087`
- Eski admin upstream: `127.0.0.1:3011`
- Eski Nginx route'ları: `/promats/api/`, `/promats-admin`,
  `/promats/uploads/`

Gerekirse önce mevcut config yedeklenerek `pm2 restart promats-api` ve
`pm2 restart promats-admin` ile eski servisler tekrar devreye alınabilir. Şu anda
iki süreç de online olduğundan rollback provası için trafik yönü değiştirilmedi.
Nginx aktif yapılandırması `nginx -T`, süreç hedefleri `pm2 show` ile kontrol
edildi.
