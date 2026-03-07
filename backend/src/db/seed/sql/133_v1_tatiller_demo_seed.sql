-- ============================================================================
-- PASPAS ERP V1 — Tatiller demo seed (zaman araligi + etkilenen makineler)
-- ============================================================================

INSERT INTO `tatiller` (`id`, `ad`, `tarih`, `baslangic_saati`, `bitis_saati`, `aciklama`) VALUES
('tt000001-0000-4000-8000-000000000001', 'Yılbaşı',                          '2026-01-01', '00:00', '23:59', 'Yılbaşı tatili'),
('tt000001-0000-4000-8000-000000000002', 'Ulusal Egemenlik ve Çocuk Bayramı', '2026-04-23', '00:00', '23:59', '23 Nisan'),
('tt000001-0000-4000-8000-000000000003', 'Emek ve Dayanışma Günü',           '2026-05-01', '00:00', '23:59', '1 Mayıs'),
('tt000001-0000-4000-8000-000000000004', 'Atatürk''ü Anma, Gençlik ve Spor Bayramı', '2026-05-19', '00:00', '23:59', '19 Mayıs'),
('tt000001-0000-4000-8000-000000000005', 'Ramazan Bayramı 1. Gün',          '2026-03-20', '00:00', '23:59', 'Ramazan Bayramı'),
('tt000001-0000-4000-8000-000000000006', 'Ramazan Bayramı 2. Gün',          '2026-03-21', '00:00', '23:59', 'Ramazan Bayramı'),
('tt000001-0000-4000-8000-000000000007', 'Ramazan Bayramı 3. Gün',          '2026-03-22', '00:00', '23:59', 'Ramazan Bayramı'),
('tt000001-0000-4000-8000-000000000008', 'Kurban Bayramı 1. Gün',           '2026-05-27', '00:00', '23:59', 'Kurban Bayramı'),
('tt000001-0000-4000-8000-000000000009', 'Kurban Bayramı 2. Gün',           '2026-05-28', '00:00', '23:59', 'Kurban Bayramı'),
('tt000001-0000-4000-8000-000000000010', 'Kurban Bayramı 3. Gün',           '2026-05-29', '00:00', '23:59', 'Kurban Bayramı'),
('tt000001-0000-4000-8000-000000000011', 'Kurban Bayramı 4. Gün',           '2026-05-30', '00:00', '23:59', 'Kurban Bayramı'),
('tt000001-0000-4000-8000-000000000012', 'Zafer Bayramı',                    '2026-08-30', '00:00', '23:59', '30 Ağustos'),
('tt000001-0000-4000-8000-000000000013', 'Cumhuriyet Bayramı',               '2026-10-29', '00:00', '23:59', '29 Ekim'),
('tt000001-0000-4000-8000-000000000014', 'Planlı Elektrik Kesintisi',        '2026-03-06', '07:10', '19:30', 'Kapasite planlamasında dikkate alınacak kısmi duruş')
ON DUPLICATE KEY UPDATE
  `ad` = VALUES(`ad`),
  `baslangic_saati` = VALUES(`baslangic_saati`),
  `bitis_saati` = VALUES(`bitis_saati`),
  `aciklama` = VALUES(`aciklama`);
