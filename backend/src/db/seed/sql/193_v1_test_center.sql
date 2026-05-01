CREATE TABLE IF NOT EXISTS `test_center_cases` (
  `id` char(36) NOT NULL,
  `kod` varchar(128) NOT NULL,
  `baslik` varchar(255) NOT NULL,
  `kategori` varchar(64) NOT NULL,
  `kapsam` varchar(32) NOT NULL DEFAULT 'backend',
  `komut` varchar(1000) DEFAULT NULL,
  `dosya_yolu` varchar(1000) DEFAULT NULL,
  `durum` varchar(32) NOT NULL DEFAULT 'active',
  `risk_notu` varchar(1000) DEFAULT NULL,
  `sira` int NOT NULL DEFAULT 0,
  `is_active` tinyint NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_test_center_cases_kod` (`kod`),
  KEY `idx_test_center_cases_kategori` (`kategori`),
  KEY `idx_test_center_cases_active` (`is_active`, `sira`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_center_runs` (
  `id` char(36) NOT NULL,
  `case_id` char(36) DEFAULT NULL,
  `baslik` varchar(255) NOT NULL,
  `komut` varchar(1000) DEFAULT NULL,
  `status` varchar(32) NOT NULL,
  `pass_count` int DEFAULT NULL,
  `fail_count` int DEFAULT NULL,
  `skip_count` int DEFAULT NULL,
  `expect_count` int DEFAULT NULL,
  `output_excerpt` text DEFAULT NULL,
  `risk_notu` varchar(1000) DEFAULT NULL,
  `snapshot_id` varchar(128) DEFAULT NULL,
  `started_at` datetime(3) DEFAULT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `created_by_user_id` char(36) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_test_center_runs_case` (`case_id`, `created_at`),
  KEY `idx_test_center_runs_status` (`status`, `created_at`),
  CONSTRAINT `fk_test_center_runs_case` FOREIGN KEY (`case_id`) REFERENCES `test_center_cases` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `test_center_cases`
  (`id`, `kod`, `baslik`, `kategori`, `kapsam`, `komut`, `dosya_yolu`, `durum`, `risk_notu`, `sira`)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'smoke:backend:all', 'Backend smoke test paketi', 'smoke', 'backend', 'bun test', 'backend', 'active', 'Tüm backend test paketi; canlı DB öncesi snapshot alınmalı.', 10),
  ('00000000-0000-4000-8000-000000000002', 'tsc:backend', 'Backend TypeScript kontrolü', 'typecheck', 'backend', 'bun x tsc -p tsconfig.json --noEmit', 'backend', 'active', 'Derleme sözleşmeleri ve tip kırılmaları için.', 20),
  ('00000000-0000-4000-8000-000000000003', 'smoke:oym', 'Operasyonel YM ve reçete smoke', 'smoke', 'backend', 'bun test src/modules/receteler src/modules/uretim_emirleri', 'backend/src/modules/receteler;backend/src/modules/uretim_emirleri', 'active', 'OYM seçimi, kalıp/makine/operasyon bilgisi ve stok yeterlilik muafiyeti kontrol edilir.', 30),
  ('00000000-0000-4000-8000-000000000004', 'smoke:stok-hareket', 'Stok ve hareket akışı smoke', 'smoke', 'backend', 'bun test src/modules/hareketler src/modules/stoklar', 'backend/src/modules/hareketler;backend/src/modules/stoklar', 'active', 'Stok takibi kapalı ürün hareket üretir; stok/hareket ekranında gizlenir.', 40),
  ('00000000-0000-4000-8000-000000000005', 'integration:siparis-rollback', 'Siparişten üretime rollback kontrolü', 'integration', 'backend', 'bun test src/modules/uretim_emirleri/__tests__/siparisten_uretime.integration.test.ts', 'backend/src/modules/uretim_emirleri/__tests__/siparisten_uretime.integration.test.ts', 'expected_failing', 'Bilinen risk: sipariş kalemi durum geçişi hata verirse üretim emri bağlantısı rollback olmalı.', 50),
  ('00000000-0000-4000-8000-000000000006', 'script:malzeme-gorselleri', 'Malzeme görsel seed/import scriptleri', 'script', 'backend', 'bun test scripts/__tests__/generate-malzeme-gorselleri-seed.test.ts scripts/__tests__/import-drive-material-images.test.ts', 'backend/scripts/__tests__', 'active', 'Drive gerçek ağ erişimi operasyonel kontrolde ayrıca denenmeli.', 60),
  ('00000000-0000-4000-8000-000000000101', 'real:e2e:is-ortaklari', 'Gerçek veri: iş ortakları oluştur/düzenle/sil', 'real-db-e2e', 'backend', 'bun test src/modules/musteriler/__tests__/is_ortaklari.real.integration.test.ts', 'backend/src/modules/musteriler/__tests__/is_ortaklari.real.integration.test.ts', 'active', 'Müşteri ve tedarikçi kayıtları canlı DB üzerinde oluşturulup düzenlenir; bağlantılı müşteri/tedarikçi silme koruması doğrulanır.', 101),
  ('00000000-0000-4000-8000-000000000102', 'real:e2e:urunler', 'Gerçek veri: ürün oluştur/düzenle/sil', 'real-db-e2e', 'backend', 'bun test src/modules/urunler/__tests__/urunler.real.integration.test.ts', 'backend/src/modules/urunler/__tests__/urunler.real.integration.test.ts', 'active', 'Ürün, Operasyonel YM, reçete, stok takibi ve reçete bağımlı silme koruması gerçek kayıtlarda çapraz kontrol edilir.', 102),
  ('00000000-0000-4000-8000-000000000103', 'real:e2e:uretim-tanimlari', 'Gerçek veri: üretim tanımları CRUD', 'real-db-e2e', 'backend', 'bun test src/modules/tanimlar/__tests__/uretim_tanimlari.real.integration.test.ts', 'backend/src/modules/tanimlar/__tests__/uretim_tanimlari.real.integration.test.ts;backend/src/modules/makine_havuzu', 'active', 'Makine, kalıp uyumluluğu, duruş nedeni ve birim ekleme/düzenleme/silme akışları doğrulanır. Bilinen açık: bağlı makine/kalıp silme koruması expected-failing test olarak izleniyor.', 103),
  ('00000000-0000-4000-8000-000000000104', 'real:e2e:calisma-planlari', 'Gerçek veri: çalışma planları CRUD', 'real-db-e2e', 'backend', 'bun test src/modules/tanimlar/__tests__/calisma_planlari.real.integration.test.ts', 'backend/src/modules/tanimlar/__tests__/calisma_planlari.real.integration.test.ts', 'active', 'Vardiya, tatil günü ve hafta sonu planı gerçek kayıtlarla doğrulanır. Bilinen açık: Pazar hafta sonu planı expected-failing test olarak izleniyor.', 104),
  ('00000000-0000-4000-8000-000000000105', 'real:e2e:satis-siparisleri', 'Gerçek veri: satış siparişi oluştur/düzenle/iptal', 'real-db-e2e', 'backend', 'bun test src/modules/satis_siparisleri/__tests__/satis_siparisleri.real.integration.test.ts', 'backend/src/modules/satis_siparisleri/__tests__/satis_siparisleri.real.integration.test.ts', 'active', 'Müşteri, ürün, kalem, özet, liste ve kilitli kalem düzenleme/silme koruması doğrulanır. Bilinen açık: üretime aktarılmış sipariş durum iptali expected-failing test olarak izleniyor.', 105),
  ('00000000-0000-4000-8000-000000000106', 'real:e2e:uretim-emirleri', 'Gerçek veri: üretim emri oluştur/ata/tamamla/sil', 'real-db-e2e', 'backend', 'bun test src/modules/uretim_emirleri/__tests__/uretim_emirleri.real.integration.test.ts', 'backend/src/modules/uretim_emirleri/__tests__/uretim_emirleri.real.integration.test.ts', 'active', 'Satış kaleminden ve manuel üretim emri oluşturma, operasyon/rezervasyon kurma, silince rezervasyon ve sipariş kalemi geri alma doğrulanır. Bilinen açık: miktar güncellemede hammadde rezervasyonu expected-failing test olarak izleniyor.', 106),
  ('00000000-0000-4000-8000-000000000107', 'real:e2e:makine-is-yukleri', 'Gerçek veri: makine iş yükleri ve sıra değişimi', 'real-db-e2e', 'backend', 'bun test src/modules/makine_havuzu/__tests__/makine_is_yukleri.real.integration.test.ts', 'backend/src/modules/makine_havuzu/__tests__/makine_is_yukleri.real.integration.test.ts;backend/src/modules/is_yukler', 'active', 'Makine kuyruğuna atama, sıra değişimi, planlanan tarih üretimi ve kuyruktan çıkarınca stok/rezervasyon geri alma gerçek kayıtlarda doğrulanır.', 107),
  ('00000000-0000-4000-8000-000000000108', 'real:e2e:operator', 'Gerçek veri: operatör üretim ve vardiya akışı', 'real-db-e2e', 'backend', 'bun test src/modules/operator/__tests__/operator.real.integration.test.ts', 'backend/src/modules/operator/__tests__/operator.real.integration.test.ts', 'active', 'Operatör işe başlama, duruş, devam, günlük üretim adedi, işi bitirme ve stok/hareket etkileri gerçek kayıtlarda doğrulanır.', 108),
  ('00000000-0000-4000-8000-000000000109', 'real:e2e:gantt', 'Gerçek veri: Gantt plan değişikliği', 'real-db-e2e', 'backend', 'bun test src/modules/gantt/__tests__/gantt.real.integration.test.ts', 'backend/src/modules/gantt/__tests__/gantt.real.integration.test.ts', 'active', 'Gantt tarih değişikliğinin makine planı ve iş yükü görünümüne yansıması doğrulanır. Bilinen açıklar: operasyon tarih senkronu ve aynı makine çakışma kontrolü expected-failing test olarak izleniyor.', 109),
  ('00000000-0000-4000-8000-000000000110', 'real:e2e:vardiya-analizi', 'Gerçek veri: vardiya analizi rollup', 'real-db-e2e', 'backend', 'bun test src/modules/vardiya_analizi/__tests__/vardiya_analizi.real.integration.test.ts', 'backend/src/modules/vardiya_analizi/__tests__/vardiya_analizi.real.integration.test.ts', 'active', 'Makine bazlı baskı adedi, gün sonu/devam/bitir toplamları ve montaj muafiyeti gerçek kayıtlarla doğrulanır.', 110),
  ('00000000-0000-4000-8000-000000000111', 'real:e2e:stoklar', 'Gerçek veri: stok miktarı ve hareket kontrolü', 'real-db-e2e', 'backend', 'bun test src/modules/stoklar/__tests__/stoklar.real.integration.test.ts', 'backend/src/modules/stoklar/__tests__/stoklar.real.integration.test.ts;backend/src/modules/hareketler', 'active', 'Manuel stok düzeltme, negatif stok koruması, hareket kaydı ve stok takibi kapalı ürünün liste dışı kalması gerçek kayıtlarda doğrulanır.', 111),
  ('00000000-0000-4000-8000-000000000112', 'real:e2e:satin-alma', 'Gerçek veri: satın alma siparişi akışı', 'real-db-e2e', 'backend', 'bun test src/modules/satin_alma/__tests__/satin_alma.real.integration.test.ts', 'backend/src/modules/satin_alma/__tests__/satin_alma.real.integration.test.ts;backend/src/modules/mal_kabul', 'active', 'Tedarikçi, ürün, miktar, kısmi/tam mal kabul ve durum geçişleri doğrulanır. Bilinen açık: mal kabul sonrası iptal koruması expected-failing test olarak izleniyor.', 112),
  ('00000000-0000-4000-8000-000000000113', 'real:e2e:mal-kabul', 'Gerçek veri: mal kabul stok artırımı', 'real-db-e2e', 'backend', 'bun test src/modules/mal_kabul/__tests__/mal_kabul.real.integration.test.ts', 'backend/src/modules/mal_kabul/__tests__/mal_kabul.real.integration.test.ts;backend/src/modules/satin_alma', 'active', 'Satın alma üzerinden kısmi/tam mal kabul, stok artışı, hareket kaydı ve teslim durumu doğrulanır. Bilinen açık: kalite red kayıtlarının teslim toplamı/hareket etkisi expected-failing test olarak izleniyor.', 113),
  ('00000000-0000-4000-8000-000000000114', 'real:e2e:sevkiyat', 'Gerçek veri: sevkiyat stok düşümü', 'real-db-e2e', 'backend', 'bun test src/modules/sevkiyat/__tests__/sevkiyat.real.integration.test.ts', 'backend/src/modules/sevkiyat/__tests__/sevkiyat.real.integration.test.ts;backend/src/modules/satis_siparisleri', 'active', 'Sevk emri oluşturma, rezervasyon, stok düşümü, hareket kaydı, sipariş durumu ve sevk edilmemiş iptal geri alma doğrulanır. Bilinen açık: sevk edilmiş emrin iptali expected-failing test olarak izleniyor.', 114),
  ('00000000-0000-4000-8000-000000000115', 'real:e2e:capraz-kontrol', 'Gerçek veri: çapraz ERP stok/durum zinciri', 'real-db-e2e', 'backend', 'bun test src/modules/_shared/__tests__/erp_cross_flow.real.integration.test.ts', 'backend/src/modules/_shared/__tests__/erp_cross_flow.real.integration.test.ts;backend/src/modules/uretim_emirleri;backend/src/modules/operator;backend/src/modules/sevkiyat', 'expected_failing', 'Ürün, reçete, satış siparişi, üretim, operatör bitiş ve sevkiyat zinciri uçtan uca doğrulanır. Bilinen açık: hammadde stok düşümü makine atama ve operatör bitişinde çift işleniyor.', 115),
  ('00000000-0000-4000-8000-000000000116', 'real:e2e:temizlik-geri-donus', 'Gerçek veri: snapshot temizliği ve geri dönüş', 'real-db-e2e', 'backend', 'bun test src/modules/test_center/__tests__/temizlik_geri_donus.real.integration.test.ts', 'backend/src/modules/test_center/__tests__/temizlik_geri_donus.real.integration.test.ts;backend/src/modules/db_admin', 'expected_failing', 'Scoped snapshot restore test verisini geri alır ve Test Merkezi sonucunu snapshot id ile saklar. Bilinen açık: full restore sonuç kaydı restore öncesi yazılırsa test_center_runs kaydını silebilir.', 116),
  ('00000000-0000-4000-8000-000000000201', 'smoke:backend:auth', 'Backend smoke: auth ve roller', 'smoke', 'backend', 'bun test src/modules/auth src/modules/userRoles', 'backend/src/modules/auth;backend/src/modules/userRoles', 'active', 'Login, signup validasyonu, bearer token ve rol validasyon kontratları ayrı izlenir.', 201),
  ('00000000-0000-4000-8000-000000000202', 'smoke:backend:is-ortaklari', 'Backend smoke: iş ortakları', 'smoke', 'backend', 'bun test src/modules/musteriler src/modules/tedarikci', 'backend/src/modules/musteriler;backend/src/modules/tedarikci', 'active', 'Müşteri ve tedarikçi validasyon/controller smoke testleri.', 202),
  ('00000000-0000-4000-8000-000000000203', 'smoke:backend:urun-recete', 'Backend smoke: ürün ve reçete', 'smoke', 'backend', 'bun test src/modules/urunler src/modules/receteler', 'backend/src/modules/urunler;backend/src/modules/receteler', 'active', 'Ürün, Operasyonel YM ve reçete kontratları ayrı izlenir; DB entegrasyonları bu komutta skip kalır.', 203),
  ('00000000-0000-4000-8000-000000000204', 'smoke:backend:uretim-tanimlari', 'Backend smoke: üretim tanımları', 'smoke', 'backend', 'bun test src/modules/tanimlar src/modules/makine_havuzu', 'backend/src/modules/tanimlar;backend/src/modules/makine_havuzu', 'active', 'Kalıp, vardiya/tatil tanımları ve makine havuzu smoke testleri.', 204),
  ('00000000-0000-4000-8000-000000000205', 'smoke:backend:planlama', 'Backend smoke: planlama ve Gantt', 'smoke', 'backend', 'bun test src/modules/_shared src/modules/gantt src/modules/is_yukler', 'backend/src/modules/_shared;backend/src/modules/gantt;backend/src/modules/is_yukler', 'active', 'Çalışma günü hesapları, Gantt ve iş yükleri validasyonları.', 205),
  ('00000000-0000-4000-8000-000000000206', 'smoke:backend:satis', 'Backend smoke: satış siparişleri', 'smoke', 'backend', 'bun test src/modules/satis_siparisleri', 'backend/src/modules/satis_siparisleri', 'active', 'Satış siparişi validasyon/controller ve çift sayım entegrasyon dosyasının skip davranışı izlenir.', 206),
  ('00000000-0000-4000-8000-000000000207', 'smoke:backend:uretim-emirleri', 'Backend smoke: üretim emirleri', 'smoke', 'backend', 'bun test src/modules/uretim_emirleri', 'backend/src/modules/uretim_emirleri', 'active', 'Üretim emri validasyonları, siparişten üretime smoke ve stok akışı smoke testleri.', 207),
  ('00000000-0000-4000-8000-000000000208', 'smoke:backend:operator-vardiya', 'Backend smoke: operatör ve vardiya', 'smoke', 'backend', 'bun test src/modules/operator src/modules/vardiya_analizi', 'backend/src/modules/operator;backend/src/modules/vardiya_analizi', 'active', 'Operatör işi, vardiya otomatik kapanış ve vardiya analiz rollup smoke testleri.', 208),
  ('00000000-0000-4000-8000-000000000209', 'smoke:backend:stok-hareket', 'Backend smoke: stok ve hareketler', 'smoke', 'backend', 'bun test src/modules/stoklar src/modules/hareketler', 'backend/src/modules/stoklar;backend/src/modules/hareketler', 'active', 'Stok ayarlama, hareket listeleme ve stok takibi kapalı kayıtların skip entegrasyon davranışı.', 209),
  ('00000000-0000-4000-8000-000000000210', 'smoke:backend:satin-alma-mal-kabul', 'Backend smoke: satın alma ve mal kabul', 'smoke', 'backend', 'bun test src/modules/satin_alma src/modules/mal_kabul', 'backend/src/modules/satin_alma;backend/src/modules/mal_kabul', 'active', 'Satın alma ve mal kabul validasyon/controller smoke testleri.', 210),
  ('00000000-0000-4000-8000-000000000211', 'smoke:backend:sevkiyat', 'Backend smoke: sevkiyat', 'smoke', 'backend', 'bun test src/modules/sevkiyat', 'backend/src/modules/sevkiyat', 'active', 'Bekleyen/siparişsiz sevkiyat ve sevk emri validasyon kontratları.', 211),
  ('00000000-0000-4000-8000-000000000212', 'smoke:backend:sistem', 'Backend smoke: sistem modülleri', 'smoke', 'backend', 'bun test src/modules/db_admin src/modules/storage src/modules/siteSettings src/modules/appSettings src/modules/admin_audit src/modules/notifications src/modules/mail src/modules/profiles src/modules/dashboard src/modules/giris_ayarlari src/modules/gorevler', 'backend/src/modules/db_admin;backend/src/modules/storage;backend/src/modules/siteSettings;backend/src/modules/appSettings;backend/src/modules/admin_audit;backend/src/modules/notifications;backend/src/modules/mail;backend/src/modules/profiles;backend/src/modules/dashboard;backend/src/modules/giris_ayarlari;backend/src/modules/gorevler', 'active', 'DB admin, storage, ayarlar, audit, bildirim, mail, profil, dashboard ve görev smoke testleri.', 212),
  ('00000000-0000-4000-8000-000000000213', 'smoke:backend:scripts', 'Backend smoke: script testleri', 'smoke', 'backend', 'bun test scripts/__tests__', 'backend/scripts/__tests__', 'active', 'Malzeme görsel seed/import gibi backend script smoke testleri.', 213);

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/musteriler/__tests__/is_ortaklari.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/musteriler/__tests__/is_ortaklari.real.integration.test.ts',
  `durum` = 'active',
  `risk_notu` = 'Müşteri ve tedarikçi kayıtları canlı DB üzerinde oluşturulup düzenlenir; bağlantılı müşteri/tedarikçi silme koruması doğrulanır.'
WHERE `kod` = 'real:e2e:is-ortaklari';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/urunler/__tests__/urunler.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/urunler/__tests__/urunler.real.integration.test.ts',
  `durum` = 'active',
  `risk_notu` = 'Ürün, Operasyonel YM, reçete, stok takibi ve reçete bağımlı silme koruması gerçek kayıtlarda çapraz kontrol edilir.'
WHERE `kod` = 'real:e2e:urunler';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/tanimlar/__tests__/uretim_tanimlari.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/tanimlar/__tests__/uretim_tanimlari.real.integration.test.ts;backend/src/modules/makine_havuzu',
  `durum` = 'active',
  `risk_notu` = 'Makine, kalıp uyumluluğu, duruş nedeni ve birim ekleme/düzenleme/silme akışları doğrulanır. Bilinen açık: bağlı makine/kalıp silme koruması expected-failing test olarak izleniyor.'
WHERE `kod` = 'real:e2e:uretim-tanimlari';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/tanimlar/__tests__/calisma_planlari.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/tanimlar/__tests__/calisma_planlari.real.integration.test.ts',
  `durum` = 'active',
  `risk_notu` = 'Vardiya, tatil günü ve hafta sonu planı gerçek kayıtlarla doğrulanır. Bilinen açık: Pazar hafta sonu planı expected-failing test olarak izleniyor.'
WHERE `kod` = 'real:e2e:calisma-planlari';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/satis_siparisleri/__tests__/satis_siparisleri.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/satis_siparisleri/__tests__/satis_siparisleri.real.integration.test.ts',
  `durum` = 'active',
  `risk_notu` = 'Müşteri, ürün, kalem, özet, liste ve kilitli kalem düzenleme/silme koruması doğrulanır. Bilinen açık: üretime aktarılmış sipariş durum iptali expected-failing test olarak izleniyor.'
WHERE `kod` = 'real:e2e:satis-siparisleri';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/uretim_emirleri/__tests__/uretim_emirleri.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/uretim_emirleri/__tests__/uretim_emirleri.real.integration.test.ts',
  `durum` = 'active',
  `risk_notu` = 'Satış kaleminden ve manuel üretim emri oluşturma, operasyon/rezervasyon kurma, silince rezervasyon ve sipariş kalemi geri alma doğrulanır. Bilinen açık: miktar güncellemede hammadde rezervasyonu expected-failing test olarak izleniyor.'
WHERE `kod` = 'real:e2e:uretim-emirleri';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/makine_havuzu/__tests__/makine_is_yukleri.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/makine_havuzu/__tests__/makine_is_yukleri.real.integration.test.ts;backend/src/modules/is_yukler',
  `durum` = 'active',
  `risk_notu` = 'Makine kuyruğuna atama, sıra değişimi, planlanan tarih üretimi ve kuyruktan çıkarınca stok/rezervasyon geri alma gerçek kayıtlarda doğrulanır.'
WHERE `kod` = 'real:e2e:makine-is-yukleri';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/operator/__tests__/operator.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/operator/__tests__/operator.real.integration.test.ts',
  `durum` = 'active',
  `risk_notu` = 'Operatör işe başlama, duruş, devam, günlük üretim adedi, işi bitirme ve stok/hareket etkileri gerçek kayıtlarda doğrulanır.'
WHERE `kod` = 'real:e2e:operator';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/gantt/__tests__/gantt.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/gantt/__tests__/gantt.real.integration.test.ts',
  `durum` = 'active',
  `risk_notu` = 'Gantt tarih değişikliğinin makine planı ve iş yükü görünümüne yansıması doğrulanır. Bilinen açıklar: operasyon tarih senkronu ve aynı makine çakışma kontrolü expected-failing test olarak izleniyor.'
WHERE `kod` = 'real:e2e:gantt';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/vardiya_analizi/__tests__/vardiya_analizi.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/vardiya_analizi/__tests__/vardiya_analizi.real.integration.test.ts',
  `durum` = 'active',
  `risk_notu` = 'Makine bazlı baskı adedi, gün sonu/devam/bitir toplamları ve montaj muafiyeti gerçek kayıtlarla doğrulanır.'
WHERE `kod` = 'real:e2e:vardiya-analizi';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/stoklar/__tests__/stoklar.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/stoklar/__tests__/stoklar.real.integration.test.ts;backend/src/modules/hareketler',
  `durum` = 'active',
  `risk_notu` = 'Manuel stok düzeltme, negatif stok koruması, hareket kaydı ve stok takibi kapalı ürünün liste dışı kalması gerçek kayıtlarda doğrulanır.'
WHERE `kod` = 'real:e2e:stoklar';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/satin_alma/__tests__/satin_alma.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/satin_alma/__tests__/satin_alma.real.integration.test.ts;backend/src/modules/mal_kabul',
  `durum` = 'active',
  `risk_notu` = 'Tedarikçi, ürün, miktar, kısmi/tam mal kabul ve durum geçişleri doğrulanır. Bilinen açık: mal kabul sonrası iptal koruması expected-failing test olarak izleniyor.'
WHERE `kod` = 'real:e2e:satin-alma';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/mal_kabul/__tests__/mal_kabul.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/mal_kabul/__tests__/mal_kabul.real.integration.test.ts;backend/src/modules/satin_alma',
  `durum` = 'active',
  `risk_notu` = 'Satın alma üzerinden kısmi/tam mal kabul, stok artışı, hareket kaydı ve teslim durumu doğrulanır. Bilinen açık: kalite red kayıtlarının teslim toplamı/hareket etkisi expected-failing test olarak izleniyor.'
WHERE `kod` = 'real:e2e:mal-kabul';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/sevkiyat/__tests__/sevkiyat.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/sevkiyat/__tests__/sevkiyat.real.integration.test.ts;backend/src/modules/satis_siparisleri',
  `durum` = 'active',
  `risk_notu` = 'Sevk emri oluşturma, rezervasyon, stok düşümü, hareket kaydı, sipariş durumu ve sevk edilmemiş iptal geri alma doğrulanır. Bilinen açık: sevk edilmiş emrin iptali expected-failing test olarak izleniyor.'
WHERE `kod` = 'real:e2e:sevkiyat';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/_shared/__tests__/erp_cross_flow.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/_shared/__tests__/erp_cross_flow.real.integration.test.ts;backend/src/modules/uretim_emirleri;backend/src/modules/operator;backend/src/modules/sevkiyat',
  `durum` = 'expected_failing',
  `risk_notu` = 'Ürün, reçete, satış siparişi, üretim, operatör bitiş ve sevkiyat zinciri uçtan uca doğrulanır. Bilinen açık: hammadde stok düşümü makine atama ve operatör bitişinde çift işleniyor.'
WHERE `kod` = 'real:e2e:capraz-kontrol';

UPDATE `test_center_cases`
SET
  `komut` = 'bun test src/modules/test_center/__tests__/temizlik_geri_donus.real.integration.test.ts',
  `dosya_yolu` = 'backend/src/modules/test_center/__tests__/temizlik_geri_donus.real.integration.test.ts;backend/src/modules/db_admin',
  `durum` = 'expected_failing',
  `risk_notu` = 'Scoped snapshot restore test verisini geri alır ve Test Merkezi sonucunu snapshot id ile saklar. Bilinen açık: full restore sonuç kaydı restore öncesi yazılırsa test_center_runs kaydını silebilir.'
WHERE `kod` = 'real:e2e:temizlik-geri-donus';
