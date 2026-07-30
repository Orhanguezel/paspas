-- 2026-07-14: Yazilimci notu 5e200728 + kullanici talebi
-- A) Makineden cikar (7 emir): UE-2026-0100,0102,0104,0105,0107,0109,0111
-- B) Tam sil (2 emir): UE-2026-0095, UE-2026-0096
-- Uygulama mantigi birebir: repoKuyrukCikar + repoDelete (backend/src/modules)

START TRANSACTION;

-- A1) Operasyonlardan makine/plan bilgisini temizle (repoKuyrukCikar adim 1)
UPDATE uretim_emri_operasyonlari
SET makine_id=NULL, montaj_makine_id=NULL, planlanan_baslangic=NULL, planlanan_bitis=NULL
WHERE uretim_emri_id IN (
  '54d8f4ed-d14f-4912-a2ff-d69b58122bab', -- 0100
  'f22f76f1-1f49-41c1-bc82-13d2b4e672e0', -- 0102
  'b0f3c3e1-0a10-4a9f-8f64-6f465e47acf6', -- 0104
  '23565422-2c87-47f5-a461-cf4c20c66622', -- 0105
  'f32286fc-76c7-4002-bb52-46efdffb54dd', -- 0107
  '4b0f5073-0a1b-4a78-b697-78b5ddaeeb4d', -- 0109
  '4b023b77-f4ef-4166-85ac-181eaec8abac'  -- 0111
);

-- A2) Kuyruk kayitlarini sil
DELETE FROM makine_kuyrugu
WHERE uretim_emri_id IN (
  '54d8f4ed-d14f-4912-a2ff-d69b58122bab',
  'f22f76f1-1f49-41c1-bc82-13d2b4e672e0',
  'b0f3c3e1-0a10-4a9f-8f64-6f465e47acf6',
  '23565422-2c87-47f5-a461-cf4c20c66622',
  'f32286fc-76c7-4002-bb52-46efdffb54dd',
  '4b0f5073-0a1b-4a78-b697-78b5ddaeeb4d',
  '4b023b77-f4ef-4166-85ac-181eaec8abac'
);

-- A3) Emir durumu: planlandi -> atanmamis (kuyruk kalmadi)
UPDATE uretim_emirleri SET durum='atanmamis'
WHERE id IN (
  '54d8f4ed-d14f-4912-a2ff-d69b58122bab',
  'f22f76f1-1f49-41c1-bc82-13d2b4e672e0',
  'b0f3c3e1-0a10-4a9f-8f64-6f465e47acf6',
  '23565422-2c87-47f5-a461-cf4c20c66622',
  'f32286fc-76c7-4002-bb52-46efdffb54dd',
  '4b0f5073-0a1b-4a78-b697-78b5ddaeeb4d',
  '4b023b77-f4ef-4166-85ac-181eaec8abac'
) AND durum='planlandi';

-- A4) Siparis kalemleri: makineye_atandi/uretiliyor/duraklatildi -> uretime_aktarildi
UPDATE siparis_kalemleri SET uretim_durumu='uretime_aktarildi'
WHERE id IN (
  '26002c6e-96eb-499d-8e39-10725c054fc2',
  '34b2b34b-2854-461a-9536-bd3ef29829ce',
  'e170c4d5-00ae-4672-ac00-96918b020c6d',
  'ef17a274-ddc3-4b31-9082-948510804606',
  'f04d852c-4c84-4a55-867f-cf4bcae520e8',
  '29c2ee2e-1233-460e-a452-17e34085117e',
  'b2d4f8f4-f153-415a-bb5c-1e5d0a2107b8'
) AND uretim_durumu IN ('makineye_atandi','uretiliyor','duraklatildi');

-- B1) 0095/0096 aktif rezervasyonlarin rezerve_stok geri dususu (iptalRezervasyon)
UPDATE urunler u
JOIN (
  SELECT urun_id, SUM(miktar) AS m
  FROM hammadde_rezervasyonlari
  WHERE uretim_emri_id IN ('00dbf32c-b84b-42a3-a414-c49a4350ed7c','d8a742d7-da42-47ce-bcef-b8edd0096eca')
    AND durum='rezerve'
  GROUP BY urun_id
) r ON r.urun_id = u.id
SET u.rezerve_stok = GREATEST(0, u.rezerve_stok - r.m)
WHERE u.stok_takip_aktif = 1;

-- B2) Rezervasyonlari iptal isaretle
UPDATE hammadde_rezervasyonlari SET durum='iptal'
WHERE uretim_emri_id IN ('00dbf32c-b84b-42a3-a414-c49a4350ed7c','d8a742d7-da42-47ce-bcef-b8edd0096eca')
  AND durum='rezerve';

-- B3) Emirleri sil (FK CASCADE: makine_kuyrugu, uretim_emri_operasyonlari,
--     uretim_emri_siparis_kalemleri, operator_gunluk_kayitlari)
DELETE FROM uretim_emirleri
WHERE id IN ('00dbf32c-b84b-42a3-a414-c49a4350ed7c','d8a742d7-da42-47ce-bcef-b8edd0096eca');

-- C) 900 T kuyrugunda kalan kayitlarin sirasini kaydir (10 kayit cikti: sira 3-12)
UPDATE makine_kuyrugu SET sira = sira - 10
WHERE makine_id='08f106ba-2754-4ba5-a733-ab652803c044' AND sira > 12
ORDER BY sira ASC;

COMMIT;
