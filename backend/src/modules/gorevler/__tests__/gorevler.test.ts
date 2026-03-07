import { describe, expect, it } from 'bun:test';

import { createSchema, listQuerySchema, updateSchema } from '../validation';

describe('gorevler validation', () => {
  it('accepts valid create payload', () => {
    const result = createSchema.safeParse({
      baslik: 'Kritik stok icin satin alma takip gorevi',
      tip: 'kritik_stok',
      modul: 'satin_alma',
      atananKullaniciId: 'erp-demo-sata-0004-000000000004',
      oncelik: 'kritik',
      durum: 'acik',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = createSchema.safeParse({ baslik: ' ' });
    expect(result.success).toBe(false);
  });

  it('accepts list filters', () => {
    const result = listQuerySchema.safeParse({
      q: 'stok',
      sadeceBenim: 'true',
      gecikenOnly: '1',
      limit: '50',
      offset: '0',
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.sadeceBenim).toBe(true);
    expect(result.data.gecikenOnly).toBe(true);
  });

  it('accepts update status change', () => {
    const result = updateSchema.safeParse({
      durum: 'tamamlandi',
      aciklama: 'Tamamlandi',
    });
    expect(result.success).toBe(true);
  });
});
