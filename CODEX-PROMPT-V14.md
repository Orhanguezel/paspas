# CODEX-PROMPT V14 — Vardiya Analizi TEK KAYNAK refactor'u (kalıcı)

> **Kaynak:** [CEKLIST-V14.md](CEKLIST-V14.md) — kararlar K1–K4 verildi, uygulanacak.
> **Yeni şema YOK. ALTER YASAK. Push etme** — Claude review + canlı mutabakat + deploy + thread kapatır.
> Bu bir REFAKTOR: davranış sözleşmesi aşağıda; kopya sorgu/filtre BIRAKMA.

---

## Hedef (tek cümle)

`vardiya_analizi` içinde üretim sayıları **tek sorgudan** çekilir, **saf fonksiyonlarla** vardiyalara bölünür ve **her seviye toplamı aynı kümenin reduce'u** olur — böylece makine başlığı, vardiya toplamı, detay satırları ve operatör ekranı **aynı sayıyı** söyler.

## Mevcut sorunun haritası (dokunacağın yerler)

`backend/src/modules/vardiya_analizi/service.ts` (1.412 satır):
- `operator_gunluk_kayitlari`'ndan **8 ayrı sorgu** var (grep `from(operatorGunlukKayitlari)`), pencere × montaj-filtresi kombinasyonları tutarsız:
  - satır ~599-627: detay kayıt listesi — TÜM aralık + montaj HARİÇ (❌ vardiya penceresi yok → "üç defa 485" hatası)
  - satır ~660-690: özet — tüm aralık + montaj hariç
  - satır ~793-845: vardiya içi ürün/operasyon kırılımı — vardiya penceresi + montaj hariç
  - satır ~851-905: montaj kırılımı — vardiya penceresi + yalnız montaj
  - satır ~731-752: makine keşif — tüm aralık, montaj dahil
  - satır ~1160-1180, ~1250-1280: verimlilik/trend kopyaları
- Montaj-hariç filtre **5 yerde kopyalanmış** (624, 674, 812, 838, 1268).

## Uygulama

### 1) `core.ts` — YENİ saf çekirdek (DB import YOK, `Date.now()` YOK — her şey parametre)

```ts
// Tipler
export type UretimKaydi = {
  id: string; makineId: string; kayitTarihi: Date;
  net: number; fire: number;                 // net = resolveNet ile normalize edilmiş
  montaj: boolean;                            // SATIR ETİKETİ — filtre değil
  urunId: string; urunKod: string; urunAd: string;
  operasyonId: string | null; operasyonAdi: string; operasyonTipi: string | null;
  kalipId: string | null; kalipKod: string | null; kalipAd: string | null;
  cevrimSn: number | null; operatorAd: string | null;
  gunlukDurum: string;
};

export type VardiyaSlot = { gun: string; vardiyaTipi: 'gunduz' | 'gece'; baslangic: Date; bitis: Date };

// a) Vardiya ataması — DETERMİNİSTİK partition
export function assignVardiya(kayitTarihi: Date, tanimlar: VardiyaTanimi[]): VardiyaSlot;
//  Kurallar:
//  - Gündüz 07:30–19:30, gece 19:30–ertesi 07:30 (tanımlardan; hardcode etme).
//  - HİBRİT: 07:30–09:30 arası girişler ÖNCEKİ GECE vardiyasına sayılır
//    (mevcut buildShiftWindowForTime/inferVardiyaTipi mantığını buraya taşı — davranışı koru).
//  - Her tarih TAM BİR slota düşer (boşluk/çakışma yok). Vardiya açılış kaydına BAĞIMLI DEĞİL
//    (kayıt varsa operatör adı zenginleştirmesi yapılır, pencere hesabı değişmez).

// b) Özet indirgeme — TEK tanım, her seviyede AYNI fonksiyon
export function reduceOzet(kayitlar: UretimKaydi[]): {
  net: number;            // K1: MONTAJ DAHİL — Σ kayit.net
  fire: number;
  kayitSayisi: number;
  baskiNet: number;       // montaj=false kayıtların neti — verimlilik/OEE girdisi (K2)
  montajNet: number;      // montaj=true kayıtların neti (bilgi kırılımı)
  urunKirilimi: ...;      // mevcut buildUretimKirilimSummary'yi buraya taşı/uyarla
  operasyonKirilimi: ...;
};

// c) Bölümleme
export function partitionByVardiya(kayitlar: UretimKaydi[], tanimlar: VardiyaTanimi[]): Map<slotKey, UretimKaydi[]>;
export function partitionByMakine(kayitlar: UretimKaydi[]): Map<string, UretimKaydi[]>;

// d) Taşınacak mevcut saf yardımcılar (service.ts'ten): resolveNet, parseClockToMinutes,
//    normalizeShiftName, inferVardiyaTipi, createDateForClock, buildShiftWindowForTime,
//    clampDate, diffMinutes, calculateOee, calculateVerimlilik, roundRatio.
//    calculateOee/calculateVerimlilik ÇAĞRILARI artık baskiNet ile beslenir (K2).
```

### 2) `repository.ts` — tek kayıt sorgusu

