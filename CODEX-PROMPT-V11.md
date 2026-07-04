# CODEX-PROMPT V11 — Operatör ekranı mamul adı + planlamada taraf stokları (UI)

> **Kaynak:** [CEKLIST-V11.md](CEKLIST-V11.md) not `51ac56d3`. Çekirdek montaj fix'i Claude tarafından yayına alındı (commit `2d57988` + `977e78f` + seed 206/207). Bu brief kalan **2 UI işi**.
> **Yeni şema YOK. ALTER YASAK.** Push etme — Claude review + deploy + thread kapatır.

## Bağlam (değişen mimari — bilmen gereken)
- Çift taraflı üründe her taraf **ayrı üretim emri** (urun_id = operasyonel_ym Sağ/Sol). Sol (-L/-SL) ve tek parça (-X/-PR) operasyonları `montaj=1` doğar; Sol emri tamamlanınca `tryMontajForUretimEmri` taraf stoklarını tüketip mamul stoğu üretir (achievable: min).
- Taraf YM'lerin stok takibi artık her zaman açık; taraf stokları gerçek envanterdir.

## İş 1 — Operatör ekranında mamul (asıl ürün) adı (notun 1. şikayeti)

**Durum:** ✅ Tamamlandı. Operatör kuyruk DTO'su asıl ürün kod/ad alanlarını döner; iş kartlarında varsa mamul adı büyük başlık, YM adı/kodu alt satır olarak gösterilir.

**Şikayet:** Ekranda yalnız YM adı görünüyor ("Pars Siyah Aramamul Sol"); mamul adı ("PARS SİYAH - GMAX") kayboldu — emirler artık YM'ye ait olduğu için.

**Backend:** `operator/repository.ts` `repoListMakineKuyrugu` select'ine asıl ürün alanları ekle. Türetme: emrin `urun_id`'si (YM) → aktif reçete kalemi → reçetenin mamulü:
```sql
(SELECT u2.ad FROM recete_kalemleri rk
  JOIN receteler r2 ON r2.id = rk.recete_id AND r2.is_active = 1
  JOIN urunler u2 ON u2.id = r2.urun_id AND u2.kategori = 'urun'
  WHERE rk.urun_id = uretim_emirleri.urun_id LIMIT 1) AS asil_urun_ad
```
(benzeri `asil_urun_kod`). DTO'ya `asilUrunAd`/`asilUrunKod` ekle (YM değilse null).

**Frontend:** Operatör iş kartında büyük başlık = **mamul adı** (varsa), hemen altında YM adı + kod (mevcut format). Mamul yoksa (tek katmanlı ürün) bugünkü görünüm.

## İş 2 — Üretim planlamada Sağ/Sol taraf stokları

**Durum:** ✅ Tamamlandı. Makine havuzu atanmamış/kuyruk DTO'ları `urunStok` döner; Makine ve Montaj Planlama satırlarında YM stok rozeti görünür.

**İstek (kullanıcı onaylı senaryo):** "Elde 500 Sol varsa planlamada görünsün → sadece 500 Sağ üretilsin."

**Yer:** `uretim-emirleri` "Üretim Planla" + "Makine ve Montaj Planlama" bloğu (`makine-montaj-planlama.tsx`). Her taraf satırında o YM'nin **güncel stok** miktarını göster (`urunler.stok`) — ör. rozet: "Stok: 1.100". Parti/mamul satırında iki tarafın stoğu yan yana görünebilir.

**Backend:** İlgili liste endpoint'i taraf YM stoklarını zaten dönebiliyorsa kullan; yoksa operasyon satırlarına `urunStok` alanı ekle (emir → urun_id → urunler.stok join).

## Sınırlar
- Montaj/stok mantığına DOKUNMA (tryMontaj, repoUretimBitir, consumeRecipeMaterials) — yeni yayınlandı.
- Her iş ayrı commit; backend `bun run build`, admin `bunx tsc --noEmit` + `bun run build` temiz.

**Doğrulama:** ✅ `backend: bun run build`, ✅ `admin_panel: bunx tsc --noEmit`, ✅ `admin_panel: bun run build`.
