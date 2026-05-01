import { baseApi } from '@/integrations/baseApi';
import type {
  CreateTestCenterAiTemplateBody,
  CreateTestCenterRunBody,
  RunAllTestCenterBody,
  RunAllTestCenterResponse,
  TestCenterAiTemplate,
  TestCenterAiTemplatesResponse,
  TestCenterCasesResponse,
  TestCenterRun,
  TestCenterRunAnalysesResponse,
  TestCenterRunAnalysis,
  TestCenterRunsResponse,
  TriggerTestCenterAnalysisBody,
  UpdateTestCenterAiTemplateBody,
} from '@/integrations/shared';

const ADMIN_BASE = '/admin/test-center';

export const testCenterApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listTestCenterCases: b.query<TestCenterCasesResponse, { q?: string; activeOnly?: boolean } | void>({
      query: (params) => ({
        url: `${ADMIN_BASE}/cases`,
        method: 'GET',
        params: params ?? { activeOnly: true },
        credentials: 'include',
      }),
      providesTags: ['TestCenter'],
    }),
    listTestCenterRuns: b.query<TestCenterRunsResponse, { caseId?: string; limit?: number; offset?: number } | void>({
      query: (params) => ({
        url: `${ADMIN_BASE}/runs`,
        method: 'GET',
        params: params ?? { limit: 50 },
        credentials: 'include',
      }),
      providesTags: ['TestCenter'],
    }),
    createTestCenterRun: b.mutation<TestCenterRun, CreateTestCenterRunBody>({
      query: (body) => ({
        url: `${ADMIN_BASE}/runs`,
        method: 'POST',
        body,
        credentials: 'include',
      }),
      invalidatesTags: ['TestCenter'],
    }),
    runAllTestCenter: b.mutation<RunAllTestCenterResponse, RunAllTestCenterBody | void>({
      query: (body) => ({
        url: `${ADMIN_BASE}/run-all`,
        method: 'POST',
        body: body ?? { includeDbIntegration: true },
        credentials: 'include',
      }),
      invalidatesTags: ['TestCenter'],
    }),

    // ── AI Şablonları (CRUD) ────────────────────────────────────
    listTestCenterAiTemplates: b.query<TestCenterAiTemplatesResponse, { kategori?: string; activeOnly?: boolean } | void>({
      query: (params) => ({
        url: `${ADMIN_BASE}/ai-templates`,
        method: 'GET',
        params: params ?? { activeOnly: true },
        credentials: 'include',
      }),
      providesTags: ['TestCenter'],
    }),
    createTestCenterAiTemplate: b.mutation<TestCenterAiTemplate, CreateTestCenterAiTemplateBody>({
      query: (body) => ({
        url: `${ADMIN_BASE}/ai-templates`,
        method: 'POST',
        body,
        credentials: 'include',
      }),
      invalidatesTags: ['TestCenter'],
    }),
    updateTestCenterAiTemplate: b.mutation<TestCenterAiTemplate, { id: string; body: UpdateTestCenterAiTemplateBody }>({
      query: ({ id, body }) => ({
        url: `${ADMIN_BASE}/ai-templates/${id}`,
        method: 'PATCH',
        body,
        credentials: 'include',
      }),
      invalidatesTags: ['TestCenter'],
    }),
    deleteTestCenterAiTemplate: b.mutation<void, string>({
      query: (id) => ({
        url: `${ADMIN_BASE}/ai-templates/${id}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['TestCenter'],
    }),

    // ── Run Analizi ─────────────────────────────────────────────
    listTestCenterRunAnalyses: b.query<TestCenterRunAnalysesResponse, string>({
      query: (runId) => ({
        url: `${ADMIN_BASE}/runs/${runId}/analyses`,
        method: 'GET',
        credentials: 'include',
      }),
      providesTags: ['TestCenter'],
    }),
    triggerTestCenterRunAnalysis: b.mutation<TestCenterRunAnalysis, { runId: string; body?: TriggerTestCenterAnalysisBody }>({
      query: ({ runId, body }) => ({
        url: `${ADMIN_BASE}/runs/${runId}/analyses`,
        method: 'POST',
        body: body ?? {},
        credentials: 'include',
      }),
      invalidatesTags: ['TestCenter'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListTestCenterCasesQuery,
  useListTestCenterRunsQuery,
  useCreateTestCenterRunMutation,
  useRunAllTestCenterMutation,
  useListTestCenterAiTemplatesQuery,
  useCreateTestCenterAiTemplateMutation,
  useUpdateTestCenterAiTemplateMutation,
  useDeleteTestCenterAiTemplateMutation,
  useListTestCenterRunAnalysesQuery,
  useTriggerTestCenterRunAnalysisMutation,
} = testCenterApi;
