'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, FileText, Mail } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import ImageUpload from '@/components/ui/image-upload';
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from '@/lib/admin-stepup';

interface BlogPost { id: string; title: string; category: string; description: string | null; content: string | null; readTime: string | null; date: string; image: string | null; author: string | null; }
interface Newsletter { id: string; title: string; date: string; readTime: string | null; image: string | null; fileUrl: string | null; }

interface BlogForm { title: string; category: string; description: string; content: string; readTime: string; date: string; image: string; author: string; }
interface NewsletterForm { title: string; date: string; readTime: string; image: string; fileUrl: string; }

const EMPTY_BLOG: BlogForm = { title: '', category: '', description: '', content: '', readTime: '', date: new Date().toISOString().split('T')[0], image: '', author: '' };
const EMPTY_NL: NewsletterForm = { title: '', date: new Date().toISOString().split('T')[0], readTime: '', image: '', fileUrl: '' };

export default function ResourcesTab() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'blog' | 'newsletters'>('blog');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogPost | Newsletter | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [delType, setDelType] = useState<'blog' | 'newsletter'>('blog');
  const [saving, setSaving] = useState(false);
  const [blogForm, setBlogForm] = useState<BlogForm>(EMPTY_BLOG);
  const [nlForm, setNlForm] = useState<NewsletterForm>(EMPTY_NL);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/blog-posts').then(r => r.json()),
      fetch('/api/admin/newsletters').then(r => r.json()),
    ]).then(([b, n]) => {
      setBlogPosts(b.data || []);
      setNewsletters(n.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const openAddBlog = () => { setBlogForm({ ...EMPTY_BLOG }); setEditing(null); setActiveTab('blog'); setShowForm(true); };
  const openEditBlog = (p: BlogPost) => { setBlogForm({ title: p.title, category: p.category, description: p.description ?? '', content: p.content ?? '', readTime: p.readTime ?? '', date: p.date, image: p.image ?? '', author: p.author ?? '' }); setEditing(p); setActiveTab('blog'); setShowForm(true); };
  const openAddNl = () => { setNlForm({ ...EMPTY_NL }); setEditing(null); setActiveTab('newsletters'); setShowForm(true); };
  const openEditNl = (n: Newsletter) => { setNlForm({ title: n.title, date: n.date, readTime: n.readTime ?? '', image: n.image ?? '', fileUrl: n.fileUrl ?? '' }); setEditing(n); setActiveTab('newsletters'); setShowForm(true); };

  const saveBlog = async () => {
    if (!blogForm.title.trim() || !blogForm.category.trim()) return;
    setSaving(true);
    if (!(await requireStepUpClient(window.location.pathname, editing ? 'update' : 'create'))) {
      setSaving(false);
      return;
    }
    const body = { title: blogForm.title, category: blogForm.category, description: blogForm.description || null, content: blogForm.content || null, readTime: blogForm.readTime || null, date: blogForm.date, image: blogForm.image || null, author: blogForm.author || null };
    try {
      const url = editing ? `/api/admin/blog-posts/${editing.id}` : '/api/admin/blog-posts';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { const payload = await res.json(); const data = payload?.data ?? payload; setBlogPosts(prev => editing ? prev.map(b => b.id === editing.id ? data : b) : [data, ...prev]); }
      else {
        const err = await res.json().catch(() => null);
        if (isStepUpRequiredResponse(res.status, err?.error)) {
          redirectToStepUp(window.location.pathname, editing ? 'update' : 'create');
          return;
        }
      }
    } catch (err) { console.error('Failed to save blog post:', err); toast({ title: 'Error', description: 'Failed to save blog post. Please try again.', variant: 'error' }); }
    setShowForm(false); setEditing(null); setSaving(false);
  };

  const saveNl = async () => {
    if (!nlForm.title.trim()) return;
    setSaving(true);
    if (!(await requireStepUpClient(window.location.pathname, editing ? 'update' : 'create'))) {
      setSaving(false);
      return;
    }
    const body = { title: nlForm.title, date: nlForm.date, readTime: nlForm.readTime || null, image: nlForm.image || null, fileUrl: nlForm.fileUrl || null };
    try {
      const url = editing ? `/api/admin/newsletters/${editing.id}` : '/api/admin/newsletters';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { const payload = await res.json(); const data = payload?.data ?? payload; setNewsletters(prev => editing ? prev.map(n => n.id === editing.id ? data : n) : [data, ...prev]); }
      else {
        const err = await res.json().catch(() => null);
        if (isStepUpRequiredResponse(res.status, err?.error)) {
          redirectToStepUp(window.location.pathname, editing ? 'update' : 'create');
          return;
        }
      }
    } catch (err) { console.error('Failed to save newsletter:', err); toast({ title: 'Error', description: 'Failed to save newsletter. Please try again.', variant: 'error' }); }
    setShowForm(false); setEditing(null); setSaving(false);
  };

  const del = async () => {
    if (!delId) return;
    const endpoint = delType === 'blog' ? `/api/admin/blog-posts/${delId}` : `/api/admin/newsletters/${delId}`;
    const res = await fetch(endpoint, { method: 'DELETE' });
    if (res.ok) {
      if (delType === 'blog') setBlogPosts(prev => prev.filter(b => b.id !== delId));
      else setNewsletters(prev => prev.filter(n => n.id !== delId));
    }
    setDelId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
          <button onClick={() => { setActiveTab('blog'); setShowForm(false); setEditing(null); }} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'blog' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Blog Posts ({blogPosts.length})</button>
          <button onClick={() => { setActiveTab('newsletters'); setShowForm(false); setEditing(null); }} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'newsletters' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Newsletters ({newsletters.length})</button>
        </div>
        <div className="flex-1" />
        {activeTab === 'blog' && <button onClick={openAddBlog} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Post</button>}
        {activeTab === 'newsletters' && <button onClick={openAddNl} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Newsletter</button>}
      </div>

      {showForm && activeTab === 'blog' && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-foreground">{editing ? 'Edit Blog Post' : 'Add Blog Post'}</h3><button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button></div>
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Title *</label><input value={blogForm.title} onChange={e => setBlogForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Category *</label><input value={blogForm.category} onChange={e => setBlogForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Author</label><input value={blogForm.author} onChange={e => setBlogForm(f => ({ ...f, author: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Read Time</label><input value={blogForm.readTime} onChange={e => setBlogForm(f => ({ ...f, readTime: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Date</label><input type="date" value={blogForm.date} onChange={e => setBlogForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Image</label><ImageUpload value={blogForm.image} onChange={u => setBlogForm(f => ({ ...f, image: u }))} label="image" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Description</label><textarea value={blogForm.description} onChange={e => setBlogForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Content</label><textarea value={blogForm.content} onChange={e => setBlogForm(f => ({ ...f, content: e.target.value }))} rows={5} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" /></div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-5">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-primary-light">Cancel</button>
            <button onClick={saveBlog} disabled={saving} className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      )}

      {showForm && activeTab === 'newsletters' && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-foreground">{editing ? 'Edit Newsletter' : 'Add Newsletter'}</h3><button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button></div>
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Title *</label><input value={nlForm.title} onChange={e => setNlForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Date</label><input type="date" value={nlForm.date} onChange={e => setNlForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Read Time</label><input value={nlForm.readTime} onChange={e => setNlForm(f => ({ ...f, readTime: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Image</label><ImageUpload value={nlForm.image} onChange={u => setNlForm(f => ({ ...f, image: u }))} label="image" /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">File URL</label><input value={nlForm.fileUrl} onChange={e => setNlForm(f => ({ ...f, fileUrl: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-5">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-primary-light">Cancel</button>
            <button onClick={saveNl} disabled={saving} className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      )}

      {!showForm && activeTab === 'blog' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? <div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>
            : blogPosts.length === 0 ? <EmptyState icon={FileText} title="No blog posts" description="Create blog posts for the resources page." actionText="Add Post" onAction={openAddBlog} />
            : <div className="divide-y divide-border">{blogPosts.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground truncate">{p.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.category}{p.readTime ? ` \u2022 ${p.readTime}` : ''}{p.author ? ` \u2022 ${p.author}` : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEditBlog(p)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { setDelId(p.id); setDelType('blog'); }} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}</div>}
        </div>
      )}

      {!showForm && activeTab === 'newsletters' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? <div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>
            : newsletters.length === 0 ? <EmptyState icon={Mail} title="No newsletters" description="Add newsletters for the resources page." actionText="Add Newsletter" onAction={openAddNl} />
            : <div className="divide-y divide-border">{newsletters.map(n => (
              <div key={n.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Mail className="w-4 h-4 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground truncate">{n.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.date}{n.readTime ? ` \u2022 ${n.readTime}` : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEditNl(n)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { setDelId(n.id); setDelType('newsletter'); }} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}</div>}
        </div>
      )}

      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDelId(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-destructive" /></div>
            <h3 className="text-sm font-bold text-foreground mb-2">Delete {delType === 'blog' ? 'Blog Post' : 'Newsletter'}?</h3>
            <p className="text-xs text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelId(null)} className="flex-1 px-4 py-2.5 text-xs font-semibold border border-border rounded-lg hover:bg-primary-light">Cancel</button>
              <button onClick={del} className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
