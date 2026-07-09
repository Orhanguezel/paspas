# Yazılımcı Notu V5 — Açık İşler Çeklisti (Derin İnceleme)

> **İnceleme tarihi:** 2026-06-21 — Claude canlı DB + kod + ekran görüntüsü seviyesinde inceledi.
> **Yeni batch:** 5 yeni not (06-21) + 2 devreden. İçinde **2 büyük yeniden tasarım** var (Üretim Planlama + Vardiya Analizi).
> **Sistem durumu:** Aktif hata yok. Thread: 60 resolved.

---

## 0. Devreden / Temizlik

| Thread | Durum | Aksiyon |
|--------|-------|---------|
| `921c13ac` Makineler arası aktarım | `in_review` ama kendi yorumunda **2026-05-07'de ÇÖZÜLDÜ** (commit 78bd1eb) yazıyor — takılı kalmış | ✅ Claude: `resolved` yap (zaten çözülü) |
| `56d703b1` Yükle/Sevket | `needs_info` idi — kararlar V4-3 D1-D7 ile verildi | ✅ Codex tamamladı, Claude canlı doğrular |

---

## 0a. VERİLMİŞ KARARLAR (admin'e sormadan, kanıta dayalı — Codex bunlarla ilerler)

> Kullanıcı talebi: admine sormadan en mantıklı yolu seç. Aşağıdaki kararlar canlı DB + mevcut kod doğrulamasıyla verildi.

| Karar | İçerik + Gerekçe |
|-------|------------------|
| **K1 — V5-2 makine eşlemesi** | Çift taraflı: **Sağ → `Enjeksiyon 1`** (kod, "900 T ÖN"), **Sol → `Enjeksiyon 2`** (kod, "900 T ARKA"). Tek taraflı: **`Enjeksiyon 1`**. *Gerekçe:* makineler ÖN=Enj1 / ARKA=Enj2 (G1); admin "ARKA" derken kod olarak Enjeksiyon 2'yi kastediyor. Default atanır, **V5-3 planla ekranından değiştirilebilir**. |
| **K2 — V5-2 ekranın yeri** | Yeni "Üretim Oluştur" grid'i mevcut **üretime-aktar akışının iyileştirilmiş hali** olur (birincil üretim oluşturma yolu). *Gerekçe:* ekran görüntüsü bu grid'i gösteriyor, mevcut endpoint zaten var. Eski basit "Yeni Emir" formu kaldırılmaz ama bu grid öne çıkar. |
| **K3 — V5-3 yarı mamul hesabı** | Yarı mamul ihtiyacı = **mamul reçetesindeki `operasyonel_ym` kalemleri × planlanan miktar**, **ara mamul id'ye göre toplanır**. *Gerekçe (DOĞRULANDI):* reçete yapısı bunu birebir tutuyor; ortak ara mamul `1110 101-R "Max-Pro Sağ"` Maximum+Profesyonel mamullerde paylaşılıyor → admin'in 4500=3000+1500 örneğiyle bire bir uyuyor. **Yeni şema GEREKMEZ.** |
| **K4 — V5-3 parça bazlı makine/montaj** | Mevcut `uretim_emri_operasyonlari` (`makine_id`, `montaj`) alanları kullanılır. **Yeni şema YOK**; yalnızca toplu düzenleme endpoint'i eklenir. |
| **K5 — V5-4 OEE** | Mevcut basitleştirilmiş OEE (`availability × 0.95`, service satır 753-755) **tam standart formüle** yükseltilir: **OEE = Kullanılabilirlik × Performans × Kalite**. Kullanılabilirlik = çalışma/planlanan; Kalite = net/(net+fire); Performans = (üretim × çevrim_sn)/(çalışma_sn), çevrim yoksa 1.0 varsay. Bileşen girdisi tamamen yoksa "—". *Gerekçe:* fire + çevrim verisi mevcut (doğrulandı), placeholder yerine gerçek değer. |
| **K6 — V5-4 Verimlilik (satır)** | Verimlilik = **net üretim / teorik kapasite**, teorik = (süre_sn / çevrim_sn). Çevrim yoksa "—". *Gerekçe:* tek anlamlı per-satır verimlilik tanımı; çevrim verisi var. |
| **K7 — V5-2 ↔ V5-3 birlikte** | İki ekran aynı üretim verisine dokunduğu için **tek iş paketi** olarak Codex'e verilir (önce V5-3 veri modeli/hesap, sonra V5-2 grid). |

---

## 0b. Claude'un İnceleme Bulguları

