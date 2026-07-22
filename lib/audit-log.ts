import { prisma } from "./prisma";

export const AuditActions = {
  ADMIN_LOGIN_SUCCESS: "admin_login_success",
  ADMIN_LOGIN_FAILURE: "admin_login_failure",
  PASSWORD_CHANGE: "password_change",
  PASSWORD_CHANGE_FORCED: "password_change_forced",
  STEP_UP_VERIFIED: "step_up_verified",
  STEP_UP_FAILED: "step_up_failed",
  TOTP_ENABLED: "totp_enabled",
  TOTP_DISABLED: "totp_disabled",
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];

export async function logAuthEvent(params: {
  userId?: string;
  action: AuditAction;
  metadata?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  try {
    await prisma.authActivityLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ip: params.ip || null,
      },
    });
  } catch (e) {
    console.error("[audit-log] Failed to write auth event:", e);
  }
}
