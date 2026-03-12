-- Uretim emirleri: 'hazirlaniyor' durumunu kaldir, 'atanmamis' varsayilan yap

ALTER TABLE `uretim_emirleri`
  MODIFY COLUMN `durum` VARCHAR(32) NOT NULL DEFAULT 'atanmamis';

-- hazirlaniyor → planlandi (eski degerler icin)
UPDATE `uretim_emirleri` SET `durum` = 'planlandi' WHERE `durum` = 'hazirlaniyor';
