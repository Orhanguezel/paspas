CREATE TABLE IF NOT EXISTS `operator_gunluk_kayitlari` (
  `id` char(36) NOT NULL,
  `uretim_emri_id` char(36) NOT NULL,
  `operator_user_id` char(36) DEFAULT NULL,
  `gunluk_durum` varchar(32) NOT NULL DEFAULT 'devam_ediyor',
  `ek_uretim_miktari` decimal(12,4) NOT NULL DEFAULT 0.0000,
  `makine_arizasi` tinyint unsigned NOT NULL DEFAULT 0,
  `durus_nedeni` varchar(255) DEFAULT NULL,
  `notlar` varchar(1000) DEFAULT NULL,
  `kayit_tarihi` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_operator_gunluk_uretim_emri_id` (`uretim_emri_id`),
  KEY `idx_operator_gunluk_gunluk_durum` (`gunluk_durum`),
  KEY `idx_operator_gunluk_kayit_tarihi` (`kayit_tarihi`),
  CONSTRAINT `fk_operator_gunluk_uretim_emri`
    FOREIGN KEY (`uretim_emri_id`) REFERENCES `uretim_emirleri` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
