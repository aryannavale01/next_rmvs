'use client';

import React, { useState, useCallback } from 'react';
import {
  Download, Globe, Mail, Shield, Palette, Server, Check, FileText,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { requireStepUpClient } from '@/lib/admin-stepup';

interface SettingRow {
  key: string;
  value: string;
  label: string;
  category: string;
}

interface SettingsClientProps {
  settings: SettingRow[];
}

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Shanghai',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Australia/Sydney', 'Pacific/Auckland',
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'mr', label: 'Marathi' },
];

const TAB_LIST = [
  { key: 'general', label: 'General', icon: Globe },
  { key: 'content', label: 'Page Content', icon: FileText },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'system', label: 'System', icon: Server },
] as const;

type TabKey = (typeof TAB_LIST)[number]['key'];

function Toggle({ checked, onChange, ariaLabel }: { checked: boolean; onChange: (v: boolean) => void; ariaLabel?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-primary' : 'bg-border'
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-0.5 ${
        checked ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
      }`} />
    </button>
  );
}

function RadioGroup({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-3">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-all ${
            value === opt.value
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-card text-muted-foreground hover:border-border'
          }`}
        >
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
            value === opt.value ? 'border-primary' : 'border-border'
          }`}>
            {value === opt.value && <span className="w-2 h-2 rounded-full bg-primary" />}
          </span>
          {opt.label}
          <input type="radio" name={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} className="sr-only" />
        </label>
      ))}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-foreground mb-1.5">{children}</label>;
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground mt-1">{children}</p>;
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-card" />
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-card">
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function TextareaInput({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-card resize-none" />
  );
}

function RangeSlider({ value, onChange, min, max, step = 1, unit }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string }) {
  return (
    <div className="flex items-center gap-3">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-primary" />
      <span className="text-sm font-bold text-foreground min-w-[3rem] text-right">{value}{unit || ''}</span>
    </div>
  );
}

export default function SettingsClient({ settings: initialSettings }: SettingsClientProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>(
    Object.fromEntries(initialSettings.map(s => [s.key, s.value]))
  );
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [saved, setSaved] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const getVal = useCallback((key: string) => settings[key] ?? '', [settings]);
  const getBool = useCallback((key: string) => getVal(key) === 'true', [getVal]);
  const getNum = useCallback((key: string) => Number(getVal(key)) || 0, [getVal]);
  const setVal = useCallback((key: string, val: string) => setSettings(prev => ({ ...prev, [key]: val })), []);
  const setBool = useCallback((key: string, val: boolean) => setVal(key, String(val)), [setVal]);
  const setNum = useCallback((key: string, val: number) => setVal(key, String(val)), [setVal]);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(null), 2000);
  };

  const buildCategorySettings = (category: string) => {
    const CATEGORY_KEYS: Record<string, { key: string; label: string; category: string }[]> = {
      general: [
        { key: 'general.siteName', label: 'Site Name', category: 'general' },
        { key: 'general.logo', label: 'Logo Text', category: 'general' },
        { key: 'general.description', label: 'Site Description', category: 'general' },
        { key: 'general.timezone', label: 'Timezone', category: 'general' },
        { key: 'general.language', label: 'Language', category: 'general' },
      ],
      content: [
        { key: 'home_hero_heading', label: 'Homepage Hero Heading', category: 'homepage' },
        { key: 'home_hero_description', label: 'Homepage Hero Description', category: 'homepage' },
        { key: 'home_mission_text', label: 'Mission Card Text', category: 'homepage' },
        { key: 'home_vision_text', label: 'Vision Card Text', category: 'homepage' },
        { key: 'home_stat_volunteers', label: 'Stat: Active Volunteers', category: 'homepage' },
        { key: 'home_stat_families_helped', label: 'Stat: Families Helped', category: 'homepage' },
        { key: 'home_stat_programs', label: 'Stat: Programs Running', category: 'homepage' },
        { key: 'home_stat_families_supported', label: 'Metric: Families Supported', category: 'homepage' },
        { key: 'home_stat_students', label: 'Metric: Students Educated', category: 'homepage' },
        { key: 'home_stat_trees', label: 'Metric: Trees Planted', category: 'homepage' },
        { key: 'home_efficiency', label: 'Transparency: Program Efficiency', category: 'homepage' },
        { key: 'home_lives_impacted', label: 'Transparency: Lives Impacted', category: 'homepage' },
        { key: 'home_transparency_statement', label: 'Transparency: Statement', category: 'homepage' },
        { key: 'home_report_title', label: 'Impact Report: Title', category: 'homepage' },
        { key: 'home_report_funds', label: 'Impact Report: Total Funds Raised', category: 'homepage' },
        { key: 'home_report_efficiency', label: 'Impact Report: Program Efficiency', category: 'homepage' },
        { key: 'home_report_summary', label: 'Impact Report: Summary', category: 'homepage' },
        { key: 'home_impact_story_title', label: 'Impact Story: Title', category: 'homepage' },
        { key: 'home_impact_story_description', label: 'Impact Story: Description', category: 'homepage' },
        { key: 'home_impact_story_image', label: 'Impact Story: Image URL', category: 'homepage' },
        { key: 'home_impact_story_author', label: 'Impact Story: Author', category: 'homepage' },
        { key: 'home_impact_story_body', label: 'Impact Story: Full Story', category: 'homepage' },
        { key: 'home_impact_story_quote', label: 'Impact Story: Quote', category: 'homepage' },
        { key: 'home_newsletter_heading', label: 'Newsletter: Heading', category: 'homepage' },
        { key: 'home_newsletter_description', label: 'Newsletter: Description', category: 'homepage' },
        { key: 'about_stat_countries', label: 'About: Countries Active', category: 'about' },
        { key: 'about_stat_aid', label: 'About: Direct Aid Routing', category: 'about' },
        { key: 'about_stat_lives', label: 'About: Lives Empowered', category: 'about' },
        { key: 'about_stat_audits', label: 'About: Audits Cleared', category: 'about' },
        { key: 'about_values_heading', label: 'About: Values Section Heading', category: 'about' },
        { key: 'about_values_description', label: 'About: Values Section Description', category: 'about' },
        { key: 'about_value_1_title', label: 'Value 1: Title', category: 'about' },
        { key: 'about_value_1_description', label: 'Value 1: Description', category: 'about' },
        { key: 'about_value_1_label', label: 'Value 1: Badge Label', category: 'about' },
        { key: 'about_value_2_title', label: 'Value 2: Title', category: 'about' },
        { key: 'about_value_2_description', label: 'Value 2: Description', category: 'about' },
        { key: 'about_value_2_label', label: 'Value 2: Badge Label', category: 'about' },
        { key: 'about_value_3_title', label: 'Value 3: Title', category: 'about' },
        { key: 'about_value_3_description', label: 'Value 3: Description', category: 'about' },
        { key: 'about_value_3_label', label: 'Value 3: Badge Label', category: 'about' },
        { key: 'about_value_4_title', label: 'Value 4: Title', category: 'about' },
        { key: 'about_value_4_description', label: 'Value 4: Description', category: 'about' },
        { key: 'about_value_4_label', label: 'Value 4: Badge Label', category: 'about' },
        { key: 'legal_registration_statement', label: 'Legal: Registration Statement', category: 'legal' },
        { key: 'donate_tax_note', label: 'Legal: Donation Tax Note', category: 'legal' },
      ],
      email: [
        { key: 'email.smtpHost', label: 'SMTP Host', category: 'email' },
        { key: 'email.smtpPort', label: 'SMTP Port', category: 'email' },
        { key: 'email.smtpUser', label: 'SMTP Username', category: 'email' },
        { key: 'email.smtpPass', label: 'SMTP Password', category: 'email' },
        { key: 'email.senderName', label: 'Sender Name', category: 'email' },
        { key: 'email.senderEmail', label: 'Sender Email', category: 'email' },
        { key: 'email.notifNewRegistration', label: 'New Registration Alerts', category: 'email' },
        { key: 'email.notifApplication', label: 'Application Updates', category: 'email' },
        { key: 'email.notifCertificate', label: 'Certificate Notifications', category: 'email' },
      ],
      security: [
        { key: 'security.pwMinLength', label: 'Minimum Password Length', category: 'security' },
        { key: 'security.pwRequiresSpecial', label: 'Require Special Characters', category: 'security' },
        { key: 'security.pwRequiresNumber', label: 'Require Numbers', category: 'security' },
        { key: 'security.pwRequiresUppercase', label: 'Require Uppercase Letters', category: 'security' },
        { key: 'security.sessionTimeout', label: 'Session Timeout (minutes)', category: 'security' },
        { key: 'security.maxLoginAttempts', label: 'Max Login Attempts', category: 'security' },
        { key: 'security.enable2FA', label: 'Two-Factor Authentication', category: 'security' },
      ],
      appearance: [
        { key: 'appearance.theme', label: 'Theme', category: 'appearance' },
        { key: 'appearance.brandColor', label: 'Brand Color', category: 'appearance' },
        { key: 'appearance.sidebarCollapsedDefault', label: 'Collapsed Sidebar by Default', category: 'appearance' },
        { key: 'appearance.fontSize', label: 'Font Size', category: 'appearance' },
      ],
      system: [
        { key: 'system.maintenanceMode', label: 'Maintenance Mode', category: 'system' },
        { key: 'system.maintenanceMessage', label: 'Maintenance Message', category: 'system' },
        { key: 'system.autoBackup', label: 'Automatic Backups', category: 'system' },
        { key: 'system.backupFrequency', label: 'Backup Frequency', category: 'system' },
        { key: 'system.backupRetention', label: 'Backup Retention (days)', category: 'system' },
      ],
    };
    return CATEGORY_KEYS[category] ?? [];
  };

  const handleSave = async (category: TabKey) => {
    setSaving(true);
    try {
      if (!(await requireStepUpClient('/admin/settings', `settings_save_${category}`))) return;
      const entries = buildCategorySettings(category);
      const settingsPayload = entries.map(e => ({
        key: e.key,
        value: settings[e.key] ?? '',
        label: e.label,
        category: e.category,
      }));

      const res = await fetch('/api/admin/site-settings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsPayload }),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      flash(`${category.charAt(0).toUpperCase() + category.slice(1)} settings saved`);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save settings. Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organization Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure your platform preferences and system parameters</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-sm font-medium bg-success-bg text-success-text px-3 py-1.5 rounded-lg animate-pulse">
              <Check className="w-4 h-4" />
              {saved}
            </span>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-primary-light transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Settings
          </button>
        </div>
      </div>

      <div role="tablist" className="flex flex-wrap gap-2">
        {TAB_LIST.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-primary-light text-muted-foreground hover:bg-primary-light'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'general' && (
        <div id="tabpanel-general" role="tabpanel" aria-labelledby="tab-general" className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-foreground">General Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel>Site Name</FieldLabel>
              <TextInput value={getVal('general.siteName')} onChange={(v) => setVal('general.siteName', v)} placeholder="Your Organization Name" />
            </div>
            <div>
              <FieldLabel>Logo Text</FieldLabel>
              <TextInput value={getVal('general.logo')} onChange={(v) => setVal('general.logo', v)} placeholder="Logo display text" />
            </div>
          </div>
          <div>
            <FieldLabel>Site Description</FieldLabel>
            <TextareaInput value={getVal('general.description')} onChange={(v) => setVal('general.description', v)} placeholder="Brief description of your organization" rows={3} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel>Timezone</FieldLabel>
              <SelectInput value={getVal('general.timezone')} onChange={(v) => setVal('general.timezone', v)} options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))} />
            </div>
            <div>
              <FieldLabel>Language</FieldLabel>
              <SelectInput value={getVal('general.language')} onChange={(v) => setVal('general.language', v)} options={LANGUAGES} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => handleSave('general')} disabled={saving}
              className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save General Settings'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div id="tabpanel-content" role="tabpanel" aria-labelledby="tab-content" className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-foreground">Page Content</h2>
          <p className="text-xs text-muted-foreground">Manage the public-facing text, stats, and metrics displayed on the homepage and about page.</p>

          <div className="space-y-5">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Homepage</h3>
            <div>
              <FieldLabel>Hero Heading</FieldLabel>
              <TextInput value={getVal('home_hero_heading')} onChange={(v) => setVal('home_hero_heading', v)} placeholder="Empowering local communities for global change." />
              <FieldHint>Use \n for line breaks. Leave blank for default.</FieldHint>
            </div>
            <div>
              <FieldLabel>Hero Description</FieldLabel>
              <TextareaInput value={getVal('home_hero_description')} onChange={(v) => setVal('home_hero_description', v)} placeholder="At CompassionGlobal, we believe..." rows={2} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Mission Card Text</FieldLabel>
                <TextareaInput value={getVal('home_mission_text')} onChange={(v) => setVal('home_mission_text', v)} rows={2} />
              </div>
              <div>
                <FieldLabel>Vision Card Text</FieldLabel>
                <TextareaInput value={getVal('home_vision_text')} onChange={(v) => setVal('home_vision_text', v)} rows={2} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <FieldLabel>Stat: Volunteers</FieldLabel>
                <TextInput value={getVal('home_stat_volunteers')} onChange={(v) => setVal('home_stat_volunteers', v)} placeholder="12k+" />
              </div>
              <div>
                <FieldLabel>Stat: Families Helped</FieldLabel>
                <TextInput value={getVal('home_stat_families_helped')} onChange={(v) => setVal('home_stat_families_helped', v)} placeholder="50,000" />
              </div>
              <div>
                <FieldLabel>Stat: Programs Running</FieldLabel>
                <TextInput value={getVal('home_stat_programs')} onChange={(v) => setVal('home_stat_programs', v)} placeholder="120+" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <FieldLabel>Metric: Families Supported</FieldLabel>
                <TextInput value={getVal('home_stat_families_supported')} onChange={(v) => setVal('home_stat_families_supported', v)} placeholder="85,000" />
              </div>
              <div>
                <FieldLabel>Metric: Students Educated</FieldLabel>
                <TextInput value={getVal('home_stat_students')} onChange={(v) => setVal('home_stat_students', v)} placeholder="12,400" />
              </div>
              <div>
                <FieldLabel>Metric: Trees Planted</FieldLabel>
                <TextInput value={getVal('home_stat_trees')} onChange={(v) => setVal('home_stat_trees', v)} placeholder="250,000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Transparency: Program Efficiency</FieldLabel>
                <TextInput value={getVal('home_efficiency')} onChange={(v) => setVal('home_efficiency', v)} placeholder="92%" />
              </div>
              <div>
                <FieldLabel>Transparency: Lives Impacted</FieldLabel>
                <TextInput value={getVal('home_lives_impacted')} onChange={(v) => setVal('home_lives_impacted', v)} placeholder="1.2M+" />
              </div>
            </div>
            <div>
              <FieldLabel>Transparency: Statement</FieldLabel>
              <TextareaInput value={getVal('home_transparency_statement')} onChange={(v) => setVal('home_transparency_statement', v)} rows={2} />
              <FieldHint>Shown in the Radical Transparency section. Leave blank to hide.</FieldHint>
            </div>
          </div>

          <div className="space-y-5 border-t border-border pt-5">
            <h3 className="text-sm font-bold text-foreground">About Page Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <FieldLabel>Countries Active</FieldLabel>
                <TextInput value={getVal('about_stat_countries')} onChange={(v) => setVal('about_stat_countries', v)} placeholder="15+" />
              </div>
              <div>
                <FieldLabel>Direct Aid Routing</FieldLabel>
                <TextInput value={getVal('about_stat_aid')} onChange={(v) => setVal('about_stat_aid', v)} placeholder="92%" />
              </div>
              <div>
                <FieldLabel>Lives Empowered</FieldLabel>
                <TextInput value={getVal('about_stat_lives')} onChange={(v) => setVal('about_stat_lives', v)} placeholder="250K+" />
              </div>
              <div>
                <FieldLabel>Audits Cleared</FieldLabel>
                <TextInput value={getVal('about_stat_audits')} onChange={(v) => setVal('about_stat_audits', v)} placeholder="100%" />
              </div>
            </div>
          </div>

          <div className="space-y-5 border-t border-border pt-5">
            <h3 className="text-sm font-bold text-foreground">Homepage: Impact Report</h3>
            <p className="text-xs text-muted-foreground">The Read Our Impact Report button and modal only appear once a report title is set.</p>
            <div>
              <FieldLabel>Impact Report: Title</FieldLabel>
              <TextInput value={getVal('home_report_title')} onChange={(v) => setVal('home_report_title', v)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Impact Report: Total Funds Raised</FieldLabel>
                <TextInput value={getVal('home_report_funds')} onChange={(v) => setVal('home_report_funds', v)} />
              </div>
              <div>
                <FieldLabel>Impact Report: Program Efficiency</FieldLabel>
                <TextInput value={getVal('home_report_efficiency')} onChange={(v) => setVal('home_report_efficiency', v)} />
              </div>
            </div>
            <div>
              <FieldLabel>Impact Report: Summary</FieldLabel>
              <TextareaInput value={getVal('home_report_summary')} onChange={(v) => setVal('home_report_summary', v)} rows={3} />
            </div>
          </div>

          <div className="space-y-5 border-t border-border pt-5">
            <h3 className="text-sm font-bold text-foreground">Homepage: Impact Story & Newsletter</h3>
            <p className="text-xs text-muted-foreground">The Impact Story block only appears once a story title is set.</p>
            <div>
              <FieldLabel>Impact Story: Title</FieldLabel>
              <TextInput value={getVal('home_impact_story_title')} onChange={(v) => setVal('home_impact_story_title', v)} />
            </div>
            <div>
              <FieldLabel>Impact Story: Description</FieldLabel>
              <TextareaInput value={getVal('home_impact_story_description')} onChange={(v) => setVal('home_impact_story_description', v)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Impact Story: Image URL</FieldLabel>
                <TextInput value={getVal('home_impact_story_image')} onChange={(v) => setVal('home_impact_story_image', v)} placeholder="https://..." />
              </div>
              <div>
                <FieldLabel>Impact Story: Author</FieldLabel>
                <TextInput value={getVal('home_impact_story_author')} onChange={(v) => setVal('home_impact_story_author', v)} />
              </div>
            </div>
            <div>
              <FieldLabel>Impact Story: Full Story</FieldLabel>
              <TextareaInput value={getVal('home_impact_story_body')} onChange={(v) => setVal('home_impact_story_body', v)} rows={5} />
              <FieldHint>Separate paragraphs with a blank line. The Read Full Story button only appears when this is set.</FieldHint>
            </div>
            <div>
              <FieldLabel>Impact Story: Quote</FieldLabel>
              <TextareaInput value={getVal('home_impact_story_quote')} onChange={(v) => setVal('home_impact_story_quote', v)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Newsletter: Heading</FieldLabel>
                <TextInput value={getVal('home_newsletter_heading')} onChange={(v) => setVal('home_newsletter_heading', v)} placeholder="Stay Informed." />
              </div>
              <div>
                <FieldLabel>Newsletter: Description</FieldLabel>
                <TextInput value={getVal('home_newsletter_description')} onChange={(v) => setVal('home_newsletter_description', v)} />
              </div>
            </div>
          </div>

          <div className="space-y-5 border-t border-border pt-5">
            <h3 className="text-sm font-bold text-foreground">About Page: Core Values</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Values Section Heading</FieldLabel>
                <TextInput value={getVal('about_values_heading')} onChange={(v) => setVal('about_values_heading', v)} placeholder="Our Foundational Values" />
              </div>
              <div>
                <FieldLabel>Values Section Description</FieldLabel>
                <TextInput value={getVal('about_values_description')} onChange={(v) => setVal('about_values_description', v)} placeholder="We hold ourselves to strict..." />
              </div>
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg">
                <div className="col-span-1">
                  <FieldLabel>Value {i}: Title</FieldLabel>
                  <TextInput value={getVal(`about_value_${i}_title`)} onChange={(v) => setVal(`about_value_${i}_title`, v)} placeholder={`Value ${i}`} />
                </div>
                <div className="col-span-1">
                  <FieldLabel>Value {i}: Description</FieldLabel>
                  <TextInput value={getVal(`about_value_${i}_description`)} onChange={(v) => setVal(`about_value_${i}_description`, v)} placeholder={`Description ${i}`} />
                </div>
                <div className="col-span-1">
                  <FieldLabel>Value {i}: Badge Label</FieldLabel>
                  <TextInput value={getVal(`about_value_${i}_label`)} onChange={(v) => setVal(`about_value_${i}_label`, v)} placeholder={`Badge ${i}`} />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-5 border-t border-border pt-5">
            <h3 className="text-sm font-bold text-foreground">Legal / Registration</h3>
            <p className="text-xs text-muted-foreground">Only enter registration or tax claims that are factually true for your organization. Shown on the About page hero and the footer when set; hidden when blank.</p>
            <div>
              <FieldLabel>Registration Statement</FieldLabel>
              <TextInput value={getVal('legal_registration_statement')} onChange={(v) => setVal('legal_registration_statement', v)} placeholder="e.g. Registered under the Societies Act, 1860" />
            </div>
            <div>
              <FieldLabel>Donation Tax Note</FieldLabel>
              <TextInput value={getVal('donate_tax_note')} onChange={(v) => setVal('donate_tax_note', v)} placeholder="e.g. Yes, under Section 80G" />
              <FieldHint>Shown on the donation receipt. Leave blank to hide the tax-deductible row.</FieldHint>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={() => handleSave('content')} disabled={saving}
              className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Page Content'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'email' && (
        <div id="tabpanel-email" role="tabpanel" aria-labelledby="tab-email" className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-foreground">Email Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel>SMTP Host</FieldLabel>
              <TextInput value={getVal('email.smtpHost')} onChange={(v) => setVal('email.smtpHost', v)} placeholder="smtp.example.com" />
            </div>
            <div>
              <FieldLabel>SMTP Port</FieldLabel>
              <TextInput value={getVal('email.smtpPort')} onChange={(v) => setVal('email.smtpPort', v)} placeholder="587" />
            </div>
            <div>
              <FieldLabel>SMTP Username</FieldLabel>
              <TextInput value={getVal('email.smtpUser')} onChange={(v) => setVal('email.smtpUser', v)} placeholder="user@example.com" />
            </div>
            <div>
              <FieldLabel>SMTP Password</FieldLabel>
              <TextInput value={getVal('email.smtpPass')} onChange={(v) => setVal('email.smtpPass', v)} placeholder="••••••••" type="password" />
            </div>
            <div>
              <FieldLabel>Sender Name</FieldLabel>
              <TextInput value={getVal('email.senderName')} onChange={(v) => setVal('email.senderName', v)} placeholder="Your Organization" />
            </div>
            <div>
              <FieldLabel>Sender Email</FieldLabel>
              <TextInput value={getVal('email.senderEmail')} onChange={(v) => setVal('email.senderEmail', v)} placeholder="noreply@example.com" />
            </div>
          </div>
          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Notification Preferences</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">New Registration Alerts</p>
                  <p className="text-xs text-muted-foreground">Get notified when a new member registers</p>
                </div>
                <Toggle checked={getBool('email.notifNewRegistration')} onChange={(v) => setBool('email.notifNewRegistration', v)} ariaLabel="New Registration Alerts" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Application Updates</p>
                  <p className="text-xs text-muted-foreground">Notify on enrollment application changes</p>
                </div>
                <Toggle checked={getBool('email.notifApplication')} onChange={(v) => setBool('email.notifApplication', v)} ariaLabel="Application Updates" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Certificate Notifications</p>
                  <p className="text-xs text-muted-foreground">Alert when certificates are generated or approved</p>
                </div>
                <Toggle checked={getBool('email.notifCertificate')} onChange={(v) => setBool('email.notifCertificate', v)} ariaLabel="Certificate Notifications" />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => handleSave('email')} disabled={saving}
              className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Email Settings'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div id="tabpanel-security" role="tabpanel" aria-labelledby="tab-security" className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-foreground">Security Settings</h2>
          <div className="space-y-5">
            <div>
              <FieldLabel>Minimum Password Length</FieldLabel>
              <RangeSlider value={getNum('security.pwMinLength')} onChange={(v) => setNum('security.pwMinLength', v)} min={4} max={16} />
              <FieldHint>Minimum characters required for a valid password</FieldHint>
            </div>
            <div className="border-t border-border pt-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Password Requirements</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Require Special Characters</p>
                    <p className="text-xs text-muted-foreground">Passwords must contain !@#$%^&* etc.</p>
                  </div>
                  <Toggle checked={getBool('security.pwRequiresSpecial')} onChange={(v) => setBool('security.pwRequiresSpecial', v)} ariaLabel="Require Special Characters" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Require Numbers</p>
                    <p className="text-xs text-muted-foreground">Passwords must contain at least one digit</p>
                  </div>
                  <Toggle checked={getBool('security.pwRequiresNumber')} onChange={(v) => setBool('security.pwRequiresNumber', v)} ariaLabel="Require Numbers" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Require Uppercase Letters</p>
                    <p className="text-xs text-muted-foreground">Passwords must contain at least one capital letter</p>
                  </div>
                  <Toggle checked={getBool('security.pwRequiresUppercase')} onChange={(v) => setBool('security.pwRequiresUppercase', v)} ariaLabel="Require Uppercase Letters" />
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Session & Login</h3>
              <div className="space-y-5">
                <div>
                  <FieldLabel>Session Timeout (minutes)</FieldLabel>
                  <RangeSlider value={getNum('security.sessionTimeout')} onChange={(v) => setNum('security.sessionTimeout', v)} min={5} max={120} unit=" min" />
                  <FieldHint>Auto-logout after inactivity period</FieldHint>
                </div>
                <div>
                  <FieldLabel>Max Login Attempts</FieldLabel>
                  <RangeSlider value={getNum('security.maxLoginAttempts')} onChange={(v) => setNum('security.maxLoginAttempts', v)} min={3} max={10} />
                  <FieldHint>Lock account after this many failed attempts</FieldHint>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Require 2FA for admin accounts</p>
                  </div>
                  <Toggle checked={getBool('security.enable2FA')} onChange={(v) => setBool('security.enable2FA', v)} ariaLabel="Two-Factor Authentication" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => handleSave('security')} disabled={saving}
              className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div id="tabpanel-appearance" role="tabpanel" aria-labelledby="tab-appearance" className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-foreground">Appearance Settings</h2>
          <div>
            <FieldLabel>Theme</FieldLabel>
            <RadioGroup
              value={getVal('appearance.theme')}
              onChange={(v) => setVal('appearance.theme', v)}
              options={[{ value: 'Light', label: 'Light' }, { value: 'Dark', label: 'Dark' }, { value: 'System', label: 'System' }]}
            />
          </div>
          <div>
            <FieldLabel>Brand Color</FieldLabel>
            <div className="flex items-center gap-3">
              <input type="color" value={getVal('appearance.brandColor')} onChange={(e) => setVal('appearance.brandColor', e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5" />
              <TextInput value={getVal('appearance.brandColor')} onChange={(v) => setVal('appearance.brandColor', v)} placeholder="#2563EB" />
            </div>
          </div>
          <div>
            <FieldLabel>Font Size</FieldLabel>
            <RadioGroup
              value={getVal('appearance.fontSize')}
              onChange={(v) => setVal('appearance.fontSize', v)}
              options={[{ value: 'Small', label: 'Small' }, { value: 'Medium', label: 'Medium' }, { value: 'Large', label: 'Large' }]}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Collapsed Sidebar by Default</p>
              <p className="text-xs text-muted-foreground">Start with the sidebar in collapsed state</p>
            </div>
            <Toggle checked={getBool('appearance.sidebarCollapsedDefault')} onChange={(v) => setBool('appearance.sidebarCollapsedDefault', v)} ariaLabel="Collapsed Sidebar by Default" />
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => handleSave('appearance')} disabled={saving}
              className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Appearance Settings'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div id="tabpanel-system" role="tabpanel" aria-labelledby="tab-system" className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-foreground">System Settings</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">Temporarily disable public access to the site</p>
            </div>
            <Toggle checked={getBool('system.maintenanceMode')} onChange={(v) => setBool('system.maintenanceMode', v)} ariaLabel="Maintenance Mode" />
          </div>
          {getBool('system.maintenanceMode') && (
            <div>
              <FieldLabel>Maintenance Message</FieldLabel>
              <TextareaInput value={getVal('system.maintenanceMessage')} onChange={(v) => setVal('system.maintenanceMessage', v)}
                placeholder="We are currently performing scheduled maintenance. Please check back later." rows={3} />
              <FieldHint>This message will be displayed to visitors during maintenance</FieldHint>
            </div>
          )}
          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Backup Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Automatic Backups</p>
                  <p className="text-xs text-muted-foreground">Enable scheduled data backups</p>
                </div>
                <Toggle checked={getBool('system.autoBackup')} onChange={(v) => setBool('system.autoBackup', v)} ariaLabel="Automatic Backups" />
              </div>
              {getBool('system.autoBackup') && (
                <>
                  <div>
                    <FieldLabel>Backup Frequency</FieldLabel>
                    <RadioGroup
                      value={getVal('system.backupFrequency')}
                      onChange={(v) => setVal('system.backupFrequency', v)}
                      options={[{ value: 'Daily', label: 'Daily' }, { value: 'Weekly', label: 'Weekly' }, { value: 'Monthly', label: 'Monthly' }]}
                    />
                  </div>
                  <div>
                    <FieldLabel>Backup Retention (days)</FieldLabel>
                    <RangeSlider value={getNum('system.backupRetention')} onChange={(v) => setNum('system.backupRetention', v)} min={7} max={90} unit=" days" />
                    <FieldHint>How long to keep backup files before auto-deletion</FieldHint>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => handleSave('system')} disabled={saving}
              className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save System Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
