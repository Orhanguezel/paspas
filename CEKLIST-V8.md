# Yazılımcı Notu V8 — Açık İşler Çeklisti

> **İnceleme:** 2026-07-01 — Claude canlı DB + kod + 4 ekran görüntüsü seviyesinde inceledi.
> **2 yeni not** (2026-07-01). İkisi de aynı çift-taraflı ürün senaryosunun (Megane) iki ayrı yüzü.
> **Yeni şema GEREKMİYOR.**

---

## Özet: İki not, tek kök senaryo

Sipariş **SS-2026-0029 → 1131 101 "MEGANE UYUMLU OTO PASPAS"** (çift taraflı, parti UP-2026-0006):

| Emir | Taraf | montaj flag | Üretilen | Emir durumu |
|------|-------|-------------|----------|-------------|
| UE-2026-0074 | Sağ (1131 101-R) | 0 | 4062 | tamamlandi |
| UE-2026-0073 | Sol (1131 101-L) | 1 | **3970** | **montaj_bekliyor** |

Reçete: 1 mamul = **1× Sol + 1× Sağ** + ambalaj. Sipariş 4000 adet.

---

## ✅ Not A — "Montaj bekliyor hatası" (`5d973f56` · /admin/uretim-emirleri) — TAMAMLANDI (Claude)

**Şikayet:** Üretim emri satırında durum yerine ham i18n anahtarı görünüyor:
`admin.erp.uretimEmirleri.statuses.montaj_bekliyor` (hem "Üretim Planla" hem "Üretimleri Görüntüle").

