# ÇEKLİST — Yazılımcı Notları (2026-07-22)

> Kaynak: canlı `promats_erp` DB `page_feedback` (status=open, 2026-07-22).
> Mimar: Claude Code (kök neden + dosya:satır tespiti). Uygulayıcı: **Codex**.
> Kök: `/home/orhan/Documents/Projeler/paspas` (backend = Fastify/Drizzle, admin_panel = Next.js 16 + RTK Query).
>
> **Kural (../CLAUDE.md):** Şema değişikliği ALTER ile değil `src/db/seed/sql/0XX_*.sql` içinde `CREATE TABLE`e kolon ekleyip `db:seed:*:fresh` ile. Bu partide şema değişikliği YOK — hepsi kod/mantık düzeltmesi.
> Her madde çözülünce ilgili `page_feedback_threads` thread'ine `message_type='solution'` yorum eklenip `status='resolved'` yapılacak (müşteriye **siz** diliyle). Bu adımı Codex DEĞİL, deploy sonrası Claude yapacak.

Not: "Makine ve montaj planlama hatası" (UP-2026-0022, `/admin/uretim-emirleri`) notu müşteri tarafından **iptal edildi** ("Sorun burada değil, bunu dikkate almayalım. Operatör ekranında sorun var"). Bu yüzden çekliste alınmadı; gerçek sorun Madde 3.

---

## 1) Vardiya Analizi — mavi "Açıklamalar" bloğu kaldırılacak

**Not (report):** "Mavi şeritler üzerinde yazan açıklama bloğunu tamamen kaldıralım. Bu açıklamaya gerek yok."

**Nerede:** `admin_panel/src/app/(main)/admin/vardiya-analizi/_components/vardiya-analizi-client.tsx`
Blok = `MontajUretimInfo` bileşeni. Ekranda mavi şerit içinde: _"Montaj üretimi: 1.618 adet (net üretime dahil; kalıplı montaj operasyonları baskı sayıldığı için verimliliğe de girer)"_ + altında chip'ler (ör. "Profesyonel Siyah Aramamul Sol · 520 · 1110-L").

