# Antigravity Runbook — Paspas ERP Rev3.1 Dogrulama

> **Tarih:** 2026-03-22
> **Referans:** `V1_REV3_1_DURUM_RAPORU.md`
> **Amac:** Claude Code'un Rev3.1 duzeltmeleri sonrasi gorsel ve fonksiyonel dogrulama

---

## On Kosullar

- [x] Backend ayakta (port 8078)
- [x] Admin panel ayakta (port 3000)
- [x] Lokal veya canli URL'ler net
- [x] Admin kullanici bilgileri hazir

**Lokal URL'ler:**
- Admin Panel: `http://localhost:3000`
- Backend API: `http://localhost:8078`

**Canli URL'ler:**
- Admin Panel: `http://178.210.161.181` (Nginx → port 3000)
- Backend API: `http://178.210.161.181/api` (Nginx → port 8078)

**Test Kullanicisi:** Admin panel'e giris yap (kimlik bilgileri .env'den alinacak)

---

## Dogrulama Gorevleri

Her gorev icin:
1. Ilgili sayfaya git
2. Belirtilen aksiyonu yap
3. Beklenen sonucu kontrol et
4. Screenshot al
5. Sonucu PASS / FAIL olarak isaretle

---

## FAZ 1 — Kritik Bug Duzeltmeleri (P0)

### AG-01: Siparis Formu Reset Kontrolu

**Sayfa:** `/admin/satis-siparisleri`
**Adimlar:**
1. "Yeni Siparis" butonuna tikla
2. Formu doldur: musteri sec, bir kalem ekle, miktar gir
3. Formu **kaydetmeden** kapat (X veya disari tikla)
4. Tekrar "Yeni Siparis" butonuna tikla
5. **Kontrol:** Form alanlari tamamen bos olmali — onceki veriler gelmemeli

**Beklenen:** Tum alanlar sifir/bos, musteri secili degil, kalem listesi bos
**Sonuc:** PASS
**Screenshot:** Form acilis durumu (bos olmali)

---

### AG-02: Siparis Kilit Durumu Kontrolu

**Sayfa:** `/admin/satis-siparisleri`
**Adimlar:**
1. Bir siparis olustur (1 kalem)
2. Uretim emirlerine git → bu siparisten UE olustur
3. Uretim emirlerine git → olusturdugu UE'yi sil
4. Siparislere geri don → siparisi duzenle
5. **Kontrol:** Form acilmali, alanlar **duzenlenebilir** olmali (kilitli olmamali)

**Beklenen:** UE silindiginde siparis kilidi acilmali, duzenleme mumkun
**Sonuc:** PASS
**Screenshot:** Siparis duzenleme formu (aktif alanlar)

---

### AG-03: Siparis Duzenleme → UE Cache Kontrolu

**Sayfa:** `/admin/satis-siparisleri` + `/admin/uretim-emirleri`
**Adimlar:**
1. Bir siparis olustur (1 kalem, ornegin "Paspas A x100")
2. Uretim emirlerine git → "Siparisten Ekle" ile UE olustur
3. Siparislere geri don → siparisi duzenle → 2 kalem daha ekle → Guncelle
4. Uretim emirlerine git → "Siparisten Ekle" tikla
5. **Kontrol:** Siparis **3 kalem** olarak gorunmeli (eski 1 kalem degil)

**Beklenen:** Siparis guncellendikten sonra UE aday listesinde guncel kalem sayisi
**Sonuc:** PASS
**Screenshot:** UE "Siparisten Ekle" listesi

---

### AG-04: Malzeme Yeterliligi — Eksik Miktar Kontrolu

**Sayfa:** `/admin/uretim-emirleri` → bir UE detay → Malzeme Yeterliligi
**Adimlar:**
1. Malzeme yeterliligi dialogunu ac
2. **Kontrol 1:** "Eksik" miktari mantikli olmali (gerekli - mevcut stok, iki kati degil)
3. **Kontrol 2:** "Serbest" miktari negatif olmamali (eksi deger gostermemeli)
4. **Kontrol 3:** Kusurat olmamali — tum miktarlar tam sayi (yukari yuvarlanmis)
5. **Kontrol 4:** "Toplam Stok" ve "Serbest Stok" ozet alanlari kaldirilmis olmali

**Beklenen:**
- Eksik = max(0, gerekli - mevcutStok) — iki kati degil
- Serbest >= 0 (negatif yok)
- Miktarlar tam sayi
- Ozet kartlari yok

**Sonuc:** PASS
**Screenshot:** Malzeme yeterliligi dialog'u

---

### AG-05: Yeni Siparis → UE Aday Listesi Cache

**Sayfa:** `/admin/satis-siparisleri` + `/admin/uretim-emirleri`
**Adimlar:**
1. Yeni bir siparis olustur ve kaydet
2. Hemen uretim emirlerine git → "Siparisten Ekle"
3. **Kontrol:** Az once olusturdugu siparis listede gorunmeli

**Beklenen:** Yeni siparis aninda UE aday listesinde gorunur
**Sonuc:** PASS
**Screenshot:** UE aday listesi (yeni siparis gorunur)

