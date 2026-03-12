-- ============================================================================
-- PASPAS ERP V1 — uretim_emri_operasyonlari + makine_kuyrugu demo seed
-- Uretim emirleri ve makine atamalari artik UI'dan yapilir, seed yok
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Eski makine_kuyrugu kayitlarini temizle (emir_operasyon_id olmayan)
DELETE FROM `makine_kuyrugu` WHERE `emir_operasyon_id` IS NULL;
