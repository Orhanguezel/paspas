# Backend ERP Progress

Bu dosya backend implementasyon durumunu izlemek için tutulur.

## Modül Durumu

- [x] Dashboard (`/admin/dashboard`) (mevcut, ERP uyarlaması devam edecek)
- [x] Urunler (`/admin/urunler`)
- [x] Receteler (`/admin/receteler`)
- [x] Musteriler (`/admin/musteriler`)
- [x] Satis Siparisleri (`/admin/satis-siparisleri`)
- [x] Uretim Emirleri (`/admin/uretim-emirleri`)
- [x] Makine Havuzu (`/admin/makine-havuzu`)
- [x] Makine Is Yukleri (`/admin/is-yukler`)
- [x] Gantt Plani (`/admin/gantt`)
- [x] Malzeme Stoklari (`/admin/stoklar`)
- [x] Satin Alma (`/admin/satin-alma`)
- [x] Hareketler (`/admin/hareketler`)
- [x] Operator Ekrani (`/admin/operator`)
- [x] Tanimlar (`/admin/tanimlar`)

## Eklenen SQL Dosyalari

- [x] `104_musteriler_schema.sql`
- [x] `105_urunler_schema.sql`
- [x] `106_receteler_schema.sql`
- [x] `107_satis_siparisleri_schema.sql`
- [x] `108_uretim_emirleri_schema.sql`
- [x] `109_makine_havuzu_schema.sql`
- [x] `110_satin_alma_schema.sql`
- [x] `111_hareketler_schema.sql`
- [x] `112_tanimlar_schema.sql`

## Son Guncelleme

- [x] Dashboard ozeti ERP sayaclari ile guncellendi (`/admin/dashboard/summary`)
- [x] Dashboard KPI endpointi eklendi (`/admin/dashboard/kpi`)
- [x] Dashboard trend endpointi eklendi (`/admin/dashboard/trend?days=30`)
- [x] appSettings modulu eklendi (`/admin/app-settings/*`) - `site_settings` ile paralel calisir
- [x] Operator rol yetkilendirmesi eklendi (`admin|operator`), `user_roles` enum guncellendi
- [x] ERP permission key map genisletildi (`admin.urunler` ... `admin.app_settings`)
- [x] ERP router'lari permission guard'a tasindi (`makeAdminPermissionGuard`)
- [x] Legacy admin route'lar permission guard'a tasindi (`admin.users`, `admin.storage`, `admin.db_admin`)
- [x] is_yukler modulu CRUD tamamlandi (`GET/POST/PATCH/DELETE /admin/is-yukler`)
- [x] gantt modulu genisletildi (`GET /admin/gantt/:id`, `PATCH /admin/gantt/:id`)
- [x] Rol modeli ERP'ye gore guncellendi (`admin`, `sevkiyatci`, `operator`, `satin_almaci`) ve permission dagilimi yenilendi
- [x] Legacy rol adlari (`seller/moderator/user`) middleware seviyesinde ERP rollere normalize edildi
- [x] `user_roles` endpointleri `admin.users` permission guard altinda birlestirildi

## Son Eklenen Ozellikler

- [x] Urun operasyonlarinda renk alani otomatik operasyon ismine yansitilir (backend + frontend)
- [x] Birim donusum stok entegrasyonu (`urun_birim_donusumleri` → stoklar endpoint + frontend gosterimi)
- [x] Makine kuyrugu plan tarih otomatik hesaplama (`recalcMakineKuyrukTarihleri`)
- [x] Stok yeterlilik kontrolu endpointi (`GET /admin/stoklar/yeterlilik?urunId=X&miktar=Y`)
  - Recete kalemlerine gore malzeme bazli stok yeterlilik analizi
  - Fire orani dahil hesaplama
  - Frontend dialog ile kullanici arayuzu

## Faz 15 - Testler

- [x] Modül 1 (Dashboard) birim testleri eklendi (`src/modules/dashboard/__tests__/dashboard.test.ts`)
- [x] Modül 2 (Urunler) birim testleri eklendi (`src/modules/urunler/__tests__/urunler.test.ts`)
- [x] Modül 3 (Receteler) birim testleri eklendi (`src/modules/receteler/__tests__/receteler.test.ts`)
- [x] Modül 4 (Musteriler) birim testleri eklendi (`src/modules/musteriler/__tests__/musteriler.test.ts`)
- [x] Modül 5 (Satis Siparisleri) birim testleri eklendi (`src/modules/satis_siparisleri/__tests__/satis_siparisleri.test.ts`)
- [x] Modül 6 (Uretim Emirleri) birim testleri eklendi (`src/modules/uretim_emirleri/__tests__/uretim_emirleri.test.ts`)
- [x] Modül 7 (Makine Havuzu) birim testleri eklendi (`src/modules/makine_havuzu/__tests__/makine_havuzu.test.ts`)
- [x] Modül 8 (Is Yukleri) birim testleri eklendi (`src/modules/is_yukler/__tests__/is_yukler.test.ts`)
- [x] Modül 9 (Gantt) birim testleri eklendi (`src/modules/gantt/__tests__/gantt.test.ts`)
- [x] Modül 10 (Stoklar) birim testleri eklendi (`src/modules/stoklar/__tests__/stoklar.test.ts`)
- [x] Modül 11 (Satin Alma) birim testleri eklendi (`src/modules/satin_alma/__tests__/satin_alma.test.ts`)
- [x] Modül 12 (Hareketler) birim testleri eklendi (`src/modules/hareketler/__tests__/hareketler.test.ts`)
