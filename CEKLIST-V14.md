# CEKLIST V14 — Vardiya Analizi TEK KAYNAK Refactor

> **Kaynak brief:** [CODEX-PROMPT-V14.md](CODEX-PROMPT-V14.md)  
> **Durum:** Codex uygular, Claude review + canlı mutabakat + deploy + thread kapatma yapar.  
> **Kural:** Yeni şema yok, `ALTER` yok, push yok. Bu iş yama değil; kopya üretim sorgusu ve kopya montaj filtresi kalmayacak.

---

## Codex Uygulama Durumu — 2026-07-09

- [x] `core.ts` saf çekirdek eklendi.
- [x] `repository.ts` tek üretim sorgusu eklendi.
- [x] `service.ts` üretim hesapları tek sorgudan gelen kayıtlar + saf reduce akışına bağlandı.
- [x] Montaj üretimi toplam nete dahil edildi.
- [x] OEE/verimlilik hesapları `baskiNet` üzerinden yapılıyor.
- [x] Detay satırları aynı slot kayıt kümesinden geliyor ve gerçek `kayitTarihi` gösteriyor.
- [x] `getVardiyaAnaliziDetay` aynı üretim repository'sini kullanıyor.
- [x] `getTrend` aynı `getVardiyaAnalizi` çekirdeği üzerinden ilerliyor.
- [x] `core.test.ts` DB'siz ve skip'siz eklendi.
- [x] Frontend makine başlığı `{kod} — {ad}` formatına hazırlandı.
- [x] Satırdaki `Verim. (Net Çalışma)` ve `Verim. (Vardiya)` kolonları kaldırıldı.
- [x] Verimlilik değerleri makine/vardiya başlık seviyesine taşındı.
- [x] Tablo altındaki vardiya toplam satırı kaldırıldı.
- [x] Montaj satırları normal listede `Montaj` rozetiyle gösteriliyor.
- [x] `rg "from\\(operatorGunlukKayitlari\\)" service.ts repository.ts` çıktısı 1 adet.
- [x] `bun test src/modules/vardiya_analizi/__tests__/core.test.ts` yeşil.
- [x] Backend `bun x tsc -p tsconfig.json --noEmit` yeşil.
- [x] Backend `bun run build` yeşil.
- [x] Admin `bunx tsc --noEmit` yeşil.
- [x] Admin `bun run build` yeşil.
- [x] Push yapılmadı.
- [ ] Claude canlı DB mutabakatı.
- [ ] Deploy.
- [ ] Thread kapatma.

---

## 0. Başlangıç Kontrolü

- [x] `backend/src/modules/vardiya_analizi/service.ts` mevcut davranış ve DTO alanları okunmuş.
- [x] `backend/src/modules/vardiya_analizi/repository.ts` mevcut sorgu patternleri okunmuş.
- [x] `admin_panel/src/app/(main)/admin/vardiya-analizi/_components/vardiya-analizi-client.tsx` UI istekleri için okunmuş.
- [x] İlgisiz dosyalara dokunulmayacağı doğrulanmış.
- [x] `tryMontajForUretimEmri`, `repoUretimBitir`, `consumeRecipeMaterials` ve stok/montaj akışı kapsam dışı bırakılmış.

## 1. Saf Çekirdek — `core.ts`

- [x] `backend/src/modules/vardiya_analizi/core.ts` eklendi.
- [x] `core.ts` içinde DB import yok.
- [x] `core.ts` içinde `Date.now()` yok; tüm zaman girdileri parametrelerden geliyor.
- [x] `UretimKaydi` tipi eklendi.
- [x] `VardiyaSlot` tipi eklendi.
- [x] `assignVardiya(kayitTarihi, tanimlar)` eklendi.
- [x] Vardiya saatleri tanımlardan okunuyor; 07:30/19:30 hardcode edilmedi.
- [x] 07:30-09:30 hibrit kuralı korundu: bu aralıktaki kayıtlar önceki gece vardiyasına düşüyor.
- [x] Her kayıt tam bir vardiya slotuna atanıyor; boşluk/çakışma yok.
- [x] Vardiya pencere hesabı vardiya açılış kaydına bağımlı değil.
- [x] `reduceOzet(kayitlar)` eklendi.
- [x] `reduceOzet.net` montaj dahil `Σ kayit.net` döndürüyor.
- [x] `reduceOzet.baskiNet` yalnız `montaj=false` kayıtları topluyor.
- [x] `reduceOzet.montajNet` yalnız `montaj=true` kayıtları topluyor.
- [x] `urunKirilimi` ve `operasyonKirilimi` mevcut DTO beklentileriyle uyumlu taşındı/uyarlandı.
- [x] `partitionByVardiya(kayitlar, tanimlar)` eklendi.
- [x] `partitionByMakine(kayitlar)` eklendi.
- [x] `resolveNet` saf çekirdeğe taşındı veya buradan tek kaynak olarak kullanılıyor.
- [x] `parseClockToMinutes`, `normalizeShiftName`, `inferVardiyaTipi`, `createDateForClock`, `buildShiftWindowForTime`, `clampDate`, `diffMinutes`, `roundRatio` saf çekirdeğe taşındı veya tek kaynaklandı.
- [x] `calculateOee` ve `calculateVerimlilik` çağrıları artık `baskiNet` ile besleniyor.

