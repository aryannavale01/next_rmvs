'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/admin-context';
import { AdminCourse, SyllabusLesson, Coupon } from '@/lib/admin-types';
import {
  BookOpen, Search, Plus, Trash2, X, Eye, ChevronLeft, ChevronRight,
  GripVertical, ChevronDown, ChevronUp, Check, FileText,
  DollarSign, Users, GraduationCap,
  Tag,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import MetricCards from '@/components/MetricCards';
import { motion, AnimatePresence } from 'motion/react';
import { getStatusStyle } from '@/lib/status-styles';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const STEP_LABELS = [
  'Basic Info', 'Instructor', 'Schedule', 'Seats', 'Pricing',
  'Coupons', 'Documents', 'Syllabus', 'Settings',
];

const CATEGORIES = ['Agriculture', 'Tech', 'Healthcare', 'Business'];
const MODES = ['Online', 'Offline', 'Hybrid'];
const LESSON_TYPES = ['Video', 'Text', 'Quiz', 'Assignment'] as const;
const DOC_OPTIONS = ['Aadhaar', 'PAN', 'Ration Card', 'Profile Photo'];

function StepIndicator({ currentStep, setCurrentStep }: { currentStep: WizardStep; setCurrentStep: (s: WizardStep) => void }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {STEP_LABELS.map((label, i) => {
        const step = (i + 1) as WizardStep;
        const isActive = step === currentStep;
        const isDone = step < currentStep;
        return (
          <React.Fragment key={step}>
            <button onClick={() => setCurrentStep(step)}
              className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold transition-all ${
                isActive ? 'bg-primary text-white scale-110 shadow-md' : isDone ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
              }`}>
              {isDone ? <Check className="w-3 h-3" /> : step}
            </button>
            {i < STEP_LABELS.length - 1 && <div className={`flex-1 h-0.5 ${isDone ? 'bg-success/30' : 'bg-border'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function WizInput({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
    </div>
  );
}

function WizSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg outline-none bg-card">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function WizToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <button type="button" onClick={onChange} className={`w-10 h-5 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-border'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'left-5.5 translate-x-0' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

const emptyWizard = {
  title: '', meta_description: '', category: 'Agriculture', mode: 'Online' as AdminCourse['mode'], location: '',
  teacher_id: '', start_date: '', end_date: '', duration: '',
  seats_total: 30, access_code_required: false, auto_approve: false,
  price: 0, currency: 'INR',
  coupons: [] as { code: string; description: string; discountType: 'percentage' | 'fixed'; discountValue: number; maxUses: number; expiresAt: string }[],
  required_docs: [] as string[],
  syllabus: [] as SyllabusLesson[],
  status: 'Draft' as AdminCourse['status'], benefits: '', eligibility: '',
};

export default function AdminTrainingPage() {
  const router = useRouter();
  const { courses, teachers, enrollments, members, addCourse, updateCourse, deleteCourse } = useAdmin();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft'>('All');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [wiz, setWiz] = useState(emptyWizard);
  const [couponDraft, setCouponDraft] = useState({ code: '', description: '', discountType: 'percentage' as 'percentage' | 'fixed', discountValue: 0, maxUses: 10, expiresAt: '' });
  const [lessonDraft, setLessonDraft] = useState({ title: '', type: 'Video' as SyllabusLesson['type'], duration: '' });

  const filtered = useMemo(() => {
    let list = [...courses];
    if (statusFilter !== 'All') list = list.filter(c => c.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }
    return list;
  }, [courses, statusFilter, search]);

  const stats = useMemo(() => ({
    total: courses.length,
    published: courses.filter(c => c.status === 'Published').length,
    draft: courses.filter(c => c.status === 'Draft').length,
    enrolled: courses.reduce((s, c) => s + c.seats_enrolled, 0),
    totalApplications: enrollments.length,
  }), [courses, enrollments]);

  const openWizard = () => { setWiz(emptyWizard); setCurrentStep(1); setShowWizard(true); };

  const addCouponToWizard = () => {
    if (!couponDraft.code) return;
    setWiz(f => ({ ...f, coupons: [...f.coupons, { ...couponDraft }] }));
    setCouponDraft({ code: '', description: '', discountType: 'percentage', discountValue: 0, maxUses: 10, expiresAt: '' });
  };

  const removeCoupon = (idx: number) => setWiz(f => ({ ...f, coupons: f.coupons.filter((_, i) => i !== idx) }));

  const addLessonToWizard = () => {
    if (!lessonDraft.title) return;
    const id = `les-${Date.now()}-${wiz.syllabus.length}-${crypto.randomUUID().slice(0, 8)}`;
    setWiz(f => ({ ...f, syllabus: [...f.syllabus, { ...lessonDraft, id }] }));
    setLessonDraft({ title: '', type: 'Video', duration: '' });
  };

  const removeLesson = (idx: number) => setWiz(f => ({ ...f, syllabus: f.syllabus.filter((_, i) => i !== idx) }));

  const moveLesson = (idx: number, dir: -1 | 1) => {
    setWiz(f => {
      const arr = [...f.syllabus];
      const ni = idx + dir;
      if (ni < 0 || ni >= arr.length) return f;
      [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
      return { ...f, syllabus: arr };
    });
  };

  const handleWizardSubmit = () => {
    addCourse({
      title: wiz.title, meta_description: wiz.meta_description, category: wiz.category,
      mode: wiz.mode, location: wiz.location, teacher_id: wiz.teacher_id,
      start_date: wiz.start_date, end_date: wiz.end_date, duration: wiz.duration,
      seats_total: wiz.seats_total, access_code_required: wiz.access_code_required,
      auto_approve: wiz.auto_approve, price: wiz.price, currency: wiz.currency,
      coupons: wiz.coupons.map(c => ({
        id: '', code: c.code, description: c.description, discountType: c.discountType, discountValue: c.discountValue,
        expiresAt: c.expiresAt || null, validFrom: null, maxUses: c.maxUses, usedCount: 0,
        perUserLimit: null, minAmount: null, courseId: null, isActive: true,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      })),
      required_docs: wiz.required_docs, syllabus: wiz.syllabus,
      status: wiz.status, benefits: wiz.benefits.split(',').map(b => b.trim()).filter(Boolean), eligibility: wiz.eligibility,
    });
    setShowWizard(false);
  };

  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.fullName || 'Not assigned';

  const togglePublish = (c: AdminCourse) => {
    updateCourse(c.id, { status: c.status === 'Published' ? 'Draft' : 'Published' });
  };

  const toggleAutoApprove = (c: AdminCourse) => {
    updateCourse(c.id, { auto_approve: !c.auto_approve });
  };

  const handleDelete = (id: string) => { deleteCourse(id); setDeleteConfirm(null); };

  const renderWizardStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <WizInput label="Training Title *" value={wiz.title} onChange={v => setWiz(f => ({ ...f, title: v }))} placeholder="e.g. Sustainable Farming Basics" />
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Description / Meta</label>
              <textarea value={wiz.meta_description} onChange={e => setWiz(f => ({ ...f, meta_description: e.target.value }))} rows={3} placeholder="Short training description..."
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <WizSelect label="Category" value={wiz.category} onChange={v => setWiz(f => ({ ...f, category: v }))} options={CATEGORIES} />
              <WizSelect label="Mode" value={wiz.mode} onChange={v => setWiz(f => ({ ...f, mode: v as AdminCourse['mode'] }))} options={MODES} />
            </div>
            <WizInput label="Location" value={wiz.location} onChange={v => setWiz(f => ({ ...f, location: v }))} placeholder="e.g. Pune, Maharashtra" />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <WizSelect label="Assign Instructor" value={wiz.teacher_id || ''} onChange={v => setWiz(f => ({ ...f, teacher_id: v }))} options={teachers.map(t => t.id)} />
            <div className="bg-background border border-border rounded-lg p-4">
              {wiz.teacher_id ? (() => {
                const t = teachers.find(x => x.id === wiz.teacher_id);
                return t ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                      {t.fullName.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{t.fullName}</p>
                      <p className="text-xs text-muted-foreground">{t.designation} &middot; {t.specializations?.join(', ')}</p>
                    </div>
                  </div>
                ) : <p className="text-xs text-muted-foreground">Teacher not found</p>;
              })() : <p className="text-xs text-muted-foreground">Select a teacher from the dropdown above</p>}
            </div>
            {teachers.length === 0 && <p className="text-xs text-warning-text bg-warning-bg p-3 rounded-lg border border-warning/20">No teachers available. Add teachers first.</p>}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <WizInput label="Start Date" value={wiz.start_date} onChange={v => setWiz(f => ({ ...f, start_date: v }))} type="date" />
              <WizInput label="End Date" value={wiz.end_date} onChange={v => setWiz(f => ({ ...f, end_date: v }))} type="date" />
            </div>
            <WizInput label="Duration" value={wiz.duration} onChange={v => setWiz(f => ({ ...f, duration: v }))} placeholder="e.g. 3 months, 12 weeks" />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <WizInput label="Total Seats" value={wiz.seats_total} onChange={v => setWiz(f => ({ ...f, seats_total: Number(v) }))} type="number" />
            <WizToggle label="Access Code Required" checked={wiz.access_code_required} onChange={() => setWiz(f => ({ ...f, access_code_required: !f.access_code_required }))} />
            <WizToggle label="Auto-Approve Enrollments" checked={wiz.auto_approve} onChange={() => setWiz(f => ({ ...f, auto_approve: !f.auto_approve }))} />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <WizInput label="Price" value={wiz.price} onChange={v => setWiz(f => ({ ...f, price: Number(v) }))} type="number" />
              <WizSelect label="Currency" value={wiz.currency} onChange={v => setWiz(f => ({ ...f, currency: v }))} options={['INR', 'USD', 'EUR']} />
            </div>
            <div className="bg-background border border-border rounded-lg p-4 text-center">
              <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{wiz.currency} {wiz.price.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Training Fee</p>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 items-end">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Code</label>
                <input value={couponDraft.code} onChange={e => setCouponDraft(d => ({ ...d, code: e.target.value.toUpperCase() }))} placeholder="SAVE20"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none uppercase" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Type</label>
                <select value={couponDraft.discountType} onChange={e => setCouponDraft(d => ({ ...d, discountType: e.target.value as 'percentage' | 'fixed' }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg outline-none bg-card">
                  <option value="percentage">Percentage</option><option value="fixed">Fixed</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Value</label>
                <input type="number" value={couponDraft.discountValue} onChange={e => setCouponDraft(d => ({ ...d, discountValue: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg outline-none" />
              </div>
              <button onClick={addCouponToWizard} className="px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg h-[38px]">
                <Plus className="w-4 h-4 inline" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 items-end">
              <WizInput label="Max Uses" value={couponDraft.maxUses} onChange={v => setCouponDraft(d => ({ ...d, maxUses: Number(v) }))} type="number" />
              <WizInput label="Expiry Date" value={couponDraft.expiresAt} onChange={v => setCouponDraft(d => ({ ...d, expiresAt: v }))} type="date" />
            </div>
            {wiz.coupons.length > 0 && (
              <div className="space-y-2">
                {wiz.coupons.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-bold text-foreground">{c.code}</span>
                    <span className="text-[10px] text-muted-foreground">{c.discountType === 'percentage' ? `${c.discountValue}%` : `${wiz.currency} ${c.discountValue}`}</span>
                    <span className="text-[10px] text-muted-foreground">Max: {c.maxUses}</span>
                    <button onClick={() => removeCoupon(i)} className="ml-auto p-1 rounded hover:bg-destructive-bg text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {wiz.coupons.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No coupons added yet</p>}
          </div>
        );
      case 7:
        return (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Select documents required for enrollment verification:</p>
            {DOC_OPTIONS.map(doc => (
              <label key={doc} className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg cursor-pointer hover:bg-primary-light/50 transition-colors">
                <input type="checkbox" checked={wiz.required_docs.includes(doc)}
                  onChange={() => setWiz(f => ({
                    ...f,
                    required_docs: f.required_docs.includes(doc) ? f.required_docs.filter(d => d !== doc) : [...f.required_docs, doc],
                  }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-sm font-semibold text-foreground">{doc}</span>
              </label>
            ))}
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 items-end">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Lesson Title</label>
                <input value={lessonDraft.title} onChange={e => setLessonDraft(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Intro to Soil Types"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Type</label>
                <select value={lessonDraft.type} onChange={e => setLessonDraft(d => ({ ...d, type: e.target.value as SyllabusLesson['type'] }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg outline-none bg-card">
                  {LESSON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Duration</label>
                <input value={lessonDraft.duration} onChange={e => setLessonDraft(d => ({ ...d, duration: e.target.value }))} placeholder="15 min"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg outline-none" />
              </div>
              <button onClick={addLessonToWizard} className="px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg h-[38px]">
                <Plus className="w-4 h-4 inline" />
              </button>
            </div>
            {wiz.syllabus.length > 0 && (
              <div className="space-y-1.5">
                {wiz.syllabus.map((les, i) => (
                  <div key={les.id} className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab" />
                    <span className="text-[10px] font-bold text-muted-foreground w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{les.title}</p>
                      <p className="text-[10px] text-muted-foreground">{les.type} &middot; {les.duration}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => moveLesson(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30" aria-label="Move lesson up"><ChevronUp className="w-3 h-3" /></button>
                      <button onClick={() => moveLesson(i, 1)} disabled={i === wiz.syllabus.length - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30" aria-label="Move lesson down"><ChevronDown className="w-3 h-3" /></button>
                      <button onClick={() => removeLesson(i)} className="p-1 rounded hover:bg-destructive-bg text-muted-foreground hover:text-destructive" aria-label="Remove lesson"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {wiz.syllabus.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No lessons added yet</p>}
          </div>
        );
      case 9:
        return (
          <div className="space-y-4">
            <WizSelect label="Status" value={wiz.status} onChange={v => setWiz(f => ({ ...f, status: v as AdminCourse['status'] }))} options={['Draft', 'Published']} />
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Benefits (comma-separated)</label>
              <textarea value={wiz.benefits} onChange={e => setWiz(f => ({ ...f, benefits: e.target.value }))} rows={3} placeholder="Job ready, Certification, Practical skills, ..."
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Eligibility</label>
              <textarea value={wiz.eligibility} onChange={e => setWiz(f => ({ ...f, eligibility: e.target.value }))} rows={3} placeholder="18+ years, Rural background, ..."
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" />
            </div>
          </div>
        );
    }
  };

  // ─── List View ───
  return (
    <div className="space-y-4 font-sans">
      {/* Stat Cards */}
      <MetricCards
        activeFilter="total"
        onFilterChange={() => {}}
        columns={5}
        cards={[
          { id: 'total', label: 'Total', value: stats.total, icon: BookOpen },
          { id: 'published', label: 'Published', value: stats.published, icon: Check },
          { id: 'draft', label: 'Draft', value: stats.draft, icon: FileText },
          { id: 'enrolled', label: 'Enrolled', value: stats.enrolled, icon: Users },
          { id: 'applications', label: 'Applications', value: stats.totalApplications, icon: GraduationCap },
        ]}
      />

      {/* Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search trainings by title, category..."
            className="flex-1 text-sm outline-none placeholder:text-muted-foreground min-w-0" />
        </div>
        <div className="flex gap-1">
          {(['All', 'Published', 'Draft'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted'}`}>{s}</button>
          ))}
        </div>
        <button onClick={openWizard} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">
          <Plus className="w-3.5 h-3.5" /> Add Training
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Enrolled</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-12">
                  <EmptyState icon={BookOpen} title="No trainings" description="Create your first training to start enrolling beneficiaries." />
                </td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-primary-light/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">{c.title}</p>
                    <p className="text-[10px] text-muted-foreground">{c.mode} &middot; {c.location}</p>
                  </td>
                  <td className="px-4 py-3"><span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{c.category}</span></td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    <span className="font-bold">{c.seats_enrolled}</span>
                    <span className="text-muted-foreground"> / {c.seats_total}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getStatusStyle(c.status)}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => router.push(`/admin/training/${c.id}`)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowWizard(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Add New Training</h3>
                  <p className="text-[10px] text-muted-foreground">Step {currentStep} of 9: {STEP_LABELS[currentStep - 1]}</p>
                </div>
                <button onClick={() => setShowWizard(false)} className="p-1.5 rounded-md hover:bg-muted" aria-label="Close wizard"><X className="w-4 h-4" /></button>
              </div>
              <div className="px-6 pt-4 overflow-y-auto flex-1">
                <StepIndicator currentStep={currentStep} setCurrentStep={setCurrentStep} />
                <div className="min-h-[200px]">
                  {renderWizardStep()}
                </div>
              </div>
              <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-between">
                <button onClick={() => setCurrentStep(s => Math.max(1, s - 1) as WizardStep)} disabled={currentStep === 1}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent disabled:opacity-30">
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                {currentStep < 9 ? (
                  <button onClick={() => setCurrentStep(s => Math.min(9, s + 1) as WizardStep)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button onClick={handleWizardSubmit} disabled={!wiz.title}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-30">
                    <Check className="w-3.5 h-3.5" /> Create Training
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-2">Delete Training?</h3>
            <p className="text-xs text-muted-foreground mb-6">This action cannot be undone. The training and all its data will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-xs font-semibold border border-border rounded-lg hover:bg-muted">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
