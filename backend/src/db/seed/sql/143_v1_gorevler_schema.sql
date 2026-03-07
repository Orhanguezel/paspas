SET @seed_ts = '2026-01-01 00:00:00';

CREATE TABLE IF NOT EXISTS gorevler (
  id CHAR(36) NOT NULL PRIMARY KEY,
  baslik VARCHAR(255) NOT NULL,
  aciklama TEXT NULL,
  tip VARCHAR(50) NOT NULL DEFAULT 'manuel',
  modul VARCHAR(64) NULL,
  ilgili_kayit_id CHAR(36) NULL,
  atanan_kullanici_id CHAR(36) NULL,
  atanan_rol VARCHAR(32) NULL,
  durum VARCHAR(32) NOT NULL DEFAULT 'acik',
  oncelik VARCHAR(32) NOT NULL DEFAULT 'normal',
  termin_tarihi DATETIME NULL,
  tamamlandi_at DATETIME NULL,
  olusturan_kullanici_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_gorevler_durum (durum),
  KEY idx_gorevler_oncelik (oncelik),
  KEY idx_gorevler_termin (termin_tarihi),
  KEY idx_gorevler_atanan_kullanici (atanan_kullanici_id),
  KEY idx_gorevler_atanan_rol (atanan_rol)
);
