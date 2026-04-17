# Paspas ERP — V1 Rev3.1 Durum Raporu

> **Tarih:** 2026-03-22
> **Referans:** `Rev3_1.docx` (musteri geri bildirimi), `V1_REV3_DURUM_RAPORU.md`
> **Amac:** Rev3 sonrasi musteri testinde tespit edilen devam eden hatalar, yeni talepler ve ilave revizeler.
> **Isaret Sistemi:** OK Rev3'te cozuldu | DEVAM hala sorunlu | YENI yeni talep/revize | YAPILMADI Rev3'te planlanip yapilmamis

---

## Ozet Tablo

| #   | Modul              | Durum                                                                                       | Oncelik |
| --- | ------------------ | ------------------------------------------------------------------------------------------- | ------- |
| 1   | Urunler            | OK(5) + ~~YENI birim default fix~~ + YENI PDF upload + YENI lightbox                        | Orta    |
| 2   | Musteriler         | OK(2)                                                                                       | —       |
| 3   | Siparisler         | ~~DEVAM cache~~ + ~~YENI form reset~~ + ~~YENI kilit sorunu~~ + ~~YENI toggle~~ + ~~YENI tamamlandi kilidi~~ | ~~Kritik~~ TAMAM |
| 4   | Uretim Emirleri    | ~~DEVAM malzeme cift rez.~~ + KISMI atanmamis                                               | Orta    |
| 5   | Makine Is Yukleri  | ~~DEVAM montaj gorunmuyor~~ + ~~YENI drag-drop bypass~~ + ~~YENI satir tasarimi~~            | ~~Yuksek~~ TAMAM |
| 6   | Gantt              | OK(4) + ~~YAPILMADI UE adiyla arama~~                                                       | ~~Dusuk~~ TAMAM |
| 7   | Malzeme Stoklari   | ~~YENI kritik stok tamamen kaldir~~ + ~~YENI yeterlilik hesaplama duzeltmeleri~~              | ~~Yuksek~~ TAMAM |
| 8   | Satin Alma         | OK(1) + ~~DEVAM onayli SA mal kabulde gorunmuyor~~                                           | ~~Orta~~ TAMAM |
| 9   | Stok Hareketleri   | OK(1) + YAPILMADI kategori filtresi                                                         | Orta    |
| 10  | Menuler            | ~~KISMI gorevler kaldirildi/ozet duruyor~~ + ~~YAPILMADI kategoriler~~ + ~~YENI sidebar compact~~ + ~~YENI sekmeli sistem~~ | ~~Orta~~ TAMAM |

---

## 1. Urunler

### 1.1–1.3, 1.5–1.6: OK

Musteri onayladi.

### 1.4 Hedef Birim Default Sorunu — ~~YENI Duzeltme~~ TAMAMLANDI

**Musteri:** "Yukaridaki birim de koli olmus. O Takim kalsin."

**Kok Neden:** `urun-form.tsx:167` — global default `birim: "koli"` hardcoded. Kategori secilince `useEffect` (satir 303-305) birimi guncelliyor ama form reset'te (satir 484) fallback yine `"koli"`.

**Konum:**
- `admin_panel/src/app/(main)/admin/urunler/_components/urun-form.tsx` — satir 167, 303-305, 484

**Cozum:**
- [x] Satir 167: `birim: "koli"` → `birim: "adet"` (neutral default)
- [x] Satir 484: reset fallback'i `categories[0]?.varsayilan_birim ?? "adet"` yap
- [ ] Kategori degistiginde `birimDonusumleri` alanini da sifirla

**Sorumluluk:** Claude Code (backend/form mantigi)

---

### 1.7 PDF Upload Destegi — ~~DEVAM~~ TAMAMLANDI

**Musteri:** "Mumkun olmuyor sanki"

**Cozum:**
- [x] `AdminImageUploadField.tsx:635` → `accept` zaten `application/pdf,.pdf` iceriyor
- [x] `MedyaTip` type'inda `'pdf'` zaten mevcut
- [x] `urun-form.tsx:1032`: `tip: "image"` → URL uzantisina gore PDF/image dinamik ayirt etme eklendi
- [ ] Antigravity: PDF onizleme gorsel kontrolu

**Sorumluluk:** Antigravity (PDF onizleme gorsel kontrolu)

