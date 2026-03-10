# Paspas ERP — V1 Durum Raporu

> **Tarih:** 2026-03-10
> **Referans:** `URETIM_PLANLAMA_V1.md`, `Rev 1.docx` (musteri geri bildirimi)
> **Amac:** Her modulun V1 planina gore mevcut durumunu, musteri Rev1 taleplerini ve eksik islemleri kayit altina almak.
> **Not:** V1 kapsami disina tasinan maddeler [V2_DURUM_RAPORU.md](V2_DURUM_RAPORU.md) dosyasina alinmistir.
> **Isaret Sistemi:** ✅ Tamamlandi | 🔧 Rev1 Talebi (yapilacak) | 🐛 Bug (duzeltilecek) | ⏳ Devam ediyor

---

## Ozet Tablo

| #  | Modul              | Backend | Frontend | V1 Durum | Rev1 Durumu                                     |
| -- | ------------------ | ------- | -------- | -------- | ----------------------------------------------- |
| 1  | Urunler (+ Recete) | ✅ Tam  | ✅ Tam   | %100     | ✅ 7/7 Rev1 + metadata refactor tamamlandi      |
| 2  | Musteriler         | ✅ Tam  | ✅ Tam   | %100     | ✅ Tedarikci ile birlestirildi                  |
| 3  | Satis Siparisleri  | ✅ Tam  | ✅ Tam   | %100     | ✅ 8/8 Rev1 + ozet kartlar + fiyat fix          |
| 4  | Uretim Emirleri    | ✅ Tam  | ✅ Tam   | %100     | ✅ 7/7 Rev1 tamamlandi                          |
| 5  | Makine Havuzu      | ✅ Tam  | ✅ Tam   | %100     | ✅ 5/5 Rev1 + 2 bug tamamlandi                  |
| 6  | Makine Is Yukleri  | ✅ Tam  | ✅ Tam   | %100     | ✅ 3/3 Rev1 + Son Bitis kutusu eklendi          |
| 7  | Gantt              | ✅ Tam  | ✅ Tam   | %100     | ✅ 2/2 Rev1 tamamlandi                          |
| 8  | Stoklar            | ✅ Tam  | ✅ Tam   | %100     | ✅ Musteri onayladi                             |
| 9  | Satin Alma         | ✅ Tam  | ✅ Tam   | %100     | 🔧 Eksiklikler tespit edildi                    |
| 10 | Hareketler         | ✅ Tam  | ✅ Tam   | %100     | ✅ Musteri onayladi                             |
| 11 | Operator           | ✅ Tam  | ✅ Tam   | %100     | ✅ Vardiya fix + 500 hata + stok artisi fix     |
| 12 | Tanimlar           | ✅ Tam  | ✅ Tam   | %100     | ✅ 4/4 Rev1 + hafta sonu plan fix               |
| 13 | Tedarikci          | ✅ Tam  | ✅ Tam   | %100     | ✅ Musteri ile birlestirildi                    |
| 14 | Sevkiyat (YENİ)   | ✅ Tam  | ✅ Tam   | %100     | ✅ Tum Rev1 tamamlandi                          |
| 15 | Dashboard          | ✅ Tam  | ✅ Tam   | %100     | Musteri incelemedi henuz                       |
| 16 | Medyalar           | ✅ Tam  | ✅ Tam   | %90      | —                                              |
| 17 | Site Ayarlari      | ✅ Tam  | ✅ Tam   | %95      | ✅ ERP firma karti / branding dinamiklestirildi |
| 18 | Veritabani         | ✅ Tam  | ✅ Tam   | %100     | —                                              |
| 19 | Audit Loglari      | ✅ Tam  | ✅ Tam   | %100     | —                                              |
| 20 | Kullanicilar       | ✅ Tam  | ✅ Tam   | %100     | —                                              |
| 21 | Rol & Permission   | ✅ Tam  | ✅ Tam   | %100     | —                                              |
| 22 | Gorevler           | ✅ Tam  | ✅ Tam   | %100     | —                                              |
| 23 | Giris Ayarlari     | ✅ Tam  | ✅ Tam   | %90      | ✅ Sifre politikasi eklendi                     |
| 24 | Mal Kabul (YENİ)  | —      | —       | %0       | ⏳ Planlandi, uygulama baslamadi                |

---

## 0. Son Guncelleme Notlari (2026-03-10)

### 2026-03-10 Duzeltme ve Iyilestirmeler

- [X] ✅ **Operator 500 hatalari duzeltildi** — `POST /operator/baslat` ve `/operator/bitir` endpoint'lerinde Error nesneleri bos `{}` olarak loglaniyordu; `extractError` helper ile duzgun `msg+stack` cikartma eklendi. Bilinen hatalar (404 kuyruk_kaydi_bulunamadi, 409 zaten_baslatilmis) icin dogru HTTP kodlari donuyor
- [X] ✅ **Uretim tamamlaninca stok artisi eklendi** — `repoUretimBitir` icinde tum operasyonlar bittiginde mamul stok otomatik artiyor + `hareketler` tablosuna `giris/uretim` kaydi ekleniyor (transaction icinde)
- [X] ✅ **Siparis durum hesaplama bug'i duzeltildi** — `refreshSiparisDurum` fonksiyonu uretim tamamlansa bile `uretimde` gosteriyordu; `anyUretimActive` vs `allUretimDone` ayrimi ile duzeltildi
- [X] ✅ **Sevkiyat bekleyenler filtresi genisletildi** — `planlandi` durumundaki siparisler de artik sevkiyat bekleyen listesinde gorunuyor
- [X] ✅ **Satis Siparisleri ozet kartlari eklendi** — liste sayfasina 6 ozet kart (Toplam, Uretimde, Uretim Bitti, Sevk Bekleyen, Kismen Sevk, Termin Riski) eklendi; turuncu/kirmizi highlight'lar ile dikkat cekici
- [X] ✅ **Birim fiyat indirimsiz olarak kaydediliyor** — siparis formunda urun secildiginde artik baz fiyat (iskontosuz) geliyor; iskonto sadece toplam hesaplamasinda ayrica gosteriliyor
- [X] ✅ **Makine Is Yukleri "Son Bitis" kutusu eklendi** — her makinenin ozet alanina 4. kutu olarak son isin planlanan bitis tarihi (tarih uste, saat alta) eklendi
- [X] ✅ **Urun formu reset sorunu duzeltildi** — yeni urun kaydettikten sonra form alanlari ve draft state'ler (recete, medya, cover) sifirlanmiyor, ikinci urunde eski bilgiler kaliyordu; artik reset + refetchNextCode calisiyor
- [X] ✅ **Hafta sonu plani validation hatasi duzeltildi** — frontend `aciklama: null` gonderiyordu ama backend `z.string().optional()` null kabul etmiyordu; frontend `undefined`, backend `.nullable()` ile duzeltildi

### 2026-03-09 Duzeltmeler

- [X] ✅ **ERP firma karti genisletildi** — `company_profile` icine resmi unvan, vergi bilgileri, MERSIS, ticaret sicil, merkez/fabrika adresleri, finans/sevkiyat iletisim alanlari eklendi
- [X] ✅ **Admin header / sidebar firma bilgisine baglandi** — ust marka alani, alt bilgi alani ve footer artik `site_settings` uzerinden dinamik
- [X] ✅ **Logo & favicon veri kaynagi duzeltildi** — admin UI ile site settings branding kaydi ayni kaynagi kullanir hale getirildi
- [X] ✅ **Giris Ayarlari sifre politikasi eklendi** — minimum uzunluk, buyuk harf, rakam ve ozel karakter zorunlulugu ayarlanabilir oldu
- [X] ✅ **Urun modulu hardcoded kurallar temizlendi** — kategori, alt kategori, kod prefix, birim, recete kullanimi ve operasyon davranisi kategori metadata'sina tasindi
- [X] ✅ **Seed normalize edildi** — urun birimleri ve `operasyon_tipi` alani metadata kurallarina gore yeniden duzenlendi; `db:seed` temiz calisiyor
- [X] ✅ **Backend dev port cakismasi duzeltildi** — eski `bun --hot` sureci varsa temizleyip yeniden baslatan dev akisi eklendi
- [X] ✅ **Uretim Emirleri backend kontratlari sertlestirildi** — default sort `bitis_tarihi asc` ile hizalandi, manuel durum patch sadece `iptal` ile sinirlandi, UUID alanlarinda gevsek validation kaldirildi
- [X] ✅ **Uretim Emri detay ekrani toparlandi** — malzeme yeterlilik bolumu kartli ozet yapisina alindi, tarih alanlari okunur formatta gosteriliyor
- [X] ✅ **Uretim Emri liste / form sadeleştirildi** — ozet kartlari, filtre sifirlama, tek takvim kolonu ve manuel/siparisten uretim akisini ayiran yeni form yapisi eklendi
- [X] ✅ **Makine Havuzu / Is Yukleri UI toparlandi** — atanmamis emirler, makine kuyruklari ve is yukleri ekranlarina ozet kartlari, okunur tarih bloklari ve daha net atama bilgilendirmeleri eklendi
- [X] ✅ **Satin Alma otomatik taslak gorunurlugu iyilesti** — otomatik kritik stok siparisleri liste ve detayda badge ile ayristiriliyor; satin alma listesine ozet kartlari ve filtre sifirlama eklendi

---

## 0.1 Sonraki Uygulama Plani (2026-03-10)

