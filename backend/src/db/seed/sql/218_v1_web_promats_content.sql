CREATE TABLE IF NOT EXISTS `web_promats_languages` (
  `id` int NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `name` varchar(100) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `culture_code` varchar(16) NOT NULL,
  `locale` varchar(8) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_web_promats_languages_locale` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `web_promats_menu_items` (
  `id` int NOT NULL,
  `language_id` int NOT NULL,
  `source_language_id` int NOT NULL DEFAULT 0,
  `sort_order` int NOT NULL DEFAULT 0,
  `position` int NOT NULL DEFAULT 0,
  `original_title` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `url` varchar(500) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0,
  `target` tinyint(1) NOT NULL DEFAULT 0,
  `edited_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_web_promats_menu_lang_pos` (`language_id`, `position`, `sort_order`),
  CONSTRAINT `fk_web_promats_menu_language`
    FOREIGN KEY (`language_id`) REFERENCES `web_promats_languages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `web_promats_static_texts` (
  `id` int NOT NULL,
  `language_id` int NOT NULL,
  `source_language_id` int NOT NULL DEFAULT 0,
  `original_text` mediumtext,
  `title` mediumtext,
  `status` tinyint(1) NOT NULL DEFAULT 0,
  `edited_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_web_promats_static_texts_language` (`language_id`),
  CONSTRAINT `fk_web_promats_static_texts_language`
    FOREIGN KEY (`language_id`) REFERENCES `web_promats_languages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `web_promats_special_pages` (
  `id` int NOT NULL,
  `language_id` int NOT NULL,
  `source_language_id` int NOT NULL DEFAULT 0,
  `sort_order` int NOT NULL DEFAULT 0,
  `position` int NOT NULL DEFAULT 0,
  `original_title` varchar(255) DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `detail` mediumtext,
  `url` varchar(500) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `hit` int NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_web_promats_pages_lang_pos` (`language_id`, `position`, `sort_order`),
  KEY `idx_web_promats_pages_slug` (`slug`),
  CONSTRAINT `fk_web_promats_pages_language`
    FOREIGN KEY (`language_id`) REFERENCES `web_promats_languages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `web_promats_special_page_gallery` (
  `id` int NOT NULL,
  `language_id` int NOT NULL,
  `source_language_id` int NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `special_page_id` int NOT NULL,
  `image` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_web_promats_gallery_page` (`special_page_id`, `sort_order`),
  CONSTRAINT `fk_web_promats_gallery_page`
    FOREIGN KEY (`special_page_id`) REFERENCES `web_promats_special_pages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_web_promats_gallery_language`
    FOREIGN KEY (`language_id`) REFERENCES `web_promats_languages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `web_promats_products` (
  `id` int NOT NULL,
  `language_id` int NOT NULL,
  `source_language_id` int NOT NULL DEFAULT 0,
  `sort_order` int NOT NULL DEFAULT 0,
  `name` varchar(255) NOT NULL,
  `s1_1_text` mediumtext,
  `s1_2_text` mediumtext,
  `s1_3_text` mediumtext,
  `s1_4_image` varchar(500) DEFAULT NULL,
  `s2_1_image` varchar(500) DEFAULT NULL,
  `s2_2_text` mediumtext,
  `s2_3_text` mediumtext,
  `s2_4_text` mediumtext,
  `s2_5_text` mediumtext,
  `s3_1_image` varchar(500) DEFAULT NULL,
  `s3_2_image` varchar(500) DEFAULT NULL,
  `s4_1_image` varchar(500) DEFAULT NULL,
  `s5_1_text` varchar(255) DEFAULT NULL,
  `s5_2_text` varchar(255) DEFAULT NULL,
  `s5_3_text` varchar(255) DEFAULT NULL,
  `s5_4_text` varchar(255) DEFAULT NULL,
  `s5_5_text` varchar(255) DEFAULT NULL,
  `slug` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_web_promats_products_lang_sort` (`language_id`, `sort_order`),
  KEY `idx_web_promats_products_slug` (`slug`),
  CONSTRAINT `fk_web_promats_products_language`
    FOREIGN KEY (`language_id`) REFERENCES `web_promats_languages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `web_promats_product_features` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `type` tinyint(1) NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `image` varchar(500) DEFAULT NULL,
  `feature` varchar(500) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_web_promats_features_product` (`product_id`, `type`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `web_promats_articles` (
  `id` int unsigned NOT NULL,
  `language_id` int NOT NULL DEFAULT 1,
  `source_language_id` int NOT NULL DEFAULT 0,
  `sort_order` int NOT NULL DEFAULT 0,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` text,
  `content` mediumtext,
  `image` varchar(500) DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` varchar(500) DEFAULT NULL,
  `hit` int NOT NULL DEFAULT 0,
  `status` tinyint NOT NULL DEFAULT 0,
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_web_promats_articles_lang_status` (`language_id`, `status`),
  KEY `idx_web_promats_articles_slug` (`slug`),
  CONSTRAINT `fk_web_promats_articles_language`
    FOREIGN KEY (`language_id`) REFERENCES `web_promats_languages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `web_promats_home_sections` (
  `id` varchar(64) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `label` varchar(255) NOT NULL,
  `component_key` varchar(100) NOT NULL,
  `order_index` int unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint unsigned NOT NULL DEFAULT 1,
  `config` json DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_web_promats_home_slug` (`slug`),
  KEY `idx_web_promats_home_order` (`order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
