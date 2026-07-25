'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Download,
  Upload,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  X,
  FileText,
  Check,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  Calendar,
  MoreHorizontal,
  MapPin,
  Clock,
} from 'lucide-react';
import MetricCards from '@/components/MetricCards';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

import MemberProfileDrawer, { Member, Course, Enrollment, ActivityItem } from '@/components/NextJSMemberDrawer';
import { useAdmin } from '@/lib/admin-context';

// ============================================================================
// 1. MAIN COMPONENT DEFINITION
// ============================================================================

export default function NextJSBeneficiaryDirectory() {
  // Pull live data and CRUD from admin context
  const { members, courses: adminCourses, enrollments: adminEnrollments, addMember, updateMember, deleteMember, addEnrollment, logActivity } = useAdmin();

  // Map admin courses to the drawer's Course type
  const courses: Course[] = adminCourses.map(c => ({ id: c.id, title: c.title }));

  // Map admin enrollments to drawer's Enrollment type (subset)
  const enrollments: Enrollment[] = adminEnrollments.map(e => ({
    id: e.id,
    member_id: e.member_id,
    course_id: e.course_id,
    status: e.status as 'Completed' | 'Enrolled' | 'Dropped',
    enrolled_date: e.enrolled_date,
  }));

  // Active click metric stats filter
  const [metricFilter, setMetricFilter] = useState<'all' | 'women' | 'men' | 'under25' | 'recent'>('all');

  // Interactive Panel visibility toggles
  const [showFilters, setShowFilters] = useState(false);
  const [showColToggle, setShowColToggle] = useState(false);
  
  // Modal toggle triggers
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Search input query
  const [searchQuery, setSearchQuery] = useState('');

  // 10+ Custom Filters States
  const [filterGender, setFilterGender] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAge, setFilterAge] = useState('all');
  const [filterQualification, setFilterQualification] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterVolunteer, setFilterVolunteer] = useState('all');
  const [filterVillage, setFilterVillage] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');

  // Column visibility checklist toggler state
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    age: true,
    gender: true,
    category: true,
    qualification: true,
    village: true,
  });

  // Table selection index list
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Sorting metrics
  const [sortField, setSortField] = useState<keyof Member>('full_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination bounds
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Bulk actions parameters
  const [bulkActionCourse, setBulkActionCourse] = useState('');
  const [bulkActionVolunteer, setBulkActionVolunteer] = useState('');

  // Profile Drawer Active Focus Member
  const [profileMember, setProfileMember] = useState<Member | null>(null);

  // Confirm dialogs
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  // Export Wizard Stages & Data States
  const [exportStep, setExportStep] = useState(1);
  const [exportFormat, setExportFormat] = useState('CSV');
  const [exportFields, setExportFields] = useState<string[]>(['full_name', 'age', 'gender', 'village', 'district']);

  // CSV Importer State Progress Indicators
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Add/Edit Register form schema fields
  const [newMemberForm, setNewMemberForm] = useState<{
    full_name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    category: 'General' | 'OBC' | 'SC' | 'ST';
    qualification: string;
    district: string;
    state: string;
    village: string;
    assigned_volunteer: string;
  }>({
    full_name: '',
    age: 22,
    gender: 'Female',
    category: 'General',
    qualification: 'Graduate',
    district: 'Satara',
    state: 'Maharashtra',
    village: 'Satara Rural',
    assigned_volunteer: 'Amit Sharma',
  });

  // ============================================================================
  // 2. STATISTICAL CALCULATIONS
  // ============================================================================

  const totalCount = members.length;
  const womenCount = members.filter(m => m.gender === 'Female').length;
  const menCount = members.filter(m => m.gender === 'Male').length;
  const youthCount = members.filter(m => m.age < 25).length;
  const recentCount = members.filter(m => m.created_at >= '2026-05-01').length;

  // ============================================================================
  // 3. DATA FILTERING & PIPELINE EXECUTION
  // ============================================================================

  const filteredMembers = useMemo(() => {
    let result = [...members];

    // Clickable Stat Metrics filter
    if (metricFilter === 'women') result = result.filter(m => m.gender === 'Female');
    else if (metricFilter === 'men') result = result.filter(m => m.gender === 'Male');
    else if (metricFilter === 'under25') result = result.filter(m => m.age < 25);
    else if (metricFilter === 'recent') result = result.filter(m => m.created_at >= '2026-05-01');

    // Text query search constraints
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.full_name.toLowerCase().includes(q) || 
        m.village.toLowerCase().includes(q) || 
        m.assigned_volunteer.toLowerCase().includes(q)
      );
    }

    // 10+ Multi-Dropdown Custom Filter Parameters
    if (filterGender !== 'all') result = result.filter(m => m.gender === filterGender);
    if (filterCategory !== 'all') result = result.filter(m => m.category === filterCategory);
    
    if (filterAge !== 'all') {
      if (filterAge === 'under20') result = result.filter(m => m.age < 20);
      else if (filterAge === '20-30') result = result.filter(m => m.age >= 20 && m.age <= 30);
      else if (filterAge === 'over30') result = result.filter(m => m.age > 30);
    }

    if (filterQualification !== 'all') result = result.filter(m => m.qualification === filterQualification);
    if (filterDistrict !== 'all') result = result.filter(m => m.district === filterDistrict);
    if (filterVolunteer !== 'all') result = result.filter(m => m.assigned_volunteer === filterVolunteer);
    
    if (filterVillage !== 'all') {
      const v = filterVillage.toLowerCase();
      result = result.filter(m => m.village.toLowerCase().includes(v));
    }

    if (filterCourse !== 'all') {
      const matchedMemberIds = enrollments
        .filter(e => e.course_id === filterCourse)
        .map(e => e.member_id);
      result = result.filter(m => matchedMemberIds.includes(m.id));
    }

    // Interactive Field Sorting Handler
    result.sort((a, b) => {
      let aVal: string | number = a[sortField] ?? '';
      let bVal: string | number = b[sortField] ?? '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [members, metricFilter, searchQuery, filterGender, filterCategory, filterAge, filterQualification, filterDistrict, filterVolunteer, filterVillage, filterCourse, enrollments, sortField, sortOrder]);

  // Pagination chunk slice
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMembers.slice(startIndex, startIndex + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;

  // ============================================================================
  // 4. INTERACTIVE EVENT ACTIONS & HANDLERS
  // ============================================================================

  const handleSort = (field: keyof Member) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedMembers.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  // Add / Edit Beneficiary Submission
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (profileMember) {
      updateMember(profileMember.id, {
        full_name: newMemberForm.full_name,
        age: newMemberForm.age,
        gender: newMemberForm.gender as 'Male' | 'Female' | 'Other',
        category: newMemberForm.category as 'General' | 'OBC' | 'SC' | 'ST',
        qualification: newMemberForm.qualification,
        district: newMemberForm.district,
        state: newMemberForm.state,
        village: newMemberForm.village,
        assigned_volunteer: newMemberForm.assigned_volunteer,
      });
      logActivity('Beneficiary Updated', `Updated details for ${newMemberForm.full_name}.`, 'Users');
    } else {
      addMember({
        full_name: newMemberForm.full_name,
        age: newMemberForm.age,
        gender: newMemberForm.gender as 'Male' | 'Female' | 'Other',
        category: newMemberForm.category as 'General' | 'OBC' | 'SC' | 'ST',
        qualification: newMemberForm.qualification,
        district: newMemberForm.district,
        state: newMemberForm.state,
        village: newMemberForm.village,
        assigned_volunteer: newMemberForm.assigned_volunteer,
        email: '',
        phone: '',
        status: 'Active',
      });
    }

    setShowAddModal(false);
    setProfileMember(null);
    setNewMemberForm({
      full_name: '',
      age: 22,
      gender: 'Female',
      category: 'General',
      qualification: 'Graduate',
      district: 'Satara',
      state: 'Maharashtra',
      village: 'Satara Rural',
      assigned_volunteer: 'Amit Sharma',
    });
  };

  // Simulated Drag-and-Drop CSV Importer
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImporting(true);
      setImportProgress(15);
      
      const interval = setInterval(() => {
        setImportProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              addMember({
                full_name: 'Meena Kulkarni (Imported Row)',
                age: 24,
                gender: 'Female',
                category: 'OBC',
                qualification: 'Graduate',
                district: 'Satara',
                state: 'Maharashtra',
                village: 'Jawali Rural',
                assigned_volunteer: 'Sneha Patil',
                email: '',
                phone: '',
                status: 'Active',
              });
              setImporting(false);
              setShowImportModal(false);
              setImportProgress(0);
            }, 300);
            return 100;
          }
          return p + 25;
        });
      }, 200);
    }
  };

  // Multi-step Export Wizard Download Simulation
  const handleExportFinish = () => {
    setExportStep(4);
    setTimeout(() => {
      const exportScopeData = selectedIds.length > 0 
        ? members.filter(m => selectedIds.includes(m.id)) 
        : filteredMembers;

      const structuredPayload = exportScopeData.map(m => {
        const item: any = {};
        exportFields.forEach(f => {
          item[f] = (m as any)[f];
        });
        return item;
      });

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(structuredPayload, null, 2));
      const anchor = document.createElement('a');
      anchor.setAttribute("href", dataStr);
      anchor.setAttribute("download", `Beneficiary_List_Export.${exportFormat.toLowerCase()}`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setShowExportModal(false);
      setExportStep(1);
    }, 1000);
  };

  // Open Detail Side Drawer
  const handleOpenProfileDrawer = (member: Member) => {
    setProfileMember(member);
    setShowProfileDrawer(true);
  };

  // Bulk operation actions
  const handleBulkDelete = () => {
    setShowBulkDeleteConfirm(true);
  };

  const handleBulkAssignCourse = () => {
    if (!bulkActionCourse) return;
    selectedIds.forEach(memId => {
      addEnrollment({
        member_id: memId,
        course_id: bulkActionCourse,
        status: 'Enrolled',
        doc_verified: false,
        admin_notes: '',
      });
    });
    setSelectedIds([]);
    setBulkActionCourse('');
    logActivity('Bulk Enrollment', `Assigned ${selectedIds.length} members to a training program.`, 'BookOpen');
  };

  const handleBulkAssignVolunteer = () => {
    if (!bulkActionVolunteer) return;
    selectedIds.forEach(id => updateMember(id, { assigned_volunteer: bulkActionVolunteer }));
    setSelectedIds([]);
    setBulkActionVolunteer('');
    logActivity('Bulk Coordinator Update', `Changed coordinator assignments for ${selectedIds.length} members.`, 'Users');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 text-xs text-slate-800 font-sans">
      
      {/* HEADER STATEMENT */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Beneficiary Portfolios Directory
          </h1>
          <p className="text-slate-500 mt-1">Manage, filter, export, and audits NGO beneficiary dossiers profiles.</p>
        </div>
      </div>

      {/* 5 CLICKABLE STATISTICAL METRIC CARDS */}
      <MetricCards
        activeFilter={metricFilter}
        onFilterChange={(f) => setMetricFilter(f as typeof metricFilter)}
        columns={5}
        cards={[
          { id: 'all', label: 'Total Registered', value: totalCount, icon: Users },
          { id: 'women', label: 'Women Enrolled', value: womenCount, icon: UserCheck },
          { id: 'men', label: 'Men Enrolled', value: menCount, icon: Users },
          { id: 'under25', label: 'Youth Users (<25)', value: youthCount, icon: UserX },
          { id: 'recent', label: 'Recently Joined', value: recentCount, icon: Clock },
        ]}
      />

      {/* FILTER PANEL AND TOOLBAR AREA */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by full legal name, coordination staff, village..."
              className="block w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                showFilters ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Dropdown Filters</span>
            </button>

            <button
              onClick={() => setShowColToggle(!showColToggle)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white hover:border-slate-300 text-slate-600 cursor-pointer"
            >
              Toggle Columns
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white hover:border-slate-300 text-slate-600 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white hover:border-slate-300 text-slate-600 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Dossiers</span>
            </button>

            <button
              onClick={() => {
                setProfileMember(null);
                setNewMemberForm({
                  full_name: '',
                  age: 22,
                  gender: 'Female',
                  category: 'General',
                  qualification: 'Graduate',
                  district: 'Satara',
                  state: 'Maharashtra',
                  village: 'Satara Rural',
                  assigned_volunteer: 'Amit Sharma',
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary-hover transition-colors cursor-pointer shadow-sm shadow-primary/10"
            >
              <Plus className="w-4 h-4" />
              <span>Add Beneficiary</span>
            </button>
          </div>
        </div>

        {/* Dynamic Column Visibility Toggles Panel */}
        {showColToggle && (
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
            <span className="font-bold text-slate-400 uppercase tracking-wide self-center text-[9px]">Select Visible Columns:</span>
            {Object.keys(visibleColumns).map((col) => (
              <label key={col} className="flex items-center gap-1.5 cursor-pointer font-bold select-none text-slate-800">
                <input
                  type="checkbox"
                  checked={(visibleColumns as any)[col]}
                  onChange={(e) => setVisibleColumns(prev => ({ ...prev, [col]: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="capitalize">{col}</span>
              </label>
            ))}
          </div>
        )}

        {/* 10+ Nested Multi-Category Dropdown filters */}
        {showFilters && (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in text-slate-800">
            {/* Column 1 */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Identity Group</span>
              <select
                value={filterGender}
                onChange={(e) => { setFilterGender(e.target.value); setCurrentPage(1); }}
                className="block w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="all">Gender (All)</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                className="block w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="all">Category (All)</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>

            {/* Column 2 */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Demographics</span>
              <select
                value={filterAge}
                onChange={(e) => { setFilterAge(e.target.value); setCurrentPage(1); }}
                className="block w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="all">Age Limits (All)</option>
                <option value="under20">Under 20 Years</option>
                <option value="20-30">20 - 30 Years</option>
                <option value="over30">Over 30 Years</option>
              </select>
              <select
                value={filterQualification}
                onChange={(e) => { setFilterQualification(e.target.value); setCurrentPage(1); }}
                className="block w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="all">Education levels (All)</option>
                <option value="10th Pass">10th Standard</option>
                <option value="12th Pass">12th Standard</option>
                <option value="Graduate">Graduation</option>
                <option value="Post Graduate">Post Graduation</option>
              </select>
            </div>

            {/* Column 3 */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Geography Location</span>
              <select
                value={filterDistrict}
                onChange={(e) => { setFilterDistrict(e.target.value); setCurrentPage(1); }}
                className="block w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="all">District Region (All)</option>
                <option value="Satara">Satara</option>
                <option value="Sangli">Sangli</option>
                <option value="Nandurbar">Nandurbar</option>
              </select>
              <input
                type="text"
                placeholder="Type village name..."
                value={filterVillage === 'all' ? '' : filterVillage}
                onChange={(e) => { setFilterVillage(e.target.value || 'all'); setCurrentPage(1); }}
                className="block w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 placeholder-slate-300 text-slate-800"
              />
            </div>

            {/* Column 4 */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Administrative Link</span>
              <select
                value={filterCourse}
                onChange={(e) => { setFilterCourse(e.target.value); setCurrentPage(1); }}
                className="block w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="all">Enrolled Program (All)</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <select
                value={filterVolunteer}
                onChange={(e) => { setFilterVolunteer(e.target.value); setCurrentPage(1); }}
                className="block w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="all">Staff Coordinator (All)</option>
                <option value="Amit Sharma">Amit Sharma</option>
                <option value="Sneha Patil">Sneha Patil</option>
                <option value="Vikram Singh">Vikram Singh</option>
              </select>
            </div>

            <div className="col-span-2 md:col-span-4 flex justify-end">
              <button
                onClick={() => {
                  setFilterGender('all');
                  setFilterCategory('all');
                  setFilterAge('all');
                  setFilterQualification('all');
                  setFilterDistrict('all');
                  setFilterVolunteer('all');
                  setFilterVillage('all');
                  setFilterCourse('all');
                  setCurrentPage(1);
                }}
                className="text-xs text-blue-600 font-extrabold hover:underline cursor-pointer"
              >
                Clear Selected Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BULK OPERATION CONTROL BAR */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white px-5 py-3.5 rounded-xl flex flex-wrap items-center justify-between gap-4 animate-fade-in shadow-xl">
          <div className="flex items-center gap-2">
            <span className="bg-primary px-2.5 py-0.5 rounded-full font-bold text-[10px]">{selectedIds.length}</span>
            <span className="font-bold text-xs">Records Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <select
                value={bulkActionCourse}
                onChange={(e) => setBulkActionCourse(e.target.value)}
                className="p-1.5 bg-slate-800 border border-slate-700 text-[10px] font-bold rounded-lg focus:outline-none text-white cursor-pointer"
              >
                <option value="">Enroll in Program...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <button onClick={handleBulkAssignCourse} className="px-2.5 py-1.5 bg-primary hover:bg-primary-hover font-bold text-[10px] rounded-lg cursor-pointer">
                Assign
              </button>
            </div>

            <div className="flex items-center gap-1">
              <select
                value={bulkActionVolunteer}
                onChange={(e) => setBulkActionVolunteer(e.target.value)}
                className="p-1.5 bg-slate-800 border border-slate-700 text-[10px] font-bold rounded-lg focus:outline-none text-white cursor-pointer"
              >
                <option value="">Change Coord...</option>
                <option value="Amit Sharma">Amit Sharma</option>
                <option value="Sneha Patil">Sneha Patil</option>
                <option value="Vikram Singh">Vikram Singh</option>
              </select>
              <button onClick={handleBulkAssignVolunteer} className="px-2.5 py-1.5 bg-primary hover:bg-primary-hover font-bold text-[10px] rounded-lg cursor-pointer">
                Change
              </button>
            </div>

            <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 font-bold text-[10px] rounded-lg flex items-center gap-1 cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Records</span>
            </button>
          </div>
        </div>
      )}

      {/* PRIMARY DATA TABLE CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedMembers.length && paginatedMembers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                {visibleColumns.name && (
                  <th onClick={() => handleSort('full_name')} className="p-4 cursor-pointer hover:text-slate-900 transition-colors">
                    Name / Identity ID {sortField === 'full_name' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                )}
                {visibleColumns.age && (
                  <th onClick={() => handleSort('age')} className="p-4 cursor-pointer hover:text-slate-900 transition-colors w-20">
                    Age {sortField === 'age' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                )}
                {visibleColumns.gender && (
                  <th onClick={() => handleSort('gender')} className="p-4 cursor-pointer hover:text-slate-900 transition-colors w-24">
                    Gender {sortField === 'gender' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                )}
                {visibleColumns.category && (
                  <th onClick={() => handleSort('category')} className="p-4 cursor-pointer hover:text-slate-900 transition-colors w-28">
                    Social Category {sortField === 'category' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                )}
                {visibleColumns.qualification && (
                  <th className="p-4">Educational Level</th>
                )}
                {visibleColumns.village && (
                  <th className="p-4">Geographic Village</th>
                )}
                <th className="p-4 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 font-bold bg-slate-50/50">
                    No beneficiary portfolios found matching specified search.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(m.id)}
                        onChange={() => handleSelectRow(m.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    {visibleColumns.name && (
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-slate-100 text-slate-700 font-extrabold rounded-full flex items-center justify-center text-sm">
                            {m.full_name[0].toUpperCase()}
                          </div>
                          <div>
                            <p>{m.full_name}</p>
                            <span className="block text-[10px] text-slate-400 font-mono font-normal">Dossier ID: {m.id}</span>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.age && <td className="p-4 text-slate-700 font-semibold">{m.age} Years</td>}
                    {visibleColumns.gender && <td className="p-4 text-slate-700 font-semibold">{m.gender}</td>}
                    {visibleColumns.category && (
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/50 text-[9px] font-bold">
                          {m.category}
                        </span>
                      </td>
                    )}
                    {visibleColumns.qualification && <td className="p-4 text-slate-500 font-bold">{m.qualification}</td>}
                    {visibleColumns.village && (
                      <td className="p-4 text-slate-700 font-semibold">
                        <p className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-blue-500" /> {m.village}</p>
                        <span className="block text-[10px] text-slate-400">{m.district}, {m.state}</span>
                      </td>
                    )}
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      <button 
                        onClick={() => handleOpenProfileDrawer(m)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors" 
                        title="Open Portfolio Dossier"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => {
                          setProfileMember(m);
                          setNewMemberForm({
                            full_name: m.full_name,
                            age: m.age,
                            gender: m.gender,
                            category: m.category,
                            qualification: m.qualification,
                            district: m.district,
                            state: m.state,
                            village: m.village,
                            assigned_volunteer: m.assigned_volunteer
                          });
                          setShowAddModal(true);
                        }}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors" 
                        title="Edit Details"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => setDeleteTarget(m)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors" 
                        title="Delete Portfolio"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION TOOLBAR CONTROLLER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span>Rows per view:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="p-1 bg-white border border-slate-200 rounded-lg text-xs font-bold cursor-pointer focus:outline-none"
            >
              <option value="5">5 rows</option>
              <option value="10">10 rows</option>
              <option value="20">20 rows</option>
            </select>
            <span className="text-slate-400 ml-2">
              Displaying {filteredMembers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, filteredMembers.length)} of {filteredMembers.length} records
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg hover:border-slate-300 disabled:opacity-50 cursor-pointer"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg transition-all cursor-pointer ${
                  currentPage === i + 1 ? 'bg-primary text-white font-extrabold' : 'border border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg hover:border-slate-300 disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* PROFILE SIDE-OVER PORTFOLIO DETAIL DRAWER */}
      <MemberProfileDrawer
        isOpen={showProfileDrawer}
        onClose={() => {
          setShowProfileDrawer(false);
          setProfileMember(null);
        }}
        member={profileMember}
        courses={courses}
        enrollments={enrollments}
      />

      {/* REGISTER / EDIT BENEFICIARY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight uppercase">
                {profileMember ? 'Edit Beneficiary Portfolio' : 'Register New Beneficiary'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setProfileMember(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1" aria-label="Close modal">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddMemberSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-500 font-extrabold uppercase tracking-wide mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.full_name}
                    onChange={(e) => setNewMemberForm(p => ({ ...p, full_name: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                    placeholder="E.g. Meena Deshmukh"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-extrabold uppercase tracking-wide mb-1">Age (Years)</label>
                  <input
                    type="number"
                    required
                    value={newMemberForm.age}
                    onChange={(e) => setNewMemberForm(p => ({ ...p, age: Number(e.target.value) }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                    placeholder="23"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-extrabold uppercase tracking-wide mb-1">Gender</label>
                  <select
                    value={newMemberForm.gender}
                    onChange={(e) => setNewMemberForm(p => ({ ...p, gender: e.target.value as 'Male' | 'Female' | 'Other' }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-extrabold uppercase tracking-wide mb-1">Social Category</label>
                  <select
                    value={newMemberForm.category}
                    onChange={(e) => setNewMemberForm(p => ({ ...p, category: e.target.value as 'General' | 'OBC' | 'SC' | 'ST' }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-extrabold uppercase tracking-wide mb-1">Highest Education</label>
                  <select
                    value={newMemberForm.qualification}
                    onChange={(e) => setNewMemberForm(p => ({ ...p, qualification: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                  >
                    <option value="10th Pass">10th Standard</option>
                    <option value="12th Pass">12th Standard</option>
                    <option value="Graduate">Graduation</option>
                    <option value="Post Graduate">Post Graduation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-extrabold uppercase tracking-wide mb-1">Village Location</label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.village}
                    onChange={(e) => setNewMemberForm(p => ({ ...p, village: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                    placeholder="E.g. Satara Rural"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-extrabold uppercase tracking-wide mb-1">District Region</label>
                  <select
                    value={newMemberForm.district}
                    onChange={(e) => setNewMemberForm(p => ({ ...p, district: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                  >
                    <option value="Satara">Satara</option>
                    <option value="Sangli">Sangli</option>
                    <option value="Nandurbar">Nandurbar</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-500 font-extrabold uppercase tracking-wide mb-1">Assigned Coordinator Staff</label>
                  <select
                    value={newMemberForm.assigned_volunteer}
                    onChange={(e) => setNewMemberForm(p => ({ ...p, assigned_volunteer: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                  >
                    <option value="Amit Sharma">Amit Sharma</option>
                    <option value="Sneha Patil">Sneha Patil</option>
                    <option value="Vikram Singh">Vikram Singh</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setProfileMember(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {profileMember ? 'Save Changes' : 'Register Beneficiary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT WIZARD MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">CSV Importer Wizard</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1" aria-label="Close import">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 text-center space-y-4">
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-600 rounded-xl p-8 transition-colors cursor-pointer relative bg-slate-50/50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  disabled={importing}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-extrabold text-slate-800 text-xs">Drag & drop CSV files here</p>
                <p className="text-[10px] text-slate-400 mt-1">UTF-8 Compliant formatted dossier documents only</p>
              </div>

              {importing && (
                <div className="space-y-2 text-left">
                  <div className="flex justify-between font-bold text-xs">
                    <span>Extracting Columns...</span>
                    <span className="font-mono text-blue-600">{importProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${importProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="text-left bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-[10px] text-blue-800 flex gap-2 leading-relaxed">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-blue-600" />
                <span>Make sure CSV header column cells exactly match attribute tags: <code className="font-mono bg-blue-100/50 px-1 rounded text-blue-800">full_name</code>, <code className="font-mono bg-blue-100/50 px-1 rounded text-blue-800">village</code>, <code className="font-mono bg-blue-100/50 px-1 rounded text-blue-800">age</code>, <code className="font-mono bg-blue-100/50 px-1 rounded text-blue-800">district</code>.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4-STEP EXPORT CONFIGURATION WIZARD */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase">Dossier Export Wizard</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Step {exportStep} of 4</p>
              </div>
              <button onClick={() => { setShowExportModal(false); setExportStep(1); }} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" aria-label="Close export">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Micro progress line */}
            <div className="w-full bg-slate-100 h-1">
              <div className="bg-primary h-full transition-all duration-300" style={{ width: `${(exportStep / 4) * 100}%` }} />
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              {/* Step 1: Select Records Scope */}
              {exportStep === 1 && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-800">Step 1: Choose Record Filter Scope</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-blue-500/40 hover:bg-slate-50/50 transition-all select-none">
                      <input type="radio" defaultChecked name="exportScope" className="text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      <div>
                        <p className="font-bold text-slate-900">All Filtered Records ({filteredMembers.length})</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Exports active matches on specified screen queries.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-blue-500/40 hover:bg-slate-50/50 transition-all select-none opacity-80">
                      <input type="radio" disabled={selectedIds.length === 0} name="exportScope" className="text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      <div>
                        <p className="font-bold text-slate-900">Selected Records Only ({selectedIds.length})</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Exports currently checked table rows.</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: Choose File Format */}
              {exportStep === 2 && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-800">Step 2: Choose Output Compilation Format</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {['CSV', 'JSON', 'Excel'].map(fmt => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setExportFormat(fmt)}
                        className={`p-4 border rounded-xl font-bold uppercase tracking-wider text-center transition-all cursor-pointer ${
                          exportFormat === fmt ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <FileText className="w-5 h-5 mx-auto mb-1.5" />
                        <span>{fmt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Schema Columns */}
              {exportStep === 3 && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-800">Step 3: Fields to Include in Output Schema</p>
                  <div className="grid grid-cols-2 gap-2 font-bold text-slate-700">
                    {['full_name', 'age', 'gender', 'village', 'district', 'state', 'assigned_volunteer'].map(f => (
                      <label key={f} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-lg cursor-pointer hover:border-slate-200 select-none">
                        <input
                          type="checkbox"
                          checked={exportFields.includes(f)}
                          onChange={() => setExportFields(prev => prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f])}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="capitalize">{f.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Loading progress animation */}
              {exportStep === 4 && (
                <div className="text-center py-6 space-y-4 animate-fade-in">
                  <RefreshCw className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
                  <div>
                    <p className="font-bold text-slate-800">Processing secure compilation...</p>
                    <p className="text-[10px] text-slate-400 mt-1">Assembling dossier datasets to {exportFormat} schemas.</p>
                  </div>
                </div>
              )}

              {exportStep < 4 && (
                <div className="pt-4 border-t border-slate-200 flex justify-between">
                  <button
                    type="button"
                    disabled={exportStep === 1}
                    onClick={() => setExportStep(p => p - 1)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg disabled:opacity-50 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (exportStep === 3) handleExportFinish();
                      else setExportStep(p => p + 1);
                    }}
                    className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
                  >
                    {exportStep === 3 ? 'Download File' : 'Continue'}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={() => {
          selectedIds.forEach(id => deleteMember(id));
          setSelectedIds([]);
        }}
        title="Delete Members"
        description={`Permanently delete all selected ${selectedIds.length} members?`}
        confirmLabel="Delete All"
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMember(deleteTarget.id);
        }}
        title="Delete Member"
        description={`Delete record for ${deleteTarget?.full_name}?`}
        confirmLabel="Delete"
      />
    </div>
  );
}
