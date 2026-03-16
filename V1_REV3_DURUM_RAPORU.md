# Paspas ERP — V1 Rev3 Durum Raporu

> **Tarih:** 2026-03-16
> **Referans:** `V1_REV2_DURUM_RAPORU.md`, `Rev3.docx` (musteri geri bildirimi 16/03/2026)
> **Amac:** Rev2 sonrasi musteri testi sirasinda tespit edilen hatalari, yeni talepleri ve teknik bulgulari kayit altina almak.
> **Isaret Sistemi:** ✅ Tamamlandi | 🔧 Rev3 Talebi (yapilacak) | 🐛 Bug (duzeltilecek) | ⚠️ Teknik Bulgu | ⏳ Devam ediyor

---

## Ozet Tablo

| #  | Modul              | Rev3 Durum                                                                                             | Oncelik   |
| -- | ------------------ | ------------------------------------------------------------------------------------------------------ | --------- |
| 1  | Urunler            | 🐛 Silme hatasi + 🐛 Cift taraf tekrar + 🔧 Kategori default + 🔧 Renk→Ozellik + 🔧 PDF upload       | Yuksek    |
| 2  | Musteriler         | 🐛 Silme hatasi + 🔧 Cari kosu kaldir                                                                 | Yuksek    |
| 3  | Siparisler         | 🐛 Duzenleme UE'ye yansimiyor + 🔧 Urun filtre+arama                                                  | Kritik    |
| 4  | Uretim Emirleri    | 🐛 Atanmamis tutarsiz + 🐛 Cache sorunlari + 🐛 Malzeme cift rezervasyon + 🔧 Tamamlananlar toggle    | Kritik    |
| 5  | Makine Is Yukleri  | 🐛 Bitis tarihi tutarsiz + 🐛 Sira degisim tarih hatasi + 🔧 Montaj ibaresi buyutme                   | Yuksek    |
| 6  | Gantt Plani        | 🔧 Satir daralma + 🔧 Tatil soft renk + 🔧 Bugun cizgisi + 🔧 Bar sadeleştirme + 🔧 Haftalik default | Orta      |
| 7  | Malzeme Stoklari   | 🔧 Kritik stok → satir gorunum                                                                        | Dusuk     |
| 8  | Satin Alma         | 🔧 Urun fiyat auto-populate + 🐛 Onayli SA mal kabulde gorunmuyor                                     | Orta      |
| 9  | Hareketler         | 🔧 Bugun default + 🔧 Kategori filtresi                                                               | Orta      |
| 10 | Menuler            | 🔧 Ozet/Gorevler kaldir + 🔧 Kategoriler kaldir + 🔧 Sticky menu + 🔧 Sistem birlestir               | Dusuk     |

---

## 1. Urunler

**Musteri Rev3:** "Bazi urunleri silerken sunucu hatasi aliyorum. Ilk acilista 'urunler' kategorisi gelsin. Bir urunde recete malzemeleri bozuk gorunuyor. Hedef birim urün kategorisinde Koli default gelsin. Cift tarafli sectigimde ikinci operasyon gelmiyor. Renk yerine Ozellik diyelim. Urun gorsellerine PDF eklemek mumkun olur mu."

### Rev3 Talepleri

#### 1.1 Urun Silme Sunucu Hatasi — 🐛 Yuksek

**Musteri:** "Bazi urunleri silmeye calisirken sunucu hatasi aliyorum."

**Teknik inceleme:** `urunler/repository.ts` → `repoDelete()` fonksiyonu silme oncesi FK bagimllik kontrolu yapmiyor. Siparis kalemleri, receteler veya uretim emirlerinde referans edilen urun silinmeye calisilinca MySQL FK hatasi donuyor ve frontend'de genel "sunucu hatasi" gosteriliyor.

**Cozum:** Silme oncesi bagimlilk kontrolu + anlamli Turkce hata mesaji.

**Yapilacak:**
- [X] ✅ `repoDelete` oncesinde 7 tablo FK bagimlilk kontrolu (siparis_kalemleri, uretim_emirleri, recete_kalemleri, hareketler, sevk_emirleri, mal_kabul_kayitlari, satin_alma_kalemleri)
- [X] ✅ Owned children cascade delete eklendi (urun_medya, urun_operasyon_makineleri, urun_operasyonlari, urun_birim_donusumleri)
- [X] ✅ Bagimlilk varsa `409 urun_bagimliligi_var` hatasi donuyor
- [X] ✅ Frontend'de "Bu ürün sipariş, üretim emri veya reçete ile ilişkilendirilmiş, silinemez." Turkce mesaj

#### 1.2 Ilk Acilista Urunler Kategorisi Default — 🔧 Orta

**Musteri:** "Ilk acilista 'urunler' kategorisi gelsin. Digerlerini kullanici isterse gorsun."

**Teknik inceleme:** `urunler-client.tsx` icerisinde `kategori` state'i bos basliyor, tum kategoriler gorunuyor.

**Yapilacak:**
- [X] ✅ `useState` baslangic degeri `''` → `'urun'` olarak degistirildi

#### 1.3 Recete Malzemeleri Bozuk Gorunum — 🐛 Yuksek (Dogrulama Gerekli)

**Musteri:** "Bir tane urunde recete malzemeleri bu sekilde gorunuyor. Bu sorunu baska malzemelerde gormedim."

