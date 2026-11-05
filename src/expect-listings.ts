import { expect } from "@playwright/test";
import type { ListingsPage } from "./pages/listings.page";

export async function expectVisibleIds(listingsPage: ListingsPage, expected: string[]) {
  const pinIds = [...expected].sort();
  await expect(listingsPage.resultCount).toHaveAttribute("data-count", String(expected.length));
  await expect.poll(async () => listingsPage.ids()).toEqual(expected);
  await expect.poll(async () => (await listingsPage.pinIds()).sort()).toEqual(pinIds);
  if (expected.length === 0) {
    await expect(listingsPage.empty).toBeVisible();
    await expect(listingsPage.mapEmpty).toBeVisible();
  } else {
    await expect(listingsPage.empty).toBeHidden();
    await expect(listingsPage.mapEmpty).toHaveCount(0);
  }
}
