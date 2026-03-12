-- ============================================================================
-- PASPAS ERP V1 — uretim_emri_siparis_kalemleri junction table
-- Bir uretim emrine birden cok siparis kalemi baglayabilmek icin
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `uretim_emri_siparis_kalemleri` (
  `id` char(36) NOT NULL,
  `uretim_emri_id` char(36) NOT NULL,
  `siparis_kalem_id` char(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_uesk_emri_kalem` (`uretim_emri_id`, `siparis_kalem_id`),
  KEY `idx_uesk_uretim_emri_id` (`uretim_emri_id`),
  KEY `idx_uesk_siparis_kalem_id` (`siparis_kalem_id`),
  CONSTRAINT `fk_uesk_uretim_emri`
    FOREIGN KEY (`uretim_emri_id`) REFERENCES `uretim_emirleri` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_uesk_siparis_kalem`
    FOREIGN KEY (`siparis_kalem_id`) REFERENCES `siparis_kalemleri` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Junction seed data kaldirildi — uretim emirleri UI'dan olusturulur
