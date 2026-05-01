# Admin Sayfa Dokumantasyonu

Bu dokuman admin paneldeki sayfalari kullanici, is akisi, risk ve test acisindan aciklamak icin hazirlanir. Her bolum, ilgili menude gorunen sayfayi esas alir.

## 1. Sistem & Ayarlar

Route: `/admin/sistem`

Menu grubu: Sistem Yonetimi

Yetki: Sadece `admin`

### Sayfanin Amaci

Sistem & Ayarlar sayfasi, admin panelin teknik ve yonetimsel ayarlarini tek ekranda toplar. Kullanici yonetimi, giris davranislari, site ayarlari, medya yonetimi, veritabani islemleri ve audit loglari bu sayfa altindaki sekmelerden yonetilir.

Bu sayfa gunluk ERP operasyonundan cok sistem yonetimi icindir. Yanlis yapilandirma, kullanici girisini, dosya yuklemeyi, testleri veya canli veritabani davranisini etkileyebilir.

### Ana Ekran Bolumleri

Sayfa ustunde baslik ve kisa aciklama bulunur:

- Baslik: Sistem & Ayarlar
- Aciklama: Kullanici, guvenlik, medya ve sistem yonetimi

Altinda sekmeli menu vardir:

- Kullanicilar
- Giris Ayarlari
- Site Ayarlari
- Medyalar
- Veritabani
- Audit Loglari

Sekme secimi URL query parametresiyle takip edilir. Ornek:

- `/admin/sistem?tab=kullanicilar`
- `/admin/sistem?tab=site-ayarlari`
- `/admin/sistem?tab=veritabani`

Query parametresi yoksa varsayilan sekme `kullanicilar` olur.

### Kullanicilar Sekmesi

Route: `/admin/sistem?tab=kullanicilar`

Bu sekme admin kullanicilarinin listelenmesi, detayina gidilmesi ve hesap durumlarinin takip edilmesi icindir. Kullanici yetkileri ve aktif/pasif durumlar ERP paneline giris davranisini dogrudan etkiler.

Dokumante edilecek ana konular:

- Kullanici listesi
- Kullanici arama ve filtreleme
- Kullanici detay sayfasina gecis
- Rol ve yetki iliskisi
- Aktif/pasif hesap etkisi

Risk notlari:

- Admin kullanicisinin pasife alinmasi sistem yonetimini kilitleyebilir.
- Yanlis rol atamasi kullanicinin yetkisiz sayfalara erismesine veya gerekli sayfalari gorememesine neden olabilir.

Manuel test adimlari:

1. `/admin/sistem?tab=kullanicilar` sayfasini ac.
2. Kullanici listesinin geldigini kontrol et.
3. Bir kullanici detayina gir.
4. Rol ve durum bilgisinin dogru gorundugunu kontrol et.
5. Yetkisiz rol ile admin-only sayfalara erisimin engellendigini dogrula.

### Giris Ayarlari Sekmesi

Route: `/admin/sistem?tab=giris-ayarlari`

Bu sekme ERP paneline giris davranislarini yonetir. Admin, sevkiyat, operator ve satin alma rolleri icin giris kartlari, sifre politikasi ve rol bazli yonlendirme ayarlari buradan duzenlenir.

Ana ekran bolumleri:

- Toplam giris kullanicisi
- Aktif hesap sayisi
- Pasif hesap sayisi
- Gecici login durumu
- Canli auth durumu
- ERP login tercihleri
- Rol bazli giris hesaplari
- Mevcut durum ve eksikler

Yonetilen alanlar:

- Hizli giris butonlarini goster
- Sifre ile girise izin ver
- Rol kartlarini goster
- Minimum sifre uzunlugu
- Buyuk harf zorunlulugu
- Rakam zorunlulugu
- Ozel karakter zorunlulugu
- Aktif rol kartlari
- Rol yonlendirme route'lari

Bagli moduller:

- Auth
- User / role
- Site settings
- Login UI

Risk notlari:

- `Sifre ile girise izin ver` kapatilirsa kullanicilar sadece alternatif giris akislariyla panele girebilir.
- Minimum sifre uzunlugu 6'nin altina dusurulemez; bu validation hatasi verir.
- Rol yonlendirme route'u yanlis girilirse kullanici login sonrasi bos veya yetkisiz sayfaya gidebilir.
- Rol kartinin kapatilmasi o role ait hizli giris deneyimini etkiler.

Manuel test adimlari:

1. `/admin/sistem?tab=giris-ayarlari` sayfasini ac.
2. Ozet kartlarinin veri getirdigini kontrol et.
3. Sifre politikasinda minimum uzunlugu 6'dan kucuk yapmayi dene; hata beklenir.
4. Gecerli bir sifre politikasi kaydet.
5. Sayfayi yenile ve kaydedilen degerlerin korundugunu kontrol et.
6. Login sayfasinda rol karti ve yonlendirme davranisini dogrula.

### Site Ayarlari Sekmesi

Route: `/admin/sistem?tab=site-ayarlari`

Bu sekme uygulamanin genel site ayarlarini, SEO metinlerini, SMTP ayarlarini, medya/marka ayarlarini, API entegrasyonlarini, dil ayarlarini ve branding ayarlarini yonetir.

Alt sekmeler:

- Liste
- Global Liste
- Genel Ayarlar
- SEO
- SMTP
- Cloudinary
- Marka Medya
- API
- Diller
- Branding

Site ayarlari, `site_settings` tablosundaki key-value yapisina dayanir. Lokalize ayarlar secili dile gore, global ayarlar ise `*` kapsaminda tutulur.

Onemli API ve entegrasyon alanlari:

- Google Client ID
- Google Client Secret
- GTM Container ID
- GA4 Measurement ID
- Cookie Consent
- AI default provider
- AI default model
- Anthropic API Key
- OpenAI API Key
- Groq API Key

Bagli moduller:

- Site settings backend
- Public site ayarlari
- Admin UI ayarlari
- Mail / SMTP
- Storage / Cloudinary
- LLM / AI helper

Risk notlari:

- SMTP degerleri yanlis girilirse sistem mail gonderemez.
- Cloudinary veya storage ayarlari yanlis girilirse medya yukleme ve gorsel gosterimi etkilenir.
- API anahtarlari gizli bilgidir; dokumantasyonda veya ekran goruntulerinde acik paylasilmamalidir.
- AI provider/model uyumsuzlugu Test Merkezi risk ozeti gibi ilerideki AI akislarini bozabilir.
- Global ayar ile lokalize ayar farki karistirilirsa beklenen dilde icerik gorunmeyebilir.

Manuel test adimlari:

1. `/admin/sistem?tab=site-ayarlari` sayfasini ac.
2. Genel Ayarlar sekmesinde secili dilin geldigini kontrol et.
3. Global sekmelerde locale alaninin global davrandigini kontrol et.
4. API sekmesinde AI alanlarinin gorundugunu kontrol et.
5. Bir test degeri kaydetmeden once mevcut degerleri not al.
6. Kaydetme sonrasi sayfayi yenile ve degerlerin korundugunu kontrol et.

### Medyalar Sekmesi

Route: `/admin/sistem?tab=medyalar`

Bu sekme yuklenen medya dosyalarinin yonetimi icindir. Depolama yapisina gore dosyalar local storage veya Cloudinary uzerinden servis edilebilir.

Dokumante edilecek ana konular:

- Medya listesi
- Dosya yukleme
- Dosya detaylari
- URL ve metadata kullanimi
- Silme davranisi

Risk notlari:

- Kullanilan bir medya dosyasinin silinmesi, urun veya marka gorsellerinde kirik gorsel olusturabilir.
- Storage ayarlari yanlissa yukleme basarili gorunse bile public URL calismayabilir.

Manuel test adimlari:

1. `/admin/sistem?tab=medyalar` sayfasini ac.
2. Medya listesinin geldigini kontrol et.
3. Kucuk bir test gorseli yukle.
4. Yuklenen dosyanin public URL ile acildigini kontrol et.
5. Test dosyasini sil ve listeden kalktigini dogrula.

### Veritabani Sekmesi

Route: `/admin/sistem?tab=veritabani`

Bu sekme veritabani bilgileri, full DB islemleri, import ve snapshot operasyonlari icindir. Canli veri uzerinde etkisi en yuksek bolumlerden biridir.

Ana ekran bolumleri:

- DB bilgi karti
- Full DB islemleri
- Full DB import paneli
- Snapshot paneli
- Son DB audit islemleri

Bagli moduller:

- DB admin
- Snapshot / restore
- Admin audit
- Test Merkezi snapshot secimi

Risk notlari:

- Full DB import canli veriyi degistirebilir.
- Snapshot restore islemi secili yedege geri doner; test sonrasi dogru snapshot secilmelidir.
- Yanlis dosya import edilirse veri kaybi veya uyumsuz sema riski olusabilir.

Manuel test adimlari:

1. `/admin/sistem?tab=veritabani` sayfasini ac.
2. DB bilgi kartinin yuklendigini kontrol et.
3. Snapshot listesinin geldigini kontrol et.
4. Yeni snapshot al.
5. Snapshot kaydinin listede gorundugunu dogrula.
6. Restore islemi sadece dogru snapshot secildiginde ve onayla calistirilmalidir.

### Audit Loglari Sekmesi

Route: `/admin/sistem?tab=audit-logs`

Bu sekme admin panelde yapilan istekleri ve sistem etkilerini izlemek icindir. Modul, method, status kodu, tarih ve arama filtreleri ile gecmis islemler incelenir.

Ana ekran bolumleri:

- Ozet kartlari
- Modul filtresi
- Method filtresi
- Status kodu filtresi
- Tarih araligi
- Audit log tablosu
- Secili log detay paneli

Bagli moduller:

- Admin audit repository
- Backend request logging
- ERP modul operasyonlari

Risk notlari:

- Audit loglari silme/duzenleme islemleri icin sorumluluk takibinde kullanilir.
- 4xx status kodlari kullanici veya validation hatalarini, 5xx status kodlari sistem hatalarini isaret eder.
- Silme islemleri audit uzerinden ozellikle takip edilmelidir.

Manuel test adimlari:

1. `/admin/sistem?tab=audit-logs` sayfasini ac.
2. Son kayitlarin listelendigini kontrol et.
3. Modul filtresi ile bir modul sec.
4. Method filtresi ile `POST`, `PUT` veya `DELETE` kayitlarini filtrele.
5. Bir log detayini ac ve params/query/body alanlarini kontrol et.

### Genel Riskler

- Bu sayfa sadece admin rolune acik kalmalidir.
- Ayar degisiklikleri canli sistem davranisini etkiledigi icin degisiklik oncesi mevcut degerler not edilmelidir.
- Veritabani ve API anahtari islemleri ekran goruntusu veya dokumanlarda secret sizdirma riski tasir.
- Test amacli yapilan ayarlar test bitince geri alinmalidir.

### Smoke Test Notlari

- Sayfa route'u: `/admin/sistem`
- Varsayilan tab: `kullanicilar`
- Gecerli tab query degerleri:
  - `kullanicilar`
  - `giris-ayarlari`
  - `site-ayarlari`
  - `medyalar`
  - `veritabani`
  - `audit-logs`

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/sistem` sayfasini ac.
3. Her sekmeye tek tek tikla.
4. Her sekmede veri yukleme, bos durum veya hata mesajinin kontrollu gorundugunu dogrula.
5. Tarayici console'unda render hatasi olmadigini kontrol et.
6. Yetkisiz rol ile `/admin/sistem` erisiminin engellendigini dogrula.

## 2. Test Merkezi

Route: `/admin/test-merkezi`

Menu grubu: Sistem Yonetimi

Yetki: Sadece `admin`

Backend prefix: `/admin/test-center`

### Sayfanin Amaci

Test Merkezi, ERP icin hazirlanan smoke, entegrasyon ve canli DB testlerinin tek ekrandan takip edilmesini saglar. Sayfa test checklistini listeler, otomasyon komutlarini calistirir, test sonucunu gecmise kaydeder ve test oncesi/sonrasi veritabani snapshot akisini destekler.

Bu sayfa ozellikle gelistirme, kabul testi ve canli veri uzerinde kontrollu dogrulama icin kullanilir. Testlerin bazilari DB entegrasyon modunda calistiginda canli veritabaninda test verisi olusturabilir; bu nedenle snapshot akisi kritik kabul edilir.

### Ana Ekran Bolumleri

Sayfa ustunde uc ana aksiyon vardir:

- Tum Testleri Baslat
- Yedek Al
- Yedekten Geri Yukle

Sayfa icerigi dort ana karttan olusur:

- Canli DB Guvenligi
- Test Checklist Tablosu
- Manuel Sonuc Notu
- Sonuc Gecmisi

### Canli DB Guvenligi

Bu bolum testten once snapshot secmek veya yeni snapshot almak icindir. Testlerin canli veriyi bozma veya test verisi birakma ihtimaline karsi kullanilir.

Alanlar:

- Snapshot secimi
- Secili snapshot ID bilgisi

Aksiyonlar:

- `Yedek Al`: Test oncesi yeni DB snapshot olusturur ve secili snapshot olarak isaretler.
- `Yedekten Geri Yukle`: Secili snapshot'i canli veritabanina geri yukler.

Risk notlari:

- Snapshot secmeden restore yapilamaz.
- Restore islemi canli veriyi secilen snapshot durumuna dondurur.
- Yanlis snapshot secilirse testten onceki dogru veri yerine eski veya ilgisiz bir yedege donulebilir.
- Testten once alinan snapshot ID'si test sonucuyla birlikte kaydedilmelidir.

Manuel test adimlari:

1. `/admin/test-merkezi` sayfasini ac.
2. Snapshot listesinin geldigini kontrol et.
3. `Yedek Al` butonuna bas.
4. Yeni snapshot'in secili hale geldigini kontrol et.
5. Restore islemini sadece test amacli ve dogru snapshot seciliyken onayla.

### Test Checklist Tablosu

Bu tablo hazirlanan test senaryolarini listeler. Her satir test basligi, kategori, otomasyon komutu, son durum ve hizli sonuc aksiyonlarini gosterir.

Kolonlar:

- Test
- Kategori
- Komut
- Son Durum
- Islem

Durumlar:

- `Geçti`: Son kayit basarili.
- `Hatalı`: Son kayit basarisiz.
- `Beklenen hata`: Bilinen/izlenen hata olarak isaretli.
- `Atlandı`: Test calistirilmadi veya bilincli atlandi.
- `Çalışmadı`: Komut yok veya test otomasyona baglanmadi.

Hizli aksiyonlar:

- `Geçti`: Secili test icin manuel basarili sonuc kaydi olusturur.
- `Hatalı`: Secili test icin manuel hatali sonuc kaydi olusturur.

Bagli backend endpointleri:

- `GET /admin/test-center/cases`
- `POST /admin/test-center/cases`
- `PATCH /admin/test-center/cases/:id`

Risk notlari:

- Hizli `Geçti` / `Hatalı` aksiyonu otomasyonu calistirmaz; sadece manuel sonuc kaydi olusturur.
- Komut alani allowlist kontrolunden gecmezse otomatik calisma reddedilir.
- Test kategorisi entegrasyon veya real DB ise `RUN_DB_INTEGRATION=1` ile DB etkisi olusabilir.

### Tum Testleri Baslat Akisi

`Tum Testleri Baslat`, aktif checklist testlerini backend uzerinden sira ile calistirir. Islem oncesi kullanicidan onay alinir.

Calisma davranisi:

- Sadece aktif test case'leri calisir.
- Komutu olmayan veya `todo` durumundaki testler `not_run` olarak kaydedilir.
- `bun test ...` komutlari allowlist ile sinirlandirilir.
- DB entegrasyon testleri icin kategori ve komut yapisina gore `RUN_DB_INTEGRATION=1` eklenebilir.
- Cikti 8000 karaktere kadar sonuc kaydina yazilir.
- Pass/fail/skip/expect sayilari test ciktisindan ayrisir.

Bagli backend endpoint:

- `POST /admin/test-center/run-all`

Risk notlari:

- Tum testler uzun sure calisabilir.
- DB entegrasyon testleri canli veritabaninda test verisi olusturabilir.
- Test calisirken backend process ve DB baglantisi yuk altina girebilir.
- Hata durumunda log gecmise yazilir; ham log ekranda direkt dagitilmaz, detay bolumunde acilir.

Manuel test adimlari:

1. Test oncesi snapshot al.
2. Snapshot ID'nin secili oldugunu kontrol et.
3. `Tum Testleri Baslat` butonuna bas.
4. Onay mesajini oku ve onayla.
5. Toast sonucunu kontrol et.
6. Sonuc Gecmisi bolumunde yeni kayitlarin olustugunu dogrula.
7. Hata varsa `Detay logu göster` ile logu ac.
8. Test bittikten sonra gerekli ise snapshot restore yap.

### Manuel Sonuc Notu

Bu bolum otomasyon disi test veya harici gozlem sonucunu kaydetmek icindir.

Alanlar:

- Test secimi
- Durum secimi
- Test ciktisi veya kisa not
- Risk notu

Kaydedilen bilgiler:

- Test case ID
- Baslik
- Komut
- Durum
- Output excerpt
- Risk notu
- Snapshot ID
- Bitis zamani

Kullanim ornegi:

1. Bir test senaryosu manuel olarak uygulanir.
2. Sonuc `Geçti`, `Hatalı`, `Beklenen hata`, `Atlandı` veya `Çalışmadı` olarak secilir.
3. Test ciktisi veya gozlem notu yazilir.
4. Risk notu varsa eklenir.
5. `Sonucu Kaydet` ile gecmise yazilir.

Risk notlari:

- Manuel not otomatik test kaniti yerine gecmez; sadece takip kaydidir.
- Risk notu net yazilmazsa sonraki cozum sureci zorlasir.
- Snapshot secili degilse hangi DB durumunda test yapildigi belirsiz kalabilir.

### Sonuc Gecmisi

Bu bolum son test kayitlarini kart yapisinda listeler. Ham loglar tabloyu bozmaz; ozet, metrik ve acilir detay olarak gosterilir.

Gorunen bilgiler:

- Durum rozeti
- Tarih
- Snapshot ID
- Test basligi
- Komut
- Pass/fail/skip/expect sayilari
- Kisa ozet satiri
- Detay logu

Ozet mantigi:

- Hata satiri varsa oncelikli gosterilir.
- Hata yoksa pass/fail/skip/expect gibi test ozeti aranir.
- Hicbiri yoksa ilk anlamli satir gosterilir.
- Ham log `Detay logu göster` bolumunde acilir.

Bagli backend endpointleri:

- `GET /admin/test-center/runs`
- `POST /admin/test-center/runs`

Risk notlari:

- Uzun loglar sadece son 8000 karakter olarak saklanabilir; cok eski hata baglami kesilebilir.
- Gecmis kayitlari testin anlik sonucunu gosterir; kod sonradan degistiyse yeniden test calistirilmelidir.
- Snapshot ID olmadan kaydedilen sonuc DB durumunu tam ispatlamaz.

### AI Destekli Risk Notu Akisi

AI entegrasyonu icin API anahtarlari `Sistem & Ayarlar > Site Ayarlari > API ve Entegrasyonlar` bolumunde tutulur.

Ilgili alanlar:

- `ai_default_provider`
- `ai_default_model`
- `anthropic_api_key`
- `openai_api_key`
- `groq_api_key`

Planlanan kullanim:

- Hatali test logu AI tarafindan ozetlenebilir.
- Risk notu icin cozum onerisi uretilebilir.
- Claude AI veya secili LLM provider, ham logdan teknik aksiyon maddesi cikarmak icin kullanilabilir.

Risk notlari:

- API anahtarlari dokumantasyonda acik yazilmamalidir.
- AI ciktisi karar destegidir; test sonucunun yerine gecmez.
- AI onerisi uygulanmadan once kod ve veri etkisi manuel incelenmelidir.

### Genel Riskler

- Canli DB testleri mutlaka snapshot disipliniyle calistirilmalidir.
- Tum testleri baslatma aksiyonu sadece admin tarafindan ve uygun zamanda yapilmalidir.
- Allowlist disi komutlar calismamalidir; bu guvenlik sinirinin korunmasi gerekir.
- Test gecmisi silinmeden once ilgili hata/risk notlari dokumante edilmelidir.
- Hata cikarsa once log, sonra DB etkisi, sonra risk notu kayda gecirilmelidir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/test-merkezi` sayfasini ac.
3. Checklist tablosunun geldigini kontrol et.
4. Snapshot listesinin geldigini kontrol et.
5. Bir test satirinda `Geçti` ile manuel sonuc kaydi olustur.
6. Sonuc Gecmisi bolumunde yeni kaydin gorundugunu kontrol et.
7. Manuel Sonuc Notu bolumunden kisa notlu bir kayit ekle.
8. Log detayi olan kayitta `Detay logu göster` bolumunu ac.
9. Yetkisiz rol ile sayfa erisiminin engellendigini dogrula.

Otomasyon smoke:

```bash
bun test src/modules/test_center
```

DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/test_center/__tests__/temizlik_geri_donus.real.integration.test.ts
```

## 3. Urunler

Route: `/admin/urunler`

Menu grubu: Genel

Ana amac:

Urunler sayfasi ERP icindeki urun ana verisini yonetir. Nihai urun, yarimamul, operasyonel yarimamul ve hammadde kayitlari bu sayfadan takip edilir. Bu kayitlar recete, stok, uretim, siparis, satin alma ve sevkiyat akislarini dogrudan etkiler.

### Sayfa Bolumleri

Ust aksiyon alani:

- Sayfa basligi
- Kategori yonetimi kisayolu
- Liste yenileme butonu
- Yeni urun olusturma butonu

Kategori hizli filtreleri:

- Urunler
- Yarimamuller
- Operasyonel YM
- Hammaddeler
- Tumu

Filtre alani:

- Arama metni
- Kategori
- Tedarik tipi
- Urun grubu
- Filtre sifirlama

Tablo alani:

- Kod
- Gorsel
- Ad
- Kategori
- Tedarik tipi
- Birim
- Stok
- Kritik stok
- Birim fiyat
- Durum
- Aksiyonlar

Satir detay alani:

- Urune ait recete bilgisi
- Recete kalemleri
- Miktar, fire ve birim maliyet alanlari
- Hesaplanan toplam maliyet

### Urun Formu

Form yan panel olarak acilir. Yeni kayit ve duzenleme ayni form yapisini kullanir.

Form sekmeleri:

- Bilgiler
- Operasyonlar
- Recete
- Medya

Temel alanlar:

- Kategori
- Tedarik tipi
- Urun grubu
- Kod
- Ad
- Aciklama
- Birim
- Renk
- Stok
- Kritik stok
- Stok takip aktifligi
- Birim fiyat
- KDV orani
- Operasyon tipi
- Aktiflik durumu
- Birim donusumleri

Zorunlu alanlar:

- Kod
- Ad
- Birim

Validasyon kurallari:

- Birim fiyat negatif olamaz.
- Stok ve kritik stok negatif olamaz.
- KDV orani 0 ile 100 arasinda olmalidir.
- Urun grubu secilen kategoriye uygun olmalidir.
- Recete malzemesi gecerli bir urun olmalidir.
- Urun kendi recetesinde malzeme olarak kullanilmamalidir.

### Otomatik Davranislar

Kod uretimi:

- Yeni kayitta kategoriye gore siradaki urun kodu istenir.
- Kod alani bos ise veya otomatik kod desenindeyse sistem yeni kodu doldurur.

Kategori davranisi:

- Kategori secimi varsayilan tedarik tipini belirleyebilir.
- Kategori secimi varsayilan operasyon tipini belirleyebilir.
- Kategori alt grup desteklemiyorsa urun grubu temizlenir.
- Secili urun grubu artik gecerli degilse form bu alani sifirlar.

Operasyon davranisi:

- Uretim alanlari aktif olan kategorilerde operasyon sekmesi gorunur.
- Cift tarafli operasyon tipinde sag ve sol operasyonlar olusur.
- Tek tarafli operasyon tipinde tek operasyon yapisi kullanilir.
- Operasyon desteklemeyen kategoride operasyon kaydi kabul edilmez.

Recete davranisi:

- Recete destekleyen urunlerde recete sekmesi gorunur.
- Yeni urun olusturulduktan sonra taslak recete kalemleri kaydedilir.
- Recete beklenen bir urun recetesiz olusturulursa admin uyarilir.

Medya davranisi:

- Urun gorselleri listede kucuk onizleme olarak gorunur.
- Gorsel tiklaninca buyuk onizleme acilir.
- PDF medya dosyalari yeni sekmede acilir.
- Yeni urun olusturulduktan sonra taslak medya kayitlari urune baglanir.

### Otomatik Operasyonel YM Formu

Sayfada ayrica ana urun ile baglantili operasyonel yarimamul kayitlarini birlikte olusturan genis form akisi bulunur.

Kullanim amaci:

- Ana urun kaydini olusturmak
- Operasyon tipine gore operasyonel YM kayitlarini otomatik hazirlamak
- Ana urun ve operasyonel YM recete baglantilarini birlikte kurmak

Onemli alanlar:

- Kod
- Ad
- Operasyon tipi
- Birim
- Renk
- Birim fiyat
- Kritik stok
- Stok takip aktifligi
- Hazirlik suresi
- Cevrim suresi
- Yarimamul hammaddeleri
- Asil urun malzemeleri

Cift tarafli yapida sag ve sol operasyonel YM onizlemesi uretilir. Tek tarafli yapida parca bazli onizleme kullanilir.

### Backend Etkileri

Ilgili islemler:

- Urun listeleme
- Urun detay getirme
- Siradaki kodu getirme
- Urun olusturma
- Urun guncelleme
- Urun silme
- Recete olusturma ve guncelleme
- Operasyon bilgisi kaydetme
- Birim donusumu kaydetme
- Medya baglantisi kaydetme

Silme guvenligi:

Urun silinmeden once bagimlilik kontrolu yapilir. Siparis, uretim emri, sevk emri, sevkiyat, mal kabul, satin alma veya baska bir recete ile baglantisi olan urun silinmemelidir. Liste satirinda silinebilirlik bilgisi aksiyon davranisini belirler.

### Bilinen Hata Anahtarlari

- `urun_kodu_zaten_var`
- `gecersiz_urun_grubu`
- `gecersiz_recete_malzeme`
- `urun_kategorisi_operasyon_desteklemiyor`
- `urun_kategorisi_recete_desteklemiyor`
- `urun_bagimliligi_var`

### Genel Riskler

- Yanlis kategori secimi recete, operasyon ve stok akisini bozabilir.
- Yanlis tedarik tipi satin alma veya uretim planlamasini etkileyebilir.
- Recete malzemesi hatali secilirse maliyet ve uretim emri yanlis olusabilir.
- Stok takip aktifligi kapatilan urunlerde stok planlama eksik kalabilir.
- Birim fiyat veya KDV hatasi maliyet ve satis gorunumlerini etkileyebilir.
- Bagimli urun silinirse gecmis siparis, uretim veya satin alma kayitlari bozulabilir; bu nedenle silme blokaji korunmalidir.
- Gorsel veya PDF medya baglantilari bozuksa admin urun bilgisini eksik yorumlayabilir.
- Otomatik operasyonel YM olusturma akisi yanlis kullanilirsa gereksiz yari mamul ve recete kayitlari olusabilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/urunler` sayfasini ac.
3. Kategori hizli filtrelerinden her birini dene.
4. Arama ve urun grubu filtresinin listeyi daralttigini kontrol et.
5. Bir urun satirini genislet ve recete detayinin acildigini kontrol et.
6. Yeni hammadde kaydi olustur.
7. Yeni uretim urunu olustur ve operasyon sekmesinin dogru gorundugunu kontrol et.
8. Recete destekleyen urune recete kalemi ekle.
9. Urun gorseli ekle ve listede onizlemenin acildigini kontrol et.
10. Var olan urunu duzenle ve degisikligin listede gorundugunu kontrol et.
11. Ayni kodla yeni urun olusturmayi dene ve hata mesajini dogrula.
12. Siparis, uretim veya recete baglantisi olan urunu silmeyi dene ve silme blokajini dogrula.

Otomasyon smoke:

```bash
bun test src/modules/urunler
```

DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/urunler/__tests__/urunler.real.integration.test.ts
```

Operasyonel YM smoke:

```bash
bun test src/modules/urunler/__tests__/operasyonel_ym.smoke.test.ts
```

## 4. Satis Siparisleri

Route: `/admin/satis-siparisleri`

Detay route: `/admin/satis-siparisleri/[id]`

Menu grubu: Uretim Surecleri

Ana amac:

Satis Siparisleri sayfasi musteri siparislerinin olusturuldugu, takip edildigi ve uretime aktarildigi ana ekrandir. Siparis kalemleri uretim emirleri, sevkiyat, stok yeterliligi ve dashboard termin riskleri icin kaynak veri olusturur.

### Sayfa Sekmeleri

Ana sayfada iki sekme bulunur:

- Siparis Girisleri
- Siparis Islemleri

Siparis Girisleri sekmesi siparis kaydi olusturma, listeleme, duzenleme, silme ve detay goruntuleme icindir.

Siparis Islemleri sekmesi siparis kalemlerini uretime aktarmak, uretim durumlarini takip etmek ve kalemleri musteri veya urun bazli gruplayarak incelemek icindir.

### Siparis Girisleri

Ust aksiyon alani:

- Sayfa basligi
- Toplam kayit bilgisi
- Yenileme butonu
- Yeni siparis butonu

Ozet kartlari:

- Toplam siparis
- Termin riski

Termin riski, tamamlanmamis ve iptal edilmemis siparislerde termin tarihine 3 gun veya daha az kalmasina gore hesaplanir.

Filtreler:

- Arama metni
- Durum
- Tamamlananlari goster anahtari

Durum secenekleri:

- Hepsi
- Taslak
- Planlandi
- Onaylandi
- Uretimde
- Kismen sevk
- Tamamlandi
- Kapali
- Iptal

Liste kolonlari:

- Siparis no
- Musteri
- Siparis tarihi
- Termin tarihi
- Genel toplam
- Durum
- Aksiyonlar

Aksiyonlar:

- Detay sayfasina git
- Siparisi duzenle
- Siparisi sil

Kilitli siparislerde silme butonu pasif olur. Backend de kilitli siparis icin guncelleme ve silme islemlerini engeller.

### Siparis Formu

Form yan panel olarak acilir. Yeni kayit ve duzenleme ayni formu kullanir.

Temel alanlar:

- Siparis no
- Musteri
- Siparis tarihi
- Termin tarihi
- Durum
- Siparis kalemleri
- Ekstra indirim orani
- Aciklama

Zorunlu alanlar:

- Siparis no
- Musteri
- Siparis tarihi
- En az bir siparis kalemi

Kalem alanlari:

- Urun
- Miktar
- Birim fiyat
- Sira

Validasyon kurallari:

- Urun secilmelidir.
- Miktar pozitif olmalidir.
- Birim fiyat negatif olamaz.
- Ekstra indirim orani 0 ile 100 arasinda olmalidir.
- En az bir kalem bulunmalidir.

Otomatik davranislar:

- Yeni sipariste siparis no `SS-YIL-0001` formatina gore otomatik istenir.
- Yeni sipariste siparis tarihi bugunun tarihi olarak doldurulur.
- Musteri secildiginde musteri iskonto orani toplam hesabina dahil edilir.
- Urun secildiginde urunun baz birim fiyati kaleme aktarilir.
- KDV, urun KDV orani ile indirim uygulanmis satir neti uzerinden hesaplanir.
- Maliyet toplaminda sirali indirim uygulanir: once musteri iskonto orani, sonra ekstra indirim orani.

Kilit davranisi:

- Durumu `tamamlandi` olan siparis duzenlenemez.
- Uretime aktarilmis kalemleri olan siparisin kalemleri degistirilemez.
- Uretime aktarilmis siparis iptal edilemez; once ilgili uretim emirleri kaldirilmalidir.
- Uretim veya sevkiyat sureci baslamis siparis silinemez.

Manuel durum davranisi:

- Formda manuel olarak sadece `kapali` ve `iptal` durumlari secilebilir.
- Diger durumlar uretim ve sevkiyat akislarindan turetilir.

### Siparis Detay Sayfasi

Detay sayfasi siparisin okunabilir ozetini ve kalemlerini gosterir.

Ust alan:

- Geri don butonu
- Siparis no
- Siparis tarihi
- Siparis durumu
- Yenileme butonu
- Duzenle butonu

Ozet kartlari:

- Musteri
- Termin tarihi
- Genel toplam

Kalem tablosu:

- Sira
- Urun
- Miktar
- Birim fiyat
- Satir toplam

Dip toplamlar:

- Ara toplam
- Iskonto
- KDV
- Genel toplam

Detay sayfasinda KDV satir bazinda gosterilmez; sadece dip toplamda hesaplanir. Satir toplamlari KDV harictir.

### Siparis Islemleri Sekmesi

Bu sekme siparis kalemlerinin uretime aktarilmasi icin kullanilir.

Filtre ve gorunumler:

- Siparis, musteri veya urun arama
- Duz liste
- Musteri bazli gruplama
- Urun bazli gruplama
- Uretim durumu filtresi
- Tamamlananlari gizle anahtari

Tablo kolonlari:

- Secim kutusu
- Siparis no
- Musteri
- Urun
- Miktar
- Uretilen miktar
- Uretim durumu
- Sevk edilen miktar
- Planlanan bitis

Secim davranisi:

- Sadece `beklemede` durumundaki kalemler secilebilir.
- Birden fazla kalem secildiginde `Uretime Aktar` aksiyonu acilir.
- Ayni urune ait birden fazla kalem secilirse ekranda birlestirme secenegi gosterilir.

Uretime aktarma davranisi:

- Secili kalemler backend uzerinden uretim emrine donusturulur.
- Backend sadece `beklemede` kalemleri aktarir, digerlerini atlar.
- Yeni mimaride siparis kalemi icin asıl urun recetesinden yari mamul uretim emirleri turetilir.
- Recete veya yari mamul baglantisi eksikse fallback olarak asil urun icin tek uretim emri olusturulur.
- Aktarim sonrasi satis siparisi listesi, siparis islemleri ve uretim emirleri cache kayitlari yenilenir.

### Backend Etkileri

Ilgili islemler:

- Siparis listeleme
- Siparis detay getirme
- Siradaki siparis no getirme
- Siparis olusturma
- Siparis guncelleme
- Siparis silme
- Siparis islemleri listeleme
- Siparis kalemlerini uretime aktarma

Ilgili endpointler:

- `GET /admin/satis-siparisleri`
- `GET /admin/satis-siparisleri/:id`
- `GET /admin/satis-siparisleri/next-no`
- `POST /admin/satis-siparisleri`
- `PATCH /admin/satis-siparisleri/:id`
- `DELETE /admin/satis-siparisleri/:id`
- `GET /admin/satis-siparisleri/islemler`
- `POST /admin/satis-siparisleri/islemler/uretime-aktar`

### Bilinen Hata Anahtarlari

- `gecersiz_sorgu_parametreleri`
- `gecersiz_istek_govdesi`
- `satis_siparisi_bulunamadi`
- `siparis_no_zaten_var`
- `siparis_kilitli`
- `gecersiz_body`
- `kalem_zaten_uretimde`
- `sunucu_hatasi`

### Genel Riskler

- Yanlis musteri secimi iskonto, termin ve sevkiyat planini etkileyebilir.
- Yanlis urun veya miktar girisi uretim emri ve stok yeterlilik kontrollerini bozar.
- Birim fiyat veya KDV orani hatasi siparis genel toplamini yanlis gosterir.
- Uretime aktarilmis sipariste kalem degisikligi engeli korunmazsa uretim emri ile siparis kalemi uyumsuz hale gelir.
- Siparis iptali uretim basladiktan sonra serbest kalirsa planlama, stok ve sevkiyat kayitlari tutarsizlasir.
- Siparis islemleri sekmesindeki fallback uretim emri, recete eksigini gizleyebilir; bu durum risk notu olarak takip edilmelidir.
- Tamamlananlari goster/gizle filtresi yanlis kullanilirsa eski kapali siparisler operasyonel listede kaybolmus gibi yorumlanabilir.
- Termin riski sadece listelenen kayitlar uzerinden hesaplandigi icin filtre aktifken genel is yukunu temsil etmeyebilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/satis-siparisleri` sayfasini ac.
3. Siparis Girisleri sekmesinde liste ve ozet kartlarin geldigini kontrol et.
4. Durum filtresi ve arama filtresini dene.
5. Yeni siparis olustur; musteri, urun, miktar ve fiyat gir.
6. Musteri iskonto, ekstra iskonto, KDV ve genel toplam hesaplarini kontrol et.
7. Olusan siparisin detay sayfasina git.
8. Detay sayfasinda kalemler ve dip toplamlarin formdaki toplamla uyumlu oldugunu kontrol et.
9. Siparisi duzenle ve aciklama veya termin tarihini degistir.
10. Ayni siparis no ile yeni kayit olusturmayi dene ve hata mesajini dogrula.
11. Siparis Islemleri sekmesine gec.
12. Beklemede olan bir kalemi secip uretime aktar.
13. Kalem uretime aktarildiktan sonra yeniden secilemedigini kontrol et.
14. Uretime aktarilmis siparisi silmeyi veya iptal etmeyi dene ve kilit davranisini dogrula.

