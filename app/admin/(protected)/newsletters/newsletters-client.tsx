'use client';

import { useState, useMemo } from 'react';
import {
  Mail, Send, Plus, X, CheckCircle, Clock, Users, Trash2, Eye,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from '@/lib/admin-stepup';
import { sanitizeHtmlContent } from '@/lib/sanitize-html';

const NEWSLETTER_ACTION = 'manage_newsletters';
const RETURN_PATH = '/admin/newsletters';

interface Newsletter {
  id: string;
  title: string;
  body: string;
  date: string | null;
  readTime: string | null;
  sentAt: string | null;
  sentCount: number | null;
  createdAt: string;
}

const PAGE_SIZE = 10;

export default function NewslettersClient({
  newsletters,
  subscriberCount,
}: {
  newsletters: Newsletter[];
  subscriberCount: number;
}) {
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [items, setItems] = useState(newsletters);
  const [preview, setPreview] = useState<Newsletter | null>(null);
  const [sendTarget, setSendTarget] = useState<Newsletter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Newsletter | null>(null);
  const { toast } = useToast();

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paged = useMemo(
    () => [...items].slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [items, page],
  );

  const sentCount = useMemo(() => items.filter((n) => n.sentAt).length, [items]);
  const draftsCount = useMemo(() => items.filter((n) => !n.sentAt).length, [items]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    if (!(await requireStepUpClient(RETURN_PATH, 'create'))) {
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim() || null,
          date: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        const n = await res.json();
        setItems((prev) => [
          {
            id: n.id,
            title: n.title,
            body: n.body || '',
            date: n.date,
            readTime: n.readTime,
            sentAt: null,
            sentCount: null,
            createdAt: n.createdAt,
          },
          ...prev,
        ]);
        setTitle('');
        setBody('');
        setShowCompose(false);
        setPage(1);
        toast({ title: 'Draft saved', description: `"${n.title}" is ready to send.`, variant: 'success' });
      } else {
        const err = await res.json().catch(() => null);
        if (isStepUpRequiredResponse(res.status, err?.error)) {
          redirectToStepUp(RETURN_PATH, 'create');
          return;
        }
        throw new Error(err?.error ?? 'Failed to save draft');
      }
    } catch (err) {
      console.error('Failed to save newsletter:', err);
      toast({ title: 'Could not save draft', description: String(err instanceof Error ? err.message : err), variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id: string) => {
    if (!(await requireStepUpClient(RETURN_PATH, NEWSLETTER_ACTION))) return;
    setSending(id);
    try {
      const res = await fetch(`/api/admin/newsletters/${id}/send`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setItems((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...n, sentAt: new Date().toISOString(), sentCount: data.sent }
              : n,
          ),
        );
        toast({
          title: `Sent to ${data.sent} subscriber${data.sent === 1 ? '' : 's'}`,
          description: data.failed ? `${data.failed} delivery failure(s).` : undefined,
          variant: 'success',
        });
      } else {
        if (isStepUpRequiredResponse(res.status, data?.error)) {
          redirectToStepUp(RETURN_PATH, NEWSLETTER_ACTION);
          return;
        }
        throw new Error(data?.error ?? 'Failed to send newsletter');
      }
    } catch (err) {
      toast({ title: 'Send failed', description: String(err instanceof Error ? err.message : err), variant: 'error' });
    } finally {
      setSending(null);
      setSendTarget(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await requireStepUpClient(RETURN_PATH, NEWSLETTER_ACTION))) return;
    try {
      const res = await fetch(`/api/admin/newsletters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((n) => n.id !== id));
        toast({ title: 'Draft deleted', variant: 'info' });
      } else {
        const err = await res.json().catch(() => null);
        if (isStepUpRequiredResponse(res.status, err?.error)) {
          redirectToStepUp(RETURN_PATH, NEWSLETTER_ACTION);
          return;
        }
        throw new Error(err?.error ?? 'Failed to delete newsletter');
      }
    } catch (err) {
      console.error('Failed to delete newsletter:', err);
      toast({ title: 'Delete failed', description: String(err instanceof Error ? err.message : err), variant: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Newsletter Management</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            Compose, send, and track email newsletters to your subscribers
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors bg-primary"
        >
          <Plus size={16} /> Compose Newsletter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{subscriberCount}</p>
              <p className="text-xs text-muted-foreground">Active Subscribers</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sentCount}</p>
              <p className="text-xs text-muted-foreground">Newsletters Sent</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{draftsCount}</p>
              <p className="text-xs text-muted-foreground">Drafts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold">Compose Newsletter</h2>
              <button onClick={() => setShowCompose(false)} className="p-1 hover:bg-muted rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Subject</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Monthly Impact Report — August 2026"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Body (HTML supported)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your newsletter content here. HTML tags are supported for formatting..."
                  rows={10}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none font-mono text-xs"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This newsletter will be saved as a draft. You can send it to all {subscriberCount} active subscribers from the list below.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !title.trim()}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{preview.title}</h2>
              <button onClick={() => setPreview(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div
              className="p-6 prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(preview.body || '') || '<p class="text-gray-400">No content</p>' }}
            />
            {preview.sentAt && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
                Sent {new Date(preview.sentAt).toLocaleDateString()} — {preview.sentCount} recipients
              </div>
            )}
          </div>
        </div>
      )}

      {/* Newsletter List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {paged.length === 0 ? (
          <div className="p-12 text-center">
            <Mail size={40} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No newsletters yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Click &ldquo;Compose Newsletter&rdquo; to create your first one</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((n) => (
                <tr key={n.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{n.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {n.sentAt ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle size={12} /> Sent to {n.sentCount}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock size={12} /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setPreview(n)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                      {!n.sentAt && (
                        <button
                          onClick={() => setSendTarget(n)}
                          disabled={sending === n.id}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 disabled:opacity-50"
                          title="Send to all subscribers"
                        >
                          <Send size={14} />
                        </button>
                      )}
                      {!n.sentAt && (
                        <button
                          onClick={() => setDeleteTarget(n)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                          title="Delete draft"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded-lg border border-border hover:bg-muted disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs rounded-lg border border-border hover:bg-muted disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!sendTarget}
        onClose={() => setSendTarget(null)}
        onConfirm={() => sendTarget ? handleSend(sendTarget.id) : undefined}
        title="Send newsletter"
        description={`Send "${sendTarget?.title ?? ''}" to all ${subscriberCount} active subscriber${subscriberCount === 1 ? '' : 's'}? This cannot be undone.`}
        variant="primary"
        confirmLabel="Send now"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget ? handleDelete(deleteTarget.id) : undefined}
        title="Delete draft"
        description={`Delete "${deleteTarget?.title ?? ''}"? This cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
