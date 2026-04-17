# Uretim Planlama V1 Kapsami

Bu belge, [`ÜRETİM PLANLAMA NOTLAR.docx`](/home/orhan/Documents/Projeler/paspas/%C3%9CRET%C4%B0M%20PLANLAMA%20NOTLAR.docx) icindeki is kurallarina gore Paspas ERP icin V1 kapsamini netlestirir.

Amaç:
- mevcut modulleri notlara gore duzeltmek
- eksik alan ve akislari belirlemek
- V1 icin "simdi yapilacak" ile "sonraya kalabilir" ayrimini netlestirmek

## V1 Prensipleri

- V1, sahadaki planlama akislarini dogru modellemeli.
- V1'de veri modeli once duzeltilmeli, sonra ekranlar revize edilmeli.
- Operasyon mantigi, birim donusumu, plan-gerceklesen ayrimi ve stok hareketleri ilk sinif kavramlar olmali.
- "Dashboard" ikincil; asil yonetici ekrani hareket gecmisi olabilir.

## Mevcut Moduller

Su an projede mevcut ana moduller:
- Urunler
- Receteler
- Musteriler
- Satis Siparisleri
- Uretim Emirleri
- Makine Havuzu
- Makine Is Yukleri
- Gantt
- Stoklar
- Satin Alma
- Hareketler
- Operator
- Tanimlar
- Tedarikci
- Dashboard
- Medyalar
- Site Ayarlari
- Veritabani
- Audit Loglari
- Kullanicilar
- User Roles
- Bildirimler

Su an veri modeli bazi ana ihtiyaclari karsilamiyor:
- urunde kategori, tedarik tipi, operasyon tipi, KDV, birim hiyerarsisi yok
- uretim emrinde musteri ozeti, termin uyari mantigi, planlanan bitis hesap altyapisi zayif
- makine kuyrugunda operasyon bazli plan yok
- operator kayitlarinda vardiya, durus, fire, net uretim ve plan guncelleme akisi eksik
- satin alma ile mal kabul arasinda dogrudan akis eksik
- stok ekrani hammadde / yari mamul / urun ayrimini ve birim donusumunu gostermiyor
- yonetim modullerinde ERP'ye ozel gorev / permission / personel kurgusu eksik

## Modul Bazli V1

## 1. Urunler

### V1'de olacak

- Kategori:
  - urun
  - yari_mamul
  - hammadde
- Tedarik tipi:
  - uretim
  - satin_alma
  - fason opsiyonu su an `uretim` altinda gecici ele alinabilir
- SKU / kod
- Urun adi
- Aciklama
- Gorsel
- Ana birim
- Birim hiyerarsisi / donusumleri
  - ornek: 1 koli = 6 takim
  - ornek: 1 cuval = 25 kg
- Satis fiyati
- KDV orani
- Operasyon tipi:
  - tek_tarafli
  - cift_tarafli
- Operasyon bazli alanlar:
  - operasyon adi
  - kalip
  - hazirlik suresi
  - cevrim suresi
  - montaj flag'i
- Stok
- Aktif / pasif

### Is Kurallari

- Kategori `urun` degilse operasyon tipi sorulmaz; sistem tek operasyon varsayar.
- Tedarik tipi `satin_alma` ise uretim alanlari ekranda gizlenir.
- Operasyon tipi `tek_tarafli` ise tek operasyon olusur.
- Operasyon tipi `cift_tarafli` ise iki operasyon olusur:
  - `urun adi + sag`
  - `urun adi + sol`
- Montaj ayri bir operasyon olarak modellenmeyecek; ilgili operasyona bagli bir flag olarak izlenecek.

### Mevcut duruma gore eksikler

- kategori yok
- tedarik tipi yok
- birim hiyerarsisi yok
- KDV yok
- operasyon tipi yok
- operasyon alt satirlari yok
- kalip / hazirlik / cevrim sureleri urunde yok

## 2. Receteler

### V1'de olacak

