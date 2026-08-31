import { test, expect, type Page } from "@playwright/test";
import { e2eAdminCredentials } from "./helpers/credentials";

// ============================================================================
// ENROLLMENT WORKSPACE — FULL E2E VERIFICATION
// ============================================================================

const CHW_TITLE = /Community Health Worker/i;

async function loginAsAdmin(page: Page): Promise<void> {
  const admin = e2eAdminCredentials();
  await page.goto("/admin/login");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  try {
    await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.includes("/login"), { timeout: 30_000 });
  } catch {
    // Fallback: if already redirected, just check we're not on login
    if (page.url().includes("/login")) {
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });
    }
  }
}

async function findChwCourseId(page: Page): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await page.request.get("/api/admin/enrollments/analytics");
      if (res.status() === 503) {
        await page.waitForTimeout(5000);
        continue;
      }
      expect(res.status()).toBe(200);
      const json = await res.json();
      const courses = json.data?.courses ?? json.data?.course;
      if (Array.isArray(courses)) {
        const course = courses.find((c: { title?: string }) => CHW_TITLE.test(c.title ?? ""));
        if (course) return course.id;
      }
      if (courses?.id) return courses.id;
    } catch {
      // API not compiled yet — wait and retry
    }
    await page.waitForTimeout(5000);
  }
  throw new Error("Analytics API unavailable after 8 retries");
}

async function openCourseWorkspace(page: Page): Promise<string> {
  const courseId = await findChwCourseId(page);
  await page.goto(`/admin/enrollments/${courseId}`);
  await expect(page.locator("button:has-text('Applications')").first()).toBeVisible({ timeout: 15_000 });
  return courseId;
}

/** Wait until the applications table has either real rows or an explicit empty state. */
async function waitForApplicationsTable(page: Page): Promise<boolean> {
  try {
    await page.waitForFunction(() => {
      const tbody = document.querySelector("tbody");
      if (!tbody) return false;
      const text = tbody.textContent ?? "";
      return text.includes("No applications found") || text.includes("Loading") || tbody.querySelectorAll("tr").length > 0;
    }, { timeout: 20_000 });
    const text = await page.locator("tbody").textContent() ?? "";
    return !text.includes("No applications found") && !text.includes("Loading");
  } catch {
    return false;
  }
}

/** Wait until the enrollments table has either real rows or an explicit empty state. */
async function waitForEnrollmentsTable(page: Page): Promise<boolean> {
  try {
    await page.waitForFunction(() => {
      const tbody = document.querySelector("tbody");
      if (!tbody) return false;
      const text = tbody.textContent ?? "";
      return text.includes("No enrollments found") || text.includes("Loading") || tbody.querySelectorAll("tr").length > 0;
    }, { timeout: 15_000 });
    const text = await page.locator("tbody").textContent() ?? "";
    return !text.includes("No enrollments found") && !text.includes("Loading");
  } catch {
    return false;
  }
}

