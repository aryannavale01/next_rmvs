'use client';

import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Check, 
  RefreshCw, 
  Eye, 
  Download, 
  Plus, 
  Trash2, 
  Calendar, 
  Award, 
  BookOpen,
  MapPin, 
  User, 
  Briefcase, 
  Clock,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// ==========================================
// 1. TYPE DEFINITIONS FOR NEXT.JS
// ==========================================

export interface Member {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  category: string;
  qualification: string;
  district: string;
  state: string;
  village: string;
  assigned_volunteer: string;
  created_at: string;
  profile_image?: string;
}

export interface Course {
  id: string;
  title: string;
}

export interface Enrollment {
  id: string;
  member_id: string;
  course_id: string;
  status: 'Completed' | 'Enrolled' | 'Dropped';
  enrolled_date: string;
}

export interface Note {
  id: string;
  text: string;
  created_at: string;
  author: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

// ==========================================
// 2. COMPANION STATIC DEMO DATA
// ==========================================

const SAMPLE_COURSES: Course[] = [
  { id: 'c-1', title: 'Artificial Intelligence & Deep Learning' },
  { id: 'c-2', title: 'Cloud Infrastructure & Kubernetes' },
  { id: 'c-3', title: 'Full Stack Software Engineering' },
];

const SAMPLE_ENROLLMENTS: Enrollment[] = [
  { id: 'e-1', member_id: 'mem-101', course_id: 'c-1', status: 'Enrolled', enrolled_date: '2026-05-12' },
  { id: 'e-2', member_id: 'mem-101', course_id: 'c-2', status: 'Completed', enrolled_date: '2026-02-10' },
];

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  { id: 'act-1', type: 'progress', description: 'Completed Lecture 5 on Recurrent Neural Networks (RNNs)', created_at: '2026-07-18 10:24' },
  { id: 'act-2', type: 'payment', description: 'Tuition payment of $249.99 processed successfully', created_at: '2026-07-17 14:11' },
  { id: 'act-3', type: 'document', description: 'Uploaded civil identity verification card (Aadhaar Card)', created_at: '2026-07-15 09:30' },
];

// ==========================================
// 3. COMPLETE REUSABLE DRAWER COMPONENT
// ==========================================

interface MemberProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  courses?: Course[];
  enrollments?: Enrollment[];
  initialActivities?: ActivityItem[];
}

