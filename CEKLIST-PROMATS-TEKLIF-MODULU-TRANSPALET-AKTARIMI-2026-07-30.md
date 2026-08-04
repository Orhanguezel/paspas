# Promats Teklif Modülü — Transpalet Aktarımı ve Frontend Entegrasyonu

**Tarih:** 2026-07-30  
**Kaynak uygulama:** `/home/orhan/Documents/Projeler/transpalet-crm`  
**Hedef:** Paspas backend + admin panel + Promats web frontend  
**Kapsam:** CRM, web teklif talebinin alınması, fırsata dönüştürülmesi,
fiyatlandırılması, PDF olarak gönderilmesi, görüntülenmesi ve satış siparişine
dönüştürülmesi

## Mevcut durum

- Promats frontend iletişim ve OEM formları
  `POST /api/web/promats/contact` çağrısı yapıyor.
- Backend yalnız yönetici bildirimi ve Telegram mesajı üretiyor.
- Talep, müşteri, teklif veya teklif kalemi olarak veritabanına yazılmıyor.
- Paspas backenddeki `proje_teklifi_notlari` gerçek teklif modülü değil;
  yalnız dokümanlara yazılımcı notu tutuyor.
- Transpalet projesinde çalışan bir teklif temeli mevcut:
  `teklifler`, `teklif_kalemleri`, `teklif_revizyonlari`,
  `teklif_gonderimleri`, `teklif_sablonlari`, yıllık numara sayacı,
  durum makinesi, iskonto onayı, PDF, public token ve siparişe dönüştürme.
- Transpalet projesinde ayrıca pipeline/aşama, talepler, fırsatlar, aktiviteler,
  hatırlatmalar, iletişim geçmişi, otomasyon, raporlar ve teklif–sipariş
  dönüşümünü kapsayan CRM altyapısı var.

## Taşıma ilkeleri

- Kaynak kod birebir kopyalanmayacak; Paspas’ın mevcut müşteri, ürün, satış
  siparişi, yetki, bildirim, depolama ve mail yapılarına uyarlanacak.
- Transpalet’e özel `teker_tipi`, teknik ihtiyaç formu ve Daima PDF metinleri
  taşınmayacak.
- Gönderilmiş teklif değiştirilmeyecek. Değişiklik yeni revizyon oluşturacak
  ve eski fiyat, ürün açıklaması, müşteri adresi ve koşullar snapshot olarak
  korunacak.
- Web formu doğrudan fiyatlı teklif oluşturmayacak. Önce doğrulanabilir bir
  **teklif talebi/lead** oluşturacak; yönetici bunu müşteri ve taslak teklife
  dönüştürecek.
- Teklif modülü CRM’den kopuk çalışmayacak. Web talebi, müşteri, fırsat,
  aktiviteler, teklif ve sipariş aynı satış zincirinde birbirine bağlanacak.
- Public token tahmin edilemez, iptal edilebilir ve süreli olacak; müşteri
  verisi PDF dışındaki bir API cevabında açığa çıkarılmayacak.

---

## Faz 1 — Analiz ve veri sözleşmesi

- [ ] **1. Kaynak–hedef uyumluluk matrisi hazırla** — `critical`
  - Transpalet tabloları, servisleri, endpointleri ve admin bileşenleri
    Paspas karşılıklarıyla eşleştirilecek.
  - `musteriler`, `urunler`, `satis_siparisleri`, `storage_assets`, kullanıcı
    ve rol alanlarındaki farklar yazılı hale getirilecek.
  - Kabul: Taşınacak, uyarlanacak ve çıkarılacak her alan açıkça listelenmiş.

- [ ] **2. Promats teklif kapsamını Fuar Teklif Modülü’nden ayır** — `high`
  - Promats web teklif modülü yurtiçi/standart teklif ve web lead yönetimine
    odaklanacak.
  - Fuar modülündeki palet, koli, CBM, konteyner, proforma ve çeki listesi bu
    aktarımın zorunlu V1 kapsamına alınmayacak.
  - Kabul: İki modülün veri sahipliği ve gelecekteki entegrasyon sınırı belli.

