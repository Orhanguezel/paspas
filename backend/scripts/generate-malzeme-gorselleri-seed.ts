/**
 * Filesystem'daki uploads/malzemeler/ dosyalarından seed SQL üretir.
 * Çıktı: backend/src/db/seed/sql/192_v1_canli_malzeme_gorselleri.sql
 *
 * - storage_assets satırları INSERT IGNORE
 * - urunler.image_url + storage_asset_id UPDATE (yalnızca image_url NULL ise)
 * - urun_medya satırları INSERT IGNORE (kpk veya suffix-yok → is_cover=1)
 *
 * UUID'ler deterministic: MD5(bucket/path) ile aynı dosya her seferinde aynı id alır.
 */
import { createHash } from 'node:crypto';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const UPLOADS_ROOT = '/home/orhan/Documents/Projeler/paspas/backend/uploads/malzemeler';
const BUCKET = 'product-images';
const FOLDER = 'malzemeler';
const OUT_PATH = '/home/orhan/Documents/Projeler/paspas/backend/src/db/seed/sql/192_v1_canli_malzeme_gorselleri.sql';

// Filesystem dosya adı: "1101_101_kpk.png" (boşluklar `_`'a dönüştürülmüş)
// Hem boşluklu hem underscore'lu varyantları kabul ediyoruz.
const FILE_NAME_RE = /^(\d{4})[ _](\d{3})(?:[ _]([A-Za-z0-9]+))?\.([A-Za-z0-9]+)$/;
const SUFFIX_SIRA: Record<string, number> = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 };

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

export type MaterialImageFileInfo = {
  fname: string;
  size: number;
};

export function deterministicUuid(input: string): string {
  // MD5(input) → 32 hex → UUID format (versiyon biti istemsiz, idempotent yeterli)
  const hex = createHash('md5').update(input).digest('hex');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)].join('-');
}

export function sqlEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "''");
}

export function parseFileName(name: string): { kod: string; suffix: string | null; isCover: boolean; ext: string } | null {
  const m = name.match(FILE_NAME_RE);
  if (!m) return null;
  const kod = `${m[1]} ${m[2]}`; // urunler.kod boşluklu — "1101 101"
  const suffix = (m[3] ?? null)?.toLowerCase() ?? null;
  const ext = m[4].toLowerCase();
  return { kod, suffix, isCover: !suffix || suffix === 'kpk', ext };
}

export function publicIdFromName(originalName: string): string {
  return originalName.replace(/\.[^.]+$/, '').replace(/[^\w.\-]+/g, '_');
}

