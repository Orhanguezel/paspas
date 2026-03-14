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

-- Seed verisi kaldirildi: sevkiyat uctan uca kullanici tarafindan olusturulacak
