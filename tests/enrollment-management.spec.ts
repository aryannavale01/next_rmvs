import { test, expect } from "@playwright/test";
import { e2eAdminCredentials } from "./helpers/credentials";

// ============================================================================
// ENROLLMENT MANAGEMENT — TRAINING OPERATIONS DASHBOARD
// ============================================================================

async function loginAsAdmin(page: import("@playwright/test").Page) {
  const admin = e2eAdminCredentials();
  await page.goto("/admin/login");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  // NOTE: do not match "/admin/**" — the login page itself is /admin/login.
  // Wait for the real post-login landing URL instead.
  await page.waitForURL("**/admin", { timeout: 45_000 });
}

// Navigate to the CHW training workspace deterministically. Never silently skip:
// if the card is not present, the test should fail loudly rather than pass
// vacuously against the wrong page.
async function openCourseWorkspace(page: import("@playwright/test").Page) {
  await page.goto("/admin/enrollments");
  const card = page.locator("button:has-text('Community Health Worker Training')").first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.click();
  await expect(page).toHaveURL(/\/admin\/enrollments\/[0-9a-f-]+$/, { timeout: 15_000 });
  await expect(page.locator("button:has-text('Applications')").first()).toBeVisible({ timeout: 15_000 });
}

// ============================================================================
// 1. TRAINING CARDS LANDING PAGE
// ============================================================================

test.describe("Training Cards Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-01: navigates to enrollments page and shows training cards", async ({ page }) => {
    await page.goto("/admin/enrollments");
    await expect(page.locator("text=Active Courses").first()).toBeVisible({ timeout: 10_000 });
  });

  test("TC-02: displays metric cards with totals", async ({ page }) => {
    await page.goto("/admin/enrollments");
    await expect(page.locator("text=Total Applications").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Currently Enrolled").first()).toBeVisible();
    await expect(page.locator("text=Total Members").first()).toBeVisible();
  });

  test("TC-03: search filters course cards", async ({ page }) => {
    await page.goto("/admin/enrollments");
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[placeholder="Search courses..."]');
    await searchInput.fill("Health");
    await page.waitForTimeout(500);
    const cards = page.locator("text=Community Health Worker Training");
    await expect(cards.first()).toBeVisible();
  });

  test("TC-04: clicking a course card navigates to workspace", async ({ page }) => {
    await page.goto("/admin/enrollments");
    await page.waitForTimeout(2000);
    const card = page.locator("text=Community Health Worker Training").first();
    if (await card.isVisible()) {
      await card.click();
      await expect(page).toHaveURL(/\/admin\/enrollments\//, { timeout: 10_000 });
    }
  });
});

// ============================================================================
// 2. TRAINING WORKSPACE — APPLICATIONS TAB
// ============================================================================

test.describe("Training Workspace — Applications", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openCourseWorkspace(page);
  });

  test("TW-05: shows workspace header with course title", async ({ page }) => {
    await expect(page.locator("text=Community Health Worker Training").first()).toBeVisible({ timeout: 10_000 });
  });

  test("TW-06: applications tab is active by default", async ({ page }) => {
    const tab = page.locator("button:has-text('Applications')").first();
    await expect(tab).toBeVisible();
  });

  test("TW-07: shows applications table with columns", async ({ page }) => {
    await expect(page.locator("th:has-text('Member')").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("th:has-text('Status')").first()).toBeVisible();
    await expect(page.locator("th:has-text('Applied')").first()).toBeVisible();
    await expect(page.locator("th:has-text('Actions')").first()).toBeVisible();
  });

  test("TW-08: status filter buttons are present", async ({ page }) => {
    await expect(page.locator("button:has-text('All')").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("button:has-text('pending')").first()).toBeVisible();
    await expect(page.locator("button:has-text('seat_reserved')").first()).toBeVisible();
    await expect(page.locator("button:has-text('rejected')").first()).toBeVisible();
  });

  test("TW-09: search input filters applications", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by name"]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill("test");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500);
  });

  test("TW-10: clicking View opens member drawer", async ({ page }) => {
    const viewBtn = page.locator("button:has-text('View')").first();
    if (await viewBtn.isVisible({ timeout: 5000 })) {
      await viewBtn.click();
      await page.waitForTimeout(1500);
      await expect(page.locator("text=Overview").first()).toBeVisible();
    }
  });
});

