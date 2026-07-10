-- 212: Uretim emri - siparis kalemi bagini miktar bazli tahsise cevirir.
-- Idempotent: kolon guard'i INFORMATION_SCHEMA + PREPARE ile yapilir.

SET @miktar_col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'uretim_emri_siparis_kalemleri'
    AND COLUMN_NAME = 'miktar'
);
SET @stmt := IF(
  @miktar_col_exists = 0,
  'ALTER TABLE `uretim_emri_siparis_kalemleri` ADD COLUMN `miktar` decimal(12,4) NOT NULL DEFAULT 0.0000 AFTER `siparis_kalem_id`',
  'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Bir emir birden cok siparis kalemine bagliysa otomatik dagitim yapma.
SELECT uesk.`uretim_emri_id`, COUNT(*) AS `kalem_sayisi`
FROM `uretim_emri_siparis_kalemleri` uesk
GROUP BY uesk.`uretim_emri_id`
HAVING COUNT(*) > 1;

SET @coklu_kalemli_emir_sayisi := (
  SELECT COUNT(*) FROM (
    SELECT `uretim_emri_id`
    FROM `uretim_emri_siparis_kalemleri`
    GROUP BY `uretim_emri_id`
    HAVING COUNT(*) > 1
  ) x
);

-- Cift tarafli mamulde iki bag da korunur; satis tahsisini yalniz grubun
-- deterministik ilk emri tasir. Boylece toplam takim miktari iki kez sayilmaz.
SET @stmt := IF(
  @coklu_kalemli_emir_sayisi = 0,
  'UPDATE `uretim_emri_siparis_kalemleri` uesk
   JOIN `uretim_emirleri` ue ON ue.`id` = uesk.`uretim_emri_id`
   JOIN (
     SELECT uesk2.`siparis_kalem_id`, ue2.`parti_no`, ue2.`mamul_urun_id`, MIN(ue2.`id`) AS `tasiyici_emir_id`
     FROM `uretim_emri_siparis_kalemleri` uesk2
     JOIN `uretim_emirleri` ue2 ON ue2.`id` = uesk2.`uretim_emri_id`
     GROUP BY uesk2.`siparis_kalem_id`, ue2.`parti_no`, ue2.`mamul_urun_id`
   ) tasiyici
     ON tasiyici.`siparis_kalem_id` = uesk.`siparis_kalem_id`
    AND tasiyici.`parti_no` <=> ue.`parti_no`
    AND tasiyici.`mamul_urun_id` = ue.`mamul_urun_id`
   SET uesk.`miktar` = IF(ue.`id` = tasiyici.`tasiyici_emir_id`, ue.`planlanan_miktar`, 0)
   WHERE uesk.`miktar` = 0',
  'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kabul kriteri raporu: bos olmalidir.
SELECT sk.`id` AS `siparis_kalem_id`, sk.`miktar` AS `siparis_miktari`, SUM(uesk.`miktar`) AS `aktarilan_miktar`
FROM `siparis_kalemleri` sk
JOIN `uretim_emri_siparis_kalemleri` uesk ON uesk.`siparis_kalem_id` = sk.`id`
JOIN `uretim_emirleri` ue ON ue.`id` = uesk.`uretim_emri_id` AND ue.`durum` <> 'iptal'
GROUP BY sk.`id`, sk.`miktar`
HAVING SUM(uesk.`miktar`) > sk.`miktar`;
