-- ============================================================================
-- PASPAS ERP V1 — uretim_emri_operasyonlari + makine_kuyrugu demo seed
-- Her uretim emri icin urun operasyonlarindan otomatik kopyalama
-- makine_kuyrugu kayitlarini emir_operasyon_id ile bagla
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- 1) uretim_emirleri: termin_tarihi ve musteri_ozet guncelle
UPDATE `uretim_emirleri` ue
INNER JOIN `satis_siparisleri` ss ON ss.id = ue.siparis_id
SET ue.termin_tarihi = ss.termin_tarihi
WHERE ue.termin_tarihi IS NULL AND ss.termin_tarihi IS NOT NULL;

UPDATE `uretim_emirleri` ue
INNER JOIN `satis_siparisleri` ss ON ss.id = ue.siparis_id
INNER JOIN `musteriler` m ON m.id = ss.musteri_id
SET ue.musteri_ozet = m.ad
WHERE ue.musteri_ozet IS NULL;

-- 2) uretim_emri_operasyonlari: her emir icin urun operasyonlarindan kopyala
--    Sadece henuz operasyonu olmayan emirler icin
INSERT INTO `uretim_emri_operasyonlari`
  (`id`, `uretim_emri_id`, `urun_operasyon_id`, `sira`, `operasyon_adi`,
   `kalip_id`, `hazirlik_suresi_dk`, `cevrim_suresi_sn`,
   `planlanan_miktar`, `uretilen_miktar`, `fire_miktar`, `montaj`, `durum`)
SELECT
  -- Deterministik UUID: MD5(emir_id + '-eo-' + op.sira)
  LOWER(CONCAT(
    SUBSTR(MD5(CONCAT(ue.id, '-eo-', uo.sira)), 1, 8), '-',
    SUBSTR(MD5(CONCAT(ue.id, '-eo-', uo.sira)), 9, 4), '-',
    SUBSTR(MD5(CONCAT(ue.id, '-eo-', uo.sira)), 13, 4), '-',
    SUBSTR(MD5(CONCAT(ue.id, '-eo-', uo.sira)), 17, 4), '-',
    SUBSTR(MD5(CONCAT(ue.id, '-eo-', uo.sira)), 21, 12)
  )),
  ue.id,
  uo.id,
  uo.sira,
  uo.operasyon_adi,
  uo.kalip_id,
  uo.hazirlik_suresi_dk,
  uo.cevrim_suresi_sn,
  ue.planlanan_miktar,
  ue.uretilen_miktar,
  0.0000,
  uo.montaj,
  CASE
    WHEN ue.durum = 'tamamlandi' THEN 'tamamlandi'
    WHEN ue.durum = 'uretimde'   THEN 'calisiyor'
    ELSE 'bekliyor'
  END
FROM `uretim_emirleri` ue
INNER JOIN `urunler` u ON u.id = ue.urun_id
INNER JOIN `urun_operasyonlari` uo ON uo.urun_id = u.id AND uo.is_active = 1
WHERE ue.id NOT IN (SELECT DISTINCT uretim_emri_id FROM `uretim_emri_operasyonlari`)
  AND ue.is_active = 1
ON DUPLICATE KEY UPDATE `planlanan_miktar` = VALUES(`planlanan_miktar`);

-- 3) Eski makine_kuyrugu kayitlarini temizle (emir_operasyon_id olmayan)
DELETE FROM `makine_kuyrugu` WHERE `emir_operasyon_id` IS NULL;

-- 4) Makine atamasi: uretimde/calisiyor olan emirlerin operasyonlarina makine ata
--    UE-0001 (Basak Plus 3D Siyah, uretimde) → PRS-01
UPDATE `uretim_emri_operasyonlari` eo
SET eo.makine_id = 'm0000001-0000-4000-8000-000000000003'
WHERE eo.uretim_emri_id = 'e0000001-0000-4000-8000-000000000001'
  AND eo.makine_id IS NULL;

--    UE-0003 (Pars Siyah, uretimde) → PRS-02
UPDATE `uretim_emri_operasyonlari` eo
SET eo.makine_id = 'm0000001-0000-4000-8000-000000000004'
WHERE eo.uretim_emri_id = 'e0000001-0000-4000-8000-000000000003'
  AND eo.makine_id IS NULL;

--    UE-0004 (Tuna Siyah, tamamlandi) → PRS-01
UPDATE `uretim_emri_operasyonlari` eo
SET eo.makine_id = 'm0000001-0000-4000-8000-000000000003'
WHERE eo.uretim_emri_id = 'e0000001-0000-4000-8000-000000000004'
  AND eo.makine_id IS NULL;

--    UE-0005 (Orbital 4D Siyah, uretimde) → PRS-02
UPDATE `uretim_emri_operasyonlari` eo
SET eo.makine_id = 'm0000001-0000-4000-8000-000000000004'
WHERE eo.uretim_emri_id = 'e0000001-0000-4000-8000-000000000005'
  AND eo.makine_id IS NULL;

