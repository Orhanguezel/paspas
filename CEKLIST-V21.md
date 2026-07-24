# Yazılımcı Notu V21 — Makine/operatör iş akışı: 3 yeni not (2026-07-23)

Kaynak: canlı `page_feedback_threads`, hepsi 2026-07-23, `status=open`. Bugün 2026-07-24 okundu,
her biri kod tabanında etki analizi yapıldı (implementasyon öncesi).

| R | Not ID | Konu | Sayfa | Durum |
|---|---|---|---|---|
| R1 | `f54e3a57` | Boş makineler ekranlarda görünsün | `/admin/is-yukler` + `/admin/operator` | Net, düşük risk |
| R2 | `78711e39` | Üretimi duraklatıp sıradakine geç | `/admin/operator` | Net, orta risk |
| R3 | `0500e5ad` | Makineler arası üretim aktarma (sürükle-bırak) | `/admin/is-yukler` | **Kullanıcı kararına bırakıldı** |

> **Not:** Bu üç not tamamen yeni davranış/özellik. V20'nin (inline üretim) hâlâ açık doğrulamaları
> aşağıda "Devreden" bölümünde. Öncelik: R1 → R2 → R3.

---

# 🟢 R1 — Boş (işsiz) makineler iş yükleri ve operatör ekranında görünmüyor

Kullanıcının kendi cümlesi (düzeltilmiş haliyle):

> Eğer bir makineye iş atanmamışsa, yani makine tamamen boş durumdaysa, o makineyi makine iş
> yükleri ekranında ve operatör ekranında göremiyoruz. Makine "Operatör ekranında görün" ve "Makine
> İş yüklerinde görün" olarak tanımlandıysa, herhangi bir iş yükü olmasa bile boş olarak bu
> ekranlarda görünsün.

## Kök neden (kanıtlı)

Gerekli flag'ler **zaten var** — şema değişikliği gerekmiyor:
- `makineler.operator_de_goster` (default 1) — `makine_havuzu/schema.ts:11`
- `makineler.is_yuklerinde_goster` (default 1) — `makine_havuzu/schema.ts:12`

Sorun: her iki liste de **`makine_kuyrugu` tablosundan başlıyor** (INNER JOIN makineler), yani kuyrukta
işi olmayan makine hiç satır üretmiyor:
- İş yükleri: `is_yukler/repository.ts:96` `selectQueue` → `.from(makineKuyrugu).innerJoin(makineler...)`.
  Filtre `is_yuklerinde_goster=1` var (`:188`) ama liste yine kuyruk-bazlı.
- Operatör: `operator/repository.ts:970` — `operator_de_goster=1` filtresi var ama aynı kuyruk-bazlı desen.

## VERİLMİŞ KARAR — R1

| Konu | Karar | Gerekçe |
|---|---|---|
| Yaklaşım | Liste yanıtına, görünür ama kuyrukta işi olmayan makineleri **"boş makine" olarak** ekle | Kuyruk-bazlı ana sorguyu bozmadan; büyük refactor yok |
| İş yükleri | `is_yukler` yanıtı: mevcut kuyruk satırları + `is_yuklerinde_goster=1` olup kuyrukta hiç aktif işi olmayan makineler (boş kart) | Kullanıcı boş makineyi görüp oraya iş atayabilmeli |
| Operatör | `operator` yanıtı: aynı mantık `operator_de_goster=1` ile | Aynı istek iki ekran için |
| Boş kartın içeriği | makine kod/ad + "iş yok" durumu; başlat/ata aksiyonu (varsa) aktif | Boş makineye iş atama akışı çalışsın |
| Sıralama | `gosterim_sira` (zaten var) ile | Mevcut alan |
| `durum='aktif'` mi | Yalnız `is_active=1` ve makine `durum` aktif olanlar (arızalı/pasif hariç) | Pasif makine boş kart olarak da görünmemeli |

### R1 görevleri