**Teknik inceleme:** Spesifik bir urunle sinirli. Muhtemel nedenler:
- Orphan recete kaydi (silinmis urunle iliskilendirilmis malzeme)
- Birim donusumu hatasi (null/undefined carpan)
- Frontend render'da eksik alan kontrolu

**Yapilacak:**
- [ ] 🐛 Canli DB'de sorunlu urunu tespit et
- [ ] 🐛 Kok nedeni belirle ve duzelt
- [ ] 🐛 Orphan recete kayitlari icin guard ekle

#### 1.4 Hedef Birim Urun Kategorisinde Koli Default — 🔧 Dusuk

**Musteri:** "Hedef birim alanini kategorisi 'urun' olan malzemelerde Koli olarak default getirelim."

**Teknik inceleme:** `urun-form.tsx` icerisinde `birimDonusumleri` alaninin default degeri yok.

**Yapilacak:**
- [X] ✅ `appendDonusum` cagrisinda `watchKategori === 'urun'` ise `hedefBirim: 'koli'` default geliyor

#### 1.5 Cift Tarafli Operasyon Ikinci Satir Gelmiyor — 🐛 Yuksek

**Musteri:** "Operasyonlarda cift tarafli sectigimde, ikinci operasyon gelmiyor. Tekrar tek tarafliyi secip sonra cift tarafli secince geliyor."

**Teknik inceleme:** Rev2'de (1.3) bu sorun duzeltilmisti. Musteri tekrar bildiriyor — muhtemelen `useFieldArray` + `watch` state gecisi sirasinda race condition. Tek tarafli → cift tarafli gecisinde ikinci operasyon hemen eklenmiyor, once sifirlama yapilip sonra tekrar secilince calisiyor.

**Yapilacak:**
- [X] ✅ Yeni urun `useEffect` — `replaceOps` dependency'den cikarildi (her render'da yeni referans olusturuyordu, effect tetiklenmesini engelleyebiliyordu)
- [X] ✅ Edit modu `useEffect` — ayni `replaceOps` + `form.getValues` dependency fix'i
- [X] ✅ `watchOperasyonTipi` degistiginde operasyon listesi dogru guncelleniyor

#### 1.6 Renk → Ozellik Yeniden Adlandirma — 🔧 Dusuk

**Musteri:** "Renk yerine Ozellik diyelim, bazen renk haricinde bir ozellik yazmamiz gerekiyor."

**Teknik inceleme:** DB kolonu `renk` (varchar 64). Kolon adi degismeyecek, sadece frontend label'lari guncellenecek.

**Yapilacak:**
- [X] ✅ Locale `tr.json` — tum "Renk" → "Özellik" label'lari guncellendi
- [X] ✅ Placeholder "Siyah, beyaz…" → "Renk, boyut, varyant…" olarak guncellendi

#### 1.7 Urun Gorsellerine PDF Ekleme — 🔧 Orta

**Musteri:** "Urun gorsellerine PDF eklemek mumkun olur mu."

**Teknik inceleme:** `urunMedya` tablosu `tip` alani mevcut. Upload component'e PDF accept ve onizleme destegi eklenmeli.

**Yapilacak:**
- [ ] 🔧 Upload component'e `accept` listesine `application/pdf` ekle
- [ ] 🔧 PDF dosyalar icin ikon onizleme (gorselin yerine dosya ikonu + dosya adi)
- [ ] 🔧 Backend validation'a PDF tip kontrolu ekle

---

## 2. Musteriler

**Musteri Rev3:** "Bazi musterileri silerken sunucu hatasi aliyorum. Yeni musteri kaydederken cari kosuna gerek yok, kaldiralim."

### Rev3 Talepleri

#### 2.1 Musteri Silme Sunucu Hatasi — 🐛 Yuksek

**Musteri:** "Bazi musterileri silerken sunucu hatasi aliyorum."

**Teknik inceleme:** `musteriler/repository.ts` → `repoDelete()` basit DELETE sorgusu. Musteriye bagli siparis kayitlari varsa FK constraint hatasi. Urun silme (1.1) ile ayni pattern.

**Yapilacak:**
- [X] ✅ `repoDelete` oncesinde 3 tablo FK bagimlilk kontrolu (satis_siparisleri, uretim_emirleri, sevk_emirleri)
- [X] ✅ Bagimlilk varsa `409 musteri_bagimliligi_var` hatasi donuyor
- [X] ✅ Frontend'de "Bu müşteriye ait sipariş kayıtları var, silinemez." Turkce mesaj

#### 2.2 Cari Kosu Alanini Kaldir — 🔧 Dusuk

**Musteri:** "Yeni musteri kaydederken cari kosuna gerek yok, kaldiralim. Yukarida kod var zaten."

**Teknik inceleme:** `musteri-form.tsx` icerisinde `cari_kodu` input alani mevcut. DB'de kalabilir (nullable), sadece formdan cikarilacak.

