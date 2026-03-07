-- ============================================================================
-- PASPAS ERP V1 — kalip_uyumlu_makineler junction tablosu
-- Hangi kalip hangi makinelerde kullanilabilir
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `kalip_uyumlu_makineler` (
  `id`          char(36) NOT NULL,
  `kalip_id`    char(36) NOT NULL,
  `makine_id`   char(36) NOT NULL,
  `created_at`  datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kalip_makine` (`kalip_id`, `makine_id`),
  KEY `idx_kum_makine` (`makine_id`),
  CONSTRAINT `fk_kum_kalip`
    FOREIGN KEY (`kalip_id`) REFERENCES `kaliplar` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_kum_makine`
    FOREIGN KEY (`makine_id`) REFERENCES `makineler` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ornek kalip-makine uyumluluk verileri
INSERT INTO `kalip_uyumlu_makineler` (`id`, `kalip_id`, `makine_id`)
SELECT
  LOWER(CONCAT(
    SUBSTR(MD5(CONCAT(k.id, '-', m.id)), 1, 8), '-',
    SUBSTR(MD5(CONCAT(k.id, '-', m.id)), 9, 4), '-',
    SUBSTR(MD5(CONCAT(k.id, '-', m.id)), 13, 4), '-',
    SUBSTR(MD5(CONCAT(k.id, '-', m.id)), 17, 4), '-',
    SUBSTR(MD5(CONCAT(k.id, '-', m.id)), 21, 12)
  )),
  k.id,
  m.id
FROM (
  SELECT 'KLP-UNV-3D' AS kalip_kod, 'PRS-01' AS makine_kod
  UNION ALL SELECT 'KLP-UNV-3D', 'PRS-02'
  UNION ALL SELECT 'KLP-UNV-4D', 'PRS-02'
  UNION ALL SELECT 'KLP-UNV-4D', 'PRS-03'
  UNION ALL SELECT 'KLP-UNV-5D', 'PRS-03'
  UNION ALL SELECT 'KLP-UNV-ECO', 'PRS-01'
  UNION ALL SELECT 'KLP-PRS-DSN', 'PRS-01'
  UNION ALL SELECT 'KLP-PRS-DSN', 'PRS-02'
) src
INNER JOIN `kaliplar` k ON k.kod = src.kalip_kod
INNER JOIN `makineler` m ON m.kod = src.makine_kod
LEFT JOIN `kalip_uyumlu_makineler` existing
  ON existing.kalip_id = k.id
 AND existing.makine_id = m.id
WHERE existing.id IS NULL;
