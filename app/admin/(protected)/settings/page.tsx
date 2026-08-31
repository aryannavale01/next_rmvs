import { prisma, withRetry } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import SettingsClient from './settings-client';

export const dynamic = 'force-dynamic';

interface SettingRow {
  key: string;
  value: string;
  label: string;
  category: string;
}

const DEFAULT_SETTINGS: SettingRow[] = [
  { key: 'general.siteName', value: 'CompassionGlobal NGO Portal', label: 'Site Name', category: 'general' },
  { key: 'general.description', value: 'Empowering rural youth and farmers with modern technological, agricultural, and business skills.', label: 'Site Description', category: 'general' },
  { key: 'general.logo', value: 'CompassionGlobal', label: 'Logo Text', category: 'general' },
  { key: 'general.timezone', value: 'Asia/Kolkata', label: 'Timezone', category: 'general' },
  { key: 'general.language', value: 'en', label: 'Language', category: 'general' },
  { key: 'email.smtpHost', value: process.env.SMTP_HOST || '', label: 'SMTP Host', category: 'email' },
  { key: 'email.smtpPort', value: process.env.SMTP_PORT || '587', label: 'SMTP Port', category: 'email' },
  { key: 'email.smtpUser', value: process.env.SMTP_USER || '', label: 'SMTP Username', category: 'email' },
  { key: 'email.smtpPass', value: '', label: 'SMTP Password', category: 'email' },
  { key: 'email.senderName', value: process.env.SMTP_SENDER_NAME || 'NGO Skill Coordinator', label: 'Sender Name', category: 'email' },
  { key: 'email.senderEmail', value: process.env.SMTP_SENDER_EMAIL || 'coordinator@compassionglobal.org', label: 'Sender Email', category: 'email' },
  { key: 'email.notifNewRegistration', value: 'true', label: 'New Registration Alerts', category: 'email' },
  { key: 'email.notifApplication', value: 'true', label: 'Application Updates', category: 'email' },
  { key: 'email.notifCertificate', value: 'true', label: 'Certificate Notifications', category: 'email' },
  { key: 'security.pwMinLength', value: '8', label: 'Minimum Password Length', category: 'security' },
  { key: 'security.pwRequiresSpecial', value: 'true', label: 'Require Special Characters', category: 'security' },
  { key: 'security.pwRequiresNumber', value: 'true', label: 'Require Numbers', category: 'security' },
  { key: 'security.pwRequiresUppercase', value: 'true', label: 'Require Uppercase Letters', category: 'security' },
  { key: 'security.sessionTimeout', value: '30', label: 'Session Timeout (minutes)', category: 'security' },
  { key: 'security.maxLoginAttempts', value: '5', label: 'Max Login Attempts', category: 'security' },
  { key: 'security.enable2FA', value: 'false', label: 'Two-Factor Authentication', category: 'security' },
  { key: 'appearance.theme', value: 'Light', label: 'Theme', category: 'appearance' },
  { key: 'appearance.brandColor', value: '#2563EB', label: 'Brand Color', category: 'appearance' },
  { key: 'appearance.sidebarCollapsedDefault', value: 'false', label: 'Collapsed Sidebar by Default', category: 'appearance' },
  { key: 'appearance.fontSize', value: 'Medium', label: 'Font Size', category: 'appearance' },
  { key: 'system.maintenanceMode', value: 'false', label: 'Maintenance Mode', category: 'system' },
  { key: 'system.maintenanceMessage', value: 'System is undergoing a scheduled database synchronization backup. We will be online shortly.', label: 'Maintenance Message', category: 'system' },
  { key: 'system.autoBackup', value: 'true', label: 'Automatic Backups', category: 'system' },
  { key: 'system.backupFrequency', value: 'Daily', label: 'Backup Frequency', category: 'system' },
  { key: 'system.backupRetention', value: '30', label: 'Backup Retention (days)', category: 'system' },
];

export default async function AdminSettingsPage() {
  const auth = await requireAdmin();

  let dbSettings: SettingRow[] = [];
  if (auth.success) {
    try {
      const rows = await withRetry(() =>
        prisma.siteSetting.findMany({ orderBy: { category: 'asc' } }),
      );
      dbSettings = rows.map(r => ({ key: r.key, value: r.value, label: r.label, category: r.category }));
    } catch {
      console.error('[SettingsPage] Failed to fetch settings from DB, using defaults');
    }
  }

  const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));
  const merged = DEFAULT_SETTINGS.map(d => {
    if (d.key === 'email.smtpPass') {
      // Never send the SMTP password to the browser. It can only be set (never
      // read back); an empty submitted value means "keep the current one".
      return { ...d, value: '' };
    }
    return {
      ...d,
      value: settingsMap.has(d.key) ? settingsMap.get(d.key)! : d.value,
    };
  });

  return <SettingsClient settings={merged} />;
}
