# CODEX GÖREV — Promats Frontend: Yazılımcı Notu (DevNote) Sistemi

> **Mimar (Claude) görev paketi — 2026-06-25.**
> **Amaç:** Demo sırasında her **section / sayfa / header / footer** köşesinde küçük bir **"!" işareti**; tıklayınca o bölüme ait yazılımcı notu / geri bildirim açılır. Her yere **aynı bileşen** import edilerek kullanılır.
> **Kaynak:** `paspas/admin_panel`'deki **page-feedback** sistemi (kopyalanıp uyarlanacak).
> **Geçici:** Demo aşaması içindir; **ileride tek hamlede silinecek** → tüm dosyalar izole + env flag ile kapatılabilir olmalı.
> **Akış:** Codex implement → **Claude review + deploy** (push etme).

---

## Kaynak sistem (admin_panel — kopyalanacak)
- **Backend modülü:** `backend/src/modules/page_feedback/` (schema/repository/controller/validation/router) + tablolar `pageFeedbackThreads` + `pageFeedbackComments` (seed `195_v1_page_feedback.sql`). `page_path` ile anahtarlı thread + yorum + ek (attachment) + durum/öncelik.
- **Frontend widget:** `admin_panel/src/app/(main)/admin/_components/page-feedback/page-feedback-widget.tsx` — `usePathname()` ile sayfa bazlı, tek yüzen buton (`fixed right-5 bottom-5`, Bug ikon), Sheet içinde thread listesi + yeni bildirim + yorum.
- **Hooks/endpoints:** `useListPageFeedbackQuery`, `useCreatePageFeedbackMutation`, `useAddPageFeedbackCommentMutation`, `useUpdatePageFeedbackMutation` + `endpoints/admin/page_feedback.endpoints.ts`.

## Promats'a uyarlama farkları (KRİTİK)
1. **Per-section anchor:** admin'de bir sayfa = bir widget. Promats'ta her **section/header/footer** ayrı "!" alacak. Anahtar = `pathname + '::' + section` (ör. `/tr/uretim::hero`). Aynı `page_feedback` tablosu `page_path` alanına bu birleşik anahtar yazılır (yeni kolon gerekmez).
2. **Köşe "!" marker:** Tek yüzen Bug butonu yerine, **bulunduğu kabın köşesine** (absolute, üst-sağ veya alt-sağ) küçük yuvarlak **"!" rozeti**. Tıklayınca o section'ın notları Sheet'te açılır. Açık not sayısı varsa rozet renkli/sayılı.
3. **Anonim erişim (demo):** Müşteri promats demo'sunu **giriş yapmadan** inceleyecek → list/create/comment endpoint'leri **auth istemesin** (created_by_user_id null kalır). Admin auth ZORUNLU OLMASIN. (Sadece demo; güvenlik kritik değil, ama rate-limit koy.)
4. **Promats backend'e port:** Promats kendi backend'i (port 8087, `promats_site` DB) → `page_feedback` modülünü promats backend'ine kopyala; tablolar promats seed'ine **yeni dosya** olarak (CREATE TABLE, **ALTER yok**). Attachment yükleme promats storage'a (yoksa attachment'ı şimdilik devre dışı bırak — metin notu yeterli).

---

## Yapılacaklar

### A. Backend (promats)
- `backend/src/modules/page_feedback/` → promats backend'e kopyala/uyarla (Drizzle schema promats stiline; mysql2/drizzle mevcut).
- Tablolar: yeni seed `024_promats_page_feedback_schema.sql` (CREATE TABLE `page_feedback_threads` + `page_feedback_comments`, admin_panel 195 ile aynı kolonlar).
- Router: `POST/GET /api/v1/feedback` (list by `pagePath`, create thread, add comment, update status). **Auth yok** (public, rate-limited).
- Promats public router'a register et.

### B. Frontend (promats) — tek izole modül `src/components/devnote/`
- `DevNoteProvider` (opsiyonel) + `DevNote` marker bileşeni + Sheet içerik (widget'tan uyarlanmış) + hooks (promats API client'ına bağlı).
- **`<DevNote section="..." title="..." />`** API:
  - Bulunduğu en yakın `position:relative` kabın **köşesine** "!" rozeti basar (kendi içinde `position:absolute`).
  - Tıkla → Sheet açılır, `page_path = usePathname()+'::'+section` thread'leri listeler, not/bildirim eklenir.
  - Rozet: küçük, dikkat çekici ama tasarımı bozmayan; açık not varsa sayı/renk.
- **Env flag:** Tüm sistem `process.env.NEXT_PUBLIC_DEV_NOTES === '1'` ile gate'li. Flag yoksa **hiç render olmaz** (prod/silme kolaylığı). Demo deploy'da flag açık.

### C. Yerleştirme (her yere aynı import)
`<DevNote section="...">` ekle:
- **Header** (`PromatsHeader`) → `section="header"`
- **Footer** (`PromatsFooter`) → `section="footer"`
- **Anasayfa** her section'a (hero, ürün vitrin, özellikler, neden-promats, vb.) → `section="home-hero"`, `home-urunler`, ...
- **Ürünler / Ürün detay / Arama / Kurumsal / İletişim** sayfalarının ana section'larına.
- **Yeni sayfalar** (Üretim, Become A Partner, Kaynaklar) section'larına.
- Her section sarmalayıcısının `position:relative` olduğundan emin ol (marker absolute konumlansın); değilse marker'a hafif relative wrapper.

---

## Kısıtlar
- **Tasarım bozulmaz** — marker küçük, köşede, mevcut tema akışını etkilemez.
- **Tek hamlede silinebilir:** tüm frontend kodu `src/components/devnote/` altında; backend `modules/page_feedback` + seed `024_*`; flag `NEXT_PUBLIC_DEV_NOTES`. Silme talimatı brief sonunda dursun.
- **ALTER yok**, yeni tablo CREATE TABLE seed ile. TS strict, `any` yok.
- Build: backend `bun run build`; frontend `bun run build` (`PROMATS_BASE_PATH=/promats` ile de kırılmamalı). **Push etme.**

## Silme talimatı (ileride — brief'e referans)
1. `NEXT_PUBLIC_DEV_NOTES` flag'ini kaldır → sistem görünmez.
2. `src/components/devnote/` + `<DevNote>` import/kullanımlarını sil.
3. Backend `modules/page_feedback` + seed `024_*` + router kaydını kaldır, `db:seed:fresh` (veya tabloyu DROP).

## Tamamlama / Doğrulama (Claude)
- Demo'da (`NEXT_PUBLIC_DEV_NOTES=1`) her section/header/footer köşesinde "!" görünüyor.
- "!" tıkla → o bölüme özel not/bildirim Sheet'i açılıyor; **giriş yapmadan** not eklenebiliyor; not kaydediliyor ve tekrar açılınca görünüyor.
- Flag kapalıyken hiçbir marker render olmuyor (tasarım birebir temiz).
- Mevcut sayfalar/görünüm bozulmamış. Build temiz.

## Referans
- Kaynak backend: `admin_panel/../backend/src/modules/page_feedback/*`, seed `195_v1_page_feedback.sql`
- Kaynak frontend: `admin_panel/src/app/(main)/admin/_components/page-feedback/page-feedback-widget.tsx`, `integrations/endpoints/admin/page_feedback.endpoints.ts`, `integrations/shared/pageFeedback.ts`
- Promats hedef: `promats/backend/src/modules/`, `promats/frontend/src/components/`, `PromatsHeader.tsx`/`PromatsFooter.tsx` + sayfa section'ları
