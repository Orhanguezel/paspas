// =============================================================
// FILE: src/modules/test_center/ai_analysis_service.ts
// Test run AI analizi: prompt render → provider çağrısı → JSON parse → DB kayıt
// =============================================================
import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';

import {
  testCenterAiTemplates,
  testCenterRunAnalyses,
  testCenterRuns,
  type TestCenterAiTemplateRow,
  type TestCenterRunAnalysisRow,
  runAnalysisRowToDto,
  type TestCenterRunAnalysisDto,
} from './schema';
import { callAi, getAiDefaultsAsync, type AiProvider } from './ai_provider';

export type AnalyzeRunOptions = {
  /** Belirli template kullanmak için. Verilmezse `kategori='test_run_analysis'` ve `is_default=1` olan kayıt seçilir. */
  templateId?: string;
  /** Provider'ı override et. Verilmezse template.provider veya env varsayılanı kullanılır. */
  provider?: AiProvider;
  /** Modeli override et. Verilmezse template.model veya env varsayılanı kullanılır. */
  model?: string;
  /** Temperature override. */
  temperature?: number;
  /** Max tokens override. */
  maxTokens?: number;
};

/** Basit placeholder render: `{{key}}` → context[key] (string). */
function renderTemplate(tpl: string, ctx: Record<string, string | number | null | undefined>): string {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const v = ctx[key];
    if (v === undefined || v === null) return '';
    return String(v);
  });
}

/** AI çıktısından JSON nesnesini çıkar — markdown code-fence varsa soyar. */
function extractJsonObject(raw: string): unknown {
  let text = raw.trim();
  // ```json ... ``` veya ``` ... ``` çıkar
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fence) text = fence[1].trim();
  // İlk { ile son } arasındaki bloku al (model bazen başlık ekler)
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(text);
}

type ParsedAnalysis = {
  severity: 'high' | 'medium' | 'low';
  summary: string;
  suggestedActions: string[];
  risks: string[];
  relatedFiles: string[];
};

function parseAnalysisJson(rawText: string): ParsedAnalysis {
  const obj = extractJsonObject(rawText) as Record<string, unknown>;

  const sev = String(obj.severity ?? '').toLowerCase();
  const severity: ParsedAnalysis['severity'] =
    sev === 'high' || sev === 'medium' || sev === 'low' ? sev : 'low';

  const summary = String(obj.summary ?? '').slice(0, 1900);
  const arr = (key: string): string[] => {
    const v = obj[key];
    if (!Array.isArray(v)) return [];
    return v.map((x) => String(x)).filter((x) => x.length > 0);
  };

  return {
    severity,
    summary,
    suggestedActions: arr('suggested_actions'),
    risks: arr('risks'),
    relatedFiles: arr('related_files'),
  };
}

