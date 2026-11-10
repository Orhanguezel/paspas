-- Firma Bulma: Sunplex gümrük havuzu salt okunur; burada yalnız Paspas profili ve adaylar tutulur.
CREATE TABLE IF NOT EXISTS firma_bulma_profili (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  sektor VARCHAR(255) NULL,
  hs_kodlari_json JSON NOT NULL,
  hedef_ulkeler_json JSON NOT NULL,
  ayna_adlari_json JSON NOT NULL,
  updated_by CHAR(36) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS firma_bulma_adaylari (
  id CHAR(36) NOT NULL PRIMARY KEY,
  kimlik_anahtari CHAR(64) NOT NULL,
  firma_adi VARCHAR(255) NOT NULL,
  ulke VARCHAR(100) NULL,
  hs_kodlari_json JSON NOT NULL,
  sevkiyat_sayisi INT UNSIGNED NOT NULL DEFAULT 0,
  tedarikci_sayisi INT UNSIGNED NOT NULL DEFAULT 0,
  son_sevkiyat DATE NULL,
  uygunluk_puani TINYINT UNSIGNED NOT NULL DEFAULT 0,
  uygunluk_nedenleri_json JSON NOT NULL,
  kaynak_json JSON NOT NULL,
  durum ENUM('aday','nitelikli','crm_aktarildi','elenmis') NOT NULL DEFAULT 'aday',
  crm_musteri_id CHAR(36) NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_firma_bulma_kimlik (kimlik_anahtari),
  KEY idx_firma_bulma_durum (durum,uygunluk_puani),
  CONSTRAINT fk_firma_bulma_crm FOREIGN KEY (crm_musteri_id) REFERENCES musteriler(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO role_permissions (id,role,permission_key,is_allowed)
VALUES (UUID(),'admin','admin.firma_bulma.view',1),
       (UUID(),'admin','admin.firma_bulma.create',1),
       (UUID(),'admin','admin.firma_bulma.update',1),
       (UUID(),'sevkiyatci','admin.firma_bulma.view',1),
       (UUID(),'sevkiyatci','admin.firma_bulma.create',1),
       (UUID(),'sevkiyatci','admin.firma_bulma.update',1)
ON DUPLICATE KEY UPDATE is_allowed=VALUES(is_allowed);
