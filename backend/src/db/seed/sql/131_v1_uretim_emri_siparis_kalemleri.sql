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

-- ============================================================================
-- Junction table seed data
-- Her uretim emrini ilgili siparis kalem(ler)ine bagla
-- ============================================================================
-- Eslestirme:
--   UE-0001 (u020 Basak Plus 3D Siyah)  → sk001 (SS-0001 Istanbul)
--   UE-0002 (u021 Basak Plus 3D Gri)    → sk002 (SS-0001 Istanbul)
--   UE-0003 (u040 Pars Siyah)           → sk003 (SS-0001 Istanbul)
--   UE-0004 (u090 Tuna Siyah)           → sk005 (SS-0002 Ankara)
--   UE-0005 (u030 Orbital 4D Siyah)     → sk006 (SS-0002 Ankara, 50 ad) + sk008 (SS-0003 Al-Rashid, 120 ad) — MULTI-SIPARIS
--   UE-0006 (u070 Maximum 5D Siyah)     → sk007 (SS-0003 Al-Rashid)
--   UE-0007 (u060 Star Plus Siyah)      → sk004 (SS-0002 Ankara)  — repurposed from Orbital duplicate
-- ============================================================================
INSERT INTO `uretim_emri_siparis_kalemleri` (`id`, `uretim_emri_id`, `siparis_kalem_id`)
SELECT
  LOWER(CONCAT(
    SUBSTR(MD5(CONCAT('uesk:', ue.id, ':', sk.id)), 1, 8), '-',
    SUBSTR(MD5(CONCAT('uesk:', ue.id, ':', sk.id)), 9, 4), '-',
    SUBSTR(MD5(CONCAT('uesk:', ue.id, ':', sk.id)), 13, 4), '-',
    SUBSTR(MD5(CONCAT('uesk:', ue.id, ':', sk.id)), 17, 4), '-',
    SUBSTR(MD5(CONCAT('uesk:', ue.id, ':', sk.id)), 21, 12)
  )) AS id,
  ue.id AS uretim_emri_id,
  sk.id AS siparis_kalem_id
FROM (
  SELECT 'UE-2026-0001' AS emir_no, 'SS-2026-0001' AS siparis_no, 'BP-3D-SYH' AS urun_kod
  UNION ALL SELECT 'UE-2026-0002', 'SS-2026-0001', 'BP-3D-GRI'
  UNION ALL SELECT 'UE-2026-0003', 'SS-2026-0001', 'PRS-SYH'
  UNION ALL SELECT 'UE-2026-0004', 'SS-2026-0002', 'TUN-SYH'
  UNION ALL SELECT 'UE-2026-0005', 'SS-2026-0002', 'ORB-4D-SYH'
  UNION ALL SELECT 'UE-2026-0005', 'SS-2026-0003', 'ORB-4D-SYH'
  UNION ALL SELECT 'UE-2026-0006', 'SS-2026-0003', 'MAX-5D-SYH'
  UNION ALL SELECT 'UE-2026-0007', 'SS-2026-0002', 'STP-SYH'
) AS src
INNER JOIN `uretim_emirleri` ue
  ON ue.`emir_no` = src.`emir_no`
INNER JOIN `satis_siparisleri` ss
  ON ss.`siparis_no` = src.`siparis_no`
INNER JOIN `urunler` u
  ON u.`kod` = src.`urun_kod`
INNER JOIN `siparis_kalemleri` sk
  ON sk.`siparis_id` = ss.`id`
 AND sk.`urun_id` = u.`id`
ON DUPLICATE KEY UPDATE `siparis_kalem_id` = VALUES(`siparis_kalem_id`);

-- ============================================================================
-- UE-0005: multi-siparis — Orbital 4D Siyah (Ankara 50 + Al-Rashid 120 = 170 adet)
-- Planlanan miktari guncelle
-- ============================================================================
UPDATE `uretim_emirleri` SET
  `planlanan_miktar` = 170.0000,
  `siparis_id` = NULL
WHERE `emir_no` = 'UE-2026-0005';

-- ============================================================================
-- UE-0007: Star Plus Siyah (Ankara) olarak guncelle (eski: Orbital 4D duplicate)
-- ============================================================================
UPDATE `uretim_emirleri` ue
INNER JOIN `urunler` u
  ON u.`kod` = 'STP-SYH'
INNER JOIN `receteler` r
  ON r.`kod` = 'RCT-STP-SYH'
INNER JOIN `satis_siparisleri` ss
  ON ss.`siparis_no` = 'SS-2026-0002'
SET
  ue.`urun_id`           = u.`id`,
  ue.`recete_id`         = r.`id`,
  ue.`siparis_id`        = ss.`id`,
  ue.`planlanan_miktar`  = 100.0000,
  ue.`uretilen_miktar`   = 0.0000,
  ue.`baslangic_tarihi`  = '2026-03-08',
  ue.`bitis_tarihi`      = '2026-03-20',
  ue.`durum`             = 'planlandi'
WHERE ue.`emir_no` = 'UE-2026-0007';
