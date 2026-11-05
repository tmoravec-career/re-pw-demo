import { expect, test } from "../src/fixtures";
import { ListingsPage } from "../src/pages/listings.page";

test.describe("known bugs", () => {
  test("a pending listing does not offer save", { tag: "@known-bug" }, async ({ authedPage, listings }) => {
    const pending = listings.find((listing) => listing.status === "pending");
    if (!pending) throw new Error("Fixture needs a pending listing");

    const listingsPage = new ListingsPage(authedPage);
    await listingsPage.goto();
    await expect(listingsPage.card(pending.id)).toHaveAttribute("data-status", "pending");
    await expect(
      listingsPage.saveButton(pending.id),
      "Pending listings cannot be saved. The Save control should be absent.",
    ).toHaveCount(0, { timeout: 1_500 });
  });
});
