import { expect, test } from "../src/fixtures";

test("the loading indicator is visible and then replaced by cards", { tag: "@smoke" }, async ({ page }) => {
  await page.goto("/index.html", { waitUntil: "domcontentloaded" });

  const loading = page.getByTestId("loading");
  await expect(loading).toBeVisible();
  await expect(loading).toBeHidden();
  await expect(page.getByTestId("listing-card").first()).toBeVisible();
});
