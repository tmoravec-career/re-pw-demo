import type { Page } from "@playwright/test";

export class LoginPage {
  readonly email;
  readonly password;
  readonly submit;
  readonly error;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel("Email");
    this.password = page.getByLabel("Password");
    this.submit = page.getByRole("button", { name: "Log in" });
    this.error = page.getByTestId("login-error");
  }

  async goto() {
    await this.page.goto("/login.html");
  }

  async signIn(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
