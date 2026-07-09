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