Bu bolum, son kullanici geri bildirimi uzerine bir sonraki implementasyon dalgasini tanimlar. Odak: **sevkiyat onay / fiziksel sevk akislarini gorev ve dashboard ile birlestirmek**.

### Hedef

- Admin tarafinda olusan sevkiyat bekleyen islerin **otomatik gorev** olarak dusmesi
- `sevkiyatci` kullanicisinin sevkiyat ekraninda **onayli sevkleri fiziksel sevke cevirebilmesi**
- Dashboard kartlari ve sayaclarin **canli is akisi verisine gore** degismesi

### Planlanan Is Paketleri

#### A. Gorev Uretimi ve Gorev Kapatma Akisi

- [X] ✅ **Admin gorevi: sevk onay bekleyen kayit**`sevk_emri` olusturuldugunda ve/veya `bekliyor` durumunda admin gorevlerine "Sevk onayini ver" gorevi otomatik dusuyor
- [X] ✅ **Admin gorevi: fiziksel sevk bekleyen kayit**`sevk_emri` `onaylandi` oldugunda, ilgili kayit "Fiziksel sevki tamamla" gorevi olarak admin ve sevkiyat rolunun is listesine dusuyor
- [X] ✅ **Gorev auto-close / auto-update**Kayit `sevk_edildi` veya `iptal` oldugunda ilgili gorevler otomatik kapanıyor; `bekliyor -> onaylandi` gecisinde admin onay gorevi tamamlanip fiziksel sevk gorevleri aciliyor
- [ ] 🔧 **Modul bazli derin link**
  Gorev kartindan tiklayinca ilgili `Sevkiyat` kaydina/filtreli ekrana gitmeli

#### B. Sevkiyatci Ekrani ve Yetki Akisi

- [X] ✅ **Sevkiyat modulu sevkiyatci ana ekrani olmali**`sevkiyatci` login sonrasi varsayilan yonlendirme artik frontend ve backend login ayarlarinda `/admin/sevkiyat`
- [X] ✅ **Admin + Sevkiyatci ortak fiziksel sevk aksiyonu**`onaylandi` durumundaki kayitlarda `Fiziksel Sevk Et` aksiyonunu admin ve sevkiyatci kullanabiliyor; `bekliyor` onayi ise sadece admin goruyor
- [X] ✅ **Fiziksel sevk kaydi netlestirme**`sevk_edildi` aninda `sevkiyatlar` + `sevkiyat_kalemleri` + stok hareketi + stok dusumu transaction icinde kesinleniyor; siparis durum refresh transaction sonrasi tetikleniyor
- [X] ✅ **UI ayrimi**
  `bekleyen` / `onayli` / `acik emir` / `sevk_edildi` anlamlari tablo kolonlarinda ayrildi; sevkiyatci ekranda admin onayi bekleyen emirleri pasif metinle goruyor

#### C. Dashboard Dinamik KPI ve Uyarilar

- [X] ✅ **Dashboard sevkiyat KPI'lari canlilastirildi**Asagidaki metrikler dogrudan DB'den hesaplanmali:
  - bekleyen sevk satiri
  - onay bekleyen sevk emri
  - fiziksel sevk bekleyen onayli emir
  - bugun sevk edilen toplam miktar / emir
- [X] ✅ **Rol bazli dashboard icerigi**Admin dashboard'inda genel ERP ozeti korunurken, sevkiyatci dashboard'inda bugun sevk edilen, onay bekleyen, fiziksel sevk bekleyen ve acik sevkiyat gorevleri one cikiyor
- [X] ✅ **Dashboard kartlari ile gorevler senkron oldu**
  Gorev sayisi ile dashboard kartlarindaki sevkiyat sayaclari ayni kaynaktan beslenmeli

#### D. Kabul Kriterleri

- [X] ✅ Yeni sevk emri olusunca admin gorev listesinde kayit gorunmeli
- [X] ✅ Sevk emri `onaylandi` oldugunda dashboard ve gorev sayaclari degisiyor
- [X] ✅ Sevkiyatci kullanicisi `Fiziksel Sevk Et` yapinca:
  - `Sevk Edilen` kolonu artmali
  - stok dusmeli
  - siparisin sevk durumu guncellenmeli
  - ilgili gorev kapanmali
  - dashboard sayaclari anlik degismeli

### Uygulama Sirasi

1. **Gorev motoru entegrasyonu**
2. **Sevkiyat ekrani + sevkiyatci rol akisinin tamamlanmasi**
3. **Dashboard KPI / sayaç refactor**
4. **Son temizlik: metinler, audit, edge-case testleri**

### Teknik Not

Bu is paketi V1 kapsami icindedir; cunku yeni modul eklemiyor, mevcut `Sevkiyat + Gorevler + Dashboard` omurgasini operasyonel hale getiriyor.

### 2026-03-10 Uygulama Durumu

- [X] ✅ `repoCreateSevkEmri` gorev motoruna baglandi; yeni sevk emri acildiginda admin gorevi otomatik uretiliyor
- [X] ✅ `repoPatchSevkEmri` gorev motoruna baglandi; `onaylandi`, `sevk_edildi`, `iptal` gecislerinde gorevler otomatik guncelleniyor
- [X] ✅ `repoUpsertWorkflowTask` ve `repoCloseWorkflowTasks` yardimcilari eklendi; ayni sevk emri icin idempotent gorev senkronu saglaniyor
- [X] ✅ Seed tarafinda acik sevk emirleri icin gorev olusumu eklendi; temiz kurulumda gorevler bos gelmiyor
- [X] ✅ Runtime dogrulama yapildi: `create -> onaylandi -> sevk_edildi` akisinda gorevlerin acildigi ve kapandigi DB seviyesinde test edildi
- [X] ✅ Sevkiyatci varsayilan yonlendirmesi `/admin/sevkiyat` ile hizalandi; login ayarlari default'u guncellendi
- [X] ✅ Fiziksel sevk akisinda stok `350 -> 343` dusumu ve `hareketler` tablosuna `Sevkiyat: SVK-S-001` kaydi DB seviyesinde dogrulandi
- [X] ✅ Dashboard refactor tamamlandi; backend `dashboard/service.ts` tarafinda sevkiyat KPI alanlari (`bekleyen satir`, `onay bekleyen`, `fiziksel sevk bekleyen`, `bugun sevk edilen`, `acik sevkiyat gorevi`) ve action-center sevkiyat maddeleri aktif
- [X] ✅ Dashboard frontend'i yeni KPI alanlarina baglandi; admin ve sevkiyatci rollerinde farkli sevkiyat odakli kartlar gosteriliyor
- [X] ✅ DB dogrulamasi: admin KPI `pendingShipmentApprovalCount=1`, `pendingPhysicalShipmentCount=1`, `openShipmentTaskCount=3`; sevkiyatci KPI `openShipmentTaskCount=1`; `shippedTodayAmount=7`
- [X] ✅ Audit kapsami dogrulandi; global `adminAudit` hook'u `/api/admin/sevkiyat` uzerindeki `POST/PATCH/DELETE` isteklerini otomatik `admin_audit_logs` tablosuna yaziyor
- [X] ✅ Edge-case testleri genisletildi; sevkiyat validation senaryolari (default query, sifir/negatif miktar, gecersiz durum) icin backend testleri eklendi ve `10/10` test gecti

---

## 1. Urunler (+ Recete / Malzeme Kirilimi)

**Tanim:** Urun, yari mamul ve hammadde tanimlarinin yonetildigi ana modul.
**Musteri Rev1:** "Inceledim, birkac onemli revize var."

### Veri Modeli

| Alan                                   | V1 Gereksinim | Mevcut                                                                     | Durum |
| -------------------------------------- | ------------- | -------------------------------------------------------------------------- | ----- |
| kategori (urun/yari_mamul/hammadde)    | Zorunlu       | `urunler.kategori` enum                                                  | ✅    |
| tedarik_tipi (uretim/satin_alma/fason) | Zorunlu       | `urunler.tedarik_tipi` enum                                              | ✅    |
| SKU / kod                              | Zorunlu       | `urunler.kod` varchar(64) UNIQUE                                         | ✅    |
| Urun adi                               | Zorunlu       | `urunler.ad` varchar(255)                                                | ✅    |
| Aciklama                               | Zorunlu       | `urunler.aciklama` varchar(500)                                          | ✅    |
| Gorsel (tek)                           | Zorunlu       | `urunler.image_url` + `storage_asset_id`                               | ✅    |
| Coklu medya (resim/video/URL)          | Rev1 Talebi   | `urun_medya` tablosu                                                     | ✅    |
| Ana birim                              | Zorunlu       | `urunler.birim` varchar(16) default 'kg'                                 | ✅    |
| Birim hiyerarsisi / donusumleri        | Zorunlu       | `urun_birim_donusumleri` tablosu                                         | ✅    |
| Satis fiyati                           | Zorunlu       | `urunler.birim_fiyat` decimal(12,2)                                      | ✅    |
| KDV orani                              | Zorunlu       | `urunler.kdv_orani` decimal(5,2) default 20                              | ✅    |
| Operasyon tipi (tek/cift tarafli)      | Zorunlu       | `urunler.operasyon_tipi` nullable, kategori metadata'sina gore normalize | ✅    |
| Operasyon alt satirlari                | Zorunlu       | `urun_operasyonlari` tablosu                                             | ✅    |
| Kalip / hazirlik / cevrim sureleri     | Zorunlu       | `urun_operasyonlari` icinde                                              | ✅    |
| Montaj flag'i                          | Zorunlu       | `urun_operasyonlari.montaj` tinyint                                      | ✅    |
| Stok                                   | Zorunlu       | `urunler.stok` decimal(12,4)                                             | ✅    |
| Aktif / pasif                          | Zorunlu       | `urunler.is_active` tinyint                                              | ✅    |
| Urun Grubu (alt kategori)              | Rev1 Talebi   | `urunler.urun_grubu` + `sub_categories` iliskili                       | ✅    |

