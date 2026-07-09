# CODEX GÖREV — Sevkiyatçı Mobil Ekranı (Yükle/Sevket)

> **Mimar (Claude) görev paketi — 2026-06-25.** Kaynak: müşteri WhatsApp bildirimi.
> **Durum:** Paspas ERP **teslim edilmiş, canlı** ürün (panel.avrasyaotomotiv.net). Müşteri aktif **bloke**.
> **Akış:** Codex implement eder → **Claude review + deploy** (push etme).

---

## Müşteri talebi (aynen)
> "Sevkiyatçıya mobil uç veremiyorum. Buraya bir mobil ekran gerekiyor yeni sekmede. YZ çözüldü demiş ama çözülmedi, admin'den uyarılar alıyorum."

İhtiyaç: Sevkiyatçı, **operatör ekranı gibi temiz, mobil, tek-iş** bir Yükle/Sevket ekranı kullanabilsin — admin kalabalığı/uyarısı olmadan.

## Doğrulanmış mevcut durum (Claude kod incelemesi)
- **✅ ÇALIŞIYOR — tekrar yapma:** Rol map + tab-gating mevcut. DB rolü `sevkiyatci` → panel rolü `nakliyeci` ([admin-auth-gate.tsx](admin_panel/src/app/(main)/admin/_components/admin-auth-gate.tsx) `DB_TO_PANEL`). Sevkiyat sayfasında `isNakliyeciOnly` → yalnızca **Yükle/Sevket** sekmesi görünüyor ([sevkiyat-client.tsx](admin_panel/src/app/(main)/admin/sevkiyat/_components/sevkiyat-client.tsx) L83-84, `effectiveTab='yukle'`).
- **Başlangıç bulgusu 1 — Nav fazla genişti (asıl "admin uyarıları" sebebi):** `nakliyeci` rolü [permissions.ts](admin_panel/src/navigation/permissions.ts) `NAV_ROLES`'te şu modüllere de erişiyordu: `urunler, musteriler, makineler, satis_siparisleri, makine_havuzu, gantt, stoklar, hareketler`. → Sevkiyatçı temiz tek-ekran değil, **kalabalık sidebar** görüyordu; bu sayfalarda yetki/veri uyarıları çıkıyordu. **Codex durum:** kapatıldı.
- **Başlangıç bulgusu 2 — Yükle/Sevket mobil değildi:** "yukle" sekmesi `<EmirleriTab shipperMode />` render ediyordu (admin masaüstü **tablo** bileşeni). Operatör gibi büyük-buton/tek-kolon mobil format **değildi**. **Codex durum:** kapatıldı.

---

## Yapılacaklar

### 1. [x] `nakliyeci` navigasyonunu SADECE sevkiyata kıs
[permissions.ts](admin_panel/src/navigation/permissions.ts) `NAV_ROLES`: `nakliyeci`'yi şu anahtarlardan **çıkar** → `urunler, musteriler, makineler, satis_siparisleri, makine_havuzu, gantt, stoklar, hareketler`. **Kalsın:** yalnızca `sevkiyat`.
- [sidebar-items.ts](admin_panel/src/navigation/sidebar/sidebar-items.ts)'te `roles` listelerini de buna göre temizle (nakliyeci sidebar'da sadece Sevkiyat görsün).
- `ROLE_HOME.nakliyeci = '/admin/sevkiyat'` kalsın (giriş sonrası direkt buraya).
- **Not:** Sevkiyat sayfası verisini kendi API'sinden çekiyor; bu modüllerin nav erişimini kaldırmak sayfayı bozmaz. Eğer Yükle/Sevket akışı başka bir sayfaya **link** veriyorsa (müşteri/sipariş detayına), o linki sevkiyat içinde inline göster — başka sayfaya yönlendirme.
- **Codex 2026-06-25:** `NAV_ROLES` ve `sidebar-items` zaten yalnızca `sevkiyat` gösterir haldeydi. Kalan sızıntılar kapatıldı: sidebar marka linki `ROLE_HOME` kullanıyor, sevkiyatçı giriş yönlendirmesi `/admin/sevkiyat`.

