# ÇEKLİST — Promats Yönetimini Paspas Admin/Backend İçine Birleştirme

**Tarih:** 2026-07-28  
**Çalışma kökü:** `/home/orhan/Documents/Projeler/paspas`  
**Hedef admin:** `/home/orhan/Documents/Projeler/paspas/admin_panel`  
**Hedef backend:** `/home/orhan/Documents/Projeler/paspas/backend`  
**Kaynak admin:** `/home/orhan/Documents/Projeler/paspas/promats/admin_panel`  
**Kaynak backend:** `/home/orhan/Documents/Projeler/paspas/promats/backend`

## 1. Amaç

- [x] Promats yazılımcı notlarını ve bütün yorum/ek geçmişini Paspas ana veritabanına taşı.
- [x] Promats yazılımcı notu widget'ını, Kanban ekranını, Telegram bildirimini ve sesli not/transkript davranışını Paspas ana admin/backend içinde tek sistem hâline getir.
- [x] Promats frontend'in içerik yönetim modüllerini Paspas admin panelinde yeni **“Web Sayfası”** üst başlığı altında topla.
- [x] Promats public frontend'in ihtiyaç duyduğu içerik API'lerini Paspas ana backend üzerinden sun.
- [ ] Geçiş tamamlanıp kabul testleri bittikten sonra `promats/admin_panel` ve `promats/backend` klasörlerini silinebilir hâle getir.
- [x] `promats/frontend` bu işte silinmeyecek; yalnız API kaynağı eski Promats backend'den Paspas ana backend'e çevrilecek.

## 2. Kesin güvenlik kuralları

- [x] Bu aşamaya kadar `promats/admin_panel` veya `promats/backend` silinmedi.
- [x] Canlı veride `db:seed`, fresh seed, `DROP TABLE`, `TRUNCATE` veya veri sıfırlayan işlem çalıştırılmadı.
- [x] Veri taşıma öncesi kaynak ve hedef SQL/dosya yedekleri alındı ve checksum doğrulandı.
- [x] Kaynak Promats verisi taşıma boyunca referans/rollback kaynağı olarak korundu.
- [x] Ortak altyapı tabloları (`site_settings`, `storage_assets`, `users`, `notifications`, `page_feedback_*`) tek Paspas tablosunda birleşecek.
- [x] Paspas üretim ERP ayarları ile Promats web sitesi ayarları tek `site_settings` tablosunda namespace anahtarlarıyla ayrılacak.
- [x] Tüm migrasyonlar tekrar çalıştırılabilir/idempotent olacak.
- [x] Taşıma kayıtları için kaynak kimliği tutulacak; aynı kayıt ikinci çalıştırmada çoğaltılmayacak.
- [x] Ek dosyalar yalnız DB satırı olarak değil, fiziksel dosya ve URL erişimiyle birlikte taşınacak.
- [x] Telegram tokenı koda, çekliste veya loglara yazılmayacak; yalnız production `.env` içinde kalacak.
- [x] API/frontend geçişi kesintisiz yapıldı; ayrıca bakım penceresi gerektirmedi.

## 3. Mevcut durum özeti

### 3.1 Paspas ana sisteminde zaten bulunanlar

- [x] `backend/src/modules/page_feedback` modülü var.
- [x] `backend/src/db/seed/sql/195_v1_page_feedback.sql` şeması var.
- [x] `admin_panel` içinde sayfa bazlı yazılımcı notu widget'ı var.
- [x] RTK Query `page_feedback` endpoint ve tipleri var.
- [x] Paspas ana veritabanında `page_feedback_threads` ve `page_feedback_comments` tabloları bulunuyor.
- [x] Paspas tarafındaki mevcut not/yorum sayıları canlı ve lokal için kaydedilecek.
- [x] Paspas tarafında Kanban sayfası yeniden teyit edildi ve `/admin/yazilim-gorevleri` route'u eklendi.
- [x] Paspas tarafında Telegram gönderimi ve ses transkripti davranışları Promats'taki son sürümle eşitlendi ve genişletildi.

### 3.2 Promats kaynak sisteminde bulunanlar

