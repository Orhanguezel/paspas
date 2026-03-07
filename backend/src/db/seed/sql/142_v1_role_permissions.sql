CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` char(36) NOT NULL,
  `role` enum('admin','sevkiyatci','operator','satin_almaci','moderator','seller','user') NOT NULL DEFAULT 'operator',
  `permission_key` varchar(128) NOT NULL,
  `is_allowed` tinyint NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_role_key_unique` (`role`,`permission_key`),
  KEY `role_permissions_role_idx` (`role`),
  KEY `role_permissions_permission_key_idx` (`permission_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
