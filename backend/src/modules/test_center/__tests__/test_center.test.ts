import { describe, expect, it } from 'bun:test';

import { parseAllowedCommand, parseTestOutput, shouldEnableDbIntegrationForCase } from '../runner';
import { caseRowToDto, runRowToDto } from '../schema';
import { createRunSchema, listRunsQuerySchema } from '../validation';

describe('test center validation', () => {
  it('accepts a live-db run result with snapshot id', () => {
    const parsed = createRunSchema.parse({
      caseId: '00000000-0000-4000-8000-000000000001',
      baslik: 'Backend smoke test paketi',
      status: 'passed',
      passCount: 398,
      failCount: 0,
      skipCount: 21,
      snapshotId: 'snapshot_123',
      outputExcerpt: '398 pass, 21 skip, 0 fail',
    });

    expect(parsed.status).toBe('passed');
    expect(parsed.snapshotId).toBe('snapshot_123');
  });

  it('rejects unknown run status values', () => {
    const parsed = createRunSchema.safeParse({
      baslik: 'Backend smoke test paketi',
      status: 'unknown',
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects run list limits above the allowed bound', () => {
    const parsed = listRunsQuerySchema.safeParse({ limit: 5000, offset: 0 });
    expect(parsed.success).toBe(false);
  });
});

describe('test center runner helpers', () => {
  it('allows only known bun test and typecheck command shapes', () => {
    expect(parseAllowedCommand('bun test src/modules/test_center/__tests__/test_center.test.ts')).toEqual({
      bin: 'bun',
      args: ['test', 'src/modules/test_center/__tests__/test_center.test.ts'],
    });
    expect(parseAllowedCommand('bun x tsc -p tsconfig.json --noEmit')).toEqual({
      bin: 'bun',
      args: ['x', 'tsc', '-p', 'tsconfig.json', '--noEmit'],
    });
    expect(parseAllowedCommand('rm -rf /')).toBeNull();
    expect(parseAllowedCommand('bun test; rm -rf /')).toBeNull();
  });

  it('parses bun test summary counts', () => {
    const parsed = parseTestOutput(`
      403 pass
      21 skip
      0 fail
      679 expect() calls
    `);

    expect(parsed.passCount).toBe(403);
    expect(parsed.skipCount).toBe(21);
    expect(parsed.failCount).toBe(0);
    expect(parsed.expectCount).toBe(679);
  });

  it('enables DB integration only for explicit integration cases', () => {
    expect(shouldEnableDbIntegrationForCase({ kategori: 'smoke', komut: 'bun test' }, true)).toBe(false);
    expect(shouldEnableDbIntegrationForCase({ kategori: 'smoke', komut: 'bun test src/modules/receteler src/modules/uretim_emirleri' }, true)).toBe(false);
    expect(shouldEnableDbIntegrationForCase({ kategori: 'integration', komut: 'bun test src/a.integration.test.ts' }, true)).toBe(true);
    expect(shouldEnableDbIntegrationForCase({ kategori: 'real-db-e2e', komut: 'bun test src/a.real.integration.test.ts' }, true)).toBe(true);
    expect(shouldEnableDbIntegrationForCase({ kategori: 'integration', komut: 'bun test src/a.integration.test.ts' }, false)).toBe(false);
  });
});

describe('test center dto mapping', () => {
  it('maps database rows to panel-friendly case dto fields', () => {
    const now = new Date('2026-04-30T07:30:00.000Z');
    const dto = caseRowToDto({
      id: 'case-1',
      kod: 'smoke:test',
      baslik: 'Smoke test',
      kategori: 'smoke',
      kapsam: 'backend',
      komut: 'bun test',
      dosya_yolu: 'backend',
      durum: 'active',
      risk_notu: 'Snapshot al',
      sira: 10,
      is_active: 1,
      created_at: now,
      updated_at: now,
    });

    expect(dto.dosyaYolu).toBe('backend');
    expect(dto.riskNotu).toBe('Snapshot al');
    expect(dto.isActive).toBe(true);
  });

  it('maps run counters and snapshot metadata', () => {
    const now = new Date('2026-04-30T07:30:00.000Z');
    const dto = runRowToDto({
      id: 'run-1',
      case_id: 'case-1',
      baslik: 'Smoke test',
      komut: 'bun test',
      status: 'passed',
      pass_count: 398,
      fail_count: 0,
      skip_count: 21,
      expect_count: 670,
      output_excerpt: 'ok',
      risk_notu: null,
      snapshot_id: 'snap-1',
      started_at: now,
      finished_at: now,
      created_by_user_id: 'user-1',
      created_at: now,
    });

    expect(dto.passCount).toBe(398);
    expect(dto.snapshotId).toBe('snap-1');
  });
});
