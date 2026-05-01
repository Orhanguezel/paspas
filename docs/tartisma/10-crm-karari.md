# 10 — CRM Kararı: Paspas İçi mi, Ayrı CRM mi, Hiç mi?

> **Bağlam (v1.1):** Bu doküman **Faz 3 (Müşteri Keşif)** kapsamında CRM seçenekleri analizini içerir. **Karar: D — Hibrit** (Paspas içi minimum modül + Apollo.io yurt dışı). Müşteri keşif felsefesi: [`02-musteri-kesif.md`](./02-musteri-kesif.md). Bütçe: [`08-saas-butce-analizi.md`](./08-saas-butce-analizi.md).

## Soru

> Lead pipeline yönetimi (yeni müşteri keşif + outreach + dönüşüm) için ne kullanılsın?

## 4 Seçenek

### A) Paspas içi minimum modül (`/admin/lead-pipeline`)

**Ne yapar:** Mevcut Paspas DB'sine `lead_havuzu`, `lead_etkilesim`, `outreach_kampanya` tabloları + admin panelde kanban/liste UI.

| Artı | Eksi |
|------|------|
| Tek doğruluk kaynağı (ERP+CRM aynı DB) | UI fonksiyonu sınırlı (manuel kullanım için) |
| Mevcut auth/yetki ile entegre | Sequence/email kampanya kendi yazılır |
| 0 SaaS maliyeti | Geliştirici zamanı 2-3 hafta |
| Müşteri/sipariş ile direkt JOIN | "CRM" değil "tablo" — satış ekibi standart CRM features bekleyebilir |

**Kapsam:** ~10-15 iş günü. Lead listesi, segment filtre, etkileşim notu, basit follow-up reminder.

### B) Ayrı self-hosted CRM (EspoCRM / Twenty / Krayin)

**Ne yapar:** Bağımsız CRM sunucusu kur, REST API ile Paspas'la senkron.

| CRM | Stack | Lisans | Öne çıkan |
|-----|-------|--------|-----------|
| **EspoCRM** | PHP + MySQL | GPL v3 | En olgun, hafif, REST API, Türkçe destek |
| **Twenty** | TypeScript + GraphQL | AGPL | Modern UX, Notion-vari |
| **Krayin** | Laravel + MySQL | MIT | Modüler, Laravel ekosistemi |
| **SuiteCRM** | PHP + MySQL | AGPL | Salesforce alternatifi (büyük) |
| **Odoo** | Python + PostgreSQL | LGPL community | Tam ERP+CRM, çok geniş |

| Artı | Eksi |
|------|------|
| Hazır UI (sequence, dashboard, takvim) | İki sistem senkron yükü |
| Satış ekibi tanıdık arayüz | Ayrı sunucu/maintenance |
| Email kampanya altyapısı dahil | Veri çift kaynak riski |
| Ücretsiz | Geliştirici zamanı 4-8 hafta (entegrasyon) |

**Önerilen:** EspoCRM (kurulum kolay, REST iyi) veya Twenty (modern stack).

### C) Apollo.io UI'sı (sıfır kod)

**Ne yapar:** Lead keşfi + email + sequence Apollo'da; Paspas'ta sadece "müşteriye dönüşen" lead'ler kayıt.

| Artı | Eksi |
|------|------|
| Sıfır geliştirme zamanı | Aylık abonelik ($59-99/ay) |
| Profesyonel CRM features | Apollo'ya bağımlı |
| Lead keşfi + outreach + sequence aynı yerde | Veri Apollo'da kalır (export sınırlı) |
| 1 günde başlanır | TR sektör verisi zayıf (yurt dışı için iyi) |

### D) Hibrit — Paspas içi minimum + Apollo.io UI

**Ne yapar:** Yurt içi lead → Paspas içi modül (TR verisi orada). Yurt dışı outreach → Apollo.io. Müşteriye dönüştürünce Paspas'a sync.

| Artı | Eksi |
|------|------|
| Her bağlam için en uygun araç | İki ayrı UI'da çalışmak |
| Geliştirme: yarısı (~1-2 hafta) | Apollo $59-99/ay yine var |
| Yurt dışı için profesyonel sequence | Senkronizasyon kuralı yazılmalı |

## Karşılaştırma matrisi

| Kriter | A (içi) | B (ayrı CRM) | C (Apollo) | D (hibrit) |
|--------|---------|--------------|------------|------------|
| Geliştirme süresi | 2-3 hafta | 4-8 hafta | 0 gün | 1-2 hafta |
| Aylık maliyet | $0 | $0 (self-host) + sunucu | $59-99 | $59-99 |
| UI kalitesi | Orta | Yüksek | Çok yüksek | Yüksek/Çok yüksek |
| TR yurt içi uyumu | Çok iyi | İyi | Zayıf | Çok iyi |
| Yurt dışı outreach | Zayıf | İyi | Çok iyi | Çok iyi |
| Senkronizasyon yükü | Yok | Yüksek | Düşük | Orta |
| Vendor lock-in | Yok | Yok | Yüksek | Orta |
| Ekosistem (sequence, dialer) | Yok (kendin yaz) | Var | Var | Karma |

## Önerim

**D — Hibrit.** Aşağıdaki gerekçelerle:

1. Yurt içi lead için **TR sektör verisi** (TOBB, sanayim.net) Apollo'da yok → Paspas içi tutmalı
2. Yurt dışı outreach için **profesyonel sequence + GDPR uyumlu** ortam = Apollo (yeniden yazmaya değmez)
3. Geliştirme yükü ortalama (~1-2 hafta), B'nin yarısı kadar
4. Apollo'dan vazgeçmek istersek Paspas içi modül zaten var → riski düşük
5. Yurt dışı tarafı esnek olduğu için (kullanıcı kararı) Apollo aboneliği gerçekten ihtiyaç doğunca aktive edilir; ilk başta C'siz başlanabilir, gerekirse eklenir

**Kademeli yaklaşım:**
- Faz 3: Paspas içi minimum modül + lokal crawler → yurt içi başlar
- Faz 4: İhtiyaç çıkarsa Apollo Free tier başla → büyürse Apollo Basic $59/ay

## Karar matrisinin özeti

| Eğer öncelik... | O zaman seç |
|-----------------|-------------|
| Tek doğruluk kaynağı + minimum maliyet | A |
| Profesyonel CRM features + ekip rahatlığı | B |
| Sıfır geliştirme + hemen başlamak | C |
| Yurt içi+dışı dengesi + esneklik | **D** ✅ |

## Açık karar noktaları

1. A/B/C/D'den hangisi onaylanır?
2. D seçilirse: Apollo aktif edilme zamanı **şimdi mi** (Faz 3'te) yoksa **Faz 4'e** mi bırakılsın?
3. Eğer ileride B'ye geçilmek istenirse hangi CRM (EspoCRM mi Twenty mi)?
4. Sequence/email kampanya altyapısı kim tarafından yazılsın (D'de)? Paspas mı Apollo mu yoksa Brevo gibi ayrı bir tool mu?
