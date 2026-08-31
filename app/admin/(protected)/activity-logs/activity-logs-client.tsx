'use client';

import React, { useState, useMemo } from 'react';
import { Users, BookOpen, Award, Bell, Lock, Calendar, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface Log { id: string; title: string; description: string; timestamp: string; icon: string; }

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Users, BookOpen, Award, Bell, Lock, Calendar,
};

function getIcon(name: string) { return iconMap[name] || Clock; }

const PAGE_SIZES = [10, 25, 50];

export default function ActivityLogsClient({ logs }: { logs: Log[] }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter(l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
  }, [logs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Activity Logs
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Audit trail of all administrative actions</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search by title or description..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" />
          </div>
        </div>

        {paginated.length === 0 ? (
          <EmptyState icon={Clock} title="No activity logs" description="Activity logs will appear here as actions are performed." />
        ) : (
          <div className="relative pl-6 border-l-2 border-border space-y-6">
            {paginated.map(log => {
              const Icon = getIcon(log.icon);
              return (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[25px] top-1 w-3 h-3 bg-card border-2 border-primary rounded-full" />
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100 shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground">{log.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{log.description}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap sm:text-right mt-0.5 shrink-0">{log.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="border border-border rounded-md px-2 py-1 text-xs bg-background focus:outline-none focus:border-primary">
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                className="p-1.5 rounded-md border border-border bg-card hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => { if (totalPages <= 5) return true; if (p === 1 || p === totalPages) return true; if (Math.abs(p - safePage) <= 1) return true; return false; })
                .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => { if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis'); acc.push(p); return acc; }, [])
                .map((item, i) => item === 'ellipsis' ? (
                  <span key={`e-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
                ) : (
                  <button key={item} onClick={() => setPage(item)}
                    className={`min-w-[28px] h-7 rounded-md text-xs font-semibold transition-colors ${item === safePage ? 'bg-primary text-white' : 'border border-border bg-card hover:bg-primary-light text-foreground'}`}>{item}</button>
                ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                className="p-1.5 rounded-md border border-border bg-card hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
