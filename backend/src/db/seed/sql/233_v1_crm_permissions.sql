-- CRM V2/6: ayrık modül izinleri. Mevcut rol izinleri olan canlı sistemde açıkça eklenir.
INSERT INTO `role_permissions`(`id`,`role`,`permission_key`,`is_allowed`) VALUES
(UUID(),'admin','admin.crm_dashboard.view',1),(UUID(),'admin','admin.crm_dashboard.create',1),(UUID(),'admin','admin.crm_dashboard.update',1),(UUID(),'admin','admin.crm_dashboard.delete',1),
(UUID(),'admin','admin.crm_talepler.view',1),(UUID(),'admin','admin.crm_talepler.create',1),(UUID(),'admin','admin.crm_talepler.update',1),(UUID(),'admin','admin.crm_talepler.delete',1),
(UUID(),'admin','admin.crm_raporlar.view',1),(UUID(),'admin','admin.crm_raporlar.create',1),(UUID(),'admin','admin.crm_raporlar.update',1),(UUID(),'admin','admin.crm_raporlar.delete',1),
(UUID(),'admin','admin.crm_otomasyon.view',1),(UUID(),'admin','admin.crm_otomasyon.create',1),(UUID(),'admin','admin.crm_otomasyon.update',1),(UUID(),'admin','admin.crm_otomasyon.delete',1),
(UUID(),'sevkiyatci','admin.crm_dashboard.view',1),(UUID(),'sevkiyatci','admin.crm_talepler.view',1),(UUID(),'sevkiyatci','admin.crm_talepler.create',1),(UUID(),'sevkiyatci','admin.crm_talepler.update',1),
(UUID(),'sevkiyatci','admin.crm_raporlar.view',1)
ON DUPLICATE KEY UPDATE `is_allowed`=1;

INSERT INTO `role_permissions`(`id`,`role`,`permission_key`,`is_allowed`) VALUES
(UUID(),'admin','admin.crm_firsatlar.view',1),(UUID(),'admin','admin.crm_firsatlar.create',1),(UUID(),'admin','admin.crm_firsatlar.update',1),(UUID(),'admin','admin.crm_firsatlar.delete',1),
(UUID(),'admin','admin.crm_pipeline.view',1),(UUID(),'admin','admin.crm_pipeline.create',1),(UUID(),'admin','admin.crm_pipeline.update',1),(UUID(),'admin','admin.crm_pipeline.delete',1),
(UUID(),'admin','admin.crm_aktiviteler.view',1),(UUID(),'admin','admin.crm_aktiviteler.create',1),(UUID(),'admin','admin.crm_aktiviteler.update',1),(UUID(),'admin','admin.crm_aktiviteler.delete',1),
(UUID(),'sevkiyatci','admin.crm_firsatlar.view',1),(UUID(),'sevkiyatci','admin.crm_firsatlar.create',1),(UUID(),'sevkiyatci','admin.crm_firsatlar.update',1),(UUID(),'sevkiyatci','admin.crm_firsatlar.delete',1),
(UUID(),'sevkiyatci','admin.crm_aktiviteler.view',1),(UUID(),'sevkiyatci','admin.crm_aktiviteler.create',1),(UUID(),'sevkiyatci','admin.crm_aktiviteler.update',1),(UUID(),'sevkiyatci','admin.crm_aktiviteler.delete',1)
ON DUPLICATE KEY UPDATE `is_allowed`=1;
