# Yazılımcı Notları — Açık İşler

**Kaynak:** Canlı Paspas `page_feedback` kayıtları  
**Tarih:** 2026-07-28  
**Kapsam:** `resolved` veya `closed` olmayan gerçek kullanıcı kartları

Bu liste sistem taşıma işlerini değil, Yazılımcı Notu ekranında kullanıcıların
yazdığı açık geliştirme ve hata kartlarını izler. Bir kart ancak kod/veri
düzeltmesi production ortamında doğrulandıktan sonra kapatılır.

## 1. Frontend / Promats Web

- [x] **Footer İngilizce telif metni**
  - Kart: `e55d269d-0a47-4bb1-bf7b-9cd324596add`
  - Sayfa/bölüm: `/en`, `footer`
  - Not: İngilizce sayfada “© 2026 Promats. Tüm hakları saklıdır.” Türkçe çıkıyor.
  - Kabul: İngilizce sayfada İngilizce telif metni, Türkçe sayfada Türkçe telif
    metni görünmeli.
  - Kapanış: Production sayfası doğrulanacak, çözüm notu eklenecek ve kart
    `resolved` yapılacak.
  - Sonuç (2026-07-28): `/en` çıktısında “Promats – All Rights Reserved.”,
    `/tr` çıktısında “Promats - Tüm Hakları Saklıdır.” doğrulandı. Çözüm notu
    eklendi ve kart `resolved` yapıldı.

## 2. Paspas ERP

- [ ] **Üretim emri düzeltme**
  - Kart: `74e5415e-4c35-4ed1-afe4-3955bc4d5fb0`
  - Sayfa: `/admin/uretim-emirleri`
  - Not: Düzenleme hatası giderilmeli; miktar değişikliği siparişe bağlı
    kullanılan miktarı güncellemeli, üretilen miktarın altına düşürülememeli.

- [ ] **Makineler arası üretim/operasyon aktarımı**
  - Kart: `0500e5ad-557b-48f3-9c3a-7d193555ff56`
  - Sayfa: `/admin/is-yukler`
  - Not: İşler makineler arasında sürüklenebilmeli; kalıp-makine uyumu
    doğrulanmalı ve makine bilgisi bütün ilgili kayıtlarda güncellenmeli.

- [ ] **Üretime ara verme ve sıradaki üretimi çalıştırma**
  - Kart: `78711e39-fb40-4497-986d-688c380b850e`
  - Sayfa: `/admin/operator`
  - Not: Aktif üretim duraklatılıp sıradaki çalıştırılabilmeli; duraklatılan iş
    daha sonra devam ettirilebilmeli.

- [ ] **Vardiya Analizi — önceki iki gerçek vardiya**
  - Kart: `fd541ef6-49f3-4630-8acb-0b2ff86a5394`
  - Sayfa: `/admin/vardiya-analizi`
  - Not: Ekran boş kalmamalı ve önceki iki gerçek vardiyayı göstermeli.

- [ ] **Inline çift taraflı üretim senaryosu**
  - Kart: `66c593f3-5c04-4e49-a4c3-1fbe771779a7`
  - Sayfa: `/admin/vardiya-analizi`
  - Not: Sağ/sol sürekli üretim, montaj ve stok hareketleri istenen iş kuralına
    göre uygulanmalı.

- [ ] **Günlük Üretim Girişi**
  - Kart: `fe149b76-3fce-43eb-911b-f51ef5426168`
  - Sayfa: `/admin/operator`
  - Not: Yinelenen vardiya seçimi kaldırılmalı, tarih aktif vardiyadan gelmeli,
    mobil tasarım düzeltilmeli; aynı davranış Bitir/Duraklat akışında olmalı.

- [ ] **Üretim emirleri düzeltme ekranı**
  - Kart: `3536f365-bf8c-4091-85ef-d5652ea229c6`
  - Sayfa: `/admin/uretim-emirleri`
  - Not: Mevcut toplu düzenleme ekranı siparişe bağlı müsait miktarlar ve manuel
    satırlarla yeniden tasarlanmalı; yeni toplu kayıt oluşturmamalı.

- [ ] **Makineden çıkarma hatası**
  - Kart: `10caa4b3-3140-4339-b905-fc1cf119ba09`
  - Sayfa: `/admin/uretim-emirleri`
  - Not: Makineye atanmış ürün makineden çıkarılırken oluşan hata giderilmeli.

- [ ] **Vardiya çifti**
  - Kart: `83d7e393-589b-41e8-9445-e01806604c19`
  - Sayfa: `/admin/vardiya-analizi`
  - Not: Makine başına üç vardiya yerine doğru önceki gün/gündüz-gece vardiya
    çifti gösterilmeli.

## Uygulama ve kapanış kuralı

1. Kartın mevcut davranışını ve kök nedenini doğrula.
2. Değişikliği uygula; ilgili test/build kontrollerini çalıştır.
3. Production'a dağıt ve kullanıcı senaryosunu canlıda doğrula.
4. Yazılımcı Notu kartına anlaşılır bir çözüm mesajı ekle.
5. Kartı yalnız doğrulamadan sonra `resolved` durumuna taşı.
6. Bu dosyadaki ilgili kutuyu kapat ve doğrulama notunu ekle.

## 3. Fuar

Fuar teklif çalışması mevcut üretim akışına eklenecek tek bir ekran değildir.
Bağımsız uygulama ve veritabanı olarak geliştirilecektir.

- [ ] **Fuar Teklif Modülü — 42 görev**
  - Kaynak: `Fuar_Teklif_Yazilim_Gorevleri.xlsx`
  - Dağılım: 20 kritik, 18 yüksek, 4 normal
  - Kapsam: ürünler, müşteriler, katalog, teklifler, R0/R1/R2 revizyonları,
    proforma, çeki listesi, navlun/kapasite tanımları, PDF/Excel çıktıları ve
    kabul testleri
  - Ayrıntılı değerlendirme:
    [YAZILIMCI-NOTLARI-FUAR-TEKLIF-MODULU-2026-07-30.md](./YAZILIMCI-NOTLARI-FUAR-TEKLIF-MODULU-2026-07-30.md)

## 4. CRM, Teklif ve Web

Tüm işler Paspas görev havuzunda üç ayrı ana başlıkla takip edilir:
`[CRM]`, `[Teklif]` ve `[Web]`. Transpalet CRM/teklif kaynakları Paspas backend
ve admin panele uyarlanacak; Promats frontend formları kalıcı web talebi
akışına bağlanacaktır.

- [ ] **Promats CRM + Teklif Modülü — 58 görev**
  - Kaynak: `/home/orhan/Documents/Projeler/transpalet-crm`
  - Hedef: Paspas backend, admin panel ve Promats frontend
  - Ana akış: web talebi → CRM talebi → müşteri → fırsat → aktiviteler →
    taslak teklif → PDF/gönderim → görüntülenme → kabul/red → satış siparişi →
    üretim/sevkiyat takibi
  - Ayrıntılı çeklist:
    [CEKLIST-PROMATS-TEKLIF-MODULU-TRANSPALET-AKTARIMI-2026-07-30.md](./CEKLIST-PROMATS-TEKLIF-MODULU-TRANSPALET-AKTARIMI-2026-07-30.md)
  - Dört ana başlık tanımı:
    [YAZILIMCI-NOTLARI-PASPAS-MODUL-GOREVLERI-2026-07-30.md](./YAZILIMCI-NOTLARI-PASPAS-MODUL-GOREVLERI-2026-07-30.md)
