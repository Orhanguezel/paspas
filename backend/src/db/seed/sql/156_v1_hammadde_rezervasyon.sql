SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- rezerve_stok kolonu artik 105_urunler_schema.sql'de tanimli
-- Burada sadece hammadde_rezervasyonlari tablosu olusturulur

CREATE TABLE IF NOT EXISTS `hammadde_rezervasyonlari` (
  `id`                char(36)       NOT NULL,
  `uretim_emri_id`    char(36)       NOT NULL,
  `urun_id`           char(36)       NOT NULL COMMENT 'hammadde/yarimamul urun_id',
  `miktar`            decimal(12,4)  NOT NULL DEFAULT 0.0000 COMMENT 'rezerve edilen miktar',
  `durum`             varchar(32)    NOT NULL DEFAULT 'rezerve' COMMENT 'rezerve | tamamlandi | iptal',
  `created_at`        datetime       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        datetime       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rez_uretim_emri` (`uretim_emri_id`),
  KEY `idx_rez_urun` (`urun_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
