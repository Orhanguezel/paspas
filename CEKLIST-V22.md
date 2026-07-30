# Yazılımcı Notu V22 — Operatör: vardiya 3. seçenek + veri girişi geri alma

Kaynak: canlı `page_feedback_threads`, 2026-07-30, yazan **Hidayet Taşdöven**, ikisi de `/admin/operator`,
`status=open`. Bugün okundu, her not kod tabanında etki analizinden geçirildi.

| R | Not ID | Konu | Risk |
|---|---|---|---|
| R1 | `24d8882e` | Günlük girişte 3. seçenek = mevcut vardiya, default; bitir/duraklat/devam dahil | Düşük |
| R2 | `cfd0b8f2` | Son veri girişini 1 kez geri al; günlük/bitir/duraklat ekranlarında | **Yüksek (bitir)** |

> Öncelik: R1 (küçük, net) → R2 (dikkatli, stok tutarlılığı). Teklif/CRM modülü bu çeklistin dışında.

---

# 🟢 R1 — Günlük üretim girişinde 3. seçenek: içinde bulunulan vardiya

Kullanıcının kendi cümlesi:

> Operatör ekranında günlük üretim girişi yaparken sadece 2 seçenek geliyor (geçtiğimiz iki vardiya).
> Üçüncü seçenek olarak şu an içinde bulunduğumuz vardiya da gelmeli — toplam 3 seçenek. Mevcut
> vardiya **default** gelsin; kullanıcı geçmiş iki vardiyadan birini de seçebilsin. Aynı düzenleme
> üretimi bitir ve duraklat butonlarındaki veri girişinde de geçerli.

## Kök neden (kanıtlı)

Operatör vardiya seçenekleri `VardiyaSecici` bileşenine `options` prop'undan geliyor
(`operator/_components/vardiya-secici.tsx`). Seçenekler backend `repoGetAcikVardiyalar` →
`sonVardiyalar` alanından, `vardiya_kayitlari`'ndan `baslangic DESC` sırayla çekiliyor:
- **Makine başına 2 ile sınırlanmış:** `operator/repository.ts:2546` → `if (list.length >= 2) continue;`
- Açık/aktif vardiya (`acikVardiyaId`, `bitis IS NULL`) bilgisi zaten mevcut (`repository.ts:2507-2517`).
- Default seçim mantığı **zaten** açık vardiyayı seçiyor (`vardiya-secici.tsx:33-38`: `id===acikVardiyaId`).

**Tek eksik:** aktif vardiya `sonVardiyalar` listesine dahil değil. Cap 2 olduğu ve açık vardiya
garanti eklenmediği için, mevcut vardiya seçeneklerde görünmüyor → default de gösterilemiyor.

VardiyaSecici **dört akışta da aynı** kullanılıyor (bitir/günlük/duraklat/devam — `operator-client.tsx:686,735,798,853`).
Yani tek backend düzeltmesi dördünü birden çözer.

## VERİLMİŞ KARAR — R1

| Konu | Karar | Gerekçe |
|---|---|---|
| Kaç seçenek | **3**: içinde bulunulan (açık) vardiya + geçmiş 2 vardiya | Kullanıcı isteği birebir |
| Açık vardiyanın dahli | `sonVardiyalar` listesine **garanti eklenir** (varsa en üstte) | Şu an cap dışında kalıyor |
| Cap | Makine başına **3**'e çıkarılır (`repository.ts:2546`) | Açık + 2 geçmiş |
| Default | Açık vardiya (mevcut mantık korunur — `acikVardiyaId`) | `vardiya-secici.tsx:33-38` zaten yapıyor |
| Kapsam | Backend `repoGetAcikVardiyalar` tek noktası; 4 akış otomatik | Aynı bileşen/aynı veri |
| `core.ts` `sonIkiCalisilanSlot` | **Dokunulmaz** — o vardiya analizi raporu için, operatörle ilgisiz | Yanlış yere dokunma tuzağı |

**Dikkat:** Açık vardiya zaten geçmiş 2'den biriyle çakışabilir (aynı kayıt). Dedup: `acikVardiyaId`
zaten listedeyse ikinci kez ekleme; değilse başa ekle, toplam 3'ü aşma.

### R1 görevleri

- [ ] `repoGetAcikVardiyalar` (`operator/repository.ts:2528-2564`): cap 2→3, açık vardiya garanti + dedup
- [ ] Frontend `getVardiyaOptions` (`operator-client.tsx:197-204`) açık vardiyayı listeye merge ediyor (gerekirse)
- [ ] Default seçimin 4 akışta da açık vardiya olduğu doğrulandı (bitir/günlük/duraklat/devam)
- [ ] Test: makinede açık vardiya + 2 geçmiş → 3 seçenek, açık default
- [ ] Test: açık vardiya geçmiş 2'den biriyse → 3 değil ≤3, çift görünmez

