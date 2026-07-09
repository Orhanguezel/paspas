# Codex Prompt — Paspas ERP V5

Aşağıdaki içeriği olduğu gibi Codex'e ver.

---

## 🤖 GÖREV — Codex'e

Paspas ERP'de 5 yeni yazılımcı notu var. Claude hepsini canlı DB + kod + ekran görüntüsü seviyesinde inceledi ve **tüm kararları verdi** (admin'e sorulmadan, kanıta dayalı). Detay:
👉 **[CEKLIST-V5.md](./CEKLIST-V5.md)** — Bölüm 0a (7 verilmiş karar), 0b (bulgular), 1-4 (maddeler).

### Önce oku
1. **CEKLIST-V5.md** — özellikle **Bölüm 0a (VERİLMİŞ KARARLAR K1-K7)** — bunlar kesinleşmiş, sorgulamadan uygula.
2. **backend/CLAUDE.md** + **admin_panel/CLAUDE.md** — mimari, Select sentinel kuralı, i18n.

### Kritik: yeni şema GEREKMİYOR
- V5-3 yarı mamul hesabı → mevcut `receteler`/`recete_kalemleri` (operasyonel_ym kalemleri) üzerinden (K3, doğrulandı).
- V5-3 parça bazlı makine/montaj → mevcut `uretim_emri_operasyonlari.makine_id`/`montaj` (K4).
- V5-4 OEE/duruş/üretim → mevcut `operator_gunluk_kayitlari`, `durus_kayitlari`, `uretim_emri_operasyonlari.cevrim_suresi_sn`.
- **ALTER yasak.** Yeni şema ihtiyacı çıkarsa DUR, Claude'a sor.

### Sıralama
`V5-1 → V5-4 → V5-2+V5-3 (birlikte)`. (V5-1 küçük/risksiz; V5-4 bağımsız; V5-2+V5-3 aynı veri modeli, birlikte — K7.)

---

### V5-1 — Sevk Emirleri: çift durum filtresi + düzenle (`7aa50d78`)
- **Dosya:** [sevkiyat-client.tsx](admin_panel/src/app/(main)/admin/sevkiyat/_components/sevkiyat-client.tsx) (durumFilter ~satır 694, Select ~733).
- **Yap:**
  1. Sevk Emirleri durum filtresine **"Bekliyor + Onaylı" (aktif)** default seçeneği ekle. Bu seçiliyken liste hem `bekliyor` hem `onaylandi` gösterir (endpoint'i durum filtresiz çağırıp client'ta bu ikisine indir, ya da iki durumu birleştir). Tekil durum seçenekleri (bekliyor/onaylandı/sevk_edildi/iptal) kalsın.
  2. İşlem sütununa **"Düzenle"** butonu — **her durumda** (bekliyor/onaylandı/sevk_edildi/iptal) sevk emri düzenlenebilsin: miktar + durum değiştir. Mevcut `useUpdateSevkEmriAdminMutation` (PATCH `durum`+`miktar`) kullanılır. Backend `sevkEmriPatchSchema` zaten durum enum + miktar alıyor; eğer repo'da durum-geçiş kısıtı varsa admin için gevşet (admin her düzeltmeyi yapabilir).
- **Kabul:** İlk açılış bekliyor+onaylı; her durumdaki emir düzenlenebiliyor.

