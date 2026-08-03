import { test, expect, type Browser, type Page } from "@playwright/test";
import { e2eAdminCredentials } from "./helpers/credentials";

// ============================================================================
// STEP-UP REGRESSION — gated admin actions require a recent re-authentication.
// Guards against the step-up control silently regressing (e.g. reverting to a
// plain requireAdmin() or the 403 contract changing).
//
// Each test starts from a FRESH admin session (Playwright isolates contexts per
// test), so stepUpVerifiedAt is always null when the first gated call happens.
// ============================================================================

const CHW_TITLE = /Community Health Worker/i;

async function loginAsAdmin(page: Page): Promise<void> {
  const admin = e2eAdminCredentials();
  await page.goto("/admin/login");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  // NOTE: do not match "/admin/**" — the login page itself is /admin/login.
  await page.waitForURL("**/admin", { timeout: 30_000 });
}

async function verifyStepUp(page: Page): Promise<void> {
  const admin = e2eAdminCredentials();
  const res = await page.request.post("/api/admin/verify-stepup", {
    data: { password: admin.password },
  });
  expect(res.status(), "step-up verification should succeed").toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);
}

async function expectStepUpRequired(res: { status(): number; json(): Promise<Record<string, unknown>> }): Promise<void> {
  expect(res.status(), "gated action must be rejected before step-up").toBe(403);
  const body = await res.json();
  expect(body.error).toBe("STEP_UP_REQUIRED");
}

async function findChwCourseId(page: Page): Promise<string> {
  const res = await page.request.get("/api/admin/enrollments/analytics");
  expect(res.status()).toBe(200);
  const json = await res.json();
  const course = (json.data?.courses ?? []).find((c: { title?: string }) => CHW_TITLE.test(c.title ?? ""));
  expect(course, "Community Health Worker course should exist in analytics data").toBeTruthy();
  return course.id;
}

test.describe("Step-up: member delete", () => {
  test("delete is blocked before step-up and succeeds after verification", async ({ page }) => {
    test.setTimeout(150_000);
    const email = `e2e-stepup-delete-${Date.now()}@example.com`;

    await loginAsAdmin(page);

    // Create a disposable member (returns a temporary password, unused here).
    const createRes = await page.request.post("/api/admin/members", {
      data: { fullName: "E2E StepUp Delete", email },
    });
    expect(createRes.status(), "creating the disposable member should succeed").toBe(201);
    const created = await createRes.json();
    const memberId = created.id as string;
    expect(memberId).toBeTruthy();

    // 1) Attempt the gated delete BEFORE step-up -> must be blocked.
    await expectStepUpRequired(
      await page.request.patch(`/api/admin/members/${memberId}/delete`, { data: {} }),
    );

    // Verify nothing was deleted while blocked.
    const getAfterBlock = await page.request.get("/api/admin/members?search=" + encodeURIComponent(email));
    expect(getAfterBlock.status()).toBe(200);
    const listBody = await getAfterBlock.json();
    const stillActive = (listBody.data ?? []).find((m: { email?: string }) => m.email === email);
    expect(stillActive, "member must still exist while blocked").toBeTruthy();
    expect(stillActive.status).not.toBe("deleted");

    // 2) Complete step-up.
    await verifyStepUp(page);

    // 3) The same action now succeeds.
    const allowed = await page.request.patch(`/api/admin/members/${memberId}/delete`, { data: {} });
    expect(allowed.status(), "delete should succeed after step-up").toBe(200);
    const allowedBody = await allowed.json();
    expect(allowedBody.status).toBe("deleted");
  });
});

test.describe("Step-up: enrollment approve", () => {
  test("approve is blocked before step-up and succeeds after verification", async ({ page, browser }) => {
    test.setTimeout(150_000);
    const admin = e2eAdminCredentials();
    const memberEmail = `e2e-stepup-app-${Date.now()}@example.com`;

    await loginAsAdmin(page);
    const courseId = await findChwCourseId(page);

    // Create a disposable member + application.
    const createRes = await page.request.post("/api/admin/members", {
      data: { fullName: "E2E StepUp Apply", email: memberEmail },
    });
    expect(createRes.status()).toBe(201);
    const member = await createRes.json();
    const memberPassword = member.temporaryPassword as string;
    const memberId = member.id as string;
    expect(memberPassword).toBeTruthy();

    // Login as the member in a separate context and submit an application.
    const memberContext = await browser.newContext();
    try {
      const memberPage = await memberContext.newPage();
      await memberPage.goto("/login");
      await memberPage.fill("#email", memberEmail);
      await memberPage.fill("#password", memberPassword);
      await memberPage.getByRole("button", { name: /sign in/i }).click();
      await memberPage.waitForURL("**/dashboard", { timeout: 15_000 });

      const applyRes = await memberPage.request.post("/api/applications", {
        data: { courseId },
      });
      expect(applyRes.status(), "member apply should succeed").toBe(201);
      const applyBody = await applyRes.json();
      expect(applyBody.application?.status).toBe("pending");
    } finally {
      await memberContext.close();
    }

    // Re-fetch the application id through the admin context (fresh session).
    const listRes = await page.request.get(
      `/api/admin/enrollments?courseId=${courseId}&status=pending&limit=50`,
    );
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    const app = (listBody.data ?? []).find((a: { member?: { email?: string } }) =>
      a.member?.email === memberEmail,
    );
    expect(app, "freshly applied application should be visible to admin").toBeTruthy();

    // 1) Attempt approve BEFORE step-up -> blocked, status unchanged.
    const appId = app.id as string;
    await expectStepUpRequired(
      await page.request.patch(`/api/admin/enrollments/${appId}`, { data: { status: "seat_reserved" } }),
    );

    const afterBlock = await page.request.get(`/api/admin/enrollments/${appId}`);
    expect(afterBlock.status()).toBe(200);
    const afterBlockBody = await afterBlock.json();
    expect(afterBlockBody.data.status, "application must remain pending while blocked").toBe("pending");

    // 2) Complete step-up.
    await verifyStepUp(page);

    // 3) Approve now succeeds.
    const allowed = await page.request.patch(`/api/admin/enrollments/${appId}`, {
      data: { status: "seat_reserved" },
    });
    expect(allowed.status(), "approve should succeed after step-up").toBe(200);

    const afterAllowed = await page.request.get(`/api/admin/enrollments/${appId}`);
    const afterAllowedBody = await afterAllowed.json();
    expect(afterAllowedBody.data.status, "application should be approved after step-up").toBe("seat_reserved");

    // Leave the disposable member soft-orphaned; it is harmless test data.
    await page.request.patch(`/api/admin/members/${memberId}/delete`, { data: {} });
  });
});
