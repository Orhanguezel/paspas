# Bayi (Dealer) Portal - Uygulama Plani

## Ozet

Paspas ERP'ye bayi girisi ve bayi islemleri ekleniyor. Bayiler (distributoerler) kendi portallari uzerinden urun katalogu gorebilecek, siparis olusturabilecek ve sevkiyat takibi yapabilecek.

**Temel Kararlar:**
- Bayi paneli: `frontend/` dizininde ayri Next.js 16 projesi
- Bayi = musteriler tablosunda `tur='bayi'` kaydi, `user_id` ile users'a bagli
- Yetkiler: Urun katalogu, siparis olusturma, siparis/sevkiyat takibi

---

## Faz 1: Veritabani Degisiklikleri

### 1A. `bayi` rolunu ENUM'a ekle

**Dosya:** `backend/src/db/seed/sql/141_v1_bayi_role_enum.sql`

```sql
ALTER TABLE `user_roles`
  MODIFY COLUMN `role`
  ENUM('admin','sevkiyatci','operator','satin_almaci','bayi','moderator','seller','user')
  NOT NULL DEFAULT 'operator';
```

**Drizzle:** `backend/src/modules/userRoles/schema.ts` — `ERP_ROLE_VALUES`'a `'bayi'` ekle

### 1B. `musteriler` tablosuna `user_id` ekle

**Dosya:** `backend/src/db/seed/sql/142_v1_musteriler_user_id.sql`

