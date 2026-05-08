# SatisAI — Mimari ve Yol Haritasi

**Tarih:** 2026-05-02
**Durum:** Planlama
**Sahibi:** Orhan
**Mimari Sorumlu:** Claude Code

---

## 1. Vizyon

Turk pazaryerlerinde (Sahibinden basta olmak uzere) ilan veren profesyonel saticilar icin AI destekli ilan optimizasyon SaaS'i. Kullanici urun bilgisini ve fotograflarini girer, SatisAI Sahibinden algoritmasina optimize baslik, satis odakli aciklama ve anahtar kelime uretir. Toplu mod ve multi-platform cikti ile manuel yazma zamanini %90 azaltir.

**Tek cumlede:** *"Galericinin 50 ilani 1 saatte yazan, emlakcinin portfoyunu Sahibinden + Hepsiemlak + Emlakjet'e paralel hazirlayan AI editorudur."*

---

## 2. Hedef Kitle ve Segmentler

### Birincil (Faz 1 hedefi)

1. **Galericiler** — 30-200 araclik oto galerileri. Sahibinden'e zaten 5K-50K TL/ay Doping odeniyor, AI araci icin 500-1500 TL/ay rahat oder.
2. **Emlakcilar** — 20-100 portfoylu emlak ofisleri. Multi-platform cikti onlar icin kritik (Hepsiemlak, Emlakjet, Zingat'a ayni ilani 4 kez yazmak yerine 1 kez).

### Ikincil (Faz 2 hedefi)

3. **Yedek parca / 2.el / antika saticilari** — Surekli stok degisimi olan kurumsal saticilar.
4. **Bireysel power user** — Yilda 5-10 ilan veren kullanici (entry plan).

### Hedef DISI

- Yilda 1 ilan veren bireysel satici → SaaS'a odeme yapmaz.
- Sahibinden tarafindan banlanma riski olan agresif otomasyon kullanicisi.

---

## 3. Sahibinden Kategori Haritasi

### Faz 1 MVP — 3 Kategori

| Kategori | Alt Kategoriler | Ozel Alanlar |
|----------|-----------------|--------------|
| **Vasita** | Otomobil, Arazi/SUV, Ticari, Motosiklet | Marka, model, yil, km, hasar, yakit, vites, renk, ek ozellikler |
| **Emlak** | Konut Satilik, Konut Kiralik, Isyeri, Arsa | Mahalle, m2 (brut/net), oda, banyo, kat, isitma, esya |
| **Ikinci El** | Bilgisayar, Telefon, Beyaz Esya, Mobilya | Marka, model, yas, kullanim durumu, garanti |

### Faz 2 Genisleme

| Kategori | Notlar |
|----------|--------|
| Yedek Parca | OEM kod tanima, uyumlu modeller |
| Is Makineleri | Operatorlu kiralama vs satis |
| Hayvanlar Alemi | Kedi/kopek/kus, irk bilgisi |
| Hizmetler | Tasimacilik, tadilat, ozel ders |

### Faz 3 (opsiyonel)

- Tekne, Karavan, Devre Mulk
- Is Ilanlari (farkli prompt mantigi)

---

## 4. Mimari

### Stack

```
Frontend:  Next.js 16 (App Router), React 19, TypeScript strict
           Tailwind CSS v4, Shadcn UI, Radix UI
           Zustand (state), TanStack Query (server state)
           next-intl (TR birincil, EN ikincil)
           Framer Motion (animasyon)

Backend:   Fastify, Bun runtime
           Drizzle ORM, MySQL 8
           JWT auth (kendi implementasyon, packages/auth reuse)
           Swagger/OpenAPI dokuman
           Bull/BullMQ (toplu islem kuyrugu)
           Redis (cache, rate limit, queue)

AI:        Claude Sonnet 4.6 (birincil — Turkce kalitesi superior)
           Claude Haiku 4.5 (kucuk islemler, ucuz)
           Claude Vision (foto analizi, Faz 3)
           Prompt cache aktif (kategori prompt'lari sabit)

Foto:      Cloudinary (mevcut hesap reuse)
Odeme:     iyzico (TR yerel kart) + Stripe (kurumsal/yabanci kart)
Mail:      Nodemailer + SMTP (SES ya da Brevo)
Scraper:   scraper-service (mevcut mikroservis) - pazar fiyat verisi icin
Deploy:    Docker + PM2 + Nginx, VPS (guezelwebdesign 72.61.93.212)
```

### Repo Yapisi

```
satisai/
├── frontend/                 # Next.js 16 SaaS UI
│   ├── app/
│   │   ├── (auth)/           # giris, kayit, sifremi unuttum
│   │   ├── (dashboard)/      # ilan uretim, gecmis, raporlar
│   │   ├── (admin)/          # kurumsal yonetim
│   │   └── (marketing)/      # landing, fiyatlandirma
│   ├── components/
│   ├── lib/
│   └── messages/             # next-intl: tr.json, en.json
├── backend/                  # Fastify API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── billing/
│   │   │   ├── generation/   # AI uretim core
│   │   │   ├── batch/        # toplu islem
│   │   │   ├── categories/
│   │   │   └── analytics/
│   │   ├── db/
│   │   │   ├── schema/       # Drizzle semalari
│   │   │   └── seed/sql/     # CREATE TABLE seed dosyalari
│   │   ├── ai/
│   │   │   ├── prompts/      # kategori-spesifik prompt'lar
│   │   │   └── client.ts     # Claude SDK wrapper
│   │   └── server.ts
│   └── package.json
├── shared/                   # tip paylasimi (opsiyonel)
├── docs/
│   ├── PLAN.md               # bu dosya
│   ├── PROMPT_LIBRARY.md     # kategori prompt'lari (Faz 1)
│   └── API.md                # endpoint dokuman
├── docker-compose.yml
├── ecosystem.config.js       # PM2
└── project.portfolio.json
```

---

## 5. DB Schema (Drizzle Taslak)

> CLAUDE.md kurali: ALTER TABLE yasak. Tum schema degisiklikleri `src/db/seed/sql/0XX_*_schema.sql` dosyalarinda yapilir, `db:seed:fresh` ile sifirdan kurulur.

### Tablolar

```typescript
// users — temel kullanici
{ id, email (unique), password_hash, first_name, last_name,
  role: 'owner' | 'member' | 'admin',
  team_id (nullable), email_verified, last_login_at,
  created_at, updated_at }

// teams — galeri/emlak ofisi multi-user
{ id, owner_id, name, max_members, plan_id,
  created_at, updated_at }

// team_invitations — uye davetleri
{ id, team_id, inviter_id, email, token (unique),
  status: 'pending' | 'accepted' | 'expired',
  expires_at, created_at }

// plans — abonelik planlari
{ id, slug, name, price_try, price_eur,
  monthly_credits, max_team_members,
  features (json), is_active }

// subscriptions — aktif abonelikler
{ id, user_id, team_id, plan_id,
  iyzico_subscription_id, stripe_subscription_id,
  status, current_period_end, cancel_at_period_end,
  created_at, updated_at }

// credits_ledger — kredi kullanim defter
{ id, user_id, team_id, amount, balance_after,
  reason: 'purchase' | 'consume' | 'refund' | 'gift',
  reference_id (generation_id), created_at }

// categories — Sahibinden kategori agaci
{ id, parent_id, slug, name_tr, name_en,
  prompt_template_id, fields_schema (json),
  is_active, display_order }

// prompt_templates — versiyonlu prompt'lar
{ id, category_id, version, system_prompt, user_prompt,
  example_input (json), example_output (json),
  model: 'claude-sonnet-4-6' | 'claude-haiku-4-5',
  is_active, created_at }

// generations — her AI uretim kaydi
{ id, user_id, team_id, category_id, prompt_template_id,
  input_data (json), output_title, output_description,
  output_tags (json), output_keywords,
  photos (json - cloudinary url + analysis),
  credits_consumed, model_used,
  input_tokens, output_tokens, cost_usd,
  status: 'pending' | 'success' | 'failed',
  error_message, created_at }

// batch_jobs — toplu uretim isleri
{ id, user_id, team_id, source_file_url,
  total_items, processed_items, failed_items,
  status: 'queued' | 'processing' | 'completed' | 'failed',
  result_file_url, started_at, completed_at, created_at }

// market_prices — scraper-service'ten cekilen fiyat verisi
{ id, category_id, query_hash, source: 'sahibinden' | 'arabam' | ...,
  data (json), fetched_at, expires_at }

// analytics_events — kullanim olaylari
{ id, user_id, event_type, event_data (json), created_at }

// audit_logs — guvenlik/admin
{ id, user_id, action, target_type, target_id,
  ip_address, user_agent, created_at }
```

### Index Stratejisi

- `users.email` UNIQUE
- `generations.user_id, created_at` (kullanici geçmişi)
- `credits_ledger.user_id, created_at` (bakiye hesabı)
- `market_prices.query_hash, source` UNIQUE
- `subscriptions.iyzico_subscription_id` UNIQUE

---

## 6. API Endpoints (Fastify)

### Auth Modulu
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email
```

### Generation Modulu (KARI YERINDE)
```
GET    /api/categories                    # kategori agaci
GET    /api/categories/:slug              # kategori detay + form schema
POST   /api/generations                   # tek ilan uretim (kredi tuketir)
GET    /api/generations                   # gecmis liste (sayfali)
GET    /api/generations/:id               # detay
POST   /api/generations/:id/regenerate    # tekrar ureti (kredi tuketir)
DELETE /api/generations/:id               # gecmisten sil
```

### Batch Modulu
```
POST   /api/batch/upload                  # Excel/CSV yukleme, validasyon
POST   /api/batch/:id/start               # kuyruga at, ureti basla
GET    /api/batch/:id                     # ilerleme durumu
GET    /api/batch/:id/download            # tamamlanan dosyayi indir
DELETE /api/batch/:id                     # iptal
```

### Billing Modulu
```
GET    /api/plans
POST   /api/billing/checkout              # iyzico/Stripe checkout
POST   /api/billing/webhook/iyzico        # webhook
POST   /api/billing/webhook/stripe        # webhook
GET    /api/billing/subscription          # mevcut abonelik
POST   /api/billing/cancel
GET    /api/billing/credits               # bakiye + ledger
```

### Team Modulu
```
GET    /api/teams/me
POST   /api/teams                         # takim olustur
POST   /api/teams/invite
POST   /api/teams/accept-invite
DELETE /api/teams/members/:id
```

### Market Data (Faz 3)
```
GET    /api/market/prices?category=...&query=...
       # scraper-service'e proxy, cache'li
```

### Admin
```
GET    /api/admin/users
GET    /api/admin/generations
GET    /api/admin/analytics
POST   /api/admin/prompts                 # prompt versiyonlama
```

---

## 7. AI Stratejisi

### Model Secimi

| Use Case | Model | Sebep |
|----------|-------|-------|
| Tek ilan uretimi (Vasita, Emlak) | **Claude Sonnet 4.6** | Turkce yazi kalitesi, satis dili, anahtar kelime mantigi |
| Toplu ilan uretimi | **Claude Sonnet 4.6** | Tutarlilik kritik |
| Foto analizi (Faz 3) | **Claude Sonnet 4.6 Vision** | Hasar tespiti, ic mekan durumu |
| Anahtar kelime onerisi (kucuk) | **Claude Haiku 4.5** | Hizli, ucuz |
| Pazar fiyat ozeti | **Claude Haiku 4.5** | Basit ozet yeterli |

**OpenAI / Gemini kullanmiyoruz.** Turkce kalitesi Claude'da belirgin sekilde ustun.

### Prompt Cache

- Sistem prompt'lari (kategori sablonlari) sabit → cache'lenecek
- Cache hit rate hedef %80+ → maliyet 10x dusuk
- Anthropic SDK `cache_control` ile uygulanir

### Prompt Yapisi (Vasita Ornegi)

```
SYSTEM:
Sen Sahibinden.com icin Turkiye pazarinda profesyonel galericilere
hizmet veren bir AI ilan editorusun. Gorevin: verilen arac bilgisine
gore Sahibinden algoritmasina optimize baslik, aciklama ve etiket uret.

KURALLAR:
- Sadece verilen bilgiyi kullan, ozellik UYDURMA
- Hasar/boya bilgisi verilmediyse "belirtilmemis" olarak isaretle
- Baslik max 70 karakter, anahtar kelime yogun
- Aciklama 200-400 kelime, paragrafli, satis odakli ama abartisiz
- 13 anahtar kelime, biri marka+model, biri yıl, biri sehir
- Yasal: "kazasiz" gibi iddialari sadece kullanici belirttiyse yaz

USER:
Marka: {{brand}}
Model: {{model}}
Yil: {{year}}
Km: {{mileage}}
Hasar: {{damage_status}}
Renk: {{color}}
Yakit: {{fuel}}
Vites: {{transmission}}
Ek ozellikler: {{features}}
Sehir: {{city}}
Ek not: {{notes}}

CIKTI FORMATI: JSON
{
  "title": "...",
  "description": "...",
  "tags": ["...", "..."],
  "keywords": ["...", "..."],
  "warnings": ["..."]   // eksik bilgi uyarilari
}
```

### Prompt Versiyonlama

- Her kategori prompt'u DB'de versiyonlu
- A/B testi mumkun (v1 vs v2 metric karsilastirmasi)
- Admin paneli ile prompt guncellenebilir, deploy gerekmez

### Maliyet Hesabi

- Sonnet 4.6: ~$3 / M input, $15 / M output
- Bir ilan ortalama: 1500 input + 800 output token
- = $0.0045 + $0.012 = **$0.0165 / ilan = ~0.55 TL** (kur 33)
- Pro plan: 499 TL / 200 ilan = 2.5 TL/ilan satis fiyati
- **Brut margin: %78** (cache devreye girince %85+)

---

## 8. Frontend Sayfalari

### Marketing
- `/` — landing (galerici/emlakci ozelinde 2 hero varyasyon)
- `/fiyatlandirma`
- `/blog/*` — Sahibinden ipuclari (SEO)
- `/iletisim`

### Auth
- `/giris`, `/kayit`, `/sifre-sifirla`

### Dashboard
- `/dashboard` — ozet (kalan kredi, bu ay uretilen, son 5)
- `/uret` — yeni ilan uretim formu (kategori seçim → form → cikti)
- `/toplu` — Excel/CSV yukleme + sonuc tablosu
- `/gecmis` — uretilen ilanlar liste, arama, filtre
- `/raporlar` — kategori bazli kullanim, kredi tuketim grafigi

### Hesap
- `/hesap/profil`
- `/hesap/abonelik` — plan, fatura, kredi gecmisi
- `/hesap/takim` — uye davet, rol yonetimi
- `/hesap/api-keys` (Faz 3 kurumsal)

---

## 9. Faz Plani

### Faz 1 — MVP (5-7 hafta) — TEK ILAN URETIM

**Hafta 1-2: Temel iskelet**
- [ ] Repo + git init + `project.portfolio.json`
- [ ] Backend: Fastify + Drizzle + MySQL kurulum, auth modulu
- [ ] Frontend: Next.js 16 + Tailwind v4 + Shadcn kurulum, marketing layout
- [ ] DB schema: `users`, `teams`, `plans`, `subscriptions`, `credits_ledger`
- [ ] Seed: 3 plan (Trial, Bireysel, Galeri/Emlakci, Kurumsal)

**Hafta 3-4: AI uretim core**
- [ ] Anthropic SDK wrapper + prompt cache
- [ ] Vasita prompt'u (v1) + Emlak prompt'u (v1) + Ikinci El prompt'u (v1)
- [ ] `/api/generations` endpoint + kredi tuketim mantigi
- [ ] Frontend: kategori seçim ekrani + dinamik form
- [ ] Frontend: cikti gosterim + "Sahibinden'e Kopyala" butonu

**Hafta 5: Odeme + abonelik**
- [ ] iyzico entegrasyonu (TR kart)
- [ ] Stripe entegrasyonu (yabanci/kurumsal kart)
- [ ] Webhook handler + abonelik yenileme
- [ ] Frontend: fiyatlandirma sayfasi + checkout akisi

**Hafta 6: Hesap + Gecmis**
- [ ] `/gecmis` sayfasi + filtre
- [ ] Email dogrulama + sifre sifirlama
- [ ] Hesap ayarlari + abonelik yonetimi

**Hafta 7: Cila + Beta deploy**
- [ ] Landing sayfasi son hali
- [ ] Docker + Nginx + PM2 production config
- [ ] VPS deploy (guezelwebdesign), domain bagla
- [ ] 5-10 beta kullanici (galerici + emlakci tanidiklarindan)

**Faz 1 Cikti:** Tek ilan uretebilen, abonelik alinabilen calisir SaaS.

### Faz 2 — Toplu Mod + Multi-Platform (3-4 hafta)

- [ ] Excel/CSV import + validation + preview
- [ ] BullMQ kuyruk + worker (toplu ureti)
- [ ] Sonuc Excel/CSV export
- [ ] Frontend: tablo bazli editor (TanStack Table)
- [ ] Multi-platform output: Sahibinden + Arabam + Hepsiemlak + Emlakjet template'leri
- [ ] Takim ozelligi: uye davet, rol yonetimi

**Faz 2 Cikti:** Galerici 50 araci 10 dakikada hazirlayabiliyor. Emlakci 1 ilani 4 platform icin uretiyor.

### Faz 3 — Vision + Pazar Verisi (4-5 hafta)

- [ ] Cloudinary entegrasyonu + foto upload
- [ ] Claude Vision: oto hasar/boya tespiti, emlak ic mekan durumu
- [ ] scraper-service entegrasyonu: pazar fiyat verisi
- [ ] Fiyat onerisi modulu (kategori + ozelliklere gore)
- [ ] Yedek parca kategorisi + Is makineleri kategorisi

**Faz 3 Cikti:** Foto yukle, AI fotodan ozellik tespit etsin + onerilen fiyat versin.

### Faz 4 — Chrome Extension (3 hafta, opsiyonel)

- [ ] Sahibinden ilan formuna otomatik dolduran extension
- [ ] **TOS riskli** — once hukuki danismanlik al

---

## 10. Fiyatlandirma

| Plan | Fiyat (TL/ay) | Kredi | Hedef Kitle | Ozellikler |
|------|---------------|-------|-------------|------------|
| **Trial** | 0 | 5 | Yeni kullanici | 7 gun, tum kategoriler |
| **Bireysel** | 149 | 30 | Power user | Tum kategoriler, gecmis |
| **Galeri/Emlakci Pro** | 499 | 200 | Profesyonel | + Toplu mod, multi-platform, 3 takim uyesi |
| **Kurumsal** | 1499 | Sinirsiz* | Buyuk ofis | + 10 takim uyesi, foto analizi, oncelik destek |
| **Enterprise** | Ozel | Ozel | Zincir galeri | + API, ozel prompt egitimi, ozel SLA |

*Sinirsiz = fair use 1500/ay sonra ek kredi 1 TL.

### Yillik Indirim
- 2 ay bedava (10 ay fiyatina 12 ay)

### TL/EUR Fiyatlandirma
- Faz 1: sadece TL (iyzico)
- Faz 2: EUR (Stripe) eklenir, AB pazari hedeflemez ama kurumsal saticilar icin

---

## 11. Riskler ve Onlemler

| Risk | Olasilik | Etki | Onlem |
|------|----------|------|-------|
| Sahibinden TOS ihlali iddiasi | Dusuk | Orta | MVP'de otomasyon yok, sadece copy-paste. Hukuki danismanligi Faz 4 oncesi al. |
| AI hallucination (uydurma ozellik) | Orta | Yuksek | Prompt'ta katı kural + post-process kontrol + warnings field |
| "ChatGPT'den kendim yapariz" itirazi | Yuksek | Orta | Differentiation: Sahibinden-spesifik prompt + toplu mod + pazar verisi + Turkce kalite |
| iyzico abonelik webhook sorunlari | Orta | Yuksek | Webhook idempotent, retry mekanizmasi, gunluk reconciliation cron |
| Beta kullanici bulamama | Orta | Yuksek | Galerici/emlakci tanidiklarinla once konus, MVP'den once 10 saticidan ihtiyac onayi al |
| Claude API kotasi | Dusuk | Orta | Tier upgrade, fallback prompt + Haiku |
| Maliyet patlamasi | Dusuk | Orta | Prompt cache + token monitoring + plan basi hard cap |

---

## 12. Bagimliliklar (Ekosistem Reuse)

- **scraper-service** (mevcut) — Faz 3'te pazar fiyat verisi icin
- **packages/auth** (Kaman ekosistem) — JWT auth reuse
- **Cloudinary** (mevcut hesap)
- **iyzico hesabi** — Kamanilan'da var, satisai icin yeni magaza acilacak
- **VPS guezelwebdesign** — backend + frontend deploy

---

## 13. Sonraki Adim

1. **Onay:** Bu plani okuyup eklemek/cikarmak istedigin var mi soyle.
2. **Pazar dogrulama (KRITIK):** MVP'ye baslamadan **5-10 galerici/emlakci ile konus**, "boyle bir araci kullanir miydiniz, ayda kac TL oderdiniz" diye sor. Bu adim atlanirsa 7 hafta cope.
3. **Domain ve marka:** `satisai.com`, `satisai.com.tr`, `satisai.io` musait mi kontrol. Marka degisirse dosyalar guncellenir.
4. **Implementasyon:** Onayladiktan sonra `backend-architect` agent'i ile detayli DB schema + API contract uretimi, `frontend-master` agent'i ile UI wireframe + component plani.
5. **Git init + ilk commit** — repo aktif gelistirmeye girer girmez.

---

## Ek: Karar Notlari

- **Neden Express degil Fastify?** Senin tum stack'in Fastify, ekosistem tutarliligi.
- **Neden Prisma degil Drizzle?** Senin standardin, type-safe, daha hizli, raw SQL yakin.
- **Neden Postgres degil MySQL?** Senin tum projelerin MySQL, ortak DB sunucusu reuse.
- **Neden OpenAI degil Claude?** Turkce yazi kalitesi karsilastirildiginda Claude Sonnet 4.6 belirgin ustun (ozellikle satis dili, mahalli ifade).
- **Neden iyzico zorunlu?** TR kullanicisi yabanci kart cekiminden cekinir, iyzico guvenilir kabul.
- **Neden Sahibinden API yok diye stres yapmiyoruz?** Cunku rakipler de yapmiyor; copy-paste workflow pazarda kabul gormus.
