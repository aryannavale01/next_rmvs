'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { Teacher, TeacherDetail } from '@/lib/admin-types';
import {
  GraduationCap, Search, Plus, Filter, Eye, Pencil, Trash2, X,
  ChevronLeft, ChevronRight, ArrowUpDown, Camera,
  Users, Clock, Award, BookOpen, RefreshCw, AlertTriangle, Loader2,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import MetricCards from '@/components/MetricCards';
import { getStatusStyle } from '@/lib/status-styles';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

type SortKey = 'fullName' | 'designation' | 'teacherType' | 'status' | 'district' | 'experienceYears' | 'mobile' | 'joinedDate';
type SortDir = 'asc' | 'desc';

const TEACHER_TYPES = ['All', 'trainer', 'volunteer', 'guest_faculty'] as const;
const STATUSES = ['All', 'active', 'inactive', 'on_leave', 'resigned'] as const;
const PAGE_SIZES = [10, 20, 30, 50];

const TYPE_LABELS: Record<string, string> = {
  trainer: 'Trainer',
  volunteer: 'Volunteer',
  guest_faculty: 'Guest Faculty',
};

export default function AdminTeachersPage() {
  const { teachers, showDeletedTeachers, setShowDeletedTeachers, addTeacher, updateTeacher, deleteTeacher, restoreTeacher, refreshTeachers } = useAdmin();
  const { toast } = useToast();
  const [metricActive, setMetricActive] = useState('total');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('fullName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [profileTeacher, setProfileTeacher] = useState<Teacher | null>(null);
  const [detailTeacher, setDetailTeacher] = useState<TeacherDetail | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempPasswordName, setTempPasswordName] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const drawerPhotoInputRef = useRef<HTMLInputElement>(null);

  const emptyForm = {
    fullName: '', email: '', mobile: '', designation: '',
    teacherType: 'trainer' as Teacher['teacherType'],
    status: 'active' as Teacher['status'],
    joinedDate: '', district: '', village: '', taluka: '', state: 'Maharashtra',
    specializations: '', experienceYears: '', qualification: '', pincode: '', bio: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const counts = {
    total: teachers.length,
    active: teachers.filter(t => t.status === 'active').length,
    trainers: teachers.filter(t => t.teacherType === 'trainer').length,
    volunteers: teachers.filter(t => t.teacherType === 'volunteer').length,
  };

  const filteredTeachers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return teachers.filter(t => {
      if (typeFilter !== 'All' && t.teacherType !== typeFilter) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (!q) return true;
      return [
        t.fullName, t.email, t.mobile, t.designation,
        t.district ?? '', t.village ?? '', t.taluka ?? '',
        t.qualification ?? '', ...(t.specializations ?? []),
      ].join(' ').toLowerCase().includes(q);
    });
  }, [teachers, debouncedSearch, typeFilter, statusFilter]);

  const sortedTeachers = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filteredTeachers].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [filteredTeachers, sortKey, sortDir]);

  const totalFiltered = sortedTeachers.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageTeachers = useMemo(
    () => sortedTeachers.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sortedTeachers, safePage, pageSize],
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const openAdd = () => { setForm(emptyForm); setEditTeacher(null); setFormError(null); setShowAddModal(true); };
  const openEdit = (t: Teacher) => {
    setForm({
      fullName: t.fullName, email: t.email, mobile: t.mobile,
      designation: t.designation, teacherType: t.teacherType, status: t.status,
      joinedDate: t.joinedDate, district: t.district ?? '', village: t.village ?? '',
      taluka: t.taluka ?? '', state: t.state, specializations: (t.specializations ?? []).join(', '),
      experienceYears: t.experienceYears != null ? String(t.experienceYears) : '',
      qualification: t.qualification ?? '', pincode: t.pincode ?? '', bio: t.bio ?? '',
    });
    setEditTeacher(t); setFormError(null); setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!form.fullName || !form.email || !form.mobile || !form.designation || !form.joinedDate) {
      setFormError('Full name, email, mobile, designation, and join date are required.');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      // Strip empty strings — the API treats them as invalid values (e.g. pincode regex), not absent.
      const payload: Record<string, unknown> = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.replace(/\D/g, ''),
        designation: form.designation.trim(),
        teacherType: form.teacherType,
        status: form.status,
        joinedDate: form.joinedDate,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        specializations: form.specializations ? form.specializations.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      for (const key of ['qualification', 'village', 'taluka', 'district', 'state', 'pincode', 'bio'] as const) {
        const v = form[key]?.trim();
        if (v) payload[key] = v;
      }
      if (editTeacher) {
        await updateTeacher(editTeacher.id, payload);
        toast({ title: 'Teacher Updated', description: `${form.fullName}'s profile has been saved.`, variant: 'success' });
      } else {
        const result = await addTeacher(payload) as any;
        setTempPassword(result.temporaryPassword ?? null);
        setTempPasswordName(form.fullName);
        toast({ title: 'Teacher Registered', description: `${form.fullName} has been added successfully.`, variant: 'success' });
      }
      setShowAddModal(false);
    } catch (err: any) {
      if (err?.message === 'STEP_UP_PENDING') return;
      setFormError(err.message || 'Failed to save teacher');
    } finally {
      setFormLoading(false);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    let failed = 0;
    for (const id of selected) {
      try {
        if (action === 'delete') await deleteTeacher(id);
        else await updateTeacher(id, { status: action === 'activate' ? 'active' : 'inactive' });
      } catch (err: any) {
        if (err?.message === 'STEP_UP_PENDING') return;
        failed += 1;
        console.error('Bulk action error for teacher:', id, err);
      }
    }
    if (failed > 0) {
      toast({ title: 'Some Updates Failed', description: `${failed} of ${selected.size} teachers could not be updated. Please try again.`, variant: 'error' });
    }
    setSelected(new Set());
  };

  const handlePhotoUpload = async (teacherId: string, file: File, target: 'modal' | 'drawer') => {
    setPhotoLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/admin/teachers/${teacherId}/photo`, { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Upload failed');
      }
      const data = await res.json();
      if (target === 'drawer' && profileTeacher?.id === teacherId) {
        setProfileTeacher({ ...profileTeacher, profilePhoto: data.profilePhoto });
      }
      if (editTeacher?.id === teacherId) {
        setEditTeacher({ ...editTeacher, profilePhoto: data.profilePhoto });
      }
      await refreshTeachers();
      toast({ title: 'Photo Updated', description: 'Profile photo has been uploaded.', variant: 'success' });
    } catch (e: any) {
      toast({ title: 'Upload Failed', description: e.message || 'Could not upload photo.', variant: 'error' });
    } finally {
      setPhotoLoading(false);
    }
  };

  const thSort = (label: string, key: SortKey) => (
    <th className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort(key)}>
      <span className="flex items-center gap-1">{label} <ArrowUpDown className="w-3 h-3" /></span>
    </th>
  );

  const fetchDetail = useCallback(async (t: Teacher) => {
    setProfileTeacher(t);
    try {
      const res = await fetch(`/api/admin/teachers/${t.id}`);
      if (res.ok) setDetailTeacher(await res.json());
    } catch (e: unknown) {
      console.error('Failed to load teacher detail:', e);
      toast({ title: 'Error', description: 'Could not load teacher details.', variant: 'error' });
    }
  }, []);

  return (
    <div className="space-y-4 font-sans">
      <MetricCards
        activeFilter={metricActive}
        onFilterChange={(id) => {
          setMetricActive(id);
          if (id === 'total') { setTypeFilter('All'); setStatusFilter('All'); }
          else if (id === 'active') { setStatusFilter('active'); setTypeFilter('All'); }
          else if (id === 'trainers') { setTypeFilter('trainer'); setStatusFilter('All'); }
          else if (id === 'volunteers') { setTypeFilter('volunteer'); setStatusFilter('All'); }
        }}
        columns={4}
        cards={[
          { id: 'total', label: 'Total', value: counts.total, icon: Users },
          { id: 'active', label: 'Active', value: counts.active, icon: Award },
          { id: 'trainers', label: 'Trainers', value: counts.trainers, icon: BookOpen },
          { id: 'volunteers', label: 'Volunteers', value: counts.volunteers, icon: Clock },
        ]}
      />

      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search teachers by name, specialization, district..."
            className="flex-1 text-sm outline-none placeholder:text-muted-foreground min-w-0" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDeletedTeachers(!showDeletedTeachers)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-lg transition-colors ${showDeletedTeachers ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'border-border hover:bg-accent'}`}>
            <Trash2 className="w-3.5 h-3.5" /> {showDeletedTeachers ? 'Hide Deleted' : 'Show Deleted'}
          </button>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent">
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Teacher
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-4">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Type</label>
            <div className="flex gap-1">
              {TEACHER_TYPES.map(t => (
                <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md ${typeFilter === t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted'}`}>{t === 'All' ? 'All' : TYPE_LABELS[t] ?? t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Status</label>
            <div className="flex gap-1">
              {STATUSES.map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md ${statusFilter === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted'}`}>{s === 'All' ? 'All' : s.replace('_', ' ')}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <div className="bg-primary-light border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xs font-bold text-primary">{selected.size} selected</span>
          <button onClick={() => handleBulkAction('activate')} className="px-3 py-1.5 text-xs font-semibold bg-success text-white rounded-lg">Activate</button>
          <button onClick={() => handleBulkAction('deactivate')} className="px-3 py-1.5 text-xs font-semibold bg-primary-light text-primary rounded-lg">Deactivate</button>
          <button onClick={() => handleBulkAction('delete')} className="px-3 py-1.5 text-xs font-semibold bg-destructive text-white rounded-lg">Delete</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Clear</button>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-3 py-3 w-10">
                  <input type="checkbox"
                    checked={pageTeachers.length > 0 && pageTeachers.every(t => selected.has(t.id))}
                    onChange={() => {
                      const allSelected = pageTeachers.every(t => selected.has(t.id));
                      setSelected(prev => {
                        const n = new Set(prev);
                        pageTeachers.forEach(t => { if (allSelected) n.delete(t.id); else n.add(t.id); });
                        return n;
                      });
                    }}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                </th>
                {thSort('Name', 'fullName')}
                {thSort('Designation', 'designation')}
                {thSort('Type', 'teacherType')}
                {thSort('Experience', 'experienceYears')}
                {thSort('Mobile', 'mobile')}
                {thSort('Joined', 'joinedDate')}
                {thSort('Status', 'status')}
                <th className="px-3 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageTeachers.length === 0 && <tr><td colSpan={9} className="py-12">
                {showDeletedTeachers ? (
                  <EmptyState icon={Trash2} title="No deleted teachers" description="Deleted records will appear here." />
                ) : teachers.length === 0 ? (
                  <EmptyState icon={GraduationCap} title="No instructors" description="Add an instructor to begin teaching courses." />
                ) : (
                  <EmptyState icon={Search} title="No matching teachers" description="Try adjusting your search or filters." />
                )}
              </td></tr>}
              {pageTeachers.map(t => (
                <tr key={t.id} className={`hover:bg-primary-light/30 transition-colors ${selected.has(t.id) ? 'bg-primary-light/50' : ''} ${t.status === 'deleted' ? 'opacity-50' : ''}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => fetchDetail(t)} className="text-sm font-semibold text-foreground hover:text-primary hover:underline text-left">{t.fullName}</button>
                    <p className="text-[10px] text-muted-foreground">{t.email}</p>
                  </td>
                  <td className="px-3 py-3 text-sm text-foreground">{t.designation}</td>
                  <td className="px-3 py-3 text-sm text-foreground">{TYPE_LABELS[t.teacherType] ?? t.teacherType}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{t.experienceYears != null ? `${t.experienceYears} yrs` : '—'}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground font-mono">{t.mobile}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{t.joinedDate}</td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusStyle(t.status)}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {t.status === 'deleted' ? (
                        <button onClick={async () => { try { await restoreTeacher(t.id); toast({ title: 'Teacher Restored', description: `${t.fullName} has been restored.`, variant: 'success' }); } catch (e: any) { if (e?.message === 'STEP_UP_PENDING') return; toast({ title: 'Restore Failed', description: e.message || 'Could not restore teacher.', variant: 'error' }); } }}
                          className="px-2 py-1 text-green-600 hover:bg-green-50 rounded-lg cursor-pointer transition-colors text-[10px] font-bold" title="Restore Teacher">
                          <RefreshCw className="w-3.5 h-3.5 inline mr-0.5" /> Restore
                        </button>
                      ) : (
                        <>
                          <button onClick={() => fetchDetail(t)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary" aria-label="View teacher profile"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary" aria-label="Edit teacher"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteTarget(t.id)} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive" aria-label="Delete teacher"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Rows per page</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 text-xs border border-border rounded-md bg-card focus:ring-2 focus:ring-primary outline-none">
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>· Showing {totalFiltered === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalFiltered)} of {totalFiltered}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
              className="p-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-semibold text-muted-foreground">Page {safePage} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
              className="p-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !formLoading && setShowAddModal(false)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-sm font-bold text-foreground">{editTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
              <button onClick={() => !formLoading && setShowAddModal(false)} className="p-1 rounded-md hover:bg-muted" aria-label="Close modal"><X className="w-4 h-4" /></button>
            </div>
            {formError && (
              <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700">{formError}</p>
              </div>
            )}
            <div className="p-6 space-y-4">
              {editTeacher && (
                <div className="flex items-center gap-4 pb-4 border-b border-border">
                  <div className="relative">
                    {editTeacher.profilePhoto ? (
                      <img src={editTeacher.profilePhoto} alt={editTeacher.fullName} className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-sidebar-active flex items-center justify-center text-white font-bold text-2xl">
                        {editTeacher.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoLoading}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors shadow-md"
                      title="Upload photo"
                    >
                      {photoLoading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && editTeacher) handlePhotoUpload(editTeacher.id, file, 'modal');
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Profile Photo</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Click the camera icon to upload a photo</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Full Name *</label>
                  <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Mobile *</label>
                  <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="10-digit mobile" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Designation *</label>
                  <input value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="e.g. Senior Instructor" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Teacher Type</label>
                  <select value={form.teacherType} onChange={e => setForm(f => ({ ...f, teacherType: e.target.value as Teacher['teacherType'] }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card">
                    <option value="trainer">Trainer</option><option value="volunteer">Volunteer</option><option value="guest_faculty">Guest Faculty</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Teacher['status'] }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card">
                    <option value="active">Active</option><option value="inactive">Inactive</option><option value="on_leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Join Date *</label>
                  <input type="date" value={form.joinedDate} onChange={e => setForm(f => ({ ...f, joinedDate: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Experience (years)</label>
                  <input type="number" min="0" value={form.experienceYears} onChange={e => setForm(f => ({ ...f, experienceYears: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Qualification</label>
                  <input value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Specializations</label>
                  <input value={form.specializations} onChange={e => setForm(f => ({ ...f, specializations: e.target.value }))} placeholder="Comma-separated" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">District</label>
                  <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Village</label>
                  <input value={form.village} onChange={e => setForm(f => ({ ...f, village: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Taluka</label>
                  <input value={form.taluka} onChange={e => setForm(f => ({ ...f, taluka: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">State</label>
                  <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Pincode</label>
                  <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="6-digit" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Bio</label>
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" />
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} disabled={formLoading} className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent disabled:opacity-50">Cancel</button>
              <button onClick={handleSave} disabled={formLoading} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50">
                {formLoading ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</>) : editTeacher ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {profileTeacher && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setProfileTeacher(null); setDetailTeacher(null); }} />
          <div className="relative w-full max-w-md bg-card shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Teacher Profile</h3>
              <button onClick={() => { setProfileTeacher(null); setDetailTeacher(null); }} className="p-1 rounded-md hover:bg-muted" aria-label="Close profile"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profileTeacher.profilePhoto ? (
                    <img src={profileTeacher.profilePhoto} alt={profileTeacher.fullName} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-sidebar-active flex items-center justify-center text-white font-bold text-xl">
                      {profileTeacher.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <button
                    onClick={() => drawerPhotoInputRef.current?.click()}
                    disabled={photoLoading}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors shadow-md"
                    title="Upload photo"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                  <input
                    ref={drawerPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && profileTeacher) handlePhotoUpload(profileTeacher.id, file, 'drawer');
                      e.target.value = '';
                    }}
                  />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">{profileTeacher.fullName}</h4>
                  <p className="text-xs text-muted-foreground">{profileTeacher.designation}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${getStatusStyle(profileTeacher.status)}`}>
                    {profileTeacher.status.replace('_', ' ')} · {TYPE_LABELS[profileTeacher.teacherType] ?? profileTeacher.teacherType}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Details</h5>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Specialization', profileTeacher.specializations?.join(', ') || 'Not provided'],
                    ['Experience', profileTeacher.experienceYears != null ? `${profileTeacher.experienceYears} years` : 'Not provided'],
                    ['Qualification', profileTeacher.qualification || 'Not provided'],
                    ['District', profileTeacher.district || 'Not provided'],
                    ['Village', profileTeacher.village || 'Not provided'],
                    ['Mobile', profileTeacher.mobile],
                    ['Email', profileTeacher.email],
                    ['Joined', profileTeacher.joinedDate],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{k}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
              {detailTeacher && detailTeacher.courses.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned Courses</h5>
                  {detailTeacher.courses.map(c => (
                    <div key={c.id} className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-sm font-semibold text-foreground">{c.course?.title ?? 'Unknown Course'}</p>
                      <p className="text-[10px] text-muted-foreground">{c.batch ?? 'No batch'} · {c.status}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setProfileTeacher(null); setDetailTeacher(null); openEdit(profileTeacher); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold border border-border rounded-lg hover:bg-accent">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                {profileTeacher.status !== 'deleted' && (
                  <button onClick={() => { setProfileTeacher(null); setDetailTeacher(null); setDeleteTarget(profileTeacher.id); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-destructive border border-destructive/20 rounded-lg hover:bg-destructive-bg">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            const t = teachers.find(x => x.id === deleteTarget);
            await deleteTeacher(deleteTarget);
            toast({ title: 'Teacher Deleted', description: `${t?.fullName ?? 'Teacher'} has been deleted.`, variant: 'success' });
          } catch (e: any) {
            if (e?.message === 'STEP_UP_PENDING') return;
            toast({ title: 'Delete Failed', description: e.message || 'Could not delete teacher.', variant: 'error' });
          } finally {
            setDeleteTarget(null);
          }
        }}
        title="Delete Teacher"
        description="This will soft-delete the teacher record. They can be restored later."
        confirmLabel="Delete"
      />

      {tempPassword && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-green-50 px-5 py-4 border-b border-green-200 flex justify-between items-center">
              <h3 className="font-bold text-green-800 text-sm tracking-tight">Registration Successful</h3>
              <button onClick={() => { setTempPassword(null); setTempPasswordName(''); }} className="text-green-600 hover:text-green-800 cursor-pointer p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800 mb-1">Temporary Password for {tempPasswordName}</p>
                  <p className="text-amber-700">Share this password with the teacher. It will not be shown again.</p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Password</p>
                <p className="text-lg font-mono font-bold text-slate-900 tracking-wider select-all">{tempPassword}</p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(tempPassword); toast({ title: 'Copied', description: 'Password copied to clipboard.', variant: 'success' }); }}
                className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800">Copy to Clipboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
