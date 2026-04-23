SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Eski mimariden kalan, operasyon kaydi olan uretim yarimamul kartlari
-- yeni mimaride Operasyonel YM olarak listelenmelidir.
UPDATE `urunler` u
SET
  u.`kategori` = 'operasyonel_ym',
  u.`updated_at` = NOW()
WHERE u.`kategori` = 'yarimamul'
  AND u.`tedarik_tipi` = 'uretim'
  AND EXISTS (
    SELECT 1
    FROM `urun_operasyonlari` uo
    WHERE uo.`urun_id` = u.`id`
  );
