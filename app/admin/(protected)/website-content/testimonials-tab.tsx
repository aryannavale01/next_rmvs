'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Quote } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import ImageUpload from '@/components/ui/image-upload';
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from '@/lib/admin-stepup';

interface Testimonial { id: string; name: string; role: string | null; quote: string; rating: number; avatarUrl: string | null; courseId: string | null; initials: string | null; course: { id: string; title: string } | null; }
interface Form { name: string; role: string; quote: string; rating: string; avatarUrl: string; courseId: string; initials: string; }
const EMPTY: Form = { name: '', role: '', quote: '', rating: '5', avatarUrl: '', courseId: '', initials: '' };

export default function TestimonialsTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  useEffect(() => { fetch('/api/admin/testimonials').then(r => r.json()).then(d => setItems(d.data || [])).finally(() => setLoading(false)); }, []);

  const openAdd = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(true); };
  const openEdit = (t: Testimonial) => { setForm({ name: t.name, role: t.role ?? '', quote: t.quote, rating: String(t.rating), avatarUrl: t.avatarUrl ?? '', courseId: t.courseId ?? '', initials: t.initials ?? '' }); setEditing(t); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim() || !form.quote.trim()) return;
    setSaving(true);
    if (!(await requireStepUpClient(window.location.pathname, editing ? 'update' : 'create'))) {
      setSaving(false);
      return;
    }
    const body = { name: form.name, role: form.role || null, quote: form.quote, rating: Number(form.rating) || 5, avatarUrl: form.avatarUrl || null, courseId: form.courseId || null, initials: form.initials || null };
    try {
      const url = editing ? `/api/admin/testimonials/${editing.id}` : '/api/admin/testimonials';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { const payload = await res.json(); const data = payload?.data ?? payload; setItems(prev => editing ? prev.map(t => t.id === editing.id ? data : t) : [data, ...prev]); }
      else {
        const err = await res.json().catch(() => null);
        if (isStepUpRequiredResponse(res.status, err?.error)) {
          redirectToStepUp(window.location.pathname, editing ? 'update' : 'create');
          return;
        }
      }
    } catch (err) { console.error('Failed to save testimonial:', err); toast({ title: 'Error', description: 'Failed to save testimonial. Please try again.', variant: 'error' }); }
    setShowForm(false); setEditing(null); setSaving(false);
  };

  const del = async (id: string) => { const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' }); if (res.ok) setItems(prev => prev.filter(t => t.id !== id)); setDelId(null); };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Testimonial</button></div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-foreground">{editing ? 'Edit Testimonial' : 'Add Testimonial'}</h3><button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button></div>
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Role</label><input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Quote *</label><textarea value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Rating (1-5)</label><select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card">{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Avatar</label><ImageUpload value={form.avatarUrl} onChange={u => setForm(f => ({ ...f, avatarUrl: u }))} label="avatar" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Initials</label><input value={form.initials} onChange={e => setForm(f => ({ ...f, initials: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Course ID (optional)</label><input value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-5">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-primary-light">Cancel</button>
            <button onClick={save} disabled={saving} className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? <div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>
          : items.length === 0 ? <EmptyState icon={Quote} title="No testimonials" description="Add testimonials from beneficiaries." actionText="Add Testimonial" onAction={openAdd} />
          : <div className="divide-y divide-border">{items.map(t => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Quote className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">{t.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">&ldquo;{t.quote}&rdquo; {t.course?.title ? `\u2022 ${t.course.title}` : ''}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">{t.rating}\u2605</span>
                <button onClick={() => openEdit(t)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDelId(t.id)} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}</div>}
      </div>

      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDelId(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-destructive" /></div>
            <h3 className="text-sm font-bold text-foreground mb-2">Delete Testimonial?</h3>
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
