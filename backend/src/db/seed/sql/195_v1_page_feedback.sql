CREATE TABLE IF NOT EXISTS `page_feedback_threads` (
  `id` char(36) NOT NULL,
  `page_path` varchar(512) NOT NULL,
  `page_title` varchar(255) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'open',
  `priority` varchar(32) NOT NULL DEFAULT 'normal',
  `created_by_user_id` char(36) DEFAULT NULL,
  `assigned_to_user_id` char(36) DEFAULT NULL,
  `last_comment_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_page_feedback_page_status` (`page_path`, `status`),
  KEY `idx_page_feedback_status_updated` (`status`, `updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `page_feedback_comments` (
  `id` char(36) NOT NULL,
  `thread_id` char(36) NOT NULL,
  `message_type` varchar(32) NOT NULL DEFAULT 'comment',
  `body` text NOT NULL,
  `attachments` json DEFAULT NULL,
  `created_by_user_id` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_page_feedback_comments_thread` (`thread_id`, `created_at`),
  CONSTRAINT `fk_page_feedback_comments_thread`
    FOREIGN KEY (`thread_id`) REFERENCES `page_feedback_threads` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'page_feedback_comments'
    AND COLUMN_NAME = 'message_type'
);

SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE `page_feedback_comments` ADD COLUMN `message_type` varchar(32) NOT NULL DEFAULT ''comment'' AFTER `thread_id`',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
