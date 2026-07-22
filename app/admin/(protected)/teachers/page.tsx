'use client';

import { useState, useMemo } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { Teacher } from '@/lib/admin-types';
import {
  GraduationCap, Search, Plus, Filter, Eye, Pencil, Trash2, X,
  ChevronLeft, ChevronRight, ArrowUpDown, Star,
  Users, Clock, Award, BookOpen,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import MetricCards from '@/components/MetricCards';

type SortKey = 'full_name' | 'designation' | 'specialization' | 'type' | 'status' | 'district' | 'experience' | 'phone' | 'join_date' | 'rating';
type SortDir = 'asc' | 'desc';

const TYPES = ['All', 'Full Time', 'Part Time'];
const STATUSES = ['All', 'Active', 'Inactive'];
const PAGE_SIZES = [10, 20, 30, 50];

export default function AdminTeachersPage() {
  const { teachers, courses, addTeacher, updateTeacher, deleteTeacher } = useAdmin();
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [metricActive, setMetricActive] = useState('total');
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('full_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [profileTeacher, setProfileTeacher] = useState<Teacher | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const emptyForm = { full_name: '', email: '', phone: '', designation: '', type: 'Full Time' as Teacher['type'], status: 'Active' as Teacher['status'], join_date: '', district: '', specialization: '', experience: '', qualification: '' };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    let list = [...teachers];
    if (activeFilter !== 'All') list = list.filter(t => t.status === activeFilter);
    if (typeFilter !== 'All') list = list.filter(t => t.type === typeFilter);
    if (statusFilter !== 'All') list = list.filter(t => t.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => t.full_name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.specialization.toLowerCase().includes(q) || t.district.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [teachers, activeFilter, typeFilter, statusFilter, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const counts = useMemo(() => ({
    total: teachers.length,
    active: teachers.filter(t => t.status === 'Active').length,
    partTime: teachers.filter(t => t.type === 'Part Time').length,
    fullTime: teachers.filter(t => t.type === 'Full Time').length,
    avgRating: teachers.length > 0 ? (teachers.reduce((s, t) => s + t.rating, 0) / teachers.length).toFixed(1) : '0',
  }), [teachers]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const openAdd = () => { setForm(emptyForm); setEditTeacher(null); setShowAddModal(true); };
  const openEdit = (t: Teacher) => { setForm({ full_name: t.full_name, email: t.email, phone: t.phone, designation: t.designation, type: t.type, status: t.status, join_date: t.join_date, district: t.district, specialization: t.specialization, experience: t.experience, qualification: t.qualification }); setEditTeacher(t); setShowAddModal(true); };

  const handleSave = () => {
    if (!form.full_name || !form.email) return;
    if (editTeacher) updateTeacher(editTeacher.id, form);
    else addTeacher(form);
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => { deleteTeacher(id); setDeleteConfirm(null); };

  const getTeacherCourses = (teacherId: string) => courses.filter(c => c.teacher_id === teacherId);

  const thSort = (label: string, sort: SortKey) => (
    <th className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort(sort)}>
      <span className="flex items-center gap-1">{label} <ArrowUpDown className="w-3 h-3" /></span>
    </th>
  );

  return (
    <div className="space-y-4 font-sans">
      {/* Stat Cards */}
      <MetricCards
        activeFilter={metricActive}
        onFilterChange={(id) => {
          setMetricActive(id);
          if (id === 'total') { setActiveFilter('All'); setTypeFilter('All'); setStatusFilter('All'); }
          else if (id === 'active') { setActiveFilter('Active'); }
          else if (id === 'parttime') { setTypeFilter('Part Time'); setStatusFilter('All'); setActiveFilter('All'); }
          else if (id === 'fulltime') { setTypeFilter('Full Time'); setStatusFilter('All'); setActiveFilter('All'); }
        }}
        columns={5}
        cards={[
          { id: 'total', label: 'Total', value: counts.total, icon: Users },
          { id: 'active', label: 'Active', value: counts.active, icon: Award },
          { id: 'parttime', label: 'Part Time', value: counts.partTime, icon: Clock },
          { id: 'fulltime', label: 'Full Time', value: counts.fullTime, icon: BookOpen },
          { id: 'rating', label: 'Avg Rating', value: counts.avgRating, icon: Star },
        ]}
      />

      {/* Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search teachers by name, specialization, district..."
            className="flex-1 text-sm outline-none placeholder:text-muted-foreground min-w-0" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent">
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Teacher
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-4">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Type</label>
            <div className="flex gap-1">
              {TYPES.map(t => (
                <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md ${typeFilter === t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Status</label>
            <div className="flex gap-1">
              {STATUSES.map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md ${statusFilter === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted'}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="bg-primary-light border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xs font-bold text-primary">{selected.size} selected</span>
          <button onClick={() => { selected.forEach(id => updateTeacher(id, { status: 'Active' })); setSelected(new Set()); }}
            className="px-3 py-1.5 text-xs font-semibold bg-success text-white rounded-lg">Activate</button>
          <button onClick={() => { selected.forEach(id => updateTeacher(id, { status: 'Inactive' })); setSelected(new Set()); }}
            className="px-3 py-1.5 text-xs font-semibold bg-primary-light text-primary rounded-lg">Deactivate</button>
          <button onClick={() => { selected.forEach(id => deleteTeacher(id)); }}
            className="px-3 py-1.5 text-xs font-semibold bg-destructive text-white rounded-lg">Delete</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" checked={selected.size === paged.length && paged.length > 0}
                    onChange={() => { if (selected.size === paged.length) setSelected(new Set()); else setSelected(new Set(paged.map(t => t.id))); }}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                </th>
                {thSort('Name', 'full_name')}
                {thSort('Designation', 'designation')}
                {thSort('Specialization', 'specialization')}
                {thSort('Experience', 'experience')}
                {thSort('Mobile', 'phone')}
                {thSort('Joined', 'join_date')}
                <th className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rating</th>
                <th className="px-3 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 && <tr><td colSpan={9} className="py-12">
                <EmptyState icon={GraduationCap} title="No instructors" description="Add an instructor to begin teaching courses." />
              </td></tr>}
              {paged.map(t => (
                <tr key={t.id} className={`hover:bg-primary-light/30 transition-colors ${selected.has(t.id) ? 'bg-primary-light/50' : ''}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => setProfileTeacher(t)} className="text-sm font-semibold text-foreground hover:text-primary hover:underline text-left">{t.full_name}</button>
                    <p className="text-[10px] text-muted-foreground">{t.email}</p>
                  </td>
                  <td className="px-3 py-3 text-sm text-foreground">{t.designation}</td>
                  <td className="px-3 py-3 text-sm text-foreground">{t.specialization}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{t.experience}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground font-mono">{t.phone}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{t.join_date}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Star className="w-3 h-3 fill-primary" /> {t.rating}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setProfileTeacher(t)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary" aria-label="View teacher profile"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary" aria-label="Edit teacher"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteConfirm(t.id)} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive" aria-label="Delete teacher"><Trash2 className="w-3.5 h-3.5" /></button>
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
            <span className="text-xs text-muted-foreground">Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="text-xs border border-border rounded-md px-2 py-1 bg-card">
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
              return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 text-xs font-semibold rounded-md ${p === page ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}>{p}</button>;
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30" aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">{editTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-md hover:bg-muted" aria-label="Close modal"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Full Name *</label>
                  <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Email *</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Designation</label>
                  <input value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Teacher['type'] }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card">
                    <option>Full Time</option><option>Part Time</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Teacher['status'] }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card">
                    <option>Active</option><option>Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Join Date</label>
                  <input type="date" value={form.join_date} onChange={e => setForm(f => ({ ...f, join_date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">District</label>
                  <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Specialization</label>
                  <input value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Experience</label>
                  <input value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Qualification</label>
                  <input value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">{editTeacher ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Drawer */}
      {profileTeacher && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setProfileTeacher(null)} />
          <div className="relative w-full max-w-md bg-card shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Teacher Profile</h3>
              <button onClick={() => setProfileTeacher(null)} className="p-1 rounded-md hover:bg-muted" aria-label="Close profile"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-sidebar-active flex items-center justify-center text-white font-bold text-lg">
                  {profileTeacher.full_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">{profileTeacher.full_name}</h4>
                  <p className="text-xs text-muted-foreground">{profileTeacher.designation}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${profileTeacher.status === 'Active' ? 'bg-success-bg text-success-text' : 'bg-destructive-bg text-destructive-text'}`}>
                    {profileTeacher.status} · {profileTeacher.type}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Details</h5>
                <div className="grid grid-cols-2 gap-3">
                  {[['Specialization', profileTeacher.specialization], ['Experience', profileTeacher.experience], ['Qualification', profileTeacher.qualification], ['District', profileTeacher.district], ['Phone', profileTeacher.phone], ['Email', profileTeacher.email], ['Joined', profileTeacher.join_date], ['Rating', `${profileTeacher.rating} ★`]].map(([k, v]) => (
                    <div key={String(k)} className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{k}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned Courses</h5>
                {getTeacherCourses(profileTeacher.id).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No courses assigned.</p>
                ) : getTeacherCourses(profileTeacher.id).map(c => (
                  <div key={c.id} className="bg-background rounded-lg p-3 border border-border">
                    <p className="text-sm font-semibold text-foreground">{c.title}</p>
                    <p className="text-[10px] text-muted-foreground">{c.category} · {c.mode}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setProfileTeacher(null); openEdit(profileTeacher); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold border border-border rounded-lg hover:bg-accent">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => { setProfileTeacher(null); setDeleteConfirm(profileTeacher.id); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-destructive border border-destructive/20 rounded-lg hover:bg-destructive-bg">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-destructive" /></div>
            <h3 className="text-sm font-bold text-foreground mb-2">Delete Teacher?</h3>
            <p className="text-xs text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-xs font-semibold border border-border rounded-lg hover:bg-accent">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
