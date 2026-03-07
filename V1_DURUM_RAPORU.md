# Paspas ERP — V1 Durum Raporu

> **Tarih:** 2026-03-07
> **Referans:** `URETIM_PLANLAMA_V1.md`
> **Amac:** Her modulun V1 planina gore mevcut durumunu, tamamlanan ve eksik islemleri kayit altina almak.
> **Not:** V1 kapsami disina tasinan ve belgede `V2` olarak isaretlenen maddeler ayri backlog olarak [V2_DURUM_RAPORU.md](/home/orhan/Documents/Projeler/paspas/V2_DURUM_RAPORU.md) dosyasina alinmistir.

---

## Ozet Tablo

| #  | Modul              | Backend | Frontend         | V1 Kapsam | Durum                                                         |
| -- | ------------------ | ------- | ---------------- | --------- | ------------------------------------------------------------- |
| 1  | Urunler (+ Recete) | ✅ Tam  | ✅ Tam           | %100      | V1 kapsami tamamlandi                                         |
| 2  | Musteriler         | ✅ Tam  | ✅ Tam           | %100      | V1 kapsami tamamlandi                                         |
| 3  | Satis Siparisleri  | ✅ Tam  | ✅ Tam           | %100      | V1 kapsami tamamlandi                                         |
| 4  | Uretim Emirleri    | ✅ Tam  | ✅ Tam           | %100      | V1 kapsami tamamlandi                                         |
| 5  | Makine Havuzu      | ✅ Tam  | ✅ Tam           | %100      | V1 kapsami tamamlandi                                         |
| 6  | Makine Is Yukleri  | ✅ Tam  | ✅ Tam           | %100      | V1 kapsami tamamlandi                                         |
| 7  | Gantt              | ✅ Tam  | ✅ Tam           | %90       | Operasyon bazli gorunum eksik (V1 kapsami disinda)            |
| 8  | Stoklar            | ✅ Tam  | ✅ Tam           | %100      | V1 kapsami tamamlandi                                          |
| 9  | Satin Alma         | ✅ Tam  | ✅ Tam           | %100      | V1 kapsami tamamlandi; fiyat gecmisi V2 backlog'unda          |
| 10 | Hareketler         | ✅ Tam  | ✅ Tam           | %100      | Eksik yok                                                     |
| 11 | Operator           | ✅ Tam  | ✅ Tam           | %100      | Eksik yok                                                     |
| 12 | Tanimlar           | ✅ Tam  | ✅ Tam           | %100      | Tum tanim modulleri tamamlandi (kalip, tatil, vardiya, durus nedeni)   |
| 13 | Tedarikci          | ✅ Tam  | ✅ Tam           | %100      | Eksik yok                                                     |
| 14 | Dashboard          | ✅ Tam  | ✅ Tam           | %100      | Rol bazli gorunum, aksiyon merkezi, gorev atama, widget config tamamlandi |
| 15 | Medyalar           | ✅ Tam  | ✅ Tam           | %90       | Asset CRUD var, ERP nesnesi bazli baglanti/etiketleme eksik             |
| 16 | Site Ayarlari      | ✅ Tam  | ✅ Tam           | %85       | Genel ayarlar guclu, ERP'ye ozel sirket/evrak ayarlari eksik            |
| 17 | Veritabani         | ✅ Tam  | ✅ Tam           | %100      | Full DB + Snapshot + DB info + audit entegrasyonu tamamlandi                            |
| 18 | Audit Loglari      | ✅ Tam  | ✅ Tam           | %100      | V1 kapsami tamamlandi                                                   |
| 19 | Kullanicilar       | ✅ Tam  | ✅ Tam           | %100      | V1 kapsami tamamlandi                                                   |
| 20 | Rol & Permission   | ✅ Tam  | ✅ Tam         | %100      | V1 kapsami tamamlandi                                                   |
| 21 | Gorevler           | ✅ Tam  | ✅ Tam           | %100      | V1 kapsami tamamlandi                                                   |
| 22 | Giris Ayarlari     | ✅ Tam  | ✅ Tam           | %85       | Auth durumu ve ERP login ayarlari izleniyor, ileri auth politikasi eksik |

---

## 1. Urunler (+ Recete / Malzeme Kirilimi)

**Tanim:** Urun, yari mamul ve hammadde tanimlarinin yonetildigi ana modul. Operasyon, kalip, birim donusum, makine tercihi ve recete (malzeme kirilimi) bilgilerini icerir. Receteler ayri bir sayfa olarak degil, urun formu icerisinde yonetilir.

### Veri Modeli

| Alan                                   | V1 Gereksinim | Mevcut                                        | Durum |
| -------------------------------------- | ------------- | --------------------------------------------- | ----- |
| kategori (urun/yari_mamul/hammadde)    | Zorunlu       | `urunler.kategori` enum                     | ✅    |
| tedarik_tipi (uretim/satin_alma/fason) | Zorunlu       | `urunler.tedarik_tipi` enum                 | ✅    |
| SKU / kod                              | Zorunlu       | `urunler.kod` varchar(64) UNIQUE            | ✅    |
| Urun adi                               | Zorunlu       | `urunler.ad` varchar(255)                   | ✅    |
| Aciklama                               | Zorunlu       | `urunler.aciklama` varchar(500)             | ✅    |
| Gorsel                                 | Zorunlu       | `urunler.image_url` + `storage_asset_id`  | ✅    |
| Ana birim                              | Zorunlu       | `urunler.birim` varchar(16) default 'kg'    | ✅    |
| Birim hiyerarsisi / donusumleri        | Zorunlu       | `urun_birim_donusumleri` tablosu            | ✅    |
| Satis fiyati                           | Zorunlu       | `urunler.birim_fiyat` decimal(12,2)         | ✅    |
| KDV orani                              | Zorunlu       | `urunler.kdv_orani` decimal(5,2) default 20 | ✅    |
| Operasyon tipi (tek/cift tarafli)      | Zorunlu       | `urunler.operasyon_tipi` enum               | ✅    |
| Operasyon alt satirlari                | Zorunlu       | `urun_operasyonlari` tablosu                | ✅    |
| Kalip / hazirlik / cevrim sureleri     | Zorunlu       | `urun_operasyonlari` icinde                 | ✅    |
| Montaj flag'i                          | Zorunlu       | `urun_operasyonlari.montaj` tinyint         | ✅    |
| Stok                                   | Zorunlu       | `urunler.stok` decimal(12,4)                | ✅    |
| Aktif / pasif                          | Zorunlu       | `urunler.is_active` tinyint                 | ✅    |
| Renk                                   | Ekstra        | `urunler.renk` varchar(64)                  | ✅    |

### Is Kurallari

- [X] Kategori `urun` degilse operasyon tipi sorulmaz; tek operasyon varsayilir
- [X] Tedarik tipi `satin_alma` ise uretim alanlari gizlenir
- [X] `tek_tarafli` → tek operasyon olusur
- [X] `cift_tarafli` → iki operasyon olusur: `{ad} - Sol`, `{ad} - Sag`
- [X] Montaj ayri operasyon degil, flag olarak izlenir

### CRUD Operasyonlari

| Islem                      | Backend                                      | Frontend          | Durum |
| -------------------------- | -------------------------------------------- | ----------------- | ----- |
| Liste (filtre + sayfalama) | `GET /admin/urunler`                       | ✅ Tablo + filtre | ✅    |
| Detay                      | `GET /admin/urunler/:id`                   | ✅ Form acilir    | ✅    |
| Olusturma                  | `POST /admin/urunler`                      | ✅ Sheet form     | ✅    |
| Guncelleme                 | `PATCH /admin/urunler/:id`                 | ✅ Sheet form     | ✅    |
| Silme                      | `DELETE /admin/urunler/:id`                | ✅ Onay dialog    | ✅    |
| Operasyon listesi          | `GET /admin/urunler/:id/operasyonlar`      | ✅ Form icinde    | ✅    |
| Operasyon guncelleme       | `PATCH /admin/urunler/operasyonlar/:opId`  | ✅ Form icinde    | ✅    |
| Recete (urune bagli)       | `GET/PUT/DELETE /admin/urunler/:id/recete` | ✅ Form icinde    | ✅    |
| Birim donusum yonetimi     | Form icinde array field                      | ✅ Ekle/kaldir    | ✅    |
| Makine tercih sirasi       | Form icinde per-operasyon                    | ✅ Oncelik sirali | ✅    |

