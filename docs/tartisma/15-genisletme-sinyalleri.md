# 15 — Genişletme Sinyalleri (Faz 8+ Vizyonu)

> Faz 0-7 ana iskelet. Bu dokümandaki 10 sinyal **dah sonraki fazlar** için potansiyel modüller. Her biri ayrı tartışma + derinlemesine doküman gerektirir. Şu an **kayıt amaçlı** — yol haritası genişlemesi için referans.

---

## Sinyal #1 — Rakip & Pazar İstihbaratı (Competitor Intelligence)

### Soru
> "Rakiplerimiz ne yapıyor? Hangi yeni ürünleri çıkardı, fiyatları nereye gitti?"

### Kapsam
- Rakip web sitelerini düzenli tarama (`competitor_radar` modülü)
- Yeni ürün lansmanları
- Fiyat değişiklikleri
- Kampanya paterni
- B2B fiyat listeleri (public olanlar)
- E-ihale kayıtları (kamu ihaleleri açık)
- Patent başvuruları (Türkpatent API)

### Veri kaynakları
- Rakip e-ticaret siteleri
- B2B portallar (sahibinden, sanayim.net, gibi)
- Kamu İhale Kurumu
- Türkpatent (yeni patent başvuruları)
- Vergi mükellefi sorgulama (yeni şirket kuruluşları)

### Çıktı
- "Rakip A şu hafta 3 yeni ürün lansman yaptı"
- "Rakip B fiyatlarını ortalama %8 indirdi (geçen ay)"
- "Kamu ihale X-Y-Z'de rakip C kazandı, bizim teklifimizi geçti"
- Pazar payı tahmini (search query share + scraping toplam)

### Bağımlılık
- Faz 5'in scraping altyapısı zaten var → reuse
- Yeni: rakip listesi yönetimi, sektör tanım

### Tahmini iş yükü
- Backend modül: 2-3 hafta
- UI: 1 hafta

---

## Sinyal #2 — Müşteri Churn Tahmini (Customer Churn)

### Soru
> "Hangi müşterimizi (B2B değil B2C son kullanıcı) kaybetme riskimiz var?"

Faz 5 **bayi** churn'una odaklı. Bu farklı: **son kullanıcı / direkt müşteri** churn'u.

### Hedef tabaka
- Direkt sipariş veren müşteriler (bayisiz)
- Online sipariş geçmişi olanlar
- Sürekli müşteri (subscription benzeri tekrar alıcı)

### Sinyaller
- Sipariş aralığı uzaması
- Sepet terk etme
- Email açmama / tıklama düşüşü
- Destek talebi sıklığı
- Geri ödeme/iade sayısı
- NPS skoru düşüşü (anket)

### Model
- Survival analysis (Kaplan-Meier, Cox regression)
- XGBoost classifier (kullanıcı 90 gün içinde sipariş kesecek mi?)

### Aksiyon
- Risk eşiği üstü → otomatik retention email
- Yüksek skorlu → custom indirim teklifi
- Kritik → satış ekibine bildirim (manuel temas)

### Tahmini iş yükü
- 2-3 hafta (survival analysis öğrenme eğrisi var)

---

## Sinyal #3 — Fiyat Optimizasyonu (Dynamic Pricing)

### Soru
> "Ürün X için optimum fiyat ne? Bayi Y'ye hangi iskonto?"

### İki katman

#### A — B2B iskonto optimizasyonu
- Bayi profili × ürün × dönem → optimum iskonto
- "Bu bayi %5 iskontoyla sipariş verir, %3'te de verir → %3 öner"
- Reinforcement learning (bandit problem)
- A/B test ile öğren

#### B — Liste fiyatı optimizasyonu
- Talep elastikiyeti analizi
- Rakip fiyatları + maliyet + kar marjı
- Fiyat elastikiyet modeli (econometric)

