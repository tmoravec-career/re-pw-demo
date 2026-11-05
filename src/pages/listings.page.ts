import type { Page } from "@playwright/test";
import type { ListingsFilter, SortKey } from "../data/listings";

const HOME_TYPE_LABEL = {
  house: "House",
  condo: "Condo",
  townhouse: "Townhouse",
} as const;

export class ListingsPage {
  readonly city;
  readonly minPrice;
  readonly maxPrice;
  readonly minBeds;
  readonly minBaths;
  readonly status;
  readonly sort;
  readonly cards;
  readonly empty;
  readonly loading;
  readonly resultCount;
  readonly pins;
  readonly mapEmpty;

  constructor(private readonly page: Page) {
    this.city = page.getByLabel("City or address");
    this.minPrice = page.getByLabel("Min price");
    this.maxPrice = page.getByLabel("Max price");
    this.minBeds = page.getByLabel("Minimum bedrooms");
    this.minBaths = page.getByLabel("Minimum bathrooms");
    this.status = page.getByLabel("Status");
    this.sort = page.getByLabel("Sort");
    this.cards = page.getByTestId("listing-card");
    this.empty = page.getByTestId("empty-state");
    this.loading = page.getByTestId("loading");
    this.resultCount = page.getByTestId("result-count");
    this.pins = page.getByTestId("listing-pin");
    this.mapEmpty = page.getByTestId("map-empty");
  }

  pin(id: string) {
    return this.page.locator(`[data-testid="listing-pin"][data-id="${id}"]`);
  }

  card(id: string) {
    return this.page.locator(`[data-testid="listing-card"][data-id="${id}"]`);
  }

  link(id: string) {
    return this.card(id).getByRole("link");
  }

  saveButton(id: string) {
    return this.card(id).getByTestId("save-listing");
  }

  async goto() {
    await this.page.goto("/index.html");
    await this.loading.waitFor({ state: "hidden" });
  }

  async filterBy(filter: ListingsFilter) {
    if (filter.city != null) await this.city.fill(filter.city);
    if (filter.minPrice != null) await this.minPrice.fill(String(filter.minPrice));
    if (filter.maxPrice != null) await this.maxPrice.fill(String(filter.maxPrice));
    if (filter.minBeds != null) await this.minBeds.selectOption(String(filter.minBeds));
    if (filter.minBaths != null) await this.minBaths.selectOption(String(filter.minBaths));
    if (filter.status) await this.status.selectOption(filter.status);
    if (filter.types) {
      for (const type of ["house", "condo", "townhouse"] as const) {
        const box = this.page.getByRole("checkbox", { name: HOME_TYPE_LABEL[type], exact: true });
        if (filter.types.includes(type)) await box.check();
        else await box.uncheck();
      }
    }
  }

  async sortBy(sort: SortKey) {
    await this.sort.selectOption(sort);
  }

  async ids(): Promise<string[]> {
    return this.cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-id") ?? ""));
  }

  async pinIds(): Promise<string[]> {
    return this.pins.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-id") ?? ""));
  }
}