export default function MemberProfileDrawer({
  isOpen,
  onClose,
  member,
  courses = SAMPLE_COURSES,
  enrollments = SAMPLE_ENROLLMENTS,
  initialActivities = SAMPLE_ACTIVITIES
}: MemberProfileDrawerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'documents' | 'activity' | 'notes'>('overview');
  const [notes, setNotes] = useState<Note[]>([
    { id: '1', text: 'Beneficiary displays outstanding aptitude for analytical computation.', created_at: '2026-07-16 11:15', author: 'Siddharth Sharma' },
    { id: '2', text: 'Requested guidance on state-backed transport subsidy applications.', created_at: '2026-07-17 15:42', author: 'Arjun Prasad' }
  ]);
  const [newNoteText, setNewNoteText] = useState('');
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);

  // Early return if not open or no member selected
  if (!isOpen || !member) return null;

  const memberEnrollments = enrollments.filter(e => e.member_id === member.id);

  // Add notes dynamically
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      author: 'Administrator'
    };

    setNotes([newNote, ...notes]);
    setNewNoteText('');

    // Append to activities
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      type: 'note',
      description: `Added administrator file notes to portfolio`,
      created_at: newNote.created_at
    };
    setActivities([newActivity, ...activities]);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out" 
          onClick={onClose}
        />

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          {/* Slide-over panel */}
          <div className="pointer-events-auto w-screen max-w-xl transform transition-transform duration-300 ease-in-out bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden">
            
            {/* Header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                {member.profile_image ? (
                  <img
                    src={member.profile_image}
                    alt={member.full_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-600 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {member.full_name[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">{member.full_name}</h4>
                  <span className="text-[10px] text-slate-500 font-mono tracking-tight">Dossier ID: {member.id}</span>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-all"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Navigation Tabs */}
            <div role="tablist" className="flex border-b border-slate-200 bg-slate-50/50 px-4 overflow-x-auto flex-shrink-0 scrollbar-none">
              {(['overview', 'courses', 'documents', 'activity', 'notes'] as const).map((tab) => (
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

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-800 space-y-5">
              
              {/* Tab: Overview */}
              {activeTab === 'overview' && (
                <div id="tabpanel-overview" role="tabpanel" aria-labelledby="tab-overview" className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Civil Demographics</span>
                      <div className="space-y-1">
                        <p className="text-slate-600">Age: <span className="text-slate-900 font-bold">{member.age} Years</span></p>
                        <p className="text-slate-600">Gender: <span className="text-slate-900 font-bold">{member.gender}</span></p>
                        <p className="text-slate-600">Category: <span className="text-slate-900 font-bold">{member.category}</span></p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Education & Vol.</span>
                      <div className="space-y-1">
                        <p className="text-slate-600">Standard: <span className="text-slate-900 font-bold">{member.qualification}</span></p>
                        <p className="text-slate-600">District: <span className="text-slate-900 font-bold">{member.district}</span></p>
                        <p className="text-slate-600">Coordinator: <span className="text-slate-900 font-bold">{member.assigned_volunteer}</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 border border-slate-200 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Residential Address</span>
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      {member.village} village
                    </p>
                    <p className="text-slate-500 pl-4.5">District {member.district}, {member.state}, India.</p>
                  </div>

                  <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Admin Insights</span>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      This beneficiary was registered on <strong className="text-blue-700 font-bold">{member.created_at}</strong>. They have completed 1 skill qualification and are eligible for state-backed transport subsidies.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: Trainings */}
              {activeTab === 'courses' && (
                <div id="tabpanel-courses" role="tabpanel" aria-labelledby="tab-courses" className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <p className="font-bold text-slate-900 text-sm">Registered Trainings & Enrollment History</p>
                  </div>

                  {memberEnrollments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No active program enrollments found for this member.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {memberEnrollments.map((e) => {
                        const matchedCourse = courses.find(co => co.id === e.course_id);
                        return (
                          <div key={e.id} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex justify-between items-center hover:bg-slate-100/50 transition-colors">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900">{matchedCourse?.title || 'Training Program'}</p>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Enrolled: {e.enrolled_date}
                              </p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                              e.status === 'Completed' ? 'bg-green-100 text-green-700 border border-green-200/50' :
                              e.status === 'Enrolled' ? 'bg-blue-100 text-blue-700 border border-blue-200/50' :
                              'bg-red-100 text-red-700 border border-red-200/50'
                            }`}>
                              {e.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Documents */}
              {activeTab === 'documents' && (
                <div id="tabpanel-documents" role="tabpanel" aria-labelledby="tab-documents" className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-slate-900 text-sm">Uploaded Civil Identification Documents</p>
                    <span className="text-[10px] bg-green-100 text-green-700 border border-green-200/50 font-bold uppercase rounded-full px-2.5 py-0.5">3 Files Attached</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Doc 1: Aadhaar Card */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500/40 hover:shadow-sm transition-all flex flex-col justify-between h-36">
                      <div>
                        <div className="flex items-start gap-2 mb-2">
                          <span className="bg-blue-100 text-blue-600 p-2 rounded-lg border border-blue-200/40">
                            <FileText className="w-4 h-4" />
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">Aadhaar Card Scan</p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">PDF • 1.4 MB</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5 mt-1">
                          <Check className="w-3.5 h-3.5" /> Verified Valid
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-200/60 mt-2">
                        <button className="flex-1 py-1.5 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50/50 rounded-lg text-center font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1">
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <button className="flex-1 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-center font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1">
                          <Download className="w-3 h-3" /> Get
                        </button>
                      </div>
                    </div>

                    {/* Doc 2: Ration Card */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500/40 hover:shadow-sm transition-all flex flex-col justify-between h-36">
                      <div>
                        <div className="flex items-start gap-2 mb-2">
                          <span className="bg-blue-100 text-blue-600 p-2 rounded-lg border border-blue-200/40">
                            <FileText className="w-4 h-4" />
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">Ration Card Scan</p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">PNG • 850 KB</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5 mt-1">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-0.5" /> Under Audit
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-200/60 mt-2">
                        <button className="flex-1 py-1.5 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50/50 rounded-lg text-center font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1">
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <button className="flex-1 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-center font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1">
                          <Download className="w-3 h-3" /> Get
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Activity */}
              {activeTab === 'activity' && (
                <div id="tabpanel-activity" role="tabpanel" aria-labelledby="tab-activity" className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <p className="font-bold text-slate-900 text-sm">Chronological Action Logs</p>
                  </div>

                  <div className="relative border-l-2 border-slate-100 ml-3.5 pl-5 space-y-5">
                    {activities.map((act) => (
                      <div key={act.id} className="relative">
                        {/* Custom visual timeline node dot */}
                        <span className="absolute -left-8.5 top-0.5 bg-white border-2 border-blue-500 w-3 h-3 rounded-full flex items-center justify-center shadow-xs" />
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{act.description}</p>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{act.created_at}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Notes */}
              {activeTab === 'notes' && (
                <div id="tabpanel-notes" role="tabpanel" aria-labelledby="tab-notes" className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <p className="font-bold text-slate-900 text-sm">Administrative Dossier Notes</p>
                  </div>

                  {/* Add Note Form */}
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

                  {/* Notes Feed List */}
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
                              <span>{note.created_at}</span>
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

            {/* Footer controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5 flex-shrink-0">
              <button 
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-center transition-all cursor-pointer"
              >
                Close Drawer
              </button>
              <button 
                onClick={() => {
                  toast({ title: 'Export Started', description: `Exporting portfolio dossiers for: ${member.full_name}`, variant: 'info' });
                }}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-center shadow-xs transition-all cursor-pointer"
              >
                Export Dossier
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
