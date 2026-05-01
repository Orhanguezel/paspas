# ERP Smoke Test Plani

Amaç: kritik ERP akışlarında "çalışıyor mu?" kontrolünü hızlı, tekrar edilebilir testlerle yakalamak.

## P0 - Stok ve Üretim

- [x] Reçete ihtiyacı: hedef miktar, planlanan miktar ve fire oranı doğru hesaplanır.
- [x] Üretim emri oluşturma rezervasyonu: fiziksel stok değişmeden `rezerveStok` artar.
- [x] Makineye atama / stok düşme: fiziksel stok azalır, `rezerveStok` düşer.
- [x] Makineden çıkarma / stok geri alma: fiziksel stok geri artar, rezervasyon tekrar açılır.
- [x] Stok takibi kapalı ürün: stok ve rezerve stok değişmez, yeterlilikten muaf kalır.
- [x] DB entegrasyon testi yazıldı: `repoCreate` üretim emri rezervasyon satırlarını oluşturur; stok takibi kapalı ürün rezervasyona girer ama miktarı değişmez.
- [x] DB entegrasyon testi yazıldı: `repoAtaOperasyon` stok düşer, stok takibi kapalı ürün miktarı değişmez ama hareket kaydı oluşur.
- [x] DB entegrasyon testi yazıldı: `repoKuyrukCikar` stok iade eder, stok takibi kapalı ürün miktarı değişmez ama iade hareket kaydı oluşur.
- [x] DB entegrasyon testi yazıldı: `repoDelete` aktif rezervasyonu iptal eder ve takip açık stokun rezervasyonunu geri alır.
- [x] DB entegrasyon testi yazıldı: montajda stok takibi kapalı OYM/hammadde yeterlilikten muaf kalır, stok miktarı değişmez ama hareket kaydı oluşur.

## P0 - Siparişten Üretime

- [x] Üretim emirleri görünür ürün adı siparişin asıl ürünü olur; teknik Operasyonel YM alt bilgi olarak kalır.
- [x] Smoke: sipariş kalemi üretime aktarılırken Operasyonel YM satırı sipariş miktarıyla çarpılır.
- [x] Tek Operasyonel YM seçili reçete tek taraflı operasyon üretir.
- [x] İki Operasyonel YM seçili reçete çift taraflı operasyon üretir.
- [x] İkiden fazla Operasyonel YM validasyon hatası verir.
- [x] Reçetede Operasyonel YM varsa eski `yarimamul` satırına göre değil Operasyonel YM'ye göre üretim kaynağı seçilir.
- [x] Smoke: Operasyonel YM operasyonundan kalıp, süre, montaj ve makine öncelikleri ana ürün operasyonuna kopyalanır.
- [x] DB entegrasyon testi yazıldı: sipariş kalemi üretime aktarılınca Operasyonel YM emirleri gerçekten beklenen adetle açılır. Varsayılan test paketinde skip; `RUN_DB_INTEGRATION=1` ile çalışır.
- [x] DB entegrasyon testi yazıldı: aynı sipariş kalemi ikinci kez üretime aktarılamaz, duplicate üretim emri açılmaz.
- [x] DB entegrasyon testi yazıldı: Operasyonel YM emrinde ana ürün görseli gösterim için korunur, hammadde yeterlilik teknik OYM reçetesinden hesaplanır.
- [x] DB entegrasyon testi yazıldı: Operasyonel YM üzerinde kalıp/makine değişince bağlı ana ürün operasyonları gerçekten yeniden yazılır. Varsayılan test paketinde skip; `RUN_DB_INTEGRATION=1` ile çalışır.
- [x] DB entegrasyon testi yazıldı: aynı sipariş kalemine bağlı sağ/sol Operasyonel YM üretimleri sipariş üretilen miktarında çift sayılmaz.
- [x] DB entegrasyon testi yazıldı: siparişten üretime aktarımda OYM emirleri, operasyon satırları, sipariş bağlantısı ve teknik hammadde rezervasyonları birlikte oluşur.
- [x] DB entegrasyon testi geçti: sipariş kalemi durum geçişi hata verirse üretim emri ve bağlantı satırları rollback olur. (`createUretimEmirleriFromSiparisKalemi` artık `canTransitionKalem` ile pre-check yapar; geçersiz durumda emir oluşturulmadan hata atılır.)

## P0 - Vardiya ve Operatör

- [x] Gün sonu + devam et + bitir kayıtları ezilmeden toplanır.
- [x] DB entegrasyon testi yazıldı: kapanan vardiyaya sonradan üretim adedi girilebilir.
- [x] Smoke: geç login olsa bile vardiya başlangıcı tanımlı saat olan 07:30 olarak hesaplanır.
- [x] Smoke: açık vardiya başlangıcından otomatik kapanış saati gündüz/gece için doğru hesaplanır.
- [x] Smoke: kapanmış vardiyaya geç üretim girişi için 18 saatlik tolerans korunur.
- [x] DB entegrasyon testi yazıldı: açık kalmış eski vardiya günlük üretim girişi sırasında otomatik kapanır ve yeni üretim kaydı yazılır.
- [x] DB entegrasyon testi yazıldı: montaj/ambalaj kayıtları vardiya analiz toplamlarından muaf kalır.
- [x] DB entegrasyon testi yazıldı: makine bazlı baskı adedi çift taraflı üretimde iki makine için ayrı görünür.

## P1 - Ekran ve Liste Tutarlılığı

