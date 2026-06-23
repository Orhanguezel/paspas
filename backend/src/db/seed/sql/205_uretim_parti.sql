-- 205: Üretim Parti numarası — bir "Üretime Aktar" işleminde birlikte aktarılan
-- (sipariş + manuel) üretim emirleri tek bir parti numarası altında gruplanır.
-- Ekran gösterimlerinde (Üretim Görüntüle + Üretim Planla) parti bazlı gruplama
-- için kullanılır. İleride aynı gruptan yeni parti açılırsa karışmaz.
--
-- parti_no: insana okunur kod (UP-2026-0001 gibi). NULL = eski/partisiz emirler.
-- Idempotent: INFORMATION_SCHEMA kontrolü ile yalnızca yoksa eklenir.

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'uretim_emirleri'
    AND COLUMN_NAME = 'parti_no'
);

SET @stmt := IF(
  @col_exists = 0,
  'ALTER TABLE `uretim_emirleri` ADD COLUMN `parti_no` varchar(32) NULL DEFAULT NULL AFTER `emir_no`, ADD KEY `idx_uretim_emirleri_parti_no` (`parti_no`)',
  'SELECT 1'
);

PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
