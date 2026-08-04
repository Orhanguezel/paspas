import { describe, expect, it } from 'bun:test';

import {
  assertGecis,
  assertTeklifGonderilebilir,
  hesaplaToplamlar,
  iskontoOnayGerekli,
} from '../repository';
import { teklifRevizyonRowToDto } from '../schema';
import { talepPublicSchema, teklifCreateSchema } from '../validation';

describe('Teklif toplam motoru', () => {
  it('satır ve genel iskontoyu, nakliyeyi ve hariç KDVyi hesaplar', () => {
    expect(hesaplaToplamlar([
      { miktar: 2, birimFiyat: 500, iskontoOrani: 10 },
      { miktar: 1, birimFiyat: 200 },
    ], 5, 50, 20, false)).toEqual({
      araToplam: 1100,
      iskontoTutari: 55,
      kdvTutari: 219,
      genelToplam: 1314,
    });
  });

  it('KDV dahil toplamda vergiyi toplamın içinden ayırır', () => {
    expect(hesaplaToplamlar([{ miktar: 1, birimFiyat: 120 }], 0, 0, 20, true))
      .toEqual({ araToplam: 120, iskontoTutari: 0, kdvTutari: 20, genelToplam: 120 });
  });

  it('parasal sonuçları iki haneye yuvarlar', () => {
    expect(hesaplaToplamlar([{ miktar: 3, birimFiyat: 0.1 }], 0, 0, 20, false))
      .toEqual({ araToplam: 0.3, iskontoTutari: 0, kdvTutari: 0.06, genelToplam: 0.36 });
  });
});

describe('Teklif durum ve iskonto kapıları', () => {
  it('izinli geçişleri ve aynı durumu kabul eder', () => {
    expect(() => assertGecis('taslak', 'gonderildi')).not.toThrow();
    expect(() => assertGecis('gonderildi', 'kabul')).not.toThrow();
    expect(() => assertGecis('kabul', 'kabul')).not.toThrow();
  });

  it('terminal veya atlamalı geçişleri reddeder', () => {
    expect(() => assertGecis('taslak', 'kabul')).toThrow('gecersiz_teklif_gecisi');
    expect(() => assertGecis('kabul', 'taslak')).toThrow('gecersiz_teklif_gecisi');
    expect(() => assertGecis('red', 'gonderildi')).toThrow('gecersiz_teklif_gecisi');
    expect(() => assertGecis('suresi_doldu', 'kabul')).toThrow('gecersiz_teklif_gecisi');
  });

  it('rol limitlerini uygular', () => {
    expect(iskontoOnayGerekli(100, 'admin')).toBe(false);
    expect(iskontoOnayGerekli(10, 'sevkiyatci')).toBe(false);
    expect(iskontoOnayGerekli(10.01, 'sevkiyatci')).toBe(true);
    expect(iskontoOnayGerekli(0.01, 'operator')).toBe(true);
  });

  it('onaysız limit üstü gönderimi engeller', () => {
    expect(() => assertTeklifGonderilebilir({ iskontoOrani: 11, iskontoOnaylandi: false }, 'sevkiyatci'))
      .toThrow('iskonto_onayi_gerekli');
    expect(() => assertTeklifGonderilebilir({ iskontoOrani: 11, iskontoOnaylandi: true }, 'sevkiyatci'))
      .not.toThrow();
  });
});

describe('Teklif kontratları', () => {
  it('revizyon snapshotını yalnız açıkça istendiğinde döndürür', () => {
    const row = {
      id: crypto.randomUUID(), teklif_id: crypto.randomUUID(), revizyon_no: 2,
      snapshot: { teklif: { durum: 'gonderildi' }, kalemler: [{ miktar: 2 }] },
      neden: 'Fiyat güncellemesi', created_by: null, created_at: new Date('2026-08-04T12:00:00Z'),
    };
    expect(teklifRevizyonRowToDto(row).snapshot).toBeUndefined();
    expect(teklifRevizyonRowToDto(row, true).snapshot).toEqual(row.snapshot);
  });

  it('public talepte en az bir iletişim kanalı ve geçerli honeypot sınırı ister', () => {
    const base = { ad: 'Yetkili', telefon: '05000000000', kvkkOnay: true, website: '' };
    expect(talepPublicSchema.safeParse(base).success).toBe(true);
    expect(talepPublicSchema.safeParse({ ad: 'Yetkili', kvkkOnay: true }).success).toBe(false);
    expect(talepPublicSchema.safeParse({ ...base, website: 'x'.repeat(501) }).success).toBe(false);
  });

  it('teklif oluşturma varsayımlarını sabit tutar', () => {
    const parsed = teklifCreateSchema.parse({ yeniMusteri: { ad: 'Aday' } });
    expect(parsed).toMatchObject({ paraBirimi: 'TRY', dil: 'tr', kdvOrani: 20, kdvDahil: false });
  });
});