---

# ~~🟠 R2 — Son veri girişini geri alma~~ — ❌ İPTAL EDİLDİ (2026-07-30)

> **Kullanıcı kararı (2026-07-30):** "Geri almayı iptal ettik." Feedback `cfd0b8f2` `resolved`
> yapıldı — yanlış giriş için mevcut düzenleme akışı (girişi seçip miktarı düzeltme) yeterli görüldü.
> Aşağıdaki analiz kayıt için duruyor; **implement edilmeyecek.**

Kullanıcının kendi cümlesi:

> Operatör bazen yanlış veri girişi yapabiliyor. Hemen o anda geri al butonuyla geri aldırabilir
> miyiz? Sadece bir defaya mahsus en son yaptığı girişi geri alabilir. Günlük üretim girişine, bitir
> ve duraklat tuşlarına basıldığında gelen ekranlara koyalım.

## Kök neden / mevcut durum (kanıtlı)

**Şu an hiç geri alma/silme/iptal yolu yok** — grep: `delete(operatorGunlukKayitlari)`, `iptal`, `undo`
kod yok. Yeni özellik. Stok tamamen uygulama kodunda yönetiliyor (MySQL trigger yok), yani ters delta
ile geri alınabilir ama **tüm yan etkiler elle ters çevrilmeli**.

Bir günlük üretim girişi (`recordIncrementalProductionEntry`, `repository.ts:1872-2022`) şunları yazar:
1. `operator_gunluk_kayitlari` INSERT
2. `uretim_emri_operasyonlari.uretilen_miktar/fire` += 
3. `uretim_emirleri.uretilen_miktar` += (koşullu)
4. `urunler.stok` += net + `hareketler` giris
5. Reçete hammadde tüketimi: her kalem `urunler.stok` -= + `hareketler` cikis
6. **Inline model:** parça stoğu += (`applyParcaStockDelta`) + montaj tüketimi (`consumeInlineMontajParcalari`, `min(istenen,stok)` sınırlı)

Yani **tek giriş = birçok ürün stoğu + birçok hareket satırı.**

### Zaten var olan güvenli temel

`repoUpdateGunlukUretimKaydi` (`repository.ts:2394-2445`) delta mekanizmasıyla düzeltme yapıyor:
`netDelta = nextNet - prevNet` → `applyGunlukUretimStockDelta` ters delta uyguluyor (op/emir/stok/hareket
+ reçete iadesi, `consumeRecipeMaterials` negatif miktarı destekliyor). **Geri al ≈ kaydı net=0'a çekmek.**
**Ama eksik:** `applyGunlukUretimStockDelta` inline parça/montaj yan etkilerini ters çevirmiyor.

## VERİLMİŞ KARAR — R2

Üç akışın riski **çok farklı**; tek "geri al" hepsine uymaz. Akış bazında:

| Akış | Karar | Gerekçe |
|---|---|---|
| **Günlük üretim girişi** | ✅ Geri al kapsamda. `repoUpdateGunlukUretimKaydi` delta temeli + inline parça/montaj ters çevirme | En güvenli, delta altyapısı hazır |
| **Duraklat** | ✅ Geri al kapsamda. Stok yazmaz; `repoDevamEt` zaten fiili "duraklat geri al" | Düşük risk — sadece durum + açık duruş kaydı |
| **Bitir** | ❌ **V1 kapsamı DIŞI** (aşağıda gerekçe) | Rezervasyon iptali + montaj zinciri geri sarılamaz |

**Neden bitir geri alması V1'de yok:** `repoUretimBitir` emri `tamamlandi` yapar, `bitis_tarihi` set eder,
**rezervasyonları iptal eder** (`repository.ts:1597`), ve **montaj zincirini tetikleyip başka emirlerde
üretim/stok yaratabilir** (`:1660-1663`). Montaj başka emirde mamul ürettiyse bunu geri sarmak pratikte
imkânsız. Bitir geri alması ancak "hiçbir montaj/rezervasyon zinciri tetiklenmemiş VE emir henüz
tamamlanmamış" gibi katı ön koşullarla güvenli olur — ayrı bir çalışma (V23 adayı). V1'de bitir
ekranında "geri al" **gösterilmez** (veya devre dışı + "bitişi geri almak için yönetici" notu).

