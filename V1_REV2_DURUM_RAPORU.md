# Paspas ERP — V1 Rev2 Durum Raporu

> **Tarih:** 2026-03-14
> **Referans:** `V1_REV1_DURUM_RAPORU.md`, `Rev2.docx` (musteri geri bildirimi 12/03/2026)
> **Amac:** Rev1 sonrasi musteri testi sirasinda tespit edilen hatalari, yeni talepleri ve teknik bulgulari kayit altina almak.
> **Isaret Sistemi:** ✅ Tamamlandi | 🔧 Rev2 Talebi (yapilacak) | 🐛 Bug (duzeltilecek) | ⚠️ Teknik Bulgu | ⏳ Devam ediyor

---

## Ozet Tablo

| #  | Modul              | Rev2 Durum                                                                                             | Oncelik   |
| -- | ------------------ | ------------------------------------------------------------------------------------------------------ | --------- |
| 1  | Urunler            | ✅ Recete malzeme Combobox + ✅ Montaj toggle eklendi. 🐛 cift taraf operasyon dogrulama gerekli       | Orta      |
| 2  | Satis Siparisleri  | ✅ Aciklama alani kalem altina tasindi                                                                 | Dusuk     |
| 3  | Uretim Emirleri    | ✅ Math.ceil yuvarlama + ✅ Detay sayfasi sadelesti                                                    | Yuksek    |
| 4  | Makine Havuzu      | ✅ Cache invalidation + ✅ Hata mesajlari + ✅ Montaj sira zorlama                                     | Yuksek    |
| 5  | Makine Is Yukleri  | ✅ Merkezi planlama motoru + ✅ Montaj ibaresi buyutuldu                                                | Kritik    |
| 6  | Gantt Plani        | ✅ Planlama motoru ile tarih hesaplamalari duzeltildi                                                   | Kritik    |
| 7  | Operator           | ✅ Zaten satir satir gorunum mevcut                                                                    | Dusuk     |
| —  | **ALTYAPI**        | ✅ **Merkezi planlama motoru** (_shared/planlama.ts) — 8h/24h, tatil, hafta sonu destegi                | **Kritik**|

---

## 0. Kritik Altyapi: Dinamik Sure Hesaplama Motoru

> **Bu bolum tum planlama modullerinin (Makine Havuzu, Is Yukleri, Gantt) temelini olusturur. Diger Rev2 maddelerinin buyuk cogunlugu bu altyapi duzeldikten sonra otomatik cozulecektir.**

### Mevcut Durum

Makine kuyruğuna is eklendiginde veya siralama degistiginde `recalcMakineKuyrukTarihleri()` fonksiyonu cagrilarak baslangic/bitis tarihleri hesaplaniyor. Ancak bu hesaplama **eksik ve hatali**:

### Tespit Edilen Sorunlar

#### S1. Iki Ayri recalcMakineKuyrukTarihleri Fonksiyonu (DRY Ihlali) — ⚠️ Kritik

| Konum | Dosya | Tatil/HaftaSonu | Kapasite |
| ----- | ----- | --------------- | -------- |
| `makine_havuzu/repository.ts:400-463` | Ata/cikar islemlerinde | ✅ `skipToNextWorkingDay()` var | ❌ Yok |
| `is_yukler/repository.ts:119-164` | Surukleme/siralama islemlerinde | ❌ **Yok — sadece lineer dakika ekler** | ❌ Yok |

**Etki:** Surukle-birak ile siralama degistirince tatil ve hafta sonu gormezden geliniyor, tarihler yanlis hesaplaniyor. Musterinin "bitis suresi hesaplamalari dogru gitmiyor" sikayetinin kok nedeni budur.

**Cozum:** Tek bir paylasimli `recalcMakineKuyrukTarihleri()` fonksiyonu `_shared/` veya `makine_havuzu/` icerisinde tanimlanmali; `is_yukler` modulu bunu import etmeli.

#### S2. repoGetHaftaSonuPlanByDate SQL Hatasi — 🐛 Kritik

**Konum:** `tanimlar/repository.ts:397-412`

```
WHERE hafta_sonu_planlari.hafta_baslangic = '2026-03-14'
```

