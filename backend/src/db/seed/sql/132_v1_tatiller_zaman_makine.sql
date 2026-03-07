-- ============================================================================
-- PASPAS ERP V1 — Tatiller için zaman aralığı ve etkilenen makine desteği
-- ============================================================================

-- Add baslangic_saati if not exists
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'tatiller'
    AND column_name = 'baslangic_saati'
);
SET @sql_add_bas := IF(@col_exists = 0,
  'ALTER TABLE `tatiller` ADD COLUMN `baslangic_saati` varchar(5) NULL AFTER `tarih`',
  'SELECT 1'
);
PREPARE stmt_add_bas FROM @sql_add_bas;
EXECUTE stmt_add_bas;
DEALLOCATE PREPARE stmt_add_bas;

-- Add bitis_saati if not exists
SET @col_exists2 := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'tatiller'
    AND column_name = 'bitis_saati'
);
SET @sql_add_bit := IF(@col_exists2 = 0,
  'ALTER TABLE `tatiller` ADD COLUMN `bitis_saati` varchar(5) NULL AFTER `baslangic_saati`',
  'SELECT 1'
);
PREPARE stmt_add_bit FROM @sql_add_bit;
EXECUTE stmt_add_bit;
DEALLOCATE PREPARE stmt_add_bit;

UPDATE `tatiller`
SET
  `baslangic_saati` = COALESCE(`baslangic_saati`, '00:00'),
  `bitis_saati` = COALESCE(`bitis_saati`, '23:59')
WHERE `baslangic_saati` IS NULL OR `bitis_saati` IS NULL;

ALTER TABLE `tatiller`
  MODIFY COLUMN `baslangic_saati` varchar(5) NOT NULL,
  MODIFY COLUMN `bitis_saati` varchar(5) NOT NULL;

SET @drop_tatil_unique := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'tatiller'
        AND index_name = 'uq_tatiller_tarih'
    ),
    'ALTER TABLE `tatiller` DROP INDEX `uq_tatiller_tarih`',
    'SELECT 1'
  )
);
PREPARE stmt_drop_tatil_unique FROM @drop_tatil_unique;
EXECUTE stmt_drop_tatil_unique;
DEALLOCATE PREPARE stmt_drop_tatil_unique;

SET @add_tatil_unique := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'tatiller'
        AND index_name = 'uq_tatiller_tarih_saatleri'
    ),
    'SELECT 1',
    'ALTER TABLE `tatiller` ADD UNIQUE KEY `uq_tatiller_tarih_saatleri` (`tarih`, `baslangic_saati`, `bitis_saati`)'
  )
);
PREPARE stmt_add_tatil_unique FROM @add_tatil_unique;
EXECUTE stmt_add_tatil_unique;
DEALLOCATE PREPARE stmt_add_tatil_unique;

CREATE TABLE IF NOT EXISTS `tatil_makineler` (
  `id` char(36) NOT NULL,
  `tatil_id` char(36) NOT NULL,
  `makine_id` char(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tatil_makineler_tatil_makine` (`tatil_id`, `makine_id`),
  KEY `idx_tatil_makineler_makine` (`makine_id`),
  CONSTRAINT `fk_tatil_makineler_tatil`
    FOREIGN KEY (`tatil_id`) REFERENCES `tatiller` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_tatil_makineler_makine`
    FOREIGN KEY (`makine_id`) REFERENCES `makineler` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tatil_makineler` (`id`, `tatil_id`, `makine_id`)
SELECT
  LOWER(CONCAT(
    SUBSTR(MD5(CONCAT(t.id, '-', m.id)), 1, 8), '-',
    SUBSTR(MD5(CONCAT(t.id, '-', m.id)), 9, 4), '-',
    SUBSTR(MD5(CONCAT(t.id, '-', m.id)), 13, 4), '-',
    SUBSTR(MD5(CONCAT(t.id, '-', m.id)), 17, 4), '-',
    SUBSTR(MD5(CONCAT(t.id, '-', m.id)), 21, 12)
  )) AS id,
  t.id,
  m.id
FROM `tatiller` t
INNER JOIN `makineler` m ON m.is_active = 1
LEFT JOIN `tatil_makineler` tm
  ON tm.tatil_id = t.id
 AND tm.makine_id = m.id
WHERE tm.id IS NULL;
