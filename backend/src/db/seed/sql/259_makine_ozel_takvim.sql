-- Makine bazli calisma penceresi; varsayilan kapali, mevcut planlari degistirmez.
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='makineler' AND COLUMN_NAME='ozel_takvim_aktif');
SET @s := IF(@c=0, 'ALTER TABLE makineler ADD COLUMN ozel_takvim_aktif TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER calisir_24_saat', 'SELECT 1');
PREPARE x FROM @s; EXECUTE x; DEALLOCATE PREPARE x;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='makineler' AND COLUMN_NAME='ozel_takvim_baslangic');
SET @s := IF(@c=0, 'ALTER TABLE makineler ADD COLUMN ozel_takvim_baslangic VARCHAR(5) NULL AFTER ozel_takvim_aktif', 'SELECT 1');
PREPARE x FROM @s; EXECUTE x; DEALLOCATE PREPARE x;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='makineler' AND COLUMN_NAME='ozel_takvim_bitis');
SET @s := IF(@c=0, 'ALTER TABLE makineler ADD COLUMN ozel_takvim_bitis VARCHAR(5) NULL AFTER ozel_takvim_baslangic', 'SELECT 1');
PREPARE x FROM @s; EXECUTE x; DEALLOCATE PREPARE x;