- Mevcut sade yapi korunur
- Recete kalemlerinde hammadde / yari mamul ihtiyaci net olmali
- Miktar ve birim mantigi urundeki birim donusumu ile uyumlu olmali

### Ek ihtiyac

- Uretim emri ve stok yeterlilik hesaplari receteden beslenecek
- Cift tarafli urunlerde operasyon bazli recete ihtiyaci gerekip gerekmedigi netlestirilmeli
  - V1 onerisi: recete urun seviyesinde kalsin, operasyon bazli detay V2'ye birakilabilir

## 3. Musteriler

### V1'de olacak

- Mevcut yapi korunur
- Iskonto orani siparis ekranina otomatik tasinmali

### Istege bagli ama faydali

- sevkiyat notu
- cari kodu

## 4. Satis Siparisleri

### V1'de olacak

- Yeni sipariste siparis tarihi varsayilan olarak bugun gelsin
- Termin tarihi bos gelsin
- Urun secilince satis fiyati otomatik gelsin
- Musteri secilince iskonto otomatik gelsin
- Urunden KDV orani gelsin
- Siparis kalem bazli calissin
- Siparis durumlari:
  - taslak
  - planlandi
  - uretimde
  - kismi_sevk
  - tamamlandi
  - kapali
  - iptal
- Uretildi mi / sevk edildi mi ozetleri gorunsun
- Kullanici siparisi kapatabilsin

### V1 is kurallari

- Uretim emrine donusmemis siparis duzenlenebilir / silinebilir
- Uretim emrine donusmus sipariste degisiklik kisitlanmali
- Sevk miktari siparis kalemlerinden dusmeli

### Mevcut duruma gore eksikler

- KDV urunden beslenmiyor
- iskonto akisi teyit edilmeli
- sevk / uretim ilerleme alanlari guclendirilmeli
- siparis kilitleme kurallari yok

## 5. Uretim Emirleri

### V1'de olacak

- Siparisten uretim emri olusturma
- Manuel uretim emri olusturma
- Siparis disi uretim yapabilme
- Siparis satirlarindan kismi miktar secerek emir acabilme
- Miktar siparisten az veya cok olabilir
- Musteri gosterimi:
  - tek musteri ise musteri adi
  - toplu ise `Toplam siparis`
- Termin tarihi gosterimi
- Planlanan bitis tarihi hesaplama
- Durum:
  - planlandi
  - makineye_atandi
  - uretimde
  - durakladi
  - kismi_tamamlandi
  - tamamlandi
  - kapatildi
  - iptal

### Kritik is kurallari

- Planlanan bitis tarihi operasyonlarin makine sirasina gore hesaplanmali
- Cift tarafli urunde iki operasyon ayni makinadaysa ardarda hesaplanmali
- Farkli makinelerdelerse paralel akisa gore en gec biten operasyon esas alinmali
- Termin tarihi planlanan bitisten onceyse uyari verilmeli
- Uretim basladiktan sonra silme yerine iptal / kapama mantigi olmali

### Mevcut duruma gore eksikler

- operasyon bazli emir detayi yok
- musteri ozeti yok
- termin riski hesaplamasi yok
- planlanan bitis motoru zayif
- duzeltme / silme kurallari yok

## 6. Makine Havuzu

### V1'de olacak

- Uretim emri olusunca havuza dusmeli
- Operasyon bazli makine atamasi yapilmali
- Cift tarafli urunde iki operasyon icin ayri makine secilebilmeli
- Iki operasyon ayni makineye verilirse sira otomatik atanabilmeli
- Farkli makinelere verilirse montajin hangi makinede yapilacagi secilebilmeli

### Mevcut duruma gore eksikler

- kuyruk kaydi operasyon degil sadece uretim emri bazli
- montaj makinesi secimi yok
- ayni emrin iki operasyonunu baglama mantigi yok

## 7. Makine Is Yukleri

### V1'de olacak

