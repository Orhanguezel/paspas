-- ============================================================================
-- PASPAS ERP V1 — Musteri demo detaylari
-- ilgili_kisi ve email alanlarini ornek verilerle doldurur
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

UPDATE `musteriler`
SET
  `ilgili_kisi` = 'Ahmet Yilmaz',
  `email` = 'ahmet@istanbuloto.com'
WHERE `ad` = 'İstanbul Oto Aksesuar A.Ş.';

UPDATE `musteriler`
SET
  `ilgili_kisi` = 'Ayse Kaya',
  `email` = 'ayse@ankaraoto.com'
WHERE `ad` = 'Ankara Oto Market';

UPDATE `musteriler`
SET
  `ilgili_kisi` = 'Mehmet Demir',
  `email` = 'mehmet@egeoto.com'
WHERE `ad` = 'Ege Oto Aksesuar Ltd.';

UPDATE `musteriler`
SET
  `ilgili_kisi` = 'Fatma Celik',
  `email` = 'fatma@guneyoto.com'
WHERE `ad` = 'Güney Oto Paspas Dağıtım';

UPDATE `musteriler`
SET
  `ilgili_kisi` = 'Emre Aydin',
  `email` = 'emre@karadenizoto.com'
WHERE `ad` = 'Karadeniz Oto Malzeme';

UPDATE `musteriler`
SET
  `ilgili_kisi` = 'Omar Hassan',
  `email` = 'sales@alrashidtrading.com'
WHERE `ad` = 'Al-Rashid Trading (İhracat)';

UPDATE `musteriler`
SET
  `ilgili_kisi` = 'Anna Mueller',
  `email` = 'anna@europarts.de'
WHERE `ad` = 'EuroParts GmbH (İhracat)';

UPDATE `musteriler`
SET
  `ilgili_kisi` = 'Murat Koc',
  `email` = 'murat@pvcgranul.com'
WHERE `ad` = 'PVC Granül Kimya San. A.Ş.';

UPDATE `musteriler`
SET
  `ilgili_kisi` = 'Selin Aras',
  `email` = 'selin@polimerplastik.com'
WHERE `ad` = 'Polimer Plastik San.';

UPDATE `musteriler`
SET
  `ilgili_kisi` = 'Can Aksoy',
  `email` = 'can@renkmasterbatch.com'
WHERE `ad` = 'Renk Masterbatch Ltd.';

UPDATE `musteriler`
SET
  `ilgili_kisi` = 'Zehra Sahin',
  `email` = 'zehra@halikece.com'
WHERE `ad` = 'Halı Keçe Tekstil A.Ş.';

UPDATE `musteriler`
SET
  `ilgili_kisi` = 'Burak Tunc',
  `email` = 'burak@ambalajkutu.com'
WHERE `ad` = 'Ambalaj Kutu Matbaa';
