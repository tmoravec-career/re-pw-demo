import { loadDemoUser } from "../src/data/user";
import { expect, test } from "../src/fixtures";
import { ListingsPage } from "../src/pages/listings.page";
import { LoginPage } from "../src/pages/login.page";
import { SavedPage } from "../src/pages/saved.page";

test.describe("auth and save", () => {
  test("the saved view sends an anonymous visitor to login", async ({ page }) => {
    await page.goto("/saved.html");
    await expect(page).toHaveURL(/login\.html$/);
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  test("an unknown password is rejected", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn("nope@example.com", "not-the-password");
    await expect(login.error).toBeVisible();
    await expect(page).toHaveURL(/login\.html$/);
  });

  test("a saved listing survives reload and can be removed", { tag: "@smoke" }, async ({ authedPage, listings }) => {
    const user = loadDemoUser();
    const active = listings.find((listing) => listing.status === "active");
    if (!active) throw new Error("Fixture needs an active listing");

    const listingsPage = new ListingsPage(authedPage);
    await listingsPage.goto();
    await expect(authedPage.getByTestId("current-user")).toHaveText(user.email);

    await listingsPage.saveButton(active.id).click();
    await expect(listingsPage.saveButton(active.id)).toHaveAttribute("aria-pressed", "true");

    const saved = new SavedPage(authedPage);
    await saved.goto();
    await expect(saved.card(active.id)).toBeVisible();
    await expect(saved.card(active.id)).toHaveAttribute("data-price", String(active.price));

    await authedPage.reload();
    await expect(saved.card(active.id)).toBeVisible();

    await saved.saveButton(active.id).click();
    await expect(saved.card(active.id)).toHaveCount(0);
    await expect(saved.empty).toBeVisible();

    await authedPage.reload();
    await expect(saved.empty).toBeVisible();
    await expect(saved.card(active.id)).toHaveCount(0);
  });

  test("a sold listing has no save control", async ({ authedPage, listings }) => {
    const sold = listings.find((listing) => listing.status === "sold");
    if (!sold) throw new Error("Fixture needs a sold listing");

    const listingsPage = new ListingsPage(authedPage);
    await listingsPage.goto();
    await expect(listingsPage.card(sold.id)).toBeVisible();
    await expect(listingsPage.card(sold.id)).toHaveAttribute("data-status", "sold");
    await expect(listingsPage.saveButton(sold.id)).toHaveCount(0);
  });
});
