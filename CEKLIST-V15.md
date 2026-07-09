# Yazılımcı Notu V15 — Gantt planı: çalışma-günü segmentleri + görünüm düzeltmeleri

> **İnceleme:** 2026-07-09 — Claude canlı kod + 3 ekran görüntüsü (`45366dc9` /admin/gantt).
> **Tek not, 7 madde.** Çoğu tek bir mimari eksikten türüyor: **çubuk, çalışma takvimine göre bölünmüyor.**
> **Yeni şema YOK. ALTER YASAK.**

---

## Kök neden analizi (kanıtlı, kod satırlı)

| # | Admin şikayeti | Kök neden |
|---|----------------|-----------|
| 1 | Aktif üretim mavi şeridi "şimdi" çizgisinde bitiyor, sonra yeni iş başlıyor sanılıyor | `gantt/repository.ts:384-389` — `calisiyor/duraklatildi` işlerde `bitisTarihi = now.toISOString()` (gerçek/planlanan bitiş değil) |
| 2 | Mavi ile sarı şerit arasında olmayan bir boşluk var | (1)'in sonucu + `:392-402` bekleyen işin `planlanan_baslangic`'i geçmişse çubuk `now`'a itiliyor → iki çubuk arası yapay boşluk |
| 3 | Bugün filtresindeyken ileri tarihli iş (Kapitone) görünüyor | `buildWhere:54, :65` — `durum='bekliyor' AND gercek_* IS NULL` koşulları OR ile eklendiği için **aralık filtresi bypass** ediliyor |
| 4 | Hafta sonu sütunu baştan aşağı karartılıyor | Bloklar full-height ve `z-6` → iş çubuklarının (`z-5`) **üstünde** çiziliyor (`gantt-client.tsx:156-162`) |
| 5 | "Bitiş hafta sonuna denk geliyor" uyarısı gereksiz | `gantt-client.tsx:731, :752` |
| 6 | Günlük filtrede tek gün sütunu dar; günün detayı görünmüyor | Kolon genişliği sabit; tek-gün seçiminde ekrana yayılmıyor |
| 7 | **İş hafta sonunda kesilip sonraki iş gününde devam etmeli** (Görsel 3) | Çubuk `baslangic→bitis` **tek parça** çiziliyor. Backend `_shared/planlama.ts` (`isWorkingDay`, `skipToNextWorkingDay`, `addWorkingMinutes`) çalışma takvimini biliyor ama bu bilgi **çizime hiç aktarılmıyor** |

> Madde 7 ana eksik. 4 ve 5 de bunun sonucu: çubuk hafta sonunu kesmediği için üstü "karartılarak" gizlenmeye çalışılmış ve kullanıcı uyarıyla bilgilendirilmeye çalışılmış.

---

## VERİLMİŞ KARARLAR (mimari)

| # | Karar | Gerekçe |
|---|-------|---------|
| **K1** | **Backend her iş için `segmentler[]` döner** — çalışma takvimine (hafta sonu + tatil + makine çalışma planı) göre bölünmüş `{baslangicTarihi, bitisTarihi}` aralıkları. Frontend yalnızca çizer. | Çalışma-günü kuralı **tek kaynakta** (`_shared/planlama`) kalır; frontend'de kopya takvim mantığı olmaz (V14 dersi). |
| **K2** | Segment üretimi **saf fonksiyon**: `splitIntoWorkingSegments(baslangic, bitis, cfg, tatiller, haftaSonuPlanlari)`. DB'siz, deterministik, unit test edilir. | Deterministiklik + regresyon kalkanı. |
| **K3** | Çubuk bitişi **asla `now` değil**: `gercek_bitis ?? planlanan_bitis`. Aktif iş `acikDurus` bayrağıyla işaretlenir (görsel ipucu için). Bekleyen işin planlanan tarihleri **olduğu gibi** kullanılır (now'a itme YOK). | 1 + 2'yi kökten bitirir; `recalcMakineKuyrukTarihleri` zaten doğru planlıyor. |
| **K4** | Hafta sonu/tatil blokları **şerit yüksekliğinde arka plan** (`z` çubuğun ALTINDA). Çubuk zaten kesildiği için üstünü örtmeye gerek yok. | Görsel 3'teki beklenen görünüm. |
| **K5** | Aralık filtresi bekleyen işlerde de **uygulanır**: planlanan aralığı görünüm penceresiyle kesişmeyen iş listelenmez. Planı olmayan (tarihsiz) iş de listelenmez. | Madde 3. |

---

## Yapılacaklar

| # | İş | Sahip |
|---|----|-------|
| A | `_shared/planlama.ts` → saf `splitIntoWorkingSegments` + DB'siz unit test (skip'siz) | Codex |
| B | `gantt/repository.ts` → `segmentler[]` DTO'ya; `bitisTarihi` now-hack'i kaldır; bekleyen-iş now-itmesi kaldır; aralık filtresi düzelt | Codex |
| C | `gantt-client.tsx` → çubuğu segmentlerden çiz; blokları şerit yüksekliğine + çubuk altına al; hafta sonu uyarısını kaldır | Codex |
| D | Günlük (tek gün) görünümde sütun ekranı doldursun (saat ızgarası) | Codex |
| E | Review + canlı doğrulama (Görsel 3 senaryosu) + deploy + thread kapatma | Claude |

**Kabul (Claude review edecek):**
1. `splitIntoWorkingSegments` unit testleri skip'siz yeşil; invariantlar: segmentlerin toplam süresi = çalışma süresi, segmentler çalışma-dışı ana taşmaz, ardışık ve çakışmaz.
2. Frontend'de hafta sonu/tatil **hesaplayan** kod yok (yalnız API'den gelen bloklar/segmentler çiziliyor).
3. Aktif iş çubuğu "şimdi" çizgisinin **sağına** taşıyor; ardışık işler arasında boşluk yok.
4. "Bugün" filtresinde yalnız bugüne planlanmış işler görünüyor.
5. Hafta sonuna denk gelen iş, bir sonraki iş gününde devam eden ayrı segment olarak görünüyor (Görsel 3).
6. Hafta sonu uyarısı kalmadı; hafta sonu gölgesi yalnız şerit yüksekliğinde.
7. backend `bun run build`, admin `bunx tsc --noEmit` + `bun run build` temiz.

## Dokunma
- `recalcMakineKuyrukTarihleri` planlama mantığı (doğru çalışıyor) — yalnız üstüne **saf segment bölücü** eklenir.
- Montaj/stok akışı, vardiya analizi çekirdeği.
