-- ============================================================================
-- PASPAS ERP — storage_assets schema (minimal)
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `storage_assets` (
  `id`         CHAR(36)        NOT NULL,
  `user_id`    CHAR(36)        DEFAULT NULL,
  `name`       VARCHAR(255)    NOT NULL,
  `bucket`     VARCHAR(64)     NOT NULL,
  `path`       VARCHAR(512)    NOT NULL,
  `folder`     VARCHAR(255)    DEFAULT NULL,
  `mime`       VARCHAR(127)    NOT NULL,
  `size`       BIGINT UNSIGNED NOT NULL,
  `width`      INT UNSIGNED    DEFAULT NULL,
  `height`     INT UNSIGNED    DEFAULT NULL,
  `url`        TEXT            DEFAULT NULL,
  `hash`       VARCHAR(64)     DEFAULT NULL,
  `provider`               VARCHAR(16)  NOT NULL DEFAULT 'local',
  `provider_public_id`     VARCHAR(255) DEFAULT NULL,
  `provider_resource_type` VARCHAR(16)  DEFAULT NULL,
  `provider_format`        VARCHAR(32)  DEFAULT NULL,
  `provider_version`       INT UNSIGNED DEFAULT NULL,
  `etag`                   VARCHAR(64)  DEFAULT NULL,
  `metadata`   JSON            DEFAULT NULL,
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_bucket_path` (`bucket`, `path`),
  KEY `idx_storage_bucket`  (`bucket`),
  KEY `idx_storage_folder`  (`folder`),
  KEY `idx_storage_created` (`created_at`),
  KEY `idx_provider_pubid`  (`provider_public_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
