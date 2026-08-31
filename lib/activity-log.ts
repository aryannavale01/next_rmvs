import { prisma } from "./prisma";

export type ActivityEntity =
  | "member"
  | "course"
  | "enrollment"
  | "certificate"
  | "teacher"
  | "coupon"
  | "notification"
  | "user"
  | "system"
  | "program"
  | "leader"
  | "testimonial"
  | "partner"
  | "milestone"
  | "gallery_item"
  | "blog_post"
  | "newsletter"
  | "site_setting"
  | "location"
  | "org_document";

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "enroll"
  | "unenroll"
  | "approve"
  | "reject"
  | "send"
  | "login"
  | "settings_change"
  | "restore"
  | "status_change"
  | "document_verify"
  | "document_reject"
  | "document_view"
  | "coupon_create"
  | "coupon_update"
  | "coupon_delete"
  | "certificate_generate"
  | "certificate_approve"
  | "certificate_revoke"
  | "certificate_request"
  | "certificate_request_approve"
  | "certificate_request_reject"
  | "program_create"
  | "program_update"
  | "program_delete"
  | "leader_create"
  | "leader_update"
  | "leader_delete"
  | "testimonial_create"
  | "testimonial_update"
  | "testimonial_delete"
  | "partner_create"
  | "partner_update"
  | "partner_delete"
  | "milestone_create"
  | "milestone_update"
  | "milestone_delete"
  | "gallery_item_create"
  | "gallery_item_update"
  | "gallery_item_delete"
  | "blog_post_create"
  | "blog_post_update"
  | "blog_post_delete"
  | "newsletter_create"
  | "newsletter_update"
  | "newsletter_delete"
  | "site_setting_upsert"
  | "site_setting_delete"
  | "location_create"
  | "location_update"
  | "location_delete"
  | "org_document_upload"
  | "org_document_update"
  | "org_document_delete";

const ENTITY_ICONS: Record<string, string> = {
  member: "Users",
  course: "BookOpen",
  enrollment: "Calendar",
  certificate: "Award",
  teacher: "Users",
  coupon: "Award",
  notification: "Bell",
  user: "Lock",
  system: "Clock",
  program: "Target",
  leader: "Crown",
  testimonial: "MessageSquare",
  partner: "Handshake",
  milestone: "Flag",
  gallery_item: "Image",
  blog_post: "FileText",
  newsletter: "Mail",
  site_setting: "Settings",
  location: "MapPin",
  org_document: "FileText",
};

export async function logActivity(params: {
  entity: ActivityEntity;
  entityId?: string;
  action: ActivityAction;
  description: string;
  performedBy?: string;
  ip?: string;
}): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        entityType: params.entity,
        entityId: params.entityId || null,
        action: params.action,
        description: params.description,
        performedBy: params.performedBy || null,
        ipAddress: params.ip || null,
      },
    });
  } catch (e) {
    console.error("[activity-log] Failed to write activity:", e);
  }
}

export async function getRecentActivity(limit: number = 50): Promise<
  Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    icon: string;
  }>
> {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id,
      title: formatTitle(log.entityType, log.action),
      description: log.description || "",
      timestamp: formatTimestamp(log.createdAt),
      icon: ENTITY_ICONS[log.entityType as ActivityEntity] || "Clock",
    }));
  } catch (e) {
    console.error("[activity-log] Failed to read activities:", e);
    return [];
  }
}

function formatTitle(entity: string, action: string): string {
  const entityLabel = entity.charAt(0).toUpperCase() + entity.slice(1);
  const actionLabel = action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, " ");
  return `${entityLabel} ${actionLabel}`;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
