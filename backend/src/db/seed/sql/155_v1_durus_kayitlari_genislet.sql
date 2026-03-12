-- 155: Duruş kayıtlarına durus_nedeni_id FK ve anlık üretim miktarı ekle
ALTER TABLE durus_kayitlari
  ADD COLUMN durus_nedeni_id CHAR(36) NULL AFTER operator_user_id,
  ADD COLUMN anlik_uretim_miktari DECIMAL(12,4) NULL AFTER neden;
