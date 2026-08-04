-- CRM V2/6: çoklu satış pipeline'ı ve yönetilebilir aşamalar.
-- CREATE/INSERT-only; canlıda --no-drop ile güvenle uygulanır.

CREATE TABLE IF NOT EXISTS `crm_pipelines` (
  `id` char(36) NOT NULL,
  `name` varchar(160) NOT NULL,
  `is_default` tinyint unsigned NOT NULL DEFAULT 0,
  `sort` int unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_crm_pipelines_name` (`name`),
  KEY `idx_crm_pipelines_default_sort` (`is_default`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_stages` (
  `id` char(36) NOT NULL,
  `pipeline_id` char(36) NOT NULL,
  `name` varchar(160) NOT NULL,
  `sort` int unsigned NOT NULL DEFAULT 0,
  `probability` tinyint unsigned NOT NULL DEFAULT 0,
  `is_won` tinyint unsigned NOT NULL DEFAULT 0,
  `is_lost` tinyint unsigned NOT NULL DEFAULT 0,
  `renk` varchar(16) NULL,
  `beklemede_uyari_gun` smallint unsigned NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_crm_stages_pipeline_name` (`pipeline_id`, `name`),
  KEY `idx_crm_stages_pipeline_sort` (`pipeline_id`, `sort`),
  CONSTRAINT `fk_crm_stages_pipeline`
    FOREIGN KEY (`pipeline_id`) REFERENCES `crm_pipelines` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_crm_stages_probability` CHECK (`probability` <= 100),
  CONSTRAINT `chk_crm_stages_terminal` CHECK (NOT (`is_won` = 1 AND `is_lost` = 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `crm_pipelines` (`id`, `name`, `is_default`, `sort`)
VALUES ('10000000-0000-4000-8000-000000000001', 'Promats Satış Pipeline', 1, 10)
ON DUPLICATE KEY UPDATE `is_default` = 1, `sort` = 10;

INSERT INTO `crm_stages`
  (`id`, `pipeline_id`, `name`, `sort`, `probability`, `is_won`, `is_lost`, `renk`, `beklemede_uyari_gun`)
VALUES
  ('11000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Yeni Talep',           10,   5, 0, 0, '#64748b', 2),
  ('11000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'İlk Görüşme',          20,  15, 0, 0, '#0ea5e9', 3),
  ('11000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'İhtiyaç Belirlendi',    30,  30, 0, 0, '#06b6d4', 5),
  ('11000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Ürünler Belirlendi',     40,  45, 0, 0, '#8b5cf6', 5),
  ('11000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'Teklif Hazırlanıyor',    50,  55, 0, 0, '#a855f7', 3),
  ('11000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'Teklif Gönderildi',      60,  65, 0, 0, '#f59e0b', 4),
  ('11000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 'Pazarlık',               70,  75, 0, 0, '#f97316', 7),
  ('11000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', 'Sipariş Bekleniyor',     80,  90, 0, 0, '#eab308', 5),
  ('11000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000001', 'Kazanıldı',              90, 100, 1, 0, '#22c55e', NULL),
  ('11000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', 'Kaybedildi',            100,   0, 0, 1, '#ef4444', NULL)
ON DUPLICATE KEY UPDATE
  `sort` = VALUES(`sort`),
  `probability` = VALUES(`probability`),
  `is_won` = VALUES(`is_won`),
  `is_lost` = VALUES(`is_lost`),
  `renk` = VALUES(`renk`),
  `beklemede_uyari_gun` = VALUES(`beklemede_uyari_gun`);

