import { test, expect } from "@playwright/test";

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
    await page.goto("/login");
    await page.fill('input[name="email"]', "test.member@example.com");
    await page.fill('input[name="password"]', process.env.TEST_MEMBER_PASSWORD || "Testuser@123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/unauthorized|\/admin\/login/);
  });
});
