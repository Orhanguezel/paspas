# Paspas / Promats Canlı Operasyon Güvenliği Çeklisti

**Hazırlanma tarihi:** 2026-08-05  
**Kapsam:** Paspas ERP API, admin paneli, Promats alt-yol sitesi ve Promats ana site  
**Uygulama sırası:** Yedekleme → geri yükleme provası → izleme → dağıtım güvenliği → sunucu bakımı → uygulama UAT

Bu çeklist canlıda uygulanacak operasyon işlerini bağımlılık ve risk sırasına
koyar. Bir madde yalnız komutun çalışmasıyla değil, kabul kanıtı üretildiğinde
tamamlanmış sayılır. Parola, token ve özel anahtarlar görev notlarına veya Git'e
yazılmaz.

## Faz 0 — Mevcut güvenli başlangıç noktası

- [x] **0.1 Tek kaynak repo ve atomik release yapısı kuruldu** — `critical`
  - Dört canlı süreç `/var/www/paspas-runtime/current` üzerinden çalışıyor.
  - Önceki release hızlı rollback için korunuyor.
  - Kabul kanıtı: release `20260805T092843Z-aaaa510a5105`, dört PM2 süreci
    `online`, restart sayıları `0`.

- [x] **0.2 Eski süreç ve çalışma ağacı kalıntıları temizlendi** — `high`
  - Eski Promats API/admin, Market Pulse ve Amozon süreç/dizinleri kaldırıldı.
  - Nginx eski API adresleri birleşik Paspas API'ye uyumlu geçirildi.
  - Kabul kanıtı: eski port/process/config referansı yok; canlı health kontrolleri
    başarılı.

## Faz 1 — Yedekleme politikasını sabitle

- [ ] **1.1 Yedek kapsamı ve hedeflerini belgeleyip kesinleştir** — `critical`
  - MariaDB/MySQL veritabanı, `/var/www/paspas/uploads`, gerekli production env
    dosyaları ve etkin Nginx/PM2 yapılandırmaları kapsama alınacak.
  - Atomik release artifact'leri yeniden üretilebilir olduğu için ana veri yedeği
    kabul edilmeyecek; yalnız hızlı rollback için son iki release tutulacak.
  - Önerilen hedef: `RPO ≤ 24 saat`, `RTO ≤ 2 saat`, günlük 14 ve aylık 3 kopya.
  - Kabul: kapsam, saklama süresi, yedek saati ve sorumlu kişi runbook'ta yazılı.

- [ ] **1.2 Sunucu dışı yedek hedefini hazırla** — `critical`
  - Yedek aynı VPS diski dışında mevcut yedek altyapısına aktarılacak.
  - Aktarım SSH anahtarı veya ayrılmış servis hesabıyla, en az yetkiyle yapılacak.
  - Hedefte silme yetkisinin sınırlandırılması veya değişmez/sürümlü saklama
    tercih edilecek.
  - Kabul: test dosyası aktarılır, checksum eşleşir ve kaynak silinse de hedefte
    okunabilir kalır.

- [ ] **1.3 Transaction-consistent günlük veritabanı yedeğini otomatikleştir** — `critical`
  - Tarih damgalı, sıkıştırılmış SQL yedeği ve SHA-256 manifest üretilecek.
  - Komut çıktısı ve hata durumu journal'a yazılacak; parola process listesinde
    veya logda görünmeyecek.
  - Yedek sonrası gzip bütünlüğü ve checksum otomatik doğrulanacak.
  - Kabul: zamanlayıcıyla üretilen gerçek yedek doğrulanır ve uzak hedefte bulunur.

- [ ] **1.4 Upload ve kritik yapılandırma yedeğini otomatikleştir** — `critical`
  - Upload dosyaları artımlı ve silme gecikmeli/sürümlü biçimde yedeklenecek.
  - Env/config arşivi şifreli olacak; dosya izinleri en fazla `600`, dizin `700`.
  - Cache, `node_modules`, `.next`, log ve yeniden üretilebilir artifact'ler hariç
    tutulacak.
  - Kabul: örnek ürün görseli, ek dosya ve config kopyası uzak yedekten okunur.

