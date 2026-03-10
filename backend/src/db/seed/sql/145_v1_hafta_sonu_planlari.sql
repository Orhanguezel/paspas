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

-- ============================================================================
-- Varsayılan ayar: Normalde Cumartesi/Pazar çalışılmaz (mevcut sistem davranışı)
-- Örnek demo verisi - geçerli hafta için
-- ============================================================================

-- Pazartesi günü hesaplama helper (bu hafta için)
SET @bugun = CURDATE();
SET @gun_farki = WEEKDAY(@bugun); -- 0=Pazartesi, 6=Pazar
SET @bu_pazartesi = DATE_SUB(@bugun, INTERVAL @gun_farki DAY);
SET @gelecek_pazartesi = DATE_ADD(@bu_pazartesi, INTERVAL 7 DAY);

-- Demo: Bu hafta tüm makineler Cumartesi çalışsın (örnek senaryo)
INSERT INTO `hafta_sonu_planlari` (`id`, `hafta_baslangic`, `makine_id`, `cumartesi_calisir`, `pazar_calisir`, `aciklama`)
SELECT
  LOWER(CONCAT(
    SUBSTR(MD5(CONCAT('hafta-sonu-plan-demo-', @bu_pazartesi)), 1, 8), '-',
    SUBSTR(MD5(CONCAT('hafta-sonu-plan-demo-', @bu_pazartesi)), 9, 4), '-',
    SUBSTR(MD5(CONCAT('hafta-sonu-plan-demo-', @bu_pazartesi)), 13, 4), '-',
    SUBSTR(MD5(CONCAT('hafta-sonu-plan-demo-', @bu_pazartesi)), 17, 4), '-',
    SUBSTR(MD5(CONCAT('hafta-sonu-plan-demo-', @bu_pazartesi)), 21, 12)
  )),
  @bu_pazartesi,
  NULL,
  1,
  0,
  'Demo: Bu hafta Cumartesi çalışılacak'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `hafta_sonu_planlari`
  WHERE `hafta_baslangic` = @bu_pazartesi AND `makine_id` IS NULL
);
