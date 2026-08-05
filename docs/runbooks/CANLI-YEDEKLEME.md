# Canlı yedekleme runbook'u

Hedefler: RPO en fazla 24 saat, RTO en fazla 2 saat; 14 günlük yerel kopya ve
sunucu dışı kopya. Kapsam DB, uploads, etkin Nginx ve PM2 yapılandırmasıdır.
Release'ler yeniden üretilebilir; aktif ve bir rollback release'i ayrıca tutulur.

Servis `paspas-backup.timer` ile her gün 02:20 UTC'de çalışır. Çıktı
`/var/backups/paspas-automatic/daily/<UTC>/`, son başarılı kopya `latest`
bağlantısındadır. DB transaction-consistent alınır, gzip ve SHA-256 doğrulanır;
uploads önceki snapshot'a hard-link kullanarak disk tüketimini azaltır. Başarı ve
hata Telegram'a bildirilir. Secret değerleri arşive alınmaz.

Kontrol:

```bash
systemctl status paspas-backup.timer
journalctl -u paspas-backup.service
cd /var/backups/paspas-automatic/latest && sha256sum -c SHA256SUMS
gzip -t database.sql.gz
```

Sunucu dışı hedef `/etc/paspas/backup.env` içindeki
`PASPAS_REMOTE_RSYNC_TARGET` ile tanımlanır. Bu hedef bağlanmadan Faz 1.2, 1.4 ve
1.5 tamamlanmış kabul edilmez. Production env ancak bir GPG alıcı anahtarı veya
eşdeğer secret-manager hedefi sağlandıktan sonra şifreli olarak kapsama alınır.
