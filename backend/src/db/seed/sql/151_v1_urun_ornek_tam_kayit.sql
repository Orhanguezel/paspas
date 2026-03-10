SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `urunler`
(`id`, `kategori`, `tedarik_tipi`, `urun_grubu`, `kod`, `ad`, `aciklama`, `birim`, `renk`, `image_url`, `storage_asset_id`, `image_alt`, `stok`, `kritik_stok`, `birim_fiyat`, `kdv_orani`, `operasyon_tipi`, `is_active`)
VALUES
('u0000001-0000-4000-8000-000000000024', 'urun', 'uretim', 'Başak Plus', 'BP-3D-KHV-PRO', 'Başak Plus 3D Kahve Pro', 'Kahve tonunda premium 3D derin havuzlu oto paspas seti - 5 parça, çift taraflı üretim akışı için örnek seed ürün.', 'takim', 'Kahve', 'https://promats.com.tr/userfiles/images/product/ba%C5%9Fak-tekli.png', 'sa000001-1000-4000-8000-000000000001', 'Başak Plus 3D Kahve Pro Oto Paspas', 96.0000, 24.0000, 229.00, 20.00, 'cift_tarafli', 1)
ON DUPLICATE KEY UPDATE
  `kategori` = VALUES(`kategori`),
  `tedarik_tipi` = VALUES(`tedarik_tipi`),
  `urun_grubu` = VALUES(`urun_grubu`),
  `ad` = VALUES(`ad`),
  `aciklama` = VALUES(`aciklama`),
  `birim` = VALUES(`birim`),
  `renk` = VALUES(`renk`),
  `image_url` = VALUES(`image_url`),
  `storage_asset_id` = VALUES(`storage_asset_id`),
  `image_alt` = VALUES(`image_alt`),
  `stok` = VALUES(`stok`),
  `kritik_stok` = VALUES(`kritik_stok`),
  `birim_fiyat` = VALUES(`birim_fiyat`),
  `kdv_orani` = VALUES(`kdv_orani`),
  `operasyon_tipi` = VALUES(`operasyon_tipi`),
  `is_active` = VALUES(`is_active`);

DELETE FROM `urun_operasyonlari`
WHERE `urun_id` = 'u0000001-0000-4000-8000-000000000024';

INSERT INTO `urun_operasyonlari`
(`id`, `urun_id`, `sira`, `operasyon_adi`, `kalip_id`, `hazirlik_suresi_dk`, `cevrim_suresi_sn`, `montaj`, `is_active`)
VALUES
('uo000001-0000-4000-8000-000000000001', 'u0000001-0000-4000-8000-000000000024', 1, 'Başak Plus 3D Kahve Pro - Sol Form', 'kl000001-0000-4000-8000-000000000001', 75, 52.00, 0, 1),
('uo000001-0000-4000-8000-000000000002', 'u0000001-0000-4000-8000-000000000024', 2, 'Başak Plus 3D Kahve Pro - Sağ Montaj', 'kl000001-0000-4000-8000-000000000006', 40, 36.00, 1, 1)
ON DUPLICATE KEY UPDATE
  `operasyon_adi` = VALUES(`operasyon_adi`),
  `kalip_id` = VALUES(`kalip_id`),
  `hazirlik_suresi_dk` = VALUES(`hazirlik_suresi_dk`),
  `cevrim_suresi_sn` = VALUES(`cevrim_suresi_sn`),
  `montaj` = VALUES(`montaj`),
  `is_active` = VALUES(`is_active`);