- [ ] **3. Teklif durum makinesi ve iş kurallarını kesinleştir** — `critical`
  - Durumlar: `talep`, `taslak`, `onay_bekliyor`, `gonderildi`,
    `goruntulendi`, `revizyon`, `kabul`, `red`, `suresi_doldu`.
  - Geçişler backend tarafından doğrulanacak; UI yalnız izin verilen eylemleri
    gösterecek.
  - Kabul: Geçersiz durum atlamaları API seviyesinde `409` ile engelleniyor.

## Faz 2 — Backend ve veritabanı

- [ ] **4. Teklif şeması için güvenli migration oluştur** — `critical`
  - Yıllık sayaç, teklifler, kalemler, revizyonlar, gönderimler ve şablonlar
    oluşturulacak.
  - Paspas müşteri, ürün, sipariş ve storage foreign keyleri kullanılacak.
  - Migration tekrar çalıştırılabilir ve mevcut veriyi bozmadan geri
    doğrulanabilir olacak.

- [ ] **5. Web teklif talepleri tablosunu oluştur** — `critical`
  - Alanlar: kaynak sayfa, dil, ad/şirket, e-posta, telefon, konu, mesaj,
    seçilen ürünler, UTM/referrer, KVKK onayı, durum, sorumlu, müşteri ve teklif
    bağlantısı, oluşturulma zamanı.
  - Durumlar: `yeni`, `inceleniyor`, `musteriye_donustu`,
    `teklife_donustu`, `istenmeyen`, `kapandi`.
  - Kabul: Her web gönderimi tekil ve izlenebilir kayıt oluşturuyor.

- [ ] **6. Public teklif talebi endpointini geliştir** — `critical`
  - Yeni endpoint mevcut `/web/promats/contact`tan ayrılacak veya açık bir
    `requestType=quote` sözleşmesi kullanacak.
  - Zod doğrulama, boyut sınırı, rate-limit, honeypot/anti-spam ve IP hash
    uygulanacak.
  - Tekrar gönderim/idempotency yaklaşımıyla çift kayıt önlenecek.
  - Kabul: Geçersiz istek reddediliyor; geçerli istek DB, bildirim ve Telegram
    sonuçlarından bağımsız olarak başarıyla saklanıyor.

- [ ] **7. İletişim mesajı ile teklif talebini ayır** — `high`
  - Genel iletişim, destek ve iş ortaklığı mesajları iletişim akışında kalacak.
  - `Teklif Talebi` ve OEM fiyat talebi teklif gelen kutusuna düşecek.
  - Kabul: Konu seçimine göre doğru kayıt türü oluşuyor.

- [ ] **8. Teklif CRUD ve listeleme API’lerini taşı** — `critical`
  - Liste, detay, oluşturma, yalnız taslakta güncelleme ve yalnız taslakta silme
    endpointleri Paspas backend standardına uyarlanacak.
  - Arama/filtre: teklif no, müşteri, durum, tarih, sorumlu ve para birimi.
  - Kabul: Yetkili kullanıcı teklif yaşam döngüsünü API üzerinden yönetebiliyor.

- [ ] **9. Teklif kalemleri ve ürün snapshot’ını uygula** — `critical`
  - Ürün seçimi yanında manuel açıklama kalemine izin verilecek.
  - Ürün adı/kodu, birim, açıklama, fiyat ve gerekli teknik bilgiler teklif
    anında snapshot olarak saklanacak.
  - Kabul: Ürün kartı değiştiğinde gönderilmiş teklif değişmiyor.

- [ ] **10. Merkezi toplam hesaplama motorunu uyarlа** — `critical`
  - Miktar × fiyat, satır indirimi, genel indirim, nakliye, KDV dahil/haric ve
    genel toplam tek backend fonksiyonunda hesaplanacak.
  - Decimal/yuvarlama politikası açık olacak; istemciden gelen toplamlar
    güvenilir kabul edilmeyecek.
  - Kabul: API, admin ekranı ve PDF aynı sonucu veriyor.

- [ ] **11. Teklif numaralandırmasını taşı** — `high`
  - Yıllık sayaç transaction/lock ile yarış koşuluna dayanıklı çalışacak.
  - Promats formatı kesinleştirilecek; örnek `TK-2026-0001`.
  - Kabul: Paralel oluşturmalarda mükerrer numara üretilmiyor.

