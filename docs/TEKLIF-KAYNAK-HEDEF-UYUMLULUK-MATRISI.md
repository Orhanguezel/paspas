# Teklif kaynak–hedef uyumluluk matrisi

Kaynak: `transpalet-crm` teklif modülü  
Hedef: Paspas backend/admin ve Promats web

## Veri modeli ve alan kararları

| Kaynak | Paspas hedefi | Karar ve alan farkı |
|---|---|---|
| `teklifler` | `teklifler` | Taşı/uyarla. `musteri_id`, durum, para birimi, toplamlar, koşullar, token ve sipariş bağı korunur; DTO Paspas standardında camelCase olur. Kaynağın doğrudan CRM `firsat_id` sahipliği yerine `crm_deal_teklifleri` bağı kullanılır. |
| `teklif_kalemleri` | `teklif_kalemleri` | Uyarla. `urun_id` Paspas `urunler.id` FK'sidir; kod, ad, birim, açıklama ve fiyat değişmez snapshot olarak ayrıca saklanır. Transpalet `teker_tipi` ve teknik ihtiyaç JSON'u çıkarılır. |
| `teklif_no_sayaclari` | aynı tablo | Birebir taşı; yıl satırı transaction/lock ile artırılır, format `TK-YYYY-NNNN`. |
| `teklif_revizyonlari` | aynı tablo | Uyarla; müşteri, kalem, fiyat ve koşulların tam JSON snapshot'ı saklanır. |
| `teklif_gonderimleri` | aynı tablo | Uyarla; kanal/durum/hata ve zaman bilgisi korunur, Paspas mail altyapısı kullanılır. |
| `teklif_sablonlari` | aynı tablo | Şema taşınır; Promats marka metni ve Paspas storage referansı kullanılır. |
| kaynak `talepler` | `teklif_talepleri` | Yeniden tasarla. Public web lead alanları (`kaynak_sayfa`, dil, kişi/firma, iletişim, konu, mesaj, form JSON, ürün JSON, UTM, KVKK, IP hash) ile CRM sorumlu/müşteri/teklif bağları tek kayıtta tutulur. |
| kaynak müşteri | Paspas `musteriler` | Mevcut kayıt sahipliği Paspas'tadır. Web lead önce `potansiyel`, sipariş dönüşümünde `aktif` olur; kaynak müşteri tablosu kopyalanmaz. |
| kaynak ürün metni | Paspas `urunler` + kalem snapshot | Ürün FK'si UUID'dir; güncel ERP kartı yalnız seçim anında okunur. Sonraki ürün değişikliği teklifi değiştirmez. |
| kaynak sipariş dönüşümü | Paspas `satis_siparisleri` | Mevcut sipariş şeması ve numaralandırması kullanılır; ikinci sipariş modeli oluşturulmaz. |
| kaynak dosya/logo | Paspas `storage_assets` | Dosya sahipliği mevcut storage modülünde kalır; teklif/PDF yalnız asset kimliği veya kontrollü URL referansı taşır. Binary/yerel dosya yolu teklif tablosuna kopyalanmaz. |
| kaynak kullanıcı/rol | Paspas `users`, `roles`, `permissions` | Kullanıcılar kopyalanmaz. `admin.teklifler`, `admin.teklif_talepleri`, `admin.teklif_onay` izinleri mevcut role bağlanır; iskonto limiti Paspas rol sözlüğünden hesaplanır. |

## Backend servis ve endpoint eşlemesi

| Transpalet parçası | Paspas karşılığı | Karar |
|---|---|---|
| `modules/teklifler/{schema,validation,repository,service,controller,router}` | `backend/src/modules/teklifler/*` | Paspas repository/controller düzenine uyarlandı; toplam ve geçiş kuralları sunucuda kalır. |
| `pdf.service.ts`, `pdfTemplate.ts` | aynı hedef servisler + `teklif-pdf.ts` | Promats markası, Paspas müşteri/ürün snapshot'ı ve sunucu PDF üretimiyle uyarlandı. Daima/transpalet metinleri çıkarıldı. |
| `/admin/crm/teklifler` | `/api/admin/teklifler` | Liste, detay, CRUD, kalem, PDF, gönderim, onay, revizyon, durum ve sipariş dönüşümü olarak taşındı. |
| kaynak CRM talep API'si | `/api/web/promats/teklif-talebi`, `/api/admin/teklif-talepleri` | Public intake ve auth-korumalı gelen kutusu olarak ayrıldı. Genel `/api/web/promats/contact` korunur. |
| public teklif tokenı | `/api/web/promats/teklif/:token` | Tahmin edilemez token ve görüntülenme kaydıyla uyarlandı. |
| `hesaplaToplamlar`, durum `GECISLER` | Paspas teklif repository/şeması | İş kuralları tek sunucu kaynağıdır; istemci toplamı ve serbest durum atlaması kabul edilmez. |

## Admin bileşen eşlemesi

| Kaynak admin | Paspas hedefi | Karar |
|---|---|---|
| `crm/teklifler/teklifler-client.tsx` | `admin/teklifler/_components/teklifler-client.tsx` | Paspas tablo, filtre ve izin bileşenlerine uyarlandı. |
| `crm/teklifler/[id]/teklif-editor.tsx` | `admin/teklifler/[id]/_components/teklif-editor-client.tsx` | Kalem, toplam, onay, gönderim, revizyon ve sipariş eylemleri taşındı. |
| kaynak teklif kalemi editörü | `teklif-kalem-dialog.tsx` | Paspas ERP ürün seçimi ve manuel snapshot kalemi birlikte desteklenir. |
| kaynak PDF görünümü | `teklif-print.tsx` + backend PDF endpointi | Tarayıcı önizleme ve indirilen PDF aynı sunucu toplamlarını gösterir. |
| kaynak CRM talepler listesi | `admin/teklif-talepleri/*` | Promats web gelen kutusu, detay ve müşteri+taslak dönüşümü olarak yeniden tasarlandı. |
| kaynak izin/nav yapısı | Paspas navigation ve endpoint izinleri | `admin.crm_teklif` kopyalanmadı; ayrık Paspas teklif izinleri kullanıldı. |

## Kapsam dışı ve entegrasyon sınırı

- Transpalet'e özel teker tipi, teknik ihtiyaç formu, makine/servis alanları ve
  Daima marka metinleri çıkarılır.
- Fuar modülünün palet, koli, CBM, konteyner, proforma ve çeki listesi alanları
  bu teklif modeline taşınmaz; ileride sipariş/ürün kimlikleri üzerinden bağlanır.
- CRM pipeline, aktivite, otomasyon ve rapor yapısı teklif çekirdeğinin sahibi
  değildir; teklif ve siparişe bağlantı tablolarıyla erişir.