### V5-4 — Vardiya Analizi yeniden tasarım (`3ae2c3e4` + `97693ac4`)
- **Dosyalar:** `backend/src/modules/vardiya_analizi/` (service/validation/controller), `admin_panel/.../vardiya-analizi/`.
- **Backend:**
  - Filtreleri **çoklu seçim**'e çıkar: `vardiyaTipi[]` (gunduz/gece), `makineId[]` (validation single → array). Tarih tek veya aralık.
  - **Makine Bazlı Özet** agregasyonu: makine / net üretim / fire / duruş sayısı / toplam duruş.
  - **Duruş Özeti** agregasyonu: duruş nedeni / adet / toplam süre.
  - **OEE (K5):** mevcut `availability × 0.95` (service ~753-755) yerine tam formül: **OEE = Kullanılabilirlik × Performans × Kalite**. Kullanılabilirlik=çalışma/planlanan; Kalite=net/(net+fire); Performans=(üretim×çevrim_sn)/(çalışma_sn) [çevrim yoksa 1.0]. Bileşen girdisi yoksa null → UI "—".
  - **Verimlilik (K6):** satır bazında net / teorik (teorik=süre_sn/çevrim_sn); çevrim yoksa null.
  - Üretim kayıtlarında **net=0 satırları döndürme** (veya flag'le, UI gizler).
- **Frontend (ekran: `Uretim_Kayitlari_Ekrani.png`, `Ornek_uretim_tabloso.png`):**
  - **Varsayılan açılış:** Tarih=**Dün**, Görünüm=**Vardiya Bazlı**; bugünkü vardiya + dün gündüz + dün gece birlikte.
  - **Üst özet kutuları:** Net Üretim / Fire / Çalışma Süresi / Duruş Süresi / Duruş Sayısı / OEE.
  - **Makine Bazlı Özet tablosu** (kutuların altında — yöneticinin ilk bakacağı yer).
  - **Üretim Kayıtları:** net=0 gizli; tarih/saat = başlangıç+bitiş; her satıra **"Düzenle"** butonu (operatör hatalı veri → admin düzeltir; günlük üretim kaydı PATCH'i — yoksa Claude'a bildir). Kolonlar: Vardiya/Tarih-Saat/Ürün/Operasyon/Net/Fire/Verimlilik/Operatör.
  - **Vardiya Toplamları** (her vardiya sonu özet satırı), **Duruşlar** tablosu, **Duruş Özeti** tablosu.
  - **Çoklu seçim** filtreler (vardiya, makine — Makine 1+2 default).
  - Sıralama: özetler → makine özet → üretim kayıtları → duruş detayları.

### V5-2 + V5-3 — Üretim Oluştur + Üretim Planlama (`2ec48428` + `23e74239`) — BİRLİKTE (K7)
- **Ekranlar:** `Yeni_Uretim_Emri.png` (V5-2 grid), `Uretim_emirleri_revize_ekrani.png` (V5-3 iki sekme).
- **V5-3 — Üretim Emirleri 2 sekme:**
  - **"Üretimleri Görüntüle":** salt-okunur, ürün grubuna göre gruplu, **görsel YOK**, düzenle/sil/makine-ata/çıkar **YOK**. İlerleme+gerçekleşen üretim. (Mevcut [uretim-emirleri-client.tsx](admin_panel/src/app/(main)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx) revize.)
  - **"Üretim Planla":** düzenle/sil burada, görsel YOK, gruplu. Her grup 2 bölüm:
    - **A. Mamul Planı:** Emir No/Müşteri/Mamul/Planlanan Miktar/Düzenle/Sil. Düzenle→miktar değişir+kaydet. **"Yeni Üretim Satırı Ekle"** (yalnız aynı ürün grubundan): (1) açık satış siparişinden seç, (2) manuel ekle.
    - **B. Yarı Mamul İhtiyacı (K3 — otomatik):** mamul reçetesindeki `operasyonel_ym` kalemleri × planlanan, **ara mamul id'ye göre toplanır** (ortak ara mamul tek satır, örn. Sağ Ara Mamul 3000+1500=4500). Mamul miktarı değişince **anında güncellenir**. Alanlar: Yarı Mamul Adı/Miktar/**Makine**/**Montaj(Yes/No)** — parça bazlı düzenlenebilir (mevcut `uretim_emri_operasyonlari.makine_id`/`montaj`, K4). Toplu güncelleme endpoint'i ekle.
- **V5-2 — Yeni Üretim Oluştur grid'i (`Yeni_Uretim_Emri.png`):**
  - Ürün Grubu seç → sipariş kalemleri grid: Seç/Sipariş No/Müşteri/Ürün/Sipariş Miktarı/Daha Önce Üretilen/**Kalan**/Üretime Aktarılacak (input) + **Manuel Üretim Ekle** + **Üretime Aktar**.
  - "Üretime Aktar"da **default makine ataması (K1):** çift taraflı sağ→`Enjeksiyon 1`, sol→`Enjeksiyon 2`; tek taraflı→`Enjeksiyon 1`. Default atanır, planla ekranından değiştirilebilir.
  - Mevcut `uretime-aktar` endpoint'i ([satis_siparisleri/router.ts](backend/src/modules/satis_siparisleri/router.ts) satır 22) genişletilir (default makine ataması).
  - Artifact'taki "üretim planla" sekmesi BU değil — o V5-3.

---

## Kurallar
- **Her madde ayrı commit:** `feat(sevkiyat): ... (V5-1)` formatı.
- Her madde sonunda build: `cd backend && bun run build` + `cd admin_panel && bun x tsc --noEmit`. Tümü bitince admin `bun run build`.
- **ALTER/yeni şema YOK** (gerekirse DUR, sor). **Push etme** — bitince Claude'a haber ver (review + deploy + thread kapatma Claude'da).
- Belirsizlik olursa DUR ve sor.

## İlerleme raporu
```
[Codex] V5-1 tamam. Sıra: V5-4. Build: OK.
```
Bitince:
```
[Codex] V5 toplam 4 madde tamamlandı (V5-1, V5-4, V5-2+V5-3). Build OK. Claude'a hazır.
```