```ts
export async function fetchUretimKayitlari(pencere: {baslangic: Date; bitis: Date}, makineIds?: string[]): Promise<UretimKaydi[]>
```
- `operator_gunluk_kayitlari` + emir + ürün + operasyon(+kalıp) + operatör join'leri; **montaj filtresi YOK** (satırda boolean).
- `net` alanı SQL'de `netMiktarSql` ile (mevcut ifadeyi taşı).
- `pencere.bitis` = istenen aralığın SON gece vardiyasının bitişini kapsar (mevcut `dateRange` gece uzatması korunur).
- Bu, üretim kayıtları için modüldeki **TEK** sorgu olur. (Duruşlar `durusKayitlari`, vardiya açılışları `vardiyaKayitlari` ayrı küçük sorgular olarak kalır — onlar üretim saymaz.)

### 3) `service.ts` refactor

- `getVardiyaAnalizi`: `fetchUretimKayitlari` (1 kez) → `partitionByMakine` → her makine için `partitionByVardiya` → her seviyede `reduceOzet`.
  - **Makine başlığı istatistikleri** = reduceOzet(makinenin TÜM kayıtları).
  - **Vardiya kartı istatistikleri** = reduceOzet(o slotun kayıtları).
  - **Detay satırları** = o slotun kayıtları (AYNI küme — ayrı sorgu YOK). Satırda gerçek `kayitTarihi` gösterilir.
  - Vardiya kartları: kayıtlardan türeyen slotlar ∪ `vardiya_kayitlari`'ndaki açılışlar (kayıtsız açık vardiya boş kart olarak görünebilir; kayıtlı ama açılışsız slot da kaybolmaz).
  - OEE/verimlilik: `baskiNet` + duruşlar + çevrim ile (K2). `montajUretim` alanı `reduceOzet.montajNet/kirilim`dan dolar (mevcut DTO alanları korunur — frontend kırılmasın).
- `getVardiyaAnaliziDetay` ve `getTrend` de **aynı çekirdeği** kullanır — kopya sorgu bırakma.
- 8 sorgu → 1 üretim sorgusu (+ duruş + vardiya açılışları). Montaj-hariç 5 kopya filtre → 0 (filtre kalmaz; `baskiNet` reduce içinde).

### 4) `__tests__/core.test.ts` — YENİ, DB'siz (describe.skip YOK, RUN_DB_INTEGRATION'a bağlı DEĞİL)

Sentetik kayıtlarla invariant testleri:
- **I1:** rastgele-ama-sabit (seed'li, elle yazılmış) 20 kayıt → her kayıt tam 1 slota düşer; Σ slot kayıtları = 20.
- **I2:** reduceOzet(hepsi).net === Σ reduceOzet(slot).net === Σ kayit.net.
- **I3:** montaj=true kayıtlar net'e DAHİL, baskiNet'e DAHİL DEĞİL; montajNet doğru.
- **I5 (hibrit):** 08:15 kaydı önceki gece slotuna; 09:45 kaydı gündüze; 19:29 gündüz, 19:31 gece; gece 03:00 kaydı doğru güne bağlanır.
- resolveNet: net_miktar=0 iken ek-fire fallback; negatif floor 0.
- calculateVerimlilik/calculateOee: montajlı kayıt karışımında yalnız baskiNet kullanıldığını doğrula.
Mevcut `montaj_akisi` vb. entegrasyon testlerine DOKUNMA.

### 5) Frontend — `vardiya-analizi-client.tsx` (`56aadea9` istekleri)

- Makine başlığı: **"{kod} — {ad}"** (örn. "Enjeksiyon 1 — 900 T (ÖN)"); kod verisi API'de yoksa DTO'ya ekle.
- Satır sütunlarından "Verim. (Net Çalışma)" ve "Verim. (Vardiya)" KALKAR → vardiya başlık şeridine (Net/Fire rozetlerinin yanına) iki değer olarak taşınır; makine başlığı kutularına da aynı iki değer eklenir.
- Tablo altındaki "Gündüz/Gece Vardiyası Toplamı" satırları KALDIRILIR.
- Montaj satırları normal listede "Montaj" rozetiyle görünür (artık toplama dahiller — K1).
- Satırda `kayitTarihi` gerçek değeriyle gösterilir.

## Kabul kriterleri (Claude bunlarla review edecek)

1. `grep -c "from(operatorGunlukKayitlari)" service.ts+repository.ts` → üretim sayan sorgu **1**.
2. Montaj-hariç SQL filtresi modülde **0** adet (yalnız reduce içinde `montaj` alanına bakılır).
3. `bun test src/modules/vardiya_analizi/__tests__/core.test.ts` → skip'siz YEŞİL.
4. Backend `bun run build`, admin `bunx tsc --noEmit` + `bun run build` temiz.
5. Davranış: 06-07 gecesi için detay satırları YALNIZ o slotun kayıtları; 900 T (ARKA) kartları montaj üretimiyle DOLU; makine başlığı = Σ vardiyalar.
6. Her mantıksal adım ayrı commit (core, repository+service, testler, frontend).

## Dokunma
- tryMontajForUretimEmri / repoUretimBitir / consumeRecipeMaterials (stok mantığı).
- `montajUretim` DTO alan adları (frontend uyumu) — içerik yeni çekirdekten dolacak.
- Diğer modüller.