- Satirlarda musteri adi veya `Toplam siparis` gorunsun
- Drag and drop ile sira degistirme
- Makineler arasi tasima
- Hangi satirin montajli oldugu gorunsun
- Yapilan siralama uretim emrinin planlanan bitis tarihini guncellesin

### Mevcut duruma gore eksikler

- operasyon bazli surukle-birak net degil
- makine arasi tasima teyit edilmeli
- plan-bitis geri beslemesi guclendirilmeli

## 8. Gantt Plani

### V1'de olacak

- Makine bazli gorsel plan
- Zoom in / zoom out
- Filtreleme:
  - uretim emri
  - urun
  - makine
- Cift tarafli urunde iki operasyonu ayni filtrede gorebilme
- Montaj ibaresi ilgili operasyonda gorunmeli
- Gerceklesen / tamamlanan isleri ayirt edebilme

### Not

- V1'de tam kapsamli ileri seviye planlayici degil; okunabilir operasyon takvimi yeterli.

## 9. Malzeme Stoklari

### V1'de olacak

- Hammadde stok gorunumu
- Alt sekmede urun stok gorunumu
- Recete ve acik uretim emirlerine gore gereken miktar hesaplama
- Birim ve donusum gosterimi
  - ornek: 750 kg = 30 cuval
- Durum:
  - yeterli
  - kritik
  - yetersiz

### Mevcut duruma gore eksikler

- mevcut stok modulu urun tablosunu dogrudan listeliyor
- hammadde / yari mamul / urun ayrimi yok
- gereken miktar hesaplama yok
- birim donusum gosterimi yok

## 10. Satin Alma Siparisleri

### V1'de olacak

- Yetersiz malzemeler icin satin alma kaydi acma
- Tedarikci, miktar, fiyat, termin bilgisi
- Siparis durumlari:
  - taslak
  - siparis_verildi
  - kismi_kabul
  - tamamlandi
  - iptal
- Mal kabul ile baglantili olma

### Kritik is kurali

- Depoya girmemis satin alma kalemleri operator ekraninda `Mal Kabul` sekmesinde gorunmeli
- Gelen miktar siparistekinden az veya cok olabilir

### Mevcut duruma gore eksikler

- satin alma var ama mal kabul entegrasyonu eksik
- kalan kabul miktari mantigi eksik

## 11. Hareket Gecmisi

### V1'de olacak

- Varsayilan olarak gun icindeki:
  - sevkiyatlar
  - mal kabuller
  - uretimler
- Tarih filtresi:
  - bugun
  - bu hafta
  - ozel aralik
- Yonetici ozet ekrani gibi calismali

### Karar

- Ayrica ayri bir klasik dashboard zorunlu degil
- Hareket gecmisi yonetici ana ekrani gibi kullanilabilir

### Mevcut duruma gore eksikler

- hareket kayitlari var ama olay bazli yonetici ozeti seviyesinde degil
- sevkiyat / mal kabul / uretim olaylarini ortak timeline'da birlestirmek gerekiyor

## 12. Operator Ekrani

### V1'de olacak

- Alt sekmeler:
  - Makine Kuyrugu
  - Urun Sevk
  - Mal Kabul
- Operator sadece ilk siradaki isi baslatabilsin
- Devam eden isi bitirebilsin
- Bitirirken su alanlar girilsin:
  - uretilen miktar
  - fire miktari
  - net miktar
- Montaj makinesindeki operator `takim` girer
- Montaj olmayan operatorde baski adedi girilir
- Vardiya butonlari:
  - Vardiya Basi
  - Vardiya Sonu
- Duraklat / Devam Et
- Duraklatirken durus nedeni zorunlu olsun

### Kritik is kurallari

- Operator gerceklesen bitis zamani girdiginde sonraki islerin plan baslangici kaymali
- Bu kayma ayni makinedeki sonraki tum isleri etkilemeli
- Vardiyalar:
  - Gunduz: 07:30 - 19:30
  - Gece: 19:30 - 07:30

### Sevkiyat alt sekmesi

