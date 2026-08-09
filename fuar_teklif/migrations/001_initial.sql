CREATE TABLE products (
  id char(36) PRIMARY KEY, code varchar(64) NOT NULL UNIQUE, name varchar(255) NOT NULL,
  category varchar(120), supply_type varchar(32), unit varchar(24) NOT NULL DEFAULT 'set',
  product_group varchar(120), product_subgroup varchar(120), description text,
  price_try decimal(18,4), price_usd decimal(18,4), price_eur decimal(18,4), vat_rate decimal(5,2) NOT NULL DEFAULT 0,
  sets_per_carton int NOT NULL, cartons_per_pallet int NOT NULL,
  moq_amount int NOT NULL, moq_unit enum('set','carton','pallet') NOT NULL,
  carton_width_cm decimal(10,2), carton_length_cm decimal(10,2), carton_height_cm decimal(10,2),
  pallet_width_cm decimal(10,2), pallet_length_cm decimal(10,2), pallet_height_cm decimal(10,2),
  net_weight_per_set_kg decimal(12,4), gross_weight_per_carton_kg decimal(12,4), pallet_tare_kg decimal(12,4),
  hs_code varchar(32), origin_country varchar(80) NOT NULL DEFAULT 'Türkiye', is_active tinyint(1) NOT NULL DEFAULT 1,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE customers (
  id char(36) PRIMARY KEY, code varchar(64) NOT NULL UNIQUE, name varchar(255) NOT NULL,
  contact_name varchar(160), phone varchar(64), mobile varchar(64), email varchar(191), website varchar(255),
  default_discount_percent decimal(5,2) NOT NULL DEFAULT 0, address text, country varchar(120), city varchar(120),
  is_foreign tinyint(1) NOT NULL DEFAULT 1, created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quotes (
  id char(36) PRIMARY KEY, quote_no varchar(40) NOT NULL UNIQUE, customer_id char(36) NOT NULL,
  status enum('draft','sent','approved','cancelled') NOT NULL DEFAULT 'draft', currency enum('USD','EUR','TRY') NOT NULL,
  delivery_method enum('EXW','FOB','CIF') NOT NULL DEFAULT 'EXW', delivery_time varchar(120) NOT NULL DEFAULT '3-4 Weeks',
  payment_method varchar(160), payment_other varchar(255), destination varchar(255), origin_country varchar(80) NOT NULL DEFAULT 'Türkiye',
  valid_until date, current_revision int NOT NULL DEFAULT 0, created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_quotes_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quote_revisions (
  id char(36) PRIMARY KEY, quote_id char(36) NOT NULL, revision_no int NOT NULL,
  snapshot json NOT NULL, totals_snapshot json NOT NULL, created_by_user_id char(36), created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_quote_revision (quote_id,revision_no), CONSTRAINT fk_revisions_quote FOREIGN KEY (quote_id) REFERENCES quotes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE proformas (
  id char(36) PRIMARY KEY, proforma_no varchar(40) NOT NULL UNIQUE, quote_id char(36) NOT NULL,
  quote_revision_no int NOT NULL, snapshot json NOT NULL, created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_proformas_quote FOREIGN KEY (quote_id) REFERENCES quotes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
