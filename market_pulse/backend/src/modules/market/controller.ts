import { randomUUID } from 'node:crypto';
import type { RouteHandler } from 'fastify';
import { db } from '@/db/client';
import { eq, like, and, asc, desc, sql, or } from 'drizzle-orm';
import {
  marketTargets, marketLeads, marketSignals,
  targetToDto, leadToDto, signalToDto,
} from './schema';
import {
  targetListQuerySchema, targetCreateSchema, targetPatchSchema,
  leadListQuerySchema, leadCreateSchema, leadPatchSchema,
  signalListQuerySchema, signalCreateSchema,
  paspasExternalListQuerySchema,
  bulkImportSchema, paspasSyncSchema,
} from './validation';
import {
  getCustomerOrders,
  getPaspasCustomers,
  getPaspasProducts,
} from './external/paspas.repository';
import { recalculateChurnScore } from './churn.service';
import { scanAndCreateSignals } from './competitor.signal';
import { generateWeeklyReport, sendWeeklyReportEmail } from './report.service';
import { syncPaspasCustomersToTargets, type PaspasSyncMode } from './external/paspas.sync';

// ─── Targets ────────────────────────────────────────────────────────────────

export const listTargets: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = targetListQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });

  const q = parsed.data;
  const conditions = [];
  if (q.q)        conditions.push(or(like(marketTargets.name, `%${q.q}%`), like(marketTargets.city, `%${q.q}%`)));
  if (q.category) conditions.push(eq(marketTargets.category, q.category));
  if (q.status)   conditions.push(eq(marketTargets.status, q.status));

  const where = conditions.length ? and(...conditions) : undefined;
  const orderCol = q.sort === 'name' ? marketTargets.name
    : q.sort === 'churn_risk_score' ? marketTargets.churn_risk_score
    : marketTargets.created_at;
  const orderDir = q.order === 'asc' ? asc(orderCol) : desc(orderCol);

  const [rows, countResult] = await Promise.all([
    db.select().from(marketTargets).where(where).orderBy(orderDir).limit(q.limit).offset(q.offset),
    db.select({ count: sql<number>`count(*)` }).from(marketTargets).where(where),
  ]);
  reply.header('x-total-count', String(Number(countResult[0]?.count ?? 0)));
  return rows.map(targetToDto);
};

export const getTarget: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const rows = await db.select().from(marketTargets).where(eq(marketTargets.id, req.params.id)).limit(1);
  if (!rows[0]) return reply.code(404).send({ error: { message: 'not_found' } });
  return targetToDto(rows[0]);
};

export const createTarget: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = targetCreateSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  const id = randomUUID();
  await db.insert(marketTargets).values({ id, ...parsed.data });
  const rows = await db.select().from(marketTargets).where(eq(marketTargets.id, id)).limit(1);
  return reply.code(201).send(targetToDto(rows[0]!));
};

export const updateTarget: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const parsed = targetPatchSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  await db.update(marketTargets).set(parsed.data).where(eq(marketTargets.id, req.params.id));
  const rows = await db.select().from(marketTargets).where(eq(marketTargets.id, req.params.id)).limit(1);
  if (!rows[0]) return reply.code(404).send({ error: { message: 'not_found' } });
  return targetToDto(rows[0]);
};

export const deleteTarget: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await db.delete(marketTargets).where(eq(marketTargets.id, req.params.id));
  return reply.code(204).send();
};

// ─── Leads ──────────────────────────────────────────────────────────────────

export const listLeads: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = leadListQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });

  const q = parsed.data;
  const conditions = [];
  if (q.q)        conditions.push(or(like(marketLeads.name, `%${q.q}%`), like(marketLeads.city, `%${q.q}%`), like(marketLeads.contact_name, `%${q.q}%`)));
  if (q.status)   conditions.push(eq(marketLeads.status, q.status));
  if (q.priority) conditions.push(eq(marketLeads.priority, q.priority));
  if (q.source)   conditions.push(eq(marketLeads.source, q.source));

  const where = conditions.length ? and(...conditions) : undefined;
  const orderCol = q.sort === 'name' ? marketLeads.name
    : q.sort === 'score' ? marketLeads.score
    : q.sort === 'priority' ? marketLeads.priority
    : marketLeads.created_at;
  const orderDir = q.order === 'asc' ? asc(orderCol) : desc(orderCol);

  const [rows, countResult] = await Promise.all([
    db.select().from(marketLeads).where(where).orderBy(orderDir).limit(q.limit).offset(q.offset),
    db.select({ count: sql<number>`count(*)` }).from(marketLeads).where(where),
  ]);
  reply.header('x-total-count', String(Number(countResult[0]?.count ?? 0)));
  return rows.map(leadToDto);
};

export const getLead: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const rows = await db.select().from(marketLeads).where(eq(marketLeads.id, req.params.id)).limit(1);
  if (!rows[0]) return reply.code(404).send({ error: { message: 'not_found' } });
  return leadToDto(rows[0]);
};

