# Site Frontend (Next.js)

Next.js 16, RTK Query, coklu dil; tema ve metinler `site_settings` + `src/config/site-defaults.json` + `NEXT_PUBLIC_*` ile.

Bu frontend markadan ve projeden bagimsiz bos taslak sablondur. App Router, i18n, auth,
layout, SEO, RTK store ve tema altyapisi korunur; domain icerigi proje tarafinda DB,
site ayarlari veya CMS kayitlariyla doldurulur. Varsayilan marka `AppName` tokeni ve
`NEXT_PUBLIC_APP_NAME` uzerinden cozulur.

## Calistirma

```bash
cd /path/to/tarim-dijital-ekosistem
bun install
cd projects/<yeni-proje>/frontend
cp .env.example .env.local
bun run dev
```

Varsayılan port **3177**. Frontend kökte bağımsız çalışır; ortak sınıf yardımcıları kendi `src/lib` dizinindedir.

API: proje `backend` (8086); koken `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_API_URL`.