-- UE-0002 (planlandi), UE-0006 (hazirlaniyor), UE-0007 (planlandi) → atanmamis kalacak

-- 5) Makine kuyrugu: atanmis operasyonlar icin kuyruk kaydi olustur
INSERT INTO `makine_kuyrugu`
  (`id`, `makine_id`, `uretim_emri_id`, `emir_operasyon_id`, `sira`,
   `planlanan_sure_dk`, `hazirlik_suresi_dk`, `durum`)
SELECT
  LOWER(CONCAT(
    SUBSTR(MD5(CONCAT(eo.id, '-mk')), 1, 8), '-',
    SUBSTR(MD5(CONCAT(eo.id, '-mk')), 9, 4), '-',
    SUBSTR(MD5(CONCAT(eo.id, '-mk')), 13, 4), '-',
    SUBSTR(MD5(CONCAT(eo.id, '-mk')), 17, 4), '-',
    SUBSTR(MD5(CONCAT(eo.id, '-mk')), 21, 12)
  )),
  eo.makine_id,
  eo.uretim_emri_id,
  eo.id,
  ROW_NUMBER() OVER (PARTITION BY eo.makine_id ORDER BY ue.termin_tarihi ASC, eo.sira ASC),
  CEIL((eo.cevrim_suresi_sn * eo.planlanan_miktar) / 60),
  eo.hazirlik_suresi_dk,
  eo.durum
FROM `uretim_emri_operasyonlari` eo
INNER JOIN `uretim_emirleri` ue ON ue.id = eo.uretim_emri_id
WHERE eo.makine_id IS NOT NULL
  AND eo.durum IN ('bekliyor', 'calisiyor')
  AND eo.id NOT IN (SELECT DISTINCT emir_operasyon_id FROM `makine_kuyrugu` WHERE emir_operasyon_id IS NOT NULL)
ON DUPLICATE KEY UPDATE `durum` = VALUES(`durum`);

-- 6) Planlanan baslangic/bitis tarihleri hesapla (kuyruk sirasina gore zincirleme)
--    Her makine icin: ilk is NOW'dan baslar, sonrakiler oncekinin bitisinden
SET @cursor_makine := '' COLLATE utf8mb4_unicode_ci;
SET @cursor_bitis := NOW();

UPDATE `makine_kuyrugu` mk
INNER JOIN (
  SELECT
    mk2.id,
    mk2.makine_id,
    mk2.sira,
    mk2.hazirlik_suresi_dk,
    mk2.planlanan_sure_dk,
    @cursor_bitis := IF(
      @cursor_makine = mk2.makine_id COLLATE utf8mb4_unicode_ci,
      @cursor_bitis,
      NOW()
    ) AS chain_start,
    @cursor_bitis := DATE_ADD(
      @cursor_bitis,
      INTERVAL (mk2.hazirlik_suresi_dk + mk2.planlanan_sure_dk) MINUTE
    ) AS chain_end,
    @cursor_makine := mk2.makine_id AS _set_makine
  FROM `makine_kuyrugu` mk2
  WHERE mk2.durum IN ('bekliyor', 'calisiyor')
  ORDER BY mk2.makine_id, mk2.sira
) calc ON calc.id = mk.id
SET mk.planlanan_baslangic = calc.chain_start,
    mk.planlanan_bitis = calc.chain_end;

-- Ayni tarihleri uretim_emri_operasyonlari'na da yansit
UPDATE `uretim_emri_operasyonlari` eo
INNER JOIN `makine_kuyrugu` mk ON mk.emir_operasyon_id = eo.id
SET eo.planlanan_baslangic = mk.planlanan_baslangic,
    eo.planlanan_bitis = mk.planlanan_bitis
WHERE mk.planlanan_baslangic IS NOT NULL;

-- 7) uretim_emri_siparis_kalemleri: emirleri siparis kalemleriyle bagla
--    (yoksa olustur, varsa atla)
INSERT IGNORE INTO `uretim_emri_siparis_kalemleri` (`id`, `uretim_emri_id`, `siparis_kalem_id`)
SELECT
  LOWER(CONCAT(
    SUBSTR(MD5(CONCAT(ue.id, '-sk-', sk.id)), 1, 8), '-',
    SUBSTR(MD5(CONCAT(ue.id, '-sk-', sk.id)), 9, 4), '-',
    SUBSTR(MD5(CONCAT(ue.id, '-sk-', sk.id)), 13, 4), '-',
    SUBSTR(MD5(CONCAT(ue.id, '-sk-', sk.id)), 17, 4), '-',
    SUBSTR(MD5(CONCAT(ue.id, '-sk-', sk.id)), 21, 12)
  )),
  ue.id,
  sk.id
FROM `uretim_emirleri` ue
INNER JOIN `siparis_kalemleri` sk ON sk.siparis_id = ue.siparis_id AND sk.urun_id = ue.urun_id
WHERE ue.siparis_id IS NOT NULL
  AND ue.id NOT IN (SELECT DISTINCT uretim_emri_id FROM `uretim_emri_siparis_kalemleri`);