### Kabiliyetler

- Urun olusturulunca kategori ve operasyon tipine gore operasyonlar otomatik olusur
- Her operasyona oncelik sirali makine atanabilir
- Birim donusumleri (orn: 1 koli = 6 takim) tanimlanabilir
- Recete (malzeme kirilimi) fire orani ve maliyet hesabi ile yonetilebilir
- Gorsel Cloudinary uzerinden yuklenebilir

### Sinirlamalar ve Eksikler

- [X] ~~Birim donusum gosterimi stok ekraninda yok~~ — StokDto'ya `birimDonusumleri` eklendi, stok tablosunda birim ve miktar sutunlarinda donusum bilgisi gosteriliyor
- [ ] **Renk alani operasyonlara yansimaz** — sadece urun seviyesinde kayit
- [ ] **Stok yeterlilik hesaplama yok** — receteden uretim emrine gereken miktar hesabi yapilmiyor
- [ ] **Operasyon bazli recete V1 disinda** — recete urun seviyesinde; detay backlog [V2_DURUM_RAPORU.md](/home/orhan/Documents/Projeler/paspas/V2_DURUM_RAPORU.md) icine tasindi

> **Recete Notu:** Receteler ayri bir sayfa olarak degil, Urunler formu icerisinde "Recete (Malzeme Kirilimi)" bolumu olarak yonetilmektedir. Backend'de ayrica `/admin/receteler` endpointleri de mevcuttur (ileride gerekirse kullanilabilir). Mevcut akista her urunun recetesi `GET/PUT/DELETE /admin/urunler/:id/recete` uzerinden calisir.

---

## 2. Musteriler

**Tanim:** Musteri kayitlarinin yonetildigi modul. Satis siparisleri ve uretim emirleri ile iliskilidir.

### Veri Modeli

| Alan                    | V1 Gereksinim | Mevcut                                      | Durum |
| ----------------------- | ------------- | ------------------------------------------- | ----- |
| Musteri kodu            | Zorunlu       | `musteriler.kod` UNIQUE, auto-gen MUS-NNN | ✅    |
| Musteri adi             | Zorunlu       | `musteriler.ad`                           | ✅    |
| Tur (musteri/tedarikci) | Zorunlu       | `musteriler.tur`                          | ✅    |
| Iskonto orani           | Zorunlu       | `musteriler.iskonto` decimal(5,2)         | ✅    |
| Ilgili kisi             | Zorunlu       | `musteriler.ilgili_kisi`                  | ✅    |
| Telefon                 | Zorunlu       | `musteriler.telefon`                      | ✅    |
| Email                   | Zorunlu       | `musteriler.email`                        | ✅    |
| Adres                   | Zorunlu       | `musteriler.adres`                        | ✅    |
| Sevkiyat notu           | Istege bagli  | `musteriler.sevkiyat_notu`                | ✅    |
| Cari kodu               | Istege bagli  | `musteriler.cari_kodu`                    | ✅    |

### Is Kurallari

- [X] Iskonto orani siparis ekranina otomatik tasinmali — DTO'da `musteriIskonto` mevcut
- [X] Iskonto siparis fiyatina otomatik uygulanir — musteri secilince kalem fiyatlari baz fiyat uzerinden yeniden hesaplanir
- [X] Sevkiyat notu operator/sevkiyat akisina bagli — sevkiyatta musteri secilince gorunur ve sevkiyat notuna otomatik eklenir

### CRUD Operasyonlari

| Islem                  | Backend                          | Frontend       | Durum |
| ---------------------- | -------------------------------- | -------------- | ----- |
| Liste (arama + filtre) | `GET /admin/musteriler`        | ✅ Tablo       | ✅    |
| Detay                  | `GET /admin/musteriler/:id`    | ✅             | ✅    |
| Olusturma              | `POST /admin/musteriler`       | ✅ Sheet form  | ✅    |
| Guncelleme             | `PATCH /admin/musteriler/:id`  | ✅ Sheet form  | ✅    |
| Silme                  | `DELETE /admin/musteriler/:id` | ✅ Onay dialog | ✅    |

### Kabiliyetler

- Musteri kodu otomatik uretilir (MUS-001, MUS-002...)
- 4 alanda arama: ad, kod, ilgili_kisi, email
- Iskonto orani siparis DTO'sunda tasiniyor
- Siparis formunda musteri secimi degisince urun fiyatlari musteri iskontosuna gore otomatik guncelleniyor
- Operator sevkiyat ekraninda musteri sevkiyat notu gorunuyor ve kayda otomatik ekleniyor

### Sinirlamalar ve Eksikler

- [X] V1 kapsami icin kritik eksik kalmadi

---

## 3. Satis Siparisleri

**Tanim:** Musteri siparislerinin kalem bazli yonetildigi modul. Uretim emrine donen temel is akisidir.

### Veri Modeli

| Alan                           | V1 Gereksinim | Mevcut                        | Durum |
| ------------------------------ | ------------- | ----------------------------- | ----- |
| Siparis no (auto)              | Zorunlu       | `siparis_no` SS-YYYY-NNNN   | ✅    |
| Musteri baglantisi             | Zorunlu       | `musteri_id` FK             | ✅    |
| Siparis tarihi (default bugun) | Zorunlu       | `siparis_tarihi` date       | ✅    |
| Termin tarihi                  | Zorunlu       | `termin_tarihi` nullable    | ✅    |
| Siparis kalemleri              | Zorunlu       | `siparis_kalemleri` tablosu | ✅    |
| Durum enum                     | Zorunlu       | 8 deger                       | ✅    |
| Aciklama                       | Zorunlu       | `aciklama` varchar(500)     | ✅    |

### Durum Karsilastirmasi

| V1 Beklenen | Mevcut                 | Durum |
| ----------- | ---------------------- | ----- |
| taslak      | `taslak`             | ✅    |
| planlandi   | `planlandi`          | ✅    |
| uretimde    | `uretimde`           | ✅    |
| kismi_sevk  | `kismen_sevk`        | ✅    |
| tamamlandi  | `tamamlandi`         | ✅    |
| kapali      | `kapali`             | ✅    |
| iptal       | `iptal`              | ✅    |
| —          | `onaylandi` (ekstra) | ➕    |

### Is Kurallari

- [X] Siparis tarihi varsayilan bugun
- [X] Urun secilince satis fiyati otomatik gelsin — `urunFiyatMap` ile calisiyor
- [X] Musteri secilince iskonto otomatik gelsin — kalem fiyatlari musteri iskonto oranina gore guncelleniyor
- [X] KDV urunden beslenmeli — form ve detay ekraninda toplam hesaplarina yansiyor
- [X] Siparis kalem bazli calisiyor
- [X] Uretildi mi / sevk edildi mi ozetleri — liste ve detay ekranda ozet kolon/kartlar mevcut
- [X] Siparis kapatma — `kapali` durumu eklendi
- [X] Siparis kilitleme — uretim emrine donusen sipariste yapisal alanlar ve silme kisitli
- [X] Sevk miktari siparis kalemlerinden dusmeli — sevkiyat bagli kayitlardan ozet geri besleme var

### CRUD Operasyonlari

| Islem              | Backend                                 | Frontend          | Durum |
| ------------------ | --------------------------------------- | ----------------- | ----- |
| Liste              | `GET /admin/satis-siparisleri`        | ✅ Tablo + filtre | ✅    |
| Detay              | `GET /admin/satis-siparisleri/:id`    | ✅ Detay sayfasi  | ✅    |
| Olusturma          | `POST /admin/satis-siparisleri`       | ✅ Form           | ✅    |
| Guncelleme         | `PATCH /admin/satis-siparisleri/:id`  | ✅ Form           | ✅    |
| Silme              | `DELETE /admin/satis-siparisleri/:id` | ✅ Onay dialog    | ✅    |
| Sonraki siparis no | `GET /next-no`                        | ✅ Otomatik       | ✅    |

### Kabiliyetler

