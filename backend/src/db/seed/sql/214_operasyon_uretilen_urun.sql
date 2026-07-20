-- 214: Operasyon -> uretilen operasyonel yarimamul bagi
--
-- V20/R1: Inline (cift tarafli) uretimde her baski operasyonu bir operasyonel_ym
-- parcasi uretir (Alt/Ust Ana Govde, Sag/Sol taraf vb). Bu bag simdiye kadar semada
-- yoktu; kullanicilar operasyon adini uretilen parca adiyla ayni yazarak dolayli
-- olarak ifade etmisler. Bag olmadigi icin parcalar recete uzerinden TUKETILIYOR
-- ama hicbir yerde URETILMIYORDU -> stoklar surekli eksiye gidiyordu
-- (canli ornek: Alt/Ust Ana Govde 41L = -3093).
--
-- Idempotent: INFORMATION_SCHEMA kontrolu ile kolonlar yoksa eklenir.
-- Backfill: yalnizca TAM isim eslesmesi (TRIM(urun.ad) = TRIM(operasyon_adi)) ve
-- yalnizca urunun AKTIF recetesindeki operasyonel_ym kalemleri arasinda yapilir.
-- Olcum (2026-07-20 canli): 280 operasyondan 240'i tam eslesiyor, COKLU eslesme 0.
-- Eslesmeyen ~40 operasyon NULL kalir ve admin panelden elle doldurulur; NULL iken
-- kod parca stogu YAZMAZ ve receteden de DUSMEZ, yani negatif stok uretemez.

-- ---------------------------------------------------------------- urun_operasyonlari
SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urun_operasyonlari'
    AND COLUMN_NAME = 'uretilen_urun_id'
);

SET @stmt := IF(
  @col_exists = 0,
  'ALTER TABLE `urun_operasyonlari` ADD COLUMN `uretilen_urun_id` char(36) NULL DEFAULT NULL AFTER `operasyon_adi`, ADD KEY `idx_urun_operasyon_uretilen_urun` (`uretilen_urun_id`)',
  'SELECT 1'
);

PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------- uretim_emri_operasyonlari
-- Emir anindaki snapshot: urun karti sonradan degisse bile gecmis emirler bozulmaz.
SET @col_exists2 := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'uretim_emri_operasyonlari'
    AND COLUMN_NAME = 'uretilen_urun_id'
);

SET @stmt2 := IF(
  @col_exists2 = 0,
  'ALTER TABLE `uretim_emri_operasyonlari` ADD COLUMN `uretilen_urun_id` char(36) NULL DEFAULT NULL AFTER `operasyon_adi`, ADD KEY `idx_emir_operasyon_uretilen_urun` (`uretilen_urun_id`)',
  'SELECT 1'
);

PREPARE stmt2 FROM @stmt2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- ------------------------------------------------------------------------ backfill
-- Sadece tekil (COUNT=1) tam eslesmede yazilir. Coklu eslesme olursa o operasyon
-- NULL birakilir -- tahmin yurutmek yerine admin karar verir.
UPDATE `urun_operasyonlari` uo
SET uo.`uretilen_urun_id` = (
  SELECT ru.`id`
  FROM `receteler` r
  JOIN `recete_kalemleri` rk ON rk.`recete_id` = r.`id`
  JOIN `urunler` ru ON ru.`id` = rk.`urun_id`
  WHERE r.`urun_id` = uo.`urun_id`
    AND r.`is_active` = 1
    AND ru.`kategori` = 'operasyonel_ym'
    AND TRIM(ru.`ad`) = TRIM(uo.`operasyon_adi`)
  LIMIT 1
)
WHERE uo.`uretilen_urun_id` IS NULL
  AND (
    SELECT COUNT(*)
    FROM `receteler` r2
    JOIN `recete_kalemleri` rk2 ON rk2.`recete_id` = r2.`id`
    JOIN `urunler` ru2 ON ru2.`id` = rk2.`urun_id`
    WHERE r2.`urun_id` = uo.`urun_id`
      AND r2.`is_active` = 1
      AND ru2.`kategori` = 'operasyonel_ym'
      AND TRIM(ru2.`ad`) = TRIM(uo.`operasyon_adi`)
  ) = 1;

-- Gecmis emir operasyonlarina da ayni bagi tasi (urun operasyonu uzerinden).
UPDATE `uretim_emri_operasyonlari` ueo
JOIN `urun_operasyonlari` uo ON uo.`id` = ueo.`urun_operasyon_id`
SET ueo.`uretilen_urun_id` = uo.`uretilen_urun_id`
WHERE ueo.`uretilen_urun_id` IS NULL
  AND uo.`uretilen_urun_id` IS NOT NULL;