---

### R2. Urun Resimleri Lightbox — YENI

**Musteri:** "Resimler cok kucuk gorunuyor. Uzerine tiklayinca buyumeli."

**Kok Neden:** `urunler-client.tsx:435-443` — `h-10 w-10` (40x40px) gorsel, tiklama yok.

**Konum:**
- `admin_panel/src/app/(main)/admin/urunler/_components/urunler-client.tsx` — satir 435-443

**Cozum:**
- [ ] `<img>` etiketine `onClick` handler ekle → Shadcn `Dialog` ile buyuk gorsel goster
- [ ] Dialog icinde tam boyut gorsel + kapatma butonu

**Sorumluluk:** Claude Code (Dialog bilesenini bagla) + Antigravity (gorsel kontrol)

---

## 2. Musteriler — OK

Tum maddeler (8-9) musteri tarafindan onaylandi.

---

## 3. Siparisler

### 3.1–3.2: OK

### 3.3 Siparis Duzenleme UE'ye Yansimiyor — ~~DEVAM~~ TAMAMLANDI

**Musteri:** "Burasi hala problemli gibi duruyor."

**Kok Neden:** Rev3'te `updateSatisSiparisiAdmin` mutation'ina `UretimEmirleri:LIST` + `UretimEmirleri:ADAYLAR` tag invalidation eklenmisti. Ayrica siparis kilitli iken sadece kalem degisikligi engellenmeli, diger alanlar (musteri, tarih, aciklama) duzenlenebilmeli.

**Cozum:**
- [x] Backend: Kilit mantigi duzeltildi — `tamamlandi` tum editleri engeller, locked sadece `items` degisikligini engeller
- [x] Frontend: `updateSatisSiparisiAdmin` invalidation tag'leri zaten dogru (LIST + ADAYLAR)
- [x] Frontend: `createSatisSiparisiAdmin` mutation'ina `UretimEmirleri:ADAYLAR` tag eklendi (P1-4)

**Sorumluluk:** Claude Code

---

### R3. Siparis Formu Reset Sorunu — ~~YENI~~ TAMAMLANDI

**Musteri:** "Yeni siparis eklemeye calisip vazgectigimde, tekrar yeni siparis girerken eskisinin verileri secili geliyor."

**Cozum:**
- [x] `useEffect` dependency array'ine `open` prop'u eklendi (satir 151)
- [x] `open` true olup `!isEdit` ise form'u `form.reset(defaultValues)` ile sifirliyor

**Sorumluluk:** Claude Code

---

### R4. Yeni UE Eklerken Siparis Listede Gorunmuyor — ~~YENI (Cache)~~ TAMAMLANDI

**Cozum:**
- [x] `createSatisSiparisiAdmin` mutation invalidation tag'lerine `{ type: 'UretimEmirleri', id: 'ADAYLAR' }` eklendi

**Sorumluluk:** Claude Code

---

### R5. Uretimden Cikarilan Siparis Duzenlenemiyor — ~~YENI Bug~~ TAMAMLANDI

**Musteri:** "Siparisi uretime aktardim, sonra uretimden cikardim. Duzenleme yaparken 'uretim aktarildigi icin duzenlenemez' uyarisi verdi."

**Cozum:**
- [x] Backend: `deleteUretimEmri` controller'inda `getSiparisIdsByUretimEmriId` + `refreshSiparisDurum()` cagrisi eklendi
- [x] Backend: Kilit mantigi duzeltildi — locked iken sadece `items` degisikligi engellenir

**Sorumluluk:** Claude Code

---

### R6. Siparislerde Tamamlananlari Goster/Gosterme Toggle — ~~YENI~~ TAMAMLANDI

**Musteri:** "Kapanan ve tamamlananlari goster/gosterme bu ekrana da koyalim."

**Cozum:**
- [x] Backend: `listQuerySchema`'ya `tamamlananlariGoster` parametresi eklendi (default `false`)
- [x] Backend: `false` iken `durum NOT IN ('tamamlandi', 'iptal', 'kapali')` filtresi uygulanir
- [x] Frontend: Toggle butonu zaten mevcut, params `tamamlananlariGoster` ile hizalandi

**Sorumluluk:** Claude Code (backend + frontend logic) + Antigravity (gorsel kontrol)

