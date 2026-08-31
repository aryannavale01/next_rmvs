import { test, expect } from "@playwright/test";

const MEMBER_PASSWORD: string = process.env.E2E_MEMBER_PASSWORD!;
if (!MEMBER_PASSWORD) throw new Error("E2E_MEMBER_PASSWORD is required");
const MEMBER = { email: "test.member@example.com", password: MEMBER_PASSWORD };

test("1.1 login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
});

test("1.2 wrong password shows error", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", MEMBER.email);
  await page.fill("#password", "WrongPass123!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 30_000 });
});

test("1.3 correct member login redirects to dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", MEMBER.email);
  await page.fill("#password", MEMBER.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard/);
  // persist storage state for later phases
  await page.context().storageState({ path: "tests/flow/.auth-member.json" });
});

test("1.4 session persists on refresh", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", MEMBER.email);
  await page.fill("#password", MEMBER.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await page.reload();
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page).toHaveURL(/\/dashboard/);
});

test("1.5 member blocked from /admin", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", MEMBER.email);
  await page.fill("#password", MEMBER.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await page.goto("/admin");
  await expect(page).not.toHaveURL(/\/admin\(protected\)|\/admin$/);
});