Otomasyon smoke:

```bash
bun test src/modules/satis_siparisleri
```

DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/satis_siparisleri/__tests__/satis_siparisleri.real.integration.test.ts
```

Siparisten uretime aktarim smoke:

```bash
bun test src/modules/uretim_emirleri/__tests__/siparisten_uretime.smoke.test.ts
```

## 5. Uretim Emirleri

Route: `/admin/uretim-emirleri`

Detay route: `/admin/uretim-emirleri/[id]`

Menu grubu: Uretim Surecleri

Ana amac:

Uretim Emirleri sayfasi siparislerden veya manuel stok uretimi ihtiyacindan uretim emri olusturmak, emirlerin makine atamasini takip etmek, malzeme yeterliligini kontrol etmek ve uretim ilerlemesini izlemek icin kullanilir. Bu sayfa satis siparisleri, receteler, stok, makine kuyrugu, operator kayitlari ve sevkiyat surecleriyle baglantilidir.

### Liste Sayfasi

Ust aksiyon alani:

- Sayfa basligi
- Toplam uretim emri sayisi
- Yenileme butonu
- Yeni uretim emri butonu

Ozet kartlari:

- Toplam
- Aktif
- Termin riskli
- Tamamlanan

Filtreler:

- Arama metni
- Durum
- Siralama
- Tamamlananlari goster/gizle
- Filtre sifirlama

Durum secenekleri:

- Hepsi
- Atanmamis
- Planlandi
- Uretimde
- Tamamlandi
- Iptal

Siralama secenekleri:

- Olusturulma tarihi
- Bitis tarihi
- Baslangic tarihi
- Emir no

Tablo kolonlari:

- Emir no ve durum
- Urun
- Musteri
- Planlanan bitis
- Planlanan miktar
- Ilerleme
- Malzeme yeterliligi
- Makine
- Aksiyonlar

Satir aksiyonlari:

- Recete detayini ac
- Detay sayfasina git
- Duzenle
- Sil
- Makine ata
- Makineden cikar

Termin riski olan ve tamamlanmamis emirler listede vurgulanir.

### Malzeme Yeterliligi

Liste satirinda recetesi olan emirler icin malzeme yeterlilik rozeti gosterilir.

Gorunumler:

- Yeterli
- Eksik kalem sayisi
- Recete yoksa bos deger

Eksik malzeme rozeti uzerinde gerekli miktar, mevcut stok ve eksik miktar bilgisi tooltip olarak gosterilir.

### Makine Atama ve Kuyruktan Cikarma

Makine atanmamis emirde `Makine Ata` aksiyonu acilir.

Makineye atanmis emirde:

- Makine adlari gosterilir.
- `Makineden Cikar` aksiyonu gorunur.

Makineden cikarma kurallari:

- Sadece kuyrukta `bekliyor` durumundaki operasyonlar cikarilabilir.
- `calisiyor` veya `duraklatildi` durumundaki operasyonlar cikarilamaz.
- Emir icin cikarilabilir operasyon yoksa islem hata ile durur.

### Uretim Emri Formu

Form yan panel olarak acilir. Yeni kayit ve duzenleme ayni form yapisini kullanir.

Kaynak tipleri:

- Siparise dayali uretim
- Manuel stok uretimi

Temel alanlar:

- Emir no
- Kaynak tipi
- Siparis adaylari
- Urun
- Planlanan miktar
- Termin tarihi
- Musteri ozet bilgisi
- Musteri detay bilgisi

Zorunlu alanlar:

- Emir no
- Urun
- Planlanan miktar

Validasyon kurallari:

- Emir no bos olamaz.
- Urun secilmelidir.
- Planlanan miktar 0'dan buyuk olmalidir.
- Siparis adaylari seciliyken secilen kalemlerin urunu ayni olmalidir.

Otomatik davranislar:

- Yeni kayitta siradaki emir no otomatik istenir.
- Siparis adaylari urune gore gruplanir.
- Siparis kalemi secilince urun, toplam miktar, en erken termin ve musteri ozet bilgisi otomatik doldurulur.
- Farkli urune ait siparis kalemi secilirse onceki secim temizlenir.
- Manuel uretimde urun ve miktar admin tarafindan girilir.
- Secili urunde recete yoksa form uyarisi gosterilir.
- Uretim emri olusturulduktan sonra hammadde yetersizlik uyarilari toast olarak gosterilir.

### Siparis Adaylari

Siparis adaylari, uretime aktarilmamis siparis kalemlerinden gelir.

Gosterilen bilgiler:

- Urun adi ve kodu
- Recete durumu
- Musteri
- Siparis no
- Miktar
- Termin tarihi

Secim ozeti:

- Secili kalem sayisi
- Toplam miktar
- En erken termin
- Musteri bazli miktar detayi

### Detay Sayfasi

Detay sayfasi uretim emrinin plan, makine, malzeme ve gerceklesen uretim bilgilerini gosterir.

Ust alan:

- Listeye don butonu
- Urun adi
- Emir no
- Durum
- Yenileme
- Duzenle

Ozet alanlari:

- Emir no
- Urun
- Operasyonel YM bilgisi
- Durum
- Ilerleme yuzdesi

Detay karti:

- Musteri
- Siparis no
- Planlanan miktar
- Uretilen miktar
- Baslangic tarihi
- Termin tarihi
- Planlanan bitis
- Olusturulma zamani

Montaj bekliyor uyarisi:

Durum `montaj_bekliyor` ise yari mamul uretiminin tamamlandigi, fakat montaj icin karsi yari mamul veya ambalaj malzemesi beklenebilecegi aciklanir.

### Detay Sayfasi Makine Kuyrugu

Makine Kuyrugu bolumu emre atanmis makine is yuklerini gosterir.

Kolonlar:

- Sira
- Makine
- Planlanan sure
- Durum

Atanmis makine yoksa bos durum mesaji gosterilir.

### Detay Sayfasi Malzeme Yeterliligi

Recetesi olan emirlerde malzeme yeterliligi detayli gosterilir.

Ozet bilgiler:

- Malzeme sayisi
- Eksik kalem sayisi
- Toplam gerekli miktar
- Toplam stok
- Rezerve stok
- Serbest stok

Tablo kolonlari:

- Malzeme
- Gerekli miktar
- Stok
- Rezerve
- Serbest
- Eksik
- Durum

Durumlar:

- Yeterli
- Tedarik gerekli

### Uretim Karsilastirma

Emir `uretimde` veya `tamamlandi` durumundayken vardiya/operator kayitlarindan uretim karsilastirma bilgisi getirilir.

Gosterilen bilgiler:

- Planlanan miktar
- Toplam uretilen
- Fire
- Net fark

Net fark negatifse eksik uretim uyarisi gosterilir.

### Backend Etkileri

Ilgili islemler:

- Uretim emri listeleme
- Uretim emri detay getirme
- Uretim emri adaylari listeleme
- Siradaki emir no getirme
- Uretim emri olusturma
- Uretim emri guncelleme
- Uretim emri silme
- Hammadde kontrolu
- Hammadde yeterlilik kontrolu
- Uretim karsilastirma
- Makine kuyrugu atama ve kuyruktan cikarma

Ilgili endpointler:

- `GET /admin/uretim-emirleri`
- `GET /admin/uretim-emirleri/:id`
- `GET /admin/uretim-emirleri/adaylar`
- `GET /admin/uretim-emirleri/next-no`
- `POST /admin/uretim-emirleri`
- `PATCH /admin/uretim-emirleri/:id`
- `DELETE /admin/uretim-emirleri/:id`
- `GET /admin/uretim-emirleri/:id/hammadde-kontrol`
- `GET /admin/uretim-emirleri/:id/hammadde-yeterlilik`
- `GET /admin/uretim-emirleri/:id/uretim-karsilastirma`

### Bilinen Hata Anahtarlari

- `uretim_emri_bulunamadi`
- `gecersiz_istek_govdesi`
- `gecersiz_sorgu_parametreleri`
- `uretim_emri_tamamlandi`
- `uretim_emri_silinemez`
- `sunucu_hatasi`

### Silinebilirlik Kurallari

Uretim emri silinmeden once bagimlilik ve durum kontrolu yapilir.

Silinmeyi engelleyen durumlar:

- Operator kaydi bulunmasi
- Operasyonun baslamis olmasi
- Makine plani veya kuyruk baglantisi bulunmasi
- Durum kilidi olusmasi

Silinemeyen emirde liste satirindaki silme butonu pasif olur ve sebep tooltip olarak gosterilir.

### Genel Riskler

- Recetesiz urun icin uretim emri acilmasi hammadde planlamasini eksik birakir.
- Siparis adaylari farkli urunlerden birlestirilirse uretim miktari ve musteri baglantisi bozulur; form bunu engellemelidir.
- Hammadde yetersizlik uyarisi dikkate alinmadan uretim baslatilirsa makine plani durabilir.
- Makineden cikarma aktif veya duraklatilmis operasyonlarda serbest kalirsa operator kayitlari ve kuyruk sirasi bozulur.
- Uretim emri silme kurallari gevserse stok rezervasyonlari, operator kayitlari ve siparis durumlari tutarsizlasir.
- Montaj bekliyor durumunda eksik yari mamul veya ambalaj malzemesi takip edilmezse asıl urun stogu beklenen zamanda artmaz.
- Uretim karsilastirma verisi vardiya kayitlarina baglidir; eksik operator girisi eksik uretim gibi gorunebilir.
- Tamamlananlari gizle filtresi aktifken kapali veya tamamlanmis emirler operasyondan kaybolmus gibi yorumlanabilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/uretim-emirleri` sayfasini ac.
3. Ozet kartlari, filtreler ve tablo kolonlarinin geldigini kontrol et.
4. Durum filtresi, arama ve siralama seceneklerini dene.
5. Yeni uretim emri ac ve kaynak tipi olarak siparise dayali uretimi sec.
6. Ayni urune ait siparis adaylarini sec ve toplam miktarin otomatik doldugunu kontrol et.
7. Farkli urune ait aday secildiginde onceki secimin temizlendigini kontrol et.
8. Recetesi olmayan urunde uyarinin gorundugunu kontrol et.
9. Manuel stok uretimi ile urun ve miktar girerek emir olustur.
10. Olusan emrin detay sayfasina git.
11. Detayda ilerleme, makine kuyrugu ve malzeme yeterliligi bolumlerini kontrol et.
12. Atanmamis emirde makine atama ekranini ac.
13. Makineye atanmis ve bekleyen operasyonu makineden cikar.
14. Aktif veya duraklatilmis operasyonu makineden cikarmanin engellendigini dogrula.
15. Operator kaydi veya makine plani olan emri silmeyi dene ve silme blokajini dogrula.

Otomasyon smoke:

```bash
bun test src/modules/uretim_emirleri
```

DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/uretim_emirleri/__tests__/uretim_emirleri.real.integration.test.ts
```

Stok akisi smoke:

```bash
bun test src/modules/uretim_emirleri/__tests__/stok_akisi.smoke.test.ts
```

Montaj akisi entegrasyon:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/uretim_emirleri/__tests__/montaj_akisi.integration.test.ts
```

## 6. Stoklar

Route: `/admin/stoklar`

Menu grubu: Lojistik ve Stok

Ana amac:

Stoklar sayfasi stok takibi aktif olan urunlerin mevcut stok, rezerve stok, acik uretim ihtiyaci, serbest stok ve kritik durumlarini izlemek icin kullanilir. Sayfa ayni zamanda stok karti detayini, stok hareketlerini, manuel stok duzeltmesini ve receteye gore malzeme yeterlilik kontrolunu saglar.

### Liste Sayfasi

Ust aksiyon alani:

- Sayfa basligi
- Toplam stok karti sayisi
- Yeterlilik kontrolu butonu
- Yenileme butonu

Filtreler:

- Arama metni
- Kategori
- Durum
- Sadece stokta olanlar anahtari

Kategori secimi iki yerden yapilabilir:

- Kategori select alani
- Kategori tablari

Durum secenekleri:

- Tum durumlar
- Yeterli
- Kritik
- Yetersiz

Liste varsayilan olarak ada gore siralanir. Durum filtresi aktifken kritik stok bilgisi oncelikli siralama icin kullanilir.

Tablo kolonlari:

- Kod
- Ad
- Kategori
- Birim
- Stok miktari
- Rezerve
- Acik ihtiyac
- Serbest
- Uretim eksik
- Durum
- Detay aksiyonu

Durum vurgulari:

- `yetersiz` stok satirlari kirmizi tonla vurgulanir.
- `kritik` stok satirlari turuncu tonla vurgulanir.
- `yeterli` stoklar normal gorunur.

### Stok Hesap Mantigi

Mevcut stok:

- Urun kartindaki stok alanidir.

Rezerve stok:

- Uretim ve planlama akislarinda ayrilmis stok miktaridir.

Acik uretim ihtiyaci:

- Aktif, atanmamis, planlandi veya uretimde olan uretim emirlerinin recete kalemlerinden hesaplanir.
- Planlanan miktar ile uretilen miktar farki dikkate alinir.
- Recete hedef miktari, recete kalem miktari ve fire orani hesaba katilir.

Serbest stok:

- `stok - acikUretimIhtiyaci` olarak gosterilir.

Uretim eksik:

- `acikUretimIhtiyaci - stok` pozitifse eksik miktar olarak gosterilir.

Kritik acik:

- `kritikStok - stok` pozitifse kritik acik olarak gosterilir.

### Birim Donusumleri

Urunun birim donusumleri varsa liste ve detay ekraninda gorunur.

Liste davranisi:

- Ana birim stok miktari gosterilir.
- Donusum varsa alt satirda hedef birim karsiligi gosterilir.
- Ornek: `1 koli = 12 adet`

Detay davranisi:

- Tanımlı donusumler ayri blokta listelenir.
- Mevcut stokun hedef birime cevrilmis degeri gosterilir.

### Stok Detay Dialog

Her stok satirinda `Detay` aksiyonu bulunur.

Dialog sekmeleri:

- Ozet
- Hareketler
- Stok Duzelt

Ozet sekmesi:

- Mevcut stok
- Kritik stok
- Acik uretim ihtiyaci
- Serbest stok
- Birim donusumleri
- Planlama ozeti

Planlama ozeti:

- Tedarik tipi
- Eksik kritik miktar
- Plan sonrasi serbest stok

Hareketler sekmesi:

- Urune ait son stok hareketleri listelenir.
- Varsayilan olarak ilgili urun icin son 20 hareket istenir.
- Hareket tipi, miktar, tarih ve aciklama gosterilir.

Hareket tipleri:

- Giris
- Cikis
- Duzeltme

### Stok Duzeltme

Stok duzeltme sekmesi sayilan veya gercek stok miktarini girmek icindir.

Alanlar:

- Gercek miktar
- Aciklama

Davranis:

- Admin gercek miktari girer.
- Sistem mevcut stoktan farki hesaplar.
- Backend'e sadece `miktarDegisimi` gonderilir.
- Duzeltme sonrasi stok karti, stok listesi ve hareketler yenilenir.
- Stok hareketi `duzeltme` hareket tipi ve `stok_duzeltme` referans tipiyle kaydedilir.

Validasyon:

- Gercek miktar sayisal olmalidir.
- Gercek miktar negatif olamaz.
- Mevcut stokla ayni miktar girilirse kayit engellenir.
- Duzeltme sonucunda stok negatife dusmemelidir.

### Yeterlilik Kontrolu

Yeterlilik kontrolu, secilen urun ve miktar icin receteye gore malzeme yeterliligini hesaplar.

Alanlar:

- Urun
- Miktar

Davranis:

- Sadece urun kategorisindeki urunler listelenir.
- Urun ve pozitif miktar secildiginde yeterlilik sorgusu calisir.
- Urunun aktif recetesi yoksa recete yok mesaji gosterilir.
- Recete hedef miktari ile istenen miktar arasinda carpan hesaplanir.
- Her recete kalemi icin gerekli miktar, fireli miktar, mevcut stok, fark ve durum hesaplanir.

Yeterlilik tablosu:

- Malzeme
- Gerekli miktar
- Fire
- Fireli gerekli miktar
- Mevcut stok
- Fark
- Durum

Durumlar:

- Yeterli
- Yetersiz

### Backend Etkileri

Ilgili islemler:

- Stok listeleme
- Stok detay getirme
- Stok duzeltme
- Yeterlilik kontrolu
- Urun hareketlerini listeleme

Ilgili endpointler:

- `GET /admin/stoklar`
- `GET /admin/stoklar/:id`
- `POST /admin/stoklar/:id/duzelt`
- `GET /admin/stoklar/yeterlilik`
- `GET /admin/hareketler`

### Bilinen Hata Anahtarlari

- `gecersiz_sorgu_parametreleri`
- `gecersiz_istek_govdesi`
- `stok_kaydi_bulunamadi`
- `stok_eksiye_dusurulemez`
- `recete_bulunamadi`
- `sunucu_hatasi`

### Genel Riskler

- Manuel stok duzeltmesi gercek stok hareketi olusturur; yanlis miktar girisi stok ve planlama ekranlarini dogrudan etkiler.
- Duzeltme aciklamasi bos birakilirsa denetim izi zayiflar; sayim veya duzeltme nedeni yazilmalidir.
- Serbest stok hesabi acik uretim ihtiyacina baglidir; recete veya uretim emri eksikse serbest stok oldugundan yuksek gorunebilir.
- Stok takip aktif olmayan urunler listede gorunmez; admin bu durumu urun kartindan kontrol etmelidir.
- Rezerve stok ve acik ihtiyac farkli kaynaklardan geldiginden ayni malzeme icin gecici farklar olusabilir.
- Yeterlilik kontrolu aktif receteye baglidir; eski veya eksik recete sonuc uretim planlamasini yaniltabilir.
- Birim donusum carpanlari yanlissa stokun alternatif birim gorunumu yanlis yorumlanir.
- Negatif stoka dusmeyi engelleyen kontrol kaldirilirsa mal kabul, uretim ve sevkiyat akislarinda tutarsizlik olusur.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/stoklar` sayfasini ac.
3. Stok listesi, kategori tablari ve filtrelerin geldigini kontrol et.
4. Arama filtresiyle urun kodu veya adina gore arama yap.
5. Kategori filtresini ve durum filtresini dene.
6. `Sadece Stokta Olanlar` anahtarini ac/kapat.
7. Kritik veya yetersiz stok satirlarinin dogru vurgulandigini kontrol et.
8. Bir satirda detay dialogunu ac.
9. Ozet sekmesinde stok, kritik stok, serbest stok ve birim donusumlerini kontrol et.
10. Hareketler sekmesinde son hareketlerin geldigini kontrol et.
11. Stok Duzelt sekmesinde mevcut stoktan farkli pozitif bir gercek miktar gir.
12. Duzeltme sonrasi hareket kaydi ve stok miktarinin guncellendigini kontrol et.
13. Stoku negatife dusurecek duzeltme dene ve hata mesajini dogrula.
14. Yeterlilik kontrolunu ac, urun ve miktar sec.
15. Recetesi olan urunde malzeme yeterlilik tablosunu, recetesi olmayan urunde recete yok durumunu dogrula.

Otomasyon smoke:

```bash
bun test src/modules/stoklar
```

DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/stoklar/__tests__/stoklar.real.integration.test.ts
```

Hareket entegrasyon smoke:

```bash
bun test src/modules/hareketler
```

## 7. Satin Alma

Route: `/admin/satin-alma`

Detay route: `/admin/satin-alma/[id]`

Menu grubu: Lojistik ve Stok

Ana amac:

Satin Alma sayfasi tedarikcilerden malzeme siparisi olusturmak, kritik stoklardan otomatik satin alma taslaklari uretmek, siparis durumunu takip etmek ve gelen malzemeleri mal kabul surecine aktarmak icin kullanilir. Bu sayfa tedarikci kartlari, urunler, stok, mal kabul ve stok hareketleriyle dogrudan baglantilidir.

### Liste Sayfasi

Ust aksiyon alani:

- Sayfa basligi
- Toplam satin alma siparisi sayisi
- Kritik stok kontrol butonu
- Yenileme butonu
- Yeni satin alma butonu

Ozet kartlari:

- Toplam siparis
- Acik siparis
- Teslim bekleyen
- Otomatik olusan

Filtreler:

- Arama metni
- Durum
- Filtre sifirlama

Sayfa `tedarikciId` query parametresi ile acilirsa liste ilgili tedarikciye gore filtrelenebilir.

Durum secenekleri:

- Hepsi
- Taslak
- Onaylandi
- Siparis verildi
- Kismen teslim
- Tamamlandi
- Iptal

Tablo kolonlari:

- Siparis no
- Tedarikci
- Malzeme
- Siparis tarihi
- Termin tarihi
- Durum
- Aksiyonlar

Aksiyonlar:

- Detay sayfasina git
- Siparisi duzenle
- Siparisi sil

Otomatik kritik stok siparisleri listede ayri rozetle gosterilir.

### Kritik Stok Kontrolu

`Kritik Stok Kontrol` butonu stok seviyesi kritik stok seviyesinin altina dusen satin alma veya fason tedarik tipindeki urunler icin taslak satin alma siparisi olusturur.

Davranis:

- Aktif urunler kontrol edilir.
- Sadece `satin_alma` ve `fason` tedarik tipleri dikkate alinir.
- Stok, kritik stoktan dusukse eksik miktar hesaplanir.
- Ayni urun icin acik satin alma kalemi varsa yeni taslak olusturulmaz.
- Daha onceki alimlarda kullanilan tedarikci bulunursa ayni tedarikci tercih edilir.
- Onceki alim yoksa aktif tedarikcilerden deterministik bir secim yapilir.
- Urunler tedarikci bazinda gruplanarak taslak siparis olusturulur.
- Siparis aciklamasina kritik stok nedeniyle otomatik olustugu ve eksik detaylari yazilir.

Risk notu:

Bu buton planlama kolayligi saglar, fakat otomatik olusan taslaklar admin tarafindan kontrol edilmeden siparis verilmis kabul edilmemelidir.

### Satin Alma Formu

Form yan panel olarak acilir. Yeni kayit ve duzenleme ayni formu kullanir.

Temel alanlar:

- Siparis no
- Durum
- Tedarikci
- Siparis tarihi
- Termin tarihi
- Aciklama
- Malzeme kalemleri

Zorunlu alanlar:

- Siparis no
- Tedarikci
- Siparis tarihi
- Yeni kayitta en az bir kalem

Kalem alanlari:

- Malzeme
- Miktar
- Birim fiyat

Validasyon kurallari:

- Tedarikci secilmelidir.
- Siparis tarihi girilmelidir.
- Urun kalemlerinde miktar pozitif olmalidir.
- Birim fiyat negatif olamaz.
- Duzenlemede kalem gonderilecekse en az bir kalem olmalidir.

Otomatik davranislar:

- Yeni sipariste siparis no otomatik istenir.
- Yeni sipariste siparis tarihi bugunun tarihi olarak doldurulur.
- Urun secildiginde birim fiyat bos veya 0 ise urun kartindaki birim fiyat aktarilir.
- Form altinda ara toplam, KDV ve genel toplam hesaplanir.

Not:

Formdaki KDV orani sadece ekrandaki hesap ozetinde kullanilir; satin alma payload kalem bazinda miktar ve birim fiyat gonderir.

### Detay Sayfasi

Detay sayfasi satin alma siparisinin tedarikci, kalem ve teslim durumunu gosterir.

Ust alan:

- Listeye don butonu
- Siparis no
- Otomatik kritik stok rozeti
- Yenileme butonu
- Duzenle butonu

Siparis bilgileri karti:

- Durum
- Tedarikci
- Siparis tarihi
- Termin tarihi
- Aciklama

Teslim alma durumu karti:

- Kabul edilen yuzde
- Toplam kabul miktari
- Kalan miktar
- Tamamlandi veya iptal durum bilgilendirmesi

Kalem tablosu:

- Sira
- Urun
- Siparis miktari
- Kabul edilen
- Kalan
- Birim
- Stok durumu
- Birim fiyat
- Toplam
- Kabul emri aksiyonu

Kalem satirinda stok kritikse kritik rozeti ve mevcut/kritik stok degeri gosterilir.

### Kabul Emri

Detay sayfasinda tamamlanmamis ve iptal edilmemis siparis kalemleri icin `Kabul Emri` aksiyonu bulunur.

Alanlar:

- Gelen miktar
- Parti no
- Kalite durumu
- Kalite notu
- Notlar

Kalite durumlari:

- Kabul
- Red
- Kosullu

Davranis:

- Varsayilan gelen miktar kalemin kalan miktaridir.
- Gelen miktar pozitif olmalidir.
- Gelen miktar kalan miktardan fazlaysa ekranda uyari gosterilir.
- Kabul veya kosullu kalite durumunda mal kabul kaydi stok girisi olusturur.
- Red kalite durumunda stok artmaz, sadece mal kabul kaydi olusur.
- Kayit sonrasi satin alma detayi yenilenir.
- Mal kabul kayitlarina gore satin alma durumu `kismen_teslim` veya `tamamlandi` olabilir.

### Backend Etkileri

Ilgili islemler:

- Satin alma listeleme
- Satin alma detay getirme
- Siradaki siparis no getirme
- Satin alma olusturma
- Satin alma guncelleme
- Satin alma silme
- Kritik stok taslak kontrolu
- Mal kabul kaydi olusturma

Ilgili endpointler:

- `GET /admin/satin-alma`
- `GET /admin/satin-alma/next-no`
- `GET /admin/satin-alma/:id`
- `POST /admin/satin-alma`
- `PATCH /admin/satin-alma/:id`
- `DELETE /admin/satin-alma/:id`
- `POST /admin/satin-alma/kritik-stok-kontrol`
- `POST /admin/mal-kabul`

### Bilinen Hata Anahtarlari

- `gecersiz_sorgu_parametreleri`
- `gecersiz_istek_govdesi`
- `satin_alma_siparisi_bulunamadi`
- `siparis_no_zaten_var`
- `satin_alma_kilitli`
- `sunucu_hatasi`

### Kilit ve Durum Kurallari

Satin alma siparisine bagli mal kabul kaydi varsa siparis iptal edilemez. Bu kontrol stok girisi yapilmis malzemelerin siparis iptaliyle hareket kaydi tutarsizligi olusturmasini engeller.

Durumlar:

- `taslak`: hazirlik asamasi
- `onaylandi`: satin alma onaylandi
- `siparis_verildi`: tedarikciye siparis gecildi
- `kismen_teslim`: kalemlerin bir kismi kabul edildi
- `tamamlandi`: tum kalemler kabul edildi veya siparis kapandi
- `iptal`: siparis iptal edildi

### Genel Riskler

- Kritik stok kontrolu acik siparis kalemlerini dikkate alir; manuel silme veya yanlis durum nedeniyle tekrar taslak olusabilir.
- Otomatik tedarikci secimi onceki alim veya deterministik secime dayanir; gercek tedarik uygunlugu admin tarafindan kontrol edilmelidir.
- Satin alma formunda yanlis birim fiyat girisi maliyet raporlarini etkileyebilir.
- KDV orani formda sadece gorsel hesapta kullanildigi icin resmi fiyat/kdv kuralina donusmeden once backend destegi netlestirilmelidir.
- Mal kabul kaydi olustuktan sonra satin alma iptali engellenmelidir; aksi halde stok hareketleri sahipsiz kalir.
- Red kalite durumunda stok artmamalidir; bu kural bozulursa reddedilen mal stokta kullanilabilir gorunur.
- Kalan miktardan fazla kabul girisi ekranda uyari verir; backend tarafindaki sinirlar da ayrica korunmalidir.
- Tamamlandi durumuna gecis otomatik mal kabul veya durum guncellemesiyle stok etkisi yaratabilecegi icin test edilmeden kullanilmamalidir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/satin-alma` sayfasini ac.
3. Ozet kartlari, filtreler ve liste kolonlarinin geldigini kontrol et.
4. Arama ve durum filtresini dene.
5. Kritik Stok Kontrol butonunu calistir ve otomatik taslak rozeti olan kayitlari kontrol et.
6. Yeni satin alma siparisi olustur; tedarikci, tarih ve en az bir malzeme kalemi gir.
7. Urun secildiginde birim fiyat otomatik geliyorsa dogrula.
8. Ara toplam, KDV ve genel toplam hesaplarini kontrol et.
9. Siparis detay sayfasina git.
10. Detayda tedarikci, teslim ozeti ve kalem tablosunu kontrol et.
11. Bir kalem icin Kabul Emri ac ve pozitif gelen miktar ile kabul kaydi olustur.
12. Kabul sonrasi kabul edilen/kalan miktar ve siparis durumunu kontrol et.
13. Red kalite durumu ile kayit ac ve stok artmadigini dogrula.
14. Mal kabul kaydi olan siparisi iptal etmeyi dene ve kilit davranisini dogrula.
15. Siparisi silme onay dialogunu ve liste yenilenmesini kontrol et.

Otomasyon smoke:

```bash
bun test src/modules/satin_alma
```

DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/satin_alma/__tests__/satin_alma.real.integration.test.ts
```

Mal kabul entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/mal_kabul/__tests__/mal_kabul.real.integration.test.ts
```

## 8. Mal Kabul

Route: `/admin/mal-kabul`

Detay route: `/admin/mal-kabul/[id]`

Menu grubu: Lojistik ve Stok

Ana amac:

Mal Kabul sayfasi depoya gelen urunlerin kaydini, kalite durumunu, stok girisini ve satin alma siparisleriyle teslim durumunu yonetmek icin kullanilir. Kabul edilen veya kosullu kabul edilen kayitlar stok ve hareket kaydi olusturur; red kayitlari stok artisi yapmaz.

### Liste Sayfasi

Ust aksiyon alani:

- Sayfa basligi
- Toplam mal kabul kaydi
- Bekleyenler/tumu gorunum anahtari
- Yenileme butonu
- Yeni mal kabul butonu

Varsayilan gorunum:

- Sayfa acildiginda `bekliyor` kalite durumundaki kayitlar listelenir.
- `showAll` aktif edilirse kalite filtresi secimine gore tum kayitlar incelenebilir.

Filtreler:

- Arama metni
- Kaynak tipi
- Kalite durumu
- Baslangic tarihi
- Bitis tarihi

Kaynak tipi secenekleri:

- Satin Alma
- Fason
- Hammadde
- Yari Mamul
- Iade
- Diger

Kalite durumu secenekleri:

- Onay bekliyor
- Kabul
- Red
- Kosullu

Tablo kolonlari:

- Kabul tarihi
- Urun
- Kaynak tipi
- Tedarikci
- Miktar
- Notlar
- Kalite durumu
- Operator
- Islem

Satir aksiyonlari:

- Teslim al
- Kosullu kabul
- Red
- Duzenle
- Sil

### Yeni Mal Kabul Formu

Form yan panel olarak acilir.

Kaynak tipleri:

- Satin Alma
- Fason
- Hammadde
- Yari Mamul
- Iade
- Diger

Satin alma kaynakli akis:

- Acik satin alma siparisi secilir.
- Secilen siparise ait kalan miktari olan kalemler listelenir.
- Kalem secilince gelen miktar kalan miktar olarak otomatik doldurulur.
- Satin alma siparis ve kalem id bilgisi backend'e gonderilir.

Serbest kaynak akisi:

- Satin alma disindaki kaynak tiplerinde urun arama ve urun secimi yapilir.
- Gelen miktar admin tarafindan girilir.
- Fason kaynak tipi icin tedarikci backend validasyonunda zorunludur.

Ortak alanlar:

- Gelen miktar
- Parti no
- Kalite durumu
- Kalite notu
- Notlar

Validasyon kurallari:

- Urun secilmelidir.
- Gelen miktar pozitif olmalidir.
- Satin alma kaynagi icin satin alma siparis id ve kalem id zorunludur.
- Fason kaynagi icin tedarikci zorunludur.
- Parti no en fazla 64 karakterdir.
- Kalite notu ve notlar en fazla 500 karakterdir.

Kalite davranisi:

- `kabul`: stok artar ve giris hareketi olusur.
- `kosullu`: stok artar ve giris hareketi olusur.
- `red`: stok artmaz; kayit sadece takip amacli olusur.
- `bekliyor`: kalite onayi bekleyen kayit olarak kalir.

### Teslim Al Aksiyonu

Liste satirinda kalite durumu `bekliyor` olan kayitlarda `Teslim Al` aksiyonu gorunur.

Alanlar:

- Teslim alinan miktar
- Notlar

Davranis:

- Girilen miktar pozitif olmalidir.
- Kayit `kabul` durumuna cekilir.
- Stok artisi ve hareket kaydi olusur.
- Operator kullanici bilgisi kayda yazilir.

### Detay Sayfasi

Detay sayfasi mal kabul kaydinin kaynak, urun ve kalite bilgilerini gosterir ve duzenleme imkani verir.

Bilgi karti:

- Urun
- Urun kodu
- Kaynak tipi
- Kalite durumu
- Gelen miktar
- Parti no
- Tedarikci
- Operator
- Satin alma siparisi linki
- Kabul tarihi
- Kayit tarihi
- Notlar
- Kalite notu

Guncelle karti:

- Kabul edilen miktar
- Kalite durumu
- Parti no
- Kalite notu
- Notlar

Kalite durumu degisiklik uyarilari:

- Kabul veya kosullu durumdan red durumuna gecilirse stok dusulecegi belirtilir.
- Red durumundan kabul veya kosullu duruma gecilirse stok artacagi belirtilir.

### Stok ve Hareket Etkisi

Olusturma:

- Kalite durumu `red` degilse urun stogu gelen miktar kadar artar.
- `hareketler` tablosuna `giris` hareketi yazilir.
- Hareket referans tipi `mal_kabul`, referans id mal kabul kaydidir.

Guncelleme:

- `bekliyor` veya `red` durumundan `kabul/kosullu` durumuna gecilirse stok artar.
- `kabul/kosullu` durumundan `red` durumuna gecilirse stok azalir.
- Gelen miktar degisirse kabul anindaki etkin miktar stok hareketinde kullanilir.

Silme:

- Kayit kabul veya kosullu ise stoktan gelen miktar geri dusulur.
- Ilgili hareket kaydi silinir.
- Kayit silinir.
- Satin alma baglantisi varsa satin alma durumu yeniden hesaplanir.

### Satin Alma Baglantisi

Mal kabul kaydi satin alma siparisine bagliysa:

- Sadece `kabul` ve `kosullu` kalite durumlari teslim toplaminda sayilir.
- `red` kayitlar satin alma teslim miktarina eklenmez.
- Tum kalemler siparis miktarina ulasinca satin alma durumu `tamamlandi` olur.
- En az bir kabul var ama hepsi tamamlanmadiysa durum `kismen_teslim` olur.
- Satin alma iptal degilse durum otomatik guncellenir.

### Backend Etkileri

Ilgili islemler:

- Mal kabul listeleme
- Mal kabul detay getirme
- Mal kabul olusturma
- Mal kabul guncelleme
- Mal kabul silme
- Stok artirma veya dusme
- Hareket kaydi olusturma veya silme
- Satin alma durumunu yeniden hesaplama

Ilgili endpointler:

- `GET /admin/mal-kabul`
- `GET /admin/mal-kabul/:id`
- `POST /admin/mal-kabul`
- `PATCH /admin/mal-kabul/:id`
- `DELETE /admin/mal-kabul/:id`

### Bilinen Hata Anahtarlari

- `gecersiz_sorgu`
- `gecersiz_istek_govdesi`
- `kayit_bulunamadi`
- `insert_failed`
- `sunucu_hatasi`

### Genel Riskler

- Red kalite durumunda stok artmamasi kritik kuraldir; bu kural bozulursa reddedilen malzeme kullanilabilir stokta gorunur.
- Kabul/kosullu kaydin silinmesi stoktan geri dusus yapar; yanlis silme stok planini bozar.
- Kalite durumunu kabulden rede almak stok cikisi yaratir; bu islem mutlaka gercek fiziksel durumla uyumlu olmalidir.
- Satin alma kaleminde kalan miktardan fazla mal kabul girisi ekranda uyari verir; backend tarafinda miktar siniri ayrica takip edilmelidir.
- Bekleyen kalite kayitlari varsayilan listeye gelir; showAll kullanilmazsa gecmis kabul/red kayitlari gorunmeyebilir.
- Fason kaynakli kayitta tedarikci zorunlulugu eksik uygulanirsa tedarikci performans ve izlenebilirlik zayiflar.
- Parti no girilmezse lot/seri takibi gerektiren malzemelerde izlenebilirlik eksik kalir.
- Mal kabul silindikten sonra hareket kaydi silindigi icin denetim izi zayiflayabilir; kritik kayitlarda silme yerine kalite durumu duzeltmesi tercih edilmelidir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/mal-kabul` sayfasini ac.
3. Varsayilan olarak bekleyen kalite kayitlarinin listelendigini kontrol et.
4. `Tumu/Bekleyenler` anahtarini dene.
5. Kaynak tipi, kalite durumu ve tarih filtrelerini dene.
6. Yeni mal kabul formunu ac.
7. Satin alma kaynak tipinde acik siparis ve kalem sec; gelen miktarin kalan miktar olarak doldugunu kontrol et.
8. Kabul kalite durumu ile kaydet ve stok/hareket kaydinin olustugunu kontrol et.
9. Red kalite durumu ile kaydet ve stok artmadigini dogrula.
10. Satin alma detayinda kabul edilen/kalan miktar ve durumun guncellendigini kontrol et.
11. Liste satirinda bekleyen kayit icin Teslim Al aksiyonunu kullan.
12. Mal kabul detay sayfasina git ve kalite durumunu kabulden red durumuna al; stok dususunu kontrol et.
13. Red kaydi tekrar kabul durumuna al; stok artisinin geri geldigini kontrol et.
14. Kabul kaydini sil ve stok/hareket etkisinin geri alindigini dogrula.
15. Satin alma baglantili kayitta siparis durumunun yeniden hesaplandigini kontrol et.

