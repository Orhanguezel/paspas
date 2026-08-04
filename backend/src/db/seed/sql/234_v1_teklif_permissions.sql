-- Teklif modülü aksiyon izinleri. Gönderim POST olduğu için teklifler.create,
-- iskonto onayı ise ayrı teklif_onay.create izniyle korunur.
INSERT INTO `role_permissions` (`id`, `role`, `permission_key`, `is_allowed`) VALUES
  (UUID(), 'admin', 'admin.teklifler.view', 1),
  (UUID(), 'admin', 'admin.teklifler.create', 1),
  (UUID(), 'admin', 'admin.teklifler.update', 1),
  (UUID(), 'admin', 'admin.teklifler.delete', 1),
  (UUID(), 'admin', 'admin.teklif_talepleri.view', 1),
  (UUID(), 'admin', 'admin.teklif_talepleri.create', 1),
  (UUID(), 'admin', 'admin.teklif_talepleri.update', 1),
  (UUID(), 'admin', 'admin.teklif_talepleri.delete', 1),
  (UUID(), 'admin', 'admin.teklif_onay.create', 1),
  (UUID(), 'sevkiyatci', 'admin.teklifler.view', 1),
  (UUID(), 'sevkiyatci', 'admin.teklifler.create', 1),
  (UUID(), 'sevkiyatci', 'admin.teklifler.update', 1),
  (UUID(), 'sevkiyatci', 'admin.teklifler.delete', 1),
  (UUID(), 'sevkiyatci', 'admin.teklif_talepleri.view', 1),
  (UUID(), 'sevkiyatci', 'admin.teklif_talepleri.create', 1),
  (UUID(), 'sevkiyatci', 'admin.teklif_talepleri.update', 1),
  (UUID(), 'sevkiyatci', 'admin.teklif_talepleri.delete', 1)
ON DUPLICATE KEY UPDATE `is_allowed` = VALUES(`is_allowed`);
