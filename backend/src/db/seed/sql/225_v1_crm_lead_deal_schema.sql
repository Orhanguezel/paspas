-- CRM V2/6: mevcut teklif talepleriyle birebir CRM lead detayı ve fırsatlar.

CREATE TABLE IF NOT EXISTS `crm_deals` (
  `id` char(36) NOT NULL,
  `pipeline_id` char(36) NOT NULL,
  `stage_id` char(36) NOT NULL,
  `musteri_id` char(36) NULL,
  `talep_id` char(36) NULL,
  `title` varchar(255) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'open',
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `currency` char(3) NOT NULL DEFAULT 'TRY',
  `probability` tinyint unsigned NULL,
  `expected_close_date` date NULL,
  `owner_user_id` char(36) NULL,
  `lost_reason` varchar(500) NULL,
  `source` varchar(64) NULL,
  `raw_data` json NULL,
  `created_by` char(36) NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_crm_deals_talep` (`talep_id`),
  KEY `idx_crm_deals_pipeline_stage` (`pipeline_id`, `stage_id`),
  KEY `idx_crm_deals_owner_status` (`owner_user_id`, `status`),
  KEY `idx_crm_deals_musteri` (`musteri_id`),
  CONSTRAINT `fk_crm_deals_pipeline` FOREIGN KEY (`pipeline_id`) REFERENCES `crm_pipelines` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_crm_deals_stage` FOREIGN KEY (`stage_id`) REFERENCES `crm_stages` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_crm_deals_musteri` FOREIGN KEY (`musteri_id`) REFERENCES `musteriler` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_crm_deals_talep` FOREIGN KEY (`talep_id`) REFERENCES `teklif_talepleri` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_crm_deals_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_crm_deals_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_crm_deals_status` CHECK (`status` IN ('open','won','lost','on_hold','cancelled')),
  CONSTRAINT `chk_crm_deals_probability` CHECK (`probability` IS NULL OR `probability` <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_talep_detaylari` (
  `talep_id` char(36) NOT NULL,
  `source` varchar(64) NOT NULL DEFAULT 'web',
  `channel` varchar(32) NOT NULL DEFAULT 'form',
  `product_interest` json NULL,
  `campaign` varchar(160) NULL,
  `priority` varchar(32) NOT NULL DEFAULT 'normal',
  `owner_user_id` char(36) NULL,
  `donusen_firsat_id` char(36) NULL,
  `converted_at` datetime NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`talep_id`),
  UNIQUE KEY `uq_crm_talep_firsat` (`donusen_firsat_id`),
  KEY `idx_crm_talep_owner_priority` (`owner_user_id`, `priority`),
  CONSTRAINT `fk_crm_talep_detay_talep` FOREIGN KEY (`talep_id`) REFERENCES `teklif_talepleri` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_crm_talep_detay_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_crm_talep_detay_firsat` FOREIGN KEY (`donusen_firsat_id`) REFERENCES `crm_deals` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `crm_talep_detaylari` (`talep_id`, `source`, `channel`, `product_interest`, `owner_user_id`)
SELECT `id`, 'web', 'form', `secili_urunler`, `atanan_user_id` FROM `teklif_talepleri`;

