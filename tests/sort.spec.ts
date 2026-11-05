import { sortedIds } from "../src/data/listings";
import { expectVisibleIds } from "../src/expect-listings";
import { test } from "../src/fixtures";
import { ListingsPage } from "../src/pages/listings.page";

test.describe("sort", () => {
  test("price low to high reorders the cards", async ({ page, listings }) => {
    const listingsPage = new ListingsPage(page);
    await listingsPage.goto();
    await listingsPage.sortBy("price-asc");
    await expectVisibleIds(listingsPage, sortedIds(listings, {}, "price-asc"));
  });

  test("most bedrooms breaks ties by price", async ({ page, listings }) => {
    const listingsPage = new ListingsPage(page);
    await listingsPage.goto();
    await listingsPage.sortBy("beds-desc");
    await expectVisibleIds(listingsPage, sortedIds(listings, {}, "beds-desc"));
  });
});