**Kök neden:** `uretimEmirleri.statuses` locale bloğunda `montaj_bekliyor` anahtarı eksikti; [uretim-emirleri-client.tsx:588](admin_panel/src/app/(main)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx#L588) dinamik `t(...statuses.${d})` lookup'ı boşa düşüyordu.

**Yapılan (Claude):**
- [tr.json:5153](admin_panel/src/locale/tr.json) → `"montaj_bekliyor": "Montaj Bekliyor"` eklendi (uretimEmirleri.statuses bloğu).
- Filtre dropdown'ına da `montaj_bekliyor` seçeneği eklendi ([uretim-emirleri-client.tsx:424](admin_panel/src/app/(main)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx#L424)).
- (en/de dosyası projede yok — sadece tr.json.)

**Durum:** ☑ Kod hazır → build + deploy → thread kapat.

---

## 🔴 Not B — "Malzeme stokları hatalı kayıt" (`a6551ab6` · /admin/stoklar) — KÖK NEDEN + KARAR

**Şikayet (4 görsel):** 4000 planlanan / 3970 üretilen mamul stoklarda görünmüyor, stok hareketi yok, satış siparişinde "üretilmemiş" (Üretilen —) görünüyor; ama hareketler menüsünde giriş kayıtları var → **tutarsız**.

### Görsellerin gerçek anlamı (veri BOZUK DEĞİL, tasarım kilidi)

- **Görsel2 (Malzeme Stokları):** Kullanıcı "Urun" sekmesinde sadece **mamulü** (1131 101, stok **0**, hareket yok) görüyor. Üretilen 3970/4062 → "**Operasyonel YM**" sekmesindeki Sağ/Sol tarafların stoğunda duruyor.
- **Görsel4 (Hareketler):** Giriş kayıtları **var** — ama `1131 101-L` / `1131 101-R` (taraf) adı altında (3970 / 4062).
- **Görsel3 (Satış Siparişi):** Mamul satırı "Üretilen —" çünkü mamul stoğu 0 (montaj yapılmadı). CLIO (tek taraflı) 6990 doğru görünüyor.

### 🎯 Kök neden — Montaj "hep-ya-hiç" ve SİPARİŞ miktarına kilitli

[uretim_emirleri/service.ts:214-227](backend/src/modules/uretim_emirleri/service.ts#L214) `tryMontajForUretimEmri`:

```
gerekli = per_unit × kalemMiktar     // kalemMiktar = SİPARİŞ miktarı = 4000
if (mevcut + 1e-9 < gerekli) → durum = montaj_bekliyor (montaj YAPILMAZ)
```

- Sol tarafı 3970 üretti (30 eksik). Montaj **tam 4000 Sol** istiyor → `3970 < 4000` → montaj hiç tetiklenmiyor.
- Üretim operasyonları **ikisi de tamamlandi** (operatör üretimi bitirdi, daha fazla üretim gelmeyecek).
- Montaj sadece operatör üretim bitirince otomatik denenir; **manuel "Montaj Yap" endpoint'i YOK**.
- Sonuç: **kalıcı deadlock** → mamul stoğu 0, sipariş "üretilmemiş", 3970+4062 taraf stoğu montajlanamadan asılı kalıyor.

### ⚖️ VERİLMİŞ KARAR — Ulaşılabilir (achievable) miktar montajı

> Mantıklı yol: Montaj, sipariş miktarının tamamını değil **eldeki taraflarla üretilebilecek tam takım sayısını** montajlar. Operatör üretimi zaten "tamamlandı" işaretlediyse (daha fazla üretim yok), eldeki 3970 takım montajlanır; mamul +3970 olur, sipariş 3970/4000 üretilmiş görünür. Eksik 30 adet bir **üretim gerçeği**, sistem kararı değil.

**Gerekçe:** İmalatta standart davranış = eşleşen parça sayısı kadar montaj. "Hep-ya-hiç @ sipariş miktarı" her az-üretimde (fire/eksik) kalıcı kilit üretir; kırılgan. Sağ 4062 (fazla), Sol 3970 (eksik) → 3970 tam takım gerçekten yapılabilir.

**Alternatif (admin veto ederse):** Manuel "Montaj Yap (miktar gir)" butonu — admin ne kadar montajlanacağına karar verir. (Önerilmez: her siparişte manuel adım.)

### B1 — Sistemik kod düzeltmesi (Codex) → [CODEX-PROMPT-V8.md](CODEX-PROMPT-V8.md)

`tryMontajForUretimEmri` (ve dolaylı `tryPendingMontajlarAfterStokArtis`):
- `montajMiktar = min( kalemMiktar, floor(min over kontrol edilen bileşenler (stok / per_unit)) )`.
- `montajMiktar <= 0` → `montaj_bekliyor` (gerçekten hiçbir şey yok).
- Aksi halde: `montajMiktar × per_unit` taraf/hammadde tüket, mamul `+montajMiktar` art, hareket kayıtları oluştur.
- Durum: `montajMiktar >= kalemMiktar` **VEYA** tüm kardeş operasyonel-YM üretim operasyonları `tamamlandi` ise → `tamamlandi`; değilse `montaj_bekliyor` (kısmi montajla, kalan üretim beklenir).
- Emir `uretilen_miktar` = montajlanan miktar.
- **Kapsam sınırı:** Bugünkü montaj yalnız operasyonel-YM taraflarını (+varsa hammadde) kontrol/tüketiyor; ambalaj yarimamulleri (Carset Kolisi, PVC Granül vb.) montajda tüketilmiyor — **bu davranış V8'de DEĞİŞMEYECEK** (ayrı not, aşağıda).

### B2 — Canlı veri düzeltmesi (Claude yapar)

Mevcut kilitli UE-2026-0073: kod fix deploy sonrası montaj tetiklenmiyor (deploy geçmişi düzeltmez). Claude canlıda B1 mantığının sonucunu birebir uygular (idempotent, tek seferlik):
- Mamul 1131 101 stok `+3970` + `giris` hareketi (`referans_tipi='montaj'`).
- Sol (1131 101-L) stok `-3970` (→ 0) + `cikis` hareketi. Sağ (1131 101-R) stok `-3970` (→ 92) + `cikis` hareketi.
- UE-2026-0073 durum `montaj_bekliyor` → `tamamlandi`.
- Sipariş kalem/durum senkron (refreshSiparisDurum eşdeğeri) → satışta 3970/4000 görünsün.
- **Önce doğrulama:** işlem öncesi stok/hareket snapshot al, hesap tutuyor mu kontrol et, sonra uygula.

---

## 📋 Ayrı Not (V8 kapsamı DIŞI — kayda geçir) — Ambalaj yarimamul tüketimi

`pickOperasyonKaynakKalemler` operasyonel-YM varsa **sadece** Sağ/Sol döndürüyor; reçetedeki ambalaj `yarimamul` kalemleri (Carset Kolisi 0.1, PVC Granül 1.0, Koli Etiketi 0.2, Sabitleme Klipsi 2.0, PP Çember 0.25) montajda **ne kontrol ediliyor ne düşülüyor**. Bu ayrı bir stok-doğruluk açığı. V8'e dahil değil (kapsam + risk); admin'e ayrı not olarak sorulacak / ayrı revizyonda ele alınacak.

---

## 6. Tamamlama

| # | Konu | Sayfa | Sahip | Durum |
|---|------|-------|-------|-------|
| Not A | montaj_bekliyor i18n anahtarı | uretim-emirleri | Claude | ☑ deploy (d92c170) + thread kapatıldı |
| Not B1 | Achievable montaj (sistemik) | uretim_emirleri/service | Claude | ☑ deploy (3bea1b5) + test güncellendi |
| Not B2 | UE-2026-0073 canlı montaj (3970) | — (bun script) | Claude | ☑ gerçek kod yolu: mamul +3970, Sağ→92, Sol→0, tamamlandi |
| Ek | Ambalaj yarimamul montaj tüketimi | uretim_emirleri/service | — | ⬜ ayrı revizyon/soru (thread notunda belirtildi) |

> **Kapanış (2026-07-01):** Her iki thread (`5d973f56`, `a6551ab6`) çözüm notuyla `resolved`. B1 achievable montaj yayında; B2 kilitli sipariş gerçek kod yolundan (`tryMontajForUretimEmri` + `refreshSiparisDurum`) montajlandı, doğrulandı. Kararı: **achievable montaj** (kullanıcı onayı).