Otomasyon smoke:

```bash
bun test src/modules/mal_kabul
```

DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/mal_kabul/__tests__/mal_kabul.real.integration.test.ts
```

Satin alma entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/satin_alma/__tests__/satin_alma.real.integration.test.ts
```

## 9. Sevkiyat

Route: `/admin/sevkiyat`

Menu grubu: Lojistik ve Stok

Ana amac:

Sevkiyat sayfasi satis siparislerinden sevk bekleyen urunleri takip etmek, sevk emri olusturmak, admin onayi almak ve fiziksel sevk ile stok cikisini tamamlamak icin kullanilir. Sayfa satis siparisleri, stok, hareketler, gorevler ve operator sevkiyat kayitlariyla dogrudan baglantilidir.

### Sayfa Sekmeleri

Sayfada iki ana sekme bulunur:

- Bekleyenler
- Sevk Emirleri

Bekleyenler sekmesi sevk edilebilecek siparis kalemlerini ve siparissiz stoklu urunleri gosterir.

Sevk Emirleri sekmesi olusturulmus sevk emirlerinin onay, fiziksel sevk ve iptal durumlarini yonetir.

### Bekleyenler Sekmesi

Filtreler:

- Arama metni
- Stok filtresi
- Gruplama
- Yenileme

Arama alanlari:

- Siparis no
- Musteri adi
- Urun kodu
- Urun adi

Stok filtresi:

- Stoklu
- Tumu

Gruplama secenekleri:

- Musteri bazli
- Urun bazli
- Duz liste

Bekleyen satir kolonlari:

- Siparis no
- Musteri
- Urun kodu
- Urun adi
- Siparis miktari
- Sevk edilen miktar
- Onayli sevk emri miktari
- Acik sevk emri miktari
- Kalan miktar
- Stok
- Termin
- Sevk emri aksiyonu

Kalan miktar hesabi:

- `siparisMiktar - sevkEdilenMiktar - acikSevkEmriMiktar`

Acik sevk emri miktari:

- `bekliyor` ve `onaylandi` durumundaki sevk emirlerinin toplamidir.

Onayli sevk emri miktari:

- Sadece `onaylandi` durumundaki sevk emirlerinin toplamidir.

Stok yetersizligi:

- Stok miktari kalan miktardan dusukse satirda uyarı ikonu gosterilir.
- Stok yetersizligi sevk emri olusturma dialogunda da uyarilir.

### Urun Bazli Gorunum

Urun bazli gruplamada ayni urune ait siparis kalemleri birlikte gorulur.

Grup altinda:

- Siparis no
- Musteri
- Siparis miktari
- Sevk edilen
- Onayli
- Acik emir
- Kalan
- Termin

Grup ozetinde:

- Toplam kalan miktar
- Mevcut stok

Stok toplam kalandan azsa grup ozetinde de uyarı gosterilir.

### Siparissiz Sevk

Urun bazli gorunumde siparisi olmayan ama stokta bulunan urunler ayri bolumde gosterilir.

Siparissiz urun kriterleri:

- Urun kategorisi `urun` olmalidir.
- Urun aktif olmalidir.
- Stok miktari 0'dan buyuk olmalidir.
- Aktif satis siparis kalemlerinde yer almamalidir.

Siparissiz sevk dialogunda:

- Musteri secilir.
- Miktar girilir.
- Tarih girilir.
- Not eklenebilir.

Musteri secilmeden siparissiz sevk emri olusturulamaz.

### Sevk Emri Olusturma

Siparisli sevk emri dialogu:

- Musteri
- Siparis no
- Kalan miktar
- Stok miktari
- Sevk miktari
- Tarih
- Notlar

Davranis:

- Varsayilan miktar kalan miktardir.
- Miktar pozitif olmalidir.
- Miktar stoktan fazlaysa ekranda uyari gosterilir.
- Sevk emri olusturuldugunda durum `bekliyor` olur.
- Urun stokundan fiziksel cikis hemen yapilmaz.
- Sevk emri olusturuldugunda urun `rezerve_stok` miktari artar.
- Admin onayi icin gorev kaydi acilir.

### Sevk Emirleri Sekmesi

Filtreler:

- Arama metni
- Durum
- Yenileme

Durum secenekleri:

- Bekliyor
- Onaylandi
- Sevk edildi
- Iptal

Tablo kolonlari:

- Sevk emri no
- Musteri
- Urun kodu
- Urun adi
- Miktar
- Tarih
- Durum
- Islem

Durum aksiyonlari:

- `bekliyor` durumundaki emir admin tarafindan onaylanabilir veya iptal edilebilir.
- Admin olmayan kullanici `admin onayi bekleniyor` mesajini gorur.
- `onaylandi` durumundaki emir admin veya `sevkiyatci` rolundeki kullanici tarafindan fiziksel sevk edilebilir.
- `onaylandi` durumundaki emir iptal edilebilir.
- `sevk_edildi` durumundaki emir iptal edilemez.

### Onay ve Fiziksel Sevk Akisi

1. Sevk emri olusturulur.
2. Emir `bekliyor` durumunda admin onayi bekler.
3. Admin emri `onaylandi` durumuna alir.
4. Admin veya sevkiyatci fiziksel sevki tamamlar.
5. Emir `sevk_edildi` durumuna gecer.

Fiziksel sevkte:

- `sevkiyatlar` kaydi olusur.
- `sevkiyat_kalemleri` kaydi olusur.
- Urun stogu sevk miktari kadar azalir.
- Urun rezerve stogu sevk miktari kadar azalir.
- `hareketler` tablosuna `cikis` hareketi yazilir.
- Hareket referans tipi `sevkiyat` olur.
- Satis siparisi durumu yeniden hesaplanir.
- Sevkiyat gorevleri tamamlanir.

Iptalde:

- Emir `bekliyor` veya `onaylandi` durumundayken iptal edilebilir.
- Rezerve stok geri dusulur.
- Ilgili gorevler iptal edilir.

### Gorev Entegrasyonu

Sevk emri durumuna gore gorev kayitlari senkronize edilir.

`bekliyor` durumunda:

- Admin rolune `Sevk onayini ver` gorevi acilir.
- Fiziksel sevk gorevleri kapatilir.

`onaylandi` durumunda:

- Admin onay gorevi tamamlanir.
- Admin ve sevkiyatci rollerine `Fiziksel sevki tamamla` gorevi acilir.

`sevk_edildi` veya `iptal` durumunda:

- Ilgili sevkiyat gorevleri tamamlanir veya iptal edilir.

### Backend Etkileri

Ilgili islemler:

- Sevk bekleyen siparis kalemlerini listeleme
- Siparissiz stoklu urunleri listeleme
- Sevk emirlerini listeleme
- Sevk emri detay getirme
- Sevk emri olusturma
- Sevk emri durum guncelleme
- Stok rezervasyonu
- Fiziksel sevkte stok cikisi
- Hareket kaydi olusturma
- Satis siparisi durumunu yenileme
- Gorev kayitlarini senkronize etme

Ilgili endpointler:

- `GET /admin/sevkiyat/bekleyenler`
- `GET /admin/sevkiyat/siparissiz`
- `GET /admin/sevkiyat/emirler`
- `GET /admin/sevkiyat/emirler/:id`
- `POST /admin/sevkiyat/emri`
- `PATCH /admin/sevkiyat/emirler/:id`

### Bilinen Hata Anahtarlari

- `invalid_query`
- `invalid_body`
- `not_found`
- `insert_failed`
- `sevk_emri_kilitli`

### Genel Riskler

- Sevk emri olusturma stok cikisi yapmaz, sadece rezervasyon yapar; admin bunu fiziksel sevk tamamlandi gibi yorumlamamalidir.
- Stoktan fazla sevk miktari ekranda uyarilir; backend tarafinda da is kurali net korunmalidir.
- `sevk_edildi` emrinin iptal edilememesi kritik kuraldir; iade ayri akisla yonetilmelidir.
- Siparissiz sevk, satis siparisi baglantisi olmadigi icin raporlarda farkli yorumlanabilir; not alanina sebep yazilmalidir.
- Rezerve stok iptal veya fiziksel sevk sirasinda dogru dusmezse stok planlama yanlis olur.
- Fiziksel sevk sirasinda stok `GREATEST(0, stok - miktar)` ile dusuruldugu icin yetersiz stok senaryolari negatif stok yaratmaz ama fiili eksigi gizleyebilir.
- Gorev senkronizasyonu calismazsa admin onayi veya sevkiyatci aksiyonu operasyonel olarak takip edilemeyebilir.
- Satis siparisi durumu sevk sonrasi yenilenmezse siparis `kismen_sevk` veya `tamamlandi` durumuna gecmeyebilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/sevkiyat` sayfasini ac.
3. Bekleyenler sekmesinde arama, stok filtresi ve gruplama seceneklerini dene.
4. Musteri bazli, urun bazli ve duz liste gorunumlerinde satirlarin geldigini kontrol et.
5. Stok yetersiz satirda uyarinin gorundugunu kontrol et.
6. Siparisli bir satirdan sevk emri olustur.
7. Sevk emri olustuktan sonra acik sevk emri miktarinin arttigini ve rezerve stok etkisini kontrol et.
8. Sevk Emirleri sekmesine gec.
9. Bekleyen emri admin olarak onayla.
10. Onayli emri admin veya sevkiyatci roluyla fiziksel sevk et.
11. Fiziksel sevk sonrasi stok, rezerve stok, hareket kaydi ve satis siparisi durumunu kontrol et.
12. Bekleyen veya onayli bir emri iptal et ve rezerve stogun geri dustugunu kontrol et.
13. Sevk edilmis emri iptal etmeyi dene ve kilit davranisini dogrula.
14. Urun bazli gorunumde siparissiz stoklu urunden musteri secerek sevk emri olustur.
15. Siparissiz sevkte not alaninin dolduruldugunu ve satis siparisi baglantisi olmadigini kontrol et.

Otomasyon smoke:

```bash
bun test src/modules/sevkiyat
```

DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/sevkiyat/__tests__/sevkiyat.real.integration.test.ts
```

Satis siparisi durum smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/satis_siparisleri/__tests__/satis_siparisleri.real.integration.test.ts
```

## 10. Tanimlar ve Planlama Sekmeleri

Ana route'lar:

- `/admin/makineler`
- `/admin/tanimlar?tab=kaliplar`
- `/admin/tanimlar?tab=durus-nedenleri`
- `/admin/tanimlar?tab=birimler`
- `/admin/tanimlar?tab=tatiller`
- `/admin/tanimlar?tab=vardiyalar`
- `/admin/tanimlar?tab=hafta-sonu-planlari`
- `/admin/tanimlar?tab=kategoriler`

Menu gruplari:

- Genel > Uretim Tanimlari
- Genel > Calisma Planlari

Ana amac:

Tanimlar ve planlama sekmeleri uretim operasyonunun temel sozluklerini ve kapasite takvimini yonetir. Makine, kalip, durus nedeni, birim, kategori, tatil, vardiya ve hafta sonu calisma planlari bu alanda tanimlanir. Bu kayitlar uretim emri, makine kuyrugu, Gantt plani, stok, recete, operator ekrani ve vardiya analizi tarafinda dogrudan kullanilir.

### Makineler

Route: `/admin/makineler`

Ana amac:

Makine kartlarini, durumlarini, kapasite bilgilerini ve uyumlu kaliplarini izlemek icin kullanilir.

Liste alanlari:

- Kod
- Ad
- Tonaj
- Saatlik kapasite
- 24 saat calisma durumu
- Kalip sayisi
- Durum
- Aksiyonlar

Filtreler:

- Arama
- Durum

Durumlar:

- Aktif
- Pasif
- Bakimda

Satir aksiyonlari:

- Detay genislet
- Duzenle
- Sil

Genisletilen satirda:

- Uyumlu kaliplar
- 30 gunluk kapasite ozeti
- Tatil gunleri
- Hafta sonu calisma gunleri
- Gunluk kapasite detayi

Kapasite ozeti:

- Calisma gunu
- Toplam calisma saati
- Gunluk calisma saati
- Tatil sayisi
- Hafta sonu calisma sayisi
- Saatlik kapasite varsa tahmini toplam uretim kapasitesi

Risk notlari:

- Yanlis saatlik kapasite Gantt ve planlanan bitis tahminlerini bozar.
- Makine bakimda/pasif durumdayken operasyon atanabiliyorsa planlama gercekle uyumsuz olur.
- 24 saat calisma bayragi yanlis kullanilirsa kapasite oldugundan yuksek hesaplanir.
- Makine silme, kuyruk ve operator kayitlariyla baglantiliysa dikkatli yapilmalidir.

### Kaliplar

Route: `/admin/tanimlar?tab=kaliplar`

Ana amac:

Uretimde kullanilan kaliplari ve kalip-makine uyumluluk matrisini yonetir.

Kalip kart alanlari:

- Kod
- Ad
- Aciklama
- Aktiflik
- Uyumlu makine sayisi

Aksiyonlar:

- Yeni kalip
- Kalip duzenle
- Kalip sil
- Uyumlu makineleri kaydet

Uyumluluk matrisi:

- Secilen kalip icin aktif makineler listelenir.
- Her makine checkbox ile isaretlenir.
- Degisiklik yapilan kalip icin kaydet butonu aktif olur.
- Kayit sonrasi makine listesi ve kalip listesi yenilenir.

Risk notlari:

- Kalip-makine uyumlulugu yanlissa operasyon yanlis makineye atanabilir.
- Uyumlu makine secimi kaydedilmeden sayfadan cikilirse degisiklik kaybolur.
- Pasif kaliplar uretim planina dahil edilmemelidir.

### Durus Nedenleri

Route: `/admin/tanimlar?tab=durus-nedenleri`

Ana amac:

Operator ve vardiya kayitlarinda kullanilan durus nedenlerini standart hale getirir.

Alanlar:

- Kod
- Ad
- Kategori
- Aktiflik
- Aciklama

Kategoriler:

- Makine
- Malzeme
- Personel
- Planlama
- Diger

Liste davranisi:

- Kod, ad ve kategoriye gore arama yapilabilir.
- Aktif/pasif durum rozetle gosterilir.
- Kayit duzenlenebilir veya silinebilir.

Risk notlari:

- Durus nedeni kodlari tutarsiz olursa vardiya analizi ve kayip nedeni raporlari guvenilir olmaz.
- Kullanilmis durus nedenlerinin silinmesi gecmis operator raporlarini zayiflatabilir.

### Birimler

Route: `/admin/tanimlar?tab=birimler`

Ana amac:

Urun kartlarinda ve stok ekranlarinda kullanilan olcu birimlerini yonetir.

Alanlar:

- Kod
- Ad
- Sira
- Aktiflik

Aksiyonlar:

- Yeni birim
- Birim duzenle
- Birim sil

Validasyon:

- Kod zorunludur.
- Ad zorunludur.
- Sira sayisal olmalidir.

Risk notlari:

- Urunlerde kullanilan birimin silinmesi stok ve recete ekranlarinda anlamsiz birim gorunumune yol acabilir.
- Kod standardi korunmazsa birim donusumleri ve raporlar karisir.

### Kategoriler ve Urun Gruplari

Route: `/admin/tanimlar?tab=kategoriler`

Ana amac:

Urun kategorilerinin davranisini ve kategori alt gruplarini yonetir.

Kategori alanlari:

- Ad
- Slug
- Aktiflik
- Varsayilan birim
- Varsayilan kod prefixi
- Recetede kullanilabilirlik
- Varsayilan tedarik tipi
- Uretim alanlari aktifligi
- Operasyon tipi gerekli bilgisi
- Varsayilan operasyon tipi

Sabit kategori anahtarlarindan bazilari:

- `urun`
- `yarimamul`
- `operasyonel_ym`
- `hammadde`

Tedarik tipi secenekleri:

- Uretim
- Satin alma
- Fason

Operasyon tipi secenekleri:

- Tek tarafli
- Cift tarafli

Risk notlari:

- Varsayilan kod prefixi urun kod uretimini etkiler.
- Recetede kullanilabilirlik yanlis ayarlanirsa malzeme secimi bozulur.
- Uretim alanlari veya operasyon tipi ayarlari yanlis olursa urun formu ve uretim emri akisi hatali davranir.
- Varsayilan tedarik tipi satin alma/uretim planlamasini dogrudan etkiler.

### Tatil Gunleri

Route: `/admin/tanimlar?tab=tatiller`

Ana amac:

Uretim kapasitesi ve planlama icin calisilmayacak tatil gunlerini tanimlar.

Alanlar:

- Tarih
- Ad
- Baslangic saati
- Bitis saati
- Aciklama

Aksiyonlar:

- Yeni tatil
- Tatil detayini gor
- Tatil duzenle
- Tatil sil

Risk notlari:

- Tatil tanimi eksikse makine kapasitesi ve Gantt planlari fazla kapasite hesaplar.
- Kismi gun tatillerinde saat araligi yanlis girilirse vardiya ve kapasite planlari sapar.

### Vardiyalar

Route: `/admin/tanimlar?tab=vardiyalar`

Ana amac:

Operator ve uretim planlama icin vardiya saatlerini yonetir.

Alanlar:

- Ad
- Baslangic saati
- Bitis saati
- Aktiflik
- Aciklama

Aksiyonlar:

- Yeni vardiya
- Vardiya duzenle
- Vardiya sil

Risk notlari:

- Vardiya saatleri yanlis tanimlanirsa operator kayitlari ve vardiya analizi hatali sure hesaplar.
- Aktif olmayan vardiyalar planlama ekranlarinda kullanilmamalidir.

### Hafta Sonu Planlari

Route: `/admin/tanimlar?tab=hafta-sonu-planlari`

Ana amac:

Normalde calisilmayan hafta sonu gunlerinde hangi makinelerin calisacagini planlar.

Alanlar:

- Hafta/gun tarihi
- Gun tipi
- Makine veya makineler
- Aciklama

Gun tipleri:

- Cumartesi
- Pazar

Liste alanlari:

- Tarih
- Gun tipi
- Makine rozetleri
- Aksiyonlar

Risk notlari:

- Hafta sonu planlari kapasite hesabini etkiler; yanlis makine secimi Gantt planini bozar.
- Hafta sonu calisma planlari tatil gunleriyle cakisirsa kapasite yorumu karisabilir.
- Coklu makine seciminde tum secilen makinelerin gercekten calisacagi teyit edilmelidir.

### Backend Etkileri

Ilgili endpoint aileleri:

- `/admin/makine-havuzu`
- `/admin/makine-havuzu/:id/capacity`
- `/admin/tanimlar/kaliplar`
- `/admin/tanimlar/kaliplar/:kalipId/uyumlu-makineler`
- `/admin/tanimlar/tatiller`
- `/admin/tanimlar/vardiyalar`
- `/admin/tanimlar/durus-nedenleri`
- `/admin/tanimlar/hafta-sonu-planlari`
- `/admin/tanimlar/birimler`
- `/admin/categories`
- `/admin/subcategories`

Etkilenen moduller:

- Urunler
- Receteler
- Uretim emirleri
- Makine kuyrugu
- Gantt plani
- Operator ekrani
- Vardiya analizi
- Stok ve birim donusumleri

### Genel Riskler

- Bu sayfalardaki kayitlar operasyonel ana veri niteligindedir; yanlis tanim butun uretim akisini etkileyebilir.
- Silme islemleri gecmis kayitlar tarafindan kullanilan referanslari zayiflatabilir.
- Kapasiteyi etkileyen tanimlardan sonra Gantt ve makine is yuku tekrar kontrol edilmelidir.
- Kategori ve birim degisiklikleri urun formu, stok ve recete davranisini etkiler.
- Kalip-makine uyumlulugu degistiginde mevcut atanmamis operasyonlar yeniden degerlendirilmelidir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/makineler` sayfasini ac.
3. Makine arama ve durum filtresini dene.
4. Bir makine satirini genislet ve kapasite ozetini kontrol et.
5. Yeni makine olustur, duzenle ve pasif/bakim durumunu kontrol et.
6. `/admin/tanimlar?tab=kaliplar` sayfasini ac.
7. Yeni kalip olustur ve uyumlu makine matrisinde secim yapip kaydet.
8. Duruş nedenleri sekmesinde yeni neden olustur, arama ve kategori rozetini kontrol et.
9. Birimler sekmesinde yeni birim olustur, aktif/pasif durumunu kontrol et.
10. Kategoriler sekmesinde varsayilan birim, kod prefixi ve tedarik tipi alanlarini kontrol et.
11. Tatiller sekmesinde kismi gun tatili olustur ve detayini gor.
12. Vardiyalar sekmesinde aktif vardiya olustur.
13. Hafta sonu planinda cumartesi veya pazar icin makine secerek plan olustur.
14. Makine kapasite detayinda tatil ve hafta sonu planinin yansidigini kontrol et.
15. Gantt veya uretim emri ekraninda kapasite etkisinin bozulmadigini dogrula.

Otomasyon smoke:

```bash
bun test src/modules/tanimlar
```

Uretim tanimlari DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/tanimlar/__tests__/uretim_tanimlari.real.integration.test.ts
```

Calisma planlari DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/tanimlar/__tests__/calisma_planlari.real.integration.test.ts
```

Makine havuzu smoke:

```bash
bun test src/modules/makine_havuzu
```

## 11. Is Ortaklari

Bu bolum musteri ve tedarikci ana verilerini dokumante eder.

Kapsanan sayfalar:

- `/admin/musteriler`
- `/admin/musteriler/[id]`
- `/admin/tedarikci`
- `/admin/tedarikci/[id]`

### Sayfanin Amaci

Is ortaklari sayfalari, satis ve satin alma sureclerinde kullanilan firma kartlarini yonetir.

Musteriler:

- Satis siparislerinde secilen cari karttir.
- Sevkiyat ekraninda musteri bazli gruplama ve siparissiz sevk icin kullanilir.
- Musteri iskontosu satis siparisi fiyat hesaplarina yansir.

Tedarikciler:

- Satin alma siparislerinde secilen cari karttir.
- Mal kabul ekraninda tedarikci bilgisini besler.
- Tedarikci detayinda satin alma siparisleri takip edilir.

### Musteriler Liste

Route: `/admin/musteriler`

Ana kullanim:

Admin kullanicisi musteri kartlarini arar, filtreler, olusturur, duzenler, detayina gider veya siler.

Liste davranislari:

- Varsayilan acilista `tur=musteri` filtresi uygulanir.
- URL'deki `tur` parametresi ilk filtre degerini belirler.
- Arama alani backend'e `q` parametresi olarak gider.
- Tur filtresi `musteri`, `tedarikci` veya tum kayitlar olarak kullanilabilir.
- Yenile butonu liste sorgusunu tekrar calistirir.

Liste kolonlari:

- Kod
- Tur
- Ad
- Ilgili kisi
- Telefon
- E-posta
- Iskonto
- Aksiyonlar

Aksiyonlar:

- Detay goruntule
- Duzenle
- Sil

Silme davranisi:

Silme oncesi onay penceresi acilir. Backend iliskili kayit varsa `musteri_bagimliligi_var` benzeri hata doner ve kayit silinmez.

### Musteri Formu

Form sagdan acilan sheet icinde calisir.

Alanlar:

- Tur
- Kod
- Ad
- Ilgili kisi
- Telefon
- E-posta
- Adres
- Sevkiyat notu
- Iskonto
- Aktiflik

Zorunlu alanlar:

- Ad
- Kod alaninda sistem yeni kayit icin onerilen kodu getirir.

Validasyon:

- E-posta formati gecersizse kayit reddedilir.
- Iskonto `0-100` arasinda olmalidir.

Kod davranisi:

- Yeni musteri icin siradaki kod `/admin/musteriler/next-kod?tur=musteri` endpointinden gelir.
- Yeni tedarikci tipi secilirse kod onerisi `TED-` serisine gore degisir.
- Kullanici kodu elle degistirebilir.

### Musteri Detay

Route: `/admin/musteriler/[id]`

Ana kullanim:

Tek musteri kartinin iletisim, satis ve durum ozetini gosterir.

Ust aksiyonlar:

- Listeye geri don
- Yenile
- Musterinin satis siparislerine git: `/admin/satis-siparisleri?musteriId=:id`

Ozet kartlari:

- Iletisim: ilgili kisi, telefon, e-posta
- Satis: toplam siparis, acik siparis
- Durum: iskonto, aktif/pasif, adres

Satis siparisleri tablosu:

- Siparis no
- Siparis tarihi
- Termin tarihi
- Durum
- Satis siparisi detay linki

Acik siparis hesabi:

`kapali`, `iptal`, `tamamlandi` durumlari acik siparis sayimina dahil edilmez.

### Tedarikciler Liste

Route: `/admin/tedarikci`

Ana kullanim:

Admin kullanicisi tedarikci kartlarini arar, olusturur, duzenler, detayina gider veya siler.

Liste davranislari:

- Arama alani backend'e `q` parametresi olarak gider.
- Liste tedarikci ozetlerini satin alma bilgileriyle beraber gosterir.
- Yenile butonu liste sorgusunu tekrar calistirir.

Liste kolonlari:

- Ad
- Kod
- Ilgili kisi
- Telefon
- E-posta
- Adres
- Toplam siparis
- Acik siparis
- Iskonto
- Durum
- Aksiyonlar

Aksiyonlar:

- Detay goruntule
- Duzenle
- Sil

### Tedarikci Formu

Form sagdan acilan sheet icinde calisir.

Alanlar:

- Kod
- Ad
- Ilgili kisi
- Telefon
- E-posta
- Adres
- Iskonto
- Aktiflik

Zorunlu alanlar:

- Kod
- Ad

Validasyon:

- E-posta formati gecersizse kayit reddedilir.
- Iskonto `0-100` arasinda olmalidir.

Kod davranisi:

- Yeni tedarikci icin siradaki kod `/admin/musteriler/next-kod?tur=tedarikci` endpointinden gelir.
- Tedarikci kodu `TED-` serisi ile onerilir.

### Tedarikci Detay

Route: `/admin/tedarikci/[id]`

Ana kullanim:

Tek tedarikci kartinin iletisim, satin alma ve durum ozetini gosterir.

Ust aksiyonlar:

- Listeye geri don
- Yenile
- Tedarikcinin satin alma siparislerine git: `/admin/satin-alma?tedarikciId=:id`

Ozet kartlari:

- Iletisim: ilgili kisi, telefon, e-posta
- Satin alma: toplam siparis, acik siparis, son siparis tarihi
- Durum: iskonto, aktif/pasif, adres

Satin alma siparisleri tablosu:

- Siparis no
- Siparis tarihi
- Termin tarihi
- Durum
- Satin alma detay linki

### Backend Etkileri

Ilgili endpoint aileleri:

- `/admin/musteriler`
- `/admin/musteriler/next-kod`
- `/admin/musteriler/:id`
- `/admin/tedarikci`
- `/admin/tedarikci/:id`
- `/admin/satis-siparisleri?musteriId=:id`
- `/admin/satin-alma?tedarikciId=:id`

Etkilenen moduller:

- Satis siparisleri
- Sevkiyat
- Uretim emirleri musteri ozeti
- Satin alma
- Mal kabul
- Dashboard ozetleri
- Audit loglari

### Genel Riskler

- Musteri karti silinirse veya pasife alinirsa yeni satis siparisi ve sevkiyat akislarinda secim karisabilir.
- Tedarikci karti silinirse satin alma ve mal kabul kayitlari referans kaybedebilir.
- Iskonto oranlari siparis tutarlarini etkiler; yanlis oran fiyat hesaplarini bozar.
- Musteri ve tedarikci kodlari muhasebe/cari entegrasyonu icin kullaniliyorsa elle degisiklik risklidir.
- Ayni firmanin hem musteri hem tedarikci olarak farkli kayitlarda tutulmasi raporlarda cift gorunume yol acabilir.
- Aktif olmayan is ortaginin eski siparislerde gorunmesi normaldir; yeni siparislerde kullanilip kullanilmadigi ayrica kontrol edilmelidir.
- Tedarikci sayfasi ile musteriler sayfasindaki `tur=tedarikci` verisi arasinda davranis farki kullaniciyi sasirtabilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/musteriler` sayfasini ac.
3. Arama alaninda musteri adi veya kodu ile filtrele.
4. Tur filtresini `musteri`, `tedarikci` ve tum kayitlar arasinda degistir.
5. Yeni musteri olustur; onerilen kodun geldigini kontrol et.
6. Musteriyi duzenle, iskonto ve aktiflik alanini kaydet.
7. Musteri detayina git; iletisim, satis ozeti ve siparis tablosunu kontrol et.
8. Satis siparisleri butonunun musteri filtresiyle acildigini dogrula.
9. Iliskili siparisi olan musteri icin silme denemesinde hata mesajini kontrol et.
10. `/admin/tedarikci` sayfasini ac.
11. Arama alaninda tedarikci adi veya kodu ile filtrele.
12. Yeni tedarikci olustur; `TED-` kod onerisini kontrol et.
13. Tedarikciyi duzenle, iskonto ve aktiflik alanini kaydet.
14. Tedarikci detayina git; satin alma ozeti ve siparis tablosunu kontrol et.
15. Satin alma siparisleri butonunun tedarikci filtresiyle acildigini dogrula.
16. Iliskili satin alma kaydi olan tedarikci icin silme denemesinde kaydin korunup korunmadigini kontrol et.

Otomasyon smoke:

```bash
bun test src/modules/musteriler
```

Is ortaklari DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/musteriler/__tests__/is_ortaklari.real.integration.test.ts
```

## 12. Makine Is Yukleri

Route: `/admin/is-yukler`

### Sayfanin Amaci

Makine Is Yukleri sayfasi, makinelere atanmis uretim operasyonlarini kuyruk bazinda gosterir ve siralama/atama degisikligi yapmayi saglar.

Bu ekran uretim planlama icin kritik bir operasyon ekranidir:

- Hangi makinede hangi islerin bekledigini gosterir.
- Makine bazli toplam is, aktif is ve toplam sure ozetini verir.
- Surukle-birak ile islerin sirasi degistirilebilir.
- Bekleyen is baska makineye tasinabilir.
- Degisikliklerden sonra Gantt ve makine kuyrugu cacheleri yenilenir.

### Kim Kullanir

Ana kullanici:

- Admin
- Uretim planlama sorumlusu

Yetki:

- Navigation tarafinda `is_yukler` izni admin ve operator rol gruplarinda tanimlidir.
- Admin menude `/admin/is-yukler` olarak gorunur.
- Backend endpointleri `admin.is_yukler` guard'i ile korunur.

### Ana Ekran Bolumleri

Ust alan:

- Sayfa basligi
- Makine sayisi
- Toplam is sayisi
- Aktif is sayisi
- Makine filtresi
- Tamamlananlari goster/gizle butonu
- Liste/grid gorunum secimi
- Yenile butonu

Makine gruplari:

- Her makine kendi panelinde gosterilir.
- Panel basliginda makine kodu ve adi yer alir.
- Panel ozetinde is sayisi, aktif is sayisi, toplam sure ve son bitis zamani gorunur.

