-- 204: sevk_emirleri'ne otomatik sevk emri izleme alanlari (V4-3 / Yükle-Sevket).
-- Uretim bitince siparis-bagli urunler icin otomatik "bekliyor" sevk emri olusur.
--  * otomatik_olusturuldu: elle mi otomatik mi olusturuldu (filtre/rozet icin)
--  * kaynak_uretim_emri_id: hangi uretim emrinden dogdu (ayni uretimden tekrar
--    olusturmayi engellemek + izlenebilirlik icin)
-- Planlanan sevk tarihi mevcut `tarih` kolonunda tutulur (24:00 kurali ile hesaplanir).
-- Idempotent: INFORMATION_SCHEMA kontrollu, ALTER yalnizca yoksa.

SET @c1 := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sevk_emirleri' AND COLUMN_NAME = 'otomatik_olusturuldu');
SET @s1 := IF(@c1 = 0,
  'ALTER TABLE `sevk_emirleri` ADD COLUMN `otomatik_olusturuldu` tinyint(1) NOT NULL DEFAULT 0 AFTER `operator_onay`',
  'SELECT 1');
PREPARE st FROM @s1; EXECUTE st; DEALLOCATE PREPARE st;

SET @c2 := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sevk_emirleri' AND COLUMN_NAME = 'kaynak_uretim_emri_id');
SET @s2 := IF(@c2 = 0,
  'ALTER TABLE `sevk_emirleri` ADD COLUMN `kaynak_uretim_emri_id` char(36) NULL DEFAULT NULL AFTER `otomatik_olusturuldu`, ADD KEY `idx_sevk_kaynak_uretim` (`kaynak_uretim_emri_id`)',
  'SELECT 1');
PREPARE st FROM @s2; EXECUTE st; DEALLOCATE PREPARE st;
