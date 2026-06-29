# CODEX GÖREV — Satın Alma: Manuel Kapat + Açık Liste

> **Mimar (Claude) görev paketi — 2026-06-29.** Kaynak: müşteri yazılımcı notu (`/admin/satin-alma` "Satın Alma siparişi durumu").
> **Durum:** Paspas ERP **teslim edilmiş, canlı**. Akış: Codex implement → **Claude review + deploy** (push etme).

---

## Müşteri talebi (aynen, özet)
1. **Manuel kapat:** Bazen 2000 sipariş edilir, 1950 teslim alınır → sistem "kısmen teslim" görür, sipariş **açık kalır**. Kullanıcı bunu **elle kapatabilsin** (kalanı gelmeyecek, sipariş bitti).
2. **Liste tüm açıkları göstersin:** Ekran açılınca taslak / sipariş verildi / onaylandı / kısmen teslim — **tamamı teslim alınmamış her sipariş açık sayılır** ve görünür.

## Doğrulanmış mevcut durum (Claude)
- `durum` = **varchar(32)** ([schema.ts:10](backend/src/modules/satin_alma/schema.ts)) → **`kapali` değeri eklemek için ALTER GEREKMEZ** (sadece enum'lara değer ekle).
- Enum: `taslak, onaylandi, siparis_verildi, kismen_teslim, tamamlandi, iptal` ([validation.ts:5](backend/src/modules/satin_alma/validation.ts)) — **`kapali` yok**.
- **Sorun:** `durum='tamamlandi'` yapınca [repository.ts:461](backend/src/modules/satin_alma/repository.ts) **her kalem için TAM miktarda mal kabul kaydı** oluşturuyor. Kısmi teslimde tamamlandı yapmak → alınmayan 50 adedi de teslim almış sayar (yanlış stok). Yani **"kapat" ≠ "tamamlandı"** olmalı.
- Liste ([repository.ts buildWhere ~35](backend/src/modules/satin_alma/repository.ts)): durum filtresi **yok** → şu an HER durum görünüyor (kapalılar dahil). Açıklar görünüyor ama kapalılar da kalabalık yapıyor.

## Yapılacaklar

### 1. `kapali` statüsü ekle (ALTER yok — varchar)
- `validation.ts` durumEnum → `'kapali'` ekle.
- Frontend enum + `SATIN_ALMA_DURUM_LABELS` / `SATIN_ALMA_DURUM_BADGE` ([satin_alma.types.ts](admin_panel/src/integrations/shared/erp/satin_alma.types.ts)) → "Kapalı" etiketi/rozeti.
- Form select'e `kapali` eklemek **şart değil** (kapatma ayrı buton ile yapılacak); ama tutarlılık için label olsun.

### 2. Manuel "Kapat" aksiyonu (mal kabul TETİKLEMEDEN)
- `durum='kapali'` PATCH'i **mal kabul kaydı OLUŞTURMAZ** (receipt yalnızca `tamamlandi`'da). Kısmen teslim → kapalı: sadece alınmış miktar stokta kalır, kalan beklenmez.
- Yalnızca **açık** durumlardan (taslak/onaylandi/siparis_verildi/kismen_teslim) `kapali`'ya geçişe izin ver. `tamamlandi`/`iptal` zaten kapalı.
- Backend: mevcut PATCH durum yolu yeterli (kapali → receipt yok). Gerekirse net bir `POST /admin/satin-alma/:id/kapat` ekle (daha açık API).

### 3. Liste: kapalıları gizle, açıkların hepsini göster
- `buildWhere`: `query.durum` ve `tamamlananlariGoster` (yeni opsiyonel) yoksa → `durum NOT IN ('tamamlandi','iptal','kapali')`. (satış/üretim modüllerindeki desenle birebir.)
- Böylece ekran açılınca **sadece açık** siparişler (taslak/onaylandi/siparis_verildi/kısmen teslim) gelir; kapatılanlar düşer. İstenirse "tamamlananları göster" toggle'ı (opsiyonel).

### 4. Frontend: "Kapat" butonu
- Satın alma liste ve/veya detayda, **açık** siparişlerde "Kapat" butonu → onay → `kapali`. Kısmen teslim siparişlerde özellikle görünür olsun.
- Kapatınca listeden düşer (filtre gereği) + toast.

## Kısıtlar
- **ALTER YASAK** (durum varchar olduğu için zaten gerekmez). Yeni tablo yok.
- `tamamlandi`'nın mevcut **mal kabul** davranışı **bozulmasın** (sadece kapali ayrı yol).
- Diğer roller/akışlar etkilenmesin. TS strict, `any` yok. Backend `bun run build`; admin `tsc --noEmit` + `bun run build`. **Push etme.**

## Doğrulama (Claude)
- Kısmen teslim bir siparişte "Kapat" → `kapali`, **mal kabul kaydı oluşmaz** (stok kalan miktarı eklemez), sipariş listeden düşer.
- Liste açılınca tüm açık durumlar görünür, kapalı/tamamlandı/iptal görünmez.
- Build temiz; mevcut tamamlandı→mal kabul akışı çalışıyor.

## Referans
- Backend: `backend/src/modules/satin_alma/{validation,repository,controller,schema}.ts`
- Frontend: `admin_panel/src/app/(main)/admin/satin-alma/_components/*`, `integrations/shared/erp/satin_alma.types.ts`
- Desen (liste filtresi): satış `repository.ts:45` (notInArray), üretim `repository.ts:178` (NOT IN).
