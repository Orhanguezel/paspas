import { describe, expect, it } from 'bun:test';
import { activityCreateSchema, activityListSchema, automationEmitSchema, automationRuleCreateSchema, communicationCreateSchema, dealCreateSchema, dealMoveSchema, dealPatchSchema, dealProductSchema, dealToOfferSchema, lossReasonCreateSchema, reminderCreateSchema, reminderListSchema, talepToDealSchema } from '../validation';

describe('CRM validation', () => {
  it('fırsat varsayılanlarını güvenli üretir', () => {
    const parsed = dealCreateSchema.parse({ title: 'OEM paspas fırsatı' });
    expect(parsed.amount).toBe(0);
    expect(parsed.currency).toBe('TRY');
  });

  it('olasılığı 0-100 aralığında sınırlar', () => {
    expect(dealCreateSchema.safeParse({ title: 'X', probability: 101 }).success).toBe(false);
  });

  it('talep dönüşümünde müşteri seçimini zorunlu tutar', () => {
    expect(talepToDealSchema.safeParse({}).success).toBe(false);
    expect(talepToDealSchema.safeParse({ yeniMusteri: { ad: 'Aday Firma' } }).success).toBe(true);
  });

  it('aşama taşıma için UUID ister', () => {
    expect(dealMoveSchema.safeParse({ stageId: 'x' }).success).toBe(false);
    expect(dealMoveSchema.safeParse({ stageId:crypto.randomUUID(),lostReasonId:'serbest-metin' }).success).toBe(false);
  });

  it('terminal durum generic güncellemeyle atlanamaz',()=>{
    expect(dealPatchSchema.safeParse({status:'lost',lostReason:'serbest'}).success).toBe(false);
  });

  it('kaybetme nedeni kodunu raporlanabilir biçimde sınırlar',()=>{
    expect(lossReasonCreateSchema.safeParse({code:'rakip_firma',name:'Rakip firma'}).success).toBe(true);
    expect(lossReasonCreateSchema.safeParse({code:'Rakip Firma',name:'Rakip firma'}).success).toBe(false);
  });

  it('fırsat ürününde pozitif miktar ve ürün UUID ister', () => {
    expect(dealProductSchema.safeParse({ urunId: crypto.randomUUID(), miktar: 2 }).success).toBe(true);
    expect(dealProductSchema.safeParse({ urunId: crypto.randomUUID(), miktar: 0 }).success).toBe(false);
  });

  it('taslak teklif varsayılanlarını üretir', () => {
    expect(dealToOfferSchema.parse({})).toEqual({ dil: 'tr', kdvOrani: 20 });
  });

  it('aktivite kaynağını tür ve kayıt olarak birlikte ister', () => {
    expect(activityCreateSchema.safeParse({ type:'call',subject:'Ara',refType:'firsat' }).success).toBe(false);
    expect(activityCreateSchema.safeParse({ type:'call',subject:'Ara',refType:'firsat',refId:crypto.randomUUID() }).success).toBe(true);
  });

  it('aktivite liste boolean sorgusunu dönüştürür', () => {
    expect(activityListSchema.parse({ done:'false' }).done).toBe(false);
  });

  it('hatırlatma kaynağı, zamanı ve kanalını doğrular', () => {
    const valid={sourceType:'deal',sourceId:crypto.randomUUID(),remindAt:new Date().toISOString(),title:'Takip',message:'Müşteriyi ara'};
    expect(reminderCreateSchema.parse(valid).channel).toBe('app');
    expect(reminderCreateSchema.safeParse({...valid,sourceType:'customer'}).success).toBe(false);
  });

  it('geciken hatırlatma sorgusunu dönüştürür', () => {
    expect(reminderListSchema.parse({overdue:'true'}).overdue).toBe(true);
  });

  it('iletişim kaydında CRM kaynağını zorunlu tutar', () => {
    expect(communicationCreateSchema.safeParse({channel:'phone',direction:'incoming',body:'Aradı'}).success).toBe(false);
    expect(communicationCreateSchema.safeParse({customerId:crypto.randomUUID(),channel:'phone',direction:'incoming',body:'Aradı'}).success).toBe(true);
  });

  it('otomasyon yalnız tanımlı tetikleyici ve güvenli eylemleri kabul eder',()=>{
    expect(automationRuleCreateSchema.safeParse({name:'Takip',triggerType:'deal_created',actionType:'create_task'}).success).toBe(true);
    expect(automationRuleCreateSchema.safeParse({name:'Sil',triggerType:'deal_created',actionType:'delete_record'}).success).toBe(false);
    expect(automationEmitSchema.safeParse({triggerType:'shipment_completed',entityType:'shipment',entityId:crypto.randomUUID()}).success).toBe(true);
  });
});