## 2. Repository — Tek Üretim Sorgusu

- [x] `fetchUretimKayitlari(pencere, makineIds?)` eklendi.
- [x] Üretim kayıtları `operator_gunluk_kayitlari` üzerinden tek sorguyla çekiliyor.
- [x] Sorguda emir, ürün, operasyon, kalıp ve operatör joinleri tamamlandı.
- [x] Sorguda montaj hariç SQL filtresi yok.
- [x] Montaj bilgisi satır etiketi olarak `montaj: boolean` dönüyor.
- [x] `net` SQL tarafında mevcut `netMiktarSql` ifadesiyle normalize ediliyor.
- [x] Pencere bitişi istenen aralığın son gece vardiyası bitişini kapsıyor.
- [x] Duruş kayıtları ve vardiya açılış kayıtları ayrı küçük sorgular olarak kalıyor; üretim sayısı üretmiyor.

## 3. Service Refactor

- [x] `getVardiyaAnalizi` üretim için `fetchUretimKayitlari` çağrısını yalnız 1 kez yapıyor.
- [x] Makine başlığı istatistikleri `reduceOzet(makinenin tüm kayıtları)` ile hesaplanıyor.
- [x] Vardiya kartı istatistikleri `reduceOzet(o slotun kayıtları)` ile hesaplanıyor.
- [x] Detay satırları aynı slotun kayıtlarından geliyor; ayrı üretim sorgusu yok.
- [x] Detay satırında gerçek `kayitTarihi` gösteriliyor.
- [x] Vardiya kartları şu birleşimden oluşuyor: kayıtlardan türeyen slotlar + `vardiya_kayitlari` açılışları.
- [x] Kayıtsız açık vardiya boş kart olarak görünebiliyor.
- [x] Açılış kaydı olmayan ama üretim kaydı olan slot kaybolmuyor.
- [x] Makine başlığı toplamı = vardiya toplamları = detay satırları toplamı aynı kümeden geliyor.
- [x] `montajUretim` DTO alan adları korunuyor.
- [x] `montajUretim` içeriği yeni `reduceOzet.montajNet/kirilim` üzerinden doluyor.
- [x] OEE/verimlilik hesaplarında montaj hariç üretim, yani `baskiNet`, kullanılıyor.
- [x] `getVardiyaAnaliziDetay` aynı çekirdeği kullanıyor.
- [x] `getTrend` aynı çekirdeği kullanıyor.
- [x] `service.ts` içinde üretim sayan kopya sorgular kaldırıldı.
- [x] Modülde montaj hariç SQL filtresi kalmadı.

## 4. DB'siz Unit Test — `core.test.ts`

- [x] `backend/src/modules/vardiya_analizi/__tests__/core.test.ts` eklendi.
- [x] Testlerde `describe.skip`, `it.skip` veya `RUN_DB_INTEGRATION` bağımlılığı yok.
- [x] I1: sabit seed/elle yazılmış 20 kayıt tam 1 slota düşüyor; toplam kayıt sayısı korunuyor.
- [x] I2: `reduceOzet(hepsi).net === Σ reduceOzet(slot).net === Σ kayit.net`.
- [x] I3: `montaj=true` kayıtlar `net` toplamına dahil, `baskiNet` toplamına dahil değil.
- [x] I3: `montajNet` doğru hesaplanıyor.
- [x] I5: 08:15 önceki gece slotuna düşüyor.
- [x] I5: 09:45 gündüz slotuna düşüyor.
- [x] I5: 19:29 gündüz slotuna düşüyor.
- [x] I5: 19:31 gece slotuna düşüyor.
- [x] I5: 03:00 kaydı doğru gece gününe bağlanıyor.
- [x] `resolveNet`: `net_miktar=0` iken `ek-fire` fallback doğrulanıyor.
- [x] `resolveNet`: negatif sonuç 0'a floor ediliyor.
- [x] `calculateVerimlilik` montajlı karışımda yalnız `baskiNet` kullandığını kanıtlıyor.
- [x] `calculateOee` montajlı karışımda yalnız `baskiNet` kullandığını kanıtlıyor.
- [x] Mevcut montaj/stok akışı entegrasyon testlerine dokunulmadı; `vardiya_analizi.real.integration.test.ts` V14 montaj-dahil sözleşmesine göre güncellendi.

## 5. Frontend — Vardiya Analizi UI

