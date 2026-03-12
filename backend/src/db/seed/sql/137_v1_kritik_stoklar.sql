SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- kritik_stok kolonu artik 105_urunler_schema.sql'de tanimli
-- Burada sadece data guncelleme yapilir

UPDATE `urunler`
SET `kritik_stok` = CASE
  WHEN `kategori` = 'hammadde' AND `birim` = 'kg' THEN ROUND(`stok` * 0.20, 4)
  WHEN `kategori` = 'hammadde' AND `birim` = 'mt' THEN ROUND(`stok` * 0.18, 4)
  WHEN `kategori` = 'hammadde' THEN ROUND(`stok` * 0.15, 4)
  WHEN `kategori` = 'yarimamul' THEN ROUND(`stok` * 0.25, 4)
  WHEN `kategori` = 'urun' AND `tedarik_tipi` = 'uretim' THEN ROUND(`stok` * 0.30, 4)
  WHEN `kategori` = 'urun' AND `tedarik_tipi` = 'fason' THEN ROUND(`stok` * 0.25, 4)
  ELSE ROUND(`stok` * 0.10, 4)
END
WHERE COALESCE(`kritik_stok`, 0) = 0;

UPDATE `urunler`
SET `kritik_stok` = CASE
  WHEN `kritik_stok` < 0 THEN 0.0000
  WHEN `stok` > 0 AND `kritik_stok` = 0 THEN ROUND(`stok` * 0.10, 4)
  ELSE `kritik_stok`
END;

UPDATE `urunler`
SET `kritik_stok` = CASE `kod`
  WHEN 'HM-AMB-002' THEN 90.0000
  WHEN 'HM-AMB-003' THEN 60.0000
  WHEN 'HM-MB-004' THEN 150.0000
  ELSE `kritik_stok`
END
WHERE `kod` IN ('HM-AMB-002', 'HM-AMB-003', 'HM-MB-004');
