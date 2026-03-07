-- ============================================================================
-- PASPAS ERP V1 — urun_operasyon_makineleri junction tablosu
-- Her urun operasyonuna birden fazla makine atanabilir (oncelik sirasi ile)
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `urun_operasyon_makineleri` (
  `id`                  char(36) NOT NULL,
  `urun_operasyon_id`   char(36) NOT NULL,
  `makine_id`           char(36) NOT NULL,
  `oncelik_sira`        tinyint unsigned NOT NULL DEFAULT 1,
  `created_at`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_op_makine` (`urun_operasyon_id`, `makine_id`),
  KEY `idx_op_makine_makine` (`makine_id`),
  CONSTRAINT `fk_op_makine_op`
    FOREIGN KEY (`urun_operasyon_id`) REFERENCES `urun_operasyonlari` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_op_makine_makine`
    FOREIGN KEY (`makine_id`) REFERENCES `makineler` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Demo seed: urun operasyonlarina makine atamalari
INSERT INTO `urun_operasyon_makineleri` (`id`, `urun_operasyon_id`, `makine_id`, `oncelik_sira`)
SELECT
  LOWER(CONCAT(
    SUBSTR(MD5(CONCAT(uo.id, '-', m.id)), 1, 8), '-',
    SUBSTR(MD5(CONCAT(uo.id, '-', m.id)), 9, 4), '-',
    SUBSTR(MD5(CONCAT(uo.id, '-', m.id)), 13, 4), '-',
    SUBSTR(MD5(CONCAT(uo.id, '-', m.id)), 17, 4), '-',
    SUBSTR(MD5(CONCAT(uo.id, '-', m.id)), 21, 12)
  )),
  uo.id,
  m.id,
  sub.oncelik
FROM (
  -- Basak Plus 3D Siyah → 1. tercih Pres 1, 2. tercih Pres 2
  SELECT 'u0000001-0000-4000-8000-000000000020' AS urun_id, 1 AS sira, 'PRS-01' AS makine_kod, 1 AS oncelik
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000020', 1, 'PRS-02', 2
  -- Basak Plus 3D Gri → 1. tercih Pres 1, 2. tercih Pres 2
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000021', 1, 'PRS-01', 1
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000021', 1, 'PRS-02', 2
  -- Orbital 4D Siyah → 1. tercih Pres 2, 2. tercih Pres 3
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000030', 1, 'PRS-02', 1
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000030', 1, 'PRS-03', 2
  -- Orbital 4D Gri → 1. tercih Pres 2, 2. tercih Pres 3
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000031', 1, 'PRS-02', 1
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000031', 1, 'PRS-03', 2
  -- Pars Siyah → 1. tercih Pres 1, 2. tercih Pres 2
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000040', 1, 'PRS-01', 1
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000040', 1, 'PRS-02', 2
  -- Maximum 5D Siyah → sadece Pres 3
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000070', 1, 'PRS-03', 1
  -- Tuna Siyah (Ekonomik) → sadece Pres 1
  UNION ALL SELECT 'u0000001-0000-4000-8000-000000000090', 1, 'PRS-01', 1
) sub
INNER JOIN `urun_operasyonlari` uo ON uo.urun_id = sub.urun_id AND uo.sira = sub.sira
INNER JOIN `makineler` m ON m.kod = sub.makine_kod
LEFT JOIN `urun_operasyon_makineleri` existing ON existing.urun_operasyon_id = uo.id AND existing.makine_id = m.id
WHERE existing.id IS NULL;