| Konu | Karar |
|---|---|
| Kural | Sadece **en son** giriş, **bir kez** geri alınır |
| Kayıt | **Silinmez** — `operator_gunluk_kayitlari.gunluk_durum='iptal_edildi'` (schema'da tanımlı, kullanılmayan değer) + `notlar`'a iz | İz kalsın, tekrar geri almayı engelle |
| İkinci geri al koruması | Son kayıt zaten `iptal_edildi` ise "geri alınacak giriş yok" | Çift ters delta riski |
| Stok geri alma | Ters delta (`applyGunlukUretimStockDelta` genişletilmiş) — ana ürün + reçete + **inline parça/montaj** dahil | Kısmi iade stoğu tutarsız bırakır |
| Inline montaj iadesi | Tüketilen miktar `hareketler`'den (`referans_tipi='montaj'`) okunup iade | Kayıttan belli değil (min ile sınırlıydı) |
| Negatif stok | Ana ürün bu arada sevk edilmişse iade stoğu eksiye çekebilir → uyarı/guard | Tutarlılık |
| Yetki | Operatör kendi son girişini; süre sınırı? (öneri: aynı vardiya içinde) | Kullanıcı "hemen o anda" dedi |
| Endpoint | Yeni `POST /operator/gunluk-giris/:id/geri-al` + duraklat için `POST /operator/duraklat-geri-al` | Backend'de geri al yok |
| Frontend | Günlük giriş + duraklat sonrası "Geri Al" (dönen kayıt `id`'si state'e alınmalı — şu an `confirmDailyEntry` id'yi saklamıyor, `operator-client.tsx:354`) | — |

### R2 görevleri

- [ ] Backend `repoGeriAlGunlukGiris(kayitId)`: son giriş mi + iptal_edildi değil mi kontrolü; ters delta; `gunluk_durum='iptal_edildi'` + notlar
- [ ] `applyGunlukUretimStockDelta` inline parça/montaj ters çevirmeyi de kapsayacak şekilde genişletildi (veya geri al kendi ters mantığını kurar)
- [ ] Inline montaj iadesi `hareketler` (`referans_tipi='montaj'`) üzerinden hesaplanıyor
- [ ] Duraklat geri al: `repoDevamEt` temelli, üretim kaydetmeden sadece durum/duruş geri
- [ ] Endpoint + controller + validation (günlük geri al, duraklat geri al)
- [ ] Frontend: "Geri Al" butonu (günlük + duraklat), son kayıt `id` state; bitir'de **gösterilmez**
- [ ] Negatif stok guard + kullanıcıya net hata
- [ ] Test: giriş → geri al → stok/op/emir/hareket başlangıca döner; ikinci geri al reddedilir
- [ ] Test: inline ürün girişi geri alınınca parça+montaj stokları da iade edilir
- [ ] Regresyon: Megane/Tuna/tek-taraflı üretim geri alması stok tutarlılığını korur

---

## Sıralama ve kapanış

1. **R1** (vardiya 3. seçenek) — küçük, tek backend noktası, 4 akış otomatik; tek başına deploy edilebilir
2. **R2** (geri al) — günlük giriş + duraklat; **bitir V1 dışı** (rezervasyon/montaj zinciri)

**Kapsam dışı (bilinçli):** Bitir geri alması — rezervasyon iptali ve montaj zincirinin başka emirlerde
üretim yaratması nedeniyle güvenle geri sarılamaz. Ayrı, katı ön koşullu bir çalışma gerektirir (V23 adayı).
Kullanıcı yine de isterse önce bu zincirin geri sarma tasarımı yapılmalı.

**Şema:** R1 şema değişikliği gerektirmiyor. R2 de gerektirmiyor — `gunluk_durum='iptal_edildi'` değeri
schema'da zaten tanımlı (`operator/schema.ts:103`), sadece kullanılmıyordu.

> **Codex için:** VERİLMİŞ KARAR tabloları bağlayıcı. R2'de bitir geri alması **yapılmaz**. `AGENTS.md`
> geçerli. `ALTER` gerekmez.

---

## Devreden — açık notlar (bilgi)

- Teklif/CRM modülü (100 not, `/admin/teklifler` + `/admin/fuar-teklif`) — ayrı, çeklisti mevcut
  (`CEKLIST-PROMATS-TEKLIF-MODULU-TRANSPALET-AKTARIMI-2026-07-30.md`), bu turda kapsam dışı.
- V21 R2/R3 (duraklat/geç, makine aktarma) — canlıda, operatör UI teyidi bekliyor.
- V20 inline üretim + vardiya çifti — canlıda, teyit bekliyor.
