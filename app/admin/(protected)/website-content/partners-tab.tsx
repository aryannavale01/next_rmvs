'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from '@/lib/admin-stepup';

interface Partner { id: string; name: string; icon: string; }
interface Form { name: string; icon: string; }
const EMPTY: Form = { name: '', icon: 'HeartHandshake' };

export default function PartnersTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  useEffect(() => {
    fetch('/api/admin/partners')
      .then(r => r.json())
      .then(d => setItems(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(true); };
  const openEdit = (p: Partner) => { setForm({ name: p.name, icon: p.icon }); setEditing(p); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (!(await requireStepUpClient(window.location.pathname, editing ? 'update' : 'create'))) {
      setSaving(false);
      return;
    }
    const body = { name: form.name, icon: form.icon || 'HeartHandshake' };
    try {
      const url = editing ? `/api/admin/partners/${editing.id}` : '/api/admin/partners';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        const data = await res.json();
        const item = data.data || data;
        setItems(prev => editing ? prev.map(p => p.id === editing.id ? item : p) : [item, ...prev]);
      } else {
        const err = await res.json().catch(() => null);
        if (isStepUpRequiredResponse(res.status, err?.error)) {
          redirectToStepUp(window.location.pathname, editing ? 'update' : 'create');
          return;
        }
      }
    } catch (err) { console.error('Failed to save partner:', err); toast({ title: 'Error', description: 'Failed to save partner. Please try again.', variant: 'error' }); }
    setShowForm(false); setEditing(null); setSaving(false);
  };

  const del = async (id: string) => {
    const res = await fetch(`/api/admin/partners/${id}`, { method: 'DELETE' });
    if (res.ok) setItems(prev => prev.filter(p => p.id !== id));
    setDelId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Partners</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Manage partner logos shown on the homepage and impact page.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">
          <Plus className="w-3.5 h-3.5" /> Add Partner
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">{editing ? 'Edit Partner' : 'Add Partner'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Partner Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. UNICEF" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Icon Name</label>
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="HeartHandshake" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              <p className="text-[10px] text-muted-foreground mt-1">Lucide icon name. Default: HeartHandshake</p>
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
          : items.length === 0 ? <EmptyState icon={Users} title="No partners" description="Add partner organizations." actionText="Add Partner" onAction={openAdd} />
          : <div className="divide-y divide-border">{items.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">{p.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Icon: {p.icon}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDelId(p.id)} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}</div>}
      </div>

      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDelId(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-destructive" /></div>
            <h3 className="text-sm font-bold text-foreground mb-2">Delete Partner?</h3>
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
