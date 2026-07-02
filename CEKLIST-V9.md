# Yazılımcı Notu V9 — Açık İşler Çeklisti

> **İnceleme:** 2026-07-02 — Claude canlı DB + kod + 3 ekran görüntüsü + 2 paralel alt-ajan araştırması.
> **8 açık not.** Bazıları birbirine bağlı (sevk filtresi, vardiya, stok).
> **Yeni şema GEREKMİYOR.**

---

## Gruplama

| # | Not | Sayfa | Tip | Sahip | Karar? |
|---|-----|-------|-----|-------|--------|
| A | 5ba8a895 Satın Alma sipariş girişi (input küçük) | satin-alma | UI bug | Claude | — |
| B | 0c7e30c0 + 9ca1a8ec Sevk filtresi (üretimde tespiti) | sevkiyat | Logic bug | Claude | küçük |
| C | 5d739c6d Vardiya toplam sıfır | vardiya-analizi | Logic bug | Claude | — |
| D | 46e29152a Vardiya default açılış | vardiya-analizi | Logic | Claude | — |
| E | 46e29152b Vardiya makine2 "kayıt yok" (montaj) | vardiya-analizi | Logic | — | **admin** |
| F | 48ae4a9a Tuna Siyah üretilen stokta yok | stoklar/uretim | Config+logic | — | **admin** |
| G | a3b123c2 Sipariş işlemleri (stok/ikili gösterim/kalan) | satis-siparisleri | Feature | Codex/Claude | — |
| H | f73c65ff Sipariş işlemleri (sipariş bazlı filtre) | satis-siparisleri | Feature | Codex/Claude | — |

---

## A — Satın Alma "Yeni Sipariş" input'ları küçük (`5ba8a895`)

**Şikayet:** Malzeme kalemi seçilince Miktar / Birim Fiyat alanları giriş yapılamayacak kadar küçülüyor.

