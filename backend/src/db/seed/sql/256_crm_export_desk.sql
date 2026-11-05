-- Promats İhracat Masası: firma kartına bağlı, kaynağı belli araştırma ve kişiler.
-- Mevcut müşteri, teklif ve görüşme kayıtlarına dokunmaz.
CREATE TABLE IF NOT EXISTS crm_company_profiles (
  customer_id char(36) NOT NULL PRIMARY KEY,
  source_ref varchar(190) NULL,
  buyer_type varchar(100) NULL,
  company_note text NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_crm_company_source_ref (source_ref),
  CONSTRAINT fk_crm_company_profile_customer FOREIGN KEY (customer_id) REFERENCES musteriler(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_company_contacts (
  id char(36) NOT NULL PRIMARY KEY,
  customer_id char(36) NOT NULL,
  source_ref varchar(190) NULL,
  name varchar(255) NOT NULL,
  title varchar(160) NULL,
  email varchar(255) NULL,
  phone varchar(64) NULL,
  linkedin_url varchar(500) NULL,
  note text NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_crm_contact_source (customer_id, source_ref),
  KEY idx_crm_contact_customer (customer_id),
  CONSTRAINT fk_crm_contact_customer FOREIGN KEY (customer_id) REFERENCES musteriler(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_company_research (
  id char(36) NOT NULL PRIMARY KEY,
  customer_id char(36) NOT NULL,
  source_ref varchar(190) NULL,
  finding text NOT NULL,
  information_type enum('research','customer_statement') NOT NULL DEFAULT 'research',
  source_url varchar(1000) NULL,
  source_label varchar(255) NULL,
  observed_at date NULL,
  verification_status enum('unverified','verified','disputed') NOT NULL DEFAULT 'unverified',
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_crm_research_source (customer_id, source_ref),
  KEY idx_crm_research_customer (customer_id, created_at),
  CONSTRAINT fk_crm_research_customer FOREIGN KEY (customer_id) REFERENCES musteriler(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_company_product_interest (
  id char(36) NOT NULL PRIMARY KEY,
  customer_id char(36) NOT NULL,
  product_group enum('PROMATS','MEFATECH','WOGEN') NOT NULL,
  interest_status enum('unknown','possible','confirmed','not_interested') NOT NULL DEFAULT 'unknown',
  current_supplier varchar(255) NULL,
  blocker varchar(500) NULL,
  purchase_timing varchar(255) NULL,
  evidence_note text NULL,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_crm_product_customer_group (customer_id, product_group),
  CONSTRAINT fk_crm_product_customer FOREIGN KEY (customer_id) REFERENCES musteriler(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
