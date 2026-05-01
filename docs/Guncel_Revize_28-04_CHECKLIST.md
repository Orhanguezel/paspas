# Güncel Revize 28-04 - Repo Karşılaştırmalı Checklist

Kaynak doküman: `Güncel Revize 28-04.docx`

Durum etiketleri:
- `ANLAŞILDI`: İstek uygulanabilir ve kapsam net.
- `KISMEN NET`: Ana yön net, uygulama detayı için karar lazım.
- `SORU`: Uygulamadan önce ürün/iş kuralı netleşmeli.
- `MEVCUT/KONTROL`: Kodda kısmen var; doğrulama veya küçük düzeltme gerekiyor.

## 1. Malzeme görsellerini içeri alma

- [x] `ANLAŞILDI` Google Drive klasöründeki görseller Storage/kütüphane sistemine indirilecek.
- [x] Görseller yalnızca Storage/kütüphane DB'sine kaydedilecek; ürün kartlarına otomatik iliştirilmeyecek.
- [x] Mevcut ürün görsellerine dokunulmayacak.
- [x] Storage DB kaydı oluşturulurken dosya adı ürün koduna/Drive dosya adına göre korunacak.
- [x] `MEVCUT/KONTROL` Repo tarafında ürün ana görseli ve çoklu medya altyapısı var: `urunler.image_url`, `storage_asset_id`, `urun_medya.is_cover`.
- [x] Drive dosya adı kuralı parse edilecek: `1110 101 a`, `1110 101 b`, `1110 101 kpk` → ürün kodu = `1110 101`.
- [x] Drive klasörü: `https://drive.google.com/drive/folders/1n86WZD5fDatWnsylrSidZXNBNeAWULo0`.
- [x] Mümkünse sistem/script Drive klasöründen çekecek; çekilemezse kullanıcıdan yerel klasör yolu istenecek.
- [x] Görsel aktarımı için admin import scripti hazırlanacak.

Karar:
- Görseller Storage/kütüphaneye yüklenecek; kullanıcı sonradan ürün kütüphanesinden elle bağlayacak.
- Ürünlere otomatik kapak/medya atanmayacak.
- Mevcut ürün görselleri korunacak.
- İsimlendirme Drive dosya adına göre DB'de korunacak.

## 2. Stok takibi yapılacak/yapılmayacak ürün seçimi

- [x] `ANLAŞILDI` Ürün kartına stok takibi aktif/pasif alanı eklenecek.
- [x] Stok takibi kapalı ürünler Üretim Emirleri listesindeki malzeme eksik/yeterlilik hesabında eksik görünmeyecek.
- [x] Stok takibi kapalı ürünler Stoklar/Malzeme stokları listesinde görünmeyecek.
- [x] Stok takibi kapalı ürünlerin Hareketler sayfasında giriş/çıkış kayıtları görünmeyecek.
- [x] Stok takibi kapalı olsa bile hareket kaydı oluşmaya devam edecek.
- [x] Backend liste sorguları, stok/yeterlilik hesapları ve ekran filtreleri bu alanı dikkate alacak.
- [x] Reçetede stok takibi kapalı ürün kalabilecek; sadece eksik malzeme/yeterlilik hesabından muaf olacak.

Mevcut durum:
- `urunler` tablosunda stok alanları var ama stok takibini kapatacak ayrı bir kolon yok.
- Stoklar ve Hareketler listeleri şu an ürün kategorisi/stok/durum filtrelerine bakıyor; stok takip bayrağına bakmıyor.
- Üretim emirleri malzeme yeterliliği reçete kalemlerini doğrudan stok açısından değerlendiriyor.

Karar:
- Hareket kaydı oluşacak ama Stoklar ve Hareketler ekranlarında gizlenecek.
- Stok takibi kapalı ürün reçetede kalacak; eksik/yeterlilik hesabından muaf tutulacak.

## 3. Reçete satırlarına açıklama alanı