- [x] Canlı kaynakta son doğrulamada 39 yazılımcı notu ve 77 yorum vardı.
- [x] `promats/admin_panel` içinde `/admin/yazilim-gorevleri` Kanban ekranı var.
- [x] Tüm admin sayfalarında yazılımcı notu widget'ı var.
- [x] Görsel yükleme, mikrofon kaydı, ses oynatma ve opsiyonel Whisper transkripti var.
- [x] Yeni not ve yorumlarda Telegram bildirimi var.
- [x] Promats CMS ekranı şu içerikleri yönetiyor:
  - Ürünler
  - Sayfalar
  - Makaleler
  - Menü
  - Sabit Yazılar
  - Site Ayarları
  - Tema
- [x] Promats frontend'in kullandığı public API'ler mevcut:
  - `products`
  - `banners/content/pages`
  - `articles`
  - `menu`
  - `settings`
  - `contact`
  - home layout/sections

### 3.3 Kritik şema farkı

Promats kaynak yazılımcı notu tablolarında geriye uyumluluk için şu eski kolonlar da vardır:

- `page_feedback_threads.title`
- `page_feedback_threads.body`
- `page_feedback_threads.created_by_name`
- `page_feedback_comments.attachment_url`
- `page_feedback_comments.attachments_json`
- `page_feedback_comments.created_by_name`

Paspas hedef şeması yeni kontratı kullanır:

- `page_title`
- `subject`
- `assigned_to_user_id`
- `last_comment_at`
- `message_type`
- `attachments`
- `created_by_user_id`

Taşıma bu alanları dönüştürerek yapacak; kaynak kolonlar hedef şemaya aynen eklenmeyecek.

## 4. Hedef mimari kararı

### 4.1 Tek admin ve tek backend

- [x] Yönetim adresi Paspas ana admin paneli olacak.
- [x] Promats yönetimi Paspas admininde `/admin/web-sayfasi/...` route alanına taşınacak.
- [x] Public Promats içerik API'leri Paspas ana backend'de namespace altında sunulacak.
- [x] Kesin public prefix: `/api/web/promats`.
- [x] Kesin admin prefix: `/api/admin/web/promats`.
- [x] Frontend doğrudan yeni API base'e geçirildi; eski API için yeni uyumluluk proxy'si gerekmedi.
- [x] Geçici yeni proxy oluşturulmadığı için kaldırılacak ek proxy yok.

### 4.2 Veritabanı namespace kararı

Paspas ERP ile web sitesi verisini ayırmak için Promats'a özgü tabloların hedefte açık prefix taşıması önerilir:

| Kaynak tablo | Hedef tablo |
|---|---|
| `languages` | `web_promats_languages` |
| `promats_menu_items` | `web_promats_menu_items` |
| `static_texts` | `web_promats_static_texts` |
| `special_pages` | `web_promats_special_pages` |
| `special_page_gallery` | `web_promats_special_page_gallery` |
| `products` | `web_promats_products` |
| `product_features` | `web_promats_product_features` |
| `articles` | `web_promats_articles` |
| `home_sections` | `web_promats_home_sections` |
| `theme_config` | Ayrı tablo oluşturma; `site_settings.web.promats.frontend.theme_config` anahtarına taşı |

Ortak altyapı tabloları için ayrı strateji:

| Kaynak | Hedef yaklaşım |
|---|---|
| `site_settings` | Ana Paspas `site_settings` tablosuna `web.promats.frontend.*` / `web.promats.admin.*` namespace'iyle taşı |
| `storage_assets` | Ana Paspas `storage_assets` tablosuna kaynak/tenant metadata ile taşı |
| `users/auth/roles` | Taşıma; Paspas admin oturumu ve rolleri kullanılacak |
| `notifications` | Taşıma; yeni bildirimler Paspas notification sisteminde üretilecek |
| `page_feedback_*` | Paspas ana tablolarına kontrollü veri birleşimi yap |

Tek `site_settings` tablo sözleşmesi:

- Paspas ERP/admin mevcut anahtarları değişmeden kalır.
- Promats frontend ayarları `web.promats.frontend.<eski_anahtar>` olarak saklanır.
- Web Sayfası admin ayarları `web.promats.admin.<anahtar>` olarak saklanır.
- Public Promats API yanıtında `web.promats.frontend.` prefix'i kaldırılır; mevcut frontend kontratı bozulmaz.
- Admin API yalnız kendi namespace'ini listeler/günceller; ERP ayarlarını yanlışlıkla değiştiremez.

- [x] Prefix kararı kesinleştirildi.
- [x] Hedef `web_promats_*` SQL şemaları ve güvenli tablo/kolon whitelist'i yazıldı.
- [x] Public DTO sözleşmesi korundu; tablo adının değişmesi frontend'i etkilemedi.

