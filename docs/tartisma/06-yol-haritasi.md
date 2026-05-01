# 06 — Birleşik Yol Haritası (A Seçeneği — Veri Önce, Konuşma Sonra)

> **Bağlam (v1.1):** Bu doküman ilk taslak yol haritasıdır (5 motor odaklı). Sonradan **11 fazlı genişletilmiş yol haritası** hazırlandı: [`proje-teklifi/07-yol-haritasi.md`](../proje-teklifi/07-yol-haritasi.md) (hafta-hafta, milestone, paralel akış, kabul kriterleri). Bu doküman ilk strateji kararını (A — veri önce, konuşma sonra) kayıt amaçlı tutar.

> **Kararlaştırılan strateji (A):** Önce 4 motoru (veri + AI + keşif + tahmin) sağlamlaştır. Konversasyonel katman 5. motor olarak EN SONA, tüm altyapı oturduktan sonra eklenir. Telegram konuşma kanalı değil **bildirim** katmanı; isteyen yönetici aktive eder.

## Yol haritası tasarım kuralları

1. **Hızlı geri dönüş önce.** Her faz sonunda kullanıcının somut faydası olmalı (rapor, panel, otomatik öneri).
2. **Veri önce, AI sonra.** AI'ın değer üretebilmesi için altında temiz veri lazım (müşteri profili, tedarikçi performansı, tüketim hızı).
3. **Manuel onay zinciri her zaman.** AI hiçbir yan etkili aksiyonu (sipariş açma, mail gönderme) tek başına gerçekleştirmez.
4. **Her motor bir öğrenme döngüsü.** Tahmin → gerçekleşen → sapma → kalibre.
5. **Konuşma katmanı en son.** Diğer 4 motor sağlamlaşmadan üzerine sohbet eklemek istenmiyor; aksi halde sohbet boş eylem fısıldayan bir maket olur.

## Faz 0 — Karar netleştirme (1 hafta)

Kod yazılmaz. Tartışma dokümanlarındaki **açık sorular** netleştirilir:

| Konu | Karar gerekli | Mevcut yön |
|------|---------------|------------|
| ✅ "openclaw" | Hangi tool/yaklaşım? | **Çözüldü:** OpenClaw self-hosted AI ops platformu, mevcut VPS'te kurulu. Pattern olarak ilham; doğrudan kullanılmıyor. |
| ✅ Telegram | Konuşma mı bildirim mi? | **Çözüldü:** Sadece bildirim katmanı (web push + email + isteyene Telegram). Konuşma Paspas UI'ı içinde. |
| ❓ CRM | Paspas içinde basit lead pipeline mı, ayrı CRM mı? | **Bekliyor — [10-crm-karari.md](./10-crm-karari.md) açıldı** |
| ❓ Email kaynak | Hangi mailbox(lar) IMAP ile dinlenecek? | **Bekliyor** |
| ❓ Bütçe | Aylık SaaS API maliyeti (~$150-300) onaylı mı? | **Bekliyor — [08-saas-butce-analizi.md](./08-saas-butce-analizi.md) açıldı** |
| ✅ Yurt dışı odak | Hangi 1-2 hedef ülke? | **Çözüldü:** Esnek — ülke öncelik tanımlamayalım. Hangi lead/talep nereden gelirse o yönde ilerle. |
| ❓ Otomasyon eşiği | AI önerilerinin hangi tutar/güven skoru üstünde manuel onaya çıksın? | **Bekliyor — [09-otomasyon-esikleri.md](./09-otomasyon-esikleri.md) açıldı** |
| ❓ KVKK/GDPR | Hukuki danışmanlık alınacak mı? | **Bekliyor** |
| ✅ vps.md | Plaintext root parolası ne yapılacak? | **Çözüldü:** Dosya kalsın — git'e commit edilmiyor (`.gitignore` korumalı), sadece local notlama. |

→ Bu 7 açık sorunun cevabı olmadan Faz 1 başlamamalı.

## Faz 1 — Veri zenginleştirme (3-4 hafta)

**Hedef:** sonraki fazların ihtiyaç duyduğu meta-veri katmanı kurulur. Görünür değer: yöneticiye yeni dashboard'lar, somut kararlar.

| # | Modül | Süre | Çıktı |
|---|-------|------|-------|
| 1.1 | Müşteri profili tablosu + cron + segmentasyon dashboard | 4-5 gün | "Premium/Düzenli/Tek seferlik/Kayıp" segmentleri görünür |
| 1.2 | Tedarikçi performans tablosu + skor + risk haritası | 4-5 gün | "Tek tedarikçili kritik 12 ürün" listesi, performans badge'i |
| 1.3 | Stok tüketim hızı view + trend dashboard | 3 gün | "Önümüzdeki 7 günde kritik olacak ürünler" panosu |
| 1.4 | Talep havuzu manuel girişle + ürün/müşteri eşleşme | 3-4 gün | "Bekleyen talep listesi" sayfası |

**Bu fazda hiç AI çağrısı yok.** Saf SQL + UI. Faz sonunda sistemde dört yeni rapor var.

