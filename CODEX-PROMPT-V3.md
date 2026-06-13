# Codex Prompt — Paspas ERP V3 Yazılımcı Notu Toplu Düzeltme

Aşağıdaki içeriği olduğu gibi Codex'e ver.

---

## 🤖 GÖREV — Codex'e

Paspas Üretim ERP'sinde **14 açık yazılımcı notu** var (13 yeni + 1 yeniden açılan). Claude her notu canlı DB + kod seviyesinde inceledi; kök nedenler ve kararlar hazır:
👉 **[CEKLIST-V3.md](./CEKLIST-V3.md)** — 10 madde (B1-B5, U1-U3, Y1-Y2)

### Önce oku, sonra başla

1. **`CEKLIST-V3.md`** — Maddeler + Claude'un inceleme bulguları (Bölüm 0: F1-F8) + hazır şema kontratları (Bölüm 0b). Bulgular doğrulanmış veridir; yeniden keşfetmeye çalışma, üzerine inşa et.
2. **`backend/CLAUDE.md`** + **`admin_panel/CLAUDE.md`** — modül mimarisi, Select sentinel kuralı, i18n.
3. Hazır seed'ler (değiştirme, sadece koduna yansıt):
   - [201_sub_categories_parent.sql](backend/src/db/seed/sql/201_sub_categories_parent.sql)
   - [202_urunler_alt_grup.sql](backend/src/db/seed/sql/202_urunler_alt_grup.sql)
   - [203_satin_alma_kalem_termin.sql](backend/src/db/seed/sql/203_satin_alma_kalem_termin.sql)

### Kritik bağlam (V2'den farklı olan şeyler)

- **V3-B1 muhtemel V2 regresyonu** ve müşterinin günlük operasyonunu bozuyor — İLK o yapılır. Kök neden analizi hazır (CEKLIST F2): transaction-sonrası yan adımlar (`recalcMakineKuyrukTarihleri`, `transitionMultipleKalemDurum`, `tryMontaj*`, `createAdminNotification`) korumasız. Çözüm kalıbı: yan adımı try/catch ile izole et + idempotency + buton disable. **Ana transaction'a dokunma.**
- **V3-B3'te kod zinciri ÇALIŞIYOR** (Claude uçtan uca doğruladı) — yeniden yazma. Yalnızca: (a) draft akışına açıklama ekle, (b) modal'a başlık + "açıklama girilmemiş" yönlendirme satırı.
- **V3-Y1 üç notu tek mimariyle kapatır** — `sub_categories.parent_id` + `urunler.alt_grup`. İki seviye sınırı: alt grubun altına alt grup açılamaz (validation).
- **V3-Y2'de yeni rol YOK** — mevcut `nakliyeci` rolü. Backend'de de 403 koruması şart (yalnızca UI gizleme yetmez).

### Sıralama

`V3-B1 → B2 → B3 → B4 → B5 → U1 → U2 → U3 → Y1 → Y2`

B5 ile U1 aynı default-filtre mantığını paylaşır (U1'i yaparken B5'i kapat). B1 ile B2 aynı yan-adım-izolasyon kalıbını paylaşır.

### Şema kuralı (KRİTİK)

- **`ALTER TABLE` koduna yazmak yasak** — şema değişiklikleri yalnızca hazır seed dosyalarında (201/202/203, idempotent).
- Senin işin: Drizzle şema dosyalarını (`schema.ts`) yeni kolonlara göre güncellemek + validation + DTO + UI.
- Bu üç seed dışında şema ihtiyacı çıkarsa **DUR ve Claude'a sor**.
- Seed'leri canlı DB'ye Claude uygular — sen uygulamaya çalışma.

### Commit ve build kuralları

- **Her madde ayrı commit:** `fix(operator): bitir akisinda yan adim hatalarini izole et (V3-B1)` formatında.
- Her madde sonunda: `cd backend && bun run build` + `cd admin_panel && bun x tsc --noEmit -p tsconfig.json`. Tüm liste bitince: `cd admin_panel && bun run build`.
- Build kırıksa sonraki maddeye geçme.
- **Push etme.** Bitince Claude'a haber ver — review + seed uygulama + deploy + thread kapatma Claude'da.

### Kabul kriterleri

Her maddenin kendi "Kabul kriteri" satırı CEKLIST-V3.md'de — kendini onunla test et. Özellikle:
- B1: yan adım hatası simülasyonunda kayıt tek + UI hatasız.
- B2: çift "üretime aktar" → ikincisi atlanır.
- Y1: Paspas→Maximum→ürün ataması→filtre→sipariş işlemleri gruplaması uçtan uca.
- Y2: nakliyeci stok üstü miktar giremez; admin görünümü değişmez.

### İlerleme raporu

Her maddede tek satır:
```
[Codex] V3-B1 tamam. Sıra: V3-B2. Build: OK.
```
Bitince:
```
[Codex] V3 toplam 10 madde tamamlandı. Build OK. Claude'a deploy için hazır.
```

### Belirsizlik olursa

CEKLIST-V3.md + bulgular yetmezse **DUR ve sor** — varsayımla ilerleme.

---

## 📂 Hızlı Bağlantılar

- Çeklist: [CEKLIST-V3.md](CEKLIST-V3.md)
- V2 referansı: [CEKLIST-V2.md](CEKLIST-V2.md) (aynı disiplin)
- Sunucu (deploy = Claude): [SERVER.md](SERVER.md)
- Kritik dosyalar: `backend/src/modules/operator/repository.ts` (B1), `backend/src/modules/satis_siparisleri/` (B2/B5/U1), `admin_panel/.../sevkiyat-client.tsx` (B4/U2/Y2), `admin_panel/.../urun-form.tsx` (B3/Y1), `admin_panel/.../tanimlar/_components/kategoriler-tab.tsx` (Y1), `backend/src/modules/subCategories/` (Y1), `backend/src/modules/satin_alma/` (U3)
