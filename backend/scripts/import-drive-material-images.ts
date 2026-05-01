/**
 * Google Drive klasöründen malzeme görsellerini filesystem'a (uploads/malzemeler) indirir.
 *
 * NOT: Bu script DB'ye yazmaz. DB kayıtları seed üzerinden yapılır:
 *   1) bun run scripts/import-drive-material-images.ts          → Drive → filesystem
 *   2) bun run scripts/generate-malzeme-gorselleri-seed.ts      → seed SQL üret
 *   3) bun run db:seed:nodrop --only=192                        → DB'ye uygula
 *
 * Bu ayrım CLAUDE.md kuralı gereği: lokalde manuel DB INSERT/UPDATE/ALTER yapılmaz,
 * tüm değişiklikler seed dosyaları üzerinden uygulanır.
 */
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_DRIVE_FOLDER = 'https://drive.google.com/drive/folders/1n86WZD5fDatWnsylrSidZXNBNeAWULo0';
const DEFAULT_TARGET_DIR = '/home/orhan/Documents/Projeler/paspas/backend/uploads/malzemeler';
const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif)$/i;

export type DriveFile = { id: string; name: string; mime: string };

function argValue(name: string, fallback?: string): string | undefined {
  const prefix = `--${name}=`;
  const exact = `--${name}`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  if (hit) return hit.slice(prefix.length);
  const idx = process.argv.indexOf(exact);
  if (idx >= 0) return process.argv[idx + 1] ?? fallback;
  return fallback;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

export function decodeDriveHtml(html: string): string {
  return html
    .replace(/\\x([0-9A-Fa-f]{2})/g, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/\\u003d/g, '=')
    .replace(/\\\//g, '/');
}

export function parseDriveFiles(html: string): DriveFile[] {
  const decoded = decodeDriveHtml(html);
  const files = new Map<string, DriveFile>();
  const entryRe = /\["([A-Za-z0-9_-]{20,})",\["[A-Za-z0-9_-]{20,}"\],"([^"]+\.(?:png|jpe?g|webp|gif))","(image\/[^"]+)"/gi;

  for (const match of decoded.matchAll(entryRe)) {
    const [, id, rawName, mime] = match;
    const name = rawName.replace(/[\\/]+/g, '_').trim();
    if (!name || !IMAGE_EXT_RE.test(name)) continue;
    if (files.has(id)) continue;
    files.set(id, { id, name, mime });
  }

  return [...files.values()].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

async function downloadDriveFile(file: DriveFile): Promise<Buffer> {
  const url = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(file.id)}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`download_failed:${file.name}:${res.status}`);
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`download_not_image:${file.name}:${contentType}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// Local upload pattern ile aynı: boşluk → '_'
export function normalizeFileName(originalName: string): string {
  return originalName.replace(/[^\w.\-]+/g, '_');
}

async function main() {
  const driveFolder = argValue('drive-folder', DEFAULT_DRIVE_FOLDER) ?? DEFAULT_DRIVE_FOLDER;
  const targetDir = argValue('target', DEFAULT_TARGET_DIR) ?? DEFAULT_TARGET_DIR;
  const dryRun = hasFlag('dry-run');
  const force = hasFlag('force'); // mevcut dosyayı bile yeniden indir

  const folderHtml = await (await fetch(driveFolder)).text();
  const files = parseDriveFiles(folderHtml);
  console.log(`Drive klasorunden ${files.length} gorsel bulundu.`);

  if (dryRun) {
    for (const file of files) console.log(`${file.id}\t${file.name}\t${file.mime}`);
    return;
  }

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  let downloaded = 0;
  let skipped = 0;
  for (const file of files) {
    const localName = normalizeFileName(file.name);
    const localPath = join(targetDir, localName);

    if (!force && existsSync(localPath) && statSync(localPath).size > 0) {
      skipped += 1;
      console.log(`mevcut\t${localName}`);
      continue;
    }

    try {
      const buf = await downloadDriveFile(file);
      writeFileSync(localPath, buf);
      downloaded += 1;
      console.log(`indirildi\t${localName}\t${buf.length}b`);
    } catch (error) {
      console.error(`hata\t${file.name}\t${(error as Error).message}`);
    }
  }

  console.log(`Tamamlandi. Indirilen: ${downloaded}, atlanan: ${skipped}.`);
  console.log('');
  console.log('Sıradaki adım:');
  console.log('  bun run scripts/generate-malzeme-gorselleri-seed.ts');
  console.log('  bun run db:seed:nodrop --only=192');
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
