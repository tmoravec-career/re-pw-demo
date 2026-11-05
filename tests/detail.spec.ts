import { monthlyPayment } from "../src/data/mortgage";
import { expect, test } from "../src/fixtures";
import { ListingDetailPage } from "../src/pages/detail.page";
import { ListingsPage } from "../src/pages/listings.page";

test.describe("listing detail", () => {
  test("a card opens the listing with that id", { tag: "@smoke" }, async ({ page, listings }) => {
    const listing = listings[0];
    const listingsPage = new ListingsPage(page);
    const detail = new ListingDetailPage(page);

    await listingsPage.goto();
    await listingsPage.link(listing.id).click();

    await expect(page).toHaveURL(new RegExp(`listing\\.html\\?id=${listing.id}$`));
    await expect(detail.heading).toHaveText(listing.address);
    await expect(detail.root).toHaveAttribute("data-price", String(listing.price));
    await expect(detail.root).toHaveAttribute("data-beds", String(listing.beds));
    await expect(detail.pin).toHaveAttribute("data-id", listing.id);
  });

  test("a map pin opens the listing with that id", async ({ page, listings }) => {
    const listing = listings.find((item) => item.city === "Duluth");
    if (!listing) throw new Error("Fixture needs a Duluth listing");
    const listingsPage = new ListingsPage(page);
    const detail = new ListingDetailPage(page);

    await listingsPage.goto();
    await listingsPage.pin(listing.id).click();

    await expect(page).toHaveURL(new RegExp(`listing\\.html\\?id=${listing.id}$`));
    await expect(detail.heading).toHaveText(listing.address);
    await expect(detail.pin).toHaveAttribute("data-id", listing.id);
  });

  test("the monthly payment follows the price and the down payment", async ({ page, listings }) => {
    const listing = listings[0];
    const detail = new ListingDetailPage(page);
    await detail.goto(listing.id);

    await expect(detail.payment).toHaveAttribute("data-amount", String(monthlyPayment(listing.price, 20, 6.5, 30)));
    await page.getByLabel("Down payment").fill("10");
    await expect(detail.payment).toHaveAttribute("data-amount", String(monthlyPayment(listing.price, 10, 6.5, 30)));
    await page.getByLabel("Years").selectOption("15");
    await expect(detail.payment).toHaveAttribute("data-amount", String(monthlyPayment(listing.price, 10, 6.5, 15)));
  });

  test("an unknown id shows not found", async ({ page }) => {
    const detail = new ListingDetailPage(page);
    await detail.goto("missing");
    await expect(detail.notFound).toHaveText("Listing not found");
    await expect(detail.root).toHaveCount(0);
  });
});
