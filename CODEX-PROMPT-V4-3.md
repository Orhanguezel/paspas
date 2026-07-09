# Codex Prompt — Paspas ERP V4-3 (Yükle/Sevket + Otomatik Sevk Emri)

Aşağıdaki içeriği olduğu gibi Codex'e ver.

---

## 🤖 GÖREV — Codex'e

Sevkiyatçıya özel mobil "Yükle/Sevket" ekranı + otomatik sevk emri özelliği. Claude tüm kararları verdi (admin'e sormadan, kanıta dayalı) ve şemayı hazırladı.
👉 **[CEKLIST-V4-3.md](./CEKLIST-V4-3.md)** — Bölüm 0 (7 karar D1-D7), 0b (şema), 0c (bulgular H1-H5), 1 (yapılacaklar).

### Önce oku
1. **CEKLIST-V4-3.md** — özellikle **Bölüm 0 (KARARLAR D1-D7)** kesinleşmiş, sorgulamadan uygula.
2. **backend/CLAUDE.md** + **admin_panel/CLAUDE.md**.

### Şema hazır (Claude uygular)
- [204_sevk_emirleri_otomatik.sql](backend/src/db/seed/sql/204_sevk_emirleri_otomatik.sql) → `sevk_emirleri.otomatik_olusturuldu` + `kaynak_uretim_emri_id`. Sen yalnız Drizzle `sevkEmirleri` şemasına bu 2 alanı ekle. **Başka ALTER/şema YOK.**

### Sıra: V4-3a (mobil ekran) → V4-3b (otomatik sevk)

### V4-3a — Sevkiyatçı mobil ekran (D1+D2)
- `nakliyeci` rolüyle [sevkiyat-client.tsx](admin_panel/src/app/(main)/admin/sevkiyat/_components/sevkiyat-client.tsx)'te **yalnız Yükle/Sevket sekmesi** render edilsin (diğer 2 sekme gizli). Admin hepsini görür.
- Yükle/Sevket **mobil-öncelikli** (operatör ekranı kalıbı: büyük kart/buton, `grid-cols-1`, `overflow-x-hidden`).
- **Bekliyor + Onaylı** görünür; bekliyor → sevk butonu **pasif** + "Onay bekliyor"; onaylandı → "Fiziksel Sevket" aktif.
- Fiziksel sevk: miktar (planlanan default, değiştirilebilir, **stok üstü engellenir** — mevcut V3-Y2 kuralı) → kaydet → stoktan düş.
- Backend: `nakliyeci` için planlama/oluşturma/onay aksiyonları **403**; fiziksel sevk + okuma izinli.

### V4-3b — Otomatik sevk emri (D3-D7)
- Drizzle `sevkEmirleri` şemasına `otomatik_olusturuldu` + `kaynak_uretim_emri_id` ekle.
- **Hook:** [operator/repository.ts](backend/src/modules/operator/repository.ts) `repoUretimBitir` — stok girişi (`stokFarki`, montaj/tek-taraf, ~satır 1044-1091) **sonrasında, transaction dışında** `runNonBlockingStep('otomatik_sevk_emri', async () => { ... })`:
  1. Üretim emri **sipariş-bağlı mı** (`uretim_emri_siparis_kalemleri`)? Değilse atla (D7).
  2. `siparis_kalem_id` için açık (`bekliyor`/`onaylandi`) sevk emri var mı? Varsa atla (D5-1).
  3. Bu `kaynak_uretim_emri_id`'den otomatik açıldı mı? Açıldıysa atla (D5-2).
  4. Yoksa **`bekliyor`** sevk emri oluştur (D4): `miktar=stokFarki` (D6), `tarih=planlanan` (24:00 kuralı: bitiş saati **<08:00** → bitiş günü, **>=08:00** → bitiş günü+1), müşteri/sipariş/kalem/ürün siparişten, `otomatik_olusturuldu=1`, `kaynak_uretim_emri_id=<emir id>`. No üretimi: mevcut `generateSevkEmriNo` ([sevkiyat/repository.ts](backend/src/modules/sevkiyat/repository.ts) ~satır 20).
  - Hata izolasyonu zaten `runNonBlockingStep` ile (V3-B1 kalıbı) — otomatik sevk hatası üretim bitişini bozmaz.
- **Frontend:** Sevk Emirleri listesinde `otomatik_olusturuldu` olanlara "Otomatik" rozeti (admin elle/otomatik ayırsın).

### Kabul kriterleri — CEKLIST-V4-3 Bölüm 2.

## Kurallar
- Her parça ayrı commit. Build: backend `bun run build` + admin `bun x tsc --noEmit`, sonunda admin `bun run build`.
- **ALTER/yeni şema YOK** (204 hazır). **Push etme** — Claude review + seed uygula + deploy + thread kapatma.
- Belirsizlik → DUR, sor.

## Rapor
```
[Codex] V4-3a tamam. Sıra: V4-3b. Build: OK.
[Codex] V4-3 tamamlandı. Build OK. Claude'a hazır.
```
