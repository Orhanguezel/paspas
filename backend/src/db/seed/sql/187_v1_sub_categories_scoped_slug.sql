-- =============================================================
-- 187_v1_sub_categories_scoped_slug.sql
-- Alt kategori slug tekilliğini kategori bazına taşır
-- Aynı slug farklı ana kategoriler altında kullanılabilir
-- =============================================================

SET @has_old_slug_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sub_categories'
    AND INDEX_NAME = 'sub_categories_slug_uq'
);

SET @sql := IF(
  @has_old_slug_idx > 0,
  'ALTER TABLE `sub_categories` DROP INDEX `sub_categories_slug_uq`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_scoped_slug_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sub_categories'
    AND INDEX_NAME = 'sub_categories_category_slug_uq'
);

SET @sql := IF(
  @has_scoped_slug_idx = 0,
  'ALTER TABLE `sub_categories` ADD UNIQUE KEY `sub_categories_category_slug_uq` (`category_id`, `slug`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
