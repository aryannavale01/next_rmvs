import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Prisma } from "@prisma/client";

const mockGetSession = vi.fn();

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: (...args: unknown[]) => mockGetSession(...args) } },
}));

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/admin-security", () => ({
  STEP_UP_WINDOW_MS: 300_000,
}));

import { requireAuth } from "../lib/session";

function transientError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("test", {
    code,
    clientVersion: "6.19.3",
  });
}

function nonTransientError() {
  return new Error("some other error");
}

const fakeSession = {
  user: { id: "u1", email: "a@b.com", name: "Test", role: "MEMBER" },
  session: { id: "s1", expiresAt: new Date() },
};

beforeEach(() => {
  mockGetSession.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("requireAuth — transient connection retry", () => {
  it("returns session on first success without retrying", async () => {
    mockGetSession.mockResolvedValue(fakeSession);

    const result = await requireAuth(new Headers());

    expect(result.success).toBe(true);
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it("retries once on P1017 and succeeds", async () => {
    mockGetSession
      .mockRejectedValueOnce(transientError("P1017"))
      .mockResolvedValueOnce(fakeSession);

    const promise = requireAuth(new Headers());
    await vi.advanceTimersByTimeAsync(250);
    const result = await promise;

    expect(result.success).toBe(true);
    expect(mockGetSession).toHaveBeenCalledTimes(2);
  });

  it("retries twice on P1017 and succeeds", async () => {
    mockGetSession
      .mockRejectedValueOnce(transientError("P1017"))
      .mockRejectedValueOnce(transientError("P1017"))
      .mockResolvedValueOnce(fakeSession);

    const promise = requireAuth(new Headers());
    await vi.advanceTimersByTimeAsync(250);
    await vi.advanceTimersByTimeAsync(500);
    const result = await promise;

    expect(result.success).toBe(true);
    expect(mockGetSession).toHaveBeenCalledTimes(3);
  });

  it("returns Unauthorized after 3 consecutive transient failures", async () => {
    mockGetSession
      .mockRejectedValueOnce(transientError("P1017"))
      .mockRejectedValueOnce(transientError("P1017"))
      .mockRejectedValueOnce(transientError("P1017"));

    const promise = requireAuth(new Headers());
    await vi.advanceTimersByTimeAsync(250);
    await vi.advanceTimersByTimeAsync(500);
    const result = await promise;

    expect(result.success).toBe(false);
    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockGetSession).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-transient errors", async () => {
    mockGetSession.mockRejectedValueOnce(nonTransientError());

    const result = await requireAuth(new Headers());

    expect(result.success).toBe(false);
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it("retries P1001 and P2024 the same as P1017", async () => {
    for (const code of ["P1001", "P2024"]) {
      mockGetSession.mockReset();
      mockGetSession
        .mockRejectedValueOnce(transientError(code))
        .mockResolvedValueOnce(fakeSession);

      const promise = requireAuth(new Headers());
      await vi.advanceTimersByTimeAsync(250);
      const result = await promise;

      expect(result.success).toBe(true);
      expect(mockGetSession).toHaveBeenCalledTimes(2);
    }
  });

  it("stops retrying if a non-transient error follows a transient one", async () => {
    mockGetSession
      .mockRejectedValueOnce(transientError("P1017"))
      .mockRejectedValueOnce(nonTransientError());

    const promise = requireAuth(new Headers());
    await vi.advanceTimersByTimeAsync(250);
    const result = await promise;

    expect(result.success).toBe(false);
    expect(mockGetSession).toHaveBeenCalledTimes(2);
  });
});
