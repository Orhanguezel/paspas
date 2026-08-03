# Teklif Modülü — V1 Uygulama Planı ve Kaynak–Hedef Matrisi

**Tarih:** 2026-08-03
**Kaynak:** `/home/orhan/Documents/Projeler/transpalet-crm` (teklifler modülü)
**Hedef:** Paspas ERP (`backend` + `admin_panel`)
**Üst plan:** [`CEKLIST-PROMATS-TEKLIF-MODULU-TRANSPALET-AKTARIMI-2026-07-30.md`](./CEKLIST-PROMATS-TEKLIF-MODULU-TRANSPALET-AKTARIMI-2026-07-30.md) (58 görev, Teklif + tam CRM)

Bu dosya, o büyük planın **hemen teslim edilebilir V1 dilimini** ve transpalet→Paspas
alan eşleşmesini (üst plandaki Görev #1) tanımlar.

---

## V1 Kapsam kararı

**İçinde (bu aşama):**
- Yeni **"Teklif Modülü"** admin ana başlığı → `Teklif Talepleri` (gelen kutusu) + `Teklifler`.
- Backend: `teklifler`, `teklif_kalemleri`, `teklif_talepleri`, `teklif_no_sayaclari` tabloları
  (Paspas seed SQL kuralı — ALTER yok, `220_teklifler_schema.sql`).
- Yıllık numara `TK-2026-0001` (yarış-güvenli sayaç), durum makinesi + `assertGecis`,
  merkezi toplam motoru (`hesaplaToplamlar`), Paspas `musteriler`/`urunler` FK'leri.
- Teklif kalemi: **Paspas ürün seçici + manuel açıklama satırı**; ürün adı/kodu/fiyatı
  teklif anında **snapshot** olarak saklanır (ürün kartı değişse teklif değişmez).
- Web teklif talebi: **yeni public endpoint** (`POST /web/promats/teklif-talebi`) →
  `teklif_talepleri`. Admin gelen kutusunda görünür; talebi müşteri + taslak teklife
  dönüştürme (tek transaction).
- **Örnek Promats teklif formu**: yazdırılabilir, Promats markalı önizleme (firma bilgisi
  app settings/placeholder).

**Dışında (V2+):**
- PDF/Puppeteer üretimi, e-posta/WhatsApp gönderim takibi, public token görüntüleme.
- İskonto onay akışı (rol limitleri), revizyon (R0/R1/R2) snapshot endpoint'i.
- Kabul edilen teklifi satış siparişine dönüştürme (transpalet'te `crm` modülünde).
- Tüm CRM: pipeline/Kanban, fırsat, aktivite, hatırlatma, otomasyon, rapor (üst plan 33-58).

> Not: Durum enum'u tam tutulur (`talep..suresi_doldu`), ama V1'de yalnız PDF/onay
> gerektirmeyen geçişler UI'da açıktır. Revizyon/gönderim tabloları V2'de eklenir.

---

## Kaynak–Hedef uyumluluk matrisi (transpalet → Paspas)

| Transpalet | Paspas V1 karşılığı | Karar |
|---|---|---|
| tablo `teklifler` (snake DTO) | `teklifler` + **camelCase** `rowToDto` | Uyarla |
| `teklif_kalemleri.teknik_ozellikler` (json) | — | **Çıkar** (transpalet-özel) |
| `teklifler.firsat_id → crm_deals` | — | **Çıkar** (CRM V2) |
| `teklifler.donusen_siparis_id → satis_siparisleri` | aynı FK | Tut (dönüşüm V2) |
| `teklif_revizyonlari`, `teklif_gonderimleri`, `teklif_sablonlari` | — | **V2'ye ertele** |
| `teklif_no_sayaclari` + `generateYearlyNo` | aynı | Taşı (birebir) |
| `hesaplaToplamlar(lines,discount,shipping,tax,kdvDahil)` | aynı saf fonksiyon | Taşı (birebir) |
| durum makinesi `GECISLER` + `assertGecis` | aynı | Taşı |
| `talepler` (auth-korumalı iç CRM lead) | `teklif_talepleri` (**public web intake**) | Yeniden tasarla |
| public `/public/teklif/:token` (PDF) | — | V2 |
| convert (crm modülü) | — | V2 |
| ürün: serbest metin (urun_id fırsattan) | **Paspas ürün seçici + snapshot** | Değiştir |
| DTO snake_case | **camelCase** (Paspas) | Uyarla |
| perm `admin.crm_teklif` | `admin.teklifler` (+ `admin.teklif_talepleri`) | Uyarla |
| route `/admin/crm/teklifler` | `/admin/teklifler`, `/admin/teklif-talepleri` | Uyarla |

---

## Dosya planı (V1)

**Backend**
- [ ] `src/db/seed/sql/220_teklifler_schema.sql` — 4 tablo
- [ ] `src/modules/teklifler/schema.ts` `validation.ts` `repository.ts` `controller.ts` `router.ts`
- [ ] `src/app.ts` — router kaydı (`/admin` prefix) + public teklif-talebi
- [ ] `src/common/middleware/permissions.ts` — `admin.teklifler`, `admin.teklif_talepleri`

**Admin panel**
- [ ] `src/navigation/permissions.ts` + `src/navigation/sidebar/sidebar-items.ts` — "Teklif Modülü" grubu
- [ ] `src/integrations/shared/erp/teklifler.types.ts`
- [ ] `src/integrations/endpoints/admin/erp/teklifler_admin.endpoints.ts`
- [ ] `src/integrations/tags.ts` + `src/integrations/hooks.ts`
- [ ] `app/(main)/admin/teklifler/` — liste + `[id]` editör + örnek Promats form (yazdır)
- [ ] `app/(main)/admin/teklif-talepleri/` — gelen kutusu + detay + dönüştür
- [ ] `src/locale/tr.json` — sidebar + `admin.teklifler` blok

**Frontend (Promats web)** — V1.1
- [ ] Teklif talebi formunu `POST /web/promats/teklif-talebi`'ne bağla (yapısal JSON)

---

---

## V1.5 — Aday Müşteri (Prospect) kavramı + CRM çekirdeği (transpalet aktarımı)

> Kullanıcı talebi (2026-08-03): Web/telefon/manuel yoldan, sistemde kayıtlı olmayan
> kişiden teklif alabiliriz → bunlar **aday müşteri**. Teklif siparişe dönüşürse **gerçek
> müşteri** olur. **Transpalet'ten aktarılacak, yeniden yazılmayacak.**

**Transpalet'te mevcut karşılık:** `musteriler.musteri_durumu` enum
`('potansiyel','aktif','pasif','eski','kara_liste')` — *potansiyel = aday*. Ayrıca `talepler`
(lead durumları: yeni/atandi/iletisimde/nitelikli/uygun_degil/donusturuldu) ve `crm` modülü
(firsat/pipeline/aktivite/convert).

### Aday müşteri (V1.5 — öncelikli)
- [x] **Müşteriye durum alanı ekle** — `musteriler.musteri_durumu` (`aday | aktif | pasif`),
      seed `221_v1_musteri_durumu.sql` (idempotent INFORMATION_SCHEMA guard, mevcut veri korunur → 'aktif').
      **CANLI.**
- [x] **Web teklif talebini dönüştürürken** yeni müşteri **aday** açılıyor (+email). **CANLI.**
- [x] **Manuel teklif oluştururken:** mevcut müşteriyi seç **veya** satır içi **yeni aday müşteri ekle**
      (ad/telefon/e-posta/adres). **CANLI.**
- [ ] **Telefonla gelen istek:** admin gelen kutusuna **manuel talep ekleme** (kaynak='telefon'). *(bekliyor)*
- [ ] **Teklif → satış siparişine dönüşünce** aday → **aktif müşteri** (promote, audit). *(Adım 4 ile)*
- [x] **Müşteri listesi:** Aday/Pasif **rozeti** + `musteriDurumu` ile filtrelenebilir liste. **CANLI.**

### CRM (transpalet'ten aktarılacak — işe yarayan kısımlar; büyük plan 33-58 ile)
- [ ] **Talepler modülünü hizala** — Paspas `teklif_talepleri` ile transpalet `talepler`
      (`235_v1_talepler_schema.sql`, `modules/talepler/*`) alanlarını eşle; lead durum makinesini taşı.
- [ ] **(Opsiyonel/ileri) Fırsat + pipeline** — talep→fırsat→teklif zinciri. Kaynak:
      `modules/crm/{deals,pipelines,activities,convert}.service.ts` + seed `231/232/233/236`.
      *Not: aday müşteri + talep V1.5 için yeterli; tam CRM (Kanban/aktivite/rapor) sonraki faz.*

**Transpalet kaynak dosyaları (kopya, yeniden yazma yok):**
`modules/musteriler/schema.ts` · `db/seed/sql/104,234` (müşteri durumu) ·
`modules/talepler/*` · `db/seed/sql/235` (talep/lead) ·
`modules/crm/convert.service.ts` (dönüşüm + müşteri promote) ·
`modules/crm/{deals,pipelines,activities,dashboard,gorunumler,insights}.service.ts` + `231/232/233/236` (tam CRM, ileri faz).

---

## Definition of Done (V1)
- [ ] Admin'de "Teklif Modülü" başlığı, iki alt sayfa görünür ve yetki korumalı.
- [ ] Manuel teklif oluşturulup taslak düzenlenebiliyor (müşteri+ürün seçici, toplamlar backendde).
- [ ] Web teklif talebi kaydediliyor, gelen kutusunda görünüyor, müşteri+taslak teklife dönüşüyor.
- [ ] Örnek Promats teklif formu yazdırılabilir/önizlenebilir.
- [ ] `bun run build` (backend) ve `tsc` (admin) temiz.

### DoD — V1.5 (Aday Müşteri)
- [ ] Sistemde kayıtlı olmayan kişiden (web/telefon/manuel) teklif → **aday müşteri** kaydı oluşuyor.
- [ ] Manuel teklifte müşteri **seçilebiliyor veya satır içi aday müşteri eklenebiliyor**.
- [ ] Teklif satış siparişine dönüşünce aday müşteri **aktif müşteriye** yükseliyor (tek yönlü, audit'li).
- [ ] Müşteri listesinde aday/aktif ayrımı (filtre + rozet) görünüyor.
- [ ] Müşteri durumu seed SQL ile eklendi (ALTER yok); transpalet'ten aktarıldı, yeniden yazılmadı.
