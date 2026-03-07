-- ============================================================================
-- PASPAS ERP V1 — urun_operasyonlari tablosu
-- Her urunun bir veya iki operasyonu olabilir (tek/cift tarafli)
-- Operasyon: kalip + hazirlik suresi + cevrim suresi + montaj flag
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `urun_operasyonlari` (
  `id`                char(36) NOT NULL,
  `urun_id`           char(36) NOT NULL,
  `sira`              tinyint unsigned NOT NULL DEFAULT 1,
  `operasyon_adi`     varchar(255) NOT NULL,
  `kalip_id`          char(36) DEFAULT NULL,
  `hazirlik_suresi_dk` int unsigned NOT NULL DEFAULT 60,
  `cevrim_suresi_sn`  decimal(10,2) NOT NULL DEFAULT 45.00,
  `montaj`            tinyint unsigned NOT NULL DEFAULT 0,
  `is_active`         tinyint unsigned NOT NULL DEFAULT 1,
  `created_at`        datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_urun_operasyon_sira` (`urun_id`, `sira`),
  KEY `idx_urun_op_kalip` (`kalip_id`),
  CONSTRAINT `fk_urun_op_urun`
    FOREIGN KEY (`urun_id`) REFERENCES `urunler` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_urun_op_kalip`
    FOREIGN KEY (`kalip_id`) REFERENCES `kaliplar` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tek tarafli urunler icin otomatik tek operasyon olustur
-- (kalip/sureler sonra gercek verilerle guncellenecek)
INSERT INTO `urun_operasyonlari` (`id`, `urun_id`, `sira`, `operasyon_adi`, `kalip_id`, `hazirlik_suresi_dk`, `cevrim_suresi_sn`, `montaj`)
SELECT
  LOWER(CONCAT(
    SUBSTR(MD5(CONCAT(u.id, '-op-', 1)), 1, 8), '-',
    SUBSTR(MD5(CONCAT(u.id, '-op-', 1)), 9, 4), '-',
    SUBSTR(MD5(CONCAT(u.id, '-op-', 1)), 13, 4), '-',
    SUBSTR(MD5(CONCAT(u.id, '-op-', 1)), 17, 4), '-',
    SUBSTR(MD5(CONCAT(u.id, '-op-', 1)), 21, 12)
  )),
  u.id, 1,
  u.ad,
  NULL,
  60,
  45.00,
  0
FROM `urunler` u
WHERE u.kategori = 'urun'
  AND u.id NOT IN (SELECT urun_id FROM `urun_operasyonlari`)
ON DUPLICATE KEY UPDATE `operasyon_adi` = VALUES(`operasyon_adi`);
