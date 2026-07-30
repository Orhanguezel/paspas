ALTER TABLE `web_promats_products`
  ADD COLUMN `seo_title` varchar(255) NULL AFTER `slug`,
  ADD COLUMN `seo_description` text NULL AFTER `seo_title`,
  ADD COLUMN `detail_description` mediumtext NULL AFTER `seo_description`,
  ADD COLUMN `detail_technical` mediumtext NULL AFTER `detail_description`,
  ADD COLUMN `detail_usage` mediumtext NULL AFTER `detail_technical`,
  ADD COLUMN `detail_advantages` mediumtext NULL AFTER `detail_usage`,
  ADD COLUMN `detail_material` mediumtext NULL AFTER `detail_advantages`,
  ADD COLUMN `detail_universal` mediumtext NULL AFTER `detail_material`,
  ADD COLUMN `detail_source_url` varchar(500) NULL AFTER `detail_universal`;
