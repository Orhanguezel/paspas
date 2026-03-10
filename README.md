# Paspas ERP

Paspas, uretim planlama ve operasyon yonetimi icin gelistirilen bir ERP calisma alanidir.
Bu repo su anda iki ana uygulama parcasi icerir:

- `backend`: Bun/TypeScript tabanli API ve is kurallari katmani
- `admin_panel`: Next.js tabanli yonetim paneli

Repoda ayrica dokumantasyon, notlar ve planlama dosyalari bulunur.

## Proje Yapisi

```text
.
├── admin_panel/
├── backend/
├── frontend/
├── prime-frontend-nextjs/
├── URETIM_PLANLAMA_V1.md
├── V1_REV1_DURUM_RAPORU.md
└── V2_DURUM_RAPORU.md
```

## Ana Bilesenler

### Backend

Konum: `backend/`

Teknolojiler:

- Bun
- TypeScript
- Fastify
- Drizzle ORM
- MySQL
- JWT, multipart, static file ve Swagger eklentileri

Temel scriptler:

```bash
cd backend
bun install
bun run dev
bun run build
bun run start
bun run test
```

Ek scriptler:

- `bun run db:seed`
- `bun run db:seed:nodrop`
- `bun run db:seed:only`

### Admin Panel

Konum: `admin_panel/`

Teknolojiler:

- Next.js
- React 19
- TypeScript
- TanStack Query
- Redux Toolkit
- Biome
- Vitest

Temel scriptler:

```bash
cd admin_panel
bun install
bun run dev
bun run build
bun run start
bun run test
bun run lint
```

Not:

- `predev` ve `prebuild` asamalarinda locale manifest olusturulur.
- Admin panel altinda ek teknik dokumanlar bulunur: `README.md`, `LEARNING.md`, `QUICK_FIX.md`.

## Gelistirme Akisi

Bu repo icin onerilen akis:

1. Gerekliyse dogrudan `main` uzerinde calis
2. Riskli veya buyuk islerde branch ac
3. Degisiklikleri yap
4. Gerekirse test/lint calistir
5. Commit at
6. GitHub'a push et
7. CI/CD ile deploy sonucunu dogrula

## OpenClaw ile Calisma

Bu repo OpenClaw VPS uzerinde de clone edilmis durumdadir.
Hedef calisma modeli:

- kod degisikligi OpenClaw VPS uzerinde yapilir
- degisiklik GitHub'a push edilir
- `main` push'lari CI/CD ile `gzl-web` uzerine deploy olur
- deploy sonrasi health-check yapilir

Bu sayede canli sunucuda dogrudan kod degistirme ihtiyaci azalir.

## Dikkat Edilecekler

- Secret ve `.env` dosyalari repoya yazilmaz
- Nginx ve runtime ayarlari prod sunucuda ayrica yonetilir
- Repo icindeki dokuman dosyalari tarihsel notlar da icerebilir; guncel teknik durum icin ilgili alt klasor README'leri esas alinmalidir
