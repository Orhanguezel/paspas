# CODEX-PROMPT V9 — Vardiya + Tuna Siyah stok + Sipariş İşlemleri feature'ları

> **Kaynak:** [CEKLIST-V9.md](CEKLIST-V9.md). A + B maddeleri Claude tarafından deploy edildi (commit 69448f1). Bu brief **C, D, E, F, G, H**.
> **Yeni şema YOK. ALTER YASAK.** Push etme — Claude review + deploy + canlı veri fix + thread kapatır.
> Her madde ayrı commit. Build: backend `bun run build`, admin `bunx tsc --noEmit` + sonda `bun run build`.

---

## C — Vardiya toplamları sıfır (`5d739c6d`)

**Kök neden:** Gece vardiyası gece yarısını aşıyor (19:30 → ertesi 07:30). Tek-gün görünümünde üretim penceresi o günün `[00:00, 23:59]`'una clamp'leniyor → gece yarısından sonraki üretim kesiliyor → kart Net 0. Kanıt: 900T ÖN 07-01 gece, clamp'li net 0 / gerçek net 1090.

**Dosya:** `backend/src/modules/vardiya_analizi/service.ts`
- `dateRange` (satır ~221): tek-gün (`tarih`) seçiminde `bitis`i **ertesi gün 07:30**'a genişlet (gece vardiyasının bitişini kapsasın). Yani:
  ```ts
  const tarih = query.tarih ?? new Date().toISOString().slice(0, 10);
  const baslangic = new Date(`${tarih}T00:00:00`);
  const bitisGun = new Date(`${tarih}T00:00:00`);
  bitisGun.setDate(bitisGun.getDate() + 1);
  bitisGun.setHours(7, 30, 0, 0); // gece vardiyası ertesi 07:30'da biter
  return { baslangic, bitis: bitisGun, tarihLabel: tarih };
  ```
- Vardiya üretim penceresi clamp'i (satır ~751-752): `effectiveBitis`, vardiyanın **gerçek `bitis`ini** (açık vardiyada `now`) kesmemeli. `clampDate(v.bitis ?? now, baslangic, bitis)` — üst sınır artık genişlediği için gece vardiyası düzgün kapsanır. Gündüz vardiyasının (07:30-19:30) yanlışlıkla ertesi güne taşmadığını doğrula (v.bitis zaten 19:30).
- **Dikkat:** Bu değişiklik `dateRange`'i kullanan tüm sorguları etkiler; hafta/ay/özel aralık davranışı bozulmamalı (yalnız tek-gün dalı değişiyor).

---

## D — Vardiya default açılış (`46e29152a`)

**İstenen davranış:**
- GÜNDÜZ saatinde açılış (07:30-19:30): bir önceki **gündüz** vardiyası + onu takip eden **gece** vardiyası. Örnek 02/07 gündüz açılış → 01/07 gündüz + (01→02) gece.
- GECE saatinde açılış (19:30-07:30): bir önceki **gece** + onu takip eden **gündüz**. Örnek (02→03) gece açılış → (01→02) gece + 02/07 gündüz.

**Dosya:** `admin_panel/src/app/(main)/admin/vardiya-analizi/_components/vardiya-analizi-client.tsx` (satır ~209-260).
- Default state'i o anki saate göre hesapla: `const h = new Date().getHours() + new Date().getMinutes()/60;` gündüz aralığı `[7.5, 19.5)`.
- Vardiya çifti gece yarısını aştığından tek `tarih` yerine `{baslangicTarih, bitisTarih}` **range query** kullan (C fix'i bunu backend'de zaten destekliyor).
  - Gündüz açılış: baslangicTarih = dün, bitisTarih = bugün (dün gündüz + dün→bugün gece).
  - Gece açılış (saat ≥ 19:30): baslangicTarih = dün, bitisTarih = bugün? — dikkatli hesapla: (dün→bugün) gece + bugün gündüz. Gece 00:00-07:30 arası açılışta (bugünün erken saati) → baslangicTarih = evvelki gün, bitisTarih = dün.
- `rangePreset`'i "özel/vardiya-çifti" moduna al; vardiyaTipi filtresini boş bırak (ikisi de gelsin).
- Not: C fix'i olmadan gece tarafı boş kalır — ikisi birlikte test edilmeli.

---

## E — Vardiya makine2 montaj gösterimi (`46e29152b`) — KARAR: ayrı "montaj" kırılımı

**Kök neden:** V7 montaj hariç tutma filtresi (`service.ts:585,711,774,800,1079,1175` — `emir_operasyon_id IS NULL OR COALESCE(montaj,0)=0`) montaj-only makineyi (900T ARKA) tümüyle eliyor → "kayıt yok".

**Karar (admin onayı):** Montaj üretimini **ayrı bir kırılım** olarak göster; verimlilik/OEE hesabına **katma** ama ekranda görünsün.

**Uygulama:**
- Backend `service.ts`: mevcut üretim/operasyon sorguları montaj hariç kalmaya devam etsin (OEE bozulmasın). **Ek olarak** her vardiya/makine için `montaj=1` kayıtlarını ayrı sorgula (net miktar + adet) ve response DTO'suna `montajKirilimi` / `montajToplam` alanı ekle.
- `VardiyaAnalizItem` ve makine özet tiplerine `montajUretim: { netToplam: number; kayitSayisi: number; operasyonlar: {...} }` ekle.
- Frontend `vardiya-analizi-client.tsx`: makine kartında/vardiya kartında montaj üretimi ayrı satır olarak göster ("Montaj üretimi: X adet — OEE'ye dahil değil"). Makine artık boş görünmez.
- OEE/verimlilik formülleri montaj netini KULLANMAMAYA devam etsin.

