# Yazılımcı Notu V6 — Açık İşler Çeklisti

> **İnceleme:** 2026-06-23 — Claude canlı DB + kod + ekran görüntüsü seviyesinde inceledi.
> **5 yeni not (06-23).** Not 1 + Not 2 Claude tarafından **doğrudan yapıldı** (küçük + kök neden net). Not 3, 4, 5 Codex'e.

---

## 0. Verilmiş Kararlar (kullanıcı onayladı)

| Karar | İçerik |
|-------|--------|
| **P1** | Üretim Parti = tek bir "Üretime Aktar" işleminde birlikte aktarılan emirler. Numara `UP-2026-0001` (yıl + sıfır dolgulu artan). |
| **P2** | Sipariş + manuel birlikte aynı partiye girer (karışık tek parti). |
| **P3** | Parti numarası hem "Üretimleri Görüntüle" hem "Üretim Planla" ekranında gruplama başlığı. |
| **P4** | "Yarı Mamul İhtiyacı" bloğu → **"Makine ve Montaj Planlama"** olarak yeniden adlandırılır; her partinin altına ayrı blok; parti içindeki ortak yarı mamuller miktar toplanıp **tek satırda** gösterilir. |

**Hazır şema:** [205_uretim_parti.sql](backend/src/db/seed/sql/205_uretim_parti.sql) — `uretim_emirleri.parti_no varchar(32)`. **Claude canlıya uygular.** Yeni şema bununla yeterli.

---

## 1. ✅ Not 1 — Sevk emri düzenle: tarih alanı (Claude YAPTI)
- **Thread:** `19016380` · `/admin/sevkiyat`
- Düzenle modalına tarih (date) alanı eklendi; backend patch şeması + repo `tarih` set ediyor. → Deploy ile kapanacak.

## 2. ✅ Not 2 — Mobil sevkiyat / sevkiyatçı admin sekmelerini görüyor (Claude YAPTI)
- **Thread:** `328a72c8` · `/admin/sevkiyat`
- **Kök neden:** Sevkiyatçı kullanıcının rolü DB'de `sevkiyatci`; tab gating sadece `'nakliyeci'` kontrol ediyordu → admin sekmelerini görüyordu. `isNakliyeciOnly` artık her iki rolü kapsıyor. → Deploy ile kapanacak.

---

