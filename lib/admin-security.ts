import { getOrgConfig } from "./org-config";

export const SENSITIVE_ADMIN_ACTIONS = [
  'change_user_role',
  'delete_user',
  'delete_course',
  'delete_certificate',
  'approve_enrollment',
  'reject_enrollment',
  'modify_system_settings',
  'manage_coupons',
  'send_notification_broadcast',
  'manage_website_content',
] as const;

export type SensitiveAdminAction = (typeof SENSITIVE_ADMIN_ACTIONS)[number];

export const STEP_UP_WINDOW_MS_DEFAULT = 15 * 60 * 1000; // 15 minutes

export async function getStepUpWindowMs(): Promise<number> {
  const config = await getOrgConfig();
  return config.stepUpWindowMinutes * 60 * 1000;
}

// Sync fallback for edge contexts where async config isn't available
export const STEP_UP_WINDOW_MS = STEP_UP_WINDOW_MS_DEFAULT;
