# Deployment Guide — CompassionGlobal

## Environment Variables

### Required for all environments

| Variable | Purpose | Source |
|----------|---------|--------|
| `DATABASE_URL` | Supabase pooled connection (runtime) | Supabase Dashboard → Settings → Database |
| `DIRECT_URL` | Supabase direct connection (migrations) | Supabase Dashboard → Settings → Database |
| `BETTER_AUTH_URL` | Better Auth base URL | Your deployment URL |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Client-side auth URL | Your deployment URL |
| `BETTER_AUTH_SECRET` | Session signing secret (min 32 chars) | Generate with `openssl rand -base64 32` |
| `TRUSTED_ORIGINS` | CORS origins (comma-separated) | Your domain(s) |
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API |

### Bootstrap only (local/staging)

| Variable | Purpose |
|----------|---------|
| `SUPERADMIN_PASSWORD` | Temporary bootstrap password for the superadmin account |

> **WARNING:** `SUPERADMIN_PASSWORD` is a **bootstrap mechanism only**. It is read by the seed script to create the initial admin account. The admin **must** change this password on first login (forced by the `mustChangePassword` flag). In production, this value should come from your hosting provider's secret manager, not a committed `.env` file.

---

## Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy .env.example to .env and fill in values
cp .env.example .env

# 3. Run database migrations
npx prisma db push

# 4. Seed the database (creates superadmin + test member)
npm run seed

# 5. Start the dev server
npm run dev
```

After seeding, log in at `/admin/login` with:
- Email: `admin@compassionglobal.org`
- Password: (value of `SUPERADMIN_PASSWORD` from `.env`)

You will be **forced to change the password** before accessing the dashboard.

---

## Production Deployment (Vercel)

### 1. Set environment variables in Vercel

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**.

Add all required variables above. For secrets, use Vercel's built-in encryption — never commit real values to `.env`.

> **Vercel automatically encrypts** environment variables at rest. Values set via the dashboard or CLI are encrypted with Vercel's key management system.

### 2. Run the seed script against production

The seed script must be run **once** against the production database to create the superadmin account.

```bash
# Set DIRECT_URL to your production database direct connection
# Run the seed script
npx tsx prisma/seed.ts
```

**Who should run this:** Only the project owner or a designated administrator. The seed script creates the initial admin account — whoever runs it controls the superadmin credential.

**What happens after:**
1. The superadmin account is created with `mustChangePassword: true`
2. The first person to log in at `/admin/login` must change the password
3. After changing the password, they must set up TOTP 2FA (mandatory for admin accounts)
4. Only then can they access the admin dashboard

### 3. Post-seed verification

After running the seed in production:
1. Navigate to `https://your-domain.com/admin/login`
2. Log in with the bootstrap credentials
3. Verify you are redirected to the forced password change screen
4. Change the password to a strong, unique value
5. Set up TOTP 2FA using an authenticator app
6. Verify you can access the admin dashboard

### 4. Destroy the bootstrap secret

After the first successful login and password change:
- Remove `SUPERADMIN_PASSWORD` from your `.env` file
- In Vercel, you can optionally remove the env var (the seed script won't run again unless manually executed)

---

## Security Architecture

### Forced Password Change
- The `mustChangePassword` flag is set to `true` when the superadmin is seeded
- The admin layout (`app/admin/layout.tsx`) checks this flag server-side on every page load
- If `true`, the user is redirected to `/force-password-change` before any dashboard access
- After changing the password, the flag is cleared and normal access is restored

### TOTP Two-Factor Authentication
- Enabled via Better Auth's `twoFactor` plugin
- **Mandatory for all admin accounts** — enforced in the admin layout
- Admins without 2FA enabled are redirected to `/admin/setup-2fa`
- Uses TOTP (Time-based One-Time Password) compatible with Google Authenticator, Authy, etc.
- Backup codes are provided during setup

### Step-Up Authentication
- Sensitive admin actions require re-authentication (password verification)
- `Session.stepUpVerifiedAt` tracks when the admin last verified their identity
- Verification expires after 15 minutes
- The `requireStepUp()` function in `lib/session.ts` enforces this server-side

### Audit Logging
- All admin authentication events are logged to the `AuthActivityLog` table
- Events tracked: login success/failure, password changes, step-up verifications, TOTP enable/disable
- Each event includes: user ID, action type, timestamp, and IP address

---

## Rollback / Recovery

If the admin is locked out:
1. Reset the `mustChangePassword` flag directly in the database:
   ```sql
   UPDATE "User" SET "mustChangePassword" = false WHERE email = 'admin@compassionglobal.org';
   ```
2. If 2FA is causing issues, disable it:
   ```sql
   UPDATE "User" SET "twoFactorEnabled" = false WHERE email = 'admin@compassionglobal.org';
   DELETE FROM "twoFactor" WHERE "userId" = (SELECT id FROM "User" WHERE email = 'admin@compassionglobal.org');
   ```
3. To force a password reset, use the forgot-password flow or update the account directly:
   ```sql
   -- Generate a new password hash first, then:
   UPDATE "Account" SET password = '<new_hash>' WHERE "userId" = (SELECT id FROM "User" WHERE email = 'admin@compassionglobal.org');
   ```
