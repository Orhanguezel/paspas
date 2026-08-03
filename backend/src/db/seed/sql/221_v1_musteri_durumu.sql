-- 221: Aday Müşteri (Prospect) — musteriler.musteri_durumu
-- Web/telefon/manuel yoldan, sistemde kayıtlı olmayan kişiden teklif alındığında
-- müşteri 'aday' olarak açılır; teklif satış siparişine dönüşünce 'aktif' olur.
-- Transpalet karşılığı: musteriler.musteri_durumu enum('potansiyel',...); bizde 'aday'.
-- Idempotent: INFORMATION_SCHEMA guard'ı ile yalnızca yoksa eklenir (mevcut veriye dokunmaz).

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'musteriler'
    AND COLUMN_NAME = 'musteri_durumu'
);

SET @stmt := IF(
  @col_exists = 0,
  'ALTER TABLE `musteriler` ADD COLUMN `musteri_durumu` varchar(32) NOT NULL DEFAULT ''aktif'' AFTER `tur`, ADD KEY `idx_musteriler_musteri_durumu` (`musteri_durumu`)',
  'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mevcut kayıtlar 'aktif' kalır (default). Yeni adaylar uygulama katmanında 'aday' set edilir.
