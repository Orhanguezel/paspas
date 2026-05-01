# 08 — SaaS API Bütçe Analizi

> **Bağlam (v1.1):** Bu doküman dış servis (Hunter, Apollo, Google Places, LLM) maliyetlerinin **detaylı analizini** içerir. Bütçe genel resmi (3 senaryo, donanım, ROI): [`proje-teklifi/08-butce-kaynak.md`](../proje-teklifi/08-butce-kaynak.md). Bu doküman **karşılaştırma matrisi ve alternatifler** için referanstır.

## Soru

> "Hunter.io $49 + Apollo.io $59 + Google Places ~$50 = ~$160/ay onaylı mı?"

İlk teklif rakam atılmıştı. Bu doküman **ne için ödendiğini, alternatifleri ve free tier'la ne kadar gidilebileceğini** netleştirir. Karar verme yerine **karar için zemin** sunar.

## 1. Hunter.io — email bulma + doğrulama

### Ne işe yarar
- Şirket domain'inden çalışanların kurumsal email'lerini bulma (`linkedin.com/company/X` → `firstname.lastname@x.com` pattern keşfi)
- Email doğrulama (`SMTP probe + DNS + bounce risk`)
- "Find email" + "Verify email" iki ayrı kullanım

### Fiyatlandırma (2026)
| Plan | Aylık | Search/ay | Verify/ay | Notlar |
|------|-------|-----------|-----------|--------|
| **Free** | $0 | 25 | 50 | Test için yeter |
| Starter | $49 | 500 | 1000 | "Önerilen başlangıç" |
| Growth | $149 | 5000 | 10000 | Ölçek büyük olunca |
| Pro | $499 | 50K | 100K | Enterprise |

### Alternatifler

| Servis | Fiyat | Free tier | Avantaj | Dezavantaj |
|--------|-------|-----------|---------|------------|
| **Snov.io** | $39/ay | 50 credit/ay | Email bulma + sequence + LinkedIn extension | UI biraz dağınık |
| **FindThatLead** | $49/ay | 50 lead/ay | Avrupa odaklı | Database küçük |
| **Skrapp** | $39/ay | 50 lead/ay | Ucuz, basit | Güncellenme yavaş |
| **Voila Norbert** | $49/ay (1000 search) | Trial 50 | Doğruluk yüksek (~%98) | Sadece arama, sequence yok |
| **Anymail Finder** | $49/ay | 50 doğrulanmış email | Fiyatlandırma "found"a göre | Limit küçük |

### Önerim
- **Faz 0-2:** Free tier ($0) yeter. 25 email/ay test/dogrulama için kafi.
- **Faz 3 başlangıç:** Snov.io $39/ay (en hesaplı; Hunter alternatifi)
- **Faz 4 ölçeklendirme:** Hunter Starter $49/ay veya Growth $149/ay (yurt dışı outreach açıldığında)

## 2. Apollo.io — B2B contact + iletişim enrichment

### Ne işe yarar
- 275M+ kişi + 60M şirket veritabanı
- Filtre ile "Almanya'da, tekstil sektöründe, 50-200 çalışan, son 1 yılda yeni satış müdürü" sorgusu
- Email + telefon (mobil dahil) verisi
- Sequence (otomatik email akışı) ve dialer dahil

### Fiyatlandırma (2026)
| Plan | Aylık | Email credit | Mobile credit | Export | Notlar |
|------|-------|--------------|---------------|--------|--------|
| **Free** | $0 | 50 | 0 | 100 export/ay | Sadece email aç |
| Basic | $59 | 900 | 60 | 1K export | "Önerilen" |
| Professional | $99 | 12K | 120 | 10K export | Sequence dahil |
| Custom (Org) | $$$ | unlimited | -- | -- | Enterprise |

### Alternatifler

