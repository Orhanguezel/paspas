# Yazılımcı Notu V11 — 🔴 KRİTİK: Çift taraflı ürünlerde montaj çalışmıyor (mimari)

> **İnceleme:** 2026-07-04 — Claude canlı DB + kod + git geçmişi + PM2 log + 1 derin alt-ajan analizi.
> **Not:** `51ac56d3` "Operatör ekranında ürün ismi gelmiyor" (/admin/uretim-emirleri, 07-04).
> **⚠️ Bu bir "küçük bug" değil — çekirdek üretim→stok akışı 2026-06-29'dan beri çift taraflı ürünlerde ÇALIŞMIYOR. Karar alınmadan koda dokunulmayacak.**

---

## Belirtiler (admin notu 51ac56d3)
1. **Ekran:** Operatör ekranında normalde **ürün ismi + altında yarı mamul ismi** görünürdü; şimdi sadece yarı mamul ismi görünüyor (ör. "Pars Siyah Aramamul Sol", mamul "PARS SİYAH" yok). — Görsel: Hatali_Urun_isimleri.png doğrulandı.
2. **Stok:** Operatör günlük üretim giriyor ama mamul sayısına/stoğuna **yansımıyor**. Üretim emirleri listesinde ürün "üretilmemiş", malzeme stoklarında yok.
3. **Admin hipotezi:** "Montaj hangi makinede yapılıyorsa o makinedeki yarı mamul üretim sayısı kadar ürün stoğa girerdi; artık girmiyor." — **Doğru teşhis.**

---

## Kök neden (kanıtlı)

**Mimari (regresyon DEĞİL, tasarım):** Sipariş/stok üretimi çift taraflı üründe **her operasyonel YM için ayrı emir** oluşturur (`urun_id` = Sağ / Sol YM). Bu 05a38c8'den beri böyle. Emrin operasyonları `autoPopulateOperasyonlar` ile `urun_operasyonlari` tanımından **kopyalanır; `montaj` alanı da oradan miras alınır** (repository.ts:293).

**Asıl kırık (VERİ):**
- Canlı DB'de **`urun_operasyonlari`'nın 451 satırının 451'i de `montaj=0`.** Sistemde montaj=1 tanımı **SIFIR**.
- Sonuç: `autoPopulate` artık montaj=1 üretemiyor → her yeni emir yalnız montaj=0 operasyonlarla doğuyor → **`tryMontajForUretimEmri` (montaj=1 op tamamlanınca tetiklenir) hiç çalışmıyor** → mamul stoğu hiç oluşmuyor.

