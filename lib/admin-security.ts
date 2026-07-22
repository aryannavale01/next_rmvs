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

export const STEP_UP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
