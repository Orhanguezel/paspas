# Rev4 Mimari Plan

> **Tarih:** 2026-03-31
> **Yazar:** Claude Code (Mimar)
> **Kaynak:** `docs/V1_REV4_CEKLIST.md`, mevcut kod analizi
> **Implementor:** Codex (backend+frontend) | Antigravity (UI gorevleri)

---

## Faz Sirasi

```
Faz 0: Bug fix + kucuk iyilestirmeler (bagimsiz, hemen baslanabilir)
Faz 1: Siparis Kalem Durumu State Machine (temel, her sey buna bagimli)
Faz 2: Siparis Ekrani Bolunmesi (Faz 1'e bagimli)
Faz 3: Uretim Emirleri Ekran Revizyon (Faz 1'e bagimli)
Faz 4: Operator Ekrani Revizyon (Faz 1 + Faz 3'e bagimli)
Faz 5: Gantt, Stok, Satin Alma, Mal Kabul (paralel, bagimsiz)
Faz 6: Dashboard (tum moduller hazir olduktan sonra)
```

---

## Faz 0: Bug Fix + Kucuk Iyilestirmeler

### 0.1 OZ-2-BUG — Sevkiyat Hareket Yonu

**Sorun:** `sevkiyat/repository.ts` satir ~495 — `hareketler.miktar` pozitif kaydediliyor. Musteri negatif gormek istiyor.

**Mevcut Durum:**
```typescript
// sevkiyat/repository.ts — repoPatchSevkEmri icinde:
await tx.insert(hareketler).values({
  hareket_tipi: 'cikis',
  miktar: String(existing.miktar),  // ← POZITIF (ornek: "100")
});
```

**Cozum:** `miktar` alanini negatif kaydet:
```typescript
miktar: String(-Math.abs(Number(existing.miktar))),  // ← "-100"
```

**Etki Alani:**
- `sevkiyat/repository.ts` — repoPatchSevkEmri
- `hareketler` listesinde frontend zaten `miktar` degerini gosteriyor, negatif gelince otomatik -100 gorunecek
- Mevcut pozitif kayitlar icin migration gerekmez (ileriye donuk)

---

### 0.2 OP-3g BUG — Duraklama Miktar Yansimasi

**Sorun:** Operator duraklatiyor + miktar giriyor, ama UE ve siparis ekranlarinda `uretilen_miktar` hala 0.

**Kok Neden:** `operator/repository.ts` — `repoDevamEt` fonksiyonunda stok guncelleniyor (urunler.stok arttirilip hareketler kaydediliyor) AMA `uretim_emri_operasyonlari.uretilen_miktar` ve `uretim_emirleri.uretilen_miktar` guncellenmIyor.

**Cozum:** `repoDevamEt` icinde, stok update'den sonra:
```typescript
// operasyon uretilen miktarini guncelle
if (kqRow.emir_operasyon_id) {
  await tx
    .update(uretimEmriOperasyonlari)
    .set({
      uretilen_miktar: sql`${uretimEmriOperasyonlari.uretilen_miktar} + ${netMiktar.toFixed(4)}`,
    })
    .where(eq(uretimEmriOperasyonlari.id, kqRow.emir_operasyon_id));
}

// parent emir uretilen miktarini guncelle
if (kqRow.uretim_emri_id) {
  await tx
    .update(uretimEmirleri)
    .set({
      uretilen_miktar: sql`${uretimEmirleri.uretilen_miktar} + ${netMiktar.toFixed(4)}`,
    })
    .where(eq(uretimEmirleri.id, kqRow.uretim_emri_id));
}
```

**Etki Alani:** `operator/repository.ts` — repoDevamEt (ve repoDuraklat eger orada da miktar girisi varsa)

---

### 0.3 MS-1 — Kritik Stok Gorunum Duzeltmesi

**Sorun:** Kritik stok miktari girilmemis malzemeler "yetersiz" gorunuyor.

