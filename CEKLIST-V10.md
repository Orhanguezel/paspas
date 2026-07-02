# Yazılımcı Notu V10 — WhatsApp bildirimleri + log incelemesi

> **İnceleme:** 2026-07-02 — Claude canlı DB + PM2 logları + WhatsApp yazışmaları.
> **Sistemde yeni yazılımcı notu YOK** — bildirimler WhatsApp üzerinden geldi.
> **Log sonucu: bugün (07-02) backend'de HİÇ hata yok** — tüm istekler 200. Operatörler aktif çalışmış (kuyruk 35×, günlük-giriş 7×, bitir 2×, başlat 2×). "makinede iş yok" bir crash değil, veri/görünüm durumu.

---

## A — Makine 2'de Tuna Siyah üretimi "kayıp" / görünmüyor

**WhatsApp:** "Operatör makine 2'deki üretimi göremiyor", "makinede iş yok gözüküyor", "bitmiş üretimlerin içinde de yok, kimse bitirmedi", "Makine 2'de devam eden Tuna Siyah üretimi kayıp". "Bu düzenlemelerden sonra oldu diye tahmin ediyorum."

### İnceleme
- **V9 operatör ekranını değiştirmedi.** `repoListMakineKuyrugu` (operatör kuyruk sorgusu) V9'da dokunulmadı; F yalnız `repoUretimBitir`/stok mantığını değiştirdi. Yani "makinede iş yok" doğrudan V9 regresyonu değil.
- **DB durumu (o an):** UE-2026-0079 Sağ op tamamlandı (2460), Sol op `calisiyor` (1235). Yani iş DB'de vardı ama operatör ekranında görünmüyordu.
- **Olası kök:** Çok operasyonlu tek-emir mamulde op-1 (Sağ) bitince op-2 (Sol) aktifleşirken operatör ekranında "aktif iş" olarak net görünmeme ihtimali (op-2 sıralama/aktivasyon gösterimi). Kesin tekrar üretilemedi çünkü emir tamamlandı (aşağı bak).

### Claude müdahalesi (ŞEFFAFLIK)
- 48ae4a9a çözümünde (admin: "1235 üretilmiş stokta yok, kaybolmasın") UE-0079 Sol operasyonunu gerçek kod yolundan **tamamladım** → TUNA SİYAH stoğu **+1235** oldu (min(Sağ 2460, Sol 1235)). Üretim artık stokta ve "kaybolmadı".
- **Yan sonuç:** Makine 2'deki aktif iş kapandı; Makine 2 şimdi 0 `calisiyor` + 2 `bekliyor` (Tuna Gri, Tuna Bej). Operatör sıradaki işi başlatabilir.
- **⚠️ Uyumsuzluk:** Sağ 2460 üretildi ama Sol 1235'te tamamlandı → **1225 adet Sağ eşleşmeden kaldı** (bu modelde ayrı stoğa yazılmıyor). Operatör Sol'u 2460'a tamamlamak isteseydi eksik kalır.

### 🔴 KARAR GEREKLİ
1. UE-0079 için 1235 stok kredisi **kalsın** mı (üretim bitti sayılır, 1225 Sağ artık)? — yoksa
2. Completion **geri alınıp** Sol operasyonu tekrar `calisiyor` yapılsın mı (operatör 2460'a tamamlayıp öyle bitirsin)?
3. Operatör ekranı "aktif iş görünmeme" sorununu tekrar üretebilmek için operatörün ŞİMDİ Makine 2'yi kontrol etmesi gerekiyor (sıradaki Tuna Gri işini görüyor mu?).

---

## B — TIGER KROM ürünleri ürün listesinde yok

**WhatsApp:** "Aşağıdaki ürünler sistemde kayıtlı görünüyor ama ürün listesinde görmüyorum": 211 TIGER KROM KARBON - GMAX OTO PASPAS, 212 KIRMIZI, 213 MAVI, 214 SILVER.

### İnceleme (canlı DB)
- **"TIGER KROM KARBON/KIRMIZI/MAVI/SILVER - GMAX OTO PASPAS" adlı `urun` kaydı YOK.**
- Sistemde olanlar:
  - `1132 111-114` = **"NUMBER ONE KROM KARBON/KIRMIZI/MAVI/SILVER - GMAX"** (urun, is_active=1) — isim farklı.
  - `1132 211-214` = **"Karbon/Kırmızı/Mavi/Silver Film-Tiger"** (yarimamul) — bunlar film ara malzemesi, mamul değil.
  - `1132 201-203` = TIGER SİYAH/GRİ/BEJ - GMAX (urun) var; ama KROM (Karbon/Kırmızı/Mavi/Silver) TIGER mamulü yok.

### 🔴 KARAR GEREKLİ (admin netleştirmeli)
- Bu 4 ürün (TIGER KROM ... GMAX OTO PASPAS) **sisteme eklenecek yeni mamul mü**, yoksa mevcut "NUMBER ONE KROM ..." (1132 111-114) ile **aynı ürünler mi** (isim/kod uyuşmazlığı)?
- Admin "sistemde kayıtlı görünüyor" derken nereyi kastediyor (Excel listesi? reçete? sipariş?)? Kayıt yeri netleşirse kaynak bulunur.
- Ürün listesinde bir **filtre** gizlemiyor (is_active hepsi 1, kategori urun) — yani gerçekten kayıt yok; oluşturulması gerekiyor.

---

## Sıra / Sahiplik
1. **Admin kararı (A):** UE-0079 1235 kalsın mı / geri mi alınsın; operatör Makine 2'yi şimdi kontrol etsin.
2. **Admin kararı (B):** TIGER KROM ürünleri yeni mi / mevcutla aynı mı.
3. Karar sonrası: gerekirse Claude UE-0079'u geri alır veya bırakır; TIGER KROM ürünleri oluşturulur (admin onayıyla).

**Not:** Bu turda kod değişikliği YOK — inceleme + karar belgesi. Log temiz.