- [ ] **1.5 Saklama, temizlik ve başarısızlık alarmını ekle** — `high`
  - Günlük 14, aylık 3 kopya politikası otomatik uygulanacak.
  - Son başarılı yedek 26 saati aşarsa veya checksum/aktarım başarısızsa alarm
    üretilecek.
  - Kabul: kontrollü başarısızlık senaryosu alarm üretir; eski test yedeği politika
    gereği temizlenir.

## Faz 2 — Geri yükleme provası ve felaket kurtarma

- [ ] **2.1 İzole geri yükleme ortamı hazırla** — `critical`
  - Canlı DB'ye dokunmayan geçici veritabanı/dizin kullanılacak.
  - Geri yükleme script'i hedef adını açıkça ister; production hedefini varsayılan
    olarak reddeder.
  - Kabul: yanlışlıkla canlı hedef seçildiğinde işlem başlamadan güvenli biçimde
    durur.

- [ ] **2.2 Veritabanını son uzak yedekten geri yükle ve doğrula** — `critical`
  - Şema, migration takip tablosu ve kritik tablo sayımları karşılaştırılacak.
  - Kullanıcı, teklif, sipariş, sevkiyat ve web içeriklerinden örnek kayıtlar
    okunacak.
  - Kabul: checksum geçer, import hatasızdır, kritik sayımlar kaynak manifestiyle
    uyumludur ve gerçek geri yükleme süresi kaydedilir.

- [ ] **2.3 Upload dosyalarını geri yükle ve uygulamayla eşleştir** — `critical`
  - İzole dizine geri alınan örnek görsel/PDF/ekler checksum ile doğrulanacak.
  - DB'deki örnek asset yollarının dosya sisteminde karşılığı kontrol edilecek.
  - Kabul: seçilen örneklerin tamamı açılır ve DB–dosya yolu eşleşir.

- [ ] **2.4 Felaket kurtarma runbook'unu prova sonucuyla tamamla** — `high`
  - Yeni VPS, DB restore, upload restore, env, Nginx, PM2 ve atomik release
    aktivasyon sırası yazılacak.
  - Gerçekleşen RPO/RTO ölçümleri ve eksikler kaydedilecek.
  - Kabul: runbook'u daha önce uygulamamış biri yalnız belgeyle prova yapabilir.

## Faz 3 — Sağlık izleme ve alarm

- [ ] **3.1 Dışarıdan uptime kontrollerini kur** — `critical`
  - API health, admin login, Promats alt-yol ve ana domain 1–5 dakikada bir
    kontrol edilecek.
  - HTTPS sertifika süresi, doğru status code ve temel içerik işareti doğrulanacak.
  - Kabul: kontrollü test kesintisi alarm ve iyileşme bildirimi üretir.

- [ ] **3.2 Sunucu kaynak alarmlarını kur** — `high`
  - Disk, inode, RAM, swap, CPU/load ve kritik process durumu izlenecek.
  - Başlangıç eşikleri: disk `%80/%90`, inode `%80/%90`, swap kalıcı yükselişi,
    bellek baskısı ve beklenmeyen restart.
  - Kabul: eşik testi bildirim üretir; normal durumda tekrar eden gürültü yoktur.

- [ ] **3.3 Uygulama ve Nginx hata izlemesini kur** — `critical`
  - PM2 restart/errored, API 5xx, Nginx 499/502/503/504 ve beklenmeyen 403 artışı
    takip edilecek.
  - Alarm mesajında servis, zaman, endpoint ve ilgili log bağlantısı/komutu olacak;
    kişisel veri ve token olmayacak.
  - Kabul: sentetik hata doğru servis adıyla tek alarm üretir.