- [ ] **12. Revizyon snapshot mekanizmasını düzeltip taşı** — `critical`
  - R0 ilk teklif olarak korunacak; sonraki değişiklikler R1, R2 şeklinde yeni
    değişmez snapshot üretecek.
  - Snapshot müşteri, kalem, fiyat, toplam, koşul, dil ve PDF şablon verisini
    kapsayacak.
  - Kabul: Her revizyon ayrı görüntülenip yeniden PDF üretilebiliyor.

- [ ] **13. İskonto onay akışını Paspas rollerine bağla** — `high`
  - `admin.teklif`, `admin.teklif_onay` benzeri izinler eklenecek.
  - Rol bazlı iskonto limiti ayarlardan yönetilecek.
  - Kabul: Limit üstü teklif onaysız gönderilemiyor; onay/red audit kaydı var.

- [ ] **14. Teklif PDF servisini Promats markasına uyarla** — `critical`
  - Daima/transpalet metin ve teknik alanları kaldırılacak.
  - Promats logo, firma bilgileri, müşteri, ürünler, toplamlar, teslim/ödeme
    koşulları, geçerlilik ve revizyon numarası basılacak.
  - TR/EN; gerekiyorsa DE şablonları DB üzerinden yönetilecek.
  - Kabul: PDF ekran toplamlarıyla aynı, A4 baskıya uygun ve production’da
    Puppeteer/Chromium ile üretilebilir.

- [ ] **15. Gönderim ve görüntülenme takibini taşı** — `critical`
  - E-posta, WhatsApp bağlantısı ve manuel gönderim kaydedilecek.
  - Her deneme kanal, alıcı, durum ve hata bilgisiyle saklanacak.
  - Süreli public token PDF’i açtığında ilk görüntülenme zamanı kaydedilecek.
  - Kabul: Başarısız e-posta teklifi gönderilmiş saymıyor; tekrar denenebiliyor.

- [ ] **16. Kabul/red ve siparişe dönüştürme akışını uyarlа** — `critical`
  - Kabul/red nedeni ve zamanı saklanacak.
  - Kabul edilmiş teklif seçilen kalemlerle Paspas satış siparişine
    dönüştürülebilecek.
  - Aynı teklif ikinci kez siparişe dönüştürülemeyecek.
  - Kabul: Teklif–sipariş bağı iki yönde izlenebiliyor.

- [ ] **17. Audit, bildirim ve süre sonu işlerini ekle** — `high`
  - Oluşturma, fiyat/iskonto değişikliği, onay, gönderim, görüntülenme,
    revizyon, kabul, red ve dönüşüm audit loguna yazılacak.
  - Yeni web talebi ve onay bekleyen teklif yöneticilere bildirilecek.
  - Geçerlilik tarihi geçen gönderilmiş teklifler zamanlanmış işle
    `suresi_doldu` yapılacak.

## Faz 2B — CRM backend ve veri modeli

- [x] **33. CRM kaynak–hedef uyumluluk matrisi hazırla** — `critical`
  - Transpalet `crm`, `talepler`, `iletisim`, `otomasyon`, servis ve rapor
    modüllerindeki tablolar, endpointler ve bağımlılıklar çıkarılacak.
  - Paspas’ta zaten bulunan müşteri, kullanıcı, görev, bildirim, satış siparişi,
    üretim ve sevkiyat yapılarıyla çakışmalar belirlenecek.
  - Kabul: Birebir taşınacak, birleştirilecek ve kapsam dışı bırakılacak CRM
    parçaları alan seviyesinde kayıtlı.

- [x] **34. CRM pipeline ve aşama şemasını taşı** — `critical`
  - Pipeline, aşama sırası, kazanma olasılığı, kazanıldı/kaybedildi işaretleri,
    renk ve aşamada bekleme uyarısı Paspas migrationlarına eklenecek.
  - Varsayılan Promats satış pipeline’ı başlangıç verisi oluşturulacak.
  - Kabul: Birden fazla pipeline ve yönetilebilir aşama sırası destekleniyor.

- [x] **35. Talep/lead veri modelini CRM ile birleştir** — `critical`
  - Web teklif talepleri ayrı ve kopuk tablo olmak yerine CRM talep kaynağı
    olarak tasarlanacak veya güvenli birebir bağ kurulacak.
  - Kaynak, kanal, ürün ilgisi, kampanya/UTM, sorumlu, öncelik, durum,
    müşteri/fırsat ilişkisi ve dönüşüm zamanı saklanacak.
  - Kabul: Aynı web kaydı ikinci kez fırsata dönüştürülemiyor.