**Cozum:** Frontend'de stok durumu hesaplamasinda:
```typescript
// Eski: stok < kritikStok → yetersiz
// Yeni: kritikStok > 0 && stok < kritikStok → yetersiz
// kritikStok === 0 || kritikStok === null → durum gosterme (normal)
```

---

## Faz 1: Siparis Kalem Durumu State Machine

Bu faz tum Rev4'un temelidir. Siparis kalemlerine acik bir `uretim_durumu` alani ekleniyor.

### 1.1 DB Degisikligi — siparis_kalemleri tablosuna `uretim_durumu` ekleme

**Seed dosyasi:** `backend/src/db/seed/sql/160_siparis_kalemleri_uretim_durumu.sql`

```sql
ALTER TABLE siparis_kalemleri
  ADD COLUMN uretim_durumu VARCHAR(32) NOT NULL DEFAULT 'beklemede'
  AFTER sira;

-- Mevcut verileri guncelle: UE'ye bagli olanlar icin durum hesapla
UPDATE siparis_kalemleri sk
  INNER JOIN uretim_emri_siparis_kalemleri uesk ON uesk.siparis_kalem_id = sk.id
  INNER JOIN uretim_emirleri ue ON ue.id = uesk.uretim_emri_id
SET sk.uretim_durumu = CASE
  WHEN ue.durum = 'tamamlandi' THEN 'uretim_tamamlandi'
  WHEN ue.durum = 'uretimde' THEN 'uretiliyor'
  WHEN ue.durum IN ('makineye_atandi', 'planlandi') THEN 'makineye_atandi'
  WHEN ue.durum = 'atanmamis' THEN 'uretime_aktarildi'
  ELSE 'beklemede'
END;
```

**Durum Enum Degerleri:**
```typescript
export const URETIM_DURUMLARI = [
  'beklemede',           // Hicbir islem yapilmamis
  'uretime_aktarildi',   // UE olusturuldu, makine atanmadi
  'makineye_atandi',     // UE makineye atandi
  'uretiliyor',          // Operator uretimi baslatti
  'duraklatildi',        // Operator duraklatti
  'uretim_tamamlandi',  // Uretim bitti
] as const;
export type UretimDurumu = typeof URETIM_DURUMLARI[number];
```

### 1.2 Schema Guncelleme

**Dosya:** `backend/src/modules/satis_siparisleri/schema.ts`

```typescript
// siparis_kalemleri tablosuna ekle:
uretim_durumu: varchar('uretim_durumu', { length: 32 }).notNull().default('beklemede'),
```

### 1.3 Durum Gecis Kurallari (Backend Service)

**Yeni dosya:** `backend/src/modules/satis_siparisleri/kalem-durum.service.ts`

```typescript
const VALID_TRANSITIONS: Record<UretimDurumu, UretimDurumu[]> = {
  beklemede:          ['uretime_aktarildi'],
  uretime_aktarildi:  ['makineye_atandi', 'beklemede'],        // geri: UE silinirse
  makineye_atandi:    ['uretiliyor', 'uretime_aktarildi'],     // geri: makineden cikarilirsa
  uretiliyor:         ['duraklatildi', 'uretim_tamamlandi'],
  duraklatildi:       ['uretiliyor', 'uretim_tamamlandi'],
  uretim_tamamlandi:  [],                                      // terminal
};

export async function transitionKalemDurum(
  kalemId: string,
  yeniDurum: UretimDurumu,
  tx?: MySqlTransaction,
): Promise<void> {
  const conn = tx ?? db;
  const [kalem] = await conn
    .select({ uretim_durumu: siparisKalemleri.uretim_durumu })
    .from(siparisKalemleri)
    .where(eq(siparisKalemleri.id, kalemId))
    .limit(1);

  if (!kalem) throw new Error('kalem_bulunamadi');

  const mevcutDurum = kalem.uretim_durumu as UretimDurumu;
  const gecerliGecisler = VALID_TRANSITIONS[mevcutDurum];

  if (!gecerliGecisler.includes(yeniDurum)) {
    throw new Error(`gecersiz_gecis:${mevcutDurum}_to_${yeniDurum}`);
  }

  await conn
    .update(siparisKalemleri)
    .set({ uretim_durumu: yeniDurum })
    .where(eq(siparisKalemleri.id, kalemId));
}
```