### Rev1 Talepleri

- [X] ✅ **Birim alani dropdown olmali** — Select bileseni + kategori bazli default (Urun→Takım, Hammadde→Kg, Yarimamul→Adet)
- [X] ✅ **Urun Grubu alani ekle** — DB kolonu + backend + frontend form eklendi. `urunler.urun_grubu` varchar(128)
- [X] ✅ **Operasyonlardan makine secimini kaldir** — musteri onayladi: "default ihtiyac yok, kafa karistirir, kaldiralim". Makine ataması sadece üretim emri / makine havuzu ekranında yapılacak
- [X] ✅ **Receteyi ayri sekme yap** — Urun sayfasi cok uzun. Urun Bilgileri / Recete / Operasyonlar → 3 ayri tab
- [X] ✅ **Cift/tek taraf operasyon duzenleme hatasi** — urunu duzenle modunda actığında cift taraf secildiginde iki operasyon, tek taraf secildiginde tek operasyon gelmesi lazım
- [X] ✅ **Birim donusum ornegi iyilestirmesi** — Takım→Koli (6x), Koli→Palet (20x) gibi zincir donusum. Select dropdown + gorsel onizleme eklendi
- [X] ✅ **Coklu medya destegi** — Urun formunda ayri "Medya" tab'i. Coklu resim, video ve URL eklenebilsin. Ortak MediaGallery bileseni
- [X] ✅ **Yeni urun formu duzenleme ile esitlenmesi** — yeni urun ekranina Recete + Medya tablari eklendi
- [X] ✅ **Kategori / alt kategori tam dinamik** — urun duzenlemede alt grup sadece secili kategoriye bagli aktif alt kategorilerden gelir, serbest giris kaldirildi
- [X] ✅ **Kategori etiket fallback bug'i** — yeni acilan kategorilerde ham i18n key yerine kategori adi/fallback gosterilir
- [X] ✅ **Kategori metadata refactor** — `varsayilan_birim`, `varsayilan_kod_prefixi`, `recetede_kullanilabilir`, `varsayilan_tedarik_tipi`, `uretim_alanlari_aktif`, `operasyon_tipi_gerekli`, `varsayilan_operasyon_tipi` alanlari kategori yonetimine eklendi
- [X] ✅ **Seed ornek tam urun** — recete, medya, operasyon ve birim donusumu dolu ornek urun seed'e eklendi

### Is Kurallari

- [X] Operasyon alani kategori metadata'sindaki `uretim_alanlari_aktif` + `operasyon_tipi_gerekli` kurallarina gore acilir
- [X] Tedarik tipi `satin_alma` ise uretim alanlari gizlenir
- [X] `tek_tarafli` → tek operasyon, `cift_tarafli` → iki operasyon
- [X] Montaj ayri operasyon degil, flag olarak izlenir
- [X] `urun_grubu` sadece secili kategoriye bagli aktif alt kategorilerden secilebilir
- [X] Reçetede kullanilacak malzemeler kategori metadata'sindaki `recetede_kullanilabilir` alanina gore filtrelenir
- [X] Kod onerisi kategori metadata'sindaki `varsayilan_kod_prefixi` ile uretilir
- [X] Birim default'u kategori metadata'sindaki `varsayilan_birim` ile gelir
- [X] `operasyon_tipi` sadece gerekli kategorilerde dolu kalir, digerlerinde `NULL`

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
| Makine tercih sirasi       | Form icinde per-operasyon                    | ✅ Kaldirildi     | ✅    |

### Son Teknik Duzeltmeler

- [X] `urunler` liste filtreleri kategori metadata'sina baglandi; hardcoded kategori/tedarik secenekleri kaldirildi
- [X] Backend `create/update` akisinda gecersiz kategori, alt kategori ve recete malzemesi artik kaydedilemiyor
- [X] `db:seed` sonrasi tutarlilik kontrolu: gecersiz kategori `0`, gecersiz alt kategori iliskisi `0`, metadata'ya aykiri dolu `operasyon_tipi` `0`
- [X] Hammadde urunlerinde operasyon kaydi olusmuyor; uretim olmayan kategorilerde `operasyon_tipi` zorla dolmuyor

### Sinirlamalar

- [ ] Renk alani operasyonlara yansimaz — sadece urun seviyesinde
- [X] ~~Stok yeterlilik hesaplama yok~~ — stoklar modulunde yeterlilik check API eklendi
- [ ] Operasyon bazli recete V1 disinda — recete urun seviyesinde

---

## 2. Musteriler

**Tanim:** Musteri kayitlarinin yonetildigi modul.
**Musteri Rev1:** "Inceledim, sorunsuz. Tedarikci ile tek ekranda filtreli gosterilebilir."

### Rev1 Talepleri

- [X] ✅ **Musteriler + Tedarikciler tek ekran** — ikisini tek ekrana al, Musteriler / Tedarikciler / Tumunu sec filtresi koy

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

### CRUD Operasyonlari

| Islem                  | Backend                          | Frontend       | Durum |
| ---------------------- | -------------------------------- | -------------- | ----- |
| Liste (arama + filtre) | `GET /admin/musteriler`        | ✅ Tablo       | ✅    |
| Detay                  | `GET /admin/musteriler/:id`    | ✅             | ✅    |
| Olusturma              | `POST /admin/musteriler`       | ✅ Sheet form  | ✅    |
| Guncelleme             | `PATCH /admin/musteriler/:id`  | ✅ Sheet form  | ✅    |
| Silme                  | `DELETE /admin/musteriler/:id` | ✅ Onay dialog | ✅    |

---

## 3. Satis Siparisleri

**Tanim:** Musteri siparislerinin kalem bazli yonetildigi modul.
**Musteri Rev1:** Birçok layout ve is mantigi degisikligi istendi.

### Rev1 Talepleri

- [X] ✅ **Toplam alanlari alt alta yap** — Ara Toplam / İskonto / KDV / Genel Toplam alt alta, yan yana degil
- [X] ✅ **Uretim Durumu + Sevk Durumu ayir** — tek durum yerine iki ayri durum alani: `uretim_durumu` (Beklemede, Uretim Planlandi, Uretiliyor, Uretim Tamamlandi) + `sevk_durumu` (Sevk Edilmedi, Kismen Sevk, Tamami Sevk Edildi)
- [X] ✅ **Durum otomatik degissin** — uretim emri olustugunda → planlandi, operator baslatiginda → uretimde, uretim bittiginde recalc, sevkiyat yapildiginda → kismen_sevk/tamamlandi. kapali/iptal korunur
- [X] ✅ **Detayda kutucuklari sadeleştir** — Musteri adi, Termin kalsin. KDV genel toplam icerisinde gosterilsin. Kalem sayisi kaldirilsin. Uretim Durumu ve Sevk Durumu kutucuklarda kalsin. Tek satir, daha kompakt
- [X] ✅ **Satir bazli iskonto kaldır** — İskonto ve İsk. Tutari sutunlari satirlardan kaldirilsin. Altta "Müşteri İskontosu (%X) — Satir fiyatlarina yansitildi" ibaresiyle gösterilsin
- [X] ✅ **Satira tiklaninca recete detayi gelmesin** — bu ozellik kaldirilsin, daha sade
- [X] ✅ **Sevkiyat butonu ayri ekrana yonlensin** — siparis detaydan sevkiyat dialogu kaldirildi, Sevkiyat sayfasina yonlendirme eklendi
- [X] ✅ **Uretilen/Kalan bilgisi** — Kalem bazli Uretilen + Urt. Kalan sutunlari eklendi (backend + frontend)

### Veri Modeli

| Alan                           | V1 Gereksinim | Mevcut                         | Durum |
| ------------------------------ | ------------- | ------------------------------ | ----- |
| Siparis no (auto)              | Zorunlu       | `siparis_no` SS-YYYY-NNNN    | ✅    |
| Musteri baglantisi             | Zorunlu       | `musteri_id` FK              | ✅    |
| Siparis tarihi (default bugun) | Zorunlu       | `siparis_tarihi` date        | ✅    |
| Termin tarihi                  | Zorunlu       | `termin_tarihi` nullable     | ✅    |
| Siparis kalemleri              | Zorunlu       | `siparis_kalemleri` tablosu  | ✅    |
| Durum enum                     | Zorunlu       | 8 deger                        | ✅    |
| Uretim durumu (computed)       | Rev1 Talebi   | ✅ Backend computed + UI Badge | ✅    |
| Sevk durumu (computed)         | Rev1 Talebi   | ✅ Backend computed + UI Badge | ✅    |

### CRUD Operasyonlari

