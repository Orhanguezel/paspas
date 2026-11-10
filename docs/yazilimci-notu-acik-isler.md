# Yazılımcı Notu — Açık İşler Raporu & Görev Dağılımı

> Kaynak: Canlı sunucu (`promats_erp.page_feedback_threads` / `page_feedback_comments`)
> Tarih: 2026-05-15 — Son durum doğrulaması: 2026-07-28
> Toplam thread: 20 — Bu rapordaki 13 görev thread'i canlı veritabanında **resolved**

---

## 1. Özet

Canlıdaki yazılımcı notu panelinde kullanıcı (Orhan) ekran görüntüleri ve açıklamalarla
13 açık madde bırakmış. Maddeler 4 sayfaya yayılıyor: `dashboard` (5), `uretim-emirleri` (4),
`urunler` (3), `operator` (1).

3 maddede ekran görüntüsü ekli — incelendi:
- **Reçete Detayı ekranı** → `/uploads/admin/uretim-emirleri/re_ete_ekran_.png`
- **Makine Atama -Montaj** → `/uploads/admin/uretim-emirleri/Makine_Ata.png`
- **Kalıp Değiştir butonu** → `/uploads/admin/operator/Kalip_degistir.png`

### Önceliklendirme

| Seviye | Maddeler | Gerekçe |
|--------|----------|---------|
| 🔴 P0 — Veri/Mantık Bug | #4 Depo Stok, #5 Montaj çift görünüm, #2 Reçete Operasyonel YM, #1 Gerçekleşen Üretim | Yanlış veri gösteriliyor → operasyonel güven kaybı |
| 🟠 P1 — İşlevsel Eksik | #13 Kalıp Değiştir, #7 Üretim vs Sevkiyat, #6 Filtreler | Süreç tamamlanamıyor / raporlama eksik |
| 🟡 P2 — UX/İyileştirme | #3 Reçete Detayı modal, #9 Reçete ekranı, #10 Makine Ata default, #11 Sayfa numaraları, #12 Vardiya kutuları | Kullanılabilirlik |
| ⚪ Operasyon | #8 Ürün görseli yeniden yükleme | Kod değil, veri girişi |

---

## 2. Rol & Görev Dağılımı

| Araç | Sorumluluk |
|------|------------|
| **Claude (ben)** | P0 bug'lar, DB şema kararları, kritik backend mantığı, **canlıya deploy**, **tüm görevlerin review & merge** |
| **Codex** | Büyük/orta implementasyon (feature + backend) — Claude'un şema/kontrat verdiği işler |
| **Cursor** | Orta-küçük UI + frontend mantık işleri |
| **Antigravity** | UI doğrulama, screenshot karşılaştırması, layout-ağırlıklı işler |
| **Kullanıcı** | Operasyonel veri girişi (görsel yükleme) |

> İş akışı: Claude tasarla/şema ver → Codex/Cursor implement et → Antigravity görsel doğrula → Claude review et → Claude canlıya deploy et.
> Çakışma kuralı: Aynı dosyada aynı anda iki araç çalışmaz. Branch bazlı ilerlenir, Claude merge eder.

---

## 3. Açık İşler Çeklisti

### 🔴 Claude (P0 — kritik bug & şema)

- [x] **#4 — Depo Stok kutusu boş** · `/admin/dashboard`
  - Sorun: Üretim girişi yapılmış ürünler var ama Depo Stok kutusu hiç veri göstermiyor.
  - Yapılacak: Dashboard depo-stok sorgusunu (backend) debug et, üretim girişi → stok yansıması zincirini kontrol et. Root cause bul, düzelt, canlıda doğrula.
- [x] **#5 — Makine Atama / Montaj çift görünüm** · `/admin/uretim-emirleri` · 📎 `Makine_Ata.png`
  - Sorun: Sağ + sol aynı makineye atanıp montaj "sağ" seçilince, Makine İş Yükleri'nde **her iki tarafta da** Montaj rozeti görünüyor.
  - Yapılacak: Montaj flag'inin yalnızca seçilen tarafa yazıldığını backend'de garanti et; iş yükü listesi sorgusunu düzelt.
