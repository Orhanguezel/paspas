

# Şifre sorar
mysql -u root -p

ADMIN_EMAIL="admin@site.com" ADMIN_PASSWORD="SüperGizli!" bun run db:seed


cd /var/www/emlak/backend

rm -rf dist .tsbuildinfo
bun run build

ALLOW_DROP=true bun run db:seed
# veya
ALLOW_DROP=true node dist/db/seed/index.js

Email: orhanguzell@gmail.com
Şifre: Admin123!
Kamanilan@2026!

E-posta	musteri@kamanilan.com
Şifre	Musteri@2026!
Rol	user (normal müşteri)


E-posta: satici@kamanilan.com
Şifre: Kamanilan@2026!
Rol: seller

"https://kirsehirhaber40.com/rss"


# BACKEND klasörüne geç
cd /var/www/emlak/backend

# Production build’i zaten aldıysan tekrar şart değil, yoksa:
bun install --no-save
bun run build

# PM2 ile BUN interpreter kullanarak başlat
PORT=8083 pm2 start dist/index.js \
  --name emlak-backend \
  --cwd /var/www/emlak/backend \
  --interpreter "$(command -v bun)" \
  --update-env

pm2 save
pm2 logs emlak-backend --lines 50




mkdir -p dist/db/seed/sql
cp -f src/db/seed/sql/*.sql dist/db/seed/sql/


cd ~/Documents/emlak   # doğru klasör
git status                    # ne değişmiş gör
git add -A
git commit -m "mesajın"
git pull --rebase origin main
git push origin main



-- 1. Yeni veritabanını oluştur (örnek: emlak)
CREATE DATABASE `emlak` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Uygulama kullanıcısını oluştur / şifresini ayarla
-- (hem localhost hem 127.0.0.1 hem de istersen % için)
CREATE USER IF NOT EXISTS 'app'@'localhost' IDENTIFIED BY 'app';
CREATE USER IF NOT EXISTS 'app'@'127.0.0.1' IDENTIFIED BY 'app';
CREATE USER IF NOT EXISTS 'app'@'%' IDENTIFIED BY 'app';

-- 3. Yetkileri ver
GRANT ALL PRIVILEGES ON `emlak`.* TO 'app'@'localhost';
GRANT ALL PRIVILEGES ON `emlak`.* TO 'app'@'127.0.0.1';
GRANT ALL PRIVILEGES ON `emlak`.* TO 'app'@'%';

FLUSH PRIVILEGES;

-- (İleride şifreyi değiştirmek istersen)
-- ALTER USER 'app'@'localhost' IDENTIFIED BY 'yeniSifre';
-- ALTER USER 'app'@'127.0.0.1' IDENTIFIED BY 'yeniSifre';
-- ALTER USER 'app'@'%' IDENTIFIED BY 'yeniSifre';



```sh
pm2 flush


cd /var/www/emlak
git fetch --prune
git reset --hard origin/main

cd backend
bun run build

# çalışan süreç kesilmeden reload
pm2 reload ecosystem.config.cjs --env production

# gerekirse log izle
pm2 logs emlak-backend --lines 100

```

cd /var/www/emlak

git fetch origin
git reset --hard origin/main
git clean -fd   # (untracked dosyaları da siler, istersen)




Merhabalar, detaylı talebiniz için teşekkürler. Sorularınızı tek tek yanıtlıyorum:

1. PROJE BEDELİ
Belirttiğiniz kapsam (8–12 sayfa, çift dil, yönetim paneli, teklif formu, SEO) için teklifim 10.000 ₺'dir.

2. TESLİM SÜRESİ
Proje 10–15 gün içinde teslim edilir. Sayfa sayısına ve içerik akışına göre netleşir.

3. KULLANILAN ALTYAPI
Next.js (React) + özel yönetim paneli ile geliştiriyorum. WordPress kullanmıyorum. Bu yaklaşım daha hızlı, daha güvenli ve SEO açısından çok daha performanslıdır. Çoklu dil altyapısı (TR/EN) Next.js i18n ile kurulur. Teklif formunda spam koruması (reCAPTCHA) ve güvenli mail iletimi dahildir.

4. TEKNİK DESTEK
Teslim sonrası 30 gün ücretsiz teknik destek sağlıyorum. Uzun vadeli bakım anlaşması talep ederseniz ayrıca görüşebiliriz.

Referans projelerimi inceleyebilirsiniz:
- sportoonline.com — E-ticaret platformu
- koenigsmassage.com — Kurumsal + randevu sistemi
- ensotek.de — Kurumsal + çoklu dil + teklif formu

Detayları görüşmek için mesaj atabilirsiniz.



DETAYLI TEKLİF ANALİZİ
Teknoloji Stack:

Frontend: Next.js 16 + TypeScript + Tailwind CSS
Backend: Laravel 12 (PHP) + REST API
Veritabanı: MariaDB
Auth: Laravel Sanctum (rol bazlı: Üye / Muhasebe / Sekreter / Admin)
Ödeme: iyzico veya Param banka entegrasyonu
Evrak: PDF oluşturma + e-imza entegrasyonu (e-Devlet uyumlu)
Deploy: VPS + Nginx + SSL

Modüller & Tahmini Süreler:
ModülSüreAuth & Rol sistemi1 haftaÜye kayıt, NACE sınıflandırma, evrak sistemi2 haftaAidat & ödeme sistemi (banka entegrasyonu)2 haftaMuhasebe modülü (tahakkuk, ödeme tanımlama, tam muhasebe)4 haftaSekreter modülü1 haftaAdmin paneli (raporlar, banka bakiye, tüm yetkiler)2 haftaTest, responsive, deployment1 hafta
Toplam Süre: ~6-8 hafta (2 ay)
Fiyat: 50.000 ₺ (KDV dahil)


Merhabalar, bu kapsam için Next.js + Laravel 12 + MariaDB ile geliştirme yapıyorum. 4 ayrı rol (Üye, Muhasebe, Sekreter, Admin), banka entegrasyonu (iyzico/Param), otomatik aidat tahakkuku, e-imzalı evrak üretimi ve tam muhasebe modülü dahil.

Teslim süresi: ~6-8 hafta
Fiyat: 5000 ₺ (muhasebe modülü detaylandıktan sonra kesinleşir)
Kaynak kodlar teslim edilir.

Muhasebe modülünü detaylandırmak için görüşelim.