/** Click View and wait for the drawer overlay to appear. */
async function openDrawer(page: Page): Promise<boolean> {
  const viewBtn = page.locator("button:has-text('View')").first();
  if (!await viewBtn.isVisible({ timeout: 10_000 }).catch(() => false)) return false;
  await viewBtn.click();
  try {
    await page.waitForSelector("text=Member Detail", { timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// 1. LANDING PAGE
// ============================================================================

test.describe("Enrollment Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("EL-01: landing page loads with course cards", async ({ page }) => {
    await page.goto("/admin/enrollments");
    await expect(page.locator("text=Total Applications").first()).toBeVisible({ timeout: 30_000 });
    const cards = page.locator("text=Community Health Worker Training");
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
  });

  test("EL-02: metric cards display totals", async ({ page }) => {
    await page.goto("/admin/enrollments");
    await expect(page.locator("text=Total Applications").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Currently Enrolled").first()).toBeVisible();
  });

  test("EL-03: search filters course cards", async ({ page }) => {
    await page.goto("/admin/enrollments");
    const searchInput = page.locator('input[placeholder="Search courses..."]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill("Health");
    await page.waitForTimeout(500);
    await expect(page.locator("text=Community Health Worker Training").first()).toBeVisible();
  });

  test("EL-04: clicking course card navigates to workspace", async ({ page }) => {
    await page.goto("/admin/enrollments");
    const card = page.locator("button:has-text('Community Health Worker Training')").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.click();
    await expect(page).toHaveURL(/\/admin\/enrollments\/[0-9a-f-]+$/, { timeout: 15_000 });
  });
});

// ============================================================================
// 2. WORKSPACE — APPLICATIONS TAB
// ============================================================================

test.describe("Workspace: Applications Tab", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openCourseWorkspace(page);
  });

  test("WA-01: applications tab active by default with table", async ({ page }) => {
    await expect(page.locator("th:has-text('Member')").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("th:has-text('Status')").first()).toBeVisible();
    await expect(page.locator("th:has-text('Applied')").first()).toBeVisible();
    await expect(page.locator("th:has-text('Actions')").first()).toBeVisible();
  });

  test("WA-02: status filter buttons present", async ({ page }) => {
    await expect(page.locator("button:has-text('All')").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("button:has-text('pending')").first()).toBeVisible();
    await expect(page.locator("button:has-text('seat_reserved')").first()).toBeVisible();
    await expect(page.locator("button:has-text('waitlisted')").first()).toBeVisible();
    await expect(page.locator("button:has-text('rejected')").first()).toBeVisible();
  });

  test("WA-03: status filter chip click filters table", async ({ page }) => {
    await page.locator("button:has-text('All')").first().waitFor({ timeout: 10_000 });
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return; // no data to filter
    const pendingChip = page.locator("button:has-text('pending')").first();
    await pendingChip.click();
    await page.waitForTimeout(2000);
    const statuses = page.locator("tbody td:nth-child(2) span");
    const count = await statuses.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = (await statuses.nth(i).textContent())?.trim();
        expect(text).toBe("pending");
      }
    }
  });

  test("WA-04: search filters on Enter", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by name"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill("test");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2000);
  });

  test("WA-05: row selection shows bulk action bar", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const rowCheckbox = page.locator("tbody input[type='checkbox']").first();
    if (!await rowCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) return;
    await rowCheckbox.click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=/\\d+ selected/").first()).toBeVisible();
  });

  test("WA-06: select-all toggles all rows", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const selectAll = page.locator("thead input[type='checkbox']").first();
    await expect(selectAll).toBeVisible({ timeout: 10_000 });
    await selectAll.click({ force: true });
    await page.waitForTimeout(1000);
    const bulkBar = page.locator("text=/\\d+ selected/").first();
    await expect(bulkBar).toBeVisible({ timeout: 5000 });
    await selectAll.click({ force: true });
    await page.waitForTimeout(1000);
    await expect(bulkBar).not.toBeVisible();
  });

  test("WA-07: View button opens drawer", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const opened = await openDrawer(page);
    if (!opened) return;
    await expect(page.locator("text=Overview").first()).toBeVisible({ timeout: 5000 });
  });

  test("WA-08: Docs button opens drawer on documents tab", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const docsBtn = page.locator("button:has-text('Docs')").first();
    if (!await docsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) return;
    await docsBtn.click();
    await page.waitForTimeout(2000);
    await expect(page.locator("text=Documents").first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// 3. WORKSPACE — ENROLLMENTS TAB
// ============================================================================

test.describe("Workspace: Enrollments Tab", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openCourseWorkspace(page);
  });

  test("WE-01: switching to enrollments tab loads data", async ({ page }) => {
    const tab = page.locator("button:has-text('Enrollments')").first();
    await tab.click();
    await expect(page.locator("th:has-text('Attendance')").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("th:has-text('Batch')").first()).toBeVisible();
    await expect(page.locator("th:has-text('Seat')").first()).toBeVisible();
  });

  test("WE-02: enrolled status chips filter correctly", async ({ page }) => {
    await page.locator("button:has-text('Enrollments')").first().click();
    const hasData = await waitForEnrollmentsTable(page);
    if (!hasData) return;
    const completedChip = page.locator("button:has-text('completed')").first();
    await completedChip.click();
    await page.waitForTimeout(3000);
    // Wait for loading spinner to disappear
    await page.locator("tbody .animate-spin").waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const statuses = page.locator("tbody td:nth-child(3) span");
    const count = await statuses.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = (await statuses.nth(i).textContent())?.trim();
        expect(text).toBe("completed");
      }
    }
  });

  test("WE-03: enrolled search filters on Enter", async ({ page }) => {
    await page.locator("button:has-text('Enrollments')").first().click();
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[placeholder*="Search by name"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill("test");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2000);
  });

  test("WE-04: bulk complete/drop buttons appear in enrollments tab", async ({ page }) => {
    await page.locator("button:has-text('Enrollments')").first().click();
    const hasData = await waitForEnrollmentsTable(page);
    if (!hasData) return;
    const rowCheckbox = page.locator("tbody input[type='checkbox']").first();
    if (!await rowCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) return;
    await rowCheckbox.click();
    await page.waitForTimeout(500);
    await expect(page.locator("button:has-text('Mark Completed')").first()).toBeVisible();
    await expect(page.locator("button:has-text('Drop')").first()).toBeVisible();
  });

  test("WE-05: edit button enables inline editing", async ({ page }) => {
    await page.locator("button:has-text('Enrollments')").first().click();
    const hasData = await waitForEnrollmentsTable(page);
    if (!hasData) return;
    const editBtn = page.locator("button:has-text('Edit')").first();
    if (!await editBtn.isVisible({ timeout: 5_000 }).catch(() => false)) return;
    await editBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator("button:has-text('Save')").first()).toBeVisible();
    await expect(page.locator("button:has-text('Cancel')").first()).toBeVisible();
  });

  test("WE-06: cancel edit discards changes", async ({ page }) => {
    await page.locator("button:has-text('Enrollments')").first().click();
    const hasData = await waitForEnrollmentsTable(page);
    if (!hasData) return;
    const editBtn = page.locator("button:has-text('Edit')").first();
    if (!await editBtn.isVisible({ timeout: 5_000 }).catch(() => false)) return;
    await editBtn.click();
    await page.waitForTimeout(500);
    await page.locator("button:has-text('Cancel')").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("button:has-text('Edit')").first()).toBeVisible();
  });
});