## 3. ✅ Not 3 — Günlük üretim kaydı düzenleme (Codex)
- **Thread:** `37515015` · `/admin/vardiya-analizi`
- **Sorun:** Üretim kaydı satırındaki "Düzenle" butonu `toast.info("...endpoint'i henüz yok")` gösteriyor ([vardiya-analizi-client.tsx](admin_panel/src/app/(main)/admin/vardiya-analizi/_components/vardiya-analizi-client.tsx) satır ~728 `onEditUretim`).
- **Kapanış notu:**
  1. **Backend:** `operator_gunluk_kayitlari` için PATCH endpoint — net/ek üretim miktarı, fire, notlar düzenlenebilsin. Stok etkisi varsa (üretilen değişiyorsa) ilgili `hareketler`/`urunler.stok` farkı yeniden hesaplanmalı (dikkatli — V3-B1'deki yan-adım izolasyon kalıbını kullan). Admin yetkisiyle.
  2. **Frontend:** `onEditUretim` placeholder yerine gerçek düzenleme modalı (net üretim, fire, notlar) → PATCH çağrısı + tablo invalidation.
- **Kabul:** Düzenle → değerler güncellenir, vardiya analizi yeniden hesaplanır, stok tutarlı kalır.
- **Codex durum:** Uygulanmış. Backend `PATCH /admin/operator/gunluk-giris/:id` ve `repoUpdateGunlukUretimKaydi`; frontend gerçek düzenleme modalı + `useUpdateGunlukUretimKaydiAdminMutation`.

## 4. ✅ Not 4 — Vardiya Analizi gruplanmış gösterim (Codex)
- **Thread:** `1f5491ba` · `/admin/vardiya-analizi` · ekran: `Vardiya_bilgileri_gruplanmis.png`
- **İstek:** Ekran görüntüsündeki gibi **makine → vardiya → üretim kaydı** iç içe gruplanmış gösterim:
  - Her makine bir blok başlığı: Makine adı + özet (Net Üretim / Fire / Duruş Sayısı / Toplam Duruş / Net Çalışma Süresi / OEE).
  - Makine bloğunun altında üretim kayıtları **vardiya bazında** gruplu (Gündüz Vardiyası / Gece Vardiyası), her grubun sonunda **vardiya toplamı** (Net, Fire).
  - Her üretim satırında: Vardiya / Tarih-Saat (başlangıç-bitiş) / Ürün / Operasyon / Net / Fire / Verimlilik / Operatör / **Düzenle** (Not 3 ile aynı).
  - **İlk açılış:** son iki vardiya (bugün gündüzdeysek: dün gündüz + dün gece) bu formatta gelir; filtre değişince aynı format korunur.
  - **Duruşlar** ayrı blok olarak en altta (mevcut haliyle kalır).
- **Kapanış notu:** V5-4 verisi iç içe layout'a göre düzenlendi; makine/vardiya blokları ve toplamlar frontend'de gruplandı.
- **Kabul:** Ekran görüntüsündeki gruplama; ilk açılış son 2 vardiya; duruşlar altta.
- **Codex durum:** Uygulanmış. Vardiya analizi makine → vardiya → üretim kaydı şeklinde gruplanıyor; her vardiyada toplam satırı ve altta duruş/duruş özeti bulunuyor.

## 5. ✅ Not 5 — Siparişten üretime aktar + Üretim Partisi (Codex — BÜYÜK)
- **Thread:** `f0ae5bd0` · `/admin/uretim-emirleri` · ekran: `Uretim_Planlama.png`
- **Kararlar P1-P4 + şema 205 hazır.**
- **Kapanış notu:**
  1. **Üretime aktar 0 filtre:** "Üretime aktarılacak miktar = 0" olan satırlar listede gösterilmesin.
  2. **Modal'a taşı:** "Yeni Üretim Oluştur" bloğu üst kısımdan **açılır pencereye (modal)** taşınır. Satırlar seçilip aktarıldığında pencere kapanır.
  3. **Manuel Üretim Ekle aktif:** Butonla **yalnızca seçilen gruba ait** mamuller listelenir; kullanıcı sadece o gruptan manuel üretim ekler. (Sipariş + manuel **aynı partiye** girer — P2.)
  4. **Üretim Partisi (P1):** Aktarılan emirler (sipariş+manuel) tek `parti_no` (UP-YYYY-NNNN) alır. Backend `uretime-aktar` endpoint'i: aktarımda yeni parti_no üretir, tüm oluşan emirlere yazar. Numara üretimi `emir_no` kalıbındaki gibi (yıl + artan sıra).
  5. **Gruplama (P3):** Hem "Üretimleri Görüntüle" hem "Üretim Planla" ekranında emirler **parti_no'ya göre gruplu** gösterilir (parti başlığı + altında o partinin emirleri).
  6. **"Makine ve Montaj Planlama" bloğu (P4):** "Yarı Mamul İhtiyacı" adı değişir; **her partinin altında** ayrı blok. Parti içindeki **ortak yarı mamuller miktar toplanıp tek satırda** (V5-3'teki ara-mamul-id toplama mantığı, parti kapsamında). Parça bazlı makine + montaj seçimi (mevcut `uretim_emri_operasyonlari`).
- **Kabul:** Aktarım modal'dan yapılır → emirler parti numarasıyla gruplanır → her parti altında Makine ve Montaj Planlama (ortak yarı mamul toplanmış) → manuel ekleme aynı partiye girer.
- **Codex durum:** Uygulanmış. Aktarım modal'a taşındı; manuel+sipariş aynı partiye giriyor; `parti_no` üretilip ekranlar parti bazında gruplanıyor; her parti altında Makine ve Montaj Planlama bloğu var.

---

## 6. Genel Kurallar (Codex)
- Sıra: **Not 3 → Not 4 → Not 5.** (3+4 aynı sayfa/aynı düzenle modalı — birlikte; 5 büyük, ayrı.)
- **ALTER yasak.** Şema yalnızca [205_uretim_parti.sql](backend/src/db/seed/sql/205_uretim_parti.sql) (Claude uygular). Ek şema gerekirse DUR, sor.
- Her madde ayrı commit (`feat(...)/fix(...) (V6-N)`). Her madde sonu build: backend `bun run build` + admin `tsc --noEmit`; sonda admin `bun run build`.
- **Push etme** — bitince Claude'a haber ver (seed uygula + review + deploy + thread kapatma Claude'da).

## 7. Tamamlama
| # | Konu | Sayfa | Durum |
|---|------|-------|-------|
| Not 1 | Sevk emri düzenle tarih | sevkiyat | ✅ Claude yaptı |
| Not 2 | Sevkiyatçı rol bug | sevkiyat | ✅ Claude yaptı |
| Not 3 | Günlük üretim düzenle endpoint | vardiya-analizi | ☑ Codex |
| Not 4 | Vardiya gruplanmış gösterim | vardiya-analizi | ☑ Codex |
| Not 5 | Üretim partisi + aktar modal | uretim-emirleri | ☑ Codex |
