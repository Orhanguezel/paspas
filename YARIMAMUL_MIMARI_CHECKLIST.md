# Yarı Mamul Mimari Dönüşümü — Checklist

**Başlangıç:** 2026-04-17
**Hedef:** Mevcut "ürün" tanımlarını yarı mamul olarak yeniden sınıflandır, asıl ürün kavramını ekle, montaj akışını kur.

---

## Kategori Sözlüğü (mevcut `categories` tablosu)

| Kod           | Açıklama                                                          |
| ------------- | ------------------------------------------------------------------- |
| `urun`      | Asıl ürün (satılan paspas, montaj sonucu)                       |
| `yarimamul` | Sağ / Sol / Parça (enjeksiyondan çıkan)                         |
| `hammadde`  | Plastik, boya, ambalaj, etiket, koli (ayrı malzeme kategorisi yok) |

---

## İsimlendirme Kuralı

| Durum                         | Yarı mamul ismi                                 |
| ----------------------------- | ------------------------------------------------ |
| Çift operasyon (sağ ≠ sol) | `{ÜrünAdı} - Sağ` + `{ÜrünAdı} - Sol` |
| Tek operasyon (sağ = sol)    | `{ÜrünAdı} - Parça` (iki adet gerek)       |

## Reçete Hiyerarşisi

- **Yarı mamul reçetesi:** sadece `hammadde` kalemleri (plastik, boya)
- **Asıl ürün reçetesi:**
  - Çift op.: `1 × X-Sağ` + `1 × X-Sol` + ambalaj/son işlem hammaddeleri
  - Tek op.: `2 × X-Parça` + ambalaj/son işlem hammaddeleri

## Sipariş → Üretim Emri Akışı

- Sipariş kalemi → **asıl ürüne** bağlı
- 10 adet çift op. ürün → 10 sağ + 10 sol → **2 üretim emri**
- 10 adet tek op. ürün → 20 parça → **1 üretim emri**

## Montaj

- Ayrı makine/iş yükü/zaman YOK
- Makine atama sheet'inde **"Montaj burada"** checkbox (mevcut `uretim_emri_operasyonlari.montaj`)
- Çift op. emirlerde iki emirden **birinde** işaretli olur
- Montaj makinesinde üretim tamamlanınca → stok hareketleri otomatik tetiklenir
- Karşı yarı mamul yetersizse → `montaj_bekliyor` durumu, stok artınca otomatik tetik

## Stok Hareketleri

Mevcut mimari korunuyor: `hareket_tipi = giris|cikis|duzeltme` + `referans_tipi`

| Olay                            | hareket_tipi | referans_tipi   | urun kategori |
| ------------------------------- | ------------ | --------------- | ------------- |
| Yarı mamul üretildi           | `giris`    | `uretim_emri` | `yarimamul` |
| Montajda yarı mamul tüketildi | `cikis`    | `montaj`      | `yarimamul` |
| Montajda asıl ürün oluştu   | `giris`    | `montaj`      | `urun`      |
| Montajda ambalaj tüketildi     | `cikis`    | `montaj`      | `hammadde`  |

---

## AŞAMA 1 — Schema & Validasyon

- [X] **1.1** `105_urunler_schema.sql` — kategori ve operasyon_tipi değerleri yorum olarak eklendi
- [X] **1.2** `urunler/validation.ts` — `kategoriEnum = z.enum(['urun','yarimamul','hammadde'])` + listQuery ve createSchema'da kullanıldı
- [X] **1.3** `108_uretim_emirleri_schema.sql` yorum + `uretim_emirleri/validation.ts` durumEnum'a `montaj_bekliyor` eklendi
- [X] **1.4** `111_hareketler_schema.sql` — `hareket_tipi` ve `referans_tipi` değerleri yorum olarak eklendi (montaj dahil)
- [X] **1.5** `receteler/service.ts` — `assertReceteKategoriTutarliligi(urunId, items)` helper eklendi; controller create/update öncesi çağırıyor
- [X] **Checkpoint:** Backend TS build temiz

## AŞAMA 2 — Backend İş Mantığı

- [X] **2.1** `urunler/service.ts` — `createUrunWithYariMamuller(input)` + yeni endpoint `POST /admin/urunler/full`
  - Asıl ürünü kaydet
  - Operasyon tipine göre yarı mamul(leri) oluştur (Sağ/Sol/Parça)
  - Yarı mamul reçetesi: kullanıcı girdiği hammadde kalemleri
  - Asıl ürün reçetesi: yarı mamul(ler) otomatik + kullanıcı girdiği ambalaj hammaddeleri
  - Tüm akış tek transaction
