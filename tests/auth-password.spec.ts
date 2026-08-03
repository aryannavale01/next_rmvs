import { test, expect } from "@playwright/test";

test.describe("Password reset flow", () => {
  test("renders forgot password page", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /forgot|reset/i })).toBeVisible();
  });

  test("renders reset password page with missing token", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText("Invalid Link")).toBeVisible();
  });

  test("renders reset password page with invalid token", async ({ page }) => {
    await page.goto("/reset-password?token=invalid-token-12345");
    await expect(page.getByRole("heading", { name: "Set New Password" })).toBeVisible();
  });

  test("reset form rejects weak password", async ({ page }) => {
    await page.goto("/reset-password?token=expired-token");
    await page.fill("#new-password", "weak");
    await page.fill("#confirm-password", "weak");
    await page.getByRole("button", { name: /reset password/i }).click();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test("reset form rejects mismatched passwords", async ({ page }) => {
    await page.goto("/reset-password?token=expired-token");
    await page.fill("#new-password", "StrongPass1!");
    await page.fill("#confirm-password", "DifferentPass1!");
    await page.getByRole("button", { name: /reset password/i }).click();
    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });
});

test.describe("Force password change flow", () => {
  test("redirects to force-password-change when unauthenticated", async ({ page }) => {
    await page.goto("/force-password-change");
    await expect(page).toHaveURL(/\/login/);
  });
});