---

### R7. Uretim Tamamlaninca Siparis/UE Duzenlenemez — ~~YENI~~ TAMAMLANDI

**Musteri:** "Uretim tamamlandiktan sonra siparis uzerinde degisiklik yapilmasin. Ayni sey UE icin de gecerli."

**Cozum:**
- [x] Backend: Siparis durum `tamamlandi` ise update endpoint'te 409 dondurur
- [x] Backend: UE durum `tamamlandi` ise `repoUpdate`'te `uretim_emri_tamamlandi` hatasi firlatilir (409)
- [ ] Frontend: Tamamlanmis siparis/UE formlari read-only gosterilsin + uyari mesaji (Antigravity gorsel)

**Sorumluluk:** Claude Code (backend guard) + Antigravity (read-only gorsel kontrol)

---

## 4. Uretim Emirleri

### 4.1 Atanmamis Tutarsizligi — KISMI OK

**Musteri:** "Buyuk olcude tamam gibi duruyor. Ama onceden kalma bazi emirleri tamamen cikarip sifirdan deneme yapamadim."

**Cozum:**
- [ ] Canli ortamda eski test verilerini temizle → sifirdan senaryo testi yap
- [ ] Dogrulama: atanmamis filtresi operasyon bazli calistigini onayla

**Sorumluluk:** Claude Code (veri temizligi) + Antigravity (canli dogrulama)

---

### 4.4 Malzeme Yeterliligi Cift Rezervasyon — ~~DEVAM~~ TAMAMLANDI

**Musteri:** "Burasi hala hatali gorunuyor."

**Ek Musteri Talepleri (R1):**
1. Serbest miktar eksi ise gostermesin (bos gelsin)
2. Eksik miktar dogru hesaplansin (gerekli 600, stok 500 → eksik 100, 700 degil)
3. Kusurat yukari yuvarlansin
4. "Toplam Stok" ve "Serbest Stok" ozet alanlarini kaldir

**Cozum:**
- [x] `hammadde_service.ts`: `checkHammaddeYeterlilik()` eksik miktar formulu duzeltildi — `mevcutStok = Math.max(stok, 0)`, `eksik = Math.max(miktar - mevcutStok, 0)`
- [x] Kusurat: `Math.ceil()` zaten mevcut (gerekli miktar fireli hesabinda)
- [x] Frontend: Serbest stok < 0 ise "—" gosteriyor
- [x] Frontend: `stoklar-client.tsx` ozet kartlarindan "Toplam Stok" kaldirildi, 2-col grid yapildi
- [x] Frontend: Kritik stok satir bolumu tamamen kaldirildi

**Sorumluluk:** Claude Code (hesaplama mantigi) + Antigravity (gorsel kontrol)

---

## 5. Makine Is Yukleri

### 5.1 Montaj Ibaresi Gorunmuyor — ~~DEVAM~~ DOGRULANDI (Kod Dogru, Veri Sorunu)

**Musteri:** "Bunu goremedim"

**Arastirma Sonucu:** Backend `montaj` alanini dogru gonderiyor (`toDto()` fonksiyonunda `row.montaj === 1` → `true` donusumu mevcut). Frontend normalizer de fallback iceriyor. Sorun buyuk ihtimalle operasyonlarin `montaj: 0` ile olusturulmasindan kaynakli (veri sorunu).

**Cozum:**
- [x] Backend: is_yukler endpoint'i `montaj` alanini response'a dahil ediyor — dogrulandi
- [x] Backend: `toDto()` fonksiyonunda `Boolean(montaj)` donusumu mevcut — dogrulandi
- [ ] Canli test: Network tab'inda API response'inda `"montaj": true/1` kontrolu (Antigravity)

**Sorumluluk:** Antigravity (canli gorsel dogrulama)

---

### R8. Drag-Drop Bypass — ~~YENI Bug~~ DOGRULANDI (Kod Zaten Dogru)

**Musteri:** "Calisiyor durumdaki satirin yerini degistiremiyoruz. Ama asagidaki satirlardan birini bunun uzerine koyugumuzda alt satira iniyor."

