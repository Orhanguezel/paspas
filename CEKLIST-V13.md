# Yazılımcı Notu V13 — Planlama/silme + makine sırası + montaj default

> **İnceleme:** 2026-07-07 — Claude canlı DB + kod + 3 ekran görüntüsü.
> **3 not.** Biri KRİTİK bloklayıcıydı (Claude hemen çözdü), diğer ikisi Codex'e.

## Özet

| # | Not | Konu | Sahip | Durum |
|---|-----|------|-------|-------|
| A | 90020fcd | Planlama/silme yapılamıyor (kuyruk sorgusu çöküyor) | **Claude** | ✅ deploy `cb1bbf1` |
| B | 4e29247f | Makine sırası hâlâ yanlış (is-yükler + operatör) | Codex | ✅ tamamlandı |
| C | 9e77dc2f | Montaj tarafı default seçimi (Enjeksiyon 2) | Codex | ✅ tamamlandı |

---

## A — Planlama/silme yapılamıyor (`90020fcd`) — ✅ KRİTİK, ÇÖZÜLDÜ (Claude)

**Belirtiler (3 görsel):**
1. "Makine planı yapılmış üretim emri silinemez" → **doğru çalışıyor**, dokunulmadı.
2. "Makineden Çıkar" → "Bu emrin kuyrukta atanmış operasyonu bulunamadı" → hiçbir emir silinemiyor.
3. Makine ve Montaj Planlama'ya ikinci girişte "bu partiye ait planlanabilir operasyon bulunamadı", Yenile de çözmüyor.

