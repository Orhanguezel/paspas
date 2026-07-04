-- 207: Operasyonel YM stok takibi zorunlu + stok senkronu (YN-V11 devam)
--
-- Per-side üretim modelinde taraf (Sağ/Sol/Parça) YM stokları achievable montajın
-- (tryMontajForUretimEmri) min hesabının girdisidir. stok_takip_aktif=0 olan YM'ler
-- min hesabından atlanır → montaj sipariş miktarının tamamını mamule kredileyip
-- fantom stok üretirdi. Bu yüzden tüm operasyonel YM'lerde takip AÇIK olmalı.
--
-- Takip kapalıyken günlük üretim hareketleri yazılmış ama stok alanı
-- güncellenmemişti. Takibi açmadan önce stok, model geçişi (2026-06-27) sonrası
-- hareket netinden türetilir (kesim öncesi bakiye eski mamul-emir modelinin
-- kredisiz tüketim artefaktıdır — hayalet borç, sıfır kabul edilir).
--
-- Idempotent: takip zaten açık olan ürünlere dokunmaz; fresh seed'de hareket
-- olmadığından stok 0 kalır ve yalnız bayraklar açılır.

-- 1) Takipsiz YM'lerde stok senkronu (kesim sonrası hareket neti, negatifse 0)
CREATE TEMPORARY TABLE tmp_ym_takip AS
SELECT u.id urun_id,
  GREATEST(COALESCE(SUM(CASE WHEN h.created_at >= '2026-06-27' THEN
    CASE WHEN h.hareket_tipi='giris' THEN h.miktar
         WHEN h.hareket_tipi='cikis' THEN -ABS(h.miktar)
         ELSE h.miktar END END),0), 0) hedef_stok,
  u.stok guncel_stok
FROM urunler u
LEFT JOIN hareketler h ON h.urun_id = u.id
WHERE u.kategori='operasyonel_ym' AND u.is_active=1 AND u.stok_takip_aktif=0
GROUP BY u.id, u.stok;

-- Denetim izi: stok değişen ürünlere düzeltme hareketi
INSERT INTO hareketler (id, urun_id, hareket_tipi, referans_tipi, miktar, aciklama, created_by_user_id)
SELECT UUID(), urun_id, 'duzeltme', 'stok_duzeltme',
  hedef_stok - guncel_stok,
  'Stok takibi açılışı senkronu (YN-V11): takipsiz dönem hareket netinden türetildi',
  NULL
FROM tmp_ym_takip
WHERE ABS(hedef_stok - guncel_stok) > 0.0001;

UPDATE urunler u JOIN tmp_ym_takip t ON t.urun_id = u.id
SET u.stok = t.hedef_stok;

DROP TEMPORARY TABLE tmp_ym_takip;

-- 2) Tüm aktif operasyonel YM'lerde takibi aç
UPDATE urunler
SET stok_takip_aktif = 1
WHERE kategori='operasyonel_ym' AND is_active=1 AND stok_takip_aktif=0;