### 1.4 Entegrasyon Noktalari — Kim Ne Zaman Cagiracak

| Olay | Tetikleyen Modul | Yeni Durum | Mevcut Dosya |
|------|-------------------|------------|--------------|
| UE olusturuldu | `uretim_emirleri/repository.ts` | `uretime_aktarildi` | repoCreate icinde, junction insert sonrasi |
| UE silindi | `uretim_emirleri/repository.ts` | `beklemede` | repoDelete icinde |
| Makine atandi | `makine_havuzu/repository.ts` | `makineye_atandi` | makineye atama fonksiyonunda |
| Makine atama geri alindi | `makine_havuzu/repository.ts` (YENi) | `uretime_aktarildi` | yeni "atamayi geri al" fonksiyonunda |
| Uretim baslatildi | `operator/repository.ts` | `uretiliyor` | repoUretimBaslat icinde |
| Uretim duraklatildi | `operator/repository.ts` | `duraklatildi` | repoDuraklat icinde |
| Uretim devam etti | `operator/repository.ts` | `uretiliyor` | repoDevamEt icinde |
| Uretim tamamlandi | `operator/repository.ts` | `uretim_tamamlandi` | repoUretimBitir icinde |

**Cift Tarafli Ozel Kural:**
- Siparis kalemi durumu cift taraflida **montaj operasyonuna** bagli.
- Montaj olmayan operasyon tamamlansa bile kalem durumu `uretiliyor` kalir.
- Montaj operasyonu tamamlandiginda → `uretim_tamamlandi`.
- Tek tarafli: tek operasyon tamamlaninca → `uretim_tamamlandi`.

```typescript
// repoUretimBitir icine ek kontrol:
const [op] = await tx
  .select({ montaj: uretimEmriOperasyonlari.montaj })
  .from(uretimEmriOperasyonlari)
  .where(eq(uretimEmriOperasyonlari.id, kqRow.emir_operasyon_id))
  .limit(1);

// Cift tarafli uretimde sadece montaj tamamlandiginda kalem durumu degisir
const isMontajOp = (op?.montaj ?? 0) === 1;
const isSingleSided = /* kontrol: bu emir icin tek operasyon mu var */;

if (isMontajOp || isSingleSided) {
  // Bagli tum siparis kalemlerinin durumunu guncelle
  const kalemIds = await getKalemIdsByUretimEmriId(kqRow.uretim_emri_id, tx);
  for (const kid of kalemIds) {
    await transitionKalemDurum(kid, 'uretim_tamamlandi', tx);
  }
}
```

### 1.5 Kilitleme Kurallari

**Dosya:** `backend/src/modules/satis_siparisleri/repository.ts`

Mevcut `siparis_kilitli` kontrolu `uretimeAktarilanKalemSayisi > 0` ile calisiyor. Rev4'te bunu kalem bazinda yapalim:

```typescript
// Siparis silinebilir mi?
export function canDeleteSiparis(kalemDurumlari: UretimDurumu[]): boolean {
  return kalemDurumlari.every(d => d === 'beklemede');
}

// Siparis duzenlenebilir mi?
export function canEditSiparis(kalemDurumlari: UretimDurumu[]): boolean {
  return kalemDurumlari.every(d => d === 'beklemede');
}

// Siparis kapatilabilir mi?
export function canCloseSiparis(kalemDurumlari: UretimDurumu[]): boolean {
  return kalemDurumlari.every(d => d === 'beklemede' || d === 'uretim_tamamlandi');
}
```

---

## Faz 2: Siparis Ekrani Bolunmesi