**Yapilacak:**
- [X] ✅ `musteri-form.tsx` — `cari_kodu` input alani formdan yoruma alindi (V2'de geri acilinir)
- [X] ✅ Backend validation zaten optional

---

## 3. Siparisler

**Musteri Rev3:** "Yeni siparis girerken urun alanina sadece kategorisi 'urun' olanlar gelsin ve burada da arama kutusu koyalim. Miktar girildiginde hesaplama gozuksun. Siparis duzenledim ama uretim emirlerinde yansimadi."

### Rev3 Talepleri

#### 3.1 Urun Alaninda Sadece Urun Kategorisi + Arama — 🔧 Orta

**Musteri:** "Yeni siparis girerken urun alanina sadece kategorisi 'urun' olanlar gelsin ve burada da arama kutusu koyalim."

**Teknik inceleme:** `siparis-form.tsx` icerisinde `useListUrunlerAdminQuery({})` tum urunleri getiriyor. Filtre ve Combobox eklenmeli.

**Yapilacak:**
- [X] ✅ Query'ye `{ kategori: 'urun' }` filtresi eklendi
- [X] ✅ `<Select>` → `UrunCombobox` (Popover + Command + arama) ile degistirildi
- [X] ✅ Arama urun kodu + urun adi uzerinden calisiyor

#### 3.2 Anlik Hesaplama — ✅ Zaten Calisiyor

**Musteri:** "Miktar girildiginde miktar ve fiyati carpsin, asagida toplamlar gozuksun."

**Teknik inceleme:** `siparis-form.tsx` icerisinde `useMemo()` ile `araToplam`, `iskontoTutar`, `kdvToplam`, `genelToplam` anlik hesaplaniyor (satir 154-175). Rev2'de de dogrulandi.

**Durum:** ✅ Calisiyor — musteri muhtemelen eski versiyonu test etmis.

#### 3.3 Siparis Duzenleme Uretim Emirlerine Yansimiyor — 🐛 Kritik

**Musteri:** "Once 1 kalem siparis girdim. Sonra duzenledim, iki kalem daha ekledim. Guncelle butonuna bastim. Uretim emirlerine gidip siparisten ekle dedim. Ama siparis halen 1 kalem gorunuyor."

**Teknik inceleme:** Backend `repoUpdate` siparis kalemlerini dogru guncelliyor (delete + re-insert). Ancak frontend'de `updateSiparisAdmin` mutation'i `UretimEmirleri:ADAYLAR` tag'ini invalidate **etmiyor**. Uretim emirleri sayfasi eski cache'den okuyor.

**Kok neden:** RTK Query cache invalidation eksik.

**Konum:** `satis_siparisleri_admin.endpoints.ts` → `updateSiparisAdmin` mutation

**Yapilacak:**
- [X] ✅ `updateSiparisAdmin` mutation'ina `UretimEmirleri:LIST` + `UretimEmirleri:ADAYLAR` tag invalidation eklendi
- [X] ✅ `deleteSiparisAdmin` mutation'ina da ayni tag'ler eklendi

---

## 4. Uretim Emirleri

**Musteri Rev3:** "Atanmamis uretim emirlerini listeledigimde atanmamis emir yok diyor, ama makine havuzunda 3 tane gorunuyor. Tamamlananlari goster/gosterme olsun. Makine is yuklerini sildim ama havuza geri dusmedi. Malzeme yeterliligi eksik miktar iki kati gorunuyor."

### Rev3 Talepleri

#### 4.1 Atanmamis Listesi Tutarsiz — 🐛 Yuksek

**Musteri:** "Atanmamis uretim emirlerini listeledigimde atanmamis emir yok diyor. Fakat makine havuzuna geldigimde 3 tane atanmamis emir goruyorum."

**Teknik inceleme:** Iki farkli veri kaynagi:
- UE sayfasi: `listUretimEmirleriAdmin` — emir bazli, `durum` filtresi ile
- Makine Havuzu: `listAtanmamisAdmin` — operasyon bazli, `makine_id IS NULL AND durum='bekliyor'` filtresi

UE sayfasinda "atanmamis" filtresi emir seviyesinde calisirken, makine havuzu operasyon seviyesinde kontrol ediyor. Bir emrin bazi operasyonlari atanmis, bazilari atanmamis olabilir — bu durumda UE sayfasi emri "atanmamis" olarak gostermeyebilir.

**Yapilacak:**
- [X] ✅ Backend `buildWhere`: `durum=atanmamis` filtresi artik operasyon bazli kontrol yapiyor (`uretim_emri_operasyonlari WHERE makine_id IS NULL AND durum='bekliyor'`)
- [X] ✅ Cift operasyonlu emirlerde birisi atanmis digeri atanmamis ise emir hala "atanmamis" olarak gorunuyor

#### 4.2 Tamamlananlari Goster/Gosterme Toggle — 🔧 Orta

**Musteri:** "Uretim emirleri ekraninda da tamamlananlari goster/gosterme olsun. Ilk acilista tamamlananlari gostermesin."

**Teknik inceleme:** Is yuklerinde (Rev2 8.2) ayni ozellik eklenmisti. Ayni pattern uygulanacak.

**Yapilacak:**
- [X] ✅ Backend: `listQuerySchema`'ya `tamamlananlariGoster` parametresi eklendi (default `false`)
- [X] ✅ Backend: `false` iken `durum NOT IN ('tamamlandi', 'iptal')` filtresi uygulanıyor
- [X] ✅ Frontend: "Tamamlananlari Goster/Gizle" toggle butonu eklendi
- [X] ✅ Frontend: Toggle state'i query parametresine bagli

#### 4.3 Cache/Guncelleme Sorunlari — 🐛 Kritik

**Musteri:** "Makine is yuklerini sildim. Guncelle tusuna bastim ama sildiklerim makine havuzuna dusmedi. Ekrandan cikip baska ekrana gidip tekrar dondugumde kayitlar geldi. Hocam ne derseniz deyin heryerde bu guncelleme sorunlari var."

**Teknik inceleme:** `deleteIsYukuAdmin` mutation sadece `IsYukleri:LIST` tag'ini invalidate ediyor. `MakineKuyrugu:ATANMAMIS` ve `MakineKuyrugu:KUYRUKLAR` tag'leri **eksik**. Silinen is kuyruktan cikarilinca atanmamis listesine geri dusmeli ama cache guncellenmedigi icin gorunmuyor.

**Konum:** `is_yukler_admin.endpoints.ts` → `deleteIsYukuAdmin` mutation

**Yapilacak:**
- [X] ✅ `deleteIsYukuAdmin` mutation'ina `MakineKuyrugu:ATANMAMIS` + `MakineKuyrugu:KUYRUKLAR` + `Gantt:LIST` + `UretimEmirleri:LIST` tag invalidation eklendi
- [X] ✅ `updateIsYukuAdmin` mutation'ina `MakineKuyrugu:ATANMAMIS` + `MakineKuyrugu:KUYRUKLAR` + `Gantt:LIST` tag invalidation eklendi

#### 4.4 Malzeme Yeterliligi Eksik Miktar Iki Kati — 🐛 Yuksek

**Musteri:** "Malzeme yeterliligi ile ilgili daha once konustugumuz konu cozulmemis gorunuyor. Eksik miktar iki kati gorunuyor. Rezerve serbest ve eksik arasindaki iliskileri gozden gecirmemiz lazim."

**Teknik inceleme:** `hammadde_service.ts` → `rezerveHammaddeler()` fonksiyonu incelenmeli. Olasiliklar:
1. Cift tarafli operasyonlarda her operasyon icin ayri rezervasyon yapiliyor (2x)
2. Hem emir bazli hem operasyon bazli rezervasyon olusturuluyor
3. `checkHammaddeYeterlilik()` hesaplamasi `mevcutStok = stok - rezerveStok` formulu yanlis hesaplaniyor

**Yapilacak:**
- [X] ✅ `checkHammaddeYeterlilik` → `mevcutStok` hesaplamasi duzeltildi: kendi rezervasyonu haric tutularak serbest stok hesaplaniyor
- [X] ✅ Ayni urun icin birden fazla rezervasyon satiri (cift tarafli operasyon) urun bazinda toplaniyor
- [X] ✅ Formul: `mevcutStok = toplamStok - digerEmirlerin_rezervasyonu` → kendi emrinin rezervasyonu cift sayilmaz
- [ ] ⚠️ Canli dogrulama gerekli — musterinin gorundugu spesifik urun ve emirle test edilmeli

---

## 5. Makine Is Yukleri

**Musteri Rev3:** "Tamamlananlari goster burada da olmali. En sondaki isin bitis tarihi ile makinedeki isin bitis tarihi esit degil. Uretim basladiktan sonra siralama degistirilememeli. Sirasi degisen uretimin tarih guncellenmesi hatali gorunuyor. Montaj hangi satirda yapildigi gozukmeli."

### Rev3 Talepleri

#### 5.1 Tamamlananlari Goster/Gosterme — ✅ Zaten Calisiyor

**Teknik inceleme:** Rev2 (8.2) kapsaminda eklendi. `showCompleted` state + `tamamlananlariGoster` query parametresi mevcut.

**Durum:** ✅ Calisiyor — musteri eski versiyon test etmis olabilir.

#### 5.2 Son Is Bitis Tarihi ≠ Makine Bitis Tarihi — 🐛 Yuksek

**Musteri:** "En sondaki isin bitis tarihi ile makinedeki isin bitis tarihi esit degil."

**Teknik inceleme:** Makine ozet bilgisindeki "son bitis" alani ile kuyruktaki son isin `planlanan_bitis` tarihi farkli kaynaklardan hesaplaniyor olabilir. Planlama motoru kuyruktaki tarihleri guncelliyorken makine ozet kaydi ayri bir alanla tutuluyor olabilir.

**Teknik inceleme:** "Son bitis" frontend'de `group.items.reduce()` ile kuyruktaki en gec `planlananBitis`'ten turetiliyor (stored degil, derived). Sorun: surukle-birak optimistic update sirasinda tarihler eski kaliyor, mutation + refetch tamamlaninca guncelleniyor. P0-2 fix'i (cache tag ekleme) ile refetch daha guvenilir hale geldi.

**Durum:** ⚠️ P0-2 cache fix'i ile iyilesti — canli dogrulama gerekli

#### 5.3 Uretim Basladiktan Sonra Siralama Degistirilememeli — ✅ Zaten Calisiyor

**Teknik inceleme:** Rev2 (8.0) kapsaminda eklendi. `durum === 'calisiyor'` → `useSortable({ disabled: true })` + `toast.warning`.

**Durum:** ✅ Calisiyor — musteri eski versiyon test etmis olabilir.

#### 5.4 Sira Degistirme Sonrasi Tarih Guncellenmesi Hatali — 🐛 Yuksek

**Musteri:** "Sirasi degisen uretimin bitis ve baslangic tarihlerinin guncellenmesi hatali gorunuyor."

**Teknik inceleme:** Surukle-birak sonrasi `updateIsYuku` mutation cagrilarak sira guncelleniyor. Backend'de `recalcMakineKuyrukTarihleri()` cagrilmali ve sonuc frontend'e donmeli. Olasiliklar:
1. Backend recalc sonucunu donmuyor, frontend eski cache'den okuyor
2. `updateIsYukuAdmin` mutation response'unda guncel tarihler yok
3. RTK Query refetch zamanlama sorunu

**Teknik inceleme:** Backend'de `repoUpdate` → `recalcMakineKuyrukTarihleri` cagrilip tum kuyruk tarihleri yeniden hesaplaniyor. Frontend'de optimistic update sirasinda tarihler eski kaliyor, mutation + LIST refetch sonrasi guncelleniyor. P0-2 fix'i ile `updateIsYukuAdmin` artik `MakineKuyrugu` ve `Gantt` tag'lerini de invalidate ediyor.

**Durum:** ⚠️ P0-2 cache fix'i ile iyilesti — canli dogrulama gerekli

#### 5.5 Montaj Ibaresi Buyutme (Is Yukleri + Gantt) — 🔧 Orta

**Musteri:** "Makine is yuklerinde hangi satirda montaj yapildigi gozukmeli. Gantt'ta da ayni durum var."

**Teknik inceleme:** Is yuklerinde "M" badge'i mevcut (Wrench ikonu, `size-2.5`). Ancak kucuk ve sadece ikon. Gantt bar'inda montaj gosterimi yok.

**Yapilacak:**
- [X] ✅ Is Yukleri ListRow + GridRow: Badge buyutuldu (`px-1.5 py-0.5 text-xs`), amber renk, "Montaj" metni eklendi
- [X] ✅ Gantt: Bar icinde montaj ikonu + genis barlarda "Montaj" metni eklendi

---

## 6. Gantt Plani

**Musteri Rev3:** "Satir yuksekligini yarisina indirelim. Tatil gunlerini duz soft renkte gosterelim. Haftalik gelsin. Bugun cizgisi koyalim. Uretim emri adiyla arama yapabilelim. Bazi alanlari kaldiralim."

### Rev3 Talepleri

#### 6.1 Makine Satir Yuksekligi Yarisina Indir — 🔧 Orta

**Musteri:** "Makine bilgilerinden bu kadari yeterli olur. Satirlari biraz daraltalim. Su ankinin hemen hemen yarisi kadar satir yuksekligi yeterli."

**Musteri ornegi:** `ENJ-1 Enjeksiyon 1 - Mars2    4 is    Son bitis: 17/03 10:58`

**Teknik inceleme:** `gantt-client.tsx` → `ROW_H = 96`. Sol panelde makine kodu, adi, kapasite, calisma saati, takvim, ilk is, durus, son bitis bilgileri gosteriliyor.

**Yapilacak:**
- [X] ✅ `ROW_H = 96` → `ROW_H = 56`, `LABEL_W = 300` → `LABEL_W = 260`
- [X] ✅ Sol panel sadelesti: `makineKod makineAd` + `N is · Son: tarih`
- [X] ✅ Bar top pozisyonu yeni yukseklige uyumlandi (top=12)

#### 6.2 Tatil Renklendirme Soft + Duz — 🔧 Orta

**Musteri:** "Tatil gunlerini bu sekilde cizgili degil de duz ve daha soft bir renkte gosterelim. Uretimler daha on planda olsun. Tum kareyi renklendirmek yerine uretim cizgisinin hizasini renklendirmek mumkun olur mu?"

**Teknik inceleme:** `blockPatternStyle()` fonksiyonu `repeating-linear-gradient` ile capraz cizgili desen olusturuyor. Tum hucre yuksekligi boyanıyor.

**Yapilacak:**
- [X] ✅ `blockPatternStyle()` → cizgili `repeating-linear-gradient` yerine duz `backgroundColor` (tatil: rose 12%, hafta sonu: slate 8%, durus: orange 18%)
- [X] ✅ ROW_H kuculdugu icin arka plan dogal olarak bar hizasina oturdu

#### 6.3 Ilk Acilista Haftalik Gorunum — 🔧 Dusuk

**Musteri:** "Ilk acilista Gantt haftalik gelsin."

**Teknik inceleme:** `useState<RangePreset>("month")` → aylik basliyor.

**Yapilacak:**
- [X] ✅ `useState<RangePreset>("month")` → `useState<RangePreset>("week")` + baslangic bitis range guncellendi

#### 6.4 Bugun/Simdi Cizgisi — 🔧 Orta

**Musteri:** "Bugun veya simdi cizgisi koyabilir miyiz."

**Teknik inceleme:** Bugun kolonu `bg-blue-50` ile hafif vurgulaniyor ama belirgin dikey cizgi yok.

**Yapilacak:**
- [X] ✅ Dikey kirmizi `<div>` cizgisi (`w-px bg-red-500 z-20`) + ust noktada kirmizi yuvarlak
- [X] ✅ Saat bazli `preciseDayOffset` ile X pozisyonu hesaplaniyor
- [X] ✅ Her `MachineTimelineRow` icinde gorunuyor

#### 6.5 Uretim Emri Adiyla Arama — 🔧 Dusuk (Dogrulama Gerekli)

**Musteri:** "Uretim emri no yerine, uretim emri adiyla arama yapabilelim."

**Teknik inceleme:** Mevcut search zaten emirNo, siparisNo, urun kodu/adi, musteri, makine uzerinden calisiyor. "Uretim emri adi" diye ayri bir alan yok — urun adi uzerinden arama zaten calisiyor olabilir.

**Yapilacak:**
- [ ] 🔧 Canli dogrulama: urun adi ile arama calisiyor mu test et
- [ ] 🔧 Calismiyorsa search filtresine `urunAd` alanini ekle

#### 6.6 Gantt Bar Bilgilerini Sadeleştir — 🔧 Orta

**Musteri:** "UE numarasi, siparis numarasi, urun kodu ve adi — bu alanlari kaldiralim. Operasyon, Musteri kalsin. Sira noyu kaldiralim. Baslangic ve bitis kalsin. Ilerleme kalsin."

**Teknik inceleme:** `GanttBar` bilesen tooltip'inde tum alanlar gosteriliyor.

**Yapilacak:**
- [X] ✅ Tooltip'ten kaldirildi: UE No, Siparis No, Urun kodu/adi, Sira, Plan tarihleri, Termin
- [X] ✅ Tooltip'te kaldi: Operasyon, Musteri, Baslangic, Bitis, Ilerleme, Durum badge
- [X] ✅ Bar ici: `emirNo` → `operasyonAdi`, genis barlarda musteri gosterimi eklendi

---

## 7. Malzeme Stoklari

**Musteri Rev3:** "Kritik stok kutucuklarini kaldirabilir, satir seklinde kullanim hem yeterli hem de daha anlasilir."

### Rev3 Talepleri

#### 7.1 Kritik Stok Kutucuklari → Satir Gorunum — 🔧 Dusuk

**Musteri:** Kritik stok kartlari (card grid) yerine satir bazli tablo gorunumu istiyor.

**Teknik inceleme:** `stoklar-client.tsx` satir 138-173 — 6'li card grid ile kritik stok gosterimi. Ayni sayfada zaten row-based tablo mevcut (satir 175-272).

**Yapilacak:**
- [X] ✅ Card grid → kompakt satir gorunumu ile degistirildi (her satir: kod, ad, stok, kritik stok, acik, durum badge)
- [X] ✅ Ozet kartlari kaldirilmadi (title + count hala gorunuyor)
- [X] ✅ 6 item siniri kaldirildi, tum kritik stoklar gosteriliyor

---

## 8. Satin Alma

**Musteri Rev3:** "Satin alma siparisi olustururken secilen urunun fiyati gelmiyor. Satin alma 'onaylandi' durumundaysa mal kabul ekraninda gozuksun ve kabul edilebilsin."

### Rev3 Talepleri

#### 8.1 Urun Fiyati Otomatik Gelsin — 🔧 Orta

**Musteri:** "Satin alma siparisi olustururken secilen urunun fiyati gelmiyor. (urunlerde fiyat kayitli)"

**Teknik inceleme:** `satin-alma-form.tsx` icerisinde urun secildiginde fiyat auto-populate yapilmiyor. Manuel giris.

**Yapilacak:**
- [X] ✅ `updateKalem` fonksiyonunda urun secilince `birimFiyat` otomatik dolduruluyor (urun.birimFiyat)
- [X] ✅ Kullanici fiyati degistirebilir (override) — sadece bos/sifir iken otomatik dolar

#### 8.2 Onayli SA Mal Kabulde Gozuksun — 🐛 Orta (Dogrulama Gerekli)

**Musteri:** "Satin alma 'onaylandi' durumundaysa mal kabul ekraninda gozuksun ve kabul edilebilsin."

**Teknik inceleme:** `create-mal-kabul-sheet.tsx` satir 69-71 — filter zaten `onaylandi`, `siparis_verildi`, `kismen_teslim` durumlarini kabul ediyor. Musteri belki farkli bir senaryo yasiyor olabilir.

**Yapilacak:**
- [ ] 🐛 Canli dogrulama: "onayli" durumundaki SA mal kabul sayfasinda gorunuyor mu?
- [ ] 🐛 Gorunmuyorsa kok nedeni belirle (backend filtre mi, frontend filtre mi)
- [ ] 🐛 Gerekirse filtre guncelle

---

## 9. Hareketler

**Musteri Rev3:** "Ekran ilk acildiginda bugun filtrelensin. Filtrelere urun kategorisi ve alt kategorisini ekleyelim."

### Rev3 Talepleri

#### 9.1 Ilk Acilista Bugun Filtresi — 🔧 Dusuk

**Musteri:** "Ekran ilk acildiginda bugun filtrelensin."

**Teknik inceleme:** `hareketler-client.tsx` → `period` state default degeri `'all'` (filtre yok).

**Yapilacak:**
- [X] ✅ `useState('all')` → `useState('today')` olarak degistirildi

#### 9.2 Urun Kategorisi + Alt Kategori Filtresi — 🔧 Orta

**Musteri:** "Filtrelere Urun Kategorisi ve onun bir alt kategorisini de ekleyelim. Kategori=Urun, Alt Kategori=Paspas olanlar listelenebilsin."

**Teknik inceleme:** Su an sadece hareket tipi (`giris`/`cikis`/`duzeltme`) ve kaynak tipi filtreleri var. Kategori/alt kategori filtresi yok.

**Yapilacak:**
- [ ] 🔧 Backend: `repoList` query'sine `kategori` ve `urunGrubu` filtre parametreleri ekle
- [ ] 🔧 Backend: Hareket tablosundan urun tablosuna JOIN ile filtreleme
- [ ] 🔧 Frontend: Cascading dropdown — kategori secilince alt kategoriler filtrelenir
- [ ] 🔧 RTK Query endpoint'ine `kategori` ve `urunGrubu` query parametreleri ekle

---

## 10. Menuler

**Musteri Rev3:** "Ozet ve gorevlere simdilik gerek yok. Kategoriler zaten urun ekraninda var ana menuden kaldiralim. Uretim surecleri ve lojistik stok surekli ekranda kalabilir mi. Sistem ve ayarlar tek bir baslik altinda toplanabilir."

### Rev3 Talepleri

#### 10.1 Gorevler (Tasks/Notifications) Menudan Kaldir — ✅ Tamamlandi

**Musteri:** "Ozet ve gorevlere simdilik gerek yok, versiyon 2'de bakalim onlara."

**Not:** Dashboard (Ozet) kalacak, sadece Gorevler (tasks/notifications) kaldirildi.

- [X] ✅ `sidebar-items.ts` → `gorevler` nav item'i yorum satirina alindi (V2'de tekrar acilacak)
- [X] ✅ Dashboard (Ozet) sidebar'da kalmaya devam ediyor