| Servis | Fiyat | Database | Avantaj | Dezavantaj |
|--------|-------|----------|---------|------------|
| **Lusha** | $29-79/ay | 150M kişi | Telefon doğruluğu yüksek | Email tarafı zayıf |
| **Cognism** | Custom $$$ | 400M | Avrupa GDPR uyumlu, mobile yoğun | Min $3000/yıl başlangıç |
| **RocketReach** | $39-249/ay | 700M kişi | Geniş database | Sequence yok |
| **Saleshandy** | $25/ay | 700M kişi (yeni) | En hesaplı, sequence dahil | Database eski |
| **Wiza** | $49/ay (1000 credit) | LinkedIn'den scrape | LinkedIn export'u en iyi | LinkedIn ToS riski |
| **ZoomInfo** | $$$ | En geniş | Premium B2B | Min $15K/yıl |

### Önerim
- **Faz 0-2:** Free tier ($0). 50 email aç + 100 export → keşif crawler ile birleştirilirse ayda ~50-100 lead test edilebilir.
- **Faz 3 lokal başlangıç:** Apollo Free yetebilir; lokal scraper (TOBB, Google Places) bedava.
- **Faz 4 yurt dışı:** Apollo Basic $59/ay veya Saleshandy $25/ay (en hesaplı). Tercih nedeni: free tier'da veri çekmek mümkün ama ölçek için ödemek lazım.

## 3. Google Places API

### Ne işe yarar
- Konum + sektör filtreli işletme bilgisi (firma adı, adres, telefon, web, çalışma saati)
- Türkçe sektör isimleriyle çalışır
- Nearby Search, Text Search, Place Details endpoint'leri

### Fiyatlandırma (2026)
- **$200/ay free credit** (Google Cloud Platform — her hesaba)
- Endpoint başına farklı fiyat:
  - Place Search (Basic): $32 / 1000 req
  - Place Search (Contact): $35 / 1000 req
  - Place Details (Basic): $17 / 1000 req
  - Place Details (Atmosphere — review/photo): $25 / 1000 req

### Pratik hesap
- Bir lead için tipik akış: 1 Search + 1 Details = ~$0.05
- $200 free → ~4000 lead/ay free
- Bu **Faz 3 için fazlasıyla yeter** (planlanan: 100-500 lead/gün ≈ 3000-15000/ay)
- Sadece ölçek 4000'i geçerse aylık ödeme başlar

### Alternatifler

| Servis | Fiyat | Avantaj | Dezavantaj |
|--------|-------|---------|------------|
| **Foursquare Places API** | $200 free + $9-49/ay tier | Restoran/sosyal odaklı | B2B firma için zayıf |
| **Yelp Fusion** | Free 5000/gün | Hızlı ve free | ABD odaklı, TR sınırlı |
| **OpenStreetMap (Overpass)** | Free | Açık veri | Veri kalitesi tutarsız |
| **HERE Geocoding** | Free 1000/gün | Avrupa güçlü | UI/UX zayıf |
| **Mapbox Search** | Free 100K/ay | Hesaplı | İletişim verisi eksik |

### Önerim
- **Google Places** birinci tercih — $200 free ile büyük lead taraması yapılır.
- Yedek olarak **OpenStreetMap Overpass** (free) yurt içi sokak/sektör verisi için.

## 4. AI provider — mevcut bütçe

Şu an `.env`'de zaten kurulu: Anthropic + OpenAI + Groq. Bunlar kullanım başına ödenir, sabit aylık değil.

| Provider | Tahmini aylık (orta yoğunluk) |
|----------|-------------------------------|
| Anthropic Claude (test analizleri, sohbet) | $20-60 |
| OpenAI (yapılandırma, JSON çıktı) | $10-30 |
| Groq (hızlı sohbet, ucuz) | $5-15 |

Ölçeğe göre $35-105/ay. Talep motoru + lead skorlama + outreach metni ekleyince yıl ortasında $100-200 olabilir.

## 5. Email gönderim altyapısı

Outreach için (Faz 4):

| Servis | Fiyat | Avantaj |
|--------|-------|---------|
| **Brevo (Sendinblue)** | Free 300/gün, $25/ay 20K | Türkiye'de yaygın, GDPR |
| **Mailgun** | Free 5K/ay 3 ay, $15/ay sonra | Developer dostu, API |
| **Postmark** | $15/ay 10K | Transactional için en iyi deliverability |
| **Amazon SES** | $0.10/1000 | En ucuz ama dashboard yok |
| **Resend** | $20/ay 50K | Modern UI, React Email entegre |