Is satiri/karti:

- Sira
- Uretim emri no
- Urun kodu
- Urun/operasyon adi
- Musteri adi
- Planlanan miktar
- Hazirlik + planlanan sure
- Termin tarihi
- Planlanan baslangic ve bitis
- Durum rozeti
- Montaj rozeti

### Liste ve Grid Gorunumleri

Liste gorunumu:

- Daha yogun ve satir bazli kullanim icindir.
- Miktar, musteri, sure, termin ve planlanan tarihleri tek satirda gosterir.
- Termin riski varsa tarih kirmizi ve uyari ikonu ile gosterilir.

Grid gorunumu:

- Daha kompakt kart yapisi kullanir.
- Emir no, operasyon, miktar, sure, termin ve musteri bilgisi kart icinde gruplanir.
- Makine panelleri icinde ayni surukle-birak davranisini korur.

### Filtreler

Makine filtresi:

- Varsayilan deger `hepsi`.
- Secili makine varsa sadece o makinenin kuyrugu gosterilir.
- Tum makineler seciliyken yalnizca kuyrugunda is olan makineler listelenir.

Tamamlananlari goster:

- Varsayilan olarak tamamlanan ve iptal isler gizlenir.
- Buton aktif edilirse backend'e `tamamlananlariGoster=true` parametresi gider.
- Tamamlanan isler gorunse bile siralama icin kilitli kabul edilir.

Yenile:

- Liste sorgusunu tekrar calistirir.
- Planlama veya operator ekraninda ayni anda degisiklik yapildiysa gorunumu tazelemek icin kullanilir.

### Surukle-Birak Davranisi

Sayfa `@dnd-kit` ile surukle-birak destekler.

Desteklenen islemler:

- Ayni makine icinde bekleyen isin sirasini degistirme
- Bekleyen isi baska makine kuyruğuna tasima

Kilitli durumlar:

- `calisiyor` durumundaki is tasinamaz.
- `tamamlandi` durumundaki is tasinamaz.
- Ayni makine icinde calisan isin konumunu bozacak tasima engellenir.
- Hedef makinede calisan/tamamlanan islerin onune birakma davranisi guvenli siraya cekilir.

Kayit davranisi:

- Surukle-birak sonrasi frontend once lokal listeyi gunceller.
- Ardindan `/admin/is-yukler/:id` endpointine `PATCH` istegi atar.
- Istenen alanlar: `makineId`, `sira`.
- Backend sira guncellemesi basarili olursa kullaniciya basari mesaji gosterilir.
- Hata olursa liste eski backend verisine geri sarilir.

### Backend Etkileri

Ilgili endpointler:

- `GET /admin/is-yukler`
- `GET /admin/is-yukler/:id`
- `POST /admin/is-yukler`
- `PATCH /admin/is-yukler/:id`
- `DELETE /admin/is-yukler/:id`

Liste sorgu parametreleri:

- `makineId`
- `tamamlananlariGoster`
- `limit`
- `offset`

Patch alanlari:

- `makineId`
- `uretimEmriId`
- `sira`
- `planlananSureDk`
- `durum`

Backend davranisi:

- Liste verisi `makine_kuyrugu`, `makineler`, `uretim_emirleri`, `uretim_emri_operasyonlari` ve `urunler` tablolarindan birlestirilir.
- Varsayilan listede `tamamlandi` ve `iptal` durumlari gizlenir.
- Sira veya makine degisirse kaynak ve hedef makine kuyruklari yeniden siralanir.
- Makine degistirme operasyon bazli kayitta `uretim_emri_operasyonlari.makine_id` alanini da gunceller.
- Degisiklikten sonra `recalcMakineKuyrukTarihleri` calisir.
- Silme durumunda operasyonun makine ve planlanan tarih bilgileri temizlenir, kuyruk yeniden siralanir.

Frontend cache etkileri:

- `IsYukleri`
- `MakineKuyrugu`
- `Gantt`
- Silme durumunda `UretimEmirleri`

### Bagli Moduller

Bu ekran asagidaki modullerle dogrudan baglidir:

- Uretim emirleri
- Makine havuzu
- Gantt plani
- Operator ekrani
- Recete ve urun operasyonlari
- Stok rezervasyonlari
- Vardiya, tatil ve hafta sonu planlari

### Genel Riskler

- Yanlis sira degisikligi termin gecikmesine neden olabilir.
- Is baska makineye tasinirken makine-urun/operasyon uyumlulugu yeterince kontrol edilmezse gercek uretimde hatali atama olusabilir.
- Calisan isin etrafina yapilan siralama, operator ekranindaki aktif is algisini etkileyebilir.
- Aynı anda birden fazla planlamaci ayni kuyrugu degistirirse ekran rollback etse bile kullanici son durumdan emin olmak icin yenileme yapmalidir.
- Tamamlananlari goster acikken terminal islerin kuyrukta gorunmesi kullaniciyi sasirtabilir.
- Planlanan sure hataliysa Gantt, kapasite ve son bitis ozetleri hatali gorunur.
- Makine degisikligi operasyon kaydina da yansidigi icin uretim emri detayindaki makine bilgisi degisir.
- Kuyruktan silme operasyonu uretim emrini tekrar atanmamis hale getirebilir ve stok/rezervasyon davranisini etkileyebilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/is-yukler` sayfasini ac.
3. Tum makineler gorunumunde kuyrugu olan makinelerin listelendigini kontrol et.
4. Makine filtresinden tek makine sec ve sadece o makinenin islerini gor.
5. Liste ve grid gorunumleri arasinda gecis yap.
6. Tamamlananlari goster butonunu ac/kapat.
7. Bekleyen bir isi ayni makine icinde farkli siraya surukle.
8. Basari mesajini ve yeni sira numaralarini kontrol et.
9. Bekleyen bir isi baska makine paneline tasi.
10. Uretim emri detayinda operasyon makinesinin degistigini kontrol et.
11. Gantt ekraninda planlanan tarihlerin guncellendigini dogrula.
12. Calisan veya tamamlanmis isi tasimayi dene; tasimanin engellendigini kontrol et.
13. Termin riski olan islerde uyari renginin gorundugunu kontrol et.
14. Yenile butonu ile backend son durumunun ekrana yansidigini dogrula.

Otomasyon smoke:

```bash
bun test src/modules/is_yukler
```

Makine is yukleri DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/makine_havuzu/__tests__/makine_is_yukleri.real.integration.test.ts
```

Kuyruk siralama DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/makine_havuzu/__tests__/kuyruk_sirala.integration.test.ts
```

## 13. Operator Ekrani

Route: `/admin/operator`

### Sayfanin Amaci

Operator Ekrani, makine uzerindeki aktif uretim islerini canli operasyon modunda yonetmek icin kullanilir.

Bu ekranla yapilan temel islemler:

- Makine kuyrugundaki siradaki isi baslatma
- Calisan isi duraklatma
- Duraklatilmis ise devam etme
- Vardiya ici gunluk uretim girisi yapma
- Isi bitirme
- Uretim miktari ve fire kaydi tutma
- Aktif vardiya durumunu izleme

### Kim Kullanir

Ana kullanici:

- Operator
- Uretim sorumlusu
- Admin

Yetki:

- Backend endpointleri `admin.operator` guard'i ile korunur.
- Navigation izinlerinde `operator` ekrani admin ve operator rollerine baglanabilir.
- Admin panelde `/admin/operator` route'u uzerinden acilir.

### Ana Ekran Bolumleri

Ust zaman alani:

- Anlik saat
- Tarih
- Aktif makine/vardiya sayisi

Vardiya durumu:

- Makine kodu
- Makine adi
- Vardiya acik/kapali durumu
- Vardiya tipi
- Vardiya baslangic saati

Makine is kartlari:

- Her makine kendi bolumunde gosterilir.
- Aktif is varsa buyuk uretim karti olarak one cikar.
- Aktif is yoksa siradaki bekleyen is baslatilabilir.
- Kuyruktaki sonraki isler yatay kartlar olarak listelenir.

Aktif is karti:

- Emir no
- Urun adi
- Urun kodu
- Operasyon adi
- Planlanan miktar
- Uretilen miktar
- Fire miktari
- Tamamlanma yuzdesi
- Durum etiketi

### Kuyruk Davranisi

Operator ekraninda tamamlanmis isler gosterilmez.

Makine bazli gruplama:

- Liste `/admin/operator/kuyruk` endpointinden gelir.
- Kayitlar makineye gore gruplanir.
- Her makinede yalnizca bir aktif is beklenir.

Baslatilabilir is:

- Sadece `bekliyor` durumundaki is baslatilabilir.
- Makinede aktif is yoksa ilk bekleyen is icin `BASLAT` butonu aktif olur.
- Siradaki olmayan bekleyen isler `SIRADA` olarak gorunur.

### Uretim Baslat

Aksiyon:

- `POST /admin/operator/baslat`

Payload:

- `makineKuyrukId`

Backend kontrolleri:

- Kuyruk kaydi var mi?
- Kayit `bekliyor` durumunda mi?
- Makine bugun calisiyor mu?
- Ayni makinede `calisiyor` veya `duraklatildi` durumda baska is var mi?
- Gerekirse otomatik vardiya kaydi acilabilir.

Basarili baslatma etkileri:

- Makine kuyrugu `calisiyor` olur.
- Ilgili uretim emri operasyonu `calisiyor` olur.
- Parent uretim emri `planlandi` ise `uretimde` olur.
- Satis siparisi kalemleri `uretiliyor` durumuna ilerleyebilir.

Olası hata mesajlari:

- `kuyruk_kaydi_bulunamadi`
- `sadece_bekliyor_baslatilabilir`
- `makinede_aktif_is_var`
- `makine_bugun_calismiyor`

### Gunluk Uretim Girisi

Aksiyon:

- `POST /admin/operator/gunluk-giris`

Payload:

- `makineId`
- `vardiyaKayitId` opsiyonel
- `uretilenMiktar`
- `fireMiktar`
- `birimTipi`
- `notlar`

Kullanim:

Operator, isin tamamini bitirmeden vardiya icindeki ek uretim miktarini girer.

Onemli davranis:

- Bu alana toplam is miktari degil, yalnizca vardiyada uretilen ek miktar girilir.
- Net miktar `uretilenMiktar - fireMiktar` olarak hesaplanir.
- Uretim emri ve operasyon uretim miktari artimli guncellenir.
- Stok takibi aktif urunlerde mamul stok girisi olusabilir.
- Recete varsa hammadde tuketimi ve stok hareketi yazilir.

Validasyon:

- `uretilenMiktar` sifirdan buyuk olmalidir.
- `fireMiktar` negatif olamaz.

Olası hata mesajlari:

- `aktif_uretim_bulunamadi`
- `vardiya_kaydi_bulunamadi`
- `makine_bugun_calismiyor`

### Uretim Duraklat

Aksiyon:

- `POST /admin/operator/duraklat`

Payload:

- `makineKuyrukId`
- `durusNedeniId`
- `neden`
- `anlikUretimMiktari`

Form alanlari:

- Durus nedeni
- Durus notu
- Anlik uretim miktari

Backend etkileri:

- Makine kuyrugu `duraklatildi` olur.
- Ilgili uretim emri operasyonu `duraklatildi` olur.
- `durus_kayitlari` tablosuna acik durus kaydi yazilir.
- Satis siparisi kalemleri `duraklatildi` durumuna gecebilir.

### Uretime Devam Et

Aksiyon:

- `POST /admin/operator/devam-et`

Payload:

- `makineKuyrukId`
- `uretilenMiktar` opsiyonel
- `fireMiktar`
- `birimTipi`
- `notlar`

Backend etkileri:

- Makine kuyrugu yeniden `calisiyor` olur.
- Ilgili operasyon `calisiyor` olur.
- Acik durus kaydinin bitis zamani ve sure bilgisi yazilir.
- Gerekirse durus sonunda girilen artimli uretim kaydi islenir.
- Makine arizali durumdaysa tekrar aktif hale getirilebilir.
- Kalan kuyruk planlari durus suresine gore kaydirilir.
- Satis siparisi kalemleri tekrar `uretiliyor` durumuna alinabilir.

### Uretim Bitir

Aksiyon:

- `POST /admin/operator/bitir`

Payload:

- `makineKuyrukId`
- `uretilenMiktar`
- `fireMiktar`
- `birimTipi`
- `notlar`

Form davranisi:

- Baslangicta uretilen miktar alanina planlanan miktar yazilir.
- Daha once girilmis gunluk olcum varsa formda onceki uretim ve fire ozetleri gosterilir.
- Fire miktari ayrica girilir.
- Montaj islerinde birim tipi `takim`, diger islerde `adet` olarak gonderilir.

Backend etkileri:

- Makine kuyrugu `tamamlandi` olur.
- Gercek bitis zamani yazilir.
- Gunluk operator kaydi `tamamlandi` olarak eklenir.
- Uretim emri operasyonu tamamlanir.
- Tek operasyonlu veya montaj etkili operasyonlarda parent uretim emrinin uretilen miktari guncellenir.
- Stok takibi aktifse mamul stok hareketi yazilir.
- Recete hammadde tuketimi islenir.
- Tum operasyonlar bittiyse uretim emri `tamamlandi` olur.
- Bagli satis siparisi kalemleri `uretim_tamamlandi` durumuna ilerleyebilir.
- Admin bildirimi olusturulabilir.

### Vardiya Durumu

Ekran vardiyalari operatorun elle baslatmasindan cok sistem tarafindan yonetilen bir durum olarak gosterir.

Ilgili endpoint:

- `GET /admin/operator/acik-vardiyalar`

Gosterilen alanlar:

- Makine
- Acik vardiya id
- Vardiya tipi
- Baslangic saati

Not:

Uretim baslatma veya gunluk giris sirasinda makinenin bugunku calisma plani ve vardiya durumu backend tarafinda kontrol edilir.

### Backend Etkileri

Ilgili endpointler:

- `GET /admin/operator/kuyruk`
- `POST /admin/operator/baslat`
- `POST /admin/operator/bitir`
- `POST /admin/operator/duraklat`
- `POST /admin/operator/devam-et`
- `GET /admin/operator/acik-vardiyalar`
- `POST /admin/operator/vardiya-basi`
- `POST /admin/operator/vardiya-sonu`
- `POST /admin/operator/gunluk-giris`
- `GET /admin/operator/gunluk-girisler`
- `GET /admin/operator/duruslar`

Etkilenen tablolar/moduller:

- `makine_kuyrugu`
- `uretim_emirleri`
- `uretim_emri_operasyonlari`
- `operator_gunluk_kayitlari`
- `durus_kayitlari`
- `vardiya_kayitlari`
- `urunler`
- `hareketler`
- `siparis_kalemleri`
- `notifications`
- Stoklar
- Satis siparisleri
- Makine is yukleri
- Dashboard

Frontend cache etkileri:

- `MakineKuyrugu`
- `UretimEmirleri`
- `IsYukleri`
- `Stoklar`
- `GunlukGirisler`
- `Vardiyalar`
- `Makineler`
- `Hareketler`
- `Dashboard`
- `SatisSiparisleri`

### Genel Riskler

- Gunluk uretim girisinde toplam miktar yerine ek vardiya miktari girilmelidir; aksi halde uretim ve stok fazla yazilir.
- Bitirme ekraninda girilen miktar, onceki gunluk kayitlarla birlikte nihai uretim toplamini etkiler.
- Fire miktari yanlis girilirse net uretim ve hammadde tuketimi sapar.
- Makine bugun calismiyor hatasi vardiya, tatil veya hafta sonu planindan kaynaklanabilir.
- Duraklatma icin durus nedeni secilmezse raporlama eksik kalir.
- Duraklatilan is devam ettirilmezse acik durus kaydi vardiya analizini bozar.
- Ayni makinede birden fazla aktif is olusmasi engellenir; hata alinirse makine kuyrugu kontrol edilmelidir.
- Montaj/tek tarafli operasyon ayrimi stok etkisini degistirir; yanlis operasyon tanimi stok hareketlerini etkiler.
- Operator ekraninda yapilan bitirme satis siparisi kalem durumlarini da ilerletebilir.
- Hammadde tuketimi receteye bagli oldugu icin recete hatasi stok cikislarini yanlislastirir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin/operator yetkili kullanici ile login ol.
2. `/admin/operator` sayfasini ac.
3. Ust saat ve vardiya durumu alaninin gorundugunu kontrol et.
4. Makine kartlarinda kuyruktaki islerin listelendigini dogrula.
5. Aktif isi olmayan makinede ilk bekleyen is icin `BASLAT` butonunu kontrol et.
6. Isi baslat ve durumun `URETIMDE`/`calisiyor` oldugunu dogrula.
7. Gunluk uretim girisi ac, ek uretim ve fire miktari kaydet.
8. Uretilen/fire ozetinin guncellendigini kontrol et.
9. Duraklat formunu ac, durus nedeni sec ve isi duraklat.
10. Durumun `DURAKLATILDI` oldugunu kontrol et.
11. Devam et formundan isi yeniden baslat.
12. Durus kaydinin kapandigini ve is durumunun `calisiyor` oldugunu dogrula.
13. Bitir formunu ac; onceki olcumler, uretilen miktar, fire ve not alanlarini kontrol et.
14. Isi bitir ve kuyrukta tamamlanmis isin gizlendigini kontrol et.
15. Uretim emri detayinda operasyon ve emir durumunu kontrol et.
16. Stok ve hareketler ekraninda uretim girisi/hammadde cikisi etkilerini kontrol et.
17. Satis siparisi kalem durumunun uretim surecine gore ilerledigini kontrol et.

Otomasyon smoke:

```bash
bun test src/modules/operator
```

Operator DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/operator/__tests__/operator.real.integration.test.ts
```

Vardiya DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/operator/__tests__/vardiya.integration.test.ts
```

## 14. Gantt Plani

Route: `/admin/gantt`

### Sayfanin Amaci

Gantt Plani, makine bazli uretim kuyrugunu zaman cizelgesi uzerinde izlemek icin kullanilir.

Bu ekran planlamaciya sunlari gosterir:

- Makine bazli is cubuklari
- Islerin planlanan/gercek baslangic ve bitis zamanlari
- Uretim ilerleme yuzdesi
- Durum renkleri
- Tatil, hafta sonu ve durus bloklari
- Bugun cizgisi
- Makine ve durum bazli filtreleme

### Kim Kullanir

Ana kullanici:

- Admin
- Uretim planlama sorumlusu
- Uretim takip sorumlusu

Yetki:

- Backend endpointleri `admin.gantt` guard'i ile korunur.
- Sayfa admin panelde `/admin/gantt` route'u uzerinden acilir.

### Ana Ekran Bolumleri

Ust kontrol alani:

- Sayfa basligi
- Toplam is sayisi
- Zaman araligi presetleri
- Onceki/sonraki aralik butonlari
- Bugune git butonu
- Yenile butonu

Ozet alani:

- Makine sayisi
- Toplam is emri sayisi
- Secili araliga gore maksimum is gunu ozet bilgisi

Filtre alani:

- Baslangic tarihi
- Bitis tarihi
- Arama
- Durum filtresi
- Makine filtresi
- Gorunum secimi
- Filtre sifirlama

Gantt tablo alani:

- Sol sabit makine listesi
- Ust ay/gun kolonlari
- Sag yatay scroll edilebilir zaman cizelgesi
- Her makine icin is cubuklari ve zaman bloklari

### Zaman Araligi Presetleri

Presetler:

- Gunluk
- 3 Gun
- Haftalik
- Aylik
- 3 Aylik

Kolon genisligi presetlere gore degisir:

- Gunluk gorunum daha genis kolon kullanir.
- 3 aylik gorunum daha dar kolon kullanir.

Davranis:

- Preset secildiginde baslangic bugune alinir.
- Bitis tarihi preset uzunluguna gore hesaplanir.
- Onceki/sonraki butonlari secili preset uzunlugu kadar araligi kaydirir.
- Bugune git butonu yatay scroll pozisyonunu bugun kolonuna yaklastirir.

### Filtreler

Tarih filtreleri:

- `baslangic`
- `bitis`

Arama:

Arama backend'e `q` parametresi olarak gider ve su alanlarda arar:

- Uretim emri no
- Satis siparisi no
- Urun kodu
- Urun adi
- Musteri adi
- Makine kodu
- Makine adi
- Operasyon adi

Durum filtresi:

- `bekliyor`
- `calisiyor`
- `duraklatildi`
- `tamamlandi`
- `iptal`

Makine filtresi:

- Tum makineler
- Secili makine

Gorunum filtresi:

- `Kuyruktaki Makineler`: sadece is cubugu olan makineleri gosterir.
- `Tum Makineler`: aktif makinelerin tamamini gosterir; bos makinelerde planli is yok mesaji gorunur.

### Gantt Cubuklari

Her is cubugu su bilgileri temsil eder:

- Kuyruk id
- Makine id
- Uretim emri id
- Uretim emri no
- Satis siparisi no
- Urun kodu/adi
- Musteri ozeti
- Operasyon adi
- Montaj bilgisi
- Sira
- Baslangic tarihi
- Bitis tarihi
- Planlanan baslangic
- Planlanan bitis
- Termin tarihi
- Planlanan miktar
- Uretilen miktar
- Durum
- Duraklatma zamani
- Acik durus bilgisi

Renk/durum davranisi:

- `bekliyor`: amber tonlari
- `calisiyor`: mavi tonlari
- `duraklatildi`: turuncu tonlari
- `tamamlandi`: yesil tonlari
- `iptal`: kirmizi tonlari

Cubuk icinde:

- Operasyon adi veya emir no gosterilir.
- Yeterli genislik varsa musteri ozeti de gosterilir.
- Montaj isleri anahtar ikonu ile isaretlenir.
- Bitiş hafta sonuna denk gelirse uyari rozeti gosterilir.
- Ilerleme yuzdesi `uretilenMiktar / planlananMiktar` olarak hesaplanir.

Tooltip:

- Operasyon adi
- Musteri
- Baslangic
- Bitis
- Duraklatma zamani
- Hafta sonu uyari bilgisi
- Ilerleme
- Durum

### Zaman Bloklari

Gantt satirinda is cubuklarina ek olarak bloklar cizilir.

Blok tipleri:

- `hafta_sonu`
- `tatil`
- `durus`

Hafta sonu bloklari:

- Makine hafta sonu calismiyorsa tam gun blok olarak gosterilir.
- Hafta sonu planinda ilgili makine calisacak sekilde tanimliysa blok olusmaz.

Tatil bloklari:

- Global veya makineye ozel tatillerden gelir.
- Tam gun veya saat aralikli kesinti olarak cizilir.
- Is cubuklarinin uzerinde gorunerek planin kapali zamana denk geldigini vurgular.

Durus bloklari:

- Operator durus kayitlarindan gelir.
- Cizgili turuncu blok olarak gosterilir.
- Acik duruslarda bitis `Devam Ediyor` olarak gosterilir.
- Durus bloklari is cubuklarinin alt katmaninda kalir, boylece is cubugu okunabilir.

Bugun cizgisi:

- Secili aralik bugunu iceriyorsa kirmizi dikey cizgi olarak gosterilir.

### Backend Etkileri

Ilgili endpointler:

- `GET /admin/gantt`
- `GET /admin/gantt/:id`
- `PATCH /admin/gantt/:id`

Liste sorgu parametreleri:

- `baslangic`
- `bitis`
- `dateFrom`
- `dateTo`
- `durum`
- `q`
- `makineId`
- `limit`
- `offset`

Backend liste davranisi:

- `makine_kuyrugu`, `makineler`, `uretim_emirleri`, `uretim_emri_operasyonlari`, `urunler`, satis siparisleri ve musteriler birlestirilir.
- Aktif makineler her zaman grup olarak doner.
- Isler makine kodu, kuyruk sirasi ve planlanan baslangica gore siralanir.
- Acik calisan/duraklatilmis isler gercek bitis olmadigi icin simdiki zamana kadar uzatilarak gosterilir.
- Planlanan baslangici gecmis bekleyen islerde cubuk simdiki zamandan baslatilabilir.
- Tatiller, hafta sonu planlari ve durus kayitlari makine bloklari olarak eklenir.

Patch davranisi:

- Backend `PATCH /admin/gantt/:id` ile planlanan baslangic/bitis ve durum guncellemeyi destekler.
- Guncelleme ayni makinede baska aktif kuyruk satiri ile cakisirsa reddedilir.
- Tarih guncellenirse bagli `uretim_emri_operasyonlari` planlanan tarihleri de senkronlanir.

Not:

Mevcut frontend ekrani Gantt tarih patch mutation'ini tanimliyor, ancak aktif ekranda surukle-birak tarih duzenleme UI'i kullanmiyor. Bu nedenle mevcut kullanim agirlikli olarak izleme/filtreleme ekranidir.

### Bagli Moduller

Gantt Plani su modullerden etkilenir:

- Makine is yukleri
- Makine havuzu
- Operator ekrani
- Vardiya ve calisma planlari
- Tatil gunleri
- Hafta sonu planlari
- Durus nedenleri ve durus kayitlari
- Uretim emirleri
- Satis siparisleri

### Genel Riskler

- Tatil veya hafta sonu bloklari is cubugunun uzerine geliyorsa plan kapali zamana denk geliyor olabilir.
- Hafta sonu planlari eksikse Gantt isleri gereksiz kapali bloklarla maskeleyebilir.
- Acik durus kaydi kapanmazsa Gantt durus blogu devam ediyor gibi gorunur.
- Planlanan baslangic/bitis tarihleri hataliysa makine is yukleri ve Gantt farkli algilanabilir.
- Backend patch kullanildiginda ayni makinede cakisma kontrolu vardir; cakisma hatasi planlama revizyonu gerektirir.
- Calisan islerin bitis zamani gercek bitis olmadiginda simdiki zamana gore gosterilir; bu durum canli takip icin normaldir.
- Bekleyen isin planlanan baslangici gecmiste kaldiysa ekranda simdiki zamana kaydirilarak gosterilebilir; kaynak plan hala ayrica kontrol edilmelidir.
- Montaj operasyonu yanlis tanimlanirsa Gantt uzerindeki montaj isareti yaniltici olur.
- Makine filtresi ve "Tum Makineler" gorunumu karistirilirsa bos makineler plan yok gibi yorumlanabilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/gantt` sayfasini ac.
3. Haftalik varsayilan gorunumde makine satirlarini ve is cubuklarini kontrol et.
4. Gunluk, 3 gun, haftalik, aylik ve 3 aylik presetleri dene.
5. Onceki/sonraki aralik butonlarini kullan.
6. Bugune git butonunun scroll pozisyonunu bugune yaklastirdigini kontrol et.
7. Baslangic ve bitis tarihlerini manuel degistir.
8. Arama alaninda emir no, urun kodu veya makine kodu ile filtrele.
9. Durum filtresini bekliyor/calisiyor/duraklatildi/tamamlandi/iptal icin dene.
10. Makine filtresiyle tek makineyi sec.
11. "Kuyruktaki Makineler" ve "Tum Makineler" gorunumlerini karsilastir.
12. Tatil ve hafta sonu bloklarinin dogru makinelerde gorundugunu kontrol et.
13. Duraklatilmis is varsa turuncu durus blogu ve duraklatma tooltip bilgisini kontrol et.
14. Bitişi hafta sonuna denk gelen islerde uyari rozetini kontrol et.
15. Operator veya Makine Is Yukleri ekraninda yapilan degisikligin yenile sonrasi Gantt'a yansidigini dogrula.

Otomasyon smoke:

```bash
bun test src/modules/gantt
```

Gantt DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/gantt/__tests__/gantt.real.integration.test.ts
```

## 15. Vardiya Analizi

Route: `/admin/vardiya-analizi`

### Sayfanin Amaci

Vardiya Analizi sayfasi, operator uretim kayitlari ve durus kayitlarindan vardiya performans raporu uretir.

Bu ekran su sorulara cevap verir:

- Secili gun veya aralikta toplam kac adet uretildi?
- Makineler ne kadar calisti, ne kadar durdu?
- Ariza, kalip degisimi ve bakim sureleri ne kadar?
- Makine bazinda hedefe ulasma durumu nedir?
- Kalip bazinda hangi urunler ve makineler kullanildi?
- OEE ve durus oranlari nasil degisti?

### Kim Kullanir

Ana kullanici:

- Admin
- Uretim yoneticisi
- Planlama ve raporlama sorumlusu

Yetki:

- Sidebar'da `vardiya_analizi` admin rolune baglidir.
- Backend route'u `admin.dashboard` guard'i ile korunur.

### Ana Ekran Bolumleri

Ust kontrol alani:

- Sayfa basligi
- Secili aralik etiketi
- Gorunum sekmeleri
- Aralik presetleri
- Tarih secimi
- Bugun butonu
- Excel export
- PDF export
- Yenile butonu

Ozet kartlari:

- Toplam Uretim
- Calisma
- Durus
- Ariza
- Kalip Degisimi
- OEE

Icerik gorunumleri:

- Vardiya Bazli
- Makine Bazli
- Kalip Bazli
- Trend

Detay sheet:

- Vardiya veya makine kartina tiklandiginda sagdan acilir.
- Saatlik uretim grafigi, duruslar, uretim kayitlari ve bagli uretim emirleri gosterilir.

### Tarih ve Aralik Secimi

Aralik presetleri:

- Gun
- 7 Gun
- 30 Gun
- Ozel

Davranis:

- Gun modunda tek `tarih` parametresi kullanilir.
- 7 gun modunda secili tarihten geriye 6 gun hesaplanir.
- 30 gun modunda secili tarihten geriye 29 gun hesaplanir.
- Ozel modda `baslangicTarih` ve `bitisTarih` manuel secilir.
- Ozel aralikta tarihler ters girilirse frontend baslangic/bitis siralamasini duzeltir.
- Ana analiz sorgusu 60 saniyede bir polling ile yenilenir.

### Gorunumler

#### Vardiya Bazli

Vardiya kayitlari vardiya tipi ve durumuna gore gruplanir.

Gruplama:

- Gunduz/gece vardiyasi
- Aktif/tamamlandi durumu

Vardiya kartinda:

- Makine adi
- Operator adi
- Baslangic/bitiş saati
- Aktif veya bitti rozeti
- Baski adedi
- Urun kirilimi
- Operasyon/kalip kirilimi
- Calisma suresi
- Durus suresi
- Ariza, kalip degisimi, bakim rozetleri
- OEE

Kart tiklaninca:

- Vardiya detay sheet'i acilir.

#### Makine Bazli

Secili araliktaki vardiyalar makineye gore toplanir.

Makine kartinda:

- Makine adi
- Vardiya sayisi
- Aktif vardiya bilgisi
- Toplam uretim
- Calisma suresi
- Durus suresi
- Ariza sayisi/suresi
- Kalip degisimi sayisi/suresi
- Bakim suresi
- Operasyon/kalip kirilimi
- Ortalama cevrim saniyesi
- Teorik hedef
- Hedef gerceklesme yuzdesi
- OEE

Hedef durumu:

- `%95` ve uzeri iyi
- `%75-%94` orta
- `%75` alti dusuk

Kart tiklaninca:

- Makine bazli detay sheet'i acilir.
- Gunluk veya aralik parametreleri detay sorgusuna tasinir.

#### Kalip Bazli

Operator uretim kayitlari kalip bilgisi ile gruplanir.

Kalip kartinda:

- Kalip adi
- Kalip kodu
- Toplam uretim
- Hesaplanan calisma suresi
- Makine sayisi
- Makine listesi
- Urun sayisi
- Urun listesi
- Kalip degisimi sayisi

Not:

Kalip degisimi sayisi makine bazli toplamdan kalip sayisina yaklasik paylastirilarak hesaplanir.

#### Trend

Son 7 veya 30 gunluk trend grafigi gosterir.

Trend metrikleri:

- Uretim
- Durus dakikasi
- OEE

Trend export:

- Trend gorunumu seciliyken Excel/PDF raporu trend tablosu uzerinden uretilir.

### Detay Sheet

Detay endpointi iki sekilde calisir:

- `vardiyaKayitId` ile tek vardiya detayi
- `makineId + tarih` veya `makineId + baslangicTarih + bitisTarih` ile makine/aralik detayi

Detay icerigi:

- Saatlik uretim grafigi
- Durus tablosu
- Uretim kayitlari tablosu
- Bagli uretim emirleri

Durus tablosu:

- Baslangic
- Bitis
- Sure
- Tip/neden
- Operator

Uretim kayitlari:

- Kayit tarihi
- Urun
- Operasyon/kalip
- Net miktar
- Fire
- Operator
- Notlar

Bagli uretim emirleri:

- Emir no
- Urun adi
- Uretilen / planlanan miktar

### Excel ve PDF Export

Excel:

- HTML tabanli `.xls` dosyasi uretilir.
- Dosya adi secili gorunum ve tarih/aralik bilgisine gore sanitize edilir.

PDF:

- Yeni tarayici penceresinde print dokumani acilir.
- Tarayicinin yazdirma penceresi ile PDF ciktisi alinabilir.

Export gorunumleri:

- Vardiya bazli rapor
- Makine bazli rapor
- Kalip bazli rapor
- Trend raporu

Export metrikleri:

- Toplam Uretim
- Toplam Calisma
- Toplam Durus
- Ariza
- Kalip Degisimi
- OEE / Ortalama OEE

### Backend Etkileri

Ilgili endpointler:

- `GET /admin/vardiya-analizi`
- `GET /admin/vardiya-analizi/detay`
- `GET /admin/vardiya-analizi/trend`

Ana analiz query parametreleri:

- `tarih`
- `baslangicTarih`
- `bitisTarih`
- `makineId`

Detay query parametreleri:

- `vardiyaKayitId`
- `makineId`
- `tarih`
- `baslangicTarih`
- `bitisTarih`

Trend query parametreleri:

- `gunSayisi`
- `makineId`

Etkilenen/veri okunan tablolar:

- `vardiya_kayitlari`
- `operator_gunluk_kayitlari`
- `durus_kayitlari`
- `durus_nedenleri`
- `makineler`
- `users`
- `uretim_emirleri`
- `uretim_emri_operasyonlari`
- `urunler`
- `kaliplar`

### Hesaplama Notlari

Tarih araligi:

- Tek gun icin `00:00:00 - 23:59:59` araligi kullanilir.
- Aralik modunda baslangic ve bitis gunleri kapsanir.

Vardiya kapsami:

- Vardiya kaydi aralikla kesisiyorsa analize dahil edilir.
- Acik vardiyada bitis zamani simdiki zaman veya secili aralik bitisi ile sinirlanir.
- Operator gunluk kaydi olup gercek vardiya kaydi yoksa vardiya tanimlarindan sentetik vardiya penceresi olusturulabilir.

Uretim toplami:

- `operator_gunluk_kayitlari.net_miktar` uzerinden toplanir.
- Fire toplami `fire_miktari` uzerinden hesaplanir.
- Montaj operasyonlari baski analizinden muaf tutulur.

Durus toplami:

- `durus_kayitlari.sure_dk` varsa kullanilir.
- Sure yoksa baslangic/bitis farki hesaplanir.
- Durus tipi `ARIZ`, `KALIP`, `BAKIM` ve diger olarak ayrilir.

OEE:

- Basitlestirilmis hesap kullanilir.
- `availability = calismaSuresiDk / planlananSureDk`
- `OEE = availability * 0.95`
- Performance ve quality sabit varsayim olarak ele alinmistir.

Makine hedefi:

- Makinedeki operasyonlarin agirlikli ortalama cevrim suresi hesaplanir.
- Teorik hedef `calismaDk * 60 / ortalamaCevrimSn` olarak bulunur.
- Hedef gerceklesme yuzdesi toplam uretim / teorik hedef uzerinden hesaplanir.

Kalip rollup:

- Kalipli operasyonlardan gelen operator kayitlari kullanilir.
- Makine ve urun listeleri set olarak toplanir.
- Kalip degisim sayisi yaklasik degerdir.

### Bagli Moduller

Vardiya Analizi su modullerden veri alir:

- Operator ekrani
- Vardiya kayitlari
- Durus kayitlari
- Uretim emirleri
- Urun operasyonlari
- Kaliplar
- Makineler
- Kullanici/operator kayitlari
- Stok/hareket etkisi olan uretim kayitlari

### Genel Riskler

- Operator gunluk girisi eksikse uretim toplami eksik gorunur.
- Operator gunluk girisinde toplam miktar yerine ek miktar girilmezse analiz fazla uretim gosterir.
- Acik vardiya kapatilmazsa calisma suresi ve OEE sapabilir.
- Acik durus kaydi kapanmazsa durus suresi eksik veya yaniltici gorunebilir.
- Durus nedeni kodlari `ARIZ`, `KALIP`, `BAKIM` ile uyumlu degilse kategori kirilimi hatali olur.
- Montaj operasyonlari analizden muaf tutuldugu icin toplam mamul uretimi ile baski analizi farkli gorunebilir.
- Sentetik vardiya pencereleri gercek vardiya kaydi yokken rapor uretebilir; bu durum operator kayitlari vardiya disinda girildiginde incelenmelidir.
- OEE basitlestirilmis bir metrik oldugu icin gercek OEE gibi yorumlanmamalidir.
- Kalip degisim sayisi kalip bazinda yaklasik paylastirildigi icin kesin durus analizi yerine isaret olarak kullanilmalidir.
- PDF export popup engelleyicilere takilabilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/vardiya-analizi` sayfasini ac.
3. Gun modunda bugun icin ozet kartlarinin yuklendigini kontrol et.
4. 7 gun, 30 gun ve ozel aralik presetlerini dene.
5. Vardiya Bazli gorunumde aktif/tamamlandi gruplarini kontrol et.
6. Bir vardiya kartina tikla ve detay sheet'in acildigini dogrula.
7. Detayda saatlik uretim, duruslar, uretim kayitlari ve bagli emirleri kontrol et.
8. Makine Bazli gorunume gec ve hedef/gerceklesme barlarini kontrol et.
9. Bir makine kartina tikla ve makine detayini ac.
10. Kalip Bazli gorunume gec ve kalip/urun/makine listelerini kontrol et.
11. Trend gorunumune gec, 7 gun ve 30 gun secimlerini dene.
12. Excel export al ve dosya adinin/gorunumun dogru oldugunu kontrol et.
13. PDF export butonunun yazdirma penceresini actigini kontrol et.
14. Operator ekranindan yeni gunluk uretim girisi yapildiktan sonra yenile ile analize yansidigini dogrula.