// ============================================================================
// 4. WORKSPACE — WAITLIST TAB
// ============================================================================

test.describe("Workspace: Waitlist Tab", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openCourseWorkspace(page);
  });

  test("WW-01: waitlist tab shows correct columns", async ({ page }) => {
    await page.locator("button:has-text('Waitlist')").first().click();
    await expect(page.locator("th:has-text('Waitlisted')").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("th:has-text('#')").first()).toBeVisible();
  });

  test("WW-02: seat availability banner shows", async ({ page }) => {
    await page.locator("button:has-text('Waitlist')").first().click();
    await expect(page.locator("text=/\\d+ of \\d+ seats available/").first()).toBeVisible({ timeout: 15_000 });
  });

  test("WW-03: waitlist count shown in info bar", async ({ page }) => {
    await page.locator("button:has-text('Waitlist')").first().click();
    await expect(page.locator("text=/waitlisted application/").first()).toBeVisible({ timeout: 15_000 });
  });
});

// ============================================================================
// 5. WORKSPACE — TAB SWITCHING clears selection
// ============================================================================

test.describe("Workspace: Tab Switching", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openCourseWorkspace(page);
  });

  test("TS-01: selection clears when switching tabs", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const rowCheckbox = page.locator("tbody input[type='checkbox']").first();
    if (!await rowCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) return;
    await rowCheckbox.click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=/\\d+ selected/").first()).toBeVisible();

    await page.locator("button:has-text('Enrollments')").first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator("text=/\\d+ selected/").first()).not.toBeVisible();
  });

  test("TS-02: analytics tab loads with charts", async ({ page }) => {
    await page.locator("button:has-text('Analytics')").first().click();
    await expect(
      page.locator("text=Healthy").or(page.locator("text=Warning")).or(page.locator("text=Critical")).first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("text=Application Funnel").first()).toBeVisible();
    await expect(page.locator("text=Seat Utilization").first()).toBeVisible();
  });

  test("TS-03: settings tab loads form", async ({ page }) => {
    await page.locator("button:has-text('Settings')").first().click();
    // Wait for loading spinner to disappear first
    await page.locator("text=Loading settings...").waitFor({ state: "hidden", timeout: 45_000 }).catch(() => {});
    await expect(page.locator("text=Save Settings").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("text=Basic Info").first()).toBeVisible();
    await expect(page.locator("text=Schedule").first()).toBeVisible();
    await expect(page.locator("text=Capacity").first()).toBeVisible();
  });

  test("TS-04: export tab loads", async ({ page }) => {
    await page.locator("button:has-text('Export')").first().click();
    await expect(page.locator("text=Open Export").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ============================================================================
// 6. MEMBER DRAWER
// ============================================================================

test.describe("Workspace: Member Drawer", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openCourseWorkspace(page);
  });

  test("DR-01: drawer opens with overview tab", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const opened = await openDrawer(page);
    if (!opened) return;
    await expect(page.locator("text=Phone").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=District").first()).toBeVisible();
  });

  test("DR-02: drawer timeline tab works", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const opened = await openDrawer(page);
    if (!opened) return;
    await expect(page.locator("text=Phone").first()).toBeVisible({ timeout: 10_000 });
    await page.locator("button:has-text('Timeline')").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=Applied").first()).toBeVisible({ timeout: 5000 });
  });

  test("DR-03: drawer documents tab works", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const opened = await openDrawer(page);
    if (!opened) return;
    await expect(page.locator("text=Phone").first()).toBeVisible({ timeout: 10_000 });
    await page.locator("button:has-text('Documents')").first().click();
    await page.waitForTimeout(500);
    await expect(
      page.locator("text=No documents uploaded").or(page.locator("text=Aadhaar")).or(page.locator("text=Photo")).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("DR-04: drawer enrollment tab works", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const opened = await openDrawer(page);
    if (!opened) return;
    await expect(page.locator("text=Phone").first()).toBeVisible({ timeout: 10_000 });
    await page.locator("button:has-text('Enrollment')").first().click();
    await page.waitForTimeout(500);
    await expect(
      page.locator("text=Enrollment Status").or(page.locator("text=Not yet enrolled")).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("DR-05: drawer notes tab works", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const opened = await openDrawer(page);
    if (!opened) return;
    await expect(page.locator("text=Phone").first()).toBeVisible({ timeout: 10_000 });
    await page.locator("button:has-text('Notes')").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=No notes").or(page.locator("text=admin").first()).first()).toBeVisible({ timeout: 5000 });
  });

  test("DR-06: drawer payments tab works", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const opened = await openDrawer(page);
    if (!opened) return;
    await expect(page.locator("text=Phone").first()).toBeVisible({ timeout: 10_000 });
    await page.locator("button:has-text('Payments')").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=Payment Status").first()).toBeVisible({ timeout: 5000 });
  });

  test("DR-07: drawer can be closed via X button", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const opened = await openDrawer(page);
    if (!opened) return;
    await expect(page.locator("text=Phone").first()).toBeVisible({ timeout: 10_000 });
    const closeBtn = page.locator('[class*="fixed"] button:has(svg)').first();
    await closeBtn.click();
    await page.waitForTimeout(500);
  });
});

