import { prisma, withRetry } from "./prisma";

const CACHE_TTL_MS = 60_000; // 1 minute

interface OrgConfig {
  siteName: string;
  siteDescription: string;
  logoText: string;
  timezone: string;
  language: string;
  senderName: string;
  senderEmail: string;
  senderFromAddress: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  officeHours: string;
  socialFacebook: string;
  socialInstagram: string;
  socialYoutube: string;
  legalRegistrationStatement: string;
  brandColor: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  enable2FA: boolean;
  sessionTimeoutMinutes: number;
  pwMinLength: number;
  pwRequiresSpecial: boolean;
  pwRequiresNumber: boolean;
  pwRequiresUppercase: boolean;
  maxLoginAttempts: number;
  stepUpWindowMinutes: number;
}

const DEFAULTS: OrgConfig = {
  siteName: "CompassionGlobal",
  siteDescription: "Empowering local communities for global change.",
  logoText: "CompassionGlobal",
  timezone: "Asia/Kolkata",
  language: "en",
  senderName: process.env.SMTP_SENDER_NAME || "NGO Skill Coordinator",
  senderEmail: process.env.SMTP_SENDER_EMAIL || "coordinator@compassionglobal.org",
  senderFromAddress: process.env.SMTP_USER || "noreply@compassionglobal.org",
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  officeHours: "",
  socialFacebook: "",
  socialInstagram: "",
  socialYoutube: "",
  legalRegistrationStatement: "",
  brandColor: "#2563EB",
  maintenanceMode: false,
  maintenanceMessage:
    "System is undergoing a scheduled maintenance. We will be back shortly.",
  enable2FA: false,
  sessionTimeoutMinutes: 30,
  pwMinLength: 8,
  pwRequiresSpecial: true,
  pwRequiresNumber: true,
  pwRequiresUppercase: true,
  maxLoginAttempts: 5,
  stepUpWindowMinutes: 15,
};

let _cache: OrgConfig | null = null;
let _cacheTime = 0;

function mapSettings(rows: { key: string; value: string }[]): OrgConfig {
  const m = new Map(rows.map((r) => [r.key, r.value]));
  const g = (key: keyof OrgConfig, fallback: string) =>
    m.get(key) || fallback;
  const b = (key: keyof OrgConfig, fallback: boolean) => {
    const v = m.get(key);
    return v === "true" ? true : v === "false" ? false : fallback;
  };
  const n = (key: keyof OrgConfig, fallback: number) => {
    const v = m.get(key);
    const parsed = parseInt(v || "", 10);
    return isNaN(parsed) ? fallback : parsed;
  };

  return {
    siteName: g("siteName", DEFAULTS.siteName),
    siteDescription: g("siteDescription", DEFAULTS.siteDescription),
    logoText: g("logoText", DEFAULTS.logoText),
    timezone: g("timezone", DEFAULTS.timezone),
    language: g("language", DEFAULTS.language),
    senderName: g("senderName", DEFAULTS.senderName),
    senderEmail: g("senderEmail", DEFAULTS.senderEmail),
    senderFromAddress: g("senderFromAddress", DEFAULTS.senderFromAddress),
    contactPhone: g("contactPhone", DEFAULTS.contactPhone),
    contactEmail: g("contactEmail", DEFAULTS.contactEmail),
    contactAddress: g("contactAddress", DEFAULTS.contactAddress),
    officeHours: g("officeHours", DEFAULTS.officeHours),
    socialFacebook: g("socialFacebook", DEFAULTS.socialFacebook),
    socialInstagram: g("socialInstagram", DEFAULTS.socialInstagram),
    socialYoutube: g("socialYoutube", DEFAULTS.socialYoutube),
    legalRegistrationStatement: g(
      "legalRegistrationStatement",
      DEFAULTS.legalRegistrationStatement
    ),
    brandColor: g("brandColor", DEFAULTS.brandColor),
    maintenanceMode: b("maintenanceMode", DEFAULTS.maintenanceMode),
    maintenanceMessage: g("maintenanceMessage", DEFAULTS.maintenanceMessage),
    enable2FA: b("enable2FA", DEFAULTS.enable2FA),
    sessionTimeoutMinutes: n(
      "sessionTimeoutMinutes",
      DEFAULTS.sessionTimeoutMinutes
    ),
    pwMinLength: n("pwMinLength", DEFAULTS.pwMinLength),
    pwRequiresSpecial: b("pwRequiresSpecial", DEFAULTS.pwRequiresSpecial),
    pwRequiresNumber: b("pwRequiresNumber", DEFAULTS.pwRequiresNumber),
    pwRequiresUppercase: b("pwRequiresUppercase", DEFAULTS.pwRequiresUppercase),
    maxLoginAttempts: n("maxLoginAttempts", DEFAULTS.maxLoginAttempts),
    stepUpWindowMinutes: n("stepUpWindowMinutes", DEFAULTS.stepUpWindowMinutes),
  };
}

