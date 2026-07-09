# Yazılımcı Notu V7 — Açık İşler Çeklisti (V5/V6 takip bug'ları)

> **İnceleme:** 2026-06-24 — Claude canlı DB + kod + ekran görüntüsü seviyesinde inceledi.
> **4 yeni not** — çoğu az önce deploy edilen V5/V6 özelliklerinde bug/refinement.
> **Yeni şema GEREKMİYOR.** Aktif 5xx yok.

---

## 0. Verilmiş Kararlar

| Karar | İçerik |
|-------|--------|
| **D-SagSol** | Üretim listesinde (Görüntüle + Planla) çift taraflı ürün **tek mamul satırı** gösterilir; Sağ/Sol operasyonel YM'ler "Makine ve Montaj Planlama" bloğunda (parça bazında) görünür. Üretim emirleri DB'de yine iki taraf olarak durur — yalnız liste gösterimi mamul bazında gruplanır. |
| **D-Verimlilik** | Üretim kaydında **iki ayrı verimlilik** gösterilir (admin tanımı): (1) **Net çalışma süresine göre** = net / (net çalışma süresinde teorik üretim); (2) **Vardiya süresine göre** = net / (12 saat tam vardiyada teorik üretim). Teorik = süre_sn / çevrim_sn (operasyonel YM'nin operasyon çevrim süresi). |

---

## 1. ✅ Not 1 — "Yeni üretim emri oluştur" (`2167852e` · /admin/uretim-emirleri · ekran UP-2026-0003.png)

Birden çok sorun:

### 1a — Modal çok küçük
- Aktarım modal'ı küçük, yatay scroll gerekiyor → **tam ekrana yakın** genişlet (`max-w-[95vw]` / büyük dialog).

### 1b — Ürün grubu dropdown'ı eksik
- "Üretim grubu seç" alanında **tüm gruplar gelmiyor** (sadece pencereye sığanlar). Tüm aktif ürün gruplarını listele (grup kaynağı sipariş satırlarından değil, tüm grup tanımlarından gelmeli — `sub_categories` / `urun_grubu` dağılımı).

### 1c — Manuel üretim eklenmiyor (FRONTEND bug)
- Backend doğru: [satis_siparisleri/controller.ts](backend/src/modules/satis_siparisleri/controller.ts) satır ~290 `manuelEmirler` döngüsü emir oluşturuyor. **Sorun frontend'de:** `UretimOlusturGrid` manuel satır ekleme UI'ı `manuelRows` state'ini doldurmuyor / seçilen ürün `urunId` aktarıma girmiyor. Manuel ekle akışını uçtan uca düzelt — eklenen manuel ürün `manuelEmirler` ile gönderilsin (aynı partiye — zaten partiNo paylaşılıyor).

### 1d — 🎯 "Atanmamış ama silinemiyor" (KÖK NEDEN BULUNDU)
- **Kök neden:** [uretim_emirleri/service.ts](backend/src/modules/uretim_emirleri/service.ts) `applyDefaultMakineAtamasi` (satır 45) sadece `uretim_emri_operasyonlari.makine_id`'yi UPDATE ediyor; **makine_kuyrugu kaydı oluşturmuyor**. Sonuç: operasyonun makine_id'si dolu (silme guard'ı engelliyor) ama kuyruk yok → UI "Atanmamış" + iş yüklerinde görünmüyor.
- **Kapanış kararı:** Otomatik makine ataması kaldırıldı; operasyonlar temiz "Atanmamış" doğuyor ve Makine ve Montaj Planlama bloğundan atanıyor.
- **Tercih (mantıklı yol):** **Otomatik atamayı KALDIR** — `applyDefaultMakineAtamasi` çağrısını üretime-aktarımdan çıkar. Sebep: (a) yarım-atama çelişkisini kökten bitirir, (b) admin zaten Not 2'de atamayı "Makine ve Montaj Planlama" bloğundan yapmak istiyor (orada Atanmamış default + dropdown). Böylece yeni emirler temiz "Atanmamış" doğar, silinebilir, bloktan atanır. (K1 kararı bu nedenle geri alınır — admin'in yeni akışı bunu gerektiriyor.)
- **Mevcut bozuk kayıtlar (UP-2026-0003 vb.):** Claude canlıda düzeltir — operasyon.makine_id'si dolu ama kuyruğu olmayan emirlerin makine_id'sini NULL'a çeker (silinebilir/atanabilir olur).

### 1e — Sağ/Sol tek satır (D-SagSol)
- Liste mamul bazında tek satır (bkz. karar). İki taraf Makine/Montaj bloğunda.
- **Codex durum:** Uygulanmış. Aktarım modalı `95vw`; grup listesi aktif üretim ürünlerinden besleniyor; manuel satırlar `manuelRows` ile `manuelEmirler` payload'una giriyor; otomatik makine ataması kaldırılmış; liste parti/mamul bazlı tek satır gösteriyor.

---

## 2. ✅ Not 2 — "Makine ve Montaj planlama" (`31fb0929` · /admin/uretim-emirleri · ekran Makine_ve_montaj_duzenleme.png)
- **Yerleşim:** Blok ilgili **üretim partisinin hemen altında** olmalı (0003 partisi → hemen altında 0003 Makine/Montaj bloğu). Şu an yeri yanlış.
- **Makine dropdown:** İçerik = **"Atanmamış" + makine isimleri**; kullanıcı buradan makine seçer/değiştirir → seçim gerçek atamayı yapar (makine_havuzu `repoAtaOperasyon` akışı: makine_id + kuyruk + planlanan tarih). "Atanmamış" seçilirse atama kaldırılır (kuyruktan çıkar).
- **Montaj:** Yes/No buradan düzenlenebilsin (`uretim_emri_operasyonlari.montaj`).
- Bu blok Not 1d'deki "atama bloktan yapılır" kararının uygulama noktası.
- **Codex durum:** Uygulanmış. `MakineMontajPlanlama` her parti bloğunun hemen altında render ediliyor; dropdown "Atanmamış" + makineler; atama `ataOperasyon`, kaldırma `kuyrukCikar`, montaj güncelleme operasyon planları endpoint'iyle yapılıyor.

---

## 3. ✅ Not 3 — Yükle/Sevket mobil (`9c7e53e5` · /admin/sevkiyat) — tekrar bildirim
- V6'da rol gating fix'i (`sevkiyatci` + `nakliyeci`) deploy edildi (`5894ac7`).
- **Kapanış notu (Claude canlıda doğrular):**
  1. Canlıda sevkiyatçı kullanıcısıyla giriş → yalnızca Yükle/Sevket görünüyor mu **doğrula** (admin yanlış kullanıcıyla test etmiş olabilir / cache).
  2. Yükle/Sevket ekranı **operatör ekranı gibi büyük buton/kart** formatında mı? Değilse mobil format güçlendir (büyük dokunma alanları, tek kolon).
- Not: Bu büyük ölçüde doğrulama; gerçek eksik çıkarsa düzelt.
- **Codex durum:** Bu turda güçlendirildi. Sevkiyatçı görünümü sekmesiz mobil kabukla açılıyor; `shipperMode` tek kolon kart/büyük buton düzeninde; sidebar marka linki ve giriş yönlendirmesi `/admin/sevkiyat`.

---

## 4. ✅ Not 4 — Vardiya Analizi veri doğruluğu (`765e5d2d` · /admin/vardiya-analizi)
- **4a — İlk açılış:** Önceki günün 2 vardiyası (bugün çarşamba → salı gündüz + salı gece) gelmiyor. Default tarih/aralık mantığını düzelt (önceki gün + son 2 vardiya).
- **4b — Tek makine geliyor (BUG):** 7 gün filtresinde sadece 900 T (ARKA) kayıtları geliyor; 900 T (ÖN) verisi var ama gelmiyor. **Olası kök:** ana sorgu `vardiyaKayitlari` (vardiya açılış kaydı) üzerinden ilerliyor; bir makinenin vardiya açılış kaydı yoksa üretim kayıtları görünmüyor. Üretim kayıtları doğrudan `operator_gunluk_kayitlari`'ndan (makine + tarih bazlı) toplanmalı — vardiya açılış kaydına bağlı kalmamalı.
- **4c — Toplamlar sıfır (BUG):** Gündüz/Gece Vardiyası Toplamı net+fire = 0 geliyor. **Olası kök:** toplam `net_miktar` alanından alınıyor ama veri `ek_uretim_miktari`'nda (net_miktar null/0). Toplamı `net_miktar ?? ek_uretim_miktari` (veya doğru net hesabı) üzerinden al. [vardiya_analizi/service.ts](backend/src/modules/vardiya_analizi/service.ts) ~534.
- **4d — Verimlilik (D-Verimlilik):** İki oran göster: net çalışma süresine göre + tam vardiya süresine göre (çevrim_sn bazlı teorik). Admin örneği: 10 saat net çalışmada teorik 1000 → 900 üretim = %90; 12 saat vardiyada teorik 1200 → 900 = %75.
- **Codex durum:** Uygulanmış. Backend `resolveNet`/`netMiktarSql` ile `net_miktar` boş/0 olduğunda `ek_uretim_miktari - fire_miktari` kullanıyor; üretim kayıtları makine+tarih bazlı `operator_gunluk_kayitlari` üzerinden toplanıyor; frontend ilk açılışta dün + tüm makineler yaklaşımını kullanıyor; tabloda iki verimlilik kolonu var.

---

## 5. Genel Kurallar (Codex)
- Sıra: **Not 4 (veri doğruluğu — en kritik) → Not 1 → Not 2 → Not 3.**
- **Yeni şema YOK.** ALTER yasak. Gerekirse DUR, sor.
- Not 1d: otomatik atama kaldırılıyor (`applyDefaultMakineAtamasi` çağrısı çıkar); atama Not 2 bloğundan `repoAtaOperasyon` ile yapılır. **Mevcut bozuk kayıtların veri düzeltmesini Claude yapar.**
- Her madde ayrı commit. Build (backend `bun run build` + admin `tsc --noEmit`); sonda admin `bun run build`. **Push etme** — Claude review + deploy + thread kapatma.

## 6. Tamamlama
| # | Konu | Sayfa | Durum |
|---|------|-------|-------|
| Not 4 | Vardiya veri doğruluğu (makine/toplam/açılış/verimlilik) | vardiya-analizi | ☑ Codex |
| Not 1 | Üretim oluştur (modal/grup/manuel/atama/tek-satır) | uretim-emirleri | ☑ Codex + Claude(veri) |
| Not 2 | Makine ve Montaj planlama (yer + dropdown + atama) | uretim-emirleri | ☑ Codex |
| Not 3 | Yükle/Sevket mobil doğrulama | sevkiyat | ☑ Codex güçlendirdi / Claude canlı doğrular |
