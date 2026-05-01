# 05 — Veri Toplama Altyapısı (Crawler, CRM, AI Entegrasyonları)

> **Bağlam (v1.1):** Bu doküman scraping ve veri toplama altyapısının **genel tartışmasıdır**. Bayi-spesifik scraping ve churn radarı **Faz 5** olarak kristalize edildi — derinlemesine teknik tasarım: [`13-bayi-scraping-churn.md`](./13-bayi-scraping-churn.md) (KVKK çerçevesi, Crawlee+Playwright stack, 11 sinyal, churn ML modeli).

## Amaç

Müşteri/tedarikçi keşfi, talep toplama, fiyat takibi gibi modüllerin **dış dünyadan veri çekme** ihtiyacı için ortak altyapı. Bu doküman teknoloji seçimini ve "openclaw" kelimesinin olası yorumlarını netleştirir.

## "openclaw" — Kullanıcı netleştirmesi gerekli

Aşağıdaki adaylardan hangisi kastedildi?

### Aday A — Open Source CRM (en olası)

> Eğer "satış pipeline'ı, lead yönetimi, müşteri etkileşim geçmişi" istenen şey ise:

| CRM | Lisans | Stack | Öne çıkan |
|-----|--------|-------|-----------|
| **EspoCRM** | GPL v3 | PHP + MySQL | Hafif, REST API, kolay self-host |
| **SuiteCRM** | AGPL | PHP + MySQL | Salesforce alternatifi, geniş özellik |
| **VTiger** | Apache 2.0 | PHP + MySQL | Sektör temalı, e-mail kampanya dahil |
| **CiviCRM** | AGPL | PHP, WordPress/Drupal eklenti | Üye yönetimi/STK odaklı |
| **Odoo CRM** | LGPL (community) | Python + PostgreSQL | ERP + CRM tek paket, geniş ekosistem |
| **Twenty** | AGPL | TypeScript + GraphQL | Modern UX, yeni nesil |
| **Krayin CRM** | MIT | Laravel + MySQL | Modüler, hafif |

**Önerim:** EspoCRM veya Twenty. EspoCRM kurulum kolay + REST API; Twenty modern stack ve TypeScript ekosistemi.

**Entegrasyon yolu:** Paspas ERP'nin `musteriler`, `lead_havuzu`, `lead_etkilesim` tabloları **tek doğruluk kaynağı** kalır; CRM senkron edilir (uçak rezervasyon sistemleri gibi). Veya CRM dış arayüz, Paspas back-office. Karar bekliyor.

### Aday B — Web Crawler / Scraper

> Eğer "internetten firma bilgisi toplama" araç istenen şey ise:

| Araç | Tip | Diller | Öne çıkan |
|------|-----|--------|-----------|
| **Crawlee** | Library | Node.js / Python | Apify ekosistemi, headless browser dahil |
| **Apache Nutch** | Distributed | Java | Büyük ölçekli, Hadoop entegrasyon |
| **Crawl4AI** | LLM-first | Python | LLM ile yapılandırılmış çıktı |
| **Firecrawl** | API/SaaS + OSS | TypeScript | Markdown çıktı, LLM dostu |
| **Scrapy** | Framework | Python | En olgun, geniş community |
| **Playwright** | Browser auto | Multi | Modern JS-render eden siteler için (mevcutta var, e2e testten) |

**Önerim:** Crawlee + Playwright (Node.js stack — Paspas backend ile aynı runtime). Yapılandırılmış çıktı için Crawl4AI yardımcı olabilir ama opsiyonel.

### Aday C — OpenWebUI / Lokal LLM Frontend

> Eğer "lokal AI asistan ile sohbet" arayüz istenen şey ise:

- **OpenWebUI** — Ollama backend ile sohbet UI'ı, kendi sunucunda çalışır
- **LibreChat** — ChatGPT alternatifi, çoklu model (OpenAI, Anthropic, Ollama)
- **AnythingLLM** — Doküman tabanlı RAG + chat

**Not:** Test merkezindeki AI analiz modülü zaten Anthropic/OpenAI/Groq destekliyor. Bunlardan biri sadece "kendi LLM'ini barındır" ihtiyacı çıkarsa anlamlı.

### Aday D — Yazım hatası

"OpenClaw" diye spesifik bir tool internette yok. Kullanıcı: "OpenCRM" mi yoksa "Crawl" türevi bir şey mi yoksa başka bir araç mı kastettiğini netleştirsin.

## Önerilen "veri toplama stack'i" (CRM seçiminden bağımsız)

