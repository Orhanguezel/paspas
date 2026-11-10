# Yerel disk temizliği — 29 Ekim 2026

Kullanıcının en az 50 GiB alan açma talimatıyla kullanılmayan bağımlılık ve derleme klasörleri kaldırıldı. Proje kaynakları, yerel değişiklikler, kilit dosyaları, .env/veri dosyaları ve Git geçmişi korundu. Bu işlem canlı sunucuyu değiştirmedi.

Çalıştırmadan/derlemeden önce ilgili workspace kökündeki package.json ve kilit dosyasına göre bağımlılıkları yeniden kurun; Next.js çıktılarını yerelde yeniden derleyin. Sırf temizlik sonrası kontrol için bağımlılıklar yeniden kurulmadı.

Kaldırılan üretilmiş klasörler:

- `admin_panel/node_modules`
- `backend/node_modules`
- `admin_panel/.next`

Merkezi işlem kaydı: `/home/orhan/Documents/proje-arsiv-kayitlari/2026-10-29-50gb`.