| Islem              | Backend                                 | Frontend          | Durum |
| ------------------ | --------------------------------------- | ----------------- | ----- |
| Liste              | `GET /admin/satis-siparisleri`        | ✅ Tablo + filtre | ✅    |
| Detay              | `GET /admin/satis-siparisleri/:id`    | ✅ Detay sayfasi  | ✅    |
| Olusturma          | `POST /admin/satis-siparisleri`       | ✅ Form           | ✅    |
| Guncelleme         | `PATCH /admin/satis-siparisleri/:id`  | ✅ Form           | ✅    |
| Silme              | `DELETE /admin/satis-siparisleri/:id` | ✅ Onay dialog    | ✅    |
| Sonraki siparis no | `GET /next-no`                        | ✅ Otomatik       | ✅    |

---

## 4. Uretim Emirleri

**Tanim:** Siparislerden veya manuel olarak olusturulan uretim emirlerinin yonetildigi modul.
**Musteri Rev1:** Siralama, durum otomasyonu ve malzeme yeterlilik gösterimi istendi.

### Rev1 Talepleri

- [X] ✅ **Makine atanmadiysa bitiş tarihi boş** — Atanmışsa tarih, atanmamışsa "—". `makineAtamaSayisi > 0` kontrolü mevcut
- [X] ✅ **Tarih formati iyilestirme** — "13 Mart 2026" formati, saat hemen altinda. `renderDate()` fonksiyonu mevcut
- [X] ✅ **Siparisten üret default** — form `useState('siparis')` ile açılıyor
- [X] ✅ **Varsayilan siralama planlanan bitis asc** — Default sort `bitis_tarihi` asc. `planlananBitisTarihi` computed field olduğundan `useMemo` client-side sort eklendi, NULL değerler en sona
- [X] ✅ **Durum otomatik degissin** — `atanmamis` enum eklendi (default). `hazirlaniyor` kaldırıldı. Makine atanınca `atanmamis→planlandi`, kuyruktan çıkınca `planlandi→atanmamis` auto-derive. Formdan manuel durum Select kaldırıldı. Migration: `152_v1_uretim_emri_atanmamis_durum.sql`
- [X] ✅ **Detay sayfasinda malzeme yeterlilik** — Detay sayfasına malzeme yeterlilik tablosu eklendi (stok/gerekli/fark/durum). `useCheckYeterlilikAdminQuery` ile çekiliyor
- [X] ✅ **Detay sayfasinda recete + malzeme gorselleri** — `malzemeGorselUrl` backend'e eklendi (`stokUrunler.image_url`). Detay sayfasında thumbnail + ad + kod gösteriliyor
- [X] ✅ **Aktarilmamis siparis satirlarinda urun adi belirgin** — ürün grup başlığı `text-sm font-semibold`, müşteri satırı `text-xs text-muted-foreground`. Minor iyileştirme yapılabilir

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

| V1 + Rev1 Beklenen | DB Mevcut               | Oto Derive                       | Durum                                      |
| ------------------ | ----------------------- | -------------------------------- | ------------------------------------------ |
| atanmamis          | `atanmamis` (default) | Olusturulunca → atanmamis       | ✅                                         |
| planlandi          | `planlandi`           | Makine ataninca → planlandi     | ✅ Auto-derive mevcut                      |
| uretimde           | `uretimde`            | Operator baslatinca → uretimde  | ✅ Mevcut (operator modulunde)             |
| tamamlandi         | `tamamlandi`          | Her iki op bitince → tamamlandi | ✅ Mevcut (operator modulunde)             |
| iptal              | `iptal`               | Manuel (admin tarafindan)        | ✅                                         |
| ~~hazirlaniyor~~  | Kaldirildi              | —                               | ✅ Migration ile planlandi'ya donusturuldu |

**Not:** Formdan manuel durum Select kaldirildi. Durum sadece iptal icin manuel degisebilir, diger gecisler otomatik.

### CRUD + Ozel Operasyonlar

| Islem           | Backend                               | Frontend          | Durum |
| --------------- | ------------------------------------- | ----------------- | ----- |
| Liste           | `GET /admin/uretim-emirleri`        | ✅ Tablo + filtre | ✅    |
| Detay           | `GET /admin/uretim-emirleri/:id`    | ✅ Detay sayfasi  | ✅    |
| Olusturma       | `POST /admin/uretim-emirleri`       | ✅ Gelismis form  | ✅    |
| Guncelleme      | `PATCH /admin/uretim-emirleri/:id`  | ✅ Form           | ✅    |
| Silme           | `DELETE /admin/uretim-emirleri/:id` | ✅                | ✅    |
| Sonraki emir no | `GET /next-no`                      | ✅ Otomatik       | ✅    |
| Aday listesi    | `GET /adaylar`                      | ✅ Form icinde    | ✅    |

### Rev1.1 — Musteri Ek Talepleri (2026-03-10)

Musteri toplantisi sonrasi gelen yeni talepler:

- [X] ✅ **Yeni emir formunda uretilen miktar gizlensin** — Yeni emir olusturulurken `uretilenMiktar` alani gosterilmez. Sadece duzenleme modunda gorunur
- [X] ✅ **Yeni emir formunda tarih alanlari gizlensin** — `baslangicTarihi`, `bitisTarihi`, `terminTarihi` input alanlari yeni emirdayken gizli. Duzenleme modunda gorunur. `terminTarihi` siparisten otomatik doldurulur (hidden field)
- [X] ✅ **Planlanan miktar serbest girilsin** — Siparis secildiginde toplam miktar otomatik yazilir ama kullanici degistirebilir (az, cok veya ayni olabilir)
- [X] ✅ **Satis siparislerinde planlanan uretim miktari gorulsun** — Liste tablosunda uretim sutununda planlanan/toplam miktar gosterilir. `uretimPlanlananMiktar` zaten backend DTO'da mevcut

---

## 5. Makine Havuzu

**Tanim:** Makinelerin ve operasyon kuyruglarinin yonetildigi modul.
**Musteri Rev1:** Mimari degisiklik + 2 onemli bug.

### Rev1 Talepleri

- [X] ✅ **Uretim emri bazinda atama** — operasyon bazı yerine üretim emri bazında tek satır. Tıklayınca tek operasyonsa tek makine, iki operasyonsa iki makine seçilsin
- [X] ✅ **Onerilen makineler kaldirilsin** — gereksiz bulundu
- [X] ✅ **Silinen uretim emri siparis listesine dusmemesi** — ADAYLAR cache invalidation eklendi (create/update/delete)
- [X] ✅ **Makine atamasinda kalip filtresi calismiyor** — Kalip uyumlu makine yoksa liste bos gosteriliyor (onceden tum makineler gosteriliyordu)
- [X] ✅ **Makineler arasi taşıma icin oncelikle kuyruktan cikar** — kuyruktan cikar + yeniden ata akisi eklendi

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

### CRUD + Kuyruk Operasyonlari

| Islem                  | Backend                             | Frontend        | Durum |
| ---------------------- | ----------------------------------- | --------------- | ----- |
| Makine listesi         | `GET /admin/makine-havuzu`        | ✅ Sheet icinde | ✅    |
| Makine olusturma       | `POST /admin/makine-havuzu`       | ✅ Form         | ✅    |
| Makine guncelleme      | `PATCH /admin/makine-havuzu/:id`  | ✅ Form         | ✅    |
| Makine silme           | `DELETE /admin/makine-havuzu/:id` | ✅ Onay dialog  | ✅    |
| Atanmamis operasyonlar | `GET /atanmamis`                  | ✅ Tab          | ✅    |
| Makine kuyruklar       | `GET /kuyruklar`                  | ✅ Tab          | ✅    |
| Operasyon atama        | `POST /ata`                       | ✅ Atama dialog | ✅    |
| Kuyruktan cikarma      | `DELETE /kuyruk/:id`              | ✅ Buton        | ✅    |
| Kuyruk siralama        | `PATCH /kuyruk-sirala`            | ✅ Drag-drop    | ✅    |

---

## 6. Makine Is Yukleri

**Tanim:** Makinelere atanmis kuyruk ogelerinin goruntulendigi modul.
**Musteri Rev1:** "Cevrim suresi ve hazirlik suresine gore hesaplamalar dogru calisiyor."

### Rev1 Talepleri

- [X] ✅ **Satir satir layout** — tablo yerine satır satır, makine bazında gruplanmış gorunum
- [X] ✅ **Makine ici siralama degistirilebilsin** — drag-drop siralama eklendi
- [X] ✅ **Makineler arasi tasima yerine kuyruktan cikar + yeniden ata** — kuyruktan cikar akisi eklendi

### CRUD Operasyonlari

| Islem                   | Backend                         | Frontend | Durum |
| ----------------------- | ------------------------------- | -------- | ----- |
| Liste (makine filtreli) | `GET /admin/is-yukler`        | ✅ Tablo | ✅    |
| Detay                   | `GET /admin/is-yukler/:id`    | ✅       | ✅    |
| Olusturma               | `POST /admin/is-yukler`       | ✅       | ✅    |
| Guncelleme              | `PATCH /admin/is-yukler/:id`  | ✅       | ✅    |
| Silme                   | `DELETE /admin/is-yukler/:id` | ✅       | ✅    |

---

## 7. Gantt Plani

**Tanim:** Makine bazli gorsel planlama takvimi.
**Musteri Rev1:** "Cok deneyemedim ama dinamik calismiyor gibi."

### Rev1 Talepleri

- [X] ✅ **Dinamik calisma** — uretim emri ve makine kuyrugu ile senkronize, atama yapilinca gantt guncelleniyor
- [X] ✅ **Operasyon adi + musteri adi on planda** — operasyon adı ve müşteri adı goruntuleniyor

### CRUD Operasyonlari

