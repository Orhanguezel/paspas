-- ============================================================================
-- PASPAS ERP V1 — uretim_emri_operasyonlari tablosu
-- Uretim emri operasyon bazli detay: her emir 1-2 operasyona sahip
-- makine_kuyrugu artik bu tabloya referans verir
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- uretim_emirleri tablosuna termin_tarihi ekle (siparis termini veya manuel)
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'uretim_emirleri' AND COLUMN_NAME = 'termin_tarihi');
SET @s := IF(@col = 0, 'ALTER TABLE `uretim_emirleri` ADD COLUMN `termin_tarihi` date DEFAULT NULL AFTER `bitis_tarihi`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- uretim_emirleri: durum enum genisletme (mevcut veriler uyumlu kalacak)
-- Yeni durumlar: makineye_atandi, durakladi, kismi_tamamlandi, kapatildi

CREATE TABLE IF NOT EXISTS `uretim_emri_operasyonlari` (
  `id`                  char(36) NOT NULL,
  `uretim_emri_id`      char(36) NOT NULL,
  `urun_operasyon_id`   char(36) DEFAULT NULL,
  `sira`                tinyint unsigned NOT NULL DEFAULT 1,
  `operasyon_adi`       varchar(255) NOT NULL,
  `kalip_id`            char(36) DEFAULT NULL,
  `makine_id`           char(36) DEFAULT NULL,
  `hazirlik_suresi_dk`  int unsigned NOT NULL DEFAULT 60,
  `cevrim_suresi_sn`    decimal(10,2) NOT NULL DEFAULT 45.00,
  `planlanan_miktar`    decimal(12,4) NOT NULL DEFAULT 0.0000,
  `uretilen_miktar`     decimal(12,4) NOT NULL DEFAULT 0.0000,
  `fire_miktar`         decimal(12,4) NOT NULL DEFAULT 0.0000,
  `montaj`              tinyint unsigned NOT NULL DEFAULT 0,
  `montaj_makine_id`    char(36) DEFAULT NULL,
  `planlanan_baslangic` datetime DEFAULT NULL,
  `planlanan_bitis`     datetime DEFAULT NULL,
  `gercek_baslangic`    datetime DEFAULT NULL,
  `gercek_bitis`        datetime DEFAULT NULL,
  `durum`               varchar(32) NOT NULL DEFAULT 'bekliyor',
  `created_at`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_emir_op_sira` (`uretim_emri_id`, `sira`),
  KEY `idx_emir_op_makine` (`makine_id`),
  KEY `idx_emir_op_kalip` (`kalip_id`),
  KEY `idx_emir_op_durum` (`durum`),
  CONSTRAINT `fk_emir_op_emir`
    FOREIGN KEY (`uretim_emri_id`) REFERENCES `uretim_emirleri` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_emir_op_kalip`
    FOREIGN KEY (`kalip_id`) REFERENCES `kaliplar` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_emir_op_makine`
    FOREIGN KEY (`makine_id`) REFERENCES `makineler` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_emir_op_montaj_makine`
    FOREIGN KEY (`montaj_makine_id`) REFERENCES `makineler` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- makine_kuyrugu tablosuna emir_operasyon_id ekle
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'makine_kuyrugu' AND COLUMN_NAME = 'emir_operasyon_id');
SET @s := IF(@col = 0, 'ALTER TABLE `makine_kuyrugu` ADD COLUMN `emir_operasyon_id` char(36) DEFAULT NULL AFTER `uretim_emri_id`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- makine_kuyrugu: hazirlik_suresi_dk
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'makine_kuyrugu' AND COLUMN_NAME = 'hazirlik_suresi_dk');
SET @s := IF(@col = 0, 'ALTER TABLE `makine_kuyrugu` ADD COLUMN `hazirlik_suresi_dk` int unsigned NOT NULL DEFAULT 0 AFTER `planlanan_sure_dk`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- makine_kuyrugu: planlanan_baslangic / planlanan_bitis
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'makine_kuyrugu' AND COLUMN_NAME = 'planlanan_baslangic');
SET @s := IF(@col = 0, 'ALTER TABLE `makine_kuyrugu` ADD COLUMN `planlanan_baslangic` datetime DEFAULT NULL AFTER `hazirlik_suresi_dk`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'makine_kuyrugu' AND COLUMN_NAME = 'planlanan_bitis');
SET @s := IF(@col = 0, 'ALTER TABLE `makine_kuyrugu` ADD COLUMN `planlanan_bitis` datetime DEFAULT NULL AFTER `planlanan_baslangic`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- makine_kuyrugu: gercek_baslangic / gercek_bitis
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'makine_kuyrugu' AND COLUMN_NAME = 'gercek_baslangic');
SET @s := IF(@col = 0, 'ALTER TABLE `makine_kuyrugu` ADD COLUMN `gercek_baslangic` datetime DEFAULT NULL AFTER `planlanan_bitis`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'makine_kuyrugu' AND COLUMN_NAME = 'gercek_bitis');
SET @s := IF(@col = 0, 'ALTER TABLE `makine_kuyrugu` ADD COLUMN `gercek_bitis` datetime DEFAULT NULL AFTER `gercek_baslangic`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