#### 10.2 Kategoriler Menudan Kaldir — ✅ Tamamlandi

**Musteri:** "Kategoriler zaten urun ekraninda var ana menuden kaldiralim."

- [X] ✅ `sidebar-items.ts` → `kategoriler` nav item'i yoruma alindi

#### 10.3 Uretim Surecleri + Lojistik Stok Sticky — 🔧 Orta

**Musteri:** "En cok kullanacagimiz alan burasi. Uretim surecleri ve Lojistik stok. Bu kisim scroll ile kaydirmadan surekli ekranda kalabilir mi?"

**Teknik inceleme:** Sidebar standard scroll davranisi kullanıyor. Madde 10.1, 10.2, 10.4 ile birlikte item sayisi azalinca scroll gerekliligi ortadan kalkabilir.

**Yapilacak:**
- [ ] 🔧 Diger menü sadeleştirmeleri (10.1, 10.2, 10.4) tamamlandiktan sonra degerlendir
- [ ] 🔧 Hala scroll gerekliyse Grup 2+3 icin `sticky` CSS uygula
- [ ] 🔧 Alternatif: "Genel" grubunu collapse default yaparak alan kazan

#### 10.4 Sistem/Tanimlar Tek Baslik Altinda Topla — 🔧 Dusuk

**Musteri:** "Bu kisim Sistem ve Ayarlar adinda tek bir baslik altinda toplanabilir. En az girecegimiz ekranlar muhtemelen."

