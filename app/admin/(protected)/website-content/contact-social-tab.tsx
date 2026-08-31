'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

interface SiteSetting { id: string; key: string; value: string; label: string; category: string | null; }

const SETTINGS_CONFIG = [
  { key: 'contact_phone', label: 'Contact Phone', placeholder: '+91 88000 04773' },
  { key: 'contact_email', label: 'Contact Email', placeholder: 'info@compassionglobal.org' },
  { key: 'contact_address', label: 'Contact Address', placeholder: '2nd Floor, A-Wing...' },
  { key: 'office_hours', label: 'Office Hours', placeholder: 'Monday to Friday, 10:00 AM to 06:00 PM' },
  { key: 'social_facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/...' },
  { key: 'social_instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/...' },
  { key: 'social_youtube', label: 'YouTube URL', placeholder: 'https://youtube.com/...' },
];

export default function ContactSocialTab() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/admin/site-settings')
      .then(r => r.json())
      .then(d => {
        const items: SiteSetting[] = d.data || [];
        setSettings(items);
        const v: Record<string, string> = {};
        items.forEach(s => { v[s.key] = s.value; });
        setValues(v);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    const promises = SETTINGS_CONFIG.map(cfg => {
      const current = settings.find(s => s.key === cfg.key);
      const val = values[cfg.key] || '';
      if (current) {
        return fetch(`/api/admin/site-settings/${current.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: val }) });
      } else {
        return fetch('/api/admin/site-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: cfg.key, value: val, label: cfg.label, category: 'contact_social' }) });
      }
    });
    await Promise.allSettled(promises);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Contact Information & Social Links</h3>
          <p className="text-xs text-muted-foreground mt-0.5">These settings are displayed in the website footer and contact page.</p>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50"><Save className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save Settings'}</button>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        {loading ? <div className="p-8 text-center text-xs text-muted-foreground">Loading settings...</div> : (
          <div className="space-y-5 max-w-lg">
            {SETTINGS_CONFIG.map(cfg => (
              <div key={cfg.key}>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">{cfg.label}</label>
                <input
                  value={values[cfg.key] || ''}
                  onChange={e => setValues(v => ({ ...v, [cfg.key]: e.target.value }))}
                  placeholder={cfg.placeholder}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
