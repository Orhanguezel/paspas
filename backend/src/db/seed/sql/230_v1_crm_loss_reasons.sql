-- CRM V2/6: yönetilebilir kayıp nedenleri ve terminal kapanış alanları.
CREATE TABLE IF NOT EXISTS `crm_loss_reasons` (
  `id` char(36) NOT NULL,
  `code` varchar(64) NOT NULL,
  `name` varchar(160) NOT NULL,
  `sort` int unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint unsigned NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_crm_loss_reasons_code` (`code`),
  KEY `idx_crm_loss_reasons_active_sort` (`is_active`,`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `crm_loss_reasons` (`id`,`code`,`name`,`sort`) VALUES
('12000000-0000-4000-8000-000000000001','price','Fiyat',10),
('12000000-0000-4000-8000-000000000002','competitor','Rakip tercih edildi',20),
('12000000-0000-4000-8000-000000000003','timing','Zamanlama / bütçe ertelendi',30),
('12000000-0000-4000-8000-000000000004','no_need','İhtiyaç kalmadı',40),
('12000000-0000-4000-8000-000000000005','no_response','İletişim kurulamadı',50),
('12000000-0000-4000-8000-000000000006','other','Diğer',60)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`sort`=VALUES(`sort`);

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='crm_deals' AND COLUMN_NAME='lost_reason_id');
SET @s := IF(@c=0,'ALTER TABLE `crm_deals` ADD COLUMN `lost_reason_id` char(36) NULL AFTER `lost_reason`, ADD KEY `idx_crm_deals_loss_reason` (`lost_reason_id`), ADD CONSTRAINT `fk_crm_deals_loss_reason` FOREIGN KEY (`lost_reason_id`) REFERENCES `crm_loss_reasons` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='crm_deals' AND COLUMN_NAME='closed_at');
SET @s := IF(@c=0,'ALTER TABLE `crm_deals` ADD COLUMN `closed_at` datetime NULL AFTER `lost_reason_id`, ADD KEY `idx_crm_deals_closed_at` (`closed_at`)','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
