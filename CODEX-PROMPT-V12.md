# CODEX-PROMPT V12 — Makine sıralaması + operatör veri girişi UI + planlama cache

> **Kaynak:** [CEKLIST-V12.md](CEKLIST-V12.md). A (dashboard montaj kaynağı) + B (otomatik sevk emri kaldırma) Claude tarafından yayında (commit `cc373d1`). Bu brief **C, D, E**.
> **Yeni şema:** yalnız C için gerekirse yeni idempotent seed dosyası (208+). **ALTER YASAK.** Push etme — Claude review + deploy + thread kapatır.

## C — Makine sıralaması (`50110146`)

**Durum:** ✅ Tamamlandı. `makineler.gosterim_sira` için idempotent seed eklendi; operatör kuyruğu, makine havuzu kuyrukları ve Makine İş Yükleri bu sırayı kullanır.

Operatör ekranı ve Makine İş Yükleri'nde sıra: **Enjeksiyon 1 → Enjeksiyon 2 → Ekstrüzyon**.
- Şu an `operator/repository.ts repoListMakineKuyrugu` `asc(makineKuyrugu.makine_id)` (UUID — anlamsız sıra). İş yükleri (makine_havuzu) sorgularını da kontrol et.
- Öneri: `makineler` tablosunda mevcut kullanılabilir bir alan var mı bak (`oncelik/sira` yoksa): en temiz çözüm yeni seed `208_makine_gosterim_sira.sql` ile `gosterim_sira int` kolonu (INFORMATION_SCHEMA guard'lı, 205 örneğindeki desen) + `UPDATE` ile Enjeksiyon 1=1, Enjeksiyon 2=2, Ekstrüzyon=3; sorgularda `ORDER BY gosterim_sira, kod`. Alternatif (şemasız): `ORDER BY kod` yeterliyse ('Ekstrüzyon' < 'Enjeksiyon' alfabetikte önce gelir — YETERLİ DEĞİL, admin Enjeksiyon önce istiyor) → kolon yolu tercih.
- Operatör client'ta makine sekme/kart sırası da API sırasını korusun.

## D — Üretim veri girişlerinde önceki toplamlar + mobil tasarım (`aa3116de`)

**Durum:** ✅ Tamamlandı. Günlük Üretim / Duraklat / Bitir ekranlarında önceki üretim-fire toplam kartı gösterilir; giriş sheet'leri mobilde büyük input ve butonlarla düzenlendi.

Admin görsel tasarım ekledi: thread eki `/var/www/paspas/uploads/admin/operator/` altında (thread aa3116de attachments) — uygulamadan önce indir/incele.

- **Günlük Üretim / Duraklat / Bitir** giriş modallarında: bu işe (emir operasyonuna) daha önce girilmiş **üretim + fire toplamları** bilgi kartı olarak gösterilsin ("Şu ana kadar: Üretim X · Fire Y").
- Backend: `repoUretimBitir` zaten `oncekiNet/oncekiFire` topluyor (operator_gunluk_kayitlari, emir_operasyon_id bazlı). Aynı toplamı bir GET ile ver: mevcut kuyruk DTO'suna `oncekiUretimToplam`/`oncekiFireToplam` alanları eklemek en temiz (repoListMakineKuyrugu zaten measurementMap hesaplıyor — aktif işler için; bekleyenler için de doldur veya modal açılışında ayrı endpoint).
- **Mobil:** giriş modalları büyük dokunma alanlı (input h-12+, büyük buton, tek kolon) — operatör telefonda kullanıyor; sevkiyat shipperMode desenine bak.

## E — Planlama ekranı güncelleme/cache sorunu (`1ea4431f`)

**Durum:** ✅ Tamamlandı. Üretime aktarım ve üretim emri create/update akışları makine kuyruğu tag'lerini de invalidate eder; çift taraflı satır silme tüm bağlı emirleri tek onayla siler.

- Üretime aktarım sonrası "Makine ve Montaj Planlama" bloğu ancak sekme değişince görünüyor; silmede liste ancak ikinci "sil"de güncelleniyor.
- Kök: RTK Query `invalidatesTags` eksikleri. Aktarım mutation'ı (üretime aktar) ve emir silme mutation'ı, üretim emirleri listesi + operasyon planları + makine havuzu (atanmamış/kuyruk) tag'lerini invalidate etmeli.
- `admin_panel/src/integrations/endpoints/admin/*uretim*`, `*makine*` endpoint dosyalarında providesTags/invalidatesTags eşleşmesini düzelt. Silme akışında optimistic update varsa iki-kez-sil davranışının kaynağını da düzelt.

## Sınırlar
- Montaj/stok/sevk mantığına DOKUNMA (yeni yayınlandı: cc373d1, 5c91b2e, 977e78f, 2d57988).
- Her madde ayrı commit; backend `bun run build`, admin `bunx tsc --noEmit` + sonda `bun run build` temiz.

**Doğrulama:** ✅ `backend: bun run build`, ✅ `admin_panel: bunx tsc --noEmit`, ✅ `admin_panel: bun run build`.
