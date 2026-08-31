'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Users, RotateCcw } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import ImageUpload from '@/components/ui/image-upload';
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from '@/lib/admin-stepup';

interface Leader { id: string; name: string; role: string; status?: string; image: string | null; department: string | null; bio: string | null; quote: string | null; }
interface Form { name: string; role: string; image: string; department: string; bio: string; quote: string; }
const EMPTY: Form = { name: '', role: '', image: '', department: '', bio: '', quote: '' };

export default function LeadershipTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Leader | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [showDeleted, setShowDeleted] = useState(false);

  const loadItems = useCallback(() => {
    void Promise.resolve().then(() => {
      setLoading(true);
    });
    const params = new URLSearchParams();
    if (showDeleted) params.set('includeDeleted', 'true');
    fetch(`/api/admin/leaders?${params}`)
      .then(r => r.json())
      .then(d => setItems(d.data || []))
      .finally(() => setLoading(false));
  }, [showDeleted]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const openAdd = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(true); };
  const openEdit = (l: Leader) => { setForm({ name: l.name, role: l.role, image: l.image ?? '', department: l.department ?? '', bio: l.bio ?? '', quote: l.quote ?? '' }); setEditing(l); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim() || !form.role.trim()) return;
    setSaving(true);
    if (!(await requireStepUpClient(window.location.pathname, editing ? 'update' : 'create'))) {
      setSaving(false);
      return;
    }
    const body = { name: form.name, role: form.role, image: form.image || null, department: form.department || null, bio: form.bio || null, quote: form.quote || null };
    try {
      const url = editing ? `/api/admin/leaders/${editing.id}` : '/api/admin/leaders';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { const data = await res.json(); const leader = data.data || data; setItems(prev => editing ? prev.map(l => l.id === editing.id ? leader : l) : [leader, ...prev]); }
      else {
        const err = await res.json().catch(() => null);
        if (isStepUpRequiredResponse(res.status, err?.error)) {
          redirectToStepUp(window.location.pathname, editing ? 'update' : 'create');
          return;
        }
      }
    } catch (err) { console.error('Failed to save leader:', err); toast({ title: 'Error', description: 'Failed to save leader. Please try again.', variant: 'error' }); }
    setShowForm(false); setEditing(null); setSaving(false);
  };

  const del = async (id: string) => {
    const res = await fetch(`/api/admin/leaders/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const data = await res.json();
      if (showDeleted) {
        setItems(prev => prev.map(l => l.id === id ? { ...l, status: 'deleted' } : l));
      } else {
        setItems(prev => prev.filter(l => l.id !== id));
      }
    }
    setDelId(null);
  };

  const restore = async (id: string) => {
    const res = await fetch(`/api/admin/leaders/${id}/restore`, { method: 'PATCH' });
    if (res.ok) {
      if (showDeleted) {
        setItems(prev => prev.map(l => l.id === id ? { ...l, status: 'active' } : l));
      } else {
        setItems(prev => prev.filter(l => l.id !== id));
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowDeleted(!showDeleted)}
          className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${showDeleted ? 'border-warning bg-warning-bg text-warning-text' : 'border-border text-muted-foreground hover:bg-accent'}`}
        >
          {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
        </button>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Leader</button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-foreground">{editing ? 'Edit Leader' : 'Add Leader'}</h3><button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button></div>
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Role *</label><input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Department</label><input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Image</label><ImageUpload value={form.image} onChange={u => setForm(f => ({ ...f, image: u }))} label="photo" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Bio</label><textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Personal Quote</label><textarea value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} rows={2} placeholder="Shown in leader biography modal" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" /></div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-5">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-primary-light">Cancel</button>
            <button onClick={save} disabled={saving} className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? <div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>
          : items.length === 0 ? <EmptyState icon={Users} title="No leaders" description="Add leadership team members." actionText="Add Leader" onAction={openAdd} />
          : <div className="divide-y divide-border">{items.map(l => (
            <div key={l.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors ${l.status === 'deleted' ? 'opacity-50' : ''}`}>
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">{l.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{l.role}{l.department ? ` \u2022 ${l.department}` : ''}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {l.status === 'deleted' ? (
                  <button onClick={() => restore(l.id)} className="p-1.5 rounded-md hover:bg-success-bg text-muted-foreground hover:text-success-text" title="Restore"><RotateCcw className="w-3.5 h-3.5" /></button>
                ) : (
                  <>
                    <button onClick={() => openEdit(l)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDelId(l.id)} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </>
                )}
              </div>
            </div>
          ))}</div>}
      </div>

      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDelId(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-destructive" /></div>
            <h3 className="text-sm font-bold text-foreground mb-2">Delete Leader?</h3>
            <p className="text-xs text-muted-foreground mb-6">This leader will be soft-deleted and can be restored later.</p>
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