---

## F — Tuna Siyah üretilen stokta yok (`48ae4a9a`) — KARAR: çift taraflı

**Kök neden (kanıtlı):** TUNA SİYAH (1114 101) `operasyon_tipi='tek_tarafli'` ama üretim emri UE-2026-0079'da 2 operasyon var (Aramamul Sağ + Sol, ikisi `montaj=0`). `operator/repository.ts` `hasIncrementalStockImpact`: opCount=2 → isSingleSided=false, montaj=1 yok → **stok etkisi false** → günlük üretim (net 3695) hiç stoğa/mamüle yansımıyor.

**⚠️ Kritik veri modeli farkı — ÖNCE BUNU NETLEŞTİR:**
İki farklı çift-taraflı model bir arada var:
- **Megane modeli (V8):** Her taraf AYRI üretim emri (UE-0073 urun_id=Sol operasyonel_ym, UE-0074 urun_id=Sağ). Montaj taraf stoklarını tüketip mamul stoğu üretir.
- **Tuna modeli (UE-0079):** TEK üretim emri, urun_id=**mamul** (1114 101), 2 operasyon (Sağ/Sol) alt-adım olarak. Taraflar ayrı stok kalemi olarak üretilmiyor.

V8 `tryMontajForUretimEmri` Megane modeline göre yazıldı (linkedKalem + operasyonel_ym reçete kalemleri). Tuna modelinde (tek emir, urun_id=mamul) bu akış **çalışmaz** (emir zaten mamul; reçetede operasyonel_ym Sağ/Sol'un ayrı stoğu tüketilecek şey değil).

**KARAR (admin: çift taraflı):** Ama Codex önce **hangi modele göre düzeltileceğine** karar vermeli:
- **Yol F1 (önerilen — Tuna modelini koru):** Tek emir + 2 operasyon. `hasIncrementalStockImpact` mantığını düzelt: çok operasyonlu ama montaj-op'suz emirlerde, **tüm operasyonlar tamamlanınca** son operasyonun tamamlanması mamul stoğunu artırsın (VEYA operasyonlardan biri montaj=1 işaretlensin ve o operasyon bitince mamul stoğu = min(operasyon üretimleri) kadar artsın — achievable). Bu, üretime-aktarma sırasında iki-operasyonlu tek-emir mamullerinde tutarlı stok üretir.
- **Yol F2:** Tuna'yı Megane modeline taşı (2 ayrı emir). Mevcut veriyi migrate etmek gerekir — riskli.

**Codex'ten beklenen:** F1'i uygula (tek emir modelinde çok-operasyonlu montaj/stok mantığını netleştir). Somut kural öner ve `hasIncrementalStockImpact` + emir tamamlanma akışını (`operator/repository.ts` ~1128-1352) buna göre düzelt. **Sessiz veri kaybını bitir:** çok-op + montaj-yok emir stoğu sıfırlamasın.
- **Yanlış kurulmuş ürünleri tara:** `operasyon_tipi='tek_tarafli'` olup üretim emrinde 2+ operasyonu olan (özellikle "-Sağ"/"-Sol"/"Aramamul" adlı) ürünleri raporla (Claude canlıda inceleyip düzeltir).
- **Canlı veri düzeltmesi (UE-2026-0079 ve benzerleri) CLAUDE yapar** — kod netleştikten sonra.

> **Codex:** Bu madde karmaşık; kod yazmadan önce F1 kuralını netleştir ve gerekirse CEKLIST'e yaz. Emin değilsen DUR, Claude'a sor.

---

## G — Sipariş İşlemleri: stok + ikili gösterim + kalan toplam (`a3b123c2`)

**Sayfa:** `/admin/satis-siparisleri` "Sipariş İşlemleri" sekmesi.
- Her satıra o ürünün **stok miktarı** kolonu ekle.
- **Üretilen** kolonu ikili: `üretilen / kalan` (kalan = miktar − üretilen).
- **Sevk Edilen** kolonu ikili: `sevk / kalan` (kalan = miktar − sevk edilen).
- Ürün bazlı filtre aktifken **kalan miktar toplamı** göster; ürün alt grubu filtresinde de kalan toplamı.
- Backend: ilgili liste endpoint'i stok + üretilen + sevk + kalan alanlarını dönmeli (mümkünse mevcut özet sorgusundan türet).

## H — Sipariş İşlemleri: sipariş bazlı filtre (`f73c65ff`)

- Mevcut görünümler: düz liste, müşteri bazlı, ürün bazlı, ürün alt grubu. **Sipariş bazlı** ekle (sipariş no'ya göre grupla).
- Son sütundaki **Kapat** butonu **yalnız sipariş bazlı** görünümde aktif; diğer görünümlerde gösterilmesin.

---

## Sıra (öneri)
1. C + D (vardiya — birlikte test).
2. E (montaj kırılımı).
3. F (önce F1 kuralını netleştir, sonra uygula — Claude canlı veri).
4. G + H (feature).
