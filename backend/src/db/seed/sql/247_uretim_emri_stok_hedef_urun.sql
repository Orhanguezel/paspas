ALTER TABLE uretim_emirleri
  ADD COLUMN stok_hedef_urun_id char(36) NULL AFTER mamul_urun_id;

-- Yalniz isletmenin tamamlanmis takim olarak dogruladigi emir icin stok hedefi.
UPDATE uretim_emirleri
SET stok_hedef_urun_id = mamul_urun_id
WHERE emir_no = 'UE-2026-0190'
  AND urun_id = '6984a48a-dd5a-670f-8322-7ccb1353de01'
  AND mamul_urun_id = 'a342bf84-296b-440e-bd26-00b0a0f93017';
