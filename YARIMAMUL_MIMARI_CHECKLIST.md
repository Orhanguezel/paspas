# Yarı Mamul Mimari Dönüşümü — Checklist

**Başlangıç:** 2026-04-17
**Hedef:** Mevcut "ürün" tanımlarını yarı mamul olarak yeniden sınıflandır, asıl ürün kavramını ekle, montaj akışını kur.

---

## Kategori Sözlüğü (mevcut `categories` tablosu)

| Kod           | Açıklama                                                          |
| ------------- | ------------------------------------------------------------------- |
| `urun`      | Asıl ürün (satılan paspas, montaj sonucu)                       |
| `yarimamul` | Sağ / Sol / Parça (enjeksiyondan çıkan)                         |
| `hammadde`  | Plastik, boya, ambalaj, etiket, koli (ayrı malzeme kategorisi yok) |

---

## İsimlendirme Kuralı

| Durum                         | Yarı mamul ismi                                 |
| ----------------------------- | ------------------------------------------------ |
| Çift operasyon (sağ ≠ sol) | `{ÜrünAdı} - Sağ` + `{ÜrünAdı} - Sol` |
| Tek operasyon (sağ = sol)    | `{ÜrünAdı} - Parça` (iki adet gerek)       |

## Reçete Hiyerarşisi

- **Yarı mamul reçetesi:** sadece `hammadde` kalemleri (plastik, boya)
- **Asıl ürün reçetesi:**
  - Çift op.: `1 × X-Sağ` + `1 × X-Sol` + ambalaj/son işlem hammaddeleri
  - Tek op.: `2 × X-Parça` + ambalaj/son işlem hammaddeleri

## Sipariş → Üretim Emri Akışı

- Sipariş kalemi → **asıl ürüne** bağlı
- 10 adet çift op. ürün → 10 sağ + 10 sol → **2 üretim emri**
- 10 adet tek op. ürün → 20 parça → **1 üretim emri**

## Montaj

- Ayrı makine/iş yükü/zaman YOK
- Makine atama sheet'inde **"Montaj burada"** checkbox (mevcut `uretim_emri_operasyonlari.montaj`)
- Çift op. emirlerde iki emirden **birinde** işaretli olur
- Montaj makinesinde üretim tamamlanınca → stok hareketleri otomatik tetiklenir
- Karşı yarı mamul yetersizse → `montaj_bekliyor` durumu, stok artınca otomatik tetik

## Stok Hareketleri

Mevcut mimari korunuyor: `hareket_tipi = giris|cikis|duzeltme` + `referans_tipi`

| Olay                            | hareket_tipi | referans_tipi   | urun kategori |
| ------------------------------- | ------------ | --------------- | ------------- |
| Yarı mamul üretildi           | `giris`    | `uretim_emri` | `yarimamul` |
| Montajda yarı mamul tüketildi | `cikis`    | `montaj`      | `yarimamul` |
| Montajda asıl ürün oluştu   | `giris`    | `montaj`      | `urun`      |
| Montajda ambalaj tüketildi     | `cikis`    | `montaj`      | `hammadde`  |

---

## AŞAMA 1 — Schema & Validasyon

- [X] **1.1** `105_urunler_schema.sql` — kategori ve operasyon_tipi değerleri yorum olarak eklendi
- [X] **1.2** `urunler/validation.ts` — `kategoriEnum = z.enum(['urun','yarimamul','hammadde'])` + listQuery ve createSchema'da kullanıldı
- [X] **1.3** `108_uretim_emirleri_schema.sql` yorum + `uretim_emirleri/validation.ts` durumEnum'a `montaj_bekliyor` eklendi
- [X] **1.4** `111_hareketler_schema.sql` — `hareket_tipi` ve `referans_tipi` değerleri yorum olarak eklendi (montaj dahil)
- [X] **1.5** `receteler/service.ts` — `assertReceteKategoriTutarliligi(urunId, items)` helper eklendi; controller create/update öncesi çağırıyor
- [X] **Checkpoint:** Backend TS build temiz

## AŞAMA 2 — Backend İş Mantığı

- [X] **2.1** `urunler/service.ts` — `createUrunWithYariMamuller(input)` + yeni endpoint `POST /admin/urunler/full`
  - Asıl ürünü kaydet
  - Operasyon tipine göre yarı mamul(leri) oluştur (Sağ/Sol/Parça)
  - Yarı mamul reçetesi: kullanıcı girdiği hammadde kalemleri
  - Asıl ürün reçetesi: yarı mamul(ler) otomatik + kullanıcı girdiği ambalaj hammaddeleri
  - Tüm akış tek transaction
