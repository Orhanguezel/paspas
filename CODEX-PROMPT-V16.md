# CODEX-PROMPT V16 — Vardiya ataması: timezone determinizmi + açık vardiya bağı

> **Kaynak:** [CEKLIST-V16.md](CEKLIST-V16.md) — kararlar K1–K6 verildi.
> **Şema:** yalnız **1 yeni idempotent seed** (209). Ham `ALTER` YASAK (seed içinde INFORMATION_SCHEMA guard'lı, 205/208 deseni).
> **Push ETME** — Claude review + canlı doğrulama + deploy + thread/WhatsApp cevabı.

---

## Neden (kısa)

Sunucu **UTC**, vardiya tanımları **Türkiye yereli** (07:30/19:30). `core.ts` ortamın yerel saatini okuyor → atama 3 saat kaymış. Canlı kanıt: `19:33 TR → GÜNDÜZ`, `11:00 TR → GECE`. Testler yeşil çünkü geliştirici makinesi Europe/Berlin; TZ testlerde sabitlenmemiş.

Ayrıca vardiya, `kayit_tarihi`'nden **tahmin** ediliyor; gecikmeli girişte kaçınılmaz olarak yanlış. `vardiya_kayitlari`'nda açık vardiya zaten var — kaydı ona **bağlayalım**.

---

## A — `core.ts`: timezone açık parametre (ortam TZ'si YOK)

`backend/src/modules/vardiya_analizi/core.ts`

1. Sabit ekle (tek kaynak):
   ```ts
   /** Türkiye sabit UTC+3 (2016'dan beri DST yok). Ortam TZ'sine ASLA güvenme. */
   export const VARDIYA_TZ_OFFSET_DK = 180;
   ```
2. Yerel-zaman yardımcıları (saf):
   ```ts
   function toLocal(d: Date, tzOffsetDk: number): Date { return new Date(d.getTime() + tzOffsetDk * 60_000); }
   function fromLocal(d: Date, tzOffsetDk: number): Date { return new Date(d.getTime() - tzOffsetDk * 60_000); }
   // yerel bileşenler DAİMA getUTC* ile okunur (toLocal sonrası)
   ```
3. `createDateForClock`, `buildShiftWindowForTime`, `assignVardiya`, `inferVardiyaTipi`, `vardiyaSlotKey` (gün anahtarı!), `partitionByVardiya` → hepsi son parametre olarak `tzOffsetDk: number = VARDIYA_TZ_OFFSET_DK` alsın; içeride **`getHours/getDate/getMonth/getFullYear` (yerel) KULLANMA**, yalnız `toLocal(...)` + `getUTC*`.
   - `ymdLocal(date)` de offset'e göre hesaplansın (slot `gun` anahtarı kayarsa kartlar bölünür).
4. **Hibrit kural korunur** ama artık yerel saat üzerinde: yerel `[gunduzBaslangic, gunduzBaslangic+120dk)` aralığındaki kayıt **önceki gece** slotuna düşer.
5. `service.ts` çağrılarını güncelle (offset'i geçir). `dateRange` gece uzatması da yerel saate göre olsun.

**Testler — `core.test.ts` (mevcut dosyayı genişlet):**
- Her testi **üç TZ altında** koştur: `UTC`, `+02:00` (Europe/Berlin), `+03:00` (Europe/Istanbul). Örn. `describe.each(['UTC','Europe/Berlin','Europe/Istanbul'])` + `beforeAll(() => { process.env.TZ = tz; })` **veya** (daha sağlam) fonksiyonlara offset'i açıkça geçirip TZ'den bağımsızlığı kanıtla — testler ortam TZ'si ne olursa olsun aynı sonucu vermeli.
- Zorunlu vakalar (Türkiye yerel saatiyle):
  | Girdi (TR) | Beklenen slot |
  |---|---|
  | 19:33 | GECE (aynı gün başlayan) |
  | 20:00 | GECE |
  | 11:00 | GÜNDÜZ |
  | 08:53 | **önceki** GECE (hibrit) |
  | 07:29 | önceki GECE |
  | 09:31 | GÜNDÜZ |
  | 03:00 | önceki gün başlayan GECE |
- Mevcut I1–I5 invariantları korunur.

## B — Seed `209_gunluk_kayit_vardiya.sql` (idempotent)

`backend/src/db/seed/sql/209_gunluk_kayit_vardiya.sql`
1. `INFORMATION_SCHEMA` guard + PREPARE ile: `operator_gunluk_kayitlari` tablosuna `vardiya_kayit_id char(36) NULL` + index. (205/208 desenini birebir izle.)
2. **Backfill (TZ-doğru):** her kayıt için, aynı makinede `vk.baslangic <= kayit_tarihi < COALESCE(vk.bitis, '2099-01-01')` koşulunu sağlayan `vardiya_kayitlari` satırına bağla. (DB DATETIME'ları UTC; `vardiya_kayitlari.baslangic/bitis` de aynı frame'de — karşılaştırma doğrudan yapılır, offset gerekmez.) Eşleşmeyen kayıt NULL kalır (fallback çıkarım kullanır).
3. Idempotent: kolon varsa eklemez; backfill yalnız `vardiya_kayit_id IS NULL` satırlara.

## C — Operatör girişi: vardiya bağı + seçim

`backend/src/modules/operator/`
- `operator_gunluk_kayitlari` insert eden **tüm** yollarda (`addOperatorGunlukGiris`, `repoUretimBitir` içindeki final kayıt, duraklat/devam vb.) `vardiya_kayit_id` doldur:
  - Varsayılan: o makinede **açık** vardiya (`vardiya_kayitlari.bitis IS NULL`), yoksa `kayit_tarihi`'ni kapsayan en son vardiya kaydı.
  - Body'de opsiyonel `vardiyaKayitId` gelirse onu kullan (validation'a ekle; makineye ait olduğunu doğrula, değilse 400).
- DTO'ya açık vardiya bilgisini ekle (`acikVardiya: {id, vardiyaTipi, baslangic}`) — modal default'u için.

`admin_panel/.../operator/_components/operator-client.tsx`
- Günlük Üretim / Duraklat / Bitir modallarına **"Bu üretim hangi vardiyaya ait?"** seçimi: default = açık vardiya; seçenekler o makinenin son 2 vardiya kaydı (gece/gündüz, tarihiyle). Mobil dostu (büyük dokunma alanı — V12-D deseni).

## D — `vardiya_analizi`: K4 önceliği

- `repository.ts` `fetchUretimKayitlari` → `vardiya_kayit_id` ve bağlı `vardiya_kayitlari.vardiya_tipi/baslangic/bitis` alanlarını da çek (LEFT JOIN).
- `UretimKaydi` tipine `vardiyaKayitId: string | null`, `vardiyaSlotOverride?: VardiyaSlot` ekle.
- `partitionByVardiya`: kayıtta açık bağ varsa **o slot** kullanılır; yoksa `assignVardiya(kayitTarihi, tanimlar, tzOffsetDk)` fallback. (Saf fonksiyon; DB'ye bakmaz — slot bilgisi kayıtla birlikte gelir.)
- Unit test: bağlı kayıt, zaman çıkarımıyla ÇELİŞSE bile bağın kazandığını kanıtla.

## E — Frontend

`admin_panel/.../vardiya-analizi/_components/vardiya-analizi-client.tsx`
1. **Slot bazlı gruplama:** `shiftKeys.add(kayit.vardiyaTipi)` (satır ~878-881) → slot anahtarı (`${gun}-${vardiyaTipi}`). Kart başlığı: `Gece Vardiyası · 08.07.2026` gibi tarihli. Kart toplamı = o kartın satırları toplamı olmalı.
2. **Montaj ibaresi (K6):** `Montaj üretimi: {n} adet — OEE'ye dahil değil` →
   `Montaj üretimi: {n} adet (net üretime dahil, verimlilik hesabına dahil değil)`

---

## Kabul kriterleri (Claude review edecek)

1. `grep -nE "\.getHours\(|\.getMinutes\(|\.getDate\(|\.getMonth\(|\.getFullYear\(" core.ts` → **0** (yalnız `getUTC*`).
2. `bun test src/modules/vardiya_analizi/__tests__/core.test.ts` → skip'siz yeşil; `TZ=UTC bun test ...` ve `TZ=Europe/Istanbul bun test ...` **aynı sonucu** verir.
3. Canlıda `assignVardiya`: 19:33 TR → GECE, 11:00 TR → GÜNDÜZ, 20:00 TR → GECE, 08:53 TR → önceki GECE.
4. Seed 209 uygulanır; yeni girilen kayıtta `vardiya_kayit_id` dolu; backfill sonrası eşleşen geçmiş kayıtlar bağlı.
5. Ekranda 08.07 gecesi ve 09.07 gecesi **ayrı kart**; her kartın toplamı satırlarının toplamına eşit.
6. Operatör modalinde vardiya seçimi çalışıyor (default açık vardiya).
7. backend `bun run build` + testler; admin `bunx tsc --noEmit` + `bun run build` temiz.
8. Her madde (A/B/C/D/E) **ayrı commit**; yalnız göreve ait dosyalar `git add` (V15 hijyen notu).

## Dokunma
- Sunucu/PM2 `TZ` env'i, MySQL `time_zone` (K2 — veri karışır).
- Montaj/stok akışı (`tryMontaj`, `repoUretimBitir` stok mantığı), Gantt, diğer modüller.
