import { defineConfig, devices } from '@playwright/test';
import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Backend .env'inden ADMIN_EMAIL/ADMIN_PASSWORD'i Playwright sürecine taşı
const backendEnv = resolve(__dirname, '../backend/.env');
if (existsSync(backendEnv)) loadDotenv({ path: backendEnv });

/**
 * Playwright config — admin panel e2e testleri.
 *
 * Test çalıştırmak için:
 *   1. Backend dev server: `cd ../backend && bun run dev`  (port 8078)
 *   2. Admin panel dev server: `bun run dev`               (port 3000)
 *   3. Test: `bun run test:e2e`                            (UI: bun run test:e2e:ui)
 *
 * NOT: webServer otomatik başlatma kapalı — geliştirici sunucularını manuel
 * çalıştırır. Otomatik açılması gerekirse aşağıdaki webServer bloğunu enable et.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: './e2e/.report' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: './e2e/.auth/admin.json' },
      dependencies: ['setup'],
    },
  ],
  // webServer: [
  //   { command: 'bun run dev', url: 'http://localhost:3000', reuseExistingServer: true, cwd: '.' },
  //   { command: 'bun run dev', url: 'http://localhost:8078', reuseExistingServer: true, cwd: '../backend' },
  // ],
});