- [x] **36. CRM fırsat veri modelini ve API’lerini taşı** — `critical`
  - Pipeline/aşama, müşteri, talep, yetkili, başlık, durum, tahmini tutar, para
    birimi, sorumlu, olasılık, beklenen kapanış ve kaybetme nedeni alanları
    uyarlanacak.
  - Liste, detay, oluşturma, güncelleme, silme ve aşama taşıma endpointleri
    Paspas yetki standardına bağlanacak.
  - Kabul: Fırsatın bütün temel işlemleri audit kaydıyla yapılabiliyor.

- [x] **37. Talep → müşteri → fırsat dönüşümünü transaction ile kur** — `critical`
  - Talep mevcut müşteriye eşlenebilecek veya yeni müşteri oluşturabilecek.
  - Fırsat ve ilk aktivite aynı işlemde oluşturulacak; kısmi başarısızlıkta
    bütün değişiklikler geri alınacak.
  - Kabul: Dönüşüm zincirinde sahipsiz veya yinelenen kayıt kalmıyor.

- [x] **38. Fırsat ürünleri ve teknik ihtiyaç bağlantısını uyarlа** — `high`
  - Fırsata ürün, miktar, tahmini fiyat ve not eklenebilecek.
  - Transpalet’e özel teker/teknik ihtiyaç alanları çıkarılacak; Promats ürün
    özellikleri ve gerekirse serbest ihtiyaç notları kullanılacak.
  - Kabul: Fırsat ürünleri taslak teklife snapshot olarak aktarılabiliyor.

- [x] **39. CRM aktiviteleri ve zaman çizelgesini taşı** — `critical`
  - Arama, toplantı, e-posta, WhatsApp, not ve görev aktiviteleri müşteri,
    talep, fırsat, teklif veya siparişe bağlanabilecek.
  - Planlanan tarih, sonuç, sonraki işlem, süre, tamamlanma ve sorumlu
    kullanıcı alanları korunacak.
  - Kabul: İlgili kaydın tüm aktiviteleri tek kronolojik zaman çizelgesinde.

- [x] **40. Hatırlatma ve geciken takip altyapısını taşı** — `high`
  - Kullanıcı, kaynak türü/kaydı, hatırlatma zamanı ve kanal bilgisi tutulacak.
  - Teklif gönderimi sonrası takip ve aşamada uzun bekleme için otomatik görev
    veya bildirim üretilecek.
  - Kabul: Hatırlatma tek kez çalışıyor ve gönderim sonucu kaydediliyor.

- [x] **41. CRM iletişim geçmişini Paspas mail/mesaj yapısına bağla** — `high`
  - Gelen/giden e-posta, WhatsApp bağlantısı, telefon notu ve manuel iletişim
    kaydı müşteri ve fırsat zaman çizelgesinde gösterilecek.
  - SMTP hataları ve gönderim kimlikleri kayıt altında tutulacak.
  - Kabul: Teklif e-postası ayrıca CRM iletişim geçmişinde görünüyor.

- [x] **42. Kaybedilme nedenleri ve kapanış kurallarını taşı** — `high`
  - Yönetilebilir kaybetme nedeni listesi olacak.
  - Kazanıldı/kaybedildi aşamalarına geçişte gerekli alanlar doğrulanacak.
  - Kabul: Kaybedilen fırsat neden olmadan kapatılamıyor; raporlara yansıyor.

- [x] **43. CRM otomasyon motorunu uyarlа** — `high`
  - Talep oluştu, fırsat oluştu, aşama değişti, teklif gönderildi/kabul edildi,
    takip gecikti, sipariş oluştu ve sevkiyat tamamlandı tetikleyicileri
    değerlendirilecek.
  - İlk sürümde yalnız güvenli eylemler: görev oluşturma, bildirim gönderme ve
    sorumlu atama etkinleştirilecek.
  - Kabul: Otomasyon tekrar çalıştığında aynı görevi/bildirimi çoğaltmıyor.