**Teknik inceleme:** Su an Grup 1'de uretim tanimlari (Makineler, Kaliplar, Durus Nedenleri) ve calisma planlari (Tatiller, Vardiyalar, Hafta Sonu Planlari) var. Grup 4'te sistem yonetimi (Kullanicilar, Medyalar, Giris Ayarlari, Site Ayarlari, DB, Audit) var.

**Yapilacak:**
- [X] ✅ Grup 1'deki `uretim_tanimlari` ve `calisma_planlari` → Grup 4'e tasindi
- [X] ✅ Grup 4 label → "Sistem & Ayarlar" olarak guncellendi
- [X] ✅ Grup 1 (Genel): Dashboard + Is Ortaklari + Urunler

---

## Rev3 Is Paketi Onceliklendirme

### P0 — Kritik (Is Akisi Bozuk)

| # | Is | Bagimlilik | Tahmini Etki |
|---|----|------------|-------------|
| P0-1 | Siparis duzenleme → UE cache invalidation (3.3) | — | Siparis-UE entegrasyonu |
| P0-2 | Is yuku silme → havuz cache invalidation (4.3) | — | Is yukleri-havuz entegrasyonu |
| P0-3 | Malzeme yeterliligi cift rezervasyon (4.4) | — | Uretim planlama dogrulugu |