- [x] `ANLAŞILDI` Her reçete kalemine açıklama alanı eklenecek.
- [x] DB migration: `recete_kalemleri.aciklama`.
- [x] Backend DTO/validation/repository bu alanı okuyup yazacak.
- [x] Ürün formundaki reçete düzenleme satırlarına açıklama inputu eklenecek.
- [x] Üretim emri reçete detayında açıklama birimden sonra gösterilecek.

Mevcut durum:
- `receteler.aciklama` var ama reçete satırı (`recete_kalemleri`) açıklaması yok.

## 4. Sipariş işlemleri tablosunda üretilen miktar

- [x] `ANLAŞILDI` Sipariş işlemleri tablosuna `Üretilen` miktar kolonu eklenecek.
- [x] Kolon sırası: `Miktar` / `Üretilen` / `Üretim Durumu` / `Sevk Edilen` olarak güncellenecek.
- [x] Backend `repoListIslemler` satır DTO’suna `uretilenMiktar` eklenecek.
- [x] Frontend `SiparisIslemleriTab` tablo başlığı ve satırları güncellenecek.

Mevcut durum:
- Genel sipariş DTO tarafında üretilen toplamlar var.
- `SiparisIslemSatiri` ve `/islemler` endpoint satırında `uretilenMiktar` yok.

## 5. Vardiya analizinde gün sonu + devam et + bitir üretimleri

- [x] `ANLAŞILDI` Aynı üretim emrinde önce 250, sonra 110 girildiğinde vardiya analizinde toplam 360 görünmeli.
- [x] `operator_gunluk_kayitlari` kayıt akışı incelenecek; her üretim girişi ayrı kayıt mı, yoksa son kayıt önceki değeri eziyor mu doğrulanacak.
- [x] Vardiya analizi sorgusu `operator_gunluk_kayitlari.net_miktar` kayıtlarını doğru tarih/makine/operasyon aralığında toplamalı.
- [x] Gün sonu, devam et ve bitir akışları için regresyon testi eklenecek.

Mevcut durum:
- Vardiya analizi net miktarı `operator_gunluk_kayitlari` üzerinden topluyor.
- Sorun muhtemelen kayıt oluşturma/operasyon id/makine id/vardiya aralığı eşleşmesinde.

Karar:
- Gün sonu + devam et + bitir akışında miktarlar toplanacak; örnekte 250 + 110 = 360 analizde görünecek.

## 6. Vardiya bazlı ve makine bazlı analiz boş, kalıp bazlı dolu

- [x] `ANLAŞILDI` Vardiya bazlı ve makine bazlı analizler aynı üretim kayıtlarını göstermeli.
- [x] Vardiya/makine rollup sadece açık `vardiya_kayitlari` üzerinden değil, üretim kaydı bulunan makine ve tarih aralığı üzerinden de hesaplanmalı.
- [x] Kalıp bazlı sorgu ile vardiya/makine bazlı sorgu kaynak tutarlılığı sağlanacak.
- [x] Makine filtresi varsa kalıp rollup tarafında da uygulanacak.

Mevcut durum:
- Vardiya/makine rollup `vardiya_kayitlari` başlangıç tarihine bağımlı.
- Kalıp rollup doğrudan `operator_gunluk_kayitlari` üzerinden çalışıyor; bu nedenle veri kalıp bazlı görünüp diğerlerinde görünmeyebilir.

## 7. Çift taraflı üretimlerde iki tarafın vardiya analizinde görünmesi

> **Montaj tanımı (kullanıcı netleştirmesi):** Buradaki "montaj" aslında **ambalajlama** işidir. Operatör sağ-sol veya iki sağ + iki sol parçaları **elle** birleştirir; bu iş **makinede yapılmaz**. Makine baskı yaparken aynı operatör paralel olarak ambalaj/montaj yapar. Bu nedenle montajın harcadığı zaman, üretim hızı vb. **vardiya analizinde ayrı bir üretim süreci olarak değerlendirilmeyecektir**. Vardiya analizinin tek odağı **makinelerin baskı adedidir**.

