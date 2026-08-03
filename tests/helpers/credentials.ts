// Shared E2E credentials. Values live in gitignored env files (.env / .env.local);
// never commit real passwords to the repo. See .env.example.
//
// Sync the DB test users with: ADMIN_PASSWORD=<pw> TEST_MEMBER_PASSWORD=<pw> npx tsx scripts/update-test-passwords.ts

export interface E2ECredentials {
  email: string;
  password: string;
}

export function e2eAdminCredentials(): E2ECredentials {
  return readCredentials("E2E_ADMIN_EMAIL", "E2E_ADMIN_PASSWORD");
}

export function e2eMemberCredentials(): E2ECredentials {
  return readCredentials("E2E_MEMBER_EMAIL", "E2E_MEMBER_PASSWORD");
}

function readCredentials(emailVar: string, passwordVar: string): E2ECredentials {
  const email = process.env[emailVar];
  const password = process.env[passwordVar];
  if (!email || !password) {
    throw new Error(
      `${emailVar} and ${passwordVar} must be set (see .env.example). ` +
      "Ensure playwright.config.ts loads your env file.",
    );
  }
  return { email, password };
}
