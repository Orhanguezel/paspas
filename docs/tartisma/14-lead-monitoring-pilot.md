# 14 — Lead/Rakip Monitoring: Paspas Pilot Müşteri ve Ürünleştirme

> **Bağlam:** Bu doküman paspas projesinin lead/competitor monitoring ürününün **ilk pilot müşterisi** olarak değerlendirilmesini ve buradan **gelir üreten managed service** çıkartma stratejisini tartışır.
>
> **Felsefe değişimi:** [`13-bayi-scraping-churn.md`](./13-bayi-scraping-churn.md) bu özelliği **paspas-içi modül** olarak tasarlamıştı. Bu doküman aynı altyapıyı **çapraz-müşteri satılabilir bir ürün/modül** olarak konumlandırır.

---

## 1. Stratejik Karar (2026-05-02)

Paspas müşterisi bayi izleme için somut bir ihtiyaç bildirdi. Bu ihtiyaç:
- Paspas ERP'nin doğal bir uzantısı (mevcut bayi tablosu üzerine sinyal katmanı)
- Diğer Orhan müşterileri (Ensotek, Vista, Konig, Bereketfide vb.) için de satılabilir hizmet
- GeoSerra'nın "Rakip İzleme" modülü olarak resmi entegrasyon hedefi

**Karar:** Lead/Competitor Monitoring **bağımsız ürün değil, çapraz modül** olarak geliştirilir:
- Paspas içinde: bayi churn radarı (mevcut CRM'in parçası)
- GeoSerra içinde: rakip izleme paketi (199-499 EUR/ay add-on)
- Diğer müşterilere: managed service (haftalık Excel/PDF rapor + dashboard erişimi)

## 2. Mevcut Altyapı (Hazır)

- **scraper-service** (`scraper.guezelwebdesign.com`) — production'da, Cloudflare bypass, cookies, multi-step POST destekleri kanıtlı
  - 4 proje LIVE entegre: GeoSerra, geo-seo-claude, hal-fiyatlari, sportoonline
  - API key yönetimi mevcut (her proje için ayrı key)
- **`scraper-service/docs/lead-competitor-*.md`** — 4 doküman (product, architecture, mvp, roadmap)
- **Bu repodaki [`13-bayi-scraping-churn.md`](./13-bayi-scraping-churn.md)** — KVKK çerçevesi, 11 sinyal, mimari diyagram

## 3. Paspas Pilot — Bu Hafta (2026-05-02 → 2026-05-09)

### 3.1 Müşteri Görüşmesi
**Hedef:** Spesifik gereksinim toplamak ve fiyat onayı almak.

Sorular:
1. Kaç bayi takip edilecek? (10? 50? 100?)
2. Hangi sinyal en kritik? (rakip ürün, fiyat değişikliği, sosyal aktivite, yorum sayısı?)
3. Rapor frekansı? (haftalık? aylık?)
4. Format? (Excel, PDF, dashboard, e-posta özet?)
5. Bütçe? **Önerilen fiyat: 199-499 EUR/ay**, paspas üst paketi olarak veya ayrı

### 3.2 Minimum Ürün (Manuel)
İlk hafta scraper-service ile manuel scrape + Excel'e yapıştır + müşteriye gönder.

```
Bayi | Site | Yeni Ürün? | Fiyat Değişti? | Sosyal Aktivite | Skor
```

5 sütun yeterli. Kod yazma vakti gelmedi.

### 3.3 Fatura
Manuel raporu teslim ettikten sonra fatura kes. Hedef: **2026-05-09'a kadar ilk 199 EUR ödeme.**

## 4. Sonraki Müşteriler (Hafta 2-4)

Pilot başarılı olursa referans + sonraki teklifler:

| Müşteri | Teklif | Beklenen aylık |
|---------|--------|----------------|
| Ensotek (Almanya endüstriyel cooling) | Avrupa rakipleri izleme | 299 EUR |
| Vista İnşaat | Türkiye yalıtım sektörü | 199 EUR |
| Konig Massage | Bonn rakip masaj salonları | 149 EUR |
| Bereketfide | Tarım/fide rakipleri | 199 EUR |
| Vista Seeds | Tohum sektörü rakip ürünler | 199 EUR |

**Hedef hafta 4:** 3-5 müşteri × 199-299 EUR = **~600-1500 EUR/ay recurring revenue**.

## 5. Otomasyon (Hafta 4-8)

Manuel iş 5+ müşteriye dayanmaz. Otomasyon adımları:

1. **Scheduler servis** (yeni: `lead-monitor-worker`)
   - BullMQ + Redis
   - Her müşteri için cron (haftalık/günlük)
   - Scraper-service API'sine job gönderir
2. **HTML diff comparator**
   - Önceki snapshot ile karşılaştır
   - Sinyal listesi oluştur (rakip ürün, fiyat, vb.)
3. **Rapor üretici**
   - Excel/PDF auto-generate
   - E-posta gönderim (mevcut nodemailer)
4. **Basit dashboard**
   - GeoSerra'ya yeni route: `/admin/competitor-monitoring`
   - Müşteri kendi raporlarını ve sinyal feed'ini görür

## 6. GeoSerra Modülü Entegrasyonu (Ay 2-3)

Pilot ve 5+ müşteri durumu netleşince GeoSerra'ya resmi modül olarak entegre:

- Yeni paket: "Rakip İzleme" (Pro/Expert üstü add-on)
- Müşteri GeoSerra hesabıyla giriş, dashboard'tan kullanır
- Backend: `geoserra-backend/src/modules/competitor-monitoring/`
- Stripe/PayPal mevcut payment entegrasyonu kullan

## 7. KVKK/GDPR Uyumu

`13-bayi-scraping-churn.md` §2'de detaylı çerçeve mevcut. Özet:
- ✅ Sadece public veri (login arkası YOK)
- ✅ Sadece firma verisi (telefon/email kişisel veri olarak harvest YOK)
- ✅ robots.txt saygısı
- ✅ User-Agent açık kimlik
- ✅ Aydınlatma metni: "rakip ve müşteri sitelerinden public veri toplanır"

## 8. Cross-References

- **Detay teknik mimari:** [`13-bayi-scraping-churn.md`](./13-bayi-scraping-churn.md)
- **Ürün/architecture/mvp/roadmap dökümanları:** `/home/orhan/Documents/Projeler/scraper-service/docs/lead-competitor-*.md` (4 dosya)
- **Workspace strateji notu:** `/home/orhan/Documents/Projeler/BUSINESS-STRATEGY.md`
- **GeoSerra entegrasyon planı:** `/home/orhan/Documents/Projeler/vps-guezel/geoserra/CLAUDE.md` (Aktif Hatırlatmalar)
- **Memory entry:** `~/.claude/projects/-home-orhan-Documents-Projeler/memory/lead_monitoring_business.md`

## 9. Aktif Hatırlatmalar (Tarih Kontrol Et)

- 🔔 **2026-05-09'a kadar:** Paspas müşteri görüşmesi + ilk teklif/fatura
- 🔔 **2026-05-16:** Pilot durum değerlendirmesi — gelir geldi mi, müşteri memnun mu
- 🔔 **2026-05-23:** İkinci müşteriye teklif (Ensotek/Vista/Konig listesinden seç)
- 🔔 **2026-06-02:** 3-5 müşteri toplam, otomasyon başlat (scheduler + diff)
- 🔔 **2026-08-02:** GeoSerra modülü entegrasyonu başlat (3 ay sonra)
