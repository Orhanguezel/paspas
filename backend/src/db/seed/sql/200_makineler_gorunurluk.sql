SET @operator_col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'makineler'
    AND COLUMN_NAME = 'operator_de_goster'
);

SET @operator_stmt := IF(
  @operator_col_exists = 0,
  'ALTER TABLE `makineler` ADD COLUMN `operator_de_goster` tinyint(1) NOT NULL DEFAULT 1 AFTER `calisir_24_saat`',
  'SELECT 1'
);

PREPARE stmt FROM @operator_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @is_yukleri_col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'makineler'
    AND COLUMN_NAME = 'is_yuklerinde_goster'
);

SET @is_yukleri_stmt := IF(
  @is_yukleri_col_exists = 0,
  'ALTER TABLE `makineler` ADD COLUMN `is_yuklerinde_goster` tinyint(1) NOT NULL DEFAULT 1 AFTER `operator_de_goster`',
  'SELECT 1'
);

PREPARE stmt FROM @is_yukleri_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
