import { z } from 'zod';

const status = z.enum(['open', 'won', 'lost', 'on_hold', 'cancelled']);
const currency = z.enum(['TRY', 'USD', 'EUR', 'GBP']);

export const dealListSchema = z.object({
  q: z.string().trim().optional(), pipelineId: z.string().uuid().optional(), stageId: z.string().uuid().optional(),
  musteriId: z.string().uuid().optional(), ownerUserId: z.string().uuid().optional(), status: status.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100), offset: z.coerce.number().int().min(0).default(0),
});
export const dealCreateSchema = z.object({
  pipelineId: z.string().uuid().optional(), stageId: z.string().uuid().optional(), musteriId: z.string().uuid().optional().nullable(),
  talepId: z.string().uuid().optional().nullable(), title: z.string().trim().min(1).max(255), amount: z.coerce.number().min(0).default(0),
  currency: currency.default('TRY'), probability: z.coerce.number().int().min(0).max(100).optional().nullable(),
  expectedCloseDate: z.string().date().optional().nullable(), ownerUserId: z.string().uuid().optional().nullable(), source: z.string().max(64).optional().nullable(),
});
export const dealPatchSchema = dealCreateSchema.omit({ pipelineId: true, stageId: true, talepId: true }).partial()
  .refine((v) => Object.keys(v).length > 0, 'En az bir alan gerekli');
export const dealMoveSchema = z.object({ stageId: z.string().uuid(), lostReasonId: z.string().uuid().optional() });
export const lossReasonCreateSchema=z.object({code:z.string().trim().regex(/^[a-z0-9_]+$/).max(64),name:z.string().trim().min(1).max(160),sort:z.coerce.number().int().min(0).default(0),isActive:z.boolean().default(true)});
export const lossReasonPatchSchema=lossReasonCreateSchema.partial().refine(v=>Object.keys(v).length>0,'En az bir alan gerekli');
export const talepToDealSchema = z.object({
  musteriId: z.string().uuid().optional(),
  yeniMusteri: z.object({ ad: z.string().trim().min(1).max(255), telefon: z.string().max(32).optional(), email: z.string().email().max(255).optional(), adres: z.string().max(500).optional() }).optional(),
  title: z.string().trim().min(1).max(255).optional(), ownerUserId: z.string().uuid().optional(), amount: z.coerce.number().min(0).default(0), currency: currency.default('TRY'),
}).refine((v) => Boolean(v.musteriId || v.yeniMusteri), 'Mevcut veya yeni müşteri gerekli');

export const dealProductSchema = z.object({
  urunId: z.string().uuid(), miktar: z.coerce.number().positive(), birimFiyat: z.coerce.number().min(0).optional().nullable(),
  paraBirimi: currency.default('TRY'), aciklama: z.string().trim().max(500).optional().nullable(), sira: z.coerce.number().int().min(0).default(0),
});
export const dealProductPatchSchema = dealProductSchema.partial().refine((v) => Object.keys(v).length > 0, 'En az bir alan gerekli');
export const dealNeedSchema = z.object({ ihtiyacNotu: z.string().trim().max(5000).optional().nullable(), teslimBeklentisi: z.string().date().optional().nullable() });
export const dealToOfferSchema = z.object({ dil: z.enum(['tr','en','de']).default('tr'), kdvOrani: z.coerce.number().min(0).max(100).default(20) });

