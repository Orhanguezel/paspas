-- 208: Makine gosterim sirasi
-- Operator ekrani ve Makine Is Yukleri icin deterministik is akisi sirasi.
-- Idempotent: INFORMATION_SCHEMA kontrolu ile kolon yoksa eklenir.

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'makineler'
    AND COLUMN_NAME = 'gosterim_sira'
);

SET @stmt := IF(
  @col_exists = 0,
  'ALTER TABLE `makineler` ADD COLUMN `gosterim_sira` int unsigned NOT NULL DEFAULT 999 AFTER `is_yuklerinde_goster`, ADD KEY `idx_makineler_gosterim_sira` (`gosterim_sira`, `kod`)',
  'SELECT 1'
);

PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Gerçek makine kayıtları: kod='Enjeksiyon 1'/'Enjeksiyon 2'/'Ekstrüzyon'
-- (ad = '900 T (ÖN)'/'900 T (ARKA)'/'Ekstrüzyon Hattı 1 (PVC)'). Hem kod hem
-- olası eski kodlar (ENJ-01/EKS-) hem ad kalıpları kapsanır — deterministik.
UPDATE `makineler`
SET `gosterim_sira` = CASE
  WHEN LOWER(`kod`) LIKE 'enjeksiyon%1%' OR `kod` = 'ENJ-01' OR LOWER(`ad`) LIKE '%enjeksiyon%1%' OR LOWER(`ad`) LIKE '%haitian ma 2%' THEN 1
  WHEN LOWER(`kod`) LIKE 'enjeksiyon%2%' OR `kod` = 'ENJ-02' OR LOWER(`ad`) LIKE '%enjeksiyon%2%' OR LOWER(`ad`) LIKE '%haitian ma 5%' THEN 2
  WHEN LOWER(`kod`) LIKE '%ekstr%' OR `kod` LIKE 'EKS-%' OR LOWER(`ad`) LIKE '%ekstr%' THEN 3
  ELSE 999
END;
