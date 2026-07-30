import { afterEach, describe, expect, mock, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { groqTranscript, openAiTranscript, transkriptEt } from '../transkript';

const originalFetch = globalThis.fetch;
const originalEnv = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_API_BASE: process.env.OPENAI_API_BASE,
  OPENAI_TRANSCRIPTION_MODEL: process.env.OPENAI_TRANSCRIPTION_MODEL,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_API_BASE: process.env.GROQ_API_BASE,
  GROQ_TRANSCRIPTION_MODEL: process.env.GROQ_TRANSCRIPTION_MODEL,
  WHISPER_PY: process.env.WHISPER_PY,
  WHISPER_SCRIPT: process.env.WHISPER_SCRIPT,
};
const temporaryDirectories: string[] = [];

afterEach(async () => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key as keyof typeof process.env];
    else process.env[key as keyof typeof process.env] = value;
  }
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

async function audioFixture(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'paspas-transkript-'));
  temporaryDirectories.push(directory);
  const file = path.join(directory, 'ses-kaydi');
  await writeFile(file, new Uint8Array([26, 69, 223, 163]));
  return file;
}

describe('OpenAI transcription fallback', () => {
  test('returns null without an API key and does not call fetch', async () => {
    delete process.env.OPENAI_API_KEY;
    const fetchMock = mock(() => Promise.reject(new Error('called')));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(await openAiTranscript(await audioFixture())).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('posts multipart audio to the configured transcription endpoint', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_API_BASE = 'https://openai.test/v1/';
    process.env.OPENAI_TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe';
    const fetchMock = mock(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe('https://openai.test/v1/audio/transcriptions');
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({ authorization: 'Bearer test-key' });
      const form = init?.body as FormData;
      expect(form.get('model')).toBe('gpt-4o-mini-transcribe');
      expect(form.get('language')).toBe('tr');
      const file = form.get('file') as File;
      expect(file.name).toBe('not.webm');
      expect(file.type).toBe('audio/webm');
      return Response.json({ text: '  Deneme transkripti.  ' });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(await openAiTranscript(await audioFixture(), {
      mime: 'audio/webm',
      fileName: 'not.webm',
    })).toBe('Deneme transkripti.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('transkriptEt falls back when local Whisper is not configured', async () => {
    delete process.env.WHISPER_PY;
    delete process.env.WHISPER_SCRIPT;
    process.env.OPENAI_API_KEY = 'test-key';
    const fallbackFetch = mock(async () => Response.json({ text: 'Fallback çalıştı.' }));
    globalThis.fetch = fallbackFetch as any;

    expect(await transkriptEt(await audioFixture())).toBe('Fallback çalıştı.');
  });

  test('uses the Groq Whisper fallback contract', async () => {
    process.env.GROQ_API_KEY = 'groq-test-key';
    process.env.GROQ_API_BASE = 'https://groq.test/openai/v1/';
    const fetchMock = mock(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe('https://groq.test/openai/v1/audio/transcriptions');
      expect(init?.headers).toEqual({ authorization: 'Bearer groq-test-key' });
      const form = init?.body as FormData;
      expect(form.get('model')).toBe('whisper-large-v3-turbo');
      expect(form.get('language')).toBe('tr');
      return Response.json({ text: 'Groq transkripti.' });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(await groqTranscript(await audioFixture())).toBe('Groq transkripti.');
  });

  test('transkriptEt continues from an OpenAI error to Groq', async () => {
    delete process.env.WHISPER_PY;
    delete process.env.WHISPER_SCRIPT;
    process.env.OPENAI_API_KEY = 'openai-test-key';
    process.env.GROQ_API_KEY = 'groq-test-key';
    const fetchMock = mock(async (_url: string | URL | Request, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      return headers.authorization === 'Bearer openai-test-key'
        ? new Response('quota', { status: 429 })
        : Response.json({ text: 'İkinci sağlayıcı çalıştı.' });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(await transkriptEt(await audioFixture())).toBe('İkinci sağlayıcı çalıştı.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('API errors remain fail-open', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const failedFetch = mock(async () => new Response('rate limited', { status: 429 }));
    globalThis.fetch = failedFetch as any;

    expect(await openAiTranscript(await audioFixture())).toBeNull();
  });
});
