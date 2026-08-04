-- CRM V2/6: çoklu kaynağa bağlanabilen aktivite ve zaman çizelgesi.
CREATE TABLE IF NOT EXISTS `crm_activities` (
  `id` char(36) NOT NULL,
  `ref_type` varchar(32) NULL,
  `ref_id` char(36) NULL,
  `type` varchar(32) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text NULL,
  `result` varchar(500) NULL,
  `next_action_at` datetime NULL,
  `duration_minutes` int unsigned NULL,
  `planned_start_at` datetime NULL,
  `due_at` datetime NULL,
  `done` tinyint unsigned NOT NULL DEFAULT 0,
  `done_at` datetime NULL,
  `owner_user_id` char(36) NULL,
  `created_by` char(36) NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crm_activities_ref_timeline` (`ref_type`, `ref_id`, `created_at`),
  KEY `idx_crm_activities_owner_due` (`owner_user_id`, `done`, `due_at`),
  CONSTRAINT `fk_crm_activities_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_crm_activities_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_crm_activities_type` CHECK (`type` IN ('call','meeting','email','whatsapp','note','task')),
  CONSTRAINT `chk_crm_activities_ref` CHECK ((`ref_type` IS NULL AND `ref_id` IS NULL) OR (`ref_type` IN ('musteri','talep','firsat','teklif','siparis') AND `ref_id` IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