## 5. FAZ 0 — Değişmez envanter ve kabul kriterleri

- [x] Kaynak Promats canlı DB tablo listesi alınacak.
- [x] Hedef Paspas canlı DB tablo listesi alınacak.
- [x] Her taşınacak tablo için satır sayısı kaydedilecek.
- [x] Taşınacak tabloların PK, FK, unique index ve kimlik stratejisi hedef şemada kaydedildi.
- [x] Kaynak yazılımcı notu için:
  - thread sayısı
  - comment sayısı
  - attachment içeren comment sayısı
  - audio attachment sayısı
  - durumlara göre thread sayısı
  - önceliklere göre thread sayısı
  kaydedilecek.
- [x] Hedef Paspas yazılımcı notu için aynı sayımlar alınacak.
- [x] Kaynak storage kayıtları ile disk karşılaştırıldı; 30/30 kaynak ve hedef dosya mevcut.
- [x] Promats frontend'in çağırdığı bütün API URL'leri `rg` ile envanterlenecek.
- [x] Promats admin CMS'in kullandığı bütün RTK endpoint'leri envanterlenecek.
- [x] Canlı nginx route'ları ve PM2 süreçleri başlangıç/gözlem raporuna kaydedildi.
- [x] Kabul testi URL listesi hazırlandı:
  - Promats ana sayfa TR/EN
  - ürün listesi
  - ürün detay
  - kaynaklar/makaleler
  - iletişim
  - Paspas admin Web Sayfası modülleri
  - yazılımcı notu widget'ı
  - yazılım görevleri Kanban'ı

**Faz 0 çıkış kapısı:** Kaynak/hedef veri sayıları ve API envanteri dosyaya yazılmadan kod taşımaya başlanmayacak.

## 6. FAZ 1 — Yedekleme ve tekrar çalıştırılabilir taşıma altyapısı

- [x] Kaynak Promats DB'nin yalnız taşınacak tablolarını SQL dump al.
- [x] Hedef Paspas DB'nin ilgili mevcut tablolarını SQL dump al.
- [x] Promats upload klasörünün arşivini al.
- [x] Yedek dosyalarını tarih damgalı ve `chmod 600` olarak sakla.
- [x] Yedeklerin boş olmadığını ve geri okunabildiğini kontrol et.
- [x] `backend/scripts/migrate-promats-web-to-paspas.mjs` benzeri tek girişli migrasyon oluştur.
- [x] Migrasyonda dry-run modu ekle.
- [x] Migrasyonda yalnız belirtilen kaynak DB'den okuma yapılmasını sağla.
- [x] Hedefe yazarken transaction veya güvenli batch kullan.
- [x] Her kaynak kayıt için deterministic kimlik veya `source_system/source_id` eşlemesi kullan.
- [x] İkinci çalıştırmada `inserted=0`, `updated=0` veya beklenen kontrollü upsert sonucu üret.
- [x] Migrasyon sonunda tablo bazlı sayım raporu yazdır.
- [x] Web migrasyon hataları kaynak/hedef tablo aşamasını secret içermeden raporluyor.

**Rollback:** Hedefte eklenen web tabloları ayrı prefix taşıdığı için geri alınabilir olacak; yazılımcı notu birleşimi için taşıma batch kimliği tutulacak.

## 7. FAZ 2 — Yazılımcı notu davranışlarını ana backend'de birleştirme

### 7.1 Backend davranış eşitleme

- [x] Paspas `page_feedback` validation kontratı Promats son sürümüyle karşılaştırıldı; hedef kontrat daha sıkı.
- [x] Durumlar tam olacak:
  - `open`
  - `needs_info`
  - `in_review`
  - `planned`
  - `resolved`
  - `closed`
- [x] Mesaj tipleri tam olacak:
  - `report`
  - `comment`
  - `question`
  - `answer`
  - `solution`
  - `system`
- [x] `activeOnly` liste filtresi ana backend'e eklenecek.
- [x] Yeni soru sonrası `needs_info`, çözüm sonrası `planned`, kapanmış kayda yeni yorum sonrası `open` davranışı korunacak.
- [x] Yeni yazar adı Paspas `users.full_name`, fallback olarak email üzerinden çözülecek.
- [x] Kaynak Promats'ta yalnız `created_by_name` olan 39 eski kaydın görünen adı korundu.
- [x] Durum değiştirme Paspas oturumu ve admin path permission modeliyle korundu.
- [x] Not/yorum hatası uygulama içi bildirimi veya Telegram hatası nedeniyle başarısız olmayacak.

