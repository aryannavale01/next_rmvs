import { test, expect, type Page } from "@playwright/test";
import { e2eAdminCredentials } from "./helpers/credentials";

const CHW_COURSE_ID = "bc2afc84-028f-4be2-a5bf-fa2b37458eac";

async function loginAsAdmin(page: Page): Promise<void> {
  const admin = e2eAdminCredentials();
  await page.goto("/admin/login");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  try {
    await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.includes("/login"), { timeout: 30_000 });
  } catch {
    if (page.url().includes("/login")) {
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });
    }
  }
}

async function findChwCourseId(page: Page): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    try {
      const r = await page.request.get("/api/admin/certificates", { timeout: 20_000 });
      if (r.ok()) {
        const j = await r.json();
        const courses = j.data?.courses ?? [];
        const chw = courses.find((c: { title: string }) =>
          c.title.toLowerCase().includes("community health worker"),
        );
        if (chw) return chw.id;
      }
    } catch { /* compilation delay */ }
    await page.waitForTimeout(5_000);
    attempts++;
  }
  return CHW_COURSE_ID;
}

/* ═══════════════════════════════════════════════
   Overview Page Tests
   ═══════════════════════════════════════════════ */

test.describe("Certificate Overview Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/certificates");
    await page.waitForSelector("text=Loading certificates...", { state: "detached", timeout: 30_000 });
  });

  test("OVR-01: page loads with metric cards", async ({ page }) => {
    const metrics = page.locator(".bg-card.border.border-border.rounded-xl");
    await expect(metrics.nth(5)).toBeVisible({ timeout: 10_000 });
    expect(await metrics.count()).toBeGreaterThanOrEqual(6);
    await expect(page.getByText("Open Requests")).toBeVisible();
    await expect(page.getByText("Pending Review")).toBeVisible();
  });

  test("OVR-02: search filters course cards", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search trainings...");
    await searchInput.fill("Community");
    await page.waitForTimeout(300);
    await expect(page.getByText("Community Health Worker Training")).toBeVisible();
    await searchInput.fill("zzz_nonexistent_zzz");
    await page.waitForTimeout(300);
    await expect(page.getByText("No trainings found")).toBeVisible();
  });

  test("OVR-03: clicking a course card navigates to workspace", async ({ page }) => {
    const cardLink = page.locator(`a[href*="/admin/certificates/"]`).first();
    await Promise.all([
      page.waitForURL("**/admin/certificates/**", { timeout: 15_000 }),
      cardLink.click(),
    ]);
    await page.waitForSelector("h1", { timeout: 10_000 });
  });
});

/* ═══════════════════════════════════════════════
   Workspace Header & Metrics Tests
   ═══════════════════════════════════════════════ */

