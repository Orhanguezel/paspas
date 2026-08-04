-- CRM V2/6: idempotent hatırlatma ve gönderim durumu.
CREATE TABLE IF NOT EXISTS `crm_reminders` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `source_type` varchar(32) NOT NULL,
  `source_id` char(36) NOT NULL,
  `remind_at` datetime NOT NULL,
  `channel` varchar(16) NOT NULL DEFAULT 'app',
  `title` varchar(255) NOT NULL,
  `message` varchar(1000) NOT NULL,
  `status` varchar(24) NOT NULL DEFAULT 'pending',
  `idempotency_key` varchar(190) NOT NULL,
  `sent_at` datetime NULL,
  `error_message` varchar(1000) NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_crm_reminders_idempotency` (`idempotency_key`),
  KEY `idx_crm_reminders_due` (`status`, `remind_at`),
  KEY `idx_crm_reminders_user` (`user_id`, `status`, `remind_at`),
  CONSTRAINT `fk_crm_reminders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_crm_reminders_channel` CHECK (`channel` IN ('app','email')),
  CONSTRAINT `chk_crm_reminders_status` CHECK (`status` IN ('pending','processing','sent','failed','cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