export function buildMalzemeGorselleriSeedSql(fileInfos: MaterialImageFileInfo[]): {
  sql: string;
  assetCount: number;
  medyaCount: number;
  coverUpdateCount: number;
  skipped: string[];
} {
  const lines: string[] = [];
  lines.push('-- AUTO-GENERATED — generate-malzeme-gorselleri-seed.ts');
  lines.push('-- Drive klasöründen indirilmiş malzeme görsellerini storage_assets / urunler / urun_medya tablolarına bağlar.');
  lines.push('-- Idempotent: INSERT IGNORE + UPDATE WHERE image_url IS NULL pattern.');
  lines.push('');

  let assetCount = 0;
  let medyaCount = 0;
  let coverUpdateCount = 0;
  const skipped: string[] = [];

  for (const { fname, size } of fileInfos) {
    // Dosya adı yerel'de underscore'lu ("1101_101_kpk.png") — orijinal isim ("1101 101 kpk.png") boşluklu
    // Original name'i underscore → boşluk dönüşümüyle çıkarıyoruz (sadece kod ve suffix sınırları için).
    const originalName = fname.replace(/_/g, ' ').replace(/(\d{4}) (\d{3}) /, '$1 $2 ');

    const parsed = parseFileName(fname);
    if (!parsed) {
      skipped.push(`-- parse fail: ${fname}`);
      continue;
    }

    const mime = MIME_BY_EXT[parsed.ext] ?? 'image/png';
    const bucketPath = `${FOLDER}/${fname}`;
    const publicUrl = `/uploads/${bucketPath}`;
    const publicId = publicIdFromName(fname);

    const assetId = deterministicUuid(`asset:${BUCKET}/${bucketPath}`);
    const medyaIdSeed = `medya:${parsed.kod}:${bucketPath}`;
    const medyaId = deterministicUuid(medyaIdSeed);

    const metadata = JSON.stringify({ source: 'google_drive', originalName: fname });

    // 1) storage_assets — INSERT IGNORE (path UNIQUE değilse de duplicate id çakışır)
    lines.push(
      `INSERT IGNORE INTO storage_assets (id, user_id, name, bucket, path, folder, mime, size, width, height, url, hash, provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)`,
    );
    lines.push(
      `  VALUES ('${assetId}', NULL, '${sqlEscape(fname)}', '${BUCKET}', '${sqlEscape(bucketPath)}', '${FOLDER}', '${mime}', ${size}, NULL, NULL, '${sqlEscape(publicUrl)}', NULL, 'local', '${sqlEscape(publicId)}', 'image', '${parsed.ext}', NULL, NULL, '${sqlEscape(metadata)}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));`,
    );
    assetCount += 1;

    // 2) Kapak ise: urunler.image_url'i sadece NULL ise güncelle
    if (parsed.isCover) {
      lines.push(
        `UPDATE urunler SET image_url = '${sqlEscape(publicUrl)}', storage_asset_id = '${assetId}' WHERE kod = '${sqlEscape(parsed.kod)}' AND image_url IS NULL;`,
      );
      coverUpdateCount += 1;
    }

    // 3) urun_medya satırı — kod eşleşen ürün varsa
    const sira = parsed.suffix && SUFFIX_SIRA[parsed.suffix] != null ? SUFFIX_SIRA[parsed.suffix] : parsed.isCover ? 0 : 99;
    const isCover = parsed.isCover ? 1 : 0;
    lines.push(
      `INSERT IGNORE INTO urun_medya (id, urun_id, tip, url, storage_asset_id, baslik, sira, is_cover, created_at, updated_at)`,
    );
    lines.push(
      `  SELECT '${medyaId}', u.id, 'image', '${sqlEscape(publicUrl)}', '${assetId}', NULL, ${sira}, ${isCover}, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3) FROM urunler u WHERE u.kod = '${sqlEscape(parsed.kod)}' LIMIT 1;`,
    );
    medyaCount += 1;
    lines.push('');
  }

  if (skipped.length > 0) {
    lines.push('-- Skipped:');
    lines.push(...skipped);
  }

  // 1. PASS — Kod-tabanlı varyant propagasyonu.
  // urunler.kod formatları:
  //   "1101 101"      → ana ürün
  //   "1101 101-PR"   → parça varyantı     (ana = "1101 101")
  //   "1101 101-X"    → aramamul varyantı  (ana = "1101 101")
  //   "1101 201-L"    → sol aramamul       (ana = "1101 201")
  lines.push('');
  lines.push('-- 1. PASS: kod-tabanlı varyant propagasyonu (örn. -PR, -X, -L).');
  lines.push('UPDATE urunler v');
  lines.push('  INNER JOIN urunler base ON base.kod = SUBSTRING_INDEX(v.kod, \'-\', 1)');
  lines.push('SET v.image_url = base.image_url,');
  lines.push('    v.storage_asset_id = base.storage_asset_id');
  lines.push('WHERE v.kod LIKE \'%-%\'');
  lines.push('  AND v.image_url IS NULL');
  lines.push('  AND base.image_url IS NOT NULL');
  lines.push('  AND v.id <> base.id;');

  // 2. PASS — Ad-tabanlı varyant propagasyonu.
  // urunler.ad formatları:
  //   "STAR SİYAH"                    → ana ürün
  //   "STAR SİYAH -4 PARÇA-"          → varyant (baz = "STAR SİYAH")
  //   "STAR PLUS SİYAH - İKİLİ ÖN-"   → varyant (baz = "STAR PLUS SİYAH")
  //   "STAR PLUS SİYAH - BSG 99-..."  → varyant (baz = "STAR PLUS SİYAH")
  // SUBSTRING_INDEX(ad, ' -', 1) ile " -" delimiter'ından önceki kısım baz ad.
  lines.push('');
  lines.push('-- 2. PASS: ad-tabanlı varyant propagasyonu.');
  lines.push('-- Ürün adının " -" öncesi kısmı baz ad; aynı baz ada sahip ve görseli olan ürün bulunursa kopyalanır.');
  lines.push('UPDATE urunler v');
  lines.push('  INNER JOIN (');
  lines.push('    SELECT TRIM(SUBSTRING_INDEX(ad, \' -\', 1)) AS base_ad,');
  lines.push('           MIN(image_url) AS image_url,');
  lines.push('           MIN(storage_asset_id) AS storage_asset_id');
  lines.push('    FROM urunler');
  lines.push('    WHERE image_url IS NOT NULL');
  lines.push('    GROUP BY TRIM(SUBSTRING_INDEX(ad, \' -\', 1))');
  lines.push('  ) base ON TRIM(SUBSTRING_INDEX(v.ad, \' -\', 1)) = base.base_ad');
  lines.push('SET v.image_url = base.image_url,');
  lines.push('    v.storage_asset_id = base.storage_asset_id');
  lines.push('WHERE v.image_url IS NULL');
  lines.push('  AND base.image_url IS NOT NULL;');

  lines.push('');
  lines.push(`-- Sonuç: ${assetCount} storage_asset, ${coverUpdateCount} kapak update, ${medyaCount} urun_medya, + varyant propagasyonu.`);

  return {
    sql: lines.join('\n'),
    assetCount,
    medyaCount,
    coverUpdateCount,
    skipped,
  };
}

function main() {
  const fileInfos = readdirSync(UPLOADS_ROOT)
    .filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f))
    .sort()
    .map((fname) => ({
      fname,
      size: statSync(join(UPLOADS_ROOT, fname)).size,
    }));

  const { sql, assetCount, medyaCount, coverUpdateCount } = buildMalzemeGorselleriSeedSql(fileInfos);

  writeFileSync(OUT_PATH, sql);
  console.log(`Yazıldı: ${OUT_PATH}`);
  console.log(`Satır: assets=${assetCount}, kapak=${coverUpdateCount}, medya=${medyaCount}`);
}

if (import.meta.main) {
  main();
}