| Bulgu | Detay |
|-------|-------|
| G1 | **Makine adları:** `Enjeksiyon 1` = "900 T (**ÖN**)", `Enjeksiyon 2` = "900 T (**ARKA**)". V5-2'deki "sağ→Enj1 ÖN, sol→Enj1 ARKA" ifadesinde ARKA makinesi aslında **Enjeksiyon 2** (kod). Yani: **Sağ → `Enjeksiyon 1` (ÖN), Sol → `Enjeksiyon 2` (ARKA)**. (Doğrulanmalı — bkz. V5-2 karar.) |
| G2 | **vardiya_analizi backend** şu an yalnızca **tekli** `makineId` filtresi destekliyor ([validation.ts](backend/src/modules/vardiya_analizi/validation.ts)). Çoklu seçim (vardiya[], makine[]), makine bazlı özet, duruş özeti, OEE **yok** — eklenecek. |
| G3 | **uretim-emirleri-client** şu an ürün grubuna göre gruplamıyor; düz liste. V5-3'te 2 sekmeye bölünüp gruplanacak. `uretime-aktar` endpoint'i mevcut ([satis_siparisleri/router.ts](backend/src/modules/satis_siparisleri/router.ts) satır 22). |
| G4 | **V5-2 ↔ V5-3 ilişkisi:** V5-2 (Yeni Üretim Oluştur) = siparişten üretime aktarma grid'i (ekran: `Yeni_Uretim_Emri.png`). V5-3 (Üretim Planla) = mamul planı + yarı mamul ihtiyacı düzenleme ekranı (ekran: `Uretim_emirleri_revize_ekrani.png`). İkisi farklı ekran ama aynı "üretim emri" verisine dokunuyor — **birlikte tasarlanmalı**. |
| G5 | **V5-4 ↔ V5-5 aynı ekran:** `3ae2c3e4` (Vardiya Analizi revize) ana spec, `97693ac4` (Örnek Tablo) onun üretim tablosu formatı + satır "düzenle" butonu. Tek iş olarak ele alınır. |

---

## 1. ✅ V5-1 — Sevk Emirleri: çift durum filtresi + düzenle (KÜÇÜK, NET)

- **Not:** `7aa50d78` (06-21) · `/admin/sevkiyat`
- **İstek:**
  1. Sevk Emirleri sekmesi ilk açılışta artık "bekliyor" geliyor (V3-U2 yapıldı). Şimdi **çift seçim**: hem "bekliyor" hem "onaylandı" birlikte görünebilsin (çoklu durum filtresi).
  2. İşlem sütununa **"Düzenle"** butonu — durum ne olursa olsun (bekliyor/onaylandı/sevk_edildi/iptal) admin sevk emrini düzenleyebilsin (operatör/admin hatalı girişi düzeltmek için).
- **Kapanış notu:**
  - Sevk emirleri durum filtresini çoklu-seçime çevir (bekliyor + onaylandı default seçili).
  - Her satıra Düzenle → sevk emri düzenleme modalı (miktar, durum, vb.). Backend PATCH `/admin/sevkiyat/...` durum geçiş kısıtı gevşetilsin (admin her durumu düzeltebilir).
- **Kabul kriteri:** İlk açılışta bekliyor+onaylandı görünür; herhangi bir durumdaki sevk emri düzenlenebilir.
- [x] Tamamlandı
- **Codex durum:** `aktif` filtresi bekliyor+onaylı gösteriyor; admin için düzenleme modalı miktar/durum/tarih patch ediyor.

---

## 2. ✅ V5-2 — Yeni Üretim Oluştur ekranı + default makine ataması (ORTA — V7 ile revize)

- **Not:** `2ec48428` (06-21) · `/admin/uretim-emirleri` · ekran: `Yeni_Uretim_Emri.png` + artifact linki
- **İstek:**
  - Verilen Claude artifact'ı ile **birebir aynı** yeni üretim ekranı (ekran görüntüsü: Ürün Grubu seçimi → sipariş kalemleri grid'i: Seç / Sipariş No / Müşteri / Ürün / Sipariş Miktarı / Daha Önce Üretilen / Kalan / Üretime Aktarılacak + "Manuel Üretim Ekle" + "Üretime Aktar").
  - Artifact'taki **"üretim planla" sekmesi DİKKATE ALINMAYACAK** (o V5-3'te).
  - **Default makine ataması bu aşamada otomatik:**
    - Çift taraflı: **sağ → Enjeksiyon 1 (ÖN)**, **sol → Enjeksiyon 2 (ARKA)** (G1 — makine kodları doğrulanmalı).
    - Tek taraflı: **Enjeksiyon 1 (ÖN)**.
