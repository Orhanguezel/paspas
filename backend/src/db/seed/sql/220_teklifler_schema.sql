-- =============================================================
-- Teklif Modülü — V1 şema (transpalet-crm teklifler modülünden uyarlanmıştır)
-- Kural: ALTER TABLE YOK. Şema yalnız seed dosyalarında yaşar.
-- Tablolar: teklif_no_sayaclari, teklifler, teklif_kalemleri, teklif_talepleri
-- =============================================================

-- Yıllık numara sayacı (TK-YYYY-NNNN) — yarış-güvenli sayaç satırı
CREATE TABLE IF NOT EXISTS `teklif_no_sayaclari` (
  `yil` smallint unsigned NOT NULL,
  `son_no` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`yil`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Web teklif talepleri (siteden gelen lead'ler)
CREATE TABLE IF NOT EXISTS `teklif_talepleri` (
  `id` char(36) NOT NULL,
  `kaynak_sayfa` varchar(255) NULL,
  `dil` varchar(8) NOT NULL DEFAULT 'tr',
  `ad` varchar(160) NOT NULL,
  `firma` varchar(200) NULL,
  `email` varchar(255) NULL,
  `telefon` varchar(48) NULL,
  `konu` varchar(200) NULL,
  `mesaj` text NULL,
  `secili_urunler` json NULL,
  `utm` json NULL,
  `kvkk_onay` tinyint unsigned NOT NULL DEFAULT 0,
  `durum` varchar(32) NOT NULL DEFAULT 'yeni',
  `atanan_user_id` char(36) NULL,
  `musteri_id` char(36) NULL,
  `teklif_id` char(36) NULL,
  `ip_hash` varchar(64) NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teklif_talep_durum` (`durum`),
  KEY `idx_teklif_talep_musteri` (`musteri_id`),
  CONSTRAINT `fk_teklif_talep_musteri`
    FOREIGN KEY (`musteri_id`) REFERENCES `musteriler` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teklifler (başlık)
CREATE TABLE IF NOT EXISTS `teklifler` (
  `id` char(36) NOT NULL,
  `teklif_no` varchar(32) NOT NULL,
  `musteri_id` char(36) NOT NULL,
  `talep_id` char(36) NULL,
  `durum` varchar(32) NOT NULL DEFAULT 'taslak',
  `dil` varchar(8) NOT NULL DEFAULT 'tr',
  `para_birimi` char(3) NOT NULL DEFAULT 'TRY',
  `ara_toplam` decimal(14,2) NOT NULL DEFAULT 0.00,
  `iskonto_orani` decimal(5,2) NOT NULL DEFAULT 0.00,
  `iskonto_tutari` decimal(14,2) NOT NULL DEFAULT 0.00,
  `kdv_orani` decimal(5,2) NOT NULL DEFAULT 20.00,
  `kdv_dahil` tinyint unsigned NOT NULL DEFAULT 0,
  `kdv_tutari` decimal(14,2) NOT NULL DEFAULT 0.00,
  `nakliye` decimal(14,2) NOT NULL DEFAULT 0.00,
  `genel_toplam` decimal(14,2) NOT NULL DEFAULT 0.00,
  `gecerlilik_tarihi` date NULL,
  `odeme_kosullari` varchar(500) NULL,
  `teslim_kosullari` varchar(500) NULL,
  `aciklama` varchar(1000) NULL,
  `red_nedeni` varchar(500) NULL,
  `donusen_siparis_id` char(36) NULL,
  `created_by` char(36) NULL,
  `is_active` tinyint unsigned NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teklifler_teklif_no` (`teklif_no`),
  KEY `idx_teklifler_musteri` (`musteri_id`),
  KEY `idx_teklifler_durum` (`durum`),
  CONSTRAINT `fk_teklifler_musteri`
    FOREIGN KEY (`musteri_id`) REFERENCES `musteriler` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_teklifler_talep`
    FOREIGN KEY (`talep_id`) REFERENCES `teklif_talepleri` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_teklifler_siparis`
    FOREIGN KEY (`donusen_siparis_id`) REFERENCES `satis_siparisleri` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teklif kalemleri (ürün seçimi + manuel satır; ürün bilgisi snapshot)
CREATE TABLE IF NOT EXISTS `teklif_kalemleri` (
  `id` char(36) NOT NULL,
  `teklif_id` char(36) NOT NULL,
  `urun_id` char(36) NULL,
  `urun_kod` varchar(64) NULL,
  `urun_ad` varchar(255) NULL,
  `aciklama` varchar(500) NOT NULL,
  `birim` varchar(16) NOT NULL DEFAULT 'adet',
  `miktar` decimal(12,4) NOT NULL DEFAULT 1.0000,
  `birim_fiyat` decimal(14,2) NOT NULL DEFAULT 0.00,
  `iskonto_orani` decimal(5,2) NOT NULL DEFAULT 0.00,
  `satir_toplam` decimal(14,2) NOT NULL DEFAULT 0.00,
  `sira` int unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teklif_kalem` (`teklif_id`, `sira`),
  CONSTRAINT `fk_teklif_kalem_teklif`
    FOREIGN KEY (`teklif_id`) REFERENCES `teklifler` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_teklif_kalem_urun`
    FOREIGN KEY (`urun_id`) REFERENCES `urunler` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- teklif_talepleri.teklif_id sonradan FK bağlanır (döngüsel bağımlılığı önlemek için)
-- Not: FK constraint ekleyemeyiz (ALTER yok); uygulama katmanı bütünlüğü sağlar.
