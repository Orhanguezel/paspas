-- 157_v1_mal_kabul_seed.sql
-- Mal kabul kayitlari ornek verileri
-- 154_v1_mal_kabul_genisletme.sql'nin alter edilmis tabloya gore yazilmistir

INSERT INTO `mal_kabul_kayitlari`
  (`id`, `kaynak_tipi`, `satin_alma_siparis_id`, `satin_alma_kalem_id`, `urun_id`, `tedarikci_id`, `gelen_miktar`, `parti_no`, `kabul_tarihi`, `notlar`, `kalite_durumu`, `kalite_notu`, `created_at`)
VALUES
  -- SA-2026-0001 tam teslim: PVC Sert (3000 kg)
  ('mk000001-0000-4000-8000-000000000001', 'satin_alma',
   'sa000001-0000-4000-8000-000000000001', 'sak00001-0000-4000-8000-000000000001',
   'u0000001-0000-4000-8000-000000000001',
   'c0000001-0000-4000-8000-000000000010',
   3000.0000, 'PVC-2026-02-001', '2026-02-15 09:00:00',
   'SA-2026-0001 PVC Sert tam teslim', 'kabul', NULL, '2026-02-15 09:00:00'),

  -- SA-2026-0001 tam teslim: PVC Yumusak (1500 kg)
  ('mk000001-0000-4000-8000-000000000002', 'satin_alma',
   'sa000001-0000-4000-8000-000000000001', 'sak00001-0000-4000-8000-000000000002',
   'u0000001-0000-4000-8000-000000000002',
   'c0000001-0000-4000-8000-000000000010',
   1500.0000, 'PVC-2026-02-002', '2026-02-15 09:30:00',
   'SA-2026-0001 PVC Yumusak tam teslim', 'kabul', NULL, '2026-02-15 09:30:00'),

  -- SA-2026-0002 kismi teslim: TPE Granul (600 kg, 1000 siparis edildi)
  ('mk000001-0000-4000-8000-000000000003', 'satin_alma',
   'sa000001-0000-4000-8000-000000000002', 'sak00001-0000-4000-8000-000000000003',
   'u0000001-0000-4000-8000-000000000003',
   'c0000001-0000-4000-8000-000000000011',
   600.0000, 'TPE-2026-02-001', '2026-02-25 10:00:00',
   'SA-2026-0002 TPE kismi teslim (600/1000)', 'kabul', NULL, '2026-02-25 10:00:00'),

  -- SA-2026-0003 tam teslim: Siyah Masterbatch (100 kg)
  ('mk000001-0000-4000-8000-000000000004', 'satin_alma',
   'sa000001-0000-4000-8000-000000000003', 'sak00001-0000-4000-8000-000000000005',
   'u0000001-0000-4000-8000-000000000007',
   'c0000001-0000-4000-8000-000000000012',
   100.0000, 'MB-SYH-2026-001', '2026-03-01 11:00:00',
   NULL, 'kabul', NULL, '2026-03-01 11:00:00'),

  -- SA-2026-0003 tam teslim: Gri Masterbatch (80 kg) - kosullu kabul
  ('mk000001-0000-4000-8000-000000000005', 'satin_alma',
   'sa000001-0000-4000-8000-000000000003', 'sak00001-0000-4000-8000-000000000006',
   'u0000001-0000-4000-8000-000000000008',
   'c0000001-0000-4000-8000-000000000012',
   80.0000, 'MB-GRI-2026-001', '2026-03-01 11:30:00',
   NULL, 'kosullu', 'Renk tonu referanstan hafif sapma var, uretimde izlenecek', '2026-03-01 11:30:00'),

  -- SA-2026-0003 tam teslim: Bej Masterbatch (60 kg)
  ('mk000001-0000-4000-8000-000000000006', 'satin_alma',
   'sa000001-0000-4000-8000-000000000003', 'sak00001-0000-4000-8000-000000000007',
   'u0000001-0000-4000-8000-000000000009',
   'c0000001-0000-4000-8000-000000000012',
   60.0000, 'MB-BEJ-2026-001', '2026-03-01 12:00:00',
   NULL, 'kabul', NULL, '2026-03-01 12:00:00'),

  -- Hammadde girisi (SA olmadan, dogrudan hammadde alimi)
  ('mk000001-0000-4000-8000-000000000007', 'hammadde',
   NULL, NULL,
   'u0000001-0000-4000-8000-000000000001',
   NULL,
   500.0000, 'HM-2026-03-001', '2026-03-05 08:30:00',
   'Acil hammadde girisi - spot alis', 'kabul', NULL, '2026-03-05 08:30:00'),

  -- Red mal kabul ornegi (stok artmayacak)
  ('mk000001-0000-4000-8000-000000000008', 'satin_alma',
   'sa000001-0000-4000-8000-000000000002', 'sak00001-0000-4000-8000-000000000004',
   'u0000001-0000-4000-8000-000000000011',
   'c0000001-0000-4000-8000-000000000011',
   50.0000, 'PLST-2026-02-001', '2026-02-27 14:00:00',
   NULL, 'red', 'Renk ve viskozite standart disi, iade edildi', '2026-02-27 14:00:00')

ON DUPLICATE KEY UPDATE `kalite_durumu` = VALUES(`kalite_durumu`);
