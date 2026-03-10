-- Uretim emirleri: 'hazirlaniyor' durumunu kaldir, 'atanmamis' varsayilan yap
-- Makine atamasi olmayan emirleri 'atanmamis' olarak guncelle

ALTER TABLE `uretim_emirleri`
  MODIFY COLUMN `durum` VARCHAR(32) NOT NULL DEFAULT 'atanmamis';

-- hazirlaniyor → planlandi (eski degerler icin)
UPDATE `uretim_emirleri` SET `durum` = 'planlandi' WHERE `durum` = 'hazirlaniyor';

-- Makine atamasi olmayan planlandi emirlerini atanmamis yap
UPDATE `uretim_emirleri` ue
SET ue.durum = 'atanmamis'
WHERE ue.durum = 'planlandi'
  AND ue.id NOT IN (
    SELECT DISTINCT mk.uretim_emri_id FROM makine_kuyrugu mk
  );
