import { expectedIds } from "../src/data/listings";
import { expectVisibleIds } from "../src/expect-listings";
import { expect, test } from "../src/fixtures";
import { ListingsPage } from "../src/pages/listings.page";

test.describe("search and filters", () => {
  test("search by city returns the matching cards", { tag: "@smoke" }, async ({ page, listings }) => {
    const filter = { city: "minneapolis" };
    const expected = expectedIds(listings, filter);
    const listingsPage = new ListingsPage(page);

    await listingsPage.goto();
    await listingsPage.filterBy(filter);

    await expectVisibleIds(listingsPage, expected);
    const longAddress = listings.find((listing) => listing.address.length > 40);
    if (!longAddress) throw new Error("Fixture needs one long address");
    await expect(listingsPage.link(longAddress.id)).toHaveText(longAddress.address);
  });

  test("a city with no houses shows the empty state", async ({ page, listings }) => {
    const filter = { city: "Atlantis" };
    const expected = expectedIds(listings, filter);
    const listingsPage = new ListingsPage(page);

    await listingsPage.goto();
    await listingsPage.filterBy(filter);

    expect(expected).toEqual([]);
    await expectVisibleIds(listingsPage, expected);
    await expect(listingsPage.empty).toHaveText("No listings match");
  });

  test("max price keeps only houses at or under that price", async ({ page, listings }) => {
    const filter = { maxPrice: 200_000 };
    const listingsPage = new ListingsPage(page);

    await listingsPage.goto();
    await listingsPage.filterBy(filter);

    await expectVisibleIds(listingsPage, expectedIds(listings, filter));
  });
});