### 2.1 Backend — Yeni Endpoint'ler

**Mevcut:** `GET /admin/satis-siparisleri` — tum siparisleri listeler
**Yeni endpoint'ler:**

```
GET /admin/satis-siparisleri/islemler
  ?gorunum=musteri | urun | duz
  ?gizle_tamamlanan=true (default)
```

Bu endpoint siparis kalemlerini duz tablo olarak doner (siparisi degil, kalemi). Her kalem:
```typescript
interface SiparisIslemSatiri {
  kalem_id: string;
  siparis_id: string;
  siparis_no: string;
  musteri_id: string;
  musteri_adi: string;
  urun_id: string;
  urun_adi: string;
  miktar: number;
  birim_fiyat: number;
  uretim_durumu: UretimDurumu;
  uretilen_miktar: number;
  sevk_edilen_miktar: number;
  planlanan_bitis: string | null;
  uretim_emri_id: string | null;
}
```

**Toplu Uretime Aktarma:**
```
POST /admin/satis-siparisleri/islemler/uretime-aktar
  body: { kalem_ids: string[], birlestir: boolean }
```
- `birlestir: true` → Ayni urun_id'li kalemleri tek UE'de birlestir
- `birlestir: false` → Her kalem icin ayri UE olustur
- Mevcut UE varsa ve ayni urun ise "birlestirmek ister misiniz?" sorusu frontend'den gelecek

### 2.2 Frontend — Sekme Yapisi

**Dosya:** `admin_panel/src/app/(main)/admin/satis-siparisleri/page.tsx`

```
satis-siparisleri/
├── page.tsx                          → Tab wrapper (Girisleri | Islemler)
├── _components/
│   ├── siparis-girisleri-tab.tsx      → Mevcut list (temizlenmis)
│   ├── siparis-islemleri-tab.tsx      → YENi: kalem bazli tablo
│   ├── siparis-islemleri-filters.tsx  → Gorunum + filtre kontrolleri
│   ├── uretime-aktar-dialog.tsx       → Toplu/tekli aktarma dialog
│   └── ... (mevcut form, detay)
```

