'use client';

import React, { useState, useMemo } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { AdminCertificate } from '@/lib/admin-types';
import {
  Award, Search, Plus, Eye, Check, X, ChevronLeft, ChevronRight,
  Users, BookOpen, FileCheck, TrendingUp,
} from 'lucide-react';
import MetricCards from '@/components/MetricCards';
import { EmptyState } from '@/components/ui/empty-state';
import { STATUS_STYLES } from '@/lib/status-styles';

type Tab = 'all' | 'generated' | 'pending' | 'accepted';
type ViewMode = 'table' | 'courses';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'generated', label: 'Generated' },
  { key: 'pending', label: 'Pending Review' },
  { key: 'accepted', label: 'Approved' },
];

const PAGE_SIZES = [10, 20, 30, 50];

export default function AdminCertificatesPage() {
  const {
    certificates, courses, members, enrollments, teachers,
    approveCertificate, rejectCertificate, generateCertificateForEnrollment,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [confirmReject, setConfirmReject] = useState<string | null>(null);
  const [viewCert, setViewCert] = useState<AdminCertificate | null>(null);

  const getMemberName = React.useCallback((id: string) => members.find(m => m.id === id)?.fullName ?? 'Unknown', [members]);
  const getCourseTitle = React.useCallback((id: string) => courses.find(c => c.id === id)?.title ?? 'Unknown', [courses]);
  const getTeacherName = (id: string) => {
    const course = courses.find(c => c.id === id);
    return course ? (teachers.find(t => t.id === course.teacher_id)?.fullName ?? 'Unassigned') : 'Unknown';
  };

  const filtered = useMemo(() => {
    let list = [...certificates];
    if (activeTab === 'generated') list = list.filter(c => c.status === 'generated');
    else if (activeTab === 'pending') list = list.filter(c => c.status === 'pending');
    else if (activeTab === 'accepted') list = list.filter(c => c.status === 'accepted');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.certificate_no.toLowerCase().includes(q) ||
        getMemberName(c.member_id).toLowerCase().includes(q) ||
        getCourseTitle(c.course_id).toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => b.issue_date.localeCompare(a.issue_date));
    return list;
  }, [certificates, activeTab, search, members, courses, getMemberName, getCourseTitle]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => {
    const total = certificates.length;
    const generated = certificates.filter(c => c.status === 'generated').length;
    const accepted = certificates.filter(c => c.status === 'accepted').length;
    const coursesWithCerts = new Set(certificates.map(c => c.course_id)).size;
    const avgPerCourse = coursesWithCerts > 0 ? (total / coursesWithCerts).toFixed(1) : '0';
    const membersWithCerts = new Set(certificates.map(c => c.member_id)).size;
    return { total, generated, accepted, coursesWithCerts, avgPerCourse, membersWithCerts };
  }, [certificates]);

  const courseGroups = useMemo(() => {
    const map = new Map<string, { courseId: string; title: string; teacher: string; enrolled: number; certs: number; pendingCerts: number }>();
    for (const c of courses) {
      const courseCerts = certificates.filter(cert => cert.course_id === c.id);
      const enrolled = enrollments.filter(e => e.course_id === c.id && e.status !== 'Dropped').length;
      map.set(c.id, {
        courseId: c.id,
        title: c.title,
        teacher: teachers.find(t => t.id === c.teacher_id)?.fullName ?? 'Unassigned',
        enrolled,
        certs: courseCerts.length,
        pendingCerts: courseCerts.filter(cert => cert.status === 'generated').length,
      });
    }
    return Array.from(map.values());
  }, [courses, certificates, enrollments, teachers]);

  const eligibleEnrollments = useMemo(() => {
    const certEnrollmentIds = new Set(certificates.map(c => {
      const enr = enrollments.find(e => e.course_id === c.course_id && e.member_id === c.member_id);
      return enr?.id;
    }));
    return enrollments.filter(e => e.status === 'Completed' && !certEnrollmentIds.has(e.id));
  }, [enrollments, certificates]);

  const handleReject = (id: string) => {
    rejectCertificate(id);
    setConfirmReject(null);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Stat Cards */}
      <MetricCards
        activeFilter="all"
        onFilterChange={() => {}}
        columns={6}
        cards={[
          { id: 'all', label: 'Total', value: stats.total, icon: Award },
          { id: 'pending', label: 'Pending Review', value: stats.generated, icon: FileCheck },
          { id: 'accepted', label: 'Approved', value: stats.accepted, icon: Check },
          { id: 'courses', label: 'Trainings w/ Certs', value: stats.coursesWithCerts, icon: BookOpen },
          { id: 'avg', label: 'Avg / Training', value: stats.avgPerCourse, icon: TrendingUp },
          { id: 'members', label: 'Members w/ Certs', value: stats.membersWithCerts, icon: Users },
        ]}
      />

      {/* Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by certificate number, member, or training..."
            className="flex-1 text-sm outline-none placeholder:text-muted-foreground min-w-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'courses' : 'table')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent"
          >
            <BookOpen className="w-3.5 h-3.5" /> {viewMode === 'table' ? 'Training View' : 'Table View'}
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" /> Generate Certificate
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="bg-card border border-border rounded-xl px-4 flex items-center gap-1">
        {TABS.map(tab => {
          const count = tab.key === 'all' ? certificates.length
            : certificates.filter(c => c.status === tab.key).length;
          return (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.key ? 'bg-primary-light text-primary' : 'bg-muted text-muted-foreground'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div id={`tabpanel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
      {/* Training Grouping View */}
      {viewMode === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {courseGroups.map(g => (
            <div key={g.courseId} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
              <h4 className="text-sm font-bold text-foreground mb-1">{g.title}</h4>
              <p className="text-xs text-muted-foreground mb-3">{g.teacher}</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-primary-light rounded-lg p-2 text-center">
                  <p className="text-base font-bold text-primary">{g.enrolled}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Enrolled</p>
                </div>
                <div className="bg-success-bg rounded-lg p-2 text-center">
                  <p className="text-base font-bold text-success-text">{g.certs}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Certs</p>
                </div>
                <div className="bg-warning-bg rounded-lg p-2 text-center">
                  <p className="text-base font-bold text-warning-text">{g.pendingCerts}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Pending</p>
                </div>
              </div>
            </div>
          ))}
          {courseGroups.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={Award} title="No trainings" description="Training programs will appear here once created." />
            </div>
          )}
        </div>
      )}

      {/* Certificate Table */}
      {viewMode === 'table' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Certificate No</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Member</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Training</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Issue Date</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12">
                      <EmptyState icon={Award} title="No certificates" description="Certificates will appear here after training completion." />
                    </td>
                  </tr>
                )}
                {paged.map(cert => (
                  <tr key={cert.id} className="hover:bg-primary-light/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-foreground">{cert.certificate_no}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{getMemberName(cert.member_id)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{getCourseTitle(cert.course_id)}</p>
                      <p className="text-[10px] text-muted-foreground">{getTeacherName(cert.course_id)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{cert.issue_date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${STATUS_STYLES[cert.status]}`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {cert.status === 'generated' && (
                          <>
                            <button
                              onClick={() => approveCertificate(cert.id)}
                              className="px-2.5 py-1.5 text-[10px] font-bold text-white bg-primary hover:bg-primary-hover rounded-md transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setConfirmReject(cert.id)}
                              className="px-2.5 py-1.5 text-[10px] font-bold text-destructive border border-destructive/20 hover:bg-destructive-bg rounded-md transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {cert.status === 'accepted' && (
                          <button
                            onClick={() => setViewCert(cert)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"
                            aria-label="View certificate"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {cert.status === 'pending' && (
                          <span className="text-[10px] text-muted-foreground italic">Awaiting</span>
                        )}
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
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="text-xs border border-border rounded-md px-2 py-1 bg-card"
              >
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30" aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs font-semibold rounded-md ${p === page ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30" aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Generate Certificate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowGenerateModal(false)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-foreground">Generate Certificates</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{eligibleEnrollments.length} completed enrollment(s) eligible</p>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="p-1 rounded-md hover:bg-muted" aria-label="Close modal"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {eligibleEnrollments.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">No eligible enrollments found.</p>
                  <p className="text-xs text-muted-foreground mt-1">All completed enrollments already have certificates.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {eligibleEnrollments.map(enr => (
                    <div key={enr.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{getMemberName(enr.member_id)}</p>
                        <p className="text-xs text-muted-foreground truncate">{getCourseTitle(enr.course_id)}</p>
                      </div>
                      <button
                        onClick={() => { generateCertificateForEnrollment(enr.id); }}
                        className="ml-4 px-3 py-1.5 text-[10px] font-bold text-white bg-primary hover:bg-primary-hover rounded-md shrink-0 transition-colors"
                      >
                        Generate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-border px-6 py-3 shrink-0">
              <button onClick={() => setShowGenerateModal(false)} className="w-full px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation */}
      {confirmReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmReject(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-2">Reject Certificate?</h3>
            <p className="text-xs text-muted-foreground mb-6">This will void the certificate permanently. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmReject(null)} className="flex-1 px-4 py-2.5 text-xs font-semibold border border-border rounded-lg hover:bg-accent">Cancel</button>
              <button onClick={() => handleReject(confirmReject)} className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 rounded-lg">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* View Certificate Drawer */}
      {viewCert && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewCert(null)} />
          <div className="relative w-full max-w-md bg-card shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Certificate Details</h3>
              <button onClick={() => setViewCert(null)} className="p-1 rounded-md hover:bg-muted" aria-label="Close details"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-success-bg flex items-center justify-center">
                  <Award className="w-7 h-7 text-success-text" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">{viewCert.certificate_no}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-bg text-success-text border border-success/20 mt-1 inline-block">Approved</span>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Details</h5>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Member', getMemberName(viewCert.member_id)],
                    ['Training', getCourseTitle(viewCert.course_id)],
                    ['Instructor', getTeacherName(viewCert.course_id)],
                    ['Issue Date', viewCert.issue_date],
                    ['Status', viewCert.status.charAt(0).toUpperCase() + viewCert.status.slice(1)],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{k}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setViewCert(null)} className="w-full px-4 py-2.5 text-xs font-semibold border border-border rounded-lg hover:bg-accent">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
