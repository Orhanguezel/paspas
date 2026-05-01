# 09 — Otomasyon Eşikleri & Onay Kuralları

> **Bağlam (v1.1):** Bu doküman risk skoru × güven eşiği × tutar limiti üçlü onay matrisinin **detaylı tasarımını** içerir. Faz 8 (Konversasyonel) bu kuralları kullanır. Risk yönetimi genel: [`proje-teklifi/09-risk.md`](../proje-teklifi/09-risk.md). Audit log şeması: [`proje-teklifi/06-veri-modeli.md`](../proje-teklifi/06-veri-modeli.md#faz-8--konversasyonel-3-tablo).

## Soru

> "AI önerilerinin hangi tutar/güven skoru üstünde manuel onaya çıksın?"

İki uç:
- **Aşırı muhafazakar:** her AI önerisi insan onayı bekler → güven yüksek, ama AI değer üretmez (insan zamanını yine yer).
- **Aşırı liberal:** AI her şeyi otomatik yapar → değer yüksek ama hata maliyeti büyük (yanlış mail/sipariş/satınalma).

Doğru cevap **risk seviyesine göre kademeli kural seti**. Bu doküman 4 boyutla bunu tasarlar.

## 1. Risk boyutları

Her aksiyonu 4 boyutta puanla:

| Boyut | Soru | Puan |
|-------|------|------|
| **Geri alınabilirlik** | Hata olursa kolay düzeltilir mi? | Kolay (1) → Mümkün (2) → Zor (3) → Geri alınamaz (4) |
| **Para etkisi** | Tutar büyüklüğü? | <500₺ (1) → 5K (2) → 50K (3) → >50K (4) |
| **Dış görünüm** | Müşteri/tedarikçi/kamu görüyor mu? | İçeride kalır (1) → İç dağıtım (2) → Müşteri görür (3) → Kamu görür (4) |
| **Veri etkisi** | Kaç kayıt etkileniyor? | 1 (1) → <10 (2) → <100 (3) → >100 (4) |

**Toplam risk skoru:** 4 boyutun toplamı (4-16 arası)

| Skor | Seviye | Kural |
|------|--------|-------|
| 4-6 | Düşük | AI otomatik yapar (sessiz) |
| 7-9 | Orta | AI taslak çıkarır, onay UI'da bekler (5 dk içinde tepki yoksa email uyarı) |
| 10-12 | Yüksek | AI önerir + insan zorunlu onay + audit log |
| 13-16 | Kritik | AI sadece bilgilendirir; aksiyon **insan başlatır**, AI yardımcı |

## 2. Aksiyon kataloğu — risk skoruna göre

### Düşük (4-6) — AI sessizce yapar

| Aksiyon | Risk | Gerekçe |
|---------|------|---------|
| Lead skoru hesapla / güncelle | 4 | Sadece DB içi sıralama |
| Müşteri profili re-segment | 5 | Otomatik etiket, sayısal etki yok |
| Stok hızı raporu üret | 4 | Read-only |
| Tedarikçi performans skor güncelle | 5 | İç metrik |
| Talep özeti yapılandır (havuza yaz) | 6 | DB write ama "yeni" durumda kalır, aksiyon yok |
| Geri besleme metrik kaydet | 4 | İç audit |

### Orta (7-9) — taslak + sessiz onay penceresi

| Aksiyon | Risk | Onay penceresi |
|---------|------|----------------|
| Stok yeniden sipariş önerisi (taslak) | 8 | 24 saat — sessiz onayla otomatik satın alma siparişi taslağı |
| Üretim önerisi (planlanan, taslak) | 7 | 12 saat |
| Lead'e iletildi durumuna geçir | 7 | Anlık (ama email gönderme yok) |
| Olası talep tahmini → siparişe önerilen | 9 | 24 saat |

### Yüksek (10-12) — insan onayı zorunlu

| Aksiyon | Risk | Notlar |
|---------|------|--------|
| Satın alma siparişi (PO) onaylama → tedarikçiye gitsin | 11 | Tutar limit yok, hep manuel |
| Üretim emri açma | 10 | Stok rezervasyon ve makine yükü |
| Müşteri sipariş açma (B2B portaldan) | 12 | Stok + üretim + finansal |
| Lead'e otomatik email gönder | 11 | Tedarikçi/müşteri ilişkisini etkiler |
| Fiyat değişikliği önerme | 11 | Müşteri ilişkisi |

### Kritik (13-16) — sadece bilgi, insan başlatır

| Aksiyon | Risk | Notlar |
|---------|------|--------|
| Toplu mail kampanyası başlat | 14 | 1000+ alıcı, domain reputasyon |
| Tedarikçi/müşteri silme | 15 | Veri kaybı |
| Fiyat listesi tüm müşterilerde değiştir | 16 | İçerik değişikliği büyük |
| Ödeme/iade işlemi | 16 | Para hareketi |

## 3. Tutar bazlı override kuralları

Skor üstüne ek **mutlak limitler**:

| Aksiyon türü | AI'nın otomatik yapabileceği üst tutar |
|--------------|----------------------------------------|
| Satın alma siparişi taslağı | **2.000₺** üstü zorunlu manuel onay |
| Müşteri sipariş onayı (B2B portal) | **10.000₺** üstü ek onay (satış müdürü) |
| Toplu email | **100 alıcı** üstü manuel onay |
| Stok düzeltme (manuel) | Hiçbir zaman AI yapmaz, sadece insan |

## 4. Güven skoru bazlı override

AI'nın kendi `guven_skoru` (LLM çıktıdan parse) bazlı:

| Güven aralığı | Davranış |
|---------------|----------|
| 0.95-1.00 | Otomatik (eğer risk skoru izin veriyorsa) |
| 0.80-0.95 | Onay bekler |
| 0.60-0.80 | Onay zorunlu + AI alternatif öneri sunmaya zorlanır |
| <0.60 | Aksiyon önerme; sadece "şunu netleştirir misiniz" sorusu |

Örnek: AI talep özetinde `guven_skoru=0.92` çıkarsa "10K sipariş aç" öneremez (risk yüksek + güven 0.95 altı). Ama `guven_skoru=0.97` çıkarsa "5K sipariş taslağı" otomatik açabilir.

## 5. Reddedilen önerilerden öğrenme

Geri besleme tablosu:

```sql
CREATE TABLE ai_oneri_geri_besleme (
  id char(36) PK,
  oneri_id char(36),
  oneri_tipi varchar(64),
  ai_guven_skoru decimal(4,2),
  risk_skoru int,
  insan_karari ENUM('onayli','red','revize','iptal'),
  red_sebebi text,
  manual_alternatif JSON,            -- insan ne yaptı
  created_at datetime
);
```

Haftalık cron:
- Red oranı %30 üzeri olan aksiyon türleri → eşik yükselt
- Onay-revize ratio %50 üzeri → AI eksik bilgi alıyor, prompt güncelle
- Red sebepleri kümele → top-3'ü prompt'a few-shot olarak ekle

## 6. Audit log zorunluluğu

Risk 7+ olan **her aksiyon** audit kaydı zorunlu:

```sql
CREATE TABLE ai_aksiyon_audit (
  id char(36) PK,
  aksiyon_tipi varchar(64),
  tetikleyen ENUM('ai_otomatik','ai_onerili','insan_manuel'),
  ai_oneri_id char(36),                -- AI önermişse
  insan_user_id char(36),              -- onaylayan/yapan
  payload JSON,                        -- ne yapıldı
  oncesi_state JSON,                   -- aksiyondan önce DB'deki ilgili kayıt
  sonrasi_state JSON,                  -- aksiyon sonrası
  rollback_mumkun tinyint,
  rollback_yapildi_at datetime,
  notlar text,
  created_at datetime
);
```

## 7. Rollback stratejisi

| Aksiyon türü | Rollback | Süre |
|--------------|----------|------|
| Sipariş açma | DB delete (henüz üretime aktarılmadıysa) | Sınırsız |
| Üretim emri açma | DB delete + rezervasyon iptal | Üretim başlamadan |
| Email gönderildi | Mümkün değil ❌ | — |
| Satın alma siparişi onaylandı (tedarikçiye) | Mümkün değil; iptal yazısı gerekir | — |
| Stok düzeltme | Ters yönde düzeltme | Sınırsız |

**Rollback olmayan aksiyonlar her zaman insan onayı gerektirir** — risk skoruna bakılmaz.

## 8. Müşteri/yönetici konuşma katmanında uygulama

[Faz 6 — konversasyonel katman](./07-konversasyonel-katman.md) için:

```
KULLANICI: "5000 takım STAR SİYAH sipariş ver, ay sonuna yetişsin"
AI: niyet çıkar, parametreleri topla
    risk_skoru = 4(geri al kolay) + 3(50K tutar) + 3(müşteri görür) + 1(1 kayıt) = 11 (Yüksek)
    guven_skoru = 0.93
AI: TASLAK ÖNER → onay bekle (zorunlu, risk yüksek)
KULLANICI: "Onayla"
AI: aksiyon yap → DB write + audit log
AI: "Sipariş SS-2026-0125 oluşturuldu. 28 Mart sevke hazır."
```

## 9. Acil durum kill-switch

Kullanıcı her zaman:
- Tüm AI önerilerini global olarak **kapatabilir** (admin ayar)
- Belirli aksiyon türünü **kapatabilir** ("AI artık satın alma siparişi açmasın")
- Belirli AI provider'ı **kapatabilir** (örn. Claude pahalıysa Groq'a düş)

