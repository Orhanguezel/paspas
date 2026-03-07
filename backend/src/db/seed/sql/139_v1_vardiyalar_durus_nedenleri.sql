-- =============================================================
-- 139: V1 — Vardiyalar + Duruş Nedenleri Kataloğu
-- =============================================================

-- -----------------------------------------------------------
-- 1. Vardiyalar tablosu
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vardiyalar` (
  `id`               CHAR(36)     NOT NULL,
  `ad`               VARCHAR(100) NOT NULL,
  `baslangic_saati`  VARCHAR(5)   NOT NULL COMMENT 'HH:MM',
  `bitis_saati`      VARCHAR(5)   NOT NULL COMMENT 'HH:MM',
  `is_active`        TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `aciklama`         VARCHAR(500),
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan vardiyalar
INSERT IGNORE INTO `vardiyalar` (`id`, `ad`, `baslangic_saati`, `bitis_saati`, `is_active`, `aciklama`) VALUES
  (UUID(), 'Gündüz Vardiyası',  '07:30', '19:30', 1, 'Sabah 07:30 – Akşam 19:30'),
  (UUID(), 'Gece Vardiyası',    '19:30', '07:30', 1, 'Akşam 19:30 – Sabah 07:30'),
  (UUID(), 'Tam Gün (24 Saat)', '00:00', '23:59', 0, 'Sürekli çalışan makineler için referans vardiya');

-- -----------------------------------------------------------
-- 2. Duruş Nedenleri Kataloğu tablosu
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `durus_nedenleri` (
  `id`         CHAR(36)     NOT NULL,
  `kod`        VARCHAR(64)  NOT NULL,
  `ad`         VARCHAR(255) NOT NULL,
  `kategori`   VARCHAR(64)  NOT NULL DEFAULT 'diger' COMMENT 'makine|malzeme|personel|planlama|diger',
  `is_active`  TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `aciklama`   VARCHAR(500),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_durus_nedeni_kod` (`kod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Standart duruş nedeni kataloğu
INSERT IGNORE INTO `durus_nedenleri` (`id`, `kod`, `ad`, `kategori`, `is_active`, `aciklama`) VALUES
  (UUID(), 'ARIZ',   'Makine Arızası',           'makine',    1, 'Ani arıza veya mekanik/elektrik arızası'),
  (UUID(), 'BAKIM',  'Planlı Bakım',              'makine',    1, 'Rutin bakım, yağlama veya periyodik kontrol'),
  (UUID(), 'KALIP',  'Kalıp Değişimi',            'makine',    1, 'Kalıp takma/sökme veya ayar'),
  (UUID(), 'AYAR',   'Makine Ayar/Setup',         'makine',    1, 'Üretim başlangıcında makine kurma süresi'),
  (UUID(), 'MALZ',   'Malzeme Bekleme',           'malzeme',   1, 'Hammadde veya yardımcı malzeme temin edilemiyor'),
  (UUID(), 'KUSU',   'Malzeme Kusuru',            'malzeme',   1, 'Gelen malzeme kalite reddi veya spec dışı'),
  (UUID(), 'PERSON', 'Personel Eksikliği',        'personel',  1, 'Vardiya devamsızlığı veya operatör yok'),
  (UUID(), 'EGITIM', 'Eğitim/Toplantı',           'personel',  1, 'Operatör eğitim veya zorunlu toplantı'),
  (UUID(), 'PLAN',   'Planlama Değişikliği',      'planlama',  1, 'Sipariş iptali veya öncelik değişimi'),
  (UUID(), 'SIPARIS','Sipariş Bekleme',            'planlama',  1, 'Üretim emri veya onay bekleniyor'),
  (UUID(), 'ENERJI', 'Enerji Kesintisi',          'diger',     1, 'Elektrik kesintisi veya jeneratör arızası'),
  (UUID(), 'DIGER',  'Diğer',                     'diger',     1, 'Yukarıdaki kategorilere girmeyen nedenler');