- Bileşen tanımı: **satır 1101–1126** (`border-sky-200 bg-sky-50 text-sky-900` mavi kutu + "Montaj üretimi…" metni + chip Badge'leri).
- Ekrana basan 4 çağrı: **satır 944, 967, 1405, 1543** (`<MontajUretimInfo montaj={…} />`).

**Yapılacak (Codex):**
- [x] 944, 967, 1405, 1543 satırlarındaki 4 `<MontajUretimInfo .../>` kullanımını kaldır.
- [x] Kullanılmayan `MontajUretimInfo` tanımını (1101–1126) sil.
- [x] Artık kullanılmayan importlar/prop'lar varsa temizle (Biome/tsc uyarısı bırakma). Backend `montajUretim` alanı kalabilir (görsel etki yok, dokunma).

**Doğrulama:** Vardiya analizi ekranında hiçbir kartta/vardiya başlığında mavi açıklama şeridi görünmemeli; tablo ve metrikler aynı kalmalı.

---

## 2) Vardiya Analizi — "Ürün" sütununda yarımamul adı görünüyor (mamul gelmeli)

**Not (report):** "Ürün adı gelmesi gereken yere yarımamul ya da operasyon adı geliyor."
Örnek: doğru "**ORBITAL KROM KARBON · 1116 211**", görünen "Orbital Karbon Aramamul Sağ · **1116 211-R**" (yarımamul stok kodu `-R`/`-L` ekli).

**Kök neden:** `backend/src/modules/vardiya_analizi/repository.ts`
- **Satır 66:** `.innerJoin(urunler, sql\`${uretimEmirleri.urun_id} = ${urunler.id}\`)` — ürün adı **`uretim_emirleri.urun_id`** üzerinden çözülüyor. İnline/çift taraflı üretimde `urun_id` = **yarımamul** (operasyonel_ym). Bu yüzden `-R/-L` ekli yarımamul adı düşüyor.
- **Satır 39–41:** `urunId/urunKod/urunAd` bu (yanlış) `urunler` join'inden seçiliyor.

**Doğru kolon zaten var:** `uretim_emirleri.mamul_urun_id` (notNull) = bitmiş **mamul** ürün.
- Şema: `backend/src/modules/uretim_emirleri/schema.ts:25` (`mamul_urun_id`).
- Referans doğru desen (Üretim Emirleri modülü mamulü doğru çözüyor): `backend/src/modules/uretim_emirleri/repository.ts:31` `alias(urunler,'mamul_urunler')`, `:544/:569` `.leftJoin(mamulUrunler, eq(uretimEmirleri.mamul_urun_id, mamulUrunler.id))`, `mamulAd: mamulUrunler.ad`.

**Yapılacak (Codex):**
- [x] `vardiya_analizi/repository.ts` içinde `mamulUrunler = alias(urunler, 'mamul_urunler')` tanımla.
- [x] `.leftJoin(mamulUrunler, sql\`${uretimEmirleri.mamul_urun_id} = ${mamulUrunler.id}\`)` ekle.
- [x] Satır 39–41'deki `urunId/urunKod/urunAd`'ı **`mamulUrunler.id/kod/ad`**'dan seç.
- [x] **DİKKAT:** Satır 62 `operasyonTipi: urunler.operasyon_tipi` operasyon tipi için hâlâ `urun_id` (yarımamul) join'ine bağlı — o join'i KALDIRMA, sadece ürün adının kaynağını mamula çevir. Yani iki join birlikte kalır: `urunler` (urun_id, operasyon_tipi için) + `mamulUrunler` (mamul_urun_id, ürün adı için).
- [x] `mamul_urun_id` notNull olduğu için `leftJoin` yerine mevcut `innerJoin` deseni de olur; ama satır kaybı riskine karşı `leftJoin` + fallback (mamul boşsa yarımamul adı) tercih edilebilir.

**Veri akışı (değişiklik gerekmez, sadece bilgi):** `repository.ts:97-99` → `core.ts:23-25,304-311,352` → `service.ts:603-605,897-898` → DTO `urunAd/urunKod`. Frontend (`vardiya-analizi-client.tsx:995-996`) backend'den geleni basıyor, dokunma.

**Doğrulama:** Vardiya analizi tablosunda "Ürün" sütununda mamul adı ("ORBITAL KROM KARBON · 1116 211") görünmeli; "Operasyon" sütunu ("Orbital Karbon Aramamul Sağ") değişmeden kalmalı.

---

## 3) Operatör Ekranı — makine iş yüklerinde görünen üretimler "Sıradaki İşler"de yok

**Not (report):** İşaretlenen üretimler (UE-2026-0119, 0123, 0125, 0121 — Orbital Krom, **Montaj**, SOL) Makine İş Yükleri'nde görünüyor ama operatör ekranı "Sıradaki İşler"de görünmüyor.

**Kök neden:** Endpoint 500 DEĞİL (canlı log 07-22: `/operator/kuyruk` → 200 × 53). Sorun bir **görünürlük bayrağı farkı**:

| Ekran | Dosya:Satır | Temel WHERE |
|---|---|---|
| Operatör "Sıradaki İşler" | `backend/src/modules/operator/repository.ts:970` (`repoListMakineKuyrugu`) | `eq(makineler.operator_de_goster, 1)` |
| Makine İş Yükleri | `backend/src/modules/is_yukler/repository.ts:188` | `eq(makineler.is_yuklerinde_goster, 1)` |

İki sorgu **aynı `makine_kuyrugu` tablosundan, aynı `makine_id` join'iyle** okuyor; tek fark makinenin görünürlük bayrağı. `operator_de_goster` ve `is_yuklerinde_goster` ayrı sütunlar (`backend/src/modules/makine_havuzu/schema.ts:11-12`).

**Neden montaj emirleri düşüyor:** Makine/montaj atama (`backend/src/modules/makine_havuzu/repository.ts:405-541`, `repoAtaOperasyon`): kuyruk satırı **her zaman** `makine_id: makineId` ile eklenir (`:505-516`); montaj seçilince `montaj_makine_id` yalnız operasyon kaydına yazılır (`:497`), **`montaj_makine_id` için ayrı kuyruk satırı OLUŞTURULMAZ**. Görünmeyen emirlerin kuyruk satırı, planlamada seçilen makineye bağlı — büyük olasılıkla `operator_de_goster=0` olan bir "Montaj" makinesi. Aynı bayrak `repoGetAcikVardiyalar`'da da uygulanıyor (`operator/repository.ts:2453` ve `:2503`).

**Karar gerektiren nokta (Codex bunu netleştirsin, gerekirse iki seçenekten birini uygula):**
- [x] **Önce teşhis:** Görünmeyen UE-2026-0119/0121/0123/0125 kuyruk satırlarının bağlı olduğu makinenin `operator_de_goster` değerini kontrol et (canlı DB veya lokal repro). Sonuç: dört emirde de değer `1`; ilk kök neden varsayımı doğrulanmadı.
- [ ] **Seçenek A (veri/konfig — kod değişikliği yok):** İlgili montaj makinesinin `operator_de_goster` bayrağını 1 yap. UI: `/admin/makine-havuzu` formu switch (`makine-form.tsx:448`) → `makine_havuzu/repository.ts:67` → `makineler.operator_de_goster`. **Bu, iş kuralı "montaj makinesi operatörde görünmesin" ise yanlış olur.**
- [ ] **Seçenek B (kod — montaj işleri her zaman operatöre düşsün isteniyorsa):** `operator/repository.ts:970` (+ tutarlılık için `:2453`, `:2503`) satırındaki `eq(makineler.operator_de_goster, 1)` koşulunu, montaj kuyruk satırlarını bayraktan bağımsız dahil edecek şekilde gevşet — ör. `or(eq(makineler.operator_de_goster, 1), eq(uretimEmriOperasyonlari.montaj, 1))`.

- [x] **Uygulanan gerçek çözüm:** Canlıda 141 görünür kuyruk kaydı olduğu, operatör ekranının varsayılan `limit=100` ile yalnız ilk 100 kaydı çektiği doğrulandı. İstek `limit: 500` ile güncellendi. Seçenek A/B uygulanmadı; görünürlük iş kuralı değiştirilmedi.

> **Öneri:** İş kuralı belirsiz. Codex Seçenek A'yı teşhisle doğrulasın; müşteri "montaj işleri de operatörde çıksın" diyorsa Seçenek B kalıcı çözümdür. Karar için kullanıcıya tek cümlelik soru sorulabilir. Not: `montaj_makine_id` için ayrı kuyruk satırı üretmemek de ayrı bir tasarım eksiği — B seçilirse bu da gözden geçirilmeli.

**Doğrulama:** Montaj tipi UE emirleri operatör "Sıradaki İşler" listesinde görünmeli; makine iş yükleri davranışı bozulmamalı.

---

## 4) Satış Siparişleri — YENİ sipariş kaydederken "Sunucu hatası"

**Not (report):** "Yeni satış siparişi girerken sunucu hatası mesajı alıyorum." (Ekran: SS-2026-0050, CENK OTO, 2 kalem, Ekstra İskonto boş, Termin boş.)

**Kök neden (canlı log 07-22 08:01–08:04, kesin):**
`Duplicate entry 'SS-2026-0050' for key 'satis_siparisleri.uq_satis_siparisleri_siparis_no'` (ER_DUP_ENTRY). Create **500 döndü (5×)**, 201 (2×). İki katmanlı hata:

**4a — Numara çakışması:** Form açılışta "sonraki numara"yı önceden çekiyor; SS-2026-0050 zaten oluşturulduktan sonra form aynı numarayı önermeye devam edip tekrar gönderiyor → duplicate. (DB'de SS-2026-0048 boşluğu da var; numaralama `MAX+1` desenine dayanıyor: `backend/src/modules/satis_siparisleri/repository.ts:433-438`.)

**4b — Hata yanlış sınıflanıyor (asıl "sunucu hatası" sebebi):** `backend/src/modules/satis_siparisleri/controller.ts:126`
```ts
if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'siparis_no_zaten_var' } });
```
`repoCreate` insert'i **Drizzle `DrizzleQueryError` ile sarıyor**; `err.code` **undefined** kalıyor → bu koşul eşleşmiyor → `sendInternalError` (500) → frontend generic **"sunucu hatası"** gösteriyor. (Aynı sorun `updateSatisSiparisi` catch'inde de var: `controller.ts:159`.)

**Not (test edildi — çürütülen hipotez):** "Ekstra İskonto boş / Termin boş → validation/NaN/NOT NULL hatası" iddiası **YANLIŞ**. Zod çalıştırılarak doğrulandı: boş ekstra → `z.coerce.number().default(0)` = **0**; boş termin → `values.terminTarihi || undefined` ile JSON'dan atılıyor; backend `validation.ts:37,40` bu payload'ı kabul ediyor; `real.integration.test.ts:116-130` bu senaryoyu zaten geçiriyor. Yani create'in mantığında hata yok — sorun tamamen 4a+4b.

**Yapılacak (Codex):**
- [x] **4b (öncelik):** Controller catch'lerinde hata kodunu Drizzle sarmalını açarak oku. Örn. `const code = (err as any).code ?? (err as any).cause?.code;` sonra `if (code === 'ER_DUP_ENTRY') …`. Hem `createSatisSiparisi` (satır 123-129) hem `updateSatisSiparisi` (satır 156-163) için uygula. `ER_WARN_DATA_OUT_OF_RANGE` de aynı şekilde.
- [x] **4b-ek — eşlenmemiş DB hatalarını logla:** Controller şu an **yalnızca 2 kod** eşliyor (`ER_DUP_ENTRY`, `ER_WARN_DATA_OUT_OF_RANGE`); diğer her DB hatası sessizce 500 oluyor. Catch'te gerçek `code`/`sqlMessage`'ı `req.log.error` ile bas. Böylece bu incident dışındaki create 500'lerinin (örn. **FK ihlali `ER_NO_REFERENCED_ROW_2`** — bayat dropdown'dan silinmiş `urun_id`/`musteri_id`) kök nedeni de görünür olur. `repoCreate` (`repository.ts:374-384`) FK hatasını ham iletiyor.
- [x] **4a:** Numara çakışmasını kalıcı çöz. Tercihen sipariş numarasını **insert anında sunucuda atomik üret** (client stale numarasına güvenme) veya ER_DUP_ENTRY'de sonraki boş numarayla **retry**. Min: frontend create başarısı/409 sonrası numarayı **yeniden fetch** etsin. Uygulanan: 409 yanıtında yeni numara döndürülüp form otomatik güncelleniyor.
- [x] **FE/BE tip asimetrisi:** FE şeması (`siparis-form.tsx:47-49`) `musteriId`/`urunId` için `min(1)`, backend (`validation.ts:15,35`) `uuid()` istiyor. FE'yi `uuid()`e hizala — geçersiz id 500 yerine anlaşılır 400/inline hata versin.
- [x] **Frontend UX:** `siparis-form.tsx:219-233` catch backend `error.message`'ı gösteriyor; 409 `siparis_no_zaten_var` için anlamlı Türkçe mesaj + numarayı otomatik güncelle.

