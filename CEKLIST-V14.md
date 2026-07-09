# Yazılımcı Notu V14 — 🏗 Vardiya Analizi TEK KAYNAK mimarisi (kalıcı çözüm)

> **İnceleme:** 2026-07-09 — Claude canlı DB + kod + 3 görsel + mimari analiz.
> **3 not:** `d270550f` (sayılar tutmuyor), `a9e9f63a` (900 T ARKA boş), `56aadea9` (UI + "üç defa 485").
> **Bu bir yama turu DEĞİL — kök mimari düzeltmesi.** Amaç: bu ekrandan bir daha not gelmemesi.

---

## Neden stabil olmuyor — kanıtlı teşhis

**1. Tek doğruluk kaynağı yok.** `vardiya_analizi/service.ts` 1.412 satır; `operator_gunluk_kayitlari`'ndan **8 ayrı sorgu**, her biri farklı pencere × farklı montaj filtresi kombinasyonu. Admin'in görselindeki üç sayı üç ayrı kombinasyon:
- Makine başlığı **1.920** = tüm aralık, montaj dahil
- Vardiya toplamı **485** = vardiya penceresi, montaj hariç
- Detay satırları **1.435** = tüm aralık, montaj hariç ("üç defa 485" = üç FARKLI vardiyanın kaydı tek kartta; DB'de kopya kayıt YOK — 07-07 04:38 / 07-07 16:34 / 07-08 04:58)

**2. `montaj` bayrağı aşırı yüklenmiş.** Hem stok tetikleyici hem "analizden çıkar" anlamında. Ama montaj operasyonu GERÇEK üretimdir (operatör parça giriyor). V13-C montajı kalıcı Enjeksiyon 2'ye sabitleyince **900 T (ARKA)'nın tüm üretimi (07-06'dan beri 3.810 net) analizden düştü** → `a9e9f63a` doğrudan bunun sonucu.

**3. Regresyonlar ancak canlıda görünüyor.** Entegrasyon testleri `RUN_DB_INTEGRATION` kapalı → hep skip. Son 3 turda build'den geçmiş 3 kritik regresyon canlı incelemede yakalandı.

**4. Semptom yamaları modeli düzeltmiyor** — 5 kopya montaj filtresi, kopya pencere mantığı = her değişiklikte yeni sapma yüzeyi.

---

## VERİLMİŞ KARARLAR (mimari)

| # | Karar | Gerekçe |
|---|-------|---------|
| **K1** | **Net üretim toplamı = montaj DAHİL.** Referans tanım: operatör ekranı toplamı (admin "operatör ekranı doğru" dedi — `d270550f`). Montaj satırları tabloda görünür ("Montaj" rozetiyle), toplama girer. | Montaj gerçek üretim; hariç tutma ARKA'yı boşalttı. |
| **K2** | **Verimlilik/OEE yalnız baskı (montaj=0) kayıtlarından** hesaplanır ve **yalnız vardiya + makine seviyesinde** gösterilir (satır seviyesinde değil — `56aadea9` isteğiyle uyumlu). | Montajın çevrim süresi baskıyla kıyaslanamaz; OEE bozulmasın. |
| **K3** | **Tek kaynak (single source of truth):** ham kayıtlar TEK sorguyla çekilir; vardiya ataması + tüm toplamlar SAF (pure) fonksiyonlarla bellekte hesaplanır. Makine başlığı = Σ vardiya toplamları = Σ satırlar **tanım gereği** (aynı kümenin katmanları). | Kod tekrarı sıfır; tutarsızlık matematiksel olarak imkânsız. |
| **K4** | Saf fonksiyonlar **DB'siz unit testlerle** korunur (skip edilemez, her build'de koşar). Invariant'lar test edilir. | Deterministiklik + regresyon kalkanı. |

---

## Hedef mimari (Codex uygulayacak) → [CODEX-PROMPT-V14.md](CODEX-PROMPT-V14.md)

```
vardiya_analizi/
├── core.ts          # YENİ — saf çekirdek (DB'siz, deterministik)
│   ├── assignVardiya(kayit, tanimlar, simdi)  → {gun, vardiyaTipi, pencere} | 'vardiya_disi'
│   ├── reduceOzet(kayitlar)                    → {net, fire, kayitSayisi, baskiNet, montajNet, kirilimlar}
│   ├── partitionByMakineVeVardiya(kayitlar)    → Map<makine, Map<vardiyaKey, kayitlar[]>>
│   └── (mevcut saf yardımcılar buraya taşınır: resolveNet, buildShiftWindow, calculateOee/Verimlilik, clampDate…)
├── repository.ts    # fetchUretimKayitlari(pencere, makineIds?) — TEK kayıt sorgusu (montaj SATIRDA etiket, filtre DEĞİL)
├── service.ts       # incelir: fetch(1) → assign → partition → reduce; duruş/vardiya kayıtları ayrı küçük sorgular
└── __tests__/core.test.ts  # YENİ — DB'siz unit + invariant testleri (skip YOK)
```

**Invariant'lar (unit test edilecek):**
- **I1 (partition):** her kayıt tam BİR vardiyaya atanır; kaybolmaz, çift sayılmaz.
- **I2 (toplam tutarlılığı):** makine.net = Σ vardiya.net = Σ satır.net.
- **I3 (referans tanım):** rapordaki net = operatör ekranı tanımı (montaj dahil, resolveNet ile).
- **I4:** verimlilik girdisi = yalnız baskiNet; montajNet OEE'ye girmez.
- **I5 (hibrit vardiya):** 07:30–09:30 arası girişler önceki gece vardiyasına sayılır; gece penceresi gün sınırını doğru aşar.

**UI istekleri (`56aadea9`) — aynı turda, çekirdek üstüne:**
- Makine başlığı: **makine kodu + adı** (tanımlardaki şekliyle: "Enjeksiyon 1 — 900 T (ÖN)").
- "Verim. (Net Çalışma)" ve "Verim. (Vardiya)" sütunları satırlardan KALKAR → vardiya başlığı hizasına (Net/Fire kutularının yanına) taşınır; makine başlığı kutularına da eklenir.
- Satır altlarındaki "Gündüz/Gece Vardiyası Toplamı" satırları KALKAR (başlıkta zaten var).
- Detay satırında gerçek `kayit_tarihi` gösterilir (bugünkü "hepsi 17:17" hatası biter).
- Montaj satırları "Montaj" rozetiyle listelenir.

---

## Görev dağılımı

| İş | Sahip |
|----|-------|
| core.ts + repository tek sorgu + service refactor + unit/invariant testleri + UI | Codex (V14 brief) |
| Review (özellikle toplam tutarlılığı + canlı sayı mutabakatı: operatör ekranı vs rapor) | Claude |
| Deploy + 3 thread kapatma + hareketler-sayfası beklenti notu* | Claude |

\* `d270550f`'teki "hareketler sayfası da farklı" kısmı: hareketler STOK hareketi gösterir (taraf YM üretim girişleri + mamul montaj girişleri) — operatör üretim kaydından tanım olarak farklıdır. Refactor sonrası operatör=rapor eşitliği sağlanınca, hareketler farkı thread cevabında beklenti olarak netleştirilecek; ayrıca YM 'uretim' girişleri = operatör stok-etkili net toplamı mutabakatı canlıda doğrulanacak (Claude).

## Kapsam dışı / dokunma
- Montaj/stok mantığı (tryMontaj, repoUretimBitir) — çalışıyor, DOKUNMA.
- `montajUretim` ayrı kırılım alanı korunur (OEE-dışı bilgi olarak).
- getTrend + getVardiyaAnaliziDetay da aynı çekirdeği kullanacak şekilde bağlanır (kopya sorgu bırakılmaz).
