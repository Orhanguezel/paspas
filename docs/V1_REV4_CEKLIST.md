# Paspas ERP — V1 Rev4 Ceklist

> **Tarih:** 2026-03-31
> **Kaynak:** `Rev4_2_300326.docx`
> **Amac:** Rev4 maddelerinin yapilacak isler listesi, oncelik ve durum takibi.
> **Isaret:** [ ] Yapilacak | [x] Tamamlandi | [?] Belirsiz/Tartisma Gerekli | [~] Kismi

---

## 1. URUNLER

| #    | Madde                                                                                                                                          | Oncelik | Durum |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----- |
| UR-1 | Urun gorsellerine PDF ekleme destegi                                                                                                           | Orta    | [x]   |
| UR-2 | Birim alaninda kullanici duzenleme (ekleme/cikarma), Hedef Birim'de ayni sekilde. Urun kategorisi secildiyse hedef birim "Koli" default gelsin | Orta    | [x]   |
| UR-3 | Aciklama alanini birim fiyat + KDV altina tasi, veri giris alanini genislet                                                                    | Dusuk   | [x]   |

**Notlar:**

- UR-1: PDF upload zaten AdminImageUploadField'da destekleniyor (Rev3.1'de eklendi). Musteri "baska nereye ekleriz" diyor — muhtemelen urun gorselleri listesinde PDF onizleme/indirme UX'i eksik. önizlemede olsun. acip bakabilelim.
- UR-2: `tanimlar` modulundeki birim yonetimi ile entegre edilmeli.

---

## 2. SIPARISLER (Buyuk Revizyon)

### 2.1 Mevcut Siparis Ekrani Iyilestirmeleri

| #    | Madde                                                                               | Oncelik | Durum |
| ---- | ----------------------------------------------------------------------------------- | ------- | ----- |
| SP-1 | Musteri secerken arama kutusu                                                       | Yuksek  | [x]   |
| SP-2 | Siparise ozel ekstra indirim tanimlama (musteri indirimine ek)                      | Yuksek  | [x]   |
| SP-3 | Cift KDV sorunu: Satir bazinda KDV kaldirilsin, sadece dip toplamda KDV hesaplansin | Kritik  | [x]   |
| SP-4 | Siparisler listesine (ana ekran) toplam fiyat sutunu ekle                           | Orta    | [x]   |

### 2.2 Siparis Ekrani Ikiye Bolunuyor (BUYUK DEGISIKLIK)

| #     | Madde                                                                                                                      | Oncelik | Durum |
| ----- | -------------------------------------------------------------------------------------------------------------------------- | ------- | ----- |
| SP-5a | "Siparis Girisleri" sekmesi: Sadece veri girisi, duzeltme, goruntuleme. Mevcut ekrandan uretim/sevk takip alanlarini cikar | Kritik  | [x]   |
| SP-5b | "Siparis Islemleri" sekmesi: Musteri/urun/duz liste bazinda goruntuleme                                                    | Kritik  | [x]   |
| SP-5c | Siparis Islemleri'nden tek tek veya toplu uretime aktarma                                                                  | Kritik  | [x]   |
| SP-5d | Toplu aktarmada ayni urun birlestirme mantigi (birlestir/birlestirme secenegi)                                             | Yuksek  | [x]   |

### 2.3 Uretim Durumu State Machine (BUYUK DEGISIKLIK)

Siparis kalemlerinin asagidaki durum gecislerini desteklemesi gerekiyor:

```
Beklemede → Uretime Aktarildi → Makineye Atandi → Uretiliyor ⇄ Duraklatildi → Uretim Tamamlandi
```

| #     | Madde                                                                                                                                                                                                  | Oncelik | Durum |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ----- |
| SP-5e | Durum:**Beklemede** — Hicbir islem yapilmamis. Siparis silinebilir/duzenlenebilir/kapatilabilir/iptal edilebilir. Uretim/sevk/planlanan bitis alanlari bos. "Uretim Emri Olustur" aktif         | Kritik  | [x]   |
| SP-5f | Durum:**Uretime Aktarildi** — UE olusturuldu. Siparis silinemez/duzenlenemez/iptal-kapama yapilamaz. Onceki duruma donmesi icin UE silinmeli. Uretim/sevk/planlanan bitis bos. UE olustur pasif | Kritik  | [x]   |
| SP-5g | Durum:**Makineye Atandi** — UE ekranindan makine atamasi yapildi. Uretim/sevk bos, planlanan bitis gorunur. Silinemez/duzenlenemez                                                              | Kritik  | [x]   |
| SP-5h | Durum:**Uretiliyor** — Operator uretimi baslatti (cift taraflida bir taraf bile yeterli). Uretim+sevk miktarlari gorunmeye baslar. Planlanan bitis gorunur                                      | Kritik  | [x]   |
| SP-5i | Durum:**Duraklatildi** — Operator duraklatti. Uretim/sevk/planlanan bitis gorunur. Planlanan bitisin altina gecikme suresi yazilsin (ornek: "+5 Saat gecikme")                                  | Yuksek  | [x]   |
| SP-5j | Durum:**Uretim Tamamlandi** — Operator bitirdi. Uretim/sevk bilgileri gorunur. Siparis kapatilabilir ama silinemez/degistirilemez                                                               | Kritik  | [x]   |