| Islem                  | Backend                    | Frontend    | Durum |
| ---------------------- | -------------------------- | ----------- | ----- |
| Liste (tarih filtreli) | `GET /admin/gantt`       | ✅ Timeline | ✅    |
| Tarih guncelleme       | `PATCH /admin/gantt/:id` | ✅          | ✅    |

---

## 8. Malzeme Stoklari

**Tanim:** Hammadde, yari mamul ve urun stok seviyelerinin izlendigi modul.
**Musteri Rev1:** Incelenmedi, zaten sorunsuz calisiyor. Stok yeterlilik sheet duzeltildi.

### Rev1 Talepleri

- [X] ✅ **Yeterlilik dialog→Sheet donusumu** — Dialog yerine sag tarafa Sheet olarak duzeltildi

### CRUD Operasyonlari

| Islem         | Backend                            | Frontend       | Durum |
| ------------- | ---------------------------------- | -------------- | ----- |
| Liste         | `GET /admin/stoklar`             | ✅ Basit tablo | ✅    |
| Detay         | `GET /admin/stoklar/:id`         | ✅             | ✅    |
| Stok duzeltme | `POST /admin/stoklar/:id/duzelt` | ✅             | ✅    |
| Yeterlilik    | `GET /admin/stoklar/yeterlilik`  | ✅ Sheet       | ✅    |

---

## 9. Satin Alma Siparisleri

**Tanim:** Hammadde ve malzeme tedarikcilerinden yapilan satin alma siparisleri.
**Musteri Rev1:** "Yeni siparis girerken malzeme alani gelmiyor."

### Rev1 Talepleri

- [X] ✅ **Malzeme alani gelmiyor** — Form'a kalem yonetimi eklendi (urun secimi + miktar + birim fiyat + ekle/kaldir)

### CRUD Operasyonlari

| Islem      | Backend                          | Frontend           | Durum |
| ---------- | -------------------------------- | ------------------ | ----- |
| Liste      | `GET /admin/satin-alma`        | ✅ Tablo + filtre  | ✅    |
| Detay      | `GET /admin/satin-alma/:id`    | ✅ Detay sayfasi   | ✅    |
| Olusturma  | `POST /admin/satin-alma`       | ✅ Form + Kalemler | ✅    |
| Guncelleme | `PATCH /admin/satin-alma/:id`  | ✅ Form            | ✅    |
| Silme      | `DELETE /admin/satin-alma/:id` | ✅ Onay dialog     | ✅    |

### Tespit Edilen Eksiklikler (2026-03-10)

#### E1. Kritik Stok Otomatik Siparis — Malzeme Bilgisi Eksik

**Sorun:** `ensureCriticalStockDrafts()` fonksiyonu kritik stok seviyesinin altina dusen urunler icin otomatik taslak satin alma siparisi olusturuyor. Ancak:

- Olusturulan taslak sipariste **hangi malzemenin kritik oldugu frontend'de vurgulanmiyor**
- Siparis aciklamasinda sadece "Kritik stok nedeniyle otomatik olustu." yazisi var — hangi urunlerin kritik oldugu, mevcut stok ve kritik stok degerleri siparis gorunumunde **gorunmuyor**
- Liste gorunumunde otomatik olusan siparisler ile manuel olusturulanlar **ayirt edilemiyor**
- Kritik stok tetiklemesi her `GET /admin/satin-alma` isteginde calisiyor — performans ve yan etki riski

**Beklenen:**

- [X] ✅ Otomatik olusan siparislerde "Otomatik" badge'i gosteriliyor
- [ ] 🔧 Siparis aciklamasinda kritik stok detayi olmali (urun kodu, mevcut stok, kritik seviye, eksik miktar)
- [ ] 🔧 Siparis detay sayfasinda kalem bazli "kritik stok durumu" gosterilmeli
- [ ] 🔧 Kritik stok tetiklemesi liste isteginden ayrilmali (ayri endpoint veya scheduled job)

#### E2. Mal Kabul Akisi Sadece Satin Almaya Bagli

**Sorun:** Mevcut mal kabul akisi (`POST /admin/operator/mal-kabul`) **sadece** satin alma siparisine bagli calisir:

- `malKabulBodySchema` icinde `satinAlmaSiparisId` ve `satinAlmaKalemId` **zorunlu**
- `mal_kabul_kayitlari` tablosunda `satin_alma_siparis_id` **NOT NULL**
- Satin alma kaydı olmadan mal kabul yapilamiyor

**Etkilenen senaryolar:**

- Fason uretimden gelen malzeme kabulu
- Satin alma kaydı olmadan hammadde girisi
- Yari mamul transferleri / iade kabulleri
- Diger tedarik kanallarindan gelen malzeme

**Cozum:** Ayri Mal Kabul modulu olusturulmali → Bkz. **Bolum 24. Mal Kabul Modulu**

#### E3. Teslim Alma Takibi Kisitli

**Sorun:** Teslim alma (mal kabul) takibi sadece satin alma detay sayfasindaki progress bar ile yapilabiliyor:

- Toplu teslim alma listesi/raporu yok
- Tedarikci bazli teslim performansi goruntulenemez
- Tarihe gore teslim gecmisi filtrelenemez
- Kismi teslimlerin birlesik gorunumu yok

**Beklenen:**

- [ ] 🔧 Mal Kabul modulu ile birlikte cozulecek

---

## 10. Hareket Gecmisi

**Tanim:** Sevkiyat, mal kabul ve uretim hareketlerinin kronolojik log modulu.
**Musteri Rev1:** Incelenmedi ama sorunsuz calisiyor.

### CRUD Operasyonlari

| Islem            | Backend                    | Frontend | Durum |
| ---------------- | -------------------------- | -------- | ----- |
| Liste (filtreli) | `GET /admin/hareketler`  | ✅ Tablo | ✅    |
| Olusturma        | `POST /admin/hareketler` | ✅       | ✅    |

---

## 11. Operator Ekrani

**Tanim:** Uretim sahasinda operatorlerin kullandigi ekran.
**Musteri Rev1:** Dogrudan bahsedilmedi ama vardiya 400 hatasi vardi.

### Yapilan Duzeltmeler

- [X] ✅ **Vardiya basi/sonu 400 hatasi** — z.string().uuid() validation seed ID'leriyle uyumsuzdu, z.string().min(1) olarak duzeltildi
- [X] ✅ **Tum modullerde UUID validation** — tum backend validation dosyalarindaki .uuid() kontrolu .min(1) ile degistirildi (seed data prefixed ID kullandigi icin)

### CRUD + Islem Operasyonlari

| Islem          | Backend                         | Frontend         | Durum |
| -------------- | ------------------------------- | ---------------- | ----- |
| Kuyruk listesi | `GET /operator/kuyruk`        | ✅ Tab           | ✅    |
| Uretim baslat  | `POST /operator/baslat`       | ✅ Buton         | ✅    |
| Uretim bitir   | `POST /operator/bitir`        | ✅ Modal         | ✅    |
| Duraklat       | `POST /operator/duraklat`     | ✅ Buton + neden | ✅    |
| Devam et       | `POST /operator/devam-et`     | ✅ Buton         | ✅    |
| Vardiya basi   | `POST /operator/vardiya-basi` | ✅               | ✅    |
| Vardiya sonu   | `POST /operator/vardiya-sonu` | ✅               | ✅    |
| Sevkiyat       | `POST /operator/sevkiyat`     | ✅ Tab           | ✅    |
| Mal kabul      | `POST /operator/mal-kabul`    | ✅ Tab           | ✅    |

---

## 12. Tanimlar ve Ayarlar

**Tanim:** Kalip, tatil takvimi, vardiyalar ve durus nedenleri.
**Musteri Rev1:** Kaliplara arama, tatil genisletmesi, menu birlestirme.

### Rev1 Talepleri

- [X] ✅ **Kaliplara arama kutusu** — Kalip listesi basligina arama inputu eklendi (kod + ad ile filtre)
- [X] ✅ **Tatil gunleri genisletmesi** — `hafta_sonu_planlari` tablosu + CRUD API + frontend tab + planlama motoru entegrasyonu tamamlandi
- [X] ✅ **Dropdown'larda arama** — Combobox bileseni olusturuldu (Popover + Command + arama). Tum ekranlarda kullanima hazir
- [X] ✅ **Menu birlestirme onerileri** — Kaliplar + Makineler "Uretim Tanimlari" altinda, Tatiller + Vardiyalar + Durus Nedenleri "Calisma Planlari" altinda gruplanmis durumda

### Yeni Is Kuralı Notu (2026-03-10)

Mevcut hafta sonu plani modeli haftalik / `hafta_baslangic = pazartesi` mantigiyla calisir ve kayit icinde `cumartesi_calisir` + `pazar_calisir` flag'leri tasir. Kullanici geri bildirimi sonrasi bir sonraki revizyonda haftalik pazartesi bazli modelin kaldirilip, **hafta sonu odakli ama dogrudan Cumartesi/Pazar tarihi secilen** yapiya gecilmesi kararlastirildi.

**Yeni hedef model:**

- Admin artik "hafta baslangici" degil, dogrudan **ilgili hafta sonu tarihini** secer
- Secilen tarih sadece **Cumartesi veya Pazar** olabilir; yani plan mantigi yine hafta sonu icin gecerlidir
- O gun calisacak makineler **coklu secim** ile isaretlenir
- Cumartesi ve Pazar icin planlar yine **ayri ayri** tutulur; fakat secim tarih uzerinden yapilir
- "Tum makineler calisir" veya haftalik tek kayit mantigi kullanilmaz