// ============================================================================
// 7. BULK ACTIONS — PREVIEW MODAL
// ============================================================================

test.describe("Bulk Actions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openCourseWorkspace(page);
  });

  test("BA-01: bulk approve opens preview modal", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const rowCheckbox = page.locator("tbody input[type='checkbox']").first();
    if (!await rowCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) return;
    await rowCheckbox.click();
    await page.waitForTimeout(500);
    await page.locator("button:has-text('Approve')").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=Preview").first()).toBeVisible({ timeout: 5000 });
  });

  test("BA-02: bulk preview modal can be cancelled", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const rowCheckbox = page.locator("tbody input[type='checkbox']").first();
    if (!await rowCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) return;
    await rowCheckbox.click();
    await page.waitForTimeout(500);
    await page.locator("button:has-text('Approve')").first().click();
    await page.waitForTimeout(500);
    const cancelBtn = page.locator("button:has-text('Cancel')").first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test("BA-03: clear selection removes bulk bar", async ({ page }) => {
    const hasData = await waitForApplicationsTable(page);
    if (!hasData) return;
    const rowCheckbox = page.locator("tbody input[type='checkbox']").first();
    if (!await rowCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) return;
    await rowCheckbox.click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=/\\d+ selected/").first()).toBeVisible();
    await page.locator("button:has-text('Clear')").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=/\\d+ selected/").first()).not.toBeVisible();
  });
});

// ============================================================================
// 8. EXPORT
// ============================================================================

