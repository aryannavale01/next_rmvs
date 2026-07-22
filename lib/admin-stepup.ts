import { STEP_UP_WINDOW_MS } from './admin-security';

let lastStepUpVerifiedAt: number | null = null;

export function setStepUpVerified() {
  lastStepUpVerifiedAt = Date.now();
}

export function isStepUpValid(): boolean {
  if (!lastStepUpVerifiedAt) return false;
  return Date.now() - lastStepUpVerifiedAt < STEP_UP_WINDOW_MS;
}

export function getStepUpReturnUrl(currentPath: string, action: string): string {
  const params = new URLSearchParams({
    returnTo: currentPath,
    action,
  });
  return `/admin/verify-stepup?${params.toString()}`;
}

/**
 * Gate a sensitive admin action behind step-up verification.
 * Returns true if the action can proceed, false if redirected to step-up.
 *
 * Usage in admin components:
 *   const proceed = await requireStepUp('/admin/members', 'delete_user');
 *   if (!proceed) return;
 *   // ... perform the sensitive action
 */
export async function requireStepUpClient(
  currentPath: string,
  action: string
): Promise<boolean> {
  // Fast path: client-side check (in-memory, survives within same page session)
  if (isStepUpValid()) return true;

  // Server-side check (authoritative)
  try {
    const res = await fetch('/api/admin/verify-stepup/check');
    if (!res.ok) return true; // If check fails, allow (don't block on errors)
    const data = await res.json();
    if (!data.needsStepUp) {
      setStepUpVerified();
      return true;
    }
  } catch {
    // Network error — allow action (fail open for UX, server-side requireStepUp still enforces)
    return true;
  }

  // Redirect to step-up page
  window.location.href = getStepUpReturnUrl(currentPath, action);
  return false;
}
