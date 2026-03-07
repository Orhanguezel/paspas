-- ============================================================================
-- ERP DEMO KULLANICILARI
-- 4 rol için hızlı giriş kullanıcıları (şifre: admin123)
-- ============================================================================
SET @seed_ts = '2026-01-01 00:00:00.000';

-- 1) Admin
INSERT INTO users (id, email, password_hash, full_name, phone, wallet_balance, is_active, email_verified, created_at, updated_at)
VALUES (
  'erp-demo-admin-0001-000000000001',
  'admin@promats.com',
  '{{ADMIN_PASSWORD_HASH}}',
  'Promats Admin',
  '+905001000001',
  0.00, 1, 1,
  @seed_ts, @seed_ts
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name = VALUES(full_name),
  is_active = 1,
  email_verified = 1,
  updated_at = VALUES(updated_at);

-- 2) Sevkiyat
INSERT INTO users (id, email, password_hash, full_name, phone, wallet_balance, is_active, email_verified, created_at, updated_at)
VALUES (
  'erp-demo-sevk-0002-000000000002',
  'sevkiyat@promats.com',
  '{{ADMIN_PASSWORD_HASH}}',
  'Sevkiyat Sorumlusu',
  '+905001000002',
  0.00, 1, 1,
  @seed_ts, @seed_ts
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name = VALUES(full_name),
  is_active = 1,
  email_verified = 1,
  updated_at = VALUES(updated_at);

-- 3) Operatör
INSERT INTO users (id, email, password_hash, full_name, phone, wallet_balance, is_active, email_verified, created_at, updated_at)
VALUES (
  'erp-demo-oper-0003-000000000003',
  'operator@promats.com',
  '{{ADMIN_PASSWORD_HASH}}',
  'Üretim Operatörü',
  '+905001000003',
  0.00, 1, 1,
  @seed_ts, @seed_ts
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name = VALUES(full_name),
  is_active = 1,
  email_verified = 1,
  updated_at = VALUES(updated_at);

-- 4) Satın Alma
INSERT INTO users (id, email, password_hash, full_name, phone, wallet_balance, is_active, email_verified, created_at, updated_at)
VALUES (
  'erp-demo-sata-0004-000000000004',
  'satinalma@promats.com',
  '{{ADMIN_PASSWORD_HASH}}',
  'Satın Alma Sorumlusu',
  '+905001000004',
  0.00, 1, 1,
  @seed_ts, @seed_ts
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name = VALUES(full_name),
  is_active = 1,
  email_verified = 1,
  updated_at = VALUES(updated_at);

-- ============================================================================
-- PROFILLER
-- ============================================================================

INSERT INTO profiles (id, full_name, phone, created_at, updated_at)
VALUES ('erp-demo-admin-0001-000000000001', 'Promats Admin', '+905001000001', @seed_ts, @seed_ts)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), updated_at = VALUES(updated_at);

INSERT INTO profiles (id, full_name, phone, created_at, updated_at)
VALUES ('erp-demo-sevk-0002-000000000002', 'Sevkiyat Sorumlusu', '+905001000002', @seed_ts, @seed_ts)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), updated_at = VALUES(updated_at);

INSERT INTO profiles (id, full_name, phone, created_at, updated_at)
VALUES ('erp-demo-oper-0003-000000000003', 'Üretim Operatörü', '+905001000003', @seed_ts, @seed_ts)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), updated_at = VALUES(updated_at);

INSERT INTO profiles (id, full_name, phone, created_at, updated_at)
VALUES ('erp-demo-sata-0004-000000000004', 'Satın Alma Sorumlusu', '+905001000004', @seed_ts, @seed_ts)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), updated_at = VALUES(updated_at);

-- ============================================================================
-- ROLLER
-- ============================================================================

INSERT IGNORE INTO user_roles (id, user_id, role, created_at)
VALUES ('2a9d9ced-1425-eacd-c7ef-c7cd1f8c4d79', 'erp-demo-admin-0001-000000000001', 'admin', @seed_ts);

INSERT IGNORE INTO user_roles (id, user_id, role, created_at)
VALUES ('7bbf7bf3-9ab4-1305-cf2d-9920af79d500', 'erp-demo-sevk-0002-000000000002', 'sevkiyatci', @seed_ts);

INSERT IGNORE INTO user_roles (id, user_id, role, created_at)
VALUES ('f7807e80-a367-2d8d-eb5a-4ac20f263ff1', 'erp-demo-oper-0003-000000000003', 'operator', @seed_ts);

INSERT IGNORE INTO user_roles (id, user_id, role, created_at)
VALUES ('3cd6e6f7-3204-0aa3-3688-17c56b46ef1d', 'erp-demo-sata-0004-000000000004', 'satin_almaci', @seed_ts);