Otomasyon smoke:

```bash
bun test src/modules/vardiya_analizi
```

Vardiya analizi DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/vardiya_analizi/__tests__/vardiya_analizi.real.integration.test.ts
```

Makine bazli baski DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/vardiya_analizi/__tests__/makine_bazli_baski.integration.test.ts
```

## 16. Hareketler

Rota: `/admin/hareketler`

### Sayfanin Amaci

Hareketler sayfasi, stok takip sistemi icinde olusan tum urun hareketlerini izlemek icin kullanilir. Admin bu ekranda giris, cikis ve duzeltme hareketlerini; sevkiyat, mal kabul, uretim, fire, manuel ve stok duzeltme kaynaklariyla birlikte gorebilir.

Sayfa ayni zamanda kontrollu manuel stok hareketi olusturmak icin kullanilir. Manuel eklenen hareket, stok takibi aktif olan urunun stok miktarini aninda etkiler.

### Kim Kullanir

Bu sayfa genellikle su roller tarafindan kullanilir:

- Admin
- Depo ve stok sorumlusu
- Uretim planlama sorumlusu
- Satin alma / mal kabul takibi yapan yetkili kullanici
- Sevkiyat surecini kontrol eden kullanici

Backend erisimi `admin.hareketler` yetkisi ile korunur.

### Ana Ekran Bolumleri

Sayfada su bolumler bulunur:

- Baslik ve toplam hareket sayisi
- Yenile butonu
- Yeni hareket butonu
- Ozet kartlari
- Arama ve filtre satiri
- Hareket tablosu
- Yeni hareket ekleme yan paneli

Ozet kartlari:

- Toplam kayit
- Toplam giris miktari
- Toplam cikis miktari
- Sevkiyat / mal kabul / duzeltme adet ozeti

### Liste, Filtre ve Arama Davranislari

Liste varsayilan olarak bugunku hareketleri getirir. Admin donem filtresini degistirerek tum hareketleri, bu haftayi veya ozel tarih araligini gorebilir.

Filtre alanlari:

- Arama: urun adi, urun kodu veya hareket aciklamasinda arama yapar.
- Hareket tipi: tum hareketler, giris, cikis, duzeltme.
- Kaynak tipi: tum kaynaklar, sevkiyat, mal kabul, stok duzeltme, manuel, uretim, fire.
- Kategori: urun kategorisine gore filtreler.
- Alt grup: secilen kategoriye bagli urun grubuna gore filtreler.
- Donem: tumu, bugun, bu hafta, ozel aralik.
- Ozel aralikta baslangic ve bitis tarihi zorunludur.

Liste en fazla 100 kaydi getirir. Backend tarafinda `limit` degeri en fazla 500 olabilir.

### Tablo Kolonlari

Tabloda su kolonlar gosterilir:

- Tarih
- Urun adi ve urun kodu
- Kaynak
- Hareket tipi
- Miktar
- Aciklama
- Olusturan kullanici

Miktar gosterimi:

- Pozitif hareketler `+` isaretiyle ve yesil tonla gosterilir.
- Cikis hareketleri negatif degerle ve uyarici renkle gosterilir.
- Duzeltme hareketleri hareket tipine gore stok etkisi uretir.

### Hareket Tipleri

Desteklenen hareket tipleri:

- `giris`: Stogu artirir.
- `cikis`: Stogu azaltir.
- `duzeltme`: Manuel duzeltme amaciyla kullanilir; mevcut backend davranisinda pozitif miktar olarak kaydedilir.

Backend `miktar` alanini pozitif ister. `cikis` hareketlerinde miktar otomatik negatif isaretli kaydedilir.

### Kaynak ve Referans Tipleri

Liste ekraninda gorulebilen kaynaklar:

- `sevkiyat`
- `mal_kabul`
- `stok_duzeltme`
- `manuel`
- `uretim`
- `fire`

Manuel hareket ekleme formunda secilebilen kaynaklar:

- Manuel
- Stok duzeltme
- Uretim
- Fire

Sevkiyat ve mal kabul kaynakli hareketler ilgili operasyonlardan otomatik uretilir; manuel formdan secilmez.

### Yeni Hareket Ekleme

Yeni hareket butonu sag tarafta form paneli acar.

Form alanlari:

- Urun: zorunludur.
- Hareket tipi: giris, cikis veya duzeltme; zorunludur.
- Kaynak: manuel, stok duzeltme, uretim veya fire; zorunludur.
- Miktar: zorunludur, pozitif sayi olmalidir, 4 ondalik hassasiyet desteklenir.
- Aciklama: opsiyoneldir, en fazla 500 karakterdir.

Kayit basarili olursa:

- Hareket kaydi olusur.
- Stok takibi aktif urunde `urunler.stok` guncellenir.
- Hareket listesi ve stok listesi cache'i yenilenir.
- Form temizlenir ve panel kapanir.

### Backend Etkileri

Liste endpoint'i:

```text
GET /admin/hareketler
```

Olusturma endpoint'i:

```text
POST /admin/hareketler
```

Backend davranislari:

- Sadece stok takibi aktif urunlerin hareketleri liste ve ozet toplamlarina dahil edilir.
- Stok takibi kapali urunlere ait hareket kaydi veritabaninda dursa bile liste/ozette gizlenir.
- Olusturan kullanici `created_by_user_id` alanina yazilir.
- Kullanici adi listede `full_name` veya email ile gosterilir.
- Cikis hareketi sonucunda stok eksiye dusecekse islem `409 stok_eksiye_dusurulemez` hatasi ile engellenir.
- Urun bulunamazsa `404 urun_bulunamadi` doner.
- Gecersiz filtre veya form verisinde `400` doner.

### Bagli Moduller

Hareketler su modullerle dogrudan iliskilidir:

- Urunler
- Stoklar
- Sevkiyat
- Mal kabul
- Satin alma
- Uretim emirleri
- Operator uretim kayitlari
- Fire / stok duzeltme surecleri
- Kullanici ve yetki sistemi

### Genel Riskler

- Stok hareketi manuel girildiginde stok miktari aninda degisir; hatali urun secimi dogrudan stok farkina yol acar.
- `duzeltme` tipi mevcut backend davranisinda pozitif miktar olarak kaydedildigi icin negatif duzeltme gerektiren senaryolarda `cikis` veya `fire` kullanimi gerekebilir.
- Stok takibi kapali urunlerin hareketleri listede gizlendigi icin, veritabaninda kayit varken ekranda gorunmeyebilir.
- Sevkiyat veya mal kabul hareketleri manuel formdan uretilmemelidir; bu kaynaklar kendi operasyon ekranlarindan olusmalidir.
- Arama ve ozetler mevcut filtrelere gore hesaplandigi icin bugun filtresi acikken gecmis hareketler toplamda gorunmez.
- Cikis hareketlerinde negatif stok engeli vardir; fiili stok sistem stokundan farkliysa kullanici hareketi kaydedemeyebilir.
- Alt grup filtresi kategori secimine baglidir; kategori secilmeden alt grup listesi bos/kapali kalir.
- Liste varsayilan 100 kayit getirdigi icin yogun hareket gunlerinde eski kayitlar pagination olmadan ekranda gorunmeyebilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/hareketler` sayfasini ac.
3. Bugun filtresiyle ozet kartlarinin ve tablonun yuklendigini kontrol et.
4. Donem filtresini `Tumu`, `Bu Hafta` ve `Ozel Aralik` olarak degistir.
5. Arama alaninda urun kodu veya urun adi ile filtrele.
6. Hareket tipi filtresinde giris, cikis ve duzeltme seceneklerini dene.
7. Kaynak filtresinde sevkiyat, mal kabul, manuel ve fire seceneklerini kontrol et.
8. Kategori sec, sonra alt grup filtresinin doldugunu kontrol et.
9. Yeni hareket panelini ac.
10. Stok takibi aktif bir urun icin manuel giris hareketi olustur.
11. Kayit sonrasi hareketin listede gorundugunu ve stok ekraninda miktarin arttigini dogrula.
12. Stogu yetersiz bir urun icin cikis hareketi deneyip `stok_eksiye_dusurulemez` hatasini dogrula.
13. Aciklama alanina uzun metin girerek 500 karakter sinirini kontrol et.

Otomasyon smoke:

```bash
bun test src/modules/hareketler
```

Hareketler DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/hareketler/__tests__/hareketler.integration.test.ts
```

Stok hareket etkisi DB entegrasyon smoke:

```bash
RUN_DB_INTEGRATION=1 bun test src/modules/uretim_emirleri/__tests__/stok_hareket.integration.test.ts
```

## 17. Kullanici Detay

Rota: `/admin/users/[id]`

Menu grubu: Sistem Yonetimi

Yetki: `admin.users`

### Sayfanin Amaci

Kullanici Detay sayfasi, secili admin panel kullanicisinin profil, ERP personel bilgileri, aktiflik durumu, rolleri, sifresi ve silme islemlerini yonetmek icin kullanilir.

Bu sayfa kullanici hesabinin ERP icindeki davranisini dogrudan etkiler. Rol degisikligi menu erisimlerini, aktiflik degisikligi login davranisini, varsayilan makine secimi operator ekranini etkileyebilir.

### Kim Kullanir

Bu sayfa genellikle su roller tarafindan kullanilir:

- Sistem admini
- Kullanici ve yetki yonetimi yapan yetkili admin
- Operator / sevkiyat / satin alma kullanicilarini tanimlayan yonetici

Backend erisimi `admin.users` yetkisiyle korunur.

### Ana Ekran Bolumleri

Sayfada su bolumler bulunur:

- Geri don butonu
- Kullanici adi ve rol/durum rozetleri
- Profil ve ERP bilgileri karti
- Aktif/pasif durum anahtari
- Rol yonetimi karti
- Sifre guncelleme karti
- Kullanici silme karti

Sayfa yuklenirken kullanici detayi `GET /admin/users/:id` endpoint'inden alinir. Kullanici bulunamazsa veya istek hata alirsa hata durumu ve tekrar dene aksiyonu gosterilir.

### Profil ve ERP Bilgileri

Profil kartinda su alanlar duzenlenebilir:

- Email
- Ad soyad
- Telefon
- ERP personel kodu
- Departman
- Ekip
- Varsayilan makine
- ERP notlari

Varsayilan makine listesi aktif makine havuzundan gelir. Bu alan ozellikle operator rolu icin kullanicinin baslangic makinesi veya operasyon baglamini hizlandirmak icin kullanilir.

Validation notlari:

- Email gecerli email formatinda olmalidir.
- Ad soyad en az 2, en fazla 100 karakterdir.
- Telefon en az 6, en fazla 50 karakterdir.
- Personel kodu, departman ve ekip en fazla 64 karakterdir.
- ERP notlari en fazla 500 karakterdir.

Profil kaydedildiginde `PATCH /admin/users/:id` cagrilir ve kullanici listesi cache'i yenilenir.

### Aktiflik Durumu

Aktif/pasif anahtari kullanicinin login durumunu belirler.

Backend endpoint:

```text
POST /admin/users/:id/active
```

Davranis:

- Kullanici pasife alinirsa panele girisi engellenir.
- Kullanici tekrar aktif edilirse backend `email_verified` alanini da aktif hale getirir.
- UI optimistik guncelleme yapar; hata olursa onceki duruma geri doner.

### Rol Yonetimi

Rol kartinda kullaniciya bir veya birden fazla rol atanabilir.

Desteklenen roller:

- `admin`
- `operator`
- `satin_almaci`
- `sevkiyatci`

Backend endpoint:

```text
POST /admin/users/:id/roles
```

Onemli davranis:

- Rol kaydi tam set olarak gonderilir.
- Backend once kullanicinin mevcut rollerini siler, sonra secili rolleri tekrar ekler.
- Bos rol listesi gonderilirse kullanicinin rol kaydi kalmayabilir.

### Sifre Guncelleme

Sifre karti adminin kullanici sifresini degistirmesini saglar.

Backend endpoint:

```text
POST /admin/users/:id/password
```

Kurallar:

- Sifre en az 8, en fazla 200 karakterdir.
- Sifre argon2 ile hashlenir.
- Sifre ataninca kullanici aktif hale getirilir.
- `email_verified` aktiflenir.
- Kullaniciya bildirim olusturulmaya calisilir.
- Mail servisi uygunsa sifre degisikligi bilgilendirme maili gonderilir.

### Kullanici Silme

Silme karti kullaniciyi sistemden kaldirir.

Backend endpoint:

```text
DELETE /admin/users/:id
```

Silme sirasinda:

- Refresh token kayitlari silinir.
- Kullanici rolleri silinir.
- Profil kaydi silinir.
- Kullanici kaydi silinir.

UI silme oncesinde tarayici `confirm` onayi ister. Islem basarili olursa kullanici `/admin/users` listesine yonlendirilir.

### Bagli Moduller

Kullanici Detay su modullerle iliskilidir:

- Auth / kullanici sistemi
- User roles
- Profiles
- Makine havuzu
- Bildirimler
- Mail servisi
- Admin permission guard
- Audit loglari
- Sistem & Ayarlar > Kullanicilar

### Sik Hata Durumlari

- Kullanici ID bulunamazsa `404 not_found` doner.
- Gecersiz email veya kisa sifre validation hatasi uretir.
- Telefon, ad soyad veya ERP alanlari validation sinirlarini asarsa istek reddedilir.
- Mail servisi hatasi sifre degistirme islemini engellemez; hata backend loguna yazilir.
- Bildirim olusturma hatasi sifre degistirme islemini engellemez; hata backend loguna yazilir.

### Genel Riskler

- Admin rolunun yanlis kisiye verilmesi tum sistem ayarlarina erisim riski dogurur.
- Mevcut tek admin pasife alinir veya silinirse sistem yonetimi kilitlenebilir.
- Rol kaydi tam set olarak gonderildigi icin secili olmayan roller kaybolur.
- Bos rol listesi kaydedilirse kullanici menusuz veya yetkisiz kalabilir.
- Sifre degisikligi kullaniciyi aktif hale getirdigi icin pasif tutulan bir hesap yanlislikla tekrar erisilebilir olabilir.
- Kullanici silme refresh token, profil ve rol kayitlarini da sildigi icin geri alinmasi zor bir islemdir.
- Varsayilan makine yanlis atanirsa operator ekraninda kullanici yanlis makineyle isleme baslayabilir.
- Email degisikligi login kimligini etkileyebilir; mevcut kullaniciya mutlaka bildirilmelidir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/sistem?tab=kullanicilar` veya `/admin/users` listesinden bir kullanici detayina gir.
3. Kullanici adi, rol rozeti ve aktif/pasif rozetinin gorundugunu kontrol et.
4. Profil alanlarinda kucuk bir not veya ERP alanini degistirip kaydet.
5. Sayfayi yenile ve degisikligin korundugunu dogrula.
6. Varsayilan makine listesinin aktif makineleri getirdigini kontrol et.
7. Aktif/pasif anahtarini test kullanicisinda degistir ve listeye yansidigini dogrula.
8. Rol kartinda bir rol secimini degistir, kaydet ve tekrar acildiginda rolu kontrol et.
9. 8 karakterden kisa sifre gir ve UI hata mesajini dogrula.
10. Test kullanicisina gecerli sifre ata; kullanicinin aktif hale geldigini kontrol et.
11. Silme islemini sadece test kullanicisinda dene; onay penceresinin geldigini ve basarili silmede listeye donuldugunu dogrula.
12. Gercek admin kullanicisinda silme veya pasife alma islemi yapma.

Otomasyon smoke:

```bash
bun test src/modules/auth
```

## 18. Profil

Rota: `/admin/profile`

Menu grubu: Sistem Yonetimi

Yetki: Login olmus kullanici

### Sayfanin Amaci

Profil sayfasi, admin panel kullanicisinin kendi hesap bilgilerini guncellemesi icin kullanilir. Kullanici bu ekranda profil resmini, adini, email adresini ve sifresini duzenleyebilir.

Bu sayfa `Kullanici Detay` ekranindan farklidir. Kullanici Detay adminin baska kullanicilari yonetmesi icindir; Profil sayfasi ise mevcut oturum sahibinin kendi hesabini yonetir.

### Ana Ekran Bolumleri

Sayfada iki ana kart bulunur:

- Kisisel Bilgiler
- Guvenlik

Kisisel Bilgiler kartinda:

- Avatar / profil resmi
- Tam ad
- Email
- Kaydet butonu

Guvenlik kartinda:

- Yeni sifre
- Sifre onayi
- Sifre degistir butonu

### Profil Bilgileri Akisi

Sayfa acildiginda iki farkli veri kaynagi kullanilir:

- `GET /profiles/me`: Profil tablosundaki ad ve avatar bilgisini getirir.
- `GET /auth/status`: Oturumdaki kullanici email bilgisini getirir.

Kaydetme sirasinda:

- Tam ad ve avatar `PUT /profiles/me` ile kaydedilir.
- Email degistiyse `PUT /auth/user` ile auth kullanicisi guncellenir.

Profil endpoint'i upsert davranir. Kullaniciya ait profil kaydi yoksa yeni profil kaydi olusturulur; varsa mevcut kayit guncellenir.

### Avatar Yukleme

Avatar alaninda kullanici gorsel dosyasi secebilir.

Yukleme endpoint'i:

```text
POST /storage/avatars/upload?path=profiles/{timestamp}-{filename}
```

Yukleme basarili olursa donen `url` avatar alanina yazilir. Kullanici daha sonra Kaydet butonuna basarak avatar URL bilgisini profil kaydina isler.

Avatar validation:

- URL en fazla 2048 karakter olabilir.
- Mutlak URL kabul edilir.
- `/` ile baslayan lokal/public path kabul edilir.
- Duz metin veya gecersiz URL reddedilir.

### Sifre Guncelleme Akisi

Sifre degistirme formu `PUT /auth/user` endpoint'ini kullanir.

Kurallar:

- Yeni sifre bos olamaz.
- Yeni sifre ve onay alani ayni olmalidir.
- Backend minimum sifre uzunlugu 6 karakterdir.
- Sifre degisince password hash guncellenir.
- Sifre degisikligi bildirimi olusturulmaya calisilir.
- Mail servisi uygunsa kullaniciya sifre degisikligi maili gonderilir.

Form basarili olursa sifre alanlari temizlenir.

### Backend Etkileri

Kullanilan endpointler:

```text
GET /profiles/me
PUT /profiles/me
GET /auth/status
PUT /auth/user
POST /storage/avatars/upload
```

Profil alanlari:

- `full_name`
- `phone`
- `avatar_url`
- `address_line1`
- `address_line2`
- `city`
- `country`
- `postal_code`

Mevcut admin UI bu sayfada yalnizca `full_name` ve `avatar_url` alanlarini kullanir. Email ve sifre profil tablosunda degil, auth kullanicisi uzerinde guncellenir.

### Bagli Moduller

Profil sayfasi su modullerle iliskilidir:

- Auth
- Profiles
- Storage / avatar upload
- Bildirimler
- Mail servisi
- Admin layout / sidebar kullanici menusu

### Sik Hata Durumlari

- Oturum yoksa profil endpoint'i `401 unauthorized` doner.
- Gecersiz avatar URL `400 validation_error` uretir.
- Email formati hataliysa auth update `400 invalid_body` doner.
- Sifreler eslesmezse backend cagrisi yapilmadan UI hata verir.
- Avatar yukleme basarisiz olursa profil resmi guncellenmez.
- Mail veya bildirim hatasi sifre degistirme islemini engellemez; backend loguna yazilir.

### Genel Riskler

- Email degisikligi login bilgisini degistirir; kullanici yeni email ile giris yapmasi gerektigini bilmelidir.
- Avatar yuklendikten sonra Kaydet'e basilmazsa gorsel URL profil kaydina islenmez.
- Storage ayarlari yanlissa avatar yukleme basarisiz olur veya public URL calismayabilir.
- Sifre degisikligi sonrasi mevcut oturum hemen kapanmayabilir; kullanici guvenlik amaciyla cikis/giris testi yapmalidir.
- Sifre minimumu backendde 6 karakterdir; giris ayarlarindaki daha guclu politika burada ayrica uygulanmiyorsa zayif sifre kabul edilebilir.
- Profil endpoint'i sosyal/adres alanlarini destekler ama mevcut UI sadece ad/avatar gunceller; kullanici daha fazla alan bekleyebilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/profile` sayfasini ac.
3. Kisisel Bilgiler ve Guvenlik kartlarinin gorundugunu kontrol et.
4. Tam ad alanini degistir ve kaydet.
5. Sayfayi yenile, ad bilgisinin korundugunu dogrula.
6. Kucuk bir avatar dosyasi yukle.
7. Yukleme basarili olduktan sonra Kaydet'e bas ve avatarin korundugunu dogrula.
8. Gecersiz email girip kaydetmeyi dene; hata beklenir.
9. Sifre ve sifre onayi farkli girildiginde UI hata mesajini dogrula.
10. Test hesabinda gecerli yeni sifre kaydet.
11. Cikis yapip yeni sifreyle tekrar giris yapildigini dogrula.

Otomasyon smoke:

```bash
bun test src/modules/profiles
bun test src/modules/auth
```

## 19. Bildirimler

Rota: `/admin/notifications`

Menu grubu: Sistem Yonetimi

Yetki: Login olmus kullanici

### Sayfanin Amaci

Bildirimler sayfasi, mevcut kullanicinin kendisine ait sistem bildirimlerini listelemek, filtrelemek, okundu/okunmadi durumunu yonetmek ve gerektiginde bildirim silmek icin kullanilir.

Sayfa admin panelin ust bildirim ikonu ve realtime bildirim akisiyle birlikte calisir. Yeni bildirim geldiginde okunmamis sayisi guncellenir; kullanici bildirim sayfasinda degilse toast ile bildirim gosterilebilir.

### Ana Ekran Bolumleri

Sayfada su bolumler bulunur:

- Baslik karti
- Toplam ve okunmamis bildirim aciklamasi
- Tumunu okundu yap butonu
- Yenile butonu
- Yeni bildirim butonu
- Arama ve filtre karti
- Desktop tablo gorunumu
- Mobil kart gorunumu

Desktop tabloda su kolonlar bulunur:

- Durum
- Baslik
- Mesaj
- Tip
- Tarih
- Aksiyonlar

Mobilde her bildirim kart olarak gosterilir. Okunmamis bildirimler mavi sol border ile vurgulanir.

### Liste, Filtre ve Arama Davranislari

Backend liste istegi:

```text
GET /notifications
```

Liste sadece oturumdaki kullanicinin bildirimlerini getirir. Baska kullanicinin bildirimi bu listede gorunmez.

Backend filtreleri:

- `is_read`: okundu/okunmadi filtreler.
- `type`: bildirim tipine gore filtreler.
- `limit`: kayit limiti.
- `offset`: sayfalama baslangici.

UI davranisi:

- Sayfa varsayilan olarak 200 kayit getirir.
- Okundu filtresi backend tarafinda uygulanir.
- Tip filtresi backend tarafinda uygulanir.
- Arama kutusu client-side calisir; gelen kayitlar icinde baslik, mesaj ve tip alanlarinda arama yapar.
- Tip filtresindeki secenekler mevcut listede bulunan tiplerden uretilir.

### Aksiyonlar

Tumunu okundu yap:

- `POST /notifications/mark-all-read` endpoint'ini kullanir.
- Sadece mevcut kullanicinin okunmamis bildirimlerini okundu yapar.
- Okunmamis bildirim yoksa buton pasif olur.

Tek bildirimi okundu/okunmadi yap:

- `PATCH /notifications/:id` endpoint'ini kullanir.
- `is_read` boolean degeri gonderilir.
- Bildirim mevcut kullaniciya ait degilse backend `404 not_found` doner.

Sil:

- `DELETE /notifications/:id` endpoint'ini kullanir.
- Silme oncesi onay penceresi gosterilir.
- Bildirim mevcut kullaniciya ait degilse backend `404 not_found` doner.

Detay/duzenleme:

- Satira, duzenle ikonuna veya mobil karta tiklaninca `/admin/notifications/[id]` sayfasina gidilir.
- Yeni bildirim butonu `/admin/notifications/new` rotasina gider.

### Realtime Bildirim Akisi

Admin layout'taki bildirim ikonu `GET /notifications/unread-count` ile okunmamis sayiyi alir.

Canli akis endpoint'i:

```text
GET /notifications/stream
```

Davranis:

- SSE/EventSource ile kullaniciya ozel bildirim akisi acilir.
- `connected` eventi geldigi zaman bildirim listesi ve okunmamis sayi cache'i yenilenir.
- `notification` eventi geldiginde liste ve okunmamis sayi invalid edilir.
- Kullanici `/admin/notifications` sayfasinda degilse toast bildirimi gosterilir.
- Stream 25 saniyede bir `ping` eventi gonderir.

### Backend Etkileri

Kullanilan endpointler:

```text
GET /notifications
GET /notifications/unread-count
GET /notifications/stream
POST /notifications
PATCH /notifications/:id
POST /notifications/mark-all-read
DELETE /notifications/:id
```

Bu liste sayfasi dogrudan su islemleri yapar:

- Listeleme
- Okunmamis sayisini guncelleme
- Tumunu okundu yapma
- Tek bildirimi okundu/okunmadi yapma
- Tek bildirimi silme

Bildirim olusturma formu detay maddesinde ayrica dokumante edilecektir.

### Bagli Moduller

Bildirimler su modullerle iliskilidir:

- Auth / oturum kullanicisi
- Notifications backend
- Realtime SSE kanali
- Admin layout bildirim ikonu
- Password change bildirimleri
- Siparis, sistem ve custom bildirim ureten diger moduller

### Sik Hata Durumlari

- Oturum yoksa endpointler `401 unauthorized` doner.
- Baska kullaniciya ait bildirim okundu/silindi yapilmak istenirse `404 not_found` doner.
- Gecersiz `is_read` body degeri `400 validation_error` uretir.
- SSE baglantisi koparsa okunmamis sayi ancak refetch veya yeniden baglanti ile guncellenir.
- Client-side arama sadece gelen 200 kayit icinde arama yaptigi icin daha eski kayitlari bulamayabilir.

### Genel Riskler

- Sayfa varsayilan 200 bildirim getirir; yogun sistemlerde pagination UI eksikligi eski bildirimlere ulasmayi zorlastirabilir.
- Arama client-side oldugu icin backendde bulunan ama ilk 200 kaydin disinda kalan bildirim aramada gorunmez.
- Tip filtresi mevcut listeden uretildigi icin o anda listede olmayan tip secenek olarak gorunmez.
- Tumunu okundu yap islemi geri alma aksiyonu sunmaz; kullanici hangi bildirimlerin okunmamis oldugunu kaybedebilir.
- Silinen bildirim geri getirilemez.
- Realtime SSE CORS ayari yanlissa bildirim ikonu ve toast gec guncellenebilir.
- Yeni bildirim butonu `/admin/notifications/new` rotasina gider; detay sayfasi bu rotayi desteklemiyorsa olusturma akisi hata verebilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/notifications` sayfasini ac.
3. Baslik kartinda toplam ve okunmamis sayinin gorundugunu kontrol et.
4. Okundu filtresinde `Tumu`, `Okundu`, `Okunmadi` seceneklerini dene.
5. Tip filtresinde mevcut tiplerden birini sec ve listenin filtrelendigini dogrula.
6. Arama alaninda bildirim basligi veya mesajiyla arama yap.
7. Bir bildirimi okundu/okunmadi yap ve ikon/renk degisimini kontrol et.
8. Tumunu okundu yap butonunu test bildirimi uzerinde dene.
9. Bir test bildirimini sil; onay penceresi ve liste yenilenmesini kontrol et.
10. Bir bildirime tiklayip detay sayfasina gidildigini dogrula.
11. Admin ust bildirim ikonunda okunmamis sayinin guncellendigini kontrol et.

Otomasyon smoke:

```bash
bun test src/modules/notifications
```

## 20. Bildirim Detay

Rota: `/admin/notifications/[id]`

Yeni bildirim rotasi: `/admin/notifications/new`

Menu grubu: Sistem Yonetimi

Yetki: Login olmus kullanici

### Sayfanin Amaci

Bildirim Detay sayfasi iki amacla kullanilir:

- Mevcut bildirimin detayini goruntulemek ve silmek.
- `new` parametresi ile yeni bildirim olusturmak.

Mevcut bildirimlerde baslik, mesaj, tip ve kullanici alanlari formda gorunur ama duzenleme desteklenmez. Backend bildirim guncelleme endpoint'i su an yalnizca `is_read` alanini destekledigi icin tam icerik duzenleme yapilamaz.

### Ana Ekran Bolumleri

Sayfada su bolumler bulunur:

- Baslik karti
- Geri don butonu
- Mevcut bildirimde sil butonu
- Bildirim bilgi formu
- Mevcut bildirimde duzenleme uyarisi
- Mevcut bildirim detay bilgileri karti

Yeni bildirim modunda form alanlari aktif olur ve kaydet/iptal butonlari gosterilir.

Mevcut bildirim modunda form alanlari pasiftir; sayfa daha cok detay goruntuleme ve silme amaciyla kullanilir.

### Form Alanlari

Form alanlari:

- Kullanici ID: opsiyonel, sadece yeni bildirimde aktif.
- Baslik: zorunlu.
- Mesaj: zorunlu.
- Tip: zorunlu.

Desteklenen UI tipleri:

- `order_created`
- `order_paid`
- `order_failed`
- `system`
- `custom`

Backend `type` alanini serbest string olarak kabul eder, ancak UI secenekleri yukaridaki listeyle sinirlidir.

### Yeni Bildirim Olusturma

Yeni bildirim olusturma endpoint'i:

```text
POST /notifications
```

Davranis:

- Kullanici ID bos birakilirsa bildirim oturumdaki kullaniciya olusturulur.
- Kullanici ID girilirse backend bildirimi bu hedef kullaniciya kaydeder.
- Baslik ve mesaj bos olamaz.
- Baslik en fazla 255 karakterdir.
- Kullanici ID girilirse UUID formatinda olmalidir.
- Kayit basarili olursa kullanici `/admin/notifications` listesine yonlendirilir.

Olusturma sonrasi bildirim realtime kanala da publish edilir. Hedef kullanici aktif SSE baglantisindaysa ust bildirim ikonu ve toast akisi guncellenebilir.

### Mevcut Bildirim Goruntuleme

Mevcut bildirim ekrani liste endpoint'inden gelen veriyi kullanir:

```text
GET /notifications
```

Sayfa mevcut bildirimi liste icinde `id` ile bulur. Detay ekraninda su bilgiler gosterilir:

- Bildirim ID
- Kullanici ID
- Okundu/okunmadi durumu
- Olusturma tarihi

Mevcut bildirimi kaydetmeye calismak tam edit yapmaz; UI kullaniciya duzenlemenin desteklenmedigini bildirir.

### Silme Davranisi

Silme endpoint'i:

```text
DELETE /notifications/:id
```

Silme oncesinde onay penceresi gosterilir. Islem basarili olursa kullanici bildirim listesine doner.

Backend sadece oturumdaki kullaniciya ait bildirimin silinmesine izin verir. Baska kullanicinin bildirimi icin `404 not_found` doner.

### Backend Etkileri

Kullanilan endpointler:

```text
GET /notifications
POST /notifications
DELETE /notifications/:id
```

Guncelleme endpoint'i teknik olarak vardir:

```text
PATCH /notifications/:id
```

Ancak mevcut backend bu endpoint'te sadece `is_read` alanini destekler. Baslik, mesaj, tip veya hedef kullanici guncellenemez.

### Bagli Moduller

Bildirim Detay su modullerle iliskilidir:

- Notifications backend
- Auth / oturum kullanicisi
- Realtime SSE
- Admin bildirim listesi
- Admin ust bildirim ikonu

### Sik Hata Durumlari

- Oturum yoksa `401 unauthorized` doner.
- Kullanici ID UUID formatinda degilse `400 validation_error` doner.
- Baslik bos veya 255 karakterden uzunsa validation hatasi alinir.
- Mesaj bos ise validation hatasi alinir.
- Mevcut bildirim liste icinde bulunamazsa form bos kalabilir ve silme islemi hata verebilir.
- Baska kullaniciya ait bildirimi silmeye calismak `404 not_found` doner.

### Genel Riskler

- Kullanici ID bos birakildiginda bildirim hedef kullaniciya degil, bildirimi olusturan oturum sahibine gider.
- UI hedef kullanici secici sunmadigi icin UUID manuel girilir; hatali UUID yanlis kullaniciya bildirim gonderme riski tasir.
- Backend `user_id` varligini ayrica dogrulamiyorsa olmayan kullanici ID'sine bildirim kaydi olusabilir.
- Mevcut bildirimde form alanlari gorundugu icin kullanici duzenleme yapabilecegini dusunebilir; kaydetme tam edit desteklemez.
- Yeni bildirim tipi UI'da sabit seceneklerle sinirlidir; sistemde farkli tipler varsa formdan secilemez.
- Silme islemi geri alinmaz.
- Detay sayfasi mevcut bildirimi `GET /notifications` listesinden buldugu icin pagination/limit disinda kalan bildirim dogrudan URL ile acildiginda bulunamayabilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/notifications/new` sayfasini ac.
3. Kullanici ID alanini bos birakip baslik, mesaj ve `system` tipiyle test bildirimi olustur.
4. Kayit sonrasi `/admin/notifications` listesine donuldugunu dogrula.
5. Yeni bildirimin listede gorundugunu ve okunmamis sayiya yansidigini kontrol et.
6. Bir bildirime tiklayip `/admin/notifications/[id]` detay sayfasini ac.
7. ID, kullanici ID, durum ve olusturma tarihinin gorundugunu kontrol et.
8. Mevcut bildirim form alanlarinin pasif oldugunu ve edit uyarisinin gorundugunu dogrula.
9. Test bildirimini sil; onay penceresi ve listeye donus davranisini kontrol et.
10. Gecersiz UUID ile yeni bildirim olusturmayi dene; validation hatasi beklenir.
11. Bos baslik veya bos mesajla kaydetmeyi dene; UI hata mesajini dogrula.