**Ornek akış:**

1. Hafta sonu icindeki ilgili tarih secilir (`2026-03-14` Cumartesi veya `2026-03-15` Pazar gibi)
2. O gun calisacak makineler secilir
3. Kayit sadece secilen hafta sonu gunu icin gecerli olur
4. Diger hafta sonu gunu gerekiyorsa ayri kayit olarak tanimlanir

**Beklenen teknik etkiler:**

- `hafta_sonu_planlari` veri modeli haftalik flag yapisindan cikacak; kayit artik fiilen `tarih + makine` seviyesinde ele alinacak
- Backend validation Pazartesi kontrolu yerine **hafta sonu tarihi** (Cumartesi/Pazar) kontrolu yapacak
- Frontend formundan `cumartesiCalisir` / `pazarCalisir` checkbox'lari kalkacak
- Liste ekrani "hafta baslangici / cumartesi / pazar" kolonlari yerine **tarih / gun tipi / secili makineler** odakli gosterilecek
- Planlama motoru belirli tarih icin "bu makine bu tarihte hafta sonu override listesinde var mi?" diye bakacak

### CRUD Operasyonlari

| Islem             | Backend                                             | Frontend      | Durum |
| ----------------- | --------------------------------------------------- | ------------- | ----- |
| Kalip CRUD        | `GET/POST/PATCH/DELETE /tanimlar/kaliplar`        | ✅ Tab + Form | ✅    |
| Tatil CRUD        | `GET/POST/PATCH/DELETE /tanimlar/tatiller`        | ✅ Tab + Form | ✅    |
| Vardiya CRUD      | `GET/POST/PATCH/DELETE /tanimlar/vardiyalar`      | ✅ Tab + Form | ✅    |
| Durus nedeni CRUD | `GET/POST/PATCH/DELETE /tanimlar/durus-nedenleri` | ✅ Tab + Form | ✅    |

---

## 13. Tedarikci

**Tanim:** Tedarikci kayitlari. `musteriler` tablosunda `tur='tedarikci'`.
**Musteri Rev1:** "Musteriler ile tek ekrana alinabilir."

### Rev1 Talepleri

- [X] ✅ **Musteriler ile birlestir** — Musteriler + Tedarikciler tek ekranda, tur filtresi ile

---

## 14. Sevkiyat Ekrani (YENİ MODUL)

**Tanim:** Musteri Rev1 ile istenen tamamen yeni modul. Operatordeki mini sevkiyat tab'indan ayri, yonetim seviyesinde sevkiyat planlama ekrani.
**Musteri Rev1:** Detayli aciklama yapildi.

### Rev1 Talepleri — Tumu Yeni

- [X] ✅ **Sevk bekleyen siparisler listesi** — satis siparislerinden sevk edilmeyi bekleyen satirlar goruntuleniyor
- [X] ✅ **Müsteri bazında ve urun bazında gruplama** — UI'da gruplama secenegi eklendi
- [X] ✅ **Stok > 0 default filtre** — ilk acilista stok > 0 filtresi aktif
- [X] ✅ **Siparissiz sevkiyat destegi** — urun bazli gorunumde siparissiz urunler de goruntuleniyor
- [X] ✅ **Sevk emri butonu** — miktar + tarih girisi ile sevk emri olusturma
- [X] ✅ **Operator ekranina dussun** — sevk emri operatorun sevkiyat sekmesine dusur
- [X] ✅ **Cift tarafli guncelleme** — operator + sevkiyat ekrani senkronize

### Teknik Gereksinimler

- Backend: `GET /admin/sevkiyat/bekleyenler` endpoint (siparis + stok birlesik veri)
- Backend: `POST /admin/sevkiyat/emri` endpoint (sevk emri olustur)
- Frontend: Yeni sayfa `/admin/sevkiyat`
- Frontend: Sidebar'a eklenmeli
- DB: `sevk_emirleri` tablosu (sevk_emri_no, siparis_kalem_id, urun_id, miktar, tarih, durum, operator_onay)

---

## 15. Dashboard

**Tanim:** ERP yonetim paneli ust seviye ozet ekrani.
**Musteri Rev1:** Henuz incelenmedi.

### Mevcut Durum — Tamamlandi

- Rol bazli dashboard gorunumu
- KPI kartlari, trend grafik
- Aksiyon merkezi (kritik satin alma, geciken termin, bekleyen onaylar)
- Widget konfigurasyonu
- Gorev atama blogu

---

## 16-23. Diger Moduller

Bu moduller musteri tarafindan dogrudan Rev1'de degerlendirilmedi. Mevcut durumlari korunuyor.

| #  | Modul            | Durum | Not                                                                     |
| -- | ---------------- | ----- | ----------------------------------------------------------------------- |
| 16 | Medyalar         | %90   | ERP nesnesi bazli baglanti eksik                                        |
| 17 | Site Ayarlari    | %95   | ERP firma karti + dinamik branding tamamlandi, audit entegrasyonu eksik |
| 18 | Veritabani       | %100  | Tam                                                                     |
| 19 | Audit Loglari    | %100  | Tam                                                                     |
| 20 | Kullanicilar     | %100  | Tam                                                                     |
| 21 | Rol & Permission | %100  | Tam                                                                     |
| 22 | Gorevler         | %100  | Tam — rol bazli auto-scoping eklendi                                   |
| 23 | Giris Ayarlari   | %90   | Sifre politikasi tamam, 2FA / IP allowlist eksik                        |

### Site Ayarlari — Yeni Durum

**Yapilanlar:**

- `company_profile` yapisi ERP firma karti seviyesine genisletildi
- Admin sidebar / header / footer firma bilgilerini ve branding'i `site_settings` kaydindan okuyor
- Logo & favicon sekmesi branding verisiyle hizalandi
- Seed dosyalarina baslangic firma bilgileri yazildi

**Kalanlar:**

- Audit log'a ayar degisiklik ozeti dusurulmesi
- Login ekrani / e-posta gonderici / PDF cikti basliklarinda ayni firma kartinin kullanilmasi

### Giris Ayarlari — Yeni Durum

**Yapilanlar:**

- Minimum sifre uzunlugu
- Buyuk harf zorunlulugu
- Rakam zorunlulugu
- Ozel karakter zorunlulugu

**Kalanlar:**

- 2FA hazirligi
- IP allowlist / denylist
- Rol bazli giris kisitlari
- Gecici login kill switch

### Gorevler Modulu Detay

**Ozellikler:**

- Tam CRUD: gorev olusturma, duzenleme, silme, hizli durum degistirme
- Kullanici atama: admin tum kullanicilara gorev atayabilir (dropdown)
- Rol atama: gorev belirli bir role atanabilir (admin/operator/sevkiyatci/satin_almaci)
- Bildirim: gorev atandiginda veya yeniden atandiginda otomatik bildirim (`createUserNotification`)
- Ozet kartlar: toplam, acik, bugun terminli, geciken, tamamlanan
- Gecikme tespiti: termin tarihi gecmis ve tamamlanmamis gorevler kirmizi vurgulanir
- Tip cesitliligi: manuel, kritik_stok, satin_alma, uretim, sevkiyat, audit, genel
- Oncelik seviyeleri: dusuk, normal, yuksek, kritik
- Modul baglantisi: gorev hangi ERP moduluyle ilgili belirtilebilir

**Dinamik Gorunurluk (Yeni):**

- Admin: tum gorevleri gorur, herkese atayabilir
- Non-admin kullanicilar: yalnizca kendilerine atanan, rollerine atanan veya atanmamis gorevleri gorur (backend enforced)
- "Sadece bana atananlar" filtresi: dogrudan kullaniciya atananlari gosterir (rol bazli olanlari haric birakir)
- Backend `buildWhere()` fonksiyonu JWT'den user ID + role + isAdmin bilgisini alarak auto-scoping uygular

---

## 24. Mal Kabul Modulu (YENİ MODUL)

**Tanim:** Fabrikaya giren tum malzemelerin (hammadde, fason uretim, yari mamul, iade vb.) kaydini tutan bagimsiz modul. Mevcut mal kabul islevselligini operatör ekranindan ve satin alma bagimliliginden ayirarak genisletir.
**Durum:** ⏳ Planlanma asamasinda

### Mevcut Durum — Sorunlar

Mal kabul islemi su an **ayri bir modul degil**, operatör ekraninin (`POST /admin/operator/mal-kabul`) icinde satin alma siparisine bagimli bir islemdir:

| Sorun                | Aciklama                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------- |
| SA bagimli           | `satinAlmaSiparisId` + `satinAlmaKalemId` zorunlu, satin alma olmadan giris yapilamaz |
| Tablo kisitli        | `mal_kabul_kayitlari.satin_alma_siparis_id` NOT NULL                                    |
| Kaynak tipi yok      | Fason, hammadde, yari mamul, iade gibi farkli giris tipleri desteklenmiyor                |
| Liste/rapor yok      | Toplu mal kabul listesi, filtre, arama, ozet yoktur                                       |
| Tedarikci takibi yok | Tedarikci bazli teslim performansi izlenemiyor                                            |
| Dashboard kisitli    | Sadece `hareketler` summary uzerinden miktar gosteriliyor, detay yok                    |

### Hedef Kapsam

Bagimsiz `/admin/mal-kabul` modulu:

