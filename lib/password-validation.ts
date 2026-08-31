export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

interface PasswordRules {
  minLength: number;
  requiresSpecial: boolean;
  requiresNumber: boolean;
  requiresUppercase: boolean;
}

const DEFAULT_RULES: PasswordRules = {
  minLength: 8,
  requiresSpecial: true,
  requiresNumber: true,
  requiresUppercase: true,
};

export function validatePassword(password: string, rules?: PasswordRules): PasswordValidation {
  const r = rules || DEFAULT_RULES;
  const errors: string[] = [];

  if (password.length < r.minLength) {
    errors.push(`Password must be at least ${r.minLength} characters long`);
  }
  if (password.length > 128) {
    errors.push("Password must be no more than 128 characters long");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (r.requiresUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (r.requiresNumber && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (r.requiresSpecial && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  // Check for common weak passwords
  const common = [
    "password", "password1", "password12", "qwerty", "abc123",
    "letmein", "admin", "welcome", "monkey", "dragon",
  ];
  if (common.includes(password.toLowerCase())) {
    errors.push("Password is too common");
  }

  return { valid: errors.length === 0, errors };
}

export async function validatePasswordWithConfig(password: string): Promise<PasswordValidation> {
  const { getOrgConfig } = await import("./org-config");
  const config = await getOrgConfig();
  return validatePassword(password, {
    minLength: config.pwMinLength,
    requiresSpecial: config.pwRequiresSpecial,
    requiresNumber: config.pwRequiresNumber,
    requiresUppercase: config.pwRequiresUppercase,
  });
}
