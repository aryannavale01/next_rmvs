'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Bell, Award, BookOpen, CheckCircle, Calendar, Users, Star,
  Send, Plus, X, Clock, Target, Megaphone,
} from 'lucide-react';
import MetricCards from '@/components/MetricCards';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { isStepUpRequiredResponse, redirectToStepUp, requireStepUpClient } from '@/lib/admin-stepup';

interface Notif { id: string; title: string; description: string; icon: string; target: string; created_at: string; }

const ICON_OPTIONS = [
  { name: 'Bell', Icon: Bell }, { name: 'Award', Icon: Award }, { name: 'BookOpen', Icon: BookOpen },
  { name: 'CheckCircle', Icon: CheckCircle }, { name: 'Calendar', Icon: Calendar },
  { name: 'Users', Icon: Users }, { name: 'Star', Icon: Star },
];

const TARGETS = ['All Members', 'Group', 'Specific Training'];
const PAGE_SIZE = 8;
const DRAFT_STORAGE_KEY = 'admin-notification-draft';

function iconByName(name: string) {
  const found = ICON_OPTIONS.find(o => o.name === name);
  return found ? found.Icon : Bell;
}

interface DraftState {
  title: string;
  description: string;
  icon: string;
  target: string;
  showCompose: boolean;
}

function readDraft(): DraftState {
  const empty: DraftState = { title: '', description: '', icon: 'Bell', target: 'All Members', showCompose: false };
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return empty;
    const draft = JSON.parse(raw);
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    return {
      title: typeof draft.title === 'string' ? draft.title : '',
      description: typeof draft.description === 'string' ? draft.description : '',
      icon: typeof draft.icon === 'string' ? draft.icon : 'Bell',
      target: typeof draft.target === 'string' ? draft.target : 'All Members',
      showCompose: true,
    };
  } catch {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    return empty;
  }
}

export default function NotificationsClient({ notifications }: { notifications: Notif[] }) {
  const initialDraft = readDraft();
  const [showCompose, setShowCompose] = useState(initialDraft.showCompose);
  const [title, setTitle] = useState(initialDraft.title);
  const [description, setDescription] = useState(initialDraft.description);
  const [icon, setIcon] = useState(initialDraft.icon);
  const [target, setTarget] = useState(initialDraft.target);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState(notifications);

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paged = useMemo(() => [...items].slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [items, page]);

  useEffect(() => {
    if (!showCompose) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCompose(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showCompose]);


  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return items.filter(n => new Date(n.created_at) >= weekAgo).length;
  }, [items]);

  const uniqueTargets = useMemo(() => new Set(items.map(n => n.target)).size, [items]);

  const handleSend = async () => {
    if (!title.trim() || !description.trim()) return;
    const currentPath = '/admin/notifications';
    if (!(await requireStepUpClient(currentPath, 'send_notification'))) {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ title, description, icon, target }));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), icon, target }),
      });
      if (res.ok) {
        const n = await res.json();
        setItems(prev => [{ id: n.id, title: n.title, description: n.description, icon: n.icon, target: n.target, created_at: new Date(n.createdAt).toISOString().replace('T', ' ').slice(0, 16) }, ...prev]);
        setTitle(''); setDescription(''); setIcon('Bell'); setTarget('All Members'); setShowCompose(false); setPage(1);
      } else {
        const body = await res.json().catch(() => null);
        if (isStepUpRequiredResponse(res.status, body?.error)) {
          sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ title, description, icon, target }));
          redirectToStepUp(currentPath, 'send_notification');
          return;
        }
        throw new Error(body?.error || 'Failed to send notification');
      }
    } catch (err) {
      console.error('Failed to send notification:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications &amp; Broadcast</h1>
          <p className="text-sm mt-1 text-muted-foreground">Send announcements and manage broadcast history</p>
        </div>
        <button onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors bg-primary">
          <Plus size={16} /> Compose
        </button>
      </div>

      <MetricCards activeFilter="total" onFilterChange={() => {}} columns={3}
        cards={[
          { id: 'total', label: 'Total Sent', value: items.length, icon: Megaphone },
          { id: 'week', label: 'This Week', value: thisWeekCount, icon: Clock },
          { id: 'targets', label: 'Unique Targets', value: uniqueTargets, icon: Target },
        ]} />

      <div className="bg-card border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Notification History</h2>
        </div>
        {paged.length === 0 ? (
          <EmptyState icon={Megaphone} title="No notifications" description="Broadcast notifications to members and staff here." />
        ) : (
          <div className="divide-y divide-border">
            {paged.map(n => {
              const NotifIcon = iconByName(n.icon);
              return (
                <div key={n.id} className="px-5 py-4 flex items-start gap-4 hover:bg-primary-light transition-colors">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-light">
                    <NotifIcon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{n.title}</p>
                        <p className="text-sm mt-0.5 line-clamp-2 text-muted-foreground">{n.description}</p>
                      </div>
                      <span className="text-xs whitespace-nowrap flex-shrink-0 text-muted-foreground">{n.created_at}</span>
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary">
                        <Target size={10} /> {n.target}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, items.length)} of {items.length}</p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {showCompose && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setShowCompose(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="compose-broadcast-title"
        >
          <div className="bg-card rounded-xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 id="compose-broadcast-title" className="text-lg font-semibold text-foreground">Compose Broadcast</h3>
              <button onClick={() => setShowCompose(false)} className="p-1 rounded-md hover:bg-accent transition-colors"><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Broadcast message..." rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Icon</label>
                <div className="flex items-center gap-2">
                  {ICON_OPTIONS.map(opt => (
                    <button key={opt.name} onClick={() => setIcon(opt.name)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${icon === opt.name ? 'bg-primary border-primary text-white' : 'border-border text-muted-foreground'}`} title={opt.name}>
                      <opt.Icon size={18} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Target Audience</label>
                <select value={target} onChange={e => setTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
                  {TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
              <button onClick={() => setShowCompose(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-primary-light transition-colors">Cancel</button>
              <button onClick={handleSend} disabled={!title.trim() || !description.trim() || saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40 bg-primary">
                <Send size={14} />{saving ? 'Sending...' : 'Send Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