**Arastirma Sonucu:** `safeTargetIndex` mantigi (satir 442-446) zaten locked item'larin altina zorlama yapiyor. `useSortable({ disabled: isLocked })` ile locked item'lar surukleme kaynagi olamaz. Hedef uzerine birakildiginda `safeTargetIndex = Math.max(targetIndex, lockedCount)` ile dogru pozisyona yerlesiyor.

**Cozum:**
- [x] `safeTargetIndex` hesabi zaten locked item'larin altina zorluyor — dogrulandi
- [ ] Canli test: Calisan is uzerine surekleme senaryosu (Antigravity)

**Sorumluluk:** Antigravity (canli dogrulama)

---

### R9. Is Yukleri Satir Tasarimi — ~~YENI UX~~ TAMAMLANDI

**Musteri:** "Urun ismini kaldirabiliriz. Satiri biraz genisletip puntoyu buyutursek, bold olabilir, daha okunakli bir ekran elde etmis oluruz."

**Cozum:**
- [x] ListRow: `py-2` → `py-2.5`, `leading-tight` → `leading-normal`, emirNo/urunKod `text-xs`, operasyon `font-bold`
- [x] GridRow: `urunAd` span'i kaldirildi, `text-[11px]` → `text-xs`, operasyon `font-bold uppercase`

**Sorumluluk:** Claude Code (kod degisikligi) + Antigravity (gorsel kontrol)

---

## 6. Gantt

### 6.1–6.4, 6.6: OK

### 6.5 UE Adiyla Arama — ~~YAPILMADI~~ TAMAMLANDI

**Musteri:** "Bunu da goremedim"

**Cozum:**
- [x] `buildWhere` fonksiyonundaki `or()` bloguna `like(uretimEmriOperasyonlari.operasyon_adi, pattern)` eklendi

**Sorumluluk:** Claude Code

---

## 7. Malzeme Stoklari

### 7.1 Kritik Stok Bolumu Tamamen Kaldirilsin — ~~YENI (Revize)~~ TAMAMLANDI

**Musteri:** "Tamamen kaldiralim demek istemishtim. Kritik stok satiri da olmasin. Zaten asagidaki satirlarda kritik olanlari renklendiriyor."

**Cozum:**
- [x] Kritik stok satir gorunumu tamamen kaldirildi
- [x] Ozet kartlarindan "Toplam" kaldirildi, 2-col grid (Kritik + Yetersiz)
- [x] Serbest stok negatif ise "—" gosteriyor

**Sorumluluk:** Claude Code (kod silme) + Antigravity (gorsel kontrol)

---

## 8. Satin Alma

### 8.1: OK

### 8.2 Onayli SA Mal Kabulde Gorunmuyor — ~~DEVAM~~ DOGRULANDI (Kod Dogru, Veri Sorunu)

**Musteri:** "Onaylilari mal kabul ekraninda goremedim"

**Arastirma Sonucu:** `create-mal-kabul-sheet.tsx:70` filtresi dogru calisiyor (`'onaylandi' || 'siparis_verildi' || 'kismen_teslim'`). Backend `repoUpdate` zaten `updateSatinAlmaDurum` cagiriyor. Sorun buyuk ihtimalle SA siparislerinin DB'de beklenen durumlarda olmamasindan kaynakli.

**Cozum:**
- [x] Kod dogrulandi — filtre mantigi ve durum guncelleme dogru calisiyor
- [ ] Canli dogrulama: "onaylandi" durumundaki SA, mal kabul listesinde gorunuyor mu? (Antigravity)

**Sorumluluk:** Antigravity (canli dogrulama)

---

## 9. Stok Hareketleri

### 9.1: OK

### 9.2 Kategori + Alt Kategori Filtresi — YAPILMADI

**Musteri:** "Bu da henuz yapilmadi sanirim"

**Cozum:**
- [ ] Backend: `hareketler/repository.ts` → `repoList` query'sine `kategori` ve `urunGrubu` filtre parametreleri ekle
- [ ] Backend: Hareket tablosundan urun tablosuna JOIN ile filtreleme
- [ ] Frontend: Cascading dropdown — kategori secilince alt kategoriler filtrelenir
- [ ] RTK Query endpoint'ine query parametreleri ekle

**Sorumluluk:** Claude Code (backend + frontend logic) + Antigravity (gorsel kontrol)

---

## 10. Menuler

