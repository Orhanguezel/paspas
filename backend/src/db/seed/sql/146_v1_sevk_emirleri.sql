-- =============================================
-- 146: Sevk Emirleri tablosu
-- Sevkiyat planlama modülü için
-- =============================================

CREATE TABLE IF NOT EXISTS `sevk_emirleri` (
  `id`                CHAR(36) NOT NULL,
  `sevk_emri_no`      VARCHAR(64) NOT NULL,
  `siparis_id`        CHAR(36) DEFAULT NULL,
  `siparis_kalem_id`  CHAR(36) DEFAULT NULL,
  `musteri_id`        CHAR(36) NOT NULL,
  `urun_id`           CHAR(36) NOT NULL,
  `miktar`            DECIMAL(12,4) NOT NULL,
  `tarih`             DATE NOT NULL,
  `durum`             VARCHAR(32) NOT NULL DEFAULT 'bekliyor',
  `operator_onay`     TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  `notlar`            VARCHAR(500) DEFAULT NULL,
  `created_by`        CHAR(36) DEFAULT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sevk_emri_no` (`sevk_emri_no`),
  KEY `idx_sevk_emirleri_musteri` (`musteri_id`),
  KEY `idx_sevk_emirleri_urun` (`urun_id`),
  KEY `idx_sevk_emirleri_siparis` (`siparis_id`),
  KEY `idx_sevk_emirleri_durum` (`durum`),
  CONSTRAINT `fk_sevk_emirleri_musteri` FOREIGN KEY (`musteri_id`) REFERENCES `musteriler` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_sevk_emirleri_urun` FOREIGN KEY (`urun_id`) REFERENCES `urunler` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_sevk_emirleri_siparis` FOREIGN KEY (`siparis_id`) REFERENCES `satis_siparisleri` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sevk_emirleri_siparis_kalem` FOREIGN KEY (`siparis_kalem_id`) REFERENCES `siparis_kalemleri` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `sevk_emirleri`
(`id`, `sevk_emri_no`, `siparis_id`, `siparis_kalem_id`, `musteri_id`, `urun_id`, `miktar`, `tarih`, `durum`, `operator_onay`, `notlar`, `created_by`)
VALUES
('se000001-0000-4000-8000-000000000001', 'SVK-001', 's0000001-0000-4000-8000-000000000001', 'sk000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 'u0000001-0000-4000-8000-000000000020', 40.0000, '2026-03-08', 'bekliyor', 0, 'İstanbul bayisi için ilk kısmi sevk planı.', NULL),
('se000001-0000-4000-8000-000000000002', 'SVK-002', 's0000001-0000-4000-8000-000000000002', 'sk000001-0000-4000-8000-000000000004', 'c0000001-0000-4000-8000-000000000002', 'u0000001-0000-4000-8000-000000000060', 25.0000, '2026-03-09', 'onaylandi', 1, 'Star Plus sevkiyat hazırlığı tamamlandı.', NULL)
ON DUPLICATE KEY UPDATE
  `siparis_id` = VALUES(`siparis_id`),
  `siparis_kalem_id` = VALUES(`siparis_kalem_id`),
  `musteri_id` = VALUES(`musteri_id`),
  `urun_id` = VALUES(`urun_id`),
  `miktar` = VALUES(`miktar`),
  `tarih` = VALUES(`tarih`),
  `durum` = VALUES(`durum`),
  `operator_onay` = VALUES(`operator_onay`),
  `notlar` = VALUES(`notlar`),
  `created_by` = VALUES(`created_by`);