const activityType = z.enum(['call','meeting','email','whatsapp','note','task']);
const activityRef = z.enum(['musteri','talep','firsat','teklif','siparis']);
export const activityListSchema = z.object({
  refType: activityRef.optional(), refId: z.string().uuid().optional(), type: activityType.optional(), done: z.preprocess((v)=>v==='true'||v==='1'?true:v==='false'||v==='0'?false:v,z.boolean()).optional(),
  ownerUserId: z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(500).default(100),offset:z.coerce.number().int().min(0).default(0),
}).refine((v)=>!v.refId||Boolean(v.refType),'refId için refType gerekli');
const activityBaseSchema = z.object({
  refType:activityRef.optional().nullable(),refId:z.string().uuid().optional().nullable(),type:activityType,subject:z.string().trim().min(1).max(255),body:z.string().max(5000).optional().nullable(),
  result:z.string().max(500).optional().nullable(),nextActionAt:z.string().datetime().optional().nullable(),durationMinutes:z.coerce.number().int().min(0).optional().nullable(),plannedStartAt:z.string().datetime().optional().nullable(),dueAt:z.string().datetime().optional().nullable(),ownerUserId:z.string().uuid().optional().nullable(),
});
export const activityCreateSchema=activityBaseSchema.refine((v)=>Boolean(v.refType)===Boolean(v.refId),'Kaynak türü ve kaydı birlikte gerekli');
export const activityPatchSchema=activityBaseSchema.partial().extend({done:z.boolean().optional()}).refine((v)=>Object.keys(v).length>0,'En az bir alan gerekli');
export const reminderCreateSchema=z.object({sourceType:z.enum(['activity','deal','offer','order']),sourceId:z.string().uuid(),remindAt:z.string().datetime(),channel:z.enum(['app','email']).default('app'),title:z.string().trim().min(1).max(255),message:z.string().trim().min(1).max(1000)});
export const reminderListSchema=z.object({status:z.enum(['pending','processing','sent','failed','cancelled']).optional(),overdue:z.preprocess((v)=>v==='true'||v==='1'?true:v==='false'||v==='0'?false:v,z.boolean()).optional(),limit:z.coerce.number().int().min(1).max(500).default(100),offset:z.coerce.number().int().min(0).default(0)});
const communicationChannel=z.enum(['email','whatsapp','phone','manual']);
export const communicationCreateSchema=z.object({customerId:z.string().uuid().optional().nullable(),dealId:z.string().uuid().optional().nullable(),offerId:z.string().uuid().optional().nullable(),channel:communicationChannel,direction:z.enum(['incoming','outgoing']),subject:z.string().trim().max(255).optional().nullable(),body:z.string().max(10000).optional().nullable(),recipient:z.string().max(255).optional().nullable(),occurredAt:z.string().datetime().optional().nullable()}).refine(v=>Boolean(v.customerId||v.dealId||v.offerId),'En az bir CRM kaynağı gerekli');
export const communicationListSchema=z.object({customerId:z.string().uuid().optional(),dealId:z.string().uuid().optional(),offerId:z.string().uuid().optional(),channel:communicationChannel.optional(),limit:z.coerce.number().int().min(1).max(500).default(100),offset:z.coerce.number().int().min(0).default(0)});
export const automationRuleCreateSchema=z.object({name:z.string().trim().min(1).max(160),triggerType:z.enum(['lead_created','deal_created','stage_changed','offer_sent','offer_accepted','followup_overdue','order_created','shipment_completed']),actionType:z.enum(['create_task','notify','assign_owner']),config:z.record(z.string(),z.unknown()).default({}),isActive:z.boolean().default(true),sort:z.coerce.number().int().min(0).default(0)});
export const automationEmitSchema=z.object({triggerType:z.enum(['lead_created','deal_created','stage_changed','offer_sent','offer_accepted','followup_overdue','order_created','shipment_completed']),entityType:z.enum(['lead','deal','offer','order','shipment']),entityId:z.string().uuid(),eventKey:z.string().trim().min(1).max(190).optional(),payload:z.record(z.string(),z.unknown()).default({})});
export const dashboardQuerySchema=z.object({ownerUserId:z.string().uuid().optional(),pipelineId:z.string().uuid().optional(),dateFrom:z.string().date().optional(),dateTo:z.string().date().optional()}).refine(v=>!v.dateFrom||!v.dateTo||v.dateFrom<=v.dateTo,'Başlangıç tarihi bitişten sonra olamaz');
export const reportQuerySchema=dashboardQuerySchema.and(z.object({source:z.string().trim().max(64).optional()}));
const savedFilters=z.record(z.string(),z.unknown()).refine(v=>JSON.stringify(v).length<=10000,'Filtre çok büyük');
export const savedViewCreateSchema=z.object({viewType:z.enum(['deals','activities']),name:z.string().trim().min(1).max(160),filters:savedFilters.default({}),isDefault:z.boolean().default(false)});
export const savedViewPatchSchema=z.object({name:z.string().trim().min(1).max(160).optional(),filters:savedFilters.optional(),isDefault:z.boolean().optional()}).refine(v=>Object.keys(v).length>0,'En az bir alan gerekli');
export const savedViewListSchema=z.object({viewType:z.enum(['deals','activities']).optional()});

export type DealList = z.infer<typeof dealListSchema>;
export type DealCreate = z.infer<typeof dealCreateSchema>;
export type DealPatch = z.infer<typeof dealPatchSchema>;
export type TalepToDeal = z.infer<typeof talepToDealSchema>;
