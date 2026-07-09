# Yazılımcı Notu V16 — 🔴 Vardiya ataması: timezone + açık vardiya bağı

> **İnceleme:** 2026-07-09 — Claude canlı DB + kod + canlı fonksiyon testi + 2 ekran görüntüsü (WhatsApp).
> **Admin sorusu:** "Üretim sayısını hangi vardiyaya yazacağına neye göre karar veriyor? Yarım saat gecikmeli giriş olursa işler karışır. Operatöre gece/gündüz seçtirsek mi?"
> **Cevap: Admin haklı — ve tahmin ettiğinden daha ciddi bir hata var.**

---

## 🔴 Kök neden 1 (KRİTİK): Vardiya ataması UTC saatiyle yapılıyor

- Sunucu saat dilimi **UTC** (`TZ` env boş), MySQL DATETIME'lar UTC saklıyor. Tarayıcı Türkiye'ye çevirdiği için **ekrandaki saatler doğru** (07:58 gerçekten 07:58 TR).
- Ama `core.ts` `assignVardiya` / `buildShiftWindowForTime` **ortamın yerel saatini** (`getHours()`, `createDateForClock`) kullanıyor. Sunucu UTC olduğu için Türkiye yereli olan vardiya tanımlarına (07:30 / 19:30) **3 saat kaymış** uygulanıyor.

**Canlı kanıt (gerçek kod yolu, `assignVardiya`):**

| Kayıt (Türkiye) | Olması gereken | Sistem atıyor |
|---|---|---|
| 19:33 | GECE | **GÜNDÜZ** ❌ |
| 11:00 | GÜNDÜZ | **GECE** ❌ |
| 20:00 | GECE | **GÜNDÜZ** ❌ |
| 08:53 | GECE (hibrit) | GECE ✅ *(tesadüfen)* |

- **Hibrit kural (07:30–09:30 → önceki gece) fiilen Türkiye 10:30–12:30'a uygulanıyor.** Yani admin'in sorduğu "sabah 8'de girilen sayı" senaryosu hiç doğru çalışmıyor.
- **Neden testler yeşil geçti:** `core.test.ts` timezone'u sabitlemiyor; geliştirici makinesi **Europe/Berlin (+02)**, prod **UTC**. `core.ts` DB'den bağımsız ama **ortam saat diliminden bağımsız değil** — gizli global girdi. V14'ün determinizm hedefi bu noktada eksik kalmış.
- **Veri düzeltmesi gerekmez:** vardiya ataması okuma anında hesaplanıyor, saklanmıyor. TZ düzelince geçmiş kayıtlar da doğru gruplanır.

## 🔴 Kök neden 2: Vardiya kartları "tip"e göre gruplanıyor, örneğe göre değil

`vardiya-analizi-client.tsx:878-881` → `shiftKeys.add(kayit.vardiyaTipi)`. Bu yüzden **08.07 gecesi ile 09.07 gecesi tek "Gece Vardiyası" kartında** birleşiyor; kartın altındaki toplam ise tek slota ait. Admin'in "485+490 bir vardiyada imkânsız" tespiti **doğru** — kayıtlar farklı gecelere ait. (Backend V14'ten beri slot bazlı `vardiyalar[]` dönüyor; hata yalnız frontend gruplamasında.)

## 🟡 Kök neden 3 (admin'in asıl sorusu): Vardiya, zamandan **tahmin** ediliyor

`operator_gunluk_kayitlari`'nda vardiya bağı **yok** (kolonlar: id, uretim_emri_id, makine_id, emir_operasyon_id, operator_user_id, gunluk_durum, ek/fire/net, birim_tipi, notlar, kayit_tarihi…). Vardiya, `kayit_tarihi`'nden çıkarılıyor. Gecikmeli giriş → yanlış vardiya. **Hiçbir saat penceresi bunu kesin çözemez** — bilgi kayıptır.

