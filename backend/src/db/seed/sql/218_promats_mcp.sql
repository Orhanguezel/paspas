-- Personal MCP credentials and one-time, approval-gated note changes.
CREATE TABLE IF NOT EXISTS promats_mcp_jeton (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  ad VARCHAR(80) NOT NULL,
  onek VARCHAR(16) NOT NULL,
  ozet CHAR(64) NOT NULL,
  kapsamlar JSON NOT NULL,
  son_kullanma DATETIME(3) NOT NULL,
  son_kullanim_at DATETIME(3) NULL,
  son_kullanim_ip VARCHAR(64) NULL,
  kullanim_sayisi INT UNSIGNED NOT NULL DEFAULT 0,
  iptal_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_promats_mcp_ozet (ozet),
  KEY idx_promats_mcp_user (user_id, iptal_at),
  CONSTRAINT fk_promats_mcp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promats_mcp_onay (
  id CHAR(36) NOT NULL PRIMARY KEY,
  jeton_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  kod_ozeti CHAR(64) NOT NULL,
  islem VARCHAR(24) NOT NULL,
  govde JSON NOT NULL,
  kayit_guncelleme DATETIME(3) NULL,
  son_kullanma DATETIME(3) NOT NULL,
  kullanildi_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_promats_mcp_onay_kod (kod_ozeti),
  KEY idx_promats_mcp_onay_jeton (jeton_id, son_kullanma),
  CONSTRAINT fk_promats_mcp_onay_jeton FOREIGN KEY (jeton_id) REFERENCES promats_mcp_jeton(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promats_mcp_oauth (
  ozet CHAR(64) NOT NULL PRIMARY KEY,
  tur VARCHAR(16) NOT NULL,
  jeton_id CHAR(36) NULL,
  payload JSON NULL,
  son_gecerlilik DATETIME(3) NOT NULL,
  kullanildi_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_promats_mcp_oauth_jeton (jeton_id),
  KEY idx_promats_mcp_oauth_son (son_gecerlilik)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
