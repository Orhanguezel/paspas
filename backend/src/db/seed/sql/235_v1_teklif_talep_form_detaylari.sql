SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teklif_talepleri' AND COLUMN_NAME = 'form_detaylari'
);
SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE `teklif_talepleri` ADD COLUMN `form_detaylari` json DEFAULT NULL AFTER `mesaj`',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
