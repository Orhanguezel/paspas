-- ============================================================================
-- PASPAS ERP V1 — urun_birim_donusumleri tablosu
-- Ornek: 1 koli = 6 takim, 1 cuval = 25 kg
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `urun_birim_donusumleri` (
  `id`            char(36) NOT NULL,
  `urun_id`       char(36) NOT NULL,
  `hedef_birim`   varchar(32) NOT NULL,
  `carpan`        decimal(12,4) NOT NULL,
  `created_at`    datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_urun_birim` (`urun_id`, `hedef_birim`),
  CONSTRAINT `fk_birim_don_urun`
    FOREIGN KEY (`urun_id`) REFERENCES `urunler` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ornek donusumler
INSERT INTO `urun_birim_donusumleri` (`id`, `urun_id`, `hedef_birim`, `carpan`)
SELECT
  LOWER(CONCAT(
    SUBSTR(MD5(CONCAT(src.urun_id, '-', src.hedef_birim)), 1, 8), '-',
    SUBSTR(MD5(CONCAT(src.urun_id, '-', src.hedef_birim)), 9, 4), '-',
    SUBSTR(MD5(CONCAT(src.urun_id, '-', src.hedef_birim)), 13, 4), '-',
    SUBSTR(MD5(CONCAT(src.urun_id, '-', src.hedef_birim)), 17, 4), '-',
    SUBSTR(MD5(CONCAT(src.urun_id, '-', src.hedef_birim)), 21, 12)
  )),
  src.urun_id,
  src.hedef_birim,
  src.carpan
FROM (
  SELECT 'u0000001-0000-4000-8000-000000000020' AS urun_id, 'koli' AS hedef_birim, 6.0000 AS carpan
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000021', 'koli', 6.0000
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000030', 'koli', 6.0000
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000040', 'koli', 6.0000
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000050', 'koli', 6.0000
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000060', 'koli', 6.0000
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000070', 'koli', 6.0000
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000080', 'koli', 6.0000
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000090', 'koli', 6.0000
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000001', 'cuval', 25.0000
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000002', 'cuval', 25.0000
) src
ON DUPLICATE KEY UPDATE `carpan` = VALUES(`carpan`);
