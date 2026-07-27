'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  FileText,
  Check,
  RefreshCw,
  Eye,
  Plus,
  Trash2,
  Calendar,
  Award,
  BookOpen,
  MapPin,
  User,
  Briefcase,
  ChevronRight,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useAdmin } from '@/lib/admin-context';

export interface Member {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  category: string | null;
  qualification: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  status: string;
  assignedVolunteer: string | null;
  createdAt: string;
  profileImage: string | null;
}

export interface Course {
  id: string;
  title: string;
}

export interface Enrollment {
  id: string;
  memberId: string;
  courseId: string;
  status: 'Completed' | 'Enrolled' | 'Dropped';
  enrolledDate: string;
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

interface MemberDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  dob: string | null;
  status: string;
  isDeleted: boolean;
  avatarUrl: string | null;
  qualification: string | null;
  district: string | null;
  state: string | null;
  assignedVolunteer: string | null;
  createdAt: string;
  beneficiaryDetail: Record<string, unknown> | null;
  beneficiaryAddresses: Array<{
    id: string;
    village: string | null;
    taluka: string | null;
    district: string | null;
    state: string | null;
    pincode: string | null;
  }>;
  beneficiaryDocuments: Array<{
    id: string;
    type: string;
    label: string;
    fileUrl: string;
    status: string;
    uploadedDate: string | null;
    verifiedDate: string | null;
    verifiedBy: string | null;
    verifiedByName: string | null;
    rejectionReason: string | null;
  }>;
  courseEnrollments: Array<{
    id: string;
    course: { id: string; title: string } | null;
    batch: string | null;
    trainer: string | null;
    enrollmentDate: string;
    completionDate: string | null;
    status: string;
    attendance: number | null;
    assessmentScore: number | null;
    documentsVerified: boolean;
    adminNotes: string | null;
  }>;
  adminNotes: string | null;
}

interface MemberProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

const DOC_STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending Review', color: 'text-amber-600', bg: 'bg-amber-100 border-amber-200/50' },
  verified: { label: 'Verified', color: 'text-green-600', bg: 'bg-green-100 border-green-200/50' },
  rejected: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-100 border-red-200/50' },
};

