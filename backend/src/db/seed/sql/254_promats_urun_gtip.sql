CREATE TABLE IF NOT EXISTS promats_urun_gtip (
  urun_id char(36) NOT NULL PRIMARY KEY,
  gtip_kodu varchar(12) NOT NULL,
  kaynak varchar(255) NOT NULL,
  updated_by char(36) DEFAULT NULL,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_promats_urun_gtip_urun FOREIGN KEY (urun_id) REFERENCES urunler(id) ON DELETE CASCADE,
  KEY idx_promats_urun_gtip_kodu (gtip_kodu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
