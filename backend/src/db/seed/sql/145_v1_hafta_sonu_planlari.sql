-- ============================================================================
-- PASPAS ERP V1 — Hafta Sonu Çalışma Planları (Faz 6 — Tatil Genişletme)
-- Rev1 Talebi: Haftalık bazda Cumartesi/Pazar çalışma planı + makine bazlı
-- ============================================================================

CREATE TABLE IF NOT EXISTS `hafta_sonu_planlari` (
  `id` char(36) NOT NULL,
  `hafta_baslangic` date NOT NULL COMMENT 'Haftanın Pazartesi günü',
  `makine_id` char(36) DEFAULT NULL COMMENT 'NULL ise tüm makineler için geçerli',
  `cumartesi_calisir` tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT '1=Çalışır, 0=Tatil',
  `pazar_calisir` tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT '1=Çalışır, 0=Tatil',
  `aciklama` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_hafta_sonu_plan_hafta_makine` (`hafta_baslangic`, `makine_id`),
  KEY `idx_hafta_sonu_plan_hafta` (`hafta_baslangic`),
  KEY `idx_hafta_sonu_plan_makine` (`makine_id`),
  CONSTRAINT `fk_hafta_sonu_plan_makine`
    FOREIGN KEY (`makine_id`)
    REFERENCES `makineler` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan: Tablo boş — hafta sonu çalışma planları UI üzerinden girilir.
-- Kayıt yoksa tüm günler tatil sayılır (cumartesi_calisir=0, pazar_calisir=0).
