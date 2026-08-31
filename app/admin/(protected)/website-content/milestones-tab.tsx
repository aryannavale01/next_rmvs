'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Award } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from '@/lib/admin-stepup';

interface Milestone { id: string; year: number; title: string; description: string | null; }
interface Form { year: number; title: string; description: string; }
const EMPTY: Form = { year: new Date().getFullYear(), title: '', description: '' };

export default function MilestonesTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  useEffect(() => {
    fetch('/api/admin/milestones')
      .then(r => r.json())
      .then(d => setItems(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(true); };
  const openEdit = (m: Milestone) => { setForm({ year: m.year, title: m.title, description: m.description ?? '' }); setEditing(m); setShowForm(true); };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    if (!(await requireStepUpClient(window.location.pathname, editing ? 'update' : 'create'))) {
      setSaving(false);
      return;
    }
    const body = { year: form.year, title: form.title, description: form.description || null };
    try {
      const url = editing ? `/api/admin/milestones/${editing.id}` : '/api/admin/milestones';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        const data = await res.json();
        const item = data.data || data;
        setItems(prev => editing ? prev.map(m => m.id === editing.id ? item : m) : [...prev, item].sort((a, b) => a.year - b.year));
      } else {
        const err = await res.json().catch(() => null);
        if (isStepUpRequiredResponse(res.status, err?.error)) {
          redirectToStepUp(window.location.pathname, editing ? 'update' : 'create');
          return;
        }
      }
    } catch (err) { console.error('Failed to save milestone:', err); toast({ title: 'Error', description: 'Failed to save milestone. Please try again.', variant: 'error' }); }
    setShowForm(false); setEditing(null); setSaving(false);
  };

  const del = async (id: string) => {
    const res = await fetch(`/api/admin/milestones/${id}`, { method: 'DELETE' });
    if (res.ok) setItems(prev => prev.filter(m => m.id !== id));
    setDelId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Milestones</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Timeline milestones displayed on the homepage and about page.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">
          <Plus className="w-3.5 h-3.5" /> Add Milestone
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">{editing ? 'Edit Milestone' : 'Add Milestone'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Year *</label>
              <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Founded" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Brief description of this milestone..." className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" />
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
          : items.length === 0 ? <EmptyState icon={Award} title="No milestones" description="Add timeline milestones." actionText="Add Milestone" onAction={openAdd} />
          : <div className="divide-y divide-border">{items.map(m => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Award className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground">{m.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Year: {m.year}{m.description ? ` — ${m.description.slice(0, 60)}${m.description.length > 60 ? '...' : ''}` : ''}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(m)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDelId(m.id)} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}</div>}
      </div>

      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDelId(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-destructive" /></div>
            <h3 className="text-sm font-bold text-foreground mb-2">Delete Milestone?</h3>
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
