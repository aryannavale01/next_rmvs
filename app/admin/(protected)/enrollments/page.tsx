'use client';

import React, { useState, useMemo } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { Enrollment } from '@/lib/admin-types';
import {
  Search, ChevronDown, ChevronLeft, ChevronRight, Eye, CheckCircle,
  XCircle, Award, AlertTriangle, X,
  Users, BookOpen,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import MetricCards from '@/components/MetricCards';
import { STATUS_STYLES } from '@/lib/status-styles';

const STATUS_FILTERS = ['All', 'Pending', 'Enrolled', 'Completed', 'Dropped'] as const;
const PAGE_SIZES = [10, 20, 30, 50];

export default function AdminEnrollmentsPage() {
  const {
    enrollments, members, courses,
    approveEnrollment, rejectEnrollment,
    markEnrollmentCompleted, markEnrollmentDropped,
    updateEnrollment,
  } = useAdmin();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewEnrollment, setViewEnrollment] = useState<Enrollment | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const getMemberName = React.useCallback((id: string) => members.find(m => m.id === id)?.full_name ?? 'Unknown Member', [members]);
  const getCourseTitle = React.useCallback((id: string) => courses.find(c => c.id === id)?.title ?? 'Unknown Training', [courses]);
  const getMember = (id: string) => members.find(m => m.id === id);
  const getCourse = (id: string) => courses.find(c => c.id === id);

  const counts = useMemo(() => ({
    total: enrollments.length,
    enrolled: enrollments.filter(e => e.status === 'Enrolled').length,
    completed: enrollments.filter(e => e.status === 'Completed').length,
    dropped: enrollments.filter(e => e.status === 'Dropped' || e.status === 'Pending').length,
  }), [enrollments]);

  const filtered = useMemo(() => {
    let list = [...enrollments];
    if (statusFilter !== 'All') list = list.filter(e => e.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        getMemberName(e.member_id).toLowerCase().includes(q) ||
        getCourseTitle(e.course_id).toLowerCase().includes(q)
      );
    }
    return list;
  }, [enrollments, statusFilter, search, members, courses, getMemberName, getCourseTitle]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleReject = () => {
    if (rejectTarget && rejectReason.trim()) {
      rejectEnrollment(rejectTarget, rejectReason.trim());
      setRejectTarget(null);
      setRejectReason('');
    }
  };

  const handleSaveNotes = () => {
    if (viewEnrollment) {
      updateEnrollment(viewEnrollment.id, { admin_notes: editNotes });
      setViewEnrollment(null);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Stat Cards */}
      <MetricCards
        activeFilter={statusFilter}
        onFilterChange={(f) => { setStatusFilter(f); setPage(1); }}
        columns={4}
        cards={[
          { id: 'All', label: 'Total', value: counts.total, icon: Users },
          { id: 'Enrolled', label: 'Enrolled', value: counts.enrolled, icon: BookOpen },
          { id: 'Completed', label: 'Completed', value: counts.completed, icon: CheckCircle },
          { id: 'Dropped', label: 'Dropped', value: counts.dropped, icon: XCircle },
        ]}
      />

      {/* Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by member name or training name..."
            className="flex-1 text-sm outline-none placeholder:text-muted-foreground min-w-0" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold border border-border rounded-lg bg-card cursor-pointer">
            {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Member</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Training</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Enrolled Date</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Doc Verified</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 && (
                <tr><td colSpan={6} className="py-12">
                  <EmptyState icon={Users} title="No enrollments" description="Enrollments will appear here when members apply to training." />
                </td></tr>
              )}
              {paged.map(e => (
                <tr key={e.id} className="hover:bg-primary-light/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">{getMemberName(e.member_id)}</p>
                    <p className="text-[10px] text-muted-foreground">{e.member_id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground">{getCourseTitle(e.course_id)}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{e.enrolled_date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[e.status] ?? ''}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {e.doc_verified
                      ? <CheckCircle className="w-4 h-4 text-success" />
                      : <XCircle className="w-4 h-4 text-destructive" />
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {e.status === 'Pending' && (
                        <>
                          <button onClick={() => approveEnrollment(e.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-white bg-primary rounded-md hover:bg-primary-hover transition-colors">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                          <button onClick={() => { setRejectTarget(e.id); setRejectReason(''); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-white bg-destructive rounded-md hover:bg-destructive/90 transition-colors">
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </>
                      )}
                      {e.status === 'Enrolled' && (
                        <>
                          <button onClick={() => markEnrollmentCompleted(e.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-white bg-primary rounded-md hover:bg-primary-hover transition-colors">
                            <Award className="w-3 h-3" /> Complete
                          </button>
                          <button onClick={() => markEnrollmentDropped(e.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-warning-text bg-warning rounded-md hover:bg-warning/90 transition-colors">
                            <AlertTriangle className="w-3 h-3" /> Drop
                          </button>
                        </>
                      )}
                      <button onClick={() => { setViewEnrollment(e); setEditNotes(e.admin_notes); }}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"
                        aria-label="View enrollment details">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="text-xs border border-border rounded-md px-2 py-1 bg-card">
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30"
              aria-label="Previous page">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs font-semibold rounded-md ${p === page ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30"
              aria-label="Next page">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {viewEnrollment && (() => {
        const member = getMember(viewEnrollment.member_id);
        const course = getCourse(viewEnrollment.course_id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewEnrollment(null)} />
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-sm font-bold text-foreground">Enrollment Details</h3>
                <button onClick={() => setViewEnrollment(null)} className="p-1 rounded-md hover:bg-muted" aria-label="Close details">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${STATUS_STYLES[viewEnrollment.status] ?? ''}`}>
                    {viewEnrollment.status}
                  </span>
                  <span className="text-xs text-muted-foreground">Enrolled: {viewEnrollment.enrolled_date}</span>
                </div>

                {/* Member Info */}
                {member && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Member</h5>
                    <div className="bg-background rounded-lg p-4 border border-border space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {member.full_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{member.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {[['Phone', member.phone], ['Gender', member.gender], ['Age', member.age], ['Village', member.village]].map(([k, v]) => (
                          <div key={String(k)}>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{k}</p>
                            <p className="text-xs font-semibold text-foreground">{String(v)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Training Info */}
                {course && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Training</h5>
                    <div className="bg-background rounded-lg p-4 border border-border space-y-2">
                      <p className="text-sm font-bold text-foreground">{course.title}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[['Category', course.category], ['Mode', course.mode], ['Duration', course.duration], ['Location', course.location]].map(([k, v]) => (
                          <div key={k}>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{k}</p>
                            <p className="text-xs font-semibold text-foreground">{String(v)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Doc Verified */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Documents</h5>
                  <div className="flex items-center gap-2">
                    {viewEnrollment.doc_verified
                      ? <><CheckCircle className="w-4 h-4 text-success" /><span className="text-xs font-semibold text-success-text">Verified</span></>
                      : <><XCircle className="w-4 h-4 text-destructive" /><span className="text-xs font-semibold text-destructive-text">Not Verified</span></>
                    }
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Admin Notes</h5>
                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                    rows={4}
                    placeholder="Add or edit admin notes..."
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" />
                </div>
              </div>
              <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-end gap-3">
                <button onClick={() => setViewEnrollment(null)}
                  className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent">
                  Cancel
                </button>
                <button onClick={handleSaveNotes}
                  className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">
                  Save
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reject Reason Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectTarget(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Reject Enrollment</h3>
              <button onClick={() => setRejectTarget(null)} className="p-1 rounded-md hover:bg-muted" aria-label="Close reject dialog">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Please provide a reason for rejecting this enrollment application.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              rows={3} placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setRejectTarget(null)}
                className="flex-1 px-4 py-2.5 text-xs font-semibold border border-border rounded-lg hover:bg-accent">
                Cancel
              </button>
              <button onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
