-- CRM V2/6: idempotent, güvenli eylemlerle sınırlı otomasyon motoru.
CREATE TABLE IF NOT EXISTS `crm_automation_rules` (
 `id` char(36) NOT NULL,`name` varchar(160) NOT NULL,`trigger_type` varchar(40) NOT NULL,`action_type` varchar(32) NOT NULL,`config` json NOT NULL,`is_active` tinyint unsigned NOT NULL DEFAULT 1,`sort` int unsigned NOT NULL DEFAULT 0,`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY(`id`),KEY `idx_crm_automation_rules_trigger`(`trigger_type`,`is_active`,`sort`),
 CONSTRAINT `chk_crm_automation_trigger` CHECK (`trigger_type` IN ('lead_created','deal_created','stage_changed','offer_sent','offer_accepted','followup_overdue','order_created','shipment_completed')),
 CONSTRAINT `chk_crm_automation_action` CHECK (`action_type` IN ('create_task','notify','assign_owner'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `crm_automation_events` (
 `id` char(36) NOT NULL,`event_key` varchar(190) NOT NULL,`trigger_type` varchar(40) NOT NULL,`entity_type` varchar(32) NOT NULL,`entity_id` char(36) NOT NULL,`actor_user_id` char(36) NULL,`payload` json NULL,`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(`id`),UNIQUE KEY `uq_crm_automation_event_key`(`event_key`),KEY `idx_crm_automation_events_entity`(`entity_type`,`entity_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `crm_automation_executions` (
 `id` char(36) NOT NULL,`event_id` char(36) NOT NULL,`rule_id` char(36) NOT NULL,`status` varchar(24) NOT NULL,`result_ref_id` char(36) NULL,`error_message` varchar(1000) NULL,`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,`completed_at` datetime NULL,
 PRIMARY KEY(`id`),UNIQUE KEY `uq_crm_automation_execution`(`event_id`,`rule_id`),CONSTRAINT `fk_crm_auto_exec_event` FOREIGN KEY(`event_id`) REFERENCES `crm_automation_events`(`id`) ON DELETE CASCADE,CONSTRAINT `fk_crm_auto_exec_rule` FOREIGN KEY(`rule_id`) REFERENCES `crm_automation_rules`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `crm_automation_rules`(`id`,`name`,`trigger_type`,`action_type`,`config`,`sort`) VALUES
('13000000-0000-4000-8000-000000000001','Yeni fırsat takip görevi','deal_created','create_task',JSON_OBJECT('subject','Yeni fırsatı değerlendir','dueDays',1),10),
('13000000-0000-4000-8000-000000000002','Geciken takip bildirimi','followup_overdue','notify',JSON_OBJECT('title','Geciken CRM takibi','message','Takip süresi aşılmış CRM kaydı var.'),20)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`config`=VALUES(`config`),`is_active`=1;
