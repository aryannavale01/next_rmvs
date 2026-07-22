import { describe, it, expect } from "vitest";
import { validatePassword } from "../lib/password-validation";

describe("validatePassword", () => {
  it("accepts strong password", () => {
    const result = validatePassword("MyStr0ng!Pass");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects short password", () => {
    const result = validatePassword("Ab1!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual("Password must be at least 8 characters long");
  });

  it("rejects password without uppercase", () => {
    const result = validatePassword("lowercase1!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual("Password must contain at least one uppercase letter");
  });

  it("rejects password without lowercase", () => {
    const result = validatePassword("UPPERCASE1!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual("Password must contain at least one lowercase letter");
  });

  it("rejects password without number", () => {
    const result = validatePassword("NoNumberHere!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual("Password must contain at least one number");
  });

  it("rejects password without special character", () => {
    const result = validatePassword("NoSpecial1");
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual("Password must contain at least one special character");
  });

  it("rejects common passwords", () => {
    const result = validatePassword("password");
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual("Password is too common");
  });

  it("rejects password over 128 characters", () => {
    const result = validatePassword("A".repeat(129) + "1!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual("Password must be no more than 128 characters long");
  });
});