**Siparis Girisleri (SP-5a):** Mevcut ekrandan cikarilacaklar:
- Uretim durumu sutunu (state machine bilgisi → sadece Islemler'de)
- Sevk durumu sutunu
- Planlanan bitis sutunu
- Uretime aktar butonlari

**Siparis Islemleri (SP-5b):** Uc gorunum:
1. **Duz Liste:** Tum kalemler satirlar halinde, filtre + siralama
2. **Musteri Bazli:** Collapse/expand, musteri ust baslik + termin bilgisi (SP-7)
3. **Urun Bazli:** Ayni urunun farkli siparislerdeki kalemleri gruplanmis

**Filtreleme (SP-8):**
- Default: `gizle_tamamlanan=true` (kapali + tamami sevk edilen + iptal gizli)
- Toggle: "Tamamlananlari Goster"

---

## Faz 3: Uretim Emirleri Ekran Revizyon

### 3.1 Makine Havuzu Ekraninin Kaldirilmasi (UE-1a)

**Sidebar:** `admin_panel/src/navigation/sidebar/sidebar-items.ts` — "Makine Havuzu" menusunu kaldir
**Route:** `/admin/makine-havuzu` sayfasi silinecek veya redirect
**UE Ekrani:** Makine bilgisi direkt UE tablosuna entegre

### 3.2 UE Tablosu Yeni Yapisi (UE-1c..UE-1h)

| Sutun | Kaynak | Not |
|-------|--------|-----|
| Emir No | uretim_emirleri.emir_no | Mevcut |
| Urun | uretim_emirleri.urun_id → urunler.ad | Mevcut |
| Musteri(ler) | uretim_emri_siparis_kalemleri → musteri_adi + miktar | Alt alta, her musteri + miktar |
| Planlanan Miktar | uretim_emirleri.planlanan_miktar | Mevcut |
| Ilerleme + Uretilen | Yuzde bar + uretilen_miktar text | Mevcut bar + yeni text |
| **Makine** | makine_kuyrugu → makineler.ad | **YENi** — "Atanmamis" veya makine adi |
| Planlanan Bitis | Cift tarafli: montaj op bitis, tek tarafli: tek op bitis | **Degisiklik** |
| Durum | uretim_emirleri.durum badge | Mevcut |
| Aksiyonlar | Sil / Duzelt / Malzeme Yeterlilik / Recete Detay / Makine Ata / Atamayi Geri Al | **Degisiklik** |

**Aksiyon Butonlari Gorunurluk Kurallari:**

```typescript
const actions = {
  sil:                durum === 'atanmamis',          // makineye atanmamissa
  duzelt:             durum === 'atanmamis',
  malzemeYeterlilik:  true,                            // her zaman
  receteDetay:        true,                            // her zaman
  makineAta:          durum === 'atanmamis',
  atamayiGeriAl:      durum === 'makineye_atandi',     // sadece atanmis + uretim baslamamisken
};
```

### 3.3 Atamayi Geri Al — Yeni Backend Endpoint

```
POST /admin/uretim-emirleri/:id/atama-geri-al
```

**Is Mantigi:**
1. UE durumunu kontrol et: sadece `makineye_atandi` veya `planlandi` durumunda izin ver
2. `makine_kuyrugu`'ndan ilgili satirlari sil
3. `uretim_emri_operasyonlari`'nda makine_id'leri NULL yap
4. `uretim_emirleri.durum` → `atanmamis`
5. Bagli siparis kalemlerinin durumunu → `uretime_aktarildi` (tersine guncelleme)
6. Siralamasi degisen makinelerin planlanan tarihlerini yeniden hesapla

### 3.4 Montaj Tarafi Secimi (UE-1i)

**Mevcut Durum:** `uretim_emri_operasyonlari` tablosunda `montaj` tinyint alani var. Cift tarafli uretimde 2 operasyon olusturuluyor — biri montaj=0, digeri montaj=1.

**Degisiklik:**
- Makine atama ekraninda (dialog/modal) her operasyonun yaninda "Montaj" checkbox'i olacak
- "Ayni makine ise sag=montaj" otomatik kurali **kaldirilacak**
- Kullanici istedigini secebilecek
- Validasyon: Cift taraflida tam olarak 1 operasyon montaj=1 olmali

**Backend degisiklik:** Makine atama endpoint'inde `montaj` parametresini kabul et:
```typescript
// POST /admin/makine-havuzu/assign body'sine:
interface AssignBody {
  uretim_emri_id: string;
  atamalar: Array<{
    operasyon_id: string;
    makine_id: string;
    montaj: boolean;  // ← Kullanici seciyor
  }>;
}
```

### 3.5 Stoğa Uretim (UE-3)

**Mevcut:** "Yeni Uretim Emri" → siparis mi / manuel mi soruyor.
**Yeni:** "Stoga Uretim" butonu:
- Sadece urun_id + miktar girdisi
- siparis_id = NULL
- Listede ve diger ekranlarda "Stoga Uretim" label'i ile gorunsun

### 3.6 Malzeme Yeterlilik — Rezerve Hesaplama (UE-5)

**Yeni endpoint:**
```
GET /admin/uretim-emirleri/:id/malzeme-yeterlilik
```

**Response:**
```typescript
interface MalzemeYeterlilikResponse {
  emir_id: string;
  urun_adi: string;
  planlanan_miktar: number;
  malzemeler: Array<{
    malzeme_id: string;
    malzeme_adi: string;
    gorsel_url: string | null;
    birim_miktar: number;      // recetedeki birim basina miktar
    gerekli_miktar: number;    // birim_miktar * planlanan_miktar
    stok_miktar: number;       // mevcut stok
    rezerve: number;           // bu uretim icin rezerve edilen
    serbest: number;           // stok - toplam_rezerve (tum UE'ler)
    eksik: number;             // max(0, gerekli - stok_mevcut_icin_ayrilabilecek)
  }>;
}
```

**Hesaplama Algoritmasi:**

```typescript
async function hesaplaMalzemeYeterlilik(emirId: string) {
  // 1. Bu emrin recetesinden malzeme listesini al
  const malzemeler = await getReceteMalzemeleri(emirId);

  // 2. Tum aktif UE'leri planlanan bitis tarihine gore sirala
  const tumEmirler = await db
    .select({ id, urun_id, planlanan_miktar, planlanan_bitis_max })
    .from(uretimEmirleri)
    .where(and(
      eq(uretimEmirleri.is_active, 1),
      notInArray(uretimEmirleri.durum, ['tamamlandi', 'kapatildi']),
    ))
    .orderBy(asc(planlanan_bitis_max));  // en erken biten once

  // 3. Her malzeme icin kumulatif rezerve hesapla
  for (const malzeme of malzemeler) {
    let kalanStok = malzeme.stok_miktar;

    for (const emir of tumEmirler) {
      const ihtiyac = getIhtiyac(emir, malzeme.id);  // emir recetesinden
      if (ihtiyac === 0) continue;

      const rezerve = Math.min(ihtiyac, Math.max(0, kalanStok));
      kalanStok -= rezerve;

      if (emir.id === emirId) {
        // Bu bizim emirimiz
        malzeme.rezerve = rezerve;
        malzeme.serbest = Math.max(0, kalanStok);
        malzeme.eksik = Math.max(0, ihtiyac - rezerve);
      }
    }
  }
}
```

### 3.7 Recete Detay Ekrani (UE-6)

**Yeni endpoint:**
```
GET /admin/uretim-emirleri/:id/recete-detay
```

Salt okunur ekran, operatorlere yonelik. Frontend modal/dialog olarak acilacak. Icerik:
- Emir no, urun adi
- Sol/sag taraf gorselleri (urun gorselleri veya operasyon gorselleri)
- Makine, kalip, cevrim suresi, montaj bilgisi (her operasyon icin)
- Planlanan uretim tarih araligi
- Aciklama (urunler.isci_notu)
- Malzeme listesi: gorsel + malzeme adi + birim miktar + birim

---

## Faz 4: Operator Ekrani Revizyon

### 4.1 Yeni Buton Durumu Mantigi (OP-1a)

```typescript
type OpDurum = 'bekliyor' | 'calisiyor' | 'duraklatildi' | 'tamamlandi';

function getAktifButonlar(durum: OpDurum): Record<string, boolean> {
  return {
    baslat:    durum === 'bekliyor',
    duraklat:  durum === 'calisiyor',
    devamEt:   durum === 'duraklatildi',
    bitir:     durum === 'calisiyor' || durum === 'duraklatildi',
  };
}
```

### 4.2 Bitir — Miktar Girisi + Stok Etki Kurali (OP-1b, OP-1c)

**Mevcut `repoUretimBitir` degisiklik:**

```typescript
// Montaj kontrolu:
const isMontajOp = (op?.montaj ?? 0) === 1;
const isSingleSided = operasyonSayisi === 1;

if (isMontajOp || isSingleSided) {
  // STOK ETKISI VAR — "Takim" olarak girilir
  // urunler.stok += gercekNet
  // recete malzemeleri stok -= (birim_miktar * gercekNet)
  await stokArtir(urunId, gercekNet, tx);
  await receteMalzemeAzalt(receteId, gercekNet, tx);
} else {
  // STOK ETKISI YOK — "Adet" olarak girilir
  // Sadece operasyon uretilen_miktar guncellenir, stok degismez
}
```

**Recete malzeme stok azaltma — Yeni fonksiyon:**
```typescript
async function receteMalzemeAzalt(
  receteId: string,
  takim: number,
  tx: MySqlTransaction,
): Promise<void> {
  const kalemler = await tx
    .select({ urun_id, birim_miktar })
    .from(receteKalemleri)
    .where(eq(receteKalemleri.recete_id, receteId));

  for (const kalem of kalemler) {
    const azaltma = Number(kalem.birim_miktar) * takim;
    await tx
      .update(urunler)
      .set({ stok: sql`GREATEST(0, ${urunler.stok} - ${azaltma.toFixed(4)})` })
      .where(eq(urunler.id, kalem.urun_id));

    await tx.insert(hareketler).values({
      id: randomUUID(),
      urun_id: kalem.urun_id,
      hareket_tipi: 'cikis',
      referans_tipi: 'uretim',
      referans_id: receteId,
      miktar: String(-azaltma),  // negatif
      aciklama: `Uretim tamamlandi — recete malzeme tuketimi`,
    });
  }
}
```

### 4.3 Cascade Zamanlama (OP-2)

**Mevcut:** `shiftFollowingJobs` fonksiyonu zaten var. Genisleme gerekiyor:

Operator "Bitir" bastiginda:
1. `gercek_bitis = now()`
2. Sonraki kuyruk satirinin `planlanan_baslangic = now()` olarak guncelle
3. O satirdan itibaren tum satirlarin `planlanan_baslangic` ve `planlanan_bitis` cascade guncelle

### 4.4 Vardiya Sistemi (OP-3)

**Mevcut tablolar yeterli:** `vardiyalar` (tanim) + `vardiya_kayitlari` (gerceklesen)

**Yeni endpoint'ler:**

```
POST /admin/operator/vardiya-baslat
  body: { makine_id: string }
  Kontrol: Onceki vardiya bitmis mi? Saat uygun mu? (±30dk)

POST /admin/operator/vardiya-bitir
  body: { makine_id: string, uretim_miktarlari: Array<{ kuyruk_id: string, miktar: number }> }
  Kontrol: Aktif vardiya var mi? Saat uygun mu?
```

**Saat Kontrolu:**
```typescript
function isVardiyaAktifSaatte(vardiyalar: VardiyaRow[]): { aktif: boolean; tip: 'gunduz' | 'gece' } {
  const now = new Date();
  const saat = now.getHours() * 60 + now.getMinutes(); // dakika cinsinden

  for (const v of vardiyalar) {
    const [bSaat, bDk] = v.baslangic_saati.split(':').map(Number);
    const [biSaat, biDk] = v.bitis_saati.split(':').map(Number);
    const baslangicDk = bSaat * 60 + bDk;

    // ±30 dk penceresi icinde mi?
    if (Math.abs(saat - baslangicDk) <= 30) {
      return { aktif: true, tip: v.ad.includes('Gece') ? 'gece' : 'gunduz' };
    }
    // Bitis saati icin de kontrol
    const bitisDk = biSaat * 60 + biDk;
    if (Math.abs(saat - bitisDk) <= 30) {
      return { aktif: true, tip: v.ad.includes('Gece') ? 'gece' : 'gunduz' };
    }
  }
  return { aktif: false, tip: 'gunduz' };
}
```

**Vardiya bitisinde miktar kaydi:**
- Montaj veya tek tarafli → Takim cinsinden → Stok etkisi var
- Montaj olmayan → Adet cinsinden → Stok etkisi yok
- `operator_gunluk_kayitlari`'na kayit, `hareketler`'e giris

**Devam Et → Miktar sormasin (OP-3f):**
- `repoDevamEt` fonksiyonunda `body.uretilenMiktar` parametresini **opsiyonel** yap
- Duraklama sonrasi devam ettiyse miktar 0 gonder veya gonderme

### 4.5 Frontend — Operator Ekrani Yeni Tasarim

```
operator/
├── page.tsx
├── _components/
│   ├── makine-panel.tsx         → Makine secimi + vardiya butonlari
│   ├── uretim-card.tsx          → Tek uretim karti: bilgi + butonlar
│   ├── uretim-list.tsx          → Siralanmis uretim listesi (en ustteki aktif)
│   ├── bitir-dialog.tsx         → Miktar girisi (Takim/Adet)
│   └── vardiya-dialog.tsx       → Vardiya baslat/bitir + miktar girisi
```

---

## Faz 5: Paralel Moduller

### 5.1 Gantt

| Madde | Degisiklik Tipi |
|-------|----------------|
| GN-1 | Frontend — ozet kutu azaltma + "X gunluk is" hesaplama |
| GN-3 | Frontend — zoom kontrol (1gun/3gun/7gun/tumu) |
| GN-4 | Frontend — tatil barlar uzerine render |
| GN-5 | Frontend — duraklama cizgisi + animasyon |

### 5.2 Malzeme Stoklari

| Madde | Degisiklik Tipi |
|-------|----------------|
| MS-2 | Backend — UE-5 ile ayni hesaplama, stoklar endpoint'inde `rezerve` dondur |
| MS-3 | Backend — `uretim_eksik = uretim_ihtiyac - min(stok, ihtiyac)` sutunu |
| MS-4 | Frontend — Ana tablodan kritik stok/eksik cikar, detaya tasi |
| MS-5 | Backend+Frontend — Stok duzeltme: kullanici gercek miktar girer, sistem fark hesaplar |
| MS-6 | Frontend — Stokta var/yok filtresi |

### 5.3 Satin Alma + Mal Kabul

**SA-2 + MK-1..MK-4:**
- Yeni akis: Satin almadan "Kabul Emri" olustur → Mal Kabul ekraninda listelen → Operator "Teslim Al"
- DB: `satin_alma_siparisleri` tablosuna `kabul_durumu` enum ekle: `bekliyor`, `kabul_emri_verildi`, `teslim_alindi`
- Seed: `161_satin_alma_kabul_durumu.sql`

### 5.4 Urunler

| Madde | Degisiklik Tipi |
|-------|----------------|
| UR-1 | Frontend — PDF gorsel onizleme + indirme |
| UR-2 | Backend+Frontend — Birim/Hedef Birim inline edit + default koli |

### 5.5 Site Ayarlari (AY-1)

**Coklu Rol:** `user_roles` tablosu zaten junction table olarak mevcut mi kontrol et. Degilse:
- Seed: `162_user_multi_roles.sql` — `user_role_assignments(user_id, role_id)` junction table
- Mevcut tek rol alanini migration'da tasima

---

## Faz 6: Dashboard

Tum widgetlar yeni endpoint'lerle beslenecek. Mevcut 4 endpoint yerine Rev4'e ozel endpoint'ler:

```
GET /admin/dashboard/uretim-adetleri?period=today|week|month|all&limit=10
GET /admin/dashboard/sevkiyat?period=...&limit=10
GET /admin/dashboard/mal-kabul?period=...&limit=10
GET /admin/dashboard/depo-stok?kategori=paspas
GET /admin/dashboard/uretim-sevkiyat-grafik?period=weekly|monthly|all
GET /admin/dashboard/makine-durumlari
```

Frontend: 6 widget bileşeni, responsive grid layout.

---

## Seed Dosyasi Sirasi

| # | Dosya | Icerik |
|---|-------|--------|
| 160 | siparis_kalemleri_uretim_durumu.sql | `uretim_durumu` kolonu + mevcut veri guncelleme |
| 161 | satin_alma_kabul_durumu.sql | `kabul_durumu` kolonu |
| 162 | user_multi_roles.sql | Coklu rol junction table (gerekirse) |

---

## Implementasyon Notu

Her faz icin Codex'e verilecek gorev dosyasi ayri olusturulacak. Bu plan mimari cizgiyi belirler, detayli implementasyon Codex prompt'larinda olacak.

Antigravity gorevleri ayri dosyada: `docs/antigravity-rev4-tasks.md`
