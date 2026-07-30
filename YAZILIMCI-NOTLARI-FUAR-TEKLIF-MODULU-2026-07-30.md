# Yazılımcı Notları — Fuar Teklif Modülü

**Kaynak:** `Fuar_Teklif_Yazilim_Gorevleri.xlsx`  
**Tarih:** 2026-07-30  
**Proje türü:** Paspas ERP'den bağımsız uygulama, veritabanı ve dağıtım  
**Arayüz referansı:** https://claude.ai/public/artifacts/eecb9182-5cad-4d25-a842-494011576965

Excel dosyasındaki her satır ayrı görev olarak takip edilir. Toplam **42 açık
görev** vardır: **20 kritik**, **18 yüksek**, **4 normal**.

## Modül özeti

| İş paketi | Görev | Ana kapsam |
|---|---:|---|
| Genel | 2 | Bağımsız proje altyapısı ve navigasyon |
| Ürünler | 7 | Ürün modeli, ihracat, dönüşüm, MOQ, fotoğraf ve Excel aktarımı |
| Müşteriler | 3 | Müşteri modeli, yönetim ekranları ve Excel aktarımı |
| Katalog | 3 | Kategori şeridi, sade ürün kartları ve teklif sepeti |
| Teklif | 19 | Ticari koşullar, fiyat, lojistik, hesaplar, revizyon ve liste |
| Proforma | 2 | Tekliften dönüşüm, çok dilli çıktı ve banka seçimi |
| Çeki Listesi | 2 | Otomatik packing list, PDF ve Excel çıktıları |
| Tanımlar | 3 | Kapasite, palet ve karayolu/denizyolu navlun tabloları |
| Test | 1 | Hesaplama ve uçtan uca kabul senaryoları |

## Mimari değerlendirme

- Fuar Teklif, mevcut üretim yazılımının içinde yeni bir ekran değil; bağımsız
  uygulama, veritabanı ve dağıtım hattı olarak kurulmalıdır.
- Teklif revizyonları değişmez anlık görüntü olarak saklanmalıdır. Ürün fiyatı,
  dönüşüm oranı, kapasite veya navlun tanımı sonradan değişse bile eski R0/R1/R2
  hesapları değişmemelidir.
- Hesaplama motoru ekran, PDF ve Excel tarafından ortak kullanılmalıdır.
  Birim dönüşümü, indirim, navlun, CBM ve ağırlık formülleri arayüzlerde ayrı
  ayrı uygulanmamalıdır.
- Ürün ve müşteri Excel aktarımları satır bazlı doğrulama ve kısmi başarı
  raporuyla çalışmalıdır.
- Çeki listesi teklif verisini kopyalayan bağımsız bir giriş ekranı değil,
  seçilen teklif revizyonundan üretilen bağlı bir belge olmalıdır.

## Önerilen uygulama sırası

1. Bağımsız altyapı, kullanıcı erişimi ve temel tanımlar.
2. Ürün ve müşteri veri modelleri ile yönetim ekranları.
3. Birim dönüşümü, MOQ ve ortak hesaplama motoru.
4. Katalog ve teklif sepeti.
5. Teklif kaydı, toplamlar ve R0/R1/R2 revizyon altyapısı.
6. PDF, proforma ve çeki listesi çıktıları.
7. Excel içe/dışa aktarma, navlun önerileri ve doluluk göstergeleri.
8. Excel'deki 42 kabul kriterinin otomatik ve uçtan uca testleri.

## Kritik iş kuralları

- `1 palet = 20 koli`, `1 koli = 6 takım` ise
  `3 palet = 60 koli = 360 takım`.
- `360 takım × 9 USD = 3.240 USD`; para hesaplarında iki ondalık hassasiyet
  ve tutarlı yuvarlama uygulanır.
- Genel müşteri indirimi önce, teklif altı ek indirim sonra uygulanır; ek
  indirim navluna uygulanmaz.
- EXW toplamı indirim sonrası ürün bedeli; CIF toplamı ürün bedeli + navlun;
  FOB toplamı ürün bedeli + kullanıcı tarafından girilen navlun/masraftır.
- Paletsiz yüklemede koli ölçülerinden CBM, paletli yüklemede palet ölçüsü ve
  palet adedinden hacim hesaplanır.
- Kaydedilmiş teklif revizyonları, daha sonra değişen ürün ve tanım
  kayıtlarından etkilenmez.

## Kapanış kuralı

Her görev, Excel satırındaki kabul kriteri ekran ve API seviyesinde
doğrulandıktan; hesap içeren görevler ayrıca PDF/Excel çıktılarıyla
karşılaştırıldıktan sonra kapatılır.