### Veri ihtiyacı
- En az 12 ay fiyat × satış geçmişi
- Rakip fiyat verisi (Sinyal #1)
- Maliyet bilgisi (`receteler` × ham madde fiyatları)

### Risk
- Yanlış öneri → kar kaybı veya müşteri kaybı
- Otomasyon eşikleri (Doc 09) yüksek olmalı, manuel onay zorunlu

### Tahmini iş yükü
- 4-6 hafta (econometric modelleme zaman alır)

---

## Sinyal #4 — AI Belge İşleme (OCR + LLM)

### Soru
> "Tedarikçi faturası, müşteri PO'su, irsaliye gibi PDF'leri otomatik DB'ye yaz."

### Kapsam
- **Gelen fatura** (e-fatura olmayan, kağıt scan veya PDF)
- **Müşteri PO** (manuel order, fax, email PDF)
- **İrsaliye** (sevkiyat doğrulama)
- **Sözleşme** (bayi/müşteri sözleşme klozları çıkarımı)
- **Test raporu / kalite sertifikası**

### Stack
- OCR: Tesseract (open source) veya Google Cloud Vision ($1.50/1000 sayfa)
- LLM extraction: Claude / GPT-4 (yapılandırılmış JSON çıkar)
- Validasyon: Zod schema + ham OCR ile karşılaştırma

### Akış
```
PDF yükle → OCR → ham metin
  → LLM "bu bir tedarikçi faturası, alanları çıkar"
  → JSON: { tedarikci, fatura_no, tarih, kalemler: [...] }
  → Validation: Zod
  → DB'ye yaz veya manuel onay kuyruğuna
```

### Doğruluk hedefi
- Faturada ≥ %95 alan doğruluğu (yanlış tutar = ciddi sorun)
- İnsan onayı: ilk 1000 evrak, sonra eşik altı geçenler

### Tahmini iş yükü
- 3-4 hafta (entegrasyon, validation, UI)

### Bağımlı sistem
- Şu an Paspas'ta `gelen_evrak` tablosu yok → eklenmeli

---

## Sinyal #5 — Lojistik & Rota Optimizasyonu

### Soru
> "Sevkiyat aracını hangi sırayla durduralım? Hangi araç hangi siparişe?"

### Kapsam
- VRP (Vehicle Routing Problem)
- Çoklu araç + çoklu durak optimizasyonu
- Trafik durumu (Google Maps API)
- Araç kapasitesi + ürün hacmi
- Müşteri zaman penceresi (sabah/öğleden sonra teslimat)

### Algoritma
- OR-Tools (Google) — VRP solver
- Genetic algorithm
- Kısıtlı durumda nearest neighbor heuristic

### Veri
- Sevkiyat adres geocoding
- Araç bilgisi (kapasite, max yük)
- Trafik geçmişi
- Yakıt fiyatı

### Çıktı
- Günlük sevkiyat planı
- Rota harita üzerinde (Mapbox / Leaflet)
- Tahmini varış zamanı
- Yakıt + zaman maliyeti

### Bağımlı modül
- Paspas'ta sevkiyat modülü (zaten var: `sevkiyat_emirleri`)
- Adres geocoding altyapısı

### Tahmini iş yükü
- 4-6 hafta

---

## Sinyal #6 — Mobil Uygulama (Saha Ekibi + Operatör + Bayi)

### Soru
> "Saha satış elemanı, üretim operatörü, bayinin kendisi mobilden ne yapsın?"

### 3 farklı uygulama / role

#### A — Saha Satış Mobil
- Bayi ziyaret kaydı (tarih, lokasyon, foto)
- Sipariş oluşturma (offline çalışsın)
- Bayi metadata güncelleme
- Churn radarı (bayi başına risk göstergesi)
- Sesli not → metin (Whisper API)

#### B — Operatör Mobil (Faz 1'de halihazırda var? — kontrol edilmeli)
- İş emri durumu güncelleme
- Hata raporu (foto + açıklama)
- Vardiya teslim formu

#### C — Bayi Mobil (B2B Portal mobil versiyonu)
- Sipariş ver
- Stok bak
- Cari hesap
- Push bildirim (sipariş durumu, kampanya)

### Stack seçimi
- Flutter (zaten projeler kullanıyor) veya React Native
- Offline-first (PowerSync / WatermelonDB)
- Push: Firebase Cloud Messaging

### Tahmini iş yükü
- Saha satış: 4-6 hafta
- Operatör: 3-4 hafta (zaten varsa polish)
- Bayi: 6-8 hafta (web portal mobile olarak da düşünülebilir → PWA)

---

## Sinyal #7 — Dış Veri & Sektör Trendleri

### Soru
> "Sektörümüzün geneli ne yapıyor? Talep değişiyor mu?"

### Kaynaklar
- TÜİK (üretim endeksleri, perakende satış)
- TCMB (kredi büyümesi, faiz, kur)
- TOBB (üye sayısı, sektör raporları)
- Google Trends (sektör arama hacmi)
- Sosyal medya tarifi (sentiment / volume)
- News scraping (sektör haberleri → LLM özet)

### Çıktı
- Aylık "sektör nabzı" raporu (otomatik)
- Anomali tespiti: "geçen ay sektör endeksi -%5, sizin satışınız +%2 → outperformance"
- Tahmin motoruna ek özellik (sektör endeksi)

### Tahmini iş yükü
- 2-3 hafta (data pipeline + dashboard)

---

## Sinyal #8 — API & Sistem Entegrasyonları

### Soru
> "Müşteri ERP'mizle başka sistemlerle nasıl konuşur?"

### Hedef entegrasyonlar
- **e-Fatura** (Logo, Mikro, GİB direct)
- **e-Arşiv** GİB API
- **Banka entegrasyonu** (mutabakat, otomatik tahsilat)
- **Kargo API** (Aras, Yurtiçi, MNG, PTT)
- **e-Ticaret platformları** (Trendyol, Hepsiburada, N11) — ürün katalog senk
- **WhatsApp Business API** (sipariş bildirim, müşteri destek)
- **SMS Gateway** (Netgsm, İletimerkezi)
- **Muhasebe yazılımı** (Logo, Mikro, Netsis senk)

### Mimari
- Webhook receiver
- Event bus (BullMQ ile)
- Dış API client soyutlaması (`integrations/`)
- Retry + dead letter queue
- Mapping katmanı (Paspas DB ↔ dış sistem)

### Tahmini iş yükü
- Her entegrasyon: 1-3 hafta
- Genel altyapı: 2 hafta

---

## Sinyal #9 — Saha Ziyaret Notları + Field CRM

### Soru
> "Saha satış elemanı bayiyi ziyaret etti, ne konuşuldu? Bu bilgi modele girsin."

### Kapsam
- Ziyaret kaydı (tarih, lokasyon, kim)
- Sesli not → metin (Whisper)
- LLM özet: "ziyaret notunda kritik bilgi var mı?"
- Anahtar kelimeler: "rakibe geçecek", "indirim istiyor", "yeni ürün ilgili"
- Notlar Sinyal #1'e (churn) feed-in

### Yapılandırma
- Form: ziyaret tipi (rutin/satış/şikayet), katılımcılar, sonuç
- Foto/video upload
- Aksiyon takibi (next steps + due date)
- Otomatik follow-up reminder

### Bağımlı modül
- Mobile uygulama (Sinyal #6)
- Ses kaydı + Whisper API integration

### Tahmini iş yükü
- 3-4 hafta

---

## Sinyal #10 — Sürdürülebilirlik & Karbon Ayakizi

### Soru
> "Üretimimizin karbon ayakizi ne, müşteriye nasıl raporluyoruz?"

### Niye?
- AB CBAM (Carbon Border Adjustment Mechanism) — 2026'dan itibaren ihracatçıya karbon vergisi
- Büyük müşterilerin tedarikçi karbon raporu istemesi
- ESG yatırım kriterlerinin yaygınlaşması
- AB Yeşil Mutabakat uyumu

### Kapsam
- Hammadde başına karbon emisyonu (LCA - Life Cycle Assessment)
- Üretim makinesi enerji tüketimi (kWh / parça)
- Sevkiyat emisyonu (km × araç tipi)
- Toplam ürün karbon ayakizi (kg CO2e / parça)
- Müşteriye otomatik karbon raporu (sertifika benzeri PDF)

### Veri
- Enerji faturası (manuel veya IoT meter)
- Hammadde tedarikçi verisi (bazı tedarikçiler veriyor)
- Sevkiyat km × araç tipi
- Sektör veritabanı (Ecoinvent, GHG Protocol)

### Çıktı
- Ürün başına karbon raporu
- Aylık fabrika emisyon dashboard
- Müşteriye PDF (carbon footprint certificate)
- Azaltma önerileri (LLM destekli)

### Tahmini iş yükü
- 6-8 hafta (LCA hesaplama metodolojisi öğrenme + veri toplama altyapısı)

---

## Genel Toparlama

### 10 sinyal + 7 ana faz = 17 modül

| # | Modül | Faz | Bağımlılık |
|---|-------|-----|------------|
| 0 | Paspas tamamlanma | 0 | — |
| 1 | Talep tahmin motoru | 2 | Paspas |
| 2 | Stok tahmin otomasyonu | 4 | Talep tahmin |
| 3 | B2B Bayi Portalı | 6 | Paspas |
| 4 | Bayi scraping & churn | 5 | Bayi listesi |
| 5 | Eğitilebilir modeller (MLOps) | 7 | Talep tahmin |
| 6 | Konversasyonel katman | 8 | Tüm modeller |
| 7 | Rakip istihbaratı | 9 | Scraping altyapı |
| 8 | Müşteri churn (B2C) | 10 | Müşteri verisi |
| 9 | Fiyat optimizasyonu | 10 | 12 ay veri |
| 10 | AI belge işleme | 8 | OCR + LLM |
| 11 | Lojistik & rota | 11 | Sevkiyat modülü |
| 12 | Mobil uygulamalar | 9 | Web stable |
| 13 | Dış veri / sektör | 9 | API access |
| 14 | API entegrasyonları | 8-12 | Her biri ayrı |
| 15 | Saha CRM (Field) | 10 | Mobile |
| 16 | Sürdürülebilirlik / karbon | 12+ | LCA verisi |

### Toplam zaman tahmini
- Faz 0-7 (ana iskelet): ~14-15 ay
- Faz 8-12 (genişleme): ~6-12 ay daha
- **Toplam vizyon:** 2-2.5 yıl

### Aşamalı karar
Bu dokümandaki sinyallerin **hangisi**, **ne zaman**, **hangi sırada** açılacağı her fazın bitiminde Promats yönetimi ile karar verilir. Bütçe + ihtiyaç + müşteri talebi belirleyici.

---

## Açık karar noktaları

1. Bu 10 sinyalin **hangileri** Faz 8'den başlasın?
2. **Sürdürülebilirlik (Sinyal 10)**: 2026'da CBAM kritik mi? Şimdiden başlanmalı mı?
3. **Mobil (Sinyal 6)**: Web olgunlaşmadan mobil başlamak hata mı?
4. **API entegrasyonları (Sinyal 8)**: hangi öncelikli? (Önerim: e-Fatura > Kargo > WhatsApp)
5. **Field CRM (Sinyal 9)** ve **Mobil (Sinyal 6)** birleşik mi ayrı mı?
6. Promats için ilk genişleme **Sinyal 4 (AI Belge)** olabilir mi (hemen değer üretir)?
