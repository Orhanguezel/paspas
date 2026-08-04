-- Teklif editöründe web ürün önerisini gerçek ERP ürününe eşlemek için ürün
-- kataloğu okunur. Stored permission set tam override olduğundan bu izin açıkça
-- seed edilmelidir; aksi halde admin teklif kaleminde ürün seçemez.
INSERT INTO `role_permissions` (`id`, `role`, `permission_key`, `is_allowed`) VALUES
  (UUID(), 'admin', 'admin.urunler.view', 1),
  (UUID(), 'sevkiyatci', 'admin.urunler.view', 1)
ON DUPLICATE KEY UPDATE `is_allowed` = VALUES(`is_allowed`);
