import { test, expect } from "@playwright/test";

test.describe("Admin login flow", () => {
  test("renders admin login page", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("rejects non-admin user on admin login", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill('input[name="email"]', "test.member@example.com");
    await page.fill('input[name="password"]', process.env.TEST_MEMBER_PASSWORD || "Testuser@123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/forbidden|not.*admin/i)).toBeVisible({ timeout: 10_000 });
  });

  test("shows error for invalid admin credentials", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill('input[name="email"]', "admin@compassionglobal.org");
    await page.fill('input[name="password"]', "WrongPassword123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect/i)).toBeVisible({ timeout: 10_000 });
  });
});
