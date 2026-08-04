-- Teklif → müşteri → sipariş zincirinin detay ekranlarında gerekli okuma
-- izinleri. Stored permission set tam override olduğundan açıkça seed edilir.
INSERT INTO `role_permissions` (`id`, `role`, `permission_key`, `is_allowed`) VALUES
  (UUID(), 'admin', 'admin.musteriler.view', 1),
  (UUID(), 'admin', 'admin.satis_siparisleri.view', 1),
  (UUID(), 'admin', 'admin.app_settings.view', 1),
  (UUID(), 'sevkiyatci', 'admin.musteriler.view', 1),
  (UUID(), 'sevkiyatci', 'admin.satis_siparisleri.view', 1)
ON DUPLICATE KEY UPDATE `is_allowed` = VALUES(`is_allowed`);