**Doğrulama:** Arka arkaya yeni sipariş oluşturmada duplicate hatası olmamalı; olası çakışma/FK/başka DB hatasında generic "sunucu hatası" yerine anlamlı mesaj + logda gerçek kod.

---

## 5) Satış Siparişleri — MEVCUT siparişi düzenleyip Kaydet: kaydetmiyor, hata da yok

**Not (report):** "Mevcut satış siparişi üzerinde düzenleme yapıp Kaydet'e bastığımda kaydetme işlemi yapmıyor. Hata mesajı da gelmiyor."

**Kök neden (canlı log 07-22, kesin):** Düzenleme sırasında backend'e **hiç PUT/PATCH isteği ulaşmıyor** (07:5x'te update isteği yok). Sorun **frontend'de sessiz no-op**. İki mekanizma (ajan testleriyle netleşti):

**5a — Sessiz validation bloğu (asıl):** `siparis-form.tsx:246` `<form onSubmit={form.handleSubmit(onSubmit)}>`. `react-hook-form.handleSubmit`, form geçerli değilse `onSubmit`'i **hiç çağırmaz**. Ama form **sadece bazı alanlarda** inline hata gösteriyor: `siparisNo` (`:256`), `musteriId` (`:295`), `items.root` (`:334`), `items[i].urunId` (`:352`). **Gösterilmeyen** alanlar geçersiz olursa hiçbir geri bildirim olmadan tıklama ölür: `ekstraIndirimOrani` `>100` (`z.max(100)` `:52`), `miktar` `0/boş` (`z.positive()` `:41`), `birimFiyat` negatif, `siparisTarihi/terminTarihi/durum`. Bildirilen "kaydetmiyor, hata yok" bunun birebir karşılığı.