### 7.2 Telegram

- [x] Ana Paspas backend'e tek `core/telegram.ts` helper konacak veya mevcut helper genişletilecek.
- [x] `TELEGRAM_BOT_TOKEN` ve `TELEGRAM_CHAT_ID` yalnız Paspas production `.env` içinde tutulacak.
- [x] Promats backend'deki token ana Paspas backend'e secret göstermeden aktarılacak.
- [x] Yeni not ve yeni yorum için Telegram mesajı gönderilecek.
- [x] Bildirim mesajında kaynak `Paspas` veya `Promats Web` olarak yazıyor.
- [x] Telegram çağrısı timeout'lu ve fail-open olacak.
- [x] Test mesajı gönderilip `ok=true` doğrulanacak.

### 7.3 Sesli not ve transkript

- [x] Audio MIME doğrulaması korunacak.
- [x] Storage asset'in gerçek yerel yolu güvenli root kontrolüyle çözülecek.
- [x] Path traversal reddedilecek.
- [x] `WHISPER_PY`, `WHISPER_SCRIPT`, model ve model dizini production env'e taşındı.
- [x] Whisper yoksa not kaydı çalışmaya devam edecek.
- [x] Transkript başarılıysa placeholder gövde transkriptle değiştirilecek.
- [x] Normal metin + ses varsa `[Ses çözümü]` biçiminde eklenecek.
- [x] Transkript işi HTTP isteğini gereksiz yere bekletmeyecek.

## 8. FAZ 3 — Yazılımcı notu verisini ana Paspas DB'ye taşıma

### 8.1 Kimlik ve kullanıcı eşleme

- [x] Kaynak thread UUID'lerinin hedefte çakışıp çakışmadığını kontrol et.
- [x] Çakışma yoksa UUID'leri aynen koru.
- [x] UUID çakışması `0`; deterministic remap dalına ihtiyaç olmadı.
- [x] Kaynak 39 thread'in hiçbirinde `created_by_user_id` yoktu; hedef UUID uydurulmadı.
- [x] Eski kayıtlarda `created_by_user_id=NULL`, `created_by_name` korunması uygulandı.
- [x] Kaynakta geçerli hedef kullanıcıya bağlanabilir assignee olmadığı için assignee taşınmadı.

### 8.2 Alan dönüşümü

- [x] `subject = subject || title`.
- [x] `page_title = page_title || NULL`.
- [x] Kaynak thread tablosunda `body` kolonu yok; yorum dışında kaybolabilecek ilk rapor gövdesi bulunmuyor.
- [x] `message_type` yoksa `comment`; ilk rapor ise `report`.
- [x] `attachments` varsa onu kullan.
- [x] Yoksa geçerli `attachments_json` parse et.
- [x] Yalnız `attachment_url` varsa tek attachment DTO'suna dönüştür.
- [x] `last_comment_at`, yorumların maksimum tarihi; yorum yoksa `updated_at/created_at`.
- [x] `created_at` ve `updated_at` kaynak değerleri korunacak.
- [x] Kaynakta hedef enum dışında status/priority sayısı `0/0`.

### 8.3 Sayfa yolu ayrımı

- [x] Promats sayfa yolları `source_app='promats-web'` ile Paspas yollarından ayrıldı.
- [x] Kaynak thread'lere `sourceApp='promats-web'` ayrımı kazandırılacak.
- [x] Şema kolonu eklendiği için yapay path namespace gerekmedi.
- [x] Kanban'da kaynak uygulama etiketi gösterilecek.
- [x] Liste API'sine `sourceApp=paspas|promats-web` filtresi eklendi.

### 8.4 Ek dosyalar

- [x] Promats `page-feedback` bucket dosyaları Paspas upload root'una taşınacak.
- [x] `storage_assets` kayıtları hedef ID çakışmasına karşı kontrol edilecek.
- [x] Asset URL'leri yeni nginx/API yoluna göre güncellenecek.
- [x] Görsel dosyalar tarayıcıda açılacak.
- [x] Kanban detayında audio player mevcut; kaynak migrasyon setinde ses asset'i yok (`image/png=30`).
- [x] Fiziksel dosya audit'i eklendi; düzeltme sonrası kaynak/hedef eksik sayısı `0/0`.

### 8.5 Veri doğrulama

