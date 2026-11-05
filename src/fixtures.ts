import { test as base, type Page } from "@playwright/test";
import { loadListings, type Listing } from "./data/listings";
import { authFile } from "./paths";

type DemoFixtures = {
  listings: Listing[];
  authedPage: Page;
};

export const test = base.extend<DemoFixtures>({
  listings: async ({}, use) => {
    await use(loadListings());
  },
  authedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
