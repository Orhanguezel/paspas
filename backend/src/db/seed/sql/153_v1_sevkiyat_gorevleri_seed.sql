SET @admin_user_id = (SELECT id FROM users WHERE email = 'admin@promats.com' LIMIT 1);
SET @sevkiyat_user_id = (SELECT id FROM users WHERE email = 'sevkiyat@promats.com' LIMIT 1);

INSERT INTO gorevler (
  id,
  baslik,
  aciklama,
  tip,
  modul,
  ilgili_kayit_id,
  atanan_kullanici_id,
  atanan_rol,
  durum,
  oncelik,
  termin_tarihi,
  tamamlandi_at,
  olusturan_kullanici_id
)
SELECT
  UUID(),
  'Sevk onayini ver',
  CONCAT(m.ad, ' icin ', u.kod, ' - ', u.ad, ' sevk emri onay bekliyor.'),
  'sevkiyat',
  'sevkiyat',
  se.id,
  @admin_user_id,
  'admin',
  'acik',
  'yuksek',
  TIMESTAMP(se.tarih, '17:00:00'),
  NULL,
  COALESCE(se.created_by, @admin_user_id)
FROM sevk_emirleri se
INNER JOIN musteriler m ON m.id = se.musteri_id
INNER JOIN urunler u ON u.id = se.urun_id
WHERE se.durum = 'bekliyor';

INSERT INTO gorevler (
  id,
  baslik,
  aciklama,
  tip,
  modul,
  ilgili_kayit_id,
  atanan_kullanici_id,
  atanan_rol,
  durum,
  oncelik,
  termin_tarihi,
  tamamlandi_at,
  olusturan_kullanici_id
)
SELECT
  UUID(),
  'Fiziksel sevki tamamla',
  CONCAT(m.ad, ' icin ', u.kod, ' - ', u.ad, ' sevki fiziki cikis bekliyor.'),
  'sevkiyat',
  'sevkiyat',
  se.id,
  @admin_user_id,
  'admin',
  'acik',
  'kritik',
  TIMESTAMP(se.tarih, '17:00:00'),
  NULL,
  COALESCE(se.created_by, @admin_user_id)
FROM sevk_emirleri se
INNER JOIN musteriler m ON m.id = se.musteri_id
INNER JOIN urunler u ON u.id = se.urun_id
WHERE se.durum = 'onaylandi';

INSERT INTO gorevler (
  id,
  baslik,
  aciklama,
  tip,
  modul,
  ilgili_kayit_id,
  atanan_kullanici_id,
  atanan_rol,
  durum,
  oncelik,
  termin_tarihi,
  tamamlandi_at,
  olusturan_kullanici_id
)
SELECT
  UUID(),
  'Fiziksel sevki tamamla',
  CONCAT(m.ad, ' icin ', u.kod, ' - ', u.ad, ' sevki fiziki cikis bekliyor.'),
  'sevkiyat',
  'sevkiyat',
  se.id,
  @sevkiyat_user_id,
  'sevkiyatci',
  'acik',
  'kritik',
  TIMESTAMP(se.tarih, '17:00:00'),
  NULL,
  COALESCE(se.created_by, @admin_user_id)
FROM sevk_emirleri se
INNER JOIN musteriler m ON m.id = se.musteri_id
INNER JOIN urunler u ON u.id = se.urun_id
WHERE se.durum = 'onaylandi';
