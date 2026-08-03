import { test, expect } from "@playwright/test";
import { e2eMemberCredentials } from "./helpers/credentials";

test.describe("Route protection", () => {
  test("dashboard redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("admin dashboard redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("member cannot access admin routes after login", async ({ page }) => {
    const member = e2eMemberCredentials();
    await page.goto("/login");
    await page.fill("#email", member.email);
    await page.fill("#password", member.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 30_000 });
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/unauthorized|\/admin\/login/);
  });
});
