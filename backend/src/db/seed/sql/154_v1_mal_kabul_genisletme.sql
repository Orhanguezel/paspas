-- 154_v1_mal_kabul_genisletme.sql
-- mal_kabul_kayitlari tablosunu genislet: kaynak_tipi, tedarikci, parti_no, kalite alanlari
-- satin_alma_siparis_id ve satin_alma_kalem_id artik nullable (SA olmadan da mal kabul yapilabilir)

ALTER TABLE `mal_kabul_kayitlari`
  MODIFY COLUMN `satin_alma_siparis_id` CHAR(36) NULL,
  MODIFY COLUMN `satin_alma_kalem_id` CHAR(36) NULL,
  ADD COLUMN `kaynak_tipi` VARCHAR(32) NOT NULL DEFAULT 'satin_alma' AFTER `id`,
  ADD COLUMN `tedarikci_id` CHAR(36) NULL AFTER `urun_id`,
  ADD COLUMN `parti_no` VARCHAR(64) NULL AFTER `gelen_miktar`,
  ADD COLUMN `kalite_durumu` VARCHAR(32) NOT NULL DEFAULT 'kabul' AFTER `notlar`,
  ADD COLUMN `kalite_notu` VARCHAR(500) NULL AFTER `kalite_durumu`,
  ADD INDEX `idx_mal_kabul_kaynak_tipi` (`kaynak_tipi`),
  ADD INDEX `idx_mal_kabul_tedarikci` (`tedarikci_id`),
  ADD INDEX `idx_mal_kabul_kabul_tarihi` (`kabul_tarihi`);