- Musteri sec
- Uretimi tamamlanmis urunleri listele
- Hangi urunden kac adet / koli sevk edildigini gir
- Ayni turda birden fazla musteri icin islem yapilabilsin
- Sevk edilen urunler:
  - stoktan duser
  - siparisten duser
  - siparis sevk durumu guncellenir

### Mal kabul alt sekmesi

- Tamami depoya girmemis satin alma siparisleri listelenir
- Gelen miktar girilir
- Satin alma kalan miktari azalir
- Stok artar

### Mevcut duruma gore eksikler

- operator modulu simdilik gunluk kayit odakli
- vardiya takibi yok
- fire / net yok
- duraklatma nedeni eksik
- sevkiyat ve mal kabul alt akislarinin veri modeli eksik
- plani gerceklesen veriye gore kaydirma motoru yok

## 13. Tanimlar ve Ayarlar

### V1'de olacak

- Kalip tanimlari
- Kalip - uygun makine iliskisi
- Tatil takvimi
- Gerekirse vardiya ayari

### Kritik is kurallari

- Kalip seciminde sadece uygun makineler listelenmeli veya uyari verilmeli
- Tatil gun / saatleri planlama suresine eklenmeli
- Tatil yoksa makine 7/24 calisiyor varsayilabilir

### Mevcut duruma gore eksikler

- kalip - makine uyumluluk matrisi yok
- tatil sadece tarih bazli, saat araligi yok
- vardiya tanimlari sistematik degil

## 14. Tedarikci

### V1'de olacak

- Mevcut sade yapi korunur
- Satin alma ile iliskisi guclendirilir

## 15. Dashboard

### V1'de olacak

- Bugunku aktivite kartlari
- Genel durum KPI'lari
- Son hareketler
- Dusuk stok uyarilari
- Trend grafikleri
- Kritik is listeleri:
  - geciken termin
  - acik satin alma
  - bekleyen sevkiyat
  - atanmis gorevler

### Mevcut duruma gore eksikler

- rol bazli dashboard farklilasmasi yok
- gorev / aksiyon merkezi yok
- kullaniciya ozel widget konfigrasyonu yok

## 16. Medyalar

### V1'de olacak

- Gorsel / dosya / belge havuzu
- Urun, kalip, recete ve evraklara baglanabilme
- Klasor / etiket / kullanim amaci bilgisi

### Mevcut duruma gore eksikler

- ERP nesnesi bazli medya iliskisi zayif
- belge tipleri ve revizyon takibi yok

## 17. Site Ayarlari

### V1'de olacak

- Sirket temel bilgileri
- Logo / belge / sablon ayarlari
- Evrak seri yapilari
- Planlama varsayimlari:
  - vardiya defaultlari
  - teslim / termin uyarisi esikleri

### Mevcut duruma gore eksikler

- ERP'ye ozel firma / evrak ayarlari eksik
- planlama defaultlari ayar ekranina bagli degil

## 18. Veritabani

### V1'de olacak

- Moduler import / export
- Snapshot / geri donus mekanizmasi
- Seed / demo veri ayrimi
- ERP modul bazli veri dogrulama panelleri

### Mevcut duruma gore eksikler

- guvenli modul bazli operasyon matrisi yok
- ERP import validasyon kurallari net degil

## 19. Audit Loglari

### V1'de olacak

- Kim, ne zaman, hangi kaydi degistirdi?
- Modul bazli filtreler
- CRUD ve kritik aksiyonlarin takibi
- Gerekirse before / after farki

### Mevcut duruma gore eksikler

- ERP preset filtreleri yok
- diff gorunumu yok
- kritik olaylardan gorev / bildirim uretimi yok

## 20. Kullanicilar

### V1'de olacak

- Kullanici listeleme / detay
- Aktif / pasif yonetimi
- Rol atama
- ERP personel baglantisi:
  - operator
  - satin almacı
  - sevkiyat sorumlusu

### Mevcut duruma gore eksikler

