import { test, expect } from "@playwright/test";

test.describe("Member signup flow", () => {
  test("renders registration page", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();
  });

  test("shows validation errors for empty form", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("Full name is required")).toBeVisible();
  });

  test("rejects weak password", async ({ page }) => {
    await page.goto("/register");
    await page.fill("#fullName", "Test User");
    await page.fill("#reg-email", "newuser@example.com");
    await page.fill("#reg-password", "weak");
    await page.fill("#confirmPassword", "weak");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test("rejects password without complexity", async ({ page }) => {
    await page.goto("/register");
    await page.fill("#fullName", "Test User");
    await page.fill("#reg-email", "newuser2@example.com");
    await page.fill("#reg-password", "alllowercase");
    await page.fill("#confirmPassword", "alllowercase");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText(/uppercase/i)).toBeVisible();
  });

  test("rejects mismatched passwords", async ({ page }) => {
    await page.goto("/register");
    await page.fill("#fullName", "Test User");
    await page.fill("#reg-email", "newuser3@example.com");
    await page.fill("#reg-password", "StrongPass1!");
    await page.fill("#confirmPassword", "DifferentPass1!");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });
});