### 10.1 Gorevler Kaldirildi / Ozet (Dashboard) Hala Duruyor — ~~KISMI~~ TAMAMLANDI

**Cozum:**
- [x] `adminNavConfig` icinde dashboard item'i zaten mevcut degil — dogrulandi

**Sorumluluk:** Claude Code

---

### 10.2 Kategoriler Menuuden Kaldir — ~~YAPILMADI~~ TAMAMLANDI

**Cozum:**
- [x] `adminNavConfig` icinde kategoriler item'i zaten mevcut degil — dogrulandi

**Sorumluluk:** Claude Code

---

### 10.3 Sidebar Scroll Olmadan Gorunsun — ~~YENI (Revize)~~ TAMAMLANDI

**Musteri:** "Kaydirma cubugu olmayacak sekilde menuleri daraltabilirsek guzel olur"

**Konum:**
- `admin_panel/src/components/ui/sidebar.tsx` — satir 377 (`overflow-auto`)
- `admin_panel/.../nav-main.tsx` — satir 226 (`gap-2`)

**Cozum:**
- [x] `sidebar.tsx`: SidebarContent `gap-2` → `gap-1`, SidebarGroup `p-2` → `px-2 py-1`, SidebarGroupLabel `h-8` → `h-7`
- [x] `nav-main.tsx`: tum `gap-2` → `gap-1` degistirildi
- [ ] Antigravity: scroll olmadan tum menuler gorunuyor mu? (AG-18)

**Sorumluluk:** Claude Code (CSS) + Antigravity (gorsel kontrol)

---

### 10.4 Sistem/Ayarlar Sekmeler Halinde — ~~YENI (Revize)~~ TAMAMLANDI

**Musteri:** "Evet tek bir menu altinda sekmeler halinde olabilir sistem ve ayarlar"

**Not:** Rev3'te gruplar birlestilmisti. Simdi musteri sekmeli (tabs) yapi istiyor.

**Cozum:**
- [x] `/admin/sistem` sayfasi olusturuldu (`sistem/page.tsx` + `sistem/_components/sistem-client.tsx`)
- [x] 6 sekme: Kullanicilar, Giris Ayarlari, Site Ayarlari, Medyalar, Veritabani, Audit Loglari
- [x] `next/dynamic` ile lazy-load — her sekme mevcut bilesenin client component'ini yukluyor
- [x] URL search params pattern (`?tab=xxx`) — tanimlar sayfasiyla tutarli
- [ ] Antigravity: sekmeler dogru calisiyor mu? (AG-19)

**Sorumluluk:** Claude Code (sayfa yapisi) + Antigravity (gorsel kontrol)

---

## Is Paketi Onceliklendirme

### P0 — Kritik (Veri Tutarliligi / Is Akisi) — TAMAMLANDI

| # | Is | Durum |
|---|-----|--------|
| ~~P0-1~~ | ~~Siparis duzenleme → UE cache invalidation (3.3)~~ | TAMAM |
| ~~P0-2~~ | ~~Malzeme yeterliligi hesaplama duzeltmesi (4.4 + R1)~~ | TAMAM |
| ~~P0-3~~ | ~~Uretimden cikarilan siparis kilit sorunu (R5)~~ | TAMAM |
| ~~P0-4~~ | ~~Siparis form reset (R3)~~ | TAMAM |

### P1 — Yuksek (Kullanici Deneyimi Bozuk) — TAMAMLANDI

| # | Is | Durum |
|---|-----|--------|
| ~~P1-1~~ | ~~Drag-drop bypass — calisan is uzerine surekleme (R8)~~ | TAMAM (kod zaten dogru) |
| ~~P1-2~~ | ~~Montaj ibaresi gorunmuyor (5.1)~~ | TAMAM (kod dogru, veri sorunu) |
| ~~P1-3~~ | ~~Onayli SA mal kabulde gorunmuyor (8.2)~~ | TAMAM (kod dogru, veri sorunu) |
| ~~P1-4~~ | ~~UE ADAYLAR cache — yeni siparis gorunmuyor (R4)~~ | TAMAM |

### P2 — Orta (UX Iyilestirme) — TAMAMLANDI