- [X] **2.2** `syncYariMamulIsimleri(asilUrunId, yeniAd)` — ürün adı değişince yarı mamul/operasyon/reçete isimleri senkron; `updateUrun` controller'ında entegre
- [X] **2.3** Yarı mamul silme koruması: `recete_kalemleri` başka ürünün reçetesinde kullanılıyorsa silme engelli (hem `repoDelete` blocking check, hem `repoGetDependentUrunIds` bildirir)
- [X] **Checkpoint:** Backend TS build temiz ✅
- [X] **2.4** `uretim_emirleri/service.ts` — `createUretimEmirleriFromSiparisKalemi()` + endpoint `POST /admin/uretim-emirleri/siparis-kaleminden`
- [X] **2.5** `tryMontajForUretimEmri()` — yarı mamul üretim emri `montaj=true` ise asıl ürün reçetesine göre stok kontrolü, başarılı: hareketler işlenir + emir `tamamlandi`; yetersiz: `montaj_bekliyor` durumu. `operator/repository.ts` entegre.
- [X] **2.6** `tryPendingMontajlarAfterStokArtis()` — yarı mamul stoğu arttıkça bekleyen montajları tarar (montaj olmayan taraftaki üretim tamamlanınca otomatik tetik)
- [X] **2.7** Transaction güvenliği: her iş birimi (create, montaj, update) kendi transaction'ı içinde
- [X] **Checkpoint:** Backend TS build temiz ✅

## AŞAMA 3 — Admin Panel UI