### P1 — Yuksek (Hata / Blocker)

| # | Is | Bagimlilik | Tahmini Etki |
|---|----|------------|-------------|
| P1-1 | Urun silme FK hatasi (1.1) | — | Veri yonetimi |
| P1-2 | Musteri silme FK hatasi (2.1) | — | Veri yonetimi |
| P1-3 | Recete bozuk gorunum (1.3) | — | Urun yonetimi |
| P1-4 | Cift tarafli operasyon tekrar (1.5) | — | Urun formu |
| P1-5 | Atanmamis liste tutarsizligi (4.1) | — | UE-Havuz tutarliligi |
| P1-6 | Son is bitis ≠ makine bitis (5.2) | — | Is yukleri dogrulugu |
| P1-7 | Sira degisim tarih hatasi (5.4) | — | Is yukleri planlama |

### P2 — Orta (UX Iyilestirme)

| # | Is | Bagimlilik | Tahmini Etki |
|---|----|------------|-------------|
| P2-1 | Urunler kategori default (1.2) | — | Liste kullanilabilirligi |
| P2-2 | PDF upload destegi (1.7) | — | Urun yonetimi |
| P2-3 | Siparis urun filtre + arama (3.1) | — | Siparis formu |
| P2-4 | UE tamamlananlari toggle (4.2) | — | UE liste UX |
| P2-5 | Montaj ibaresi buyutme (5.5) | — | Is yukleri + Gantt okunabilirligi |
| P2-6 | Gantt satir daralma (6.1) | — | Gantt gorsel |
| P2-7 | Gantt tatil soft renk (6.2) | — | Gantt gorsel |
| P2-8 | Gantt bugun cizgisi (6.4) | — | Gantt kullanilabilirligi |
| P2-9 | Gantt bar sadeleştirme (6.6) | — | Gantt okunabilirligi |
| P2-10 | SA urun fiyat auto-populate (8.1) | — | SA formu |
| P2-11 | Onayli SA mal kabulde (8.2) | — | SA-MK entegrasyonu |
| P2-12 | Hareketler kategori filtresi (9.2) | — | Hareketler filtreleme |
| P2-13 | Menu sticky (10.3) | 10.1, 10.2, 10.4 | Sidebar UX |