- [ ] **3.4 Operasyon panosu ve günlük özet oluştur** — `normal`
  - Uptime, son başarılı yedek, disk, bellek, restart, 5xx ve SSL kalan gün tek
    görünümde olacak.
  - Kabul: günlük durum beş dakikadan kısa sürede değerlendirilebilir.

## Faz 4 — Dağıtım ve migration güvenliği

- [ ] **4.1 Tek komutluk production deploy akışını son haline getir** — `critical`
  - Commit sabitleme → local/off-server build → checksum → upload → migration
    preflight → geçici smoke → atomik symlink → PM2 reload → production smoke
    sırası uygulanacak.
  - Aynı commit için artifact ve manifest ilişkilendirilecek.
  - Kabul: temiz commit baştan sona manuel ara müdahale olmadan yayınlanır.

- [ ] **4.2 Migration baseline ve takip tablosunu uzlaştır** — `critical`
  - Daha önce uygulanmış ancak takip tablosunda görünmeyen migration'lar kontrollü
    baseline edilecek.
  - Yeni migration yalnız bir kez çalışacak; dosya checksum değişikliği algılanacak.
  - Kabul: boş deploy'da migration uygulanmaz; yeni test migration'ı bir kez uygulanır.

- [ ] **4.3 Otomatik rollback kapılarını doğrula** — `critical`
  - Build, migration preflight, geçici smoke ve production smoke hataları ayrı ayrı
    simüle edilecek.
  - Şema değişiklikleri için geriye uyumlu expand/contract yaklaşımı kullanılacak;
    veri kaybettiren otomatik DB rollback yapılmayacak.
  - Kabul: uygulama hatasında önceki release otomatik döner ve health tekrar `200` olur.

- [ ] **4.4 Canlıda doğrudan kod değişikliğini engelle** — `high`
  - Runtime release dizinleri deployment kullanıcısı dışında salt okunur olacak.
  - Deploy yalnız script/CI üzerinden ve sınırlı yetkili kullanıcıyla yapılacak.
  - Kaynak checkout değişmişse deploy başlamadan duracak.
  - Kabul: runtime'da manuel yazma ve kirli checkout ile deploy denemeleri reddedilir.

- [ ] **4.5 Release saklama ve artifact temizliğini otomatikleştir** — `normal`
  - Aktif + en az bir doğrulanmış rollback release'i korunacak.
  - Yarım kalmış build, smoke süreci ve geçici arşivler hata/başarı sonunda
    temizlenecek.
  - Kabul: ardışık dört test deploy'u sonunda politika dışı release veya `/tmp`
    artifact'i kalmaz.

## Faz 5 — Kontrollü sunucu bakımı

- [ ] **5.1 Bakım öncesi kontrol ve geri dönüş noktası oluştur** — `critical`
  - Son yedek ve uzak kopya doğrulanacak; PM2 dump, Nginx config testi, aktif
    release ve sağlık baseline'ı kaydedilecek.
  - Paket değişiklikleri ve reboot ihtiyacı önceden listelenecek.
  - Kabul: başarısız bakımda uygulanacak geri dönüş adımı yazılı ve erişilebilir.

- [ ] **5.2 Güvenlik güncellemelerini bakım penceresinde uygula** — `critical`
  - Paket güncellemeleri kontrollü uygulanacak; config çakışmaları otomatik
    ezilmeyecek.
  - Kabul: paket yöneticisi hata vermeden tamamlanır ve kritik güvenlik güncellemesi
    beklemez.

- [ ] **5.3 Sunucuyu yeniden başlat ve açılış dayanıklılığını doğrula** — `critical`
  - PM2 startup/save, Nginx, DB ve dört uygulamanın reboot sonrası otomatik açılması
    kontrol edilecek.
  - Kabul: manuel process başlatmadan tüm health kontrolleri `200`, PM2 süreçleri
    `online`, beklenmeyen port veya eski süreç yok.

