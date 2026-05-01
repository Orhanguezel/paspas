-- AUTO-GENERATED — generate-malzeme-gorselleri-seed.ts
-- Drive klasöründen indirilmiş malzeme görsellerini storage_assets / urunler / urun_medya tablolarına bağlar.
-- Idempotent: INSERT IGNORE + UPDATE WHERE image_url IS NULL pattern.

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('8bbf9f59-5eb4-e33b-d324-96f8fa5a16a2', NULL, '1101_101_a.png', 'product-images', 'malzemeler/1101_101_a.png', 'malzemeler', 'image/png', 385638, NULL, NULL, '/uploads/malzemeler/1101_101_a.png', NULL, 'local', '1101_101_a', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1101_101_a.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '16cbfd94-55fd-7296-035b-cfec83d610ca', u.id, 'image', '/uploads/malzemeler/1101_101_a.png', '8bbf9f59-5eb4-e33b-d324-96f8fa5a16a2', NULL, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1101 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('05e2801f-0280-b353-2df4-5aa0c8dd4334', NULL, '1101_101_b.jpg', 'product-images', 'malzemeler/1101_101_b.jpg', 'malzemeler', 'image/jpeg', 285032, NULL, NULL, '/uploads/malzemeler/1101_101_b.jpg', NULL, 'local', '1101_101_b', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1101_101_b.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '5116b6d4-0a6f-0765-877d-9d78aa776e41', u.id, 'image', '/uploads/malzemeler/1101_101_b.jpg', '05e2801f-0280-b353-2df4-5aa0c8dd4334', NULL, 2, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1101 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('6682f8ac-20f4-b82c-1659-e8f7b74cdda8', NULL, '1101_101_c.png', 'product-images', 'malzemeler/1101_101_c.png', 'malzemeler', 'image/png', 756170, NULL, NULL, '/uploads/malzemeler/1101_101_c.png', NULL, 'local', '1101_101_c', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1101_101_c.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '0fb4f208-2af2-c15c-4123-e9c6266a6201', u.id, 'image', '/uploads/malzemeler/1101_101_c.png', '6682f8ac-20f4-b82c-1659-e8f7b74cdda8', NULL, 3, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1101 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('b86e35e6-ec92-4792-9198-0816ffdad636', NULL, '1101_101_kpk.png', 'product-images', 'malzemeler/1101_101_kpk.png', 'malzemeler', 'image/png', 249907, NULL, NULL, '/uploads/malzemeler/1101_101_kpk.png', NULL, 'local', '1101_101_kpk', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1101_101_kpk.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1101_101_kpk.png', storage_asset_id = 'b86e35e6-ec92-4792-9198-0816ffdad636' WHERE kod = '1101 101' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '1ceccbb5-f762-3a0c-5e83-79866da48001', u.id, 'image', '/uploads/malzemeler/1101_101_kpk.png', 'b86e35e6-ec92-4792-9198-0816ffdad636', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1101 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('ee1ee413-d6ac-a30d-f81c-93d7906af972', NULL, '1101_102.png', 'product-images', 'malzemeler/1101_102.png', 'malzemeler', 'image/png', 43259, NULL, NULL, '/uploads/malzemeler/1101_102.png', NULL, 'local', '1101_102', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1101_102.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1101_102.png', storage_asset_id = 'ee1ee413-d6ac-a30d-f81c-93d7906af972' WHERE kod = '1101 102' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '2808787f-c3fa-6623-b8f5-99131239507b', u.id, 'image', '/uploads/malzemeler/1101_102.png', 'ee1ee413-d6ac-a30d-f81c-93d7906af972', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1101 102' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('43cc3c5f-40a8-b0a5-07de-152dcf1a5139', NULL, '1101_103.png', 'product-images', 'malzemeler/1101_103.png', 'malzemeler', 'image/png', 44863, NULL, NULL, '/uploads/malzemeler/1101_103.png', NULL, 'local', '1101_103', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1101_103.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1101_103.png', storage_asset_id = '43cc3c5f-40a8-b0a5-07de-152dcf1a5139' WHERE kod = '1101 103' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '41245bc2-da38-8661-b5d0-be51da18bd12', u.id, 'image', '/uploads/malzemeler/1101_103.png', '43cc3c5f-40a8-b0a5-07de-152dcf1a5139', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1101 103' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('17b3fe48-9fe3-140a-af04-213ad15f9518', NULL, '1101_201_kpk.png', 'product-images', 'malzemeler/1101_201_kpk.png', 'malzemeler', 'image/png', 347144, NULL, NULL, '/uploads/malzemeler/1101_201_kpk.png', NULL, 'local', '1101_201_kpk', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1101_201_kpk.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1101_201_kpk.png', storage_asset_id = '17b3fe48-9fe3-140a-af04-213ad15f9518' WHERE kod = '1101 201' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '3c0ace5e-c02b-7109-784b-386f3218dfef', u.id, 'image', '/uploads/malzemeler/1101_201_kpk.png', '17b3fe48-9fe3-140a-af04-213ad15f9518', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1101 201' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('2b7b7b7b-69e6-696b-83d6-656c452a5f86', NULL, '1103_201_a.png', 'product-images', 'malzemeler/1103_201_a.png', 'malzemeler', 'image/png', 303007, NULL, NULL, '/uploads/malzemeler/1103_201_a.png', NULL, 'local', '1103_201_a', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1103_201_a.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'eba6b677-0fbb-50ba-1329-947a07a48112', u.id, 'image', '/uploads/malzemeler/1103_201_a.png', '2b7b7b7b-69e6-696b-83d6-656c452a5f86', NULL, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1103 201' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('61ccd0d6-6f58-c25e-ea2a-27dfe3fba173', NULL, '1103_201_b.jpg', 'product-images', 'malzemeler/1103_201_b.jpg', 'malzemeler', 'image/jpeg', 265098, NULL, NULL, '/uploads/malzemeler/1103_201_b.jpg', NULL, 'local', '1103_201_b', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1103_201_b.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '80720d9c-9431-320b-7281-c53b8dbd9ceb', u.id, 'image', '/uploads/malzemeler/1103_201_b.jpg', '61ccd0d6-6f58-c25e-ea2a-27dfe3fba173', NULL, 2, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1103 201' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('80fcab9c-6063-5eee-6eda-a921c2ede034', NULL, '1103_201_c.png', 'product-images', 'malzemeler/1103_201_c.png', 'malzemeler', 'image/png', 711905, NULL, NULL, '/uploads/malzemeler/1103_201_c.png', NULL, 'local', '1103_201_c', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1103_201_c.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '25530700-7f8e-43c0-8bb3-ec722fb79683', u.id, 'image', '/uploads/malzemeler/1103_201_c.png', '80fcab9c-6063-5eee-6eda-a921c2ede034', NULL, 3, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1103 201' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('b85e3c53-f586-d192-9513-b434363db2e9', NULL, '1103_201_kpk.png', 'product-images', 'malzemeler/1103_201_kpk.png', 'malzemeler', 'image/png', 275213, NULL, NULL, '/uploads/malzemeler/1103_201_kpk.png', NULL, 'local', '1103_201_kpk', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1103_201_kpk.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1103_201_kpk.png', storage_asset_id = 'b85e3c53-f586-d192-9513-b434363db2e9' WHERE kod = '1103 201' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '1348c667-dad4-9f49-663b-2799d9004352', u.id, 'image', '/uploads/malzemeler/1103_201_kpk.png', 'b85e3c53-f586-d192-9513-b434363db2e9', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1103 201' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('95ca0dc8-da55-9811-d908-47a48b61b076', NULL, '1110_101_a.png', 'product-images', 'malzemeler/1110_101_a.png', 'malzemeler', 'image/png', 284418, NULL, NULL, '/uploads/malzemeler/1110_101_a.png', NULL, 'local', '1110_101_a', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1110_101_a.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'ca65a1e9-97c3-3268-2d3c-fc327067c53c', u.id, 'image', '/uploads/malzemeler/1110_101_a.png', '95ca0dc8-da55-9811-d908-47a48b61b076', NULL, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1110 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('090bd76d-334e-c9e6-f3bc-596ceba89c59', NULL, '1110_101_b.jpg', 'product-images', 'malzemeler/1110_101_b.jpg', 'malzemeler', 'image/jpeg', 272067, NULL, NULL, '/uploads/malzemeler/1110_101_b.jpg', NULL, 'local', '1110_101_b', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1110_101_b.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'ff3fab89-ad11-bf66-6135-2c3a1448b4df', u.id, 'image', '/uploads/malzemeler/1110_101_b.jpg', '090bd76d-334e-c9e6-f3bc-596ceba89c59', NULL, 2, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1110 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('78371d40-c08b-64d1-b45c-6d1d379311b6', NULL, '1110_101_c.png', 'product-images', 'malzemeler/1110_101_c.png', 'malzemeler', 'image/png', 766600, NULL, NULL, '/uploads/malzemeler/1110_101_c.png', NULL, 'local', '1110_101_c', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1110_101_c.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '6a966a16-22d2-0206-2282-8f0c30325d04', u.id, 'image', '/uploads/malzemeler/1110_101_c.png', '78371d40-c08b-64d1-b45c-6d1d379311b6', NULL, 3, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1110 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('4dd71e62-620f-8f02-8eb0-de1b0185f371', NULL, '1110_101_d.jpg', 'product-images', 'malzemeler/1110_101_d.jpg', 'malzemeler', 'image/jpeg', 1604926, NULL, NULL, '/uploads/malzemeler/1110_101_d.jpg', NULL, 'local', '1110_101_d', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1110_101_d.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '66a88fdd-1aa2-a0f0-1572-682b25514a18', u.id, 'image', '/uploads/malzemeler/1110_101_d.jpg', '4dd71e62-620f-8f02-8eb0-de1b0185f371', NULL, 4, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1110 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('8dc7d260-02f8-d620-3976-8f57792c013e', NULL, '1110_101_e.jpg', 'product-images', 'malzemeler/1110_101_e.jpg', 'malzemeler', 'image/jpeg', 1339521, NULL, NULL, '/uploads/malzemeler/1110_101_e.jpg', NULL, 'local', '1110_101_e', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1110_101_e.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'c8523176-6f0b-780e-cf10-44d6210d22c0', u.id, 'image', '/uploads/malzemeler/1110_101_e.jpg', '8dc7d260-02f8-d620-3976-8f57792c013e', NULL, 5, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1110 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('885e876a-4c5f-4ce0-a89e-a57d8822fc3d', NULL, '1110_101_kpk.png', 'product-images', 'malzemeler/1110_101_kpk.png', 'malzemeler', 'image/png', 300056, NULL, NULL, '/uploads/malzemeler/1110_101_kpk.png', NULL, 'local', '1110_101_kpk', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1110_101_kpk.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1110_101_kpk.png', storage_asset_id = '885e876a-4c5f-4ce0-a89e-a57d8822fc3d' WHERE kod = '1110 101' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '1e6047b0-04fd-8384-e6aa-cb0e3390793e', u.id, 'image', '/uploads/malzemeler/1110_101_kpk.png', '885e876a-4c5f-4ce0-a89e-a57d8822fc3d', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1110 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('f478b690-fa50-b0b9-ab29-b59190c78f78', NULL, '1110_102_a.jpg', 'product-images', 'malzemeler/1110_102_a.jpg', 'malzemeler', 'image/jpeg', 1302954, NULL, NULL, '/uploads/malzemeler/1110_102_a.jpg', NULL, 'local', '1110_102_a', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1110_102_a.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '0caa0b06-c529-929f-4f10-a8d3b929e51d', u.id, 'image', '/uploads/malzemeler/1110_102_a.jpg', 'f478b690-fa50-b0b9-ab29-b59190c78f78', NULL, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1110 102' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('b27e2c31-a1b8-33f0-1d1d-a06a0023012b', NULL, '1110_102_d.jpg', 'product-images', 'malzemeler/1110_102_d.jpg', 'malzemeler', 'image/jpeg', 1447548, NULL, NULL, '/uploads/malzemeler/1110_102_d.jpg', NULL, 'local', '1110_102_d', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1110_102_d.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '1d998230-5a5b-7894-88fc-910a68ebde09', u.id, 'image', '/uploads/malzemeler/1110_102_d.jpg', 'b27e2c31-a1b8-33f0-1d1d-a06a0023012b', NULL, 4, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1110 102' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('7b86237a-8719-447f-1b18-c57d45c3ce95', NULL, '1110_102_e.jpg', 'product-images', 'malzemeler/1110_102_e.jpg', 'malzemeler', 'image/jpeg', 1151651, NULL, NULL, '/uploads/malzemeler/1110_102_e.jpg', NULL, 'local', '1110_102_e', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1110_102_e.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'dfb2b130-0329-d5d6-4cae-35cb816d1db0', u.id, 'image', '/uploads/malzemeler/1110_102_e.jpg', '7b86237a-8719-447f-1b18-c57d45c3ce95', NULL, 5, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1110 102' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('866090cf-d61b-e6f8-4953-7acf87d3fa9f', NULL, '1110_102_kpk.jpg', 'product-images', 'malzemeler/1110_102_kpk.jpg', 'malzemeler', 'image/jpeg', 1179976, NULL, NULL, '/uploads/malzemeler/1110_102_kpk.jpg', NULL, 'local', '1110_102_kpk', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1110_102_kpk.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1110_102_kpk.jpg', storage_asset_id = '866090cf-d61b-e6f8-4953-7acf87d3fa9f' WHERE kod = '1110 102' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'c9b32a55-8750-89b4-570f-6440557f563c', u.id, 'image', '/uploads/malzemeler/1110_102_kpk.jpg', '866090cf-d61b-e6f8-4953-7acf87d3fa9f', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1110 102' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('58e5d303-e849-ddb8-67fa-21eba6d7f920', NULL, '1110_103_c.jpg', 'product-images', 'malzemeler/1110_103_c.jpg', 'malzemeler', 'image/jpeg', 1574773, NULL, NULL, '/uploads/malzemeler/1110_103_c.jpg', NULL, 'local', '1110_103_c', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1110_103_c.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '72e8ffdc-ee92-fa70-5ff4-99bc9ce84fa1', u.id, 'image', '/uploads/malzemeler/1110_103_c.jpg', '58e5d303-e849-ddb8-67fa-21eba6d7f920', NULL, 3, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1110 103' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('3ea30568-a5b0-d4b9-72df-de242e00ff52', NULL, '1110_103_d.jpg', 'product-images', 'malzemeler/1110_103_d.jpg', 'malzemeler', 'image/jpeg', 1657476, NULL, NULL, '/uploads/malzemeler/1110_103_d.jpg', NULL, 'local', '1110_103_d', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1110_103_d.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'b032e661-9aa4-9645-0f5b-557aa3d905b7', u.id, 'image', '/uploads/malzemeler/1110_103_d.jpg', '3ea30568-a5b0-d4b9-72df-de242e00ff52', NULL, 4, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1110 103' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('c6721bc6-b29e-4882-009b-8bd031967512', NULL, '1110_103_e.jpg', 'product-images', 'malzemeler/1110_103_e.jpg', 'malzemeler', 'image/jpeg', 1799970, NULL, NULL, '/uploads/malzemeler/1110_103_e.jpg', NULL, 'local', '1110_103_e', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1110_103_e.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '81deda83-04d1-67bf-b7b5-537ba5d87002', u.id, 'image', '/uploads/malzemeler/1110_103_e.jpg', 'c6721bc6-b29e-4882-009b-8bd031967512', NULL, 5, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1110 103' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('0f57d7c7-43d3-f187-758d-095a2bdce5ca', NULL, '1110_103_kpk.jpg', 'product-images', 'malzemeler/1110_103_kpk.jpg', 'malzemeler', 'image/jpeg', 1443355, NULL, NULL, '/uploads/malzemeler/1110_103_kpk.jpg', NULL, 'local', '1110_103_kpk', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1110_103_kpk.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1110_103_kpk.jpg', storage_asset_id = '0f57d7c7-43d3-f187-758d-095a2bdce5ca' WHERE kod = '1110 103' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'bdb28f86-e62f-8fe7-2b76-f255ca3b8a6f', u.id, 'image', '/uploads/malzemeler/1110_103_kpk.jpg', '0f57d7c7-43d3-f187-758d-095a2bdce5ca', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1110 103' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('cfc502d8-55b5-9ff5-b912-f6df85f55550', NULL, '1112_101_a.png', 'product-images', 'malzemeler/1112_101_a.png', 'malzemeler', 'image/png', 340108, NULL, NULL, '/uploads/malzemeler/1112_101_a.png', NULL, 'local', '1112_101_a', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1112_101_a.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'cbbbb255-3406-49b3-4ee4-45d205eb0a09', u.id, 'image', '/uploads/malzemeler/1112_101_a.png', 'cfc502d8-55b5-9ff5-b912-f6df85f55550', NULL, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1112 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('3fabe333-cd6b-0f9c-8acc-cd9e59e4509e', NULL, '1112_101_b.jpg', 'product-images', 'malzemeler/1112_101_b.jpg', 'malzemeler', 'image/jpeg', 187355, NULL, NULL, '/uploads/malzemeler/1112_101_b.jpg', NULL, 'local', '1112_101_b', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1112_101_b.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'e2e7c016-a34c-e804-664e-feb660d7c731', u.id, 'image', '/uploads/malzemeler/1112_101_b.jpg', '3fabe333-cd6b-0f9c-8acc-cd9e59e4509e', NULL, 2, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1112 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('53e98fc3-ccaa-7da3-bcf0-b93b7571eaac', NULL, '1112_101_c.png', 'product-images', 'malzemeler/1112_101_c.png', 'malzemeler', 'image/png', 775899, NULL, NULL, '/uploads/malzemeler/1112_101_c.png', NULL, 'local', '1112_101_c', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1112_101_c.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'dabd5acc-0537-f425-1ce9-5b9bdd288f0e', u.id, 'image', '/uploads/malzemeler/1112_101_c.png', '53e98fc3-ccaa-7da3-bcf0-b93b7571eaac', NULL, 3, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1112 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('828221ff-145a-83d1-2b23-d149601fb46d', NULL, '1112_101_e.jpg', 'product-images', 'malzemeler/1112_101_e.jpg', 'malzemeler', 'image/jpeg', 1304250, NULL, NULL, '/uploads/malzemeler/1112_101_e.jpg', NULL, 'local', '1112_101_e', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1112_101_e.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '6867f6ce-760d-e51a-190b-ad70155fd82c', u.id, 'image', '/uploads/malzemeler/1112_101_e.jpg', '828221ff-145a-83d1-2b23-d149601fb46d', NULL, 5, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1112 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('7944a896-3d12-8e59-305a-08b0417d562e', NULL, '1112_101_kpk.png', 'product-images', 'malzemeler/1112_101_kpk.png', 'malzemeler', 'image/png', 347735, NULL, NULL, '/uploads/malzemeler/1112_101_kpk.png', NULL, 'local', '1112_101_kpk', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1112_101_kpk.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1112_101_kpk.png', storage_asset_id = '7944a896-3d12-8e59-305a-08b0417d562e' WHERE kod = '1112 101' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '6fcf5e7f-e9f1-7f64-fd5f-978027f6977f', u.id, 'image', '/uploads/malzemeler/1112_101_kpk.png', '7944a896-3d12-8e59-305a-08b0417d562e', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1112 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('d397b6b2-111c-7040-5494-80a1f6f4093a', NULL, '1112_102_a.jpg', 'product-images', 'malzemeler/1112_102_a.jpg', 'malzemeler', 'image/jpeg', 1302686, NULL, NULL, '/uploads/malzemeler/1112_102_a.jpg', NULL, 'local', '1112_102_a', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1112_102_a.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '38de7fbb-51dd-6360-4732-459ef95a7756', u.id, 'image', '/uploads/malzemeler/1112_102_a.jpg', 'd397b6b2-111c-7040-5494-80a1f6f4093a', NULL, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1112 102' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('d08ba6fb-b78e-7d55-dc57-1d9c0a79c0f0', NULL, '1112_102_a.png', 'product-images', 'malzemeler/1112_102_a.png', 'malzemeler', 'image/png', 33444, NULL, NULL, '/uploads/malzemeler/1112_102_a.png', NULL, 'local', '1112_102_a', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1112_102_a.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '2d0da4ea-34f3-557c-2b59-ed63e37fdff3', u.id, 'image', '/uploads/malzemeler/1112_102_a.png', 'd08ba6fb-b78e-7d55-dc57-1d9c0a79c0f0', NULL, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1112 102' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('ea909e58-796d-5b9f-8c56-49b1260c8e89', NULL, '1112_102_d.jpg', 'product-images', 'malzemeler/1112_102_d.jpg', 'malzemeler', 'image/jpeg', 1501891, NULL, NULL, '/uploads/malzemeler/1112_102_d.jpg', NULL, 'local', '1112_102_d', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1112_102_d.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'fb562754-2aca-c03a-ee6a-56712137d487', u.id, 'image', '/uploads/malzemeler/1112_102_d.jpg', 'ea909e58-796d-5b9f-8c56-49b1260c8e89', NULL, 4, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1112 102' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('db4e1d77-401f-3a51-ac64-c65ae7269c6e', NULL, '1112_102_e.jpg', 'product-images', 'malzemeler/1112_102_e.jpg', 'malzemeler', 'image/jpeg', 1408212, NULL, NULL, '/uploads/malzemeler/1112_102_e.jpg', NULL, 'local', '1112_102_e', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1112_102_e.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '467d5059-e575-96a3-1d19-5763577a3886', u.id, 'image', '/uploads/malzemeler/1112_102_e.jpg', 'db4e1d77-401f-3a51-ac64-c65ae7269c6e', NULL, 5, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1112 102' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('29a0513f-28b5-965e-8820-0980e2647649', NULL, '1112_102_kpk.jpg', 'product-images', 'malzemeler/1112_102_kpk.jpg', 'malzemeler', 'image/jpeg', 1300454, NULL, NULL, '/uploads/malzemeler/1112_102_kpk.jpg', NULL, 'local', '1112_102_kpk', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1112_102_kpk.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1112_102_kpk.jpg', storage_asset_id = '29a0513f-28b5-965e-8820-0980e2647649' WHERE kod = '1112 102' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'fec661ad-da4d-e0d8-94ae-16d864e11090', u.id, 'image', '/uploads/malzemeler/1112_102_kpk.jpg', '29a0513f-28b5-965e-8820-0980e2647649', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1112 102' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('729f92c0-9a35-4934-fc28-f0a0a09fde4b', NULL, '1112_103_a.jpg', 'product-images', 'malzemeler/1112_103_a.jpg', 'malzemeler', 'image/jpeg', 1420447, NULL, NULL, '/uploads/malzemeler/1112_103_a.jpg', NULL, 'local', '1112_103_a', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1112_103_a.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '125df5a7-210c-4b0d-3004-cae9c1556506', u.id, 'image', '/uploads/malzemeler/1112_103_a.jpg', '729f92c0-9a35-4934-fc28-f0a0a09fde4b', NULL, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1112 103' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('248f5288-fb6b-3da2-5409-f57fe6892d3b', NULL, '1112_103_d.jpg', 'product-images', 'malzemeler/1112_103_d.jpg', 'malzemeler', 'image/jpeg', 1714306, NULL, NULL, '/uploads/malzemeler/1112_103_d.jpg', NULL, 'local', '1112_103_d', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1112_103_d.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '1d9df12b-b03d-50e3-7f82-00a8008ec227', u.id, 'image', '/uploads/malzemeler/1112_103_d.jpg', '248f5288-fb6b-3da2-5409-f57fe6892d3b', NULL, 4, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1112 103' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('89741a12-c2f8-f12e-b2fa-46a13a721fe1', NULL, '1112_103_e.jpg', 'product-images', 'malzemeler/1112_103_e.jpg', 'malzemeler', 'image/jpeg', 1615715, NULL, NULL, '/uploads/malzemeler/1112_103_e.jpg', NULL, 'local', '1112_103_e', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1112_103_e.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'e67eb460-c50a-3408-f0b8-26f140d45788', u.id, 'image', '/uploads/malzemeler/1112_103_e.jpg', '89741a12-c2f8-f12e-b2fa-46a13a721fe1', NULL, 5, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1112 103' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('7c7714fa-6073-bb78-80c2-f82790ecf5c5', NULL, '1112_103_kpk.jpg', 'product-images', 'malzemeler/1112_103_kpk.jpg', 'malzemeler', 'image/jpeg', 1640167, NULL, NULL, '/uploads/malzemeler/1112_103_kpk.jpg', NULL, 'local', '1112_103_kpk', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1112_103_kpk.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1112_103_kpk.jpg', storage_asset_id = '7c7714fa-6073-bb78-80c2-f82790ecf5c5' WHERE kod = '1112 103' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'e33d8dc1-7627-847a-c331-30ab6330cf86', u.id, 'image', '/uploads/malzemeler/1112_103_kpk.jpg', '7c7714fa-6073-bb78-80c2-f82790ecf5c5', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1112 103' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('ce2ed1de-37ee-f536-2659-87217b61ffe1', NULL, '1114_101_a.png', 'product-images', 'malzemeler/1114_101_a.png', 'malzemeler', 'image/png', 312297, NULL, NULL, '/uploads/malzemeler/1114_101_a.png', NULL, 'local', '1114_101_a', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1114_101_a.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '2c7302c7-abe7-7b5f-e724-d519d9e89df6', u.id, 'image', '/uploads/malzemeler/1114_101_a.png', 'ce2ed1de-37ee-f536-2659-87217b61ffe1', NULL, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1114 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('0c02bbd0-b2e7-0ee1-8463-9cfe4a7b3de7', NULL, '1114_101_b.jpg', 'product-images', 'malzemeler/1114_101_b.jpg', 'malzemeler', 'image/jpeg', 240696, NULL, NULL, '/uploads/malzemeler/1114_101_b.jpg', NULL, 'local', '1114_101_b', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1114_101_b.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'f4dc006a-35a8-7c53-b5bb-0f8e2358b3a5', u.id, 'image', '/uploads/malzemeler/1114_101_b.jpg', '0c02bbd0-b2e7-0ee1-8463-9cfe4a7b3de7', NULL, 2, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1114 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('6aa68b1a-34a1-a12a-8957-dd93e67a0e5f', NULL, '1114_101_c.png', 'product-images', 'malzemeler/1114_101_c.png', 'malzemeler', 'image/png', 319546, NULL, NULL, '/uploads/malzemeler/1114_101_c.png', NULL, 'local', '1114_101_c', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1114_101_c.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '4940e05d-740f-64ca-2c33-48b6c7d93384', u.id, 'image', '/uploads/malzemeler/1114_101_c.png', '6aa68b1a-34a1-a12a-8957-dd93e67a0e5f', NULL, 3, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1114 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('9b228f17-c9cd-374d-0e34-a4ec6478668f', NULL, '1114_101_kpk.png', 'product-images', 'malzemeler/1114_101_kpk.png', 'malzemeler', 'image/png', 281568, NULL, NULL, '/uploads/malzemeler/1114_101_kpk.png', NULL, 'local', '1114_101_kpk', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1114_101_kpk.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1114_101_kpk.png', storage_asset_id = '9b228f17-c9cd-374d-0e34-a4ec6478668f' WHERE kod = '1114 101' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '0d681da8-d7bb-1cef-e642-a9abb0e05e02', u.id, 'image', '/uploads/malzemeler/1114_101_kpk.png', '9b228f17-c9cd-374d-0e34-a4ec6478668f', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1114 101' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('8aa5f17d-2fb1-2396-bb7c-e0b36c148e99', NULL, '1114_102.png', 'product-images', 'malzemeler/1114_102.png', 'malzemeler', 'image/png', 37197, NULL, NULL, '/uploads/malzemeler/1114_102.png', NULL, 'local', '1114_102', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1114_102.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1114_102.png', storage_asset_id = '8aa5f17d-2fb1-2396-bb7c-e0b36c148e99' WHERE kod = '1114 102' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '9b780581-2d45-03d4-c284-3872ace51ccf', u.id, 'image', '/uploads/malzemeler/1114_102.png', '8aa5f17d-2fb1-2396-bb7c-e0b36c148e99', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1114 102' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('bf1d4dbd-5e0e-1c83-32ba-1b31d8404280', NULL, '1114_103.png', 'product-images', 'malzemeler/1114_103.png', 'malzemeler', 'image/png', 29590, NULL, NULL, '/uploads/malzemeler/1114_103.png', NULL, 'local', '1114_103', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1114_103.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1114_103.png', storage_asset_id = 'bf1d4dbd-5e0e-1c83-32ba-1b31d8404280' WHERE kod = '1114 103' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '7499f77d-1ec4-7140-093b-b2674721f70b', u.id, 'image', '/uploads/malzemeler/1114_103.png', 'bf1d4dbd-5e0e-1c83-32ba-1b31d8404280', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1114 103' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('a3de2eda-3365-622d-5f03-c930fbd1ebfd', NULL, '1116_201_a.png', 'product-images', 'malzemeler/1116_201_a.png', 'malzemeler', 'image/png', 332826, NULL, NULL, '/uploads/malzemeler/1116_201_a.png', NULL, 'local', '1116_201_a', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1116_201_a.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '1de70681-bfa3-d339-f0d4-8f73a4905516', u.id, 'image', '/uploads/malzemeler/1116_201_a.png', 'a3de2eda-3365-622d-5f03-c930fbd1ebfd', NULL, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1116 201' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('36b8464a-cb84-c5ae-b447-52cbe3406bd8', NULL, '1116_201_b.jpg', 'product-images', 'malzemeler/1116_201_b.jpg', 'malzemeler', 'image/jpeg', 274656, NULL, NULL, '/uploads/malzemeler/1116_201_b.jpg', NULL, 'local', '1116_201_b', 'image', 'jpg', NULL, NULL, '{"source":"google_drive","originalName":"1116_201_b.jpg"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT '1d76b8d9-02b7-4a88-a3e8-494e5f9e7d02', u.id, 'image', '/uploads/malzemeler/1116_201_b.jpg', '36b8464a-cb84-c5ae-b447-52cbe3406bd8', NULL, 2, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1116 201' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('3383548c-4972-9c81-7cfa-51781c7df1ad', NULL, '1116_201_c.png', 'product-images', 'malzemeler/1116_201_c.png', 'malzemeler', 'image/png', 482843, NULL, NULL, '/uploads/malzemeler/1116_201_c.png', NULL, 'local', '1116_201_c', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1116_201_c.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'e1887fa2-bccd-29b6-48ca-286c3e9b165f', u.id, 'image', '/uploads/malzemeler/1116_201_c.png', '3383548c-4972-9c81-7cfa-51781c7df1ad', NULL, 3, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1116 201' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('c04fd59b-2173-4e71-e730-a5820dba4536', NULL, '1116_201_kpk.png', 'product-images', 'malzemeler/1116_201_kpk.png', 'malzemeler', 'image/png', 289763, NULL, NULL, '/uploads/malzemeler/1116_201_kpk.png', NULL, 'local', '1116_201_kpk', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1116_201_kpk.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1116_201_kpk.png', storage_asset_id = 'c04fd59b-2173-4e71-e730-a5820dba4536' WHERE kod = '1116 201' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'adb137cb-0907-de3f-4da9-9366341ce9b5', u.id, 'image', '/uploads/malzemeler/1116_201_kpk.png', 'c04fd59b-2173-4e71-e730-a5820dba4536', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1116 201' LIMIT 1;

INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
  VALUES ('1c90ceb0-d906-d55e-b8a5-f258756cac33', NULL, '1116_202_kpk.png', 'product-images', 'malzemeler/1116_202_kpk.png', 'malzemeler', 'image/png', 42250, NULL, NULL, '/uploads/malzemeler/1116_202_kpk.png', NULL, 'local', '1116_202_kpk', 'image', 'png', NULL, NULL, '{"source":"google_drive","originalName":"1116_202_kpk.png"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
UPDATE urunler SET image_url = '/uploads/malzemeler/1116_202_kpk.png', storage_asset_id = '1c90ceb0-d906-d55e-b8a5-f258756cac33' WHERE kod = '1116 202' AND image_url IS NULL;
INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)
  SELECT 'bb684637-d54e-9973-75ba-b2e417f9a315', u.id, 'image', '/uploads/malzemeler/1116_202_kpk.png', '1c90ceb0-d906-d55e-b8a5-f258756cac33', NULL, 0, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '1116 202' LIMIT 1;


-- 1. PASS: kod-tabanlı varyant propagasyonu (örn. -PR, -X, -L).
UPDATE urunler v
  INNER JOIN urunler base ON base.kod = SUBSTRING_INDEX(v.kod, '-', 1)
SET v.image_url = base.image_url,
    v.storage_asset_id = base.storage_asset_id
WHERE v.kod LIKE '%-%'
  AND v.image_url IS NULL
  AND base.image_url IS NOT NULL
  AND v.id <> base.id;

-- 2. PASS: ad-tabanlı varyant propagasyonu.
-- Ürün adının " -" öncesi kısmı baz ad; aynı baz ada sahip ve görseli olan ürün bulunursa kopyalanır.
UPDATE urunler v
  INNER JOIN (
    SELECT TRIM(SUBSTRING_INDEX(ad, ' -', 1)) AS base_ad,
           MIN(image_url) AS image_url,
           MIN(storage_asset_id) AS storage_asset_id
    FROM urunler
    WHERE image_url IS NOT NULL
    GROUP BY TRIM(SUBSTRING_INDEX(ad, ' -', 1))
  ) base ON TRIM(SUBSTRING_INDEX(v.ad, ' -', 1)) = base.base_ad
SET v.image_url = base.image_url,
    v.storage_asset_id = base.storage_asset_id
WHERE v.image_url IS NULL
  AND base.image_url IS NOT NULL;

-- Sonuç: 50 storage_asset, 16 kapak update, 50 urun_medya, + varyant propagasyonu.