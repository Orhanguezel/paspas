# E3 Sonrasi Smoke Test Komutlari

Bu komutlar, E3 bulgulari kapatildiktan sonra kritik akislarin hizli kontrolu icindir.

## 1) Build Kontrolu

```bash
cd backend && bun run build
cd ../admin_panel && bun run build
```

## 2) Backend Health ve Ana Endpoint Kontrolu

```bash
curl -i http://localhost:3093/api/v1/health
curl -i http://localhost:3093/api/v1/public/brand-config
curl -i "http://localhost:3093/api/v1/market/external/paspas/customers?limit=5"
curl -i "http://localhost:3093/api/v1/market/reports/weekly/preview"
```

Not:
- Ortama gore backend portu farkliysa URL'i ayni pattern ile guncelle.
- Yetki isteyen endpointlerde admin token/cookie ile test yap.

## 3) UI Kritik Rotalar

```text
/admin/market
/admin/market/targets
/admin/market/leads
/admin/market/signals
/admin/market/reports
/admin/site-settings
/admin/external-db
```

Beklenen:
- Runtime error yok
- Temel listeleme ve dialog aksiyonlari aciliyor
- Churn/Report/Paspas import akislarinda blokaj yok

## 4) Kapanis Kriteri

- Build: backend + admin_panel yesil
- E3 maddeleri PASS veya blok nedeni net
- P0/P1 acik bug kalmamis
