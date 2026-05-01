import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourcePath = resolve(__dirname, '../recete-detay-modal.tsx');

describe('ReceteDetayModal material image preview contract', () => {
  it('opens a dedicated preview dialog from material image thumbnails', () => {
    const source = readFileSync(sourcePath, 'utf8');

    expect(source).toContain('const [previewUrl, setPreviewUrl] = useState<string | null>(null)');
    expect(source).toContain('setPreviewUrl(kalem.malzemeGorselUrl)');
    expect(source).toContain('open={!!previewUrl}');
    expect(source).toContain('Malzeme Görseli');
    expect(source).toContain('görselini büyüt');
  });
});