### P3 — Dusuk (Kucuk UX)

| # | Is | Not |
|---|----|-----|
| P3-1 | Hedef birim koli default (1.4) | Kucuk UX iyilestirme |
| P3-2 | Renk → Ozellik label (1.6) | Label degisikligi |
| P3-3 | Cari kosu kaldir (2.2) | Form sadeleştirme |
| P3-4 | Gantt haftalik default (6.3) | Tek satir degisiklik |
| P3-5 | Gantt ad ile arama (6.5) | Dogrulama gerekli |
| P3-6 | Kritik stok → satir gorunum (7.1) | Gorsel degisiklik |
| P3-7 | Hareketler bugun default (9.1) | Tek satir degisiklik |
| P3-8 | Kategoriler menudan kaldir (10.2) | Tek satir degisiklik |
| P3-9 | Sistem/Tanimlar birlestir (10.4) | Menu yeniden duzenleme |

---

## Onerilen Uygulama Sirasi

```
Faz 1: Kritik Cache/Veri Buglar (P0)
  ├─ P0-1: Siparis guncelleme → UE cache invalidation
  ├─ P0-2: Is yuku silme → havuz cache invalidation
  └─ P0-3: Malzeme cift rezervasyon inceleme + fix

Faz 2: Yuksek Oncelik Buglar (P1)
  ├─ P1-1, P1-2: FK bagimlilk kontrolu (urun + musteri silme)
  ├─ P1-4: Cift tarafli operasyon state fix
  ├─ P1-3: Recete gorunum bozuklugu (canli inceleme)
  ├─ P1-5: Atanmamis liste tutarsizligi
  └─ P1-6, P1-7: Is yukleri tarih hesaplama/guncelleme

Faz 3: UX Iyilestirmeler (P2)
  ├─ P2-3, P2-10: Combobox + auto-populate (siparis + SA)
  ├─ P2-4: UE tamamlananlari toggle
  ├─ P2-6, P2-7, P2-8, P2-9: Gantt gorsel iyilestirmeler (toplu)
  ├─ P2-5: Montaj ibaresi (Is Yukleri + Gantt)
  ├─ P2-12: Hareketler kategori filtresi
  └─ P2-1, P2-2, P2-11, P2-13: Diger orta oncelik

Faz 4: Kucuk UX (P3)
  └─ P3-1 ~ P3-9 (tek seferde toplu)
```

