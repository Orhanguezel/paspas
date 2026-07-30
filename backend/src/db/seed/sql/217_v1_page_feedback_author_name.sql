SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'page_feedback_threads'
    AND COLUMN_NAME = 'created_by_name'
);
SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE `page_feedback_threads` ADD COLUMN `created_by_name` varchar(120) DEFAULT NULL AFTER `created_by_user_id`',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'page_feedback_comments'
    AND COLUMN_NAME = 'created_by_name'
);
SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE `page_feedback_comments` ADD COLUMN `created_by_name` varchar(120) DEFAULT NULL AFTER `created_by_user_id`',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