- [x] **44. CRM dashboard özet servisini taşı** — `high`
  - Açık talep, aktif fırsat, pipeline tutarı, gönderilen/kabul edilen teklif,
    geciken takip, kazanma oranı ve beklenen gelir KPI’ları eklenecek.
  - Bütün KPI’lar ortak durum tanımlarını kullanacak.
  - Kabul: Dashboard değerleri kaynak listelerin filtreli toplamlarıyla aynı.

- [x] **45. CRM rapor servislerini taşı** — `normal`
  - Dönüşüm hunisi, aşamada bekleme, kullanıcı performansı, kaynak performansı,
    teklif kabul oranı, kaybetme nedenleri, ürün satışı ve satış döngüsü süresi
    raporlanacak.
  - Kabul: Tarih, sorumlu, pipeline ve kaynak filtreleri backendde çalışıyor.

- [x] **46. Kaydedilmiş CRM görünümlerini taşı** — `normal`
  - Kullanıcılar fırsat ve aktivite filtrelerini adlandırıp saklayabilecek,
    varsayılan görünüm belirleyebilecek ve silebilecek.
  - Kabul: Görünümler kullanıcıya özel ve yetki sınırları içinde.

- [x] **47. CRM audit olaylarını Paspas audit sistemine bağla** — `critical`
  - Talep dönüşümü, fırsat oluşturma/güncelleme/aşama değişimi, ürün değişimi,
    teklif oluşturma/gönderme/kabul ve sipariş dönüşümü audit edilecek.
  - Kabul: Kim, ne zaman, hangi eski/yeni değerle işlem yaptı izlenebiliyor.

- [x] **48. CRM rol ve izinlerini Paspas’a ekle** — `critical`
  - Dashboard, talep, fırsat, aktivite, pipeline yönetimi, teklif, teklif onayı,
    rapor ve otomasyon izinleri ayrı tanımlanacak.
  - Satış temsilcisi yalnız kendi kayıtlarını; yönetici ekip kayıtlarını
    görebilecek şekilde veri kapsamı kararlaştırılacak.
  - Kabul: UI gizlemesine bağlı kalmadan API seviyesinde erişim engelleniyor.

- [x] **49. Fırsat → teklif → sipariş → üretim/sevkiyat bağlarını kur** — `critical`
  - Fırsattan teklif; kabul edilmiş tekliften satış siparişi üretilecek.
  - CRM detayında sipariş, üretim ve sevkiyat durumları salt-okunur
    gösterilecek.
  - Kabul: Bağlantılar çift yönlü, tekrarsız ve mevcut ERP kayıtlarını bozmuyor.

- [ ] **50. CRM backend test paketini taşı ve uyarlа** — `critical`
  - Pipeline, aşama sırası, dönüşüm transactionı, aktiviteler, hatırlatmalar,
    otomasyon idempotency, yetki/RLS, dashboard tutarlılığı, raporlar ve
    ERP çapraz akışları test edilecek.
  - Kabul: Transpalet’e özgü varsayımlar kaldırılmış, Paspas gerçek entegrasyon
    testleri geçiyor.

## Faz 3 — Admin panel

- [ ] **18. Teklif Talepleri gelen kutusunu oluştur** — `critical`
  - Yeni/inceleniyor/dönüştürüldü/spam filtreleri; arama, tarih, dil, konu ve
    sorumlu filtreleri olacak.
  - Detayda form içeriği, seçilen ürünler, kaynak URL ve UTM bilgileri
    gösterilecek.
  - Kabul: Yönetici talebi kaybetmeden açıp durumunu ve sorumlusunu değiştirebilir.

- [ ] **19. Talebi müşteri ve taslak teklife dönüştür** — `critical`
  - E-posta/telefon ile olası mevcut müşteriler önerilecek.
  - Yönetici mevcut müşteriyi seçebilecek veya yeni müşteri oluşturabilecek.
  - Seçilen web ürünleri taslak kalem önerisi olarak aktarılacak; fiyatı
    yönetici doğrulayacak.
  - Kabul: Talep, müşteri ve teklif bağlantıları tek transaction ile kuruluyor.

- [ ] **20. Teklif liste ekranını taşı ve geliştir** — `high`
  - Teklif no, revizyon, müşteri, durum, toplam, para birimi, geçerlilik,
    sorumlu ve son işlem tarihi gösterilecek.
  - Kaydedilmiş filtreler ve sayfalama eklenecek.
  - Kabul: Büyük listede tüm filtreler backend üzerinden çalışıyor.

