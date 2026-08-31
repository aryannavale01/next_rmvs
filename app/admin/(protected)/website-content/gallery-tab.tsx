'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Image } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import ImageUpload from '@/components/ui/image-upload';
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from '@/lib/admin-stepup';

interface GalleryItem { id: string; title: string; category: string; image: string | null; description: string | null; location: string | null; loggedDate: string | null; isVideo: boolean; }
interface Form { title: string; category: string; image: string; description: string; location: string; loggedDate: string; isVideo: boolean; }
const EMPTY: Form = { title: '', category: '', image: '', description: '', location: '', loggedDate: '', isVideo: false };

export default function GalleryTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  useEffect(() => { fetch('/api/admin/gallery-items').then(r => r.json()).then(d => setItems(d.data || [])).finally(() => setLoading(false)); }, []);

  const openAdd = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(true); };
  const openEdit = (g: GalleryItem) => { setForm({ title: g.title, category: g.category, image: g.image ?? '', description: g.description ?? '', location: g.location ?? '', loggedDate: g.loggedDate ?? '', isVideo: g.isVideo }); setEditing(g); setShowForm(true); };

  const save = async () => {
    if (!form.title.trim() || !form.category.trim()) return;
    setSaving(true);
    if (!(await requireStepUpClient(window.location.pathname, editing ? 'update' : 'create'))) {
      setSaving(false);
      return;
    }
    const body = { title: form.title, category: form.category, image: form.image || null, description: form.description || null, location: form.location || null, loggedDate: form.loggedDate || null, isVideo: form.isVideo };
    try {
      const url = editing ? `/api/admin/gallery-items/${editing.id}` : '/api/admin/gallery-items';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { const payload = await res.json(); const data = payload?.data ?? payload; setItems(prev => editing ? prev.map(g => g.id === editing.id ? data : g) : [data, ...prev]); }
      else {
        const err = await res.json().catch(() => null);
        if (isStepUpRequiredResponse(res.status, err?.error)) {
          redirectToStepUp(window.location.pathname, editing ? 'update' : 'create');
          return;
        }
      }
    } catch (err) { console.error('Failed to save gallery item:', err); toast({ title: 'Error', description: 'Failed to save gallery item. Please try again.', variant: 'error' }); }
    setShowForm(false); setEditing(null); setSaving(false);
  };

  const del = async (id: string) => { const res = await fetch(`/api/admin/gallery-items/${id}`, { method: 'DELETE' }); if (res.ok) setItems(prev => prev.filter(g => g.id !== id)); setDelId(null); };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Gallery Item</button></div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-foreground">{editing ? 'Edit Gallery Item' : 'Add Gallery Item'}</h3><button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button></div>
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Category *</label><input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Image</label><ImageUpload value={form.image} onChange={u => setForm(f => ({ ...f, image: u }))} label="image" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Location</label><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Senegal, Rwanda" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Logged Date</label><input type="date" value={form.loggedDate} onChange={e => setForm(f => ({ ...f, loggedDate: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div className="col-span-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isVideo} onChange={e => setForm(f => ({ ...f, isVideo: e.target.checked }))} className="rounded border-border" /><span className="text-xs font-semibold text-foreground">Video Item</span></label></div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-5">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-primary-light">Cancel</button>
            <button onClick={save} disabled={saving} className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? <div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>
          : items.length === 0 ? <EmptyState icon={Image} title="No gallery items" description="Add photos and videos to the gallery." actionText="Add Item" onAction={openAdd} />
          : <div className="divide-y divide-border">{items.map(g => (
            <div key={g.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Image className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground truncate">{g.title}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary">{g.category}</span>
                  {g.isVideo && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">Video</span>}
                </div>
                {g.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{g.description}</p>}
                {g.location && <p className="text-[10px] text-muted-foreground mt-0.5">📍 {g.location}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(g)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDelId(g.id)} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}</div>}
      </div>

      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDelId(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-destructive" /></div>
            <h3 className="text-sm font-bold text-foreground mb-2">Delete Gallery Item?</h3>
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