export const createLead: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = leadCreateSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  const id = randomUUID();
  await db.insert(marketLeads).values({ id, ...parsed.data });
  const rows = await db.select().from(marketLeads).where(eq(marketLeads.id, id)).limit(1);
  return reply.code(201).send(leadToDto(rows[0]!));
};

export const updateLead: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const parsed = leadPatchSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  await db.update(marketLeads).set(parsed.data).where(eq(marketLeads.id, req.params.id));
  const rows = await db.select().from(marketLeads).where(eq(marketLeads.id, req.params.id)).limit(1);
  if (!rows[0]) return reply.code(404).send({ error: { message: 'not_found' } });
  return leadToDto(rows[0]);
};

export const deleteLead: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await db.delete(marketLeads).where(eq(marketLeads.id, req.params.id));
  return reply.code(204).send();
};

// ─── Signals ─────────────────────────────────────────────────────────────────

export const listSignals: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = signalListQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });

  const q = parsed.data;
  const conditions = [];
  if (q.target_id !== undefined)   conditions.push(eq(marketSignals.target_id, q.target_id));
  if (q.lead_id !== undefined)     conditions.push(eq(marketSignals.lead_id, q.lead_id));
  if (q.severity)                  conditions.push(eq(marketSignals.severity, q.severity));
  if (q.is_reviewed !== undefined) conditions.push(eq(marketSignals.is_reviewed, q.is_reviewed ? 1 : 0));

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.select().from(marketSignals).where(where).orderBy(desc(marketSignals.created_at)).limit(q.limit).offset(q.offset),
    db.select({ count: sql<number>`count(*)` }).from(marketSignals).where(where),
  ]);
  reply.header('x-total-count', String(Number(countResult[0]?.count ?? 0)));
  return rows.map(signalToDto);
};

export const createSignal: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = signalCreateSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  const id = randomUUID();
  await db.insert(marketSignals).values({ id, ...parsed.data });
  const rows = await db.select().from(marketSignals).where(eq(marketSignals.id, id)).limit(1);
  return reply.code(201).send(signalToDto(rows[0]!));
};

export const reviewSignal: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await db.update(marketSignals)
    .set({ is_reviewed: 1, reviewed_at: new Date() })
    .where(eq(marketSignals.id, req.params.id));
  const rows = await db.select().from(marketSignals).where(eq(marketSignals.id, req.params.id)).limit(1);
  if (!rows[0]) return reply.code(404).send({ error: { message: 'not_found' } });
  return signalToDto(rows[0]);
};

export const deleteSignal: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await db.delete(marketSignals).where(eq(marketSignals.id, req.params.id));
  return reply.code(204).send();
};

// ─── Stats ───────────────────────────────────────────────────────────────────

export const getMarketStats: RouteHandler = async (_req, _reply) => {
  const [targets, leads, signals] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(marketTargets),
    db.select({ count: sql<number>`count(*)` }).from(marketLeads),
    db.select({ count: sql<number>`count(*)` }).from(marketSignals).where(eq(marketSignals.is_reviewed, 0)),
  ]);

  return {
    totalTargets:     Number(targets[0]?.count ?? 0),
    totalLeads:       Number(leads[0]?.count ?? 0),
    pendingSignals:   Number(signals[0]?.count ?? 0),
  };
};

// ─── External: Paspas ERP ───────────────────────────────────────────────────

export const listPaspasCustomers: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = paspasExternalListQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });

  try {
    return await getPaspasCustomers(parsed.data.q, parsed.data.limit);
  } catch (e) {
    if (e instanceof Error && 'statusCode' in e) {
      return reply.code(Number((e as { statusCode: number }).statusCode)).send({ error: { message: e.message } });
    }
    throw e;
  }
};

export const listPaspasProducts: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = paspasExternalListQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });

  try {
    return await getPaspasProducts(parsed.data.q, parsed.data.limit);
  } catch (e) {
    if (e instanceof Error && 'statusCode' in e) {
      return reply.code(Number((e as { statusCode: number }).statusCode)).send({ error: { message: e.message } });
    }
    throw e;
  }
};

export const listPaspasCustomerOrders: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    return await getCustomerOrders(req.params.id);
  } catch (e) {
    if (e instanceof Error && 'statusCode' in e) {
      return reply.code(Number((e as { statusCode: number }).statusCode)).send({ error: { message: e.message } });
    }
    throw e;
  }
};

// ─── Churn ──────────────────────────────────────────────────────────────────

export const recalculateTargetChurn: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    const score = await recalculateChurnScore(req.params.id);
    return { id: req.params.id, churnRiskScore: score };
  } catch (e) {
    if (e instanceof Error && 'statusCode' in e) {
      return reply.code(Number((e as { statusCode: number }).statusCode)).send({ error: { message: e.message } });
    }
    throw e;
  }
};

// ─── Paspas Sync ────────────────────────────────────────────────────────────

