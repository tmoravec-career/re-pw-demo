import type { Page } from "@playwright/test";

export class ListingDetailPage {
  readonly root;
  readonly heading;
  readonly notFound;
  readonly save;
  readonly pin;
  readonly payment;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId("listing-detail");
    this.heading = page.getByRole("heading", { level: 1 });
    this.notFound = page.getByTestId("not-found");
    this.save = page.getByTestId("save-listing");
    this.pin = page.getByTestId("listing-pin");
    this.payment = page.getByTestId("monthly-payment");
  }

  async goto(id: string) {
    await this.page.goto(`/listing.html?id=${encodeURIComponent(id)}`);
  }
}