**5b — Kilitli sipariş:** `siparis-form.tsx:456` `disabled={busy || isLocked}`; `isLocked` (`:74`) = kalem üretime aktarılmışsa `kilitli=true` (`repository.ts:224` `!canEditSiparis`). Bu durumda Kaydet pasif → tık hiçbir şey yapmaz, hata da vermez.

**5c — İLGİLİ VERİ KAYBI BUG'I (Codex mutlaka düzeltmeli):** Backend DTO'su `ekstraIndirimOrani`'yı **hiç döndürmüyor**. `backend/src/modules/satis_siparisleri/schema.ts:120-144` `siparisRowToDto` bu alanı atlıyor (oysa `SatisSiparisDto` tipi `:100` içeriyor, FE `types.ts:59,228` bekliyor). Zinciri: yanıtta yok → FE normalizer `types.ts:228` `toNum(undefined)=0` → düzenleme formu `siparis-form.tsx:141` `ekstraIndirimOrani: siparisDetail.ekstraIndirimOrani` = **her zaman 0**. Kullanıcı %36 ekstra iskontolu siparişi düzenleyip kaydederse ekstra iskonto **sessizce sıfırlanır** (`repository.ts:81 mapSiparisPatch` gönderilen 0'ı yazar).

**5d — YENİ form reset kusuru (kozmetik):** `siparis-form.tsx:150-160` YENİ mod `form.reset(...)` `ekstraIndirimOrani`'yı atlıyor (edit `:141`'in aksine) → `watch("ekstraIndirimOrani")` `undefined` → `totals` (`:171-199`) "₺NaN" gösterebilir.

