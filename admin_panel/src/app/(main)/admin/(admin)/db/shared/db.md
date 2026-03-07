Bu sayfa, "DB Admin" alaninda **tam veritabani (full DB) yedekleme/ice aktarma** ve **snapshot** islemlerini tek bir yerden yonetmek icin tasarlanmis bir yonetim ekranidir.

---

## 1) Admin panelde bu sayfa nasil yonetilir?

Bu sayfa 3 ana bolume ayrilir:

### A) Auth Gate (AdminDbAuthGate)

Bu bir "kapi"dir. Amac:

* Kullanici auth durumu netlesmeden admin endpoint'lerine istek atilmasini engellemek (401 spam kesilir).
* Auth degilse `/login`'e yonlendirmek.
* Auth ise sayfayi render etmek ve alt bilesenlere "admin cagrilari yapilabilir mi?" bilgisini vermek.

**Kritik alan:** `adminSkip`

* `adminSkip=true` iken, "snapshots list" gibi admin sorgulari RTK tarafinda **skip** edilir.
* Bu sayede auth status stabilize olmadan gereksiz request atilmaz.

### B) Full DB islemleri (FullDbHeader + FullDbImportPanel)

#### 1) FullDbHeader (Snapshot olustur + Export)

**(i) Snapshot olusturma**

* Kullanici "Snapshot etiketi" ve "Not" girip "Snapshot Olustur" der.
* Backend `/admin/db/snapshots` endpoint'ine POST gider.
* Backend bir "DB dump" olusturur ve snapshot listesine ekler.

**(ii) Full DB Export**

* "SQL Indir": `/admin/db/export` cagrilir -> Blob olarak .sql indirilir.

#### 2) FullDbImportPanel (SQL Import)

3 farkli import modu var:

**(i) SQL Metni ile Import**

* SQL dump'i textarea'ya yapistirilir.
* `truncateBefore` secenegi: import oncesi tum tablolari bosaltma
* `dryRun` secenegi: "prova"; transaction + rollback ile deneme

**(ii) URL ile Import**

* Bir `.sql` veya `.sql.gz` linki verilir.
* Backend indirir ve uygular.

**(iii) Dosyadan Import (multipart)**

* `.sql` veya `.gz` dosyasi secilir.
* Backend `/admin/db/import-file` ile dosyayi alir ve uygular.

### C) SnapshotsPanel (Snapshot listesi + geri yukle + sil)

* `/admin/db/snapshots` -> GET
* Her satirda: etiket, not, dosya adi, olusturulma tarihi, boyut, "Geri Yukle" ve "Sil"
* Geri Yukle: `/admin/db/snapshots/:id/restore` -> POST
* Sil: `/admin/db/snapshots/:id` -> DELETE

---

## 2) Backend Endpoint'ler

### Full DB

* `GET  /admin/db/export`
* `POST /admin/db/import-sql`
* `POST /admin/db/import-url`
* `POST /admin/db/import-file`

### Snapshot

* `GET    /admin/db/snapshots`
* `POST   /admin/db/snapshots`
* `POST   /admin/db/snapshots/:id/restore`
* `DELETE /admin/db/snapshots/:id`

Hepsinde permission guard var; admin girisi sart.

### RTK Query hooks

* `useExportSqlMutation()`
* `useImportSqlTextMutation()`
* `useImportSqlUrlMutation()`
* `useImportSqlFileMutation()`
* `useListDbSnapshotsQuery()`
* `useCreateDbSnapshotMutation()`
* `useRestoreDbSnapshotMutation()`
* `useDeleteDbSnapshotMutation()`

---

## 3) Dikkat edilmesi gerekenler

### TruncateBefore (en kritik bayrak)

* Import oncesi tablolari bosaltir.
* Prod'da yanlis acilirsa tum DB sifirlanir.

### DryRun

* SQL'i deneme amacli calistirip rollback yapar.
* MySQL'de bazi DDL islemleri implicit commit yapar; dryRun her seyi kapsamayabilir.

### Snapshots restore (tam overwrite)