const KEY_TO_FIELD: Record<string, keyof OrgConfig> = {
  "general.siteName": "siteName",
  "general.description": "siteDescription",
  "general.logo": "logoText",
  "general.timezone": "timezone",
  "general.language": "language",
  "email.senderName": "senderName",
  "email.senderEmail": "senderEmail",
  contact_phone: "contactPhone",
  contact_email: "contactEmail",
  contact_address: "contactAddress",
  office_hours: "officeHours",
  social_facebook: "socialFacebook",
  social_instagram: "socialInstagram",
  social_youtube: "socialYoutube",
  legal_registration_statement: "legalRegistrationStatement",
  "appearance.brandColor": "brandColor",
  "system.maintenanceMode": "maintenanceMode",
  "system.maintenanceMessage": "maintenanceMessage",
  "security.enable2FA": "enable2FA",
  "security.sessionTimeout": "sessionTimeoutMinutes",
  "security.pwMinLength": "pwMinLength",
  "security.pwRequiresSpecial": "pwRequiresSpecial",
  "security.pwRequiresNumber": "pwRequiresNumber",
  "security.pwRequiresUppercase": "pwRequiresUppercase",
  "security.maxLoginAttempts": "maxLoginAttempts",
  security_stepUpWindowMinutes: "stepUpWindowMinutes",
};

export async function getOrgConfig(): Promise<OrgConfig> {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL_MS) return _cache;

  try {
    const rows = await withRetry(() =>
      prisma.siteSetting.findMany({ select: { key: true, value: true } })
    );

    const mapped: Record<string, string> = {};
    for (const row of rows) {
      const field = KEY_TO_FIELD[row.key];
      if (field) {
        mapped[field] = row.value;
      }
    }

    const base = { ...DEFAULTS };
    if (mapped.siteName) base.siteName = mapped.siteName;
    if (mapped.siteDescription) base.siteDescription = mapped.siteDescription;
    if (mapped.logoText) base.logoText = mapped.logoText;
    if (mapped.timezone) base.timezone = mapped.timezone;
    if (mapped.language) base.language = mapped.language;
    if (mapped.senderName) base.senderName = mapped.senderName;
    if (mapped.senderEmail) base.senderEmail = mapped.senderEmail;
    if (mapped.senderFromAddress)
      base.senderFromAddress = mapped.senderFromAddress;
    if (mapped.contactPhone) base.contactPhone = mapped.contactPhone;
    if (mapped.contactEmail) base.contactEmail = mapped.contactEmail;
    if (mapped.contactAddress) base.contactAddress = mapped.contactAddress;
    if (mapped.officeHours) base.officeHours = mapped.officeHours;
    if (mapped.socialFacebook) base.socialFacebook = mapped.socialFacebook;
    if (mapped.socialInstagram)
      base.socialInstagram = mapped.socialInstagram;
    if (mapped.socialYoutube) base.socialYoutube = mapped.socialYoutube;
    if (mapped.legalRegistrationStatement)
      base.legalRegistrationStatement = mapped.legalRegistrationStatement;
    if (mapped.brandColor) base.brandColor = mapped.brandColor;
    if (mapped.maintenanceMode !== undefined)
      base.maintenanceMode = mapped.maintenanceMode === "true";
    if (mapped.maintenanceMessage)
      base.maintenanceMessage = mapped.maintenanceMessage;
    if (mapped.enable2FA !== undefined)
      base.enable2FA = mapped.enable2FA === "true";
    if (mapped.sessionTimeoutMinutes) {
      const v = parseInt(mapped.sessionTimeoutMinutes, 10);
      if (!isNaN(v)) base.sessionTimeoutMinutes = v;
    }
    if (mapped.pwMinLength) {
      const v = parseInt(mapped.pwMinLength, 10);
      if (!isNaN(v)) base.pwMinLength = v;
    }
    if (mapped.pwRequiresSpecial !== undefined)
      base.pwRequiresSpecial = mapped.pwRequiresSpecial === "true";
    if (mapped.pwRequiresNumber !== undefined)
      base.pwRequiresNumber = mapped.pwRequiresNumber === "true";
    if (mapped.pwRequiresUppercase !== undefined)
      base.pwRequiresUppercase = mapped.pwRequiresUppercase === "true";
    if (mapped.maxLoginAttempts) {
      const v = parseInt(mapped.maxLoginAttempts, 10);
      if (!isNaN(v)) base.maxLoginAttempts = v;
    }
    if (mapped.stepUpWindowMinutes) {
      const v = parseInt(mapped.stepUpWindowMinutes, 10);
      if (!isNaN(v)) base.stepUpWindowMinutes = v;
    }

    _cache = base;
    _cacheTime = now;
    return base;
  } catch (e) {
    console.error("[OrgConfig] Failed to load settings from DB:", e);
    return DEFAULTS;
  }
}

export function invalidateOrgConfig(): void {
  _cache = null;
  _cacheTime = 0;
}

export async function getOrgConfigSync(): Promise<OrgConfig> {
  return getOrgConfig();
}
