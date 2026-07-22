'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/lib/admin-context';
import type {
  GeneralSettings,
  EmailSettings,
  SecuritySettings,
  AppearanceSettings,
  SystemSettings,
} from '@/lib/admin-types';
import {
  Download, RotateCcw, Globe, Mail, Shield, Palette, Server,
  Check,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'system', label: 'System', icon: Server },
] as const;

type TabKey = (typeof TAB_LIST)[number]['key'];

function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
}) {
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
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-0.5 ${
          checked ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
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
          <span
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
              value === opt.value ? 'border-primary' : 'border-border'
            }`}
          >
            {value === opt.value && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </span>
          {opt.label}
          <input
            type="radio"
            name={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
        </label>
      ))}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-foreground mb-1.5">
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground mt-1">{children}</p>;
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-card"
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-card"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TextareaInput({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-card resize-none"
    />
  );
}

function RangeSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-primary"
      />
      <span className="text-sm font-bold text-foreground min-w-[3rem] text-right">
        {value}{unit || ''}
      </span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { settings, updateSettings, resetAllData } = useAdmin();
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [general, setGeneral] = useState<GeneralSettings>(settings.general);
  const [email, setEmail] = useState<EmailSettings>(settings.email);
  const [security, setSecurity] = useState<SecuritySettings>(settings.security);
  const [appearance, setAppearance] = useState<AppearanceSettings>(settings.appearance);
  const [system, setSystem] = useState<SystemSettings>(settings.system);
  const [saved, setSaved] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(null), 2000);
  };

  const handleSave = (domain: TabKey) => {
    switch (domain) {
      case 'general':
        updateSettings('general', general);
        break;
      case 'email':
        updateSettings('email', email);
        break;
      case 'security':
        updateSettings('security', security);
        break;
      case 'appearance':
        updateSettings('appearance', appearance);
        break;
      case 'system':
        updateSettings('system', system);
        break;
    }
    flash(`${domain.charAt(0).toUpperCase() + domain.slice(1)} settings saved`);
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

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
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
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive border border-destructive/20 rounded-lg hover:bg-destructive-bg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Tabs */}
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

      {/* General Tab */}
      {activeTab === 'general' && (
        <div id="tabpanel-general" role="tabpanel" aria-labelledby="tab-general" className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-foreground">General Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel>Site Name</FieldLabel>
              <TextInput
                value={general.siteName}
                onChange={(v) => setGeneral({ ...general, siteName: v })}
                placeholder="Your Organization Name"
              />
            </div>
            <div>
              <FieldLabel>Logo Text</FieldLabel>
              <TextInput
                value={general.logo}
                onChange={(v) => setGeneral({ ...general, logo: v })}
                placeholder="Logo display text"
              />
            </div>
          </div>
          <div>
            <FieldLabel>Site Description</FieldLabel>
            <TextareaInput
              value={general.description}
              onChange={(v) => setGeneral({ ...general, description: v })}
              placeholder="Brief description of your organization"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel>Timezone</FieldLabel>
              <SelectInput
                value={general.timezone}
                onChange={(v) => setGeneral({ ...general, timezone: v })}
                options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
              />
            </div>
            <div>
              <FieldLabel>Language</FieldLabel>
              <SelectInput
                value={general.language}
                onChange={(v) => setGeneral({ ...general, language: v })}
                options={LANGUAGES}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleSave('general')}
              className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
              Save General Settings
            </button>
          </div>
        </div>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <div id="tabpanel-email" role="tabpanel" aria-labelledby="tab-email" className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-foreground">Email Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel>SMTP Host</FieldLabel>
              <TextInput
                value={email.smtpHost}
                onChange={(v) => setEmail({ ...email, smtpHost: v })}
                placeholder="smtp.example.com"
              />
            </div>
            <div>
              <FieldLabel>SMTP Port</FieldLabel>
              <TextInput
                value={email.smtpPort}
                onChange={(v) => setEmail({ ...email, smtpPort: v })}
                placeholder="587"
              />
            </div>
            <div>
              <FieldLabel>SMTP Username</FieldLabel>
              <TextInput
                value={email.smtpUser}
                onChange={(v) => setEmail({ ...email, smtpUser: v })}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <FieldLabel>SMTP Password</FieldLabel>
              <TextInput
                value={email.smtpPass || ''}
                onChange={(v) => setEmail({ ...email, smtpPass: v })}
                placeholder="••••••••"
                type="password"
              />
            </div>
            <div>
              <FieldLabel>Sender Name</FieldLabel>
              <TextInput
                value={email.senderName}
                onChange={(v) => setEmail({ ...email, senderName: v })}
                placeholder="Your Organization"
              />
            </div>
            <div>
              <FieldLabel>Sender Email</FieldLabel>
              <TextInput
                value={email.senderEmail}
                onChange={(v) => setEmail({ ...email, senderEmail: v })}
                placeholder="noreply@example.com"
              />
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
                <Toggle
                  checked={email.notifNewRegistration}
                  onChange={(v) => setEmail({ ...email, notifNewRegistration: v })}
                  ariaLabel="New Registration Alerts"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Application Updates</p>
                  <p className="text-xs text-muted-foreground">Notify on enrollment application changes</p>
                </div>
                <Toggle
                  checked={email.notifApplication}
                  onChange={(v) => setEmail({ ...email, notifApplication: v })}
                  ariaLabel="Application Updates"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Certificate Notifications</p>
                  <p className="text-xs text-muted-foreground">Alert when certificates are generated or approved</p>
                </div>
                <Toggle
                  checked={email.notifCertificate}
                  onChange={(v) => setEmail({ ...email, notifCertificate: v })}
                  ariaLabel="Certificate Notifications"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleSave('email')}
              className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
              Save Email Settings
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div id="tabpanel-security" role="tabpanel" aria-labelledby="tab-security" className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-foreground">Security Settings</h2>

          <div className="space-y-5">
            <div>
              <FieldLabel>Minimum Password Length</FieldLabel>
              <RangeSlider
                value={security.pwMinLength}
                onChange={(v) => setSecurity({ ...security, pwMinLength: v })}
                min={4}
                max={16}
              />
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
                  <Toggle
                    checked={security.pwRequiresSpecial}
                    onChange={(v) => setSecurity({ ...security, pwRequiresSpecial: v })}
                    ariaLabel="Require Special Characters"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Require Numbers</p>
                    <p className="text-xs text-muted-foreground">Passwords must contain at least one digit</p>
                  </div>
                  <Toggle
                    checked={security.pwRequiresNumber}
                    onChange={(v) => setSecurity({ ...security, pwRequiresNumber: v })}
                    ariaLabel="Require Numbers"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Require Uppercase Letters</p>
                    <p className="text-xs text-muted-foreground">Passwords must contain at least one capital letter</p>
                  </div>
                  <Toggle
                    checked={security.pwRequiresUppercase}
                    onChange={(v) => setSecurity({ ...security, pwRequiresUppercase: v })}
                    ariaLabel="Require Uppercase Letters"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Session & Login</h3>
              <div className="space-y-5">
                <div>
                  <FieldLabel>Session Timeout (minutes)</FieldLabel>
                  <RangeSlider
                    value={security.sessionTimeout}
                    onChange={(v) => setSecurity({ ...security, sessionTimeout: v })}
                    min={5}
                    max={120}
                    unit=" min"
                  />
                  <FieldHint>Auto-logout after inactivity period</FieldHint>
                </div>
                <div>
                  <FieldLabel>Max Login Attempts</FieldLabel>
                  <RangeSlider
                    value={security.maxLoginAttempts}
                    onChange={(v) => setSecurity({ ...security, maxLoginAttempts: v })}
                    min={3}
                    max={10}
                  />
                  <FieldHint>Lock account after this many failed attempts</FieldHint>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Require 2FA for admin accounts</p>
                  </div>
                  <Toggle
                    checked={security.enable2FA}
                    onChange={(v) => setSecurity({ ...security, enable2FA: v })}
                    ariaLabel="Two-Factor Authentication"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleSave('security')}
              className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
              Save Security Settings
            </button>
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div id="tabpanel-appearance" role="tabpanel" aria-labelledby="tab-appearance" className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-foreground">Appearance Settings</h2>

          <div>
            <FieldLabel>Theme</FieldLabel>
            <RadioGroup
              value={appearance.theme}
              onChange={(v) => setAppearance({ ...appearance, theme: v as AppearanceSettings['theme'] })}
              options={[
                { value: 'Light', label: 'Light' },
                { value: 'Dark', label: 'Dark' },
                { value: 'System', label: 'System' },
              ]}
            />
          </div>

          <div>
            <FieldLabel>Brand Color</FieldLabel>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={appearance.brandColor}
                onChange={(e) => setAppearance({ ...appearance, brandColor: e.target.value })}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5"
              />
              <TextInput
                value={appearance.brandColor}
                onChange={(v) => setAppearance({ ...appearance, brandColor: v })}
                placeholder="#2563EB"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Font Size</FieldLabel>
            <RadioGroup
              value={appearance.fontSize}
              onChange={(v) => setAppearance({ ...appearance, fontSize: v as AppearanceSettings['fontSize'] })}
              options={[
                { value: 'Small', label: 'Small' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Large', label: 'Large' },
              ]}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Collapsed Sidebar by Default</p>
              <p className="text-xs text-muted-foreground">Start with the sidebar in collapsed state</p>
            </div>
            <Toggle
              checked={appearance.sidebarCollapsedDefault}
              onChange={(v) => setAppearance({ ...appearance, sidebarCollapsedDefault: v })}
              ariaLabel="Collapsed Sidebar by Default"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleSave('appearance')}
              className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
              Save Appearance Settings
            </button>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div id="tabpanel-system" role="tabpanel" aria-labelledby="tab-system" className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-foreground">System Settings</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">Temporarily disable public access to the site</p>
            </div>
            <Toggle
              checked={system.maintenanceMode}
              onChange={(v) => setSystem({ ...system, maintenanceMode: v })}
              ariaLabel="Maintenance Mode"
            />
          </div>

          {system.maintenanceMode && (
            <div>
              <FieldLabel>Maintenance Message</FieldLabel>
              <TextareaInput
                value={system.maintenanceMessage}
                onChange={(v) => setSystem({ ...system, maintenanceMessage: v })}
                placeholder="We are currently performing scheduled maintenance. Please check back later."
                rows={3}
              />
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
                <Toggle
                  checked={system.autoBackup}
                  onChange={(v) => setSystem({ ...system, autoBackup: v })}
                  ariaLabel="Automatic Backups"
                />
              </div>

              {system.autoBackup && (
                <>
                  <div>
                    <FieldLabel>Backup Frequency</FieldLabel>
                    <RadioGroup
                      value={system.backupFrequency}
                      onChange={(v) => setSystem({ ...system, backupFrequency: v as SystemSettings['backupFrequency'] })}
                      options={[
                        { value: 'Daily', label: 'Daily' },
                        { value: 'Weekly', label: 'Weekly' },
                        { value: 'Monthly', label: 'Monthly' },
                      ]}
                    />
                  </div>
                  <div>
                    <FieldLabel>Backup Retention (days)</FieldLabel>
                    <RangeSlider
                      value={system.backupRetention}
                      onChange={(v) => setSystem({ ...system, backupRetention: v })}
                      min={7}
                      max={90}
                      unit=" days"
                    />
                    <FieldHint>How long to keep backup files before auto-deletion</FieldHint>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleSave('system')}
              className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
              Save System Settings
            </button>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          resetAllData();
          flash('All data reset to defaults');
        }}
        title="Reset All Data"
        description="Are you sure you want to reset all data to defaults? This cannot be undone."
        confirmLabel="Reset Data"
      />
    </div>
  );
}
