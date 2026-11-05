import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { makeAdminPermissionGuard } from '@/common/middleware/permissions';
import { addCompanyContact, addCompanyResearch, getCompanyDesk, listCompanyResearch, saveCompanyProduct, saveCompanyProfile } from './company-desk.repository';
import { writeCrmAudit } from './audit';

const idSchema = z.object({ id: z.string().uuid() });
const profileSchema = z.object({ buyerType: z.string().trim().max(100).nullable().optional(), companyNote: z.string().trim().max(5000).nullable().optional() });
const contactSchema = z.object({ name: z.string().trim().min(1).max(255), title: z.string().trim().max(160).nullable().optional(), email: z.string().email().max(255).nullable().optional(), phone: z.string().trim().max(64).nullable().optional(), linkedinUrl: z.string().url().max(500).nullable().optional(), note: z.string().trim().max(5000).nullable().optional() });
const researchSchema = z.object({ finding: z.string().trim().min(1).max(10000), informationType: z.enum(['research', 'customer_statement']), sourceUrl: z.string().url().max(1000).nullable().optional(), sourceLabel: z.string().trim().max(255).nullable().optional(), observedAt: z.string().date().nullable().optional(), verificationStatus: z.enum(['unverified', 'verified', 'disputed']).default('unverified') })
  .refine(v => v.informationType === 'customer_statement' || Boolean(v.sourceUrl || v.sourceLabel), 'Araştırma kaynağı gerekli');
const productSchema = z.object({ productGroup: z.enum(['PROMATS', 'MEFATECH', 'WOGEN']), interestStatus: z.enum(['unknown', 'possible', 'confirmed', 'not_interested']), currentSupplier: z.string().trim().max(255).nullable().optional(), blocker: z.string().trim().max(500).nullable().optional(), purchaseTiming: z.string().trim().max(255).nullable().optional(), evidenceNote: z.string().trim().max(5000).nullable().optional() });

function parse<T extends z.ZodTypeAny>(schema: T, body: unknown, reply: FastifyReply): z.infer<T> | null {
  const p = schema.safeParse(body);
  if (!p.success) { reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: p.error.flatten() } }); return null; }
  return p.data;
}
function customerId(req: FastifyRequest, reply: FastifyReply) { const p = idSchema.safeParse(req.params); if (!p.success) { reply.code(400).send({error:{message:'gecersiz_firma_id'}}); return null; } return p.data.id; }
function actor(req: FastifyRequest) { return (req as {user?: {sub?: string}}).user?.sub ?? null; }
async function record(req: FastifyRequest, action: string, resource: string, result: Record<string, unknown>) {
  await writeCrmAudit({actorUserId:actor(req),action,resource,resourceId:String(result.id ?? result.customer_id),before:null,after:result}).catch(error=>req.log.warn({error},'crm_company_audit_failed'));
}
export async function registerCompanyDesk(app: FastifyInstance) {
  const guard = makeAdminPermissionGuard('admin.crm_pipeline');
  app.get('/crm/arastirmalar', { preHandler: guard }, async (req,reply) => { const p=z.object({q:z.string().trim().max(160).optional()}).safeParse(req.query); if(!p.success)return reply.code(400).send({error:{message:'gecersiz_sorgu_parametreleri'}}); return reply.send(await listCompanyResearch(p.data.q)); });
  app.get('/crm/sirketler/:id/masa', { preHandler: guard }, async (req, reply) => { const id=customerId(req,reply); if(!id)return; const data=await getCompanyDesk(id); return data?reply.send(data):reply.code(404).send({error:{message:'firma_bulunamadi'}}); });
  app.put('/crm/sirketler/:id/profil', { preHandler: guard }, async (req,reply) => { const id=customerId(req,reply),body=parse(profileSchema,req.body,reply); if(!id||!body)return; const result=await saveCompanyProfile(id,body); if(!result)return reply.code(404).send({error:{message:'firma_bulunamadi'}}); await record(req,'CRM_COMPANY_PROFILE_UPDATED','company-profile',result); return reply.send(result); });
  app.post('/crm/sirketler/:id/kisiler', { preHandler: guard }, async (req,reply) => { const id=customerId(req,reply),body=parse(contactSchema,req.body,reply); if(!id||!body)return; const result=await addCompanyContact(id,body); if(!result)return reply.code(404).send({error:{message:'firma_bulunamadi'}}); await record(req,'CRM_CONTACT_CREATED','company-contacts',result); return reply.code(201).send(result); });
  app.post('/crm/sirketler/:id/arastirmalar', { preHandler: guard }, async (req,reply) => { const id=customerId(req,reply),body=parse(researchSchema,req.body,reply); if(!id||!body)return; const result=await addCompanyResearch(id,body); if(!result)return reply.code(404).send({error:{message:'firma_bulunamadi'}}); await record(req,'CRM_RESEARCH_CREATED','company-research',result); return reply.code(201).send(result); });
  app.put('/crm/sirketler/:id/urun-ilgisi', { preHandler: guard }, async (req,reply) => { const id=customerId(req,reply),body=parse(productSchema,req.body,reply); if(!id||!body)return; const result=await saveCompanyProduct(id,body); if(!result)return reply.code(404).send({error:{message:'firma_bulunamadi'}}); await record(req,'CRM_PRODUCT_INTEREST_UPDATED','company-product-interest',result); return reply.send(result); });
}
