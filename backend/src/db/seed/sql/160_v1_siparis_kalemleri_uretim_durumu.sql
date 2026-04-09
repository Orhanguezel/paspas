-- Rev4: siparis_kalemleri tablosuna uretim_durumu kolonu ekleniyor
-- Degerler: beklemede, uretime_aktarildi, makineye_atandi, uretiliyor, duraklatildi, uretim_tamamlandi

ALTER TABLE siparis_kalemleri
  ADD COLUMN uretim_durumu VARCHAR(32) NOT NULL DEFAULT 'beklemede'
  AFTER sira;

-- Mevcut verileri guncelle: UE'ye bagli kalemlerin durumunu hesapla
-- 1) uretime_aktarildi: UE var ama makine atanmamis
UPDATE siparis_kalemleri sk
  INNER JOIN uretim_emri_siparis_kalemleri uesk ON uesk.siparis_kalem_id = sk.id
  INNER JOIN uretim_emirleri ue ON ue.id = uesk.uretim_emri_id AND ue.is_active = 1
SET sk.uretim_durumu = 'uretime_aktarildi'
WHERE ue.durum = 'atanmamis';

-- 2) makineye_atandi: UE makineye atanmis ama uretim baslamadi
UPDATE siparis_kalemleri sk
  INNER JOIN uretim_emri_siparis_kalemleri uesk ON uesk.siparis_kalem_id = sk.id
  INNER JOIN uretim_emirleri ue ON ue.id = uesk.uretim_emri_id AND ue.is_active = 1
SET sk.uretim_durumu = 'makineye_atandi'
WHERE ue.durum IN ('planlandi', 'makineye_atandi');

-- 3) uretiliyor: UE uretimde
UPDATE siparis_kalemleri sk
  INNER JOIN uretim_emri_siparis_kalemleri uesk ON uesk.siparis_kalem_id = sk.id
  INNER JOIN uretim_emirleri ue ON ue.id = uesk.uretim_emri_id AND ue.is_active = 1
SET sk.uretim_durumu = 'uretiliyor'
WHERE ue.durum = 'uretimde';

-- 4) duraklatildi: UE duraklatildi
UPDATE siparis_kalemleri sk
  INNER JOIN uretim_emri_siparis_kalemleri uesk ON uesk.siparis_kalem_id = sk.id
  INNER JOIN uretim_emirleri ue ON ue.id = uesk.uretim_emri_id AND ue.is_active = 1
SET sk.uretim_durumu = 'duraklatildi'
WHERE ue.durum = 'durakladi';

-- 5) uretim_tamamlandi: UE tamamlandi veya kapatildi
UPDATE siparis_kalemleri sk
  INNER JOIN uretim_emri_siparis_kalemleri uesk ON uesk.siparis_kalem_id = sk.id
  INNER JOIN uretim_emirleri ue ON ue.id = uesk.uretim_emri_id AND ue.is_active = 1
SET sk.uretim_durumu = 'uretim_tamamlandi'
WHERE ue.durum IN ('tamamlandi', 'kapatildi');