- Siparis no otomatik uretilir (SS-2026-0001)
- Urun secilince fiyat otomatik dolar
- Musteri secilince iskonto satir fiyatlarina yansir
- Kalem bazli dinamik satir ekleme/cikarma
- KDV, iskonto ve genel toplam form/detail ekranlarinda hesaplanir
- Uretime aktarma ve sevk ozeti liste/detail ekraninda gorulur
- Uretime aktarilan siparislerde yapisal alanlar kilitlenir
- 8 farkli durum ile takip

### Sinirlamalar ve Eksikler

- [X] `planlandi` ve `kapali` durumlari mevcut
- [X] KDV hesaplama/gosterimi mevcut
- [X] Iskonto otomatik uygulanir — musteri degisiminde fiyatlar baz liste fiyatindan tekrar hesaplanir
- [X] Siparis kilitleme mevcut
- [X] Sevk takibi ozet seviyesinde mevcut
- [X] Uretim ilerleme ozeti mevcut — siparis detayinda planlanan/tamamlanan uretim ozeti gorunuyor
- [X] Siparisten dogrudan sevkiyat olusturma akisi mevcut — siparis detayindan sevkiyat kaydi acilabiliyor

---

## 4. Uretim Emirleri

**Tanim:** Siparislerden veya manuel olarak olusturulan uretim emirlerinin yonetildigi modul. Operasyon bazli planlamanin ana kaynagi.

### Veri Modeli

| Alan                     | V1 Gereksinim | Mevcut                                     | Durum |
| ------------------------ | ------------- | ------------------------------------------ | ----- |
| Emir no (auto)           | Zorunlu       | `emir_no` UE-YYYY-NNNN                   | ✅    |
| Siparis baglantisi (M-M) | Zorunlu       | `uretim_emri_siparis_kalemleri` junction | ✅    |
| Urun baglantisi          | Zorunlu       | `urun_id` FK                             | ✅    |
| Recete baglantisi        | Zorunlu       | `recete_id` FK nullable                  | ✅    |
| Musteri ozeti            | Zorunlu       | `musteri_ozet` + `musteri_detay`       | ✅    |
| Planlanan miktar         | Zorunlu       | `planlanan_miktar` decimal               | ✅    |
| Uretilen miktar          | Zorunlu       | `uretilen_miktar` decimal                | ✅    |
| Termin tarihi            | Zorunlu       | `termin_tarihi` nullable                 | ✅    |
| Operasyon alt satirlari  | Zorunlu       | `uretim_emri_operasyonlari` tablosu      | ✅    |

### Durum Karsilastirmasi

| V1 Beklenen      | Mevcut                    | Durum |
| ---------------- | ------------------------- | ----- |
| planlandi        | `planlandi`             | ✅    |
| makineye_atandi  | ❌ Yok                    | ❌    |
| uretimde         | `uretimde`              | ✅    |
| durakladi        | ❌ Yok                    | ❌    |
| kismi_tamamlandi | ❌ Yok                    | ❌    |
| tamamlandi       | `tamamlandi`            | ✅    |
| kapatildi        | ❌ Yok                    | ❌    |
| iptal            | `iptal`                 | ✅    |
| —               | `hazirlaniyor` (ekstra) | ➕    |

### Is Kurallari

- [X] Siparisten uretim emri olusturma — siparis kalem secimi ile
- [X] Manuel uretim emri olusturma — kaynak secimi var
- [X] Siparis disi uretim yapabilme
- [X] Siparis satirlarindan kismi miktar secerek emir acabilme — aday listesi mevcut
- [X] Musteri gosterimi: tek musteri → musteri adi, toplu → "Toplam siparis"
- [X] Termin tarihi gosterimi
- [X] Termin riski hesaplama — `terminRiski` boolean, planlananBitis > termin
- [X] **Planlanan bitis tarihi hesaplama** — once makine kuyrugu, yoksa operasyon planlari, yoksa operasyon sure tahmini
- [X] **Cift tarafli urun icin paralel hesaplama** — ayni makinede ardisik, farkli makinelerde paralel mantikla tahminleniyor
- [X] **Uretim basladiktan sonra silme yerine iptal mantigi** — operator kaydi, makine plani veya baslayan operasyon varsa silme engelleniyor

### CRUD + Ozel Operasyonlar

| Islem                      | Backend                               | Frontend          | Durum |
| -------------------------- | ------------------------------------- | ----------------- | ----- |
| Liste                      | `GET /admin/uretim-emirleri`        | ✅ Tablo + filtre | ✅    |
| Detay                      | `GET /admin/uretim-emirleri/:id`    | ✅ Detay sayfasi  | ✅    |
| Olusturma                  | `POST /admin/uretim-emirleri`       | ✅ Gelismis form  | ✅    |
| Guncelleme                 | `PATCH /admin/uretim-emirleri/:id`  | ✅ Form           | ✅    |
| Silme                      | `DELETE /admin/uretim-emirleri/:id` | ✅                | ✅    |
| Sonraki emir no            | `GET /next-no`                      | ✅ Otomatik       | ✅    |
| Aday listesi               | `GET /adaylar`                      | ✅ Form icinde    | ✅    |
| Operasyonlar               | `GET /:id/operasyonlar`             | ✅                | ✅    |
| Auto-populate operasyonlar | Olusturmada otomatik                  | —                | ✅    |

### Kabiliyetler

- Emir olusturulunca urun operasyonlari otomatik kopyalanir (`autoPopulateOperasyonlar`)
- M-M siparis baglantisi: bir emir birden fazla siparis kalemine baglanabilir
- Musteri ozet tipi otomatik hesaplanir (tekil/toplam/manuel)
- Termin riski gosterimi (AlertTriangle ikonu)
- Makine atama sayisi batch enrichment ile gosterilir

### Sinirlamalar ve Eksikler

- [ ] **`makineye_atandi`, `durakladi`, `kismi_tamamlandi`, `kapatildi` durumlari yok** — 4 durum eksik
- [ ] **Planlanan bitis motoru zayif** — sadece makine kuyrugu max degerinden, operasyon bazli hesaplama yok
- [ ] **Cift tarafli paralel hesaplama yok** — farkli makinelerdeki operasyonlar icin en gec bitis hesabi
- [ ] **Silme/duzeltme kurallari yok** — uretim baslamis emirde silme engeli yok

---

## 5. Makine Havuzu

**Tanim:** Makinelerin ve operasyon kuyruglarinin yonetildigi modul. Atanmamis isler ve makine kuyruk siralamasi burada yapilir.

### Veri Modeli

| Alan             | V1 Gereksinim | Mevcut                                        | Durum |
| ---------------- | ------------- | --------------------------------------------- | ----- |
| Makine kodu, adi | Zorunlu       | `makineler.kod`, `ad`                     | ✅    |
| Tonaj            | Zorunlu       | `makineler.tonaj` decimal                   | ✅    |
| Saatlik kapasite | Zorunlu       | `makineler.saatlik_kapasite` decimal        | ✅    |
| 24 saat calisma  | Zorunlu       | `makineler.calisir_24_saat`                 | ✅    |
| Durum            | Zorunlu       | `makineler.durum` (aktif/bakim/ariza/pasif) | ✅    |
| Kalip uyumlulugu | Zorunlu       | `kalip_uyumlu_makineler` junction           | ✅    |
| Makine kuyrugu   | Zorunlu       | `makine_kuyrugu` tablosu                    | ✅    |

### Is Kurallari

- [X] Uretim emri olusunca havuza dusmeli — atanmamis operasyonlar listesi
- [X] Operasyon bazli makine atamasi — `POST /ata` endpoint
- [X] Cift tarafli urunde iki operasyon icin ayri makine secilebilmeli — makine select'te iki op gorulur
- [X] Iki operasyon ayni makineye verilirse sira otomatik atanmali — kardes op'un hemen arkasina yerlestirilir, sonrakiler kaydırılır
- [X] Farkli makinelere verilirse montajin hangi makinede yapilacagi secilebilmeli — `montajMakineId` mevcut

### CRUD + Kuyruk Operasyonlari

