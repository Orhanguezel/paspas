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

- [ ] Canlıda Düzelt akışı müşteri tarifiyle madde madde karşılaştırıldı (hangi maddeler V18'le karşılanıyor, hangileri eksik — tablo halinde bu dosyaya işlenecek)
- [ ] Eksik maddeler V19 kapsamında implement edildi **veya** ayrı V20 çeklistine taşındı (kapsam büyürse)
- [ ] Müşteri doğrulaması sonrası `3536f365` kapatılacak

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
