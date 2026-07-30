-- 2026-07-14 (2. parti): 900 T (ON) makinesinden cikarma
-- Cift tarafli mamullerin SAG taraf emirleri: UE-2026-0099, 0103, 0106, 0108, 0110, 0112
-- NOT: UE-2026-0101 (VECTOR sag) URETIMDE oldugu icin BILEREK dahil edilmedi.
-- Uygulama mantigi birebir: repoKuyrukCikar (backend/src/modules/makine_havuzu/repository.ts)

START TRANSACTION;

-- 1) Operasyonlardan makine/plan bilgisini temizle
UPDATE uretim_emri_operasyonlari
SET makine_id=NULL, montaj_makine_id=NULL, planlanan_baslangic=NULL, planlanan_bitis=NULL
WHERE uretim_emri_id IN (
  '1e769341-c9d2-4886-9acd-51068b9f6d3c', -- 0099
  '9ee6eb6d-a8b1-420b-a57a-c4c5637f7c48', -- 0103
  '1fb84534-cfbe-45ef-8cd7-402643b33ce7', -- 0106
  '96370193-fe8d-4f65-bfc1-2dce84e335af', -- 0108
  '3b87873b-e66d-44c7-ad5a-792027901dd5', -- 0110
  '7f4996c5-e06f-4ee2-b6fe-ebbb1c0dfd16'  -- 0112
);

-- 2) Kuyruk kayitlarini sil (ON makinesi, sira 3-8)
DELETE FROM makine_kuyrugu
WHERE uretim_emri_id IN (
  '1e769341-c9d2-4886-9acd-51068b9f6d3c',
  '9ee6eb6d-a8b1-420b-a57a-c4c5637f7c48',
  '1fb84534-cfbe-45ef-8cd7-402643b33ce7',
  '96370193-fe8d-4f65-bfc1-2dce84e335af',
  '3b87873b-e66d-44c7-ad5a-792027901dd5',
  '7f4996c5-e06f-4ee2-b6fe-ebbb1c0dfd16'
);

-- 3) Emir durumu: planlandi -> atanmamis
UPDATE uretim_emirleri SET durum='atanmamis'
WHERE id IN (
  '1e769341-c9d2-4886-9acd-51068b9f6d3c',
  '9ee6eb6d-a8b1-420b-a57a-c4c5637f7c48',
  '1fb84534-cfbe-45ef-8cd7-402643b33ce7',
  '96370193-fe8d-4f65-bfc1-2dce84e335af',
  '3b87873b-e66d-44c7-ad5a-792027901dd5',
  '7f4996c5-e06f-4ee2-b6fe-ebbb1c0dfd16'
) AND durum='planlandi';

-- 4) Siparis kalemleri geri alma (kosullu; onceki partide zaten uretime_aktarildi
--    yapildigi icin buyuk ihtimalle 0 satir etkiler — uygulama mantigina sadakat icin durur)
UPDATE siparis_kalemleri SET uretim_durumu='uretime_aktarildi'
WHERE id IN (
  '26002c6e-96eb-499d-8e39-10725c054fc2',
  'e170c4d5-00ae-4672-ac00-96918b020c6d',
  'ef17a274-ddc3-4b31-9082-948510804606',
  'f04d852c-4c84-4a55-867f-cf4bcae520e8',
  '29c2ee2e-1233-460e-a452-17e34085117e',
  'b2d4f8f4-f153-415a-bb5c-1e5d0a2107b8'
) AND uretim_durumu IN ('makineye_atandi','uretiliyor','duraklatildi');

-- 5) ON kuyrugunda kalan kayitlarin sirasini kaydir (6 kayit cikti: sira 3-8)
UPDATE makine_kuyrugu SET sira = sira - 6
WHERE makine_id='07861c56-b21a-4129-8024-779750d921f6' AND sira > 8
ORDER BY sira ASC;

COMMIT;
