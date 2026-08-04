-- 243: Teklif kabul/red kararlarını değişmez geçmiş olarak saklar.
CREATE TABLE IF NOT EXISTS `teklif_kararlari` (
  `id` char(36) NOT NULL,
  `teklif_id` char(36) NOT NULL,
  `karar` varchar(16) NOT NULL,
  `neden` varchar(500) NULL,
  `created_by` char(36) NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teklif_karar` (`teklif_id`,`created_at`),
  CONSTRAINT `fk_teklif_karar_teklif` FOREIGN KEY (`teklif_id`) REFERENCES `teklifler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_teklif_karar_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