- [x] `ANLAŞILDI` Vardiya analizinde montaj/ambalaj **ayrı bir üretim süreci olarak analiz edilmeyecek** — süre, hız, verim hesabına dahil olmayacak.
- [x] Vardiya analizinde her makinenin yaptığı baskı adedi gösterilecek.
- [x] Çift taraflı üretimlerde iki ayrı makine (sağ kalıp + sol kalıp) baskı yaptığı için, her iki makinenin baskı adedi de vardiya analizinde ayrı ayrı görünecek.
- [x] Operasyonel YM/tek taraf baskı kayıtları makine bazında raporlanacak.
- [x] Vardiya analizine operasyon adı, operasyon tipi, makine ve kalıp kırılımı gerektiği ölçüde eklenecek.
- [x] Her makinenin vardiyada kaç baskı yaptığı net şekilde raporlanacak.
- [x] Montaj/ambalaj operasyon kayıtları vardiya analiz toplamlarından muaf tutulacak; analiz makine baskı adetini esas alacak.

Karar:
- Analiz odağı **makine baskı adedi**.
- Montaj = ambalajlama; ayrı üretim süreci olarak analiz edilmeyecek, vardiya raporlarında ayrı satır/metrik açılmayacak.
- Çift taraflı üretimde iki makinenin baskı adedi ayrı ayrı görünür.

## 8. Vardiya süresi başlangıcı

- [x] `ANLAŞILDI` Operatör geç login olsa bile vardiya başlangıcı tanımlı vardiya saatinden yazılacak. Örnek: 07:30.
- [x] Vardiya bitişi tanımlı vardiya bitiş saatinde otomatik kapanacak.
- [x] Otomatik kapanan vardiya için operatör sonradan üretim adetini girebilecek.
- [x] Açık vardiya yoksa üretim başlatırken otomatik vardiya açma davranışı bu kurala göre çalışacak (`ensureAutomaticShiftForMachine`).
- [ ] Sistem kapatılıp açıldığında açık vardiya davranışı **manuel test** edilecek.

Mevcut durum (kod doğrulandı):
- `operator/repository.ts` `buildShiftWindow` aktif vardiya tanımından pencere oluşturuyor; `ensureAutomaticShiftForMachine` `vardiya_kayitlari.baslangic` değerine **tanımlı başlangıç saatini** (login zamanını değil) yazıyor.
- `closeExpiredOpenShiftForMachine` her üretim girişinde tetikleniyor: açık vardiya bulup süresi dolmuşsa `bitis` alanını set ederek kapatıyor (lazy-close pattern). Sistem sürekli açık olmasa bile bir sonraki üretim girişinde kapanma gerçekleşir → müşterinin "sistemi hiç kapatmamak mı gerekiyor?" sorusunun cevabı: hayır, gerekmiyor.