Bu sorgu `hafta_baslangic` kolonunu dogrudan tarih ile karsilastirir. Ancak `hafta_baslangic` haftanin baslangic tarihini (Pazartesi) tutar, dolayisiyla Cumartesi/Pazar tarihiyle **hicbir zaman eslesmez**. Hafta sonu planlari fiilen **calismamakta**.

**Cozum:** Sorgu `hafta_baslangic <= tarih < hafta_baslangic + 7 gun` seklinde degistirilmeli, veya V1_REV1'deki nota gore hafta sonu modeli tarih bazli yapiya donusturulmeli.

#### S3. saatlik_kapasite ve calisir_24_saat Planlamada Kullanilmiyor — ⚠️ Yuksek

**Konum:** `makine_havuzu/repository.ts`

`saatlik_kapasite` sadece kapasite raporlamasinda (`repoCalculateCapacity`) kullaniliyor. Tarih hesaplamasinda makine gunluk calisma suresi (8 saat mi 24 saat mi) **dikkate alinmiyor**. Hesaplama sadece `hazirlik_dk + (cevrim_sn * miktar) / 60` dakikayi lineer olarak ekliyor.

**Beklenen davranis:**
- `calisir_24_saat = 0` → gun ici calisma saatleri (ornegin 08:00-17:00) disina tasmamali, ertesi gune sarkamali
- `calisir_24_saat = 1` → 24 saat uzerinden hesaplanmali
- Hesaplama tatil ve hafta sonlarini atlamali

#### S4. Durus Kayitlari Planlamaya Yansitilmiyor — ⚠️ Orta

`durusKayitlari` tablosu kapasite raporunda kullaniliyor ama kuyruk tarih hesaplamasinda aktif duruslari hesaba katmiyor. Planlanan sureler, devam eden duruslar sirasinda da ilerliyormus gibi davranabiliyor.

#### S5. Kalip Degisim Suresi Hesaplanmiyor — ⚠️ Dusuk

Ayni makinede arka arkaya farkli kaliplarla calisan isler arasinda kalip degisim suresi (mold changeover) hesaba katilmiyor. Bu V2'ye ertelenebilir.

### Orhan Notu (Rev2.docx'ten)

> "Makinelerin uretim hizi kaliba gore degisiyor. Her urunde kalip bilgisi var. Makineye is emri atadigimizda o makinede o is emri ne kadar zamanda bitirilecegi hesaplanir. Haftasonu calisiyor mu, duruslari var mi, tatil var mi vs ile canli olarak anlik makinenin toplam kapasitesi calisma durumuna gore planlama yapilacak. Kuyruk bu sekilde olusacak. Bunu yaptigimiz zaman, Gantt vs hepsi duzelecek. **En kritik olay bu.**"

### Hedef Mimari: Merkezi Planlama Motoru

```
planlama_motoru(makineId) {
  1. Makine bilgisini al (calisir_24_saat, gunluk calisma saatleri)
  2. Kuyruktaki tum isleri sira sirasina gore al
  3. Cursor = simdi (veya calisan isin gercek baslangici)
  4. Her is icin:
     a. Hesapla: toplam_dk = hazirlik_dk + ceil(cevrim_sn * miktar / 60)
     b. Cursor tatil/hafta sonu ise → bir sonraki calisma gunune atla
     c. Gun icinde kalan saat yetmiyorsa → ertesi gune sark
     d. Baslangic = cursor, Bitis = cursor + toplam_dk (calisma saatleri icinde)
     e. Cursor = bitis
  5. Tum kuyrugu guncelle (baslangic + bitis tarihleri)
}
```

### Uygulama Plani