### Katman 1 — Crawler runtime
- **Crawlee + Playwright (Node.js)** — Paspas backend ile aynı dil, bun runtime'a uyumlu
- Bot algılama bypass için **playwright-extra + stealth plugin**
- Proxy rotasyonu: **Bright Data / Oxylabs / Smartproxy** ($75-200/ay) veya başlangıçta proxy'siz

### Katman 2 — Yapılandırma
- HTML parse: Crawlee yerleşik
- LLM çıkarımı: mevcut `test_center/ai_provider.ts` (Claude/OpenAI/Groq)
- **Crawl4AI** ile direkt "URL → JSON schema'lı çıktı" alınabilir (Python servisi olarak)

### Katman 3 — API entegrasyonları (resmi kanallar)

| Servis | Kullanım | Maliyet |
|--------|----------|---------|
| Google Places API | Konum + sektör | $17 / 1000 |
| Hunter.io | Email bulma + doğrulama | $49/ay |
| Apollo.io | İletişim enrichment, B2B | Free 50 lead, $59/ay 5K |
| Clearbit | Firma profili (Salesforce'a satıldı, fiyatlama belirsiz) | — |
| LinkedIn Sales Navigator | Manuel (resmi API yok) | $99/ay/kullanıcı |
| ZoomInfo | Premium B2B | $$$ |
| Türkiye TOBB üye sorgu | Public web | Ücretsiz |
| TİM ihracatçı listesi | Public web | Ücretsiz |

### Katman 4 — Job queue
- **BullMQ** (Redis tabanlı) — büyük scrape işlerini arka planda çalıştırma
- Yoksa basit `setInterval` cron + queue tablosu (DB tabanlı)

### Katman 5 — İzleme
- Hata oranı, başarı oranı, ortalama latency
- Domain başına rate limiting (1 req/2sn varsayılan)
- robots.txt uyumu

## Yasal / etik notlar

| Konu | Yaklaşım |
|------|----------|
| robots.txt | Kabul edilmesi şart. Disallow path'ler ziyaret edilmesin. |
| Rate limit | Aynı domaine paralel istek sayısı sınırlı, randomized delay |
| KVKK (TR) | Kişisel veri (isim/email) toplandığında saklama süresi tanımlı + opt-out yolu |
| GDPR (AB) | Avrupa lead'leri için: legitimate interest gerekçesi + opt-out + DSR (data subject request) süreci |
| CFAA (ABD) | Login arkasındaki sayfaları scrape etme — ABD lead'lerinde riskli |
| Site ToS | LinkedIn vb. resmi olarak yasaklı; manual research alternatifi |

## Açık sorular

1. **CRM kararı:** Aşağıdakilerden hangisi?
   - (a) Paspas ERP içinde basit lead pipeline tab'ı (1-2 hafta)
   - (b) EspoCRM/Twenty kur, Paspas ile senkron (4-6 hafta)
   - (c) Şimdilik CRM yok, Apollo.io UI'ı kullanılır (sıfır kod, $59/ay)
2. **Crawler hosting:** Backend ile aynı sunucuda mı, ayrı VPS mi?
3. **Proxy bütçe:** $75-200/ay proxy maliyeti onaylanır mı?
4. **API maliyeti:** Hunter.io + Apollo.io + Google Places ≈ $150-200/ay sabit
5. **Yurt dışı odak ülke:** AB (Almanya, Hollanda, İngiltere) mı, Orta Doğu (Suudi, BAE) mı, ABD mi?

## Bağımlılıklar

- ✅ `test_center/ai_provider.ts` — AI altyapısı hazır
- ✅ Playwright kuruluk (e2e için), crawler için yeniden kullanılabilir
- ⚠️ Job queue altyapısı yok (BullMQ veya alternatif)
- ⚠️ Lead/firma şemaları henüz tanımsız
- ⚠️ CRM seçim kararı bekleniyor

## Tahmini iş büyüklüğü

| Bileşen | Süre |
|---------|------|
| Crawlee setup + ilk crawler (Google Places) | ~3-4 gün |
| Job queue (DB tabanlı veya BullMQ) | ~2-3 gün |
| AI tabanlı yapılandırma (Crawl4AI veya inline LLM) | ~3 gün |
| API entegrasyonları (Hunter, Apollo) | ~2 gün her biri |
| CRM entegrasyonu (seçilen ürüne göre) | 5-15 gün |
| **Toplam (CRM hariç)** | **~12-15 iş günü** |
| **Toplam (CRM dahil)** | **~20-30 iş günü** |
