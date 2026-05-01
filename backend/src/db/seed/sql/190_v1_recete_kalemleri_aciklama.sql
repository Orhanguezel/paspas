SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'recete_kalemleri'
    AND COLUMN_NAME = 'aciklama'
);

SET @stmt := IF(
  @col_exists = 0,
  'ALTER TABLE `recete_kalemleri` ADD COLUMN `aciklama` varchar(500) DEFAULT NULL AFTER `fire_orani`',
  'SELECT 1'
);

PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