async function loadDefaultTemplate(): Promise<TestCenterAiTemplateRow | null> {
  const rows = await db
    .select()
    .from(testCenterAiTemplates)
    .where(
      and(
        eq(testCenterAiTemplates.kategori, 'test_run_analysis'),
        eq(testCenterAiTemplates.is_default, 1),
        eq(testCenterAiTemplates.is_active, 1),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Bir test run'ını AI ile analiz eder ve sonucu DB'ye kaydeder.
 * Hata durumunda da bir analiz satırı yazılır (error_msg dolu) — UI hata
 * sebebini görmek için bunu okuyabilir.
 */
export async function analyzeTestRun(
  runId: string,
  opts: AnalyzeRunOptions = {},
): Promise<TestCenterRunAnalysisDto> {
  // 1. Run'ı oku
  const [run] = await db.select().from(testCenterRuns).where(eq(testCenterRuns.id, runId)).limit(1);
  if (!run) throw new Error('test_center_run_bulunamadi');

  // 2. Template'i belirle
  let template: TestCenterAiTemplateRow | null = null;
  if (opts.templateId) {
    const rows = await db
      .select()
      .from(testCenterAiTemplates)
      .where(eq(testCenterAiTemplates.id, opts.templateId))
      .limit(1);
    template = rows[0] ?? null;
  }
  if (!template) template = await loadDefaultTemplate();
  if (!template) {
    throw new Error('ai_template_bulunamadi: test_run_analysis kategorisinde varsayılan şablon yok.');
  }

  // 3. Provider/model/parametreleri belirle (DB-first, env fallback)
  const defaults = await getAiDefaultsAsync();
  const provider: AiProvider =
    (opts.provider as AiProvider) ?? (template.provider as AiProvider) ?? defaults.provider;
  const model = opts.model ?? template.model ?? defaults.model;
  const temperature =
    opts.temperature ?? (template.temperature == null ? defaults.temperature : Number(template.temperature));
  const maxTokens = opts.maxTokens ?? template.max_tokens ?? defaults.maxTokens;

  // 4. Prompt'u render et
  const userPrompt = renderTemplate(template.user_template, {
    title: run.baslik,
    command: run.komut ?? '',
    status: run.status,
    passCount: run.pass_count ?? 0,
    failCount: run.fail_count ?? 0,
    skipCount: run.skip_count ?? 0,
    expectCount: run.expect_count ?? 0,
    outputExcerpt: (run.output_excerpt ?? '').slice(0, 4000),
    riskNotu: run.risk_notu ?? '',
  });

  const analysisId = randomUUID();

  // 5. Provider çağrısı + parse
  try {
    const result = await callAi(provider, {
      systemPrompt: template.system_prompt,
      userPrompt,
      model,
      temperature,
      maxTokens,
      responseFormat: 'json',
    });

    const parsed = parseAnalysisJson(result.text);

    await db.insert(testCenterRunAnalyses).values({
      id: analysisId,
      run_id: runId,
      template_id: template.id,
      provider,
      model,
      severity: parsed.severity,
      summary: parsed.summary,
      suggested_actions: parsed.suggestedActions,
      risks: parsed.risks,
      related_files: parsed.relatedFiles,
      raw_response: result.text.slice(0, 10000),
      tokens_input: result.tokensInput,
      tokens_output: result.tokensOutput,
      latency_ms: result.latencyMs,
      cost_usd: result.costUsd == null ? null : result.costUsd.toFixed(6),
      error_msg: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.insert(testCenterRunAnalyses).values({
      id: analysisId,
      run_id: runId,
      template_id: template.id,
      provider,
      model,
      severity: 'low',
      summary: 'AI analizi sırasında hata oluştu (detay error_msg alanında).',
      suggested_actions: [],
      risks: [],
      related_files: [],
      raw_response: null,
      tokens_input: null,
      tokens_output: null,
      latency_ms: null,
      cost_usd: null,
      error_msg: message.slice(0, 1000),
    });
  }

  const [saved] = await db
    .select()
    .from(testCenterRunAnalyses)
    .where(eq(testCenterRunAnalyses.id, analysisId))
    .limit(1);
  if (!saved) throw new Error('analiz_kaydedilmedi');
  return runAnalysisRowToDto(saved);
}

/** Bir run için tüm analizler — yeniden analiz history. */
export async function listRunAnalyses(runId: string): Promise<TestCenterRunAnalysisDto[]> {
  const rows = await db
    .select()
    .from(testCenterRunAnalyses)
    .where(eq(testCenterRunAnalyses.run_id, runId))
    .orderBy(desc(testCenterRunAnalyses.created_at));
  return rows.map(runAnalysisRowToDto);
}

/** Tek analiz detayı (id ile). */
export async function getAnalysisById(id: string): Promise<TestCenterRunAnalysisDto | null> {
  const rows = await db
    .select()
    .from(testCenterRunAnalyses)
    .where(eq(testCenterRunAnalyses.id, id))
    .limit(1);
  const row: TestCenterRunAnalysisRow | undefined = rows[0];
  return row ? runAnalysisRowToDto(row) : null;
}
