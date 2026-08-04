-- Teklif modülü: gönderim iznini görüntüleme/düzenlemeden bağımsız yönet.
INSERT INTO `role_permissions` (`id`, `role`, `permission_key`, `is_allowed`) VALUES
  (UUID(), 'admin',       'admin.teklif_gonder.create', 1),
  (UUID(), 'sevkiyatci', 'admin.teklif_gonder.create', 1)
ON DUPLICATE KEY UPDATE `is_allowed` = VALUES(`is_allowed`);