**Kök neden (kanıtlı):** `makine_havuzu/repository.ts` `repoListKuyruklar` sorgusu `ORDER BY makineler.gosterim_sira, makineler.kod` içeriyordu ama **`makineler` tablosu bu sorguya JOIN edilmemişti.** MySQL: `ERROR 1054 Unknown column 'makineler.gosterim_sira' in 'order clause'` → sorgu tamamen çöküyor → kuyruk endpoint boş dönüyor → hem "Makineden Çıkar" hem "Makine ve Montaj Planlama" bloğu (ikisi de bu endpoint'i kullanır) veri bulamıyor.

**Regresyon kaynağı:** V12 C fix'i (commit 909838d/47692ea) gosterim_sira sıralamasını eklerken bu sorguya makineler join'i eklemeyi atlamıştı.

**Fix (Claude, `cb1bbf1`):** `repoListKuyruklar`'a `.innerJoin(makineler, ...)` eklendi. Canlı doğrulama: kuyruk 7 satır dönüyor, makine sırası da doğru (900 T ÖN → ARKA). Artık silme + planlama çalışır.

---

## B — Makine sırası hâlâ yanlış (`4e29247f`) — Codex

**Şikayet:** Makine iş yükleri + operatör ekranında sıra hâlâ yanlış. Olması gereken: Enjeksiyon 1 (900 T ÖN) → Enjeksiyon 2 (900 T ARKA).

**Kök neden (kanıtlı):** Makine LİSTESİ sorgusu (`useListMakinelerAdminQuery` → `repoListMakineler`) sıralamayı `getOrderBy`'dan alıyor; ama `validation.ts` `sort` **default'u `'created_at'`** (satır 19). Bu yüzden `getOrderBy` `gosterim_sira` dalına (satır 39) hiç girmiyor → makineler `created_at DESC` sırasında dönüyor. is-yükler + operatör frontend'i makine sırasını bu listeden aldığı için sıra yanlış.
> Not: kuyruk (312, Claude düzeltti), is-yükler (117) ve operatör (875) sorguları JOIN + gosterim_sira ile doğru; sorun yalnız makine LİSTE sorgusunun default sıralaması.

**Fix (Codex):** Makine listesi default sıralaması `gosterim_sira` olmalı.
- En temiz: `getOrderBy`'da hiçbir açık sort verilmediğinde `gosterim_sira` döndür. Şu an default `sort='created_at'` olduğu için bu dal hiç çalışmıyor — `validation.ts` default'unu kaldır/değiştir (ör. `sort` opsiyonel bırak, default verme; `getOrderBy` `query.sort` undefined ise `gosterim_sira` döndürsün). VEYA `sortEnum`'a `'gosterim_sira'` ekleyip default'u ona çevir.
- **Frontend doğrula:** is-yükler (`is-yukleri-client.tsx` machineList `makineler.items`'ten) ve operatör ekranı makine sekme/grup sırasını bu listeden alıyor; backend düzelince ikisi de düzelmeli. Operatör client'ta ayrıca makine bazlı gruplama sırası API sırasını korumalı (varsa ek re-sort'u kaldır).
- **DİKKAT:** Bu değişiklik makine listesini kullanan başka ekranları (dropdown vb.) etkiler — hepsinde gosterim_sira mantıklı; ama açık `sort=ad/kod` isteyen bir ekran varsa bozulmamalı (o dallar korunur).

**Durum:** ✅ `backend/src/modules/makine_havuzu/validation.ts` içinde `sort` default'u kaldırıldı; açık `sort=ad|kod|created_at` istekleri korunurken default liste `getOrderBy` fallback'iyle `gosterim_sira` sırasına düşüyor.

---

## C — Montaj tarafı default seçimi (`9e77dc2f`) — Codex

**İstek:** Çift taraflı üretimde "Makine ve Montaj Planlama"da montaj, iki taraftan birinde default seçili gelsin:
- **Enjeksiyon 2**'ye atanan tarafta montaj **"evet"** default gelsin.
- Kullanıcı bunu "hayır" yaparsa **Enjeksiyon 1** tarafı "evet" olsun.
- Her durumda **ikisinden biri mutlaka montaj=evet** (montaj-siz kalamaz).

**Bağlam:** Montaj bir operasyonun (`uretim_emri_operasyonlari.montaj`) özelliği; blokta `makine-montaj-planlama.tsx` her taraf satırında Montaj Evet/Hayır seçtiriyor (`updateOperasyonPlanlari` ile). V11'de default montaj = Sol taraf kuralı vardı; admin şimdi **makineye göre** (Enjeksiyon 2 tarafı) istiyor.

**Fix (Codex) — `makine-montaj-planlama.tsx`:**
- Bir partinin iki tarafı için montaj **karşılıklı dışlayıcı (mutually exclusive)** olsun: biri "evet" olunca diğeri otomatik "hayır".
- Default: Enjeksiyon 2'ye (900 T ARKA / gosterim_sira=2) atanmış taraf montaj=evet. Henüz makine atanmamışsa V11 kuralı (Sol) fallback.
- Kullanıcı montaj=evet'i diğer tarafa alırsa (veya mevcut "evet"i "hayır" yaparsa) diğer taraf otomatik "evet" olur — hiçbir zaman ikisi de hayır olamaz.
- Backend `operasyon-planlari` PATCH montaj set edebiliyor (mevcut). Gerekirse iki operasyonu tek istekte gönder (biri evet biri hayır) ki tutarlı kalsın.

**Durum:** ✅ `makine-montaj-planlama.tsx` çift taraflı gruplarda montajı karşılıklı dışlayıcı yapıyor; Enjeksiyon 2 / 900 T ARKA tarafını, makine yoksa Sol tarafı default seçiyor. `operasyon-planlari` PATCH operasyon id'leri üzerinden toplu güncellenecek şekilde uyumlu hale getirildi.

**Doğrulama:** ✅ backend `bun run build`, admin `bunx tsc --noEmit`, admin `bun run build`.

---

## Sıra / Sınırlar
- A: Claude tamamladı (deploy).
- B + C: [CODEX-PROMPT-V13.md](CODEX-PROMPT-V13.md). Push YOK — Claude review + deploy + thread kapatma.
- Montaj/stok mantığına (tryMontaj, repoUretimBitir) DOKUNMA.
