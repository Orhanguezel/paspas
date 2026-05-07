import { env } from '@/core/env';

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AI_REQUEST_FAILED_${res.status}`);
  return res.json() as Promise<{ choices?: Array<{ message?: { content?: string } }> }>;
}

export async function askGroq(prompt: string, model = 'llama-3.1-8b-instant') {
  if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY_NOT_CONFIGURED');
  const data = await postJson(
    'https://api.groq.com/openai/v1/chat/completions',
    { authorization: `Bearer ${env.GROQ_API_KEY}` },
    { model, messages: [{ role: 'user', content: prompt }], temperature: 0.2 },
  );
  return data.choices?.[0]?.message?.content ?? '';
}

export async function askOpenAI(prompt: string, model = 'gpt-4o-mini') {
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY_NOT_CONFIGURED');
  const data = await postJson(
    'https://api.openai.com/v1/chat/completions',
    { authorization: `Bearer ${env.OPENAI_API_KEY}` },
    { model, messages: [{ role: 'user', content: prompt }], temperature: 0.2 },
  );
  return data.choices?.[0]?.message?.content ?? '';
}

export async function askBestAvailable(prompt: string, model?: string) {
  if (env.GROQ_API_KEY) return askGroq(prompt, model);
  return askOpenAI(prompt, model);
}
