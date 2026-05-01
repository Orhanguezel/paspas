export type TestCenterCase = {
  id: string;
  kod: string;
  baslik: string;
  kategori: string;
  kapsam: string;
  komut: string | null;
  dosyaYolu: string | null;
  durum: 'active' | 'expected_failing' | 'todo' | string;
  riskNotu: string | null;
  sira: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TestCenterRunStatus = 'passed' | 'failed' | 'expected_failing' | 'skipped' | 'not_run';

export type TestCenterRun = {
  id: string;
  caseId: string | null;
  baslik: string;
  komut: string | null;
  status: TestCenterRunStatus;
  passCount: number | null;
  failCount: number | null;
  skipCount: number | null;
  expectCount: number | null;
  outputExcerpt: string | null;
  riskNotu: string | null;
  snapshotId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdByUserId: string | null;
  createdAt: string;
};

export type TestCenterCasesResponse = {
  items: TestCenterCase[];
  total: number;
};

export type TestCenterRunsResponse = {
  items: TestCenterRun[];
  total: number;
};

export type CreateTestCenterRunBody = {
  caseId?: string;
  baslik: string;
  komut?: string;
  status: TestCenterRunStatus;
  passCount?: number;
  failCount?: number;
  skipCount?: number;
  expectCount?: number;
  outputExcerpt?: string;
  riskNotu?: string;
  snapshotId?: string;
  startedAt?: string;
  finishedAt?: string;
};

export type RunAllTestCenterBody = {
  snapshotId?: string;
  includeDbIntegration?: boolean;
};

export type RunAllTestCenterResponse = {
  items: TestCenterRun[];
  total: number;
  failed: number;
};

// =============================================================
// AI Şablonları + Run Analizi
// =============================================================

export type AiProvider = 'anthropic' | 'openai' | 'groq';

export type TestCenterAiTemplate = {
  id: string;
  kod: string;
  ad: string;
  aciklama: string | null;
  systemPrompt: string;
  userTemplate: string;
  kategori: string;
  provider: AiProvider | string;
  model: string | null;
  temperature: number | null;
  maxTokens: number | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TestCenterAiTemplatesResponse = {
  items: TestCenterAiTemplate[];
  total: number;
};

export type CreateTestCenterAiTemplateBody = {
  kod: string;
  ad: string;
  aciklama?: string;
  systemPrompt: string;
  userTemplate: string;
  kategori?: string;
  provider?: AiProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  isDefault?: boolean;
  isActive?: boolean;
};

export type UpdateTestCenterAiTemplateBody = Partial<CreateTestCenterAiTemplateBody>;

export type TestCenterRunAnalysisSeverity = 'high' | 'medium' | 'low' | string;

export type TestCenterRunAnalysis = {
  id: string;
  runId: string;
  templateId: string | null;
  provider: AiProvider | string;
  model: string;
  severity: TestCenterRunAnalysisSeverity;
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
  createdAt: string;
};

export type TestCenterRunAnalysesResponse = {
  items: TestCenterRunAnalysis[];
  total: number;
};

export type TriggerTestCenterAnalysisBody = {
  templateId?: string;
  provider?: AiProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
};