### 2.4 Cift Tarafli Uretim Kurallari

| #     | Madde                                                                         | Oncelik | Durum |
| ----- | ----------------------------------------------------------------------------- | ------- | ----- |
| SP-5k | Cift tarafli: Montaj yapilan taraf tamamlandiginda uretim tamamlanmis sayilir | Kritik  | [x]   |
| SP-5l | Cift tarafli: Planlanan bitis = ikinci tarafin (montaj) bitis tarihi          | Kritik  | [x]   |
| SP-5m | Tek tarafli: Makinedeki uretim bitince uretim tamamlanmis                     | Kritik  | [x]   |

### 2.5 Tersine Guncelleme (Durum Geri Alma)

| #    | Madde                                                                                                                                                                         | Oncelik | Durum |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----- |
| SP-6 | Islem geri alindiginda durum bir basamak geri gelmeli. Ornek: UE silinirse "Uretime Aktarildi" → "Beklemede". Makineden cikarilirsa "Makineye Atandi" → "Uretime Aktarildi" | Kritik  | [x]   |

### 2.6 Diger Siparis Maddeleri

| #    | Madde                                                                                                                   | Oncelik | Durum |
| ---- | ----------------------------------------------------------------------------------------------------------------------- | ------- | ----- |
| SP-7 | Siparis Islemleri'nde musteri bazinda termin takibi: En son biten urunun planlanan bitis tarihi ust kisimda gosterilsin | Yuksek  | [x]   |
| SP-8 | Kapali/tamami sevk edilen/iptal siparisler varsayilan gizlensin, "goster" secenegi olsun                                | Orta    | [x]   |
| SP-9 | Siparis detay ekranindan uretim/sevk takip alanlarini cikar (sadece veri girisi kalsun)                                 | Orta    | [x]   |

---

## 3. URETIM EMIRLERI (Buyuk Revizyon)

| #     | Madde                                                                                                                                                                                                                                                                | Oncelik | Durum |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----- |
| UE-1a | **Makine Havuzu ekranini kaldir.** Uretim Emirleri ekrani tek ekran olacak                                                                                                                                                                                     | Kritik  | [x]   |
| UE-1b | Ust ozet kutularini kaldir                                                                                                                                                                                                                                           | Dusuk   | [x]   |
| UE-1c | Tablo: Sil/Duzelt/Goruntule + yeni "Malzeme Yeterlilik" ve "Recete Detay" butonlari                                                                                                                                                                                  | Yuksek  | [x]   |
| UE-1d | Tablo: Takvim sutunu →**Makine** sutunu. Atanmamissa "Atanmamis" yazsin, atanmissa makine adi                                                                                                                                                                 | Yuksek  | [x]   |
| UE-1e | Tablo: Ilerleme altina uretilen miktar yazdır                                                                                                                                                                                                                       | Orta    | [x]   |
| UE-1f | Tablo: Musteri isimleri birden fazlaysa alt alta + siparis miktarlari                                                                                                                                                                                                | Orta    | [x]   |
| UE-1g | Tablo: Planlanan bitis = cift taraflida ikinci uretim tarihi                                                                                                                                                                                                         | Yuksek  | [x]   |
| UE-1h | Makineye atanmis UE: Sil/Duzelt pasif. "Atamayi Geri Al" butonu ekle                                                                                                                                                                                                 | Yuksek  | [x]   |
| UE-1i | **Montaj tarafi secimi:** Kullanici montaj tarafini kendisi secer. "Ayni makine ise sag=montaj" kurali iptal. Operasyon atama ekraninda montaj checkbox'i kullaniciya sunulacak | Yuksek  | [x]   |
| UE-2  | Makine atama ekraninda: Istenen tarih/saatte baslat opsiyonu (gizli/istisnai). Normalde son uretimin pesine eklesin                                                                                                                                                  | Orta    | [x]   |
| UE-3  | "Yeni Uretim Emri" → Sadece urun adi + miktar yeterli. Adi "Stoga Uretim" olarak degistir                                                                                                                                                                           | Orta    | [x]   |
| UE-4  | Malzeme yeterlilik ekrani: Goruntule → ayri "Malzeme Yeterlilik" butonundan eris. Gorseller buyutulebilsin                                                                                                                                                          | Yuksek  | [x]   |
| UE-5  | **Malzeme yeterlilik — rezerve hesaplama:** Real-time kumulatif. Mevcut uretim icin gerekli miktari rezerve et. Serbest = Stok - Toplam Rezerve. Birden fazla UE ayni malzemeyi kullaniyorsa planlanan bitis tarihine gore sirali hesapla | Kritik  | [x]   |
| UE-6  | Yeni buton → Recete detay ekrani (operator icin, salt okunur): Emir no, urun, gorseller (sag/sol taraf), makine, kalip, cevrim suresi, montaj bilgisi, planlanan uretim tarihleri, aciklama, malzeme listesi (gorsel+ad+miktar+birim)                               | Yuksek  | [x]   |

