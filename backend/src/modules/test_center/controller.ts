import type { FastifyReply, RouteHandler } from 'fastify';

import { aiTemplateRowToDto, caseRowToDto, runRowToDto } from './schema';
import {
  repoCreateAiTemplate,
  repoCreateCase,
  repoCreateRun,
  repoDeleteAiTemplate,
  repoGetAiTemplateById,
  repoListAiTemplates,
  repoListCases,
  repoListRuns,
  repoUpdateAiTemplate,
  repoUpdateCase,
} from './repository';
import { runAllTestCenterCases } from './runner';
import {
  createAiTemplateSchema,
  createCaseSchema,
  createRunSchema,
  listAiTemplatesQuerySchema,
  listCasesQuerySchema,
  listRunsQuerySchema,
  runAllSchema,
  triggerAnalysisSchema,
  updateAiTemplateSchema,
  updateCaseSchema,
} from './validation';
import { analyzeTestRun, listRunAnalyses } from './ai_analysis_service';

function getUserId(req: unknown): string | null {
  const r = req as { user?: { sub?: string; id?: string } };
  return r.user?.sub ?? r.user?.id ?? null;
}

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

export const listTestCases: RouteHandler = async (req, reply) => {
  try {
    const parsed = listCasesQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    const rows = await repoListCases(parsed.data);
    return reply.send({ items: rows.map(caseRowToDto), total: rows.length });
  } catch (error) {
    req.log.error({ error }, 'list_test_center_cases_failed');
    return sendInternalError(reply);
  }
};

export const createTestCase: RouteHandler = async (req, reply) => {
  try {
    const parsed = createCaseSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoCreateCase(parsed.data);
    return reply.code(201).send(caseRowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'create_test_center_case_failed');
    return sendInternalError(reply);
  }
};

export const updateTestCase: RouteHandler = async (req, reply) => {
  try {
    const id = String((req.params as { id?: string }).id || '');
    if (!id) return reply.code(400).send({ error: { message: 'id_zorunlu' } });
    const parsed = updateCaseSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoUpdateCase(id, parsed.data);
    if (!row) return reply.code(404).send({ error: { message: 'test_kaydi_bulunamadi' } });
    return reply.send(caseRowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'update_test_center_case_failed');
    return sendInternalError(reply);
  }
};

export const listTestRuns: RouteHandler = async (req, reply) => {
  try {
    const parsed = listRunsQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    const { items, total } = await repoListRuns(parsed.data);
    reply.header('x-total-count', String(total));
    return reply.send({ items: items.map(runRowToDto), total });
  } catch (error) {
    req.log.error({ error }, 'list_test_center_runs_failed');
    return sendInternalError(reply);
  }
};

export const createTestRun: RouteHandler = async (req, reply) => {
  try {
    const parsed = createRunSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoCreateRun(parsed.data, getUserId(req));
    return reply.code(201).send(runRowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'create_test_center_run_failed');
    return sendInternalError(reply);
  }
};

// =============================================================
// AI Şablonları
// =============================================================

export const listAiTemplates: RouteHandler = async (req, reply) => {
  try {
    const parsed = listAiTemplatesQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    const rows = await repoListAiTemplates(parsed.data);
    return reply.send({ items: rows.map(aiTemplateRowToDto), total: rows.length });
  } catch (error) {
    req.log.error({ error }, 'list_ai_templates_failed');
    return sendInternalError(reply);
  }
};

export const getAiTemplate: RouteHandler = async (req, reply) => {
  try {
    const id = String((req.params as { id?: string }).id || '');
    const row = await repoGetAiTemplateById(id);
    if (!row) return reply.code(404).send({ error: { message: 'ai_template_bulunamadi' } });
    return reply.send(aiTemplateRowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'get_ai_template_failed');
    return sendInternalError(reply);
  }
};

export const createAiTemplate: RouteHandler = async (req, reply) => {
  try {
    const parsed = createAiTemplateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoCreateAiTemplate(parsed.data);
    return reply.code(201).send(aiTemplateRowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'create_ai_template_failed');
    return sendInternalError(reply);
  }
};

export const updateAiTemplate: RouteHandler = async (req, reply) => {
  try {
    const id = String((req.params as { id?: string }).id || '');
    if (!id) return reply.code(400).send({ error: { message: 'id_zorunlu' } });
    const parsed = updateAiTemplateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoUpdateAiTemplate(id, parsed.data);
    if (!row) return reply.code(404).send({ error: { message: 'ai_template_bulunamadi' } });
    return reply.send(aiTemplateRowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'update_ai_template_failed');
    return sendInternalError(reply);
  }
};

export const deleteAiTemplate: RouteHandler = async (req, reply) => {
  try {
    const id = String((req.params as { id?: string }).id || '');
    if (!id) return reply.code(400).send({ error: { message: 'id_zorunlu' } });
    const ok = await repoDeleteAiTemplate(id);
    if (!ok) return reply.code(404).send({ error: { message: 'ai_template_bulunamadi' } });
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_ai_template_failed');
    return sendInternalError(reply);
  }
};

// =============================================================
// AI Run Analizi
// =============================================================

export const triggerRunAnalysis: RouteHandler = async (req, reply) => {
  try {
    const runId = String((req.params as { runId?: string }).runId || '');
    if (!runId) return reply.code(400).send({ error: { message: 'run_id_zorunlu' } });
    const parsed = triggerAnalysisSchema.safeParse(req.body || {});
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const dto = await analyzeTestRun(runId, parsed.data);
    return reply.code(201).send(dto);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    req.log.error({ error }, 'trigger_run_analysis_failed');
    if (message === 'test_center_run_bulunamadi') return reply.code(404).send({ error: { message } });
    if (message.startsWith('ai_template_bulunamadi')) return reply.code(409).send({ error: { message } });
    return reply.code(500).send({ error: { message: 'ai_analiz_hatasi', detail: message.slice(0, 500) } });
  }
};

export const listRunAnalysisHistory: RouteHandler = async (req, reply) => {
  try {
    const runId = String((req.params as { runId?: string }).runId || '');
    if (!runId) return reply.code(400).send({ error: { message: 'run_id_zorunlu' } });
    const items = await listRunAnalyses(runId);
    return reply.send({ items, total: items.length });
  } catch (error) {
    req.log.error({ error }, 'list_run_analysis_history_failed');
    return sendInternalError(reply);
  }
};

// =============================================================

export const runAllTests: RouteHandler = async (req, reply) => {
  try {
    const parsed = runAllSchema.safeParse(req.body || {});
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const result = await runAllTestCenterCases({
      createdByUserId: getUserId(req),
      snapshotId: parsed.data.snapshotId ?? null,
      includeDbIntegration: parsed.data.includeDbIntegration,
    });
    return reply.send(result);
  } catch (error) {
    req.log.error({ error }, 'run_all_test_center_cases_failed');
    return sendInternalError(reply);
  }
};
