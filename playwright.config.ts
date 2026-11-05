import { defineConfig, devices } from "@playwright/test";

const port = 4174;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [
        ["github"],
        ["html", { open: "never" }],
      ]
    : [
        ["list"],
        ["html", { open: "never" }],
      ],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    screenshot: "only-on-failure",
    video: "off",
    trace: "on-first-retry",
  },
  webServer: {
    command: `npx serve mock-site -l ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      grepInvert: /@known-bug/,
      testMatch: /.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "known-bugs",
      dependencies: ["setup"],
      grep: /@known-bug/,
      testMatch: /.*\.spec\.ts/,
      retries: 0,
      use: {
        ...devices["Desktop Chrome"],
        trace: "on",
      },
    },
  ],
});
