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

export function redirectToStepUp(currentPath: string, action: string) {
  window.location.href = getStepUpReturnUrl(currentPath, action);
}

export function isStepUpRequiredResponse(status: number, error: unknown): boolean {
  return status === 403 && error === 'STEP_UP_REQUIRED';
}

/**
 * Gate a sensitive admin action behind step-up verification.
 * Returns true if the action can proceed, false if the action was blocked.
 *
 * Fail-closed: if the server check cannot confirm a valid step-up (non-OK
 * response or network error), the action is blocked rather than allowed.
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
    if (!res.ok) return false; // Fail closed: server can't confirm step-up
    const data = await res.json();
    if (!data.needsStepUp) {
      setStepUpVerified();
      return true;
    }
  } catch {
    // Network error — fail closed: block rather than risk an ungated action
    return false;
  }

  // Server confirmed step-up is required; redirect to the verify flow
  redirectToStepUp(currentPath, action);
  return false;
}