- [x] **#2 — Reçete: Operasyonel YM gelmiyor** · `/admin/urunler` · (in_review)
  - Sorun: Ürün→Düzenle→Reçete→"Malzeme Seç" popup'ında kategori "Operasyonel YM" olan malzemeler listelenmiyor.
  - Yapılacak: `urunler` endpoint kategori filtresini ve popup sorgusunu düzelt. Operasyonel YM reçeteye eklenebilmeli; yalnızca eksik-malzeme hesabında gizlenmeli (zaten ayrılmıştı).
- [x] **#1 — Gerçekleşen Üretim: yarımamul kirliliği** · `/admin/dashboard` (backend kısmı)
  - Sorun: Kutuda üretim olmayan yarımamul kayıtları (örn. XX Large Koli +25, Baskılı Koli Etiketi +50) artı olarak görünüyor.
  - Yapılacak (backend/şema): Yalnızca üretimi yapılan stoklara artı yansıyan üretim gelmeli. Sorguyu filtrele. (Frontend filtre/sütun kısmı → Codex, aşağıda #1f)
- [x] **#9/#13 için DB şema kararı** — Karar: **şema değişikliği gerekmiyor**. Kontrat: [sema-karari-9-13.md](./sema-karari-9-13.md)
  - #9 Reçete genel açıklama → `receteler.aciklama` kolonu **zaten var**; yalnızca API+UI bağlama (Cursor #9 / Codex #11f).
  - #13 Kalıp değişimi → mevcut `durus_kayitlari` + `durus_tipi='kalip_degisimi'`; yeni tablo yok (Codex #13).
  - Sonuç: ALTER / `db:seed:fresh` **yok** — [feedback_db_seed] kuralı kapsamında risk sıfır.
- [x] **Deploy & Review** — ✅ **YAPILDI** (2026-05-15, commit `50b4fc4`). Backend+admin build temiz → push main → `deploy-paspas` → PM2 restart OK. Post-deploy: #5 bozuk veri 7→0 temizlendi, dökümantasyon dosyası sunucuya kopyalandı, /admin/dokumantasyon ve /admin/dashboard → HTTP 200. Kalan: kullanıcı hard-refresh ile sonsuz döngünün gittiğini doğrulayacak.

  **Deploy günü runbook'u (sırayla):**
  1. Tüm ajan işleri commit'li ve çalışma ağacı stabil mi doğrula (`git status`).
  2. `cd backend && bun run build` + `cd admin_panel && bun x tsc --noEmit` → ikisi de temiz olmalı.
  3. Eş zamanlı düzenleme yarış izleri için kritik dosyaları gözden geçir (adminUi.ts nav-key tutarlılığı, makine-ata-sheet ↔ repoAtaOperasyon kontratı).
  4. **#5 canlı veri düzeltmesi (KRİTİK):** Mevcut bozuk kayıtlar — montaj=0 olduğu halde `montaj_makine_id` dolu operasyonlar — temizlenmeli:
     `UPDATE uretim_emri_operasyonlari SET montaj_makine_id = NULL WHERE montaj = 0 AND montaj_makine_id IS NOT NULL;` (önce SELECT ile say, UE-2026-0009 dahil doğrula).
  4b. **Dökümantasyon dosyası (KRİTİK):** Sunucuda `/var/www/paspas/docs/ADMIN_SAYFA_DOKUMANTASYONU.md` **yok** → `/admin/dokumantasyon` "Server Components render" hatası veriyordu. Kod düzeltildi (artık çökmüyor, boş düşüyor) ama içeriğin görünmesi için dosya kopyalanmalı: `scp docs/ADMIN_SAYFA_DOKUMANTASYONU.md vps-paspas:/var/www/paspas/docs/` (deploy script'e kalıcı kopyalama adımı eklenmeli — public'e koyma, gizli kalsın).

  **Bu oturumda ek olarak düzeltilen 2 production hatası (deploy ile gidecek):**
  - **dokumantasyon RSC çökmesi** → `dokumantasyon/page.tsx` try/catch + dosya yoksa boş düş (artık tüm render'ı çökertmiyor).
  - **Sonsuz reauth/render döngüsü** → `admin-notifications-live.tsx`: SSE `error`'da cache invalidate kaldırıldı; sınırlı (5) + exponential backoff'lu yeniden bağlanma eklendi. Kök neden: başarısız `/notifications/stream` her error'da invalidate → unreadCount refetch → 401 → `/auth/token/refresh` fırtınası. `baseApi.ts` (korumalı altyapı) **değiştirilmedi** — kullanıcı kararı: kök neden bileşende çözüldü.
  5. `ssh vps-paspas "/root/bin/deploy-paspas"` → canlıda her madde için doğrulama.
  6. Çözülen her thread'i `resolved` yap + Türkçe `resolution` notu ekle (kullanıcıya "siz/kullanıcı" dili — [feedback_customer_messages]).
  7. Bu dosyadaki ilgili kutuları `[x]` işaretle.

### 🟠 Codex (P1 — feature & backend implementasyon)

- [x] **#13 — Kalıp Değiştir butonu** · `/admin/operator` · 📎 `Kalip_degistir.png` · Codex implementasyonu hazır, review/deploy bekliyor.
  - "Şu an çalışan iş yok" ekranına **Kalıp Değiştir** butonu. Basınca kalıp değiştirme süresi başlar, **Kalıp Değişimi Bitir** aktif olur. Bitince sıradaki üretimin **Başlat** butonu aktif olur.
  - Başlangıç/bitiş saatleri sistemde kaydedilir (raporlama için). → Claude'un vereceği şemayı kullan.
- [x] **#7 — Üretim vs Sevkiyat kutusu** · `/admin/dashboard` · Codex implementasyonu hazır, review/deploy bekliyor.
  - Haftalık → bu haftanın günleri (Pzt, Sal…) gün gün grafik. Aylık → o ayın haftaları. Tümü → yılın ayları. Kutu yüksekliği +%50.
- [x] **#6 — Mal Kabul & Sevkiyat filtreleri** · `/admin/dashboard` · Codex implementasyonu hazır, review/deploy bekliyor.
  - Mal Kabul ve Sevkiyat kutucuklarına: Dün, Bugün, Hafta, Ay, Tümü filtreleri (backend agregasyon + frontend).
- [x] **#1f — Gerçekleşen Üretim filtre & sütun (frontend)** · `/admin/dashboard` · Codex implementasyonu hazır, review/deploy bekliyor.
  - Sağ üst filtrelere "Dün" seçeneği. Altına Gece/Gündüz vardiya seçeneği. Listeye Tarih–Ürün arasına "Vardiya" sütunu. (Backend veri temizliği → Claude #1)
- [x] **#11f — Reçete ekranı: genel açıklama alanı (frontend)** · `/admin/urunler` · Codex implementasyonu hazır, review/deploy bekliyor.
  - Claude'un eklediği yeni "Reçete Açıklaması" kolonuna UI bağla (satır açıklamalarından ayrı, genel alan).

### 🟡 Cursor (P2 — UI & frontend mantık)

- [x] **#3 — Reçete Detayı modal iyileştirme** · `/admin/uretim-emirleri` · 📎 `re_ete_ekran_.png`
  - `recete-detay-modal.tsx`: Dialog genişliğini mevcut genişliğin **1.5–1.6 katı** yap. Ürün ve malzeme görsellerini daha da büyüt. Ürün bilgisi ile malzeme bilgisi arasındaki **iki çizgi arası bloğu kaldır** (genel reçete; üretim/siparişten bağımsız). Açıklama fontunu büyüt/okunaklı yap.
- [x] **#10 — Makine Ata default değerleri** · `/admin/uretim-emirleri`
  - Makine Ata popup'ında: 1. makine kutusu açılışta **ENJ-01**, 2. makine kutusu **ENJ-02** default. Montaj 2. makinede seçili gelsin. Hepsi değiştirilebilir kalsın (zorunlu değil).
- [x] **#9 — Reçete ekranı düzenlemeleri** · `/admin/urunler`
  - Malzeme satır sıralaması ters (en son eklenen en üstte). "Satır ekle" yeni satırı **en üste** açsın. Satır ekle butonundaki **çift `+` işaretinden biri kaldırılsın**. Alttaki "Kaydet" butonu üstteki butonlarla aynı hizaya alınsın. (Genel açıklama alanı bağlama → Codex #11f, şema → Claude)
- [x] **#11 — Ürünler sayfa numaraları (pagination)** · `/admin/urunler`
  - Tüm ürünler tek sayfada değil. Sayfa altına önceki/sonraki + sayfa numaraları (1,2,3…). Backend pagination param'ı varsa bağla; yoksa Claude'a bildir.

### ⚪ Antigravity (UI doğrulama & layout)

- [x] **#12 — Vardiya Özeti & Makine Durumları yan yana** · `/admin/dashboard`
  - "Bugünkü Vardiya Özeti" ve "Makine Durumları"nı **yan yana iki ayrı kutu** yap. Vardiya özetini **makine bazında** (her makine ayrı) göster.
- [ ] **Görsel doğrulama (sürekli)** — Codex/Cursor her maddeyi bitirdikçe canlıya yakın ortamda screenshot al, kullanıcının yazılımcı notundaki ekran görüntüsü/açıklamayla karşılaştır, sapma varsa Claude'a raporla.

### ⚪ Kullanıcı (operasyon)

- [x] **#8 — Ürün görseli yeniden yükleme** · `/admin/urunler` (`resolved`)
  - Backend kısmen çözüldü (dizin + Türkçe karakter düzeltildi, commit `c7306b7`). Bekleyen: sunucuda bulunamayan **`Frankfurt_Fuar_Kapak.jpg` (ürün 1115 211)** ve **`CARUB_PASIFIK.jpg`** görsellerinin yeniden yüklenmesi gerekiyor.

---

## 4. Thread → Madde Eşlemesi (canlı DB)

| Thread ID | Konu | Sayfa | Durum | Sorumlu |
|-----------|------|-------|-------|---------|
| 84bc9921 | Depo Stok | dashboard | resolved | Claude #4 |
| 6c50b7fa | Makine Atama -Montaj | uretim-emirleri | resolved | Claude #5 |
| 24022770 | Reçete problemi | urunler | resolved | Claude #2 |
| 92985461 | Gerçekleşen Üretim | dashboard | resolved | Claude #1 + Codex #1f |
| 180aa15b | Kalıp Değiştir butonu | operator | resolved | Codex #13 |
| 93e53bba | Üretim vs Sevkiyat kutusu | dashboard | resolved | Codex #7 |
| f46dd139 | Filtreler | dashboard | resolved | Codex #6 |
| 39d7d9d3 | Reçete Detayı ekranı | uretim-emirleri | resolved | Cursor #3 |
| 1c5a4453 | Makine Ata ekranı | uretim-emirleri | resolved | Cursor #10 |
| 6f460beb | Reçete ekranı | urunler | resolved | Cursor #9 + Claude(şema) |
| 0a57ad9a | Sayfa numaraları | urunler | resolved | Cursor #11 |
| 3742b338 | Vardiya Özeti & Makine Durumları | dashboard | resolved | Antigravity #12 |
| f067136a | ürün görseli | urunler | resolved | Kullanıcı #8 |

---

## 5. Tamamlama Akışı (her madde için)

1. Sorumlu araç kendi branch'inde implement eder.
2. Antigravity canlı görsele göre doğrular.
3. Claude review eder → main'e merge.
4. Claude `ssh vps-paspas "/root/bin/deploy-paspas"` ile canlıya alır.
5. Claude canlıda doğrular, ilgili `page_feedback` thread'ini `resolved` yapar ve `resolution` notu ekler.
6. Bu dosyada ilgili kutu `[x]` işaretlenir.