| Islem                  | Backend                             | Frontend         | Durum |
| ---------------------- | ----------------------------------- | ---------------- | ----- |
| Makine listesi         | `GET /admin/makine-havuzu`        | ✅ Sheet icinde  | ✅    |
| Makine olusturma       | `POST /admin/makine-havuzu`       | ✅ Form          | ✅    |
| Makine guncelleme      | `PATCH /admin/makine-havuzu/:id`  | ✅ Form          | ✅    |
| Makine silme           | `DELETE /admin/makine-havuzu/:id` | ✅ Onay dialog   | ✅    |
| Atanmamis operasyonlar | `GET /atanmamis`                  | ✅ Tab           | ✅    |
| Makine kuyruklar       | `GET /kuyruklar`                  | ✅ Tab           | ✅    |
| Operasyon atama        | `POST /ata`                       | ✅ Atama dialog  | ✅    |
| Kuyruktan cikarma      | `DELETE /kuyruk/:id`              | ✅ Buton         | ✅    |
| Kuyruk siralama        | `PATCH /kuyruk-sirala`            | ✅ Drag-drop     | ✅    |

### Kabiliyetler

- 2 tab'li arayuz: Atanmamis Emirler + Makine Kuyruklar
- Makine CRUD ayri sayfa (`/admin/makineler`) uzerinden
- Onerilen makineler listesi (urun operasyon tercih sirasi)
- Kalip uyumluluguna gore makine filtreleme
- Montaj makinesi secimi (ayri dialog alani)
- Kuyruk kartlarinda detayli bilgi: miktar, uretilen, fire, sure, termin, musteri
- Calisiyor/bekliyor durum badge'leri
- Makine basina toplam sure ve is adedi ozeti

### Sinirlamalar ve Eksikler

- [X] ~~Kuyruk siralama frontend'de drag-drop yok~~ — @dnd-kit ile drag-drop siralama eklendi
- [X] ~~Ayni emrin iki operasyonunu baglama mantigi~~ — kardes operasyon algilama + ardarda siralama eklendi
- [X] ~~Planlanan baslangic/bitis tarihleri hesaplanmiyor~~ — `recalcMakineKuyrukTarihleri()` ile atama/cikarma/siralama sonrasi otomatik zincirleme hesaplama yapiliyor

---

## 6. Makine Is Yukleri

**Tanim:** Makinelere atanmis kuyruk ogelerinin goruntulendigi modul. Planlama kontrolu icin kullanilir.

### Veri Modeli

- Ayri tablo yok — `makine_kuyrugu` tablosunun salt okunur gorunumu

### Is Kurallari

- [X] **Satirlarda musteri adi gorunsun** — kuyruk kartlarinda musteri ozeti gorunuyor
- [X] **Drag and drop ile sira degistirme** — makine kolonlarinda aktif
- [X] **Makineler arasi tasima** — surukle-birak ile baska makine kolonuna tasinabiliyor
- [X] **Montajli satir ibaresi** — badge ile gorunuyor
- [X] **Siralama plan tarihini guncellesin** — tasima ve siralama sonrasi plan tarihleri yeniden hesaplanıyor

### CRUD Operasyonlari

| Islem                   | Backend                         | Frontend | Durum     |
| ----------------------- | ------------------------------- | -------- | --------- |
| Liste (makine filtreli) | `GET /admin/is-yukler`        | ✅ Tablo | ✅        |
| Detay                   | `GET /admin/is-yukler/:id`    | ✅       | ✅       |
| Olusturma               | `POST /admin/is-yukler`       | ✅       | ✅ Tasima ile |
| Guncelleme              | `PATCH /admin/is-yukler/:id`  | ✅       | ✅ Drag-drop |
| Silme                   | `DELETE /admin/is-yukler/:id` | ✅       | ✅ Kuyruktan cikar |

### Kabiliyetler

- Makine bazli filtreleme
- Durum badge'leri (bekliyor, devam_ediyor, tamamlandi, iptal)

### Sinirlamalar ve Eksikler

- [X] **Frontend salt okunur** — plan panosu haline getirildi
- [X] **Drag-drop siralama yok** — makine kolonu icinde aktif
- [X] **Makineler arasi tasima yok** — makine kolonlari arasi aktif
- [X] **Musteri adi gosterimi yok** — kartta gorunuyor
- [X] **Montaj ibaresi yok** — badge ile gorunuyor
- [X] **Plan-bitis geri beslemesi yok** — backend recalc ile otomatik guncelleniyor

---

## 7. Gantt Plani

**Tanim:** Makine bazli gorsel planlama takvimi. Uretim emirlerinin zaman cizelgesini gosterir.

### Veri Modeli

- Ayri tablo yok — `uretim_emirleri` tablosunun gorsel gorunumu

### Is Kurallari

- [X] Makine bazli gorsel plan — yatay bar chart
- [X] Zoom in / zoom out — piksel bazli hesaplama (40px/gun)
- [X] **Filtreleme: uretim emri, urun, makine** — q (emir no/urun) + makine dropdown + durum dropdown eklendi
- [ ] **Cift tarafli urunde iki operasyonu ayni filtrede gorebilme** — yok
- [X] **Montaj ibaresi** — Wrench ikonu bar uzerinde ve label kolonunda gorunuyor
- [X] **Gerceklesen / tamamlanan isleri ayirt edebilme** — strikethrough + CheckCircle2 ikonu + emerald rengi

### CRUD Operasyonlari

| Islem                  | Backend                    | Frontend    | Durum              |
| ---------------------- | -------------------------- | ----------- | ------------------ |
| Liste (tarih filtreli) | `GET /admin/gantt`       | ✅ Timeline | ✅                 |
| Tarih guncelleme       | `PATCH /admin/gantt/:id` | ✅          | ⚠️ UI'da sinirli |

### Kabiliyetler

- Yatay bar chart gorunumu
- Ileri/geri hafta navigasyonu
- Tarih araligi secimi
- Renk kodlu durum gosterimi (planlandi/hazirlaniyor/uretimde/tamamlandi/iptal)
- Hover tooltip ile detay

### Sinirlamalar ve Eksikler

- [X] **Urun/makine/emir filtresi yok** — q/makineId/durum filtreleri eklendi
- [ ] **Operasyon bazli gorunum yok** — emir bazli, operasyonlar gorulmuyor (V1 kapsami disinda)
- [X] **Montaj ibaresi yok** — Wrench ikonu eklendi
- [X] **Gerceklesen sure gosterimi zayif** — strikethrough + CheckCircle2 + emerald rengi ile guclendirildi

---

## 8. Malzeme Stoklari

**Tanim:** Hammadde, yari mamul ve urun stok seviyelerinin izlendigi modul.

### Veri Modeli

- Ayri tablo yok — `urunler.stok` kolonu uzerinden calisiyor

### Is Kurallari

- [X] **Hammadde stok gorunumu** — kategori bazli filtre ve sekme mevcut
- [X] **Alt sekmede urun stok gorunumu** — kategori sekmeleri mevcut
- [X] **Receteye gore gereken miktar hesaplama** — acik uretim ihtiyaci hesaplanip gosteriliyor
- [X] **Birim donusum gosterimi (orn: 750 kg = 30 cuval)** — stok ve detay ekraninda gosteriliyor
- [X] **Durum: yeterli/kritik/yetersiz** — kritik stok bazli seviye hesaplama aktif

### CRUD Operasyonlari

| Islem         | Backend                            | Frontend       | Durum     |
| ------------- | ---------------------------------- | -------------- | --------- |
| Liste         | `GET /admin/stoklar`             | ✅ Basit tablo | ✅        |
| Detay         | `GET /admin/stoklar/:id`         | ✅             | ✅ Detay dialog |
| Stok duzeltme | `POST /admin/stoklar/:id/duzelt` | ✅             | ✅ Duzeltme dialog |

### Kabiliyetler