---

## 4. MAKINE IS YUKLERI

| #     | Madde                                                                             | Oncelik | Durum |
| ----- | --------------------------------------------------------------------------------- | ------- | ----- |
| MY-1a | Montaj secilen taraf goruntulenmeli (tek taraflilarda montaj yazmasina gerek yok) | Orta    | [x]   |
| MY-1b | "Bekliyor" yazisini kaldir                                                        | Dusuk   | [x]   |
| MY-1c | Font boyutlari ve bos alan duzenlenmesi                                           | Dusuk   | [x]   |
| MY-1d | Silme tusunu kaldir (atama geri alma UE ekranindan yapilacak)                     | Orta    | [x]   |

---

## 5. OPERATOR EKRANI (Buyuk Revizyon)

| #     | Madde                                                                                                                                                                               | Oncelik | Durum |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----- |
| OP-1a | Yeni operator ekrani tasarimi: Baslat → (Duraklat + Bitir aktif) → Duraklat → (Devam Et + Bitir aktif) → Devam Et → (Duraklat + Bitir aktif)                                   | Kritik  | [x]   |
| OP-1b | Bitir: Uretilen miktari sor. Montaj ise "... Takim", montaj degilse "... Adet"                                                                                                      | Kritik  | [x]   |
| OP-1c | Sadece Takim olarak girilen (montaj tarafi) stok arttirir + recete malzemelerini azaltir. Adet girisleri sadece kayit icin, stok etkisi yok                                         | Kritik  | [x]   |
| OP-1d | Bitir sonrasi tum tuslar pasif                                                                                                                                                      | Orta    | [x]   |
| OP-1e | Sadece en ustteki uretim icin butonlar aktif, altindakiler sadece listelenir                                                                                                        | Yuksek  | [x]   |
| OP-2  | Uretim bitisinde: Bitir butonundaki tarih/saat → sonraki uretimin baslangic zamani olarak kaydedilsin. Cascade: Sira degisen tum uretimlerin planlanan baslangic/bitis guncellenir | Kritik  | [x]   |
| OP-3a | Vardiya Baslat/Bitir butonlari: Makine yaninda, uretimden bagimsiz                                                                                                                  | Yuksek  | [x]   |
| OP-3b | Vardiya butonlari saat kisitlamasi: Vardiya saatlerinin ±30dk araliginda aktif                                                                                                     | Yuksek  | [x]   |
| OP-3c | Vardiya bitmeden sonraki baslatılamaz                                                                                                                                              | Yuksek  | [x]   |
| OP-3d | Vardiya bitisinde uretilen miktar sor: Montaj/Tek tarafli → Takim (stok etkisi var), Montaj olmayan → Adet (stok etkisi yok)                                                      | Kritik  | [x]   |
| OP-3e | Sistem gunduz/gece vardiyasini otomatik belirlesin, hangi vardiyada ne kadar uretildigini kaydetsin                                                                                 | Yuksek  | [x]   |
| OP-3f | Duraklama sonrasi "Devam Et" → miktar sormasin                                                                                                                                     | Orta    | [x]   |
| OP-3g | **BUG:** Duraklama + miktar girisi diger ekranlara (UE, siparis) yansimiyor. Uretilen adet hala 0 gorunuyor                                                                   | Kritik  | [x]   |

---

## 6. GANTT PLANI

