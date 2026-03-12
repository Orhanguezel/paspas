-- 159_v1_urunler_rezerve_stok_kolon.sql
-- urunler tablosuna rezerve_stok kolonu ekler (prod'da eksikti).
-- 105_urunler_schema.sql'deki CREATE TABLE IF NOT EXISTS tablo zaten varsa kolon eklemez;
-- bu seed o boşluğu kapatır.

ALTER TABLE `urunler`
  ADD COLUMN IF NOT EXISTS `rezerve_stok` decimal(12,4) NOT NULL DEFAULT 0.0000
  AFTER `kritik_stok`;
