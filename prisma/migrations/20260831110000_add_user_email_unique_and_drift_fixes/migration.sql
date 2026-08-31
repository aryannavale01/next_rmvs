-- Migration: 20260831110000_add_user_email_unique_and_drift_fixes
-- NOTE (idempotency): the target states differ between a FRESH deploy and the LIVE DB,
-- so every statement below is guarded to be safe in BOTH:
--   * Fresh  : init migration created User_email_key, twoFactor.id default gen_random_uuid(),
--              and FK named profiles_user_id_fkey.
--   * Live    : User_email_key was dropped by an uncommitted orphan migration; twoFactor.id
--              has no DB default; FK was already renamed to profiles_id_fkey.

-- 1. DB-level unique constraint on User.email, backed by schema @unique on model user.
--    Idempotent: already present on fresh (init), absent on live (needs creating).
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- 2. Drift fix: drop the DB-side default on twoFactor.id (Prisma generates the UUID
--    client-side via @default(uuid())). DROP DEFAULT on a column with no default is a
--    no-op, so this is safe on both fresh and live.
ALTER TABLE "twoFactor" ALTER COLUMN "id" DROP DEFAULT;

-- 3. Drift fix (cosmetic): rename the profiles->User FK constraint to Prisma's default
--    relation name for Profile @relation(fields:[id],references:[id]).
--    Guarded: on fresh the old name exists (init); on live it is already profiles_id_fkey.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'profiles'::regclass AND conname = 'profiles_user_id_fkey'
  ) THEN
    ALTER TABLE "profiles" RENAME CONSTRAINT "profiles_user_id_fkey" TO "profiles_id_fkey";
  END IF;
END $$;
