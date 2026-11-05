import type { Page } from "@playwright/test";

export class SavedPage {
  readonly cards;
  readonly empty;

  constructor(private readonly page: Page) {
    this.cards = page.getByTestId("listing-card");
    this.empty = page.getByTestId("saved-empty");
  }

  card(id: string) {
    return this.page.locator(`[data-testid="listing-card"][data-id="${id}"]`);
  }

  saveButton(id: string) {
    return this.card(id).getByTestId("save-listing");
  }

  async goto() {
    await this.page.goto("/saved.html");
    await this.page.getByRole("heading", { name: "My saved" }).waitFor();
  }
}
