# Codex Prompt — Paspas ERP V7 (V5/V6 takip bug'ları)

Aşağıdaki içeriği olduğu gibi Codex'e ver.

---

## 🤖 GÖREV — Codex'e

V5/V6'da deploy edilen özelliklerde 4 takip notu/bug var. Claude kök nedenleri buldu, kararları verdi:
👉 **[CEKLIST-V7.md](./CEKLIST-V7.md)** — Bölüm 0 (kararlar) + 1-4 (maddeler, kök nedenler dahil).

### Önce oku
1. **CEKLIST-V7.md** — kararlar (D-SagSol, D-Verimlilik) + her maddedeki **kök neden** notları.
2. **backend/CLAUDE.md** + **admin_panel/CLAUDE.md**.

### Genel
- **Yeni şema YOK. ALTER yasak.** Gerekirse DUR, Claude'a sor.
- Sıra: **Not 4 → Not 1 → Not 2 → Not 3.**
- Her madde ayrı commit; build (backend `bun run build` + admin `tsc --noEmit`), sonda admin `bun run build`. **Push etme** — Claude review + deploy.

### Not 4 — Vardiya Analizi veri doğruluğu (EN KRİTİK, `/admin/vardiya-analizi`)
- **4a İlk açılış:** önceki günün 2 vardiyası (bugün çarşamba → salı gündüz + salı gece) gelsin. Default tarih/aralık mantığını düzelt.
- **4b Tek makine bug'ı:** 7 gün filtresinde sadece bir makine geliyor. Üretim kayıtlarını `vardiyaKayitlari` (vardiya açılış kaydı) yerine **doğrudan `operator_gunluk_kayitlari`'ndan (makine + tarih bazlı)** topla — vardiya açılış kaydı olmayan makineler de görünsün.
- **4c Toplamlar sıfır bug'ı:** Gündüz/Gece toplamı net+fire = 0. Toplamı `net_miktar` yerine doğru kaynaktan al — `net_miktar` null ise `ek_uretim_miktari - fire_miktari` veya `ek_uretim_miktari`. [vardiya_analizi/service.ts](backend/src/modules/vardiya_analizi/service.ts) ~534 ve toplam agregasyonları.
- **4d Verimlilik (D-Verimlilik):** Her üretim kaydında **iki oran**: (1) net çalışma süresine göre = net / (netÇalışmaSüresi_sn / çevrim_sn); (2) vardiya süresine göre = net / (vardiyaSüresi_sn / çevrim_sn, 12h). çevrim_sn = operasyonel YM'nin operasyon çevrim süresi. Çevrim yoksa "—".

### Not 1 — Yeni üretim emri oluştur (`/admin/uretim-emirleri`)
- **1a** Aktarım modal'ını tam ekrana yakın büyüt (`max-w-[95vw]`).
- **1b** Ürün grubu dropdown'ı **tüm grupları** göstersin (sipariş satırlarına sığanlarla sınırlı değil).
- **1c** Manuel ekleme FRONTEND bug'ı: `UretimOlusturGrid` manuel satır UI'ı `manuelRows`'u doldurmuyor / seçilen ürün aktarıma girmiyor. Uçtan uca düzelt; manuel ürün `manuelEmirler` ile gönderilsin (backend zaten doğru — controller ~290). Manuel + sipariş aynı partiye girer.
- **1d Otomatik makine atamasını KALDIR:** [uretim_emirleri/service.ts](backend/src/modules/uretim_emirleri/service.ts) `applyDefaultMakineAtamasi` çağrısını üretime-aktarımdan çıkar (satır ~170). Sebep: sadece `makine_id` set edip `makine_kuyrugu` oluşturmuyordu → yarım atama (UI "Atanmamış", iş yüklerinde yok, ama silinemez). Yeni emirler temiz "Atanmamış" doğsun; atama Not 2 bloğundan yapılacak. (`applyDefaultMakineAtamasi`/`defaultMakineIdForTaraf` fonksiyonlarını silebilir veya çağrısız bırakabilirsin.)
- **1e D-SagSol:** Üretim listesinde çift taraflı ürün **tek mamul satırı**; Sağ/Sol operasyonel YM'ler Makine ve Montaj Planlama bloğunda. (DB'de iki taraf emri durur; yalnız liste mamul bazında gruplanır.)

### Not 2 — Makine ve Montaj Planlama (`/admin/uretim-emirleri`)
- Blok ilgili **üretim partisinin hemen altında**.
- Makine dropdown: **"Atanmamış" + makine isimleri**. Seçim → gerçek atama (makine_havuzu `repoAtaOperasyon`: makine_id + makine_kuyrugu + planlanan tarih). "Atanmamış" seçimi → atamayı kaldır (kuyruktan çıkar, makine_id NULL).
- Montaj Yes/No düzenlenebilir (`uretim_emri_operasyonlari.montaj`).

### Not 3 — Yükle/Sevket mobil (`/admin/sevkiyat`)
- Rol gating fix'i V6'da deploy edildi (sevkiyatci+nakliyeci). **Çoğunlukla doğrulama** — Claude canlıda kontrol edecek. Yine de Yükle/Sevket ekranını operatör ekranı gibi **büyük buton/kart, tek kolon mobil** formata getir (zayıfsa güçlendir).

## İlerleme raporu
```
[Codex] V7-Not4 tamam. Sıra: Not1. Build: OK.
```
Bitince:
```
[Codex] V7 tamamlandı. Build OK. Claude'a hazır.
```
