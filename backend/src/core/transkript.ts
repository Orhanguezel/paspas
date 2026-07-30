import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

type TranscriptOptions = {
  mime?: string;
  fileName?: string;
};

async function localTranscript(filePath: string): Promise<string | null> {
  const python = process.env.WHISPER_PY?.trim();
  const script = process.env.WHISPER_SCRIPT?.trim();
  if (!python || !script) return null;
  try {
    const { stdout } = await execFileAsync(python, [script, filePath], {
      timeout: 120_000,
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

function openAiBaseUrl(): string {
  return (process.env.OPENAI_API_BASE?.trim() || 'https://api.openai.com/v1').replace(/\/+$/, '');
}

async function remoteTranscript(
  filePath: string,
  options: TranscriptOptions,
  provider: {
    apiKey: string | undefined;
    baseUrl: string;
    model: string;
  },
): Promise<string | null> {
  const apiKey = provider.apiKey?.trim();
  if (!apiKey) return null;
  try {
    const bytes = await readFile(filePath);
    const form = new FormData();
    const fileName = options.fileName?.trim() || path.basename(filePath) || 'sesli-not.webm';
    form.append('file', new Blob([bytes], {
      type: options.mime?.trim() || 'audio/webm',
    }), fileName);
    form.append('model', provider.model);
    form.append('language', 'tr');

    const response = await fetch(`${provider.baseUrl.replace(/\/+$/, '')}/audio/transcriptions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) return null;
    const payload = await response.json() as { text?: unknown };
    return typeof payload.text === 'string' && payload.text.trim() ? payload.text.trim() : null;
  } catch {
    return null;
  }
}

export function openAiTranscript(
  filePath: string,
  options: TranscriptOptions = {},
): Promise<string | null> {
  return remoteTranscript(filePath, options, {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: openAiBaseUrl(),
    model: process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || 'gpt-4o-mini-transcribe',
  });
}

export function groqTranscript(
  filePath: string,
  options: TranscriptOptions = {},
): Promise<string | null> {
  return remoteTranscript(filePath, options, {
    apiKey: process.env.GROQ_API_KEY,
    baseUrl: process.env.GROQ_API_BASE?.trim() || 'https://api.groq.com/openai/v1',
    model: process.env.GROQ_TRANSCRIPTION_MODEL?.trim() || 'whisper-large-v3-turbo',
  });
}

export async function transkriptEt(
  filePath: string,
  options: TranscriptOptions = {},
): Promise<string | null> {
  return (await localTranscript(filePath))
    ?? (await openAiTranscript(filePath, options))
    ?? groqTranscript(filePath, options);
}
