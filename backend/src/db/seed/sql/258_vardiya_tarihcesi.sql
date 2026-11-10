-- Vardiya ayarlarini tarihsel olarak sabitle; yeni ayar gecmise uygulanmaz.
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vardiyalar' AND COLUMN_NAME = 'gecerlilik_baslangici');
SET @stmt := IF(@col = 0,
  'ALTER TABLE vardiyalar ADD COLUMN gecerlilik_baslangici DATETIME NULL AFTER aciklama',
  'SELECT 1');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- Canli kayitta Gece vardiyasinin gercek aktivasyon zamani updated_at ile kanitli.
UPDATE vardiyalar
SET gecerlilik_baslangici = CASE
  WHEN LOWER(ad) LIKE '%gece%' AND updated_at > created_at THEN updated_at
  ELSE created_at
END
WHERE gecerlilik_baslangici IS NULL;

ALTER TABLE vardiyalar MODIFY gecerlilik_baslangici DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS vardiya_tarihceleri (
  id CHAR(36) NOT NULL PRIMARY KEY,
  vardiya_id CHAR(36) NOT NULL,
  ad VARCHAR(100) NOT NULL,
  baslangic_saati VARCHAR(5) NOT NULL,
  bitis_saati VARCHAR(5) NOT NULL,
  is_active TINYINT UNSIGNED NOT NULL,
  aciklama VARCHAR(500) NULL,
  gecerli_baslangic DATETIME NOT NULL,
  gecerli_bitis DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_vardiya_tarihce_aralik (vardiya_id, gecerli_baslangic, gecerli_bitis),
  KEY idx_vardiya_tarihce_aktif_aralik (is_active, gecerli_baslangic, gecerli_bitis)
);

-- Ilk kurulum idempotenttir. Gece vardiyasi, aktivasyon oncesinde pasifti.
INSERT INTO vardiya_tarihceleri
  (id, vardiya_id, ad, baslangic_saati, bitis_saati, is_active, aciklama, gecerli_baslangic, gecerli_bitis)
SELECT UUID(), v.id, v.ad, v.baslangic_saati, v.bitis_saati, 0, v.aciklama, v.created_at, v.gecerlilik_baslangici
FROM vardiyalar v
WHERE LOWER(v.ad) LIKE '%gece%'
  AND v.gecerlilik_baslangici > v.created_at
  AND NOT EXISTS (SELECT 1 FROM vardiya_tarihceleri h WHERE h.vardiya_id = v.id);

INSERT INTO vardiya_tarihceleri
  (id, vardiya_id, ad, baslangic_saati, bitis_saati, is_active, aciklama, gecerli_baslangic, gecerli_bitis)
SELECT UUID(), v.id, v.ad, v.baslangic_saati, v.bitis_saati, v.is_active, v.aciklama, v.gecerlilik_baslangici, NULL
FROM vardiyalar v
WHERE NOT EXISTS (
  SELECT 1 FROM vardiya_tarihceleri h
  WHERE h.vardiya_id = v.id AND h.gecerli_bitis IS NULL
);