- [ ] **21. Teklif editörünü Paspas ürün/müşteri seçicileriyle kur** — `critical`
  - Müşteri, ürün, miktar, fiyat, indirim, KDV, nakliye, para birimi, dil,
    ödeme/teslim koşulları ve geçerlilik yönetilecek.
  - Duruma göre alanlar kilitlenecek; yalnız izin verilen eylemler görünecek.
  - Kabul: Taslak eksiksiz düzenleniyor; gönderilmiş sürüm değiştirilemiyor.

- [ ] **22. PDF önizleme, gönderim ve revizyon geçmişi UI’ını taşı** — `high`
  - PDF önizleme, indir, e-posta gönder, WhatsApp bağlantısı kopyala, onaya
    gönder, onayla/reddet, revizyon oluştur ve kabul/red eylemleri olacak.
  - Gönderim hataları kullanıcıya anlaşılır gösterilecek.
  - Kabul: Her eylem sonrası liste ve detay durumu yenileniyor.

- [ ] **23. Müşteri ve satış siparişi ekranlarına teklif sekmesi ekle** — `high`
  - Müşteri detayında talepler ve teklif geçmişi; sipariş detayında kaynak
    teklif/revizyon bağlantısı gösterilecek.
  - Kabul: Kullanıcı müşteri → teklif → sipariş zincirinde gezinebiliyor.

- [ ] **24. Menü, roller ve görünürlükleri ekle** — `high`
  - Sidebar’da `Teklif Talepleri` ve `Teklifler` ayrı menüler olacak.
  - Görüntüleme, düzenleme, onay ve gönderim yetkileri ayrı kontrol edilecek.
  - Kabul: Yetkisiz kullanıcı route ve API seviyesinde erişemiyor.

## Faz 3B — CRM admin panel

- [ ] **51. CRM dashboard ekranını taşı** — `high`
  - KPI kartları, satış hunisi, geciken takipler, yaklaşan aktiviteler ve
    sorumlu bazlı özetler Paspas tasarım sistemine uyarlanacak.

- [ ] **52. Pipeline/Kanban ekranını taşı** — `critical`
  - Fırsatlar aşama sütunlarında gösterilecek ve sürükle-bırak ile taşınacak.
  - Geçersiz geçiş, kaybetme nedeni ve eşzamanlı güncelleme hataları güvenli
    şekilde ele alınacak.

- [ ] **53. Talep ve fırsat liste/detay ekranlarını taşı** — `critical`
  - Gelişmiş filtreler, sorumlu atama, müşteri eşleme, ürünler, teklif geçmişi,
    aktivite zaman çizelgesi ve dönüşüm eylemleri birlikte çalışacak.

- [ ] **54. Aktivite panosu ve takvimini taşı** — `high`
  - Bugün, geciken, yaklaşan ve tamamlanan aktiviteler liste/takvim görünümünde
    yönetilecek; müşteri/fırsat detayına hızlı geçiş sağlanacak.

- [ ] **55. CRM ayar ekranlarını taşı** — `high`
  - Pipeline/aşama, kaybetme nedenleri, bildirim tercihleri, otomasyonlar ve
    kaydedilmiş görünümler yönetilecek.

- [ ] **56. Müşteri detayına CRM sekmeleri ekle** — `critical`
  - Genel CRM özeti, talepler, fırsatlar, aktiviteler, teklifler, siparişler ve
    sevkiyatlar aynı müşteri ekranında ilişkilendirilecek.

- [ ] **57. CRM rapor ekranlarını taşı** — `normal`
  - Dönüşüm, bekleme, ekip/kaynak performansı, teklif kabulü, kayıplar, ürün
    satışı ve satış döngüsü raporları filtrelenebilir gösterilecek.

- [ ] **58. CRM admin E2E testlerini hazırla** — `critical`
  - Talep dönüşümü, Kanban aşama taşıma, aktivite planlama, fırsattan teklif,
    tekliften sipariş ve rol bazlı görünürlük uçtan uca doğrulanacak.

## Faz 4 — Promats frontend

