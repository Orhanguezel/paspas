-- 211: Uretim emrinin ait oldugu mamul ve uretim tarafi.
-- Idempotent: kolon/index guard'lari INFORMATION_SCHEMA + PREPARE ile yapilir.

SET @mamul_col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'uretim_emirleri'
    AND COLUMN_NAME = 'mamul_urun_id'
);
SET @stmt := IF(
  @mamul_col_exists = 0,
  'ALTER TABLE `uretim_emirleri` ADD COLUMN `mamul_urun_id` char(36) NULL DEFAULT NULL AFTER `urun_id`',
  'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @taraf_col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'uretim_emirleri'
    AND COLUMN_NAME = 'taraf'
);
SET @stmt := IF(
  @taraf_col_exists = 0,
  'ALTER TABLE `uretim_emirleri` ADD COLUMN `taraf` varchar(8) NULL DEFAULT NULL AFTER `mamul_urun_id`',
  'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @mamul_idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'uretim_emirleri'
    AND INDEX_NAME = 'idx_uretim_emri_mamul'
);
SET @stmt := IF(
  @mamul_idx_exists = 0,
  'ALTER TABLE `uretim_emirleri` ADD KEY `idx_uretim_emri_mamul` (`parti_no`, `mamul_urun_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1) Siparis bagindan: emre bagli tum kalemler ayni mamulse guvenle ata.
UPDATE `uretim_emirleri` ue
JOIN (
  SELECT uesk.`uretim_emri_id`, MIN(sk.`urun_id`) AS `mamul_urun_id`
  FROM `uretim_emri_siparis_kalemleri` uesk
  JOIN `siparis_kalemleri` sk ON sk.`id` = uesk.`siparis_kalem_id`
  GROUP BY uesk.`uretim_emri_id`
  HAVING COUNT(DISTINCT sk.`urun_id`) = 1
) aday ON aday.`uretim_emri_id` = ue.`id`
SET ue.`mamul_urun_id` = aday.`mamul_urun_id`
WHERE ue.`mamul_urun_id` IS NULL;

-- 2) Parti ikizinden: ayni partideki cozulmus mamullerden emrin urununu
-- recetesinde kullanan yalniz bir aday varsa ata.
UPDATE `uretim_emirleri` ue
JOIN (
  SELECT eksik.`id` AS `uretim_emri_id`, MIN(cozulmus.`mamul_urun_id`) AS `mamul_urun_id`
  FROM `uretim_emirleri` eksik
  JOIN `uretim_emirleri` cozulmus
    ON cozulmus.`parti_no` = eksik.`parti_no`
   AND cozulmus.`mamul_urun_id` IS NOT NULL
  JOIN `receteler` r ON r.`urun_id` = cozulmus.`mamul_urun_id`
  JOIN `recete_kalemleri` rk
    ON rk.`recete_id` = r.`id`
   AND rk.`urun_id` = eksik.`urun_id`
  WHERE eksik.`mamul_urun_id` IS NULL
    AND eksik.`parti_no` IS NOT NULL
  GROUP BY eksik.`id`
  HAVING COUNT(DISTINCT cozulmus.`mamul_urun_id`) = 1
) aday ON aday.`uretim_emri_id` = ue.`id`
SET ue.`mamul_urun_id` = aday.`mamul_urun_id`
WHERE ue.`mamul_urun_id` IS NULL;

-- 3) Tek tarafli/asıl urun emri kendi mamuludur.
UPDATE `uretim_emirleri` ue
JOIN `urunler` u ON u.`id` = ue.`urun_id`
SET ue.`mamul_urun_id` = ue.`urun_id`
WHERE ue.`mamul_urun_id` IS NULL
  AND u.`kategori` = 'urun';

-- Taraf soneki yalniz eski verinin backfill'i icin kullanilir.
UPDATE `uretim_emirleri` ue
JOIN `urunler` u ON u.`id` = ue.`urun_id`
SET ue.`taraf` = CASE
  WHEN UPPER(u.`kod`) LIKE '%-R' OR UPPER(u.`kod`) LIKE '%-SG' THEN 'sag'
  WHEN UPPER(u.`kod`) LIKE '%-L' OR UPPER(u.`kod`) LIKE '%-SL' THEN 'sol'
  WHEN UPPER(u.`kod`) LIKE '%-X' OR UPPER(u.`kod`) LIKE '%-PR' THEN 'parca'
  ELSE NULL
END
WHERE ue.`taraf` IS NULL;

-- Kalanlar tahmin edilmez. Bu SELECT seed ciktisinda gorunur.
SELECT `emir_no`, `urun_id`, `durum`
FROM `uretim_emirleri`
WHERE `mamul_urun_id` IS NULL;

-- Ancak tum satirlar cozulduyse NOT NULL yap.
SET @mamul_null_count := (
  SELECT COUNT(*) FROM `uretim_emirleri` WHERE `mamul_urun_id` IS NULL
);
SET @mamul_nullable := (
  SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'uretim_emirleri'
    AND COLUMN_NAME = 'mamul_urun_id'
  LIMIT 1
);
SET @stmt := IF(
  @mamul_null_count = 0 AND @mamul_nullable = 'YES',
  'ALTER TABLE `uretim_emirleri` MODIFY COLUMN `mamul_urun_id` char(36) NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