Otomasyon smoke:

```bash
bun test src/modules/notifications
```

## 21. Mail

Rota: `/admin/mail`

Menu grubu: Sistem Yonetimi

Yetki: Login olmus kullanici

### Sayfanin Amaci

Mail sayfasi, sistemin SMTP mail gonderimini test etmek icin kullanilir. Admin bir alici email adresi girerek test maili gonderir ve SMTP ayarlarinin calisip calismadigini dogrular.

Bu ekran SMTP ayarlarini duzenlemez. SMTP host, port, kullanici, sifre ve gonderen bilgileri Site Ayarlari tarafindan yonetilir; mail servisi bu ayarlari backend tarafinda okur.

### Ana Ekran Bolumleri

Sayfada iki ana kart bulunur:

- SMTP test mail formu
- SMTP ayarlari bilgilendirme karti

Test mail formu:

- Alici email adresi
- Test maili gonder butonu

Bilgilendirme kartinda SMTP icin gerekli alanlar listelenir:

- SMTP host
- SMTP port
- SMTP user
- SMTP pass
- Mail from

### Test Mail Akisi

Test mail endpoint'i:

```text
POST /mail/test
```

Form davranisi:

- Email alani bos birakilamaz.
- Input tipi `email` oldugu icin tarayici temel email format kontrolu yapar.
- Gonderim basarili olursa basari mesaji gosterilir ve email alani temizlenir.
- Hata olursa backend hata mesaji veya genel hata mesaji toast olarak gosterilir.

Backend davranisi:

- Body icinde `to` varsa test maili bu adrese gonderilir.
- Body icinde `to` yoksa backend oturum kullanicisinin email bilgisini kullanmaya calisir.
- Alici bulunamazsa `400 to_required_for_test_mail` doner.
- Mail gonderimi basarisiz olursa `500 mail_test_failed` doner.

Test mail icerigi sabittir:

- Subject: `SMTP Test – Kaman ilan`
- Text: SMTP ayarlarinin basarili gorundugunu belirten test mesaji
- HTML: ayni test mesajinin basit HTML hali

### SMTP Ayarlari

Mail servisi SMTP config bilgisini `site_settings` uzerinden okur.

Kullanilan ayarlar:

- Host
- Port
- Username
- Password
- Secure/TLS tercihi
- From email
- From name

Port fallback davranisi:

- Secure aktifse varsayilan port `465`
- Secure kapaliysa varsayilan port `587`

From alanı:

- `fromEmail` varsa kullanilir.
- Yoksa SMTP username kullanilir.
- O da yoksa `no-reply@example.com` fallback olarak kullanilir.
- `fromName` varsa `Ad <email>` formatinda gonderilir.

### Backend Etkileri

Mail modulu su endpointleri sunar:

```text
POST /mail/test
POST /mail/send
POST /mail/order-created
```

Bu admin sayfasi yalnizca `POST /mail/test` endpoint'ini kullanir.

Diger endpointler:

- `/mail/send`: genel amacli mail gonderimi icindir.
- `/mail/order-created`: siparis olusturma mailini tetikler.

### Bagli Moduller

Mail sayfasi su modullerle iliskilidir:

- Mail backend modulu
- Nodemailer transport
- Site settings SMTP ayarlari
- Email template / siparis maili altyapisi
- Auth / oturum kullanicisi
- Sistem & Ayarlar > Site Ayarlari > SMTP

### Sik Hata Durumlari

- SMTP host tanimli degilse servis `smtp_host_not_configured` hatasi uretir.
- Alici email bos ise `to_required_for_test_mail` hatasi alinir.
- SMTP username/password hataliysa gonderim `mail_test_failed` ile sonuclanir.
- Secure/port uyumsuzsa SMTP baglantisi zaman asimina veya TLS hatasina dusebilir.
- From email alanı yanlis domain ise mail spam'e dusebilir veya SMTP sağlayıcısı reddedebilir.

### Genel Riskler

- SMTP sifresi gizli bilgidir; ekran goruntulerinde veya dokumanlarda acik paylasilmamalidir.
- Test maili gercek aliciya gider; yanlis email adresi gereksiz mail gonderimine neden olur.
- Cok sik test maili gondermek SMTP saglayicisinda limit veya spam kontrolune takilabilir.
- UI bilgilendirme karti env degisken adlarini gosterir, ancak mevcut backend SMTP ayarlarini site settings uzerinden okur; bu durum admin kullanicisinda kafa karisikligi yaratabilir.
- Mail servisi transporter cache kullandigi icin SMTP ayari degistirildikten sonra ayni imza ile eski transporter kullanimi devam edebilir; host/port/user/secure degisikligi yeni transporter olusturur.
- Test maili basarili olsa bile siparis veya sifre maili template/veri hatalarindan dolayi ayrica basarisiz olabilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/mail` sayfasini ac.
3. Test mail formu ve SMTP bilgilendirme kartinin gorundugunu kontrol et.
4. Email alanini bos birakip gondermeyi dene; hata beklenir.
5. Gecerli bir test email adresi gir.
6. Test maili gonder ve basari toast'ini kontrol et.
7. Alici mailbox'inda test mailinin geldigini dogrula.
8. SMTP ayarlari yanlisken hata mesajinin kontrollu gorundugunu dogrula.
9. Site Ayarlari > SMTP tarafindan ayar degistirilirse tekrar test maili gonder.

Otomasyon smoke:

```bash
bun test src/modules/mail
```

## 22. Tema

Rota: `/admin/theme`

Menu grubu: Sistem Yonetimi

Yetki: Admin panel erisimi olan kullanici

### Sayfanin Amaci

Tema sayfasi, public site ve haber/ana sayfa yerlesim davranislarini tek ekrandan yonetmek icin kullanilir. Admin renk paleti, radius, font, koyu/acik tema tercihi, sayfa varyantlari, haber sayfasi bloklari ve ana sayfa blok akisini buradan duzenleyebilir.

Bu ekran ERP operasyonundan cok vitrin/public site gorunumunu etkiler. Yanlis tema veya blok ayari public sayfalarda bos alan, hatali siralama, yanlis banner veya kullanilamayan layout olusturabilir.

### Ana Ekran Bolumleri

Sayfa ustunde su aksiyonlar bulunur:

- Yenile
- Varsayilana don
- Kaydet

Ana sekmeler:

- Genel
- Renkler
- Sayfalar
- Haberler
- Ana Sayfa

Sayfa verisi `GET /admin/theme` ile alinir. Kaydetme `PUT /admin/theme`, reset islemi `POST /admin/theme/reset` endpoint'ini kullanacak sekilde frontendde tanimlanmistir.

### Genel Sekmesi

Genel sekmede temel tema davranislari ayarlanir:

- Dark mode: `light`, `dark`, `system`
- Border radius: `0rem`, `0.3rem`, `0.375rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`
- Font family

Dark mode secimi public tema davranisini etkiler. Font family alanina girilen deger CSS font ailesi olarak kullanilacak sekilde kaydedilir.

### Renkler Sekmesi

Renkler sekmesinde hex renk alanlari duzenlenir.

Desteklenen renk anahtarlari:

- `primary`
- `secondary`
- `accent`
- `background`
- `foreground`
- `muted`
- `mutedFg`
- `border`
- `destructive`
- `success`
- `navBg`
- `navFg`
- `footerBg`
- `footerFg`

Kaydetme sirasinda renkler `#RRGGBB` formatina normalize edilir. Gecersiz veya bos renkler kaydedilecek payload'da temizlenebilir.

### Sayfalar Sekmesi

Sayfalar sekmesi, sayfa bazli gorunum ayarlarini yonetir.

Sayfa ayarlari:

- Variant: varsayilan, genis, dar, ortali
- Hero style: carousel, gradient, image, minimal
- Default view: grid veya liste
- Filters style: sidebar, ust bar veya modal

Sayfa anahtari ekleme:

- Yeni sayfa anahtari prompt ile eklenir.
- Mevcut sayfa anahtari silinebilir.

Bilinen sayfa anahtarlari:

- `home`
- `listings`
- `listing_detail`
- `about`
- `contact`
- `campaigns`
- `advertise`
- `announcements`
- `haberler`

`haberler` sayfasi icin ek ayarlar vardir:

- Carousel makale sayisi
- Grid baslangic indeksi
- Sayfa basina makale
- Kenar cubugu ac/kapat
- Reklam banner pozisyonu

### Haberler Sekmesi

Haberler sekmesi iki alt gorunumden olusur:

- Liste sayfasi: `/haberler`
- Detay sayfasi: `/haberler/[slug]`

Liste sayfasi bloklari:

- Tam genislik banner
- Carousel
- Haber listesi grid
- Sidebar reklam
- Kenar cubugu

Detay sayfasi bloklari:

- Tam genislik reklam
- Kapak gorseli
- Yazar ve tarih
- Makale icerigi
- Video embed
- Etiketler
- Yorumlar
- Sidebar reklam
- Ilgili haberler

Bu sekmede bloklar surukle-birak ile siralanabilir, acilip kapatilabilir, basliklari degistirilebilir ve banner ID alanlari girilebilir. Liste ve detay icin kucuk onizleme panelleri vardir.

### Ana Sayfa Sekmesi

Ana Sayfa sekmesi `layout_blocks` yapisini yonetir. Bloklar 12 kolon mantigina gore siralanir ve genislikleri ayarlanir.

Desteklenen blok tipleri:

- Hero
- Kategoriler
- Flash firsat
- One cikan ilanlar
- Banner
- En cok goruntulenen
- Son ilanlar
- Populer ilanlar
- Top kategoriler
- Duyurular
- Haberler beslemesi
- Bulten
- Sonsuz liste

Blok davranislari:

- Bloklar surukle-birak ile siralanabilir.
- Blok aktif/pasif yapilabilir.
- Pozisyon inputuyla sira elle degistirilebilir.
- Bazi bloklarda kolon sayisi, limit ve 12 kolon genisligi ayarlanabilir.
- Banner ve flash sale bloklari tekrarlanabilir olarak eklenebilir.

### Backend Etkileri

Frontend tarafinda tanimli endpointler:

```text
GET /admin/theme
PUT /admin/theme
POST /admin/theme/reset
```

Kod incelemesinde bu repodaki backend tarafinda `/admin/theme` route'u gorunmedi. Bu nedenle sayfanin calismasi icin asagidaki durumlardan biri gerekir:

- Backendde henuz commit edilmemis/eksik bir theme endpoint'i olmalidir.
- API gateway/proxy baska bir servise yonlendiriyor olmalidir.
- Frontend endpoint'i eski veya eksik kalmis olabilir.

Bu bulgu testte ozellikle kontrol edilmelidir.

### Bagli Moduller

Tema sayfasi su alanlarla iliskilidir:

- Theme admin RTK endpointleri
- Public site tema uygulamasi
- Site settings / public UI konfigurasyonu
- Haberler liste ve detay sayfalari
- Ana sayfa layout renderer
- Banner/reklam icerikleri
- Duyurular ve haber beslemesi

### Sik Hata Durumlari

- `/admin/theme` backend route'u yoksa sayfa veri yukleyemez veya kaydedemez.
- Gecersiz hex renkler `#000000` gibi fallback'e normalize edilebilir.
- Kaydetmeden sayfadan cikilirsa degisiklikler kaybolur.
- Reset islemi tum tema ayarlarini varsayilana dondurebilir.
- Banner ID alanina yanlis ID girilirse public sayfada beklenen banner gorunmez.
- Limit veya kolon degerleri public renderer ile uyumsuzsa layout bozulabilir.
- Surukle-birak sonrasi kaydetme unutulursa sira kalici olmaz.

### Genel Riskler

- Tema ayarlari public site gorunumunu genis olcekte etkiler; degisiklikler canli vitrinde hemen fark edilebilir.
- Backend route eksikligi varsa admin sayfasi UI olarak acilsa bile kaydetme islemleri calismaz.
- `layout_blocks` ile eski `sections` yapisi ayni anda bulundugundan public renderer hangi yapıyı esas aliyor net degilse beklenen sonuc gorunmeyebilir.
- Banner/flash sale instance degerleri stabil ID gibi kullaniliyor; yanlis instance public icerik eslesmesini bozabilir.
- Renk kontrasti dusuk secilirse okunabilirlik ve erisilebilirlik sorunu olusur.
- Font family alani serbest metin oldugu icin yuklenmeyen font yazilirsa tarayici fallback font kullanir.
- Haberler bloklarinda banner ID manuel girildigi icin yanlis veya silinmis banner ID'leri bos alan olusturabilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/theme` sayfasini ac.
3. Sayfanin veri yukleyip yuklemedigini kontrol et.
4. Network panelinde `GET /admin/theme` isteginin basarili dondugunu dogrula.
5. Genel sekmesinde dark mode ve radius seceneklerini degistir.
6. Renkler sekmesinde test icin bir renk degistir.
7. Sayfalar sekmesinde `haberler` ayarlarinin gorundugunu kontrol et.
8. Haberler sekmesinde bir blogu pasif yap, sirayi degistir ve onizlemeyi kontrol et.
9. Ana Sayfa sekmesinde bir blok sirasi veya genisligi degistir.
10. Kaydet'e bas ve `PUT /admin/theme` isteginin basarili dondugunu dogrula.
11. Public ana sayfa ve haberler sayfasinda degisikligin yansiyip yansimadigini kontrol et.
12. Reset butonunu sadece test ortaminda dene; onay penceresini ve reset sonucunu kontrol et.

Otomasyon smoke:

```bash
# Bu repo icinde /admin/theme backend testi gorunmedi.
# Frontend/API entegrasyonu manuel veya e2e smoke ile dogrulanmali.
```

## 23. Kaynaklar

Rota: `/admin/resources`

Menu grubu: Sistem Yonetimi

Yetki: Admin panel erisimi olan kullanici

### Sayfanin Amaci

Kaynaklar sayfasi, randevu/slot/musaitlik altyapisinda kullanilan kaynaklari listelemek ve yonetmek icin tasarlanmistir. Kaynak; terapist, doktor, masa, oda, personel veya diger planlanabilir varlik anlamina gelir.

Bu ekran mevcut durumda kaynak listesini filtreler, kaynaklari kart veya tablo olarak gosterir, kaynak silme aksiyonu sunar ve kaynak duzenleme/musaitlik ekranlarina link verir.

### Ana Ekran Bolumleri

Sayfada su bolumler bulunur:

- Filtre ve ozet karti
- Toplam kaynak sayisi
- Yenile butonu
- Kaynak listesi
- Mobil/tablet icin kart gorunumu
- Cok genis ekran icin tablo gorunumu

Kart gorunumunde her kaynak icin:

- Aktif/pasif rozeti
- Kaynak turu
- Kaynak adi
- Son guncelleme tarihi
- Duzenle butonu
- Musaitlik butonu
- Sil butonu

Tablo gorunumu 1700px ve uzeri genis ekranlarda kullanilir.

### Liste, Filtre ve Sıralama Davranislari

Liste endpoint'i:

```text
GET /admin/resources
```

Frontend listeyi su parametrelerle cagirir:

- `q`: ada gore arama
- `type`: kaynak turu
- `status`: aktif/pasif/hepsi
- `sort`: siralama alani
- `order`: artan/azalan
- `limit`: 200

Filtreler:

- Arama: kaynak adinda arama yapmak icin kullanilir.
- Tur: terapist, doktor, masa, oda, personel, diger.
- Durum: hepsi, aktif, pasif.
- Sirala: guncelleme tarihi, olusturma tarihi, ad, tur.
- Yon: azalan veya artan.

### Kaynak Turleri

Desteklenen kaynak turleri:

- `therapist`: Terapist
- `doctor`: Doktor
- `table`: Masa
- `room`: Oda
- `staff`: Personel
- `other`: Diger

Bu turler musaitlik/slot ve raporlama ekranlarinda filtreleme icin kullanilir.

### Liste Aksiyonlari

Duzenle:

- Link: `/admin/resources/[id]`
- Bu repo incelemesinde `/admin/resources/[id]` page dosyasi gorunmedi.
- `ResourceForm` componenti mevcut olsa da route baglantisi bu turde bulunamadi.

Musaitlik:

- Link: `/admin/availability/[id]`
- Kaynak icin calisma saatleri ve slot planlama ekranina gitmesi beklenir.

Sil:

- Endpoint: `DELETE /admin/resources/:id`
- Silme oncesi kaynak adi ve turunu iceren onay penceresi gosterilir.
- Islem basarili olursa liste cache'i yenilenir.

### Kaynak Formu

Kod tabaninda `ResourceForm` componenti bulunur. Bu formun destekledigi alanlar:

- Ad
- Tur
- Aktif/pasif durum

Form davranisi:

- Ad en az 2 karakter olmalidir.
- Varsayilan yeni kaynak turu `therapist` olur.
- Yeni kaynak varsayilan aktif gelir.
- Pasif kaynaklar rezervasyon/musaitlik akislarinda listelenmemelidir.

Ancak mevcut route incelemesinde bu formu kullanan create/edit page dosyasi gorunmedi.

### Backend Etkileri

Frontend tarafinda tanimli endpointler:

```text
GET /admin/resources
GET /admin/resources/:id
POST /admin/resources
PATCH /admin/resources/:id
DELETE /admin/resources/:id
```

Kod incelemesinde bu repodaki backend tarafinda `/admin/resources` route'u gorunmedi. Backendde yalnizca ortak resource type tanimlari bulundu. Bu nedenle sayfanin calismasi icin asagidaki durumlardan biri gerekir:

- Backend resource modulu henuz commit edilmemis olabilir.
- API gateway baska servise yonlendiriyor olabilir.
- Frontend eski/eksik endpointlere bagli kalmis olabilir.

Bu bulgu testte ozellikle kontrol edilmelidir.

### Bagli Moduller

Kaynaklar su alanlarla iliskilidir:

- Resources admin RTK endpointleri
- Availability / musaitlik endpointleri
- Resource working hours
- Resource slots
- Randevu veya rezervasyon akislari
- Admin audit

### Sik Hata Durumlari

- `/admin/resources` backend route'u yoksa liste yuklenmez.
- `type` filtresi backend tarafinda desteklenmiyorsa filtre sonuc vermeyebilir.
- `status` filtresi backend tarafinda farkli format bekliyorsa aktif/pasif filtre yanlis calisir.
- Duzenle linki `/admin/resources/[id]` route'u yoksa 404'e gider.
- Musaitlik linki `/admin/availability/[id]` route'u yoksa 404'e gider.
- Silme islemi kaynak baska kayitlarda kullaniliyorsa backend tarafinda engellenmelidir.

### Genel Riskler

- Kaynak silme islemi musaitlik, slot veya rezervasyon kayitlariyla iliskiyi bozabilir; kullanilan kaynaklar silinmeden once bagli kayitlar kontrol edilmelidir.
- Pasif kaynaklar rezervasyonda listelenmeyecegi icin yanlis pasife alma operasyonel planlamayi etkiler.
- Backend route eksikligi varsa sayfa UI olarak acilsa bile liste/silme/duzenleme islemleri calismaz.
- Kaynak turu yanlis secilirse raporlama ve filtreleme yanlis gruba dusurur.
- Liste limiti 200 oldugu icin daha fazla kaynak olan sistemlerde pagination eksikligi eski kayitlara erisimi zorlastirabilir.
- Form componenti varken route dosyasi gorunmedigi icin create/edit akisi tamamlanmamis olabilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/resources` sayfasini ac.
3. Network panelinde `GET /admin/resources` isteginin basarili dondugunu kontrol et.
4. Kaynak listesi veya kontrollu bos durumun gorundugunu dogrula.
5. Arama alaninda kaynak adi ile filtreleme yap.
6. Tur filtresinde terapist, doktor, masa, oda, personel ve diger seceneklerini dene.
7. Durum filtresinde aktif/pasif seceneklerini dene.
8. Sıralama alanlarini ve artan/azalan yonunu kontrol et.
9. Bir kaynakta Duzenle butonunun dogru route'a gidip gitmedigini kontrol et.
10. Bir kaynakta Musaitlik butonunun dogru route'a gidip gitmedigini kontrol et.
11. Test kaynaginda silme islemini dene; onay penceresi ve liste yenilenmesini dogrula.
12. Backend route yoksa hata ekrani/boş liste yerine kullaniciya anlasilir hata verilmesi gerektigini not et.

Otomasyon smoke:

```bash
# Bu repo icinde /admin/resources backend testi gorunmedi.
# Frontend/API entegrasyonu manuel veya e2e smoke ile dogrulanmali.
```

## 24. Site Ayarlari Liste

Rota: `/admin/site-settings`

Sekme: Liste

Menu grubu: Sistem Yonetimi > Site Ayarlari

Yetki: `admin.app_settings`

### Sayfanin Amaci

Site Ayarlari Liste sekmesi, `site_settings` key-value kayitlarini ham liste olarak gormek, aramak, duzenleme ekranina gitmek ve kayit silmek icin kullanilir.

Bu sekme yapilandirilmis ayar formlarindan farklidir. Genel Ayarlar, SEO, SMTP veya API gibi sekmeler belirli anahtarlari kontrollu formlarla yonetirken Liste sekmesi kayitlari dogrudan key/value olarak gosterir.

### Ana Ekran Bolumleri

Sayfada su bolumler bulunur:

- Sayfa basligi ve aciklama
- Arama filtresi
- Dil secimi
- Yenile butonu
- Filtreleri sifirla butonu
- Site ayarlari tab listesi
- Liste tablosu veya mobil kart listesi

Liste kolonlari:

- Key
- Locale
- Value onizleme
- Guncellenme tarihi
- Aksiyonlar

Desktop gorunumde tablo, mobil gorunumde kart listesi kullanilir.

### Liste Davranisi

Frontend liste endpoint'i:

```text
GET /admin/site_settings/list
```

Gonderilen parametreler:

- `locale`: secili dil
- `q`: arama metni
- `sort`: varsayilan `key`
- `order`: varsayilan `asc`
- `limit`: 200
- `offset`: 0

Backend tarafinda ayni handler `/admin/site_settings` ve `/admin/site_settings/list` icin kullanilir.

Backend destekleyen filtreler:

- `q`: key icinde arama
- `keys`: virgulle ayrilmis key listesi
- `prefix`: key prefix aramasi
- `order`: `key.asc`, `key.desc`, `updated_at.asc`, `updated_at.desc`, `created_at.asc`, `created_at.desc`
- `limit`
- `offset`

### Deger Onizleme

Liste degeri kisa onizleme olarak gosterir.

Onizleme davranisi:

- String deger 80 karaktere kadar direkt gosterilir.
- Uzun string kisaltilir.
- JSON string gibi gorunen deger parse edilmeye calisilir.
- Array degerleri eleman sayisi ile gosterilir.
- Object degerleri alan sayisi veya ilk key bilgileriyle gosterilir.
- Null/undefined degerler tire ile gosterilir.

Detayli duzenleme icin Duzenle butonu kullanilir.

### Duzenleme ve Silme

Duzenle:

- Link formati: `/admin/site-settings/{key}?locale={selectedLocale}`
- Detay sayfasi ilgili key icin structured/raw form acar.

Sil:

- Endpoint: `DELETE /admin/site_settings/:key`
- Silme oncesi onay penceresi gosterilir.
- Silme sonrasi liste cache'i yenilenir.

Backend silme islemi key bazlidir. Mevcut backend semasinda key unique oldugu icin locale bazli ayni key varyantlari tutulmaz.

### Locale Davranisi

Frontend Liste sekmesi secili dili kullanir ve edit linkine `locale` query parametresi ekler.

Ancak mevcut backend semasinda `site_settings` tablosunda `locale` kolonu yoktur. Admin liste controller'i `locale` parametresini filtre olarak kullanmaz. Bu nedenle:

- Dil secimi UI'da gorunur.
- Liste istegine `locale` parametresi gonderilir.
- Backend mevcut haliyle locale'a gore filtrelemez.
- Edit linkinde locale query'si tasinir ama kayit key bazli tekildir.

Bu durum lokalize ayar beklentisi olan ekranlarda mutlaka test edilmelidir.

### Backend Etkileri

Kullanilan endpointler:

```text
GET /admin/site_settings/list
GET /admin/site_settings/app-locales
GET /admin/site_settings/default-locale
DELETE /admin/site_settings/:key
```

Liste sekmesi dogrudan create/update yapmaz; kayit guncelleme detay sayfasinda yapilir.

Backend validation:

- Key zorunludur.
- Key en fazla 100 karakterdir.
- Value JSON-like olmak zorundadir.
- Bulk upsert icin en az 1 item gerekir.

### Bagli Moduller

Site Ayarlari Liste su alanlarla iliskilidir:

- Site settings admin endpointleri
- Public site settings endpointleri
- Dil ayarlari
- Genel Ayarlar
- SEO
- SMTP
- Cloudinary
- Marka medya
- API ve entegrasyon ayarlari
- Admin audit

### Sik Hata Durumlari

- `admin.app_settings` yetkisi yoksa endpointler engellenir.
- Locale filtresi beklendigi gibi calismayabilir; backend semasinda locale kolonu yoktur.
- JSON string parse edilemezse onizleme ham string olarak gorunur.
- Key silinirse ilgili structured sekme veya public site bekledigi ayari bulamayabilir.
- Liste limiti 200 oldugu icin cok fazla ayarda pagination ihtiyaci dogabilir.

### Genel Riskler

- Ham key-value liste teknik kullanicilar icindir; yanlis key silinirse public site veya admin panel davranisi bozulabilir.
- Locale destekli UI ile locale'siz backend semasi arasindaki fark, adminin yanlis dilde ayar yaptigini sanmasina neden olabilir.
- Global ve lokal ayar ayrimi backendde net degilse ayni key uzerine yazma riski vardir.
- Value onizleme kisaltilmis oldugu icin kaydin gercek icerigi duzenleme ekraninda kontrol edilmeden yorumlanmamalidir.
- Silme islemi geri alinmaz; onemli ayarlarda silmeden once mevcut deger not alinmalidir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/site-settings` sayfasini ac.
3. Liste sekmesini sec.
4. Dil seciminin varsayilan/admin diliyle geldigini kontrol et.
5. Network panelinde `GET /admin/site_settings/list` istegini kontrol et.
6. Arama alaninda bilinen bir key ile filtreleme yap.
7. Tablo veya mobil kart listesinde key, value onizleme ve guncelleme tarihini kontrol et.
8. Bir kayitta Duzenle butonuna tikla ve `/admin/site-settings/{key}?locale=...` route'una gittigini dogrula.
9. Test icin olusturulmus zararsiz bir key varsa silme islemini dene.
10. Dil degistirildiginde backend sonucunun gercekten degisip degismedigini kontrol et; degismiyorsa locale riski not edilir.

Otomasyon smoke:

```bash
bun test src/modules/siteSettings
```

## 30. Site Ayarlari Marka Medya Ayarlari

### Sayfa Amaci

Marka Medya Ayarlari sekmesi, admin panel ve public site icin logo, favicon, app icon ve varsayilan OG gorseli gibi marka medya dosyalarini yonetmek icin kullanilir.

Rota:

```text
/admin/site-settings
```

Sekme:

```text
Marka Medya Ayarlari
```

Bu sekme medya yukleme alanlarini kart yapisinda gosterir. Admin kullanici her medya alaninda mevcut gorseli gorebilir, yeni dosya yukleyebilir, medya kutuphanesinden secim yapabilir, detay sayfasina gidebilir veya kaydi silebilir.

### Yonetilen Key'ler

Marka Medya sekmesi su key'leri yonetir:

- `site_logo`
- `site_logo_dark`
- `site_logo_light`
- `site_favicon`
- `site_apple_touch_icon`
- `site_app_icon_512`
- `site_og_default_image`

Bu key'ler icin global ve secili locale sorgulari yapilir. Locale kaydi varsa locale degeri, yoksa global kayit veya branding fallback kullanilir.

### Branding Fallback Iliskisi

Sekme ayrica `ui_admin_config` global kaydini okur:

```text
GET /admin/site_settings/ui_admin_config?locale=*
```

Bazi medya key'leri dogrudan kendi site setting key'ine yazilmak yerine `ui_admin_config.branding` icindeki alanlara yazilir.

Esleme:

- `site_logo` -> `ui_admin_config.branding.logo_url`
- `site_logo_light` -> `ui_admin_config.branding.logo_url`
- `site_logo_dark` -> `ui_admin_config.branding.login_logo_url`
- `site_favicon` -> `ui_admin_config.branding.favicon_32`
- `site_apple_touch_icon` -> `ui_admin_config.branding.apple_touch_icon`
- `site_og_default_image` -> `ui_admin_config.branding.meta.og_image`

`site_app_icon_512` icin bu fallback eslemesi yoktur; dogrudan kendi key'i uzerinden islem yapar.

### Kullanici Akisi

Beklenen admin akisi:

1. Site Ayarlari sayfasi acilir.
2. Marka Medya Ayarlari sekmesi secilir.
3. Sekme global ve secili locale icin medya key'lerini sorgular.
4. `ui_admin_config` global kaydi fallback icin okunur.
5. Her medya key'i kart olarak gosterilir.
6. Kartta mevcut gorsel preview edilir.
7. Admin yeni medya yukleyebilir veya `/admin/storage` kutuphanesinden secim yapabilir.
8. Duzenle butonu ilgili key detay sayfasina gider.
9. Sil butonu kaydi veya branding alanini temizler.
10. Yenile butonu global ve locale sorgularini tekrar calistirir.

### Gorsel Alan Davranisi

Her kart `AdminImageUploadField` kullanir.

Upload metadata:

```json
{ "scope": "site_settings", "locale": "*" }
```

Metadata icindeki `key`, ilgili medya key'idir. Upload bucket:

```text
public
```

Upload klasoru:

```text
site-media
```

Preview oranlari:

- Logo alanlari: `4x3`, contain
- Favicon ve app icon: `1x1`, contain
- OG default image: `16x9`, cover

Kaydedilen medya degeri desteklenen formatlar:

- Direkt string URL
- `{ "url": "..." }` objesi
- JSON string olarak `{ "url": "..." }`

### Veri Okuma ve Kaydetme

Global liste sorgusu:

```text
GET /admin/site_settings/list?locale=*&keys=site_logo,site_logo_dark,site_logo_light,site_favicon,site_apple_touch_icon,site_app_icon_512,site_og_default_image&order=key.asc&limit=200&offset=0
```

Locale liste sorgusu:

```text
GET /admin/site_settings/list?locale={selectedLocale}&keys=site_logo,site_logo_dark,site_logo_light,site_favicon,site_apple_touch_icon,site_app_icon_512,site_og_default_image&order=key.asc&limit=200&offset=0
```

Medya yukleme sonrasi kaydetme davranisi:

- Branding eslemesi olan key'ler `ui_admin_config` global kaydini gunceller.
- Branding eslemesi olmayan key'ler kendi site setting key'ini gunceller.

Ornek:

```text
PUT /admin/site_settings/ui_admin_config?locale=*
PUT /admin/site_settings/site_app_icon_512?locale={selectedLocale}
```

### Silme Davranisi

Silme davranisi key tipine gore degisir:

- Branding eslemesi olan key'lerde `ui_admin_config.branding` icindeki ilgili alan bos string yapilir.
- `site_og_default_image` icin `ui_admin_config.branding.meta.og_image` temizlenir.
- Branding eslemesi olmayan key'lerde `DELETE /admin/site_settings/:key` kullanilir.

Bu silme islemi storage asset dosyasini fiziksel olarak silmez; sadece ayar referansini temizler.

### Backend Etkileri

Bu sekme temel olarak site settings admin endpointlerini ve storage upload akisini kullanir.

Endpointler:

```text
GET /admin/site_settings/list
GET /admin/site_settings/:key
PUT /admin/site_settings/:key
DELETE /admin/site_settings/:key
POST /storage/:bucket/upload
```

Mevcut backend semasinda `locale` kolonu olmadigi icin global ve locale medya ayrimi backend tarafinda gercek ayrik kayitlar olarak tutulmayabilir. Frontend row locale alanina gore override/global ayrimi yapmaya calisir; backend locale donmezse bos locale global kabul edilir.

### Bagli Moduller

Marka Medya Ayarlari su alanlari etkiler:

- Public layout favicon ve icon metadata
- Admin sidebar ve logo gosterimleri
- Login/admin branding gorselleri
- SEO OG varsayilan gorseli
- Branding Ayarlari sekmesi
- Cloudinary / local storage ayarlari
- Admin Storage kutuphanesi
- Public medya URL cozumleme

### Sik Hata Durumlari

- `site_logo` ve `site_logo_light` ayni `branding.logo_url` alanina yazildigi icin biri digerini overwrite edebilir.
- `site_og_default_image` SEO sekmesinde de yonetildigi icin iki ekran arasinda kaynak karisikligi olusabilir.
- Backend locale desteklemedigi icin locale medya override'i beklenen sekilde saklanmayabilir.
- Branding fallback ile site setting key'i ayni anda farkli URL tasirsa admin preview ve public kullanim farkli olabilir.
- Upload basarili olup `ui_admin_config` guncellemesi basarisiz olursa dosya storage'da kalir ama marka ayarina baglanmaz.
- Silme islemi dosyayi storage'dan silmez; yalnizca ayar referansini temizler.

### Genel Riskler

