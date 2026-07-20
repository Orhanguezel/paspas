-- 215: Hareket miktar işareti normalizasyonu (V20/R4)
--
-- Kural: giris/cikis hareketlerinde `miktar` DAIMA pozitif; yön `hareket_tipi`
-- kolonunda taşınır. duzeltme tipinde yön işaretle taşınır (repoAdjustStock),
-- dolayısıyla DOKUNULMAZ.
--
-- Eskiden sevkiyat (sevkiyat/repository.ts) ve kuyruktan-çıkarma (ölü kod
-- hammadde_service.stokDus) `cikis` hareketlerini NEGATIF miktarla yazmıştı.
-- Kod artık pozitif yazıyor; geçmiş `cikis` satırlarını da hizalıyoruz.
--
-- GÜVENLİ: SUM(hareketler.miktar) yapan tek gerçek rapor
-- (satis_siparisleri/repository.ts:297) `hareket_tipi='giris'` filtreli — cikis'e
-- bakmıyor. Çıkışları toplayan raporlar zaten ABS() kullanıyor. Yani işaret
-- düzeltmesi hiçbir raporu değiştirmez.
--
-- Idempotent: yalnızca miktar<0 olan cikis satırlarına dokunur; ikinci çalıştırmada
-- eşleşen satır kalmadığından no-op olur.

UPDATE `hareketler`
SET `miktar` = ABS(`miktar`)
WHERE `hareket_tipi` = 'cikis'
  AND `miktar` < 0;
