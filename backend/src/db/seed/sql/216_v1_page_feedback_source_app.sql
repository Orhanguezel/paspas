SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'page_feedback_threads'
    AND COLUMN_NAME = 'source_app'
);
SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE `page_feedback_threads` ADD COLUMN `source_app` varchar(32) NOT NULL DEFAULT ''paspas'' AFTER `page_title`',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'page_feedback_threads'
    AND INDEX_NAME = 'idx_page_feedback_source_app'
);
SET @ddl := IF(
  @idx_exists = 0,
  'ALTER TABLE `page_feedback_threads` ADD INDEX `idx_page_feedback_source_app` (`source_app`, `updated_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