- [x] `is_yukler` repo/service: kuyrukta işi olmayan görünür makineleri boş satır olarak ekle
- [x] `operator` repo: aynı mantık `operator_de_goster` ile
- [x] DTO: boş makine kartını temsil edecek şekil (`bosMakine=true`, iş alanları boş)
- [x] Frontend is-yukler: boş makine kartı render + "iş yok" durumu
- [x] Frontend operator: boş makine kartı render
- [x] Test: `is_yuklerinde_goster=1` + kuyrukta iş yok → makine listede boş görünür
- [x] Test: `is_yuklerinde_goster=0` → görünmez (regresyon)

---

# 🟡 R2 — Üretimi duraklatıp sıradaki işe geçme, sonra yarım işe dönme

Kullanıcının kendi cümlesi:

> Bir üretim başlamış ve devam ediyorken, o üretimi duraklatıp sıradaki üretime devam etmek
> istiyoruz. Ancak şu anda "üretiliyor" durumda olan üretim bitmeden buna izin vermiyor. Şu anki
> üretimi durdurup sıradaki üretime devam edebilelim. Sonra yarım kalmış "duraklatıldı" durumundaki
> üretime devam edebilelim.

## Kök neden (kanıtlı)

İki katman engelliyor:
- **Backend:** `repoUretimBaslat` guard'ı — `operator/repository.ts:1254`:
  `inArray(makineKuyrugu.durum, ['calisiyor', 'duraklatildi'])` → makinede **duraklatılmış** iş varken
  bile yeni iş başlatmak `makinede_aktif_is_var` hatası veriyor.
- **Frontend:** `operator-client.tsx:421` — `activeJob` hem `calisiyor` hem `duraklatildi`'yı tek
  aktif iş sayıyor; `:603` `canStart` bu yüzden false, "Başlat" gizli.

## VERİLMİŞ KARAR — R2

| Konu | Karar | Gerekçe |
|---|---|---|
| Backend guard | Yeni iş başlatma engeli **yalnız `calisiyor`** olsun (duraklatildi çıkar) | Bir makinede aynı anda tek *çalışan* iş; birden çok *duraklatılmış* iş olabilir |
| Çoklu duraklatılmış iş | İzin verilir | Kullanıcının senaryosu bunu gerektiriyor (duraklat → başka → duraklat → …) |
| Frontend `activeJob` | İkiye ayır: `calisanJob` (tek) + `duraklatilmisJoblar` (liste) | Duraklatılmış işler ayrı gösterilmeli, "Başlat" çalışan yokken açık olmalı |
| "Devam et" seçimi | Kullanıcı hangi duraklatılmış işe döneceğini **seçer** (liste) | Şu an tek varsayıyor; artık liste |
| Başlatma önkoşulu | "Çalışan iş yoksa" sıradaki bekleyen başlatılabilir | Duraklatılmış iş varlığı engel olmamalı |
| Duruş kaydı | Mevcut `durusKayitlari` açık-duruş mantığı korunur (duraklatınca açılır, devam edince kapanır) | Bozulmamalı — her duraklatılmış işin kendi açık duruşu olur |

**Dikkat — kardeş etkiler:**
- `repoKalipDegisimBaslat` (`:2754`) aynı guard'ı kullanıyor — kalıp değişimi için `duraklatildi`
  engeli **korunmalı mı** ayrıca değerlendirilecek (muhtemelen evet: kalıp değişimi makineyi meşgul eder).
- Vardiya/günlük kayıt: birden çok duraklatılmış iş, `operator_gunluk_kayitlari` ilişkisini bozmamalı.

### R2 görevleri