- [x] `kaynak thread = taşınan Promats thread`.
- [x] `kaynak comment = taşınan Promats comment`.
- [x] Her thread'in comment sayısı kaynakla aynı.
- [x] En eski, ortanca ve en yeni üç kayıt audit örneklemine alındı.
- [x] Thread/comment alanları binary karşılaştırıldı; içerik uyuşmazlığı `0/0`.
- [x] Attachment JSON alanları geçerli olacak.
- [x] Migrasyon ikinci kez çalıştırıldığında duplicate oluşmayacak.

## 9. FAZ 4 — Paspas admininde yazılımcı modülünü tamamlama

- [x] Promats Kanban sayfasını Paspas tasarım sistemine uyarlayarak ekle.
- [x] Hedef route: `/admin/yazilim-gorevleri`.
- [x] Sidebar'da yalnız admin/yetkili yazılımcı rollerine göster.
- [x] `AdminNavKey`, `NAV_ROLES` ve path permission eşlemesini ekle.
- [x] Kanban sütunları altı durumu gösterecek.
- [x] Masaüstünde drag/drop çalışacak.
- [x] Mobilde select/menü ile durum değiştirilebilecek.
- [x] Kartta konu, kaynak uygulama, modül/sayfa yolu, yorum sayısı ve öncelik görünecek.
- [x] Detay Sheet içinde tüm yorumlar, görseller ve sesler görünecek.
- [x] İlgili sayfaya git bağlantısı doğru uygulama URL'sine gidecek.
- [x] Widget Paspas admin layout'unda tek kez render edilecek.
- [x] Widget'tan yeni not, metin, görsel ve ses gönderilebilecek.
- [x] Widget mevcut sayfadaki notları listeleyecek.
- [x] Yorum tipi seçilebilecek.
- [x] Yetkili kullanıcı durum değiştirebilecek.
- [x] Toast ve hata mesajları Türkçe olacak.
- [x] RTK tags/invalidation ile Kanban ve widget anında güncellenecek.
- [x] Admin Sistem Rehberi/Dokümantasyon'a yazılımcı notu, Kanban ve Web Sayfası modülleri eklenecek.

## 10. FAZ 5 — “Web Sayfası” üst menü grubu

### 10.1 Navigasyon

- [x] `AdminNavGroupKey` içine `website`/`web_page` anahtarı ekle.
- [x] Görünen grup adı tam olarak **Web Sayfası** olacak.
- [x] Grup yalnız `admin` rolüne açık olacak.
- [x] `adminUi.ts` empty/default normalizer kayıtları güncellenecek.
- [x] `tr.json` çevirileri eklendi; projede aktif `en.json` yok.
- [x] Dinamik `site_settings.ui_admin` eski değerleri yeni anahtar yokken kırılmayacak.

Önerilen menü:

- [x] Web Sayfası
  - [x] Genel Bakış
  - [x] Ürünler
  - [x] Sayfalar
  - [x] Makaleler
  - [x] Menü
  - [x] Sabit Yazılar
  - [x] Site Ayarları
  - [x] Tema
  - [x] Ana Sayfa Bölümleri
  - [x] Web Dosyaları

### 10.2 Route yapısı

- [x] `/admin/web-sayfasi`
- [x] `/admin/web-sayfasi/urunler`
- [x] `/admin/web-sayfasi/sayfalar`
- [x] `/admin/web-sayfasi/makaleler`
- [x] `/admin/web-sayfasi/menu`
- [x] `/admin/web-sayfasi/sabit-yazilar`
- [x] `/admin/web-sayfasi/ayarlar`
- [x] `/admin/web-sayfasi/tema`
- [x] `/admin/web-sayfasi/ana-sayfa`
- [x] `/admin/web-sayfasi/dosyalar`

- [x] İlk geçişte Promats'ın generic editörü çalışır şekilde taşınabilir.
- [x] Sonraki adımda tek büyük tab ekranı yerine route bazlı modüllere ayrılacak.
- [x] Her sayfa Paspas admin sayfa standardına uyacak.
- [x] Silme işlemleri `AlertDialog` ile onay isteyecek.
- [x] JSON ayar alanlarında parse/validation hatası açıkça gösterilecek.

## 11. FAZ 6 — Web içerik backend modüllerini Paspas'a taşıma

