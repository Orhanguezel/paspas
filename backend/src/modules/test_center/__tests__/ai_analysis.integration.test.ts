/**
 * AI test analizi integration testi.
 * Mock provider ile gerçek API çağrısı yapmadan akışı uçtan uca test eder:
 *   - Default template seed'de var
 *   - analyzeTestRun: mock response → DB satırı + DTO + history
 *   - Hata case: provider exception → error_msg dolu satır
 *   - JSON markdown fence çözümü
 */
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { eq, inArray } from 'drizzle-orm';

import { db } from '@/db/client';

import { setAiProviderOverride, type AiCallInput, type AiCallResult } from '../ai_provider';
import { analyzeTestRun, listRunAnalyses } from '../ai_analysis_service';
import { testCenterRunAnalyses, testCenterRuns } from '../schema';

const runIntegration = process.env.RUN_DB_INTEGRATION === '1';
const describeIntegration = runIntegration ? describe : describe.skip;

const RUN_ID = 'it-ai-analysis-run-0000000001';

async function cleanup() {
  await db.delete(testCenterRunAnalyses).where(eq(testCenterRunAnalyses.run_id, RUN_ID));
  await db.delete(testCenterRuns).where(eq(testCenterRuns.id, RUN_ID));
}

async function seed() {
  await db.insert(testCenterRuns).values({
    id: RUN_ID,
    case_id: null,
    baslik: 'IT AI Analysis Run',
    komut: 'bun test src/modules/satis_siparisleri',
    status: 'failed',
    pass_count: 5,
    fail_count: 2,
    skip_count: 0,
    expect_count: 18,
    output_excerpt: 'Expected: 10\nReceived: 30\n  at repoGetKalemUretilenMiktarlari',
    snapshot_id: null,
  });
}

describeIntegration('AI test analizi', () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
    setAiProviderOverride(null);
  });

  afterAll(async () => {
    setAiProviderOverride(null);
  });

  it('mock response ile analiz oluşturur ve DB satırı + DTO döndürür', async () => {
    setAiProviderOverride(async (_provider, _input: AiCallInput): Promise<AiCallResult> => ({
      text: JSON.stringify({
        severity: 'high',
        summary: 'Çift sayım bug — SUM yerine hareketler tablosundan asıl ürün giriş kayıtlarını topla.',
        suggested_actions: [
          'repoGetKalemUretilenMiktarlari içinde SUM(uretim_emirleri.uretilen_miktar) yerine hareketler tablosunu kullan',
          'Çift taraflı senaryoda regresyon testi ekle',
        ],
        risks: ['Sipariş durumu hatalı tamamlandı görünebilir'],
        related_files: ['src/modules/satis_siparisleri/repository.ts'],
      }),
      tokensInput: 250,
      tokensOutput: 150,
      costUsd: 0.001,
      latencyMs: 320,
      raw: { mock: true },
    }));

    const dto = await analyzeTestRun(RUN_ID);

    expect(dto.runId).toBe(RUN_ID);
    expect(dto.severity).toBe('high');
    expect(dto.summary).toContain('Çift sayım');
    expect(dto.suggestedActions).toHaveLength(2);
    expect(dto.risks).toHaveLength(1);
    expect(dto.relatedFiles).toEqual(['src/modules/satis_siparisleri/repository.ts']);
    expect(dto.tokensInput).toBe(250);
    expect(dto.tokensOutput).toBe(150);
    expect(dto.costUsd).toBeCloseTo(0.001, 3);
    expect(dto.errorMsg).toBeNull();

    // DB'de satır var
    const [row] = await db
      .select()
      .from(testCenterRunAnalyses)
      .where(eq(testCenterRunAnalyses.id, dto.id))
      .limit(1);
    expect(row).toBeDefined();
    expect(row?.severity).toBe('high');
  });

  it('markdown code-fence içinde gelen JSON\'u parse eder', async () => {
    setAiProviderOverride(async () => ({
      text: '```json\n{"severity":"low","summary":"Test geçti","suggested_actions":[],"risks":[],"related_files":[]}\n```',
      tokensInput: 100,
      tokensOutput: 50,
      costUsd: null,
      latencyMs: 180,
      raw: {},
    }));

    const dto = await analyzeTestRun(RUN_ID);
    expect(dto.severity).toBe('low');
    expect(dto.summary).toBe('Test geçti');
  });

  it('provider hata fırlatırsa error_msg dolu satır yazılır, akış kırılmaz', async () => {
    setAiProviderOverride(async () => {
      throw new Error('anthropic_api_error:429:rate_limit_exceeded');
    });

    const dto = await analyzeTestRun(RUN_ID);
    expect(dto.errorMsg).toContain('rate_limit_exceeded');
    expect(dto.severity).toBe('low');
    expect(dto.suggestedActions).toEqual([]);
    expect(dto.tokensInput).toBeNull();
  });

  it('listRunAnalyses run\'a bağlı analiz geçmişini yeniden eskiye doğru döndürür', async () => {
    setAiProviderOverride(async () => ({
      text: JSON.stringify({
        severity: 'medium',
        summary: 'Birinci analiz',
        suggested_actions: ['adım 1'],
        risks: [],
        related_files: [],
      }),
      tokensInput: 100,
      tokensOutput: 50,
      costUsd: null,
      latencyMs: 100,
      raw: {},
    }));
    await analyzeTestRun(RUN_ID);

    setAiProviderOverride(async () => ({
      text: JSON.stringify({
        severity: 'high',
        summary: 'İkinci analiz',
        suggested_actions: ['adım 2'],
        risks: [],
        related_files: [],
      }),
      tokensInput: 110,
      tokensOutput: 55,
      costUsd: null,
      latencyMs: 105,
      raw: {},
    }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    await analyzeTestRun(RUN_ID);

    const history = await listRunAnalyses(RUN_ID);
    expect(history).toHaveLength(2);
    expect(history[0].summary).toBe('İkinci analiz');
    expect(history[1].summary).toBe('Birinci analiz');
  });

  it('var olmayan run için hata fırlatır', async () => {
    expect(analyzeTestRun('nonexistent-run-id')).rejects.toThrow('test_center_run_bulunamadi');
  });
});
