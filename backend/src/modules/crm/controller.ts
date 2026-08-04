import type { FastifyReply, FastifyRequest, RouteHandler } from 'fastify';
import { createDeal, deleteDeal, getDeal, listDeals, listPipelines, moveDeal, updateDeal, convertTalepToDeal } from './repository';
import { dealCreateSchema, dealListSchema, dealMoveSchema, dealPatchSchema, talepToDealSchema } from './validation';

function userId(req: FastifyRequest) { return ((req as { user?: { sub?: string } }).user?.sub) ?? null; }
function error(reply: FastifyReply, err: unknown) {
  const message = err instanceof Error ? err.message : 'sunucu_hatasi';
  const status: Record<string, number> = { talep_bulunamadi:404, asama_bulunamadi:404, musteri_gerekli:400, asama_pipeline_uyumsuz:400, kaybetme_nedeni_gerekli:400, varsayilan_pipeline_bulunamadi:409, talep_zaten_firsata_donustu:409 };
  return reply.code(status[message] ?? 500).send({ error: { message } });
}
export const pipelines: RouteHandler = async (_req, reply) => reply.send(await listPipelines());
export const deals: RouteHandler = async (req, reply) => { const p=dealListSchema.safeParse(req.query); if(!p.success)return reply.code(400).send({error:{message:'gecersiz_sorgu_parametreleri',issues:p.error.flatten()}}); const r=await listDeals(p.data); reply.header('x-total-count',String(r.total)); return r.items; };
export const dealGet: RouteHandler = async (req, reply) => { const r=await getDeal((req.params as {id:string}).id); return r?reply.send(r):reply.code(404).send({error:{message:'firsat_bulunamadi'}}); };
export const dealCreate: RouteHandler = async (req, reply) => { const p=dealCreateSchema.safeParse(req.body); if(!p.success)return reply.code(400).send({error:{message:'gecersiz_istek_govdesi',issues:p.error.flatten()}}); try{return reply.code(201).send(await createDeal(p.data,userId(req)));}catch(e){return error(reply,e);} };
export const dealUpdate: RouteHandler = async (req, reply) => { const p=dealPatchSchema.safeParse(req.body); if(!p.success)return reply.code(400).send({error:{message:'gecersiz_istek_govdesi',issues:p.error.flatten()}}); try{const r=await updateDeal((req.params as {id:string}).id,p.data);return r?reply.send(r):reply.code(404).send({error:{message:'firsat_bulunamadi'}});}catch(e){return error(reply,e);} };
export const dealMove: RouteHandler = async (req, reply) => { const p=dealMoveSchema.safeParse(req.body); if(!p.success)return reply.code(400).send({error:{message:'gecersiz_istek_govdesi',issues:p.error.flatten()}}); try{const r=await moveDeal((req.params as {id:string}).id,p.data.stageId,p.data.lostReason);return r?reply.send(r):reply.code(404).send({error:{message:'firsat_bulunamadi'}});}catch(e){return error(reply,e);} };
export const dealDelete: RouteHandler = async (req, reply) => (await deleteDeal((req.params as {id:string}).id))?reply.code(204).send():reply.code(404).send({error:{message:'firsat_bulunamadi'}});
export const talepConvert: RouteHandler = async (req, reply) => { const p=talepToDealSchema.safeParse(req.body); if(!p.success)return reply.code(400).send({error:{message:'gecersiz_istek_govdesi',issues:p.error.flatten()}}); try{return reply.code(201).send(await convertTalepToDeal((req.params as {id:string}).id,p.data,userId(req)));}catch(e){return error(reply,e);} };