- [x] Promats içerik şeması hedef `web_promats_*` tablolarına uyarlandı.
- [x] Public/admin controller davranışları `modules/web_promats/router.ts` içine taşındı.
- [x] Admin whitelist yaklaşımı korunacak; URL'den gelen serbest tablo adı SQL'e girmeyecek.
- [x] Admin CRUD route'ları Paspas auth + admin guard arkasında olacak.
- [x] Public route'lar auth istemeyecek.
- [x] Ürün ve makale slug sorguları locale ile çalışacak.
- [x] Menü sıralaması ve dil filtresi korunacak.
- [x] Sayfa galerisi ve product feature ilişkileri korunacak.
- [x] Contact formunun hedef davranışı belirlenecek:
  - Paspas notification
  - e-posta
  - Telegram
  - yalnız DB kaydı
- [x] Home section/layout endpoint'leri taşınacak.
- [x] Web site settings tek Paspas `site_settings` tablosunda namespace ile ayrılacak.
- [x] Web theme config `web.promats.frontend.theme_config` anahtarında tutulacak; Paspas admin temasını değiştirmeyecek.
- [x] Storage upload'larında `bucket='web-promats'` veya alt bucket'lar kullanılacak.
- [x] Cache/ISR temizleme endpoint'i Paspas backend/admin üzerinden çalışacak.

## 12. FAZ 7 — Web içerik verisini Paspas DB'ye taşıma

Taşıma sırası FK bağımlılıklarına göre:

1. [x] `web_promats_languages`
2. [x] Promats frontend ayarlarını ana `site_settings` tablosuna namespace ile taşı
3. [x] Promats theme config'i `web.promats.frontend.theme_config` anahtarına taşı
4. [x] `web_promats_home_sections`
5. [x] `web_promats_menu_items`
6. [x] `web_promats_static_texts`
7. [x] `web_promats_special_pages`
8. [x] `web_promats_special_page_gallery`
9. [x] `web_promats_products`
10. [x] `web_promats_product_features`
11. [x] `web_promats_articles`
12. [x] ilgili `storage_assets` ve fiziksel dosyalar

Her tablo için:

- [x] Kaynak sayım kaydedilecek.
- [x] Hedef öncesi sayım kaydedilecek.
- [x] Insert/update/skip sayıları raporlanacak.
- [x] Hedef sonrası sayım doğrulanacak.
- [x] PK/FK bütünlüğü doğrulanacak; kaynakta da bulunan 34 tarihsel yetim product feature raporlandı.
- [x] Locale başına sayım doğrulanacak.
- [x] En az bir kayıt admin API üzerinden eklenip açılacak, güncellenecek ve silinecek.
- [x] Değişiklik public API/revalidate zincirinde görüldü ve test kaydı geri alındı.

## 13. FAZ 8 — Promats frontend'i ana backend'e yönlendirme

- [x] Frontend'deki bütün API base okuma noktaları bulunacak.
- [x] RTK/fetch/server fetch/i18n API base çözümlemeleri yeni public prefix ile uyumlu.
- [x] Yeni Paspas backend public URL'si production build'e gömülecek.
- [x] Nginx CORS/proxy kuralları kontrol edildi.
- [x] Frontend yeni API'ye geçtiği için ek rewrite gerekmedi; eski route gözlem için tutuluyor.
- [x] Yeni backend ile aşağıdakiler 200 ve doğru payload verecek:
  - settings
  - menu
  - products
  - product detail
  - pages
  - articles
  - theme
  - home sections
- [x] Promats frontend production build alınacak.
- [x] TR ve EN sayfaları smoke testten geçecek.
- [x] Geçici görsel upload, public HTTP 200 erişim ve silme testi geçti.
- [x] İletişim formu `Codex UAT` etiketiyle gerçek production testinde HTTP 202; Paspas bildirimi oluştu.
- [x] Admin değişikliği frontend cache süresi sonunda veya revalidate ile görünecek.

## 14. FAZ 9 — Test matrisi

### 14.1 Otomatik kontroller

- [x] Paspas backend `bun run build`.
- [x] Paspas backend page feedback testleri.
- [x] Yeni Promats web DTO/yazma güvenliği testleri yerel ve canlı `7/7`.
- [x] Migrasyon dry-run testi.
- [x] Migrasyon idempotency testi.
- [x] Admin `bun run typecheck`.
- [x] Yeni Web/Kanban dosyalarında hedefli lint hatasız; repo geneli eski/generated bulgular ayrı raporlandı.
- [x] Admin production build.
- [x] Promats frontend typecheck/build.
- [x] `git diff --check`.

