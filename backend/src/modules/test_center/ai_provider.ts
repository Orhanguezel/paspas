// =============================================================
// FILE: src/modules/test_center/ai_provider.ts
// AI provider abstraction — Anthropic Claude, OpenAI, Groq
// =============================================================
//
// Tüm provider'lar aynı arayüzü sağlar:
//   call({ systemPrompt, userPrompt, model, temperature, maxTokens })
//     → { text, tokensInput, tokensOutput, costUsd?, raw }
//
// Varsayılan provider/model env'den okunur:
//   AI_DEFAULT_PROVIDER=anthropic | openai | groq
//   AI_DEFAULT_MODEL=claude-sonnet-4-5 | gpt-4o-mini | ...
//   AI_TEMPERATURE=0.2
//   AI_MAX_TOKENS=1024

export type AiProvider = 'anthropic' | 'openai' | 'groq';

export type AiCallInput = {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  // JSON-only çıktı zorlamak için (provider destekliyorsa kullanılır)
  responseFormat?: 'json' | 'text';
};

export type AiCallResult = {
  text: string;
  tokensInput: number | null;
  tokensOutput: number | null;
  costUsd: number | null;
  latencyMs: number;
  raw: unknown;
};

// Yaklaşık fiyat tablosu (USD per 1M token).
// Sadece bilgi amaçlı — gerçek fatura provider'dan gelir.
const PRICE_TABLE: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-5': { input: 3.0, output: 15.0 },
  'claude-opus-4-7': { input: 15.0, output: 75.0 },
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
};

function estimateCost(model: string, tokensInput: number | null, tokensOutput: number | null): number | null {
  const price = PRICE_TABLE[model];
  if (!price || tokensInput == null || tokensOutput == null) return null;
  return (tokensInput * price.input + tokensOutput * price.output) / 1_000_000;
}

export type AiDefaults = {
  provider: AiProvider;
  model: string;
  temperature: number;
  maxTokens: number;
};

export function getAiDefaults(): AiDefaults {
  const provider = (process.env.AI_DEFAULT_PROVIDER ?? 'anthropic') as AiProvider;
  const model = process.env.AI_DEFAULT_MODEL ?? 'claude-sonnet-4-5';
  const temperature = process.env.AI_TEMPERATURE ? Number(process.env.AI_TEMPERATURE) : 0.2;
  const maxTokens = process.env.AI_MAX_TOKENS ? Number(process.env.AI_MAX_TOKENS) : 1024;
  return { provider, model, temperature, maxTokens };
}

// =============================================================
// Anthropic (Messages API)
// =============================================================
async function callAnthropic(input: AiCallInput): Promise<AiCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY env değeri yok');

  const start = Date.now();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: input.maxTokens,
      temperature: input.temperature,
      system: input.systemPrompt,
      messages: [{ role: 'user', content: input.userPrompt }],
    }),
  });

  const latencyMs = Date.now() - start;

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`anthropic_api_error:${res.status}:${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const text = (data.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('')
    .trim();
  const tokensInput = data.usage?.input_tokens ?? null;
  const tokensOutput = data.usage?.output_tokens ?? null;
  const costUsd = estimateCost(input.model, tokensInput, tokensOutput);

  return { text, tokensInput, tokensOutput, costUsd, latencyMs, raw: data };
}

// =============================================================
// OpenAI (Chat Completions)
// =============================================================
async function callOpenAi(input: AiCallInput): Promise<AiCallResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY env değeri yok');
  const baseUrl = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

  const start = Date.now();
  const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: input.userPrompt },
      ],
      ...(input.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  const latencyMs = Date.now() - start;

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`openai_api_error:${res.status}:${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const text = (data.choices?.[0]?.message?.content ?? '').trim();
  const tokensInput = data.usage?.prompt_tokens ?? null;
  const tokensOutput = data.usage?.completion_tokens ?? null;
  const costUsd = estimateCost(input.model, tokensInput, tokensOutput);

  return { text, tokensInput, tokensOutput, costUsd, latencyMs, raw: data };
}

// =============================================================
// Groq (OpenAI-uyumlu Chat Completions)
// =============================================================
async function callGroq(input: AiCallInput): Promise<AiCallResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY env değeri yok');
  const baseUrl = process.env.GROQ_API_BASE || 'https://api.groq.com/openai/v1';

  const start = Date.now();
  const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: input.userPrompt },
      ],
      ...(input.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  const latencyMs = Date.now() - start;

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`groq_api_error:${res.status}:${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const text = (data.choices?.[0]?.message?.content ?? '').trim();
  const tokensInput = data.usage?.prompt_tokens ?? null;
  const tokensOutput = data.usage?.completion_tokens ?? null;
  const costUsd = estimateCost(input.model, tokensInput, tokensOutput);

  return { text, tokensInput, tokensOutput, costUsd, latencyMs, raw: data };
}

// =============================================================
// Dispatcher
// =============================================================
export async function callAiProvider(
  provider: AiProvider,
  input: AiCallInput,
): Promise<AiCallResult> {
  switch (provider) {
    case 'anthropic':
      return callAnthropic(input);
    case 'openai':
      return callOpenAi(input);
    case 'groq':
      return callGroq(input);
    default:
      throw new Error(`unsupported_ai_provider:${provider}`);
  }
}

// =============================================================
// Test/mock için override hook
// =============================================================
type AiOverride = (provider: AiProvider, input: AiCallInput) => Promise<AiCallResult>;
let aiOverride: AiOverride | null = null;

/** Test paketi için: provider çağrısını mock'la. Production'da kullanma. */
export function setAiProviderOverride(fn: AiOverride | null): void {
  aiOverride = fn;
}

export async function callAi(provider: AiProvider, input: AiCallInput): Promise<AiCallResult> {
  if (aiOverride) return aiOverride(provider, input);
  return callAiProvider(provider, input);
}