- [X] **2.2** `syncYariMamulIsimleri(asilUrunId, yeniAd)` — ürün adı değişince yarı mamul/operasyon/reçete isimleri senkron; `updateUrun` controller'ında entegre
- [X] **2.3** Yarı mamul silme koruması: `recete_kalemleri` başka ürünün reçetesinde kullanılıyorsa silme engelli (hem `repoDelete` blocking check, hem `repoGetDependentUrunIds` bildirir)
- [X] **Checkpoint:** Backend TS build temiz ✅
- [X] **2.4** `uretim_emirleri/service.ts` — `createUretimEmirleriFromSiparisKalemi()` + endpoint `POST /admin/uretim-emirleri/siparis-kaleminden`
- [X] **2.5** `tryMontajForUretimEmri()` — yarı mamul üretim emri `montaj=true` ise asıl ürün reçetesine göre stok kontrolü, başarılı: hareketler işlenir + emir `tamamlandi`; yetersiz: `montaj_bekliyor` durumu. `operator/repository.ts` entegre.
- [X] **2.6** `tryPendingMontajlarAfterStokArtis()` — yarı mamul stoğu arttıkça bekleyen montajları tarar (montaj olmayan taraftaki üretim tamamlanınca otomatik tetik)
- [X] **2.7** Transaction güvenliği: her iş birimi (create, montaj, update) kendi transaction'ı içinde
- [X] **Checkpoint:** Backend TS build temiz ✅

## AŞAMA 3 — Admin Panel UI

- [X] **3.1** `/urunler` sayfasına kategori sekme butonları (Ürünler/Yarımamuller/Hammaddeler/Tümü)
- [X] **3.2** `urun-full-form.tsx` yeni Sheet form: asıl ürün + operasyon tipi + reçete → `POST /admin/urunler/full` ile tüm akış otomatik. Üste "Asıl Ürün + Yarı Mamul" butonu eklendi.
- [X] **3.3** Reçete detay accordion
  - 2026-04-23: ürün accordion'u recursive YM alt kırılımını aynı tabloda gösterecek şekilde tamamlandı (`9.7`, `10.8`, `10.16`)
