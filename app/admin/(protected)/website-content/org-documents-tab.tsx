'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, FileText, ExternalLink } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';

interface OrgDocument {
  id: string;
  type: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  year: number | null;
  isActive: boolean;
  displayOrder: number;
}
interface Form {
  type: string;
  title: string;
  description: string;
  fileUrl: string;
  year: string;
  displayOrder: string;
  isActive: boolean;
}
const EMPTY: Form = { type: 'ANNUAL_REPORT', title: '', description: '', fileUrl: '', year: '', displayOrder: '0', isActive: true };

const DOC_TYPES = [
  'NGO_REGISTRATION_CERTIFICATE', 'PAN_CARD', 'TAN_CARD', 'NITI_AAYOG_REGISTRATION',
  'CSR1', 'ANNUAL_REPORT', 'WORK_ORDER', 'ORG_PROFILE', 'CERTIFICATE_12A', 'CERTIFICATE_80G',
];

export default function OrgDocumentsTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<OrgDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OrgDocument | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  useEffect(() => {
    fetch('/api/admin/org-documents')
      .then(r => r.json())
      .then(d => setItems(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(true); };
  const openEdit = (d: OrgDocument) => {
    setForm({
      type: d.type, title: d.title, description: d.description ?? '',
      fileUrl: d.fileUrl ?? '', year: d.year?.toString() ?? '',
      displayOrder: d.displayOrder.toString(), isActive: d.isActive,
    });
    setEditing(d); setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const body = {
      type: form.type, title: form.title, description: form.description || null,
      fileUrl: form.fileUrl || null, year: form.year ? parseInt(form.year) : null,
      displayOrder: parseInt(form.displayOrder) || 0, isActive: form.isActive,
    };
    try {
      const url = editing ? `/api/admin/org-documents/${editing.id}` : '/api/admin/org-documents';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        const data = await res.json();
        const item = data.data || data;
        setItems(prev => editing ? prev.map(d => d.id === editing.id ? item : d) : [item, ...prev]);
      }
    } catch (err) { console.error('Failed to save org document:', err); toast({ title: 'Error', description: 'Failed to save org document. Please try again.', variant: 'error' }); }
    setShowForm(false); setEditing(null); setSaving(false);
  };

  const del = async (id: string) => {
    const res = await fetch(`/api/admin/org-documents/${id}`, { method: 'DELETE' });
    if (res.ok) setItems(prev => prev.filter(d => d.id !== id));
    setDelId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Organisation Documents</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Compliance documents displayed on the About page (certificates, reports, etc).</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">
          <Plus className="w-3.5 h-3.5" /> Add Document
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">{editing ? 'Edit Document' : 'Add Document'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Document Type *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Year</label>
              <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2023" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Annual Report 2023" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">File URL</label>
              <input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://..." className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Display Order</label>
              <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded border-border text-primary focus:ring-primary" />
                <span className="text-xs font-semibold text-muted-foreground">Active</span>
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-5">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-primary-light">Cancel</button>
            <button onClick={save} disabled={saving} className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? <div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>
          : items.length === 0 ? <EmptyState icon={FileText} title="No documents" description="Add compliance documents." actionText="Add Document" onAction={openAdd} />
          : <div className="divide-y divide-border">{items.map(d => (
            <div key={d.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">{d.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{d.type.replace(/_/g, ' ')}{d.year ? ` (${d.year})` : ''}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"><ExternalLink className="w-3.5 h-3.5" /></a>}
                <button onClick={() => openEdit(d)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDelId(d.id)} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}</div>}
      </div>

      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDelId(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-destructive" /></div>
            <h3 className="text-sm font-bold text-foreground mb-2">Delete Document?</h3>
            <p className="text-xs text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelId(null)} className="flex-1 px-4 py-2.5 text-xs font-semibold border border-border rounded-lg hover:bg-primary-light">Cancel</button>
              <button onClick={() => del(delId)} className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