export const syncPaspasTargets: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = paspasSyncSchema.safeParse(req.body ?? {});
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  try {
    const result = await syncPaspasCustomersToTargets(parsed.data.mode as PaspasSyncMode);
    return {
      ok:       true,
      inserted: result.inserted,
      updated:  result.updated,
      total:    result.total,
      message:  `${result.total} kayıt işlendi: ${result.inserted} eklendi, ${result.updated} güncellendi.`,
    };
  } catch (e) {
    if (e instanceof Error && 'statusCode' in e) {
      return reply.code(Number((e as { statusCode: number }).statusCode)).send({ error: { message: e.message } });
    }
    throw e;
  }
};

// ─── Bulk Import ─────────────────────────────────────────────────────────────

const CSV_HEADER = 'name,category,website,phone,email,contact_name,city,district,notes';
const CSV_EXAMPLE = 'Örnek Bayi A.Ş.,dealer,https://example.com,05321234567,info@example.com,Ahmet Yılmaz,İstanbul,Kadıköy,';

export const downloadImportTemplate: RouteHandler = async (_req, reply) => {
  const csv = `${CSV_HEADER}\n${CSV_EXAMPLE}\n`;
  return reply
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', 'attachment; filename="hedef-sablonu.csv"')
    .send(csv);
};

export const bulkImportTargets: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = bulkImportSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  const { rows, dry_run, on_conflict } = parsed.data;
  let inserted = 0;
  let updated  = 0;
  let skipped  = 0;
  const preview: Array<typeof rows[number] & { _action: 'insert' | 'update' | 'skip' }> = [];

  for (const row of rows) {
    // Duplicate detection: website öncelikli, yoksa name
    const existingRows = row.website
      ? await db.select({ id: marketTargets.id }).from(marketTargets).where(eq(marketTargets.website, row.website)).limit(1)
      : await db.select({ id: marketTargets.id }).from(marketTargets).where(eq(marketTargets.name, row.name)).limit(1);

    const existing = existingRows[0];

    if (existing) {
      if (on_conflict === 'update') {
        if (!dry_run) {
          await db.update(marketTargets).set({
            name:         row.name,
            category:     row.category ?? 'prospect',
            website:      row.website ?? null,
            phone:        row.phone ?? null,
            email:        row.email ?? null,
            contact_name: row.contact_name ?? null,
            city:         row.city ?? null,
            district:     row.district ?? null,
            notes:        row.notes ?? null,
          }).where(eq(marketTargets.id, existing.id));
        }
        preview.push({ ...row, _action: 'update' });
        updated++;
      } else {
        preview.push({ ...row, _action: 'skip' });
        skipped++;
      }
    } else {
      if (!dry_run) {
        await db.insert(marketTargets).values({
          id:           randomUUID(),
          name:         row.name,
          category:     row.category ?? 'prospect',
          status:       'active',
          website:      row.website ?? null,
          phone:        row.phone ?? null,
          email:        row.email ?? null,
          contact_name: row.contact_name ?? null,
          city:         row.city ?? null,
          district:     row.district ?? null,
          notes:        row.notes ?? null,
        });
      }
      preview.push({ ...row, _action: 'insert' });
      inserted++;
    }
  }

  return { inserted, updated, skipped, total: rows.length, dry_run, preview };
};

// ─── Competitor Scan ─────────────────────────────────────────────────────────

export const scanCompetitor: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    return await scanAndCreateSignals(req.params.id);
  } catch (e) {
    if (e instanceof Error && 'statusCode' in e) {
      return reply.code(Number((e as { statusCode: number }).statusCode)).send({ error: { message: e.message } });
    }
    throw e;
  }
};

export const scanAllCompetitors: RouteHandler = async (_req, _reply) => {
  const targets = await db
    .select({ id: marketTargets.id })
    .from(marketTargets)
    .where(and(eq(marketTargets.status, 'active'), sql`website IS NOT NULL`));

  const results = await Promise.allSettled(targets.map(t => scanAndCreateSignals(t.id)));
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed    = results.filter(r => r.status === 'rejected').length;
  const signals   = results.reduce((acc, r) =>
    r.status === 'fulfilled' ? acc + r.value.signals_created : acc, 0);

  return { scanned: targets.length, succeeded, failed, signals_created: signals };
};

// ─── Reports ────────────────────────────────────────────────────────────────

export const previewWeeklyReport: RouteHandler = async (_req, reply) => {
  const pdf = await generateWeeklyReport();
  return reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', 'inline; filename="marketpulse-weekly-report.pdf"')
    .send(pdf);
};

export const sendWeeklyReport: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const body = (req.body ?? {}) as { to?: unknown };
  const to = typeof body.to === 'string' ? body.to.trim() : '';
  if (!to || !to.includes('@')) return reply.code(400).send({ error: { message: 'valid_recipient_required' } });
  await sendWeeklyReportEmail(to);
  return { ok: true };
};