## Faz 2 — İlk AI entegrasyonu (2-3 hafta)

**Hedef:** mevcut AI altyapısı (test merkezi) genişletilir; ilk gerçek otomasyon kazançları.

| # | Modül | Süre | Çıktı |
|---|-------|------|-------|
| 2.1 | Email IMAP polling + Talep özeti AI'ı | 4-5 gün | E-mailden gelen talepler `talep_havuzu`'na yapılandırılmış kaydedilir |
| 2.2 | Stok yeniden sipariş öneri motoru (faz A formülü) | 3-4 gün | Günlük cron, "satın alma önerileri" sayfası |
| 2.3 | Üretim önerisi (basit istatistiksel) | 3-4 gün | "Önümüzdeki 30 günün üretim planı taslağı" panosu |
| 2.4 | Geri besleme cron'u (tahmin vs gerçek) | 2 gün | Sapma raporu, 7 gün/30 gün retrospektif |

Faz sonunda: "manuel müdahale olmadan AI 24/7 talep yapılandırıyor + stok sipariş zamanı öneriyor + üretim sıkışık günleri uyarıyor".

## Faz 3 — Keşif motoru (3-5 hafta)

**Hedef:** dış dünyadan veri çekme. Öncelikli **yurt içi**.

| # | Modül | Süre | Çıktı |
|---|-------|------|-------|
| 3.1 | Crawler altyapısı (Crawlee + job queue) — OpenClaw VPS hosted | 4-5 gün | İlk crawler çalışıyor (Google Places örnekleri) |
| 3.2 | Yurt içi lead crawler (TOBB + B2B platformlar) | 5-7 gün | Lead havuzu dolar; gün başına 100-500 yeni firma adayı |
| 3.3 | Lead skorlama + pipeline UI | 3-4 gün | Lead listesi, segment uyumuna göre sıralı |
| 3.4 | Hunter.io email enrichment | 1-2 gün | İletişim email'leri otomatik bulunur |
| 3.5 | Tedarikçi keşif (aynı altyapı, farklı domain ayar) | 3 gün | Alternatif tedarikçi listesi |

**Crawler hosting kararı:** OpenClaw VPS uygun bir aday — Paspas backend yükünü artırmaz, Tailscale'le erişim güvenli. Karar: bu fazda netleşir.

## Faz 4 — Yurt dışı + outreach (3-4 hafta)

| # | Modül | Süre | Çıktı |
|---|-------|------|-------|
| 4.1 | Apollo.io entegrasyonu (yurt dışı) | 2 gün | AB/ABD lead'leri |
| 4.2 | Çok dilli outreach metni AI üretimi | 2-3 gün | Lead'e tek tıkla email taslağı (TR/EN/DE) |
| 4.3 | Email kampanya entegrasyonu (Brevo/Mailgun + opt-out) | 4-5 gün | Toplu/sıralı email akışı, GDPR uyumu |
| 4.4 | LinkedIn manuel araştırma desteği (sayfa parser) | 2-3 gün | Profil URL'inden firma bilgisi çıkarımı |

## Faz 5 — Gelişmiş tahmin (4-6 hafta)

**Sadece veri yeterince birikmişse** (en az 6-12 ay sonra) anlam kazanır.

| # | Modül | Süre | Çıktı |
|---|-------|------|-------|
| 5.1 | Mevsimsellik analizi (ARIMA/Prophet, Python servisi) | 5-7 gün | Aylık tahmin + güven aralığı |
| 5.2 | LLM destekli üretim planı asistanı | 3-5 gün | "Şu hafta için optimal üretim planı" önerisi |
| 5.3 | Anomali tespiti (sapma alarmı) | 3 gün | Beklenmeyen talep/tüketim sıçramalarına bildirim |
| 5.4 | Otomatik kalibrasyon (model retraining) | 5-7 gün | Aylık model güncelleme |

## Faz 6 — Konversasyonel Katman (5-8 hafta) — EN SONA

**Hedef:** dört motor sağlamlaştıktan sonra, **görünür yüz** olarak konuşma arayüzü. [Detaylı tasarım: `07-konversasyonel-katman.md`](./07-konversasyonel-katman.md).

| # | Modül | Süre | Çıktı |
|---|-------|------|-------|
| 6.1 | **Yönetici asistanı v1** (read-only) | 7-10 gün | Admin panel sidebar chat, 5-10 sorgu/rapor tool'u: "Bu hafta hangi makineler boş?", "Ahmet'in son 6 ay siparişleri" |
| 6.2 | **Yönetici asistanı v2** (write + onay UI) | 5-7 gün | "Bu siparişi makineye ata", "Üretim emri aç" — taslak → onay → eylem zinciri |
| 6.3 | **Geri besleme + persona retro** | 3-4 gün | Skor + cron + persona update önerisi |
| 6.4 | **Müşteri portalı v1** (read-only) | 10-14 gün | Public B2B portal + sipariş durum sorgu, fiyat sorgu, sevkiyat takibi |
| 6.5 | **Müşteri portalı v2** (write + onay) | 5-7 gün | Müşteri kendi siparişini açar (taslak → onay → DB) |
| 6.6 | **Saha asistanı (opsiyonel)** | 7-10 gün | Operatör mobil chat: vardiya kaydı, arıza bildirimi |