### Önerim
- **Brevo Free** (300/gün) Faz 4 başlangıçta yeter
- Kampanya büyürse **Mailgun $15/ay**

## 6. Toplam tahminleri — 3 senaryo

### Senaryo A — "Free tier ile başla" (Faz 0-3 ilk ay)
| Kalem | Maliyet |
|-------|---------|
| Hunter.io Free | $0 |
| Apollo.io Free | $0 |
| Google Places ($200 credit) | $0 |
| AI provider (orta yoğunluk) | $20-50 |
| Email (Brevo Free) | $0 |
| **Toplam** | **$20-50/ay** |

Yapılabilenler: Lokal lead crawler, TOBB/Google Places ile yurt içi 3000-4000 lead, AI ile yapılandırma + skorlama, manuel takip.

### Senaryo B — "Operasyonel ölçek" (Faz 3-4 olgun)
| Kalem | Maliyet |
|-------|---------|
| Snov.io Starter | $39 |
| Apollo.io Basic | $59 |
| Google Places (büyük tarama) | $50 |
| AI provider | $80-150 |
| Brevo paid | $25 |
| **Toplam** | **~$255-325/ay** |

Yapılabilenler: Yurt dışı outreach + sequence, mobile contact, 5000+ doğrulanmış email/ay, geniş Google taraması.

### Senaryo C — "Hızlı büyüme" (Faz 5+ veya kurumsal)
| Kalem | Maliyet |
|-------|---------|
| Hunter Growth | $149 |
| Apollo Pro | $99 |
| Lusha Add-on (telefon) | $79 |
| Google Places + alternatifler | $100 |
| AI (yoğun) | $200-400 |
| Mailgun + Brevo | $40 |
| **Toplam** | **~$667-867/ay** |

Yapılabilenler: 50K+ email/ay, telefon dahil, çoklu sequence, ileri analiz.

## 7. Önerilen yol

**Aşamalı:**

1. **Şimdi (Faz 0-2):** Hiçbir SaaS ödemesi yapma. Free tier'larla başla. AI dışında maliyet **$0-20/ay**.
2. **Faz 3 başında:** Snov.io $39/ay (Hunter alternatifi) — ihtiyaç gerçekten doğunca aktive et.
3. **Faz 3 sonu:** Apollo Free yetmiyorsa Apollo Basic $59/ay.
4. **Faz 4 başında:** Brevo paid $25/ay (kampanyaya göre).
5. **Toplam orta vade:** ~$120-180/ay (önerdiğin $160 aralığında).

**Karar ihtiyacı:**
- (A) Kademeli yaklaşımı onayla — şu an hiç ödeme yok, ihtiyaç çıktıkça aç.
- (B) Doğrudan Senaryo B'ye geç — Faz 3'le birlikte $255/ay.
- (C) Daha hesaplı bir alternatif paket önereyim mi (örn. Saleshandy $25 + Apollo Free + Google Places)?

## 8. Bir not — neden yine de free tier yetmiyor

Free tier'lar **tek seferlik test** için yeter; ama 4 kritik ihtiyaç ödeme gerektirir:

1. **Email doğrulama hacmi** — yüzlerce email göndereceksen ödemen şart, yoksa domain reputation çöker
2. **Mobile telefon verisi** — ücretsiz değil, premium
3. **GDPR-uyumlu Avrupa lead'i** — ücretsiz kaynaklar ABD ağırlıklı, AB için Apollo/Cognism gerek
4. **Sequence/follow-up otomasyonu** — manuel takip ölçek almıyor

## Açık karar noktaları

1. Senaryo A/B/C'den hangisi tercih?
2. AI provider tarafında token limiti koymak isteyelim mi (örn. ay başına $100 üst sınır)?
3. Yurt dışı baştan mı (Faz 4'le aynı anda) yoksa yurt içi olgunlaşınca mı?