- [x] `repoUretimBaslat` guard'ı yalnız `calisiyor`'a indirildi (`:1254`)
- [x] `repoKalipDegisimBaslat` guard'ı ayrıca gözden geçirildi; kalıp değişimi için `duraklatildi` engeli korundu
- [x] Frontend `activeJob` → çalışan iş + duraklatılmış işler ayrımı
- [x] Duraklatılmış işler listesi + her biri için "Devam Et" butonu
- [x] "Sıradaki işi başlat" çalışan iş yokken açık (duraklatılmış iş varlığından bağımsız)
- [x] Test/guard: çalışan işi duraklat → sıradakini başlat → ilkine devam et akışı destekleniyor
- [x] Test/guard: aynı makinede iki `calisiyor` backend tarafından engellenir

---

# 🔴 R3 — Makineler arası üretim aktarma (sürükle-bırak) — ✅ ONAYLANDI (2026-07-24)

> **Kullanıcı kararı (2026-07-24):** "Makine aktarmayı güvenli hale getirip açalım. Codex yapsın
> implementasyonu." → Detaylı brief: [`CODEX-PROMPT-V21-R3.md`](./CODEX-PROMPT-V21-R3.md). Codex bu
> brief'e göre implement edecek; deploy'u mimar (Claude) yapacak.

Kullanıcının kendi cümlesi:

> Makine iş yüklerinde, bir makineden diğerine üretim aktarmayı engellemiştik. Uygulamada bunun bir
> ihtiyaç olduğunu gördük. Makine1'deki üretim Makine2'ye sürükle bırak yöntemiyle aktarılabilsin.
> Burada kalıp-makine uygunluğu denetlensin. **Bu işlem güvenli bir işlem değilse, başka problemlere
> yol açacaksa yapmayabiliriz. Öncesinde nereleri etkilediğine bakalım.** Ayrıca burada yapılan
> makine değişikliği başka ekranlarda da güncellenmeli.

## Etki analizi — kullanıcının istediği "önce bakalım"

