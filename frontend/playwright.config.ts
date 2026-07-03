import { defineConfig } from '@playwright/test';

// Boots the SPA via `ng serve` and drives the users slice. The smoke exercises
// the client-side zod validation, so it needs no API running and stays hermetic.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  use: { baseURL: 'http://localhost:4200' },
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