- Logo, favicon ve OG gorseli public marka algisini dogrudan etkiler; yanlis gorsel tum siteye yansiyabilir.
- Branding Ayarlari, SEO Ayarlari ve Marka Medya ayni veya iliskili alanlara dokundugu icin tek kaynak sozlesmesi net degilse ayarlar birbirini ezebilir.
- SVG, ICO, PNG ve Cloudinary raw/upload URL davranislari farkli oldugu icin preview calissa bile browser favicon davranisi ayrica test edilmelidir.
- Medya URL'leri relative ise deployment domaininde yanlis cozumlenebilir.
- Storage driver degisikligi sonrasi eski local URL'ler ile yeni Cloudinary URL'ler ayni marka setinde karisik kalabilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/site-settings` sayfasini ac.
3. Marka Medya Ayarlari sekmesini sec.
4. Global ve secili locale medya listesi isteklerinin atildigini kontrol et.
5. `ui_admin_config?locale=*` kaydinin fallback icin okundugunu dogrula.
6. Her kartta logo, favicon, apple touch icon, app icon ve OG gorseli preview alanlarini kontrol et.
7. Test ortaminda bir logo yukle ve `ui_admin_config.branding.logo_url` alaninin guncellendigini dogrula.
8. `site_app_icon_512` icin upload sonrasi kendi key'inin guncellendigini kontrol et.
9. OG gorseli degisikliginin SEO sekmesindeki OG alanlariyla tutarli olup olmadigini kontrol et.
10. Silme islemini test ortaminda dene; ayar referansi temizleniyor mu, storage dosyasi yerinde kaliyor mu kontrol et.
11. Public layoutta favicon, logo ve OG image sonucunu browser/network uzerinden dogrula.
12. Storage driver local/cloudinary farkinda preview URL'lerinin dogru cozuldugunu kontrol et.

Otomasyon smoke:

```bash
bun test src/modules/storage
bun test src/modules/siteSettings
```

## 31. Site Ayarlari API ve Entegrasyonlar

### Sayfa Amaci

API ve Entegrasyonlar sekmesi, ucuncu parti servis baglantilarini, analitik kodlarini, Google OAuth bilgilerini, yapay zeka provider ayarlarini ve cookie consent gibi global entegrasyon degerlerini yonetmek icin kullanilir.

Rota:

```text
/admin/site-settings
```

Sekme:

```text
API ve Entegrasyonlar
```

Bu sekme global calisir. Ust dil secimi UI rozeti olarak gorunebilir ancak kayitlar `locale=*` ile saklanir.

### Yonetilen Gruplar

Sekme uc ana grup icerir:

- Yapay Zeka
- Google OAuth & Analytics
- Diger Ayarlar

Bu gruplar ayni form icinde gosterilir ve `Tumunu Kaydet` aksiyonu ile birlikte kaydedilir.

### Yapay Zeka API Kodlari

Yonetilen key'ler:

- `ai_default_provider`
- `ai_default_model`
- `ai_temperature`
- `ai_max_tokens`
- `anthropic_api_key`
- `openai_api_key`
- `openai_api_base`
- `groq_api_key`
- `groq_api_base`

Beklenen provider degerleri:

- `anthropic`
- `openai`
- `groq`
- Backend tarafinda ayrica `azure` ve `local` normalize edilebilir; mevcut UI placeholder ana olarak `anthropic`, `openai`, `groq` onerir.

Backend LLM runtime ayarlari once `site_settings` tablosundaki bu key'leri okur. DB degeri bos ise ilgili `.env` fallback degeri kullanilir.

Env fallback ornekleri:

- `AI_DEFAULT_PROVIDER`
- `AI_DEFAULT_MODEL`
- `AI_TEMPERATURE`
- `AI_MAX_TOKENS`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_API_BASE`
- `GROQ_API_KEY`
- `GROQ_API_BASE`

Bu ayarlar Test Merkezi log ozeti, risk onerisi ve ileride otomatik teshis akislari icin kullanilabilir.

### Google OAuth & Analytics

Yonetilen key'ler:

- `google_client_id`
- `google_client_secret`
- `gtm_container_id`
- `ga4_measurement_id`

Kullanim amaci:

- Google OAuth / login entegrasyonu
- Google Tag Manager
- Google Analytics 4 olcum kimligi

`google_client_secret` hassas bilgidir. UI bunu password input olarak gosterir ancak deger `site_settings` icinde saklanir.

### Cookie Consent / Diger Global Ayarlar

Yonetilen key:

- `cookie_consent`

Bu alan textarea olarak gosterilir ve JSON destekler. Girilen metin parse edilebiliyorsa JSON obje olarak, parse edilemiyorsa string olarak kaydedilir.

Ornek deger:

```json
{
  "consent_version": 1,
  "defaults": {
    "necessary": true,
    "analytics": false,
    "marketing": false
  },
  "ui": {
    "enabled": true
  }
}
```

Cookie consent degeri public cookie banner, analitik izinleri ve ileride marketing script acma/kapama davranisi icin referans olabilir.

### Veri Okuma ve Kaydetme

Liste sorgusu:

```text
GET /admin/site_settings/list?locale=*&keys=ai_default_provider,ai_default_model,ai_temperature,ai_max_tokens,anthropic_api_key,openai_api_key,openai_api_base,groq_api_key,groq_api_base,google_client_id,google_client_secret,gtm_container_id,ga4_measurement_id,cookie_consent
```

Kaydetme sirasinda her alan ayri `PUT` istegiyle gonderilir:

```text
PUT /admin/site_settings/{key}?locale=*
```

Tum alanlar formdan string olarak gelir. `cookie_consent` icin JSON parse denenir; basarili olursa JSON value olarak saklanir.

`ai_temperature` ve `ai_max_tokens` input tipi number olsa da parse fonksiyonu bunlari string olarak kaydeder. Backend LLM ayarlari okurken `Number()` ile numeric degere cevirir.

### Backend Etkileri

AI runtime okuma:

```text
backend/src/modules/llm/settings.ts
```

AI provider calisma akisi:

```text
backend/src/modules/llm/provider.ts
```

Site settings admin endpointleri:

```text
GET /admin/site_settings/list
PUT /admin/site_settings/:key
```

LLM provider davranisi:

- `anthropic`: Anthropic Messages API kullanir.
- `openai`: OpenAI uyumlu `/chat/completions` endpoint'i kullanir.
- `groq`: Groq OpenAI-compatible `/chat/completions` endpoint'i kullanir.
- `azure`: OpenAI-compatible yol ile calisir ancak base URL sozlesmesi ayrica dogrulanmalidir.
- `local`: mevcut provider kodunda implemented degildir.

### Bagli Moduller

API ve Entegrasyonlar su alanlari etkileyebilir:

- Test Merkezi AI log ozeti ve risk onerileri
- LLM helper modulu
- Google OAuth login akisi
- Public analytics ve tag manager scriptleri
- Cookie consent banner davranisi
- SEO/analytics metadata helper'lari
- Admin audit ve site settings cache davranisi

### Sik Hata Durumlari

- `ai_default_provider` desteklenmeyen deger olursa backend `anthropic` fallback'e donebilir.
- `ai_default_model` secili provider ile uyumsuzsa API istegi hata verir.
- API key bos veya yanlissa LLM provider `*_API_KEY missing` veya provider HTTP hatasi uretir.
- `openai_api_base` veya `groq_api_base` sonunda uyumsuz path varsa `/chat/completions` endpoint'i yanlis adrese gider.
- `ai_temperature` veya `ai_max_tokens` numeric olmayan degerse backend fallback kullanabilir.
- `google_client_secret` DB'de saklandigi icin erisim ve yedekleme riski olusur.
- `cookie_consent` JSON parse edilemiyorsa string olarak saklanir; bu degeri obje bekleyen public kod calismaz hale gelebilir.
- Kaydetme coklu `PUT` oldugu icin arada hata olursa entegrasyon ayarlari kismi guncellenmis kalabilir.

### Genel Riskler

- Yapay zeka API key'leri, Google secret ve entegrasyon kimlikleri hassas degerlerdir; admin yetki modeli, log maskeleme ve backup politikasi buna gore ele alinmalidir.
- DB degeri env fallback'in onune gecer; yanlis veya bos DB kaydi calisan env ayarini fiilen etkisiz birakabilir.
- Tek `Tumunu Kaydet` aksiyonu tum gruplari yazdigi icin Google ayari degistirirken AI key'lerinin de tekrar yazilmasi gibi beklenmeyen overwrite riski vardir.
- Test Merkezi AI ozeti bu ayarlara baglanirsa yanlis provider/model secimi smoke test risk notlarini guvenilmez hale getirebilir.
- Cookie consent yanlis yapilandirilirsa analitik scriptleri kullanici izni olmadan calisabilir veya hic calismayabilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/site-settings` sayfasini ac.
3. API ve Entegrasyonlar sekmesini sec.
4. GLOBAL rozetinin gorundugunu kontrol et.
5. Network panelinde tum API key'leri icin `GET /admin/site_settings/list?locale=*` isteginin atildigini dogrula.
6. Yapay Zeka grubunda provider, model, temperature, max token ve API key alanlarinin gorundugunu kontrol et.
7. Google grubunda client id, client secret, GTM ve GA4 alanlarini kontrol et.
8. Diger Ayarlar grubunda `cookie_consent` textarea alanini kontrol et.
9. Test ortaminda `cookie_consent` icin gecerli JSON girip kaydet; backendde obje olarak saklandigini dogrula.
10. Test ortaminda gecersiz JSON girildiginde string olarak saklandigini not et.
11. AI ayarlari kaydedildikten sonra backend LLM helper'in DB degerlerini env fallback'ten once okudugunu dogrula.
12. Kaydetme sirasinda her key icin `PUT /admin/site_settings/:key?locale=*` istegi atildigini kontrol et.
13. Google secret ve AI key alanlarinin UI'da password input olarak gorundugunu, fakat response/log tarafinda maskeleme ihtiyacini not et.

Otomasyon smoke:

```bash
bun test src/modules/siteSettings
bun test src/modules/test_center
```

## 32. Site Ayarlari Dil Ayarlari

### Sayfa Amaci

Dil Ayarlari sekmesi, uygulamanin aktif dil listesini ve varsayilan dilini yonetmek icin kullanilir. Bu ayarlar admin paneldeki locale secimini, public site dil cozumlemeyi ve locale bazli icerik formlarini dogrudan etkiler.

Rota:

```text
/admin/site-settings
```

Sekme:

```text
Dil Ayarlari
```

Bu sekme global calisir. Ust dil secimi bu sekmede pasiftir ve ayarlar `locale=*` ile kaydedilir.

### Yonetilen Key'ler

Dil Ayarlari sekmesi iki ana key'i yonetir:

- `app_locales`
- `default_locale`

`app_locales` beklenen format:

```json
[
  {
    "code": "tr",
    "label": "Turkce",
    "is_default": true,
    "is_active": true
  }
]
```

`default_locale` beklenen format:

```json
"tr"
```

### Kullanici Akisi

Beklenen admin akisi:

1. Site Ayarlari sayfasi acilir.
2. Dil Ayarlari sekmesi secilir.
3. Sekme `app_locales` ve `default_locale` degerlerini okur.
4. Aktif diller tablo olarak gosterilir.
5. Varsayilan dil select/radio ile belirlenir.
6. Her dil icin aktif/pasif switch'i kullanilir.
7. Hazir preset butonu locale dosyalarindan gelen dilleri aktif hale getirir.
8. Her degisiklik aninda `app_locales` ve `default_locale` tekrar kaydedilir.

### Normalizasyon Davranisi

Sekme gelen veriyi normalize eder:

- Array olmayan `app_locales` bos kabul edilir.
- `code` degeri `normLocaleTag` ile kisa locale formatina cevrilir.
- Tekrar eden locale code'lar elenir.
- Label yoksa code buyuk harfle label olarak kullanilir.
- `is_active` yoksa varsayilan olarak `true` kabul edilir.
- Aktif diller once, sonra alfabetik siralama yapilir.

Varsayilan dil secimi icin ek kural vardir:

- Secilen default locale aktif ise korunur.
- Secilen default pasifse ilk aktif locale varsayilan yapilir.
- Aktif locale yoksa default bos kalabilir; kaydetme sirasinda generated default veya fallback locale kullanilir.

### Preset Davranisi

Preset butonu `AVAILABLE_LOCALE_CODES` listesinden satir olusturur.

Kaynak:

```text
admin_panel/src/i18n/generated-locales.ts
admin_panel/src/i18n/localeCatalog.ts
```

Preset akisi:

1. Mevcut satirlar gecici olarak yedeklenir.
2. Locale dosyalarindaki tum locale code'lar aktif satira donusturulur.
3. Varsayilan dil `getDefaultLocaleCode()` ile secilir.
4. `app_locales` ve `default_locale` kaydedilir.
5. Hata olursa eski state geri yuklenir.

### Veri Okuma ve Kaydetme

Okuma endpointleri:

```text
GET /admin/site_settings/app-locales
GET /admin/site_settings/default-locale
```

Kaydetme endpointleri:

```text
PUT /admin/site_settings/app_locales?locale=*
PUT /admin/site_settings/default_locale?locale=*
```

Her aktif/pasif degisikligi ve default degisikligi iki ayari birlikte yazar.

`app_locales` payload'i:

```json
[
  {
    "code": "tr",
    "label": "Turkce",
    "is_default": true,
    "is_active": true
  }
]
```

`default_locale` payload'i:

```json
"tr"
```

### Backend Etkileri

Admin endpointler:

```text
GET /admin/site_settings/app-locales
GET /admin/site_settings/default-locale
PUT /admin/site_settings/:key
```

Public endpointler:

```text
GET /site_settings/app-locales
GET /site_settings/default-locale
```

Backend `app_locales` degerini array olarak veya `{ locales: [...] }` wrapper'i icinden normalize edebilir. `default_locale` yoksa public/admin endpointler genellikle `tr` fallback doner.

Site settings tag invalidation tarafinda `app_locales` ve `default_locale` icin ozel cache tag'leri vardir. Bu nedenle kayit sonrasi locale listesi tekrar okunabilir.

### Bagli Moduller

Dil Ayarlari su alanlari etkiler:

- Site Ayarlari ana dil secimi
- Liste ve structured ayar sekmeleri
- Site Ayari Detay sayfasi
- Public locale resolve akisi
- Admin locale tercihleri
- Custom pages, services, library, resume gibi locale bazli moduller
- SEO locale metadata
- Menu link locale cozumleme

### Sik Hata Durumlari

- `app_locales` bos veya gecersizse bircok admin formunda locale secimi hatali calisabilir.
- Aktif dil kapatilirsa default locale otomatik baska aktif dile kayabilir.
- Hic aktif dil kalmazsa default fallback beklenmeyen dile donebilir.
- Preset butonu mevcut ozel label ve aktif/pasif secimlerini locale dosyalarindaki listeyle ezebilir.
- Her switch degisikligi aninda kayit attigi icin hizli ardisik tiklamalarda yarim/son state karisikligi olabilir.
- Backend semasinda locale kolonu olmadigi icin diger site setting sekmelerindeki locale ayrimiyle ayni genel risk devam eder.

### Genel Riskler

- Dil ayarlari tum locale bazli icerik sozlesmesinin merkezidir; yanlis default public siteyi beklenmeyen dilde acabilir.
- Aktif olmayan locale'e ait mevcut icerikler silinmez ama UI'da erisilemez hale gelebilir.
- `default_locale` ile `app_locales[].is_default` tutarsiz kalirsa frontend ve backend farkli default yorumlayabilir.
- Locale kodlari generated locale dosyalariyla uyumlu degilse ceviri dosyasi olmayan dil aktif gorunebilir.
- Preset aksiyonu geri alinabilir bir onay sunmadan tum dil listesini yeniden yazdigi icin canli ortamda dikkatli kullanilmalidir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/site-settings` sayfasini ac.
3. Dil Ayarlari sekmesini sec.
4. GLOBAL rozetinin gorundugunu kontrol et.
5. Network panelinde `app-locales` ve `default-locale` isteklerinin atildigini dogrula.
6. Tabloda code, label, active ve default kolonlarini kontrol et.
7. Aktif bir dili pasife al ve `app_locales` ile `default_locale` icin iki `PUT` istegi atildigini dogrula.
8. Default dil pasife alindiginda default'un ilk aktif dile kayip kaymadigini kontrol et.
9. Preset butonunu sadece test ortaminda dene; locale dosyalarindaki dillerin aktif olarak yazildigini dogrula.
10. Site Ayarlari ana sayfasina geri donup dil select listesinin yeni aktif dillere gore guncellendigini kontrol et.
11. Public veya admin locale gerektiren bir sayfada default locale davranisini dogrula.

Otomasyon smoke:

```bash
bun test src/modules/siteSettings
```

## 33. Site Ayarlari Branding Ayarlari

### Sayfa Amaci

Branding Ayarlari sekmesi, admin panel ve public site icin temel marka kimligi, logo/favicons, HTML dil bilgisi, tema rengi ve genel meta/OG degerlerini yonetmek icin kullanilir.

Rota:

```text
/admin/site-settings
```

Sekme:

```text
Branding Ayarlari
```

Bu sekme `ui_admin_config` kaydinin `branding` alt objesini duzenler. Form kaydedildiginde mevcut config objesi korunur ve sadece `branding` alt objesi yeni form degeriyle degistirilir.

### Yonetilen Kayit

Ana key:

```text
ui_admin_config
```

Yonetilen alt obje:

```text
ui_admin_config.branding
```

Form kaydi bu key uzerinden yapilir:

```text
PUT /admin/site_settings/ui_admin_config?locale={selectedLocale}
```

Sekme locale parametresiyle acilir. Eger gelen kayit global ise UI global badge/fallback bilgisi gosterir; locale kaydi varsa override olarak yorumlanir.

### Form Alanlari

Kimlik alanlari:

- `app_name`
- `app_copyright`
- `html_lang`

Gorsel/tema alanlari:

- `theme_color`
- `logo_url`
- `login_logo_url`
- `favicon_16`
- `favicon_32`
- `apple_touch_icon`

Meta / SEO alanlari:

- `meta.title`
- `meta.description`
- `meta.og_url`
- `meta.og_title`
- `meta.og_description`
- `meta.og_image`
- `meta.twitter_card`

Form bos veya config eksik gelirse `DEFAULT_BRANDING` fallback degerleriyle doldurulur.

### Kullanici Akisi

Beklenen admin akisi:

1. Site Ayarlari sayfasi acilir.
2. Branding Ayarlari sekmesi secilir.
3. `ui_admin_config` kaydi secili locale ile okunur.
4. Config icindeki `branding` objesi forma aktarilir.
5. Config bozuk veya eksikse `DEFAULT_BRANDING` kullanilir.
6. Admin kimlik, gorsel, favicon ve meta alanlarini duzenler.
7. Logo/favicons icin upload alanlari kullanilabilir.
8. Kaydet butonu mevcut config'i `branding` alt objesiyle merge ederek yazar.
9. Kayit sonrasi veri tekrar refetch edilir.

### Upload Davranisi

Sekme `AdminImageUploadField` kullanir.

Logo upload:

```text
bucket=branding
folder=logos
```

Login logo upload:

```text
bucket=branding
folder=logos
```

Favicon upload:

```text
bucket=branding
folder=favicons
```

Apple touch icon upload:

```text
bucket=branding
folder=favicons
```

Favicon upload sonrasi ayni URL hem `favicon_16` hem `favicon_32` alanina yazilir.

### Veri Okuma ve Kaydetme

Okuma:

```text
GET /admin/site_settings/ui_admin_config?locale={selectedLocale}
```

Kaydetme:

```text
PUT /admin/site_settings/ui_admin_config?locale={selectedLocale}
```

Kaydetme payload'i mevcut config objesini korur:

```json
{
  "...": "mevcut diger config alanlari",
  "branding": {
    "app_name": "...",
    "app_copyright": "...",
    "html_lang": "tr",
    "theme_color": "#FDFCFB",
    "logo_url": "...",
    "login_logo_url": "...",
    "favicon_16": "...",
    "favicon_32": "...",
    "apple_touch_icon": "...",
    "meta": {
      "title": "...",
      "description": "...",
      "og_url": "...",
      "og_title": "...",
      "og_description": "...",
      "og_image": "...",
      "twitter_card": "summary_large_image"
    }
  }
}
```

### Backend Etkileri

Temel endpointler:

```text
GET /admin/site_settings/:key
PUT /admin/site_settings/:key
POST /storage/:bucket/upload
```

Public/SSR branding okuma tarafinda `ui_admin_config` public site settings endpointinden cekilebilir. Config icindeki `branding` objesi yoksa veya `meta.title` eksikse frontend fallback olarak `DEFAULT_BRANDING` kullanabilir.

Mevcut backend site settings semasinda `locale` kolonu olmadigi icin locale bazli branding override beklentisi backend tarafinda gercek ayrik kayit olarak calismayabilir. Bu risk diger site settings structured sekmeleriyle aynidir.

### Bagli Moduller

Branding Ayarlari su alanlari etkiler:

- Admin panel basligi ve marka adi
- Admin login/logo gosterimi
- Favicon ve apple touch icon
- Public layout metadata
- Open Graph ve Twitter card defaultlari
- Marka Medya Ayarlari sekmesi
- SEO Ayarlari sekmesi
- Dynamic favicon component
- Server-side branding fetch helper
- Storage upload akisi

### Sik Hata Durumlari

- `ui_admin_config` JSON yapisi bozuksa form fallback degerleriyle acilir ve kaydetme mevcut config'i beklenmedik sekilde sadelestirebilir.
- `html_lang` aktif `default_locale` ile uyumsuzsa HTML lang ve site locale davranisi ayrilabilir.
- Favicon upload ayni URL'yi hem 16 hem 32 alanina yazar; gercek boyutlar uyumsuz olabilir.
- `theme_color` gecersiz CSS renk degeri ise preview veya browser meta rengi beklenen calismaz.
- `meta.og_image` Marka Medya ve SEO sekmeleriyle de iliskili oldugu icin farkli ekranlar ayni niyeti farkli alanlarda tutabilir.
- Upload basarili ama `ui_admin_config` kaydi basarisizsa dosya storage'da kalir fakat branding'e baglanmaz.

### Genel Riskler

- Branding sekmesi `ui_admin_config.branding` alt objesini komple yeniden yazar; formda gorunmeyen branding alanlari varsa kaybolabilir.
- Marka Medya sekmesi de `ui_admin_config.branding` alanlarini guncelledigi icin iki ekran birbirini ezebilir.
- SEO meta alanlari burada da oldugu icin SEO Ayarlari ile kaynak sozlesmesi net degilse public metadata tutarsiz olabilir.
- Locale override UI'da gosterilse de backend locale ayrimi yoksa admin tek dil icin degistirdigini sanip global branding'i degistirebilir.
- Yanlis logo, favicon veya meta degeri public marka algisini ve sosyal paylasim onizlemelerini dogrudan etkiler.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/site-settings` sayfasini ac.
3. Branding Ayarlari sekmesini sec.
4. `GET /admin/site_settings/ui_admin_config?locale=...` isteginin atildigini dogrula.
5. Badge'in global/override durumunu dogru gosterip gostermedigini kontrol et.
6. App name, copyright, html lang ve theme color alanlarini kontrol et.
7. Logo, login logo, favicon ve apple touch icon upload preview alanlarini kontrol et.
8. Test ortaminda favicon yukle ve hem `favicon_16` hem `favicon_32` alanlarina yazildigini dogrula.
9. Meta title, description, OG ve Twitter card alanlarini duzenle.
10. Kaydet sonrasi `ui_admin_config.branding` alt objesinin guncellendigini ve diger config alanlarinin korundugunu kontrol et.
11. Marka Medya sekmesine gecip ayni logo/favicon/OG alanlarinin tutarli gorunup gorunmedigini kontrol et.
12. Public/admin layoutta favicon, logo ve meta sonucunu browser/network uzerinden dogrula.

Otomasyon smoke:

```bash
bun test src/modules/storage
bun test src/modules/siteSettings
```

## 25. Site Ayarlari Global Liste

### Sayfa Amaci

Site Ayarlari Global Liste sekmesi, tum siteyi etkileyen genel key-value ayarlarini tek ekranda kontrol etmek icin kullanilir.

Bu sekme, dile bagli ayar listesinden farkli olarak global kabul edilen kayitlari gostermek uzere tasarlanmistir. Admin kullanici bu ekranda global ayarlari arayabilir, deger onizlemesini gorebilir, ilgili ayarin detay sayfasina gidebilir veya test amacli/zararsiz key'leri silebilir.

Rota:

```text
/admin/site-settings
```

Sekme:

```text
Global Liste
```

Frontend tarafinda bu sekme `ListPanel` bilesenini `locale="*"` ile calistirir.

### Kullanici Akisi

Admin kullanici Site Ayarlari sayfasini actiginda sekmeler uzerinden Global Liste'ye gecebilir.

Bu akista beklenen davranis:

1. Global Liste sekmesi secilir.
2. Dil secimi global modda pasif hale gelir.
3. Global bilgi rozeti gosterilir.
4. Liste istegi `locale=*` query parametresiyle yapilir.
5. SEO ile ilgili key'ler frontend tarafinda listeden gizlenir.
6. Arama alani key uzerinden filtreleme yapar.
7. Duzenle butonu ilgili key'in detay sayfasina gider.
8. Sil butonu onay alarak ilgili key'i siler.

Bu sekme yeni ayar olusturma formu degildir. Kayit duzenleme islemi detay sayfasinda yapilir.

### Liste Davranisi

Global Liste su ozellikleri kullanir:

- Sayfa basina 200 kayit ceker.
- Siralama varsayilan olarak key'e gore artandir.
- Arama metni backend'e `q` parametresiyle gonderilir.
- SEO key'leri frontend tarafinda filtrelenir.
- Tablo ve mobil kart gosterimi ayni veri kaynagini kullanir.

Gorunen ana kolonlar:

- Key
- Locale
- Value onizleme
- Guncelleme tarihi
- Islemler

Mevcut backend yanitinda `locale` alani donmedigi icin locale kolonu global kayitlarda genellikle `global`/bos kabul edilen UI bilgisidir.

### SEO Key Gizleme

Global Liste sekmesinde SEO ayarlari bilerek gizlenir. Bu davranis frontend tarafinda uygulanir.

Gizlenen key ornekleri:

- `seo`
- `site_seo`
- `site_meta_default`
- `seo_` ile baslayan key'ler
- `seo|` ile baslayan key'ler
- `site_seo|` ile baslayan key'ler
- `ui_seo`
- `ui_seo_` ile baslayan key'ler

Bu gizleme backend filtresi degildir. Network yanitinda SEO key'leri donse bile UI listesi bunlari gostermeyebilir.

### Duzenleme ve Silme

Duzenle linki secili global context'i query parametresi olarak tasir.

Link formati:

```text
/admin/site-settings/{key}?locale=*
```

Silme davranisi:

```text
DELETE /admin/site_settings/:key
```

Silme islemi key bazlidir. Mevcut backend semasinda site ayarlari key uzerinden tekil tutuldugu icin locale bazli farkli kayit silme ayrimi yoktur.

### Backend Etkileri

Global Liste icin kullanilan temel endpoint:

```text
GET /admin/site_settings/list?locale=*&q=&order=key.asc&limit=200&offset=0
```

Backend controller mevcut durumda `locale` parametresini filtre olarak kullanmaz. Bu nedenle `locale=*` frontend'in global liste niyetini tasir; backend tarafinda ayrica global kayit ayrimi yapmaz.

Kullanilan diger endpointler:

```text
GET /admin/site_settings/app-locales
GET /admin/site_settings/default-locale
DELETE /admin/site_settings/:key
```

Backend veri modeli mevcut durumda su alanlara dayanir:

- `id`
- `key`
- `value`
- `created_at`
- `updated_at`

Locale, grup veya aciklama alani backend semasinda ayrica tutulmaz.

### Bagli Moduller

Global Liste su alanlarla iliskilidir:

- Site settings admin endpointleri
- Genel Ayarlar
- SMTP ayarlari
- Cloudinary ayarlari
- Marka medya ayarlari
- API ve entegrasyon ayarlari
- Dil ayarlari
- Public site settings kullanimi
- Admin audit loglari

Global Liste, SMTP ve Dil sekmeleri dil secimini global modda kapatan akisa dahildir. Cloudinary, marka medya ve API gibi structured sekmeler ayrica kendi form davranislariyla test edilmelidir.

### Sik Hata Durumlari

- Backend `locale=*` parametresini filtrelemedigi icin Global Liste ile normal Liste ayni veri setine cok yakin donebilir.
- SEO key'leri UI'da gizlendigi icin admin, ilgili ayarin olmadigini sanabilir.
- Silme islemi key bazli oldugu icin yanlis key silinirse ilgili global ayar tamamen kaybolabilir.
- Value onizleme kisaltilmis oldugu icin gercek deger detay sayfasinda kontrol edilmeden karar verilmemelidir.
- Liste 200 kayitla sinirli oldugu icin cok buyuk ayar setlerinde aranan kayit ilk istekte gorunmeyebilir.

### Genel Riskler

- Global ve lokal ayar ayrimi backend semasinda net tutulmadigi icin `locale=*` admin icin yaniltici olabilir.
- SEO key'lerinin sadece frontend tarafinda gizlenmesi, test sirasinda backend ve UI sonucunun farkli yorumlanmasina neden olabilir.
- Silme isleminin locale farki gozetmemesi, ileride locale destekli semaya geciste veri kaybi riski olusturabilir.
- Global ayarlar public site, mail, medya ve entegrasyon davranislarini etkileyebilecegi icin her silme veya duzenleme sonrasi ilgili moduller kontrol edilmelidir.
- Admin ekraninda global kabul edilen ayarlar ile backendde tekil key-value olarak saklanan ayarlar arasinda sozlesme dokumante edilmezse yeni gelistirmelerde tekrarli key ve yanlis overwrite riski dogar.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/site-settings` sayfasini ac.
3. Global Liste sekmesini sec.
4. Dil seciminin pasif oldugunu ve global bilgi rozetinin gorundugunu kontrol et.
5. Network panelinde `GET /admin/site_settings/list` isteginde `locale=*` parametresinin gonderildigini dogrula.
6. Liste sekmesiyle Global Liste sonucunu karsilastir; SEO key'lerinin Global Liste'de gizlendigini kontrol et.
7. Arama alaninda bilinen global bir key ile filtreleme yap.
8. Bir kayitta Duzenle butonuna tikla ve route'un `/admin/site-settings/{key}?locale=*` formatinda acildigini dogrula.
9. Sadece test icin olusturulmus zararsiz bir key varsa silme islemini dene.
10. Silme sonrasi backendde key'in tamamen kalktigini ve locale bazli ayrim olmadigini not et.

Otomasyon smoke:

```bash
bun test src/modules/siteSettings
```

## 26. Site Ayarlari Genel Ayarlar

### Sayfa Amaci

Genel Ayarlar sekmesi, public site ve admin deneyiminde kullanilan temel firma, iletisim, sosyal medya, calisma saati ve header metni ayarlarini yonetmek icin kullanilir.

Rota:

```text
/admin/site-settings
```

Sekme:

```text
Genel Ayarlar
```

Bu sekme ham key-value liste yerine kontrollu bir ayar grubu gosterir. Admin, belirli genel ayar key'lerinin global kaydini, secili dile ait override kaydini ve etkili degeri ayni tabloda gorur.

### Yonetilen Key'ler

Genel Ayarlar sekmesi yalnizca su key'leri yonetir:

- `contact_info`
- `socials`
- `businessHours`
- `company_profile`
- `ui_header`

Bu key'lerin disindaki site ayarlari bu sekmede gosterilmez. Diger kayitlar Liste veya ilgili structured sekmelerden kontrol edilmelidir.

### Varsayilan Degerler

Sekme eksik global kayitlari olusturmak veya mevcut ayari varsayilana dondurmek icin frontend tarafinda varsayilan JSON degerleri tutar.

Varsayilan icerik ozeti:

- `contact_info`: telefon, e-posta, adres, WhatsApp
- `socials`: Instagram, Facebook, LinkedIn, YouTube, X
- `businessHours`: haftalik acilis/kapanis saatleri ve kapali gun bilgisi
- `company_profile`: firma adi, yasal unvan, vergi bilgileri, iletisim ve adres bilgileri
- `ui_header`: ana navigasyon metinleri ve CTA etiketi

Bu degerler backend seed'i degildir; sekme uzerindeki aksiyonlarla `PUT /admin/site_settings/:key` uzerinden kaydedilir.

### Kullanici Akisi

Beklenen admin akisi:

1. Site Ayarlari sayfasi acilir.
2. Genel Ayarlar sekmesi secilir.
3. Ust dil seciminden aktif dil belirlenir.
4. Sekme hem global hem de secili locale icin ilgili key'leri sorgular.
5. Tabloda her key icin kaynak, etkili deger ve aksiyonlar gosterilir.
6. Global kayit yoksa eksik global ayarlar olusturulabilir.
7. Global degerden secili dil icin override olusturulabilir.
8. Kayit detay sayfasinda duzenlenebilir.
9. Global veya locale kaydi silinebilir.
10. Kayit varsayilan frontend degerine dondurulebilir.

### Tablo Davranisi

Tabloda her satir bir genel ayar key'ini temsil eder.

Kolonlar:

- Key
- Kaynak
- Etkili deger
- Islemler

Kaynak bilgisi uc durumdan biri olabilir:

- Locale override
- Global
- Yok

Etkili deger belirleme sirasi:

1. Secili locale kaydi varsa locale degeri kullanilir.
2. Locale kaydi yoksa global kayit kullanilir.
3. Global kayit da yoksa kaynak `Yok` kabul edilir.

Deger onizlemesi 180 karaktere kadar gosterilir. Uzun JSON degerleri kisaltilir.

### Arama ve Yenileme

Sekme kendi icinde ayrica arama alani kullanir. Arama metni hem sorguya `q` olarak gonderilir hem de frontend tarafinda key/deger uzerinden filtrelemeye katilir.

Yenile butonu global ve secili locale sorgularini tekrar calistirir.

Kullanilan frontend sorgular:

```text
GET /admin/site_settings/list?locale=*&keys=contact_info,socials,businessHours,company_profile,ui_header
GET /admin/site_settings/list?locale={selectedLocale}&keys=contact_info,socials,businessHours,company_profile,ui_header
```

### Aksiyonlar

Eksik global ayarlari olustur:

- Her yonetilen key icin global kayit var mi kontrol eder.
- Eksik olanlar icin varsayilan frontend degerini kaydeder.
- Her kayit `PUT /admin/site_settings/:key?locale=*` ile gonderilir.

Override olustur:

- Secili key icin global degeri alir.
- Ayni degeri secili locale'e kopyalamaya calisir.
- `PUT /admin/site_settings/:key?locale={selectedLocale}` kullanir.

Varsayilana dondur:

- Global veya locale hedefini secerek frontend varsayilanini yazar.
- `PUT /admin/site_settings/:key?locale=*` veya `PUT /admin/site_settings/:key?locale={selectedLocale}` kullanir.

Duzenle:

```text
/admin/site-settings/{key}?locale=*
/admin/site-settings/{key}?locale={selectedLocale}
```

Sil:

```text
DELETE /admin/site_settings/:key?locale=*
DELETE /admin/site_settings/:key?locale={selectedLocale}
```

### Backend Etkileri

Backend tarafinda site ayarlari mevcut durumda key-value yapisinda tutulur.

Temel endpointler:

```text
GET /admin/site_settings/list
PUT /admin/site_settings/:key
DELETE /admin/site_settings/:key
```

Mevcut backend controller `locale` query parametresini liste, guncelleme veya silme tarafinda ayri kayit ayrimi olarak kullanmaz. Backend semasinda `locale` kolonu bulunmadigi icin ayni key icin global ve locale varyanti tutulamaz.