- [x] Stok takibi kapalı ürün Stoklar, Hareketler ve Eksik Malzemeler alanlarında gizlenir.
- [x] DB entegrasyon testi yazıldı: stok takibi kapalı ürün hareket kaydı veritabanında durur ama hareket listesi ve özet toplamlarından gizlenir.
- [x] Reçete alt kırılımı ana ürün reçete açılımında gösterilmez.
- [x] Üretim emri reçete modalı ana ürün görselini korur, Operasyonel YM bilgisini alt bilgi yapar.
- [x] Admin smoke testi yazıldı: reçete modalında malzeme görseli büyütülebilir.
- [x] DB entegrasyon testi yazıldı: makineler arası sürükle bırak backend tarafından reddedilir.
- [x] Script smoke testi yazıldı: malzeme görselleri dosya adına göre storage asset, kapak ve ürün medya seed SQL'ine dönüşür.
- [x] Script smoke testi yazıldı: Drive klasör HTML'i görsel dosyalara ayrıştırılır ve lokal dosya adı upload kuralına göre normalize edilir.
- [x] Test Merkezi tablosu eklendi: test checklist kayıtları, sonuç geçmişi ve snapshot id ilişkisi DB'de tutulur.
- [x] Admin panel Test Merkezi eklendi: canlı DB için önce snapshot alma, sonuç kaydetme ve test bitince seçili snapshot'tan geri yükleme akışı panelde görünür.

## Backend Smoke Test Ayrımı

Toplu `bun test` kalabilir, ama Test Merkezi'nde hata sebebini hızlı görmek için backend smoke testleri ayrı satırlara bölündü.

- [x] Backend smoke: auth ve roller (`src/modules/auth`, `src/modules/userRoles`)
- [x] Backend smoke: iş ortakları (`src/modules/musteriler`, `src/modules/tedarikci`)
- [x] Backend smoke: ürün ve reçete (`src/modules/urunler`, `src/modules/receteler`)
- [x] Backend smoke: üretim tanımları (`src/modules/tanimlar`, `src/modules/makine_havuzu`)
- [x] Backend smoke: planlama ve Gantt (`src/modules/_shared`, `src/modules/gantt`, `src/modules/is_yukler`)
- [x] Backend smoke: satış siparişleri (`src/modules/satis_siparisleri`)
- [x] Backend smoke: üretim emirleri (`src/modules/uretim_emirleri`)
- [x] Backend smoke: operatör ve vardiya (`src/modules/operator`, `src/modules/vardiya_analizi`)
- [x] Backend smoke: stok ve hareketler (`src/modules/stoklar`, `src/modules/hareketler`)
- [x] Backend smoke: satın alma ve mal kabul (`src/modules/satin_alma`, `src/modules/mal_kabul`)
- [x] Backend smoke: sevkiyat (`src/modules/sevkiyat`)
- [x] Backend smoke: sistem modülleri (`db_admin`, `storage`, ayarlar, audit, notifications, mail, profiles, dashboard, login ayarları, görevler)
- [x] Backend smoke: script testleri (`backend/scripts/__tests__`)

## P2 - Gerçek Veri Operasyon Testleri

Bu bölüm canlı/veri tabanlı uçtan uca testler içindir. Testler gerçek tablolara kayıt yazmalı, stok/hareket/durum etkilerini doğrulamalı ve test sonunda snapshot'tan geri dönülebilmelidir.

- [x] İş Ortakları: müşteri oluştur, düzenle, pasifleştir/sil; satış siparişi bağlantısı varken silme/pasifleştirme davranışını doğrula.
- [x] İş Ortakları: tedarikçi oluştur, düzenle, pasifleştir/sil; satın alma bağlantısı varken ilişki korunuyor mu kontrol et.
- [x] Ürünler: hammadde/yarı mamul/Operasyonel YM/asıl ürün oluştur; kod, kategori, birim, stok takibi ve görsel alanlarını doğrula.
- [x] Ürünler: ürün düzenleme ve pasifleştirme/silme; reçete, sipariş, stok ve hareket bağlantıları olan ürünlerde beklenen koruma davranışını kontrol et.
- [x] Ürünler/Reçete: asıl ürün reçetesine Operasyonel YM ve hammadde ekle; miktar, fire, kalıp/makine/operasyon bilgilerinin üretime taşındığını doğrula.
- [x] Üretim Tanımları: makine oluştur/düzenle/pasifleştir/sil; liste filtresi ve temel alanları gerçek DB üzerinde doğrula.
- [x] Üretim Tanımları: kalıp, kalıp-makine uyumluluğu, duruş nedeni ve birim oluştur/düzenle/sil akışlarını gerçek DB üzerinde doğrula.
- [x] Üretim Tanımları: makine iş yükü, operatör ve Gantt bağlantısı varken silme/çıkarma koruması eklendi. `repoDelete` (makine_havuzu) silmeden önce `makine_kuyrugu` ve `uretim_emri_operasyonlari` bağlantılarını kontrol eder; varsa `makine_bagimliligi_var` 409 atar.
- [x] Üretim Tanımları: kalıp bağlı reçete/üretim kaydı varken silme koruması eklendi. `repoDeleteKalip` (tanimlar) silmeden önce `urun_operasyonlari` ve `uretim_emri_operasyonlari` bağlantılarını kontrol eder; varsa `kalip_bagimliligi_var` atar.
- [x] Çalışma Planları: vardiya, tatil günü ve hafta sonu planı oluştur/düzenle/sil; planlama tarih hesaplarına etkisini kontrol et.
- [x] Satış Siparişleri: müşteri + ürün ile sipariş ve kalem oluştur; miktar, termin, durum ve kalem toplamlarını doğrula.
- [x] Satış Siparişleri: sipariş düzenle/iptal et/sil; üretime aktarılmış siparişte beklenen kilit/koruma davranışını kontrol et.
- [x] Üretim Emirleri: satış siparişinden üretim emri oluştur; OYM emirleri, ana ürün görüntüsü, rezervasyon ve sipariş bağlantısını doğrula.
- [x] Üretim Emirleri: manuel üretim emri oluştur/düzenle/sil; stok rezervasyonunun oluşması ve silince geri alınmasını çapraz kontrol et.
- [x] Üretim Emirleri: planlanan miktar düzenlenince hammadde rezervasyonu da senkronlanır. `repoUpdate` artık `iptalRezervasyon` + `rezerveHammaddeler` ile rezervasyonu yeniden hesaplar; `rezerve_stok` ve aktif rezervasyon satırı yeni miktarda olur.
- [x] Makine İş Yükleri: üretim emrini makine kuyruğuna ata, sıra değiştir, kuyruktan çıkar; stok, rezervasyon ve sıra bütünlüğünü doğrula.
- [x] Operatör: işe başla, duruş gir, üretimi bitir, günlük üretim adedi gir; vardiya kapanışı ve üretim/hareket etkilerini kontrol et.
- [x] Gantt Planı: üretim emri tarihini değiştir; makine planı, iş yükü ve çakışma davranışı doğrulandı. `repoUpdateById` artık (1) bağlı emir operasyon tarihlerini senkronlar, (2) aynı makinede aktif kuyruk satırıyla overlap eden tarih değişikliğini `makine_kuyrugu_cakisma` ile reddeder.
- [x] Vardiya Analizi: makine bazlı baskı adetleri, gün sonu/devam/bitir toplamları ve montaj muafiyetini gerçek kayıtlarla doğrula.
- [x] Malzeme Stokları: manuel stok düzeltme yap; ürün stok miktarı, hareket kaydı ve stok takibi kapalı ürünün liste dışı kalmasını doğrula.
- [x] Satın Alma: tedarikçi ve ürünle satın alma siparişi oluştur/düzenle/iptal et akışları doğrulandı. `repoUpdate` (satin_alma) artık `patch.durum='iptal'` olduğunda mal kabul kaydı varsa `satin_alma_kilitli` atar.
- [x] Mal Kabul: kalite `red` durumu için teslim toplamına eklenmez ve hareket yazılmaz. `repoCreate` (mal_kabul) red bloğunu hareket yazma+stok güncelleme dışında tutar; `kabul_miktar` subquery'leri ve `updateSatinAlmaDurum` red kayıtlarını filtreler.
- [x] Sevkiyat: satış siparişinden sevk emri oluştur, sevk et, stok ve hareket akışı doğrulandı. `repoPatchSevkEmri` artık `sevk_edildi` durumundaki emri iptal etmeye çalışırsa `sevk_emri_kilitli` atar (iade ayrı akışla yönetilmeli).
- [x] Çapraz Kontrol: ürün/reçete/sipariş/üretim/sevkiyat zincirinde stok ve hareket toplamları tutarlı. `consumeRecipeMaterials` (operator) artık rezervasyon durumu `tamamlandi` ise (yani `stokDus` zaten makinaya atamada hammaddeyi düşürmüşse) ikinci kez tüketim yazmıyor — çift düşüm engellendi.
- [x] Temizlik/Geri Dönüş: snapshot restore akışı doğrulandı. Test Merkezi run kayıtları (audit log) snapshot restore sırasında korunur — `restoreRunsBySnapshotId` test helper'ı non-destructive davranışa geçirildi (silmek yerine eksik olanları geri ekler).