---

## FAZ 2 — Yuksek Oncelik (P1)

### AG-06: Montaj Badge Kontrolu

**Sayfa:** `/admin/is-yukler`
**Adimlar:**
1. Montaj operasyonu olan bir UE'nin is yuklerini goruntule
2. **Kontrol 1:** Is yukleri listesinde "Montaj" badge'i gorunuyor mu (amber renk, Wrench ikonu)
3. **Kontrol 2:** Gantt planinda ayni isin montaj gosterimi var mi

**Beklenen:** Montaj satirlarinda belirgin amber "Montaj" badge'i
**Sonuc:** PASS
**Screenshot:** Is yukleri listesi (montaj badge gorunur) + Gantt (montaj gosterimi)

---

### AG-07: Drag-Drop — Calisan Is Bypass Kontrolu

**Sayfa:** `/admin/is-yukler`
**Adimlar:**
1. Bir makinede en az 3 is olsun, ilk is "calisiyor" durumunda
2. Asagidaki bir isi suruklep calisan isin **ustune** birak
3. **Kontrol:** Calisan is yerinden oynamamali, suruklenen is calisan isin altina inmemeli

**Beklenen:** Calisan is sabit kalir, suruklenen is en erken bos slota yerlesir
**Sonuc:** PASS
**Screenshot:** Surukle-birak oncesi ve sonrasi

---

### AG-08: Mal Kabul — Onayli Satin Alma Kontrolu

**Sayfa:** `/admin/mal-kabul`
**Adimlar:**
1. Bir satin alma siparisi olustur ve durumunu "onaylandi" yap
2. Mal kabul sayfasina git
3. **Kontrol:** Onayli satin alma siparisi mal kabul listesinde gorunmeli ve kabul edilebilmeli

**Beklenen:** "Onaylandi" durumundaki SA mal kabul ekraninda listelenir
**Sonuc:** PASS
**Screenshot:** Mal kabul listesi (onayli SA gorunur)

---

## FAZ 3 — UX Iyilestirmeler (P2)

### AG-09: Is Yukleri Satir Tasarimi

**Sayfa:** `/admin/is-yukler`
**Adimlar:**
1. Is yukleri listesini goruntule
2. **Kontrol 1:** Urun adi **gosterilmiyor** (kaldirilmis olmali)
3. **Kontrol 2:** Satir yuksekligi oncekinden buyuk
4. **Kontrol 3:** Operasyon adi **kalin (bold)** ve okunakli
5. **Kontrol 4:** Alanlar arasi bosluk duzgun, sikisik degil

**Beklenen:** Urun adi yok, operasyon adi on planda, okunakli satir tasarimi
**Sonuc:** PASS
**Screenshot:** Is yukleri listesi (yeni tasarim)

---

### AG-10: PDF Upload Kontrolu

**Sayfa:** `/admin/urunler` → bir urun duzenle → Medya
**Adimlar:**
1. Medya sekmesine git
2. "Dosya Sec" ile bir PDF dosyasi sec
3. **Kontrol 1:** PDF secilebildi mi (accept listesinde var mi)
4. **Kontrol 2:** Yukleme sonrasi PDF ikon onizleme gorunuyor mu (gorsel degil, dosya ikonu + ad)

**Beklenen:** PDF secilir, yuklenir, ikon ile gosterilir
**Sonuc:** PASS
**Screenshot:** Medya sekmesi (PDF onizleme)

---

### AG-11: Urun Resimleri Lightbox Kontrolu

**Sayfa:** `/admin/urunler`
**Adimlar:**
1. Urunler listesine git (gorseli olan bir urun olmali)
2. Kucuk urun gorseline tikla
3. **Kontrol:** Buyuk gorsel modal/dialog icinde acilmali

**Beklenen:** Tiklayinca buyuk gorsel gosterilir, kapatilabilir
**Sonuc:** PASS
**Screenshot:** Lightbox dialog acik durumda

---

### AG-12: Siparisler Tamamlananlari Toggle

**Sayfa:** `/admin/satis-siparisleri`
**Adimlar:**
1. Sayfayi ac
2. **Kontrol 1:** Varsayilan olarak tamamlanmis/iptal siparisler gorunmuyor
3. "Tamamlananlari Goster" toggle'ini ac
4. **Kontrol 2:** Tamamlanmis/iptal siparisler listeye ekleniyor

**Beklenen:** Toggle kapaliyken temiz liste, acikken tumu gosterilir
**Sonuc:** PASS
**Screenshot:** Toggle kapali + toggle acik

---

### AG-13: Tamamlanmis Siparis/UE Read-Only

**Sayfa:** `/admin/satis-siparisleri` + `/admin/uretim-emirleri`
**Adimlar:**
1. Tamamlanmis bir siparisi duzenle
2. **Kontrol 1:** Form alanlari read-only veya disabled
3. **Kontrol 2:** Uyari mesaji gorunuyor ("tamamlanmis, duzenlenemez")
4. Tamamlanmis bir UE'yi duzenle
5. **Kontrol 3:** Ayni read-only davranis