```sql
CREATE TABLE ai_otomasyon_ayarlari (
  id char(36) PK,
  scope ENUM('global','aksiyon_tipi','provider'),
  scope_value varchar(128),         -- aksiyon adı veya provider adı
  enabled tinyint,
  notlar text,
  updated_by char(36),
  updated_at datetime
);
```

## 10. Önerilen başlangıç yapılandırması

| Ayar | Değer |
|------|-------|
| Risk 4-6 otomasyonu | **Aktif** |
| Risk 7-9 otomasyon (sessiz onay) | **Kapalı** ilk 3 ay — manuel onay zorunlu |
| Risk 7-9 otomasyon | 3 ay sonra **Aktif** (geri besleme verisi yeterse) |
| Risk 10+ | Hep manuel |
| Güven skoru eşiği | 0.90 (otomatik için) |
| Tutar limiti — satın alma | **1.000₺** ilk 6 ay |
| Tutar limiti — müşteri sipariş onay | **5.000₺** ilk 6 ay |
| Audit log saklama | Sınırsız |
| Kill-switch | Always available |

İlk 3 ay = "öğrenme dönemi". Sapma metrikleri toparlanır, eşikler kalibre edilir, sonra otomasyonlar kademeli açılır.

## Açık karar noktaları

1. **İlk başlangıç tutarı:** 1.000₺ ve 5.000₺ önerim uygun mu? Daha düşük/yüksek?
2. **Sessiz onay penceresi:** 12-24 saat mi, daha kısa mı (örn. 1 saat)?
3. **Kill-switch yetkisi:** sadece sistem admin mi, satış müdürü de yapabilsin mi?
4. **Audit log saklama:** sınırsız mı, 5 yıl gibi sınır mı?
5. **AI kararsızlığı:** "AI emin değilim, insan karar versin" durumu için ayrı bir kuyruk mu?
