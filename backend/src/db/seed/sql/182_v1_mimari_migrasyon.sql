-- ============================================================================
-- PASPAS ERP — Mimari Migrasyon: Asıl Ürün + Yarı Mamul (2026-04-17)
-- Her mevcut 'urun' kaydı için:
--   - cift_tarafli: {ad} - Sağ + {ad} - Sol yarı mamulleri oluşturulur
--   - tek_tarafli:  {ad} - Parça yarı mamulü oluşturulur
-- Mevcut urun_operasyonlari yarı mamule taşınır.
-- Reçete kalemlerine yarı mamul eklenir.
-- Mevcut 'yarimamul' kategorisindeki ambalaj kayıtları 'hammadde'ye taşınır.
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- Idempotent yapmak için: yeni yarı mamuller INSERT IGNORE ile eklenir
-- UUID'ler uuid5 ile deterministic üretildi; tekrar çalıştırılırsa çakışır ve atlanır.


-- 1) Yarı mamul kayıtları oluştur
INSERT IGNORE INTO `urunler` (`id`,`kategori`,`tedarik_tipi`,`urun_grubu`,`kod`,`ad`,`aciklama`,`birim`,`renk`,`image_url`,`storage_asset_id`,`image_alt`,`stok`,`kritik_stok`,`rezerve_stok`,`birim_fiyat`,`kdv_orani`,`operasyon_tipi`,`is_active`,`created_at`,`updated_at`) VALUES
('a7e9949e-597b-54aa-b712-0be5044c7ad5','yarimamul','uretim','Paspas','1104 101-PR','BADEM SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('274d25c4-6b08-512c-b762-94f7a4cdf014','yarimamul','uretim','Başak Plus','BP-3D-KHV-PRO-SG','Başak Plus 3D Kahve Pro - Sağ',NULL,'adet','Kahve',NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('d28d3592-cb85-5f26-a16a-6374dec0b63c','yarimamul','uretim','Başak Plus','BP-3D-KHV-PRO-SL','Başak Plus 3D Kahve Pro - Sol',NULL,'adet','Kahve',NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('c1471548-be16-595c-aa57-14e983401b43','yarimamul','uretim','Paspas','1103 201-PR','BAŞAK PLUS SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('a658ae7b-b267-5c61-ad3f-d55cd589a53f','yarimamul','uretim','Paspas','1103 101-PR','BAŞAK SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('46de9c64-eb96-54b1-9c2b-329a406adab9','yarimamul','uretim','Paspas','1136 101-PR','CLIO SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('d0b1a358-5eda-5840-9ffd-434ffddebc3b','yarimamul','uretim','Paspas','1138 101-PR','DUSTER FULL HYBRID SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('a2b42829-b130-5c33-a975-9c7070d22691','yarimamul','uretim','Paspas','1137 101-PR','DUSTER MILD HYBRID SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('01d161ca-fa8f-5fc2-b68b-d296b5502938','yarimamul','uretim','Paspas','1102 203-PR','EKSTRA PLUS BEJ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('29cb93b1-d562-5daf-8e7e-3bcf46a4131f','yarimamul','uretim','Paspas','1102 202-PR','EKSTRA PLUS GRİ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('fd286235-0b0f-5844-9d43-641f2df95342','yarimamul','uretim','Paspas','1102 211-PR','EKSTRA PLUS KARBON - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('20a3a30d-3075-53da-a13a-1e61a5ae0fa9','yarimamul','uretim','Paspas','1102 212-PR','EKSTRA PLUS KIRMIZI - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('f3bb5314-d2f9-51d6-8e06-a47e754280ab','yarimamul','uretim','Paspas','1102 213-PR','EKSTRA PLUS MAVİ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('ebd999ee-4586-5ae5-b5bf-6d292e4c6fcb','yarimamul','uretim','Paspas','1102 214-PR','EKSTRA PLUS SILVER - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('e1d88dc7-337b-5b41-83fd-79c4b890034e','yarimamul','uretim','Paspas','1102 201-PR','EKSTRA PLUS SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('211480cf-18ce-56b0-b069-2be9ce6bbc7c','yarimamul','uretim','Paspas','1101 209-PR','GOODYEAR SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('233236af-6c50-5e6e-b759-8ac01f8b70db','yarimamul','uretim','Paspas','1120 103-PR','ICON BEJ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('010da354-bd34-5ca3-afe6-72b5e134bf81','yarimamul','uretim','Paspas','1120 102-PR','ICON GRİ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('ea9d5c2c-ce53-5bf4-b3c9-910724ac0708','yarimamul','uretim','Paspas','1120 101-PR','ICON SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('481e4b5e-e13b-5fba-ab9c-00e031a8710b','yarimamul','uretim','Paspas','1112 103-PR','MAXIMUM BEJ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('55673609-519b-5f50-80f5-ad0f39ade3e6','yarimamul','uretim','Paspas','1112 105-PR','MAXIMUM BEJ - PND - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('37eaa795-1442-5e00-896b-d099c693ed37','yarimamul','uretim','Paspas','1112 102-PR','MAXIMUM GRİ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('2bf9781a-f57b-530d-9c2a-235454791f02','yarimamul','uretim','Paspas','1112 106-PR','MAXIMUM GRİ - PND - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('f96be8e4-5665-51d7-ae14-a8eb7ba66758','yarimamul','uretim','Paspas','1112 101-SG','MAXIMUM SİYAH - Sağ',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('83361741-0173-5e6f-b01f-1a5e188f92b2','yarimamul','uretim','Paspas','1112 101-SL','MAXIMUM SİYAH - Sol',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('b229eb82-9452-54bf-8b0e-cbfa6c4cf97d','yarimamul','uretim','Paspas','1112 104-SG','MAXIMUM SİYAH - PND - Sağ',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('3d013d62-63f4-5a70-9859-d94492b9992c','yarimamul','uretim','Paspas','1112 104-SL','MAXIMUM SİYAH - PND - Sol',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('3a2881a6-0d36-5ffa-a0c6-398cf0e398ad','yarimamul','uretim','Paspas','1131 101-PR','MEGANE SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('80b27304-934d-50dd-aabb-175431e55a1d','yarimamul','uretim','Paspas','1134 103-SG','MODERN BEJ - Sağ',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('34740cf7-3623-523a-84cf-a1f462f42177','yarimamul','uretim','Paspas','1134 103-SL','MODERN BEJ - Sol',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('0660704a-0d24-509b-9ab6-4057059f30fb','yarimamul','uretim','Paspas','1134 102-SG','MODERN GRİ - Sağ',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('f7a3da25-d8a6-58fd-aee6-95097930c46d','yarimamul','uretim','Paspas','1134 102-SL','MODERN GRİ - Sol',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('432f87ac-50df-59fa-abb0-29f5d7304db1','yarimamul','uretim','Paspas','1134 104-PR','MODERN KARBON - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('55ccb079-2a9b-5567-88ff-c7a55da38668','yarimamul','uretim','Paspas','1134 105-PR','MODERN KIRMIZI - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('dd529759-39c2-5aff-8c11-0c7ab3b63c91','yarimamul','uretim','Paspas','1134 106-PR','MODERN MAVİ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('5812ff9f-2cb6-589c-8c88-741c681c0490','yarimamul','uretim','Paspas','1134 107-PR','MODERN SILVER - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('93a01206-4127-56f5-b814-27c133007c82','yarimamul','uretim','Paspas','1134 101-SG','MODERN SİYAH - Sağ',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('85cf9a4f-3969-532e-a80c-bbd2497183b6','yarimamul','uretim','Paspas','1134 101-SL','MODERN SİYAH - Sol',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('acee1b8b-ffce-5ca4-b16a-6eb28dbc1165','yarimamul','uretim','Paspas','1116 203-PR','ORBİTAL BEJ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('943ae7ae-ba68-5430-b56b-e9e7084bbc14','yarimamul','uretim','Paspas','1116 202-PR','ORBİTAL GRİ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('feacac64-9cbf-50b7-9b51-160502547ba5','yarimamul','uretim','Paspas','1116 211-PR','ORBITAL KARBON - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('d751b589-4101-53df-83ec-0eb890ab656a','yarimamul','uretim','Paspas','1116 212-PR','ORBITAL KIRMIZI - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('c91556be-c90e-5e2f-9036-2ec92edf8faf','yarimamul','uretim','Paspas','1116 213-PR','ORBITAL MAVİ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('0bf5cb28-2e10-5fa2-945f-da004a8a0e6b','yarimamul','uretim','Paspas','1116 214-PR','ORBITAL SILVER - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('df1d73ad-1c0f-5e84-8197-680c42409d68','yarimamul','uretim','Paspas','1116 201-PR','ORBİTAL SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('1e599a28-bdb9-5294-96b8-e238fd8f672e','yarimamul','uretim','Paspas','1198 102-PR','OTO PASPAS 4 PARÇA - 00100358 - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('6f68a249-e5eb-54c7-9260-5eab6fa1b2af','yarimamul','uretim','Paspas','1118 103-PR','PARS BEJ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('ff35e23d-ea46-504c-ae26-c66f6fc650a0','yarimamul','uretim','Paspas','1118 102-PR','PARS GRİ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('1568811c-393c-54d9-a65a-99aa6e6aa36e','yarimamul','uretim','Paspas','1118 101-PR','PARS SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('43c44efe-d0fe-5e58-a67a-368da7677791','yarimamul','uretim','Paspas','1110 103-PR','PROFESYONEL BEJ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('b9476c86-4750-5b03-a06d-575c0c71d923','yarimamul','uretim','Paspas','1110 102-PR','PROFESYONEL GRİ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('9ac170ad-4836-536f-9e6d-4a54d0be82a2','yarimamul','uretim','Paspas','1110 101-PR','PROFESYONEL SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('4ca76a88-51f6-5276-9614-da3ef9c38471','yarimamul','uretim','Paspas','1117 103-PR','PROTON BEJ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('08b75678-4d74-54c2-83b8-9a09f99f4dbf','yarimamul','uretim','Paspas','1117 102-PR','PROTON GRİ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('b9630b98-55f3-5e88-a1ed-b0bab82ec82a','yarimamul','uretim','Paspas','1117 101-PR','PROTON SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('8a8f09d9-af35-53c9-a5e1-7d3ecdcb567b','yarimamul','uretim','Paspas','1139 101-PR','SANDERO SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('85a14b49-f164-59fd-88fa-a253e826c254','yarimamul','uretim','Paspas','1101 103-PR','STAR  BEJ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('46aab2e6-5afb-554c-be6e-b3635b837f19','yarimamul','uretim','Paspas','1101 102-PR','STAR  GRİ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('14217aaf-1eaf-5246-b5fa-58c25f99bf93','yarimamul','uretim','Paspas','1101 203-PR','STAR  PLUS BEJ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('a2f4039d-25f4-573f-8b38-667ff726e1fe','yarimamul','uretim','Paspas','1101 202-PR','STAR  PLUS GRİ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('937dbf3d-5b54-5b6a-b396-6618be4ffa71','yarimamul','uretim','Paspas','1101 208-PR','STAR PLUS BEJ - BSG - Parça',NULL,'adet','BSG 99-993-033',NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('234cf3a6-7ef5-50c5-a57d-7cd80590e49f','yarimamul','uretim','Paspas','1101 207-PR','STAR PLUS GRİ - BSG - Parça',NULL,'adet','BSG 99-993-034',NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('ab962d31-9f4e-58ee-a147-d1a2fdf048a9','yarimamul','uretim','Paspas','1101 201-PR','STAR PLUS SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('28c0cef4-814b-5f06-869c-ecdbe0c7d70d','yarimamul','uretim','Paspas','1101 206-PR','STAR PLUS SİYAH - BSG - Parça',NULL,'adet','BSG 99-993-001',NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('1ce74f87-6ee4-5aae-9617-4adbaefd6f19','yarimamul','uretim','Paspas','1101 101-PR','STAR SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('4cc28cb6-3be7-5e86-8460-c9aaa13d73f0','yarimamul','uretim','Paspas','1114 103-PR','TUNA BEJ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('a96e4109-9b2f-5a16-95ec-a690b02bdefb','yarimamul','uretim','Paspas','1114 102-PR','TUNA GRİ - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('ba46b74c-d816-521b-a1a5-000a3873ed36','yarimamul','uretim','Paspas','1114 101-PR','TUNA SİYAH - Parça',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('005e737d-3a61-5018-af25-707c453f75b5','yarimamul','uretim','Paspas','1119 103-SG','VECTOR BEJ - Sağ',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('59737301-503c-5a8f-a151-30f9cb28209e','yarimamul','uretim','Paspas','1119 103-SL','VECTOR BEJ - Sol',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('63489b20-cff2-5734-8065-c99376cac524','yarimamul','uretim','Paspas','1119 102-SG','VECTOR GRİ - Sağ',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('a0c0ffe0-8e30-5903-9707-6781b0b2128b','yarimamul','uretim','Paspas','1119 102-SL','VECTOR GRİ - Sol',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('1a66940c-4123-5d3d-bf01-73a6c770e946','yarimamul','uretim','Paspas','1119 101-SG','VECTOR SİYAH - Sağ',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW()),
('6e111924-eb2b-5fb7-87e1-2d572e9ef36e','yarimamul','uretim','Paspas','1119 101-SL','VECTOR SİYAH - Sol',NULL,'adet',NULL,NULL,NULL,NULL,0.0000,0.0000,0.0000,NULL,20.00,NULL,1,NOW(),NOW());

-- 2) Mevcut urun_operasyonlari kayıtlarını yarı mamullere taşı
UPDATE `urun_operasyonlari` SET `urun_id`='55ccb079-2a9b-5567-88ff-c7a55da38668' WHERE `id`='1f16f7de-3746-425d-a29e-b275939c95d7';
UPDATE `urun_operasyonlari` SET `urun_id`='08b75678-4d74-54c2-83b8-9a09f99f4dbf' WHERE `id`='04485f1a-1144-4dd9-a204-0572c2bc9e9c';
UPDATE `urun_operasyonlari` SET `urun_id`='943ae7ae-ba68-5430-b56b-e9e7084bbc14' WHERE `id`='4f49ac4c-1986-427d-abae-ffd606aba553';
UPDATE `urun_operasyonlari` SET `urun_id`='df1d73ad-1c0f-5e84-8197-680c42409d68' WHERE `id`='6d67bf58-8e08-46bf-85fd-7900382053ce';
UPDATE `urun_operasyonlari` SET `urun_id`='f7a3da25-d8a6-58fd-aee6-95097930c46d' WHERE `id`='39a6e918-c2c8-4ef3-916f-64672c78f50e';
UPDATE `urun_operasyonlari` SET `urun_id`='0660704a-0d24-509b-9ab6-4057059f30fb' WHERE `id`='f5077d2b-76c1-4e4f-a739-cb55c68e45b1';
UPDATE `urun_operasyonlari` SET `urun_id`='e1d88dc7-337b-5b41-83fd-79c4b890034e' WHERE `id`='94336e00-4f65-479f-9744-d1ab83a142a5';
UPDATE `urun_operasyonlari` SET `urun_id`='29cb93b1-d562-5daf-8e7e-3bcf46a4131f' WHERE `id`='db320653-63ed-4bb0-8c4c-ac06c68efad5';
UPDATE `urun_operasyonlari` SET `urun_id`='8a8f09d9-af35-53c9-a5e1-7d3ecdcb567b' WHERE `id`='418cfb15-4e89-4823-8dd9-e5ecbe2e3f2d';
UPDATE `urun_operasyonlari` SET `urun_id`='c1471548-be16-595c-aa57-14e983401b43' WHERE `id`='79a2c792-6908-423b-a82a-037cd9c861a9';
UPDATE `urun_operasyonlari` SET `urun_id`='3d013d62-63f4-5a70-9859-d94492b9992c' WHERE `id`='692ceee2-b69c-42a9-aee5-e504db246ab9';
UPDATE `urun_operasyonlari` SET `urun_id`='b229eb82-9452-54bf-8b0e-cbfa6c4cf97d' WHERE `id`='02943fd3-98a2-4bf0-8e8e-f3136d5e1e08';
UPDATE `urun_operasyonlari` SET `urun_id`='211480cf-18ce-56b0-b069-2be9ce6bbc7c' WHERE `id`='ac8dc6d5-d6bb-47d7-90f6-c21fbf61479b';
UPDATE `urun_operasyonlari` SET `urun_id`='a0c0ffe0-8e30-5903-9707-6781b0b2128b' WHERE `id`='4e3d7513-3950-4913-82fd-31f828de32a6';
UPDATE `urun_operasyonlari` SET `urun_id`='63489b20-cff2-5734-8065-c99376cac524' WHERE `id`='cde33e46-6c17-438a-96f4-f3056b4c11e2';
UPDATE `urun_operasyonlari` SET `urun_id`='0bf5cb28-2e10-5fa2-945f-da004a8a0e6b' WHERE `id`='a9dd151a-3955-49fa-beb1-53874d321492';
UPDATE `urun_operasyonlari` SET `urun_id`='ba46b74c-d816-521b-a1a5-000a3873ed36' WHERE `id`='f0795c07-cf6b-45f6-9fe3-1804d326da66';
UPDATE `urun_operasyonlari` SET `urun_id`='f3bb5314-d2f9-51d6-8e06-a47e754280ab' WHERE `id`='6a09b2d1-e8b8-496c-84c3-8bc0339cc1ee';
UPDATE `urun_operasyonlari` SET `urun_id`='233236af-6c50-5e6e-b759-8ac01f8b70db' WHERE `id`='8135e033-e1d9-460f-bbc4-2d479a93037c';
UPDATE `urun_operasyonlari` SET `urun_id`='85a14b49-f164-59fd-88fa-a253e826c254' WHERE `id`='0feeba39-bbe1-491f-85f1-fb55984a4e50';
UPDATE `urun_operasyonlari` SET `urun_id`='3a2881a6-0d36-5ffa-a0c6-398cf0e398ad' WHERE `id`='7d7bc138-a5fe-4597-9aca-0366d5e5a74b';
UPDATE `urun_operasyonlari` SET `urun_id`='acee1b8b-ffce-5ca4-b16a-6eb28dbc1165' WHERE `id`='e4110a7b-be1f-4df7-bbb6-9a6686a71b52';
UPDATE `urun_operasyonlari` SET `urun_id`='28c0cef4-814b-5f06-869c-ecdbe0c7d70d' WHERE `id`='ce22bdcc-5d22-447e-8ef0-fbdb8b082ee8';
UPDATE `urun_operasyonlari` SET `urun_id`='2bf9781a-f57b-530d-9c2a-235454791f02' WHERE `id`='88263335-bd25-43e8-a6d5-89900559a171';
UPDATE `urun_operasyonlari` SET `urun_id`='a2f4039d-25f4-573f-8b38-667ff726e1fe' WHERE `id`='d5d0a273-bfaf-42b9-9fd8-2a7921b3cfcb';
UPDATE `urun_operasyonlari` SET `urun_id`='c91556be-c90e-5e2f-9036-2ec92edf8faf' WHERE `id`='7682fd4a-fcc8-478e-8c33-3e9059d1fef5';
UPDATE `urun_operasyonlari` SET `urun_id`='6f68a249-e5eb-54c7-9260-5eab6fa1b2af' WHERE `id`='3458bf9c-64a7-4f84-9a4a-a063031599a6';
UPDATE `urun_operasyonlari` SET `urun_id`='20a3a30d-3075-53da-a13a-1e61a5ae0fa9' WHERE `id`='48ac1510-cc0f-4a1e-8b23-a89032262bf1';
UPDATE `urun_operasyonlari` SET `urun_id`='a96e4109-9b2f-5a16-95ec-a690b02bdefb' WHERE `id`='04191f31-cadb-4728-ac5a-4fd5d8ccec70';
UPDATE `urun_operasyonlari` SET `urun_id`='a7e9949e-597b-54aa-b712-0be5044c7ad5' WHERE `id`='f70b3c95-5b28-47ed-9b05-ea629d8ba43f';
UPDATE `urun_operasyonlari` SET `urun_id`='dd529759-39c2-5aff-8c11-0c7ab3b63c91' WHERE `id`='0948994a-edb7-4d8b-8706-00f14314d8ab';
UPDATE `urun_operasyonlari` SET `urun_id`='01d161ca-fa8f-5fc2-b68b-d296b5502938' WHERE `id`='3ecea105-d934-4916-9885-77350ea06282';
UPDATE `urun_operasyonlari` SET `urun_id`='34740cf7-3623-523a-84cf-a1f462f42177' WHERE `id`='a2f8bd28-5fd2-45b2-8343-5569cdc852f9';
UPDATE `urun_operasyonlari` SET `urun_id`='80b27304-934d-50dd-aabb-175431e55a1d' WHERE `id`='80275736-8fa5-4814-b6be-a80cd392af5a';
UPDATE `urun_operasyonlari` SET `urun_id`='feacac64-9cbf-50b7-9b51-160502547ba5' WHERE `id`='cf2a5c74-5b71-4bc0-9bf1-9e0e288e5c57';
UPDATE `urun_operasyonlari` SET `urun_id`='234cf3a6-7ef5-50c5-a57d-7cd80590e49f' WHERE `id`='ba184aaa-7df7-4ff9-ba02-af1fcdc55a88';
UPDATE `urun_operasyonlari` SET `urun_id`='ebd999ee-4586-5ae5-b5bf-6d292e4c6fcb' WHERE `id`='c37aaa57-fb0f-40f7-a470-90567a2abd81';
UPDATE `urun_operasyonlari` SET `urun_id`='83361741-0173-5e6f-b01f-1a5e188f92b2' WHERE `id`='d3e90434-caf4-442d-adc4-aa56582462bb';
UPDATE `urun_operasyonlari` SET `urun_id`='f96be8e4-5665-51d7-ae14-a8eb7ba66758' WHERE `id`='a4a11e10-e172-4f09-8afa-0f5eda10557f';
UPDATE `urun_operasyonlari` SET `urun_id`='6e111924-eb2b-5fb7-87e1-2d572e9ef36e' WHERE `id`='85760f4c-a9fe-4cfb-babb-ac01d58ea751';
UPDATE `urun_operasyonlari` SET `urun_id`='1a66940c-4123-5d3d-bf01-73a6c770e946' WHERE `id`='a2c129e2-b177-4263-a54b-4e4cbed6fc6e';
UPDATE `urun_operasyonlari` SET `urun_id`='85cf9a4f-3969-532e-a80c-bbd2497183b6' WHERE `id`='7306c007-6d7e-4b0c-b895-d513a721d004';
UPDATE `urun_operasyonlari` SET `urun_id`='93a01206-4127-56f5-b814-27c133007c82' WHERE `id`='b1da6c92-cda1-4ade-b156-16f60c564947';
UPDATE `urun_operasyonlari` SET `urun_id`='4ca76a88-51f6-5276-9614-da3ef9c38471' WHERE `id`='aabf5a18-930b-4242-b766-501a6015bee3';
UPDATE `urun_operasyonlari` SET `urun_id`='b9476c86-4750-5b03-a06d-575c0c71d923' WHERE `id`='c5f7d23e-41ff-4b37-ae66-a6ae2df325d9';
UPDATE `urun_operasyonlari` SET `urun_id`='5812ff9f-2cb6-589c-8c88-741c681c0490' WHERE `id`='480b6d98-1104-4b4c-8222-d2f5ca99d836';
UPDATE `urun_operasyonlari` SET `urun_id`='b9630b98-55f3-5e88-a1ed-b0bab82ec82a' WHERE `id`='4cd15a78-c534-4b93-aa10-9ca12180b061';
UPDATE `urun_operasyonlari` SET `urun_id`='46aab2e6-5afb-554c-be6e-b3635b837f19' WHERE `id`='c913ee55-8395-4c91-a1b4-beef10673cd8';
UPDATE `urun_operasyonlari` SET `urun_id`='ab962d31-9f4e-58ee-a147-d1a2fdf048a9' WHERE `id`='20675218-d799-41cd-a6ee-91c2336edddd';
UPDATE `urun_operasyonlari` SET `urun_id`='ea9d5c2c-ce53-5bf4-b3c9-910724ac0708' WHERE `id`='f0210979-4c64-4e01-a358-bd816d418a94';
UPDATE `urun_operasyonlari` SET `urun_id`='1e599a28-bdb9-5294-96b8-e238fd8f672e' WHERE `id`='44fd9aea-341f-4bc7-bbe7-cfc43e0b0e3f';
UPDATE `urun_operasyonlari` SET `urun_id`='43c44efe-d0fe-5e58-a67a-368da7677791' WHERE `id`='fb54f318-1d98-48eb-ab35-5927c8f1ad9d';
UPDATE `urun_operasyonlari` SET `urun_id`='59737301-503c-5a8f-a151-30f9cb28209e' WHERE `id`='a8842a15-bc42-4fb8-bc52-d8453588acce';
UPDATE `urun_operasyonlari` SET `urun_id`='005e737d-3a61-5018-af25-707c453f75b5' WHERE `id`='5091c858-0eba-4032-8ab7-de1b82e23edc';
UPDATE `urun_operasyonlari` SET `urun_id`='481e4b5e-e13b-5fba-ab9c-00e031a8710b' WHERE `id`='d1ae5193-d4fb-4fb0-b56d-3635cd2a48d8';
UPDATE `urun_operasyonlari` SET `urun_id`='4cc28cb6-3be7-5e86-8460-c9aaa13d73f0' WHERE `id`='81226d22-155b-4f34-ac02-816d0df40c58';
UPDATE `urun_operasyonlari` SET `urun_id`='d0b1a358-5eda-5840-9ffd-434ffddebc3b' WHERE `id`='8e6c8ec4-22cd-4bbb-97ac-e12340222005';
UPDATE `urun_operasyonlari` SET `urun_id`='010da354-bd34-5ca3-afe6-72b5e134bf81' WHERE `id`='55a1f025-b513-4136-97c4-a77ebf47e4e4';
UPDATE `urun_operasyonlari` SET `urun_id`='ff35e23d-ea46-504c-ae26-c66f6fc650a0' WHERE `id`='3f5c6b94-ee86-49f8-aff4-f1aad8b7216e';
UPDATE `urun_operasyonlari` SET `urun_id`='46de9c64-eb96-54b1-9c2b-329a406adab9' WHERE `id`='87e9d781-9820-425e-a7d1-e246f783901b';
UPDATE `urun_operasyonlari` SET `urun_id`='fd286235-0b0f-5844-9d43-641f2df95342' WHERE `id`='e8d50b80-b2f4-4a05-b9a4-a6849b377cb9';
UPDATE `urun_operasyonlari` SET `urun_id`='937dbf3d-5b54-5b6a-b396-6618be4ffa71' WHERE `id`='f179f13f-df0a-4a26-b090-cacddfc9381d';
UPDATE `urun_operasyonlari` SET `urun_id`='432f87ac-50df-59fa-abb0-29f5d7304db1' WHERE `id`='24518e87-69a2-42ed-9280-b226d80c6cd2';
UPDATE `urun_operasyonlari` SET `urun_id`='37eaa795-1442-5e00-896b-d099c693ed37' WHERE `id`='20fa2e20-f154-4081-abf6-250bfbe8b1a2';
UPDATE `urun_operasyonlari` SET `urun_id`='1ce74f87-6ee4-5aae-9617-4adbaefd6f19' WHERE `id`='1ae74522-2872-4d94-bd54-7ec9ccb951f6';
UPDATE `urun_operasyonlari` SET `urun_id`='d751b589-4101-53df-83ec-0eb890ab656a' WHERE `id`='ae489a11-90ac-4089-9dba-9acf3e4699e8';
UPDATE `urun_operasyonlari` SET `urun_id`='a658ae7b-b267-5c61-ad3f-d55cd589a53f' WHERE `id`='28bf753a-af90-44b6-bea0-4fe5c3bd8f84';
UPDATE `urun_operasyonlari` SET `urun_id`='14217aaf-1eaf-5246-b5fa-58c25f99bf93' WHERE `id`='7c6db37d-7fce-4883-a3e1-fd44a913dc9d';
UPDATE `urun_operasyonlari` SET `urun_id`='a2b42829-b130-5c33-a975-9c7070d22691' WHERE `id`='f05d3381-e8f6-4d75-8c4d-cff8dc3ea2c7';
UPDATE `urun_operasyonlari` SET `urun_id`='1568811c-393c-54d9-a65a-99aa6e6aa36e' WHERE `id`='3e32d501-044c-475f-8b4e-3a3f808d9fd6';
UPDATE `urun_operasyonlari` SET `urun_id`='55673609-519b-5f50-80f5-ad0f39ade3e6' WHERE `id`='edf99515-6dfb-47c4-8853-d3a898b56b04';
UPDATE `urun_operasyonlari` SET `urun_id`='9ac170ad-4836-536f-9e6d-4a54d0be82a2' WHERE `id`='a4051544-f23b-46d7-8cd1-884b16cb9a5b';

-- 3) Mevcut reçetelere yarı mamul kalemleri ekle (cift: 1×Sağ+1×Sol, tek: 2×Parça)
INSERT IGNORE INTO `recete_kalemleri` (`id`,`recete_id`,`urun_id`,`miktar`,`fire_orani`,`sira`,`created_at`,`updated_at`) VALUES
('71b501b6-724e-55af-8767-84c0bf9cd83b','r0000001-0000-4000-8000-000000000021','274d25c4-6b08-512c-b762-94f7a4cdf014',1.0000,0.00,1,NOW(),NOW()),
('1e59177b-39bd-5f7b-af47-3c32dca822c1','r0000001-0000-4000-8000-000000000021','d28d3592-cb85-5f26-a16a-6374dec0b63c',1.0000,0.00,2,NOW(),NOW()),
('b959ffab-dc8b-5cbe-987f-92635b320ed5','a53f7fb7-0db7-43c0-84ec-aa269672eb15','a658ae7b-b267-5c61-ad3f-d55cd589a53f',2.0000,0.00,1,NOW(),NOW()),
('b34aa3cf-2417-5f9f-b075-cb1163a1db28','b907b896-9fb5-4f20-aad4-f8c8be11c29a','b229eb82-9452-54bf-8b0e-cbfa6c4cf97d',1.0000,0.00,1,NOW(),NOW()),
('a9c56f12-a225-59a0-8551-7639a9fff765','b907b896-9fb5-4f20-aad4-f8c8be11c29a','3d013d62-63f4-5a70-9859-d94492b9992c',1.0000,0.00,2,NOW(),NOW()),
('5f95704b-bbb2-57d0-8c63-2be9434bac47','731f15d8-6c95-4e71-a867-3a02124b934a','f96be8e4-5665-51d7-ae14-a8eb7ba66758',1.0000,0.00,1,NOW(),NOW()),
('0d7529a0-5367-597a-9a0f-12d5546ed395','731f15d8-6c95-4e71-a867-3a02124b934a','83361741-0173-5e6f-b01f-1a5e188f92b2',1.0000,0.00,2,NOW(),NOW()),
('d549712a-6b24-5ff7-a314-ff1a281b3c32','078a5908-86f8-4954-b9b9-5f0de9b64913','80b27304-934d-50dd-aabb-175431e55a1d',1.0000,0.00,1,NOW(),NOW()),
('f4b2508d-3441-5807-99d7-a2f52a00a6dd','078a5908-86f8-4954-b9b9-5f0de9b64913','34740cf7-3623-523a-84cf-a1f462f42177',1.0000,0.00,2,NOW(),NOW()),
('0988704c-9006-58ac-8a0f-620c4c3958c9','d57862eb-e9ff-449f-9f46-1443796836c3','0660704a-0d24-509b-9ab6-4057059f30fb',1.0000,0.00,1,NOW(),NOW()),
('6fbd7876-bf5a-5cd8-a2c4-e4b7b46e6d11','d57862eb-e9ff-449f-9f46-1443796836c3','f7a3da25-d8a6-58fd-aee6-95097930c46d',1.0000,0.00,2,NOW(),NOW()),
('2232753c-f91a-5741-9ae9-44b56413aee7','2699cb0d-e574-4141-9803-83dc32a9094d','93a01206-4127-56f5-b814-27c133007c82',1.0000,0.00,1,NOW(),NOW()),
('8c735d9e-12ff-5c98-b50d-59b33ade3831','2699cb0d-e574-4141-9803-83dc32a9094d','85cf9a4f-3969-532e-a80c-bbd2497183b6',1.0000,0.00,2,NOW(),NOW()),
('9277091b-1841-514d-9410-a632b6fde740','449e7d35-d3d9-47d2-9e38-c6c8f86e1716','005e737d-3a61-5018-af25-707c453f75b5',1.0000,0.00,1,NOW(),NOW()),
('03f181b8-f204-57ad-9809-61cdcf91c651','449e7d35-d3d9-47d2-9e38-c6c8f86e1716','59737301-503c-5a8f-a151-30f9cb28209e',1.0000,0.00,2,NOW(),NOW()),
('88e9081d-dcff-58a6-92fb-6ba33501ade5','7cffb077-23cf-4e2c-b8ae-0e3f348fbec0','63489b20-cff2-5734-8065-c99376cac524',1.0000,0.00,1,NOW(),NOW()),
('97a64efa-24ec-566a-b610-478d78d3fe37','7cffb077-23cf-4e2c-b8ae-0e3f348fbec0','a0c0ffe0-8e30-5903-9707-6781b0b2128b',1.0000,0.00,2,NOW(),NOW()),
('eaa802c5-187c-5b7b-a4a8-5641cba026aa','e4b26b9b-1e07-428f-9d57-87b316d3b68d','1a66940c-4123-5d3d-bf01-73a6c770e946',1.0000,0.00,1,NOW(),NOW()),
('58feb607-88f8-5a0c-b3cb-c8a4ae737be2','e4b26b9b-1e07-428f-9d57-87b316d3b68d','6e111924-eb2b-5fb7-87e1-2d572e9ef36e',1.0000,0.00,2,NOW(),NOW());

-- 4) Eski 'yarimamul' kategorisindeki ambalaj kayıtları 'hammadde'ye taşı
--    (yeni mimaride yarimamul = sağ/sol/parça; ambalaj ise hammadde)
UPDATE `urunler` SET `kategori`='hammadde'
WHERE `kategori`='yarimamul'
  AND `id` NOT IN ('a7e9949e-597b-54aa-b712-0be5044c7ad5','274d25c4-6b08-512c-b762-94f7a4cdf014','d28d3592-cb85-5f26-a16a-6374dec0b63c','c1471548-be16-595c-aa57-14e983401b43','a658ae7b-b267-5c61-ad3f-d55cd589a53f','46de9c64-eb96-54b1-9c2b-329a406adab9','d0b1a358-5eda-5840-9ffd-434ffddebc3b','a2b42829-b130-5c33-a975-9c7070d22691','01d161ca-fa8f-5fc2-b68b-d296b5502938','29cb93b1-d562-5daf-8e7e-3bcf46a4131f','fd286235-0b0f-5844-9d43-641f2df95342','20a3a30d-3075-53da-a13a-1e61a5ae0fa9','f3bb5314-d2f9-51d6-8e06-a47e754280ab','ebd999ee-4586-5ae5-b5bf-6d292e4c6fcb','e1d88dc7-337b-5b41-83fd-79c4b890034e','211480cf-18ce-56b0-b069-2be9ce6bbc7c','233236af-6c50-5e6e-b759-8ac01f8b70db','010da354-bd34-5ca3-afe6-72b5e134bf81','ea9d5c2c-ce53-5bf4-b3c9-910724ac0708','481e4b5e-e13b-5fba-ab9c-00e031a8710b','55673609-519b-5f50-80f5-ad0f39ade3e6','37eaa795-1442-5e00-896b-d099c693ed37','2bf9781a-f57b-530d-9c2a-235454791f02','f96be8e4-5665-51d7-ae14-a8eb7ba66758','83361741-0173-5e6f-b01f-1a5e188f92b2','b229eb82-9452-54bf-8b0e-cbfa6c4cf97d','3d013d62-63f4-5a70-9859-d94492b9992c','3a2881a6-0d36-5ffa-a0c6-398cf0e398ad','80b27304-934d-50dd-aabb-175431e55a1d','34740cf7-3623-523a-84cf-a1f462f42177','0660704a-0d24-509b-9ab6-4057059f30fb','f7a3da25-d8a6-58fd-aee6-95097930c46d','432f87ac-50df-59fa-abb0-29f5d7304db1','55ccb079-2a9b-5567-88ff-c7a55da38668','dd529759-39c2-5aff-8c11-0c7ab3b63c91','5812ff9f-2cb6-589c-8c88-741c681c0490','93a01206-4127-56f5-b814-27c133007c82','85cf9a4f-3969-532e-a80c-bbd2497183b6','acee1b8b-ffce-5ca4-b16a-6eb28dbc1165','943ae7ae-ba68-5430-b56b-e9e7084bbc14','feacac64-9cbf-50b7-9b51-160502547ba5','d751b589-4101-53df-83ec-0eb890ab656a','c91556be-c90e-5e2f-9036-2ec92edf8faf','0bf5cb28-2e10-5fa2-945f-da004a8a0e6b','df1d73ad-1c0f-5e84-8197-680c42409d68','1e599a28-bdb9-5294-96b8-e238fd8f672e','6f68a249-e5eb-54c7-9260-5eab6fa1b2af','ff35e23d-ea46-504c-ae26-c66f6fc650a0','1568811c-393c-54d9-a65a-99aa6e6aa36e','43c44efe-d0fe-5e58-a67a-368da7677791','b9476c86-4750-5b03-a06d-575c0c71d923','9ac170ad-4836-536f-9e6d-4a54d0be82a2','4ca76a88-51f6-5276-9614-da3ef9c38471','08b75678-4d74-54c2-83b8-9a09f99f4dbf','b9630b98-55f3-5e88-a1ed-b0bab82ec82a','8a8f09d9-af35-53c9-a5e1-7d3ecdcb567b','85a14b49-f164-59fd-88fa-a253e826c254','46aab2e6-5afb-554c-be6e-b3635b837f19','14217aaf-1eaf-5246-b5fa-58c25f99bf93','a2f4039d-25f4-573f-8b38-667ff726e1fe','937dbf3d-5b54-5b6a-b396-6618be4ffa71','234cf3a6-7ef5-50c5-a57d-7cd80590e49f','ab962d31-9f4e-58ee-a147-d1a2fdf048a9','28c0cef4-814b-5f06-869c-ecdbe0c7d70d','1ce74f87-6ee4-5aae-9617-4adbaefd6f19','4cc28cb6-3be7-5e86-8460-c9aaa13d73f0','a96e4109-9b2f-5a16-95ec-a690b02bdefb','ba46b74c-d816-521b-a1a5-000a3873ed36','005e737d-3a61-5018-af25-707c453f75b5','59737301-503c-5a8f-a151-30f9cb28209e','63489b20-cff2-5734-8065-c99376cac524','a0c0ffe0-8e30-5903-9707-6781b0b2128b','1a66940c-4123-5d3d-bf01-73a6c770e946','6e111924-eb2b-5fb7-87e1-2d572e9ef36e');

SET FOREIGN_KEY_CHECKS = 1;
