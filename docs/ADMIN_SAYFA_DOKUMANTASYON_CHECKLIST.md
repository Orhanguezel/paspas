# Admin Sayfa Dokumantasyon Checklist

Bu dokuman, admin paneldeki her sayfanin dokumantasyonunu sayfa sayfa yazmak icin takip listesidir. Simdilik amac checklist olusturmak; her madde daha sonra ayri dokuman bolumu olarak doldurulacak.

## Dokuman Yazim Sablonu

Her sayfa icin asagidaki basliklar doldurulacak:

- [ ] Sayfanin amaci
- [ ] Kim kullanir / rol yetkileri
- [ ] Ana ekran bolumleri
- [ ] Liste, filtre ve arama davranislari
- [ ] Form alanlari ve zorunlu alanlar
- [ ] Olusturma / duzenleme / silme akislar
- [ ] Bagli moduller ve veri etkileri
- [ ] Sik hata durumlari
- [ ] Riskler ve dikkat notlari
- [ ] Smoke / manuel test adimlari

## Menu Bazli Checklist

### Genel

- [x] Is Ortaklari
  - [x] Musteriler - `/admin/musteriler`
  - [x] Musteri Detay - `/admin/musteriler/[id]`
  - [x] Tedarikciler - `/admin/tedarikci`
  - [x] Tedarikci Detay - `/admin/tedarikci/[id]`
- [x] Urunler - `/admin/urunler`
- [x] Uretim Tanimlari
  - [x] Makineler - `/admin/makineler`
  - [x] Kaliplar - `/admin/tanimlar?tab=kaliplar`
  - [x] Durus Nedenleri - `/admin/tanimlar?tab=durus-nedenleri`
  - [x] Birimler - `/admin/tanimlar?tab=birimler`
- [x] Calisma Planlari
  - [x] Tatil Gunleri - `/admin/tanimlar?tab=tatiller`
  - [x] Vardiyalar - `/admin/tanimlar?tab=vardiyalar`
  - [x] Hafta Sonu Planlari - `/admin/tanimlar?tab=hafta-sonu-planlari`

### Uretim Surecleri

- [x] Satis Siparisleri - `/admin/satis-siparisleri`
- [x] Satis Siparisi Detay - `/admin/satis-siparisleri/[id]`
- [x] Uretim Emirleri - `/admin/uretim-emirleri`
- [x] Uretim Emri Detay - `/admin/uretim-emirleri/[id]`
- [x] Makine Is Yukleri - `/admin/is-yukler`
- [x] Operator Ekrani - `/admin/operator`
- [x] Gantt Plani - `/admin/gantt`
- [x] Vardiya Analizi - `/admin/vardiya-analizi`

### Lojistik ve Stok

- [x] Sevkiyat - `/admin/sevkiyat`
- [x] Malzeme Stoklari - `/admin/stoklar`
- [x] Satin Alma - `/admin/satin-alma`
- [x] Satin Alma Detay - `/admin/satin-alma/[id]`
- [x] Mal Kabul - `/admin/mal-kabul`
- [x] Mal Kabul Detay - `/admin/mal-kabul/[id]`
- [x] Hareketler - `/admin/hareketler`

### Sistem Yonetimi

- [x] Sistem & Ayarlar Ana Sayfa - `/admin/sistem`
  - [x] Kullanicilar - `/admin/sistem?tab=kullanicilar`
  - [x] Giris Ayarlari - `/admin/sistem?tab=giris-ayarlari`
  - [x] Site Ayarlari - `/admin/sistem?tab=site-ayarlari`
  - [x] Medyalar - `/admin/sistem?tab=medyalar`
  - [x] Veritabani - `/admin/sistem?tab=veritabani`
  - [x] Audit Loglari - `/admin/sistem?tab=audit-logs`
- [x] Test Merkezi - `/admin/test-merkezi`
- [x] Kullanici Detay - `/admin/users/[id]`
- [x] Profil - `/admin/profile`
- [x] Bildirimler - `/admin/notifications`
- [x] Bildirim Detay - `/admin/notifications/[id]`
- [x] Mail - `/admin/mail`
- [x] Tema - `/admin/theme`
- [x] Kaynaklar - `/admin/resources`

## Site Ayarlari Alt Sekmeleri

- [x] Liste - `/admin/site-settings`
- [x] Global Liste - `/admin/site-settings`
- [x] Genel Ayarlar
- [x] SEO Ayarlari
- [x] SMTP Ayarlari
- [x] Cloudinary Ayarlari
- [x] Marka Medya Ayarlari
- [x] API ve Entegrasyonlar
  - [x] Google OAuth & Analytics
  - [x] Yapay Zeka API Kodlari
  - [x] Cookie Consent / Diger Global Ayarlar
- [x] Dil Ayarlari
- [x] Branding Ayarlari
- [x] Site Ayari Detay - `/admin/site-settings/[id]`

## Oncelik Sirasi

1. [x] Sistem & Ayarlar
2. [x] Test Merkezi
3. [x] Urunler
4. [x] Satis Siparisleri
5. [x] Uretim Emirleri
6. [x] Stoklar
7. [x] Satin Alma
8. [x] Mal Kabul
9. [x] Sevkiyat
10. [x] Tanimlar ve planlama sekmeleri
11. [x] Is Ortaklari
12. [x] Makine Is Yukleri
13. [x] Operator Ekrani
14. [x] Gantt Plani
15. [x] Vardiya Analizi
16. [x] Hareketler
17. [x] Kullanici Detay
18. [x] Profil
19. [x] Bildirimler
20. [x] Bildirim Detay
21. [x] Mail
22. [x] Tema
23. [x] Kaynaklar
24. [x] Site Ayarlari Liste
25. [x] Site Ayarlari Global Liste
26. [x] Site Ayarlari Genel Ayarlar
27. [x] Site Ayarlari SEO Ayarlari
28. [x] Site Ayarlari SMTP Ayarlari
29. [x] Site Ayarlari Cloudinary Ayarlari
30. [x] Site Ayarlari Marka Medya Ayarlari
31. [x] Site Ayarlari API ve Entegrasyonlar
32. [x] Site Ayarlari Dil Ayarlari
33. [x] Site Ayarlari Branding Ayarlari
34. [x] Site Ayari Detay

## Notlar

- Dokumantasyon menudeki gorunen sayfalari esas alacak.
- Detay sayfalari ilgili liste sayfasinin altinda ele alinacak.
- Risk notlari ayrica Claude AI tarafindan cozum onerisi uretilecek sekilde isaretlenebilir.
- Test Merkezi sayfasi icin AI destekli log ozeti ve risk onerisi ayrica dokumante edilecek.
