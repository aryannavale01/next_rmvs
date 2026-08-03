import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Prisma } from "@prisma/client";

const mockGetSession = vi.fn();

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: (...args: unknown[]) => mockGetSession(...args) } },
}));

vi.mock("@/lib/prisma", () => {
  const TRANSIENT = new Set(["P1001", "P1017", "P2024", "P2037"]);
  const isTransient = (error: unknown) =>
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    TRANSIENT.has((error as { code: string }).code);
  return {
    prisma: {},
    isTransientPrismaError: (error: unknown) => isTransient(error),
    withRetry: async <T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> => {
      let lastError: unknown;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error;
          if (isTransient(error) && attempt < maxAttempts) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw error;
        }
      }
      throw lastError;
    },
  };
});
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
    await vi.advanceTimersByTimeAsync(1000);
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
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result.success).toBe(true);
    expect(mockGetSession).toHaveBeenCalledTimes(3);
  });

  it("returns DATABASE_UNAVAILABLE after 3 consecutive transient failures", async () => {
    mockGetSession
      .mockRejectedValueOnce(transientError("P1017"))
      .mockRejectedValueOnce(transientError("P1017"))
      .mockRejectedValueOnce(transientError("P1017"));

    const promise = requireAuth(new Headers());
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result.success).toBe(false);
    expect(result).toEqual({ success: false, error: "DATABASE_UNAVAILABLE" });
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
      await vi.advanceTimersByTimeAsync(1000);
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
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result.success).toBe(false);
    expect(mockGetSession).toHaveBeenCalledTimes(2);
  });
});