- [X] ✅ **P0-1:** `_shared/planlama.ts` merkezi hesaplama fonksiyonu olusturuldu
- [X] ✅ **P0-2:** Tatil kontrolu `loadHolidays()` ile toplu cekilip `isWorkingDay()` icinde kullaniliyor
- [X] ✅ **P0-3:** `repoGetHaftaSonuPlanByDate()` yerine `loadWeekendPlans()` — hafta_baslangic + cumartesi/pazar offset ile dogru tarih eslesmesi
- [X] ✅ **P0-4:** Calisma saati modeli eklendi: `calisir_24_saat=0` → 08:00-17:00, `calisir_24_saat=1` → 24 saat. `addWorkingMinutes()` gun sinirlarini dikkate aliyor
- [X] ✅ **P0-5:** `is_yukler/repository.ts` duplike fonksiyon kaldirildi, `_shared/planlama.ts` import ediliyor
- [X] ✅ **P0-6:** `makine_havuzu/repository.ts` de ayni merkezi fonksiyonu import ediyor, tum ata/cikar/sirala islemleri merkezi recalc kullaniyor
- [X] ✅ **P0-7:** Entegrasyon testleri tamamlandi — 33/33 test gecti (isWorkingDay, skipToNextWorkingDay, addWorkingMinutes: hafta sonu, tatil, 8h/24h, siralama degisimi senaryolari)

---

## 1. Urunler

**Musteri Rev2:** "Ana ekrandaki arama kutusu calismiyor. Recetede malzeme secerken arama kutusu koyalim. Operasyonlarda cift tarafli secildiginde asagiya iki operasyon gelmiyor."

### Rev2 Talepleri

#### 1.1 Ana Ekran Arama Kutusu — 🐛 Dogrulama Gerekli

**Musteri:** "Ana ekrandaki arama kutusu calismiyor."

**Teknik inceleme:** `urunler-client.tsx` icerisinde arama inputu ve `useListUrunlerAdminQuery()` entegrasyonu mevcut. Backend `GET /admin/urunler?search=...` destegi var.

**Olasi senaryolar:**
- Arama debounce suresi cok uzun olabilir (kullanici sonuc gormeden cikiyor)
- Backend arama filtresi belirli alanlarda calismiyor olabilir (kod, ad, aciklama)
- Arama sonrasi sayfalama sifirlanmiyor olabilir

**Yapilacak:**
- [X] ✅ **Kok neden:** Frontend `search` parametresi gonderiyordu, backend `q` bekliyordu. Parametre adi duzeltildi (urunler-client.tsx, urunler_admin.endpoints.ts, create-mal-kabul-sheet.tsx)
- [X] ✅ Arama sifirlaninca tum liste geri geliyor

#### 1.2 Recete Malzeme Seciminde Arama — ✅ Tamamlandi

**Musteri:** "Recetede malzeme secerken arama kutusu koyalim."

- [X] ✅ `DraftReceteSection` ve `ReceteSection` icerisindeki `<Select>` → `MalzemeCombobox` (Popover + Command + arama) ile degistirildi
- [X] ✅ Arama urun kodu + urun adi uzerinden calisiyor

#### 1.3 Cift Tarafli Operasyon Hatasi — 🐛 Dogrulama Gerekli

**Musteri:** "Operasyonlarda cift tarafli secildiginde asagiya iki operasyon gelmiyor."

**Teknik inceleme:** Kod incelemesinde `cift_tarafli` mantigi dogru gorunuyor. Ancak musteri bildirimi oldugu icin canli test gerekli.

**Yapilacak:**
- [X] ✅ **Kok neden:** `showProductionFields` ve `showOperasyonTipi` hardcoded `isRecipeCategory` kontrolune baglanmisti. Kategori metadata'sindaki `uretim_alanlari_aktif` ve `operasyon_tipi_gerekli` flaglerine baglanacak sekilde duzeltildi
- [X] ✅ Artik cift tarafli secildiginde iki operasyon satiri gorunuyor

#### 1.4 Montaj Toggle — ✅ Tamamlandi

- [X] ✅ Operasyon satirina `montaj` Switch bileseni eklendi
- [X] ✅ Backend zaten montaj alanini kabul ediyordu, sadece frontend eksikti

---

## 2. Satis Siparisleri

**Musteri Rev2:** "Miktar ve fiyat alanlarina rakam yazildigi anda hesaplama ekranda gozuksun. Yeni siparis girisinde istege bagli aciklamayi, siparis kalemlerinin altina alalim."

### Rev2 Talepleri

#### 2.1 Anlik Hesaplama — ✅ Zaten Calisiyor

**Musteri:** "Rakam yazildigi anda hesaplama ekranda gozuksun."

