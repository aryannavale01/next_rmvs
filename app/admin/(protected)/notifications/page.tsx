'use client';

import { useState, useMemo } from 'react';
import { useAdmin } from '@/lib/admin-context';
import {
  Bell, Award, BookOpen, CheckCircle, Calendar, Users, Star,
  Send, Plus, X, Clock, Target, Megaphone,
} from 'lucide-react';
import MetricCards from '@/components/MetricCards';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';

const ICON_OPTIONS = [
  { name: 'Bell', Icon: Bell },
  { name: 'Award', Icon: Award },
  { name: 'BookOpen', Icon: BookOpen },
  { name: 'CheckCircle', Icon: CheckCircle },
  { name: 'Calendar', Icon: Calendar },
  { name: 'Users', Icon: Users },
  { name: 'Star', Icon: Star },
];

const TARGETS = ['All Members', 'Group', 'Specific Training'];
const PAGE_SIZE = 8;

function iconByName(name: string) {
  const found = ICON_OPTIONS.find(o => o.name === name);
  return found ? found.Icon : Bell;
}

export default function AdminNotificationsPage() {
  const { notifications, addNotification, members } = useAdmin();

  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Bell');
  const [target, setTarget] = useState('All Members');
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(notifications.length / PAGE_SIZE);
  const paged = useMemo(() => {
    return [...notifications].slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [notifications, page]);

  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return notifications.filter(n => new Date(n.created_at) >= weekAgo).length;
  }, [notifications]);

  const uniqueTargets = useMemo(() => {
    return new Set(notifications.map(n => n.target)).size;
  }, [notifications]);

  const handleSend = () => {
    if (!title.trim() || !description.trim()) return;
    addNotification({ title: title.trim(), description: description.trim(), icon, target });
    setTitle('');
    setDescription('');
    setIcon('Bell');
    setTarget('All Members');
    setShowCompose(false);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications &amp; Broadcast</h1>
          <p className="text-sm mt-1 text-muted-foreground">Send announcements and manage broadcast history</p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors bg-primary"
        >
          <Plus size={16} />
          Compose
        </button>
      </div>

      <MetricCards
        activeFilter="total"
        onFilterChange={() => {}}
        columns={3}
        cards={[
          { id: 'total', label: 'Total Sent', value: notifications.length, icon: Megaphone },
          { id: 'week', label: 'This Week', value: thisWeekCount, icon: Clock },
          { id: 'targets', label: 'Unique Targets', value: uniqueTargets, icon: Target },
        ]}
      />

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
                        <Target size={10} />
                        {n.target}
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
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, notifications.length)} of {notifications.length}
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowCompose(false)}>
          <div className="bg-card rounded-xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Compose Broadcast</h3>
              <button onClick={() => setShowCompose(false)} className="p-1 rounded-md hover:bg-accent transition-colors" aria-label="Close compose">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Notification title"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Broadcast message..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Icon</label>
                <div className="flex items-center gap-2">
                  {ICON_OPTIONS.map(opt => {
                    const isSelected = icon === opt.name;
                    return (
                      <button
                        key={opt.name}
                        onClick={() => setIcon(opt.name)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-border text-muted-foreground'}`}
                        title={opt.name}
                      >
                        <opt.Icon size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Target Audience</label>
                <select
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                >
                  {TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-primary-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!title.trim() || !description.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40 bg-primary"
              >
                <Send size={14} />
                Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
