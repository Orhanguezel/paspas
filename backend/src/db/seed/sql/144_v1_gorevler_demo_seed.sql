SET @seed_ts = '2026-03-01 09:00:00';

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
  olusturan_kullanici_id,
  created_at,
  updated_at
)
SELECT
  '14300001-0000-4000-8000-000000000001',
  'Kritik stok satin alma taslagini kontrol et',
  'Otomatik olusan satin alma taslaginin tedarikci ve miktar uygunlugunu kontrol et.',
  'kritik_stok',
  'satin_alma',
  NULL,
  u.id,
  'satin_almaci',
  'acik',
  'kritik',
  '2026-03-08 11:00:00',
  NULL,
  (SELECT id FROM users WHERE email = 'admin@promats.com' LIMIT 1),
  @seed_ts,
  @seed_ts
FROM users u
WHERE u.email = 'satinalma@promats.com'
ON DUPLICATE KEY UPDATE
  baslik = VALUES(baslik),
  aciklama = VALUES(aciklama),
  atanan_kullanici_id = VALUES(atanan_kullanici_id),
  atanan_rol = VALUES(atanan_rol),
  durum = VALUES(durum),
  oncelik = VALUES(oncelik),
  termin_tarihi = VALUES(termin_tarihi),
  updated_at = VALUES(updated_at);

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
  olusturan_kullanici_id,
  created_at,
  updated_at
)
SELECT
  '14300002-0000-4000-8000-000000000002',
  'Bugun sevk edilecek siparisleri dogrula',
  'Termin bugun olan siparisler icin sevkiyat hazirliklarini tamamla.',
  'sevkiyat',
  'satis_siparisleri',
  NULL,
  u.id,
  'sevkiyatci',
  'devam_ediyor',
  'yuksek',
  '2026-03-07 16:00:00',
  NULL,
  (SELECT id FROM users WHERE email = 'admin@promats.com' LIMIT 1),
  @seed_ts,
  @seed_ts
FROM users u
WHERE u.email = 'sevkiyat@promats.com'
ON DUPLICATE KEY UPDATE
  baslik = VALUES(baslik),
  aciklama = VALUES(aciklama),
  atanan_kullanici_id = VALUES(atanan_kullanici_id),
  atanan_rol = VALUES(atanan_rol),
  durum = VALUES(durum),
  oncelik = VALUES(oncelik),
  termin_tarihi = VALUES(termin_tarihi),
  updated_at = VALUES(updated_at);

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
  olusturan_kullanici_id,
  created_at,
  updated_at
)
SELECT
  '14300003-0000-4000-8000-000000000003',
  'Makine havuzundaki atanmamis operasyonlari planla',
  'Makine havuzunda bekleyen operasyonlarin gun sonuna kadar atamasini yap.',
  'uretim',
  'makine_havuzu',
  NULL,
  u.id,
  'operator',
  'acik',
  'normal',
  '2026-03-08 18:00:00',
  NULL,
  (SELECT id FROM users WHERE email = 'admin@promats.com' LIMIT 1),
  @seed_ts,
  @seed_ts
FROM users u
WHERE u.email = 'operator@promats.com'
ON DUPLICATE KEY UPDATE
  baslik = VALUES(baslik),
  aciklama = VALUES(aciklama),
  atanan_kullanici_id = VALUES(atanan_kullanici_id),
  atanan_rol = VALUES(atanan_rol),
  durum = VALUES(durum),
  oncelik = VALUES(oncelik),
  termin_tarihi = VALUES(termin_tarihi),
  updated_at = VALUES(updated_at);