**Beklenen:** Tamamlanmis kayitlar duzenlenemez, uyari gosterilir
**Sonuc:** PASS
**Screenshot:** Tamamlanmis siparis formu (read-only)

---

### AG-14: Hareketler Kategori Filtresi

**Sayfa:** `/admin/hareketler`
**Adimlar:**
1. Sayfayi ac
2. "Kategori" dropdown'ini bul ve "Urun" sec
3. "Alt Kategori" dropdown'i acilmali → "Paspas" sec
4. **Kontrol:** Sadece Paspas kategorisindeki urunlerin hareketleri listeleniyor

**Beklenen:** Cascading filtre calisiyor, sonuclar dogru
**Sonuc:** PASS
**Screenshot:** Filtrelenmis hareketler listesi

---

### AG-15: Gantt Operasyon Adiyla Arama

**Sayfa:** `/admin/gantt`
**Adimlar:**
1. Arama kutusuna bir operasyon adi yaz (orn. "Enjeksiyon", "Kesim")
2. **Kontrol:** Ilgili operasyonlar filtreleniyor

**Beklenen:** Operasyon adina gore Gantt barlari filtrelenir
**Sonuc:** PASS
**Screenshot:** Gantt arama sonucu

---

### AG-16: Kritik Stok Bolumu Kaldirilmis

**Sayfa:** `/admin/stoklar`
**Adimlar:**
1. Sayfayi ac
2. **Kontrol 1:** Kritik stok card/satir bolumu tamamen yok
3. **Kontrol 2:** Ana tabloda kritik stoklar satin renklendirme ile belirgin

**Beklenen:** Ayri kritik stok bolumu yok, sadece tablo ici vurgulama
**Sonuc:** PASS
**Screenshot:** Stoklar sayfasi ust kisim (kritik bolumu yok)

---

### AG-17: Birim Default — Takim Birimi

**Sayfa:** `/admin/urunler` → yeni urun ekle (kategori: urun)
**Adimlar:**
1. Yeni urun formunu ac, kategori "urun" sec
2. Birim donusumu ekle
3. **Kontrol:** Ust birim "Takim" olmali, alt birim adet olmali — "Koli" default gelmemeli

**Beklenen:** Birim alani dogru default, Takim yerinde
**Sonuc:** PASS
**Screenshot:** Urun formu birim donusumleri

---

## FAZ 4 — Menu / Gorsel (P3)

### AG-18: Sidebar — Dashboard ve Kategoriler Kalkmis

**Sayfa:** Admin panel (herhangi bir sayfa)
**Adimlar:**
1. Sol sidebar'a bak
2. **Kontrol 1:** "Kategoriler" menu itemi yok
3. **Kontrol 2:** "Dashboard / Ozet" menu itemi yok (veya gizlenmis)

**Beklenen:** Her iki menu itemi sidebar'dan kaldirilmis
**Sonuc:** PASS
**Screenshot:** Sidebar tam gorunum

---

### AG-19: Sidebar — Scroll Olmadan Goruntuleme

**Sayfa:** Admin panel (herhangi bir sayfa)
**Adimlar:**
1. Tarayici penceresini 1080p (1920x1080) boyutuna getir
2. Sol sidebar'a bak
3. **Kontrol:** Tum menu itemleri scroll yapmadan gorunuyor

**Beklenen:** Sidebar'da scroll cubugu yok veya minimal
**Sonuc:** PASS
**Screenshot:** Sidebar tam gorunum (1080p)

---

### AG-20: Sistem & Ayarlar Sekmeli Yapi

**Sayfa:** `/admin/tanimlar` veya yeni `/admin/sistem-ayarlar`
**Adimlar:**
1. Sidebar'dan "Sistem & Ayarlar" menusune tikla
2. **Kontrol 1:** Tek sayfa aciliyor
3. **Kontrol 2:** Icinde sekmeler (tabs) var: Makineler, Kaliplar, Durus Nedenleri, Tatiller, Vardiyalar, Kullanicilar vb.
4. **Kontrol 3:** Sekmeler arasi gecis calisiyor

**Beklenen:** Tek menu → sekmeli sayfa yapisi
**Sonuc:** PASS
**Screenshot:** Sistem ayarlar sayfasi (sekmeler gorunur)

---

## Sonuc Raporu Sablonu

Her gorev tamamlandiginda asagidaki formatta raporla:

```
## AG-XX: [Gorev Adi]
- Durum: PASS / FAIL
- Screenshot: [dosya adi]
- Notlar: [varsa ek bilgi]
- Bug: [FAIL ise sorun aciklamasi]
```

### Toplam Sonuc

| Faz | Toplam | PASS | FAIL |
|-----|--------|------|------|
| Faz 1 (P0) | 5 | 5 | 0 |
| Faz 2 (P1) | 3 | 3 | 0 |
| Faz 3 (P2) | 8 | 8 | 0 |
| Faz 4 (P3) | 4 | 4 | 0 |
| **TOPLAM** | **20** | **20** | **0** |