Karar:
- Başlangıç tanımlı vardiya saati olacak. ✅ Yapıldı.
- Vardiya otomatik kapanacak. ✅ Yapıldı (lazy-close).
- Kapanan vardiyaya üretim adedi girişi yapılabilecek. ✅ Yapıldı (`vardiya_kayitlari` kapansa da `operator_gunluk_kayitlari` insert'i bağımsız çalışıyor).

## 9. Reçete alt kırılım gösterimini kaldırma

- [x] `ANLAŞILDI` Müşteriyle görüşme sonrası önceki "kırılım kalsın" kararı değişti; bu maddede alt kırılım gösterimi kaldırılacak.
- [x] Ana ürün reçete açılımında yalnızca direkt reçete satırları gösterilecek; alt ürünün kendi reçete satırları burada düzleştirilip gösterilmeyecek.
- [x] Alt kırılım yönetimi, ilgili yarı mamul / operasyonel YM ürün kartının kendi reçetesinden yapılacak.
- [x] "Alt kırılımdan silemiyorum" sorununun nedeni: üst ürün ekranında gösterilen satır aslında üst ürünün direkt reçete satırı değil, child reçeteden flatten edilmiş satırdı.
- [x] Backend `GET /admin/urunler/:id/recete` ve kayıt sonrası cevap artık nested `altRecete` üretmeyecek.
- [x] Ürünler listesi açılır reçete görünümü yalnızca direkt satırları listeleyecek.

Mevcut durum:
- Üretim emri modalı genel reçete endpoint’ini kullanıyor; bu endpoint zaten direkt reçete kalemleriyle çalışıyor.
- Ürün reçete endpoint’indeki nested breakdown kaldırıldı.

## 10. Üretim emirleri reçete detayı alanları ve görseller

- [x] `ANLAŞILDI` Reçete detayında malzeme adı, kod, birim çizgi olarak gelmemeli.
- [x] Backend `GET /receteler/:id` kalemlerini ürün bilgileriyle zenginleştirecek.
- [x] Fire alanı üretim emri reçete detayından kaldırılacak.
- [x] Birimden sonra reçete satırı açıklaması gösterilecek.
- [x] Her malzemenin görseli reçete detayına eklenecek ve büyütülebilecek.
- [x] Ürün başlığındaki ürün görseli korunacak/geliştirilecek.

Mevcut durum:
- Üretim emri modalında ürün görseli zaten var.
- `repoGetById` reçete kalemlerini zenginleştirmeden döndürüyor; `repoGetByUrunId` zenginleştiriyor. Çizgi görünmesinin ana nedeni bu olabilir.
- Modal fire kolonunu gösteriyor.

## 11. Ürünler ekranı: Asıl Ürün + Operasyonel YM butonunu kaldırma

- [x] `ANLAŞILDI` Ürünler ekranındaki `Asıl Ürün + Operasyonel YM` butonu kaldırılacak.
- [x] Kullanılmayan `UrunFullForm` import/state/render temizlenecek veya gizli bırakılacak.

Mevcut durum:
- Buton ve full form hâlâ ekranda mevcut.

## 12. Ürünler ekranında alt kategori filtreleme

- [x] `KAPSAM DIŞI` Kullanıcı kararıyla bu revize kapsamı dışında bırakıldı.
- [x] Mevcut ürün grubu/alt kategori filtre davranışına dokunulmayacak.

Karar:
- Bu madde **kullanıcı tarafından bilinçli olarak kapsam dışı** bırakıldı; bu revizede uygulanmayacak.
- İleride ayrı bir iş kalemi olarak ele alınabilir.

## 13. Operasyonel YM kategorisini silince tekrar ekleme hatası

- [x] `ANLAŞILDI` Sistem kategorileri yanlışlıkla silinse bile “onar / geri getir” mekanizmasıyla tekrar oluşturulabilmeli.
- [x] `Operasyonel YM` için canonical seed/repair akışı hazırlanacak.
- [x] Kategori silme işleminde bağlı ürün/alt kategori varsa güvenli uyarı verilecek.
- [x] `db_error` yerine kullanıcı dostu hata dönecek.
- [x] Tüm ERP ana kategorileri için “eksikse oluştur / varsa düzelt” endpoint eklendi (`POST /admin/categories/repair-defaults` → `adminRepairDefaultCategories`).

Mevcut durum (kod doğrulandı):
- `categories.kod` ve `categories.slug` unique.
- `ERP_CATEGORY_DEFAULTS` kodda mevcut; repair endpoint bunlar üzerinden idempotent çalışıyor (varsa update, yoksa insert).
- `DELETE /admin/categories/:id` öncesi `getCategoryUsage(id)` ile bağlı ürün + alt kategori sayıları sorgulanıyor; sıfırdan büyükse 409 + `category_in_use` + `{subCategoryCount, productCount}` detail dönüyor.
- `dbErrorMessage` helper'ı: `ER_ROW_IS_REFERENCED_2` (FK violation) → `record_in_use`, `ER_DUP_ENTRY` → `duplicate_slug`, fallback → context'e özel mesaj.

Karar:
- Onar / geri getir mekanizması ✅ yapıldı.
- Bağlı ürün/alt kategori kontrolü ✅ yapıldı.
- Kullanıcı dostu hata mesajları ✅ yapıldı.

## 14. İlave Notlar 30-04

Kaynak doküman: `İlave Notlar.docx`

### 14.1 Reçetede Operasyonel YM seçimi ve otomatik operasyon oluşturma

- [x] `ANLAŞILDI` Reçete oluştururken `operasyonel_ym` kategorisindeki ürünler malzeme seçiminde görünecek.
- [x] Mevcut reçete düzenlenirken kayıtlı Operasyonel YM satırları "Malzeme seçin" durumuna düşmeyecek.
- [x] Bir Operasyonel YM seçildiyse tek taraflı, iki Operasyonel YM seçildiyse çift taraflı operasyon otomatik oluşacak/güncellenecek.
- [x] Otomatik oluşacak operasyonlarda operasyon adı, kalıp, makine, hazırlık ve çevrim bilgileri seçilen Operasyonel YM ürünlerinden kopyalanacak.
- [x] Backend reçete validasyonu ve frontend malzeme seçim listesi birlikte kontrol edilecek.

### 14.2 Sipariş işlemlerinden üretime aktarınca ürün adı

- [x] `ANLAŞILDI` Sipariş İşlemleri ekranında satır seçilip üretime aktarıldığında, Üretim Emirleri listesinde ürün adı asıl sipariş ürünü olarak görünmeli.
- [x] Operasyonel YM adları ana ürün adı yerine geçmeyecek; küçük alt bilgi olarak korunacak.
- [x] Üretime aktarma servisinde üretim emri teknik olarak Operasyonel YM için açılmaya devam edecek.
- [x] Üretim emri DTO'suna sipariş kaleminden gelen asıl ürün adı/kodu eklendi.
- [x] Üretim emirleri liste ve detay ekranları ana görünürde sipariş ürününü gösterecek.

### 14.3 Makineler arası sürükle bırak

- [x] `ANLAŞILDI` Makineler arası sürükle bırak kapatılacak.
- [x] Kullanıcı bir işi başka makineye almak isterse önce "Makineden çıkar" yapacak, sonra hedef makineye tekrar atayacak.
- [x] Makine havuzu/kuyruk ekranındaki drag-drop davranışı aynı makine içinde sıralama ile sınırlı.
- [x] Backend sıralama endpoint'i farklı makineye ait kuyruk id'si gelirse `kuyruk_makine_uyumsuz` hatası dönecek.

### 14.4 Stok takibi kapalı ürünlerin gizlenmesi

- [x] `ANLAŞILDI` Üretim emirleri eksik malzemeler alanında görünmeyecek.
- [x] Malzeme stokları listesinde görünmeyecek.
- [x] Hareketler sayfasında görünmeyecek.
- [x] Hareket kaydı oluşmaya devam edecek; yalnızca stok/hareket/yeterlilik ekranlarında gizlenecek.
- [x] Bu kapsam madde 2 altında uygulandı.

## Önerilen Uygulama Sırası

- [x] P0: Reçete detay çizgi hatası, fire kolonunun kaldırılması, reçete satır açıklaması altyapısı.
- [x] P0: Vardiya analizi kayıt toplama hatası ve vardiya/makine rollup düzeltmesi.
- [x] P1: Stok takip bayrağı ve tüm stok/yeterlilik/hareket filtreleri.
- [x] P1: Sipariş işlemleri üretilen miktar kolonu.
- [x] P1: Operasyonel YM kategori silme/onarım güvenliği.
- [x] P2: Görsel import akışı (script hazır).
- [x] P2: Ürünler ekranı buton kaldırma.
- [x] P2: Reçete alt kırılım gösterimini ana ürün reçete açılımından kaldırma.
- [x] P0: İlave Notlar 14.1 Operasyonel YM reçete seçimi ve otomatik operasyon akışı.
- [x] P0: İlave Notlar 14.2 Siparişten üretime aktarınca ürün adı düzeltmesi.
- [x] P1: İlave Notlar 14.3 Makineler arası sürükle bırak kısıtı.

## Çalıştırma Notu

Yeni eklenen iki migration (190 ve 191) lokalde uygulandı:
```bash
bun run db:seed:nodrop --only=190,191
```
Canlı/staging ortamlara aynı komutla yansıtılmalı. Migration'lar `IF NOT EXISTS` pattern'i ile yazıldığı için tekrar çalıştırılması güvenli.
