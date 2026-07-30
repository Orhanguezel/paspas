# Paspas Modül Görevleri

**Tarih:** 2026-07-30  
**Görev havuzu:** Paspas  

Tüm geliştirmeler aynı Paspas görev havuzunda, aşağıdaki dört ana başlık
altında takip edilir. Başlıklar birbirinden ayrı görünür; veri ve süreç
entegrasyonları gerektiğinde ortak Paspas backend servislerini kullanır.

## 1. CRM

**Kaynak referans:** `transpalet-crm` CRM modülü

Kapsam:

- Talep/lead yönetimi
- Pipeline ve aşamalar
- Fırsatlar ve Kanban
- Aktiviteler, takvim ve hatırlatmalar
- İletişim geçmişi
- Kaybetme nedenleri
- Otomasyonlar
- Dashboard ve satış raporları
- CRM rol/yetkileri
- Müşteri, teklif, sipariş, üretim ve sevkiyat bağlantıları

Görev etiketi: `[CRM]`

## 2. Teklif

**Kaynak referans:** `transpalet-crm` teklif modülü

Kapsam:

- Teklif başlık ve kalemleri
- Ürün/fiyat/müşteri snapshotları
- Toplam, iskonto, KDV ve nakliye hesapları
- Teklif numaralandırması
- R0/R1/R2 revizyonları
- İskonto onayı
- Promats markalı PDF
- E-posta, WhatsApp ve manuel gönderim
- Public görüntülenme takibi
- Kabul/red ve satış siparişine dönüşüm
- Teklif admin liste ve editör ekranları

Görev etiketi: `[Teklif]`

## 3. Web

**Kapsam:** Promats web sitesi ve webden Paspas’a veri girişi

- Promats tasarım ve içerik revizyonları
- İletişim ve OEM formları
- Web teklif talebi endpointi
- Yapısal form veri sözleşmesi
- Ürün detayından teklif isteme
- Spam koruması, analitik ve form UX
- Web talebinin Paspas CRM/teklif gelen kutusuna aktarılması
- Eski iletişim endpointinin geriye uyumu

Görev etiketi: `[Web]`

## 4. Fuar

**Kaynak:** `Fuar_Teklif_Yazilim_Gorevleri.xlsx`

Kapsam:

- Bağımsız fuar teklif uygulaması
- Ürün ve ihracat bilgileri
- Müşteri yönetimi
- Katalog ve teklif sepeti
- Palet/koli/takım dönüşümleri ve MOQ
- CBM, ağırlık, konteyner ve TIR doluluğu
- Navlun, EXW/FOB/CIF hesapları
- Teklif revizyonları, proforma ve çeki listesi
- PDF/Excel çıktıları ve kabul testleri

Görev etiketi: `[Fuar]`

## Ortak kural

- Dört başlık da Paspas görev havuzunda bulunur (`source_app = paspas`).
- Kart başlıkları yalnız `[CRM]`, `[Teklif]`, `[Web]` veya `[Fuar]` ile
  başlar.
- Bir iş iki modülü etkiliyorsa tek sahibi belirlenir; diğer modül bağımlılık
  olarak görev açıklamasında belirtilir.
- Fuar bağımsız uygulama olarak geliştirilebilir, ancak görevi ve yönetimi
  Paspas içinde takip edilir.
