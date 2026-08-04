# Promats Teklif Production Runbook

## Deploy sırası

1. Bakım öncesi commit SHA, PM2 durumu ve health yanıtlarını kaydet.
2. DB yedeği al: `mysqldump --single-transaction --routines --triggers` ile zaman
   damgalı, yalnız root tarafından okunabilen `.sql.gz` üret; `gzip -t` ile doğrula.
3. `/var/www/paspas` içinde `git pull --ff-only`; yalnız yeni seed migrationlarını
   `bun src/db/seed/index.ts --no-drop --only=<dosya>` ile sırayla uygula.
4. Backend: `bun run build`, `.env` export, `PORT=8078 pm2 restart paspas-api --update-env`.
5. Admin: typecheck/build, standalone static/public kopyaları, `paspas-panel` restart.
6. Public web: `/var/www/promats-com-tr/frontend` içinde typecheck/build, standalone
   static/public kopyaları, `PORT=3012 pm2 restart promats-web --update-env`.
7. `8078/health`, admin ve `https://promats.com.tr/tr/iletisim` için HTTP 200 doğrula.
8. İşaretli UAT kaydıyla Playwright teklif akışını çalıştır; testin `finally/afterAll`
   temizliğinin başarılı olduğunu doğrula.
9. `node backend/scripts/monitor-teklif-production.mjs 24` ve PM2 error loglarını izle.

## Rollback

- Uygulama hatasında DB geri yüklemeden önce önceki SHA'yı ayrı bir worktree/release
  dizininde build edip ilgili PM2 sürecini o standalone çıktıya döndür.
- Migration geriye uyumluysa veritabanına dokunma. Veri/şema geri dönüşü gerçekten
  gerekirse yazmayı durdur, mevcut DB'nin ayrıca olay-anı yedeğini al, doğrulanmış
  pre-deploy dump'ını bakım penceresinde geri yükle ve üç health kontrolünü tekrarla.
- Rollback sırasında `.env.production`, `backend/.env` ve kullanıcıya ait kilit dosyaları
  overwrite edilmez; secret değerleri loga veya repoya yazılmaz.

## İzlenecek göstergeler

- PM2 `paspas-api` error/restart artışı ve HTTP 5xx oranı.
- Kaydedilen talep, teklife dönüşen talep, gönderilen/görüntülenen/kabul edilen teklif,
  siparişe dönüşüm ve kabul oranı. Sayaçlar salt-okunur monitor scriptinden alınır.