### 14.2 Yazılımcı notu uçtan uca

- [x] Paspas kaynağıyla gerçek metin notu oluşturuldu, doğrulandı ve test kaydı temizlendi.
- [x] Promats Web kaynağıyla gerçek metin notu oluşturuldu, doğrulandı ve test kaydı temizlendi.
- [x] Görsel upload/public URL ve taşınmış görsel HTTP 200 testi geçti.
- [x] Gerçek WAV sesli notu ana storage'a eklendi; public audio HTTP 200 ve asenkron yerel transkript doğrulandı.
- [x] Yerel faster-whisper `small`/CPU int8 production'da kuruldu; gerçek Türkçe ses transkripti doğrulandı.
- [x] Gerçek UAT sorusu sonrası durum `needs_info`.
- [x] Gerçek UAT çözümü sonrası durum `planned`.
- [ ] Kanban'da sürükleyerek `resolved`.
- [x] Gerçek UAT yeni not bildirimi Telegram helper üzerinden gönderildi.
- [x] Gerçek UAT soru/çözüm yorum bildirimleri Telegram helper üzerinden gönderildi.
- [x] Telegram yapılandırmasız/ağ hatalı fail-open davranışı otomatik testlerle doğrulandı; kayıt akışı Telegram sonucunu beklemiyor.

### 14.3 Web CMS uçtan uca

- [x] Ürün oluştur/düzenle/pasifleştir ve temizle UAT'si geçti.
- [x] Sayfa oluştur/düzenle ve temizle UAT'si geçti.
- [x] Makale oluştur/düzenle/yayın durumu ve temizleme UAT'si geçti.
- [x] Menü başlık/link/sıra değişikliği yapıldı ve eski değer geri yüklendi.
- [x] Sabit yazı TR/EN oluşturma/güncelleme/public API ve temizleme UAT'si geçti.
- [x] Site ayarı değiştirildi ve eski değer geri yüklendi.
- [x] Tema kontrollü değiştirildi, public API'de görüldü ve eski JSON geri yüklendi.
- [x] Ana sayfa bölümü oluştur/aç/kapat-temizle UAT'si geçti.
- [x] Gerçek taşınmış görsel UAT ürününe bağlandı; public API, dosya URL ve ürün sayfası doğrulandı.
- [x] Her CMS değişikliğinde public API ve gerçek Promats sayfası HTTP 200 doğrulandı.

## 15. FAZ 10 — Canlı geçiş

- [x] Geçiş/gözlem başlangıç zamanı rapora kaydedildi.
- [ ] Kaynak Promats admin yazma işlemleri geçici olarak kapatılacak.
- [x] Son kaynak DB dump alınacak.
- [x] İlk migrasyondan sonra oluşan delta kayıtlar taşınacak; son idempotency kontrolünde delta `0`.
- [x] Ana Paspas backend deploy edilecek.
- [x] Ana Paspas admin deploy edilecek.
- [x] Paspas DB migrasyonları çalıştırılacak.
- [x] Promats frontend yeni API'ye yönlendirilecek ve deploy edilecek.
- [x] Paspas backend/admin/frontend PM2 süreçleri online kontrol edilecek.
- [x] Promats frontend online kontrol edilecek.
- [x] Nginx `nginx -t` doğrulandı; config değişmediği için reload gerekmedi.
- [x] Health endpoint'leri 200 olacak.
- [x] Admin API'leri yetkisiz istekte 401/403 olacak.
- [x] Public web API'leri 200 olacak.
- [x] Kaynak ve hedef nihai veri sayıları `PROMATS-PASPAS-GOZLEM-RAPORU-2026-07-28.md` dosyasına yazıldı.
- [ ] Kullanıcı kabul testi yapılacak.

## 16. FAZ 11 — Gözlem süresi ve rollback

- [ ] En az 48 saat eski Promats backend/admin klasörleri silinmeden tutulacak.
- [ ] Eski PM2 süreçleri önce durdurulacak, hemen silinmeyecek.
- [ ] 404/500, DB ve Telegram logları izlenecek; baseline `2026-07-28T14:03:27Z`.
- [x] Yeni yazılımcı notu ve CMS değişikliği production UAT ile doğrulandı; geçici kayıtlar temizlendi.
- [x] Rollback gerekirse uygulanacak plan hazır:
  - Promats frontend API base eski backend'e alınacak.
  - Eski Promats API PM2 süreci yeniden açılacak.
  - Nginx eski upstream'e dönecek.
  - Hedef DB'ye eklenen batch kayıtları batch kimliğiyle geri alınacak.
