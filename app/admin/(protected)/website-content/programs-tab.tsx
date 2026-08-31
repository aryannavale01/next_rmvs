'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Eye } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import ImageUpload from '@/components/ui/image-upload';
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from '@/lib/admin-stepup';

interface Program {
  id: string; title: string; category: string; description: string;
  goal: number | null; raised: number | null; image: string | null;
  isStrategic: boolean; visibility: 'homepage' | 'programs' | 'both';
}

interface Form {
  title: string; category: string; description: string;
  goal: string; raised: string; image: string;
  isStrategic: boolean; visibility: string;
}

const EMPTY: Form = { title: '', category: '', description: '', goal: '0', raised: '0', image: '', isStrategic: false, visibility: 'both' };
const VIS = [{ v: 'both', l: 'Both Pages' }, { v: 'homepage', l: 'Homepage Only' }, { v: 'programs', l: 'Programs Page Only' }];
const visBadge = (v: string) => v === 'both' ? 'bg-success-bg text-success-text' : v === 'homepage' ? 'bg-primary-light text-primary' : 'bg-warning-bg text-warning-text';
const visLabel = (v: string) => v === 'both' ? 'Both Pages' : v === 'homepage' ? 'Homepage Only' : 'Programs Page Only';

export default function ProgramsTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  useEffect(() => {
    fetch('/api/admin/programs').then(r => r.json()).then(d => setItems(d.data || [])).finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(true); };
  const openEdit = (p: Program) => {
    setForm({ title: p.title, category: p.category, description: p.description, goal: String(p.goal ?? 0), raised: String(p.raised ?? 0), image: p.image ?? '', isStrategic: p.isStrategic, visibility: p.visibility });
    setEditing(p); setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.category.trim() || !form.description.trim()) return;
    setSaving(true);
    if (!(await requireStepUpClient(window.location.pathname, editing ? 'update' : 'create'))) {
      setSaving(false);
      return;
    }
    const body = { title: form.title, category: form.category, description: form.description, goal: Number(form.goal) || 0, raised: Number(form.raised) || 0, image: form.image || null, isStrategic: form.isStrategic, visibility: form.visibility };
    try {
      const url = editing ? `/api/admin/programs/${editing.id}` : '/api/admin/programs';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        const payload = await res.json();
        const data = payload?.data ?? payload;
        setItems(prev => editing ? prev.map(p => p.id === editing.id ? data : p) : [data, ...prev]);
      } else {
        const err = await res.json().catch(() => null);
        if (isStepUpRequiredResponse(res.status, err?.error)) {
          redirectToStepUp(window.location.pathname, editing ? 'update' : 'create');
          return;
        }
      }
    } catch (err) { console.error('Failed to save program:', err); toast({ title: 'Error', description: 'Failed to save program. Please try again.', variant: 'error' }); }
    setShowForm(false); setEditing(null); setSaving(false);
  };

  const del = async (id: string) => {
    const res = await fetch(`/api/admin/programs/${id}`, { method: 'DELETE' });
    if (res.ok) setItems(prev => prev.filter(p => p.id !== id));
    setDelId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Program</button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">{editing ? 'Edit Program' : 'Add Program'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Category *</label><input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Visibility</label><select value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card">{VIS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Goal</label><input type="number" value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Raised</label><input type="number" value={form.raised} onChange={e => setForm(f => ({ ...f, raised: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Image</label><ImageUpload value={form.image} onChange={u => setForm(f => ({ ...f, image: u }))} label="image" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Description *</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" /></div>
            <div className="col-span-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isStrategic} onChange={e => setForm(f => ({ ...f, isStrategic: e.target.checked }))} className="rounded border-border" /><span className="text-xs font-semibold text-foreground">Strategic Program</span></label></div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-5">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-primary-light">Cancel</button>
            <button onClick={save} disabled={saving} className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? <div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>
          : items.length === 0 ? <EmptyState icon={Eye} title="No programs" description="Add programs to populate the website." actionText="Add Program" onAction={openAdd} />
          : <div className="divide-y divide-border">{items.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Eye className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-foreground truncate">{p.title}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${visBadge(p.visibility)}`}>{visLabel(p.visibility)}</span>
                  {p.isStrategic && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">Strategic</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{p.category}{p.goal ? ` \u2022 Goal: \u20B9${Number(p.goal).toLocaleString()}` : ''}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDelId(p.id)} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}</div>}
      </div>

      {delId && <DeleteModal title="Delete Program?" onConfirm={() => del(delId)} onCancel={() => setDelId(null)} />}
    </div>
  );
}

function DeleteModal({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-destructive" /></div>
        <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-xs font-semibold border border-border rounded-lg hover:bg-primary-light">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}
