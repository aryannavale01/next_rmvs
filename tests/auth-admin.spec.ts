import { test, expect } from "@playwright/test";
import { e2eAdminCredentials, e2eMemberCredentials } from "./helpers/credentials";

test.describe("Admin login flow", () => {
  test("renders admin login page", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: "Secure Admin Access" })).toBeVisible();
  });

  test("rejects non-admin user on admin login", async ({ page }) => {
    const member = e2eMemberCredentials();
    await page.goto("/admin/login");
    await page.fill("#admin-email", member.email);
    await page.fill("#admin-password", member.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/administrators only/i)).toBeVisible({ timeout: 30_000 });
  });

  test("shows error for invalid admin credentials", async ({ page }) => {
    const admin = e2eAdminCredentials();
    await page.goto("/admin/login");
    await page.fill("#admin-email", admin.email);
    await page.fill("#admin-password", "WrongPassword123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect/i)).toBeVisible({ timeout: 30_000 });
  });
});
