# Yazılımcı Notu V19 — 🔴 Makineden çıkarma ER_DUP_ENTRY (kanıtlı) + vardiya çifti spec netleşmesi + operatör giriş UI

> **İnceleme:** 2026-07-16 — Claude canlı DB + canlı PM2 logları + kod + 5 açık yazılımcı notu.
> **Analiz aşaması.** Kod değiştirilmedi, deploy yapılmadı.
> **Canlı deploy durumu:** `/var/www/paspas` HEAD = `444d528` (V18 + vardiya fix'leri canlıda).
> **Bugün yapılan veri operasyonu (bağlam):** Müşteri talebiyle UE-2026-0095/0096 tam silindi;
> 0099, 0100, 0102–0112 arası 13 emir iki "900 T" makinesinden manuel SQL ile çıkarıldı
> (`scripts/uretim-silme-20260714.sql`, `scripts/on-makine-cikarma-20260714.sql`, yedekler VPS `~/db-yedek/`).
> Müşterinin bunu UI'dan yapamamasının nedeni aşağıdaki **R1** bug'ıdır.

---

## Açık notlar → kök neden

| Thread | Sayfa | Konu | Kök | Durum |
|---|---|---|---|---|
| `10caa4b3` | uretim-emirleri | "Makineden Çıkar" hata veriyor | **R1 — KANITLI** | V19 ana iş |
| `83d7e393` | vardiya-analizi | Vardiya çifti 3 vardiya gösteriyor (10 Tem) | **R2** | V17 sonrası hâlâ açık |
| `fd541ef6` | vardiya-analizi | Vardiya çifti = önceki iki vardiya (13 Tem) | **R2** | Spec netleşti |
| `fe149b76` | operator | Günlük üretim girişinde çift vardiya sorusu | **R3** | V19 |
| `3536f365` | uretim-emirleri | Düzeltme ekranı yeniden tasarım | **R4** | V18 sonrası doğrulama |
| `5e200728` | uretim-emirleri | 0095/0096 silinsin | — | ✅ Kapatıldı (2026-07-16, manuel SQL) |

---

# 🔴 R1 — Makineden çıkarma: `sira - 1` toplu güncellemesi unique kısıta çarpıyor

## Kanıt (canlı log, `~/.pm2/logs/paspas-backend.out.log`)

Aynı hata 13 Tem 15:50, 14 Tem 08:31 (×2) ve 14 Tem 12:39'da tekrarlanmış:

```
"query": "update `makine_kuyrugu` set `sira` = `makine_kuyrugu`.`sira` - 1
          where (`makine_kuyrugu`.`makine_id` = ? and `makine_kuyrugu`.`sira` > ?)"
"cause": { "code": "ER_DUP_ENTRY",
  "message": "Duplicate entry '08f106ba-...-42' for key 'makine_kuyrugu.uq_makine_kuyrugu_makine_sira'" }
```

## Mekanizma

`repoKuyrukCikar` — `backend/src/modules/makine_havuzu/repository.ts:567-570`:

```ts
await tx.update(makineKuyrugu)
  .set({ sira: sql`${makineKuyrugu.sira} - 1` })
  .where(and(eq(makineKuyrugu.makine_id, affectedMakineId), sql`${makineKuyrugu.sira} > ${row.sira}`));
```

- `uq_makine_kuyrugu_makine_sira (makine_id, sira)` **UNIQUE**.
- MySQL çok satırlı UPDATE'te unique kontrolünü **satır satır, tarama sırasına göre** yapar. PK UUID (rastgele)
  olduğu için tarama sırası deterministik değil: 43→42 güncellenirken eski 42 henüz taşınmadıysa → `ER_DUP_ENTRY`.
- **Bu yüzden aralıklı (flaky) bug:** kuyruk kısayken/şanslı sırada çalışıyor, uzun kuyrukta patlıyor.
  Müşterinin makinelerinde 50+ tamamlanmış kuyruk kaydı birikmiş durumda → artık neredeyse hep patlıyor.
- Transaction rollback yaptığı için veri bozulmuyor; ama işlem **hiç** tamamlanamıyor.
- **Aynı dosya bu tuzağı biliyor:** `repoKuyrukSirala` (satır ~640) önce tüm sıraları `+10_000` offset'e
  taşıyıp sonra gerçek değere yazıyor. `repoKuyrukCikar` bu korumadan yoksun.

## İkincil kusur — hata müşteriye "sebepsiz" görünüyor

`uretim-emirleri-client.tsx:627-628`: catch bloğu hatayı yutup sabit
"Makineden çıkarma sırasında hata oluştu." basıyor. Backend 500 gövdesindeki mesaj hiç gösterilmiyor;
müşteri de "hata mesajı alıyorum" deyip ekran görüntüsü atmak zorunda kalıyor.

## VERİLMİŞ KARAR — R1

| # | Karar | Gerekçe |
|---|---|---|
| **K1** | Kaydırma güncellemesi **`ORDER BY sira ASC`** ile yapılır: `UPDATE makine_kuyrugu SET sira = sira - 1 WHERE makine_id = ? AND sira > ? ORDER BY sira ASC`. Drizzle update'te ORDER BY yoksa `tx.execute(sql\`...\`)` ile ham SQL kullanılır. Alternatif kabul edilir çözüm: `repoKuyrukSirala`'daki iki fazlı offset kalıbı. | Artan sırada güncellemede her satır bir önceki satırın boşalttığı yere taşınır — çakışma matematiksel olarak imkânsız. Tek statement, transaction içinde kalır. |
| **K2** | Aynı audit tüm `sira` mutasyonlarına uygulanır: `makine_havuzu/repository.ts` içinde `sira` yazan **her** sorgu taranır (`insertSira` hesaplama, araya ekleme, çıkarma, sıralama). Unique kısıtla yarışan başka toplu güncelleme varsa aynı kalıba çekilir. | Aynı sınıf hatanın başka yüzeyde tekrar bildirilmesini önler. |
| **K3** | Client catch bloğu backend hata mesajını gösterir: `error?.data?.error?.message` varsa toast'a eklenir (TR karşılık haritasıyla). Genel mesaj yalnızca fallback olur. | Bir dahaki hatada teşhis ekran görüntüsüne muhtaç kalmasın. |
| **K4** | Regresyon testi: aynı makinede ≥4 kayıtlık kuyruk kur, **ortadan** bir kaydı çıkar, kalan sıraların `1..N` kesintisiz olduğunu ve `ER_DUP_ENTRY` alınmadığını doğrula. İkinci test: art arda iki çıkarma (müşterinin gerçek senaryosu). | Bug flaky olduğu için testin bilinçli olarak çakışma üretecek dizilimle kurulması şart. |

### R1 görevleri

- [x] `repoKuyrukCikar` sira kaydırması ORDER BY'lı ham SQL'e (veya iki fazlı offset'e) çevrildi — `backend/src/modules/makine_havuzu/repository.ts:567-570`
- [x] `sira` yazan diğer sorgular audit edildi, riskli olanlar aynı kalıba çekildi (K2)
- [x] Client toast backend mesajını gösteriyor (K3) — `admin_panel/.../uretim-emirleri-client.tsx:622-631` ve `makine-kuyruklar-tab.tsx` + `makine-montaj-planlama.tsx`'teki eş kullanımlar
- [x] K4 testleri yazıldı (ortamda DB bağımlılıkları kurulduğunda çalıştırılacak)
- [ ] Canlıda müşteri senaryosuyla doğrulandı (bekleyen bir emri UI'dan makineden çıkar)

---

# 🟠 R2 — Vardiya çifti: müşteri spec'i netleşti, uygulama hizalanacak

İki not aynı konu; 13 Tem notu (`fd541ef6`) beklenen davranışı **kesin** tanımlıyor:

> Vardiya çifti seçiliyken, **içinde bulunulan vardiyadan önceki iki vardiya** gösterilmeli.
> - Örnek 1: 17/07 Cuma gündüz vardiyasında bakan kullanıcı → **16/07 gündüz** + **16/07→17/07 gece**.
> - Örnek 2: 13/07 Pazartesi gündüz; hafta sonu çalışılmamış → **10/07 gündüz** + **10/07→11/07 gece**.
>   (Çalışılmayan hafta sonu vardiyaları atlanır — "en son çalışılan iki vardiya".)

10 Tem notu (`83d7e393`) semptomu veriyor: çift seçiliyken makine başına **üç** vardiya geliyor.
V17 çeklisti + `444d528` fix'i canlıda olmasına rağmen not açık → ya davranış hâlâ yanlış ya da
müşterinin istediği "önceki iki vardiya" kuralı hiç bu şekilde tanımlanmamıştı.

## VERİLMİŞ KARAR — R2

| # | Karar | Gerekçe |
|---|---|---|
| **K5** | "Vardiya çifti" seçiminin tanımı: referans an = **şimdi** (kullanıcının baktığı an). Aktif vardiya belirlenir; gösterilecek pencere = aktif vardiyadan **geriye doğru en son tamamlanmış/çalışılmış iki vardiya slotu**. Çalışılmayan slotlar (hafta sonu planı yok, tatil, makine kapalı aralığı) **atlanır**. | Müşterinin iki örneği birebir bu kuralı tarif ediyor. |
| **K6** | Kural tek yerde yaşar: mevcut vardiya penceresi yardımcı fonksiyonuna (V16/V17'de kurulan slot ekseni) `sonIkiCalisilanSlot(now)` eklenir; hem vardiya-analizi endpoint'i hem UI aynı fonksiyonu kullanır. Makine başına üçüncü vardiyanın sızdığı yol bulunur (muhtemelen slot sınırı ± devir çakışması) ve teste bağlanır. | DRY + V16'daki determinizm ilkesi. |
| **K7** | Test matrisi müşteri örnekleriyle kurulur: (a) hafta içi ardışık gün, (b) pazartesi + çalışılmayan hafta sonu, (c) hafta sonu planı OLAN hafta, (d) gece vardiyası saatlerinde bakış. Dört durumda da tam **2** slot döner. | Spec artık örnekli — testler örneklerin kendisi olmalı. |

### R2 görevleri

- [x] Mevcut davranış kodda reprodüke edildi: çift modu tarih penceresindeki tüm gerçek/sentetik slotları makine başına sınırlamadan yayıyordu
- [x] `sonIkiCalisilanSlot` (veya eşdeğeri) tek fonksiyon olarak yazıldı/mevcut fonksiyon buna evrildi
- [x] Vardiya-analizi ekranı çift seçiminde bu fonksiyonu kullanıyor; makine başına slot sayısı ≤ 2
- [x] K7 test matrisi yazıldı ve geçiyor
- [ ] Müşteri doğrulaması sonrası `83d7e393` + `fd541ef6` kapatılacak

---

# 🟠 R3 — Operatör günlük üretim girişi: mükerrer vardiya sorusu + mobil tasarım

Not `fe149b76` (13 Tem):

- "Bu üretim hangi vardiyaya ait?" altında **tarih+vardiya** soruluyor; hemen altında **gece/gündüz ayrımı bir daha** soruluyor → biri kaldırılacak.
- Kalacak olan: **tarihle birlikte vardiya seçimi**, yanında saat GÖSTERİLMEDEN.
- Butona basıldığı anda **aktif olan vardiyanın tarihi default** gelmeli.
- Vardiya seçim butonu **daha belirgin ve mobil uyumlu** olmalı.
- Aynı tasarım **BİTİR** ve **DURAKLAT** ekranlarına da uygulanacak.

## VERİLMİŞ KARAR — R3

| # | Karar | Gerekçe |
|---|---|---|
| **K8** | Tek vardiya seçici bileşen: `VardiyaSecici` (tarih + vardiya tipi tek kontrol, saat göstermez). Üretim girişi, BİTİR, DURAKLAT üçü de aynı bileşeni kullanır; ekranlardaki ikinci gece/gündüz sorusu kaldırılır. | Mükerrerlik tek bileşenle kökten çözülür; üç ekran ıraksayamaz. |
| **K9** | Default değer: `now` → aktif vardiya slotu (R2'deki aynı slot fonksiyonundan türetilir; gece devrinde tarih, vardiyanın **başladığı** gün olur). | Operatör gece 02:00'de girişte doğru (önceki gün başlangıçlı) vardiyayı görmeli. |
| **K10** | Mobil: seçici min 44px dokunma hedefi, tam genişlik, belirgin (primary token'lı) buton. Operatör ekranı zaten sahada telefonla kullanılıyor. | Müşterinin açık isteği. |

### R3 görevleri

- [x] `VardiyaSecici` ortak bileşeni yazıldı (`admin_panel/src/app/(main)/admin/operator/_components/`)
- [x] Üretim girişi ekranındaki mükerrer gece/gündüz alanı kaldırıldı
- [x] BİTİR ve DURAKLAT akışları aynı bileşene geçirildi
- [x] Default aktif vardiya + gece devri `acikVardiyaId`/`baslangic` üzerinden uygulandı (K9)
- [x] Mobil kuralları uygulandı (tam genişlik, en az 44px dokunma hedefi, tema token'ları)

---

# 🟡 R4 — Düzeltme ekranı (3536f365): V18 sonrası kapsam doğrulaması

Müşterinin tarif ettiği ekran (özet): Düzelt → emrin **ürün grubu** açılır; o gruba ait siparişler,
kaleminden **daha önce ne kadar aktarıldığı** ile listelenir; kalan miktardan istenen kadar aktarılır;
manuel üretim eklenebilir; her şey **mevcut partiyi** günceller, yeni parti açmaz, başka partileri etkilemez;
siparişte olmayan kalem manuel eklenebilir; yeni sipariş kalemi partiye eklenebilir.

V18 (`3de806c`) tam da bu altyapıyı getirdi: mamul+taraf kalıcılığı, transaction, **miktar bazlı tahsis**.
Ancak müşteri notu V18 deploy'undan sonra da açık. Önce **doğrula**, sonra gerekirse tamamla:

### R4 görevleri

- [x] Canlıda Düzelt akışı müşteri tarifiyle madde madde karşılaştırıldı — tablo aşağıda
- [x] Eksik maddeler V19 kapsamında implement edildi (R4-a/b/c; V20'ye taşınan yok)
- [ ] Müşteri doğrulaması sonrası `3536f365` kapatılacak

## Kapsam doğrulaması — müşteri tarifi ↔ mevcut kod

Kaynak: `page_feedback_threads` `3536f365-bf8c-4091-85ef-d5652ea229c6` (2026-07-10 12:55, `status=open`),
müşterinin kendi metni. Düzelt ekranı ayrı dosya değil: **`UretimOlusturGrid`** (`uretim-emirleri-client.tsx:116-438`)
`mod="duzenle"` ile açılıyor (buton `:1101-1110`, dialog `:1171-1187`). Yani "oluştur ekranındaki gibi olsun"
isteği zaten **aynı bileşen** kullanılarak karşılanmış.

| # | Müşteri maddesi | Durum | Kanıt |
|---|---|---|---|
| 1 | Düzelt → emrin ürün grubu açılmalı | ✅ Karşılanıyor | Grup `Select` `:258-280`; prefill `emri.mamulUrunId`→`altGrup` `:156-167` |
| 2 | Oluştur ekranındaki gibi grubun siparişleri listelenmeli | ✅ Karşılanıyor | Aynı bileşen; `filteredRows` `:169-172`, tablo `:291-367` |
| 3 | Daha önce ne kadar aktarıldığı görünmeli | ✅ Karşılanıyor | "Aktarılan" kolonu `:300`, `row.aktarilanMiktar` `:343-345`; backend `SUM(uesk.miktar)` `satis_siparisleri/repository.ts:592-598` |
| 4 | Kalandan istenen kadar aktarılabilmeli (2000→1000 aktarılmış→kalan 1000) | ✅ Karşılanıyor | `kalan()` düzelt modunda `kalanMiktar + aktarilanMiktar` `:179-184` (kendi tahsisini geri ekler) |
| 5 | Manuel üretim ekle butonu aktif olmalı | ⚠️ Buton var, **işlevsiz** | Buton `:375-385`; `manuelEmirler` `:207-209` hesaplanıyor ama `updateMamul` payload'ında **yok** `:225-230` |
| 6 | Mevcut partiyi güncellemeli, yeni parti açmamalı, başkasını etkilememeli | ✅ Karşılanıyor | `updateMamulEmri` `service.ts:47-176`; `parti_no + mamul_urun_id` ile mevcut emri bulur `:64-68`, yoksa 404; tümü transaction `:55` |
| 7 | Siparişteki kalem (hiç aktarılmamış olsa bile) eklenebilmeli | ✅ Karşılanıyor | `filteredRows` gruptaki tüm `kalan>0` satırları listeler, `emri.siparisKalemIds` ile sınırlı değil `:169-172`; V18'de `uretimDurumu:"beklemede"` filtresi kaldırıldı `:129-134` |
| 8 | Siparişte olmayan manuel eklenebilmeli/düzeltilebilmeli | ❌ **Eksik** | Madde 5'in sonucu — manuel satır partiye emir olarak eklenmiyor |
| 9 | Yeni sipariş kalemleri partiye eklenebilmeli | ✅ Karşılanıyor | Madde 7 ile aynı yol; `siparisTahsisleri` yeniden yazılıyor `service.ts:106-119` |
| 10 | Görseldeki ekrana benzesin, ama mevcut parti üzerinde düzeltsin | ⚠️ Kısmen | Aynı bileşen olduğu için düzen aynı; ancak başlık `<h2>` düzelt modunda da **"Yeni Üretim Oluştur"** yazıyor `:254` (dialog başlığı doğru: "Üretimi Düzelt") |

### Sonuç: 7/10 karşılanıyor, 1 eksik + 2 kusur

V18 altyapısı müşterinin istediğinin büyük kısmını getirmiş. Notun hâlâ açık olmasının somut sebebi
**madde 5+8**: manuel üretim ekleme düzelt modunda sessizce çalışmıyor.

**R4-a — Manuel üretim düzelt modunda çalışmıyor (asıl kusur)**
`handleAktar` düzelt dalında manuel satırların miktarını `planlananMiktar`'a ekliyor (`:219`, `:224`) ama
satırların kendisini göndermiyor. Sonuç: kullanıcı manuel ürün ekler, "güncellendi" toast'ı görür, ama
o ürün için emir açılmaz — sadece mevcut mamulün planlanan miktarı şişer. **Sessiz veri hatası**, hata mesajı yok.
Backend de kabul etmiyor: `mamulMiktarPatchSchema` `controller.ts:146-154` `manuelEmirler` alanı içermiyor.
→ Düzeltme: şemaya `manuelEmirler` eklenmeli, `updateMamulEmri` bunları mevcut `parti_no` altında emir olarak
açmalı (yeni parti **açmadan** — madde 6 korunmalı).

**R4-b — Düzelt modunda başlık yanlış**
`:254` `<h2>` sabit "Yeni Üretim Oluştur". Kullanıcı düzeltme yaptığını ekranın içinde göremiyor. Tek satır.

**R4-c — Düzeltme sonrası sipariş listesi cache'i tazelenmiyor**
`updateMamulUretimEmriAdmin` `invalidatesTags`'inde `SatisSiparisleri`/`ISLEMLER` yok
(`uretim_emirleri_admin.endpoints.ts:94-98`). Düzeltmeden sonra "Aktarılan" kolonu eski değeri gösterir.
Müşteri bunu "düzeltmem kaydedilmedi" diye algılayabilir.

> **Kapsam kararı:** R4-a gerçek bir veri hatası, R4-b/R4-c tek satırlık. Üçü de V19 kapsamında kalır,
> V20'ye taşınmaz. R4-a'nın `updateMamulEmri`'ye dokunması gerekiyor — şema değişikliği **gerekmiyor**,
> mevcut `uretim_emirleri` + `uretim_emri_siparis_kalemleri` yapısı yeterli.

### R4 çözümü (uygulandı)

- **R4-a** — `mamulMiktarPatchSchema`'ya `manuelEmirler` eklendi (`uretim_emirleri/controller.ts`);
  `updateMamulEmri` commit olduktan sonra her manuel satır `repoCreate` ile **mevcut `partiNo` altında**
  emir olarak açılıyor (yeni parti yok → madde 6 korunuyor). Frontend `manuelEmirler`'i gönderiyor ve
  **`planlananMiktar`'a artık eklemiyor** — ayrı emir olarak açıldıkları için eklenirse çift sayım olurdu.
  Toast eklenen manuel emir sayısını söylüyor.
- **R4-b** — `<h2>` başlığı `mod`'a göre "Üretimi Düzelt" / "Yeni Üretim Oluştur".
- **R4-c** — `updateMamulUretimEmriAdmin` `invalidatesTags` üretime aktarma ile aynı 7 tag'e hizalandı.

**Atomiklik notu (bilinçli karar):** manuel emirler `updateMamulEmri` transaction'ının **dışında**,
commit sonrası açılıyor. Sebep: `repoCreate` global `db` kullanıyor ve çağırdığı
`autoPopulateOperasyonlar` / `rezerveHammaddeler` / `refreshSiparisDurum` transaction parametresi almıyor.
Tam atomiklik bu ortak fonksiyonların refactor'ünü gerektirirdi — üretime aktarma yolunu da etkilerdi.
Üretime aktarma akışı zaten manuel emirleri aynı şekilde (transaction'sız, sıralı `repoCreate`) açıyor
(`satis_siparisleri/controller.ts:298-310`), yani risk profili değişmedi, iki yol artık **aynı desende**.
Bu refactor gerekirse V20 konusudur; R4'ü bloke etmiyor.

**Doğrulama:** backend `tsc --noEmit` exit 0; admin_panel `next build` exit 0 (47/47 sayfa);
`bun test` 434 pass / 13 fail — 13 fail temel commit `432349b` ile birebir aynı (DB kimlik bilgisi
eksikliğinden, V19 ile ilgisiz). Canlıda müşteri senaryosuyla test **edilmedi** — üretim verisine
gerçek emir yazacağı için müşteri onayına bırakıldı.

---

## Sıralama ve kapanış

1. **R1** (bug, müşteri operasyonunu bloke ediyor — bir sonraki deploy'a mutlaka girer)
2. **R3** (küçük/orta UI işi, operatörün günlük akışını düzeltir)
3. **R2** (spec netleşti; V17 altyapısı üstünde hizalama)
4. **R4** (önce doğrulama, sonra karar)

Deploy sonrası her not için müşteri doğrulaması alınıp ilgili `page_feedback_threads` kaydı
`resolved` yapılır (`5e200728` örneğinde olduğu gibi).

> **Codex için:** implementasyon başlamadan önce bu dosya okunur; her R bloğundaki VERİLMİŞ KARAR
> tablosu bağlayıcıdır. `AGENTS.md` kuralları geçerli. ALTER yasak — şema değişikliği gerekmiyor zaten.