- [ ] **5.4 Bakım sonrası 30–60 dakika gözlem yap** — `high`
  - 5xx, restart, bellek, swap, DB bağlantı ve Nginx logları izlenecek.
  - Kabul: gözlem süresince kritik hata/restart yok ve bakım raporu kaydedildi.

## Faz 6 — Uygulama uçtan uca kabul testleri

- [ ] **6.1 Rol ve sevkiyat yetkilerini doğrula** — `critical`
  - Admin ve sevkiyatçı için bekleyenler/liste/detay yetkileri; yetkisiz roller
    için `403` davranışı test edilecek.
  - Stoklu/stoksuz filtreleri ve limit parametreleri kontrol edilecek.
  - Kabul: rol matrisi beklenen `200/403` sonuçlarıyla kayıt altına alınır.

- [ ] **6.2 Tekliften siparişe kritik akışı smoke test et** — `critical`
  - Talep → aday müşteri → taslak → iskonto onayı → PDF/gönderim → public
    görüntüleme → kabul → sipariş → revizyon zinciri test verisiyle yürütülecek.
  - Kabul: tüm durum geçişleri, audit/revizyon ve idempotency kontrolleri geçer;
    test verisi işaretlenir ve kontrollü temizlenir.

- [ ] **6.3 İletişim ve teklif dışı mesaj akışını doğrula** — `high`
  - Genel iletişim, ürün bilgi talebi, OEM/partner ve teklif konusu ayrı ayrı
    gönderilecek.
  - Kabul: teklif talebi Teklif modülünde; diğer mesajlar admin gelen kutusunda
    doğru alanlar ve kaynak URL ile görünür.

- [ ] **6.4 TR/EN URL ve slug matrisini doğrula** — `high`
  - Ürünler/products başta olmak üzere tüm public sayfalar, menüler, dil
    değiştirme, canonical, hreflang ve sitemap test edilecek.
  - Eski yanlış dil URL'leri sorgu parametrelerini koruyan `301`; hedefler `200`
    vermeli, yönlendirme döngüsü olmamalı.
  - Kabul: otomatik route matrisi ve tarayıcı dil değiştirme senaryoları geçer.

- [ ] **6.5 Son kullanıcı kabulü ve görev kapanışlarını yap** — `high`
  - Kritik masaüstü/mobil ekranlar kullanıcı gözüyle kontrol edilecek.
  - Canlıda tamamlanan her iş `/admin/yazilim-gorevleri` içinde kanıt notuyla
    `Çözüldü`, kullanıcı kabulü alınanlar `Kapandı` yapılacak.
  - Kabul: çeklistte açık kritik madde ve kanıtsız kapatılmış görev kalmaz.

## Faz 7 — Sürekli işletim

- [ ] **7.1 Aylık geri yükleme ve rollback provası takvimi oluştur** — `high`
- [ ] **7.2 Haftalık yedek/uptime/disk/restart özeti incele** — `normal`
- [ ] **7.3 Aylık paket, sertifika, kullanıcı/yetki ve secret rotasyon kontrolü yap** — `high`
- [ ] **7.4 Üç aylık felaket kurtarma runbook'unu baştan sona prova et** — `critical`
- [ ] **7.5 Tamamlanan operasyon görevlerini kanıt ve tarihle kapat** — `normal`

## Genel Definition of Done

- [ ] Canlı veri ve upload'ların doğrulanmış, sunucu dışı ve otomatik yedeği var.
- [ ] İzole geri yükleme provası geçti; ölçülen RPO/RTO hedef içinde.
- [ ] Dört servis, kaynaklar, SSL, yedek yaşı ve 5xx için çalışan alarm var.
- [ ] Deploy ve rollback tekrarlanabilir, migration takibi deterministik.
- [ ] Reboot sonrası sistem manuel müdahalesiz ayağa kalkıyor.
- [ ] Sevkiyat, teklif, iletişim ve yerelleştirilmiş URL UAT'leri geçti.
- [ ] Runbook ve canlı yazılım görevleri güncel; her kapanışın kanıtı mevcut.
