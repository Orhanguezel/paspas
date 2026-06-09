-- 199: Makine kapali araliklar (yonetim karari ile makinenin belirli tarih
-- araliginda kapatilmasi). Tatil gunlerinden (tum isletme) ve operator
-- durdurmasindan (anlik) farkli; gun bazli planli durustur.
--
-- Davranis:
--  * is_yukler/Gantt planlamada makineye is yuklenebilir (engellenmez)
--  * Operator basinca aktif aralik varsa Baslat disabled
--  * Aralik bitince Baslat tekrar aktif
--
-- Aralik formati: yalnizca tarih (saat yok). Aralik dahildir
-- (CURDATE() BETWEEN baslangic_tarih AND bitis_tarih).
-- Cakisma kontrolu uygulama katmaninda yapilir (router'da validation).

CREATE TABLE IF NOT EXISTS `makine_kapali_araliklar` (
  `id`                 char(36)        NOT NULL,
  `makine_id`          char(36)        NOT NULL,
  `baslangic_tarih`    date            NOT NULL,
  `bitis_tarih`        date            NOT NULL,
  `aciklama`           varchar(255)    DEFAULT NULL,
  `created_by_user_id` char(36)        DEFAULT NULL,
  `created_at`         datetime        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         datetime        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mka_makine` (`makine_id`),
  KEY `idx_mka_makine_aralik` (`makine_id`, `baslangic_tarih`, `bitis_tarih`),
  KEY `idx_mka_bitis` (`bitis_tarih`),
  CONSTRAINT `fk_mka_makine`
    FOREIGN KEY (`makine_id`) REFERENCES `makineler` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_mka_aralik` CHECK (`bitis_tarih` >= `baslangic_tarih`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