| #    | Madde                                                                                                    | Oncelik | Durum |
| ---- | -------------------------------------------------------------------------------------------------------- | ------- | ----- |
| GN-1 | Ust ozet kutularini azalt. En uzun is yukune gore "X gunluk is" gostersin                                | Orta    | [x]   |
| GN-2 | Renk aciklama legendini kaldir                                                                           | Dusuk   | [x]   |
| GN-3 | Zoom: Gunluk/3 gunluk gorunum veya +/- yakinlastirma kontrolu                                            | Yuksek  | [x]   |
| GN-4 | Tatil/hafta sonu: Tum gun renklendirme yerine, sadece uretim bari uzerinde goster. Yazi okunabilir olsun | Yuksek  | [x]   |
| GN-5 | Duraklama gosterimi: Operatorun duraklattigi an bir cizgi, simdi cizgisiyle arasi renkli alan            | Orta    | [x]   |

---

## 7. DASHBOARD / OZET (Tamamen Yeniden)

| #        | Madde                                                                                                                               | Oncelik | Durum |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------- | ----- |
| OZ-1     | Gerceklesen uretim adetleri tablosu: Tarih/Urun/Miktar/Birim. Bugün/Hafta/Ay/Tümü filtre, max 10 kayit, en yeni uste             | Yuksek  | [x]   |
| OZ-2     | Planlanan + gerceklesen sevkiyat tablosu: Tarih/Musteri/Urun/Miktar/Durum. Sevk bekleyenler de gorunsun                             | Yuksek  | [x]   |
| OZ-2-BUG | Hareketlerde sevkiyat miktari +100 gozukuyor, -100 olmali                                                                           | Kritik  | [x]   |
| OZ-3     | Planlanan + gerceklesen mal kabul tablosu: Tarih/Tedarikci/Urun/Miktar/Durum                                                        | Yuksek  | [x]   |
| OZ-4     | Depo stok (sadece "paspas" kategorisi): Urun/Miktar, en yuksek uste, bar grafik                                                     | Orta    | [x]   |
| OZ-5     | Uretim vs Sevkiyat karsilastirma bar grafigi: Haftalik/Aylik/Tumu. Yatay=zaman, dikey=miktar (max 5000), iki renk (uretim+sevkiyat) | Yuksek  | [x]   |
| OZ-6     | Makine durumlari: Makine adi / Is sayisi / Son is bitis tarih-saati                                                                 | Orta    | [x]   |
| OZ-7     | Mevcut dashboard'daki diger bilgileri kaldir                                                                                        | Dusuk   | [x]   |



---

## 8. MALZEME STOKLARI

| #    | Madde                                                                                                                                        | Oncelik | Durum |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----- |
| MS-1 | Kritik stok girilmemis malzeme "yetersiz" gorunmesin                                                                                         | Yuksek  | [x]   |
| MS-2 | Rezerve hesaplama: UE-5 ile tutarli, uretim emirleri ve receteye bagli hesaplama. Stok – Rezerve = Serbest                                  | Kritik  | [x]   |
| MS-3 | Yeni sutun: "Uretim Eksik Miktar" = Uretim Ihtiyac - min(Stok, Ihtiyac)                                                                      | Yuksek  | [x]   |
| MS-4 | Kritik stok + eksik alanlarini ana tablodan cikar, detay ekranina tasi. Detayda "Kritik Stok Eksigi" kutusu ekle (Kritik Stok - Mevcut Stok) | Orta    | [x]   |
| MS-5 | Stok duzeltme: Kullanici gercek miktari girsin, sistem farki hesaplayip +/- olarak islesin                                                   | Yuksek  | [x]   |
| MS-6 | Stokta olan/olmayan filtresi (deger > 0 olanlar)                                                                                             | Orta    | [x]   |

---

## 9. SATIN ALMA

| #    | Madde                                                                                             | Oncelik | Durum |
| ---- | ------------------------------------------------------------------------------------------------- | ------- | ----- |
| SA-1 | Siparis girisinde KDV ekleme: Dip toplam + KDV + KDV dahil toplam                                 | Orta    | [x]   |
| SA-2 | "Teslim Al" → "Kabul Emri" butonuna degistir. Kabul emri verilenler mal kabul ekraninda gozuksun | Yuksek  | [x]   |

---

## 10. MAL KABUL (Yeni Ekran Mantigi)

