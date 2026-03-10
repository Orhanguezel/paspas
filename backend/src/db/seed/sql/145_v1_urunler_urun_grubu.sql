-- Add urun_grubu column to urunler table
ALTER TABLE `urunler`
  ADD COLUMN `urun_grubu` VARCHAR(128) DEFAULT NULL AFTER `tedarik_tipi`;
