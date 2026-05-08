# Amazon Ticari Risk Motoru — 5 Keyword Test Sonuçları

**Tarih:** 8 Mayıs 2026  
**Ortam:** Canlı (VPS — panel.avrasyaotomotiv.net)  
**Marketplace:** amazon.com (US)  
**Filtreler (son çalışma):** review ≥10, rating ≥3.5, fiyat $5-500

---

## Özet Tablo

| Keyword | Veri Noktası | Composite Skor | Karar | Durum |
|---------|-------------|----------------|-------|-------|
| thermal labels | 127 | **5.3** | ⚠️ DİKKATLİ OL | ✅ Tamamlandı |
| dash cam | 38 | **5.4** | ⚠️ DİKKATLİ OL | ✅ Tamamlandı |
| webcam lighting | 37 | **5.2** | ⚠️ DİKKATLİ OL | ✅ Tamamlandı |
| cable organizer | 26 | NULL | 🔵 YETERSİZ VERİ | ✅ Tamamlandı (LOW güven) |
| surge protector | 22 | NULL | 🔵 YETERSİZ VERİ | ✅ Tamamlandı (LOW güven) |

---

## Detaylı Boyut Skorları

### 1. Thermal Labels
- **Data Points:** 127 ürün
- **Composite:** 5.3 → DİKKATLİ OL
- **Kategori Riski:** 2.0/10 (düşük — kategori rekabeti makul)
- **SKU Kaos:** 10.0/10 (yüksek — fiyat varyasyonu çok geniş)
- **Fiyat Savaşı:** 5.5/10 (orta — belirgin fiyat baskısı var)
- **Marka Güvenilirliği:** 9.3/10 (yüksek — tek egemen marka yok, parçalı yapı)
- **Operasyonel Risk:** 0.0/10 (düşük — yorum problemi az)
- **Yorum:** Etikette label printing gibi geniş bir kategori. SKU kaos ve marka dağılımı yüksek — fiyat tutarsızlığı yeni girişimci için zorlayıcı olabilir. Buna karşın kategori erişim engeli düşük. Deneyimli satıcı için fırsat mevcut.

### 2. Dash Cam
- **Data Points:** 38 ürün
- **Composite:** 5.4 → DİKKATLİ OL
- **Kategori Riski:** 2.7/10 (düşük-orta)
- **SKU Kaos:** 10.0/10 (çok yüksek — farklı fiyat kuşakları)
- **Fiyat Savaşı:** 4.8/10 (orta — fiyat baskısı var)
- **Marka Güvenilirliği:** 10.0/10 (yüksek — parçalı marka yapısı)
- **Operasyonel Risk:** 0.0/10 (düşük)
- **Yorum:** Geniş fiyat yelpazesi ($20-$400+) nedeniyle SKU kaos çok yüksek. Doğru fiyat segmentini seçmek kritik. Orta segment ($50-150) fırsat barındırabilir. Markalı ürünlere karşı bilinçsiz giriş risklidir.

### 3. Webcam Lighting
- **Data Points:** 37 ürün
- **Composite:** 5.2 → DİKKATLİ OL
- **Kategori Riski:** 2.0/10 (düşük)
- **SKU Kaos:** 10.0/10 (çok yüksek)
- **Fiyat Savaşı:** 4.8/10 (orta)
- **Marka Güvenilirliği:** 9.9/10 (yüksek — parçalı)
- **Operasyonel Risk:** 0.0/10 (düşük)
- **Yorum:** Uzaktan çalışma/içerik üretimi trendi ile büyüyen kategori. SKU kaos yüksek ama operasyonel risk düşük — iade/kalite şikayeti az. Marka egemenliği yok, yeni oyuncu için alan var. Orta fiyat segmentinde ($20-40) fırsat.

### 4. Cable Organizer
- **Data Points:** 26 ürün (LOW güven)
- **Composite:** NULL — YETERSİZ VERİ
- **SKU Kaos:** 10.0/10 (filtre kriterlerine uyan ürünler bile geniş fiyat yelpazesinde)
- **Marka Güvenilirliği:** 9.4/10 (parçalı)
- **Yorum:** Filtre kriterleri çok az ürün döndürdü (26). Karar için yeterli veri yok. Teknik not: `INSUFFICIENT_DATA` aynı zamanda güvenli sinyal üretilemediğini gösterir — bu kategoriyi kendi araştırma ile desteklemek gerekir. Amazon US'te bunun gibi basit ürünlerde rekabetin yoğun olduğu bilinmektedir.

### 5. Surge Protector
- **Data Points:** 22 ürün (LOW güven)
- **Composite:** NULL — YETERSİZ VERİ
- **Fiyat Savaşı:** 10.0/10 (dikkat çekici — yüksek fiyat rekabeti)
- **Marka Güvenilirliği:** 9.0/10 (parçalı)
- **Yorum:** Filtre kriterleri çok az ürün döndürdü (22). Fiyat savaşı skoru 10/10 — bu kategoride ciddi fiyat baskısı var. Segment analizi olmadan giriş önerilmez. Belirli bir güç/soket özellik kombinasyonuna odaklanarak niş giriş değerlendirilebilir.

---

## Motor Performansı

| Metrik | Değer |
|--------|-------|
| Toplam çalıştırma (bu session) | 5 keyword × 3 round = 15 job |
| Başarılı tamamlanan (son round) | 5/5 |
| Ortalama işlem süresi | ~20-30 sn/keyword |
| Oxylabs API | Çalışıyor (zaman zaman 429 — rate limit) |
| Keepa API | Aktif (budget yönetimi çalışıyor) |
| MySQL kayıt | Tam — 8 tablo, tüm skorlar persist ediliyor |

---

## Teknik Notlar

### Düzeltilen Hatalar (bu session)
1. **`processKeepaQueue` LIMIT bug** — mysql2 prepared statement'ta integer LIMIT parametresi hata veriyordu. String interpolasyon ile düzeltildi. (commit: `19d59c3`)
2. **NaN guard** — `saveAmazonProducts` ve `upsertAmazonCategoryStats`'ta NaN/Infinity değerlere karşı koruma eklendi. (commit: `3c14dfc`)

### Filtre Tavsiyesi
Müşteri panelinde varsayılan filtreler: review 10-5000, rating 3.5-5.0, fiyat $5-500.
Daha dar filtreler (<50 ürün) `INSUFFICIENT_DATA` döndürebilir — bu kasıtlı davranış.

---

## Müşteri Sunumuna Hazır Sonuç

**3 keyword için gerçek ticari karar üretildi:**
- thermal labels: 5.3 → **DİKKATLİ OL** (giriş riskli ama imkansız değil)
- dash cam: 5.4 → **DİKKATLİ OL** (segment seçimi kritik)
- webcam lighting: 5.2 → **DİKKATLİ OL** (büyüyen kategori, fırsat var)

**2 keyword için veri yetersizliği:**
- cable organizer, surge protector: daha geniş filtrelerle veya farklı keyword varyantlarıyla tekrar analiz önerilir.
