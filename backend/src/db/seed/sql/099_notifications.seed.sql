-- =============================================================
-- PROMATS ERP — NOTIFICATIONS SCHEMA + SEED
-- =============================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET @seed_ts = '2026-01-01 00:00:00';

CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         CHAR(36)      NOT NULL,
  `user_id`    CHAR(36)      NOT NULL,
  `title`      VARCHAR(255)  NOT NULL,
  `message`    TEXT          NOT NULL,
  `type`       VARCHAR(50)   NOT NULL,
  `is_read`    TINYINT(1)    NOT NULL DEFAULT 0,
  `created_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `notifications`
  (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`)
VALUES
(
  '11111111-1111-1111-1111-111111111111',
  '{{ADMIN_ID}}',
  'Hoş geldiniz!',
  'Promats Universal Paspaslar ERP sisteminiz kuruldu. Üretim süreçlerinizi yönetim panelinden takip edebilirsiniz.',
  'system',
  0,
  @seed_ts
),
(
  '22222222-2222-2222-2222-222222222222',
  '{{ADMIN_ID}}',
  'İlk ürününüzü tanımlayın',
  'Ürün, reçete ve makine tanımlarını yaparak üretim sürecinizi başlatabilirsiniz.',
  'system',
  0,
  DATE_ADD(@seed_ts, INTERVAL 1 MINUTE)
)
ON DUPLICATE KEY UPDATE
  `title`      = VALUES(`title`),
  `message`    = VALUES(`message`),
  `type`       = VALUES(`type`),
  `is_read`    = VALUES(`is_read`),
  `created_at` = VALUES(`created_at`);