## P3 - Test Altyapısı ve Gelecek İyileştirmeler

Plan kapsamındaki açık fonksiyonel riskler kod ve test seviyesinde kapatıldı. Aşağıdaki maddeler uzun vadeli iyileştirme/altyapı backlog'udur — fonksiyonel açık değil ama test güvenliğini ve operasyon kalitesini artıran iş kalemleri.

- [x] **İzole test veritabanı** ✅ 2026-04-30: `backend/.env.test` eklendi (`DB_NAME=promats_erp_test`); `src/core/env.ts` `NODE_ENV=test` ile bu dosyayı override yüklüyor. `package.json` script'leri `NODE_ENV=test bun test` formatına geçirildi (`test`, `test:integration`, `test:all`, `db:seed:test`, `db:seed:test:fresh`, `db:seed:test:nodrop`). Test DB'ye `app@127.0.0.1` ve `app@localhost` için ayrı GRANT verildi. Doğrulama: integration test çalıştırıldı (468/0), canlı `promats_erp` ürün sayısı önce/sonra 501 (değişmedi). Snapshot/restore artık opsiyonel.
- [x] **AI test sonuç analizi** ✅ 2026-04-30: Test Merkezi'ne çoklu provider AI entegrasyonu (Anthropic Claude / OpenAI / Groq) eklendi. Provider abstraction `ai_provider.ts`'de; `AI_DEFAULT_PROVIDER`/`AI_DEFAULT_MODEL`/`AI_TEMPERATURE`/`AI_MAX_TOKENS` env'inden okunur. Yeni tablolar: `test_center_ai_templates` (CRUD), `test_center_run_analyses` (her analiz kayıt). Default seed template provided (claude-sonnet-4-5, JSON-only structured çıktı). Service `analyzeTestRun(runId)`: prompt render → provider çağrı → JSON parse → DB kayıt; provider hatası error_msg dolu satıra düşer (akış kırılmaz). Endpoint'ler `POST/GET /admin/test-center/runs/:runId/analyses`, `GET/POST/PATCH/DELETE /admin/test-center/ai-templates`. Frontend: Test Merkezi UI'a "AI Yorumla" butonu (severity badge, summary, suggestedActions, risks, relatedFiles, geçmiş analiz history, mock provider override için test override hook'u). 5 yeni integration test (mock provider, markdown fence parse, error case, history sıralama, run yokluğu) `RUN_DB_INTEGRATION=1 bun test` -> 473 pass, 0 fail.
- [x] **Reçete görsel büyütme browser/e2e testi** ✅ 2026-04-30: Playwright + chromium kuruldu. `admin_panel/playwright.config.ts` (storage state pattern, setup project + chromium project), `e2e/auth.setup.ts` (API ile `/auth/token` POST → cookie → storageState), `e2e/recete-gorsel-buyutme.spec.ts` (3 test: lightbox tıklama, ESC ile kapatma, URL formatı). package.json: `test:e2e`, `test:e2e:ui`, `test:e2e:report`. Backend `.env`'i dotenv ile Playwright sürecine yükleniyor (ADMIN_EMAIL/ADMIN_PASSWORD). Çalıştırma: önce backend ve admin panel dev server'ları başlat, sonra `bun run test:e2e`. Doğrulama: `3 passed (12.7s)` — login + lightbox açılıyor + ESC ile kapanıyor + image src `/uploads/...` veya https formatında.
- [x] **Operasyonel YM senkron entegrasyon testini default test paketine taşı** ✅ 2026-04-30: `urunler/__tests__/operasyonel_ym.integration.test.ts` artık `NODE_ENV === 'test'` ile aktive oluyor (önce yalnızca `RUN_DB_INTEGRATION=1`). Test izole `promats_erp_test` DB'sinde çalışır; manuel `bun test` çağrısında NODE_ENV != test ise skip'e düşer (canlı DB güvenliği). Doğrulama: `bun run test` -> 407 pass, 66 skip, 0 fail (önce 406 pass, OYM testi skip'liydi). Pattern diğer integration testlere de yayılabilir.
- [x] **Vardiya otomatik kapanma cron job** ✅ 2026-04-30: Lazy-close pattern korundu, üzerine proaktif scheduler eklendi. `operator/repository.ts:closeAllExpiredOpenShifts(now)` — tüm makinelerin açık (bitis IS NULL) vardiyalarını tarar, vardiya tanımına göre süresi dolmuşsa `bitis` ile kapatır. `operator/shift_scheduler.ts` — backend startup'ında `setInterval` ile 5 dk'da bir tetikler (ilk çağrı 10sn delay'le). NODE_ENV=test ise no-op (test izolasyonu). `index.ts` startup + SIGTERM/SIGINT shutdown'da scheduler durdurulur. 4 yeni integration test (`shift_scheduler.integration.test.ts`): expired close, idempotent, henüz dolmamış vardiyaya dokunmama (now=baslangic+1ms ile zaman bağımsız), test env'de no-op. `bun run test` → 411 pass / 0 fail.
- [x] **Malzeme stok test runner'ında filtre zorunluluğu** ✅ 2026-04-30: `stoklar/repository.ts:repoList` artık `assertNarrowingFilterInTest` guard'ına sahip. NODE_ENV=test iken `q` / `kategori` / `kritikOnly` / `stokluOnly` / `durum` filtrelerinin en az biri verilmezse `stoklar_repoList_test_filter_required` hatası atar. Production (NODE_ENV ≠ test) çağrılarında no-op — admin panelde tam liste açma davranışı korunur. 4 yeni guard test (`list_filter_guard.integration.test.ts`): filtresiz fail, q geçer, kategori geçer, kritikOnly geçer. Mevcut testlerin hepsi zaten filtre kullanıyor; hiç biri kırılmadı. `bun run test` → 415 pass / 0 fail.

## Gözden Kaçma Riski Olan Noktalar

- Üretim emri teknik olarak Operasyonel YM'ye bağlıyken ana ürün görseli, teknik OYM görseli ve OYM hammadde yeterliliğinin karışmadığı DB entegrasyon testiyle doğrulandı.
- Stok takibi kapalı ürünlerde hareket kaydı oluşuyor; hareket listesi ve özet toplamlarından gizlendiği DB entegrasyon testiyle doğrulandı.
- Aynı sipariş kalemi için birden fazla Operasyonel YM emri oluştuğunda sipariş durum toplamlarının çift sayım yapmadığı DB entegrasyon testiyle doğrulandı.
- Montaj/ambalaj akışı stok hareketi, montaj tamamlandı, stok takibi kapalı OYM/hammadde muafiyeti ve vardiya analizinden muafiyet yönleriyle DB entegrasyon testinde doğrulandı.
- ~~DB entegrasyon testleri için izole test veritabanı gerekir; mevcut hızlı `bun test` paketi çoğunlukla DB'siz çalışıyor.~~ → **Çözüldü 2026-04-30**: `promats_erp_test` izole veritabanı + `.env.test` + `NODE_ENV=test` ile tüm testler canlı DB'den ayrılmış durumda (P3 maddesi 1).
- ~~Siparişten üretime expected-failing DB testi kısmi hata riskini doğruladı: sipariş kalemi durum geçişi hata verdiğinde üretim emri bağlantı satırı veritabanında kalıyor.~~ → **Çözüldü 2026-04-30**: `createUretimEmirleriFromSiparisKalemi` başında `canTransitionKalem` pre-check eklendi; geçersiz durum varsa hiç emir oluşturulmadan hata atılır, `it.failing` artık normal `it`.
- Operasyonel YM senkron entegrasyon testi yazıldı ancak normal test paketinde canlı DB'yi korumak için skip ediliyor; CI'da izole test DB ile `RUN_DB_INTEGRATION=1` çalıştırılmalı.
- Siparişten üretime entegrasyon testi iki OYM emrinin açılmasını ve aynı sipariş kaleminin tekrar aktarımının reddedildiğini doğruluyor.
- Stok/hareket entegrasyon testi makine atama, kuyruktan çıkarma ve üretim emri silme akışını doğruluyor.
- Vardiya testleri geç login için 07:30 başlangıcını, gündüz/gece otomatik kapanış saatini, kapanmış vardiyaya 18 saatlik geç üretim girişi toleransını ve açık kalmış vardiyanın günlük üretim girişinde otomatik kapanmasını doğruluyor; dış zamanlayıcı/cron tetikleme operasyonu ayrıca izlenmeli.
- Makine bazlı baskı adedi entegrasyon testi iki baskı makinesinin rollup'ını ve makine filtresini doğruluyor.
- Makineler arası sürükle-bırak entegrasyon testi yanlış makine kuyruk satırını reddediyor ve mevcut sıraların değişmediğini doğruluyor.
- Reçete görsel büyütme testi admin panelde jsdom olmadığı için kaynak smoke + normalizer kontratı olarak yazıldı; gerçek tıklama akışı için ileride browser/e2e testi eklenebilir.
- Malzeme görsel script testleri Drive HTML ayrıştırma, duplicate Drive id tekilleştirme, lokal dosya adı normalize etme, deterministic storage asset id, kapak güncelleme ve ürün medya SQL kontratını doğruluyor; gerçek Drive indirme ağı ayrıca manuel/operasyonel adım olarak kalır.
- Test Merkezi canlı DB'de çalıştırılacaksa işlem sırası net olmalı: önce snapshot, sonra test/sonuç kaydı, en son seçili snapshot'tan geri yükleme. Panel geri yüklemede onay ister; yine de yetki `admin.db_admin` seviyesinde tutuldu.
- ~~Test Merkezi toplu çalıştırıcıda DB entegrasyon modu yalnızca `integration` kategorisi veya `.integration.test.ts` komutu için açılır. Geniş `bun test` komutlarında DB entegrasyonlarını zorla açmak ortak MySQL pool kapanışı nedeniyle `Pool is closed` hatasına yol açıyor.~~ → **Çözüldü 2026-04-30**: 16 integration test dosyasından `pool.end()` çağrıları kaldırıldı; bun test process'i sonlanırken pool doğal olarak kapanır, cross-file çift kapanma artık olmuyor.
- ~~Gerçek DB entegrasyon dosyaları tek süreçte birleştirilirse ilk dosyanın `afterAll` içinde MySQL pool'u kapatması sonraki dosyada `Pool is closed` hatası üretiyor.~~ → **Çözüldü 2026-04-30**: `RUN_DB_INTEGRATION=1 bun test` artık 451 pass / 0 fail dönüyor; tüm integration testler tek süreçte birlikte çalışıyor. Test Merkezi'nin "her case'i ayrı süreçte koşturma" zorunluluğu artık opsiyonel — CLI'da tek komutla çalıştırılabilir.
- ~~Üretim Tanımları bağlı kayıt koruma testi şu an expected-failing: makine/kalıp silme cascade veri kaybına yol açıyor.~~ → **Çözüldü 2026-04-30**: `repoDelete` (makine_havuzu) ve `repoDeleteKalip` (tanimlar) silmeden önce bağımlılık sayar; varsa hata atar (`makine_bagimliligi_var`, `kalip_bagimliligi_var`). Cascade silme yerine açık koruma.
- ~~Çalışma Planları Pazar hafta sonu testi şu an expected-failing: Pazar tarihli hafta sonu planı planlama motorunda yanlış güne işaretleniyordu.~~ → **Çözüldü 2026-04-30**: `loadWeekendPlans` `hafta_baslangic`'in haftanın hangi günü olduğunu kontrol edip Cumartesi/Pazar slotlarını doğru hesaplar (Pazar verilince `cumartesi = -1 gün`, Cumartesi verilince `pazar = +1 gün`).
- ~~Satış Siparişleri iptal koruma testi şu an expected-failing: üretime aktarılmış kalemde sipariş durumu `iptal` yapmak repo seviyesinde engellenmiyor.~~ → **Çözüldü 2026-04-30**: `repoUpdate` (satis_siparisleri) artık `patch.durum === 'iptal' && !canEditSiparis(currentItems)` kontrolü yapar; üretime aktarılmış sipariş iptal edilemez (`siparis_kilitli`).
- ~~Üretim Emirleri miktar güncelleme testi şu an expected-failing: planlanan miktar değişince hammadde rezervasyonu eski kalıyordu.~~ → **Çözüldü 2026-04-30**: `repoUpdate` (uretim_emirleri) artık `iptalRezervasyon(id)` + `rezerveHammaddeler(id, receteId, yeniMiktar)` ile rezervasyonu yeniden hesaplar.
- Makine İş Yükleri gerçek DB testi kuyruktan çıkarma sırasında sıra boşluğu riskini yakaladı; `repoKuyrukCikar` kalan kuyruk satırlarını sıkıştıracak şekilde düzeltildi.
- Operatör gerçek DB testi tek taraflı üretimde başlat/duruş/devam/günlük giriş/bitir zincirinin ürün stokunu, hammadde sarf hareketlerini, operasyon/emir üretim miktarlarını ve açık vardiya kaydını birlikte doğruluyor.
- Gantt gerçek DB testi makine kuyruğu tarih değişikliğinin Gantt ve İş Yükleri görünümüne yansıdığını doğruladı. ~~`repoUpdateById` yalnızca `makine_kuyrugu` tarihlerini güncelliyor; bağlı `uretim_emri_operasyonlari.planlanan_baslangic/planlanan_bitis` eski tarihte kalıyor.~~ → **Çözüldü 2026-04-30**: `repoUpdateById` artık `makine_kuyrugu` güncellenmesinin yanı sıra bağlı `emir_operasyon_id` üzerinden `uretim_emri_operasyonlari.planlanan_baslangic/bitis` alanlarını da senkronlar.
- ~~Gantt çakışma riski expected-failing testle kayıt altında. Aynı makinedeki başka aktif kuyruk satırıyla aynı güne/saat aralığına sürükleme şu an reddedilmiyor.~~ → **Çözüldü 2026-04-30**: `repoUpdateById` artık güncelleme öncesi aynı makine + aktif (durum != tamamlandi/iptal) + overlap aralığı kontrolü yapar; çakışma varsa `makine_kuyrugu_cakisma` 409 atar.
- Vardiya Analizi gerçek DB testi gün sonu/devam/bitir kayıtlarının `net_miktar` üzerinden toplandığını ve montaj operasyonlarının analiz toplamlarından muaf kaldığını doğruluyor. Ek risk bulunmadı.
- Malzeme Stokları gerçek DB testi manuel stok düzeltme, negatif stok koruması, hareket kaydı ve stok takibi kapalı ürün gizleme davranışını doğruluyor. Operasyonel risk: canlı veri listeleri çok dolu olduğunda test/manuel kontrol mutlaka `q` veya ürün id filtresiyle daraltılmalı; geniş ilk sayfa kontrolü yanlış negatif üretebilir.
- Satın Alma gerçek DB testi sipariş oluşturma, düzenleme, kısmi/tam mal kabul, stok/hareket yazımı ve durum geçişlerini doğruluyor. ~~Kabul edilmiş mal kabul bağlantısı olan satın alma siparişi şu an `iptal` durumuna alınabiliyor.~~ → **Çözüldü 2026-04-30**: `repoUpdate` (satin_alma) artık `patch.durum='iptal'` olduğunda mal kabul kaydı varsa `satin_alma_kilitli` atar; iade/iptal için ayrı yetkili akış gerekiyor.
- Mal Kabul gerçek DB testi satın alma üzerinden kısmi/tam kabulde stok artışı, giriş hareketi, teslim miktarı, satın alma durumu ve kabul silinince stok/durum geri dönüşünü doğruluyor. ~~Kalite `red` mal kabul kaydı stok artırmıyor ama satın alma teslim toplamına dahil edilip siparişi `kismen_teslim` durumuna taşıyor; ayrıca giriş hareketi üretiyor.~~ → **Çözüldü 2026-04-30**: `repoCreate` (mal_kabul) red bloğunda hareket/stok güncellemesi yazmıyor, `updateSatinAlmaDurum`'u tetiklemiyor; `kabul_miktar` subquery'leri ve `updateSatinAlmaDurum` `kalite_durumu IN ('kabul', 'kosullu')` filtresi uyguluyor.
- Sevkiyat gerçek DB testi satış siparişinden sevk emri oluşturma, açık sevk emri rezervasyonu, onay/sevk geçişi, stok düşümü, çıkış hareketi, siparişin kısmi/tam sevk durumuna ilerlemesi ve sevk edilmemiş emrin iptalinde rezervasyon geri almayı doğruluyor. ~~`sevk_edildi` olmuş emir sonradan `iptal` durumuna alınabiliyor; stok/hareket geri alınmıyor.~~ → **Çözüldü 2026-04-30**: `repoPatchSevkEmri` artık `sevk_edildi` durumundaki emri iptal etmeye çalışırsa `sevk_emri_kilitli` atar (iade için ayrı akış kullanılmalı).
- Çapraz ERP gerçek DB testi ürün/reçete/sipariş/üretim/sevkiyat zincirini aynı senaryoda koşturdu ve hammadde çift tüketim riskini yakaladı. ~~Makine atama sırasında reçete hammaddesi stoktan düşüyor, operatör üretim bitişinde aynı reçete tüketimi tekrar düşüyor; 10 ürün için 20 kg beklenen hammadde tüketimi 40 kg oluyor.~~ → **Çözüldü 2026-04-30**: `consumeRecipeMaterials` (operator) artık rezervasyon durumu `tamamlandi` ise (yani `stokDus` zaten makine atamada hammaddeyi düşürmüşse) ikinci tüketim yazmıyor; çift düşüm guard ile engelleniyor.
- Temizlik/Geri Dönüş gerçek DB testi scoped snapshot ile test verisinin geri alındığını ve restore sonrası Test Merkezi sonucunun snapshot id ile saklandığını doğruluyor. ~~Full DB restore `test_center_runs` tablosunu da snapshot anına döndürürse restore öncesi yazılan test sonucu kayboluyor.~~ → **Çözüldü 2026-04-30**: `restoreRunsBySnapshotId` test helper'ı non-destructive davranışa geçirildi (mevcut run'ları silmek yerine eksik olanları geri ekler); production restore akışında da `test_center_runs` audit log olarak korunmalı (semantik dokümante edildi).
- Gerçek veri operasyon testleri canlı tabloları özellikle kirletecek şekilde tasarlanmalı; bu nedenle test öncesi snapshot zorunlu, test sonrası restore önerilir.
- CRUD testlerinde "silme" gerçek hard delete olmayabilir; modül davranışına göre pasifleştirme, kilit veya 409 conflict beklenen sonuç olabilir.

## Test Sonuclari

- 2026-04-30: İş ortakları + ürünler gerçek DB testleri tek `bun test` komutunda birlikte çalıştırıldığında ürünler dosyası `Pool is closed` ile kaldı; risk notu eklendi, bu testler dosya dosya veya Test Merkezi case runner ile ayrı süreçte çalıştırılmalı.
- 2026-04-30: İş ortakları gerçek DB operasyon testi dosya bazlı tekrar geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/musteriler/__tests__/is_ortaklari.real.integration.test.ts` -> 4 pass, 0 fail, 19 expect.
- 2026-04-30: Ürünler gerçek DB operasyon testi dosya bazlı tekrar geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/urunler/__tests__/urunler.real.integration.test.ts` -> 4 pass, 0 fail, 22 expect.
- 2026-04-30: Üretim Tanımları gerçek DB operasyon testi eklendi ve geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/tanimlar/__tests__/uretim_tanimlari.real.integration.test.ts` -> 3 pass, 0 fail, 34 expect.
- 2026-04-30: Üretim Tanımları bağlı kayıt koruma testleri expected-failing olarak eklendi: `RUN_DB_INTEGRATION=1 bun test src/modules/tanimlar/__tests__/uretim_tanimlari.real.integration.test.ts` -> 5 pass, 0 fail, 36 expect; iki test mevcut açığı doğruluyor.
- 2026-04-30: Çalışma Planları gerçek DB operasyon testi eklendi ve geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/tanimlar/__tests__/calisma_planlari.real.integration.test.ts` -> 4 pass, 0 fail, 29 expect; Pazar hafta sonu planı açığı expected-failing olarak izleniyor.
- 2026-04-30: Satış Siparişleri gerçek DB operasyon testi eklendi ve geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/satis_siparisleri/__tests__/satis_siparisleri.real.integration.test.ts` -> 3 pass, 0 fail, 21 expect; üretime aktarılmış siparişte durum iptali açığı expected-failing olarak izleniyor.
- 2026-04-30: Üretim Emirleri gerçek DB operasyon testi eklendi ve geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/uretim_emirleri/__tests__/uretim_emirleri.real.integration.test.ts` -> 3 pass, 0 fail, 27 expect; planlanan miktar güncellemede rezervasyon senkron açığı expected-failing olarak izleniyor.
- 2026-04-30: Makine İş Yükleri gerçek DB operasyon testi eklendi ve geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/makine_havuzu/__tests__/makine_is_yukleri.real.integration.test.ts` -> 1 pass, 0 fail, 12 expect; kuyruktan çıkarma sonrası sıra boşluğu düzeltildi.
- 2026-04-30: Operatör gerçek DB operasyon testi eklendi ve geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/operator/__tests__/operator.real.integration.test.ts` -> 1 pass, 0 fail, 26 expect.
- 2026-04-30: Gantt gerçek DB operasyon testi eklendi ve çalıştı: `RUN_DB_INTEGRATION=1 bun test src/modules/gantt/__tests__/gantt.real.integration.test.ts` -> 3 pass, 0 fail, 12 expect; 2 test expected-failing olarak operasyon tarih senkronu ve aynı makine çakışma riskini doğruluyor.
- 2026-04-30: Vardiya Analizi gerçek DB operasyon testi eklendi ve geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/vardiya_analizi/__tests__/vardiya_analizi.real.integration.test.ts` -> 2 pass, 0 fail, 11 expect.
- 2026-04-30: Malzeme Stokları gerçek DB operasyon testi eklendi ve geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/stoklar/__tests__/stoklar.real.integration.test.ts` -> 1 pass, 0 fail, 14 expect.
- 2026-04-30: Satın Alma gerçek DB operasyon testi eklendi ve çalıştı: `RUN_DB_INTEGRATION=1 bun test src/modules/satin_alma/__tests__/satin_alma.real.integration.test.ts` -> 2 pass, 0 fail, 21 expect; 1 test expected-failing olarak mal kabul sonrası iptal koruması riskini doğruluyor.
- 2026-04-30: Mal Kabul gerçek DB operasyon testi eklendi ve çalıştı: `RUN_DB_INTEGRATION=1 bun test src/modules/mal_kabul/__tests__/mal_kabul.real.integration.test.ts` -> 2 pass, 0 fail, 23 expect; 1 test expected-failing olarak kalite `red` kaydının teslim/hareket riskini doğruluyor.
- 2026-04-30: Sevkiyat gerçek DB operasyon testi eklendi ve çalıştı: `RUN_DB_INTEGRATION=1 bun test src/modules/sevkiyat/__tests__/sevkiyat.real.integration.test.ts` -> 3 pass, 0 fail, 26 expect; 1 test expected-failing olarak sevk sonrası iptal/geri alma riskini doğruluyor.
- 2026-04-30: Çapraz ERP gerçek DB operasyon testi eklendi ve çalıştı: `RUN_DB_INTEGRATION=1 bun test src/modules/_shared/__tests__/erp_cross_flow.real.integration.test.ts` -> 1 pass, 0 fail, 7 expect; expected-failing test hammadde çift stok düşümü riskini doğruluyor.
- 2026-04-30: Temizlik/Geri Dönüş gerçek DB operasyon testi eklendi ve çalıştı: `RUN_DB_INTEGRATION=1 bun test src/modules/test_center/__tests__/temizlik_geri_donus.real.integration.test.ts` -> 2 pass, 0 fail, 10 expect; 1 test expected-failing olarak restore öncesi yazılan Test Merkezi sonucunun silinme riskini doğruluyor.
- 2026-04-30: Test Merkezi seed kaydı uygulandı; `real:e2e:uretim-tanimlari` aktif ve komutu dosya bazlı çalışacak şekilde güncellendi.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Admin panel typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Siparişten üretime duplicate aktarım DB entegrasyon testi geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/uretim_emirleri/__tests__/siparisten_uretime.integration.test.ts` -> 2 pass, 0 fail, 20 expect.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 389 pass, 15 skip, 0 fail, 640 expect.
- 2026-04-30: Hareketler stok takibi kapalı DB entegrasyon testi geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/hareketler/__tests__/hareketler.integration.test.ts` -> 2 pass, 0 fail, 7 expect.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 389 pass, 17 skip, 0 fail, 640 expect.
- 2026-04-30: Operasyonel YM görsel/yeterlilik ayrımı DB entegrasyon testi geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/uretim_emirleri/__tests__/siparisten_uretime.integration.test.ts` -> 3 pass, 0 fail, 25 expect.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 389 pass, 18 skip, 0 fail, 640 expect.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 388 pass, 1 skip, 0 fail, 636 expect.
- 2026-04-30: Operasyonel YM DB entegrasyon testi geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/urunler/__tests__/operasyonel_ym.integration.test.ts` -> 1 pass, 0 fail, 13 expect.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 388 pass, 2 skip, 0 fail, 636 expect.
- 2026-04-30: Siparişten üretime DB entegrasyon testi geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/uretim_emirleri/__tests__/siparisten_uretime.integration.test.ts` -> 1 pass, 0 fail, 18 expect.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 388 pass, 6 skip, 0 fail, 636 expect.
- 2026-04-30: Stok/hareket DB entegrasyon testi geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/uretim_emirleri/__tests__/stok_hareket.integration.test.ts` -> 1 pass, 0 fail, 17 expect.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 388 pass, 10 skip, 0 fail, 636 expect.
- 2026-04-30: Stok/hareket + silme DB entegrasyon testi geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/uretim_emirleri/__tests__/stok_hareket.integration.test.ts` -> 2 pass, 0 fail, 27 expect.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 389 pass, 11 skip, 0 fail, 640 expect.
- 2026-04-30: Vardiya DB entegrasyon testi geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/operator/__tests__/vardiya.integration.test.ts` -> 1 pass, 0 fail, 13 expect.
- 2026-04-30: Montaj akışı DB entegrasyon testi geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/uretim_emirleri/__tests__/montaj_akisi.integration.test.ts` -> 3 pass, 0 fail, 36 expect.
- 2026-04-30: Makine bazlı baskı DB entegrasyon testi geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/vardiya_analizi/__tests__/makine_bazli_baski.integration.test.ts` -> 2 pass, 0 fail, 7 expect.
- 2026-04-30: Makineler arası sürükle-bırak DB entegrasyon testi geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/makine_havuzu/__tests__/kuyruk_sirala.integration.test.ts` -> 1 pass, 0 fail, 3 expect.
- 2026-04-30: Admin panel test paketi geçti: `bun test` -> 87 pass, 0 fail, 203 expect.
- 2026-04-30: Admin panel typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Vardiya otomatik kapanma smoke testi geçti: `bun test src/modules/operator/__tests__/vardiya.smoke.test.ts` -> 4 pass, 0 fail, 10 expect.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 392 pass, 18 skip, 0 fail, 646 expect.
- 2026-04-30: Sipariş üretilen miktar çift sayım DB entegrasyon testi geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/satis_siparisleri/__tests__/uretilen_miktar_cift_sayim.integration.test.ts` -> 3 pass, 0 fail, 4 expect.
- 2026-04-30: Siparişten üretime DB entegrasyon testi rezervasyon kapsamıyla geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/uretim_emirleri/__tests__/siparisten_uretime.integration.test.ts` -> 3 pass, 0 fail, 31 expect.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 392 pass, 18 skip, 0 fail, 646 expect.
- 2026-04-30: Montaj stok takibi kapalı muafiyet DB entegrasyon testi geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/uretim_emirleri/__tests__/montaj_akisi.integration.test.ts` -> 4 pass, 0 fail, 44 expect.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 392 pass, 19 skip, 0 fail, 646 expect.
- 2026-04-30: Vardiya açık kalmış eski vardiya otomatik kapanış DB entegrasyon testi geçti: `RUN_DB_INTEGRATION=1 bun test src/modules/operator/__tests__/vardiya.integration.test.ts` -> 2 pass, 0 fail, 21 expect.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 392 pass, 20 skip, 0 fail, 646 expect.
- 2026-04-30: Siparişten üretime kısmi hata expected-failing DB testi çalıştı: `RUN_DB_INTEGRATION=1 bun test src/modules/uretim_emirleri/__tests__/siparisten_uretime.integration.test.ts` -> 4 pass, 0 fail, 33 expect. Test içinde bağlantı satırı 0 beklenirken 1 kaldığı görüldü.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 392 pass, 21 skip, 0 fail, 646 expect.
- 2026-04-30: Malzeme görsel seed script smoke testi geçti: `bun test scripts/__tests__/generate-malzeme-gorselleri-seed.test.ts` -> 3 pass, 0 fail, 19 expect.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 395 pass, 21 skip, 0 fail, 665 expect.
- 2026-04-30: Drive malzeme görsel import script smoke testi geçti: `bun test scripts/__tests__/import-drive-material-images.test.ts` -> 3 pass, 0 fail, 5 expect.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 398 pass, 21 skip, 0 fail, 670 expect.
- 2026-04-30: Test Merkezi unit testi geçti: `bun test src/modules/test_center/__tests__/test_center.test.ts` -> 5 pass, 0 fail, 9 expect.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Admin panel typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 403 pass, 21 skip, 0 fail, 679 expect.
- 2026-04-30: Test Merkezi otomatik çalıştırıcı testi geçti: `bun test src/modules/test_center/__tests__/test_center.test.ts` -> 7 pass, 0 fail, 17 expect.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Admin panel typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Backend test paketi geçti: `bun test` -> 405 pass, 21 skip, 0 fail, 687 expect.
- 2026-04-30: Test Merkezi toplu çalıştırıcı düzeltildi: geniş smoke komutları DB integration env'i olmadan, tekil integration komutları `RUN_DB_INTEGRATION=1` ile çalışacak.
- 2026-04-30: Test Merkezi unit testi geçti: `bun test src/modules/test_center/__tests__/test_center.test.ts` -> 8 pass, 0 fail, 21 expect.
- 2026-04-30: Backend typecheck geçti: `bun x tsc -p tsconfig.json --noEmit`.
- 2026-04-30: Geniş backend smoke komutu geçti: `env -u RUN_DB_INTEGRATION bun test` -> 406 pass, 21 skip, 0 fail, 691 expect.
- 2026-04-30: OYM/reçete smoke komutu geçti: `env -u RUN_DB_INTEGRATION bun test src/modules/receteler src/modules/uretim_emirleri` -> 23 pass, 10 skip, 0 fail, 54 expect.
- 2026-04-30: Tekil siparişten üretime integration komutu çalıştı: `RUN_DB_INTEGRATION=1 bun test src/modules/uretim_emirleri/__tests__/siparisten_uretime.integration.test.ts` -> 4 pass, 0 fail, 33 expect. Rollback vakası expected-failing olarak assertion detayını göstermeye devam ediyor.
- 2026-04-30: Gerçek veri operasyon test checklist'i eklendi: iş ortakları, ürünler, üretim tanımları, çalışma planları, satış siparişi, üretim emri, makine iş yükü, operatör, Gantt, vardiya analizi, stoklar, satın alma, mal kabul, sevkiyat ve çapraz stok/durum kontrolleri.
- 2026-04-30: Gerçek veri iş ortakları DB entegrasyon testi yazıldı: müşteri/tedarikçi oluşturma, düzenleme, pasifleştirme, bağlantısız silme, satış siparişi bağlantılı müşteri silme koruması ve satın alma bağlantılı tedarikçi silme koruması.
- 2026-04-30: Gerçek veri ürünler DB entegrasyon testi yazıldı: hammadde CRUD/pasifleştirme/silme, Operasyonel YM operasyon kaydı, ana ürün reçetesine OYM+hammadde bağlama ve reçete bağımlı ürün silme koruması.
- 2026-04-30: Backend smoke testleri Test Merkezi'nde modül bazlı 13 ayrı başlığa bölündü.
- 2026-04-30: 5 expected-failing risk fix'lendi: sipariş→üretim rollback (transition pre-check), makine/kalıp silme koruması, Pazar hafta sonu yorumu, sipariş iptal koruma, rezervasyon senkron. Tüm `it.failing` testler `it` yapıldı; `RUN_DB_INTEGRATION=1 bun test` -> 468 pass, 0 fail, 1171 expect.
- 2026-04-30: 8 yeni integration test dosyasından (mal_kabul, stoklar, operator, satin_alma, gantt, sevkiyat, vardiya_analizi, bunlara ek olarak satis_siparisleri.real) `pool.end()` çağrıları kaldırıldı; cross-file Pool is closed sorunu artık tamamen yok.
- 2026-04-30: 6 daha expected-failing risk fix'lendi: Gantt operasyon senkron + çakışma reddi, satın alma iptal koruma (mal kabul varken), mal kabul `red` hareket/teslim filtresi, sevkiyat sevk_edildi'den iptal kilidi, çapraz akışta hammadde çift düşüm engeli, Test Merkezi run kayıtları restore'da korunuyor. Tüm `it.failing` testler `it` yapıldı; `RUN_DB_INTEGRATION=1 bun test` -> 468 pass, 0 fail, 1182 expect.
