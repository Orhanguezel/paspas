import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { caseRowToDto, runRowToDto, type TestCenterRunDto } from './schema';
import { repoCreateRun, repoListCases } from './repository';

const execFileAsync = promisify(execFile);

type ParsedCommand = {
  bin: 'bun';
  args: string[];
};

export type ParsedTestOutput = {
  passCount: number | null;
  failCount: number | null;
  skipCount: number | null;
  expectCount: number | null;
};

export type RunAllTestsOptions = {
  createdByUserId: string | null;
  snapshotId?: string | null;
  includeDbIntegration?: boolean;
};

function splitCommand(command: string): string[] {
  return command.trim().split(/\s+/).filter(Boolean);
}

export function parseAllowedCommand(command: string | null | undefined): ParsedCommand | null {
  if (!command) return null;
  const parts = splitCommand(command);
  if (parts[0] !== 'bun') return null;

  if (parts[1] === 'test') {
    const args = parts.slice(1);
    const safe = args.every((arg) => {
      if (arg.includes(';') || arg.includes('&') || arg.includes('|') || arg.includes('`') || arg.includes('$')) return false;
      if (arg.startsWith('-')) return ['--timeout', '--bail'].includes(arg) || /^--timeout=\d+$/.test(arg);
      return /^[A-Za-z0-9_./:@-]+$/.test(arg);
    });
    return safe ? { bin: 'bun', args } : null;
  }

  if (
    parts.length === 7 &&
    parts[1] === 'x' &&
    parts[2] === 'tsc' &&
    parts[3] === '-p' &&
    parts[4] === 'tsconfig.json' &&
    parts[5] === '--noEmit'
  ) {
    return { bin: 'bun', args: parts.slice(1) };
  }

  if (
    parts.length === 6 &&
    parts[1] === 'x' &&
    parts[2] === 'tsc' &&
    parts[3] === '-p' &&
    parts[4] === 'tsconfig.json' &&
    parts[5] === '--noEmit'
  ) {
    return { bin: 'bun', args: parts.slice(1) };
  }

  return null;
}

function readCount(output: string, label: string): number | null {
  const match = output.match(new RegExp(`(?:^|\\n)\\s*(\\d+)\\s+${label}\\b`, 'i'));
  return match ? Number(match[1]) : null;
}

export function parseTestOutput(output: string): ParsedTestOutput {
  return {
    passCount: readCount(output, 'pass'),
    failCount: readCount(output, 'fail'),
    skipCount: readCount(output, 'skip'),
    expectCount: readCount(output, 'expect'),
  };
}

function outputExcerpt(output: string): string {
  const trimmed = output.trim();
  if (trimmed.length <= 8000) return trimmed;
  return trimmed.slice(trimmed.length - 8000);
}

export function shouldEnableDbIntegrationForCase(
  item: { kategori: string; komut: string | null },
  includeDbIntegration: boolean,
): boolean {
  return (
    includeDbIntegration &&
    (
      item.kategori === 'integration' ||
      item.kategori === 'real-db-e2e' ||
      (item.komut ?? '').includes('.integration.test.ts')
    )
  );
}

async function runCommand(
  command: string | null,
  enableDbIntegration: boolean,
): Promise<{ exitCode: number; output: string; parsed: ParsedTestOutput }> {
  const parsedCommand = parseAllowedCommand(command);
  if (!parsedCommand) {
    return {
      exitCode: 126,
      output: `Komut allowlist disinda: ${command || '(bos)'}`,
      parsed: { passCount: null, failCount: 1, skipCount: null, expectCount: null },
    };
  }

  try {
    const result = await execFileAsync(parsedCommand.bin, parsedCommand.args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        RUN_DB_INTEGRATION: enableDbIntegration ? '1' : undefined,
      },
      timeout: 10 * 60 * 1000,
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true,
    });
    const output = `${result.stdout || ''}${result.stderr || ''}`;
    return { exitCode: 0, output, parsed: parseTestOutput(output) };
  } catch (error: any) {
    const output = `${error?.stdout || ''}${error?.stderr || ''}${error?.message ? `\n${error.message}` : ''}`;
    const exitCode = typeof error?.code === 'number' ? error.code : 1;
    return { exitCode, output, parsed: parseTestOutput(output) };
  }
}

export async function runAllTestCenterCases(options: RunAllTestsOptions): Promise<{
  items: TestCenterRunDto[];
  total: number;
  failed: number;
}> {
  const cases = await repoListCases({ activeOnly: true });
  const results: TestCenterRunDto[] = [];

  for (const row of cases) {
    const item = caseRowToDto(row);
    const startedAt = new Date();

    if (item.durum === 'todo' || !item.komut) {
      const finishedAt = new Date();
      const run = await repoCreateRun(
        {
          caseId: item.id,
          baslik: item.baslik,
          komut: item.komut ?? undefined,
          status: 'not_run',
          failCount: 0,
          outputExcerpt: 'Test senaryosu checklistte, otomasyon komutu henuz yazilmadi.',
          riskNotu: item.riskNotu ?? undefined,
          snapshotId: options.snapshotId ?? undefined,
          startedAt,
          finishedAt,
        },
        options.createdByUserId,
      );
      results.push(runRowToDto(run));
      continue;
    }

    const enableDbIntegration = shouldEnableDbIntegrationForCase(item, options.includeDbIntegration ?? true);
    const result = await runCommand(item.komut, enableDbIntegration);
    const finishedAt = new Date();
    const status =
      result.exitCode === 0
        ? 'passed'
        : item.durum === 'expected_failing'
        ? 'expected_failing'
        : 'failed';

    const run = await repoCreateRun(
      {
        caseId: item.id,
        baslik: item.baslik,
        komut: item.komut ?? undefined,
        status,
        passCount: result.parsed.passCount ?? undefined,
        failCount: result.parsed.failCount ?? (result.exitCode === 0 ? 0 : 1),
        skipCount: result.parsed.skipCount ?? undefined,
        expectCount: result.parsed.expectCount ?? undefined,
        outputExcerpt: outputExcerpt(result.output),
        riskNotu: item.riskNotu ?? undefined,
        snapshotId: options.snapshotId ?? undefined,
        startedAt,
        finishedAt,
      },
      options.createdByUserId,
    );
    results.push(runRowToDto(run));
  }

  return {
    items: results,
    total: results.length,
    failed: results.filter((item) => item.status === 'failed').length,
  };
}