- **❓ Karar/Doğrulama gerekiyor:**
  1. Makine eşlemesi G1'e göre doğru mu? (Sağ→`Enjeksiyon 1`, Sol→`Enjeksiyon 2`) — admin "Enjeksiyon 1 (ARKA)" yazmış ama ARKA makinesi kod olarak `Enjeksiyon 2`. **Teyit.**
  2. Bu ekran mevcut "Yeni Emir" formunun **yerini mi alıyor**, yoksa ek bir ekran mı? (Önerim: mevcut üretime-aktar akışını bu grid'le değiştir.)
  3. Default atama **kesin mi** yoksa kullanıcı sonradan değiştirebilir mi? (Önerim: default atanır, V5-3 planla ekranından değiştirilebilir.)
- **Kapanış notu:** Grid ekranı uygulandı; V7 revizyonuyla default makine ataması kaldırılıp atama Makine ve Montaj Planlama bloğuna taşındı.
- [x] Tamamlandı
- **Codex durum:** Üretim oluşturma grid/modal akışı uygulanmış. Not: V7'de default otomatik makine ataması kaldırıldı; yeni emirler Atanmamış doğuyor ve atama Makine ve Montaj Planlama bloğundan yapılıyor.

---

## 3. ✅ V5-3 — Üretim Planlama Ekranı (BÜYÜK YENİDEN TASARIM)

- **Not:** `23e74239` (06-21) · `/admin/uretim-emirleri` · ekran: `Uretim_emirleri_revize_ekrani.png`
- **İstek:** Üretim Emirleri ekranı **iki sekmeye** bölünür:

### 3a — "Üretimleri Görüntüle" (salt-okunur takip)
  - İlerleme, gerçekleşen üretimler — mevcut üretim emirleri ekranının revize hali.
  - Düzenle / Sil / Makine Ata / Makineden Çıkar butonları **YOK**.
  - Ürün görseli **YOK**.
  - Üretim emirleri **ürün grubuna göre gruplanmış** — ilk bakışta hangi grup altında ne var görünür (göze hitap eden başlıklar).

### 3b — "Üretim Planla" (planlama + revizyon)
  - Düzenle / Sil butonları **burada**. Ürün görseli **YOK**. Ürün grubuna göre gruplu.
  - Her ürün grubu **iki bölüm**:
    - **A. Mamul Planı:** Emir No / Müşteri / Mamul / Planlanan Miktar / Düzenle / Sil. Düzenle → planlanan miktar değiştirilip kaydedilir. Alttaki **"Yeni Üretim Satırı Ekle"** ile **aynı ürün grubundan** ürün eklenebilir (grup dışı seçilemez). İki kaynak: (1) açık satış siparişlerinden seç, (2) manuel üretim ekle.
    - **B. Yarı Mamul İhtiyacı:** Mamul planının altında, **otomatik hesaplanır**. Aynı yarı mamul birden çok mamulde kullanılıyorsa **tek satırda toplanır** (örn. ortak Sağ Ara Mamul → 3000+1500=4500). Mamul miktarı değişince **anında güncellenir**. Parça bazlı alanlar: Yarı Mamul Adı / Miktar / **Makine** / **Montaj (Yes/No)** — makine ve montaj **parça bazında düzenlenebilir** (örn. Sağ→Makine 1, Sol→Makine 2; Sağ montaj Yes, Sol No).
- **❓ Karar/Şema gerekiyor:**
  1. **Yarı mamul ihtiyacı toplama mantığı:** Hangi reçete/operasyon yapısından hesaplanacak? (Mamul reçetesindeki operasyonel YM'ler → miktar × planlanan). Mevcut reçete yapısı bunu destekliyor mu, yoksa yeni hesap servisi mi gerekiyor? **Claude inceleyip şema/servis kontratı yazacak.**
  2. **Parça bazlı makine+montaj** zaten `uretim_emri_operasyonlari` (makine_id, montaj) ile tutuluyor — yeni şema gerekmeyebilir, ama planla ekranı bu alanları toplu düzenleyecek bir endpoint ister.
  3. Bu ekran V5-2 ile **aynı veri modelini** paylaşır — birlikte tasarlanmalı (G4).
- **Kapanış notu:** 2 sekme + gruplama + otomatik yarı mamul/parti yaklaşımı uygulandı; parça bazlı makine/montaj V6/V7 bloğuna taşındı.
- [x] Tamamlandı
- **Codex durum:** Üretimleri Görüntüle / Üretim Planla sekmeleri ve parti/mamul bazlı gruplama uygulanmış; parça bazlı makine+montaj düzenleme V6/V7 Makine ve Montaj Planlama bloğuna taşındı.

---

## 4. ✅ V5-4 — Vardiya Analizi Yeniden Tasarımı (BÜYÜK)

- **Notlar:** `3ae2c3e4` (ana spec) + `97693ac4` (üretim tablosu formatı + satır düzenle) · `/admin/vardiya-analizi` · ekranlar: `Uretim_Kayitlari_Ekrani.png`, `Ornek_uretim_tabloso.png`
- **İstek (özet — detay nottadır):**
  - **Varsayılan açılış:** Tarih=**Dün**, Görünüm=**Vardiya Bazlı**; Bugünkü vardiya + Dün Gündüz + Dün Gece birlikte gösterilir (son 2 vardiya + güncel).
  - **Filtreler:** Vardiya **çoklu seçim** (Gündüz/Gece/Tümü), Makine **çoklu seçim** (Makine 1 + 2 default seçili), Tarih (tek veya aralık).
  - **Üst özet kutuları:** Toplam Net Üretim, Toplam Fire, Toplam Çalışma Süresi, Toplam Duruş Süresi, Toplam Duruş Sayısı, **OEE** (varsa).
  - **Makine Bazlı Özet tablosu** (özet kutuların altında): Makine / Net Üretim / Fire / Duruş Sayısı / Toplam Duruş. *(Yöneticinin ilk bakacağı bölüm.)*
  - **Üretim Kayıtları:** Net üretimi **sıfır olan satırlar gizlensin**; tarih/saat alanına başlangıç+bitiş saati birlikte. Her satıra **"Düzenle" butonu** (operatör hatalı veri girince admin düzeltsin — `97693ac4`). Kolonlar: Vardiya / Tarih-Saat / Ürün / Operasyon / Net Üretim / Fire / Verimlilik / Operatör.
  - **Vardiya Toplamları:** Her vardiya sonunda özet satırı (Net Üretim, Fire).
  - **Duruşlar bölümü:** Makine / Başlangıç / Bitiş / Süre / Duruş Nedeni / Operatör.
  - **Duruş Özeti tablosu:** Duruş Nedeni / Adet / Toplam Süre (örn. Kalıp Değişimi 4 → 95dk).
  - **Sıralama:** Önce özetler → makine bazlı özet → üretim kayıtları → en altta duruş detayları.
- **❓ Karar gerekiyor:**
  1. **OEE formülü:** OEE = Kullanılabilirlik × Performans × Kalite. Bu üç bileşenin girdileri (planlanan süre, çalışma süresi, ideal çevrim, net/toplam üretim, fire) hangi alanlardan alınacak? **Admin'e: OEE'yi şimdilik basit mi (örn. net/(net+fire)×süre kullanımı) yoksa tam formülle mi istiyorsunuz?** (Veya "varsa göster" dediği için ilk fazda atlanabilir.)
  2. **Verimlilik** kolonu (üretim kayıtlarında) nasıl hesaplanacak? (örn. net / planlanan, veya net / (çevrim×süre)). Tanım gerek.
- **Kapanış notu:** Backend ve frontend yeni vardiya analizi akışı uygulandı; V7 ile veri doğruluğu ve verimlilik kolonları güçlendirildi.
- [x] Tamamlandı
- **Codex durum:** Çoklu filtreler, makine/duruş özetleri, OEE ve verimlilik hesapları uygulanmış; V7'de verimlilik iki ayrı oran olarak netleştirildi.

---

## 5. Özet & Öncelik

| # | Konu | Sayfa | Boyut | Durum |
|---|------|-------|-------|-------|
| V5-1 | Sevk emirleri çift filtre + düzenle | sevkiyat | Küçük | ✅ Tamamlandı |
| V5-2 | Yeni Üretim Oluştur + default makine | uretim-emirleri | Orta | ✅ Tamamlandı / V7 ile atama kararı revize |
| V5-3 | Üretim Planlama ekranı (2 sekme + yarı mamul) | uretim-emirleri | Büyük | ✅ Tamamlandı |
| V5-4 | Vardiya Analizi yeniden tasarım | vardiya-analizi | Büyük | ✅ Tamamlandı / V7 ile doğruluk revize |
| 921c13ac | (devreden — zaten çözülü) | is-yukler | — | ✅ Claude kapatır |
| 56d703b1 | (V4-3 — admin cevabı bekliyor) | sevkiyat | — | ⏸️ Beklemede |

**Durum:** V5 iş paketi tamamlandı; takip karar/değişiklikleri V6/V7 checklist'lerinde ele alındı.

## 6. Admin'e Sorulacaklar (özet — netleşmesi gerekenler)

1. **V5-2:** Çift taraflı default makine: Sağ → Enjeksiyon 1 (ÖN), Sol → Enjeksiyon 2 (ARKA) — doğru mu? Bu ekran mevcut "Yeni Emir"in yerini mi alıyor?
2. **V5-3:** Yarı mamul ihtiyacı, mamul reçetesindeki operasyonel YM'lerden mi hesaplanacak? (Mimari için kritik.)
3. **V5-4:** OEE ve "Verimlilik" kolonu nasıl hesaplansın? (Formül/girdi tanımı — veya ilk fazda OEE atlansın mı?)

> Bu 3 soru netleşince: V5-1 hemen Codex'e gider; V5-3 ve V5-4 için Claude şema/hesap kontratı yazıp Codex'e verir.
