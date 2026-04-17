# Frontend + Admin + Backend Çalışma Planı (SEO/Performans Öncelikli)

Bu plan, `/home/orhan/Documents/Projeler/paspas/prime-frontend-nextjs/skills/frontend-prime-nextjs.md` standardına göre revize edilmiştir ve `https://promats.com.tr/index.html` public modül modernizasyonu odağındadır.

## 1) Skill Uyum Kuralları

- Feature bazlı dosya standardı zorunlu:
  - `feature.schema.ts`
  - `feature.service.ts`
  - `feature.type.ts`
  - Opsiyonel: `feature.store.ts`, `components/`, `hooks/`
- TypeScript strict zorunlu, `any` yasak.
- Formlar `React Hook Form + Zod` ile.
- State yönetimi `Zustand` selector odaklı.
- Test: `Vitest + RTL + Playwright`.
- UI: generic değil, kasıtlı tasarım dili ve performans bütçesi.

## 2) Plan Dosyaları

- Excel benzeri takip dosyası:
  - `/home/orhan/Documents/Projeler/paspas/frontend/calisma_plani_frontend_nextjs.csv`
- Excel çıktısı:
  - `/home/orhan/Documents/Projeler/paspas/frontend/calisma_plani_frontend_nextjs.xlsx`

## 3) Public B2B Modül Kapsamı (Güncel)

Temel modüller:

- Kurumsal sayfalar (hakkımızda, kalite, üretim)
- Ürün katalog/list/detail
- İletişim + lokasyon

Eklenen B2B modüller:

- E-katalog merkezi (PDF + online viewer)
- Teklif/RFQ yönetimi (çoklu ürün satırı, dosya ekleme)
- Testimonial ve müşteri başarı hikayeleri
- Referanslar (sektör/ülke/segment filtreli)
- Bayi/distribütör haritası + bayi başvuru
- Numune talep modülü
- Teknik doküman merkezi (TDS/MSDS/montaj/sertifika)
- Brand/kurumsal indirme merkezi
- Sektörel çözümler sayfaları (OEM/filo/bayi)
- Fiyat listesi talep (gated içerik)
- CRM webhook entegrasyonu (lead pipeline)

## 4) SEO ve Performans Öncelikleri

SEO:

- Dynamic metadata + canonical + hreflang
- Sitemap index + modül bazlı sitemap’ler
- JSON-LD: Organization, Product, Breadcrumb, FAQ, Article
- Programatik landing sayfaları (B2B intent odaklı)

Performans:

- LCP < 2.5s
- INP < 200ms
- CLS < 0.1
- API p95 < 300ms
- Görsellerde AVIF/WebP + responsive strategy

## 5) Güvenlik ve Lead Kalitesi

- Formlarda anti-spam (honeypot + rate-limit + opsiyonel recaptcha)
- RBAC + audit + entity timeline
- CSP + XSS/CSRF kontrolleri
- Teklif/bayi/numune süreçlerinde event/log takibi

## 6) Yol Haritası

- Faz 0: Standartlar ve sözleşme
- Faz 1: Backend altyapı ve güvenlik
- Faz 2: Admin panel standardizasyon + eksik ERP modülleri
- Faz 3: Public Next.js + B2B modüller
- Faz 4: SEO sertleştirme
- Faz 5: Performans sertleştirme
- Faz 6: Test ve kalite
- Faz 7: VPS deploy ve operasyon


https://claude.ai/public/artifacts/417fbf08-a6bf-4a5f-9e5f-3a569bc069ba