**Zaman çizelgesi (kesin):**
- montaj=1 operasyonları **2026-05-04 → 2026-06-25** arası sürekli oluşuyordu; sistem **çalışıyordu** (son başarılı montaj 07-01, `hareketler` referans_tipi='montaj' 3 kayıt — Megane 1131 101).
- **2026-06-23 V6 ürün re-import (`5894ac7`):** `urun_operasyonlari`'ya 230 satır yeniden işlendi, **seed-122 varsayılanı montaj=0** ile → çift taraflı ürünlerin (Megane 1131 vb.) montaj=1 tanımları 0'a düştü.
- **2026-06-24 V7 (`1cd9638`):** `applyDefaultMakineAtamasi` kaldırıldı (yalnız `makine_id` set ediyordu, **montaj'a dokunmuyordu**) → montaj işaretlemesi tümüyle manuel "Makine ve Montaj Planlama" bloğuna kaldı; bu, veri kaybını **maskeledi**.
- **06-29'dan itibaren:** oluşan tüm emirler montaj=0.

**Kalıcılık riski (yeni ürünlerde tekrar eder):**
- Ürün oluşturma servisi `urunler/service.ts:167` operasyonel YM operasyonunu **`montaj:0` hardcode** ediyor.
- Seed `122_v1_urun_operasyonlari.sql` de montaj=0 hardcode.
- `urun_operasyonlari.montaj`'ı düzenleyecek bir **ürün-tanımı update endpoint'i yok gibi** → admin flag'i UI'dan düzeltemiyor olabilir (doğrulanmalı).

**Şu an montaj=1 set etmenin TEK yolu:** manuel `PATCH /operasyon-planlari` (Makine ve Montaj Planlama bloğu, her emirde tek tek). Endpoint kırık değil ama admin bunu her emir için yapmıyor / workflow'da kayboluyor.

---

## Mimari etki & risk (senin sorularına cevap)

| Soru | Cevap |
|------|-------|
| **Mimariyi etkiler mi?** | Evet — çekirdek üretim→montaj→stok akışı. Düzeltme veri + operasyon modeli + ürün tanımı katmanlarına dokunur. |
| **Risk var mı?** | Var. Stok muhasebesine dokunuyor; yanlış yapılırsa çift-sayım / eksik stok / fantom kayıt (V9-F'de yakaladığımız gibi). |
| **Sistemi bozar mı?** | Sistem **zaten kısmen bozuk** (06-29'dan beri montaj ölü). Düzeltme dikkatli yapılırsa iyileştirir; kör yapılırsa mevcut stokları bozabilir. |

**Ek dikkat (alt-ajan notu):** montaj yalnız **birden fazla operasyonu olan** YM emrinde anlamlı (test modeli: montaj-tarafı YM emrinde opBaski montaj=0 + opMontaj montaj=1). Mevcut YM emirleri **tek operasyonlu**. Yani tek satır `montaj=1` flag'i yetmeyebilir — montaj-tarafı YM'ye ikinci bir "montaj" operasyonu tanımı gerekebilir. Bu netleştirilmeli.

---

## Çözüm yolları (KARAR GEREKLİ — henüz uygulanmadı)

### Yol A — Veri + tanım katmanını onar (mevcut mimariyle uyumlu)
- Çift taraflı ürünlerin **montaj-tarafı YM operasyonuna** `urun_operasyonlari.montaj=1` geri yaz (canlıda hedefli UPDATE).
- Gerekiyorsa montaj-tarafı YM'ye 2. operasyon tanımı ekle.
- `urunler/service.ts` + seed 122'deki montaj=0 hardcode'unu düzelt (yeni ürünlerde tekrar etmesin).
- Ürün tanımı UI'ından montaj işaretleme imkânı ekle.
- **Artı:** mevcut `tryMontajForUretimEmri` akışını korur. **Eksi:** çok dokunuş noktası; hangi tarafın montaj olduğunu ürün bazında belirlemek gerek (~25 çift taraflı ürün).

### Yol B — Admin'in basit modeline indirge
- "Montaj-tarafı YM emri tamamlanınca, üretilen adet kadar mamul stoğa girer (karşı YM'yi achievable tüketerek)." Ayrı montaj operasyonu şart olmasın; montaj-tarafı ürün tanımında işaretlensin.
- **Artı:** admin'in beklentisiyle birebir; daha az operasyon karmaşası. **Eksi:** yeni mantık; `tryMontaj`/completion yollarını yeniden düzenlemek gerekir.

### Yol C — Mamul-emir modeline dön (eski çalışan model)
- Emirleri mamul için (urun_id=mamul) + 2 op (Sağ/Sol) + montaj olarak oluştur (V9-F'in `min(op)` mantığı zaten bunu destekliyor — Tuna UE-0079 böyleydi).
- **Artı:** V9-F kodu hazır. **Eksi:** emir-oluşturma akışını (per-side → per-mamul) değiştirmek büyük; iki model birden yaşıyor, tutarsızlık.

> **Model tutarsızlığı gerçeği:** Sistemde ŞU AN iki çift-taraflı model karışık: (1) per-side ayrı emir (güncel akış), (2) tek mamul emri + 2 op (Tuna UE-0079, benim V10'da elle tamamladığım). Kalıcı çözüm **tek modele** karar vermeli.

---

## Önerim (tartışmaya açık)
1. **Hemen kod YAZMA.** Önce modele karar (A/B/C). Ben **Yol A veya C**'ye meyilliyim (mevcut `tryMontaj` altyapısını kullanır), ama **admin'in "montaj makinesi sayısı = ürün" modeli Yol B'ye işaret ediyor**.
2. **Güvenli ilk adım:** Kararı verince TEK bir çift taraflı üründe (ör. Megane veya PARS SİYAH) kontrollü uygula, canlıda snapshot al, sonucu doğrula, sonra yaygınlaştır.
3. **Bekleyen bağlı işler:** UE-0079 (V10, 1235 kredi) ve TIGER KROM (V10) kararları hâlâ açık; bu montaj kararıyla birlikte netleşmeli (aynı çift-taraflı mimari).

---

## Kararlar ve Uygulama (2026-07-04)

- **K1 = Yol A** (kullanıcı onayı; B ile fark tartışıldı — achievable montaj B'nin ruhunu içerir, eşitsiz üretimde fantom mamul üretmez).
- **K2 =** Kural: Sol (-L/-SL) ve tek parça (-X/-PR) montaj tarafı; emir bazında Makine ve Montaj Planlama bloğundan değiştirilebilir.

### Yapılanlar (yayında)
| İş | Uygulama | Commit |
|----|----------|--------|
| Montaj bayrakları geri | seed 206: 113 YM tanımı montaj=1 + 5 açık emrin op'ları hizalandı | 2d57988 |
| Yeni YM'ler montajlı doğar | urunler/service.ts rol bazlı (sol/parca=1, sag=0) | 2d57988 |
| YM stok takibi zorunlu | seed 207: 102 takipsiz YM açıldı; stok kesim-sonrası hareket netinden senkronlandı | 977e78f |
| Yeni YM'ler hep takipli | urunler/service.ts stok_takip_aktif:1 | 977e78f |
| Hayalet bakiye düzeltmesi | 17 YM: eski model kredisiz tüketimi sıfırlandı (denetim hareketli) | canlı |
| Çift sayım telafisi | seed 207 + elle düzeltme çakışması geri alındı; Megane Sağ 92 gerçek bakiyesi korundu | canlı |

**Doğrulanan son durum:** PARS Sol 1100 / Sağ 1510 (takipli, Sol montaj=1) → operatör Sol'u bitirince ~min eşleşen çift mamul stoğa girecek; kalan Sağ stokta bekleyip sonra eşleşecek — kullanıcının onayladığı senaryo birebir.

### Tamamlandı (Codex) → [CODEX-PROMPT-V11.md](CODEX-PROMPT-V11.md)
- [x] İş 1: Operatör ekranında mamul adı (YM üstünde) — notun 1. şikayeti.
- [x] İş 2: Üretim planlamada Sağ/Sol taraf stokları gösterimi.
- [x] Build kontrolleri: backend `bun run build`, admin `bunx tsc --noEmit`, admin `bun run build`.
- Thread `51ac56d3` → **kapatıldı (resolved)**. Review + deploy tamam; canlıda doğrulandı.
- **Review bulgusu (Claude, `5c91b2e`):** Aynı YM birden çok mamul reçetesinde geçtiği için `LIMIT 1` yanlış varyant döndürüyordu (UE-0091 → "AUTOMIX", doğrusu "GMAX"). Asıl ürün türetme sipariş bağlantısı öncelikli yapıldı (reçete fallback); mamul emirlerinde NULL guard eklendi. Canlıda doğrulandı: UE-0091 → "PARS SİYAH - GMAX" ✓.

### Hâlâ açık (V10'dan)
- **K3:** UE-0079 (1235 kredi kalsın mı) + TIGER KROM ürünleri (yeni mi / NUMBER ONE ile aynı mı) — admin cevabı bekleniyor (WhatsApp soruları gönderildi).