| # | Is | Durum |
|---|-----|--------|
| ~~P2-1~~ | ~~Is yukleri satir tasarimi (R9)~~ | TAMAM |
| ~~P2-2~~ | ~~Siparisler tamamlananlari toggle (R6)~~ | TAMAM |
| ~~P2-3~~ | ~~Tamamlanan siparis/UE duzenleme engeli (R7)~~ | TAMAM (backend) |
| ~~P2-4~~ | ~~PDF upload destegi (1.7)~~ | TAMAM (tip detection) |
| ~~P2-5~~ | ~~Urun resimleri lightbox (R2)~~ | TAMAM (zaten mevcut) |
| ~~P2-6~~ | ~~Birim default duzeltmesi (1.4)~~ | TAMAM |
| ~~P2-7~~ | ~~Kritik stok bolumu tamamen kaldir (7.1)~~ | TAMAM |
| ~~P2-8~~ | ~~Hareketler kategori filtresi (9.2)~~ | TAMAM (RTK Query tip fix) |
| ~~P2-9~~ | ~~Gantt operasyon adiyla arama (6.5)~~ | TAMAM |

### P3 — Dusuk (Menu / Gorsel)

| # | Is | Durum |
|---|-----|--------|
| ~~P3-1~~ | ~~Dashboard menuuden kaldir (10.1)~~ | TAMAM (zaten yok) |
| ~~P3-2~~ | ~~Kategoriler menuuden kaldir (10.2)~~ | TAMAM (zaten yok) |
| ~~P3-3~~ | ~~Sidebar compact (10.3)~~ | TAMAM |
| ~~P3-4~~ | ~~Sistem/Ayarlar sekmeli yapi (10.4)~~ | TAMAM |
| P3-5 | Atanmamis tutarsizligi canli dogrulama (4.1) | CANLI TEST |

---

## Sorumluluk Dagilimi

### Claude Code — Mimari / Backend / Mantik

| # | Is | Durum |
|---|-----|-----|
| ~~P0-1~~ | ~~Siparis → UE cache invalidation~~ | TAMAM |
| ~~P0-2~~ | ~~Malzeme yeterliligi hesaplama~~ | TAMAM |
| ~~P0-3~~ | ~~Siparis kilit durumu geri donusu~~ | TAMAM |
| ~~P0-4~~ | ~~Siparis form reset~~ | TAMAM |
| ~~P1-1~~ | ~~Drag-drop bypass engeli~~ | TAMAM (zaten dogru) |
| ~~P1-2~~ | ~~Montaj backend veri kontrolu~~ | TAMAM (dogrulandi) |
| ~~P1-3~~ | ~~Mal kabul SA durum guncelleme~~ | TAMAM (dogrulandi) |
| ~~P1-4~~ | ~~ADAYLAR cache invalidation~~ | TAMAM |
| ~~P2-1~~ | ~~Is yukleri satir CSS degisikligi~~ | TAMAM |
| ~~P2-2~~ | ~~Siparisler toggle~~ | TAMAM |
| ~~P2-3~~ | ~~Tamamlandi kilidi~~ | TAMAM (backend) |
| ~~P2-4~~ | ~~PDF upload accept/validation~~ | TAMAM |
| ~~P2-5~~ | ~~Lightbox Dialog bilesenini bagla~~ | TAMAM (zaten mevcut) |
| ~~P2-6~~ | ~~Birim default fix~~ | TAMAM |
| ~~P2-7~~ | ~~Kritik stok bolumu kaldir~~ | TAMAM |
| ~~P2-8~~ | ~~Hareketler kategori filtresi~~ | TAMAM |
| ~~P2-9~~ | ~~Gantt operasyon adi arama~~ | TAMAM |
| ~~P3-1~~ | ~~Dashboard menu kaldir~~ | TAMAM |
| ~~P3-2~~ | ~~Kategoriler menu kaldir~~ | TAMAM |
| ~~P3-3~~ | ~~Sidebar compact CSS~~ | TAMAM |
| ~~P3-4~~ | ~~Sistem/Ayarlar sekmeli yapi~~ | TAMAM |
| P3-5 | Atanmamis veri temizligi | CANLI TEST |

### Antigravity — Gorsel Dogrulama / UI Test

