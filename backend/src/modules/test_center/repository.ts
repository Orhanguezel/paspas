import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';

import {
  testCenterAiTemplates,
  testCenterCases,
  testCenterRuns,
  type TestCenterAiTemplateRow,
  type TestCenterCaseRow,
  type TestCenterRunRow,
} from './schema';
import type {
  CreateAiTemplateBody,
  CreateCaseBody,
  CreateRunBody,
  ListAiTemplatesQuery,
  ListCasesQuery,
  ListRunsQuery,
  UpdateAiTemplateBody,
  UpdateCaseBody,
} from './validation';

function casesWhere(query: ListCasesQuery): SQL | undefined {
  const conditions: SQL[] = [];
  if (query.activeOnly) conditions.push(eq(testCenterCases.is_active, 1));
  if (query.kategori) conditions.push(eq(testCenterCases.kategori, query.kategori));
  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(or(
      like(testCenterCases.kod, pattern),
      like(testCenterCases.baslik, pattern),
      like(testCenterCases.risk_notu, pattern),
    ) as SQL);
  }
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

function runsWhere(query: ListRunsQuery): SQL | undefined {
  const conditions: SQL[] = [];
  if (query.caseId) conditions.push(eq(testCenterRuns.case_id, query.caseId));
  if (query.status) conditions.push(eq(testCenterRuns.status, query.status));
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

export async function repoListCases(query: ListCasesQuery): Promise<TestCenterCaseRow[]> {
  return db
    .select()
    .from(testCenterCases)
    .where(casesWhere(query))
    .orderBy(asc(testCenterCases.sira), asc(testCenterCases.kategori), asc(testCenterCases.baslik));
}

export async function repoCreateCase(body: CreateCaseBody): Promise<TestCenterCaseRow> {
  const id = randomUUID();
  await db.insert(testCenterCases).values({
    id,
    kod: body.kod,
    baslik: body.baslik,
    kategori: body.kategori,
    kapsam: body.kapsam,
    komut: body.komut ?? null,
    dosya_yolu: body.dosyaYolu ?? null,
    durum: body.durum,
    risk_notu: body.riskNotu ?? null,
    sira: body.sira,
    is_active: body.isActive ? 1 : 0,
  });
  const rows = await db.select().from(testCenterCases).where(eq(testCenterCases.id, id)).limit(1);
  return rows[0]!;
}

export async function repoUpdateCase(id: string, body: UpdateCaseBody): Promise<TestCenterCaseRow | null> {
  const values: Partial<typeof testCenterCases.$inferInsert> = {};
  if (body.kod !== undefined) values.kod = body.kod;
  if (body.baslik !== undefined) values.baslik = body.baslik;
  if (body.kategori !== undefined) values.kategori = body.kategori;
  if (body.kapsam !== undefined) values.kapsam = body.kapsam;
  if (body.komut !== undefined) values.komut = body.komut || null;
  if (body.dosyaYolu !== undefined) values.dosya_yolu = body.dosyaYolu || null;
  if (body.durum !== undefined) values.durum = body.durum;
  if (body.riskNotu !== undefined) values.risk_notu = body.riskNotu || null;
  if (body.sira !== undefined) values.sira = body.sira;
  if (body.isActive !== undefined) values.is_active = body.isActive ? 1 : 0;
  values.updated_at = sql`CURRENT_TIMESTAMP` as any;

  await db.update(testCenterCases).set(values).where(eq(testCenterCases.id, id));
  const rows = await db.select().from(testCenterCases).where(eq(testCenterCases.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function repoListRuns(query: ListRunsQuery): Promise<{ items: TestCenterRunRow[]; total: number }> {
  const where = runsWhere(query);
  const [items, counts] = await Promise.all([
    db
      .select()
      .from(testCenterRuns)
      .where(where)
      .orderBy(desc(testCenterRuns.created_at))
      .limit(query.limit)
      .offset(query.offset),
    db.select({ count: sql<number>`count(*)` }).from(testCenterRuns).where(where),
  ]);
  return { items, total: Number(counts[0]?.count ?? 0) };
}

// =============================================================
// AI Şablonları
// =============================================================

export async function repoListAiTemplates(query: ListAiTemplatesQuery): Promise<TestCenterAiTemplateRow[]> {
  const conds: SQL[] = [];
  if (query.activeOnly) conds.push(eq(testCenterAiTemplates.is_active, 1));
  if (query.kategori) conds.push(eq(testCenterAiTemplates.kategori, query.kategori));
  const where = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds);
  return db
    .select()
    .from(testCenterAiTemplates)
    .where(where)
    .orderBy(desc(testCenterAiTemplates.is_default), asc(testCenterAiTemplates.kategori), asc(testCenterAiTemplates.kod));
}

export async function repoGetAiTemplateById(id: string): Promise<TestCenterAiTemplateRow | null> {
  const rows = await db
    .select()
    .from(testCenterAiTemplates)
    .where(eq(testCenterAiTemplates.id, id))
    .limit(1);
  return rows[0] ?? null;
}

async function clearOtherDefaults(kategori: string, exceptId: string): Promise<void> {
  await db
    .update(testCenterAiTemplates)
    .set({ is_default: 0 })
    .where(and(eq(testCenterAiTemplates.kategori, kategori), sql`${testCenterAiTemplates.id} <> ${exceptId}`));
}

export async function repoCreateAiTemplate(body: CreateAiTemplateBody): Promise<TestCenterAiTemplateRow> {
  const id = randomUUID();
  await db.insert(testCenterAiTemplates).values({
    id,
    kod: body.kod,
    ad: body.ad,
    aciklama: body.aciklama ?? null,
    system_prompt: body.systemPrompt,
    user_template: body.userTemplate,
    kategori: body.kategori,
    provider: body.provider,
    model: body.model ?? null,
    temperature: body.temperature == null ? null : body.temperature.toFixed(2),
    max_tokens: body.maxTokens ?? null,
    is_default: body.isDefault ? 1 : 0,
    is_active: body.isActive ? 1 : 0,
  });
  if (body.isDefault) await clearOtherDefaults(body.kategori, id);
  const row = await repoGetAiTemplateById(id);
  if (!row) throw new Error('ai_template_olusturulamadi');
  return row;
}

export async function repoUpdateAiTemplate(id: string, body: UpdateAiTemplateBody): Promise<TestCenterAiTemplateRow | null> {
  const existing = await repoGetAiTemplateById(id);
  if (!existing) return null;
  const patch: Partial<TestCenterAiTemplateRow> = {};
  if (body.kod !== undefined) patch.kod = body.kod;
  if (body.ad !== undefined) patch.ad = body.ad;
  if (body.aciklama !== undefined) patch.aciklama = body.aciklama ?? null;
  if (body.systemPrompt !== undefined) patch.system_prompt = body.systemPrompt;
  if (body.userTemplate !== undefined) patch.user_template = body.userTemplate;
  if (body.kategori !== undefined) patch.kategori = body.kategori;
  if (body.provider !== undefined) patch.provider = body.provider;
  if (body.model !== undefined) patch.model = body.model ?? null;
  if (body.temperature !== undefined) {
    patch.temperature = body.temperature == null ? null : (body.temperature.toFixed(2) as unknown as TestCenterAiTemplateRow['temperature']);
  }
  if (body.maxTokens !== undefined) patch.max_tokens = body.maxTokens ?? null;
  if (body.isDefault !== undefined) patch.is_default = body.isDefault ? 1 : 0;
  if (body.isActive !== undefined) patch.is_active = body.isActive ? 1 : 0;
  if (Object.keys(patch).length > 0) {
    await db.update(testCenterAiTemplates).set(patch).where(eq(testCenterAiTemplates.id, id));
  }
  if (body.isDefault) {
    await clearOtherDefaults(body.kategori ?? existing.kategori, id);
  }
  return repoGetAiTemplateById(id);
}

export async function repoDeleteAiTemplate(id: string): Promise<boolean> {
  const existing = await repoGetAiTemplateById(id);
  if (!existing) return false;
  await db.delete(testCenterAiTemplates).where(eq(testCenterAiTemplates.id, id));
  return true;
}

// =============================================================

export async function repoCreateRun(body: CreateRunBody, createdByUserId: string | null): Promise<TestCenterRunRow> {
  const id = randomUUID();
  await db.insert(testCenterRuns).values({
    id,
    case_id: body.caseId ?? null,
    baslik: body.baslik,
    komut: body.komut ?? null,
    status: body.status,
    pass_count: body.passCount ?? null,
    fail_count: body.failCount ?? null,
    skip_count: body.skipCount ?? null,
    expect_count: body.expectCount ?? null,
    output_excerpt: body.outputExcerpt ?? null,
    risk_notu: body.riskNotu ?? null,
    snapshot_id: body.snapshotId ?? null,
    started_at: body.startedAt ?? null,
    finished_at: body.finishedAt ?? null,
    created_by_user_id: createdByUserId,
  });
  const rows = await db.select().from(testCenterRuns).where(eq(testCenterRuns.id, id)).limit(1);
  return rows[0]!;
}