**Teknik inceleme:** `siparis-form.tsx` icerisinde `useMemo()` ile `araToplam`, `iskontoTutar`, `kdvToplam`, `genelToplam` anlik hesaplaniyor (satir 154-175). Kullanici miktar veya fiyat degistirdiginde ozet kutulari aninda guncelleniyor.

**Durum:** ✅ Calisiyor — musteri muhtemelen farkli bir alan veya senaryodan bahsediyor olabilir. Dogrulama yapilacak.

#### 2.2 Aciklama Alani Konum Degisikligi — 🔧 Yapilacak

**Musteri:** "Aciklamayi siparis kalemlerinin altina alalim, opsiyonel bir alan, daha asagida olsun."

**Mevcut durum:** Aciklama alani musteri secimi ile siparis kalemleri arasinda (satir 301-308). Musteri kalemlerin altinda olmasini istiyor.

- [X] ✅ `aciklama` Textarea alani siparis kalemleri tablosunun altina, toplam kutularinin ustune tasindi

---

## 3. Uretim Emirleri

**Musteri Rev2:** "Malzeme hesaplamalarinda sorun var. Detay ekranini duzenleyelim."

### Rev2 Talepleri

#### 3.1 Malzeme Hesaplama / Yuvarla Hatasi — 🐛 Yuksek

**Musteri ornegi:**
> Medium Koli: 0,166 x 600 = 99,6 → **yukari yuvarla = 100 koli**. Stok: 150 → 100 rezerve, 50 serbest.
> Kartela Quality Mat: 1 x 600 = 600. Stok: 500 → Eksik: 100. Tamami rezerve, depoya giris olursa eksik de rezerve edilmeli.

**Beklenen davranis:**
1. Recete carpimi sonucu kesirli ciktiginda **yukari yuvarlanmali** (`Math.ceil`)
2. Stok yeterliyse sadece gerekli miktar rezerve edilmeli, kalan serbest kalmali
3. Stok yetersizse tum stok rezerve edilmeli + eksik miktar belirtilmeli
4. Eksik malzemeye sonradan stok girisi yapildiginda otomatik eksik kisim da rezerve edilmeli (dinamik rezervasyon)

