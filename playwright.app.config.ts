import { defineConfig, devices } from "@playwright/test";

const runAllBrowsers = process.env.PLAYWRIGHT_ALL_BROWSERS === "1";

export default defineConfig({
  testDir: "./tests/e2e/card-app",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/app", open: "never" }],
    ["json", { outputFile: "artifacts/playwright/app-results.json" }],
  ],
  use: {
    baseURL: "http://localhost:4174/card",
    headless: true,
    trace: "on-first-retry",
  },
  projects: runAllBrowsers
    ? [
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },
        {
          name: "firefox",
          use: { ...devices["Desktop Firefox"] },
        },
        {
          name: "webkit",
          use: { ...devices["Desktop Safari"] },
        },
      ]
    : undefined,
  webServer: {
    command: "npm run dev -- --host localhost --port 4174",
    url: "http://localhost:4174/card/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
