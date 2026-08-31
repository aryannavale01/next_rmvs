'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, MapPin } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from '@/lib/admin-stepup';

interface Location { id: string; name: string; location: string | null; type: string | null; coordinator: string | null; staffCount: number | null; activePrograms: string[] | null; contactEmail: string | null; phone: string | null; address: string | null; coordinates: string | null; description: string | null; }

interface Form {
  name: string; location: string; type: string; coordinator: string;
  staffCount: string; activePrograms: string; contactEmail: string;
  phone: string; address: string; coordinates: string; description: string;
}

const EMPTY: Form = { name: '', location: '', type: '', coordinator: '', staffCount: '0', activePrograms: '', contactEmail: '', phone: '', address: '', coordinates: '', description: '' };

export default function LocationsTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  useEffect(() => { fetch('/api/admin/locations').then(r => r.json()).then(d => setItems(d.data || [])).finally(() => setLoading(false)); }, []);

  const openAdd = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(true); };
  const openEdit = (l: Location) => {
    setForm({
      name: l.name, location: l.location ?? '', type: l.type ?? '', coordinator: l.coordinator ?? '',
      staffCount: String(l.staffCount ?? 0), activePrograms: (l.activePrograms ?? []).join(', '),
      contactEmail: l.contactEmail ?? '', phone: l.phone ?? '', address: l.address ?? '',
      coordinates: l.coordinates ?? '', description: l.description ?? '',
    });
    setEditing(l); setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (!(await requireStepUpClient(window.location.pathname, editing ? 'update' : 'create'))) {
      setSaving(false);
      return;
    }
    const body = {
      name: form.name, location: form.location || null, type: form.type || null,
      coordinator: form.coordinator || null, staffCount: Number(form.staffCount) || 0,
      activePrograms: form.activePrograms ? form.activePrograms.split(',').map(s => s.trim()).filter(Boolean) : [],
      contactEmail: form.contactEmail || null, phone: form.phone || null,
      address: form.address || null, coordinates: form.coordinates || null, description: form.description || null,
    };
    try {
      const url = editing ? `/api/admin/locations/${editing.id}` : '/api/admin/locations';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { const payload = await res.json(); const data = payload?.data ?? payload; setItems(prev => editing ? prev.map(l => l.id === editing.id ? data : l) : [data, ...prev]); }
      else {
        const err = await res.json().catch(() => null);
        if (isStepUpRequiredResponse(res.status, err?.error)) {
          redirectToStepUp(window.location.pathname, editing ? 'update' : 'create');
          return;
        }
      }
    } catch (err) { console.error('Failed to save location:', err); toast({ title: 'Error', description: 'Failed to save location. Please try again.', variant: 'error' }); }
    setShowForm(false); setEditing(null); setSaving(false);
  };

  const del = async (id: string) => { const res = await fetch(`/api/admin/locations/${id}`, { method: 'DELETE' }); if (res.ok) setItems(prev => prev.filter(l => l.id !== id)); setDelId(null); };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Location</button></div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-foreground">{editing ? 'Edit Location' : 'Add Location'}</h3><button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button></div>
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Location</label><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Type</label><input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Coordinator</label><input value={form.coordinator} onChange={e => setForm(f => ({ ...f, coordinator: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Staff Count</label><input type="number" value={form.staffCount} onChange={e => setForm(f => ({ ...f, staffCount: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Active Programs (comma-separated)</label><input value={form.activePrograms} onChange={e => setForm(f => ({ ...f, activePrograms: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Contact Email</label><input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Address</label><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Coordinates</label><input value={form.coordinates} onChange={e => setForm(f => ({ ...f, coordinates: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" /></div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-5">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-primary-light">Cancel</button>
            <button onClick={save} disabled={saving} className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? <div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>
          : items.length === 0 ? <EmptyState icon={MapPin} title="No locations" description="Add community hub locations." actionText="Add Location" onAction={openAdd} />
          : <div className="divide-y divide-border">{items.map(l => (
            <div key={l.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground truncate">{l.name}</h4>
                  {l.type && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary">{l.type}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{l.location ?? 'No location'}{l.coordinator ? ` \u2022 ${l.coordinator}` : ''}{l.staffCount ? ` \u2022 ${l.staffCount} staff` : ''}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(l)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDelId(l.id)} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}</div>}
      </div>

      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDelId(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-destructive" /></div>
            <h3 className="text-sm font-bold text-foreground mb-2">Delete Location?</h3>
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