| #    | Madde                                                                                                                                                                       | Oncelik | Durum |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----- |
| MK-1 | Kirmizi alanlari cikar. Operator ekrani mantigi: Satin almadan "Kabul Emri" olusturulanlar gelsin. Ilk acilista sadece kabulu yapilacaklar, isterse yapilmislari listelesin | Yuksek  | [x]   |
| MK-2 | Yan tarafa "Teslim Al" butonu: Sevkiyattaki "fiziksel sevket" mantigi, miktar girisi                                                                                        | Yuksek  | [x]   |
| MK-3 | Parti numarasini cikar, yerine bilgi duzenleme alani                                                                                                                        | Orta    | [x]   |
| MK-4 | "Yeni Mal Kabul" butonu: Siparissiz mal kabuller icin. Siparis secimi yerine tum malzemeler icinden arama + secim                                                           | Yuksek  | [x]   |

---

## 11. SITE AYARLARI

| #    | Madde                                                                           | Oncelik | Durum |
| ---- | ------------------------------------------------------------------------------- | ------- | ----- |
| AY-1 | Kullaniciya birden fazla rol tanimlayabilme (ornek: hem sevkiyat hem mal kabul) | Yuksek  | [x]   |

---

## Oncelik Ozeti

| Oncelik          | Sayi | Aciklama                                                                                                                                       |
| ---------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kritik** | ~20  | Siparis state machine, tersine guncelleme, cift tarafli uretim kurallari, operator uretim bitisi, cascade zamanlama, rezerve hesaplama, buglar |
| **Yuksek** | ~25  | Siparis islemleri, UE ekran yenileme, operator vardiya, gantt zoom, dashboard widgetlari, mal kabul yeni akis                                  |
| **Orta**   | ~15  | UI iyilestirmeleri, filtreler, detay ekrani tasimalari                                                                                         |
| **Dusuk**  | ~5   | Legend kaldirma, font ayarlari, ozet kutu kaldirma                                                                                             |

**Toplam madde sayisi: ~65**

---

## KARARLAR (Netlesti — 2026-03-31)

### UE-1i — Montaj Tarafi Secimi — KARAR: Kullanici secer
- "Ayni makine ise sag=montaj" otomatik kurali **iptal edildi**.
- Kullanici operasyon atama ekraninda montaj tarafini kendisi sececek.
- Backend: `uretim_emri_operasyonlari.montaj` flag'i makine atama sirasinda kullanici tarafindan set edilecek.

### UE-5 — Rezerve Hesaplama — KARAR: Real-time, kumulatif
- Hesaplama real-time yapilacak (malzeme yeterlilik ekrani acildiginda).
- Birden fazla UE ayni malzemeyi kullaniyorsa, planlanan bitis tarihine gore sirali kumulatif hesap.
- Makine siralamasi degistiginde frontend yeniden fetch edecek.

### OP-3 — Vardiya Sistemi — KARAR: Tanimlardan gelecek, UE bitisinde miktar girilecek
- Vardiya saatleri `tanimlar.vardiyalar` tablosundan gelecek (mevcut: Gunduz 07:30-19:30, Gece 19:30-07:30).
- ±30dk penceresi bu saatlerden hesaplanacak.
- Vardiya icinde UE biterse miktar girilecek (her UE bitisi icin ayri).
- Vardiya bitisinde de o vardiyada uretilen miktar sorulacak.
- Saat araliginda islem yapilmazsa admin panelden manuel vardiya acma/kapama.

### OZ-2-BUG — Sevkiyat Hareket Yonu — KARAR: -100 olacak
- Sevkiyat hareketlerinde miktar negatif (`-100`) kaydedilecek.
- Backend `hareketler` tablosunda sevkiyat kayitlarinda `miktar` alani negatif olarak yazilacak.

---

### Genel Mimari Karar

Siparis ekraninin ikiye bolunmesi (SP-5) ve durum state machine'i (SP-5e..SP-5m) projenin en buyuk yapisal degisikligi. Bu, mevcut `satis_siparisleri` modulunun buyuk olcude refactor edilmesini gerektiriyor:

- Backend: Yeni `siparis_islemleri` endpointleri veya mevcut route'a filtre/view parametreleri
- Frontend: Yeni sekme yapisi, yeni liste gorunumleri (musteri/urun bazli), bulk islem API'leri
- Durum yonetimi: `siparis_kalemleri` tablosuna `uretim_durumu` enum alani (veya mevcut alan guncelleme)

**Onerilen implementasyon sirasi:**

1. Once state machine + tersine guncelleme (SP-5e..SP-6) — temel
2. Siparis ekrani bolunmesi (SP-5a..SP-5d)
3. Operator ekrani (OP-1..OP-3) — state machine'e bagimli
4. UE ekrani yenileme (UE-1..UE-6) — makine havuzu kaldirma dahil
5. Dashboard (OZ-1..OZ-6) — diger moduller tamamlandiktan sonra
6. Gantt, stok, satin alma, mal kabul — paralel yapilabilir
