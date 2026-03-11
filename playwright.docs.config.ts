import { defineConfig, devices } from "@playwright/test";

const useExternalBase = process.env.PLAYWRIGHT_USE_EXTERNAL_BASE_URL === "1";
const runAllBrowsers = process.env.PLAYWRIGHT_ALL_BROWSERS === "1";
// Port 5001 avoids conflict with macOS AirPlay Receiver on 5000
const baseURL = process.env.E2E_BASE_URL || "http://localhost:5001";

export default defineConfig({
  testDir: "./tests/e2e/docs-shell",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/docs", open: "never" }],
    ["json", { outputFile: "artifacts/playwright/docs-results.json" }],
  ],
  use: {
    baseURL,
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
  webServer: useExternalBase
    ? undefined
    : {
        command: "python3 -m http.server 5001 --directory hosting/public",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
