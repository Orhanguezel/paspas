import { describe, expect, it } from 'vitest';
import trJson from '../tr.json';

const erp = (trJson as any).admin?.erp;

describe('ERP locale keys completeness (tr.json)', () => {
  it('admin.erp section exists', () => {
    expect(erp).toBeDefined();
    expect(typeof erp).toBe('object');
  });

  it('has common shared keys', () => {
    const common = erp.common;
    expect(common).toBeDefined();
    expect(common.totalCount).toContain('{count}');
    expect(common.deleted).toContain('{item}');
    expect(common.created).toContain('{item}');
    expect(common.updated).toContain('{item}');
    expect(common.deleteFailed).toBeTruthy();
    expect(common.deleting).toBeTruthy();
    expect(common.saving).toBeTruthy();
    expect(common.active).toBeTruthy();
    expect(common.inactive).toBeTruthy();
    expect(common.required).toBeTruthy();
  });

  const modules = [
    'urunler',
    'musteriler',
    'receteler',
    'satisSiparisleri',
    'uretimEmirleri',
    'makineHavuzu',
    'isYukler',
    'stoklar',
    'satinAlma',
    'hareketler',
    'operator',
    'tanimlar',
    'gantt',
  ];

  for (const mod of modules) {
    it(`has admin.erp.${mod} section`, () => {
      expect(erp[mod]).toBeDefined();
      expect(erp[mod].title).toBeTruthy();
    });
  }

  // Detailed checks for each module
  describe('urunler', () => {
    const m = erp.urunler;
    it('has required keys', () => {
      expect(m.singular).toBeTruthy();
      expect(m.newItem).toBeTruthy();
      expect(m.editItem).toBeTruthy();
      expect(m.notFound).toBeTruthy();
      expect(m.deleteTitle).toBeTruthy();
    });
    it('has all column keys', () => {
      expect(m.columns.kod).toBeTruthy();
      expect(m.columns.ad).toBeTruthy();
      expect(m.columns.birim).toBeTruthy();
      expect(m.columns.renk).toBeTruthy();
      expect(m.columns.stok).toBeTruthy();
      expect(m.columns.birimFiyat).toBeTruthy();
      expect(m.columns.durum).toBeTruthy();
    });
    it('has form keys', () => {
      expect(m.form.kod).toBeTruthy();
      expect(m.form.ad).toBeTruthy();
      expect(m.form.birim).toBeTruthy();
    });
  });

  describe('musteriler', () => {
    const m = erp.musteriler;
    it('has type labels', () => {
      expect(m.types.musteri).toBeTruthy();
      expect(m.types.tedarikci).toBeTruthy();
    });
    it('has all column keys', () => {
      expect(m.columns.tur).toBeTruthy();
      expect(m.columns.ad).toBeTruthy();
      expect(m.columns.telefon).toBeTruthy();
      expect(m.columns.adres).toBeTruthy();
      expect(m.columns.iskonto).toBeTruthy();
    });
  });

  describe('satisSiparisleri', () => {
    const m = erp.satisSiparisleri;
    it('has all status labels', () => {
      expect(m.statuses.taslak).toBeTruthy();
      expect(m.statuses.onaylandi).toBeTruthy();
      expect(m.statuses.uretimde).toBeTruthy();
      expect(m.statuses.tamamlandi).toBeTruthy();
      expect(m.statuses.iptal).toBeTruthy();
    });
    it('has detail section', () => {
      expect(m.detail.notFound).toBeTruthy();
      expect(m.detail.kalemler).toBeTruthy();
    });
  });

  describe('uretimEmirleri', () => {
    const m = erp.uretimEmirleri;
    it('has all status labels', () => {
      expect(m.statuses.atanmamis).toBeTruthy();
      expect(m.statuses.planlandi).toBeTruthy();
      expect(m.statuses.uretimde).toBeTruthy();
      expect(m.statuses.tamamlandi).toBeTruthy();
      expect(m.statuses.iptal).toBeTruthy();
    });
  });

  describe('makineHavuzu', () => {
    const m = erp.makineHavuzu;
    it('has machine status labels', () => {
      expect(m.statuses.aktif).toBeTruthy();
      expect(m.statuses.pasif).toBeTruthy();
      expect(m.statuses.bakimda).toBeTruthy();
    });
  });

  describe('satinAlma', () => {
    const m = erp.satinAlma;
    it('has all status labels', () => {
      expect(m.statuses.taslak).toBeTruthy();
      expect(m.statuses.onaylandi).toBeTruthy();
      expect(m.statuses.siparis_verildi).toBeTruthy();
      expect(m.statuses.kismen_teslim).toBeTruthy();
      expect(m.statuses.tamamlandi).toBeTruthy();
      expect(m.statuses.iptal).toBeTruthy();
    });
  });

  describe('hareketler', () => {
    const m = erp.hareketler;
    it('has movement type labels', () => {
      expect(m.types.giris).toBeTruthy();
      expect(m.types.cikis).toBeTruthy();
      expect(m.types.duzeltme).toBeTruthy();
    });
  });

  describe('operator', () => {
    const m = erp.operator;
    it('has operator-specific keys', () => {
      expect(m.description).toBeTruthy();
      expect(m.planned).toBeTruthy();
      expect(m.produced).toBeTruthy();
      expect(m.updateProduction).toBeTruthy();
      expect(m.enterQuantity).toBeTruthy();
    });
  });

  describe('tanimlar', () => {
    const m = erp.tanimlar;
    it('has tab labels', () => {
      expect(m.tabs.kaliplar).toBeTruthy();
      expect(m.tabs.tatiller).toBeTruthy();
    });
    it('has kaliplar sub-section', () => {
      expect(m.kaliplar.singular).toBeTruthy();
      expect(m.kaliplar.newItem).toBeTruthy();
      expect(m.kaliplar.columns.kod).toBeTruthy();
    });
    it('has tatiller sub-section', () => {
      expect(m.tatiller.singular).toBeTruthy();
      expect(m.tatiller.newItem).toBeTruthy();
      expect(m.tatiller.columns.tarih).toBeTruthy();
    });
  });

  describe('gantt', () => {
    const m = erp.gantt;
    it('has description with placeholder', () => {
      expect(m.description).toContain('{count}');
    });
    it('has column keys', () => {
      expect(m.columns.emirNo).toBeTruthy();
      expect(m.columns.durum).toBeTruthy();
    });
  });
});

describe('admin.common keys (tr.json)', () => {
  const common = (trJson as any).admin?.common;

  it('has essential UI action keys', () => {
    expect(common.save).toBeTruthy();
    expect(common.cancel).toBeTruthy();
    expect(common.delete).toBeTruthy();
    expect(common.edit).toBeTruthy();
    expect(common.create).toBeTruthy();
    expect(common.update).toBeTruthy();
    expect(common.search).toBeTruthy();
    expect(common.loading).toBeTruthy();
    expect(common.active).toBeTruthy();
    expect(common.inactive).toBeTruthy();
  });
});
