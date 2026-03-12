-- 158_v1_cleanup_hafta_sonu_demo.sql
-- 145_v1_hafta_sonu_planlari.sql'deki demo INSERT'i temizle.
-- Demo kaydi "Demo: Bu hafta Cumartesi çalışılacak" aciklamasiyla global (makine_id IS NULL)
-- insert edilmisti. Bu kayit Gantt'ta hafta sonu bloklari uretilmesini engelliyordu.

DELETE FROM `hafta_sonu_planlari`
WHERE `makine_id` IS NULL
  AND `aciklama` LIKE 'Demo:%';