- ERP personel karti ve departman eslesmesi yok
- makine / depo / surec bazli kullanici baglari yok

## 21. Permission / Yetki

### V1'de olacak

- Rol bazli erisim
- Modul bazli izin matrisi
- Aksiyon bazli yetki:
  - goruntule
  - olustur
  - guncelle
  - sil
  - onayla
  - export

### Mevcut duruma gore eksikler

- sadece role-based access var
- granular permission matrisi yok
- kullanici bazli istisna izinleri yok

## 22. Gorevler

### V1'de olacak

- Sistem ici gorev kayitlari
- Kullaniciya / role atama
- Termin ve oncelik
- Kaynak kayit baglantisi:
  - satis siparisi
  - uretim emri
  - satin alma
  - audit olayi
- Dashboard ve bildirim entegrasyonu

### Mevcut duruma gore eksikler

- V1 kapsami icin temel gorev veri modeli eklendi
- Gorev ekranlari eklendi
- Dashboard ve bildirim entegrasyonu eklendi
- Audit olaylarindan otomatik gorev kural motoru V2'ye birakildi

## 23. Giris Ayarlari

### V1'de olacak

- ERP login durum merkezi
- Admin / sevkiyat / operator / satin alma hesaplarini tek ekranda izleme
- Hedef route / role card / hizli login ayarlari
- Runtime auth bilgileri:
  - public url
  - frontend url
  - cors
  - temp login durumu
  - admin allowlist

### Mevcut duruma gore eksikler

- Gelismis auth policy yonetimi yok
- 2FA/MFA yok
- IP / cihaz bazli kisit yok
- Login basarisiz deneme / lockout politikasi yok

## Yeni Alt Moduller / Kavramlar

V1 icin tamamen yeni ama gerekli kavramlar:

- Urun birim donusumleri
- Urun operasyonlari
- Uretim emri operasyonlari
- Kalip-makine uyumluluklari
- Operator vardiya kayitlari
- Durus nedenleri
- Sevkiyat kayitlari
- Mal kabul kayitlari
- Siparis ve uretim icin is kural tabanli silme / iptal mekanizmasi
- Permission matrisi
- Gorev kayitlari
- ERP personel baglantisi

## V1 Oncelik Sirasi

1. Veri modeli duzeltmeleri
- urunler
- operasyonlar
- birim donusumleri
- uretim emri operasyonlari
- makine atama / kuyruk
- operator gerceklesen kayitlari
- sevkiyat / mal kabul
- kullanici / rol / gorev / permission veri modeli

2. Hesap motorleri
- planlanan sure
- planlanan bitis
- termin riski
- stok yeterlilik
- gerceklesen uretime gore plan kaydirma
- dashboard aksiyon ozetleri

3. Ekran revizyonlari
- urunler
- satis siparisleri
- uretim emirleri
- makine havuzu
- is yukleri
- operator
- stoklar
- satin alma
- hareketler
- tanimlar
- dashboard
- kullanicilar
- permission matrisi
- gorevler
- site ayarlari ERP sekmesi

## V1 Disinda Kalabilecekler

Bunlar gerekirse V2'ye birakilabilir:
- operasyon bazli detayli recete
- gelismis kapasite optimizasyonu
- otomatik en iyi makine onerisi
- cok ileri gantt filtre ve raporlama
- fire sapma yuzdesine gore ileri seviye kalite uyarilari
- gelismis widget builder
- satir bazli audit diff gorsellestirme

## Uygulama Notu

Bu belgeye gore ilk teknik faz icin onerilen implementasyon sirası:

1. Urunler veri modelini genislet
2. Operasyon ve birim donusum tablolarini ekle
3. Uretim emri operasyon modelini kur
4. Makine havuzu / is yukleri plan mantigini operasyon bazina cek
5. Operator gerceklesen kayitlarini vardiya + fire + net uretim ile genislet
6. Sevkiyat ve mal kabul akislarini ekle
7. Stok ve hareket gecmisi ekranlarini bunlara bagla