**Yapılacak (Codex):**
- [x] **5c (öncelik — veri kaybı):** `schema.ts:120-144` `siparisRowToDto`'ya `ekstraIndirimOrani: Number(row.ekstra_indirim_orani ?? 0)` ekle. Bu tek düzeltme hem düzenlemede 0'a düşmeyi hem gizli veri kaybını çözer.
- [x] **5d:** `siparis-form.tsx:150-160` YENİ reset'e `ekstraIndirimOrani: 0` ekle (NaN totals).
- [x] **5a:** Validation hatasını **görünür yap** — `form.handleSubmit(onSubmit, onInvalid)` ikinci argümanla `onInvalid`'de `toast.error("Formda eksik/hatalı alan var")`; ayrıca `ekstraIndirimOrani/miktar/birimFiyat/siparisTarihi/terminFiyat` alanlarına `<FormMessage/>`/hata `<p>` render et. Sessiz başarısızlık biter.
- [x] **5b:** Kaydet pasifse sebebini kullanıcıya göster (kilitli sipariş bilgi metni — mevcut `kilitliBilgi` i18n anahtarı var).
- [ ] **Teşhis kolaylığı:** geçici olarak `form.formState.errors`'ı logla; kalem/tarih normalize gerekiyorsa sunucu verisini forma doldururken şemaya uygun hale getir (null→0, string→number, tarih→`yyyy-mm-dd`).

**İlişkili — uretim-emirleri client crash (ikincil):** `updateSatisSiparisiAdmin.invalidatesTags` `UretimEmirleri LIST/ADAYLAR` içeriyor (`satis_siparisleri_admin.endpoints.ts:79-85`) → düzenleme sonrası üretim-emirleri yeniden çekiliyor. `uretim-emirleri-client.tsx:666-672` `aggregateMamul`'da riskli deref (`emirler[0]` undefined / boş grupta `Math.min(...)===Infinity`). Ekli "Application error" muhtemelen bu. Ayrı repro gerekir; edit düzeltilince teyit et, sürüyorsa ayrı madde aç.

**Doğrulama:** %36 ekstra iskontolu siparişi düzenle → form iskontoyu **doğru** yüklesin (0 değil); alan değiştir + Kaydet → PATCH gitsin, başarı toast'ı + liste güncellensin; geçersiz alanda net hata görünsün (sessiz kalmasın); kilitliyse sebep gösterilsin.

---

## Uygulama Sırası (öneri)
1. Madde 1 (salt frontend, düşük risk) → 2 (backend query) → 5 (frontend form) → 4 (controller + numaralama) → 3 (iş kuralı kararı gerektiriyor, en sona).
2. Her madde sonrası: `admin_panel` → `bun run lint` / `tsc`; `backend` → ilgili modül testleri (`__tests__`) + `bun run build`.
3. Deploy sonrası Claude, çözülen maddeleri `page_feedback` thread'lerine `solution` + `resolved` olarak işleyecek (müşteriye **siz** diliyle).

## Kapsam dışı / not
- "Makine ve montaj planlama hatası" (UP-2026-0022) — müşteri iptal etti, alınmadı.
- Eski (2026-04) loglarındaki `Unknown column 'ekstra_indirim_orani'` ve `/operator/kuyruk` 500'leri **geçmişte kalmış**; kolon canlıda mevcut, endpoint 07-22'de 200. Güncel sorun değil.
