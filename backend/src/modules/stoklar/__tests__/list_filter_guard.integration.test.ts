/**
 * Stoklar repoList filtre zorunluluğu — NODE_ENV=test guard'ı doğrular.
 *
 * Plan: Canlı veri listesi geniş olduğunda manuel kontrol yanlış negatif
 * üretebilir. Test ortamında repoList filtre olmadan çağrılırsa açıkça
 * hata atmalı.
 */
import { describe, expect, it } from 'bun:test';

import { repoList } from '../repository';

const isTestEnv = process.env.NODE_ENV === 'test';
const allowDbIntegration = isTestEnv || process.env.RUN_DB_INTEGRATION === '1';
const describeIntegration = allowDbIntegration ? describe : describe.skip;

describeIntegration('stoklar repoList filter guard', () => {
  it('filtresiz çağrıda NODE_ENV=test guard explicit hata atar', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    await expect(
      repoList({ limit: 10, offset: 0, sort: 'kod', order: 'asc' }),
    ).rejects.toThrow('stoklar_repoList_test_filter_required');
    process.env.NODE_ENV = originalEnv;
  });

  it('q filtresi verildiğinde guard geçer (DB sorgusu çalışır)', async () => {
    const result = await repoList({
      q: 'IT-NONEXISTENT-FILTER-PROBE',
      limit: 10,
      offset: 0,
      sort: 'kod',
      order: 'asc',
    });
    expect(result.items).toEqual([]);
  });

  it('kategori filtresi tek başına yeterli', async () => {
    const result = await repoList({
      kategori: 'hammadde',
      limit: 1,
      offset: 0,
      sort: 'kod',
      order: 'asc',
    });
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('kritikOnly true ise filtre kabul edilir', async () => {
    const result = await repoList({
      kritikOnly: true,
      limit: 5,
      offset: 0,
      sort: 'kod',
      order: 'asc',
    });
    expect(Array.isArray(result.items)).toBe(true);
  });
});