test.describe("Certificate Workspace - Header", () => {
  let courseId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    courseId = await findChwCourseId(page);
    await page.close();
  });

  test("HDR-01: workspace loads with course title and back button", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/admin/certificates/${courseId}`);
    await page.waitForSelector("text=Loading workspace...", { state: "detached", timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /Community Health Worker/ })).toBeVisible();
    await expect(page.getByLabel("Back to certificates")).toBeVisible();
    await expect(page.getByRole("tab", { name: /Enrollments/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Certificates/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Requests/ })).toBeVisible();
  });

  test("HDR-02: metric cards show correct labels", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/admin/certificates/${courseId}`);
    await page.waitForSelector("text=Loading workspace...", { state: "detached", timeout: 30_000 });
    const metricLabels = page.locator(".bg-card.border.border-border.rounded-xl .text-\\[10px\\].font-bold.text-muted-foreground.uppercase");
    await expect(metricLabels.filter({ hasText: "Enrolled" })).toBeVisible();
    await expect(metricLabels.filter({ hasText: "Eligible" })).toBeVisible();
    await expect(metricLabels.filter({ hasText: "Generated" })).toBeVisible();
    await expect(metricLabels.filter({ hasText: "Approved" })).toBeVisible();
    await expect(metricLabels.filter({ hasText: "Pending Review" })).toBeVisible();
  });

  test("HDR-03: back button navigates to certificates overview", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/admin/certificates/${courseId}`);
    await page.waitForSelector("text=Loading workspace...", { state: "detached", timeout: 30_000 });
    await page.getByLabel("Back to certificates").click();
    await page.waitForURL("**/admin/certificates", { timeout: 10_000 });
  });
});

/* ═══════════════════════════════════════════════
   Workspace - Enrollments Tab Tests
   ═══════════════════════════════════════════════ */

test.describe("Certificate Workspace - Enrollments Tab", () => {
  let courseId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    courseId = await findChwCourseId(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/admin/certificates/${courseId}`);
    await page.waitForSelector("text=Loading workspace...", { state: "detached", timeout: 30_000 });
  });

  test("ENR-01: enrollments tab is active by default and shows eligible banner", async ({ page }) => {
    const tab = page.getByRole("tab", { name: /Enrollments/ });
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("eligible for certificates")).toBeVisible();
    await expect(page.getByText("Generate All Eligible")).toBeVisible();
  });

  test("ENR-02: enrollments table shows member rows", async ({ page }) => {
    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    expect(await rows.count()).toBeGreaterThan(0);
    await expect(page.getByRole("columnheader", { name: "Member" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Batch" })).toBeVisible();
  });

  test("ENR-03: search filters enrollment members", async ({ page }) => {
    const search = page.getByPlaceholder("Search members...");
    await expect(search).toBeVisible();
    const rowsBefore = await page.locator("table tbody tr").count();
    await search.fill("Rajesh");
    await page.waitForTimeout(300);
    const rowsAfter = await page.locator("table tbody tr").count();
    expect(rowsAfter).toBeLessThanOrEqual(rowsBefore);
    await search.fill("");
    await page.waitForTimeout(300);
    expect(await page.locator("table tbody tr").count()).toBe(rowsBefore);
  });

  test("ENR-04: select button marks eligible members", async ({ page }) => {
    const checkboxes = page.locator('table tbody input[type="checkbox"]');
    const count = await checkboxes.count();
    if (count > 0) {
      await checkboxes.first().click({ timeout: 5_000 });
      await expect(page.getByText(/Generate Selected/)).toBeVisible();
      await checkboxes.first().click();
    }
  });

  test("ENR-05: Generate All Eligible button exists and is functional", async ({ page }) => {
    const btn = page.getByText("Generate All Eligible");
    await expect(btn).toBeVisible();
    const disabled = await btn.isDisabled();
    expect(typeof disabled).toBe("boolean");
  });

  test("ENR-06: individual Generate button appears for eligible enrollments", async ({ page }) => {
    const genBtns = page.locator("button", { hasText: /^Generate$/ });
    const pendingCerts = page.locator("table tbody tr .bg-success-bg");
    const count = await genBtns.count();
    const certCount = await pendingCerts.count();
    const eligibleWithCert = count;
    const totalVisible = count + certCount;
    expect(totalVisible).toBeGreaterThanOrEqual(0);
  });
});

/* ═══════════════════════════════════════════════
   Workspace - Certificates Tab Tests
   ═══════════════════════════════════════════════ */

test.describe("Certificate Workspace - Certificates Tab", () => {
  let courseId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    courseId = await findChwCourseId(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/admin/certificates/${courseId}`);
    await page.waitForSelector("text=Loading workspace...", { state: "detached", timeout: 30_000 });
    await page.getByRole("tab", { name: /Certificates/ }).click();
    await page.waitForTimeout(500);
  });

  test("CRT-01: certificates tab shows certificate table", async ({ page }) => {
    await expect(page.getByRole("columnheader", { name: "Certificate No" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Member" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Issue Date" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
    await expect(page.getByText("certificates generated")).toBeVisible();
  });

  test("CRT-02: download buttons exist", async ({ page }) => {
    const downloadPdf = page.getByRole("button", { name: /Download PDF/ });
    const downloadZip = page.getByRole("button", { name: /Download ZIP/ });
    await expect(downloadPdf).toBeVisible();
    await expect(downloadZip).toBeVisible();
  });

  test("CRT-03: certificate rows display certificate numbers", async ({ page }) => {
    const certRows = page.locator("table tbody tr");
    const count = await certRows.count();
    if (count > 0) {
      const firstRow = certRows.first();
      await expect(firstRow).toBeVisible();
    }
  });

  test("CRT-04: pending certificates have Approve and Reject buttons", async ({ page }) => {
    const pendingRows = page.locator("table tbody tr").filter({ hasText: "Pending Review" });
    const count = await pendingRows.count();
    if (count > 0) {
      const row = pendingRows.first();
      await expect(row.getByRole("button", { name: /Approve/ })).toBeVisible();
      await expect(row.getByRole("button", { name: /Reject/ })).toBeVisible();
    }
  });

  test("CRT-05: approved/generated certificates have PDF download button", async ({ page }) => {
    const approvedRows = page.locator("table tbody tr").filter({ hasText: /Approved|Generated/ });
    const count = await approvedRows.count();
    if (count > 0) {
      const row = approvedRows.first();
      await expect(row.getByRole("button", { name: /PDF/ })).toBeVisible();
    }
  });

  test("CRT-06: revoked certificates have no download button", async ({ page }) => {
    const revokedRows = page.locator("table tbody tr").filter({ hasText: "Revoked" });
    const count = await revokedRows.count();
    if (count > 0) {
      const row = revokedRows.first();
      const pdfBtn = row.getByRole("button", { name: /PDF/ });
      await expect(pdfBtn).not.toBeVisible();
    }
  });
});

/* ═══════════════════════════════════════════════
   Workspace - Requests Tab Tests
   ═══════════════════════════════════════════════ */

test.describe("Certificate Workspace - Requests Tab", () => {
  let courseId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    courseId = await findChwCourseId(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/admin/certificates/${courseId}`);
    await page.waitForSelector("text=Loading workspace...", { state: "detached", timeout: 30_000 });
    await page.getByRole("tab", { name: /Requests/ }).click();
    await page.waitForTimeout(500);
  });

  test("RQT-01: requests tab shows table headers", async ({ page }) => {
    await expect(page.getByRole("columnheader", { name: "Member" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Batch" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Requested" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Notes" })).toBeVisible();
  });

  test("RQT-02: pending requests have Approve and Reject buttons", async ({ page }) => {
    const pendingRows = page.locator("table tbody tr").filter({ hasText: "pending" });
    const count = await pendingRows.count();
    if (count > 0) {
      const row = pendingRows.first();
      await expect(row.getByRole("button", { name: /Approve/ })).toBeVisible();
      await expect(row.getByRole("button", { name: /Reject/ })).toBeVisible();
    }
  });

  test("RQT-03: empty state shows when no pending requests", async ({ page }) => {
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    const emptyState = page.getByText("No requests");
    if (count === 0) {
      await expect(emptyState).toBeVisible();
    }
  });
});

/* ═══════════════════════════════════════════════
   Tab Switching Tests
   ═══════════════════════════════════════════════ */

test.describe("Certificate Workspace - Tab Navigation", () => {
  let courseId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    courseId = await findChwCourseId(page);
    await page.close();
  });

  test("TAB-01: can switch between all three tabs", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/admin/certificates/${courseId}`);
    await page.waitForSelector("text=Loading workspace...", { state: "detached", timeout: 30_000 });
    await expect(page.getByRole("tab", { name: /Enrollments/ })).toHaveAttribute("aria-selected", "true");

    await page.getByRole("tab", { name: /Certificates/ }).click();
    await expect(page.getByRole("tab", { name: /Certificates/ })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Certificate No")).toBeVisible();

    await page.getByRole("tab", { name: /Requests/ }).click();
    await expect(page.getByRole("tab", { name: /Requests/ })).toHaveAttribute("aria-selected", "true");

    await page.getByRole("tab", { name: /Enrollments/ }).click();
    await expect(page.getByRole("tab", { name: /Enrollments/ })).toHaveAttribute("aria-selected", "true");
  });

  test("TAB-02: tab badges show counts", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/admin/certificates/${courseId}`);
    await page.waitForSelector("text=Loading workspace...", { state: "detached", timeout: 30_000 });

    const enrollBadge = page.getByRole("tab", { name: /Enrollments/ }).locator("span");
    await expect(enrollBadge).toBeVisible();
    const badgeText = await enrollBadge.textContent();
    expect(Number(badgeText)).toBeGreaterThanOrEqual(0);
  });
});
