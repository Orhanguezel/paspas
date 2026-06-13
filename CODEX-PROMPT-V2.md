# Codex Prompt — Paspas ERP V2 Yazılımcı Notu Toplu Düzeltme

Aşağıdaki içeriği olduğu gibi Codex'e ver.

---

## 🤖 GÖREV — Codex'e

Paspas Üretim ERP'sinde **29 açık yazılımcı notu** var. Hepsi tek bir çeklistte toplandı:
👉 **[CEKLIST-V2.md](./CEKLIST-V2.md)**

Bu çeklistteki **tüm maddeleri sırayla tamamla**.

### Önce oku, sonra başla

1. **`CEKLIST-V2.md`** — Çeklist + 5 verilmiş karar (sen bu kararlara göre uygulayacaksın).
2. **`CLAUDE.md`** (kök) — Workspace kuralları, orkestrasyon, görev dağılımı.
3. **`backend/CLAUDE.md`** — Backend modül mimarisi (schema/validation/repository/controller/router ayrımı zorunlu).
4. **`admin_panel/CLAUDE.md`** — Admin panel kuralları (i18n, sidebar items, Select sentinel value vb.).
5. **`docs/yazilimci-notu-v2-acik-isler.md`** — Notların orijinal metni + tartışma kaynağı (gerekirse referans).
6. **`backend/src/db/seed/sql/199_makine_kapali_araliklar_schema.sql`** — Y1 (Makine kapatma) için **Claude'un yazdığı şema**. Senin yazman gereken Y1 modülü bu tabloyu kullanır.

### Sıralama (önemli — bu sırayla ilerle)

**Faz 1 — Bug'lar (B1 → B12):** Veri/işlem doğruluğu öncelik. B12 kullanıcı eylemi, atla.
**Faz 2 — UX iyileştirmeler (U1 → U8):**
**Faz 3 — Yeni özellikler (Y1 → Y4):** En son. Y1 şeması hazır.

Her maddenin **detay açıklaması ve etkilenen dosyalar/sayfalar `CEKLIST-V2.md`'de var.**

### Şema değişikliği kuralı (KRİTİK)

- **`ALTER TABLE` yasak** (CLAUDE.md kuralı).
- Yeni kolon/tablo gerektiren işler için:
  - **Yeni** seed dosyası ekle: `backend/src/db/seed/sql/2XX_aciklayici_isim.sql` (sıradaki numara — şu an son seed 199'dur).
  - **Mevcut** `CREATE TABLE` seed'lerine kolon ekleme yapma; ayrı idempotent migration kullan (örnek: [190_v1_recete_kalemleri_aciklama.sql](backend/src/db/seed/sql/190_v1_recete_kalemleri_aciklama.sql) — `INFORMATION_SCHEMA` kontrollü prepare/execute).
- Bu işler için yeni seed gerek:
  - **U8** (Makineler için 2 görünürlük toggle): `200_makineler_gorunurluk.sql`
  - **Y4** opsiyonel (eğer vardiya alanını kalıcı saklamayı tercih edersen — şu an `runtime` hesaplama öneriliyor, ama operatör manuel değiştirebiliyor o yüzden saklanması gerekebilir): `201_operator_kayit_vardiya.sql`

### Commit ve build kuralları

- **Her madde için ayrı commit.** Mesaj örneği: `fix(uretim-emirleri): makineden cikar montaj tarafi temizliği (B1)`.
- Her maddenin sonunda **build doğrulaması** çalıştır:
  - `cd backend && bun run build`
  - `cd admin_panel && bun x tsc --noEmit -p tsconfig.json` (hızlı), sonunda toplu: `cd admin_panel && bun run build`.
- Build kırılırsa **bir sonrakine geçme**; düzelt, sonra ilerle.
- **Push etme.** Tüm liste bittiğinde Claude'a haber ver — review + deploy + thread'leri `resolved` yapma Claude'un işidir.

### Davranış kuralları

- **Karar 1 (makine kapatma):** Şema [199_…sql](backend/src/db/seed/sql/199_makine_kapali_araliklar_schema.sql) hazır. Sadece tarih (gün) bazlı. Aynı makineye çakışan aralık 400. UI `/admin/tanimlar` altında.
- **Karar 2 (operatör reçete detayı — Yol B):** Üretim Emirleri sayfasını operatöre **AÇMA**. Sadece operatör kartlarına "Reçete Detayı" butonu — mevcut `recete-detay-modal` aynı içerikle açılır.
- **Karar 3 (vardiya hibrit):** 07:30–09:30 arası kayıt → otomatik **gece**. 19:30–07:30 arası → gece. 09:30–19:30 → gündüz. UI'da küçük badge, tıklayınca değiştirilebilir.
- **Karar 4 (responsive):** Mobilde `grid-cols-1`, küçük yazı; sıradaki işler **kompakt satır**.
- **Karar 5 (rezerve formülü):** `Rezerve = urunler.rezerve_stok` kolonu. `Serbest = Stok − Rezerve` (negatifse boş). Mevcut "yeterlilik" hesabına **dokunma** (üretim emrinin çıkabilirliği farklı soru).

### İlerleme raporu

Her **10 maddede bir** terminal'e tek satır özet ver:
```
[Codex] Tamamlanan: B1-B10. Sıra: B11. Kalan: 19. Build: OK.
```

Bittiğinde:
```
[Codex] V2 toplam 28 madde tamamlandı (B12 kullanıcı eylemi). Build OK. Claude'a deploy için hazır.
```

---

## 📂 İlgili Yollar — Hızlı Bağlantılar

- Çeklist: [CEKLIST-V2.md](CEKLIST-V2.md)
- V1 referansı (önceki tur): [docs/yazilimci-notu-acik-isler.md](docs/yazilimci-notu-acik-isler.md)
- V1 şema kararı (referans): [docs/sema-karari-9-13.md](docs/sema-karari-9-13.md)
- V2 detay tartışma: [docs/yazilimci-notu-v2-acik-isler.md](docs/yazilimci-notu-v2-acik-isler.md)
- Y1 şeması: [backend/src/db/seed/sql/199_makine_kapali_araliklar_schema.sql](backend/src/db/seed/sql/199_makine_kapali_araliklar_schema.sql)
- Sunucu bilgileri (deploy = Claude yapar): [SERVER.md](SERVER.md)

## ❓ Belirsizlik olursa

Bir madde için CEKLIST-V2.md veya kararlar yetersiz kalırsa **DURDUR** ve sor — yanlış yorumla ilerleme.
