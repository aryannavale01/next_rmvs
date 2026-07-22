import { describe, it, expect } from "vitest";
import { isSafeRedirect } from "../lib/redirect";

describe("isSafeRedirect", () => {
  it("allows relative paths", () => {
    expect(isSafeRedirect("/dashboard")).toBe("/dashboard");
    expect(isSafeRedirect("/admin/settings")).toBe("/admin/settings");
    expect(isSafeRedirect("/")).toBe("/");
  });

  it("rejects protocol-relative URLs", () => {
    expect(isSafeRedirect("//evil.com")).toBe("/dashboard");
    expect(isSafeRedirect("//evil.com/path")).toBe("/dashboard");
  });

  it("rejects absolute URLs with protocol", () => {
    expect(isSafeRedirect("http://evil.com")).toBe("/dashboard");
    expect(isSafeRedirect("https://evil.com/path")).toBe("/dashboard");
    expect(isSafeRedirect("ftp://evil.com")).toBe("/dashboard");
  });

  it("rejects Windows-style paths", () => {
    expect(isSafeRedirect("C:\\Windows")).toBe("/dashboard");
    expect(isSafeRedirect("D:/folder")).toBe("/dashboard");
  });

  it("rejects empty/null", () => {
    expect(isSafeRedirect("")).toBe("/dashboard");
    expect(isSafeRedirect("")).toBe("/dashboard");
  });

  it("uses custom fallback", () => {
    expect(isSafeRedirect("//evil.com", "/admin")).toBe("/admin");
  });
});
