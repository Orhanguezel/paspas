import { sql } from 'drizzle-orm';
import { char, datetime, decimal, int, json, mysqlTable, text, tinyint, varchar } from 'drizzle-orm/mysql-core';

export const testCenterCases = mysqlTable('test_center_cases', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  kod: varchar('kod', { length: 128 }).notNull(),
  baslik: varchar('baslik', { length: 255 }).notNull(),
  kategori: varchar('kategori', { length: 64 }).notNull(),
  kapsam: varchar('kapsam', { length: 32 }).notNull().default('backend'),
  komut: varchar('komut', { length: 1000 }),
  dosya_yolu: varchar('dosya_yolu', { length: 1000 }),
  durum: varchar('durum', { length: 32 }).notNull().default('active'),
  risk_notu: varchar('risk_notu', { length: 1000 }),
  sira: int('sira').notNull().default(0),
  is_active: tinyint('is_active').notNull().default(1),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const testCenterRuns = mysqlTable('test_center_runs', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  case_id: char('case_id', { length: 36 }),
  baslik: varchar('baslik', { length: 255 }).notNull(),
  komut: varchar('komut', { length: 1000 }),
  status: varchar('status', { length: 32 }).notNull(),
  pass_count: int('pass_count'),
  fail_count: int('fail_count'),
  skip_count: int('skip_count'),
  expect_count: int('expect_count'),
  output_excerpt: text('output_excerpt'),
  risk_notu: varchar('risk_notu', { length: 1000 }),
  snapshot_id: varchar('snapshot_id', { length: 128 }),
  started_at: datetime('started_at'),
  finished_at: datetime('finished_at'),
  created_by_user_id: char('created_by_user_id', { length: 36 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type TestCenterCaseRow = typeof testCenterCases.$inferSelect;
export type TestCenterRunRow = typeof testCenterRuns.$inferSelect;

export type TestCenterCaseDto = {
  id: string;
  kod: string;
  baslik: string;
  kategori: string;
  kapsam: string;
  komut: string | null;
  dosyaYolu: string | null;
  durum: string;
  riskNotu: string | null;
  sira: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type TestCenterRunDto = {
  id: string;
  caseId: string | null;
  baslik: string;
  komut: string | null;
  status: string;
  passCount: number | null;
  failCount: number | null;
  skipCount: number | null;
  expectCount: number | null;
  outputExcerpt: string | null;
  riskNotu: string | null;
  snapshotId: string | null;
  startedAt: Date | string | null;
  finishedAt: Date | string | null;
  createdByUserId: string | null;
  createdAt: Date | string;
};

export function caseRowToDto(row: TestCenterCaseRow): TestCenterCaseDto {
  return {
    id: row.id,
    kod: row.kod,
    baslik: row.baslik,
    kategori: row.kategori,
    kapsam: row.kapsam,
    komut: row.komut ?? null,
    dosyaYolu: row.dosya_yolu ?? null,
    durum: row.durum,
    riskNotu: row.risk_notu ?? null,
    sira: Number(row.sira ?? 0),
    isActive: Number(row.is_active ?? 0) === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================
// AI Analiz Altyapısı
// =============================================================

export const testCenterAiTemplates = mysqlTable('test_center_ai_templates', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  kod: varchar('kod', { length: 128 }).notNull(),
  ad: varchar('ad', { length: 255 }).notNull(),
  aciklama: varchar('aciklama', { length: 1000 }),
  system_prompt: text('system_prompt').notNull(),
  user_template: text('user_template').notNull(),
  kategori: varchar('kategori', { length: 64 }).notNull().default('test_run_analysis'),
  provider: varchar('provider', { length: 32 }).notNull().default('anthropic'),
  model: varchar('model', { length: 128 }),
  temperature: decimal('temperature', { precision: 3, scale: 2 }),
  max_tokens: int('max_tokens'),
  is_default: tinyint('is_default').notNull().default(0),
  is_active: tinyint('is_active').notNull().default(1),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const testCenterRunAnalyses = mysqlTable('test_center_run_analyses', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  run_id: char('run_id', { length: 36 }).notNull(),
  template_id: char('template_id', { length: 36 }),
  provider: varchar('provider', { length: 32 }).notNull(),
  model: varchar('model', { length: 128 }).notNull(),
  severity: varchar('severity', { length: 16 }).notNull(),
  summary: varchar('summary', { length: 2000 }).notNull(),
  suggested_actions: json('suggested_actions'),
  risks: json('risks'),
  related_files: json('related_files'),
  raw_response: text('raw_response'),
  tokens_input: int('tokens_input'),
  tokens_output: int('tokens_output'),
  latency_ms: int('latency_ms'),
  cost_usd: decimal('cost_usd', { precision: 10, scale: 6 }),
  error_msg: varchar('error_msg', { length: 1000 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type TestCenterAiTemplateRow = typeof testCenterAiTemplates.$inferSelect;
export type TestCenterRunAnalysisRow = typeof testCenterRunAnalyses.$inferSelect;

export type TestCenterAiTemplateDto = {
  id: string;
  kod: string;
  ad: string;
  aciklama: string | null;
  systemPrompt: string;
  userTemplate: string;
  kategori: string;
  provider: string;
  model: string | null;
  temperature: number | null;
  maxTokens: number | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type TestCenterRunAnalysisDto = {
  id: string;
  runId: string;
  templateId: string | null;
  provider: string;
  model: string;
  severity: 'high' | 'medium' | 'low' | string;
  summary: string;
  suggestedActions: string[];
  risks: string[];
  relatedFiles: string[];
  rawResponse: string | null;
  tokensInput: number | null;
  tokensOutput: number | null;
  latencyMs: number | null;
  costUsd: number | null;
  errorMsg: string | null;
  createdAt: Date | string;
};

export function aiTemplateRowToDto(row: TestCenterAiTemplateRow): TestCenterAiTemplateDto {
  return {
    id: row.id,
    kod: row.kod,
    ad: row.ad,
    aciklama: row.aciklama ?? null,
    systemPrompt: row.system_prompt,
    userTemplate: row.user_template,
    kategori: row.kategori,
    provider: row.provider,
    model: row.model ?? null,
    temperature: row.temperature == null ? null : Number(row.temperature),
    maxTokens: row.max_tokens == null ? null : Number(row.max_tokens),
    isDefault: Number(row.is_default ?? 0) === 1,
    isActive: Number(row.is_active ?? 0) === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function runAnalysisRowToDto(row: TestCenterRunAnalysisRow): TestCenterRunAnalysisDto {
  return {
    id: row.id,
    runId: row.run_id,
    templateId: row.template_id ?? null,
    provider: row.provider,
    model: row.model,
    severity: row.severity,
    summary: row.summary,
    suggestedActions: parseJsonArray(row.suggested_actions),
    risks: parseJsonArray(row.risks),
    relatedFiles: parseJsonArray(row.related_files),
    rawResponse: row.raw_response ?? null,
    tokensInput: row.tokens_input == null ? null : Number(row.tokens_input),
    tokensOutput: row.tokens_output == null ? null : Number(row.tokens_output),
    latencyMs: row.latency_ms == null ? null : Number(row.latency_ms),
    costUsd: row.cost_usd == null ? null : Number(row.cost_usd),
    errorMsg: row.error_msg ?? null,
    createdAt: row.created_at,
  };
}

export function runRowToDto(row: TestCenterRunRow): TestCenterRunDto {
  return {
    id: row.id,
    caseId: row.case_id ?? null,
    baslik: row.baslik,
    komut: row.komut ?? null,
    status: row.status,
    passCount: row.pass_count == null ? null : Number(row.pass_count),
    failCount: row.fail_count == null ? null : Number(row.fail_count),
    skipCount: row.skip_count == null ? null : Number(row.skip_count),
    expectCount: row.expect_count == null ? null : Number(row.expect_count),
    outputExcerpt: row.output_excerpt ?? null,
    riskNotu: row.risk_notu ?? null,
    snapshotId: row.snapshot_id ?? null,
    startedAt: row.started_at ?? null,
    finishedAt: row.finished_at ?? null,
    createdByUserId: row.created_by_user_id ?? null,
    createdAt: row.created_at,
  };
}
