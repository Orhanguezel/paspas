# Yazılımcı Notu V12 — Deneme üretimi sonrası 5 not

> **İnceleme:** 2026-07-04 — Admin V11 sonrası deneme üretimi yaptı ("büyük ölçüde düzeldi").
> **✅ Montaj sistemi uçtan uca DOĞRULANDI:** 12:42 PARS +1100, 12:44-45 KAPITONE Siyah/Gri/Bej +100'er montaj girişi — V11 zinciri canlıda çalışıyor.

## Özet

| # | Not | Konu | Sahip | Durum |
|---|-----|------|-------|-------|
| A | 83f4e339 | Dashboard'da üretim görünmüyor | Claude | kök bulundu → fix |
| B | 07aced9d | Otomatik sevk emri kaldırılsın | Claude | kök bulundu → fix |
| C | 50110146 | Makine sıralaması (Enj 1 → Enj 2) | Codex | tamamlandı |
| D | aa3116de | Veri girişinde önceki toplamlar + mobil tasarım | Codex | tamamlandı |
| E | 1ea4431f | Planlama ekranı güncelleme/cache sorunu | Codex | tamamlandı |

---

## A — Dashboard'da gerçekleşen üretim yok (`83f4e339`)

**Kök neden:** Yeni modelde mamul stoğa `referans_tipi='montaj'` girişiyle girer. [hareketler/repository.ts kaynakTipiExpression](backend/src/modules/hareketler/repository.ts#L68) CASE'inde 'montaj' eşlemesi yok → `else 'manuel'` → dashboard'ın `kaynakTipi=uretim & kategori=urun & period=today` sorgusuna girmiyor.

**Fix (Claude):** CASE'e `when 'montaj' then 'uretim'` ekle — montaj da bir üretim kaynağıdır. Dashboard + Hareketler ekranı filtresi birlikte düzelir.

## B — Otomatik sevk emri kaldırılsın (`07aced9d`)

**Admin kuralı (net):** Sevk bekleyenler = (siparişi VE stoğu olan) VEYA (siparişi olup üretimde olan). Kullanıcı sevk emrini **kendisi** oluşturur; **sistem otomatik sevk emri OLUŞTURMASIN.**

**Kanıt:** Bugün SVK-062/063/064 otomatik oluştu (otomatik_olusturuldu=1) ve sevk edildi → KAPITONE SİYAH üretilen 100 iken 200 sevk edilip stok **-100**'e düştü. Admin'in şikayetinin somut zararı.

**Fix (Claude):** [operator/repository.ts](backend/src/modules/operator/repository.ts) `runNonBlockingStep('otomatik_sevk_emri', ...)` çağrısını kaldır (üretim bitince otomatik sevk emri üretilmez). Sevk bekleyenler görünürlük kuralı zaten V9-B ile doğru.
**Veri notu (admin'e soru):** Bugünkü 3 otomatik sevk fiziksel sevk edilmiş durumda (deneme). Geri alınsın mı (stoklar düzelir: KAPITONE Siyah -100→100, Gri 50→100, Bej 80→100) yoksa kalsın mı?

## C — Makine sıralaması (`50110146`) — Codex ✅

Operatör ekranı + Makine İş Yükleri: önce Enjeksiyon 1, sonra Enjeksiyon 2 (Ekstrüzyon sonda). Şu an `repoListMakineKuyrugu` `asc(makine_id)` (UUID — rastgele). Makine `kod` alanına göre deterministik sırala ('Enjeksiyon 1' < 'Enjeksiyon 2'; Ekstrüzyon'u sona koymak için kod bazlı özel sıra veya sira kolonu — Codex mevcut şemaya göre en temiz yolu seçsin, ALTER yasak; gerekirse yeni seed dosyası).

**Codex uygulama:** `gosterim_sira` seed'i + operatör kuyruğu / makine havuzu / Makine İş Yükleri sıralaması.

## D — Üretim veri girişlerinde önceki toplamlar + mobil (`aa3116de`) — Codex ✅

- Günlük üretim / duraklat / bitir giriş modallarında, o işe daha önce girilmiş **miktar toplamları** bilgi amaçlı gösterilsin (backend `oncekiNet/oncekiFire` zaten hesaplıyor — `operator_gunluk_kayitlari` toplamı; DTO'ya eklenip modalda gösterilebilir).
- Ekli tasarım görseli: `/uploads/admin/operator/...` (thread aa3116de ekinde).
- Giriş ekranları mobile uygun büyük tasarlansın (operatör telefon kullanıyor).

**Codex uygulama:** Günlük Üretim / Duraklat / Bitir sheet'lerinde önceki üretim-fire toplam kartı ve büyük mobil input/butonlar.

## E — Planlama ekranı güncelleme sorunu (`1ea4431f`) — Codex ✅

- Yeni üretim emri oluşturunca "Makine ve Montaj Planlama" bloğu hemen gelmiyor (sekme değiştirince geliyor) → RTK Query cache invalidation eksik (aktarım mutation'ı ilgili tag'leri invalidate etmiyor).
- Silmede "silindi" diyor ama listede kalıyor, ikinci silmede gidiyor → aynı invalidation eksiği.
- Fix: aktarım/silme mutation'larına doğru `invalidatesTags` ekle (uretim-emirleri list + makine havuzu/kuyruk tag'leri).

**Codex uygulama:** Üretime aktar/create/update invalidation kapsamı genişletildi; çift taraflı üretim satırı silme tüm bağlı emirleri tek onayla siler.

---

**Sıra:** A+B (Claude, hemen) → C+D+E (CODEX-PROMPT-V12). Push YOK (Codex); Claude review+deploy+thread kapatma.

---

## Kapanış (2026-07-04)

- **A/B (Claude):** deploy `cc373d1` — Dashboard montaj kaynağı + otomatik sevk emri kaldırıldı. Canlı doğrulandı.
- **C/D/E (Codex):** deploy `47692ea` (+ Claude seed fix). Review'da **C'de bug yakalandı**: seed 208 CASE 'ENJ-01'/ad kalıbı ariyordu ama gerçek kod 'Enjeksiyon 1/2' → Enjeksiyon'lar sıra 999 kalıyordu; `kod LIKE 'enjeksiyon%1%'` eklendi. Canlı doğrulandı: Enj1=1, Enj2=2, Ekstrüzyon=3.
- **5/5 thread resolved. Açık not: 0.**
- **Açık admin sorusu:** bugünkü 3 deneme otomatik sevkinin (SVK-062/063/064) geri alınıp alınmayacağı (KAPITONE stokları 100/100/100'e düzelir).
