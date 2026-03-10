-- =============================================================
-- 149_v1_sub_categories.sql — Alt kategoriler (urun grubu)
-- =============================================================

CREATE TABLE IF NOT EXISTS `sub_categories` (
  `id`                CHAR(36)     NOT NULL,
  `category_id`       CHAR(36)     NOT NULL,
  `name`              VARCHAR(255) NOT NULL,
  `slug`              VARCHAR(255) NOT NULL,
  `description`       TEXT         DEFAULT NULL,
  `image_url`         LONGTEXT     DEFAULT NULL,
  `storage_asset_id`  CHAR(36)     DEFAULT NULL,
  `alt`               VARCHAR(255) DEFAULT NULL,
  `icon`              VARCHAR(100) DEFAULT NULL,
  `is_active`         TINYINT      NOT NULL DEFAULT 1,
  `is_featured`       TINYINT      NOT NULL DEFAULT 0,
  `has_cart`          TINYINT      NOT NULL DEFAULT 1,
  `display_order`     INT          NOT NULL DEFAULT 0,
  `created_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sub_categories_slug_uq` (`slug`),
  KEY `sub_categories_category_idx` (`category_id`),
  KEY `sub_categories_active_idx` (`is_active`),
  KEY `sub_categories_order_idx` (`display_order`),
  CONSTRAINT `fk_sub_categories_category` FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sub_categories_asset` FOREIGN KEY (`storage_asset_id`)
    REFERENCES `storage_assets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Demo alt kategoriler (urun gruplari)
INSERT IGNORE INTO `sub_categories` (`id`, `category_id`, `name`, `slug`, `display_order`)
SELECT UUID(), c.id, 'Paspas', 'paspas', 10
FROM `categories` c WHERE c.kod = 'urun'
LIMIT 1;

INSERT IGNORE INTO `sub_categories` (`id`, `category_id`, `name`, `slug`, `display_order`)
SELECT UUID(), c.id, 'Başak Plus', 'basak-plus', 20
FROM `categories` c WHERE c.kod = 'urun'
LIMIT 1;

INSERT IGNORE INTO `sub_categories` (`id`, `category_id`, `name`, `slug`, `display_order`)
SELECT UUID(), c.id, 'Kalip Parcasi', 'kalip-parcasi', 20
FROM `categories` c WHERE c.kod = 'yarimamul'
LIMIT 1;

INSERT IGNORE INTO `sub_categories` (`id`, `category_id`, `name`, `slug`, `display_order`)
SELECT UUID(), c.id, 'Granul', 'granul', 10
FROM `categories` c WHERE c.kod = 'hammadde'
LIMIT 1;

INSERT IGNORE INTO `sub_categories` (`id`, `category_id`, `name`, `slug`, `display_order`)
SELECT UUID(), c.id, 'Boya', 'boya', 20
FROM `categories` c WHERE c.kod = 'hammadde'
LIMIT 1;