* Restore mevcut DB icerigini ezdigi icin oncesinde de snapshot alinmali.

### Guvenlik

* `makeAdminPermissionGuard('admin.db_admin')` ile korunuyor.
* Audit log entegrasyonu aktif (tum mutasyon islemleri + export kaydi).

---

## 4) ERP Operasyon Guvenlik Matrisi

Her DB islemi icin risk seviyesi ve onerileri:

| Islem | Risk | Geri Alinabilir mi? | Oneri |
| --- | --- | --- | --- |
| `GET /db/export` | Dusuk | - | Okunur islem. Hassas veri icerdiginden audit kaydedilir. |
| `POST /db/import-sql` (dryRun=true) | Dusuk | Otomatik rollback | Prova modu, DB'yi degistirmez. Import oncesi dogrulama icin kullanilir. |
| `POST /db/import-sql` (truncate=false) | Orta | Snapshot ile | Mevcut veriyi korur, ustune ekler. Cakisma riski var. |
| `POST /db/import-sql` (truncate=true) | Kritik | Snapshot ile | Tum tablolari bosaltip yeniden yazar. Oncesinde snapshot zorunlu. |
| `POST /db/import-url` | Kritik | Snapshot ile | Harici kaynak: icerik dogrulanamaz. Oncelikle dryRun ile test edilmeli. |
| `POST /db/import-file` | Kritik | Snapshot ile | Dosya kaynagi: truncate aciksa kritik, oncesinde snapshot zorunlu. |
| `POST /db/snapshots` | Dusuk | - | Salt okunur dump. Disk alani kullanir. |
| `POST /db/snapshots/:id/restore` | Kritik | Snapshot ile | Mevcut DB'yi tamamen ezebilir. Oncesinde yeni snapshot alinmali. |
| `DELETE /db/snapshots/:id` | Orta | Geri alinamaz | Snapshot dosyasi kalici olarak silinir. |

### ERP Tablolari Risk Siniflandirmasi

| Risk Grubu | Tablolar | Aciklama |
| --- | --- | --- |
| Kritik (veri kaybi) | `satis_siparisleri`, `siparis_kalemleri`, `uretim_emirleri`, `hareketler`, `sevkiyatlar`, `mal_kabul_kayitlari` | Uretim ve satis verileri. Kayip durumunda is sureci bozulur. |
| Yuksek (yapisal) | `urunler`, `urun_operasyonlari`, `receteler`, `recete_kalemleri`, `musteriler`, `makineler` | Ana veri. Diger tablolar bunlara FK ile baglidir. |
| Orta (ayar/tanim) | `kaliplar`, `tatiller`, `vardiyalar`, `durus_nedenleri`, `site_settings` | Ayar verileri. Geri yuklenmesi kolay. |
| Dusuk (log/gecici) | `admin_audit_logs`, `operator_gunluk_kayitlari`, `vardiya_kayitlari`, `durus_kayitlari` | Kayip durumunda is sureci etkilenmez, sadece gecmis bilgisi kaybolur. |

### Onerilen Is Akisi

1. Import/restore oncesi **mutlaka** snapshot alinmali
2. Bilinmeyen SQL kaynagi icin once `dryRun=true` ile test
3. Prod ortaminda `truncateBefore` varsayilan olarak kapali tutulmali
4. Her islem sonrasi audit loglardan kontrol yapilmali

---

## 5) Veritabani Bilgisi (DB Info)

* `GET /admin/db/info` — DB ozet bilgisi doner:
  - `tableCount`: tablo sayisi
  - `totalRows`: toplam satir sayisi
  - `dbSizeMb`: yaklasik DB boyutu (MB)
  - `snapshotCount`: mevcut snapshot sayisi
  - `environment`: demo/seed/production tespiti
  - `environmentReason`: tespit gerekceleri

### Demo/Seed/Uretim Verisi Ayirimi

Sistem asagidaki kurallara gore ortam tipini belirler:
- `admin@paspas.local` email'li kullanici varsa → "demo"
- Tum ERP tablolari bossa (urunler, musteriler, siparis) → "seed"
- Aksi halde → "production"
