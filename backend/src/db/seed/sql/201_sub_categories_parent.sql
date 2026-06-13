-- 201: sub_categories'e parent_id — urun grubu hiyerarsisi (alt grup destegi).
-- Ornek: "Paspas" grubunun altina "Maximum", "Profesyonel", "Basak" alt gruplari.
-- parent_id NULL => kok grup (mevcut davranis degismez).
-- Idempotent: INFORMATION_SCHEMA kontrolu ile yalnizca yoksa eklenir.

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sub_categories'
    AND COLUMN_NAME = 'parent_id'
);

SET @stmt := IF(
  @col_exists = 0,
  'ALTER TABLE `sub_categories` ADD COLUMN `parent_id` char(36) NULL DEFAULT NULL AFTER `category_id`, ADD KEY `idx_sub_categories_parent` (`parent_id`)',
  'SELECT 1'
);

PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
