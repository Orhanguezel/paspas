-- =============================================================
-- 170_birimler_schema.sql
-- Birim tanımları (adet, kg, metre, vb.)
-- =============================================================

CREATE TABLE IF NOT EXISTS `birimler` (
  `id`         CHAR(36)     NOT NULL,
  `kod`        VARCHAR(32)  NOT NULL,
  `ad`         VARCHAR(64)  NOT NULL,
  `sira`       INT          NOT NULL DEFAULT 0,
  `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `birimler_kod_uq` (`kod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `birimler` (`id`, `kod`, `ad`, `sira`) VALUES
  (UUID(), 'adet',   'Adet',       1),
  (UUID(), 'takim',  'Takım',      2),
  (UUID(), 'kg',     'Kilogram',   3),
  (UUID(), 'gram',   'Gram',       4),
  (UUID(), 'ton',    'Ton',        5),
  (UUID(), 'metre',  'Metre',      6),
  (UUID(), 'm2',     'Metrekare',  7),
  (UUID(), 'litre',  'Litre',      8),
  (UUID(), 'koli',   'Koli',       9),
  (UUID(), 'palet',  'Palet',     10)
ON DUPLICATE KEY UPDATE `ad` = VALUES(`ad`), `sira` = VALUES(`sira`);