export default function MemberProfileDrawer({
  isOpen,
  onClose,
  member,
}: MemberProfileDrawerProps) {
  const { toast } = useToast();
  const { verifyDocument, rejectDocument } = useAdmin();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'documents' | 'notes'>('overview');
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const lastFetchedIdRef = useRef<string | null>(null);

  const handleClose = useCallback(() => {
    setDetail(null);
    setActiveTab('overview');
    setRejectingDocId(null);
    setRejectReason('');
    lastFetchedIdRef.current = null;
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !member?.id) return;
    if (lastFetchedIdRef.current === member.id) return;
    lastFetchedIdRef.current = member.id;
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/admin/members/${member.id}`, { signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setDetail(data);
          try {
            setNotes(data.adminNotes ? JSON.parse(data.adminNotes) : []);
          } catch { setNotes([]); }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [isOpen, member?.id]);

  const refetchDetail = () => {
    if (!member?.id) return;
    lastFetchedIdRef.current = null;
    setLoading(true);
    fetch(`/api/admin/members/${member.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setDetail(data);
          try {
            setNotes(data.adminNotes ? JSON.parse(data.adminNotes) : []);
          } catch { setNotes([]); }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleVerifyDocument = async (docId: string) => {
    if (!member?.id) return;
    try {
      await verifyDocument(member.id, docId);
      toast({ title: 'Document Verified', description: 'Document has been verified successfully.', variant: 'success' });
      refetchDetail();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to verify document';
      toast({ title: 'Verification Failed', description: message, variant: 'error' });
    }
  };

  const handleRejectDocument = async (docId: string) => {
    if (!member?.id || !rejectReason.trim()) return;
    try {
      await rejectDocument(member.id, docId, rejectReason.trim());
      toast({ title: 'Document Rejected', description: 'Document has been rejected.', variant: 'error' });
      setRejectingDocId(null);
      setRejectReason('');
      refetchDetail();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reject document';
      toast({ title: 'Rejection Failed', description: message, variant: 'error' });
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !member?.id) return;
    const newNote: Note = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      author: 'Administrator',
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    setNewNoteText('');
    fetch(`/api/admin/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes: JSON.stringify(updated) }),
    }).catch(() => {});
  };

  const handleDeleteNote = (noteId: string) => {
    if (!member?.id) return;
    const updated = notes.filter(n => n.id !== noteId);
    setNotes(updated);
    fetch(`/api/admin/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes: JSON.stringify(updated) }),
    }).catch(() => {});
  };

  if (!isOpen || !member) return null;

  const address = detail?.beneficiaryAddresses?.[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out"
          onClick={handleClose}
        />

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-xl transform transition-transform duration-300 ease-in-out bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden">

            {/* Header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                {(detail?.avatarUrl ?? member.profileImage) ? (
                  <img
                    src={detail?.avatarUrl ?? member.profileImage ?? ''}
                    alt={member.fullName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-600 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-sm">
                    {member.fullName[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">{member.fullName}</h4>
                  <span className="text-[10px] text-slate-500 font-mono tracking-tight">Dossier ID: {member.id}</span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-all"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div role="tablist" className="flex border-b border-slate-200 bg-slate-50/50 px-4 overflow-x-auto flex-shrink-0 scrollbar-none">
              {(['overview', 'courses', 'documents', 'notes'] as const).map((tab) => (
                <button
                  key={tab}
                  id={`tab-${tab}`}
                  role="tab"
                  aria-selected={activeTab === tab}
                  aria-controls={`tabpanel-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3.5 px-3 text-xs font-bold capitalize border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-800 space-y-5">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="ml-2 text-slate-500 font-medium">Loading details...</span>
                </div>
              )}

              {/* Tab: Overview */}
              {!loading && activeTab === 'overview' && (
                <div id="tabpanel-overview" role="tabpanel" aria-labelledby="tab-overview" className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Civil Demographics</span>
                      <div className="space-y-1">
                        <p className="text-slate-600">Age: <span className="text-slate-900 font-bold">{detail?.age ?? member.age ?? 'Not provided'}{detail?.age != null ? ' Years' : ''}</span></p>
                        <p className="text-slate-600">Gender: <span className="text-slate-900 font-bold">{member.gender ?? 'Not provided'}</span></p>
                        <p className="text-slate-600">Category: <span className="text-slate-900 font-bold">{member.category ? member.category.toUpperCase() : 'Not provided'}</span></p>
                      </div>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Education & Vol.</span>
                      <div className="space-y-1">
                        <p className="text-slate-600">Standard: <span className="text-slate-900 font-bold">{member.qualification ?? 'Not provided'}</span></p>
                        <p className="text-slate-600">District: <span className="text-slate-900 font-bold">{member.district ?? 'Not provided'}</span></p>
                        <p className="text-slate-600">Coordinator: <span className="text-slate-900 font-bold">{member.assignedVolunteer ?? 'Not provided'}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3.5 border border-slate-200 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Residential Address</span>
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      {address?.village ?? member.village ?? 'Not provided'}
                    </p>
                    <p className="text-slate-500 pl-4.5">District {address?.district ?? member.district ?? 'Not provided'}, {address?.state ?? member.state ?? 'Not provided'}, India.</p>
                  </div>
                  <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Admin Insights</span>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      This beneficiary was registered on <strong className="text-blue-700 font-bold">{member.createdAt?.split('T')[0] ?? 'Not provided'}</strong>.
                      {detail?.beneficiaryDocuments ? ` ${detail.beneficiaryDocuments.length} document(s) on file.` : ''}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: Courses */}
              {!loading && activeTab === 'courses' && (
                <div id="tabpanel-courses" role="tabpanel" aria-labelledby="tab-courses" className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <p className="font-bold text-slate-900 text-sm">Registered Trainings & Enrollment History</p>
                  </div>
                  {!detail || detail.courseEnrollments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      {loading ? 'Loading...' : 'No active program enrollments found for this member.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {detail.courseEnrollments.map((e) => (
                        <div key={e.id} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex justify-between items-center hover:bg-slate-100/50 transition-colors">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900">{e.course?.title ?? 'Unknown Course'}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Enrolled: {e.enrollmentDate}
                              {e.trainer && <span className="ml-2">• Trainer: {e.trainer}</span>}
                            </p>
                            {e.attendance != null && (
                              <p className="text-[10px] text-slate-400">Attendance: {e.attendance}%</p>
                            )}
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                            e.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200/50' :
                            e.status === 'enrolled' ? 'bg-blue-100 text-blue-700 border border-blue-200/50' :
                            'bg-red-100 text-red-700 border border-red-200/50'
                          }`}>
                            {e.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Documents */}
              {!loading && activeTab === 'documents' && (
                <div id="tabpanel-documents" role="tabpanel" aria-labelledby="tab-documents" className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-slate-900 text-sm">Identification Documents</p>
                    {detail?.beneficiaryDocuments && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200/50 font-bold uppercase rounded-full px-2.5 py-0.5">
                        {detail.beneficiaryDocuments.length} File(s)
                      </span>
                    )}
                  </div>

                  {!detail || detail.beneficiaryDocuments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No documents uploaded yet.
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      {detail.beneficiaryDocuments.map((doc, idx) => {
                        const style = DOC_STATUS_STYLES[doc.status] ?? DOC_STATUS_STYLES.pending;
                        const isLast = idx === detail.beneficiaryDocuments.length - 1;
                        return (
                          <div key={doc.id} className={`p-3.5 ${!isLast ? 'border-b border-slate-100' : ''}`}>
                            <div className="flex items-start gap-3">
                              <span className="bg-blue-50 text-blue-600 p-1.5 rounded-lg border border-blue-100 flex-shrink-0 mt-0.5">
                                <FileText className="w-4 h-4" />
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-bold text-slate-900 text-xs">{doc.label || doc.type}</p>
                                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.bg} ${style.color}`}>
                                    {doc.status === 'verified' && <Check className="w-3 h-3" />}
                                    {doc.status === 'pending' && <RefreshCw className="w-3 h-3" />}
                                    {doc.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                    {style.label}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                                  <span>Uploaded {doc.uploadedDate?.split('T')[0] ?? 'Not provided'}</span>
                                  {doc.verifiedDate && (
                                    <span className="text-green-600">
                                      Verified {doc.verifiedDate.split('T')[0]}
                                      {doc.verifiedByName && <span className="text-slate-400"> by {doc.verifiedByName}</span>}
                                    </span>
                                  )}
                                </div>

                                {doc.rejectionReason && (
                                  <p className="text-[10px] text-red-600 mt-1.5 bg-red-50 border border-red-100 px-2 py-1 rounded-md">
                                    <span className="font-semibold">Rejection reason:</span> {doc.rejectionReason}
                                  </p>
                                )}

                                {doc.status === 'pending' && (
                                  <div className="mt-2.5">
                                    {rejectingDocId === doc.id ? (
                                      <div className="space-y-2">
                                        <input
                                          type="text"
                                          value={rejectReason}
                                          onChange={(e) => setRejectReason(e.target.value)}
                                          placeholder="Enter rejection reason..."
                                          className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-400"
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleRejectDocument(doc.id)}
                                            disabled={!rejectReason.trim()}
                                            className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                                          >
                                            Confirm Reject
                                          </button>
                                          <button
                                            onClick={() => { setRejectingDocId(null); setRejectReason(''); }}
                                            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200 cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleVerifyDocument(doc.id)}
                                          className="flex-1 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-center font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                                        >
                                          <Check className="w-3 h-3" /> Verify
                                        </button>
                                        <button
                                          onClick={() => setRejectingDocId(doc.id)}
                                          className="flex-1 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50/50 rounded-lg text-center font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                                        >
                                          <XCircle className="w-3 h-3" /> Reject
                                        </button>
                                        <a
                                          href={`/api/admin/members/${member?.id}/documents/${doc.id}/view`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex-1 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-center font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                                        >
                                          <Eye className="w-3 h-3" /> View
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {doc.status !== 'pending' && (
                                  <div className="mt-2.5">
                                    <a
                                      href={`/api/admin/members/${member?.id}/documents/${doc.id}/view`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 py-1.5 px-3 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50/50 rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-3 h-3" /> View Document
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Notes */}
              {!loading && activeTab === 'notes' && (
                <div id="tabpanel-notes" role="tabpanel" aria-labelledby="tab-notes" className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <p className="font-bold text-slate-900 text-sm">Administrative Dossier Notes</p>
                  </div>
                  <form onSubmit={handleAddNote} className="flex gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      placeholder="Add an administrative reference..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 placeholder-slate-400 text-slate-900"
                    />
                    <button
                      type="submit"
                      className="px-3.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer"
                      aria-label="Add note"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                  <div className="space-y-3">
                    {notes.length === 0 ? (
                      <p className="text-center py-6 text-slate-400 font-medium">No notes on record.</p>
                    ) : (
                      notes.map((note) => (
                        <div key={note.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between gap-3 items-start hover:border-slate-200 transition-all">
                          <div className="space-y-1 flex-1">
                            <p className="text-slate-800 leading-relaxed font-medium">{note.text}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                              <span className="font-bold text-slate-500">{note.author}</span>
                              <span>•</span>
                              <span>{note.createdAt}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-slate-300 hover:text-red-500 p-1 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Remove Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5 flex-shrink-0">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-center transition-all cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
