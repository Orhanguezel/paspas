-- 206: Montaj tarafı bayrakları (YN-V11 — not 51ac56d3)
--
-- Kök neden: 2026-06-23 V6 ürün re-import'u urun_operasyonlari tanımlarını
-- montaj=0 varsayılanıyla yeniden kurdu; montaj=1 tanımları silindi. autoPopulate
-- emir operasyonlarını bu tanımdan kopyaladığı için 06-29'dan itibaren tüm yeni
-- emirler montajsız doğdu → tryMontajForUretimEmri hiç tetiklenmedi → çift taraflı
-- ürünlerde mamul stoğu hiç oluşmadı.
--
-- Kural (tarihsel canlı veriden — Megane 1131 101-L örneği + urunler/service.ts rol):
--   Çift taraflı: Sol taraf (-L, -SL) montaj görevini taşır → montaj=1
--   Tek parçalı:  tek aramamul (-X, -PR) montaj görevini taşır → montaj=1
--   Sağ taraf (-R, -SG): montaj=0 (stoğu birikir, Sol tamamlanınca eşleşir)
--
-- Idempotent: UPDATE'ler tekrar çalıştırılabilir; koşulu sağlamayan satıra dokunmaz.

-- 1) Ürün operasyon tanımları: montaj-tarafı YM'lerde montaj=1
UPDATE urun_operasyonlari uo
JOIN urunler u ON u.id = uo.urun_id
SET uo.montaj = 1
WHERE u.kategori = 'operasyonel_ym'
  AND (u.kod LIKE '%-L' OR u.kod LIKE '%-SL' OR u.kod LIKE '%-X' OR u.kod LIKE '%-PR')
  AND uo.montaj = 0;

-- 2) Açık (tamamlanmamış/iptal edilmemiş) emirlerin mevcut operasyonlarını
--    tanımla hizala — bu emirler montaj=0 kopyalanmıştı, tamamlanınca montaj
--    tetiklenebilsin. Tamamlanmış/iptal emirlere DOKUNULMAZ (tarih korunur).
UPDATE uretim_emri_operasyonlari oo
JOIN uretim_emirleri ue ON ue.id = oo.uretim_emri_id
JOIN urunler u ON u.id = ue.urun_id
SET oo.montaj = 1
WHERE ue.is_active = 1
  AND ue.durum IN ('atanmamis', 'planlandi', 'uretimde', 'montaj_bekliyor')
  AND u.kategori = 'operasyonel_ym'
  AND (u.kod LIKE '%-L' OR u.kod LIKE '%-SL' OR u.kod LIKE '%-X' OR u.kod LIKE '%-PR')
  AND oo.montaj = 0;
