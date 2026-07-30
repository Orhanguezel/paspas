# Yazılımcı Notları — Promats Revize 1

**Kaynak:** `Promats REvize1 (1).docx`  
**Tarih:** 2026-07-30  
**Kapsam:** Promats web sitesi ikinci değerlendirme turu

Bu liste, önceki `Promats REvize.docx` belgesinden açılıp kapatılan kartlardan
ayrı bir doğrulama turudur. Önceki kartlar yeniden açılmayacak; bu belgedeki
güncel gözlem ve kabul kriterleri `[Promats Revize 1]` başlığıyla ayrı
kartlarda takip edilecektir.

## 1. Site geneli

- [ ] **Türkçe karakter ve font tutarlılığını düzelt** — `critical`
  - Ürün adları, başlıklar ve büyük harfli metinler dahil tüm TR sayfaları
    taranmalı.
  - Özellikle `İ` glifi farklı görünen font ağırlıkları düzeltilmeli.
  - Kabul: aynı font ailesi ve ağırlıkta `İ/ı/Ş/ş/Ğ/ğ/Ç/ç/Ö/ö/Ü/ü`
    karakterleri bozulmadan ve tutarlı görünmeli.

## 2. Anasayfa

- [ ] **Anasayfa ürün vitrini mevcut site kompozisyonuna yaklaştır** — `high`
  - Mevcut ve yeni site ekran görüntülerindeki ürün görseli, başlık, ürün adı
    ve CTA oranları karşılaştırılarak yerleşim güncellenmeli.

- [ ] **Neden Promats bölümünün kompozisyonunu düzenle** — `high`
  - Referans yerleşime yaklaşılmalı; uygun boşluk varsa araç içindeki paspas
    görseli bir miktar büyütülmeli.
  - Arka plandaki yinelenen “Neden Promats?” yazısı tasarım tercihi değilse
    kaldırılmalı veya okunurluğu bozmayacak seviyeye çekilmeli.

- [ ] **Özellikler metin ve glif düzeltmeleri** — `critical`
  - Metin `1. SINIF KALİTE PVC` olmalı.
  - `Özellikler`, `Derin Havuzlu`, `Yıkanabilir` ve `Kalite` içindeki `İ`
    karakterleri aynı tipografik biçimde görünmeli.

- [ ] **Footer sosyal medya ikonlarını marka renkleriyle göster** — `normal`
  - Sayfa altındaki renksiz ikonlar, üst bölümde kullanılan renkli ikon
    standardıyla aynı olmalı.

- [ ] **E-Katalog menüsü ve etkileşimini yenile** — `high`
  - Üst E-Katalog düğmesinde katalog görseli/ikonu kullanılmalı.
  - Tıklayınca yan yana iki seçenek açılmalı: `Katalog Görüntüle` ve
    `PDF İndir`.
  - Menü dışına tıklanınca seçenekler kapanmalı.
  - Sayfa altındaki ayrı katalog düğmesi tamamen kaldırılmalı.
  - `Katalog Görüntüle`, PDF indirmek yerine sayfa sayfa çevrimiçi katalog
    deneyimi sunmalı; üçüncü taraf zorunlu değil, FlipHTML5 örneği yalnız
    davranış referansıdır.

## 3. Kurumsal

- [ ] **Kurumsal sayfasını verilen referans tasarıma yaklaştır** — `critical`
  - Mevcut uygulama referansa yeterince benzemediği için sayfa yerleşimi
    yeniden ele alınmalı.
  - Referans:
    `https://claude.ai/public/artifacts/32c583b0-85ec-45c4-ad51-bea235a74891`
  - Üst bloğun sağında belgedeki geçici görsel kullanılmalı; daha sonra
    yönetilebilir biçimde değiştirilebilmeli.

- [ ] **Kurumsal yetkinlik başlığı ve süreç görselleri** — `high`
  - `Dört Temel Yetkinlik` yerine `Temel Yetkinliklerimiz` kullanılmalı.
  - `Sistematik Bir Süreç Anlayışı` bloğunun altına ayrı bir blok halinde
    belgedeki dört görsel eklenmeli.

## 4. Ürünler ve ürün detayları

- [ ] **Ürünler sayfası grafikçi revizesini bekliyor** — `normal`
  - Ana yapı olumlu bulundu. Grafikçiden gelecek küçük tasarım revizeleri
    alınmadan kapsam genişletilmemeli.
  - Bu kart dış bağımlılık kaydıdır; görseller gelince kabul kriterleri
    güncellenecek.

- [ ] **Ürün detayında rozet kırpılması ve renk bütünlüğü** — `critical`
  - `First Class PVC Material` damgası kesilmeden tam görünmeli.
  - Ürün görselinin altındaki renk sola doğru kesintisiz devam etmeli ve
    mevcut sayfadaki referans renkle eşleşmeli.
  - Belgedeki mevcut/yeni ekran görüntülerindeki renk farkı giderilmeli.
  - Site geneli font maddesi bu sayfada da doğrulanmalı.

## 5. İletişim

- [ ] **İletişim sayfası yerleşimini ve giriş metnini yenile** — `critical`
  - Sayfa açılışında harita merkezdeki ana öğe olmamalı; önce iletişim kutusu
    gösterilmeli.
  - Belgedeki referans tasarıma yakın bir kompozisyon kullanılmalı.
  - Türkçe başlık ve içerik:
    - `BİZE ULAŞIN`
    - `DOĞRU ÇÖZÜM İÇİN BURADAYIZ`
    - `İster ürünlerimiz hakkında bilgi almak, ister fiyat teklifi talep
      etmek ya da markanıza özel üretim seçeneklerini değerlendirmek isteyin;
      ekibimiz size yardımcı olmaktan memnuniyet duyacaktır.`
    - `Hızlı geri dönüş`, `Ürün ve fiyat desteği`,
      `Markanıza özel üretim`
  - İngilizce sayfada belgedeki İngilizce referans metin kullanılmalı.

- [ ] **İlgilenilen ürün grubunu kompakt çoklu seçime dönüştür** — `high`
  - Alan birden fazla seçime izin vermeli.
  - Tüm seçenekleri sürekli açık göstermek yerine kapalı açılır alan,
    checkbox veya eşdeğer kompakt bir çoklu seçim bileşeni kullanılmalı.

## 6. OEM & Manufacturing

- [ ] **OEM bilgi bloğunu tek satıra indir** — `high`
  - Bilgi kartları iki satır yerine tek satır olmalı.
  - Alan yetmezse `OEM & PRIVATE LABEL` tek kartta birleştirilebilir.
  - Mobil kırılımlarda okunabilirlik korunmalı.

- [ ] **OEM sayfası başlık hiyerarşisini standartlaştır** — `high`
  - Her bölüm başlığında ilk satır küçük fontlu ve farklı renkli, ikinci satır
    büyük fontlu olmalı.
  - Belgedeki örnek tüm OEM bölüm başlıklarına uygulanmalı.

## Uygulama ve kapanış kuralı

1. Karttaki ilgili belge görsellerini incele.
2. Masaüstü ve mobil kırılımlarda değişikliği uygula.
3. Türkçe ve İngilizce sayfaları ayrı ayrı doğrula.
4. Production dağıtımından sonra ekran görüntüsü veya açık doğrulama notu ekle.
5. Kartı yalnız kabul kriterleri canlıda karşılandığında `resolved` yap.
