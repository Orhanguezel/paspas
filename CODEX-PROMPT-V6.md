# Codex Prompt — Paspas ERP V6

Aşağıdaki içeriği olduğu gibi Codex'e ver.

---

## 🤖 GÖREV — Codex'e

Paspas ERP'de 5 yeni yazılımcı notu vardı. **Not 1 + Not 2 Claude tarafından yapıldı.** Sana kalan **Not 3, 4, 5**. Detay + kararlar:
👉 **[CEKLIST-V6.md](./CEKLIST-V6.md)** — Bölüm 0 (kararlar P1-P4), Bölüm 3/4/5.

### Önce oku
1. **CEKLIST-V6.md** — özellikle Bölüm 0 (kararlar) + 3/4/5.
2. **backend/CLAUDE.md** + **admin_panel/CLAUDE.md**.

### Şema
- Hazır: [205_uretim_parti.sql](backend/src/db/seed/sql/205_uretim_parti.sql) (`uretim_emirleri.parti_no varchar(32)`). **Claude canlıya uygular.** Sen yalnızca Drizzle şema + kod tarafını bu kolona göre güncelle.
- **ALTER yasak.** Ek şema gerekirse DUR, Claude'a sor.

### Sıra: Not 3 → Not 4 → Not 5

### Not 3 — Günlük üretim kaydı düzenleme (`/admin/vardiya-analizi`)
- Şu an [vardiya-analizi-client.tsx](admin_panel/src/app/(main)/admin/vardiya-analizi/_components/vardiya-analizi-client.tsx) `onEditUretim` → `toast.info("...endpoint'i henüz yok")`.
- **Backend:** `operator_gunluk_kayitlari` PATCH endpoint (net/ek üretim, fire, notlar). Üretilen miktar değişirse stok/hareket farkını yeniden hesapla — **V3-B1'deki `runNonBlockingStep` yan-adım izolasyon kalıbını** kullan, ana kaydı bozma. Admin yetkisi.
- **Frontend:** Gerçek düzenleme modalı + PATCH + tablo invalidation.

### Not 4 — Vardiya Analizi gruplanmış gösterim (`/admin/vardiya-analizi`, ekran `Vardiya_bilgileri_gruplanmis.png`)
- **Makine → vardiya → kayıt** iç içe gruplama:
  - Makine bloğu başlığı + özet (Net Üretim / Fire / Duruş Sayısı / Toplam Duruş / Net Çalışma Süresi / OEE).
  - Altında üretim kayıtları **vardiya bazlı** gruplu (Gündüz/Gece) + her grup sonunda vardiya toplamı.
  - Satır: Vardiya / Tarih-Saat (başlangıç-bitiş) / Ürün / Operasyon / Net / Fire / Verimlilik / Operatör / **Düzenle** (Not 3 modalı).
  - İlk açılış: son 2 vardiya bu formatta; filtre değişince format korunur.
  - **Duruşlar** ayrı blok, en altta (mevcut haliyle).
- Backend zaten makine + vardiya + OEE veriyor (V5-4); gruplama ağırlıklı frontend. Eksik agregasyon varsa ekle.

### Not 5 — Siparişten üretime aktar + Üretim Partisi (BÜYÜK, `/admin/uretim-emirleri`, ekran `Uretim_Planlama.png`)
Kararlar (CEKLIST Bölüm 0): P1 parti=tek aktarım (UP-YYYY-NNNN), P2 sipariş+manuel aynı parti, P3 her iki ekranda parti gruplaması, P4 "Makine ve Montaj Planlama" bloğu parti altında + ortak yarı mamul tek satırda toplanır.
- **a)** "Üretime aktarılacak = 0" satırları gösterme.
- **b)** "Yeni Üretim Oluştur" bloğunu **modal**'a taşı; aktarınca kapanır.
- **c)** "Manuel Üretim Ekle" aktif — yalnızca seçilen grubun mamulleri; manuel + sipariş aynı partiye.
- **d)** `uretime-aktar` endpoint'i: aktarımda **yeni parti_no üret** (yıl+artan, `emir_no` kalıbı gibi), oluşan tüm emirlere yaz.
- **e)** "Üretimleri Görüntüle" + "Üretim Planla" → emirler **parti_no'ya göre gruplu** (parti başlığı + altında emirler).
- **f)** "Yarı Mamul İhtiyacı" → **"Makine ve Montaj Planlama"**; her partinin altında ayrı blok; parti içi ortak yarı mamuller **miktar toplanıp tek satır** (V5-3 ara-mamul-id toplama, parti kapsamında); parça bazlı makine+montaj (`uretim_emri_operasyonlari`).

### Kurallar
- Her madde ayrı commit. Her madde sonu build (backend `bun run build` + admin `tsc --noEmit`); sonda admin `bun run build`.
- **Push etme.** Bitince Claude'a haber ver. Belirsizlik olursa DUR ve sor.

## İlerleme raporu
```
[Codex] V6-Not3 tamam. Sıra: Not4. Build: OK.
```
Bitince:
```
[Codex] V6 (Not 3,4,5) tamamlandı. Build OK. Claude'a hazır.
```
