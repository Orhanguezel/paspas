# V4-3 — Yükle/Sevket: Sevkiyatçı Mobil Ekran + Otomatik Sevk Emri

> **Thread:** `56d703b1` · `/admin/sevkiyat` · `needs_info` (admin 7 soruya cevap vermedi)
> **Yaklaşım:** Admin'e sormadan, kanıta dayalı en mantıklı kararlarla ilerlenir (kullanıcı onayı 2026-06-21).
> **İnceleme:** Claude canlı DB + kod seviyesinde inceledi (2026-06-21).

---

## 0. Verilmiş Kararlar (7 soruya cevap — kanıta dayalı)

| # | Soru | KARAR + Gerekçe |
|---|------|-----------------|
| **D1** | Sevkiyatçı sadece Yükle/Sevket görsün? | **EVET.** `nakliyeci` rolüyle girişte yalnız Yükle/Sevket sekmesi (Sevk Bekleyenler + Sevk Emirleri gizli). Backend'de bu rol için planlama/oluşturma/onay aksiyonları 403. *V3-Y2'de kısmen yapılmıştı (rol kontrolü var) — tamamlanır.* |
| **D2** | Bekliyor+Onaylı görünür, sadece Onaylı sevk edilir? | **EVET.** Sevkiyatçı her ikisini görür; "bekliyor" satırlarda sevk butonu **pasif** + "Onay bekliyor" etiketi. Yalnız "onaylandı" sevk edilebilir. |
| **D3** | Otomatik sevk ne zaman oluşsun? | **(a) Üretim biter bitmez** — `repoUretimBitir` içinde, stok girişi sonrası `runNonBlockingStep('otomatik_sevk_emri', …)` ile. **Cron YOK.** Planlanan sevk tarihi 24:00 kuralıyla hesaplanır (aşağıda). *Gerekçe: stok girişi zaten orada oluyor ([operator/repository.ts](backend/src/modules/operator/repository.ts) ~satır 1065), ek altyapı/cron gerektirmez, deterministik, V3-B1 izolasyon kalıbı hazır.* |
| **D4** | Hangi durumda doğsun? | **`bekliyor`** olarak doğar; **admin onaylayınca** (`onaylandi`) sevkiyatçının Yükle/Sevket ekranına düşer. *Gerekçe: admin kontrolü korunur, otomatik sevk olmaz (admin'in anlattığı akış).* |
| **D5** | Çift sevk önlensin mi? | **EVET — iki katmanlı dedup:** (1) aynı `siparis_kalem_id` için açık (`bekliyor`/`onaylandi`) sevk emri varsa otomatik açma; (2) aynı `kaynak_uretim_emri_id`'den daha önce otomatik açıldıysa tekrar açma. *Gerekçe: V3-B4 "sevk emri var" mantığıyla uyumlu.* |
| **D6** | Sevk miktarı? | **= stoğa giren miktar (`stokFarki`)** — montaj/tek-taraflı operasyonun stok girişi. *Gerekçe: admin "montajın yapıldığı makineden çıkan, stoğa giren miktar kadar" dedi; `repoUretimBitir`'de `stokFarki` tam bu (sadece montaj/tek taraf stok girişi yapar — satır 1044-1065).* |
| **D7** | Manuel üretimde otomatik sevk? | **HAYIR.** Yalnız **sipariş-bağlı** üretim (`uretim_emri_siparis_kalemleri` eşleşmesi olan) tetikler. Manuel (siparişsiz) üretim → atla. *Gerekçe: manuelde müşteri/adres yok.* |

### Planlanan sevk tarihi — 24:00 kuralı (D3 detayı)
Admin: "Gece vardiyasında 24:00'a kadar bitenler ertesi gün, 24:00'tan sonrakiler o günün listesine."
- **Karar:** Üretim bitiş saati **< 08:00** ise (gece vardiyası, 24:00 sonrası küçük saatler) → `planlanan_sevk_tarihi = bitiş takvim günü`. **>= 08:00** ise → `bitiş günü + 1`. (08:00 sınırı gece vardiyası bitişine (07:30) yakın seçildi; sabit/tunable.) `tarih` kolonuna yazılır.

---

## 0b. Hazır Şema Kontratı (Claude yazdı)

| Seed | İçerik |
|------|--------|
| [204_sevk_emirleri_otomatik.sql](backend/src/db/seed/sql/204_sevk_emirleri_otomatik.sql) | `sevk_emirleri.otomatik_olusturuldu tinyint(1) default 0` + `kaynak_uretim_emri_id char(36) null` + index. İdempotent. Planlanan tarih mevcut `tarih` kolonunda. |

> Claude canlıya uygular (deploy migration tracker yeni dosyayı otomatik alır da — ama Claude yine doğrular).

## 0c. İnceleme Bulguları (Codex veri kabul etsin)

| Bulgu | Detay |
|-------|-------|
| H1 | `sevk_emirleri` zaten `siparis_id, siparis_kalem_id, musteri_id, urun_id, miktar, tarih, durum, operator_onay` içeriyor. Otomatik için yalnız 2 kolon eklenecek (seed 204). |
| H2 | Sevk emri oluşturma + no üretme mantığı `repository.ts`'de mevcut (`generateSevkEmriNo`, ~satır 20). Otomatik akış bunu yeniden kullanır. |
| H3 | `repoUretimBitir` stok girişini yalnız montaj/tek-taraflı op için yapıyor (`hasStockImpact`, `stokFarki` — satır 1044-1091). Otomatik sevk hook'u tam buraya, **transaction sonrası** `runNonBlockingStep` ile girer (ana üretim bitişini bozmaz). |
| H4 | `uretim_emri_siparis_kalemleri` tablosu sipariş-bağlılık tespiti için var (D7). |
| H5 | `nakliyeci`/`sevkiyatci` rolü + `canShipPhysically` kontrolü mevcut (V3-Y2). D1/D2 bunu genişletir. |

---

## 1. Yapılacaklar

### V4-3a — Sevkiyatçı mobil ekran (D1 + D2) ✅
- **Frontend** ([sevkiyat-client.tsx](admin_panel/src/app/(main)/admin/sevkiyat/_components/sevkiyat-client.tsx)):
  - `nakliyeci` rolüyle girişte **yalnız Yükle/Sevket** sekmesi render edilsin (diğer iki sekme gizli). Admin tüm sekmeleri görmeye devam eder.
  - Yükle/Sevket ekranı **mobil-öncelikli**: operatör ekranı kalıbı (büyük kartlar, büyük butonlar, `grid-cols-1`, `overflow-x-hidden`).
  - Bekliyor + Onaylı emirler görünür; **bekliyor → sevk butonu pasif** + "Onay bekliyor" etiketi; **onaylandı → "Fiziksel Sevket"** aktif.
  - Fiziksel sevk: miktar girişi (planlanan default, değiştirilebilir, stok üstü engellenir — V3-Y2 kuralı korunur) → kaydet → stoktan düş.
- **Backend:** `nakliyeci` rolü için planlama/oluşturma/onay endpoint'leri 403; yalnız fiziksel sevk + okuma izinli.
- [x] Tamamlandı
- **Codex durum:** Sevkiyatçı/nakliyeci görünümü yalnız Yükle/Sevket akışına indirildi; bu turda mobil tek kolon kart/büyük buton kabuğu güçlendirildi.

### V4-3b — Otomatik sevk emri (D3-D7) ✅
- **Şema:** seed 204 (Claude uygular). Drizzle `sevkEmirleri` şemasına `otomatik_olusturuldu`, `kaynak_uretim_emri_id` eklenir.
- **Backend hook** ([operator/repository.ts](backend/src/modules/operator/repository.ts) `repoUretimBitir`):
  - Stok girişi sonrası (montaj/tek-taraflı, `stokFarki > 0`), transaction **sonrasında** `runNonBlockingStep('otomatik_sevk_emri', ...)`:
    1. Üretim emri **sipariş-bağlı mı?** (`uretim_emri_siparis_kalemleri`). Değilse atla (D7).
    2. İlgili `siparis_kalem_id` için açık (`bekliyor`/`onaylandi`) sevk emri **var mı?** Varsa atla (D5-1).
    3. Bu `kaynak_uretim_emri_id`'den daha önce otomatik açıldı mı? Açıldıysa atla (D5-2).
    4. Yoksa: **`bekliyor`** sevk emri oluştur (D4) — `miktar = stokFarki` (D6), `tarih = planlanan` (24:00 kuralı), `musteri_id`/`siparis_id`/`siparis_kalem_id`/`urun_id` siparişten, `otomatik_olusturuldu=1`, `kaynak_uretim_emri_id=<emir>`. `generateSevkEmriNo` ile no üret (H2).
  - Hata izolasyonu: `runNonBlockingStep` (V3-B1) → otomatik sevk hatası üretim bitişini bozmaz.
- **Frontend:** Sevk Emirleri listesinde otomatik olanları rozetle ("Otomatik") — admin elle vs otomatik ayırt etsin (opsiyonel ama önerilir).
- [x] Tamamlandı
- **Codex durum:** `sevk_emirleri` Drizzle şeması otomatik alanları içeriyor; `repoUretimBitir` sonrası `runNonBlockingStep('otomatik_sevk_emri', ...)` ile sipariş bağlı üretimden deduplu `bekliyor` sevk emri oluşturuluyor; listede "Otomatik" rozeti var.

---

## 2. Kabul Kriterleri
- Nakliyeci hesabıyla: yalnız Yükle/Sevket görünür; bekliyor sevk edilemez, onaylı edilebilir; stok üstü miktar engellenir.
- Sipariş-bağlı üretim bitince: otomatik "bekliyor" sevk emri doğar, miktar = stoğa giren miktar, planlanan tarih 24:00 kuralına uygun.
- Aynı kalem/üretim için ikinci otomatik sevk emri **açılmaz**.
- Manuel (siparişsiz) üretimde otomatik sevk emri **açılmaz**.
- Otomatik sevk hatası üretim bitişini **bozmaz** (200 döner).

## 3. Kurallar
- Her parça ayrı commit (`feat(sevkiyat): ... (V4-3a)`).
- Build: backend + admin. **ALTER yok** (şema seed 204'te hazır). **Push etme** — Claude review+deploy+thread.
- Belirsizlik → DUR, sor.
