-- Sunplex Fırsat görünümündeki sıradaki adım ve erteleme tarihi, mevcut CRM kaydına eklenir.
SET @column_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_deals' AND column_name='next_action');
SET @sql := IF(@column_exists=0, 'ALTER TABLE crm_deals ADD COLUMN next_action VARCHAR(500) NULL AFTER expected_close_date', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_deals' AND column_name='next_action_date');
SET @sql := IF(@column_exists=0, 'ALTER TABLE crm_deals ADD COLUMN next_action_date DATE NULL AFTER next_action', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT INTO crm_stages (id,pipeline_id,name,sort,probability,is_won,is_lost,renk,beklemede_uyari_gun)
SELECT UUID(),p.id,'Ertelendi',85,0,0,0,'#94a3b8',NULL FROM crm_pipelines p
WHERE NOT EXISTS (SELECT 1 FROM crm_stages s WHERE s.pipeline_id=p.id AND s.name='Ertelendi');
