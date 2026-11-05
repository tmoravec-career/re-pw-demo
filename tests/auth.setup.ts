import fs from "fs";
import path from "path";
import { expect, test as setup } from "@playwright/test";
import { loadDemoUser } from "../src/data/user";
import { authFile } from "../src/paths";

setup("log in as the demo user", async ({ page }) => {
  const user = loadDemoUser();
  await page.goto("/login.html");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/index\.html$/);
  await expect(page.getByTestId("current-user")).toHaveText(user.email);

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
