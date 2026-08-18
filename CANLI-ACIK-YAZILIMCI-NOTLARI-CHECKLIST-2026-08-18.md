# Canlı Açık Yazılımcı Notları — Kontrol ve Yeni Checklist

Canlı kaynak: `vps-paspas` → `promats_erp` DB, `page_feedback_threads` + `page_feedback_comments`.
Çekim zamanı: **18 Ağustos 2026** · Canlı sürüm: **`57414cc`** (14 Ağustos 23:53) — yani 15 Ağustos'ta gelen notların hiçbiri henüz deploy edilmedi.
Kapsam: `resolved` / `closed` dışındaki tüm kayıtlar.

Bir önceki checklist: [CANLI-ACIK-YAZILIMCI-NOTLARI-CHECKLIST-2026-08-14.md](CANLI-ACIK-YAZILIMCI-NOTLARI-CHECKLIST-2026-08-14.md) (34 aktif kayıt).
**Fark: +8 yeni kayıt** — 15 Ağustos'ta Hidayet Taşdöven tarafından açıldı, tamamı Üretim ERP tarafında.

## Özet

| Durum | Adet | Anlamı |
|---|---:|---|
| Açık (`open`) | 11 | Bizde — doğrudan iş *(1.1 çözüldü, 18 Ağu)* |
| Bilgi bekliyor (`needs_info`) | 12 | Karşı tarafta (müşteri kararı / grafikçi) |
| Planlandı (`planned`) | 18 | Fuar modülü faz planı |
| **Toplam aktif** | **41** | |

| Öncelik | Açık | Bilgi bekl. | Planlandı |
|---|---:|---:|---:|
| Kritik | 3 | 5 | 5 |
| Yüksek | 1 | 5 | 10 |
| Normal | 8 | 2 | 3 |

| İş alanı | Aktif |
|---|---:|
| Fuar | 22 |
| CRM | 8 |
| Üretim ERP (yeni) | 8 |
| Web | 4 |

---

## BÖLÜM 1 — Üretim ERP: 15 Ağustos notları (canlıda doğrulandı)

Sekizinin tamamı canlı kodda **teyit edildi**; hiçbiri kısmen bile yapılmamış. Sıra, çözüm maliyeti/etkisi dengesine göre.

### 1.1 🔴 Application Error — "Tamamlananları Göster" ekranı çökertiyor

- Canlı kayıt: `977aa834-1c71-4dc8-95d9-8d07d35d9bdc` · `/admin/uretim-emirleri` · Normal öncelik girilmiş, **fiilen kritik**
- Görsel: `uploads/admin/uretim-emirleri/Application_Error.png`

**Kök neden bulundu ve canlı veriyle doğrulandı.**

