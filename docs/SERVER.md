# Paspas ERP — Sunucu Bilgileri

## Bağlantı

| Bilgi | Değer |
|-------|-------|
| IP | 178.210.161.181 |
| SSH Alias | `ssh vps-paspas` |
| SSH Port | 22667 |
| SSH User | root |
| SSH Key | `~/.ssh/id_ed25519` |
| Hostname | tr-d11db5 |
| OS | Ubuntu 24.04.3 LTS |
| RAM | 1.9 GB + 2 GB Swap |
| Disk | 48 GB |

## Kurulu Servisler

| Servis | Versiyon | Notlar |
|--------|----------|--------|
| Node.js | v20.20.1 | Next.js admin panel için |
| Bun | 1.3.11 | Backend runtime |
| MySQL | 8.0.45 | Veritabanı |
| Nginx | 1.24.0 | Reverse proxy |
| PM2 | 6.0.14 | Process manager |
| Fail2ban | 1.0.2 | Brute-force koruması |
| UFW | aktif | Firewall |

## Veritabanı

| Bilgi | Değer |
|-------|-------|
| DB Name | promats_erp |
| DB User | app |
| DB Password | Sunucudaki `backend/.env` dosyasından okunur; dokümana yazılmaz |
| DB Host | 127.0.0.1 |
| DB Port | 3306 |

## Dizin Yapısı

```
/var/www/paspas/
├── backend/        # Fastify API (port 8078)
├── admin_panel/    # Next.js (port 3000)
├── uploads/        # Yüklenen dosyalar
└── .deploy/        # Deploy artifact'ları
```

## Nginx Yapılandırması

- Config: `/etc/nginx/sites-available/paspas`
- `/api/*` → `127.0.0.1:8078` (backend)
- `/uploads/*` → `/var/www/paspas/uploads/` (statik dosyalar)
- `/*` → `127.0.0.1:3000` (admin panel)

## Firewall (UFW)

| Port | Protokol | Açıklama |
|------|----------|----------|
| 22667 | TCP | SSH |
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS |

Geri kalan tüm gelen trafik engellendi.

## Güvenlik

- SSH parola ile giriş kapalı, sadece key ile erişim
- Fail2ban aktif (brute-force koruması)
- Root login sadece key ile (`prohibit-password`)

## Deploy — Atomic Release (build YERELDE alinir)

> **UYARI (2026-08-18):** `/root/bin/deploy-paspas` **devre disi birakildi.** Sunucu uzerinde
> `next build` calistiriyordu; 1.9 GB RAM'li bu makinede sistemi kilitliyor. 2026-08-18'de
> OOM-killer once `mysqld`'yi oldurdu, panel + promats web ~25 dakika hizmet disi kaldi.
> Ustelik ise de yaramiyordu: PM2 `/var/www/paspas-runtime/current` uzerinden calisiyor,
> script ise `/var/www/paspas` icine build aliyordu — uretilen build canliya hic ulasmiyordu.
> Eski icerik sunucuda: `/root/bin/deploy-paspas.BOZUK-yedek-20260818`

Canli, **atomic release** modeliyle calisir. Build **yerel makinede** yapilir, sunucuya
yalnizca hazir artefakt gonderilir — sunucuda tek satir build calismaz.

```bash
# 1) Yerelde artefakt uret (backend + admin + promats subpath/root)
scripts/deploy/build-release-artifact.sh HEAD
# -> /tmp/paspas-release-<RELEASE_ID>.tar.gz

# 2) Sunucuya gonder
scp /tmp/paspas-release-<RELEASE_ID>.tar.gz vps-paspas:/tmp/

# 3) Sunucuda aktive et (checksum dogrulamali, hata halinde otomatik geri alma)
ssh vps-paspas "/var/www/paspas/scripts/deploy/activate-release-artifact.sh /tmp/paspas-release-<RELEASE_ID>.tar.gz"

# Geri alma
ssh vps-paspas "/var/www/paspas/scripts/deploy/rollback-atomic-release.sh"
```

### Runtime yapisi

```
/var/www/paspas-runtime/
├── current -> releases/<RELEASE_ID>    # PM2 buradan calisir
├── releases/                            # son 3 release tutulur
└── shared/backend.env                   # release'ler arasi paylasilan env
```

- `/var/www/paspas` yalnizca **kaynak repo**dur; PM2 oradan calismaz.
- Release ID formati: `<UTC timestamp>-<12 haneli commit>` (or. `20260814T215329Z-57414cccfe89`).

## Schema Migration (otomatik)

> **DIKKAT (2026-08-18 dogrulandi):** Atomic release script'lerinin **hicbiri migration calistirmaz**
> (`activate-release-artifact.sh` ve `deploy-atomic-release.sh` icinde cagri yok). Migration'i
> tetikleyen tek yer, devre disi birakilan eski `deploy-paspas` script'iydi. Yeni SQL seed dosyasi
> iceren bir surum yayinlanirken migration **elle** calistirilmalidir:
>
> ```bash
> ssh vps-paspas "/root/bin/apply-paspas-migrations"
> ```
>
> Sirasi: once migration, sonra release aktivasyonu. Bu bosluk kapatilana kadar (release
> script'ine migration adimi eklenene kadar) elle adim atlanmamalidir.
Bu script yalnızca **yeni** `backend/src/db/seed/sql/*.sql` dosyalarını uygular ve
`_applied_sql_files` tablosunda izler. İlk çalışmada mevcut tüm dosyalar
baseline olarak işaretlenir (çalıştırılmadan) — böylece demo-veri/branding
seed'leri tekrar çalışmaz ve müşteri ayarları korunur.

- Repo kopyası (referans, env-tabanlı): [scripts/deploy/apply-paspas-migrations.sh](scripts/deploy/apply-paspas-migrations.sh)
- Yeni şema seed dosyası eklendiğinde elle uygulama **gerekmez** — deploy otomatik alır.

## PM2 Komutları

```bash
ssh vps-paspas "pm2 status"          # Durum
ssh vps-paspas "pm2 logs"            # Loglar
ssh vps-paspas "pm2 restart all"     # Yeniden başlat
```
