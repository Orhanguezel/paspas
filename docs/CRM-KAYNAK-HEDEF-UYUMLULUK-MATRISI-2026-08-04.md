# CRM kaynak–hedef uyumluluk matrisi

Kaynak: `/home/orhan/Documents/Projeler/transpalet-crm`  
Hedef: Paspas/Promats ortak backend ve `admin_panel`

| CRM parçası | Kaynak | Paspas hedefi | Karar |
|---|---|---|---|
| Pipeline ve aşamalar | `crm_pipelines`, `crm_stages` | Aynı tablo adları; Promats başlangıç verisi | Alan seviyesinde taşı |
| Talep/lead | `talepler` | Mevcut `teklif_talepleri` | Birleştir; ikinci lead tablosu oluşturma |
| Müşteri | `musteriler` | Mevcut `musteriler` + aday/aktif durumu | Birleştir; mevcut müşteri kimliği kaynak olsun |
| Fırsat | `crm_deals` | Yeni `crm_deals` | Transpalet teknik alanlarını çıkararak taşı |
| Fırsat ürünleri | `crm_deal_urunleri` | `urunler` bağlantısı + teklif snapshot aktarımı | Uyarlayarak taşı |
| Aktivite | `crm_activities` | Yeni ortak CRM aktivitesi | Müşteri, talep, fırsat, teklif ve siparişe bağla |
| Hatırlatma | `hatirlatmalar` | Yeni CRM hatırlatması + mevcut bildirim sistemi | Birleştir |
| İletişim geçmişi | CRM iletişim kayıtları | Mevcut mail/teklif gönderim kayıtlarıyla ilişki | Birleştir; gönderimi kopyalama |
| Otomasyon | CRM tetikleyici/eylemleri | Görev, bildirim ve sorumlu atama | Güvenli eylemleri taşı; idempotency zorunlu |
| Dashboard/rapor | CRM servisleri | Paspas durum sözlüğü üzerinden yeni CRM servisleri | Sorguları uyarlayarak taşı |
| Teklif | Kaynak CRM teklif bağlantıları | Mevcut `teklifler` | Birleştir; teklif modülünü değiştirme |
| Sipariş | Kaynak sipariş dönüşümü | Mevcut `satis_siparisleri` | Birleştir; mevcut V2/4 akışını kullan |
| Kullanıcı/rol | Kaynak CRM izinleri | Mevcut rol/izin kataloğu | `admin.crm_*` izinleri olarak birleştir |
| Audit | Kaynak CRM audit olayları | Mevcut admin audit altyapısı | Birleştir |

## Alan uyarlamaları

- `crm_pipelines`: `id`, `name`, `is_default`, `sort`, zaman alanları birebir korunur.
- `crm_stages`: sıra, olasılık, kazanıldı/kaybedildi, renk ve bekleme uyarısı korunur.
- `talepler`: kaynak/kanal, UTM, ürün ilgisi ve sorumlu alanları `teklif_talepleri` üzerinde genişletilir; dönüşüm için tekil fırsat bağı kurulur.
- `crm_deals`: müşteri, talep, pipeline/aşama, sorumlu, tutar, para birimi ve kapanış alanları korunur. Transpalete özel teker/teknik alanlar taşınmaz.
- Teklif ve sipariş tabloları CRM tarafından sahiplenilmez; yalnız çift yönlü yabancı anahtar/uygulama bağlantıları eklenir.

## Bağımlılık sırası

1. Pipeline/aşama
2. Talep birleşimi ve fırsat
3. Dönüşüm transactionı ve fırsat ürünleri
4. Aktivite, hatırlatma ve iletişim
5. Otomasyon, dashboard, rapor ve görünümler
6. İzin, audit, ERP çapraz bağları ve E2E

