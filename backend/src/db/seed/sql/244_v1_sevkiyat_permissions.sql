-- Stored permission set tam override oldugu icin sevkiyat modulu izinleri
-- mevcut admin ve sevkiyatci rollerine acikca eklenir.
INSERT INTO `role_permissions` (`id`, `role`, `permission_key`, `is_allowed`) VALUES
  (UUID(), 'admin', 'admin.sevkiyat.view', 1),
  (UUID(), 'admin', 'admin.sevkiyat.create', 1),
  (UUID(), 'admin', 'admin.sevkiyat.update', 1),
  (UUID(), 'admin', 'admin.sevkiyat.delete', 1),
  (UUID(), 'sevkiyatci', 'admin.sevkiyat.view', 1),
  (UUID(), 'sevkiyatci', 'admin.sevkiyat.create', 1),
  (UUID(), 'sevkiyatci', 'admin.sevkiyat.update', 1),
  (UUID(), 'sevkiyatci', 'admin.sevkiyat.delete', 1)
ON DUPLICATE KEY UPDATE `is_allowed` = VALUES(`is_allowed`);
