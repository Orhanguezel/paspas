-- Teklif talebi sorumlu seçicisi kullanıcı listesini okur.
INSERT INTO `role_permissions` (`id`, `role`, `permission_key`, `is_allowed`) VALUES
  (UUID(), 'admin', 'admin.users.view', 1)
ON DUPLICATE KEY UPDATE `is_allowed` = VALUES(`is_allowed`);