**Kök neden:** [satin-alma-form.tsx:268-308](admin_panel/src/app/(main)/admin/satin-alma/_components/satin-alma-form.tsx#L268) kalem satırı `flex items-end gap-2`; Malzeme `flex-1`, Miktar `w-24`, Birim Fiyat `w-28`, Termin `w-36`. Dar modalda flex, sabit-genişlikli input'ları `shrink-0` olmadığı için sıfıra kadar eziyor; Malzeme combobox tüm yeri kaplıyor.

**Fix (Claude):** Kalem satırını dar ekranda **sarmalı (flex-wrap)** yap + sayısal input'lara `shrink-0` ve Malzeme'ye `min-w-0` ver; Miktar/Birim Fiyat minimum kullanılabilir genişlik (`w-24`/`w-28` + shrink-0). Modal genişliğini de gerekirse artır.

---

## B — Sevk Bekleyenler "Stokta Olanlar" filtresi (`0c7e30c0` + `9ca1a8ec`)

İki not aynı filtrenin iki yüzü.

**Kök neden:** [sevkiyat/repository.ts:166-172](backend/src/modules/sevkiyat/repository.ts#L166) — "üretimde" tespiti `siparis_kalemleri.uretim_durumu <> 'beklemede'` üzerinden. Bu yanlış:
- **Tuna Siyah (`0c7e30c0`):** UE-2026-0079 `uretimde` ama üretim emri **sipariş kalemine bağlı değil** (siparis_kalem_id NULL, stok üretimi) → kalem `beklemede`de kalıyor → stok 0 → **eleniyor** (görünmesi gerekirken).
- **PARS GRİ/BEJ (`9ca1a8ec`):** kalem `uretim_tamamlandi`, aktif üretim emri yok, stok 0 → `<> 'beklemede'` TRUE → **görünüyor** (görünmemesi gerekirken).

**Fix (Claude, tek değişiklik):** `uretimdeCondition`'ı **ürün bazlı aktif üretim emri EXISTS**'e çevir:
```sql
EXISTS (SELECT 1 FROM uretim_emirleri ue
  WHERE ue.urun_id = siparis_kalemleri.urun_id AND ue.is_active=1
    AND ue.durum IN ('atanmamis','planlandi','uretimde','montaj_bekliyor'))
```
Kural: göster EĞER `kalan>0 filtre AND (stok>0 OR aktif üretim emri var)`. Bu tek değişiklik iki şikayeti de çözer.
**Ayrıca (0c7e30c0 part-2):** "fiziksel sevke izin, stok eksiye düşebilir" kısmı önceki fix'te uygulanmıştı — Claude canlıda doğrular.

---

## C — Vardiya toplamları sıfır (`5d739c6d`)

**Kök neden:** [vardiya_analizi/service.ts:751-752](backend/src/modules/vardiya_analizi/service.ts#L751) — gece vardiyası gece yarısını aşıyor (19:30→ertesi 07:30) ama tek-gün görünümünde üretim penceresi o günün `[00:00,23:59]`'una **clamp** ediliyor. Gece yarısından sonraki üretim kesiliyor → kart Net 0. **Kanıt:** 900T ÖN 07-01 gece: clamp'li aralık net 0; gerçek pencere net 1090.

**Fix (Claude):** Üretim penceresini takvim gününe clamp etme; vardiyanın gerçek `bitis`ini (açık vardiyada `now`) kullan. `service.ts:751-752` üst sınırı + `dateRange` (`:221`) tek-gün seçiminde gece vardiyasını kapsayacak şekilde genişlet.

---

## D — Vardiya default açılış (`46e29152a`)

**İstenen:** GÜNDÜZ saatinde (07:30-19:30) açılırsa → önceki gündüz + onu takip eden gece. GECE saatinde (19:30-07:30) açılırsa → önceki gece + onu takip eden gündüz.

**Kök neden:** [vardiya-analizi-client.tsx:209-212](admin_panel/src/app/(main)/admin/vardiya-analizi/_components/vardiya-analizi-client.tsx#L209) — default sabit "dün, tüm gün"; saate göre vardiya-çifti mantığı hiç yok.

**Fix (Claude):** Default state'i o anki saate göre vardiya-çifti aralığı üreten fonksiyonla başlat (`{baslangicTarih,bitisTarih}` range). C fix'i ile birlikte çalışır (gece tarafı clamp düzelmeden boş kalır).

---

## E — Vardiya makine2 "üretim kaydı yoktur" (`46e29152b`) — 🔴 ADMİN KARARI

**Kök neden:** V7'de eklenen **montaj hariç tutma** filtresi (`montaj=0`, `service.ts:585,711,774,800,1079,1175`) tüm üretim sorgularında var. makine2 = "900 T (ARKA)" bazı günler **tümüyle montaj** operasyonu çalışıyor (kanıt: 06-29/06-30 ARKA yalnız montaj). Montaj kayıtları tümüyle filtrelendiği için makine2 "kayıt yok" görünüyor.

**Karar gerekiyor:** Montaj bir makinede gerçek üretim mi (operatör net_miktar giriyor)?
- **Seçenek 1 (öneri):** Montaj üretimini ayrı bir "montaj" kırılımı olarak göster (OEE/verimlilik hesabından ayrı tut ama ekranda görünsün). Makine boş görünmez.
- **Seçenek 2:** Montaj hariç kalsın ama makine kartında "montaj: X adet (analize dahil değil)" bilgi satırı göster (sessiz "kayıt yok" yerine).

---

## F — Tuna Siyah üretilen stokta yok (`48ae4a9a`) — 🔴 ADMİN KARARI

**Kök neden (kanıtlı):** TUNA SİYAH (1114 101) ürünü `operasyon_tipi='tek_tarafli'` ama üretim emri **UE-2026-0079'da 2 operasyon var** (Tuna Siyah Aramamul **Sağ** + **Sol**, ikisi de `montaj=0`). [operator/repository.ts hasIncrementalStockImpact]: opCount=2 → `isSingleSided=false`, montaj=1 op yok → **stok etkisi false** → günlük üretim (net 3695) stoğa hiç yansımıyor; montaj operasyonu da olmadığı için mamul stoğu hiç artmıyor. Ürün ne düzgün tek-taraflı ne düzgün çift-taraflı → **stok kara deliği**.

**Neden V8 fix'i çözmedi:** V8 achievable montajı yalnız montaj=1 operasyonu tetiklenince çalışır; burada montaj operasyonu **hiç yok**.

**Karar gerekiyor — ürün gerçekte çift taraflı mı?** Ürün ailesinde "Tuna Siyah Aramamul Sağ/Sol" operasyonel_ym var → fiilen çift taraflı görünüyor ama `tek_tarafli` işaretli + emirde montaj operasyonu yok.
- **Seçenek 1 (öneri):** Ürün çift taraflıysa: `operasyon_tipi='cift_tarafli'` yap ve emir operasyonlarından birine montaj=1 ata → V8 achievable montaj devreye girer, stok düzgün oluşur. Mevcut UE-2026-0079 için Claude canlı düzeltme yapar (montaj op ekle/işaretle + montaj tetikle).
- **Seçenek 2:** Ürün gerçekten tek taraflıysa: emir neden 2 operasyonla (Sağ+Sol) oluşmuş? Üretime-aktarma/operasyon oluşturma mantığı düzeltilmeli (tek op). Bu daha derin bir revizyon.
- **Ek robustluk (her iki durumda):** `hasIncrementalStockImpact` çok-operasyonlu + montaj-yok emirde sessizce stok'u sıfırlıyor — bu durum **sessiz veri kaybı**; en azından uyarı/log veya güvenli davranış gerekir.

---

## G — Sipariş İşlemleri: stok + ikili gösterim + kalan toplam (`a3b123c2`) — Feature

- Her satırda o ürünün **stok miktarı** kolonu.
- **Üretilen** kolonu ikili: (üretilen, kalan=miktar−üretilen). **Sevk Edilen** kolonu ikili: (sevk, kalan=miktar−sevk).
- Ürün bazlı filtrede **kalan miktar toplamı**; ürün alt grubu filtresinde de kalan toplamı.

## H — Sipariş İşlemleri: sipariş bazlı filtre (`f73c65ff`) — Feature

- Mevcut filtreler: düz liste, müşteri bazlı, ürün bazlı, ürün alt grubu. **Sipariş bazlı** filtre ekle (sipariş no'ya göre grupla).
- Son sütundaki **Kapat** butonu **yalnız sipariş bazlı** görünümde aktif; diğer görünümlerde olmasın.

---

## Verilmiş Kararlar (kullanıcı onayı 2026-07-02)

- **E:** Montaj üretimi Vardiya Analizi'nde **ayrı "montaj" kırılımı** olarak gösterilir (OEE/verimlilik hesabına katılmaz, ekranda görünür).
- **F:** Tuna Siyah **çift taraflı** kabul edilir. `operasyon_tipi='cift_tarafli'` + montaj mantığı düzeltilir; UE-2026-0079 canlı düzeltilir; yanlış kurulmuş diğer ürünler taranır. (Codex önce iki-model farkını netleştirecek — bkz. CODEX-PROMPT-V9 F.)

## Durum

| # | Konu | Sahip | Durum |
|---|------|-------|-------|
| A | Satın alma input layout | Claude | ☑ deploy (69448f1) + thread kapatıldı |
| B | Sevk filtresi (üretimde tespiti) | Claude | ☑ deploy (69448f1) + canlı doğrulandı + 2 thread kapatıldı |
| C | Vardiya toplam sıfır (gece clamp) | Codex | ☑ deploy (ac2628a) + thread kapatıldı |
| D | Vardiya default açılış (saat bazlı) | Codex | ☑ deploy (f8fdca1) + thread kapatıldı |
| E | Vardiya montaj kırılımı | Codex | ☑ deploy (d37c8b9) + thread kapatıldı |
| F | Tuna Siyah stok/montaj (F1: çok-op mamul) | Codex + Claude(veri) | ◑ kod deploy (c121708); canlı veri: aşağı bakınız |
| G | Sipariş işlemleri (stok/ikili/kalan) | Codex | ☑ deploy (d358268) + thread kapatıldı |
| H | Sipariş işlemleri (sipariş bazlı filtre) | Codex | ☑ deploy (93fe147) + thread kapatıldı |

### F — canlı veri durumu (48ae4a9a hâlâ open)

Codex F1 yolunu uyguladı: **çok operasyonlu + montaj-op'suz "tek emir mamul"** üretim emirlerinde, tüm operasyonlar bitince mamul stoğu `min(operasyon üretilenleri)` kadar kredilenir (achievable). Kod yayında — **bundan sonraki tamamlamalar kendi kendini düzeltir.**

**Canlı veri taraması (Claude, salt-okuma):** `tek_tarafli` + 2+ Sağ/Sol operasyonlu 43 emir. Kritik bulgu:
- **Eski tamamlanmış emirler (UE-0003…0061):** `uretilen_miktar` zaten dolu, mamul_stok 0 → sevk edilmiş / mahsuplaşmış. **TOPLU DÜZELTME YAPILMADI** (sevk edilmişleri bozardı).
- **Aktif emirler (UE-2026-0079, 0080 `uretimde`):** UE-0079 Sağ op tamamlandi (2460), Sol op `calisiyor` (1235). Operatör Sol'u tamamlayınca yeni kod mamul stoğunu `min(2460, Sol)` kadar kredileyecek. Semantik olarak doğru (üretim henüz bitmemiş).
- **B fix'i sayesinde** Tuna Siyah artık üretimdeyken Sevk Bekleyenler'de görünür → 0 stokla bile sevk emri açılabilir.

**Açık soru (kullanıcıya):** UE-0079 Sol operasyonunu şimdi kontrollü tamamlayıp 1235'i stoğa kredileyeyim mi, yoksa operatör normal akışta bitirsin mi? (Sol=1235 < Sağ=2460 → eşleşmeyen 1225 Sağ kalır.)

**Push YOK** — her madde Claude review + deploy + thread kapatma.