- Urun listesi uzerinden stok gosterimi
- Kritik ve yetersiz stok takibi
- Birim donusumleri ile stok karsiliklari
- Acik uretim ihtiyaci ve serbest stok hesabi
- Stok detay ve manuel stok duzeltme dialogu
- Negatif stok engeli (backend'de)

### Sinirlamalar ve Eksikler

- [X] **Kategori bazli ayrim yok** — sekmeli gorunum eklendi
- [X] **Birim donusum gosterimi yok** — liste ve detay ekraninda eklendi
- [X] **Gereken miktar hesaplama yok** — recete + acik uretim emirlerine gore hesaplanıyor
- [X] **Durum seviye hesaplama yok** — kritik stok bazli durum aktif
- [X] **Stok duzeltme UI yok** — detay icinden aktif
- [ ] **Coklu depo/lokasyon yok** — tek global stok

---

## 9. Satin Alma Siparisleri

**Tanim:** Hammadde ve malzeme tedarikcilerinden yapilan satin alma siparislerinin yonetildigi modul.

### Veri Modeli

| Alan                  | V1 Gereksinim | Mevcut                           | Durum |
| --------------------- | ------------- | -------------------------------- | ----- |
| Siparis no (auto)     | Zorunlu       | `siparis_no` SA-YYYY-NNN       | ✅    |
| Tedarikci baglantisi  | Zorunlu       | `tedarikci_id` FK              | ✅    |
| Miktar, fiyat, termin | Zorunlu       | Kalem bazli                      | ✅    |
| Siparis kalemleri     | Zorunlu       | `satin_alma_kalemleri` tablosu | ✅    |

### Durum Karsilastirmasi

| V1 Beklenen     | Mevcut                 | Durum           |
| --------------- | ---------------------- | --------------- |
| taslak          | `taslak`             | ✅              |
| siparis_verildi | `siparis_verildi`    | ✅              |
| kismi_kabul     | `kismen_teslim`      | ✅ (isim farki) |
| tamamlandi      | `tamamlandi`         | ✅              |
| iptal           | `iptal`              | ✅              |
| —              | `onaylandi` (ekstra) | ➕              |

### Is Kurallari

- [X] **Depoya girmemis kalemler operator Mal Kabul sekmesinde gorunmeli** — operator modulunde mevcut
- [X] **Gelen miktar siparistekinden az veya cok olabilir** — mal kabul altyapisi var, kalan kabul miktari hesabi eklendi

### CRUD Operasyonlari

| Islem              | Backend                          | Frontend          | Durum |
| ------------------ | -------------------------------- | ----------------- | ----- |
| Liste              | `GET /admin/satin-alma`        | ✅ Tablo + filtre | ✅    |
| Detay              | `GET /admin/satin-alma/:id`    | ✅ Detay sayfasi  | ✅    |
| Olusturma          | `POST /admin/satin-alma`       | ✅ Form           | ✅    |
| Guncelleme         | `PATCH /admin/satin-alma/:id`  | ✅ Form           | ✅    |
| Silme              | `DELETE /admin/satin-alma/:id` | ✅ Onay dialog    | ✅    |
| Sonraki siparis no | `GET /next-no`                 | ✅ Otomatik       | ✅    |

### Kabiliyetler

- Siparis no otomatik uretilir (SA-2026-001)
- Tedarikci secimi (musteriler tablosundan tur='tedarikci')
- Kalem bazli miktar ve fiyat girisi
- 6 durum ile takip

### Sinirlamalar ve Eksikler

- [X] **Mal kabul entegrasyonu zayif** — mal kabul operator'den kaydedilince satin alma durumu otomatik guncelleniyor (kismen_teslim / tamamlandi)
- [X] **Kalan kabul miktari hesaplama yok** — detay ekraninda kalem bazli kabul edilen / kalan miktari gosteriliyor, ilerleme cubugu eklendi
- [ ] **Satin alma fiyat gecmisi V1 disinda** — sadece guncel birim fiyat; detay backlog [V2_DURUM_RAPORU.md](/home/orhan/Documents/Projeler/paspas/V2_DURUM_RAPORU.md) icine tasindi

---

## 10. Hareket Gecmisi

**Tanim:** Sevkiyat, mal kabul ve uretim hareketlerinin kronolojik olarak izlendigi audit log modulu.

### Veri Modeli

| Alan            | V1 Gereksinim | Mevcut                                  | Durum |
| --------------- | ------------- | --------------------------------------- | ----- |
| Hareket tipi    | Zorunlu       | `hareket_tipi` (giris/cikis/duzeltme) | ⚠️  |
| Urun baglantisi | Zorunlu       | `urun_id` FK                          | ✅    |
| Miktar          | Zorunlu       | `miktar` decimal                      | ✅    |
| Referans        | Zorunlu       | `referans_tipi` + `referans_id`     | ✅    |
| Aciklama        | Zorunlu       | `aciklama`                            | ✅    |

### Is Kurallari

- [X] Varsayilan gun icindeki hareketler — varsayilan filtre `bugun`
- [X] Tarih filtresi: bugun / bu hafta / ozel aralik — backend ve UI aktif
- [X] Sevkiyat + mal kabul + uretim hareketleri tek timeline'da — kaynak tipiyle tek listede izleniyor
- [X] Yonetici ozet ekrani — ozet kartlari mevcut

### CRUD Operasyonlari

| Islem            | Backend                    | Frontend | Durum     |
| ---------------- | -------------------------- | -------- | --------- |
| Liste (filtreli) | `GET /admin/hareketler`  | ✅ Tablo | ✅        |
| Olusturma        | `POST /admin/hareketler` | ✅       | ✅        |

### Kabiliyetler

- Immutable log — duzeltme veya silme yok
- Stok ile atomik guncelleme (transaction)
- Negatif stok engeli
- Renk kodlu miktar (yesil: giris, kirmizi: cikis)

### Sinirlamalar ve Eksikler

- [X] Tarih filtreleri mevcut
- [X] Yonetici ozet kartlari mevcut
- [X] Validation/UI tip uyumsuzlugu giderildi — hareket tipi ve kaynak tipi ayrildi
- [X] Kullanici takibi mevcut — olusturan kullanici loglanabiliyor
- [X] Hareket olusturma UI mevcut

---

## 11. Operator Ekrani

**Tanim:** Uretim sahasinda operatorlerin kullandigi ekran. Makine kuyrugu, sevkiyat ve mal kabul islemleri icin 3 sekmeli arayuz.

### Veri Modeli

| Tablo                                    | Amac                           | Durum |
| ---------------------------------------- | ------------------------------ | ----- |
| `operator_gunluk_kayitlari`            | Gunluk uretim loglari          | ✅    |
| `vardiya_kayitlari`                    | Vardiya baslangic/bitis        | ✅    |
| `durus_kayitlari`                      | Duraklatma nedenleri + sureler | ✅    |
| `sevkiyatlar` + `sevkiyat_kalemleri` | Musteri sevkiyatlari           | ✅    |
| `mal_kabul_kayitlari`                  | Satin alma mal kabulleri       | ✅    |

### Is Kurallari — Makine Kuyrugu

- [X] Operator sadece ilk siradaki isi baslatabilsin — `POST /operator/baslat`
- [X] Devam eden isi bitirebilsin — `POST /operator/bitir`
- [X] Uretilen miktar, fire miktari, net miktar — bitir formunda girilir
- [X] Birim tipi (adet/takim) — montaj icin `birimTipi` alani var
- [X] Duraklat / Devam Et — `POST /duraklat`, `POST /devam-et`
- [X] Duraklatirken durus nedeni zorunlu — `neden` required in schema
- [X] Makine arizasi flag'i — `makineArizasi` boolean

### Is Kurallari — Vardiya

- [X] Vardiya Basi — `POST /operator/vardiya-basi`
- [X] Vardiya Sonu — `POST /operator/vardiya-sonu`
- [X] Vardiya tipi (gunduz/gece) — `vardiyaTipi` enum
- [X] Vardiya saatleri (07:30-19:30 / 19:30-07:30) — backend saat kontrolu ve frontend vardiya paneli mevcut

### Is Kurallari — Sevkiyat

- [X] Musteri sec — musteri dropdown
- [X] Uretimi tamamlanmis urunleri listele — urun secimi mevcut
- [X] Miktar gir — kalem bazli
- [X] Sevk edilen urunler stoktan dusmeli — stok ve hareket kaydi atomik yaziliyor
- [X] Siparisten dusmeli — otomatik siparis kalemi esleme + siparis durum guncelleme aktif
- [X] Birden fazla musteri icin ayni turda islem — UI coklu sevkiyat kalemi destekliyor

### Is Kurallari — Mal Kabul

- [X] Depoya girmemis satin alma siparisleri listelenir
- [X] Gelen miktar girilir
- [X] **Satin alma kalan miktari azalmali** — mal kabul kaydedilince satin alma durumu otomatik guncelleniyor
- [X] **Stok artmali** — hareketler ile baglanmali

### Is Kurallari — Plan Kaydirma

- [X] Operator gerceklesen bitis girdiginde sonraki islerin plan baslangici kaymali — bitir / duraklat / devam et sonrasi kuyruk yeniden hesaplanir
- [X] Bu kayma ayni makinedeki tum sonraki isleri etkilemeli — ayni makinedeki tum sonraki isler zincirleme kaydirilir

### CRUD + Islem Operasyonlari

| Islem           | Backend                           | Frontend         | Durum |
| --------------- | --------------------------------- | ---------------- | ----- |
| Kuyruk listesi  | `GET /operator/kuyruk`          | ✅ Tab           | ✅    |
| Uretim baslat   | `POST /operator/baslat`         | ✅ Buton         | ✅    |
| Uretim bitir    | `POST /operator/bitir`          | ✅ Modal         | ✅    |
| Duraklat        | `POST /operator/duraklat`       | ✅ Buton + neden | ✅    |
| Devam et        | `POST /operator/devam-et`       | ✅ Buton         | ✅    |
| Vardiya basi    | `POST /operator/vardiya-basi`   | ✅               | ✅    |
| Vardiya sonu    | `POST /operator/vardiya-sonu`   | ✅               | ✅    |
| Sevkiyat        | `POST /operator/sevkiyat`       | ✅ Tab           | ✅    |
| Mal kabul       | `POST /operator/mal-kabul`      | ✅ Tab           | ✅    |
| Gunluk girisler | `GET /operator/gunluk-girisler` | ✅               | ✅    |
| Durus kayitlari | `GET /operator/duruslar`        | ✅               | ⚠️  |

### Kabiliyetler

- 3 sekmeli arayuz (Kuyruk / Sevkiyat / Mal Kabul)
- Uretim yasam dongusu: bekliyor → calisiyor → tamamlandi
- Fire ve net miktar takibi
- Durus kaydi: neden + makine arizasi flag'i + sure
- Vardiya baslangic/bitis kaydi + sabit vardiya saat kontrolu
- Sevkiyat: musteri + urun + miktar kalem bazli, coklu satir destekli
- Mal kabul: satin alma siparisi referansli
- Sevkiyat kaydinda siparis kalemine otomatik esleme ve siparis durumu guncelleme
- Gerceklesene gore ayni makinedeki sonraki isleri plan kaydirma

### Sinirlamalar ve Eksikler

- [X] Bu baslik altindaki V1 maddeleri tamamlandi

---

## 12. Tanimlar ve Ayarlar

**Tanim:** Kalip, tatil takvimi, vardiyalar ve durus nedenleri katalogunun yonetildigi modul.

### Veri Modeli

| Tablo                    | V1 Gereksinim | Mevcut                                      | Durum |
| ------------------------ | ------------- | ------------------------------------------- | ----- |
| Kaliplar                 | Zorunlu       | `kaliplar` (kod, ad, aciklama, is_active) | ✅    |
| Kalip-Makine uyumlulugu  | Zorunlu       | `kalip_uyumlu_makineler` junction         | ✅    |
| Tatil takvimi            | Zorunlu       | `tatiller` (ad, tarih, saat araligi)      | ✅    |
| Vardiya ayarlari         | Zorunlu       | `vardiyalar` (ad, baslangic/bitis saati)  | ✅    |
| Durus nedenleri katalogu | Zorunlu       | `durus_nedenleri` (kod, ad, kategori)     | ✅    |

### Is Kurallari

- [X] Kalip seciminde sadece uygun makineler listelenmeli — urun formunda filtreleniyor
- [ ] **Tatil gun/saatleri planlama suresine eklenmeli** — tatil verisi var ama planlama motoru yok
- [ ] **Tatil yoksa makine 7/24 calisiyor varsayilabilir** — varsayim mevcut degil

### CRUD Operasyonlari

| Islem             | Backend                                    | Frontend            | Durum |
| ----------------- | ------------------------------------------ | ------------------- | ----- |
| Kalip listesi     | `GET /admin/tanimlar/kaliplar`           | ✅ Tab              | ✅    |
| Kalip olusturma   | `POST /admin/tanimlar/kaliplar`          | ✅ Form             | ✅    |
| Kalip guncelleme  | `PATCH /admin/tanimlar/kaliplar/:id`     | ✅ Form             | ✅    |
| Kalip silme       | `DELETE /admin/tanimlar/kaliplar/:id`    | ✅ Onay             | ✅    |
| Uyumluluk matrisi | `GET/PUT /kaliplar/:id/uyumlu-makineler` | ✅ Checkbox matrisi | ✅    |
| Tatil listesi     | `GET /admin/tanimlar/tatiller`           | ✅ Tab              | ✅    |
| Tatil olusturma   | `POST /admin/tanimlar/tatiller`          | ✅ Form             | ✅    |
| Tatil guncelleme  | `PATCH /admin/tanimlar/tatiller/:id`     | ✅ Form             | ✅    |
| Tatil silme       | `DELETE /admin/tanimlar/tatiller/:id`    | ✅ Onay             | ✅    |
| Vardiya listesi   | `GET /admin/tanimlar/vardiyalar`         | ✅ Tab              | ✅    |
| Vardiya olusturma | `POST /admin/tanimlar/vardiyalar`        | ✅ Form             | ✅    |
| Vardiya guncelleme| `PATCH /admin/tanimlar/vardiyalar/:id`   | ✅ Form             | ✅    |
| Vardiya silme     | `DELETE /admin/tanimlar/vardiyalar/:id`  | ✅ Onay             | ✅    |
| Durus listesi     | `GET /admin/tanimlar/durus-nedenleri`    | ✅ Tab              | ✅    |
| Durus olusturma   | `POST /admin/tanimlar/durus-nedenleri`   | ✅ Form             | ✅    |
| Durus guncelleme  | `PATCH /admin/tanimlar/durus-nedenleri/:id` | ✅ Form          | ✅    |
| Durus silme       | `DELETE /admin/tanimlar/durus-nedenleri/:id` | ✅ Onay        | ✅    |

### Kabiliyetler

- 4 tab'li arayuz: Kaliplar + Tatiller + Vardiyalar + Durus Nedenleri
- Kalip-makine uyumluluk matrisi (checkbox grid)
- Tatil saat araligi (HH:MM - HH:MM)
- Zod ile baslangic < bitis validasyonu
- Vardiya tanimi (gece vardiyasi gecegece crossing desteklenir)
- Durus nedeni katalogu (5 kategori: makine, malzeme, personel, planlama, diger)

### Sinirlamalar ve Eksikler

- [X] **Vardiya tanimlari tamamlandi** — gunduz/gece/tam gun vardiya tanimlari eklendi (`vardiyalar` tablosu)
- [X] **Durus nedenleri katalogu tamamlandi** — standart katalog eklendi, 5 kategori (makine/malzeme/personel/planlama/diger)
- [ ] **Tatil verisi planlama motoruna baglanmamis** — tatil kayitlari var ama kapasite hesabinda kullanilmiyor
- [ ] **tatil_makineler tablosu kullanilmiyor** — altyapi var ama entegrasyon yok

---

## 13. Tedarikci

**Tanim:** Tedarikci kayitlarinin yonetildigi modul. `musteriler` tablosunda `tur='tedarikci'` olarak saklanir.

### Veri Modeli

- `musteriler` tablosunun `tur='tedarikci'` filtrelenmiş gorunumu
- Kod, ilgili_kisi, email ve satin alma ozet alanlari expose ediliyor

### Is Kurallari

- [X] Mevcut sade yapi korunur
- [X] Satin alma ile iliskisi guclendirildi — tedarikci detayinda satin alma listesi ve satin almadan tedarikci detayi linki var

### CRUD Operasyonlari

| Islem      | Backend                         | Frontend | Durum |
| ---------- | ------------------------------- | -------- | ----- |
| Liste      | `GET /admin/tedarikci`        | ✅ Tablo | ✅    |
| Olusturma  | `POST /admin/tedarikci`       | ✅ Form  | ✅    |
| Guncelleme | `PATCH /admin/tedarikci/:id`  | ✅ Form  | ✅    |
| Silme      | `DELETE /admin/tedarikci/:id` | ✅ Onay  | ✅    |

### Sinirlamalar ve Eksikler

- [X] Tedarikci DTO'su genisletildi — kod, ilgili_kisi, email ve satin alma ozetleri mevcut
- [X] Satin almadan tedarikci detayina link var — liste ve detay ekraninda aktif

---

## 14. Dashboard

**Tanim:** ERP yonetim panelinin ust seviye ozet, uyarilar ve yonlendirme ekrani.

### Mevcut Durum

- `GET /admin/dashboard/summary`, `kpi`, `trend` endpointleri mevcut
- Admin panelde KPI kartlari, trend grafik ve son hareket / dusuk stok bloklari var
- ERP modullerine kisa yol kartlari mevcut

### Eksikler

- [x] Rol bazli farkli dashboard gorunumu (admin / operator / satin almaci / sevkiyatci) — her role ozel widget seti
- [x] Kullaniciya atanan isler / gorevler alani — "Bana Atanan Gorevler" blogu (sadeceBenim: true)
- [x] Kritik satin alma, geciken termin ve bekleyen onaylar icin aksiyon merkezi — GET /admin/dashboard/action-center endpoint + UI
- [x] Widget konfigurasyonu ve kaydetme — localStorage bazli widget gorunurluk ayarlari paneli

---

## 15. Medyalar

**Tanim:** Dosya / gorsel / belge yonetimi. Cloudinary tabanli storage admin modulu.

### Mevcut Durum

- Asset CRUD mevcut
- Klasor listeleme, toplu yukleme ve silme mevcut
- Urun ve site ayarlari gibi alanlarda medya secimi kullaniliyor

### Eksikler

- [ ] ERP nesnesi bazli iliskilendirme matrisi eksik (`urun`, `kalip`, `recete`, `musteri evraki`)
- [ ] Dosya turu bazli kullanim kurallari eksik
- [ ] Versiyon / revizyon takibi yok

---

## 16. Site Ayarlari

**Tanim:** Uygulama genel ayarlari, branding, locale, API ve SMTP benzeri panel ayarlari.

### Mevcut Durum

- Genel ayarlar, branding, locale, SEO, SMTP ve entegrasyon tablari mevcut
- Site settings admin endpointleri ve form ekranlari var

### Eksikler

- [ ] ERP'ye ozel firma karti ayarlari eksik
- [ ] Evrak numara serileri / varsayilan format ayarlari eksik
- [ ] Sirket logo / belge sablonu / imza bilgisi gibi ERP cikti ayarlari eksik
- [ ] Vardiya default saatleri ve planlama varsayimlari burada yonetilmiyor

---

## 17. Veritabani (DB Admin)

**Tanim:** Admin DB araci. Full DB export/import ve snapshot yonetimi.

### Backend Endpoint Durumu

| Endpoint | Method | Aciklama | Durum |
| --- | --- | --- | --- |
| `/admin/db/export` | GET | Full DB export (.sql download) | ✅ Calisiyor |
| `/admin/db/import-sql` | POST | SQL text ile import | ✅ Calisiyor |
| `/admin/db/import-url` | POST | URL'den SQL import (gzip destekli) | ✅ Calisiyor |
| `/admin/db/import-file` | POST | Dosya ile SQL import (multipart) | ✅ Calisiyor |
| `/admin/db/snapshots` | GET | Snapshot listesi | ✅ Calisiyor |
| `/admin/db/snapshots` | POST | Yeni snapshot olustur | ✅ Calisiyor |
| `/admin/db/snapshots/:id/restore` | POST | Snapshot'tan geri yukle | ✅ Calisiyor |
| `/admin/db/snapshots/:id` | DELETE | Snapshot sil | ✅ Calisiyor |

### Frontend Panel Durumu

| Panel | Dosya | Backend Destegi | Durum |
| --- | --- | --- | --- |
| Full DB Export/Import | `fullDb/full-db-header.tsx`, `full-db-import-panel.tsx` | ✅ Tam | ✅ Calisiyor |
| Snapshots | `fullDb/snapshots-panel.tsx`, `snapshots-table.tsx` | ✅ Tam | ✅ Calisiyor |

### RTK Query Hooks

- `useExportSqlMutation()` — Full DB SQL export
- `useImportSqlTextMutation()` — SQL metin ile import
- `useImportSqlUrlMutation()` — URL ile import
- `useImportSqlFileMutation()` — Dosya ile import
- `useListDbSnapshotsQuery()` — Snapshot listesi
- `useCreateDbSnapshotMutation()` — Snapshot olustur
- `useRestoreDbSnapshotMutation()` — Snapshot'tan geri yukle
- `useDeleteDbSnapshotMutation()` — Snapshot sil

### Yapilan Temizlik (2026-03-07)

Eski e-ticaret sablonundan kalan ve backend karsiligi olmayan 5 panel + endpoint + tip tanimi kaldirildi:

- [X] `modules/module-export-panel.tsx` — silindi
- [X] `modules/module-import-panel.tsx` — silindi
- [X] `modules/module-validate-panel.tsx` — silindi
- [X] `modules/site-settings-ui-panel.tsx` — silindi
- [X] `modules/module-tabs.tsx` — silindi (eski e-ticaret MODULE_OPTIONS iceriyordu)
- [X] `db_admin.endpoints.ts` — 5 kirik endpoint ve hook temizlendi, sadece 8 calisan endpoint kaldi
- [X] `shared/db_admin.ts` — kullanilmayan 9 tip tanimi silindi
- [X] `admin-db-client.tsx` — Module tab referanslari ve help popover maddeleri temizlendi
- [X] `db.md` — dokumantasyon guncellendi

### Eksikler

- [X] ~~ERP modullerine gore guvenli operasyon matrisi dokumante degil~~ — `db.md` icerisinde 4 seviyeli risk matrisi + tablo siniflandirmasi eklendi
- [X] ~~Seed / demo veri / uretim verisi ayirimi UI'da net degil~~ — `GET /admin/db/info` endpointi ile ortam tespiti (demo/seed/production) yapilip DB info kartinda Badge olarak gosteriliyor
- [X] ~~Audit entegrasyonlu DB operasyon ozeti eksik~~ — DB export icin explicit audit log eklendi (GET hook tarafindan yakalanmaz), UI'da "Son DB Islemleri" tablosu audit loglarindan resource=db filtresiyle listeleniyor

---

## 18. Audit Loglari

**Tanim:** Admin mutasyonlarinin izlenmesi. Kullanici, endpoint, method ve payload meta bilgisini kaydeder.

### Mevcut Durum

- Backend admin audit hook aktif
- `/admin/audit-logs` endpointi mevcut
- Admin panel audit ekraninda ERP modulu filtreleri, ozet kartlari ve detay sheet'i var

### Eksikler

- [X] ERP modulu bazli hazir filtreler eklendi
- [X] Kayit detayinda `params / query / body` ayrimi eklendi
- [X] Islem impact seviyesi ve sonuc ozeti eklendi
- [X] V1 kapsami icin kritik eksik kalmadi

---

## 19. Kullanicilar

**Tanim:** Admin kullanici yonetimi. Kullanici listeleme, detay, aktivasyon, sifre ve rol islemleri.

### Mevcut Durum

- `/admin/users` backend CRUD benzeri admin endpointleri mevcut
- Frontend'de kullanici liste ve detay sayfalari var
- Aktif/pasif, sifre ve rol atama akislari backend'de mevcut
- ERP personel karti alanlari eklendi: personel kodu, departman, ekip, varsayilan makine, ERP notu

### Eksikler

- [X] ERP personel / operator / departman karti baglandi
- [X] Varsayilan makine secimi eklendi
- [ ] Son giris / oturum / cihaz takibi eksik
- [ ] Kullanici durumlari icin audit ve gorev baglantisi yok

---

## 20. Rol & Permission

**Tanim:** Kullanici rollerinin ve sayfa/endpoint izinlerinin yonetimi.

### Mevcut Durum

- Rol bazli access control mevcut (`admin`, `operator`, `satin_almaci`, `nakliyeci`)
- `user_roles` modulu ve UI mevcut
- Backend permission guard'i artik rol x aksiyon matrisi ile calisiyor
- `user-roles` ekraninda permission matrisi mevcut

### Eksikler

- [X] Granular permission matrisi eklendi (`goruntule`, `olustur`, `guncelle`, `sil`)
- [X] Permission ekraninda modul bazli tablo/matris eklendi
- [ ] Rol kaliplari UI'dan yonetilemiyor
- [ ] Kullanici bazli istisna izinleri yok

---

## 21. Gorevler

**Tanim:** Kullanicilara veya rollere atanan is/gorev kayitlari. ERP aksiyonlarini takip eder.

### Mevcut Durum

- `gorevler` veri modeli eklendi
- Admin listesi, filtreleme, olusturma, duzenleme, silme ekranlari mevcut
- Kullaniciya ve role atama destekleniyor
- Dashboard'ta acik gorev ve geciken gorev ozeti gorunuyor
- Kullaniciya gorev atandiginda bildirim olusuyor

### Eksikler

- [X] Gorev veri modeli eklendi (`baslik`, `tip`, `modul`, `ilgili_kayit`, `atanan_kullanici`, `termin`, `durum`)
- [X] Gorev listeleme / detay / atama UI eklendi
- [X] Dashboard ile entegrasyon eklendi
- [X] Bildirim ile otomatik gorev atama bildirimi eklendi
- [ ] Audit olayindan otomatik gorev turetme kurallari V1 disinda — detay backlog [V2_DURUM_RAPORU.md](/home/orhan/Documents/Projeler/paspas/V2_DURUM_RAPORU.md) icine tasindi

---

## 22. Giris Ayarlari

**Tanim:** Admin, sevkiyat, operator ve satin alma kullanicilarinin giris akisini, aktif hesaplarini, yonlendirmelerini ve temel auth runtime bilgisini tek merkezden izleme/yönetme modulu.

### Mevcut Durum

- `auth` modulu aktif: `/auth/token`, `/auth/token/refresh`, `/auth/status`, `/auth/logout`
- ERP roller: `admin`, `sevkiyatci`, `operator`, `satin_almaci`
- Frontend login formu ortak, hizli demo login butonlari var
- `Giris Ayarlari` modulu ile:
  - rol bazli giris hesaplari goruluyor
  - aktif/pasif kullanici sayilari izleniyor
  - son giris bilgisi goruluyor
  - hizli login / sifreli login / rol kartlari / redirect ayarlari DB'den yonetiliyor
  - runtime auth bilgileri (frontend/public url, cors, temp login, admin allowlist) listeleniyor

### Eksikler

- [X] Ayrik login ayarlari modulu eklendi
- [X] Admin / sevkiyat / operator / satin alma girisleri tek ekranda izleniyor
- [X] Rol yonlendirmeleri ayarlanabiliyor
- [ ] Sifre politikasi (min complexity / rotation) UI'dan yonetilemiyor
- [ ] 2FA / MFA yok
- [ ] IP / cihaz bazli login kisiti yok
- [ ] Kullanici bazli login exception ve oturum kural motoru yok

---

## Yeni Kavramlar / Alt Moduller — V1 Kontrol

| Kavram                     | V1 Gereksinim | Mevcut                                        | Durum            |
| -------------------------- | ------------- | --------------------------------------------- | ---------------- |
| Urun birim donusumleri     | Zorunlu       | `urun_birim_donusumleri` tablosu + form     | ✅               |
| Urun operasyonlari         | Zorunlu       | `urun_operasyonlari` tablosu + form         | ✅               |
| Uretim emri operasyonlari  | Zorunlu       | `uretim_emri_operasyonlari` + auto-populate | ✅               |
| Kalip-makine uyumlulugu    | Zorunlu       | `kalip_uyumlu_makineler` + matris UI        | ✅               |
| Operator vardiya kayitlari | Zorunlu       | `vardiya_kayitlari` tablosu + endpoint      | ✅               |
| Durus nedenleri            | Zorunlu       | `durus_kayitlari` tablosu + serbest metin   | ⚠️ Katalog yok |
| Sevkiyat kayitlari         | Zorunlu       | `sevkiyatlar` + `sevkiyat_kalemleri` + UI | ✅               |
| Mal kabul kayitlari        | Zorunlu       | `mal_kabul_kayitlari` + UI                  | ✅               |
| Silme / iptal mekanizmasi  | Zorunlu       | ❌ Yok                                        | ❌               |

---

## Hesap Motorleri — V1 Kontrol

| Motor                           | V1 Gereksinim | Mevcut                                          | Durum      |
| ------------------------------- | ------------- | ----------------------------------------------- | ---------- |
| Planlanan sure                  | Zorunlu       | `makine_kuyrugu.planlanan_sure_dk` hesaplanir | ✅         |
| Planlanan bitis                 | Zorunlu       | max(planlanan_bitis) from kuyruk                | ⚠️ Basit |
| Termin riski                    | Zorunlu       | `terminRiski` boolean karsilastirma           | ✅         |
| Stok yeterlilik                 | Zorunlu       | ❌ Yok                                          | ❌         |
| Gerceklesene gore plan kaydirma | Zorunlu       | ❌ Yok                                          | ❌         |

---

## Yonetim Modulleri — V1 Kontrol

| Modul              | Mevcut Durum                                           | Durum      |
| ------------------ | ------------------------------------------------------ | ---------- |
| Dashboard          | Rol bazli gorunum + aksiyon merkezi + widget config    | ✅       |
| Medyalar           | Asset CRUD + klasor + bulk upload mevcut               | ⚠️ Kismi |
| Site Ayarlari      | Genel ayarlar ve branding tablari mevcut               | ⚠️ Kismi |
| Veritabani         | Full DB + Snapshot + DB info + audit entegrasyonu tam  | ✅       |
| Audit Loglari      | Hook + ERP filtreleri + ozet kartlar + detay ekrani   | ✅       |
| Kullanicilar       | Liste, detay, aktiflik, sifre, rol atama + ERP kart    | ✅       |
| Rol & Permission   | Role x aksiyon matrisi + backend guard entegrasyonu    | ✅        |
| Gorevler           | Bildirim disinda ayrik modul yok                       | ❌        |

---

## Oncelikli Eksik Isler (Sonraki Adimlar)

### Yuksek Oncelik

1. **Permission matrisi** — Modul x aksiyon bazli rol/izin ekrani ve backend mapping
2. **Gorevler modulu** — Atama, durum, termin, dashboard entegrasyonu
3. ~~**Dashboard aksiyon merkezi** — Geciken termin, kritik stok, bekleyen satin alma, gorevler~~ ✅
4. **Kullanicilar → ERP personel baglantisi** — operator/departman/makine yetkisi
5. **Site ayarlari ERP sekmesi** — firma, evrak, seri, vardiya defaultlari

### Orta Oncelik

6. **Audit diff ekrani** — before/after kayit farki ve ERP filtreleri
7. **Medyalar ERP iliskileri** — urun/kalip/musteri evraki klasorleme ve baglar
8. **Veritabani operasyon matrisi** — import/export/snapshot icin guvenli modul kurallari
9. **Kullanici bazli istisna izinleri** — rol disi override mekanizmasi
10. **Gorev → bildirim otomasyonu** — kritik olaylarda otomatik task acma

### Dusuk Oncelik

11. ~~**Dashboard widget konfigurasyonu** — kullanici bazli layout kaydi~~ ✅
12. **Storage revizyon takibi** — asset version/history
13. **Audit alarm kurallari** — kritik endpoint bazli uyarilar
14. **Rol sablonlari** — hazir profil setleri
15. **Bildirim merkezi ile gorev birlestirme** — tek inbox deneyimi

---

## Teknik Altyapi Durumu

| Altyapi                                      | Durum |
| -------------------------------------------- | ----- |
| Backend Framework (Fastify 5 + Bun)          | ✅    |
| Frontend Framework (Next.js 16 + React 19)   | ✅    |
| Veritabani (MySQL + Drizzle ORM)             | ✅    |
| State Management (Redux Toolkit + RTK Query) | ✅    |
| Validasyon (Zod)                             | ✅    |
| Auth (JWT + Argon2)                          | ✅    |
| Dosya Yukleme (Cloudinary)                   | ✅    |
| i18n (tr.json)                               | ✅    |
| Tema Sistemi (OKLCH + presets)               | ✅    |
| Sidebar + Routing                            | ✅    |
| TypeScript strict mode                       | ✅    |
| Seed/Migration sistemi                       | ✅    |

---

> **Not:** Bu rapor mevcut kod tabaninin `2026-03-07` tarihindeki durumunu yansitir.
> Eksikler duzeltildikce ilgili satirlar guncellenmelidir.