- [X] **3.4** Satış sipariş kalem formu: `kategori='urun'` zaten filtreli — [siparis-form.tsx:76](admin_panel/src/app/(main)/admin/satis-siparisleri/_components/siparis-form.tsx#L76)
- [X] **3.5** Üretim emri başlıkta yarı mamul / ürün ismi
  - 2026-04-23: detay sayfası başlığında ürün adı öne çıkarıldı; emir no alt satıra taşındı
- [X] **3.6** Makine atama "Bu tarafta montaj var" checkbox zaten mevcut — [makine-ata-sheet.tsx](admin_panel/src/app/(main)/admin/uretim-emirleri/_components/makine-ata-sheet.tsx)
- [X] **3.7** `EMIR_DURUM_LABELS`+`BADGE`'a `montaj_bekliyor` eklendi; detay sayfasında uyarı banner
- [X] **Checkpoint:** Admin panel build temiz ✅

## AŞAMA 4 — Seed & Test

- [X] **4.1** Canlı VPS backup → seed: [181_v1_canli_urunler_import.sql](backend/src/db/seed/sql/181_v1_canli_urunler_import.sql)
- [X] **4.2** `bun run db:seed` — DB sıfırdan kuruldu, 64 canlı ürün + 9 ambalaj + 1 hammadde import edildi
- [X] **4.3** Lokal data doğrulaması: migration öncesi 64 urun / 9 yarimamul / 1 hammadde → migration sonrası 64 urun / 72 yarimamul / 10 hammadde

## AŞAMA 5 — Canlı Mimari Migrasyonu (Seed Üzerinden)

**Yaklaşım:** Canlıya doğrudan bağlanılmıyor, her şey seed dosyası üzerinden. `bun run db:seed` canlıda çalıştığında da aynı sonucu üretir.

- [X] **5.1** [182_v1_mimari_migrasyon.sql](backend/src/db/seed/sql/182_v1_mimari_migrasyon.sql):
  - Her asıl ürün için yarı mamul(ler) deterministic UUID5 ile oluşturulur (idempotent)
  - `cift_tarafli` → 2 yarı mamul (`{ad} - Sağ`, `{ad} - Sol`)
  - `tek_tarafli` → 1 yarı mamul (`{ad} - Parça`)
  - Kodlar: `{parent.kod}-SG` / `{parent.kod}-SL` / `{parent.kod}-PR`
  - Mevcut `urun_operasyonlari` ilgili yarı mamule taşınır (operasyon adındaki "Sağ/Sol" suffix ile eşleştirme)
  - Asıl ürün reçetesine yarı mamul kalemleri eklenir (cift: 1×Sağ+1×Sol, tek: 2×Parça)
  - Eski `yarimamul` kategorisindeki ambalaj kayıtları (Kartela, Koli, İç Kutu) → `hammadde` kategorisine taşınır
- [X] **5.2** [183_v1_demo_urunler_cleanup.sql](backend/src/db/seed/sql/183_v1_demo_urunler_cleanup.sql):
  - Canlı backup + migration yarımamulleri whitelist
  - Whitelist dışındaki tüm demo urun/yarımamul ve bağlı kayıtlar (siparis, üretim emri, operasyon, hareket) silinir
  - Hammadde, kalıp, makine, category korunur
- [X] **5.3** Sıralama: [validation.ts](backend/src/modules/urunler/validation.ts) default sort `kod ASC` — asıl ürün + sağ/sol/parça yan yana gelir
- [X] **Final durum (181-183 snapshot, lokalde test edildi):** 64 urun + 72 yarimamul + 25 hammadde, 9 reçete + 35 kalem, 161 toplam urun kaydı
  - Not (2026-04-23): `186_v1_xls_urun_matrisi.sql` eklendikten sonraki güncel tam seed toplamları aşağıda **AŞAMA 9.6** altında tutuluyor

**Deploy akışı:**

1. `git push` (backend + admin panel kod)
2. Canlıda `git pull` + `bun run build`
3. Canlıda `bun run db:seed` — DB sıfırdan kurulur, seed'ler sırayla: 181 (canlı import) + 182 (migrasyon) + 183 (cleanup)
4. Canlı durum lokal ile aynı olur

## AŞAMA 6 — Vardiya Analizi Dashboard

**Motivasyon:** "Şu gün gece vardiyasında üretilen miktarlar, kalıp değiştirme var mı, arıza var mı" — operatörlerin vardiya sonu performansını görmek.

### Tamamlanan (6.1 - 6.4)

- [X] **6.1** Backend `vardiya_analizi/` modülü:
  - [service.ts](backend/src/modules/vardiya_analizi/service.ts) — `getVardiyaAnalizi(query)` aggregate sorgu
  - [controller.ts](backend/src/modules/vardiya_analizi/controller.ts), [router.ts](backend/src/modules/vardiya_analizi/router.ts)
  - Endpoint: `GET /admin/vardiya-analizi?tarih=YYYY-MM-DD`
- [X] **6.2** Aggregate hesaplama:
  - Her vardiya kaydı için üretim (operator_gunluk_kayitlari), duruş (durus_kayitlari + durus_nedenleri katalog), OEE
  - Duruş kategorileri: ARIZ / KALIP / BAKIM / DİĞER
  - OEE = Availability × 0.95 (basitleştirilmiş)
- [X] **6.3** RTK Query hook: [vardiya_analizi_admin.endpoints.ts](admin_panel/src/integrations/endpoints/admin/erp/vardiya_analizi_admin.endpoints.ts)
- [X] **6.4** Admin panel sayfası: [vardiya-analizi-client.tsx](admin_panel/src/app/(main)/admin/vardiya-analizi/_components/vardiya-analizi-client.tsx)
  - Tarih seçici + 60sn polling
  - 6 özet metrik kartı (üretim/çalışma/duruş/arıza/kalıp/OEE)
  - Vardiya kartları (gece/gündüz, aktif/bitti gruplanmış)
  - Her kart: üretim kırılımı, çalışma/duruş süresi, duruş rozet'leri, OEE
  - Sidebar: "Üretim Süreçleri" grubunda, admin rolüne kısıtlı

### Genişlemeler (6.5+)

- [X] **6.5** Detay Sheet — karta tıklayınca: duruş tablosu + 24 saatlik üretim bar chart + üretim kayıtları + bağlı üretim emirleri
- [X] **6.7 + 6.12** Makine bazlı kırılım + teorik üretim hedefi (ağırlıklı ortalama çevrim × çalışma, renkli progress bar)
- [X] **6.8** Kalıp bazlı analiz — her kalıbın toplam üretim, çalışma saat, kullanıldığı makine+ürün listesi
- [X] **6.9** Trend grafiği — 7/30 gün toggle, recharts line chart (üretim+duruş+OEE, dual Y-axis)
- [X] **6.10** Dashboard widget `VardiyaOzetWidget` — `/admin/dashboard`'da bugünkü 4 metrik + uyarı rozetleri + makine listesi (hedef %)
- [X] **6.6** Operatör karşılaştırma
  - 2026-04-23 karar notu: kullanıcı operatör odaklı analiz istemediği için bilinçli olarak kapsam dışı bırakıldı
- [X] **6.11** Tarih aralığı filtresi (hafta/ay)
  - 2026-04-23 uygulaması: vardiya analizi ekranına `Gün / 7 Gün / 30 Gün / Özel` filtreleri eklendi
  - Makine detay sheet'i de tek gün yanında tarih aralığı sorgusunu kabul edecek şekilde genişletildi
- [X] **6.13** Excel/PDF export
  - 2026-04-23 uygulaması: vardiya analizi ekranına görünüm bazlı `Excel` ve `PDF` export aksiyonları eklendi
  - `Vardiya / Makine / Kalıp / Trend` görünümleri mevcut filtrelerle aynı veri üzerinden raporlanıyor
  - PDF tarafı tarayıcının yazdırma penceresi üzerinden açılıyor; Excel tarafı `.xls` olarak indiriliyor
- [X] **6.14** Anlık bildirim
  - 2026-04-23 uygulaması: WebSocket beklemeden mevcut stack ile `GET /api/notifications/stream` SSE endpoint'i eklendi
  - `createUserNotification()` artık DB kaydı sonrası canlı yayına da düşüyor; görev ve şifre değişimi gibi mevcut bildirimler gerçek zamanlı çalışıyor
  - Admin header'a okunmamış sayaç rozetli bildirim kısayolu ve sonner toast dinleyicisi eklendi
  - ERP tarafında `günlük üretim girişi` ve `üretim tamamlandı` olayları admin kullanıcılara bildirim olarak akıyor

## AŞAMA 7 — Müşteri Geri Dönüşü: Operasyonel YM Akışı

**Kaynak:** [Operasyonel Yarımamul Tanımlama.docx](/home/orhan/Documents/Projeler/paspas/Operasyonel%20Yarımamul%20Tanımlama.docx)

### Durum Doğrulaması (2026-04-23)

- [X] Backend kontrolü tekrar incelendi: `backend/src/modules/urunler/controller.ts` içindeki hardcoded `kategori === 'urun'` blokajı kaldırıldı; operasyon ve reçete sahipliği kategori davranışına bağlandı
- [X] UI kontrolü tekrar incelendi: `admin_panel/.../urun-form.tsx` içinde reçete sekmesi artık yalnız `urun` değil, üretim alanı aktif kategoriye göre açılıyor
- [X] Kategori şeması kontrol edildi: `categories` tarafında `recetede_kullanilabilir`, `uretim_alanlari_aktif`, `operasyon_tipi_gerekli` alanları zaten mevcut; blokaj veri modelinden değil controller/UI katmanından geliyor
- [X] Reçete detay ekranı kontrol edildi: ürün listesi accordion'u yalnızca direkt reçete kalemlerini düz listeliyor; YM alt kırılımını recursive göstermiyor
- [X] `Operasyonel YM` ekleme sırasında görülen `db_error` doğrudan reproduce edildi; kök neden `sub_categories.slug` alanındaki global unique index + wrapped DB error oldu

### Blokajlar / Hızlı Düzeltmeler

- [X] **7.1** Yarımamul ürün oluşturma akışında operasyon tanımlama blokajı kaldırıldı
  - Mevcut hata: "bu kategori için operasyon tanımlanamaz"
  - Beklenti: yarımamul / operasyonel YM kayıtlarında operasyon sekmesi aktif ve kaydedilebilir olsun
  - 2026-04-23 uygulaması: backend create/update/list/patch operasyon akışı kategori davranışına bağlandı
  - Smoke test: admin token ile `yarimamul` ürün oluşturuldu, `GET /api/admin/urunler/:id/operasyonlar` çağrısı `1` operasyon döndü
- [X] **7.2** Ürün kategorilerine yeni `Operasyonel YM` benzeri seçenek eklerken alınan `db_error` kök neden analizi + düzeltme
  - Kök neden: `sub_categories.slug` alanında global unique index vardı; farklı kategorilerde aynı slug ile kayıt açılınca `500 db_error` düşüyordu
  - Uygulama: unique index `category_id + slug` olacak şekilde scope edildi; backend duplicate check explicit hale getirildi; slug alanı boş bırakıldığında isimden otomatik üretim açıldı
  - Smoke test: aynı slug ile `urun` ve `yarimamul` altında kayıt açma `201/201`, aynı kategori içinde tekrar deneme `409 duplicate_slug`, boş slug ile create `201` ve otomatik slug dönüşü
- [X] **7.3** Yarımamul kartında `Reçeteler` sekmesi aktif oldu
  - Beklenti: yarımamullere de reçete girilebilsin
  - Yarımamul reçetesinde hammadde kalemleri desteklenmeye devam edecek
  - 2026-04-23 uygulaması: API (`getUrunRecete` / `saveUrunRecete` / `deleteUrunRecete`) ve ürün formu yarımamul için açıldı
  - Smoke test: oluşturulan yarımamul kartına `PUT /api/admin/urunler/:id/recete` ile `1` hammadde kalemi kaydedildi, ardından `GET /api/admin/urunler/:id/recete` ile geri okundu

### Operasyonel YM Modeli

- [X] **7.4** `Operasyonel YM` için ürün giriş akışı netleştirilecek
  - Kullanıcı yarı mamulü doğrudan tanımlayabilmeli
  - Operasyon ekranında kalıp bilgisi + çevrim süresi girilebilmeli
  - 2026-04-23 uygulaması: `operasyonel_ym` ayrı ERP kategorisi olarak eklendi; ürün formu bu kategori için doğrudan kart açabiliyor, operasyon ve reçete sekmeleri aktif çalışıyor
  - Not: tek taraflı senaryoda kullanıcı kart/adlandırma seviyesinde `Tek Sağ` / `Tek Sol` gibi ayrımı verebiliyor; sistem bunu tek operasyon olarak taşıyor
- [X] **7.5** Yarımamul ürünlerde `çift taraflı` seçeneği pasif
  - Yarımamul tek parçayı temsil ettiği için tek kalıp / tek operasyon mantığı zorunlu olacak
  - Mevcut davranış: `yarimamul` kategorisinde `operasyon_tipi_gerekli = 0`; formda seçim görünmüyor, backend de operasyon tipini `null` normalize ediyor
- [X] **7.6** Nihai ürün operasyon tipi reçeteden türetilecek
  - Reçetede `1` operasyonel YM varsa: `tek_tarafli`
  - Reçetede `2` operasyonel YM varsa: `cift_tarafli`
  - Uygulama: `saveUrunRecete` ve `deleteUrunRecete` sonrasında nihai ürün `operasyon_tipi` alanı reçetedeki YM sayısına göre senkronlanıyor
  - Uyumluluk: reçetede `operasyonel_ym` varsa öncelik ona veriliyor; legacy veri için `yarimamul` fallback'i korunuyor
  - UI: `urun` kategorisinde operasyon tipi seçimi gizlendi; kullanıcıya ayrıca tek/çift taraf sorusu sorulmuyor
- [X] **7.7** Nihai ürün operasyon ekranı, bağlı operasyonel YM kayıtlarından otomatik beslenecek
  - Tek taraflı üründe `1` operasyon, çift taraflı üründe `2` operasyon üretiliyor
  - Kalıp, hazırlık süresi, çevrim süresi ve makine atamaları ilgili YM operasyon tanımından kopyalanıyor
  - Ek senkron: bir operasyonel YM operasyonu `PATCH /api/admin/urunler/operasyonlar/:opId` ile güncellenirse bağlı nihai ürün operasyonları da tekrar kuruluyor
- [X] **7.8** Nihai ürün oluşturma akışında "yapıyı bozma" prensibi korunacak
  - Ürün temel bilgileri mevcut `POST /api/admin/urunler` akışıyla kalmaya devam etti
  - Otomasyon yalnız reçete kaydetme / silme ve operasyon ekranının gösterim mantığına eklendi

### Teknik Notlar / Karar Bekleyenler

- [X] **7.9** `Operasyonel YM` ayrı bir kategori mi, yoksa mevcut `yarimamul` kategorisinin UI adı mı olacak kararı netleştirilecek
  - Karar: `operasyonel_ym` ayrı ERP kategorisi olarak açıldı; `yarimamul` legacy/operasyonsuz ara ürün kategorisi olarak korunuyor
  - Seed + kategori varsayımları + admin liste sekmeleri + locale etiketleri bu karara göre güncellendi
- [X] **7.10** Nihai ürün operasyonlarının reçeteden türetilmesi, mevcut `POST /admin/urunler/full` akışıyla uyumlu olacak şekilde tasarlanacak
  - `POST /api/admin/urunler/full` artık otomatik türettiği ara ürünleri `operasyonel_ym` kategorisinde oluşturuyor
  - Siparişten üretim emri açma ve montaj akışları da öncelikle `operasyonel_ym` kalemlerini baz alıyor; legacy `yarimamul` fallback'i korunuyor
  - Böylece "manuel operasyonel YM" ve "otomatik operasyonel YM türet" akışları aynı kategori modelinde buluştu

## AŞAMA 8 — Vardiya / Günlük Üretim Backlog

- [X] **8.1** Vardiya başlangıcı manuel değil zaman bazlı otomatik olsun
  - `GET /api/admin/operator/acik-vardiyalar` artık kuyrukta işi olan ve açık vardiyası olmayan makineler için mevcut vardiya penceresine göre vardiya kaydını otomatik materialize ediyor
  - `POST /api/admin/operator/baslat` aynı otomatik açılışı backend tarafında ayrıca garanti ediyor; panel dışı doğrudan API kullanımı da güvence altında
  - Operatör ekranındaki manuel `Gündüz / Gece` seçimi ve `BAŞLAT` butonu kaldırıldı; kapalı kartlar artık otomatik vardiya bilgisini pasif olarak gösteriyor
- [X] **8.2** Üretim takibi "ürünü başlat / bitir" akışıyla ilerlesin; klasik vardiya bitirme aksiyonu yeniden adlandırılsın veya kaldırılsın
  - Operatör ekranında vardiya paneli read-only hale getirildi; klasik `VARDİYA KAPAT` aksiyonu ana ekrandan kaldırıldı
  - Üretim kontrolü artık yalnız makine iş kartlarındaki `BAŞLAT / DURAKLAT / DEVAM ET / BİTİR` aksiyonları ile ilerliyor
  - `vardiya-sonu` endpoint'i tamamen silinmedi; `8.3` altındaki günlük üretim girişi tasarımı netleşene kadar backend fallback olarak tutuluyor
- [X] **8.3** Her makinede vardiya sonu günlük üretim değeri girilebilsin
  - Operatör ekranındaki aktif iş kartlarına `GÜNLÜK ÜRETİM` aksiyonu eklendi
  - Yeni `POST /api/admin/operator/gunluk-giris` endpoint'i makine bazlı günlük üretim / fire / not kaydı alıyor
  - Günlük giriş, işi bitirmeden ve vardiyayı kapatmadan üretim ölçümü yazıyor
- [X] **8.4** Günlük üretim girişleri hem stok/envanter artışını hem de vardiya analizlerini beslesin
  - Günlük giriş backend'de ortak artımlı üretim helper'ına bağlandı; `operator_gunluk_kayitlari`, `hareketler`, ürün stoğu ve üretim emri ilerlemesi birlikte güncelleniyor
  - `vardiya_analizi` tarafında günlük kayıtlar doğrudan okunuyor; ayrıca eski `net + ek` çift sayım hatası düzeltilerek analizde yalnız `net_miktar` kullanılmaya başlandı
- [X] **8.5** Uzun süren, günlerce kesintisiz devam eden üretimlerde stok artışı günlük bazda envantere işlenebilsin
  - Günlük giriş sonrası kuyruk durumu `calisiyor` kalıyor; iş emri kapanmadan stok artışı günlük bazda işlenebiliyor
  - Böylece çok vardiyalı / çok günlü üretimlerde iş açık kalırken ara stok artışları kaydedilebiliyor
- [X] **8.6** Asıl stok miktarlarının operasyon tamamlandığında artması beklentisi ile günlük üretim/envanter beklentisi birlikte modellenip çelişki çözümü yapılacak
  - `repoUretimBitir` içindeki `stokFarki = gercekNet - oncekiNet` uzlaşması günlük girişleri de kapsıyor
  - Gün içinde stok artmışsa final bitiş yalnız kalan farkı ekliyor; böylece günlük envanter beklentisi ile operasyon kapanış stoku çakışmıyor

## AŞAMA 9 — XLS Bazlı Seed Matrisi ve YM Alt Reçetesi

- [X] **9.1** Ana veri kaynağı olarak [Ürün Girişi MRP1 (20_04).xls](/home/orhan/Documents/Projeler/paspas/%C3%9Cr%C3%BCn%20Giri%C5%9Fi%20MRP1%20%2820_04%29.xls) baz alınarak ürün / kalıp / operasyon / reçete matrisi parse edildi
- [X] **9.2** [scripts/generate_xls_matrix_seed.py](scripts/generate_xls_matrix_seed.py) ile [186_v1_xls_urun_matrisi.sql](backend/src/db/seed/sql/186_v1_xls_urun_matrisi.sql) üretildi
- [X] **9.3** `backend/src/db/seed/utils.ts` içinde SQL yorum temizleme akışı düzeltildi; ürün adlarındaki `--2 Lİ ÖN--` / `--4 PARÇA--` kalıpları artık seed parser'ını bozmuyor
- [X] **9.4** Nihai ürün reçetesi ile yarımamul alt reçetesi ayrıştırıldı
  - Nihai ürün reçetesi: operasyonel YM + ambalaj / son işlem malzemeleri
  - Yarımamul reçetesi: şaft / granül / krom film benzeri operasyonel girdiler
- [X] **9.5** Örnek doğrulama: `1101 101 / STAR SİYAH` ve `1101 101-X / Star Siyah Aramamul` için ayrı reçete kayıtları DB'de mevcut
  - Final reçete: `1101 101-X` x `2` + kartela / barkod / koli / koli etiketi / askılık / poşet
  - YM reçete: `2101 010 / Şaft Parça Siyah` x `0.5000`
- [X] **9.6** Güncel tam seed snapshot (2026-04-23)
  - `160` `urun`
  - `226` `yarimamul`
  - `115` `hammadde`
  - `293` reçete (`157` nihai ürün + `132` yarımamul + kalan legacy/demo kayıtlar)
  - `1331` reçete kalemi
  - `226` operasyon
  - `42` kalıp
- [X] **9.7** Admin panel ürün accordion'unda YM alt kırılımı recursive gösteriliyor
  - `GET /api/admin/urunler/:id/recete` cevabı artık `altRecete` ağacı döndürüyor
  - Accordion tablosu nested satırları parent miktarı ile ölçekleyerek render ediyor
  - Toplam maliyet çift sayımı önlemek için yaprak kalemlerden hesaplanıyor

## AŞAMA 10 — Smoke Testleri / Doğrulama Matrisi

- [X] **10.1** Backend derleme
  - Komut: `cd backend && bun run build`
  - Sonuç: başarılı
- [X] **10.2** Tam seed zinciri
  - Komut: `cd backend && bun run db:seed`
  - Sonuç: `10` ile `186` arasındaki tüm SQL dosyaları tamamlandı, son adımda `186_v1_xls_urun_matrisi.sql` başarıyla çalıştı
- [X] **10.3** Sadece XLS seed rerun
  - Komut: `cd backend && bun src/db/seed/index.ts --no-drop --only=186`
  - Sonuç: incremental rerun başarılı; seed idempotent kaldı
- [X] **10.4** DB smoke query: örnek nihai ürün + YM alt reçetesi
  - Sorgu: `1101 101` ve `1101 101-X` için `urunler` + `receteler` + `recete_kalemleri`
  - Sonuç: iki ürün için ayrı reçete bulundu; final üründe YM x `2`, YM reçetesinde `Şaft Parça Siyah` x `0.5000`
- [X] **10.5** DB smoke query: güncel sayılar
  - Sorgu: kategori bazlı ürün sayıları + reçete / reçete kalemi / operasyon / kalıp toplamları
  - Sonuç: **AŞAMA 9.6** ile aynı
- [X] **10.6** Stage 7 backend doğrulaması
  - İnceleme: `backend/src/modules/urunler/controller.ts`
  - Sonuç: operasyon sahipliği `uretim_alanlari_aktif + tedarik_tipi='uretim'`, reçete sahipliği `uretim_alanlari_aktif` kuralına bağlandı; `yarimamul` artık destekleniyor
- [X] **10.7** Stage 7 UI doğrulaması
  - İnceleme: `admin_panel/src/app/(main)/admin/urunler/_components/urun-form.tsx`
  - Sonuç: reçete sekmesi artık `uretim_alanlari_aktif` olan kategoriler için görünüyor; yarımamul kartında aktif
- [X] **10.8** Nested reçete görünümü doğrulaması
  - İnceleme: `admin_panel/src/app/(main)/admin/urunler/_components/urunler-client.tsx`
  - Sonuç: accordion tablosu artık nested reçete ağacını depth tabanlı render ediyor; YM alt kırılımı aynı tabloda açılıyor
- [X] **10.9** API smoke testi: yarımamul operasyon + reçete
  - Yöntem: Fastify `app.inject()` + admin JWT ile gerçek admin endpoint çağrıları
  - Sonuç: `yarimamul` ürün oluşturma `201`, operasyon listeleme `200` ve `1` operasyon, reçete kaydetme `200`, reçete okuma `200` ve `1` kalem; ardından test verisi temizlendi
- [X] **10.10** API smoke testi: sub-category slug scope + otomatik slug
  - Yöntem: Fastify `app.inject()` + admin JWT ile `/api/admin/subcategories`
  - Sonuç: aynı slug ile iki farklı kategori altında create `201/201`, aynı kategori içinde tekrar create `409 duplicate_slug`, boş slug ile create `201` ve isimden otomatik slug üretildi
- [X] **10.11** API smoke testi: nihai ürün operasyonu reçeteden türetme
  - Yöntem: `2` test yarımamulu + `1` test nihai ürünü oluşturuldu; reçete ve operasyon endpoint'leri gerçek admin JWT ile çağrıldı
  - Sonuç: tek YM reçetesinde nihai ürün `tek_tarafli` ve `1` operasyon oldu; YM operasyon patch sonrası nihai ürün kalıp / süre bilgileri güncellendi; çift YM reçetesinde ürün `cift_tarafli` ve `2` operasyon oldu; reçete silinince nihai ürün operasyonları `0` ve `operasyon_tipi = null` oldu
- [X] **10.12** API smoke testi: ayrı `operasyonel_ym` kategori akışı
  - Yöntem: gerçek admin JWT ile `operasyonel_ym` ürün kartı oluşturuldu, operasyonlar listelendi, ardından hammadde içeren reçete kaydedilip geri okundu
  - Sonuç: kategori kabul edildi; `1` operasyon döndü; operasyon adı `Tek Sag` olarak korundu; reçete tarafında `1` hammadde kalemi başarıyla saklandı
- [X] **10.13** API smoke testi: siparişten üretim emri artık `operasyonel_ym` için açılıyor
  - Yöntem: `operasyonel_ym` içeren test nihai ürünü + satış siparişi kalemi oluşturuldu, ardından `POST /api/admin/uretim-emirleri/siparis-kaleminden` çağrıldı
  - Sonuç: `1` üretim emri açıldı; emir hedef ürünü doğrudan ilgili `operasyonel_ym` kartı oldu; planlanan miktar `sipariş miktarı x reçete miktarı = 6`
- [X] **10.14** API smoke testi: `POST /api/admin/urunler/full` artık `operasyonel_ym` türetiyor
  - Yöntem: çift taraflı full ürün oluşturma endpoint'i gerçek admin JWT ile çağrıldı
  - Sonuç: otomatik oluşan `2` ara ürünün kategori seti yalnızca `operasyonel_ym` oldu
- [X] **10.15** API smoke testi: nested reçete ağacı
  - Yöntem: seed'deki `1101 101 / STAR SİYAH` ürünü için `GET /api/admin/urunler/:id/recete` çağrıldı
  - Sonuç: direkt reçetede `1101 101-X` bulundu; aynı kalemin `altRecete.items` altında `2101 010` nested olarak döndü
- [X] **10.16** UI doğrulaması: ürün accordion'unda recursive alt kırılım
  - İnceleme: `admin_panel/src/app/(main)/admin/urunler/_components/urunler-client.tsx`
  - Sonuç: reçete satırları depth tabanlı flatten edilerek render ediliyor; nested YM kırılımı arka plan/indent ile ayrışıyor, toplam maliyet yaprak satırlardan hesaplanıyor
- [X] **10.17** API smoke testi: `GET /api/admin/operator/acik-vardiyalar` otomatik vardiya açılışı
  - Yöntem: geçici `makine + üretim emri + kuyruk` kaydı oluşturuldu; gerçek admin JWT ile `GET /api/admin/operator/acik-vardiyalar` çağrıldı
  - Sonuç: geçici makine listede göründü, açık vardiya otomatik üretildi, `vardiya_tipi` güncel vardiya penceresi ile eşleşti ve `baslangic` vardiya saatinin başına (`19:30`) backdate edildi
  - Not: smoke bugünün `23 Nisan 2026` resmi tatiline çarptığı için tatil kaydı test süresince geçici kaldırılıp sonunda geri yüklendi; bu da tatilde otomatik vardiya açılmamasının ayrı bir doğru davranış olduğunu doğruladı
- [X] **10.18** API smoke testi: `POST /api/admin/operator/baslat` vardiyayı da otomatik açıyor
  - Yöntem: geçici `makine + üretim emri + kuyruk` kaydı oluşturulup gerçek admin JWT ile `POST /api/admin/operator/baslat` çağrıldı
  - Sonuç: kuyruk durumu `calisiyor` oldu, aynı anda makine için otomatik vardiya kaydı açıldı ve test verileri temizlendi
- [X] **10.19** UI doğrulaması: operatör ekranında vardiya paneli artık read-only
  - İnceleme: `admin_panel/src/app/(main)/admin/operator/_components/operator-client.tsx`
  - Sonuç: `VARDİYA KAPAT` akışı ve ilgili sheet/state kaldırıldı; panel metni üretim takibini iş kartlarına yönlendiriyor, kartlarda yalnız otomatik vardiya durumu gösteriliyor
- [X] **10.20** Admin build doğrulaması: operatör ekranı sadeleştirmesi
  - Komut: `cd admin_panel && bun run build`
  - Sonuç: başarılı
- [X] **10.21** API smoke testi: günlük üretim girişi
  - Yöntem: geçici `ürün + makine + üretim emri + kuyruk` kaydı oluşturulup `POST /api/admin/operator/baslat` sonrası `POST /api/admin/operator/gunluk-giris` çağrıldı
  - Sonuç: kayıt `201` döndü; `gunluk_durum = yarim_kaldi`, `ek_uretim_miktari = 5`, `net_miktar = 4` ve üretim emri `uretilen_miktar = 4` oldu
- [X] **10.22** API smoke testi: günlük giriş stok ve vardiya analizini besliyor
  - Yöntem: günlük giriş sonrası `GET /api/admin/vardiya-analizi/detay` ve `hareketler` toplamı kontrol edildi
  - Sonuç: vardiya detayında ilgili günlük kayıt `netMiktar = 4` olarak göründü; stok hareket toplamı da günlük giriş sonrası `4` oldu
  - Not: bu smoke sırasında `vardiya_analizi` tarafındaki eski çift sayım hatası yakalandı ve düzeltildi
- [X] **10.23** API smoke testi: uzun üretimde günlük stok + final uzlaşma
  - Yöntem: günlük girişten sonra kuyruk açık bırakıldı, ardından aynı iş `POST /api/admin/operator/bitir` ile toplam değer üzerinden tamamlandı
  - Sonuç: günlük giriş sonrası kuyruk `calisiyor` kaldı; final bitişte `stokFarki = 5` döndü ve toplam stok hareketi `4 + 5 = 9` olarak doğru uzlaştı
- [X] **10.24** Backend build + API doğrulaması: vardiya analizi tarih aralığı
  - Komut: `cd backend && bun run build`
  - Sonuç: başarılı; `GET /api/admin/vardiya-analizi?baslangicTarih=2026-04-17&bitisTarih=2026-04-23` ve eşleşen `/detay` aralık sorgusu `200` döndü
- [X] **10.25** Admin build doğrulaması: vardiya analizi filtreleri + üretim emri başlığı
  - Komut: `cd admin_panel && bun run build`
  - Sonuç: başarılı; vardiya analizi ekranında `Gün / 7 Gün / 30 Gün / Özel` filtreleri derlendi, üretim emri detay başlığı ürün adını öne çıkaracak şekilde güncellendi
- [X] **10.26** Export helper smoke testi: Excel/PDF rapor dokümanı
  - Yöntem: `admin_panel/src/lib/erp/vardiya-analizi-export.ts` pure helper'ları örnek metrik + tablo ile çalıştırıldı
  - Sonuç: hem Excel HTML hem print/PDF HTML çıktısı üretildi; başlık ve tablo içerikleri doğrulandı
- [X] **10.27** Admin build doğrulaması: vardiya analizi export aksiyonları
  - Komut: `cd admin_panel && bun run build`
  - Sonuç: başarılı; `Excel` ve `PDF` butonları ile trend görünümü parent state'e taşınmış haliyle derlendi
- [X] **10.28** Backend build doğrulaması: canlı bildirim altyapısı
  - Komut: `cd backend && bun run build`
  - Sonuç: başarılı; `notifications/stream` SSE endpoint'i, yayın helper'ı ve operator/auth entegrasyonları derlendi
- [X] **10.29** Frontend build doğrulaması: admin header canlı bildirim bileşeni
  - Komut: `cd admin_panel && bun run build`
  - Sonuç: başarılı; header'a eklenen bildirim rozeti, SSE dinleyicisi ve toast akışı derlendi
- [X] **10.30** Smoke testi: SSE handler ve publish/cleanup akışı
  - Yöntem: `streamNotifications` route handler'ı `PassThrough` stream ile stub edilip `publishNotification()` çağrısı gönderildi
  - Sonuç: handler `200` + `hijack` ile stream açtı, `connected` ve `notification` event'leri yazıldı, bağlantı kapanınca subscriber sayısı `0` oldu
- [X] **10.31** Smoke testi: realtime subscriber hub
  - Yöntem: `subscribeToUserNotifications()` ile geçici kullanıcı dinleyicisi açılıp `publishNotification()` ile örnek bildirim basıldı
  - Sonuç: dinleyici bildirimi aldı; unsubscribe sonrası toplam subscriber sayısı temizlendi
- [X] **10.32** E2E smoke denemesi notu: DB-backed canlı akış
  - Yöntem: local backend'i geçici portta ayağa kaldırıp gerçek `/api/notifications/stream` ve `/api/notifications` çağrıları denenmeye çalışıldı
  - Sonuç: ilk deneme local MySQL `ER_CON_COUNT_ERROR / Too many connections` ile bloklandı; kök neden önceki `bun -e` smoke süreçlerinin açık kalan DB pool bağlantılarıydı
- [X] **10.33** E2E smoke testi: gerçek SSE + bildirim CRUD akışı
  - Yöntem: takılı `bun` smoke process'leri kapatıldı, backend geçici portta ayağa kaldırıldı; gerçek `POST /api/auth/token`, `GET /api/notifications/stream`, `POST /api/notifications`, `GET /api/notifications/unread-count`, `GET /api/notifications`, `DELETE /api/notifications/:id` çağrıları sırayla çalıştırıldı
  - Sonuç: login `200`, stream `200`, create `201`; stream içinde hem `connected` hem `notification` event'i alındı, unread sayaç `0 -> 1` arttı, liste oluşturulan bildirimi içerdi ve test kaydı sonunda silindi