- [ ] **25. Teklif formu veri sözleşmesini yenile** — `critical`
  - İletişim formundaki konu, ürün seçimi ve mesaj metne gömülmek yerine yapısal
    JSON alanlarıyla gönderilecek.
  - Dil, kaynak sayfa, ürün slug/ID, UTM ve KVKK onayı eklenecek.
  - Kabul: Backend alanları ayrıştırmadan doğrudan saklayabiliyor.

- [ ] **26. İletişim ve OEM teklif formlarını yeni endpoint’e bağla** — `critical`
  - `Teklif Talebi` seçilince teklif endpointi; diğer konularda iletişim
    endpointi kullanılacak.
  - OEM formunun şirket, ülke, web sitesi, ürün ilgisi ve miktar alanları ayrı
    alanlar olarak korunacak.
  - Kabul: Her iki formdan gelen kayıt admin teklif taleplerinde doğru görünüyor.

- [ ] **27. Ürün detayından teklif isteme akışını tamamla** — `high`
  - “Bu ürünle ilgileniyorum/Teklif al” CTA’sı iletişim formunu ilgili ürün
    seçili açacak.
  - Birden fazla ürün seçimi kompakt ve mobil uyumlu olacak.
  - Kabul: Ürün kimliği yalnız görünen ada bağlı kalmadan backend’e ulaşıyor.

- [ ] **28. Form UX, spam koruması ve analitiği tamamla** — `high`
  - Gönderim sırasında çift tıklama engeli, alan bazlı hata, başarılı kayıt
    referansı ve yeniden deneme davranışı eklenecek.
  - Rate-limit, honeypot ve gerekiyorsa captcha devreye alınacak.
  - `quote_request_submit/success/error` analitik olayları kişisel veri
    taşımadan üretilecek.

## Faz 5 — Test, veri ve canlıya geçiş

- [ ] **29. Backend birim ve entegrasyon testlerini taşı** — `critical`
  - Toplam/KDV/iskonto, durum geçişi, snapshot, numara yarışı, izinler,
    gönderim hatası, token ve sipariş dönüşümü test edilecek.

- [ ] **30. Admin ve frontend uçtan uca senaryosunu yaz** — `critical`
  - Web talebi → admin gelen kutusu → müşteri eşleme → taslak → PDF → gönderim
    → görüntülenme → kabul → sipariş akışı Playwright ile doğrulanacak.

- [ ] **31. Eski bildirim-only akışını geriye uyumlu geçir** — `high`
  - Yeni endpoint canlıya çıkmadan mevcut `/web/promats/contact`
    kaldırılmayacak.
  - Geçiş sonrasında genel iletişim çalışmaya devam edecek; teklif konusu yeni
    kayıt akışına yönlenecek.

- [ ] **32. Production migration, smoke test ve izleme yap** — `critical`
  - DB yedeği, migration, backend/admin/frontend deploy sırası ve rollback
    adımları hazırlanacak.
  - Gerçek bildirim üretmeyen işaretli UAT talebiyle uçtan uca doğrulanacak.
  - Hata oranı, kaydedilen talep, gönderilen teklif ve dönüşüm metrikleri
    izlenecek.

---

## Definition of Done

- [ ] Promats webden gönderilen teklif talebi veritabanında kalıcı.
- [ ] Talep admin panelde ayrı gelen kutusunda görünüyor.
- [ ] Talep mevcut/yeni müşteriye ve taslak teklife dönüştürülebiliyor.
- [ ] Teklif kalemleri, fiyatlar ve toplamlar backend tarafından hesaplanıyor.
- [ ] Gönderilmiş teklif ve eski revizyonlar değişmiyor.
- [ ] Promats markalı PDF üretilebiliyor ve gönderim sonucu kaydediliyor.
- [ ] Public görüntüleme güvenli tokenla çalışıyor ve görüntülenme izleniyor.
- [ ] Kabul edilen teklif satış siparişine bir kez dönüştürülebiliyor.
- [ ] Yetki, audit, bildirim, test ve production rollback kontrolleri tamam.
- [ ] Web talebi CRM talebi ve fırsatıyla ilişkilendirilebiliyor.
- [ ] Pipeline, Kanban, aktiviteler, hatırlatmalar ve CRM raporları çalışıyor.
- [ ] Fırsat → teklif → sipariş → üretim/sevkiyat zinciri çift yönlü izleniyor.