Bu nedenle frontend'in global/locale override modeli ile backend'in tekil key-value modeli arasinda davranis farki vardir. Bu fark Genel Ayarlar sekmesi icin kritik test maddesidir.

### Bagli Moduller

Genel Ayarlar su alanlari etkileyebilir:

- Public header ve navigasyon metinleri
- Public iletisim bilgileri
- Public sosyal medya linkleri
- Firma profili gosterimleri
- Calisma saatleri
- Footer veya iletisim bloklari
- Site Ayari Detay sayfasi
- Admin site settings cache davranisi

### Sik Hata Durumlari

- Backend `locale` desteklemedigi icin global ve locale sorgulari ayni kaydi dondurebilir.
- Backend yanitinda `locale` alani olmadiginda frontend satiri global veya locale olarak eslestiremeyebilir.
- Override olusturuldugunda beklenen locale kaydi yerine ayni key'in tekil degeri overwrite edilebilir.
- Global silme veya locale silme ayni backend silme islemine gittigi icin key tamamen silinebilir.
- Eksik global ayarlari olustur aksiyonu birden fazla `PUT` istegi atar; kismi basari durumunda bazi key'ler olusup bazilari eksik kalabilir.
- Varsayilana dondur aksiyonu mevcut gercek firma bilgisini frontend default'u ile ezebilir.

### Genel Riskler

- Genel Ayarlar sekmesi admin tarafinda global/locale override deneyimi sunuyor; backend semasi buna hazir degilse admin yanlislikla public site ayarlarini tek dil icin degil tum site icin degistirebilir.
- `contact_info`, `company_profile` ve `businessHours` gibi alanlar public sitede guven ve operasyon bilgisi tasidigi icin yanlis deger marka/iletisim hatalarina neden olur.
- `ui_header` metinleri header navigasyonunu etkileyebilir; bos veya yanlis deger public sitede menunun anlasilmasini zorlastirir.
- Silme islemleri geri alinmaz; onemli genel ayarlar silinmeden once mevcut JSON degeri not alinmalidir.
- Locale destekli davranis gercekten istenecekse backend semasi, unique index ve controller sozlesmesi ayrica tasarlanmalidir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/site-settings` sayfasini ac.
3. Genel Ayarlar sekmesini sec.
4. Ust dil seciminde aktif dilin rozette gorundugunu kontrol et.
5. Network panelinde global ve secili locale icin iki liste istegi atildigini kontrol et.
6. Tablo satirlarinda `contact_info`, `socials`, `businessHours`, `company_profile`, `ui_header` key'lerinin gorundugunu dogrula.
7. Her satirda global/locale var-yok rozetlerini ve kaynak bilgisini kontrol et.
8. Arama alaninda `contact` veya `company` ile filtreleme yap.
9. Bir kayitta Duzenle butonuna tikla ve detay route'unun dogru `locale` query'si ile acildigini dogrula.
10. Zararsiz test ortaminda override olustur ve backendde bunun gercekten ayri locale kaydi mi yoksa key overwrite mi oldugunu not et.
11. Eksik global ayarlari olustur aksiyonunu sadece test veritabaninda dene.
12. Silme aksiyonlarini sadece test key'i veya seed'i geri yuklenebilir ortamda dene.

Otomasyon smoke:

```bash
bun test src/modules/siteSettings
```

## 27. Site Ayarlari SEO Ayarlari

### Sayfa Amaci

SEO Ayarlari sekmesi, public sitenin temel SEO metadata, Open Graph, Twitter card, robots ve varsayilan OG gorseli ayarlarini yonetmek icin kullanilir.

Rota:

```text
/admin/site-settings
```

Sekme:

```text
SEO Ayarlari
```

Bu sekme ham Liste ekranindan farkli olarak sadece SEO ile ilgili key'leri gruplar. Admin kullanici global SEO kaydini, secili dile ait locale override kaydini, etkili degeri ve OG varsayilan gorselini ayni ekranda kontrol eder.

### Yonetilen Key'ler

Primary SEO key'leri:

- `seo`
- `site_seo`
- `site_meta_default`

SEO olarak kabul edilen ek key pattern'leri:

- `seo_` ile baslayan key'ler
- `seo|` ile baslayan key'ler
- `site_seo|` ile baslayan key'ler
- `ui_seo`
- `ui_seo_` ile baslayan key'ler

OG varsayilan gorsel key'i:

- `site_og_default_image`

`seo` ve `site_seo` global SEO semasini kullanir. `site_meta_default` locale bazli title, description ve keywords varsayilanlarini temsil eder.

### SEO Deger Semasi

`seo` ve `site_seo` icin beklenen ana alanlar:

- `site_name`
- `title_default`
- `title_template`
- `description`
- `open_graph.type`
- `open_graph.images`
- `twitter.card`
- `twitter.site`
- `twitter.creator`
- `robots.noindex`
- `robots.index`
- `robots.follow`

`site_meta_default` icin beklenen ana alanlar:

- `title`
- `description`
- `keywords`

Frontend tarafinda bozuk veya eksik SEO degerlerinde fallback olarak `DEFAULT_SEO_GLOBAL` ve `DEFAULT_SITE_META_DEFAULT_BY_LOCALE` kullanilir.

### Kullanici Akisi

Beklenen admin akisi:

1. Site Ayarlari sayfasi acilir.
2. SEO Ayarlari sekmesi secilir.
3. Ust dil seciminden aktif locale belirlenir.
4. Sekme global ve secili locale icin SEO kayitlarini sorgular.
5. Ayrica `site_og_default_image` global kaydi sorgulanir.
6. Tablo her SEO key'i icin global satiri, locale satiri ve etkili degeri gosterir.
7. Global SEO defaults eksikse `seo` ve `site_seo` icin olusturulabilir.
8. Global kayittan locale override olusturulabilir.
9. Primary key'ler varsayilana dondurulebilir.
10. Detay sayfasinda key duzenlenebilir.
11. Global veya locale satiri silinebilir.
12. OG varsayilan gorseli upload/library ile degistirilebilir.

### Liste ve Kaynak Davranisi

Sekme iki ana liste sorgusu kullanir:

```text
GET /admin/site_settings/list?locale=*&q={search}
GET /admin/site_settings/list?locale={selectedLocale}&q={search}
```

Bu iki sorgunun sonucu birlestirilir ve SEO key filtresinden gecirilir.

Kaynak bilgisi uc durumdan biri olabilir:

- Locale override
- Global
- Yok

Etkili deger belirleme sirasi:

1. Secili locale kaydi varsa locale degeri kullanilir.
2. Locale kaydi yoksa global kayit kullanilir.
3. Ikisi de yoksa kaynak `Yok` kabul edilir.

Primary key'ler once gosterilir; diger SEO key'leri alfabetik siralanir.

### site_meta_default Guard Davranisi

`site_meta_default` global `locale="*"` ile duzenlenmemelidir. Sekme bu key icin ayrica guard uygular:

- Globalden override olusturma engellenir.
- `locale="*"` ile restore engellenir.
- Edit linki global yerine secili locale ile acilir.

Bu davranis, sayfa bazli varsayilan meta bilgisinin dile bagli olmasi gerektigi varsayimina dayanir.

### OG Varsayilan Gorsel

SEO sekmesinde `site_og_default_image` global key'i ayrica gorsel upload alaniyla yonetilir.

Kullanilan sorgu:

```text
GET /admin/site_settings/list?locale=*&keys=site_og_default_image&order=key.asc&limit=1&offset=0
```

Kayit formati:

```json
{ "url": "https://..." }
```

Gorsel `public` bucket ve `site-media` klasoruyle yuklenir. Metadata icinde `key=site_og_default_image`, `scope=site_settings`, `locale=*` tasinir.

Kaydedilen URL relative ise frontend bunu `NEXT_PUBLIC_SITE_URL` ile absolute URL'ye cevirmeye calisir.

### Aksiyonlar

Global defaults olustur:

- Sadece `seo` ve `site_seo` icin calisir.
- Eksik global kayitlara `DEFAULT_SEO_GLOBAL` yazar.
- `site_meta_default` global olarak olusturulmaz.

Override olustur:

- Global kaydi secili locale'e kopyalamaya calisir.
- `site_meta_default` icin engellenir.

Varsayilana dondur:

- `seo` ve `site_seo`: `DEFAULT_SEO_GLOBAL`
- `site_meta_default`: secili locale icin `DEFAULT_SITE_META_DEFAULT_BY_LOCALE`

Duzenle:

```text
/admin/site-settings/{key}?locale=*
/admin/site-settings/{key}?locale={selectedLocale}
```

Sil:

```text
DELETE /admin/site_settings/:key?locale=*
DELETE /admin/site_settings/:key?locale={selectedLocale}
```

### Backend Etkileri

Temel endpointler:

```text
GET /admin/site_settings/list
PUT /admin/site_settings/:key
DELETE /admin/site_settings/:key
```

Mevcut backend controller `locale` query parametresini ayri kayit ayrimi olarak kullanmaz. Backend semasinda `locale` kolonu bulunmadigi icin SEO sekmesinin global/locale override modeli backend tarafinda gercekten ayrilmis degildir.

Bu durum SEO sekmesi icin ozellikle onemlidir; cunku admin tek bir dili guncelledigini dusunurken `seo`, `site_seo` veya `site_meta_default` key'inin tekil degerini overwrite edebilir.

### Bagli Moduller

SEO Ayarlari su alanlari etkileyebilir:

- Public sayfa title ve description uretimi
- Open Graph paylasim onizlemeleri
- Twitter card onizlemeleri
- Robots/index davranisi
- Public header veya page meta helper'lari
- Marka medya sekmesi
- Storage / medya kutuphanesi
- Site Ayari Detay sayfasi

### Sik Hata Durumlari

- Backend `locale` desteklemedigi icin global ve locale satirlari beklenen sekilde ayrilmayabilir.
- `site_meta_default` global kayit olarak kaydedilirse locale bazli meta varsayimi bozulur.
- `robots.noindex=true` yanlislikla kaydedilirse public site arama motorlarindan gizlenebilir.
- `open_graph.images` bos veya kirik URL icerirse sosyal paylasimlarda gorsel cikmayabilir.
- Relative OG URL'ler farkli deployment domainlerinde hatali cozumlenebilir.
- Global defaults olustur aksiyonu gercek SEO kurgusunu default marka metinleriyle ezebilir.
- Silme islemi key bazli oldugu icin global/locale silme ayrimi backendde korunmayabilir.

### Genel Riskler

- SEO ayarlari teknik olarak temel gorunse de public arama gorunurlugu, sosyal paylasim kalitesi ve indexlenme davranisini dogrudan etkiler.
- `seo` ve `site_seo` ayni global schema ile yonetildigi icin hangisinin public tarafta asil kaynak oldugu net dokumante edilmezse cift kaynak riski olusur.
- Locale destekli SEO beklentisi backend semasiyla uyumlu degilse farkli diller icin ayni metadata yayina cikabilir.
- OG gorseli Marka Medya sekmesinde de iliskili oldugu icin iki farkli ekrandan ayni key'in degistirilmesi admin karisikligina neden olabilir.
- SEO degerleri JSON yapisinda oldugu icin detay sayfasinda yanlis alan silinirse fallback calissa bile gercek marka metni kaybolabilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/site-settings` sayfasini ac.
3. SEO Ayarlari sekmesini sec.
4. Ust dil seciminde aktif locale rozetinin gorundugunu kontrol et.
5. Network panelinde global ve secili locale liste isteklerinin atildigini kontrol et.
6. `site_og_default_image` icin ayri liste isteginin atildigini dogrula.
7. Tabloda `seo`, `site_seo`, varsa `site_meta_default` key'lerinin sirali gosterildigini kontrol et.
8. Arama alaninda `seo` veya `title` ile filtreleme yap.
9. `site_meta_default` icin global override/restore guard'larinin calistigini kontrol et.
10. OG gorseli varsa URL kopyalama ve preview alanini kontrol et.
11. Test ortaminda OG gorselini degistir ve kaydin `{ url }` formatinda tutuldugunu dogrula.
12. Test ortaminda locale override olustur ve backendde bunun ayri locale kaydi mi yoksa key overwrite mi oldugunu not et.
13. Public sayfada title, description ve OG image sonucunu kontrol et.

Otomasyon smoke:

```bash
bun test src/modules/siteSettings
```

## 28. Site Ayarlari SMTP Ayarlari

### Sayfa Amaci

SMTP Ayarlari sekmesi, sistemin e-posta gonderimi icin kullanacagi global SMTP bilgilerini yonetmek ve test maili gondermek icin kullanilir.

Rota:

```text
/admin/site-settings
```

Sekme:

```text
SMTP Ayarlari
```

Bu sekme locale bazli degildir. Admin sayfasinda secili dil bilgisi rozet olarak gorunse de SMTP ayarlari global kabul edilir ve tum sistem mail davranisini etkiler.

### Yonetilen Key'ler

SMTP sekmesi su key'leri yonetir:

- `smtp_host`
- `smtp_port`
- `smtp_username`
- `smtp_password`
- `smtp_from_email`
- `smtp_from_name`
- `smtp_ssl`

Bu key'ler `site_settings` tablosunda tutulur. Backend mail servisi SMTP transporter olustururken bu key'leri okur.

### Form Alanlari

Formdaki alanlar:

- SMTP Host
- SMTP Port
- SSL/TLS switch
- SMTP kullanici adi
- SMTP sifresi
- From e-posta
- From ad
- Test e-posta alicisi

`smtp_ssl` boolean olarak kaydedilir. Diger alanlar string olarak kaydedilir. `smtp_port` frontendde string girilir; backend mail servisinde number'a cevrilir.

### Kullanici Akisi

Beklenen admin akisi:

1. Site Ayarlari sayfasi acilir.
2. SMTP Ayarlari sekmesi secilir.
3. Dil secimi global sekme oldugu icin pasif kalir.
4. Mevcut SMTP key'leri DB'den okunur.
5. Admin host, port, kullanici, sifre, from bilgisi ve SSL ayarini duzenler.
6. Kaydet butonuyla tum SMTP key'leri sirasiyla guncellenir.
7. Test e-posta alicisi girilirse test maili o adrese gonderilir.
8. Test alicisi bos, from e-posta doluysa test maili from adresine gonderilir.
9. Ikisi de bos ise backend login kullanicisinin e-postasini kullanmaya calisir.

### Veri Okuma ve Kaydetme

Liste sorgusu:

```text
GET /admin/site_settings/list?keys=smtp_host,smtp_port,smtp_username,smtp_password,smtp_from_email,smtp_from_name,smtp_ssl
```

Kaydetme sirasinda her key ayri `PUT` istegiyle gonderilir:

```text
PUT /admin/site_settings/smtp_host?locale=*
PUT /admin/site_settings/smtp_port?locale=*
PUT /admin/site_settings/smtp_username?locale=*
PUT /admin/site_settings/smtp_password?locale=*
PUT /admin/site_settings/smtp_from_email?locale=*
PUT /admin/site_settings/smtp_from_name?locale=*
PUT /admin/site_settings/smtp_ssl?locale=*
```

Frontend `locale=*` gonderir ancak mevcut backend controller locale'i ayri kayit ayrimi olarak kullanmaz. SMTP ayarlari backendde key bazli global kayitlar olarak saklanir.

### Test Mail Akisi

Test mail butonu su endpoint'i kullanir:

```text
POST /mail/test
```

Body ornegi:

```json
{ "to": "admin@example.com" }
```

Backend test mail akisi:

1. `to` body icinden okunur.
2. `to` bos ise login kullanicisinin e-postasi denenir.
3. Hedef e-posta bulunamazsa `to_required_for_test_mail` hatasi doner.
4. Mail servisi SMTP config'i `site_settings` tablosundan okur.
5. `smtp_host` yoksa `smtp_host_not_configured` hatasi uretilir.
6. Port bos ise `smtp_ssl=true` icin 465, aksi halde 587 fallback kullanilir.
7. Test maili gonderilir.

### Backend Etkileri

SMTP config okuma servisi:

```text
backend/src/modules/siteSettings/service.ts
```

Mail gonderim servisi:

```text
backend/src/modules/mail/service.ts
```

Mail servisi transporter cache kullanir. Cache signature su alanlara dayanir:

- host
- port
- username
- secure

Password signature'a dahil edilmez. Bu nedenle sadece sifre degisirse mevcut cached transporter'in davranisi mutlaka test edilmelidir.

From bilgisi su sirayla kurulur:

1. `smtp_from_email`
2. `smtp_username`
3. `no-reply@example.com`

`smtp_from_name` doluysa from header'i `Ad <email>` formatina doner.

### Seed ve Env Iliskisi

Seed dosyasinda SMTP icin ornek degerler bulunur:

```text
smtp_host = smtp.example.com
smtp_port = 587
smtp_username = info@promats.com.tr
smtp_password = __SET_IN_ENV__
smtp_from_email = info@promats.com.tr
smtp_from_name = Promats ERP
smtp_ssl = false
```

Backend `core/env.ts` icinde `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` env alanlari da vardir. Ancak mevcut mail servisi aktif gonderimde SMTP config'i `site_settings` tablosundan okur. Env degerleri admin Mail sayfasinda bilgi olarak gosterilse de bu SMTP sekmesindeki DB ayarlariyla karistirilmamalidir.

### Bagli Moduller

SMTP Ayarlari su alanlari etkiler:

- Admin Mail sayfasi
- Test mail gonderimi
- Siparis olustu maili
- Genel mail gonderim endpointleri
- E-posta template sistemleri
- Site settings admin endpointleri
- Admin audit ve operasyon loglari

### Sik Hata Durumlari

- `smtp_host` bos ise test maili `smtp_host_not_configured` ile basarisiz olur.
- `smtp_port` sayisal degilse backend `Number()` sonucu gecersiz olabilir ve nodemailer hatasi olusabilir.
- SSL acik/kapali durumu port ile uyumsuzsa baglanti timeout veya auth hatasi alinabilir.
- `smtp_password` seed degeri `__SET_IN_ENV__` kalirsa gercek mail gonderimi basarisiz olur.
- From e-posta domaini SMTP kullanicisiyle uyumsuzsa provider maili reddedebilir.
- Test e-posta bos ve kullanici e-postasi token icinde yoksa `to_required_for_test_mail` doner.
- Kaydetme islemi coklu `PUT` oldugu icin arada hata olursa SMTP ayarlari kismi guncellenmis kalabilir.

### Genel Riskler

- SMTP sifresi DB'de site setting degeri olarak tutulur; erisim yetkisi, loglama ve yedekleme politikasi buna gore dusunulmelidir.
- Form sifre alanini mevcut degerle doldurur; yetkisiz ekran goruntusu veya browser autofill davranisi hassas bilgi riski olusturabilir.
- Password transporter cache signature'ina dahil olmadigi icin sadece sifre degisimi sonrasinda test maili mutlaka denenmelidir.
- Env ve DB kaynaklari arasindaki fark admin icin kafa karistirabilir; gercek gonderim kaynagi DB olarak dokumante edilmelidir.
- Yanlis SMTP ayari siparis, bildirim veya operasyon mail akisini tamamen durdurabilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/site-settings` sayfasini ac.
3. SMTP Ayarlari sekmesini sec.
4. Dil seciminin global sekme olarak pasif oldugunu kontrol et.
5. Network panelinde SMTP key listesi isteginin atildigini dogrula.
6. Formda host, port, username, from email, from name ve SSL alanlarinin doldugunu kontrol et.
7. Test e-posta alicisi girerek test mail gonder.
8. Basarili durumda `{ ok: true }` yanitini ve toast mesajini kontrol et.
9. Test maili gercek mailbox'a dustu mu kontrol et.
10. Yanlis host veya bos test alicisi gibi hata senaryolarinda backend hata mesajinin UI'da gorundugunu kontrol et.
11. Sadece test ortaminda SMTP sifresini degistirip kaydet; ardindan test maili tekrar gonder.
12. Kaydetme sirasinda her SMTP key'i icin `PUT /admin/site_settings/:key?locale=*` isteginin atildigini dogrula.

Otomasyon smoke:

```bash
bun test src/modules/siteSettings
```

## 29. Site Ayarlari Cloudinary Ayarlari

### Sayfa Amaci

Cloudinary Ayarlari sekmesi, sistemin medya depolama davranisini yonetmek icin kullanilir. Bu ekran yalnizca Cloudinary bilgilerini degil, local storage ve public URL ayarlarini da kapsayan global storage konfigurasyon ekranidir.

Rota:

```text
/admin/site-settings
```

Sekme:

```text
Cloudinary Ayarlari
```

Bu sekme locale bazli degildir. Ayarlar tum admin panel ve public medya yukleme/gosterim akisini etkileyen global kayitlardir.

### Yonetilen Key'ler

Cloudinary / Storage sekmesi su key'leri yonetir:

- `storage_driver`
- `storage_local_root`
- `storage_local_base_url`
- `storage_cdn_public_base`
- `storage_public_api_base`
- `cloudinary_cloud_name`
- `cloudinary_api_key`
- `cloudinary_api_secret`
- `cloudinary_folder`
- `cloudinary_unsigned_preset`

`storage_driver` icin beklenen ana degerler:

- `local`
- `cloudinary`

### Form Alanlari

Formdaki alanlar:

- Storage driver
- Local root
- Local base URL
- CDN public base
- Public API base
- Cloudinary cloud name
- Cloudinary API key
- Cloudinary API secret
- Cloudinary folder
- Cloudinary unsigned preset

Tum alanlar string olarak kaydedilir. `cloudinary_api_secret` hassas bilgidir ve DB'de site setting degeri olarak tutulur.

### Kullanici Akisi

Beklenen admin akisi:

1. Site Ayarlari sayfasi acilir.
2. Cloudinary Ayarlari sekmesi secilir.
3. Dil secimi global sekme oldugu icin pasif kalir.
4. Storage key'leri DB'den okunur.
5. Admin driver, local path, public URL ve Cloudinary credential bilgilerini duzenler.
6. Kaydet butonuyla tum storage key'leri sirasiyla guncellenir.
7. Test butonuyla Cloudinary diag endpoint'i calistirilir.
8. Test basariliysa Cloudinary ping ve kucuk upload islemi dogrulanir.

### Veri Okuma ve Kaydetme

Liste sorgusu:

```text
GET /admin/site_settings/list?keys=storage_driver,storage_local_root,storage_local_base_url,storage_cdn_public_base,storage_public_api_base,cloudinary_cloud_name,cloudinary_api_key,cloudinary_api_secret,cloudinary_folder,cloudinary_unsigned_preset
```

Kaydetme sirasinda her key ayri `PUT` istegiyle gonderilir:

```text
PUT /admin/site_settings/storage_driver?locale=*
PUT /admin/site_settings/storage_local_root?locale=*
PUT /admin/site_settings/storage_local_base_url?locale=*
PUT /admin/site_settings/storage_cdn_public_base?locale=*
PUT /admin/site_settings/storage_public_api_base?locale=*
PUT /admin/site_settings/cloudinary_cloud_name?locale=*
PUT /admin/site_settings/cloudinary_api_key?locale=*
PUT /admin/site_settings/cloudinary_api_secret?locale=*
PUT /admin/site_settings/cloudinary_folder?locale=*
PUT /admin/site_settings/cloudinary_unsigned_preset?locale=*
```

Frontend `locale=*` gonderir ancak mevcut backend controller locale'i ayri kayit ayrimi olarak kullanmaz. Bu ayarlar key bazli global kayitlar olarak saklanir.

### Cloudinary Test Akisi

Test butonu su endpoint'i kullanir:

```text
GET /admin/storage/_diag/cloud
```

Backend diag akisi:

1. `getCloudinaryConfig()` calisir.
2. Config yoksa veya `storage_driver=local` ise `501 cloudinary_not_configured` doner.
3. Cloudinary `api.ping()` calistirilir.
4. Ping basarisizsa `502` ve `step=api.ping` doner.
5. 1x1 piksel test gorseli upload edilir.
6. Upload basarisizsa `502` ve `step=uploader.upload` doner.
7. Basariliysa `ok`, `cloud`, `uploaded.public_id` ve `uploaded.secure_url` doner.

Frontend 501 durumunda driver local veya eksik config mesajini ayri ele alir. 502 durumunda hata adimini ve mesajini toast ile gosterir.

### Backend Etkileri

Storage config okuma servisi:

```text
backend/src/modules/siteSettings/service.ts
```

Cloudinary config ve upload servisi:

```text
backend/src/modules/storage/cloudinary.ts
```

Diag endpoint:

```text
backend/src/modules/storage/admin.controller.ts
```

Backend storage ayarlarinda oncelik sirasi:

1. `site_settings` tablosundaki key degeri
2. Env fallback degeri
3. Driver icin default `cloudinary`

Cloudinary config 30 saniye cache'lenir. Ayar degistirildikten hemen sonra test veya upload yaparken eski config kisa sure kullanilabilir.

### Env Iliskisi

Backend tarafinda su env alanlari fallback olarak kullanilabilir:

- `STORAGE_DRIVER`
- `LOCAL_STORAGE_ROOT`
- `LOCAL_STORAGE_BASE_URL`
- `STORAGE_CDN_PUBLIC_BASE`
- `STORAGE_PUBLIC_API_BASE`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`
- `CLOUDINARY_UNSIGNED_PRESET`

Mevcut uygulama davranisinda DB degeri varsa env fallback'in onune gecer. Bu nedenle admin ekranindan girilen bos veya yanlis deger, dogru env degerini fiilen devre disi birakabilir.

### Bagli Moduller

Cloudinary Ayarlari su alanlari etkiler:

- Admin Storage sayfasi
- Gorsel ve dosya yukleme alanlari
- Marka medya ayarlari
- SEO OG gorseli
- Urun/proje/blog gorsel upload alanlari
- Public medya URL cozumleme
- Local storage fallback akisi
- Storage asset veritabani kayitlari

### Sik Hata Durumlari

- `storage_driver=local` iken Cloudinary testi 501 ile basarisiz olur.
- Driver `cloudinary` iken cloud name, api key veya api secret eksikse config olusmaz.
- Yanlis API secret `api.ping` veya upload adiminda 502 hatasi uretir.
- `cloudinary_unsigned_preset` bos ise unsigned multipart upload endpoint'i kullanilamaz.
- `storage_local_root` yazilamaz path ise local upload fallback calisir veya upload basarisiz olur.
- Public base URL yanlissa yuklenen dosya kaydi olussa bile public tarafta medya acilmayabilir.
- Kaydetme islemi coklu `PUT` oldugu icin arada hata olursa storage config kismi guncellenmis kalabilir.

### Genel Riskler

- `cloudinary_api_secret` DB'de site setting olarak tutulur; backup, log ve admin yetki politikasi buna gore ele alinmalidir.
- DB/env oncelik farki admin icin yaniltici olabilir; ekranda bos bir alan kaydedilirse calisan env fallback'i devre disi kalabilir.
- Cloudinary config 30 saniye cache'lendigi icin kaydetme sonrasi testte eski config gorulebilir.
- Storage driver degisikligi yeni yuklemeleri etkiler; mevcut storage asset kayitlari eski provider URL'leriyle kalabilir.
- Yanlis public base veya CDN base degeri SEO, marka medya ve urun gorsellerinin public tarafta kirik gorunmesine neden olabilir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/site-settings` sayfasini ac.
3. Cloudinary Ayarlari sekmesini sec.
4. Dil seciminin global sekme olarak pasif oldugunu kontrol et.
5. Network panelinde storage key listesi isteginin atildigini dogrula.
6. Formda `storage_driver`, local URL alanlari ve Cloudinary alanlarinin doldugunu kontrol et.
7. Kaydet butonuna test ortaminda bas ve her storage key icin `PUT` istegi atildigini dogrula.
8. `storage_driver=cloudinary` ve credential'lar doluyken Test butonunu calistir.
9. `GET /admin/storage/_diag/cloud` yanitinda `ok=true`, `cloud` ve `uploaded.public_id` degerlerini kontrol et.
10. `storage_driver=local` durumunda testin beklenen 501/local mesajiyla dondugunu kontrol et.
11. Test upload sonucu Cloudinary hesabinda `diag` klasorunde kayit olustugunu dogrula.
12. Ayar degisikligi sonrasi 30 saniyelik cache riskini not ederek testi tekrar calistir.

Otomasyon smoke:

```bash
bun test src/modules/storage
bun test src/modules/siteSettings
```

## 34. Site Ayari Detay

### Sayfa Amaci

Site Ayari Detay sayfasi, tek bir site setting key'ini structured form veya ham JSON/metin modu ile duzenlemek icin kullanilir.

Rota:

```text
/admin/site-settings/[id]
```

Ornek:

```text
/admin/site-settings/contact_info?locale=tr
/admin/site-settings/seo?locale=*
```

Bu sayfa Liste, Global Liste, Genel Ayarlar, SEO, Marka Medya ve diger structured sekmelerden gelen Duzenle linklerinin ortak hedefidir.

### Route ve Locale Davranisi

Sayfa key'i route parametresinden alir:

```text
id -> settingKey
```

Locale query parametresinden okunur:

```text
?locale=tr
?locale=*
```

Locale yoksa secim sirasi:

1. Query locale gecerliyse onu kullanir.
2. DB'den gelen `default_locale` gecerliyse onu kullanir.
3. Ilk aktif locale kullanilir.
4. Son fallback olarak global veya bos secim kullanilir.

Secilen locale URL ile senkron tutulur. Admin dropdown'dan locale degistirirse route `?locale=...` ile replace edilir.

### Locale Kaynagi

Detay sayfasi aktif locale listesini ortak hook uzerinden okur:

```text
site_settings.app_locales
site_settings.default_locale
```

Aktif locale listesi yoksa sayfa duzenleme formu yerine uyari karti gosterir ve Site Ayarlari listesine donus aksiyonu sunar.

### Veri Okuma Davranisi

Sayfa once liste endpointiyle exact row arar:

```text
GET /admin/site_settings/list?keys={settingKey}&locale={selectedLocale}&limit=10&offset=0
```

Ardindan fallback-aware tekil okuma yapar:

```text
GET /admin/site_settings/{settingKey}?locale={selectedLocale}
```

Kullanilan row secimi:

1. Liste sonucunda key + locale exact match varsa o kullanilir.
2. Exact match yoksa ayni key'e ait ilk row kullanilir.
3. Liste sonucundan row bulunmazsa tekil get sonucu kullanilir.

Tekil get sonucundaki effective locale secili locale'den farkliysa fallback bildirimi gosterilebilir.

### Form Modlari

Detay formu iki mod destekler:

- Structured
- Raw

Structured mod uygun renderer varsa acilir. Uygun renderer yoksa JSON editor veya raw mode kullanilir.

Raw mod davranisi:

- Textarea icindeki deger JSON parse edilebilirse JSON olarak kaydedilir.
- JSON parse edilemiyorsa string olarak kaydedilir.
- Bos metin `null` olarak kaydedilir.

### Structured Renderer Eslesmeleri

SEO key'leri:

- `seo` -> SEO structured form
- `site_seo` -> SEO structured form
- `site_meta_default` -> JSON structured editor

Genel ayar key'leri:

- `contact_info` -> Contact structured form
- `socials` -> Socials structured form
- `company_profile` -> Company profile structured form
- `ui_header` -> UI header structured form
- `businessHours` -> Business hours structured form

Diger tum key'ler:

- JSON structured editor
- Raw editor

### Kaydetme Davranisi

Kaydetme endpointi:

```text
PUT /admin/site_settings/{key}?locale={selectedLocale}
```

Save guard:

- `site_meta_default` global `locale=*` ile kaydedilemez.
- Bu durumda toast hata mesaji gosterilir ve request atilmaz.

Basarili kayit sonrasi:

- Toast basari mesaji gosterilir.
- Liste sorgusu refetch edilir.

### Silme Davranisi

Silme endpointi:

```text
DELETE /admin/site_settings/{key}?locale={selectedLocale}
```

Silme oncesi confirm penceresi gosterilir. Basarili silme sonrasi refetch calisir.

Mevcut backend semasinda `locale` kolonu olmadigi icin silme islemi pratikte key bazli calisabilir. Bu nedenle detay sayfasinda locale secili olsa bile key'in tamamini silme riski vardir.

### Backend Etkileri

Kullanilan endpointler:

```text
GET /admin/site_settings/list
GET /admin/site_settings/:key
PUT /admin/site_settings/:key
DELETE /admin/site_settings/:key
GET /admin/site_settings/app-locales
GET /admin/site_settings/default-locale
```

Backend mevcut durumda `locale` parametresini gercek bir locale kolonuna gore ayirmadigi icin detail sayfasinin locale-aware UI'i ile backend tekil key-value modeli arasinda fark vardir.

### Bagli Moduller

Site Ayari Detay sayfasi su alanlarla iliskilidir:

- Site Ayarlari Liste
- Site Ayarlari Global Liste
- Genel Ayarlar
- SEO Ayarlari
- Marka Medya Ayarlari
- Branding Ayarlari
- Dil Ayarlari
- Storage upload alanlari
- Public site settings kullanimi

### Sik Hata Durumlari

- `app_locales` bos ise detay formu acilmaz ve locale uyarisi gosterilir.
- Query locale aktif listede yoksa sayfa default veya ilk aktif locale'e gecer.
- Raw mode'da hatali JSON string olarak kaydedilir; admin JSON kaydettigini sanabilir.
- Structured renderer olmayan key'lerde admin ham JSON editor ile calismak zorunda kalir.
- `site_meta_default` global kaydetme guard'i sadece save tarafinda vardir; mevcut bozuk global kayit varsa temizleme/detay davranisi ayrica test edilmelidir.
- Silme islemi locale secili olsa bile backendde key bazli silme riski tasir.

### Genel Riskler

- Detay sayfasi cok guclu bir admin aracidir; yanlis key veya raw JSON duzenlemesi public site, mail, medya, SEO veya entegrasyon davranisini bozabilir.
- Locale secimi UI'da guven verir ancak backend locale ayrimi yoksa admin tek dil icin degil global key icin islem yapmis olabilir.
- Raw mode JSON parse fallback'i sessizdir; bozuk JSON string olarak kaydedilip downstream kodda tip hatasi uretilebilir.
- Structured formlar sadece bilinen key'lerde guvenli alanlar sunar; diger key'lerde schema validation zayiftir.
- Delete aksiyonu geri alinmaz; onemli key'lerde silmeden once mevcut value not alinmalidir.

### Smoke Test Notlari

Minimum manuel smoke:

1. Admin olarak login ol.
2. `/admin/site-settings` sayfasini ac.
3. Liste veya structured sekmeden bir key icin Duzenle butonuna tikla.
4. URL'in `/admin/site-settings/{key}?locale=...` formatinda oldugunu dogrula.
5. Locale dropdown'unun aktif locale listesini gosterip gostermedigini kontrol et.
6. Locale degistirildiginde URL query parametresinin guncellendigini dogrula.
7. `contact_info` gibi bilinen key'de structured formun acildigini kontrol et.
8. Bilinmeyen bir test key'inde JSON editor/raw mod davranisini kontrol et.
9. Raw mode'da gecerli JSON kaydet ve backendde JSON value olarak saklandigini dogrula.
10. Raw mode'da gecersiz JSON kaydetme davranisini test ortaminda string olarak not et.
11. `site_meta_default?locale=*` kaydetmenin guard ile engellendigini kontrol et.
12. Test key'i uzerinde silme islemini dene ve backendde key/locale etkisini dogrula.

Otomasyon smoke:

```bash
bun test src/modules/siteSettings
```