**Faz 6 kuralları:**
- Onay zinciri yan etkili her aksiyonda zorunlu (taslak → kullanıcı onay → eylem → geri rapor)
- Tool registry whitelist edilmiş; rol bazlı erişim
- Konuşma DB'si Paspas'ta; OpenClaw orchestration için ileriki opsiyon
- Telegram aktive eden yöneticiye **sadece bildirim** (önemli sapma, kritik onay bekleyen) — konuşma değil

## Faz 7 — Genişlemeler (esnek)

- **Whatsapp Business API** entegrasyonu — müşteri tarafı talep girişi otomasyonu
- **CRM** (EspoCRM/Twenty) — ayrı bir CRM kurulumu kararı verildiyse
- **Fiyat takibi** — rakip ürün fiyatlarını otomatik izleme
- **Maliyet ve karlılık analizi** — hangi müşteri/ürün karlı?
- **Sesli mesaj** (STT) — müşteri sesli not gönderirse metne çevir
- **OpenClaw orchestration entegrasyonu** — cron + AI provider proxy katmanı

## Risk panosu

| Risk | Etki | Önlem |
|------|------|-------|
| Crawler yasal sorun (LinkedIn vb.) | Hesap banı, dava | Resmi API'lar + manual research |
| AI'ın yanlış lead/talep eşleşmesi | Spam/yanlış outreach | Düşük guven_skor → manuel kuyruk |
| KVKK ihlali | Para cezası | Hukuki danışmanlık + opt-out altyapısı |
| Veri kalitesi düşük | Tahmin hatalı | Faz 1'de zaman harca, sonraki faza atlama |
| API maliyetleri ölçeklendi | Aylık $$ artışı | Bütçe alarmı, free tier öncelik |
| Geri besleme döngüsü kurulmadı | "Tahmin etmiş gibi yapan" sistem | Her tahmin için sapma kaydı zorunlu |
| Konuşma katmanı erken eklenirse | "Boş eylem fısıldayan maket" | A stratejisi: konuşma EN SON. Faz 6 öncesi 4 motor çalışır olmalı. |
| vps.md plaintext parola | Sızıntı, ele geçirme | Faz 0'da acil temizlik |

## Önerilen ilk hamle

**Faz 0 (1 hafta — açık soruları cevapla) → Faz 1.1 + 1.2 + 1.3 paralel** (3-4 hafta).

Bu, ileriki tüm modüllerin temelini atar ve her birini 1-2 günde bağlamak mümkün hale gelir. Bu fazdan çıkan dashboard'lar zaten yöneticiye değer üretir; AI tarafı eklenmemiş bile olsa.

Sonra:
- **Faz 2.2 (stok yeniden sipariş)** — en hızlı somut tasarruf (stok tükenme + işletme sermayesi)
- **Faz 3.2 (yurt içi lead crawler)** — büyüme tarafında ilk ROI

Faz 4-5-6-7 ileride kararlaştırılır.

## Tahmini toplam süre

| Faz | Süre | Kümülatif |
|-----|------|-----------|
| 0 — Karar | 1 hafta | 1 hafta |
| 1 — Veri | 3-4 hafta | 4-5 hafta |
| 2 — İlk AI | 2-3 hafta | 6-8 hafta |
| 3 — Keşif | 3-5 hafta | 9-13 hafta |
| 4 — Yurt dışı + outreach | 3-4 hafta | 12-17 hafta |
| 5 — Gelişmiş tahmin | 4-6 hafta | 16-23 hafta |
| 6 — Konversasyonel katman | 5-8 hafta | 21-31 hafta |
| **Tam vizyon (Faz 0-6)** | | **~5-8 ay** |
| Faz 7 (esnek) | duruma göre | + 2-4 ay |

**Pragmatik milestone:**
- 1. ay sonunda: yeni dashboard'lar (segment, tedarikçi skor, stok trend)
- 2. ay sonunda: ilk AI otomasyonu (talep email parsing, stok sipariş önerisi)
- 4. ay sonunda: yurt içi keşif motoru çalışıyor
- 6. ay sonunda: yurt dışı + outreach
- 8. ay sonunda: konuşma katmanı (yönetici asistanı)
- 9-10. ay: müşteri portalı

## Sıradaki adım

Faz 0 açık sorularını cevapla. Özellikle:
1. **CRM kararı** (Paspas içinde mi, ayrı mı, hiç mi?)
2. **Email kaynak** (hangi mailbox dinlenecek?)
3. **Bütçe** (aylık $150-300 SaaS uygun mu?)
4. **Yurt dışı odak** (1-2 hedef ülke?)
5. **Otomasyon eşiği** (hangi tutarın altı/üstü onaysız/onaylı?)
6. **vps.md** (parola temizliği — şimdi yap, beklemesin)

Bu 6 cevap geldikten sonra Faz 1.1 (müşteri profili) ile kod başlar.
