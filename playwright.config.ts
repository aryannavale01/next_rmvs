import { defineConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Load .env then .env.local (matching Next.js precedence — later files win,
// but dotenv does not override already-set vars, so load lower-priority first).
loadEnv();
loadEnv({ path: ".env.local" });

export default defineConfig({
  testDir: "./tests",
  timeout: 120_000,
  retries: 1,
  webServer: {
    command: `node scripts/dev-with-log.mjs`,
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PORT: "3000",
      BASE_URL: "http://localhost:3000",
    },
  },
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