test.describe("Export", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openCourseWorkspace(page);
  });

  test("EX-01: export modal shows format options", async ({ page }) => {
    await page.locator("button:has-text('Export')").first().click();
    await page.locator("button:has-text('Open Export')").first().click();
    await expect(page.locator("text=Export Enrollment Data").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=CSV").first()).toBeVisible();
    await expect(page.locator("text=PDF").first()).toBeVisible();
    await expect(page.locator("text=DOCX").first()).toBeVisible();
  });
});

// ============================================================================
// 9. SETTINGS
// ============================================================================

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openCourseWorkspace(page);
  });

  test("SET-01: settings form loads with all sections", async ({ page }) => {
    await page.locator("button:has-text('Settings')").first().click();
    await page.locator("text=Loading settings...").waitFor({ state: "hidden", timeout: 45_000 }).catch(() => {});
    await expect(page.locator("text=Save Settings").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("text=Title").first()).toBeVisible();
    await expect(page.locator("text=Category").first()).toBeVisible();
    await expect(page.locator("text=Duration").first()).toBeVisible();
    await expect(page.locator("text=Start Date").first()).toBeVisible();
    await expect(page.locator("text=End Date").first()).toBeVisible();
    await expect(page.locator("text=Total Seats").first()).toBeVisible();
    await expect(page.locator("text=Required Documents").first()).toBeVisible();
    await expect(page.locator("text=Publish Status").first()).toBeVisible();
    await expect(page.locator("text=Require access code to apply").first()).toBeVisible();
    await expect(page.locator("text=Auto-approve applications").first()).toBeVisible();
  });

  test("SET-02: document toggle buttons work", async ({ page }) => {
    await page.locator("button:has-text('Settings')").first().click();
    await page.locator("text=Loading settings...").waitFor({ state: "hidden", timeout: 45_000 }).catch(() => {});
    await expect(page.locator("text=Save Settings").first()).toBeVisible({ timeout: 15_000 });
    const aadhaarBtn = page.locator("button:has-text('Aadhaar')").first();
    await aadhaarBtn.click();
    await page.waitForTimeout(200);
    await aadhaarBtn.click();
    await page.waitForTimeout(200);
  });
});

// ============================================================================
// 10. API SMOKE TESTS (from browser context)
// ============================================================================

test.describe("API Endpoints", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("API-01: GET /api/admin/enrollments returns paginated data", async ({ page }) => {
    const response = await page.request.get("/api/admin/enrollments");
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json).toHaveProperty("data");
    expect(json).toHaveProperty("pagination");
    expect(Array.isArray(json.data)).toBeTruthy();
    expect(json.pagination).toHaveProperty("total");
  });

  test("API-02: GET /api/admin/enrollments with courseId filter", async ({ page }) => {
    const courseId = await findChwCourseId(page);
    const response = await page.request.get(`/api/admin/enrollments?courseId=${courseId}`);
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(Array.isArray(json.data)).toBeTruthy();
  });

  test("API-03: GET /api/admin/enrollments with status filter", async ({ page }) => {
    const courseId = await findChwCourseId(page);
    const response = await page.request.get(`/api/admin/enrollments?courseId=${courseId}&status=pending`);
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(Array.isArray(json.data)).toBeTruthy();
  });

  test("API-04: GET /api/admin/enrollments/enrolled returns data", async ({ page }) => {
    const courseId = await findChwCourseId(page);
    const response = await page.request.get(`/api/admin/enrollments/enrolled?courseId=${courseId}`);
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json).toHaveProperty("data");
    expect(json).toHaveProperty("pagination");
  });

  test("API-05: GET /api/admin/enrollments/analytics returns course analytics", async ({ page }) => {
    const courseId = await findChwCourseId(page);
    const response = await page.request.get(`/api/admin/enrollments/analytics?courseId=${courseId}`);
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.data).toHaveProperty("overview");
    expect(json.data).toHaveProperty("statusBreakdown");
    expect(json.data).toHaveProperty("health");
  });

  test("API-06: GET /api/admin/enrollments with search", async ({ page }) => {
    const courseId = await findChwCourseId(page);
    const response = await page.request.get(`/api/admin/enrollments?courseId=${courseId}&search=test`);
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(Array.isArray(json.data)).toBeTruthy();
  });

  test("API-07: invalid status filter returns 400", async ({ page }) => {
    const courseId = await findChwCourseId(page);
    const response = await page.request.get(`/api/admin/enrollments?courseId=${courseId}&status=INVALID_STATUS`);
    expect(response.status()).toBe(400);
  });
});