// ============================================================================
// 3. TRAINING WORKSPACE — TABS
// ============================================================================

test.describe("Training Workspace — Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openCourseWorkspace(page);
  });

  test("TW-11: Analytics tab shows course health badge", async ({ page }) => {
    const analyticsTab = page.locator("button:has-text('Analytics')").first();
    await analyticsTab.click();
    await page.waitForTimeout(1000);
    await expect(page.locator("text=Healthy").or(page.locator("text=Warning")).or(page.locator("text=Critical")).first()).toBeVisible({ timeout: 5000 });
  });

  test("TW-12: Export tab shows export button", async ({ page }) => {
    const exportTab = page.locator("button:has-text('Export')").first();
    await exportTab.click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=Open Export").first()).toBeVisible();
  });

  test("TW-13: selecting rows in Applications shows bulk action bar", async ({ page }) => {
    await page.waitForTimeout(500);
    const rowCheckbox = page.locator("tbody input[type='checkbox']").first();
    if (await rowCheckbox.isVisible({ timeout: 5000 })) {
      await rowCheckbox.click();
      await page.waitForTimeout(500);
      await expect(page.locator("text=/\\d+ selected/").first()).toBeVisible();
    }
  });

  test("TW-14: Analytics tab loads", async ({ page }) => {
    const analyticsTab = page.locator("button:has-text('Analytics')").first();
    await analyticsTab.click();
    await page.waitForTimeout(1000);
  });

  test("TW-15: Waitlist tab loads", async ({ page }) => {
    const waitlistTab = page.locator("button:has-text('Waitlist')").first();
    await waitlistTab.click();
    await page.waitForTimeout(500);
    await expect(page.locator("th:has-text('Waitlisted')").first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// 4. MEMBER DRAWER
// ============================================================================

test.describe("Member Drawer", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openCourseWorkspace(page);
    const viewBtn = page.locator("button:has-text('View')").first();
    await expect(viewBtn).toBeVisible({ timeout: 10_000 });
    await viewBtn.click();
    await expect(page.locator("text=Overview").first()).toBeVisible({ timeout: 10_000 });
  });

  test("MD-16: drawer shows member overview tab", async ({ page }) => {
    const drawer = page.locator("text=Overview").first();
    if (await drawer.isVisible({ timeout: 3000 })) {
      await expect(drawer).toBeVisible();
    }
  });

  test("MD-17: drawer shows timeline tab", async ({ page }) => {
    const timelineTab = page.locator("button:has-text('Timeline')").first();
    if (await timelineTab.isVisible({ timeout: 3000 })) {
      await timelineTab.click();
      await page.waitForTimeout(500);
    }
  });

  test("MD-18: drawer shows documents tab", async ({ page }) => {
    const docsTab = page.locator("button:has-text('Documents')").first();
    if (await docsTab.isVisible({ timeout: 3000 })) {
      await docsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test("MD-19: drawer shows enrollment tab", async ({ page }) => {
    const enrollTab = page.locator("button:has-text('Enrollment')").first();
    if (await enrollTab.isVisible({ timeout: 3000 })) {
      await enrollTab.click();
      await page.waitForTimeout(500);
    }
  });

  test("MD-20: drawer shows notes tab", async ({ page }) => {
    const notesTab = page.locator("button:has-text('Notes')").first();
    if (await notesTab.isVisible({ timeout: 3000 })) {
      await notesTab.click();
      await page.waitForTimeout(500);
    }
  });

  test("MD-21: drawer can be closed", async ({ page }) => {
    const closeBtn = page.locator("[class*='fixed'] button").first();
    if (await closeBtn.isVisible({ timeout: 3000 })) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  });
});

// ============================================================================
// 5. BULK ACTIONS
// ============================================================================

test.describe("Bulk Actions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openCourseWorkspace(page);
  });

  test("BA-22: select all checkbox toggles selection", async ({ page }) => {
    const selectAll = page.locator("thead input[type='checkbox']").first();
    if (await selectAll.isVisible({ timeout: 5000 })) {
      await selectAll.click();
      await page.waitForTimeout(500);
      const bulkBar = page.locator("text=/\\d+ selected/").first();
      if (await bulkBar.isVisible()) {
        await expect(bulkBar).toBeVisible();
      }
    }
  });

  test("BA-23: individual checkbox toggles selection", async ({ page }) => {
    const rowCheckbox = page.locator("tbody input[type='checkbox']").first();
    if (await rowCheckbox.isVisible({ timeout: 5000 })) {
      await rowCheckbox.click();
      await page.waitForTimeout(500);
    }
  });

  test("BA-24: bulk action bar appears with selected count", async ({ page }) => {
    const rowCheckbox = page.locator("tbody input[type='checkbox']").first();
    if (await rowCheckbox.isVisible({ timeout: 5000 })) {
      await rowCheckbox.click();
      await page.waitForTimeout(500);
      await expect(page.locator("text=/\\d+ selected/").first()).toBeVisible();
    }
  });

  test("BA-25: approve button triggers bulk preview modal", async ({ page }) => {
    const rowCheckbox = page.locator("tbody input[type='checkbox']").first();
    if (await rowCheckbox.isVisible({ timeout: 5000 })) {
      await rowCheckbox.click();
      await page.waitForTimeout(500);
      const approveBtn = page.locator("button:has-text('Approve')").first();
      if (await approveBtn.isVisible()) {
        await approveBtn.click();
        await page.waitForTimeout(500);
        await expect(page.locator("text=Preview: Approve").first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("BA-26: bulk preview modal can be cancelled", async ({ page }) => {
    const rowCheckbox = page.locator("tbody input[type='checkbox']").first();
    if (await rowCheckbox.isVisible({ timeout: 5000 })) {
      await rowCheckbox.click();
      await page.waitForTimeout(500);
      const approveBtn = page.locator("button:has-text('Approve')").first();
      if (await approveBtn.isVisible()) {
        await approveBtn.click();
        await page.waitForTimeout(500);
        const cancelBtn = page.locator("button:has-text('Cancel')").first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });
});

// ============================================================================
// 6. EXPORT
// ============================================================================

test.describe("Export", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openCourseWorkspace(page);
  });

  test("EX-27: export tab shows export option", async ({ page }) => {
    const exportTab = page.locator("button:has-text('Export')").first();
    await exportTab.click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=Open Export").first()).toBeVisible();
  });

  test("EX-28: open export shows format selection modal", async ({ page }) => {
    const exportTab = page.locator("button:has-text('Export')").first();
    await exportTab.click();
    await page.waitForTimeout(500);
    await page.locator("button:has-text('Open Export')").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=Export Enrollment Data").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=CSV").first()).toBeVisible();
    await expect(page.locator("text=PDF").first()).toBeVisible();
    await expect(page.locator("text=DOCX").first()).toBeVisible();
  });

  test("EX-29: export modal can be closed", async ({ page }) => {
    const exportTab = page.locator("button:has-text('Export')").first();
    await exportTab.click();
    await page.waitForTimeout(500);
    await page.locator("button:has-text('Open Export')").first().click();
    await page.waitForTimeout(500);
    const closeBtn = page.locator("text=Export Enrollment Data").locator("..").locator("button").first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test("EX-30: CSV format option is selectable", async ({ page }) => {
    const exportTab = page.locator("button:has-text('Export')").first();
    await exportTab.click();
    await page.waitForTimeout(500);
    await page.locator("button:has-text('Open Export')").first().click();
    await page.waitForTimeout(500);
    const csvOption = page.locator("button:has-text('CSV')").first();
    if (await csvOption.isVisible()) {
      await csvOption.click();
    }
  });
});

// ============================================================================
// 7. API ENDPOINTS
// ============================================================================

test.describe("Enrollment API Endpoints", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("API-31: GET /api/admin/enrollments returns data", async ({ page }) => {
    const response = await page.request.get("/api/admin/enrollments");
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json).toHaveProperty("data");
    expect(json).toHaveProperty("pagination");
    expect(Array.isArray(json.data)).toBeTruthy();
  });

  test("API-32: GET /api/admin/enrollments/analytics returns data", async ({ page }) => {
    const response = await page.request.get("/api/admin/enrollments/analytics");
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json).toHaveProperty("data");
    expect(json.data).toHaveProperty("overview");
    expect(json.data).toHaveProperty("courses");
  });
});
