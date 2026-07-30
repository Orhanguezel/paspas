# Promats → Paspas Açık İşlemler Checklist'i

**Hazırlanma zamanı:** 2026-07-28 15:01 UTC  
**Gözlem baseline:** 2026-07-28 14:03:27 UTC  
**Eski route'ta son trafik:** 2026-07-28 09:53:10 UTC  
**En erken 48 saat kapısı:** 2026-07-30 14:03:27 UTC

Bu dosya yalnız gerçekten açık kalan işlemleri içerir. Tamamlanmış migrasyon,
asset, API, CMS, Telegram, ses/transkript ve otomatik UAT maddeleri ana
checklist'te kapatılmıştır.

## A. Şimdi yapılabilecek kabul işlemleri

1. [ ] Paspas admin `/admin/yazilim-gorevleri` sayfasını aç.
2. [ ] Bir test kartını masaüstünde sürükle-bırak ile `Çözüldü` sütununa taşı.
3. [ ] Mobil görünümde aynı kartın durum select'ini kontrol et.
4. [ ] Promats Web kaynak etiketinin kartta ve detayda doğru göründüğünü kontrol et.
5. [ ] Ses ekinin kart detayında oynatıldığını görsel olarak kontrol et.
6. [ ] Web Sayfası menüsündeki sayfaları kullanıcı gözüyle aç:
   - Genel Bakış
   - Ürünler
   - Sayfalar
   - Makaleler
   - Menü
   - Sabit Yazılar
   - Site Ayarları
   - Tema
   - Ana Sayfa Bölümleri
   - Web Dosyaları
7. [ ] Kullanıcı kabulü: görünüm ve iş akışı uygun.

Not: Bu akışların API/DB tarafı production UAT ile tamamlandı. Buradaki maddeler
yalnız tarayıcıdaki insan gözü/sürükle-bırak kabulüdür.

## B. 48 saatlik gözlem kapısı

Bu bölüm `2026-07-30 14:03:27 UTC` öncesinde kapatılamaz.

1. [ ] Eski `/promats/api/` route'una baseline sonrası trafik olmadığını doğrula.
2. [ ] Eski `/promats-admin` route'una baseline sonrası trafik olmadığını doğrula.
3. [ ] Paspas API loglarında Promats Web/page-feedback kaynaklı yeni 500/502/503 olmadığını doğrula.
4. [ ] Nginx access/error loglarında yeni kritik 404/500 olmadığını doğrula.
5. [ ] DB bağlantı ve migrasyon hata loglarını kontrol et.
6. [ ] Telegram hata loglarını kontrol et.
7. [ ] `paspas-api`, `paspas-panel`, `promats-frontend` süreçlerinin online olduğunu doğrula.
8. [ ] 48 saatlik gözlem tamamlandı olarak ana checklist'i güncelle.

## C. Eski sistemi yazmaya kapatma ve durdurma

Bu bölüm 48 saat gözlem tamamlandıktan sonra uygulanacaktır.

1. [ ] Eski Promats admin yazma erişimini kapat.
2. [ ] Son kez kaynak DB delta sayımı yap.
3. [ ] Delta varsa idempotent migrasyonu tekrar çalıştır.
4. [ ] Kaynak/hedef nihai sayımları tekrar karşılaştır.
5. [ ] `promats-api` PM2 sürecini durdur; hemen silme.
6. [ ] `promats-admin` PM2 sürecini durdur; hemen silme.
7. [ ] Yeni sistem smoke testlerini tekrar çalıştır.
8. [ ] Kısa durdurma gözleminde rollback gerekmiyorsa silme kapısına geç.

## D. Silme kapısı — açık kullanıcı onayı zorunlu

Aşağıdaki tek onay alınmadan hiçbir eski klasör veya process kaydı silinmez:

- [ ] Kullanıcı açıkça “eski Promats admin/backend'i arşivle ve kaldır” onayı verdi.

Onaydan sonra:

1. [ ] Sunucudaki eski Promats admin/backend dizinlerini tarih damgalı arşive taşı.
2. [ ] Eski Nginx `/promats-admin`, `/promats/api/` ve eski upload tanımlarını kaldır.
3. [ ] `nginx -t` çalıştır; başarılıysa reload et.
4. [ ] PM2'den `promats-api` ve `promats-admin` kayıtlarını kaldır, `pm2 save` yap.
5. [x] Lokal `promats/admin_panel` dizinini kaldır.
6. [x] Lokal `promats/backend` dizinini kaldır.
7. [x] Promats frontend uygulamasını kökteki `frontend/` dizinine taşı.
7. [ ] Workspace/package/lock referanslarını temizle.
8. [ ] Eski import, port, route, PM2 adı ve API base kalıntılarını `rg` ile tara.
9. [ ] Backend, admin ve Promats frontend build/test/smoke kontrollerini tekrar çalıştır.
10. [ ] Kaldırılanlar, arşiv yolu ve rollback bilgisiyle final raporu yaz.

## E. Şu anda bloklayan gerçek koşullar

- [ ] 48 saatlik gözlem süresi henüz dolmadı.
- [ ] Tarayıcı sürükle-bırak/görsel kullanıcı kabulü henüz verilmedi.
- [ ] Eski sistemi kaldırmak için açık kullanıcı silme onayı henüz verilmedi.