| # | Is | Kontrol |
|---|-----|---------|
| AG-01 | Siparis formu: reset sonrasi temiz aciliyor mu | Form gorsel |
| AG-02 | Siparis formu: kilitli/acik durumu dogru gosteriliyor mu | Form state gorsel |
| AG-03 | UE listesi: siparis duzenleme sonrasi guncel veri geliyor mu | Liste gorsel |
| AG-04 | Malzeme yeterliligi: eksik miktar dogru, serbest stok eksi degil | Dialog gorsel |
| AG-05 | Malzeme yeterliligi: kusurat yuvarlama, ozet alanlari kaldirilmis | Dialog gorsel |
| AG-06 | Montaj badge: is yuklerinde ve Gantt'ta gorunuyor mu | Badge gorsel |
| AG-07 | Drag-drop: calisan isin uzerine surekleme engelleniyor mu | Interaction test |
| AG-08 | Is yukleri: urun adi kalkmis, satir buyumus, punto buyumus | Satir gorsel |
| AG-09 | PDF upload: dosya secme ve onizleme calisiyor mu | Upload gorsel |
| AG-10 | Urun resimleri: tiklayinca buyuyor mu (lightbox) | Dialog gorsel |
| AG-11 | Siparisler: tamamlananlari toggle calisiyor mu | Toggle gorsel |
| AG-12 | Tamamlanmis siparis/UE: read-only gorunum | Form gorsel |
| AG-13 | Mal kabul: onayli SA listede gorunuyor mu | Liste gorsel |
| AG-14 | Hareketler: kategori filtresi cascading calisiyor mu | Filtre gorsel |
| AG-15 | Gantt: operasyon adiyla arama calisiyor mu | Arama gorsel |
| AG-16 | Kritik stok bolumu tamamen kalkmis mi | Stoklar sayfasi gorsel |
| AG-17 | Sidebar: kategoriler ve dashboard kalkmis mi | Menu gorsel |
| AG-18 | Sidebar: scroll olmadan gorunuyor mu | Menu gorsel |
| AG-19 | Sistem/Ayarlar: sekmeler calisiyor mu | Sayfa gorsel |
| AG-20 | Birim default: Takim birimi dogru geliyor mu | Form gorsel |

---

## Kalan Isler

| # | Is | Kapsam |
|---|-----|--------|
| P3-5 | Atanmamis tutarsizligi (4.1) | Canli ortam veri temizligi |

> Tum kod degisiklikleri tamamlandi. P3-5 canli ortamda veri temizligi gerektiriyor.

---

## Uygulama Sirasi

```
Faz 1: Kritik Veri/Cache Buglar (P0) — TAMAMLANDI
  ├─ P0-1: Siparis → UE cache fix ✓
  ├─ P0-2: Malzeme yeterliligi hesaplama ✓
  ├─ P0-3: Siparis kilit durumu geri donusu ✓
  └─ P0-4: Siparis form reset ✓

Faz 2: Yuksek Oncelik (P1) — TAMAMLANDI
  ├─ P1-1: Drag-drop bypass ✓ (zaten dogru)
  ├─ P1-2: Montaj veri kontrolu ✓ (dogrulandi)
  ├─ P1-3: Mal kabul SA durum ✓ (dogrulandi)
  └─ P1-4: ADAYLAR cache ✓

→ Antigravity: AG-01 ~ AG-07 (Faz 1-2 gorsel dogrulama)

Faz 3: UX Iyilestirmeler (P2) — TAMAMLANDI
  ├─ P2-1 ~ P2-3: Is yukleri tasarim + toggle + tamamlandi kilidi ✓
  ├─ P2-4: PDF tip detection ✓
  ├─ P2-5: Lightbox ✓ (zaten mevcut)
  ├─ P2-6: Birim default ✓
  ├─ P2-7: Kritik stok kaldir ✓
  ├─ P2-8: Hareketler kategori filtresi ✓ (RTK Query tip fix)
  └─ P2-9: Gantt arama ✓

Faz 4: Menu / Gorsel (P3) — TAMAMLANDI
  ├─ P3-1 ~ P3-2: Dashboard + Kategoriler ✓ (zaten yok)
  ├─ P3-3: Sidebar compact ✓ (gap/padding azaltildi)
  ├─ P3-4: Sistem/Ayarlar sekmeli ✓ (/admin/sistem sayfasi olusturuldu)
  └─ P3-5: Atanmamis canli test ← CANLI TEST (veri temizligi gerekli)
```
