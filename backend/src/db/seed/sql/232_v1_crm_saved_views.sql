-- CRM V2/6: kullanıcıya özel fırsat ve aktivite görünümleri.
CREATE TABLE IF NOT EXISTS `crm_saved_views` (
 `id` char(36) NOT NULL,`user_id` char(36) NOT NULL,`view_type` varchar(24) NOT NULL,`name` varchar(160) NOT NULL,`filters` json NOT NULL,`is_default` tinyint unsigned NOT NULL DEFAULT 0,`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY(`id`),UNIQUE KEY `uq_crm_saved_view_name`(`user_id`,`view_type`,`name`),KEY `idx_crm_saved_view_owner`(`user_id`,`view_type`,`is_default`,`updated_at`),
 CONSTRAINT `fk_crm_saved_view_user` FOREIGN KEY(`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT `chk_crm_saved_view_type` CHECK(`view_type` IN ('deals','activities'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