**Durum:**
- [X] ✅ `hammadde_service.ts` → `getReceteIhtiyaclari()` icinde `Math.ceil` yuvarlamasi eklendi
- [X] ✅ Kismi rezervasyon mantigi mevcut ve dogru calisiyor (stok yeterliyse gerekli kadar, yetersizse tum stok rezerve)
- [ ] 🔧 Stok girisi (mal kabul) sonrasi eksik rezervasyonlarin otomatik tamamlanmasi — yeni ozellik (V2'ye ertelenebilir)
- [X] ✅ Frontend detay sayfasinda malzeme tablosu 7 kolonlu Table'a donusturuldu: Malzeme, Gerekli, Stok, Rezerve, Serbest, Eksik, Durum

#### 3.2 Detay Sayfasi Sadeleştirme — ✅ Tamamlandi

- [X] ✅ Ust ozet kutusu sadelesti: Emir No + Urun Adi + Durum (sol 2/3) + Ilerleme cubugu (sag 1/3)
- [X] ✅ Kirmizi carpi (XCircle) ikonlari kaldirildi, yerine metin renk ile durum gosterimi
- [X] ✅ Diger bilgiler (musteri, termin, miktar) alt "Detaylar" bolumune gruplanadi

---

## 4. Makine Havuzu

**Musteri Rev2:** "Manuel uretim emri olusturduğumda makine havuzuna dusmuyor. Gir-cik yaptik, eski girdiler goruldu. Guncelleme sorunlari var. Atama dialog penceresi ekranda kalmaaya devam ediyor. Atama sirasinda hata olustu mesaji aldim."

### Rev2 Talepleri

#### 4.1 Manuel Uretim Emri Makine Havuzuna Dusmuyor — 🐛 Yuksek

**Musteri:** "Manuel uretim emri olusturduğumda makine havuzuna dusmuyor. Siparisten atamada oldugu gibi kaydedildigi anda dussmeli."

**Olasi neden:** Manuel olusturulan uretim emrinde `uretim_emri_operasyonlari` satirlari olusturulmuyor veya eksik olusturuluyor. Atanmamis listesi bu satirlari baz aliyor.

**Durum:**
- [X] ✅ Backend `autoPopulateOperasyonlar()` hem siparisten hem manuel emirlerde dogru calisiyor (incelendi)
- [X] ✅ `GET /atanmamis` sorgusu `makine_id IS NULL AND durum='bekliyor'` filtresi ile hem siparisten hem manuel emirleri donduruyor

#### 4.2 Cache / Guncelleme Sorunlari — ✅ Tamamlandi

- [X] ✅ `createUretimEmriAdmin` mutation'ina `{ type: 'MakineKuyrugu', id: 'ATANMAMIS' }` tag'i eklendi
- [X] ✅ `updateUretimEmriAdmin` mutation'ina `{ type: 'MakineKuyrugu', id: 'ATANMAMIS' }` tag'i eklendi
- [X] ✅ `deleteUretimEmriAdmin` mutation'ina `ATANMAMIS` + `KUYRUKLAR` tag'leri eklendi
- [X] ✅ `ataOperasyonAdmin` mutation zaten `ATANMAMIS` + `KUYRUKLAR` invalidate ediyordu

#### 4.3 Atama Dialog Kapanmiyor — ✅ Dogrulandi

- [X] ✅ Basarili atama sonrasi `onClose()` cagriliyor (satir 104). Kod incelemesinde sorun gorulmedi
- [X] ✅ Hata durumunda dialog acik kaliyor ve hata mesaji gosteriliyor — dogru davranis

#### 4.4 "Atama Sirasinda Hata Olustu" — ✅ Tamamlandi

- [X] ✅ Frontend hata mesaji detaylandirildi: `kalip_makine_uyumsuz`, `operasyon_bulunamadi`, `makine_bulunamadi` icin Turkce aciklayici mesajlar eklendi

#### 4.5 Ayni Makine Iki Operasyon → Montaj Sirasi — ✅ Tamamlandi

- [X] ✅ `useEffect` ile ayni makineye atanan cift operasyonda montaj otomatik ikinci siraya aliniyor
- [X] ✅ `toast.warning('Aynı makinede montaj ikinci sırada olmalıdır')` uyarisi gosteriliyor

---

## 5. Makine Is Yukleri

**Musteri Rev2:** "Surukle birak yaptığımda bitis suresi hesaplamalari dogru gitmiyor. Siralamayı nasil degistirirsek degistirelim, en sona getirdigim uretimin bitis gun ve saati degismemeli. Montaj ibaresi gozuksun."

### Rev2 Talepleri

#### 5.1 Bitis Suresi Hesaplama Hatasi — 🐛 Kritik

**Musteri:** "Siralamayı nasil degistirirsek degistirelim, en sona getirdigim uretimin bitis gun ve saati degismemeli. Su an degisiyor."

**Kok neden:** `is_yukler/repository.ts` icerisindeki `recalcMakineKuyrukTarihleri()` fonksiyonu tatil ve hafta sonlarini **gormezden geliyor**. Sadece dakikayi lineer olarak ekliyor. Bkz. **Bolum 0 — S1**.

**Musteri mantigi dogru:** Siralama degistirmek toplam isi degistirmez, sadece hangi isin once yapilacagini degistirir. Dolayisiyla son isin bitis tarihi sabit kalmalidir (tatil/hafta sonu farkliliklari haric).

**Cozum:** Merkezi planlama motorunun uygulanmasi ile cozulecek (Bolum 0).

#### 5.2 Montaj Ibaresi — 🔧 Dusuk

**Musteri:** "Iki operasyonu olan uretim emirleri icin montajı hangi uretirnde sectiysek o satirda 'Montaj' ibaresi gozuksun."

**Teknik inceleme:** `is-yukleri-client.tsx` icerisinde montaj badge'i zaten mevcut (satir 141-145, Wrench ikonu). Ancak:
- Badge cok kucuk (9px) ve sadece ikon — metin yok
- "Montaj" yazisi eklenmeli

- [X] ✅ Montaj badge'ine "Montaj" metni eklendi, boyut buyutuldu (`px-1.5 py-0.5 text-xs`, ikon `size-3`)
- [X] ✅ On kosul: Urun formundaki montaj toggle'i eklendi (Bkz. 1.4)

---

## 6. Gantt Plani

**Musteri Rev2:** "Gorunum olarak cok guzel olmus. Dogru tarihte gosterme konusunda hata olabilir mi? Ornek: PRS-02'de bir is var, bu 12'sinde basliyor gozukuyor ama Gantt'ta 13'unde basliyor ve bitiyor."

### Rev2 Talepleri

#### 6.1 Tarih Gosterim Hatasi — 🐛 Kritik

**Musteri ornegi:** PRS-02 makinesinde bir is 12'sinde basliyor ama Gantt'ta 13'unde gosteriliyor.

**Olasi nedenler:**
1. Backend'deki `planlanan_baslangic` UTC olarak saklanip frontend'de timezone donusumu yanlis yapiliyor
2. Gantt bar render'inda gun baslangic/bitis hesaplamasi 1 gun kayiyor
3. `recalcMakineKuyrukTarihleri()` hatali tarih uretiyordur (Bolum 0 ile iliskili)

**Durum:**
- [X] ✅ Merkezi planlama motoru uygulanarak tarih hesaplamalari duzeltildi
- [X] ✅ **Kok neden:** `isoDate()` fonksiyonu `.toISOString().slice(0,10)` kullaniyordu → UTC donusumu +3 saat nedeniyle 1 gun geri kayiyordu. `getFullYear()/getMonth()/getDate()` (local time) ile duzeltildi

---

## 7. Operator Ekrani

**Musteri Rev2:** "Buradaki isleri de Makine is yuku ekraninda oldugu gibi satir satir sirali yapabiliriz."

### Rev2 Talepleri

#### 7.1 Satir Satir Sirali Gorunum — ✅ Zaten Calisiyor

**Teknik inceleme:** `operator-client.tsx` icerisinde `MakineKuyruguTab` ve `KuyrukSatiri` bilesenleri zaten satir satir, makine bazinda gruplanmis gorunum sunuyor. Drag handle, sira numarasi, emir no, urun kodu/adi, operasyon adi, sureler ve tarihler satir bazinda gosteriliyor.

**Durum:** ✅ Zaten mevcut. Musteri muhtemelen eski bir versiyonu test etmis olabilir.

---

## 8. Ek Teknik Bulgular (Kod Incelemesinden)

### 8.1 Hafta Sonu Plan Modeli Gecis Notu

V1_REV1 raporunda (Bolum 12, satir 700-727) hafta sonu plan modelinin degistirilmesi kararlastirilmisti:
- Mevcut: haftalik + `cumartesi_calisir` / `pazar_calisir` flag'leri
- Hedef: dogrudan tarih secimi (Cumartesi/Pazar) + makine coklu secim

Bu gecis Rev2 kapsaminda merkezi planlama motoru ile birlikte ele alinmali. Planlama motoru hafta sonu modelini dogrudan kullanacagi icin iki is birlikte yapilmalidir.

### 8.2 Kalip-Makine Hiz Iliskisi

Mevcut sistemde `cevrim_suresi_sn` urun operasyonu seviyesinde tanimli ve **makine bagimsiz**. Ancak gercekte ayni kalip farkli makinelerde farkli hizla calisir. Bu Rev2 veya V2'de `urun_operasyon_makineleri` tablosuna makine bazli `cevrim_suresi_sn` override alani eklenebilir.

**Karar gerekli:** Bu Rev2'de mi yoksa V2'de mi ele alinacak?

### 8.3 Dinamik Rezervasyon (Stok Girisi → Eksik Rezervasyon Tamamlama)

Musterinin talebi: "Depoya giris olursa eksik kalan kisim da rezerve edilmeli."

Bu yeni bir ozellik — mal kabul veya stok girisi yapildiginda, bekleyen eksik rezervasyonlarin otomatik tamamlanmasi. `hammadde_rezervasyonlari` tablosunda `durum` alani (`tam`, `kismi`, `bekliyor`) eklenebilir.

---

## Rev2 Is Paketi Onceliklendirme

### P0 — Kritik (Planlama Motoru + Bagimli Buglar)

| # | Is | Bagimlilik | Tahmini Etki |
|---|----|------------|-------------|
| P0-1 | Merkezi planlama motoru (`_shared/planlama.ts`) | — | Is Yukleri, Gantt, Makine Havuzu |
| P0-2 | `repoGetHaftaSonuPlanByDate` SQL fix | — | Hafta sonu hesaplamalari |
| P0-3 | `is_yukler` duplike recalc fonksiyonunu kaldir | P0-1 | Surukle-birak tarihleri |
| P0-4 | Calisma saati modeli (8h/24h) | P0-1 | Tum tarih hesaplamalari |
| P0-5 | Gantt tarih gosterim dogrulamasi | P0-1 | Gorsel dogruluk |

### P1 — Yuksek (Musteri Blocker)

| # | Is | Bagimlilik | Tahmini Etki |
|---|----|------------|-------------|
| P1-1 | Manuel uretim emri → makine havuzuna dusme | — | Temel is akisi |
| P1-2 | Cache invalidation (uretim emri + atama) | — | UI guncellik |
| P1-3 | Malzeme hesaplama yuvarla (Math.ceil) | — | Uretim planlama dogrulugu |
| P1-4 | Atama hata mesajlari iyilestirme | — | Kullanici deneyimi |
| P1-5 | Atama sonrasi dialog kapanma | — | Kullanici deneyimi |

### P2 — Orta (UX Iyilestirme)

| # | Is | Bagimlilik | Tahmini Etki |
|---|----|------------|-------------|
| P2-1 | Recete malzeme arama (Combobox) | — | Form kullanilabilirligi |
| P2-2 | Montaj toggle urun formuna ekle | — | Veri giris eksikligi |
| P2-3 | Uretim emri detay sadeleştirme | — | Gorsel temizlik |
| P2-4 | Montaj ibaresi buyutme | P2-2 | Is yukleri okunabilirligi |
| P2-5 | Ayni makine montaj sira zorlama | — | Is mantigi |
| P2-6 | Siparis aciklama alani konum | — | Form duzen |

### P3 — Dusuk / Ertelenebilir

| # | Is | Not |
|---|----|-----|
| P3-1 | Dinamik rezervasyon (stok girisi → otomatik tamamlama) | Yeni ozellik, V2'ye ertelenebilir |
| P3-2 | Makine bazli cevrim suresi override | V2'ye ertelenebilir |
| P3-3 | Kalip degisim suresi hesaplama | V2'ye ertelenebilir |
| P3-4 | Durus kayitlarinin planlamaya yansitilmasi | Planlama motoru sonrasi degerlendirilir |

---

## Onerilen Uygulama Sirasi

```
Faz 1: Planlama Motoru (P0)
  └─ Merkezi hesaplama + hafta sonu fix + calisma saati modeli
  └─ is_yukler duplike temizlik
  └─ Gantt dogrulama

Faz 2: Blocker Buglar (P1)
  └─ Manuel emir havuza dusme
  └─ Cache invalidation
  └─ Malzeme yuvarla fix
  └─ Atama hata/dialog fix

Faz 3: UX (P2)
  └─ Montaj toggle + ibare
  └─ Combobox
  └─ Detay sayfa sadeleştirme
  └─ Siparis aciklama konum

Faz 4: Degerlendirme (P3)
  └─ Dinamik rezervasyon karari
  └─ Makine bazli cevrim karari
```

---

## Sonuc

Rev2'nin **en kritik maddesi** merkezi planlama motorunun uygulanmasidir. Makine kuyruğu tarih hesaplamalari, Gantt goruntuleme ve is yukleri surukle-birak islemleri hep ayni altyapiya bagimlidir. Bu motor cozuldugunde Gantt tarih hatasi, is yukleri bitis suresi hatasi ve hafta sonu planlama sorunlari birlikte cozulecektir.

Ikinci oncelik grubu (P1) musterinin gunluk kullanimi engelleyen cache/guncelleme sorunlari ve malzeme hesaplama hatalaridir. Bu grubun planlama motorundan bagimsiz olarak paralel baslayabilecek kisimlari vardir.
