-- ============================================================================
-- PASPAS ERP V1 — Operator modulu yeni tablolar
-- vardiya_kayitlari, durus_kayitlari
-- operator_gunluk_kayitlari genisletme
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ============================================================================
-- 1) VARDIYA KAYITLARI
-- Operatorun vardiya basi/sonu kaydi
-- ============================================================================
CREATE TABLE IF NOT EXISTS `vardiya_kayitlari` (
  `id`                char(36) NOT NULL,
  `makine_id`         char(36) NOT NULL,
  `operator_user_id`  char(36) DEFAULT NULL,
  `vardiya_tipi`      varchar(16) NOT NULL DEFAULT 'gunduz',
  `baslangic`         datetime NOT NULL,
  `bitis`             datetime DEFAULT NULL,
  `notlar`            varchar(500) DEFAULT NULL,
  `created_at`        datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vardiya_makine` (`makine_id`),
  KEY `idx_vardiya_baslangic` (`baslangic`),
  CONSTRAINT `fk_vardiya_makine`
    FOREIGN KEY (`makine_id`) REFERENCES `makineler` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2) DURUS KAYITLARI
-- Makine arizalari ve planlanmamis duruslar
-- ============================================================================
CREATE TABLE IF NOT EXISTS `durus_kayitlari` (
  `id`                char(36) NOT NULL,
  `makine_id`         char(36) NOT NULL,
  `makine_kuyruk_id`  char(36) DEFAULT NULL,
  `operator_user_id`  char(36) DEFAULT NULL,
  `durus_tipi`        varchar(32) NOT NULL DEFAULT 'ariza',
  `neden`             varchar(255) NOT NULL,
  `baslangic`         datetime NOT NULL,
  `bitis`             datetime DEFAULT NULL,
  `sure_dk`           int unsigned DEFAULT NULL,
  `created_at`        datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_durus_makine` (`makine_id`),
  KEY `idx_durus_baslangic` (`baslangic`),
  CONSTRAINT `fk_durus_makine`
    FOREIGN KEY (`makine_id`) REFERENCES `makineler` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3) operator_gunluk_kayitlari genisletme
-- makine_id, fire_miktari, net_miktar
-- ============================================================================
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'operator_gunluk_kayitlari' AND COLUMN_NAME = 'makine_id');
SET @s := IF(@col = 0, 'ALTER TABLE `operator_gunluk_kayitlari` ADD COLUMN `makine_id` char(36) DEFAULT NULL AFTER `uretim_emri_id`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'operator_gunluk_kayitlari' AND COLUMN_NAME = 'emir_operasyon_id');
SET @s := IF(@col = 0, 'ALTER TABLE `operator_gunluk_kayitlari` ADD COLUMN `emir_operasyon_id` char(36) DEFAULT NULL AFTER `makine_id`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'operator_gunluk_kayitlari' AND COLUMN_NAME = 'fire_miktari');
SET @s := IF(@col = 0, 'ALTER TABLE `operator_gunluk_kayitlari` ADD COLUMN `fire_miktari` decimal(12,4) NOT NULL DEFAULT 0.0000 AFTER `ek_uretim_miktari`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'operator_gunluk_kayitlari' AND COLUMN_NAME = 'net_miktar');
SET @s := IF(@col = 0, 'ALTER TABLE `operator_gunluk_kayitlari` ADD COLUMN `net_miktar` decimal(12,4) NOT NULL DEFAULT 0.0000 AFTER `fire_miktari`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'operator_gunluk_kayitlari' AND COLUMN_NAME = 'birim_tipi');
SET @s := IF(@col = 0, 'ALTER TABLE `operator_gunluk_kayitlari` ADD COLUMN `birim_tipi` varchar(16) NOT NULL DEFAULT ''adet'' AFTER `net_miktar`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- 4) SEVKIYATLAR
-- ============================================================================
CREATE TABLE IF NOT EXISTS `sevkiyatlar` (
  `id`                char(36) NOT NULL,
  `sevk_no`           varchar(64) NOT NULL,
  `operator_user_id`  char(36) DEFAULT NULL,
  `sevk_tarihi`       datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notlar`            varchar(500) DEFAULT NULL,
  `created_at`        datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sevkiyat_no` (`sevk_no`),
  KEY `idx_sevk_tarih` (`sevk_tarihi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sevkiyat_kalemleri` (
  `id`              char(36) NOT NULL,
  `sevkiyat_id`     char(36) NOT NULL,
  `musteri_id`      char(36) NOT NULL,
  `siparis_id`      char(36) DEFAULT NULL,
  `siparis_kalem_id` char(36) DEFAULT NULL,
  `urun_id`         char(36) NOT NULL,
  `miktar`          decimal(12,4) NOT NULL,
  `birim`           varchar(16) NOT NULL DEFAULT 'adet',
  `created_at`      datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sevk_kalem_sevkiyat` (`sevkiyat_id`),
  KEY `idx_sevk_kalem_musteri` (`musteri_id`),
  KEY `idx_sevk_kalem_urun` (`urun_id`),
  CONSTRAINT `fk_sevk_kalem_sevkiyat`
    FOREIGN KEY (`sevkiyat_id`) REFERENCES `sevkiyatlar` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sevk_kalem_musteri`
    FOREIGN KEY (`musteri_id`) REFERENCES `musteriler` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_sevk_kalem_urun`
    FOREIGN KEY (`urun_id`) REFERENCES `urunler` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5) MAL KABUL KAYITLARI
-- ============================================================================
CREATE TABLE IF NOT EXISTS `mal_kabul_kayitlari` (
  `id`                    char(36) NOT NULL,
  `satin_alma_siparis_id` char(36) NOT NULL,
  `satin_alma_kalem_id`   char(36) NOT NULL,
  `urun_id`               char(36) NOT NULL,
  `gelen_miktar`          decimal(12,4) NOT NULL,
  `operator_user_id`      char(36) DEFAULT NULL,
  `kabul_tarihi`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notlar`                varchar(500) DEFAULT NULL,
  `created_at`            datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mk_siparis` (`satin_alma_siparis_id`),
  KEY `idx_mk_kalem` (`satin_alma_kalem_id`),
  KEY `idx_mk_urun` (`urun_id`),
  KEY `idx_mk_tarih` (`kabul_tarihi`),
  CONSTRAINT `fk_mk_siparis`
    FOREIGN KEY (`satin_alma_siparis_id`) REFERENCES `satin_alma_siparisleri` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mk_kalem`
    FOREIGN KEY (`satin_alma_kalem_id`) REFERENCES `satin_alma_kalemleri` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mk_urun`
    FOREIGN KEY (`urun_id`) REFERENCES `urunler` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