- [x] Makine başlığı `{kod} — {ad}` formatında gösteriliyor.
- [x] API DTO'da makine kodu eksikse backend DTO'ya eklendi.
- [x] Satır sütunlarından `Verim. (Net Çalışma)` kaldırıldı.
- [x] Satır sütunlarından `Verim. (Vardiya)` kaldırıldı.
- [x] Bu iki verimlilik değeri vardiya başlık şeridine Net/Fire rozetlerinin yanına taşındı.
- [x] Bu iki verimlilik değeri makine başlığı kutularına da eklendi.
- [x] Tablo altındaki `Gündüz Vardiyası Toplamı` satırları kaldırıldı.
- [x] Tablo altındaki `Gece Vardiyası Toplamı` satırları kaldırıldı.
- [x] Montaj satırları normal listede `Montaj` rozetiyle görünüyor.
- [x] Montaj satırları net toplama dahil görünüyor.
- [x] Satırdaki tarih/saat gerçek `kayitTarihi` değerinden geliyor.

## 6. Otomatik Kabul Komutları

Bu komutlar Claude review öncesi çalıştırılacak:

```bash
cd backend
bun test src/modules/vardiya_analizi/__tests__/core.test.ts
bun run build
```

```bash
cd admin_panel
bunx tsc --noEmit
bun run build
```

Grep kontrolleri:

```bash
cd backend
rg "from\\(operatorGunlukKayitlari\\)" src/modules/vardiya_analizi/service.ts src/modules/vardiya_analizi/repository.ts
```

- [x] Yukarıdaki grep çıktısında üretim sayan sorgu 1 adet.

```bash
cd backend
rg "montaj|montajOperasyon|montaj_operasyon" src/modules/vardiya_analizi
```

- [x] Çıktıda montaj hariç SQL filtresi yok.
- [x] Montaj yalnız satır etiketi, kırılım veya `reduceOzet` içi `baskiNet/montajNet` ayrımı için kullanılıyor.

## 7. Canlı Davranış Mutabakatı — Claude

- [ ] 06-07 gece vardiyasında detay satırları yalnız o slotun kayıtlarını gösteriyor.
- [ ] Eski "üç defa 485" davranışı yok.
- [ ] 900 T (ARKA) kartları montaj üretimiyle dolu.
- [ ] Montaj üretimi toplam nete dahil.
- [ ] Montaj üretimi OEE/verimlilik girdisine dahil değil.
- [ ] Makine başlığı net toplamı vardiya kartları toplamıyla eşit.
- [ ] Vardiya kartı net toplamı detay satırları toplamıyla eşit.
- [ ] Operatör ekranı referans toplamı ile vardiya analizi raporu aynı üretim tanımını kullanıyor.
- [ ] Hareketler sayfası farkı stok hareketi tanımı olarak ayrıca açıklanacak; bu refactorun bloklayıcısı değil.

## 8. Commit Planı

- [ ] Commit 1: `core.ts` saf çekirdek.
- [ ] Commit 2: repository tek üretim sorgusu + service refactor.
- [ ] Commit 3: DB'siz core unit/invariant testleri.
- [ ] Commit 4: frontend Vardiya Analizi UI düzenlemeleri.
- [ ] Push yapılmadı.

## 9. Review'e Hazır Tanımı

- [x] Yeni şema yok.
- [x] `ALTER` yok.
- [x] İlgisiz modüllere dokunulmadı.
- [x] Üretim sayısı için tek sorgu var.
- [x] Montaj hariç SQL filtresi yok.
- [x] Unit test skip'siz yeşil.
- [x] Backend build yeşil.
- [x] Admin typecheck yeşil.
- [x] Admin build yeşil.
- [x] Claude canlı DB üzerinde toplam mutabakatını yapabilir.

---

## Claude Review + Kapanış (2026-07-09)

**Kabul kriterleri:** ✅ üretim sorgusu 1 (repo) / 0 (service) · ✅ montaj-hariç SQL filtresi 0 · ✅ core.test.ts 6 test skip'siz yeşil · ✅ backend build + admin tsc/build temiz.

**Review bulgusu (Claude, `3ac89f2`):** DTO'ya `makineKod` eklenmişti ama başlık yalnız `makineAd` gösteriyordu (56aadea9 madde 1 eksik) → "{kod} — {ad}" tamamlandı.

**Canlı mutabakat (07-08, gerçek kod yolu vs DB SUM):**
| Makine | Rapor | Σ vardiyalar | DB |
|---|---|---|---|
| Enjeksiyon 1 — 900 T (ÖN) | 975 | 975 | 975 ✓ |
| Enjeksiyon 2 — 900 T (ARKA) | 1580 (montaj dahil — kart DOLU) | 1580 | 1580 ✓ |

- [x] Claude canlı DB mutabakatı
- [x] Deploy (`3ac89f2`)
- [x] Thread kapatma — `d270550f`, `a9e9f63a`, `56aadea9` resolved. **Açık not: 0.**
