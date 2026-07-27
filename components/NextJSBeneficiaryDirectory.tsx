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
import { exportCSV, exportPDF, exportDOCX } from '@/lib/dossier-export';

import MemberProfileDrawer, { Member, Course, Enrollment } from '@/components/NextJSMemberDrawer';
import { useAdmin } from '@/lib/admin-context';
import { useToast } from '@/components/ui/toast';

// ============================================================================
// 1. MAIN COMPONENT DEFINITION
// ============================================================================

export default function NextJSBeneficiaryDirectory() {
  // Pull live data and CRUD from admin context
  const { members, courses: adminCourses, enrollments: adminEnrollments, addMember, refreshMembers, updateMember, deleteMember, restoreMember, showDeleted, setShowDeleted, addEnrollment, logActivity } = useAdmin();
  const { toast } = useToast();

  // Map admin courses to the drawer's Course type
  const courses: Course[] = adminCourses.map(c => ({ id: c.id, title: c.title }));

  // Map admin enrollments to drawer's Enrollment type (subset)
  const enrollments: Enrollment[] = adminEnrollments.map(e => ({
    id: e.id,
    memberId: e.member_id,
    courseId: e.course_id,
    status: e.status as 'Completed' | 'Enrolled' | 'Dropped',
    enrolledDate: e.enrolled_date,
  }));

  // Active click metric stats filter
  const [metricFilter, setMetricFilter] = useState<'all' | 'women' | 'under25' | 'recent'>('all');

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
  const [sortField, setSortField] = useState<keyof Member>('fullName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination bounds
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Bulk actions parameters
  const [bulkActionCourse, setBulkActionCourse] = useState('');
  const [bulkActionVolunteer, setBulkActionVolunteer] = useState('');

  // Profile Drawer Active Focus Member
  const [profileMember, setProfileMember] = useState<Member | null>(null);

  // Temp password dialog state
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempPasswordEmail, setTempPasswordEmail] = useState('');

  // Confirm dialogs
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  // Export Wizard Stages & Data States
  const [exportStep, setExportStep] = useState(1);
  const [exportFormat, setExportFormat] = useState<'CSV' | 'PDF' | 'DOCX'>('CSV');
  const [exportFields, setExportFields] = useState<string[]>(['fullName', 'email', 'phone', 'age', 'gender', 'category', 'village', 'district', 'state', 'qualification', 'assignedVolunteer']);

  // CSV Importer State
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ succeeded: number; failed: number; errors: string[]; credentials: { email: string; password: string }[] } | null>(null);

  // Add/Edit form error state
  const [formError, setFormError] = useState<string | null>(null);

  // Add/Edit Register form schema fields
  const [newMemberForm, setNewMemberForm] = useState<{
    fullName: string;
    email: string;
    phone: string;
    dob: string;
    gender: 'male' | 'female' | 'other' | '';
    category: 'general' | 'obc' | 'sc' | 'st' | '';
    qualification: string;
    district: string;
    state: string;
    village: string;
    assignedVolunteer: string;
  }>({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'female',
    category: 'general',
    qualification: 'Graduate',
    district: 'Satara',
    state: 'Maharashtra',
    village: 'Satara Rural',
    assignedVolunteer: 'Amit Sharma',
  });

  // ============================================================================
  // 2. STATISTICAL CALCULATIONS
  // ============================================================================

  const totalCount = members.length;
  const womenCount = members.filter(m => m.gender === 'female').length;

  const youthCount = members.filter(m => m.age !== null && m.age < 25).length;
  const recentCount = members.filter(m => m.createdAt >= '2026-05-01').length;

  // ============================================================================
  // 3. DATA FILTERING & PIPELINE EXECUTION
  // ============================================================================

  const filteredMembers = useMemo(() => {
    let result = [...members];

    // Clickable Stat Metrics filter
    if (metricFilter === 'women') result = result.filter(m => m.gender === 'female');
    else if (metricFilter === 'under25') result = result.filter(m => m.age !== null && m.age < 25);
    else if (metricFilter === 'recent') result = result.filter(m => m.createdAt >= '2026-05-01');

    // Text query search constraints
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.fullName.toLowerCase().includes(q) || 
        (m.village ?? '').toLowerCase().includes(q) || 
        (m.assignedVolunteer ?? '').toLowerCase().includes(q)
      );
    }

    // 10+ Multi-Dropdown Custom Filter Parameters
    if (filterGender !== 'all') result = result.filter(m => m.gender === filterGender);
    if (filterCategory !== 'all') result = result.filter(m => m.category === filterCategory);
    
    if (filterAge !== 'all') {
      if (filterAge === 'under20') result = result.filter(m => m.age !== null && m.age < 20);
      else if (filterAge === '20-30') result = result.filter(m => m.age !== null && m.age >= 20 && m.age <= 30);
      else if (filterAge === 'over30') result = result.filter(m => m.age !== null && m.age > 30);
    }

    if (filterQualification !== 'all') result = result.filter(m => m.qualification === filterQualification);
    if (filterDistrict !== 'all') result = result.filter(m => m.district === filterDistrict);
    if (filterVolunteer !== 'all') result = result.filter(m => m.assignedVolunteer === filterVolunteer);
    
    if (filterVillage !== 'all') {
      const v = filterVillage.toLowerCase();
      result = result.filter(m => (m.village ?? '').toLowerCase().includes(v));
    }

    if (filterCourse !== 'all') {
      const matchedMemberIds = enrollments
        .filter(e => e.courseId === filterCourse)
        .map(e => e.memberId);
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
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const apiPayload: Record<string, unknown> = {
      fullName: newMemberForm.fullName,
      gender: newMemberForm.gender || undefined,
      beneficiaryDetail: newMemberForm.category ? { category: newMemberForm.category } : undefined,
      qualification: newMemberForm.qualification || undefined,
      district: newMemberForm.district || undefined,
      state: newMemberForm.state || undefined,
      assignedVolunteer: newMemberForm.assignedVolunteer || undefined,
      beneficiaryAddresses: newMemberForm.village ? [{ village: newMemberForm.village, district: newMemberForm.district, state: newMemberForm.state }] : undefined,
    };

    if (newMemberForm.dob) apiPayload.dob = newMemberForm.dob;
    if (newMemberForm.phone) apiPayload.phone = newMemberForm.phone;

    try {
      if (profileMember) {
        await updateMember(profileMember.id, apiPayload);
        toast({ title: 'Beneficiary Updated', description: `${newMemberForm.fullName}'s profile has been saved.`, variant: 'success' });
      } else {
        apiPayload.email = newMemberForm.email;
        const result = await addMember(apiPayload);
        if (result?.temporaryPassword) {
          setTempPassword(result.temporaryPassword);
          setTempPasswordEmail(newMemberForm.email);
        }
        toast({ title: 'Beneficiary Registered', description: `${newMemberForm.fullName} has been registered successfully.`, variant: 'success' });
      }

      setShowAddModal(false);
      setProfileMember(null);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong. Please check your inputs and try again.');
    }
  };

  const resetForm = () => {
    setNewMemberForm({
      fullName: '',
      email: '',
      phone: '',
      dob: '',
      gender: 'female',
      category: 'general',
      qualification: 'Graduate',
      district: 'Satara',
      state: 'Maharashtra',
      village: 'Satara Rural',
      assignedVolunteer: 'Amit Sharma',
    });
  };

  // CSV Import — batch implementation
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResults(null);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length < 2) {
        setImportResults({ succeeded: 0, failed: 0, errors: ['CSV file is empty or has no data rows (only a header row is required).'], credentials: [] });
        setImporting(false);
        return;
      }

      // Simple CSV parser that handles quoted fields
      const parseCSVLine = (line: string): string[] => {
        const cells: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (inQuotes) {
            if (ch === '"') {
              if (i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = false;
              }
            } else {
              current += ch;
            }
          } else {
            if (ch === '"') {
              inQuotes = true;
            } else if (ch === ',') {
              cells.push(current.trim());
              current = '';
            } else {
              current += ch;
            }
          }
        }
        cells.push(current.trim());
        return cells;
      };

      const headers = parseCSVLine(lines[0]);
      const dataRows = lines.slice(1);

      // Check for required columns
      if (!headers.includes('fullName')) {
        setImportResults({ succeeded: 0, failed: 0, errors: ['CSV must contain a "fullName" column header.'], credentials: [] });
        setImporting(false);
        return;
      }
      if (!headers.includes('email')) {
        setImportResults({ succeeded: 0, failed: 0, errors: ['CSV must contain an "email" column header. Each member needs a unique email address.'], credentials: [] });
        setImporting(false);
        return;
      }

      // Build payload rows from CSV
      const payloadRows: Record<string, unknown>[] = [];
      for (let i = 0; i < dataRows.length; i++) {
        const cells = parseCSVLine(dataRows[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = cells[idx] ?? ''; });

        // Skip completely empty rows
        if (!row.fullName && !row.email) continue;

        const payload: Record<string, unknown> = {
          fullName: row.fullName,
          email: row.email,
        };

        if (row.phone) payload.phone = row.phone;
        if (row.gender) payload.gender = row.gender;
        if (row.district) payload.district = row.district;
        if (row.state) payload.state = row.state;
        if (row.qualification) payload.qualification = row.qualification;
        if (row.assignedVolunteer) payload.assignedVolunteer = row.assignedVolunteer;

        if (row.dob) {
          payload.dob = row.dob;
        } else if (row.age) {
          const ageNum = parseInt(row.age, 10);
          if (!isNaN(ageNum) && ageNum > 0 && ageNum < 150) {
            const dob = new Date();
            dob.setFullYear(dob.getFullYear() - ageNum);
            dob.setMonth(0, 1);
            payload.dob = dob.toISOString().split('T')[0];
          }
        }

        if (row.village) {
          const addr: Record<string, string> = { village: row.village };
          if (row.district) addr.district = row.district;
          if (row.state) addr.state = row.state;
          payload.beneficiaryAddresses = [addr];
        }

        payloadRows.push(payload);
      }

      if (payloadRows.length === 0) {
        setImportResults({ succeeded: 0, failed: 0, errors: ['No valid data rows found in CSV.'], credentials: [] });
        setImporting(false);
        return;
      }

      // Single batch POST
      const res = await fetch('/api/admin/members/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: payloadRows }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Batch import request failed' }));
        throw new Error(errBody.error || 'Batch import request failed');
      }

      const batch = await res.json() as {
        results: { row: number; success: boolean; id?: string; email?: string; error?: string; temporaryPassword?: string }[];
        successCount: number;
        failureCount: number;
      };

      const errors = batch.results
        .filter(r => !r.success)
        .map(r => `Row ${r.row} (${r.email ?? '?'}): ${r.error ?? 'Unknown error'}`);

      const credentials = batch.results
        .filter(r => r.success && r.temporaryPassword)
        .map(r => ({ email: r.email!, password: r.temporaryPassword! }));

      setImportResults({
        succeeded: batch.successCount,
        failed: batch.failureCount,
        errors,
        credentials,
      });

      if (batch.successCount > 0) {
        logActivity('CSV Import', `Imported ${batch.successCount} member(s) from CSV.`, 'Users');
        await refreshMembers();
      }
    } catch (err: any) {
      setImportResults({ succeeded: 0, failed: 0, errors: [`Failed to read CSV file: ${err.message ?? 'Unknown error'}`], credentials: [] });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  // Multi-step Export Wizard Download Simulation
  const handleExportFinish = async () => {
    setExportStep(4);
    try {
      const scopeIds = selectedIds.length > 0 ? selectedIds : undefined;

      const res = await fetch('/api/admin/members/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: scopeIds }),
      });

      if (!res.ok) throw new Error('Failed to fetch export data');
      const { data: exportData } = await res.json();

      await new Promise(r => setTimeout(r, 400));

      if (exportFormat === 'CSV') {
        exportCSV(exportData, exportFields);
      } else if (exportFormat === 'PDF') {
        await exportPDF(exportData, exportFields);
      } else if (exportFormat === 'DOCX') {
        await exportDOCX(exportData, exportFields);
      }
    } finally {
      setShowExportModal(false);
      setExportStep(1);
    }
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
    selectedIds.forEach(id => updateMember(id, { assignedVolunteer: bulkActionVolunteer }));
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
        columns={4}
        cards={[
          { id: 'all', label: 'Total Registered', value: totalCount, icon: Users },
          { id: 'women', label: 'Women Enrolled', value: womenCount, icon: UserCheck },
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
                resetForm();
                setFormError(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary-hover transition-colors cursor-pointer shadow-sm shadow-primary/10"
            >
              <Plus className="w-4 h-4" />
              <span>Add Beneficiary</span>
            </button>

            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                showDeleted ? 'bg-red-50 border-red-400 text-red-600' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <UserX className="w-4 h-4" />
              <span>{showDeleted ? 'Hide Deleted' : 'Show Deleted'}</span>
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
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                className="block w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="all">Category (All)</option>
                <option value="general">General</option>
                <option value="obc">OBC</option>
                <option value="sc">SC</option>
                <option value="st">ST</option>
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
                  <th onClick={() => handleSort('fullName')} className="p-4 cursor-pointer hover:text-slate-900 transition-colors">
                    Name / Identity ID {sortField === 'fullName' && (sortOrder === 'asc' ? '▲' : '▼')}
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
                            {m.fullName[0].toUpperCase()}
                          </div>
                          <div>
                            <p>{m.fullName}</p>
                            <span className="block text-[10px] text-slate-400 font-mono font-normal">Dossier ID: {m.id}</span>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.age && <td className="p-4 text-slate-700 font-semibold">{m.age ?? '—'} {m.age != null && 'Years'}</td>}
                    {visibleColumns.gender && <td className="p-4 text-slate-700 font-semibold">{m.gender ?? '—'}</td>}
                    {visibleColumns.category && (
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/50 text-[9px] font-bold">
                          {(m.category ?? '—').toUpperCase()}
                        </span>
                      </td>
                    )}
                    {visibleColumns.qualification && <td className="p-4 text-slate-500 font-bold">{m.qualification ?? '—'}</td>}
                    {visibleColumns.village && (
                      <td className="p-4 text-slate-700 font-semibold">
                        <p className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-blue-500" /> {m.village ?? '—'}</p>
                        <span className="block text-[10px] text-slate-400">{m.district ?? '—'}, {m.state ?? '—'}</span>
                      </td>
                    )}
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {m.status === 'deleted' ? (
                        <button 
                          onClick={async () => { try { await restoreMember(m.id); } catch { /* handled in context */ } }}
                          className="px-2 py-1 text-green-600 hover:bg-green-50 rounded-lg cursor-pointer transition-colors text-[10px] font-bold"
                          title="Restore Member"
                        >
                          <RefreshCw className="w-3.5 h-3.5 inline mr-0.5" /> Restore
                        </button>
                      ) : (
                        <>
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
                                fullName: m.fullName,
                                email: m.email,
                                phone: m.phone ?? '',
                                dob: '',
                                gender: (m.gender ?? 'female') as 'male' | 'female' | 'other',
                                category: (m.category ?? 'general') as 'general' | 'obc' | 'sc' | 'st',
                                qualification: m.qualification ?? '',
                                district: m.district ?? '',
                                state: m.state ?? '',
                                village: m.village ?? '',
                                assignedVolunteer: m.assignedVolunteer ?? '',
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
                        </>
                      )}
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
      />

      {/* REGISTER / EDIT BENEFICIARY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight uppercase">
                {profileMember ? 'Edit Beneficiary Portfolio' : 'Register New Beneficiary'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setProfileMember(null); setFormError(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1" aria-label="Close modal">
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
                    value={newMemberForm.fullName}
                    onChange={(e) => setNewMemberForm(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                    placeholder="E.g. Meena Deshmukh"
                  />
                </div>

                {!profileMember && (
                  <div className="col-span-2">
                    <label className="block text-slate-500 font-extrabold uppercase tracking-wide mb-1">Email (Required)</label>
                    <input
                      type="email"
                      required
                      value={newMemberForm.email}
                      onChange={(e) => setNewMemberForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                      placeholder="meena@example.com"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-500 font-extrabold uppercase tracking-wide mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newMemberForm.phone}
                    onChange={(e) => setNewMemberForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                    placeholder="+91-XXXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-extrabold uppercase tracking-wide mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newMemberForm.dob}
                    onChange={(e) => setNewMemberForm(p => ({ ...p, dob: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-extrabold uppercase tracking-wide mb-1">Gender</label>
                  <select
                    value={newMemberForm.gender}
                    onChange={(e) => setNewMemberForm(p => ({ ...p, gender: e.target.value as 'male' | 'female' | 'other' }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-extrabold uppercase tracking-wide mb-1">Social Category</label>
                  <select
                    value={newMemberForm.category}
                    onChange={(e) => setNewMemberForm(p => ({ ...p, category: e.target.value as 'general' | 'obc' | 'sc' | 'st' }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                  >
                    <option value="general">General</option>
                    <option value="obc">OBC</option>
                    <option value="sc">SC</option>
                    <option value="st">ST</option>
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
                    value={newMemberForm.assignedVolunteer}
                    onChange={(e) => setNewMemberForm(p => ({ ...p, assignedVolunteer: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                  >
                    <option value="Amit Sharma">Amit Sharma</option>
                    <option value="Sneha Patil">Sneha Patil</option>
                    <option value="Vikram Singh">Vikram Singh</option>
                  </select>
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setProfileMember(null); setFormError(null); }}
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
              <button onClick={() => { setShowImportModal(false); setImportResults(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1" aria-label="Close import">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 text-center space-y-4">

              {/* Results summary (shown after import finishes) */}
              {importResults && !importing && (
                <div className="space-y-3 animate-fade-in">
                  <div className={`p-4 rounded-xl border ${importResults.failed === 0 && importResults.succeeded > 0 ? 'bg-emerald-50 border-emerald-200' : importResults.succeeded === 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                    <p className="font-bold text-xs">
                      {importResults.succeeded > 0 && <span className="text-emerald-700">{importResults.succeeded} member(s) imported successfully. </span>}
                      {importResults.failed > 0 && <span className="text-red-700">{importResults.failed} row(s) failed.</span>}
                      {importResults.succeeded === 0 && importResults.failed === 0 && <span className="text-slate-700">No records were processed.</span>}
                    </p>
                  </div>

                  {importResults.errors.length > 0 && (
                    <div className="text-left bg-red-50/50 border border-red-100 p-3 rounded-lg max-h-32 overflow-y-auto">
                      {importResults.errors.map((err, i) => (
                        <p key={i} className="text-[10px] text-red-700 leading-relaxed">{err}</p>
                      ))}
                    </div>
                  )}

                  {importResults.credentials.length > 0 && (
                    <div className="text-left space-y-2">
                      <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wide">Login Credentials</p>
                      <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg max-h-28 overflow-y-auto space-y-1">
                        {importResults.credentials.map((c, i) => (
                          <p key={i} className="text-[10px] font-mono text-emerald-800">{c.email} — {c.password}</p>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          const csv = 'email,temporaryPassword\n' + importResults.credentials.map(c => `${c.email},${c.password}`).join('\n');
                          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'imported_credentials.csv';
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                        }}
                        className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                      >
                        Download Credentials CSV
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => { setShowImportModal(false); setImportResults(null); }}
                    className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Upload zone (shown when idle, hidden during/after import) */}
              {!importing && !importResults && (
                <>
                  <div className="border-2 border-dashed border-slate-200 hover:border-blue-600 rounded-xl p-8 transition-colors cursor-pointer relative bg-slate-50/50">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-extrabold text-slate-800 text-xs">Click or drag a CSV file here</p>
                    <p className="text-[10px] text-slate-400 mt-1">UTF-8 encoded .csv files only</p>
                  </div>

                  <div className="text-left bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-[10px] text-blue-800 flex gap-2 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-blue-600" />
                    <span>Required columns: <code className="font-mono bg-blue-100/50 px-1 rounded text-blue-800">fullName</code>, <code className="font-mono bg-blue-100/50 px-1 rounded text-blue-800">email</code>. Optional: <code className="font-mono bg-blue-100/50 px-1 rounded text-blue-800">phone</code>, <code className="font-mono bg-blue-100/50 px-1 rounded text-blue-800">gender</code>, <code className="font-mono bg-blue-100/50 px-1 rounded text-blue-800">age</code>, <code className="font-mono bg-blue-100/50 px-1 rounded text-blue-800">village</code>, <code className="font-mono bg-blue-100/50 px-1 rounded text-blue-800">district</code>, <code className="font-mono bg-blue-100/50 px-1 rounded text-blue-800">state</code>, <code className="font-mono bg-blue-100/50 px-1 rounded text-blue-800">qualification</code>.</span>
                  </div>
                </>
              )}

              {/* Spinner (shown during batch import) */}
              {importing && (
                <div className="space-y-3 py-4">
                  <RefreshCw className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
                  <p className="font-bold text-xs text-slate-800">Importing members...</p>
                  <p className="text-[10px] text-slate-400">Sending batch to server. This may take a moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4-STEP EXPORT CONFIGURATION WIZARD */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full overflow-hidden shadow-2xl animate-scale-up">
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

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              
              {/* Step 1: Select Records Scope */}
              {exportStep === 1 && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-800">Step 1: Choose Record Filter Scope</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2.5 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-blue-500/40 hover:bg-slate-50/50 transition-all select-none">
                      <input type="radio" defaultChecked name="exportScope" className="text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      <div>
                        <p className="font-bold text-slate-900">All Filtered Records ({filteredMembers.length})</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Exports active matches on specified screen queries.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-blue-500/40 hover:bg-slate-50/50 transition-all select-none opacity-80">
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
                  <div className="grid grid-cols-3 gap-3">
                    {['CSV', 'PDF', 'DOCX'].map(fmt => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setExportFormat(fmt as 'CSV' | 'PDF' | 'DOCX')}
                        className={`p-5 border-2 rounded-xl font-bold uppercase tracking-wider text-center transition-all cursor-pointer ${
                          exportFormat === fmt ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <FileText className="w-6 h-6 mx-auto mb-2" />
                        <span className="text-sm">{fmt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Schema Columns */}
              {exportStep === 3 && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-800">Step 3: Fields to Include in Output Schema</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { group: 'Personal', fields: ['fullName', 'email', 'phone', 'age', 'gender', 'dob', 'status', 'qualification'] },
                      { group: 'Identity', fields: ['aadhaarNumber', 'panNumber'] },
                      { group: 'Address', fields: ['addressLine1', 'village', 'taluka', 'district', 'state', 'pincode'] },
                      { group: 'Beneficiary', fields: ['category', 'occupation', 'educationQualification', 'maritalStatus', 'bloodGroup'] },
                      { group: 'Administrative', fields: ['assignedVolunteer', 'createdAt'] },
                    ].map(({ group, fields }) => (
                      <div key={group} className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">{group}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {fields.map(f => (
                            <label key={f} className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-100 rounded-lg cursor-pointer hover:border-slate-200 select-none">
                              <input
                                type="checkbox"
                                checked={exportFields.includes(f)}
                                onChange={() => setExportFields(prev => prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f])}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-[10px] font-semibold text-slate-700 truncate">{f.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Loading progress animation */}
              {exportStep === 4 && (
                <div className="text-center py-8 space-y-4 animate-fade-in">
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
        onConfirm={async () => {
          let failed = 0;
          for (const id of selectedIds) {
            try { await deleteMember(id); } catch { failed++; }
          }
          setSelectedIds([]);
          if (failed > 0) {
            toast({ title: 'Partial Failure', description: `${failed} of ${selectedIds.length} members could not be deleted.`, variant: 'error' });
          } else {
            toast({ title: 'Members Deleted', description: `${selectedIds.length} members have been deleted.`, variant: 'success' });
          }
        }}
        title="Delete Members"
        description={`Permanently delete all selected ${selectedIds.length} members?`}
        confirmLabel="Delete All"
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const name = deleteTarget.fullName;
          await deleteMember(deleteTarget.id);
          toast({ title: 'Member Deleted', description: `${name} has been deleted.`, variant: 'success' });
        }}
        title="Delete Member"
        description={`Soft-delete record for ${deleteTarget?.fullName}?`}
        confirmLabel="Delete"
      />

      {/* TEMP PASSWORD DIALOG */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="bg-green-50 px-5 py-4 border-b border-green-200 flex justify-between items-center">
              <h3 className="font-bold text-green-800 text-sm tracking-tight">Registration Successful</h3>
              <button onClick={() => { setTempPassword(null); setTempPasswordEmail(''); }} className="text-green-600 hover:text-green-800 cursor-pointer p-1" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800">Copy this temporary password now. It will NOT be shown again.</p>
                  <p className="text-amber-700 mt-1">Account: <strong>{tempPasswordEmail}</strong></p>
                </div>
              </div>
              <div className="relative">
                <input
                  readOnly
                  value={tempPassword}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-900 pr-16"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(tempPassword); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <button
                onClick={() => { setTempPassword(null); setTempPasswordEmail(''); }}
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                I have saved the password — Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