`grupPlanlanan()` ([uretim_emirleri.types.ts:12-16](admin_panel/src/integrations/shared/erp/uretim_emirleri.types.ts#L12-L16)) aynı mamul grubundaki emirlerin planlanan miktarı farklıysa `throw new Error("asimetrik_planlanan_miktar")` atıyor. Bu fonksiyon `aggregateMamul()` içinden **render sırasında** çağrılıyor ([uretim-emirleri-client.tsx:701](admin_panel/src/app/\(main\)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx#L701)) → React ağacı çöküyor → beyaz ekran.

Gruplama anahtarı `mamulGrupKey` = `(parti_no ?? "partisiz") :: mamul_urun_id`. Eski tamamlanmış emirlerin `parti_no` değeri **NULL** olduğu için hepsi tek bir "partisiz" kovasına düşüyor ve **birbiriyle alakasız emirler aynı mamul grubunda birleşiyor**.

Canlı sorgu sonucu — çökmeyi tetikleyen 7 grup:

| mamul | emir sayısı | farklı miktar | örnek |
|---|---:|---:|---|
| `8d90dbf5…` | 6 | 6 | UE-2026-0013=3500, UE-2026-0023=4000, UE-2026-0025=3000, UE-2026-0028=2000, UE-2026-0055=1700, UE-2026-0058=1000 |
| `ff89c9a6…` | 4 | 4 | UE-2026-0015=2700, UE-2026-0022=2000, UE-2026-0026=2300, UE-2026-0059=1000 |
| `3c9860b7…` | 3 | 3 | UE-2026-0007=200, UE-2026-0024=5000, UE-2026-0047=3200 |
| `9b92a323…` | 3 | 2 | UE-2026-0032=500, UE-2026-0044=500, UE-2026-0049=1500 |
| `7d03546a…`, `92852e9c…`, `9808d721…` | 2 | 2 | — |

Toplam 126 emrin 122'si tamamlanmış; filtre kapalıyken sadece 4 aktif emir yüklendiği için hata görünmüyor. "Tamamlananları Göster" açılınca 122 emir geliyor ve ilk asimetrik grupta çöküyor.

- [x] `mamulGrupKey` partisiz emirleri tek kovaya toplamasın — partisiz emir artık kendi grubudur (`emir::<id>`). *(commit `d4cd896`)*
- [x] `grupPlanlanan` render yolunda **throw etmesin** — `max()` döner; asimetri satırda "Taraflar farklı planlı" işaretiyle gösterilir (`grupAsimetrik`). *(commit `d4cd896`)*
- [x] Liste render'ı `ListeErrorBoundary` ile sarıldı — tek bozuk grup ekranı düşürmez. *(commit `d4cd896`)*
- [x] Regresyon testi: canlı çökme seti (6 asimetrik partisiz emir) + parti dolu çift + asimetrik/simetrik miktarlar — 4 test, vitest. *(commit `d4cd896`)*

✅ **CANLIDA — 18 Ağustos 2026, release `20260818T184048Z-d4cd896a26f4`**

Canlı doğrulama (sunucu üzerinden, gerçek veriyle):

| Kontrol | Sonuç |
|---|---|
| Deploy edilen sürüm | `d4cd896` ✓ |
| Yeni grup anahtarı (`emir::`) build çıktısında | var ✓ |
| Eski `asimetrik_planlanan_miktar` throw'u | yok ✓ |
| API `tamamlananlariGoster=true` | HTTP 200 ✓ |
| Panel `/admin/uretim-emirleri` | HTTP 200 ✓ |
| **Eski kuralla çökerten grup (ilk sayfa)** | **3** |
| **Yeni kuralla çökerten grup** | **0** ✓ |

Çökerten 3 grup: `UE-2026-0025/0013/0023` (3000/3500/4000), `UE-2026-0007/0024` (200/5000), `UE-2026-0015/0022/0026` (2700/2000/2300).

Canlı yazılımcı notu `977aa834` **`resolved`** yapıldı; müşteriye çözüm açıklaması yazıldı. Aktif kayıt: 42 → **41** (açık 12 → 11).

> **Deploy notu:** İlk deneme yanlış script'le (`/root/bin/deploy-paspas`) yapıldı ve ~25 dakikalık canlı kesintiye yol açtı — detay ve kalıcı çözüm **S6**'da. Doğru yol olan atomic release ile yeniden yayınlandı: build yerelde alındı, sunucuya yalnız artefakt gitti, sunucuda tek satır build çalışmadı.

> Not: Bu üç maddenin ilk ikisi ayrı ayrı da çözer; ikisini birlikte yapmak doğrusu — biri veri modelini, diğeri dayanıklılığı düzeltiyor.

### 1.2 🟠 Ürün ve Müşteri sütunları arasındaki boşluk

- Canlı kayıt: `70fe2d32-59cb-400a-ba27-b092578fac24` · `/admin/uretim-emirleri` · Görsel: `bosluk.png`

Doğrulandı: tablodaki tüm sütunlar sabit genişlikte (`w-32`, `w-36`, `w-24`…) ama Ürün sütunu `min-w-40` ve üst sınırı yok ([uretim-emirleri-client.tsx:946](admin_panel/src/app/\(main\)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx#L946)) → artan tüm genişliği Ürün sütunu yutuyor, diğerleri sıkışıyor.

- [ ] Ürün sütununa üst sınır ver, artan genişliği sütunlara dengeli dağıt (`table-fixed` + oransal genişlikler).
- [ ] 1366px ve 1920px genişlikte kontrol et.

### 1.3 🟠 Üretim emirleri satırını sadeleştir

- Canlı kayıt: `b23bee2e-c2b2-4b37-a230-cbeeebe95d9c` · Görsel: `Gorsel4.png`

Hepsi canlı kodda mevcut, kaldırılacak/değişecek:

- [ ] Satırdaki `Sipariş: SS-2026-0059` bilgisini kaldır ([satır 1006-1008](admin_panel/src/app/\(main\)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx#L1006-L1008)).
- [ ] `ÇİFT TARAFLI` rozetini kaldır ([satır 996-1004](admin_panel/src/app/\(main\)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx#L996-L1004)).
- [ ] `+1 taraf daha` yazısını kaldır ([satır 976-980](admin_panel/src/app/\(main\)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx#L976-L980)).
- [ ] İlerleme sütunundaki `0 / 4.100` metnini kaldır, progress bar kalsın ([satır 1052-1055](admin_panel/src/app/\(main\)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx#L1052-L1055)).
- [ ] Kazanılan yer kadar satır yüksekliğini azalt — ekrana daha çok satır sığsın.
- [ ] Yeni **Üretilen** sütunu: operatör montaj tarafı için veri girmediyse boş; girdiyse girilen miktarların toplamı + yanında `Takım`.
- [ ] Grup başlığındaki üretim emri numarası (sol üst `UP-2026-0036`) satırdaki emir no formatıyla aynı/belirgin olsun; hemen yanına **ürün grubu** yazılsın (örn. `Pars Grubu`, `Ekstra Grubu`).
- [ ] Durum etiketi `Üretimde` → `Üretiliyor` — **yalnız** [tr.json:5296](admin_panel/src/locale/tr.json#L5296) (`uretimEmirleri.statuses.uretimde`). [tr.json:5117](admin_panel/src/locale/tr.json#L5117) `satisSiparisleri.statuses.uretimde`'dir ve Satış Siparişleri ekranlarına aittir — **dokunulmayacak** (bkz. Risk R3).

### 1.4 🟠 Üretim emri satırında açılır detay ekranı (yeni özellik)

- Canlı kayıt: `a2b9aa7a-26b1-4ea0-b61c-e93b44fb249c` · Görseller: `Gorsel1.png`, `Gorsel2.png`, `Gorsel3.png`

Bu sekizin içindeki **tek gerçek yeni geliştirme**; diğerleri düzeltme/sadeleştirme.

- [ ] İlerleme sütunundaki makine bazlı alt kırılımı (`900 T (ÖN) · Başlamadı` listesi) satırdan kaldır — Görsel1'de mavi işaretli blok ([satır 1060-1088](admin_panel/src/app/\(main\)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx#L1060-L1088)).
- [ ] Her emir satırının başına `>` genişletme işareti koy (ürünler ekranındaki mevcut yapı örnek alınacak — Görsel2).
- [ ] Tıklanınca satır altında açılan panel; tasarım Makine İş Yükleri ekranına benzer (Görsel3).
- [ ] Panelde o emir numarasına bağlı **üretimler** listelensin (çift taraflı üretimde 2 satır).
- [ ] Panel alanları:
  - [ ] **Ürün Adı — Operasyonel YM Adı**: Operasyonel YM adı ürün adına göre daha belirgin.
  - [ ] Montaj varsa `Montaj` rozeti (Görsel3'teki gibi).
  - [ ] **Makine Adı**.
  - [ ] **Üretim Durumu**: `Makineye atandı` / `Üretiliyor` / `Duraklatıldı` (+ duraklama nedeni küçük açıklama) / `Tamamlandı`. İkonla desteklenebilir.
  - [ ] **Üretilen Miktar**: operatörün girdiği toplam; montajlıysa sonda `Takım`, montajsızsa `Adet`.
  - [ ] **Bitiş Tarihi**: tamamlanmadıysa planlanan bitiş `17/08 Pazartesi` + altında saat; tamamlandıysa `17/08/2026` + saat. Planlanan ve gerçekleşen **farklı renkte**.

### 1.5 🟢 Malzeme stokları — varsayılan filtreler

- Canlı kayıt: `9ec0f5cf-0fb9-4f59-8101-462f12a56a8a` · `/admin/stoklar`

Doğrulandı: [stoklar-client.tsx:29](admin_panel/src/app/\(main\)/admin/stoklar/_components/stoklar-client.tsx#L29) `kategori = "all"`, [satır 31](admin_panel/src/app/\(main\)/admin/stoklar/_components/stoklar-client.tsx#L31) `stokluOnly = false`.

- [ ] Ekran ilk açıldığında Kategori = **Ürünler** seçili gelsin.
- [ ] Ekran ilk açıldığında **Stokta olanlar** seçili gelsin.

### 1.6 🟢 Yeterlilik Kontrolü — iki sütunu kaldır

- Canlı kayıt: `f87c2245-35ee-401b-9f4d-082bb7842b83` · Müşteri notu: *"Yeterlilik kontrolü çok güzel olmuş."*

Doğrulandı: [yeterlilik-dialog.tsx:133-134](admin_panel/src/app/\(main\)/admin/stoklar/_components/yeterlilik-dialog.tsx#L133-L134).

- [ ] `Fire %` sütununu kaldır ([tr.json:5555](admin_panel/src/locale/tr.json#L5555)).
- [ ] `Gerekli (Fireli)` sütununu kaldır ([tr.json:5556](admin_panel/src/locale/tr.json#L5556)).
- [ ] Kalan sütunların genişliklerini yeniden dağıt.

> Dikkat: `gerekliMiktarFireli` değeri üretim emirleri ekranındaki `MalzemeBadge` tooltip'inde de kullanılıyor ([uretim-emirleri-client.tsx:105-106](admin_panel/src/app/\(main\)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx#L105-L106)). Sadece bu diyalogdaki sütunlar kaldırılacak; alan backend'den sökülmeyecek.

### 1.7 🟢 Negatif miktarlı malzemeler için filtre

- Canlı kayıt: `201329ec-d22d-4b83-9313-8bc9884e7dd5`

Doğrulandı: stoklar ekranında negatif stok filtresi/butonu **yok**.

- [ ] Negatif miktarlı malzemeleri listeleyen buton veya filtre ekle.

> Bağlam: negatif stok, hafızadaki [[project_uc_uretim_modeli]] bulgusunun (kod tanımadığı üçüncü "inline" üretim modeli → canlıda negatif stok) doğrudan görünen yüzü. Bu filtre semptomu görünür kılar, **nedeni çözmez**. Kök neden ayrı iş olarak duruyor.

### 1.8 🟢 Sevk bekleyenler — gruplar kapalı açılsın

- Canlı kayıt: `8f51e026-c971-4b43-b40b-0c5206731519` · `/admin/sevkiyat`

Doğrulandı: `GroupSection` varsayılanı `defaultOpen = true` ([sevkiyat-client.tsx:290](admin_panel/src/app/\(main\)/admin/sevkiyat/_components/sevkiyat-client.tsx#L290)).

- [ ] Müşteri bazlı gruplamada ilk açılışta sadece firma isimleri görünsün, sipariş satırları kapalı gelsin.
- [ ] Ürün bazlı gruplamada da malzeme adı listelensin, altındaki firma isimleri kapalı gelsin.

---

## BÖLÜM 2 — Fuar modülü: 4 açık kritik/yüksek madde

Dördü de 29 Temmuz'da açıldı, son hareket 9 Ağustos. Kalan tek engel hepsinde aynı: **PDF/Excel karşılaştırması**.

**Canlıda doğrulanan engel:** `fuar_teklif` uygulamasının bağımlılıklarında hiçbir PDF veya Excel kütüphanesi yok (`package.json` → fastify, mysql2, zod, jwt, cors, cookie). Yani bu dört maddenin kabul kriteri, **henüz hiç yazılmamış** bir çıktıya bağlı. Hesap motoru testleri geçiyor (13 pass / 0 fail, 4 dosya).

- [ ] **Hesaplama ve kabul testleri** — Kritik · `482661d2-76e0-4b82-9bcc-bb2d1652f5ed`
  42 kriterlik kabul setinin tamamı + ekran/PDF/Excel üçlüsünün aynı sonucu vermesi.
- [ ] **Koli bazlı CBM hesabı** — Kritik · `0664e852-aefd-4804-93ef-91d88c30c12d`
  Testi geçiyor (dört ondalık, canlı örnek 10 koli = 0,6 m³); PDF/Excel karşılaştırması eksik.
- [ ] **Net ve brüt ağırlık hesabı** — Kritik · `7939a87f-70d3-4913-b94a-3dd6cb2d9972`
  Testi geçiyor (canlı örnek 240 kg net / 360 kg brüt); PDF/Excel karşılaştırması eksik.
- [ ] **Paletli yükleme hacim ve adet hesabı** — Yüksek · `cacd7377-0897-4cd6-b8b9-c7f0c71fbe3e`
  Testi geçiyor (canlı örnek 2 palet = 2,88 m³); PDF/Excel karşılaştırması eksik.

**Bağımlılık — sıra bu olmalı:** bu 4 madde `planned` kovasındaki iki maddeye bağlı:
`6b742dc1` (Teklif ve proforma PDF çıktısı) ve `092f9305` (Çeki listesi PDF ve Excel çıktıları).
Bu ikisi yapılmadan yukarıdaki dördü **kapatılamaz**. Fuar planında bunlar öne alınmalı.

---

## BÖLÜM 3 — Bilgi bekleyenler (12) — bizde iş yok, ama durumu netleşmeli

Bu kayıtlar `needs_info`; yani karşı taraftan cevap bekliyor. Uzun süredir hareketsizler (CRM 29 Temmuz, Web 2 Ağustos).

### CRM (8 kayıt · `/admin/teklifler`) — 29 Temmuz'dan beri beklemede

**Canlıda doğrulandı:** CRM **backend'i hazır** — `backend/src/modules/crm/` altında controller, router, validation, scope, audit + repository katmanı (dashboard, activities, communications, reports, reminders, automation, saved-views, loss-reasons). **Admin panel tarafında tek bir CRM ekranı yok.**

Yani bu 8 madde "bilgi bekliyor" görünse de, teknik durum net: **arka uç yazılmış, arayüz yazılmamış.**

- [ ] `f50686b0` — CRM Pipeline/Kanban admin ekranı (Kritik)
- [ ] `8f6e3278` — Müşteri detayında CRM sekmeleri (Kritik)
- [ ] `0ed4080c` — CRM talep ve fırsat ekranları (Kritik)
- [ ] `8b7d1465` — CRM admin E2E testleri (Kritik)
- [ ] `b022f6cf` — CRM dashboard admin ekranı (Yüksek)
- [ ] `c47deea7` — CRM aktivite panosu ve takvimi (Yüksek)
- [ ] `ad5ccf40` — CRM ayar ekranları (Yüksek)
- [ ] `1543ba91` — CRM rapor ekranları (Normal)

**Aksiyon:** Bu 8 kaydın `needs_info` kalması doğru değil — beklenen bilgi ne, netleşmeli. Ya müşteriden karar istenip statü `planned`e çekilmeli, ya da yazılmış backend'in üstüne arayüz planlanmalı. Aksi halde tamamlanmış bir backend kullanılmadan duruyor.

### Web (4 kayıt) — grafikçi revizesi bekliyor

- [ ] `65a7453c` — Kurumsal sayfasını referans tasarıma yaklaştır (Kritik) · `/promats/tr/hakkimizda`
- [ ] `01f96b37` — Anasayfa ürün vitrini kompozisyonu (Yüksek) · `/promats/tr`
- [ ] `f55e3d4d` — "Neden Promats" bölümü kompozisyonu (Yüksek) · `/promats/tr`
- [ ] `b782729d` — Ürünler sayfası grafikçi revizesi (Normal) · `/promats/tr/urunler`

**Aksiyon:** Dördü de 2 Ağustos'tan beri sabit. Grafikçi çıktısı gelmediyse takip edilmeli; gelmeyecekse mevcut tasarımla kapatma kararı alınmalı.

---

## BÖLÜM 4 — Planlandı (18) — Fuar modülü faz planı

Tamamı 29 Temmuz'da tek seferde açılmış, o günden beri hiç hareket yok. Öncelik sırasıyla:

**Kritik (5)**
- [ ] `0e1c86d5` — Ürün ihracat bilgilerinin eklenmesi
- [ ] `26cd99a4` — Çeki listesinin otomatik oluşturulması
- [ ] `6b742dc1` — **Teklif ve proforma PDF çıktısı** ← Bölüm 2'nin engeli
- [ ] `e22bdd52` — Tekliften proforma oluşturma
- [ ] `b4a7c00b` — Teklif ticari koşullarının girilmesi

**Yüksek (10)**
- [ ] `092f9305` — **Çeki listesi PDF ve Excel çıktıları** ← Bölüm 2'nin engeli
- [ ] `fc5085b6` — Taşıma şekli ve yükleme tipi varsayımları
- [ ] `f6b33adf` — Varsayılan navlun önerisi
- [ ] `eb2b1895` — Teklif ve proforma dil seçimi
- [ ] `ace2c5be` — Kapasite ve palet tanımlarının yönetimi
- [ ] `9505c25a` — Ürünleri Excel ile içe aktarma
- [ ] `81be5b3d` — Müşterileri Excel ile içe aktarma
- [ ] `89f3251d` — Banka hesaplarının para birimine göre seçilmesi
- [ ] `6eeec246` — Konteyner doluluk göstergesi
- [ ] `35846c61` — TIR doluluk göstergesi

**Normal (3)**
- [ ] `c6e3e97b` — Karayolu navlun tablosunun yönetimi
- [ ] `f0a9ba5e` — Ürün fotoğraf yönetimi
- [ ] `f4ce4623` — Denizyolu navlun tablosunun yönetimi

---

## BÖLÜM 5 — Risk analizi: 12 açık maddenin yan etkileri

18 Ağustos'ta 12 açık maddenin tamamı, "başka nereyi bozar?" sorusuyla kodda ve canlı veride tek tek incelendi.
**Dördü riskli, ikisi birbiriyle çelişiyor, biri checklist hatasıydı (düzeltildi).** Kalan beşi izole.

| # | Madde | Risk | Neyi etkiler |
|---|---|---|---|
| R1 | 1.3 — "Üretilen" sütunu (Takım) | 🔴 Yüksek | Yanlış üretim adedi; 63 emirde çift sayım. Kural ikinci turda derinleştirildi (montajsız çiftler) |
| R2 | 1.5 ↔ 1.7 — stok varsayılan filtresi vs negatif filtre | 🔴 Yüksek | Birbirini iptal ediyor; 46 negatif kayıt gizleniyor. **S1 ile birleşti** |
| R3 | 1.3 — `Üretimde` → `Üretiliyor` locale | 🟠 Orta | Yanlış anahtar Satış Siparişleri'ni de değiştirir |
| R4 | 1.1 — grup anahtarı değişikliği | 🟠 Orta | Backend kopyası aslında S3'ün yapı taşı; strateji revize edildi |
| R5 | 1.3 ↔ 1.4 — sıralama bağımlılığı | 🟠 Orta | 1.3 önce giderse çift taraflı bilgisi ekrandan kaybolur |
| R6 | 1.6 — Fire sütunları | 🟢 Düşük (uykuda) | Bugün zararsız; fire oranı girilirse aritmetik tutmaz |
| R7 | 1.1 sonrası | 🟢 Düşük | Çökme kalkınca sayfa başına 25 gereksiz yeterlilik sorgusu görünür olur |
| — | 1.2, 1.8, Fuar 4 madde | 🟢 Yok | İzole |

Sistemik bulgular (S1–S5) ayrı bölümde: **Bölüm 6**. İkinci tur incelemede (18 Ağustos, derin doğrulama) çıkarıldılar.

---

### 🔴 R1 — "Üretilen (Takım)" sütunu: toplam almak 63 emirde yanlış sonuç verir

**Madde:** 1.3 · Müşteri notu: *"Üretim verisi girildiyse girilen miktarların toplamı gelsin ve hemen yanında 'Takım' yazsın."*

Notun harfiyen uygulanması — operasyonların üretilen miktarlarını **toplamak** — yanlış. Canlı veri:

| Emir | Op 1 (montaj) | Op 2 (montaj) | Toplam alırsak | Doğrusu |
|---|---|---|---:|---:|
| UE-2026-0155 | 90 (montaj=0) | 2.176 (montaj=1) | **2.266** ❌ | 2.176 |
| UE-2026-0157 | 1.255 (montaj=0) | 2.000 (montaj=1) | **3.255** ❌ | 2.000 |
| UE-2026-0146 | 2.030 (montaj=0) | 2.005 (montaj=1) | **4.035** ❌ | 2.005 |

Sebep, hafızadaki [[project_cift_tarafli_iki_model]] tuzağının ta kendisi — canlıda iki model yan yana çalışıyor:

- **Model A — iki ayrı emir** (63 emir, 1 operasyonlu): UE-2026-0158 `sag` montaj=0 üretilen 1.300 **+** UE-2026-0159 `sol` montaj=1 üretilen 2.000. Mamul grubu bazında toplarsak 3.300 çıkar; doğrusu 2.000.
- **Model B — tek emir, iki operasyon** (63 emir): yukarıdaki tablo.

Ayrıca mevcut kod üçüncü bir cevap üretiyor: `Math.min(...)` ([satır 703](admin_panel/src/app/\(main\)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx#L703)) → Model A için 1.300. Yani şu an ekranda **üç farklı yanlış** üretilebiliyor.

**İş kuralı (kullanıcı netleştirmesi, 2026-08-18 — canlı reçetelerle doğrulandı):** Bir paspas takımı 4-5 parçadan oluşur. **Montaj = sağ ve sol tarafların birleştirilip paketlenmesi = takımın doğduğu adım.** Bazı modellerde sağ/sol farklı parçadır (canlıda 118 reçete: iki farklı parça, 1+1 adet), bazılarında aynıdır (52 reçete: **aynı parçadan 2 adet** — STAR BEJ, BADEM SİYAH, KAPİTONE SİYAH…). Sipariş daima **birleşmiş olana — takıma** verilir; birleşmeden önce olanlar sağ/sol parçadır, ürün değildir. Dolayısıyla planlanan miktar da montaj operasyonunun miktarı da takım cinsindendir; enjeksiyon (parça) miktarlarıyla toplanmaları **birim hatasıdır** (parça + takım toplanamaz).

**Doğru kural — canlı veriyle doğrulandı:**

1. Grupta `montaj=1` operasyonu **varsa** → takım adedi = o operasyonun `uretilen_miktar` değeri, birim `Takım`. Toplam değil, minimum değil. (Montaj çıktısı zaten takım sayar; reçetedeki 1+1 / 2× oranını montaj akışı kendisi uygular.)
2. Grupta montaj operasyonu **yok ama grup çift taraflıysa** → takım adedi = **reçete oranına bölerek** `min(üretilen_parça ÷ reçetedeki adet)`. Canlıdaki tüm montajsız çiftler 1+1 reçeteli (Pars Bej 700/660, Pars Gri 485/497 — iki taraf planlananı eşit), orada bu `min(taraflar)`a eşdeğer; ama kural reçete oranıyla yazılmalı ki 2× reçeteli bir vaka ileride yanlış saymasın. *(Müşterinin "montaj verisi yoksa boş" kuralı bu modeli öngörmüyor; harfiyen uygulanırsa bitmiş ürünler sonsuza dek boş görünür. Varsayım: tam takım sayısı gösterilir; müşteriye not düşülecek.)*
3. Grupta montaj yok ve tek emir → kendi `uretilen_miktar`ı, birim `Adet` (ortada takım yok; üretilen şey parça/aramamuldür).

Simetrik modellerin (sağ=sol, 2× reçete) yan etkisi: bu modellerde iki ayrı sağ/sol emri zaten açılmaz — tek parça tipi vardır; kural 2'nin canlıdaki mevcut vakaları etkilenmez. Ancak **inline model + 2× reçete birleşimi negatif stoku iki kat hızlandırır** (her takım için aynı parçadan 2 düşüm, hiç giriş yok) — S2(b)'nin en sert vakaları bu kesişimden gelir.

Kuralın güvenli olduğu teyitler:
- Emir başına **hiçbir yerde 2+ montaj operasyonu yok** (93 emirde tam 1, 33 emirde 0); çiftli grup başına da en çok 1 montaj → belirsizlik yok.
- Montaj operasyonu sırası sabit değil (UE-2026-0155'te `sira 2`, 0156'da `sira 1`) → **sıraya göre değil, `montaj` bayrağına göre** okunmalı.
- Aktif emirlerden montajsız olanlar: UE-2026-0158 (çiftin sağ tarafı — eşi 0159 montajlı, kural 1 kapsar) ve UE-2026-0166 (tek başına parça, kural 3 kapsar).
- Miktar planlananla **kırpılmamalı**: canlıda plan aşımı yaygın (bkz. S4) — 794/690, 2.176/2.000 gibi değerler olduğu gibi gösterilmeli.

- [ ] `Üretilen` sütunu yukarıdaki 3 kurala göre hesaplansın; toplama yapılmasın.
- [ ] Aynı kural `aggregateMamul`'daki `Math.min` mantığına da uygulansın — Model A ve Model B aynı sonucu vermeli.
- [ ] Üç kuralı da kapsayan test: UE-2026-0155 (tek emir/2 op), UE-2026-0158+0159 (iki emir), UP-2026-0007 çiftleri (montajsız çift, 1+1 reçete), UE-2026-0166 (montajsız tek) + reçete oranı 2× olan sentetik montajsız-çift vakası.

> Ek gözlem: 15 emirde `taraf='parca'`, montaj=1 ve tek operasyon var (UE-2026-0160…0165 gibi). Bu, hafızadaki [[project_uc_uretim_modeli]] "inline" modeli. Montaj bayrağı kuralı bunu da doğru ele alıyor — ayrı dal gerekmiyor.
>
> Ayrıca üretilen > planlanan olan emirler var (UE-2026-0148: 794/690, UE-2026-0152: 528/526). Yüzde ve "tamamlandı" mantığı %100 üstünü tolere etmeli.

---

### 🔴 R2 — 1.5 ile 1.7 birbirini iptal ediyor

**Maddeler:** 1.5 (stok ekranı varsayılanları) ve 1.7 (negatif miktar filtresi) — ikisi de aynı gün, aynı kişi tarafından açıldı.

`stokluOnly` filtresi backend'de `stok > 0` demek ([repository.ts:38-40](backend/src/modules/stoklar/repository.ts#L38-L40)). Negatif stoklu malzemenin `stok < 0` olduğu için bu filtre onları **dışarıda bırakır**.

Yani 1.5'i "Stokta olanlar varsayılan açık" diye uygularsak, 1.7'nin görünür kılmak istediği kayıtlar varsayılan olarak gizlenir.

Canlı veri (`stok_takip_aktif=1`):

| Kategori | Toplam | Stoklu (>0) | **Negatif** |
|---|---:|---:|---:|
| urun | 208 | 19 | **11** |
| yarimamul | 84 | 7 | **30** |
| operasyonel_ym | 169 | 29 | **5** |
| hammadde | 4 | 1 | 0 |
| **Toplam** | **465** | **56** | **46** |

İki varsayılan birlikte uygulanınca ekran 465 kayıttan **19'unu** gösterir. 46 negatif kaydın tamamı gizlenir — 35'i zaten kategori filtresinin de dışında kalır.

**İkinci ve daha sinsi sorun:** `durum='yetersiz'` filtresi `stok <= 0` koşulu ekliyor ([repository.ts:42-44](backend/src/modules/stoklar/repository.ts#L42-L44)). `stokluOnly` varsayılan açıkken kullanıcı "Yetersiz" seçerse koşullar `stok > 0 AND stok <= 0` olur → **her zaman boş liste**, hiçbir açıklama olmadan. Bugün `stokluOnly` varsayılan kapalı olduğu için bu kombinasyon görünmüyor; 1.5 uygulanınca varsayılan yol haline gelir.

- [ ] 1.5 ve 1.7 **birlikte** tasarlanıp birlikte deploy edilsin, ayrı ayrı değil.
- [ ] Negatif filtresi açıldığında `stokluOnly` otomatik kapansın (karşılıklı dışlayan filtreler).
- [ ] `durum='yetersiz'` seçildiğinde `stokluOnly` otomatik kapansın; imkânsız kombinasyon oluşmasın.
- [ ] Yarımamulde 84 kaydın 30'u negatif (%36) — bu filtre kozmetik değil, [[project_uc_uretim_modeli]] hasarının göstergesi. Filtre semptomu görünür kılar; **kök neden ayrı iş olarak açık kalıyor.**

> Müşteriye açıklanması gereken nokta: varsayılanlar istendiği gibi ayarlanırsa negatif kayıtlar ilk açılışta görünmez. Negatif filtresi bilinçli bir tıkla açılan bir "mod" olarak konumlanmalı.

---

### 🟠 R3 — `Üretimde` → `Üretiliyor`: yanlış anahtar iki modülü birden değiştirir

`tr.json` içinde `uretimde` **iki ayrı modülde** tanımlı:

- [tr.json:5296](admin_panel/src/locale/tr.json#L5296) → `uretimEmirleri.statuses.uretimde` — **değişecek olan bu.** Üretim emirleri rozeti bunu kullanıyor (`getDurumLabel`, [satır 674-676](admin_panel/src/app/\(main\)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx#L674-L676)).
- [tr.json:5117](admin_panel/src/locale/tr.json#L5117) → `satisSiparisleri.statuses.uretimde` — **Satış Siparişleri'ne ait, dokunulmayacak.** Üç ekranda kullanılıyor (liste, form, sipariş detayı).

*(Bu checklist'in ilk sürümünde "ikisi de güncellenmeli" yazıyordu; yanlıştı, düzeltildi.)*

- [ ] Yalnız `uretimEmirleri.statuses.uretimde` değiştirilsin.
- [ ] Değişiklik rozetle birlikte **durum filtresi açılırını** ve özet kartını da etkiler (aynı anahtar) — tutarlı, beklenen davranış; müşteriye böyle aktarılsın.
- [ ] DB'deki `durum` değeri `uretimde` olarak kalır; yalnız etiket değişir.

---

### 🟠 R4 — Grup anahtarı düzeltmesi: backend'de birebir kopyası var

1.1'in çözümü `mamulGrupKey` / `grupPlanlanan` mantığını değiştiriyor. Bu iki fonksiyon **iki yerde ayrı ayrı yazılmış** (DRY ihlali):

- `admin_panel/src/integrations/shared/erp/uretim_emirleri.types.ts` → `partiNo ?? "partisiz"` (çökmenin kaynağı)
- [backend/src/modules/_shared/mamul.ts](backend/src/modules/_shared/mamul.ts) → `partiNo`'yu **null olamaz** kabul ediyor, aynı `asimetrik_planlanan_miktar` hatasını fırlatıyor

Backend kopyası şu an **production kodunda hiçbir yerden çağrılmıyor** — sadece kendi testleri kullanıyor. İkinci tur değerlendirmede bunun anlamı netleşti: bu dosya **S3'teki köklü çözümün (server-side mamul gruplaması) yarım kalmış yapı taşı.** Biri gruplama mantığını backend'e taşımak için yazmış, hiç bağlamamış; gruplama client-side kalmış. Doğru hamle onu silmek değil, **bitirip bağlamak**.

Güvenlik teyidi (ikinci tur, canlı): `parti_no` dolu **tüm** gruplar tam 2 emirli ve `sag+sol` / `parca+sol` çiftleri — 3+ emirli veya aynı-taraf-mükerrer grup yok, asimetrik planlanan yok. Partisiz 42 emrin **tamamı `taraf=NULL`** → partisiz kovada gizli gerçek çift **yok**. Yani "partisiz → emir bazlı ayır" kök çözümü hiçbir gerçek çifti bölmez; kanıtlandı.

Ayrıca [mamul.test.ts:43](backend/src/modules/_shared/__tests__/mamul.test.ts#L43) throw davranışını test olarak koruyor — frontend'de throw kaldırılırken bu beklenti bilinçli güncellenmeli.

- [x] Null-parti kuralı iki kopyaya da eklendi; davranışlar eşitlendi, çapraz referans yorumlarıyla bağlandı (`partiNo: string | null`). *(commit `d4cd896` — fiziksel tek dosyaya indirme S3'ün server-side taşımasıyla birlikte yapılacak)*
- [ ] Hedef mimari: gruplamayı `_shared/mamul.ts` üzerinden **backend'de** yap (S3) — frontend kopyası zamanla emekliye ayrılır.
- [x] Backend testindeki throw beklentisi kasıtlı davranış değişikliği notuyla güncellendi; asimetri + partisiz ayrışma testleri eklendi. *(commit `d4cd896`)*

---

### 🟠 R5 — 1.3 ile 1.4 arasında sıralama bağımlılığı var

1.3, çift taraflılığı gösteren **tüm** işaretleri kaldırıyor: `ÇİFT TARAFLI` rozeti, `+1 taraf daha` yazısı ve makine bazlı alt kırılım.
1.4 ise bu bilgiyi açılır panele taşıyor.

1.3 tek başına önce giderse, arada kalan sürümde kullanıcı bir satırın tek emir mi yoksa birleştirilmiş iki emir mi olduğunu **hiçbir şekilde ayırt edemez** — ama satır hâlâ iki emri temsil ediyor olur. Silme, kapatma gibi işlemler görünmeyen ikinci emri de etkiler.

- [ ] 1.3 ve 1.4 **aynı deploy'da** çıksın; 1.3 tek başına gönderilmesin.
- [ ] Zorunlu olarak ayrılacaksa, `>` genişletme işareti (1.4'ün ilk maddesi) 1.3 ile birlikte gitsin — en azından "burada daha fazlası var" sinyali kalsın.

---

### 🟢 R6 — Fire sütunları: bugün zararsız, ileride aritmetik tutmaz

`yeterli` ve `fark` değerleri **fireli** miktardan hesaplanıyor: `fark = mevcutStok - gerekliMiktarFireli` ([repository.ts:251-256](backend/src/modules/stoklar/repository.ts#L251-L256)).

İki sütun kaldırılınca ekranda `Gerekli`, `Mevcut`, `Fark` kalır — ama `Fark ≠ Mevcut − Gerekli` olur, çünkü hesap fireli miktar üzerinden yapılır. Kullanıcı bunu hata sanar.

**Canlıda şu an risk yok:** 1.729 reçete kaleminin **tamamında** `fire_orani = 0`. Yani bugün `gerekliMiktarFireli == gerekliMiktar` ve sütunlar gerçekten gereksiz — müşteri haklı.

- [ ] Sütunlar kaldırılsın (istendiği gibi), ancak `gerekliMiktarFireli` alanı **backend'den sökülmesin** — `MalzemeBadge` tooltip'i kullanıyor ([satır 105-106](admin_panel/src/app/\(main\)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx#L105-L106)).
- [ ] Herhangi bir reçeteye fire oranı girildiği gün `Fark` sütunu açıklanamaz hale gelir — o noktada sütunların geri gelmesi gerekeceği not olarak bırakılsın.

---

### 🟢 R7 — Çökme düzelince altından ikinci bir yük çıkıyor

`MalzemeBadge` her satır için ayrı bir yeterlilik sorgusu atıyor ([satır 1094](admin_panel/src/app/\(main\)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx#L1094)). Sayfa boyu 25.

Şu an "Tamamlananları Göster" çöktüğü için kimse bu yolu kullanmıyor. 1.1 düzelince 122 tamamlanmış emir sayfalanabilir hale gelecek — her sayfada 25 eşzamanlı reçete patlatma sorgusu, üstelik **tamamlanmış emir için yeterlilik kontrolü anlamsız** (üretim çoktan bitmiş).

- [x] Tamamlanmış emirlerde `MalzemeBadge` sorgusu atlanıyor (`atla` prop), `—` gösteriliyor. *(commit `d4cd896`)*

---

## BÖLÜM 6 — Sistemik bulgular ve köklü çözüm planı (18 Ağustos, ikinci tur)

Açık maddelerin risk incelemesi sırasında, hiçbir yazılımcı notunda geçmeyen beş sistemik hata bulundu ve canlıda doğrulandı. Bunlar müşteri şikâyetlerinin **altında yatan** sorunlar — çözülmezlerse aynı notlar başka kılıkta geri gelir.

### 🔴 S1 — Stoklar ekranı 465 kaydın sessizce ilk 100'ünü gösteriyor

Frontend stok listesine `limit` göndermiyor → backend varsayılanı **100** ([validation.ts:20](backend/src/modules/stoklar/validation.ts#L20)). Ekranda **sayfalama yok**; kalan 365 kayıt hiçbir uyarı olmadan görünmez. Özet kartları da `items.length`'ten hesaplandığı için "Toplam" değeri gerçek toplam değil, ilk sayfanın uzunluğu.

Bunun zinciri önemli: müşterinin 1.7 isteği ("negatif olanları listeleyelim") büyük olasılıkla **bu yüzden** doğdu — negatif kayıtlar alfabetik sıralı ilk 100'ün içine düşmediği sürece ekranda hiç var olmuyorlar. Semptomun şikâyeti, hatanın kendisi değil.

- [ ] Stoklar listesine sayfalama ekle **veya** kategori varsayılanıyla birlikte limit'i bilinçli yükselt (max 500 zaten destekleniyor).
- [ ] Özet kartları `data.total`dan (server) beslensin, `items.length`ten değil.
- [ ] **1.5 + 1.7 + S1 tek paket** — negatif filtresi, tam listeye erişim olmadan yarım çözümdür.

### 🔴 S2 — Negatif stok tek hata değil, üç ayrı mekanizma (kök neden haritası)

46 negatif kaydın dağılımı üç farklı kaynağa oturuyor; **tek yamayla çözülemez**:

| Mekanizma | Kanıt | Etkilenen |
|---|---|---:|
| (a) Ambalaj YM'leri **bilinçli olarak** stok kapısı (gate) dışında | [service.ts:344-347](backend/src/modules/uretim_emirleri/service.ts#L344-L347) yorumu açıkça yazıyor: *"bu kalemler sistemde çoğunlukla negatif/takipsiz stokta olduğundan gate'e alınırsa montaj tümüyle bloke olur"* — tüketiliyor ama kısıtlamıyor → tasarım gereği eksiye düşüyor | yarımamul: **30** negatif (84 kaydın %36'sı) |
| (b) Inline üretim modeli — kod üçüncü modeli tanımıyor | Hafıza [[project_uc_uretim_modeli]]; canlıda `taraf='parca'` + montajlı tek operasyon 15 emir | operasyonel_ym: **5** negatif |
| (c) Sevk yolu mamulü eksiye düşürebiliyor | Rev4 kararı "sevkiyat -100" toleransı ([[project_rev4_decisions]]) | urun: **11** negatif |

Önemli tespit: montaj akışının kendisi **doğru yazılmış** — operasyonel YM + hammadde için `Math.floor(stok/perUnit)` kapısı var, eksiye düşürmez. Sorun kapının bilinçli delikleri (a) ve kapının hiç görmediği akışlar (b, c).

Köklü çözüm sırası:
- [ ] **Stok tutarlılık denetim aracı**: `hareketler` tablosu zaten her giriş/çıkışı kayıt altına alıyor (audit izi mevcut ve sağlam). Hareket defterinden yeniden hesaplanan stok ile `urunler.stok` karşılaştırılır; sapma raporlanır. Bu araç, aşağıdaki iki kararın etkisini de ölçülebilir kılar.
- [ ] **Ambalaj YM kararı müşteriyle netleştirilsin**: bu kalemler ya gerçekten sayılacak (satın alma/mal kabul ile beslenip gate'e girecek) ya da `stok_takip_aktif=0` yapılıp takipten çıkacak. Şimdiki ara durum — "tüket ama kısıtlama" — sonsuz negatif biriktirme makinesi.
- [ ] **Inline model tanınsın**: tüketim/üretim akışı `taraf='parca'` + montajlı tek operasyon desenini ayrı model olarak ele alsın. (Ayrı, orta boy iş — 1.7'deki filtre bunun yalnız göstergesi.)
- [ ] Sevk toleransı: -100 kuralı bilinçli bir karar; en azından negatife düşen sevklerde harekete `aciklama` ile iz bırakıldığı doğrulansın.

### 🟠 S3 — Emir çifti sayfa sınırında bölünebilir (gruplama yanlış katmanda)

Sağ/sol gruplaması **client-side**, sayfa başına 25 kayıt üzerinde yapılıyor; backend `created_at desc` sıralıyor. Çiftler aynı anda yaratıldığı için genelde bitişikler, ama **sayfa sınırı bir çifti ikiye bölebilir** — sağ taraf 25. sırada, sol taraf sonraki sayfada. O durumda çift, iki sayfada iki ayrı "tek emir" gibi görünür; üretilen/durum özetleri sessizce yanlış olur. 1.1 düzeltmesinden sonra bu artık çökme değil, **fark edilmeyen yanlış veri** olur — daha tehlikeli.

Köklü çözüm: gruplamayı backend'e taşı. [backend/src/modules/_shared/mamul.ts](backend/src/modules/_shared/mamul.ts) tam bunun için yazılmış ve hiç bağlanmamış (bkz. R4). Liste endpoint'i mamul grubu bazında sayfalarsa bölünme sınıf olarak yok olur.

- [x] Kısa vade (1.1 paketi içinde): sayfa sınırı çift bölerse "Eşi diğer sayfada" işareti gösteriliyor. *(commit `d4cd896`)*
- [ ] Orta vade: `_shared/mamul.ts` bitirilip liste endpoint'i grup bazında sayfalasın; frontend gruplama kodu kaldırılsın.

### 🟠 S4 — Plan aşımı gerçek ve yaygın; kırpma mantığı gizliyor

Canlıda üretilen > planlanan çok sayıda emirde var: UE-2026-0148 (794/690), 0152 (528/526), 0156 (2.176/2.000), 0077 (700/570). Mevcut yüzde `Math.min(100, …)` ile kırpılıyor — ekranda hepsi "%100" görünür, aşım kaybolur. Fazla üretim = fazla hammadde tüketimi; bunun görünmez olması stok sapmasını da (S2) besliyor.

- [ ] "Üretilen" sütunu (R1) ve 1.4 detay paneli aşımı olduğu gibi göstersin (794/690 → %115 veya "+104" rozeti).
- [ ] Kırpma yalnız progress bar genişliğinde kalsın; metinde gerçek değer yazsın.

### 🟠 S5 — Vardiya karşılaştırması montajlı emirde üretimi çift sayıyor

Hafızadaki bulgu ([[project_uc_uretim_modeli]]) bu incelemede mekanizmasıyla doğrulandı: `repoGetUretimKarsilastirma` ([repository.ts:804-830](backend/src/modules/uretim_emirleri/repository.ts#L804-L830)) operatör günlük kayıtlarını **operasyon ayrımı yapmadan** `SUM`'lıyor. Model B'de (tek emir: enjeksiyon + montaj) iki operasyonun kayıtları aynı `uretim_emri_id`de → aynı fiziksel üretim iki kez toplanıyor; `fark` alanı yanıltıcı.

- [ ] Toplama operasyon bazında ayrılsın veya yalnız üretim (montaj-olmayan) operasyonların kayıtları sayılsın; montaj ayrı satır olarak raporlansın.
- [ ] Model B'li bir emirle regresyon testi (UE-2026-0155 deseni).

---

### 🔴 S6 — Deploy script'i hem canlıyı düşürüyor hem de hiçbir şey deploy etmiyordu

**18 Ağustos akşamı canlı kesinti yaşandı; kök neden bulundu ve kapatıldı.**

`/root/bin/deploy-paspas` sunucu üzerinde `next build` çalıştırıyordu. 1.9 GB RAM'li makinede bu build sistemi kilitledi:

- OOM-killer önce **`mysqld`'yi öldürdü** (`dmesg`: `Killed process mysqld`) — systemd otomatik yeniden başlattı, veri kaybı yok.
- Yük 55'e çıktı, SSH ve HTTP yanıt veremez oldu; **panel + promats web ~25 dakika hizmet dışı kaldı.**

**Daha kötüsü — script zaten işe yaramıyordu.** PM2 uygulamaları `/var/www/paspas-runtime/current/admin/server.js` üzerinden çalışıyor; script ise `/var/www/paspas/admin_panel` içine build alıyordu. Yani o build **canlıya hiçbir zaman ulaşmıyordu**; makineyi bedavaya kilitliyordu. Canlı sürüm 14 Ağustos'tan beri `releases/20260814T215329Z-57414cccfe89` idi.

**Gerçek mekanizma** repoda zaten mevcut ve doğru tasarlanmış — build **yerelde** alınır, sunucuya yalnız artefakt gider:

| Adım | Script | Nerede |
|---|---|---|
| 1 | `scripts/deploy/build-release-artifact.sh HEAD` | **yerel** |
| 2 | `scp <artifact> vps-paspas:/tmp/` | yerel |
| 3 | `scripts/deploy/activate-release-artifact.sh <artifact>` | sunucu |
| geri alma | `scripts/deploy/rollback-atomic-release.sh` | sunucu |

Aktivasyon SHA256 doğrular, `current` symlink'ini atomik değiştirir, hata halinde önceki release'e otomatik döner.

- [x] `/root/bin/deploy-paspas` devre dışı bırakıldı — çalıştırılınca doğru yolu gösterip `exit 1` veriyor. Eski içerik `/root/bin/deploy-paspas.BOZUK-yedek-20260818` olarak duruyor.
- [x] Yarım kalan bozuk `.next` dizini (`BUILD_ID` boş) temizlendi.
- [x] [SERVER.md](SERVER.md) düzeltildi — yanlış deploy talimatı atomic release akışıyla değiştirildi, runtime yapısı belgelendi.
- [x] **Migration boşluğu tespit edildi:** atomic release script'lerinin **hiçbiri** `apply-paspas-migrations` çağırmıyor; migration'ı tetikleyen tek yer devre dışı bıraktığım eski script'ti. SERVER.md'ye elle çalıştırma uyarısı eklendi.
- [ ] Migration adımı `activate-release-artifact.sh` içine eklensin — elle adıma bağlı kalmasın.
- [ ] Depodaki `admin_panel/ecosystem.config.cjs` ve `backend/ecosystem.config.cjs` canlıyla uyuşmuyor (isim `paspas-admin`/`paspas-backend`, port 3078; canlıda `paspas-panel`/`paspas-api`). Canlının kullandığı `scripts/deploy/ecosystem.atomic.config.cjs` ile çelişen bu iki dosya ya güncellensin ya kaldırılsın — yanlış dosyaya bakıp yanlış işlem yapma riski var.

> **Ders:** Bu makinede prod build **asla sunucuda alınmaz**. Doğru araç repoda hazır dururken yanlış script'in çalıştırılabilmesi, kesintinin asıl sebebiydi.

---

## Önerilen çalışma sırası

*(Bölüm 5 risk analizi + Bölüm 6 sistemik bulgulara göre revize edildi.)*

1. **Paket 1 — 1.1 + R4 + R7 + S3-kısa**: Application Error kök çözümü (null-parti grup anahtarı, throw kaldırma, ErrorBoundary), backend kopyasıyla tek kaynak, tamamlanmış emirde yeterlilik `skip`, sayfa-bölünme işareti. Regresyon testli.
2. **Paket 2 — 1.2 + 1.6 + 1.8**: izole ve risksiz üçlü; hızlı görünür kazanç.
3. **Paket 3 — 1.5 + 1.7 + S1**: stok paketi. Sayfalama/limit + server-side özet + negatif filtresi + varsayılanlar, filtre çelişkisi çözülmüş halde. **Üçü ayrılamaz** — S1 olmadan negatif filtresi yarım kalır.
4. **Paket 4 — 1.3 + 1.4 + R1 + R3 + S4**: üretim emirleri ekran yenilemesi. Satır sadeleştirme + detay paneli + üç kurallı "Üretilen" hesabı + tek locale anahtarı + aşım gösterimi. En büyük iş kalemi.
5. **S5 — vardiya çift sayımı**: bağımsız backend düzeltmesi; herhangi bir pakete paralel gidebilir.
6. **S2 — negatif stok kök çözümü**: tutarlılık denetim aracı → ambalaj YM kararı (müşteri) → inline model tanıma. Ayrı yol haritası; 1.7'nin filtresi bu iş bitene kadar "gösterge paneli" görevi görür.
7. **Fuar `6b742dc1` + `092f9305`** (PDF/Excel çıktıları) — Bölüm 2'deki 4 kritik maddeyi açan anahtar.
8. **CRM ve Web** — teknik iş değil, karar bekliyor; müşteriyle netleştirilecek.

**Müşteriye önceden söylenmesi gerekenler:**
- (a) "Üretilen" sütunu toplam değil montaj/takım adedi olacak; montajsız çift taraflılarda tam çift sayısı gösterilecek (R1).
- (b) Stok varsayılanları açılınca negatif kayıtlar ilk ekranda görünmeyecek; negatif filtresi bilinçli açılan bir mod (R2).
- (c) Stok ekranı bugüne kadar kayıtların yalnız ilk 100'ünü gösteriyordu; düzeltmeyle liste tamamlanacak, özet sayıları değişecek — bu bir veri değişikliği değil, görünürlük düzeltmesi (S1).
- (d) Ambalaj yarımamullerinin stok takibi için karar gerekiyor: ya gerçekten sayılacak ya takipten çıkacak (S2a).

## Kapatma prosedürü

Her madde bitince ilgili thread'e `message_type='solution'` yorumu eklenir (müşteriye **siz** diliyle), ardından `status='resolved'` yapılır. MySQL çağrılarında `--default-character-set=utf8mb4` kullanılır.