| Ozellik                 | Aciklama                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Coklu kaynak tipi       | `satin_alma`, `fason`, `hammadde`, `yari_mamul`, `iade`, `diger`       |
| SA baglantisi opsiyonel | Satin alma siparisi baglanabilir ama zorunlu degil                                 |
| Tedarikci baglantisi    | Her kayitta tedarikci secimi (satin_alma'dan otomatik, fason/hammadde icin manuel) |
| Liste + filtre + arama  | Tarih, kaynak tipi, urun, tedarikci bazli filtreleme                               |
| Detay sayfasi           | Tek bir mal kabul kaydinin tum bilgileri                                           |
| Ozet kartlar            | Bugunku toplam, kaynak tipine gore dagilim, son 7 gun trendi                       |
| Kalite notu             | Kabul/red/kosullu kabul + kalite notlari alani                                     |
| Parti/lot no            | Izlenebilirlik icin parti numarasi                                                 |

### Veri Modeli Degisiklikleri

#### DB Migration: `mal_kabul_kayitlari` tablosu genisletme

| Alan                      | Mevcut            | Hedef                                     | Degisiklik                                |
| ------------------------- | ----------------- | ----------------------------------------- | ----------------------------------------- |
| `satin_alma_siparis_id` | CHAR(36) NOT NULL | CHAR(36)**NULL**                    | NOT NULL → nullable                      |
| `satin_alma_kalem_id`   | CHAR(36) NOT NULL | CHAR(36)**NULL**                    | NOT NULL → nullable                      |
| `kaynak_tipi`           | —                | VARCHAR(32) NOT NULL DEFAULT 'satin_alma' | **Yeni kolon**                      |
| `tedarikci_id`          | —                | CHAR(36) NULL                             | **Yeni kolon** — FK → musteriler  |
| `parti_no`              | —                | VARCHAR(64) NULL                          | **Yeni kolon** — lot/parti takibi  |
| `kalite_durumu`         | —                | VARCHAR(32) NULL DEFAULT 'kabul'          | **Yeni kolon** — kabul/red/kosullu |
| `kalite_notu`           | —                | VARCHAR(500) NULL                         | **Yeni kolon**                      |

#### Kaynak Tipi Enum

| Deger          | Aciklama                                   | SA Baglantisi |
| -------------- | ------------------------------------------ | ------------- |
| `satin_alma` | Satin alma siparisine bagli standart kabul | Zorunlu       |
| `fason`      | Fasoncudan gelen uretim malzemesi          | Opsiyonel     |
| `hammadde`   | Dogrudan hammadde girisi (SA olmadan)      | Yok           |
| `yari_mamul` | Yari mamul transferi/iadesi                | Yok           |
| `iade`       | Musteriden veya uretimden iade             | Yok           |
| `diger`      | Siniflandirilmamis giris                   | Yok           |

### Backend Plan

#### Yeni Modul: `backend/src/modules/mal_kabul/`

| Dosya             | Icerik                                                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema.ts`     | Genisletilmis `mal_kabul_kayitlari` tablo tanimi, `MalKabulDto`, `MalKabulOzetDto`, `rowToDto`                                                          |
| `validation.ts` | `listQuerySchema` (tarih, kaynak_tipi, urunId, tedarikciId, q, limit, offset), `createSchema` (kaynak_tipi bazli conditional validation), `patchSchema`   |
| `repository.ts` | `repoList` (filtre + sayfalama + ozet), `repoGetById`, `repoCreate` (stok guncelle + hareket olustur + SA durum guncelle), `repoUpdate`, `repoDelete` |
| `controller.ts` | CRUD handler'lari                                                                                                                                               |
| `router.ts`     | `/admin/mal-kabul` route kaydi                                                                                                                                |

#### Yeni SQL Migration

```sql
-- mal_kabul_kayitlari tablosunu genislet
ALTER TABLE `mal_kabul_kayitlari`
  MODIFY COLUMN `satin_alma_siparis_id` CHAR(36) NULL,
  MODIFY COLUMN `satin_alma_kalem_id` CHAR(36) NULL,
  ADD COLUMN `kaynak_tipi` VARCHAR(32) NOT NULL DEFAULT 'satin_alma' AFTER `id`,
  ADD COLUMN `tedarikci_id` CHAR(36) NULL AFTER `urun_id`,
  ADD COLUMN `parti_no` VARCHAR(64) NULL AFTER `gelen_miktar`,
  ADD COLUMN `kalite_durumu` VARCHAR(32) NULL DEFAULT 'kabul' AFTER `notlar`,
  ADD COLUMN `kalite_notu` VARCHAR(500) NULL AFTER `kalite_durumu`,
  ADD INDEX `idx_mal_kabul_kaynak_tipi` (`kaynak_tipi`),
  ADD INDEX `idx_mal_kabul_tedarikci` (`tedarikci_id`),
  ADD INDEX `idx_mal_kabul_kabul_tarihi` (`kabul_tarihi`);
```

#### API Endpointleri

| Method | Route                    | Aciklama                                  |
| ------ | ------------------------ | ----------------------------------------- |
| GET    | `/admin/mal-kabul`     | Liste (filtre + sayfalama + ozet kartlar) |
| GET    | `/admin/mal-kabul/:id` | Tekil kayit detayi                        |
| POST   | `/admin/mal-kabul`     | Yeni mal kabul (kaynak tipine gore)       |
| PATCH  | `/admin/mal-kabul/:id` | Guncelleme (notlar, kalite durumu)        |
| DELETE | `/admin/mal-kabul/:id` | Silme (stok geri alir)                    |

#### Is Kurallari

1. **`kaynak_tipi = satin_alma`**: `satinAlmaSiparisId` + `satinAlmaKalemId` zorunlu, SA durum otomatik guncellenir
2. **`kaynak_tipi = fason`**: Tedarikci zorunlu, SA baglantisi opsiyonel
3. **`kaynak_tipi = hammadde|yari_mamul|iade|diger`**: SA baglantisi yok, tedarikci opsiyonel
4. **Stok guncelleme**: Her mal kabulde `urunler.stok += gelenMiktar`
5. **Hareket kaydi**: Her mal kabulde `hareketler` tablosuna `giris` + `referans_tipi: 'mal_kabul'` kaydi
6. **Mevcut operatör ekrani korunur**: Operatör `POST /admin/operator/mal-kabul` hala calisir, arka planda yeni modulu cagirir

### Frontend Plan

#### Yeni Sayfa: `/admin/mal-kabul`

| Dosya                                           | Icerik                            |
| ----------------------------------------------- | --------------------------------- |
| `page.tsx`                                    | Route entry                       |
| `_components/mal-kabul-client.tsx`            | Ana liste + filtre + ozet kartlar |
| `_components/mal-kabul-form.tsx`              | Yeni mal kabul formu (Sheet)      |
| `[id]/page.tsx`                               | Detay route                       |
| `[id]/_components/mal-kabul-detay-client.tsx` | Detay gorunumu                    |

#### Ozet Kartlar (Liste Sayfasi Ustu)

| Kart              | Deger                                | Kaynak                       |
| ----------------- | ------------------------------------ | ---------------------------- |
| Bugunun Kabulleri | Adet + toplam miktar                 | Backend summary              |
| Satin Alma Kabul  | SA bagli kabuller                    | `kaynak_tipi = satin_alma` |
| Fason Kabul       | Fason kabuller                       | `kaynak_tipi = fason`      |
| Diger Girisler    | Hammadde + yari mamul + iade + diger | Geri kalan tipler            |

#### Filtreler

| Filtre        | Tip       | Secenekler                                                       |
| ------------- | --------- | ---------------------------------------------------------------- |
| Tarih araligi | DateRange | Bugun / Bu hafta / Bu ay / Ozel                                  |
| Kaynak tipi   | Select    | Tumu / satin_alma / fason / hammadde / yari_mamul / iade / diger |
| Urun          | Combobox  | Urun arama                                                       |
| Tedarikci     | Combobox  | Tedarikci arama                                                  |
| Kalite durumu | Select    | Tumu / kabul / red / kosullu                                     |
| Arama         | Input     | Urun kodu/adi, parti no, notlar                                  |

#### Sidebar Kaydi

- Sidebar grubuna `malKabul` eklenir (Stoklar grubunda, Hareketler yaninda)
- Ikon: `PackagePlus` (lucide)
- Etiket: "Mal Kabul"

### Uygulama Sirasi

| #  | Is                                                                                   | Tip        | Oncelik |
| -- | ------------------------------------------------------------------------------------ | ---------- | ------- |
| 1  | DB migration (kolon ekleme + nullable)                                               | Backend    | Yuksek  |
| 2  | Yeni `mal_kabul` backend modulu (schema + validation + repo + controller + router) | Backend    | Yuksek  |
| 3  | Mevcut operator mal-kabul'un yeni modulu cagirmasi (backward compat)                 | Backend    | Yuksek  |
| 4  | Frontend RTK Query endpoint'leri                                                     | Frontend   | Yuksek  |
| 5  | Liste sayfasi + filtreler + ozet kartlar                                             | Frontend   | Yuksek  |
| 6  | Yeni mal kabul formu (kaynak tipi bazli dinamik alanlar)                             | Frontend   | Yuksek  |
| 7  | Detay sayfasi                                                                        | Frontend   | Normal  |
| 8  | Dashboard entegrasyonu (mal kabul KPI iyilestirme)                                   | Full-stack | Normal  |
| 9  | Sidebar + i18n                                                                       | Frontend   | Normal  |
| 10 | Seed data (ornek mal kabul kayitlari)                                                | Backend    | Normal  |

### Sinirlamalar (V1 disinda)

- [ ] Kalite kontrol sureci (numune alma, test sonucu, ret sureci) — V2
- [ ] Depo lokasyonu secimi — V2
- [ ] Barkod/QR okutma ile hizli giris — V2
- [ ] Mal kabul onay sureci (cift imza) — V2
- [ ] PDF mal kabul fissi ciktisi — V2

---

## Oncelik Sirasi (Onerilen Uygulama Plani)

### Faz 1 — Bug Fix + Hizli Kazanimlar ✅ TAMAMLANDI

| # | Is                                                 | Modul         | Tip | Durum                                    |
| - | -------------------------------------------------- | ------------- | --- | ---------------------------------------- |
| 1 | Satin alma malzeme alani bug fix                   | Satin Alma    | 🐛  | ✅ Form'a kalem yonetimi eklendi         |
| 2 | Silinen uretim emri → siparis listesine donmemesi | Makine Havuzu | 🐛  | ✅ ADAYLAR cache invalidation eklendi    |
| 3 | Kalip filtresi → sadece uyumlu makineler          | Makine Havuzu | 🐛  | ✅ Uyumsuz makineler artik gosterilmiyor |
| 4 | Birim dropdown + kategoriye gore default           | Urunler       | 🔧  | ✅ Select + kategori bazli default       |
| 5 | Urun grubu alani ekleme                            | Urunler       | 🔧  | ✅ DB + backend + frontend eklendi       |
| 6 | Dropdown'larda arama (Combobox)                    | Genel         | 🔧  | ✅ Combobox bileseni olusturuldu         |
| 7 | Kaliplarda arama kutusu                            | Tanimlar      | 🔧  | ✅ Kalip listesine arama eklendi         |

### Faz 2 — Satis Siparisi + Uretim Emirleri Layout

| #  | Is                                         | Modul                      | Durum |
| -- | ------------------------------------------ | -------------------------- | ----- |
| 1  | Toplam alanlari alt alta                   | Satis Siparisleri          | ✅    |
| 2  | Satir iskontosunu kaldir, alta ibare       | Satis Siparisleri          | ✅    |
| 3  | Detay kutucuklarini sadeleştir            | Satis Siparisleri          | ✅    |
| 4  | Recete popup kaldir                        | Satis Siparisleri          | ✅    |
| 5  | Uretim/Sevk durumu ayirimi (DB + API + UI) | Satis Siparisleri          | ✅    |
| 6  | Otomatik durum degisimi                    | Satis Siparisleri + Uretim | ✅    |
| 7  | Bitis tarihine gore siralama               | Uretim Emirleri            | ✅    |
| 8  | Atanmamis ise bos tarih                    | Uretim Emirleri            | ✅    |
| 9  | Tarih formati iyilestirme                  | Uretim Emirleri            | ✅    |
| 10 | Malzeme yeterlilik badge (liste)           | Uretim Emirleri            | ✅    |
| 11 | Malzeme yeterlilik (detay sayfa)           | Uretim Emirleri            | ✅    |
| 12 | Recete + malzeme gorselleri (detay sayfa)  | Uretim Emirleri            | ✅    |
| 13 | Siparisten uret default                    | Uretim Emirleri            | ✅    |
| 14 | Durum otomatik (atanmamis enum + derive)   | Uretim Emirleri            | ✅    |
| 15 | Formdan manuel durum kaldir                | Uretim Emirleri            | ✅    |

### Faz 3 — Urunler Yeniden Yapilandirma

| # | Is                                     | Modul      | Durum |
| - | -------------------------------------- | ---------- | ----- |
| 1 | Recete → ayri sekme                   | Urunler    | ✅    |
| 2 | Operasyonlardan makine secimini kaldir | Urunler    | ✅    |
| 3 | Cift/tek taraf operasyon bug fix       | Urunler    | ✅    |
| 4 | Musteri + Tedarikci tek ekran          | Musteriler | ✅    |

### Faz 4 — Makine / Is Yukleri / Gantt Iyilestirme

| # | Is                               | Modul         | Durum |
| - | -------------------------------- | ------------- | ----- |
| 1 | Uretim emri bazinda atama        | Makine Havuzu | ✅    |
| 2 | Onerilen makineleri kaldir       | Makine Havuzu | ✅    |
| 3 | Is yukleri satir satir layout    | Is Yukleri    | ✅    |
| 4 | Gantt dinamik guncelleme         | Gantt         | ✅    |
| 5 | Gantt'ta operasyon + musteri adi | Gantt         | ✅    |

### Faz 5 — Sevkiyat Modulu

| # | Is                               | Modul               | Durum |
| - | -------------------------------- | ------------------- | ----- |
| 1 | DB schema (sevk_emirleri)        | Sevkiyat            | ✅    |
| 2 | Backend API                      | Sevkiyat            | ✅    |
| 3 | Frontend sayfa + sidebar         | Sevkiyat            | ✅    |
| 4 | Operator entegrasyonu            | Sevkiyat + Operator | ✅    |
| 5 | Siparis sevk durumu entegrasyonu | Sevkiyat + Satis    | ✅    |

### Faz 6 — Tatil/Planlama Genisletme

| # | Is                                   | Modul          | Durum                                                                                                  |
| - | ------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------ |
| 1 | Hafta sonu calisma plani DB + API    | Tanimlar       | ✅ Tamamlandi (2025-01-XX) —`hafta_sonu_planlari` tablosu + CRUD API + frontend tab                 |
| 2 | Makine bazli tatil                   | Tanimlar       | ✅ Tamamlandi —`hafta_sonu_planlari.makine_id` alani makine bazli override destekler                |
| 3 | Planlama motoruna tatil entegrasyonu | Gantt + Makine | ✅ Tamamlandi —`recalcMakineKuyrukTarihleri` fonksiyonu tatil ve hafta sonu planlarini dikkate alir |

**Uygulama Detaylari:**

- Yeni tablo: `hafta_sonu_planlari` (id, hafta_baslangic, makine_id, cumartesi_calisir, pazar_calisir, aciklama)
- Backend API: GET/POST/PATCH/DELETE `/admin/tanimlar/hafta-sonu-planlari`
- Frontend: Tanimlar sayfasina "Hafta Sonu Planlari" sekmesi eklendi
- Planlama motoru: `isMakineWorkingDay()` ve `skipToNextWorkingDay()` yardimci fonksiyonlari eklendi
- Varsayilan davranis: Hafta sonu calisma yok, plan varsa override edilir

**Planlanan Refactor Notu (2026-03-10):**

- Bu faz tamamlanmis olsa da hafta sonu plan modulu icin yeni bir operasyon karari alinmistir
- Haftalik / Pazartesi tabanli model kaldirilacak
- Yeni model: **tek tarih + o gun calisacak makineler**
- Cumartesi ve Pazar kayitlari ayri tutulacak, haftalik cift-flag kaydi olmayacak

### Faz 7 — Urun Medya Sistemi

| # | Is                             | Modul          | Durum |
| - | ------------------------------ | -------------- | ----- |
| 1 | DB schema (urun_medya tablosu) | Urunler        | ✅    |
| 2 | Backend API (CRUD + siralama)  | Urunler        | ✅    |
| 3 | Ortak MediaGallery bileseni    | Genel (shared) | ✅    |
| 4 | Urun formuna Medya tab'i ekle  | Urunler        | ✅    |

**Kapsam:**

- `urun_medya` tablosu: coklu resim, video, URL destegi (tip: image/video/url)
- Ortak `MediaGalleryField` bileseni — diger modullerden de import edilebilir
- Urun formunda ayri "Medya" tab'i (mevcut tek gorsel + yeni galeri)
- Siralama (drag-drop veya manuel sira), kapak resmi secimi

### Faz 8 — Mal Kabul Modulu + Satin Alma Iyilestirmeleri

| #  | Is                                                          | Modul                | Durum |
| -- | ----------------------------------------------------------- | -------------------- | ----- |
| 1  | DB migration: mal_kabul_kayitlari genisletme                | Mal Kabul            | ⏳    |
| 2  | Backend: mal_kabul modulu (schema/validation/repo/ctrl/rtr) | Mal Kabul            | ⏳    |
| 3  | Operator mal-kabul backward compat                          | Operator + Mal Kabul | ⏳    |
| 4  | Frontend: RTK Query endpoint'leri                           | Mal Kabul            | ⏳    |
| 5  | Frontend: Liste sayfasi + filtre + ozet kartlar             | Mal Kabul            | ⏳    |
| 6  | Frontend: Yeni mal kabul formu (kaynak tipi bazli)          | Mal Kabul            | ⏳    |
| 7  | Frontend: Detay sayfasi                                     | Mal Kabul            | ⏳    |
| 8  | Satin alma: Otomatik siparis badge + kritik stok detayi     | Satin Alma           | ⏳    |
| 9  | Dashboard: Mal kabul KPI iyilestirme                        | Dashboard            | ⏳    |
| 10 | Sidebar + i18n + seed data                                  | Mal Kabul            | ⏳    |


ürün de operasyon tap i var. burda eger ürün cift tarafli ise yani isag sol ayri kaliplarda üretiliyorsa ayri makineler secilebilmeli. suan bu var. ilave olarak montaj da isaretli. üründeki operasyon tabindan mondaj dugmesini kaldir. bu montaj dugmesi 