```sql
ALTER TABLE `musteriler`
  ADD COLUMN `user_id` CHAR(36) DEFAULT NULL AFTER `tur`,
  ADD UNIQUE KEY `uq_musteriler_user_id` (`user_id`),
  ADD CONSTRAINT `fk_musteriler_user_id` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

**Drizzle:** `backend/src/modules/musteriler/schema.ts` — `user_id` kolonu + rowToDto guncelle

### 1C. Demo bayi seed

**Dosya:** `backend/src/db/seed/sql/143_v1_bayi_demo_seed.sql`

- Demo bayi user: `bayi@paspas.com`
- `bayi` rolu atanir
- musteriler'de `tur='bayi'`, `user_id` baglantili kayit olusturulur

---

## Faz 2: Backend — Rol Sistemi + Bayi Modulu

### 2A. Rol sistemi guncellemeleri

| Dosya | Degisiklik |
|-------|-----------|
| `backend/src/modules/userRoles/schema.ts` | `ERP_ROLE_VALUES`'a `'bayi'` ekle |
| `backend/src/modules/userRoles/service.ts` | `RoleName` type'a `'bayi'` ekle, `LEGACY_ROLE_MAP`'e bayi→bayi, `ROLE_WEIGHT`'e bayi=0 |
| `backend/src/common/middleware/roles.ts` | `AppRole` type'a `'bayi'` ekle, `LEGACY_TO_ERP_ROLE`'e bayi→bayi |
| `backend/src/modules/auth/controller.ts` | `Role` type'a `'bayi'` ekle |

### 2B. Bayi middleware

**Yeni dosya:** `backend/src/common/middleware/bayi.ts`

Isleyis:
1. JWT dogrula (requireAuth)
2. `role === 'bayi'` kontrol et
3. `musteriler` tablosundan `user_id = req.user.sub` ile musteri_id bul
4. `req.bayiMusteriId` olarak request'e ekle
5. Bayi degilse veya musteri baglantisi yoksa 403

### 2C. Bayi backend modulu

**Yeni dizin:** `backend/src/modules/bayi/`

| Dosya | Icerik |
|-------|--------|
| `validation.ts` | katalogListQuery, siparisListQuery, siparisCreateSchema, profilPatchSchema |
| `repository.ts` | Katalog (sadece public alanlar), siparis CRUD (musteri_id filtreli), sevkiyat listesi |
| `controller.ts` | 7 handler: getProfile, updateProfile, listKatalog, listSiparislerim, getSiparis, createSiparis, listSevkiyat |
| `router.ts` | `/bayi/*` route kaydi, `preHandler: requireBayi` |

### 2D. Route kaydi

**Degisecek:** `backend/src/app.ts` — public route bolumune `registerBayi(api)` ekle

> ONEMLI: `/api/bayi/*` route'lari `/api/admin/*` disinda, kendi `requireBayi` guard'i ile.

### Bayi API Endpointleri

| Method | Route | Aciklama |
|--------|-------|----------|
| GET | `/bayi/profile` | Bayi musteri profili |
| PATCH | `/bayi/profile` | Iletisim bilgisi guncelle (telefon, adres, ilgili kisi, sevkiyat notu) |
| GET | `/bayi/katalog` | Urun katalogu (aktif urunler, stok/maliyet gizli) |
| GET | `/bayi/siparislerim` | Kendi siparisleri listesi |
| GET | `/bayi/siparislerim/:id` | Siparis detay + kalemler |
| POST | `/bayi/siparislerim` | Yeni siparis olustur (musteri_id otomatik, durum=taslak, BY- prefix) |
| GET | `/bayi/sevkiyat` | Sevkiyat takibi (kendi siparisleriyle ilgili) |

---

## Faz 3: Frontend — Bayi Portali (Yeni Next.js Projesi)

### 3A. Proje iskeleti

`frontend/` dizininde Next.js 16 + React 19 + Tailwind 4 + RTK Query + Shadcn/UI projesi.

**Tech Stack:**
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Redux Toolkit + RTK Query
- Shadcn/UI + Radix UI
- React Hook Form + Zod
- Lucide React (icons)
- Biome (linting)
- Bun (runtime)

### 3B. Dizin Yapisi

```
frontend/
├── package.json
├── tsconfig.json
├── next.config.ts
├── biome.json
├── .env.local.example          # NEXT_PUBLIC_API_URL=http://localhost:8084/api
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout + StoreProvider
│   │   ├── globals.css         # Tema tokenlari
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx    # Bayi giris sayfasi
│   │   └── (portal)/
│   │       ├── layout.tsx      # Portal layout (sidebar/navbar + auth guard)
│   │       ├── page.tsx        # Dashboard
│   │       ├── katalog/
│   │       │   └── page.tsx    # Urun katalogu
│   │       ├── siparislerim/
│   │       │   ├── page.tsx    # Siparis listesi
│   │       │   ├── yeni/
│   │       │   │   └── page.tsx  # Yeni siparis formu
│   │       │   └── [id]/
│   │       │       └── page.tsx  # Siparis detay
│   │       ├── sevkiyat/
│   │       │   └── page.tsx    # Sevkiyat takibi
│   │       └── profil/
│   │           └── page.tsx    # Profil duzenle
│   ├── components/
│   │   └── ui/                 # Shadcn (admin_panel'den kopyala)
│   ├── integrations/
│   │   ├── baseApi.ts          # RTK Query base (admin_panel pattern)
│   │   ├── apiBase.ts          # API URL cozumlemesi
│   │   ├── core/
│   │   │   └── token.ts        # Token store
│   │   ├── tags.ts             # BayiKatalog, BayiSiparis, BayiProfil
│   │   └── endpoints/
│   │       ├── auth.endpoints.ts     # Login/status/refresh
│   │       ├── katalog.endpoints.ts  # GET /bayi/katalog
│   │       ├── siparis.endpoints.ts  # CRUD /bayi/siparislerim
│   │       ├── sevkiyat.endpoints.ts # GET /bayi/sevkiyat
│   │       └── profil.endpoints.ts   # GET/PATCH /bayi/profile
│   ├── stores/
│   │   ├── index.ts            # Store configuration
│   │   ├── makeStore.ts
│   │   ├── hooks.ts            # useAppDispatch, useAppSelector
│   │   └── Provider.tsx        # StoreProvider
│   ├── lib/
│   │   └── utils.ts            # cn() utility
│   └── middleware.ts           # Next.js middleware: auth redirect
```

### 3C. Admin Panel'den Kopyalanacak Altyapi

| Kaynak | Hedef | Not |
|--------|-------|-----|
| `admin_panel/src/components/ui/` | `frontend/src/components/ui/` | Tum Shadcn bilesenleri |
| `admin_panel/src/lib/utils.ts` | `frontend/src/lib/utils.ts` | cn() utility |
| `admin_panel/src/integrations/baseApi.ts` | `frontend/src/integrations/baseApi.ts` | Login redirect `/login` olarak degistir |
| `admin_panel/src/integrations/apiBase.ts` | `frontend/src/integrations/apiBase.ts` | Ayni |
| `admin_panel/src/integrations/core/` | `frontend/src/integrations/core/` | Token store |
| `admin_panel/src/stores/` | `frontend/src/stores/` | Redux store factory |
| `admin_panel/src/app/globals.css` | `frontend/src/app/globals.css` | Sadelestir |

### 3D. Sayfa Detaylari

| Sayfa | Route | Aciklama |
|-------|-------|----------|
| Login | `/login` | Email + sifre, `POST /auth/token`, rol=bayi kontrolu |
| Dashboard | `/` | Ozet kartlar: aktif siparis, son sevkiyat, son siparisler widget |
| Katalog | `/katalog` | Urun grid/liste, arama + kategori filtre, resim/ad/kod/fiyat |
| Siparislerim | `/siparislerim` | Tablo: siparis no, tarih, termin, durum badge, kalem sayisi |
| Siparis Detay | `/siparislerim/[id]` | Baslik + kalem tablosu + sevk durumu |
| Yeni Siparis | `/siparislerim/yeni` | Urun sec + miktar + fiyat satirlari, RHF + Zod |
| Sevkiyat | `/sevkiyat` | Sevkiyat listesi: sevk no, tarih, urun, miktar |
| Profil | `/profil` | Duzenleme: ilgili kisi, telefon, adres. Readonly: kod, iskonto |

### 3E. Auth Akisi

1. Bayi `/login` sayfasindan `POST /api/auth/token` cagirir
2. Donus: `{ access_token, user: { role: 'bayi' } }`
3. `role !== 'bayi'` ise "Erisim Engellendi" goster
4. Token cookie'ye + tokenStore'a kaydedilir
5. Next.js middleware: cookie yoksa `/login`'e redirect
6. 401 gelirse refresh token dene (admin_panel ile ayni mantik)

---

## Faz 4: Admin Panel — Bayi Yonetimi (Sonraki adim)

- Musteriler modulune `tur='bayi'` filtresi ekleme
- Bayi olusturma formu: user + bayi rolu + musteriler kaydi tek islemde
- Bayi'nin bagli user bilgisini gosterme

---

## Tasarim Kararlari

| Karar | Gerekce |
|-------|---------|
| `bayi` yeni enum degeri | Legacy `seller` karisiyor, temiz ayrim |
| `user_id` musteriler'de (users'da degil) | Her user musteri degil (admin, operator), ama her bayi bir musteri. 1:1 UNIQUE |
| `/api/bayi/*` route'lari admin disinda | Admin RBAC'i kirletmez, kendi `requireBayi` guard'i |
| Katalogda stok/maliyet gizli | Repository'de sadece public alanlar SELECT (guvenlik) |
| Siparis no "BY-" prefix | Admin siparislerinden kolayca ayirt edilir |
| Ayri frontend projesi | Admin panel ile concern'ler karismasin, bayi icin sade UX |

---

## Uygulama Sirasi

| Adim | Oncelik | Aciklama | Bagimllik |
|------|---------|----------|-----------|
| 1 | P0 | DB migration'lar (ENUM + user_id) | - |
| 2 | P0 | Drizzle schema guncellemeleri | 1 |
| 3 | P0 | Rol sistemi (service, middleware, controller) | 2 |
| 4 | P0 | requireBayi middleware | 3 |
| 5 | P0 | Bayi backend modulu (validation, repo, controller, router) | 4 |
| 6 | P0 | app.ts route kaydi + demo seed | 5 |
| 7 | P1 | Frontend Next.js proje iskeleti | - |
| 8 | P1 | Shared altyapi kopyalama (Shadcn, baseApi, stores) | 7 |
| 9 | P1 | Auth akisi (login, middleware, token) | 6, 8 |
| 10 | P1 | Katalog sayfasi | 9 |
| 11 | P1 | Siparislerim (liste + detay) | 9 |
| 12 | P1 | Yeni siparis formu | 10, 11 |
| 13 | P1 | Sevkiyat sayfasi | 9 |
| 14 | P1 | Profil sayfasi | 9 |
| 15 | P1 | Dashboard | 11, 13 |
| 16 | P2 | Admin panel bayi yonetimi | 1-6 |

---

## Dogrulama Adimlari

1. `bun run db:seed` — migration'lar hatasiz uygulanmali
2. `bun run dev` (backend) — `/api/bayi/*` route'lari erisilebilir olmali
3. Demo login: `POST /api/auth/token { email: 'bayi@paspas.com' }` → `role: 'bayi'`
4. `GET /api/bayi/katalog` — stok/maliyet alani **donmemeli**
5. `POST /api/bayi/siparislerim` — musteri_id otomatik atanmali
6. `GET /api/bayi/siparislerim` — sadece kendi siparisleri gelmeli
7. Frontend: `cd frontend && bun dev` → login sonrasi dashboard