---

## Dogrulama Gerektiren Maddeler

| # | Madde | Neden |
|---|-------|-------|
| 1.3 | Recete bozuk gorunum | Hangi urun? Canli DB'de veri incelemesi gerekli |
| 1.5 | Cift tarafli operasyon | Rev2'de duzeltilmisti, tekrar mi olustu yoksa edge case mi? |
| 3.2 | Anlik hesaplama | Rev2'de calisiyordu, musteri eski versiyon test etmis olabilir |
| 5.2 | Son is bitis ≠ makine bitis | Hangi makine, hangi tarih? Canli veri gerekli |
| 6.5 | UE adiyla arama | Mevcut search zaten urun adi iceriyor, dogrulama yeterli |
| 8.2 | Onayli SA mal kabulde | Kod zaten `onaylandi` filtresini iceriyor — canli test gerekli |

---

## Sonuc

Rev3'un **en kritik 3 maddesi** cache invalidation eksikliklerinden kaynaklanmaktadir:
1. Siparis duzenleme sonrasi uretim emirlerinin guncellenmemesi
2. Is yukunden silinen kayitlarin makine havuzuna geri dusmemesi
3. Malzeme yeterliligi hesaplamasinda cift rezervasyon

Bu uc madde veri tutarliligi ile ilgilidir ve oncelikli cozulmelidir. Ikinci grup (P1) kullanici deneyimini dogrudan etkileyen FK silme hatalari ve operasyon state sorunlaridir.

Gantt iyilestirmeleri (6.1-6.6) gorsel niteliklidir ve birbirine bagimli olduklari icin tek fazda toplu uygulanmasi onerilir. Menu sadeleştirmeleri (10.1-10.4) en dusuk onceliklidir ve V1 teslim oncesi son fazda yapilabilir.