### 2. [x] Yükle/Sevket ekranını mobil formata getir (operatör referansı)
`shipperMode` görünümünü ([sevkiyat-client.tsx] içindeki `EmirleriTab shipperMode`) **operatör ekranı** ([operator/_components/operator-client.tsx](admin_panel/src/app/(main)/admin/operator/_components/operator-client.tsx)) gibi mobil yap:
- **Tek kolon, büyük kart** liste (masaüstü tablo yerine `shipperMode`'da kart).
- **Büyük dokunma alanları** — Yükle / Sevk Et butonları min 48px yükseklik, tam genişlik.
- Sevk emri kartı: müşteri + ürün + miktar + durum büyük/okunur; aksiyon butonları altta.
- Masaüstünde (admin) mevcut tablo davranışı **bozulmasın** — sadece `shipperMode` (veya `lg:` altı) mobil kart.
- Sevk akışı (yükle → sevk et) adımları dokunmatik dostu.
- **Codex 2026-06-25:** Nakliyeci görünümü sekmesiz tek mobil ekrana alındı; `shipperMode` tek kolon kart liste ve büyük aksiyonlarla çalışıyor. Fiziksel sevk dialog'u dokunmatik input/butonlarla büyütüldü.

### 3. [x] (Opsiyonel ama önerilir) Sevkiyatçı için temiz mobil kabuk
`nakliyeci` rolünde admin sidebar'ı operatördeki gibi gizle/sadeleştir ([app-sidebar.tsx](admin_panel/src/app/(main)/admin/_components/sidebar/app-sidebar.tsx)). Operatör bu deneyimi nasıl sağlıyorsa (sidebar gizli/minimal) nakliyeci de aynı olsun — "yeni sekmede temiz mobil ekran" hissi.
- **Codex 2026-06-25:** Sevkiyatçı `/admin/sevkiyat` içinde temiz mobil header + tek iş ekranı görüyor; sidebar marka linki artık dashboard yerine rol ana sayfasına gider.

---

## Kısıtlar
- **Yeni şema YOK. ALTER YASAK.** Gerekirse DUR, Claude'a sor.
- `admin` ve diğer roller (`operator`, `satin_almaci`) davranışı **bozulmasın** — sadece `nakliyeci` daraltılır + mobil format.
- TS strict, `any` yasak (paspas/CLAUDE.md). Backend `bun run build`; admin `tsc --noEmit` sonra `bun run build`.
- Her madde ayrı commit. **Push etme** — Claude review + canlı deploy + thread kapatma yapar.

## Tamamlama / Doğrulama (Claude canlıda kontrol edecek)
- Sevkiyatçı (`sevkiyatci`) kullanıcısıyla giriş → **yalnızca Sevkiyat** (sidebar'da başka modül yok), admin uyarısı yok.
- Yükle/Sevket ekranı mobilde **büyük kart/buton, tek kolon** — telefonda rahat kullanılır.
- Yükle → Sevk Et akışı dokunmatikle sorunsuz; sevk emri durumu güncelleniyor.
- Admin/operatör/satınalmacı deneyimi değişmemiş.
- Build temiz.

## Referans dosyalar
- Rol/izin: `admin_panel/src/navigation/permissions.ts`, `sidebar/sidebar-items.ts`, `_components/admin-auth-gate.tsx`, `_components/sidebar/app-sidebar.tsx`
- Sevkiyat ekran: `admin_panel/src/app/(main)/admin/sevkiyat/_components/sevkiyat-client.tsx`
- Mobil referans: `admin_panel/src/app/(main)/admin/operator/_components/operator-client.tsx`
- Sevkiyat veri akışı (geçmiş karar): `~/.claude/.../memory/project_sevkiyat_flow.md` — Sevk Bekleyenler sipariş kalemlerinden, Sevk Emirleri ayrı tablo.
