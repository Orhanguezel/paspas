import { z } from 'zod';

const entityIdSchema = z.string().trim().min(1).max(128);
const statusEnum = z.enum(['passed', 'failed', 'expected_failing', 'skipped', 'not_run']);

export const listCasesQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  kategori: z.string().trim().min(1).optional(),
  activeOnly: z.coerce.boolean().optional().default(true),
});

export const createCaseSchema = z.object({
  kod: z.string().trim().min(1).max(128),
  baslik: z.string().trim().min(1).max(255),
  kategori: z.string().trim().min(1).max(64),
  kapsam: z.string().trim().min(1).max(32).default('backend'),
  komut: z.string().trim().max(1000).optional(),
  dosyaYolu: z.string().trim().max(1000).optional(),
  durum: z.enum(['active', 'expected_failing', 'todo']).default('active'),
  riskNotu: z.string().trim().max(1000).optional(),
  sira: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateCaseSchema = createCaseSchema.partial();

export const listRunsQuerySchema = z.object({
  caseId: entityIdSchema.optional(),
  status: statusEnum.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const createRunSchema = z.object({
  caseId: entityIdSchema.optional(),
  baslik: z.string().trim().min(1).max(255),
  komut: z.string().trim().max(1000).optional(),
  status: statusEnum,
  passCount: z.coerce.number().int().min(0).optional(),
  failCount: z.coerce.number().int().min(0).optional(),
  skipCount: z.coerce.number().int().min(0).optional(),
  expectCount: z.coerce.number().int().min(0).optional(),
  outputExcerpt: z.string().trim().max(10000).optional(),
  riskNotu: z.string().trim().max(1000).optional(),
  snapshotId: z.string().trim().max(128).optional(),
  startedAt: z.coerce.date().optional(),
  finishedAt: z.coerce.date().optional(),
});

export const runAllSchema = z.object({
  snapshotId: z.string().trim().max(128).optional(),
  includeDbIntegration: z.boolean().optional().default(true),
});

// =============================================================
// AI Şablonları + Analiz
// =============================================================

const aiProviderEnum = z.enum(['anthropic', 'openai', 'groq']);

export const listAiTemplatesQuerySchema = z.object({
  kategori: z.string().trim().min(1).max(64).optional(),
  activeOnly: z.coerce.boolean().optional().default(true),
});

export const createAiTemplateSchema = z.object({
  kod: z.string().trim().min(1).max(128),
  ad: z.string().trim().min(1).max(255),
  aciklama: z.string().trim().max(1000).optional(),
  systemPrompt: z.string().trim().min(1).max(20000),
  userTemplate: z.string().trim().min(1).max(20000),
  kategori: z.string().trim().min(1).max(64).default('test_run_analysis'),
  provider: aiProviderEnum.default('anthropic'),
  model: z.string().trim().max(128).optional(),
  temperature: z.coerce.number().min(0).max(2).optional(),
  maxTokens: z.coerce.number().int().min(1).max(32000).optional(),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateAiTemplateSchema = createAiTemplateSchema.partial();

export const triggerAnalysisSchema = z.object({
  templateId: z.string().trim().min(1).max(64).optional(),
  provider: aiProviderEnum.optional(),
  model: z.string().trim().max(128).optional(),
  temperature: z.coerce.number().min(0).max(2).optional(),
  maxTokens: z.coerce.number().int().min(1).max(32000).optional(),
});

export type ListCasesQuery = z.infer<typeof listCasesQuerySchema>;
export type CreateCaseBody = z.infer<typeof createCaseSchema>;
export type UpdateCaseBody = z.infer<typeof updateCaseSchema>;
export type ListRunsQuery = z.infer<typeof listRunsQuerySchema>;
export type CreateRunBody = z.infer<typeof createRunSchema>;
export type RunAllBody = z.infer<typeof runAllSchema>;
export type ListAiTemplatesQuery = z.infer<typeof listAiTemplatesQuerySchema>;
export type CreateAiTemplateBody = z.infer<typeof createAiTemplateSchema>;
export type UpdateAiTemplateBody = z.infer<typeof updateAiTemplateSchema>;
export type TriggerAnalysisBody = z.infer<typeof triggerAnalysisSchema>;