Ama sistem **gerçeği zaten biliyor**: `vardiya_kayitlari` tablosunda makine bazında açık vardiya (`vardiya-basi` / `vardiya-sonu`) tutuluyor.

---

## VERİLMİŞ KARARLAR

| # | Karar | Gerekçe |
|---|-------|---------|
| **K1** | Vardiya hesapları **açık timezone parametresiyle** yapılır. `core.ts` saf fonksiyonları `tzOffsetDk` alır; ortam TZ'si (`getHours`, `createDateForClock`) **hiç kullanılmaz**. Tek sabit: `VARDIYA_TZ_OFFSET_DK = 180` (Türkiye, 2016'dan beri DST yok). | Gizli global girdi kalkar → gerçek determinizm. Sunucu TZ'sine bağımlılık biter. |
| **K2** | **Sunucu/DB timezone'una DOKUNULMAZ.** (`TZ=Europe/Istanbul` yapmak mysql2'nin DATETIME yazımını değiştirir → geçmiş satırlar UTC, yeniler +03 olur, veri karışır.) | Veri bütünlüğü. |
| **K3** | Kayıt, girildiği anda **açık vardiyaya açıkça bağlanır**: `operator_gunluk_kayitlari.vardiya_kayit_id` (yeni idempotent seed). Operatör giriş ekranında "Bu üretim hangi vardiyaya ait?" seçimi — **default = o makinede açık olan vardiya**, gerekirse değiştirilebilir (admin'in önerisi). | Tahmin yerine gerçek. Gecikmeli girişi kökten çözer. |
| **K4** | Analizde öncelik: `vardiya_kayit_id` varsa **o kullanılır**; yoksa (geçmiş kayıtlar) TZ-düzeltilmiş zaman çıkarımı fallback. | Geçmiş veri kaybolmaz, yeni veri kesindir. |
| **K5** | Vardiya kartları **slot bazlı** (gün + tip) gruplanır. | Kök neden 2. |
| **K6** | "Montaj üretimi: 1.580 adet — OEE'ye dahil değil" ibaresi **netleştirilir**: `Montaj üretimi: 1.580 adet (net üretime dahil, verimlilik hesabına dahil değil)`. Admin anlamadığını söyledi; kaldırmak yerine doğru cümleyi yazıyoruz çünkü bilgi gerçek. | Şeffaflık; K1(V14) ile tutarlı. |

---

## Yapılacaklar

| # | İş | Sahip |
|---|----|-------|
| A | `core.ts` → `tzOffsetDk` parametresi; ortam TZ kullanımı sıfır. `core.test.ts` → **üç farklı offset** (UTC/+02/+03) altında aynı sonucu kanıtlayan testler | Codex |
| B | Seed `209_gunluk_kayit_vardiya.sql` (idempotent) → `vardiya_kayit_id` kolonu + geçmiş kayıtlar için TZ-doğru backfill | Codex |
| C | Operatör girişinde vardiya bağı + modalde vardiya seçimi (default açık vardiya) | Codex |
| D | `vardiya_analizi` → K4 önceliği (`vardiya_kayit_id` → fallback çıkarım) | Codex |
| E | Frontend → vardiya kartları slot bazlı; montaj ibaresi (K6) | Codex |
| F | Review + canlı doğrulama (19:33 → GECE) + deploy + admin'e cevap | Claude |

**Kabul kriterleri:**
1. `core.test.ts` `process.env.TZ` değiştirilerek **UTC, +02, +03** altında koşar; her üçünde de 19:33 TR → GECE, 11:00 TR → GÜNDÜZ, 08:53 TR → önceki GECE.
2. `grep -n "getHours()\|getMonth()\|getDate()" core.ts` → yerel-zaman okuması yok (yalnız `getUTC*` + offset).
3. Canlıda `assignVardiya` yukarıdaki tabloyu **doğru** üretir.
4. Aynı gün 08.07 gecesi ve 09.07 gecesi **ayrı kartlarda**; kart toplamı = kart satırları toplamı.
5. Yeni girilen üretim kaydında `vardiya_kayit_id` dolu; operatör vardiyayı değiştirebiliyor.
6. backend `bun run build` + tüm testler; admin `bunx tsc --noEmit` + `bun run build` temiz.
7. **Push YOK** — Claude review + deploy.

## Dokunma
- Sunucu/PM2 `TZ` env'i, MySQL time_zone (K2).
- Montaj/stok akışı, Gantt.

---

## Claude Review + Kapanış (2026-07-09)

Codex 5 commit (`4758f11`, `1f689f4`, `03f8f54`, `1e1ddee`, `8c91690`) — **brief'e uydu, push etmedi.** ✅

### Kabul kriterleri

| # | Kriter | Sonuç |
|---|--------|-------|
| 1 | `core.ts`'te yerel-zaman okuması yok | ✅ 0 eşleşme (yalnız `getUTC*`) |
| 2 | Testler TZ'den bağımsız | ✅ **UTC / Istanbul / Berlin / New York** → 4'ünde de 7 pass 0 fail |
| 3 | Doğruluk tablosu | ✅ 7/7 (19:33→GECE, 11:00→GÜNDÜZ, 20:00→GECE, 08:53→önceki GECE, 07:29→önceki GECE, 09:31→GÜNDÜZ, 03:00→önceki GECE) — iki TZ'de aynı |
| 4 | Seed 209 + backfill | ✅ uygulandı; **346/351 kayıt bağlandı**, 5'i hiçbir vardiya penceresine düşmüyor → fallback çıkarım |
| 5 | Slot kartları ayrı; kart toplamı = satırlar | ✅ 07-07 gece **485** / 07-08 gece **490** / 09 gündüz **485**; Σ = 1460 = makine neti (**I2**) |
| 6 | Operatör vardiya seçimi + bağ | ✅ 3 insert yolunun **üçü de** `vardiya_kayit_id` yazıyor; `resolveVardiyaKayitIdForProduction` + modalde seçim |
| 7 | Build + testler | ✅ backend build, 87 test (5 DB-skip) 0 fail, admin tsc + build |
| 8 | Ayrı commit'ler, temiz repo | ✅ (V15 hijyen notu uygulanmış) |

**Ek doğrulama (Claude):** Bağlı slot ile tahmin edilen slot **aynı `slotKey`**'i üretiyor (`2026-07-08-gece`) → aynı gece iki karta bölünmüyor. Vardiya süreleri 720dk (12sa), OEE %52.

**Admin'in şikayeti kapandı:** "485+490 bir vardiyada imkânsız" → artık **iki ayrı gece kartında** (07-07 ve 07-08). "Gündüz vardiyasında hiç üretim yok" → 09.07 gündüz 485 ile dolu.

### 📌 Kayda geçen ikincil bulgu (V17 adayı — acil değil)
`vardiya_kayitlari.baslangic/bitis` **yerel duvar-saati** olarak UTC-naive kolonlara yazılıyor (DB'de `19:30`, okununca `19:30Z` = 22:30 TR). Bu **V16 ile gelmedi, önceden vardı**. Sınıflandırmayı bozmuyor (karşılaştırmalar aynı frame'de) ve süreler doğru çıkıyor çünkü `service.ts:683-684` gerçek vardiya kaydı varsa `realBaslangic/realBitis` kullanıyor. Risk yalnızca: (a) vardiya sınırı bir yerde **ekranda saat olarak** gösterilirse 3 saat sapar, (b) **sentetik slot** (vardiya kaydı olmayan üretim) için süre/duruş penceresi kayar. Ayrı revizyonda ele alınmalı.

- [x] Review · [x] Push + Deploy (`8c91690`) · [x] Canlı doğrulama · [x] Seed 209 uygulandı. **Açık not: 0.**