- [X] **3.1** `/urunler` sayfasına kategori sekme butonları (Ürünler/Yarımamuller/Hammaddeler/Tümü)
- [X] **3.2** `urun-full-form.tsx` yeni Sheet form: asıl ürün + operasyon tipi + reçete → `POST /admin/urunler/full` ile tüm akış otomatik. Üste "Asıl Ürün + Yarı Mamul" butonu eklendi.
- [ ] **3.3** Reçete detay accordion — ertelendi (kozmetik)
- [X] **3.4** Satış sipariş kalem formu: `kategori='urun'` zaten filtreli — [siparis-form.tsx:76](admin_panel/src/app/(main)/admin/satis-siparisleri/_components/siparis-form.tsx#L76)
- [ ] **3.5** Üretim emri başlıkta yarı mamul ismi — ertelendi (mevcut `urun.ad` zaten yarı mamul adını gösterir)
- [X] **3.6** Makine atama "Bu tarafta montaj var" checkbox zaten mevcut — [makine-ata-sheet.tsx](admin_panel/src/app/(main)/admin/uretim-emirleri/_components/makine-ata-sheet.tsx)
- [X] **3.7** `EMIR_DURUM_LABELS`+`BADGE`'a `montaj_bekliyor` eklendi; detay sayfasında uyarı banner
- [X] **Checkpoint:** Admin panel build temiz ✅

## AŞAMA 4 — Seed & Test

- [X] **4.1** Canlı VPS backup → seed: [181_v1_canli_urunler_import.sql](backend/src/db/seed/sql/181_v1_canli_urunler_import.sql)
- [X] **4.2** `bun run db:seed` — DB sıfırdan kuruldu, 64 canlı ürün + 9 ambalaj + 1 hammadde import edildi
- [X] **4.3** Lokal data doğrulaması: migration öncesi 64 urun / 9 yarimamul / 1 hammadde → migration sonrası 64 urun / 72 yarimamul / 10 hammadde

## AŞAMA 5 — Canlı Mimari Migrasyonu (Seed Üzerinden)

**Yaklaşım:** Canlıya doğrudan bağlanılmıyor, her şey seed dosyası üzerinden. `bun run db:seed` canlıda çalıştığında da aynı sonucu üretir.

- [X] **5.1** [182_v1_mimari_migrasyon.sql](backend/src/db/seed/sql/182_v1_mimari_migrasyon.sql):
  - Her asıl ürün için yarı mamul(ler) deterministic UUID5 ile oluşturulur (idempotent)
  - `cift_tarafli` → 2 yarı mamul (`{ad} - Sağ`, `{ad} - Sol`)
  - `tek_tarafli` → 1 yarı mamul (`{ad} - Parça`)
  - Kodlar: `{parent.kod}-SG` / `{parent.kod}-SL` / `{parent.kod}-PR`
  - Mevcut `urun_operasyonlari` ilgili yarı mamule taşınır (operasyon adındaki "Sağ/Sol" suffix ile eşleştirme)
  - Asıl ürün reçetesine yarı mamul kalemleri eklenir (cift: 1×Sağ+1×Sol, tek: 2×Parça)
  - Eski `yarimamul` kategorisindeki ambalaj kayıtları (Kartela, Koli, İç Kutu) → `hammadde` kategorisine taşınır
- [X] **5.2** [183_v1_demo_urunler_cleanup.sql](backend/src/db/seed/sql/183_v1_demo_urunler_cleanup.sql):
  - Canlı backup + migration yarımamulleri whitelist
  - Whitelist dışındaki tüm demo urun/yarımamul ve bağlı kayıtlar (siparis, üretim emri, operasyon, hareket) silinir
  - Hammadde, kalıp, makine, category korunur
- [X] **5.3** Sıralama: [validation.ts](backend/src/modules/urunler/validation.ts) default sort `kod ASC` — asıl ürün + sağ/sol/parça yan yana gelir
- [X] **Final durum (lokalde test edildi):** 64 urun + 72 yarimamul + 25 hammadde, 9 reçete + 35 kalem, 161 toplam urun kaydı

**Deploy akışı:**

1. `git push` (backend + admin panel kod)
2. Canlıda `git pull` + `bun run build`
3. Canlıda `bun run db:seed` — DB sıfırdan kurulur, seed'ler sırayla: 181 (canlı import) + 182 (migrasyon) + 183 (cleanup)
4. Canlı durum lokal ile aynı olur

## AŞAMA 6 — Vardiya Analizi Dashboard

**Motivasyon:** "Şu gün gece vardiyasında üretilen miktarlar, kalıp değiştirme var mı, arıza var mı" — operatörlerin vardiya sonu performansını görmek.

### Tamamlanan (6.1 - 6.4)

- [X] **6.1** Backend `vardiya_analizi/` modülü:
  - [service.ts](backend/src/modules/vardiya_analizi/service.ts) — `getVardiyaAnalizi(query)` aggregate sorgu
  - [controller.ts](backend/src/modules/vardiya_analizi/controller.ts), [router.ts](backend/src/modules/vardiya_analizi/router.ts)
  - Endpoint: `GET /admin/vardiya-analizi?tarih=YYYY-MM-DD`
- [X] **6.2** Aggregate hesaplama:
  - Her vardiya kaydı için üretim (operator_gunluk_kayitlari), duruş (durus_kayitlari + durus_nedenleri katalog), OEE
  - Duruş kategorileri: ARIZ / KALIP / BAKIM / DİĞER
  - OEE = Availability × 0.95 (basitleştirilmiş)
- [X] **6.3** RTK Query hook: [vardiya_analizi_admin.endpoints.ts](admin_panel/src/integrations/endpoints/admin/erp/vardiya_analizi_admin.endpoints.ts)
- [X] **6.4** Admin panel sayfası: [vardiya-analizi-client.tsx](admin_panel/src/app/(main)/admin/vardiya-analizi/_components/vardiya-analizi-client.tsx)
  - Tarih seçici + 60sn polling
  - 6 özet metrik kartı (üretim/çalışma/duruş/arıza/kalıp/OEE)
  - Vardiya kartları (gece/gündüz, aktif/bitti gruplanmış)
  - Her kart: üretim kırılımı, çalışma/duruş süresi, duruş rozet'leri, OEE
  - Sidebar: "Üretim Süreçleri" grubunda, admin rolüne kısıtlı

### Genişlemeler (6.5+)

- [X] **6.5** Detay Sheet — karta tıklayınca: duruş tablosu + 24 saatlik üretim bar chart + üretim kayıtları + bağlı üretim emirleri
- [X] **6.7 + 6.12** Makine bazlı kırılım + teorik üretim hedefi (ağırlıklı ortalama çevrim × çalışma, renkli progress bar)
- [X] **6.8** Kalıp bazlı analiz — her kalıbın toplam üretim, çalışma saat, kullanıldığı makine+ürün listesi
- [X] **6.9** Trend grafiği — 7/30 gün toggle, recharts line chart (üretim+duruş+OEE, dual Y-axis)
- [X] **6.10** Dashboard widget `VardiyaOzetWidget` — `/admin/dashboard`'da bugünkü 4 metrik + uyarı rozetleri + makine listesi (hedef %)
- [ ] **6.6** Operatör karşılaştırma — iptal (kullanıcı operatör odaklı analiz istemiyor)
- [ ] **6.11** Tarih aralığı filtresi (hafta/ay) — backend hazır, UI ileride
- [ ] **6.13** Excel/PDF export — sonraya
- [ ] **6.14** Anlık bildirim — sonraya (WebSocket gerekir)

## AŞAMA 7 — (Boş, sonraya)

asama 7


vardiya baslatmaya gerek yok. saati gelince vardiya otomatik baslasin. ürünün baslatalim veya bitirelim. vardiya bitiminde o gunluk uretimi girelim bu veriler o gunluk üretim analizlerini icersin. asil stok miktarlari operasyon tamamlaninca olsun. vardiya bitirme degil de buna baska birsey de bulabiliri her makinede vardiya sonu uretim degerlerini girelim. bazi uretimler mesala makine 10 gun calisiyor hic durmadan. dolayisiyla stok miktarlari da artiyor haliyle. bu stoklari envantere de eklememiz gerekir ve analizlerde günlü+k uretimlerde görmemeiz gerekir.