**Sürpriz bulgu:** Aktarma backend'de **zaten mevcut**. `is_yukler/repoUpdate` (`:234-317`) PATCH body'de
`makineId` gelince `movingBetweenMachines` yolunu çalıştırıyor: sıra yeniden düzenleniyor,
`uretim_emri_operasyonlari.makine_id` güncelleniyor, iki makine için de `recalcMakineKuyrukTarihleri`
çağrılıyor. Sürükle-bırak altyapısı da hazır (@dnd-kit, makine bazlı drop zone'lar).

**Tek engel frontend'de:** `is-yukleri-client.tsx:424-428` — makineler arası bırakma bir toast ile
kapatılmış. Bu blok kaldırılırsa backend isteği zaten işler.

**Diğer ekranlar otomatik güncellenir:** üretim emirleri, detay, operatör, gantt, vardiya analizi —
hepsi `makine_kuyrugu`/`makine_id`'den beslendiği için makine değişince doğru gösterir. Kullanıcının
"başka ekranlarda da güncellensin" isteği zaten karşılanıyor (recalc tarihleri de günceller).

### ⚠️ RİSKLER — bu yüzden "güvenli değilse yapmayalım" haklı bir çekince

| # | Risk | Durum |
|---|---|---|
| 1 | **Kalıp-makine uygunluk denetimi YOK** | `repoUpdate` aktarma yolu uygunluğa bakmıyor. Denetim yalnız `repoAtaOperasyon:416-432`'de var. Uyumsuz makineye taşımaya izin verir — **en kritik** |
| 2 | `montaj_makine_id` senkronu yok | Montaj operasyonu taşınırsa `montaj_makine_id` eski makinede kalır → tutarsızlık |
| 3 | Çalışan/tamamlanmış iş guard'ı sadece FE'de | Backend `repoUpdate` bunu engellemiyor; aktarma açılırsa backend'e de guard gerekir |
| 4 | Kardeş operasyon gruplaması yok | `repoAtaOperasyon` çift taraflı ürünlerde ops'ları yan yana koyuyor; `repoUpdate` bunu gözetmiyor |

**İyi haber:** Uygunluk verisi (`kalip_uyumlu_makineler` tablosu) ve denetim mantığı **zaten var** —
sadece aktarma yoluna bağlanması gerekiyor. Stok/rezervasyon aktarmadan **etkilenmiyor** (rezervasyon
emir yaşam döngüsüne bağlı, makineye değil — test `makine_is_yukleri.real.integration.test.ts:201`
bunu doğruluyor).

## ÖNERİ (karar kullanıcının)

Aktarma **güvenli şekilde açılabilir**, ama önce backend `repoUpdate` şu 3 korumayı kazanmalı:
1. Kalıp-makine uygunluk denetimi (mevcut `repoAtaOperasyon` mantığını aktarma yoluna taşı/paylaş)
2. `montaj_makine_id` senkronu (montaj operasyonu taşınırsa güncelle)
3. Çalışan/tamamlanmış iş guard'ı (backend'e taşı, sadece FE'de kalmasın)

Bunlar giderilmeden frontend engeli **kaldırılmamalı** — aksi halde uyumsuz makineye taşıma ve montaj
tutarsızlığı oluşur. İş küçük-orta (altyapı hazır, denetim mantığı mevcut, sadece bağlama).

### R3 görevleri (Codex — detay CODEX-PROMPT-V21-R3.md)

- [x] **KARAR: Kullanıcı onayı** — güvenli hale getirip açalım (2026-07-24)
- [x] Ortak `assertKalipMakineUyumlu` fonksiyonu (`_shared/kalip-makine.ts`); `repoAtaOperasyon` buna bağlandı (davranış aynı)
- [x] `is_yukler/repoUpdate` aktarma yoluna kalıp-makine uygunluk denetimi eklendi
- [x] `montaj_makine_id` senkronu (montaj operasyonu taşınırsa)
- [x] Çalışan/tamamlanmış iş guard'ı backend'e taşındı
- [x] Frontend `is-yukleri-client.tsx:424-428` engeli kaldırıldı
- [x] Frontend: uyumsuz makineye bırakınca kullanıcıya net hata (backend `kalip_makine_uyumsuz`)
- [x] Test: uyumlu makineye taşıma çalışır; uyumsuza taşıma reddedilir; çalışan iş taşınamaz

---

## Devreden — V20 açık doğrulamaları (kod bitti, canlıda, teyit bekliyor)

| Not | Konu | Durum |
|---|---|---|
| `fd541ef6` | Vardiya çifti boş ekran | V20/R6 düzeltildi, canlıda — müşteri teyidi bekliyor |
| `66c593f3` | Inline (çift taraflı) üretim | V20/R1 düzeltildi, canlıda — gerçek üretim testi bekliyor |
| `10caa4b3` | Makineden çıkarma hatası | V19/R1 — canlıda, teyit bekliyor |
| `3536f365` | Üretim emirleri düzeltme ekranı | V19/R4 — kod hazır, canlıya alındı, teyit bekliyor |
| `fe149b76` | Günlük Üretim Girişi | V19/R3 — canlıda, teyit bekliyor |
| `83d7e393` | Vardiya çifti (eski) | V19/R2 + V20/R6 — canlıda, teyit bekliyor |

---

## Sıralama ve kapanış

1. **R1** (boş makine) — en net, düşük risk, şema hazır; tek başına deploy edilebilir
2. **R2** (duraklat/geç) — orta risk, durum makinesine dokunuyor; Megane/Tuna/inline üretim akışını bozmamalı
3. **R3** (makine aktarma) — **önce kullanıcı onayı**, sonra güvenli implementasyon

> **Codex için:** her R bloğundaki VERİLMİŞ KARAR bağlayıcıdır. R3'e kullanıcı onayı olmadan
> başlanmaz. `AGENTS.md` geçerli. Şu ana kadar hiçbir R şema değişikliği gerektirmiyor (flag'ler ve
> uygunluk tablosu zaten mevcut) — `ALTER` gerekmez.
