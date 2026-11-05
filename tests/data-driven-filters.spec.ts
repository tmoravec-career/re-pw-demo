import { expectedIds, type ListingsFilter } from "../src/data/listings";
import { expectVisibleIds } from "../src/expect-listings";
import { test } from "../src/fixtures";
import { ListingsPage } from "../src/pages/listings.page";

const cases: { name: string; filter: ListingsFilter }[] = [
  { name: "city contains minneapolis", filter: { city: "minneapolis" } },
  { name: "city contains paul", filter: { city: "paul" } },
  { name: "max price 320000", filter: { maxPrice: 320_000 } },
  { name: "at least 4 bedrooms", filter: { minBeds: 4 } },
  {
    name: "Minneapolis, at least 3 beds, under 500000",
    filter: { city: "Minneapolis", maxPrice: 500_000, minBeds: 3 },
  },
  { name: "Duluth with at least 2 beds", filter: { city: "Duluth", minBeds: 2 } },
  { name: "address contains oak", filter: { city: "oak" } },
  { name: "at least 400000", filter: { minPrice: 400_000 } },
  { name: "at least 3 bathrooms", filter: { minBaths: 3 } },
  { name: "for sale only", filter: { status: "active" } },
  { name: "condos", filter: { types: ["condo"] } },
  { name: "no Duluth condos", filter: { city: "Duluth", types: ["condo"] } },
];

test.describe("data-driven filters", () => {
  for (const testCase of cases) {
    test(testCase.name, async ({ page, listings }) => {
      const listingsPage = new ListingsPage(page);
      await listingsPage.goto();
      await listingsPage.filterBy(testCase.filter);
      await expectVisibleIds(listingsPage, expectedIds(listings, testCase.filter));
    });
  }
});