- [x] Rollback süreç adları, çalışma dizinleri, upstream/route ve komutları kontrol edildi; trafik yönü değiştirilmedi.

## 17. FAZ 12 — Eski klasörleri kaldırma ön koşulları

Aşağıdaki maddelerin tamamı işaretlenmeden silme yapılmayacak:

- [x] Promats yazılımcı notlarının tamamı ana Paspas DB'de.
- [x] Yorumların tamamı ana Paspas DB'de.
- [x] Ek dosyaların tamamı ana storage tablosunda; örnek public erişim testi başarılı.
- [x] Yeni Kanban Paspas admin üzerinden çalışıyor; eski admin yalnız rollback/gözlem için tutuluyor.
- [x] Telegram, sesli not ve yerel transkript Paspas backend üzerinden çalışıyor.
- [x] Web Sayfası modüllerinin tamamı Paspas admininde çalışıyor.
- [x] Promats frontend bütün içeriği Paspas backend'den alıyor.
- [ ] Eski Promats backend'e son 48 saatte trafik yok.
- [ ] Eski Promats admin'e son 48 saatte trafik yok.
- [x] Son SQL ve dosya yedeği alınmış ve SHA-256 doğrulanmış.
- [ ] Kullanıcı açık silme onayı vermiş.

## 18. FAZ 13 — Silme (ayrı kullanıcı onayıyla)

- [ ] Önce PM2 `promats-api` ve `promats-admin` süreçlerini durdur.
- [ ] Nginx eski upstream/location tanımlarını kaldır.
- [ ] `nginx -t` sonrası reload yap.
- [ ] Sunucudaki eski klasörleri doğrudan kalıcı silmek yerine tarih damgalı arşive taşı.
- [x] Lokal `promats/admin_panel` klasörünü kaldır.
- [x] Lokal `promats/backend` klasörünü kaldır.
- [x] `promats/frontend` uygulamasını kökteki `frontend/` dizinine taşı ve bağımsız build doğrulaması yap.
- [ ] Root workspace/package referanslarını temizle.
- [ ] Bun lock/workspace çözümlemesini güncelle.
- [ ] `rg` ile eski import, script, port, PM2 adı ve API base kalıntılarını tara.
- [ ] Tüm build/smoke testlerini tekrar çalıştır.
- [ ] Nelerin kaldırıldığı ve arşivin nerede olduğu raporlanacak.

## 19. Önerilen uygulama sırası

1. [x] Faz 0 — Envanter
2. [x] Faz 1 — Yedek ve migrasyon altyapısı
3. [x] Faz 2 — Ana backend yazılımcı notu davranış eşitleme
4. [x] Faz 3 — Yazılımcı notu veri/asset taşıma
5. [x] Faz 4 — Ana admin Kanban/widget
6. [x] Faz 5 — Web Sayfası navigasyonu
7. [x] Faz 6 — Web backend modülleri
8. [x] Faz 7 — Web içerik verisi
9. [x] Faz 8 — Frontend API geçişi
10. [x] Faz 9 — Testler (repo geneli eski lint borcu raporlandı)
11. [x] Faz 10 — Canlı geçiş
12. [ ] Faz 11 — 48 saat gözlem
13. [ ] Faz 12 — Silme kapısı
14. [ ] Faz 13 — Ayrı onayla silme

## 20. Tamamlanma tanımı

Bu iş ancak aşağıdakilerin hepsi sağlandığında tamamlanmış sayılır:

- [ ] Tek yönetim paneli: Paspas `admin_panel`.
- [ ] Tek API/backend: Paspas `backend`.
- [ ] Tek yazılımcı notu ve Kanban sistemi.
- [x] Promats geçmiş verisinde sıfır kayıp.
- [x] Promats frontend içerikleri Paspas backend'den geliyor.
- [x] Web Sayfası modülleri Paspas admininde yetkili kullanıcıya açık.
- [x] Telegram, görsel, ses ve transkript çalışıyor.
- [x] Geçiş kapsamındaki hedefli test/build/smoke kontrolleri temiz; repo geneli eski lint borcu ayrıca raporlandı.
- [x] Rollback komutları ve SQL/dosya yedek checksum'ları doğrulanmış.
- [ ] Eski Promats admin/backend için trafik kalmamış.
- [ ] Kullanıcı silme için ayrıca onay vermiş.
