'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Member,
  Teacher,
  AdminCourse,
  Enrollment,
  AdminCertificate,
  Coupon,
  AdminNotification,
  AdminActivityLog,
  WebsiteContent,
  AdminSettings,
  AdminUser,
  WebsiteItem,
} from './admin-types';
import {
  MOCK_MEMBERS,
  MOCK_TEACHERS,
  MOCK_COURSES,
  MOCK_ENROLLMENTS,
  MOCK_CERTIFICATES,
  MOCK_NOTIFICATIONS,
  MOCK_ACTIVITY_LOGS,
  MOCK_WEBSITE_CONTENT,
  DEFAULT_ADMIN_SETTINGS,
  MOCK_COUPONS,
} from './mock-admin-data';

const STORAGE_KEY = 'adminState';

interface AdminContextType {
  members: Member[];
  teachers: Teacher[];
  courses: AdminCourse[];
  enrollments: Enrollment[];
  certificates: AdminCertificate[];
  notifications: AdminNotification[];
  coupons: Coupon[];
  websiteContent: WebsiteContent;
  settings: AdminSettings;
  activityLogs: AdminActivityLog[];
  adminUser: AdminUser | null;
  mounted: boolean;

  loginAdmin: (email: string, password: string) => boolean;
  logoutAdmin: () => void;
  resetAdmin: () => void;

  addMember: (member: Omit<Member, 'id' | 'created_at'>) => void;
  updateMember: (id: string, updated: Partial<Member>) => void;
  deleteMember: (id: string) => void;

  addTeacher: (teacher: Omit<Teacher, 'id' | 'rating'>) => void;
  updateTeacher: (id: string, updated: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;

  addCourse: (course: Omit<AdminCourse, 'id' | 'seats_enrolled'>) => void;
  updateCourse: (id: string, updated: Partial<AdminCourse>) => void;
  deleteCourse: (id: string) => void;

  addEnrollment: (enrollment: Omit<Enrollment, 'id' | 'enrolled_date'>) => void;
  updateEnrollment: (id: string, updated: Partial<Enrollment>) => void;
  approveEnrollment: (id: string) => void;
  rejectEnrollment: (id: string, reason: string) => void;
  markEnrollmentCompleted: (id: string) => void;
  markEnrollmentDropped: (id: string) => void;

  addCertificate: (cert: Omit<AdminCertificate, 'id'>) => void;
  generateCertificateForEnrollment: (enrollmentId: string) => void;
  approveCertificate: (id: string) => void;
  rejectCertificate: (id: string) => void;

  addNotification: (notif: Omit<AdminNotification, 'id' | 'created_at'>) => void;

  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (code: string, updated: Partial<Coupon>) => void;
  deleteCoupon: (code: string) => void;

  updateWebsiteContent: (tab: keyof WebsiteContent, items: WebsiteContent[keyof WebsiteContent]) => void;
  updateSettings: (domain: keyof AdminSettings, subSettings: any) => void;
  logActivity: (title: string, description: string, icon: string) => void;
  resetAllData: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

function loadState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    const { mounted: _m, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {
    // storage full or unavailable
  }
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>(() => loadState()?.members ?? MOCK_MEMBERS);
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadState()?.teachers ?? MOCK_TEACHERS);
  const [courses, setCourses] = useState<AdminCourse[]>(() => loadState()?.courses ?? MOCK_COURSES);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => loadState()?.enrollments ?? MOCK_ENROLLMENTS);
  const [certificates, setCertificates] = useState<AdminCertificate[]>(() => loadState()?.certificates ?? MOCK_CERTIFICATES);
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => loadState()?.notifications ?? MOCK_NOTIFICATIONS);
  const [coupons, setCoupons] = useState<Coupon[]>(() => loadState()?.coupons ?? MOCK_COUPONS);
  const [websiteContent, setWebsiteContent] = useState<WebsiteContent>(() => loadState()?.websiteContent ?? MOCK_WEBSITE_CONTENT);
  const [settings, setSettings] = useState<AdminSettings>(() => loadState()?.settings ?? DEFAULT_ADMIN_SETTINGS);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>(() => {
    const raw = loadState()?.activityLogs ?? MOCK_ACTIVITY_LOGS;
    const seen = new Set<string>();
    return raw.filter((log: AdminActivityLog) => {
      if (seen.has(log.id)) return false;
      seen.add(log.id);
      return true;
    });
  });
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => loadState()?.adminUser ?? null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Persist to localStorage on state changes (read-only, no setState calls)
  useEffect(() => {
    saveState({
      members, teachers, courses, enrollments, certificates,
      notifications, coupons, websiteContent, settings, activityLogs, adminUser,
    });
  }, [members, teachers, courses, enrollments, certificates, notifications, coupons, websiteContent, settings, activityLogs, adminUser]);

  const logCounterRef = useRef(0);
  const logActivity = useCallback((title: string, description: string, icon: string) => {
    logCounterRef.current += 1;
    const newLog: AdminActivityLog = {
      id: `act-${Date.now()}-${logCounterRef.current}-${crypto.randomUUID().slice(0, 8)}`,
      title,
      description,
      timestamp: 'Just now',
      icon,
    };
    setActivityLogs(prev => [newLog, ...prev]);
  }, []);

  // Auth — MOCK: any non-empty email/password accepted during Phase 3 (real auth is Phase 4)
  const loginAdmin = useCallback((email: string, password: string): boolean => {
    if (email && password) {
      const name = email.split('@')[0].toUpperCase();
      const user = { username: name, email };
      setAdminUser(user);
      logActivity('Admin Logged In', `Administrative session initiated for ${email}.`, 'Lock');
      return true;
    }
    return false;
  }, [logActivity]);

  const logoutAdmin = useCallback(() => {
    logActivity('Admin Logged Out', 'Administrative session terminated securely.', 'Lock');
    setAdminUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [logActivity]);

  const resetAdmin = useCallback(() => {
    setMembers(MOCK_MEMBERS);
    setTeachers(MOCK_TEACHERS);
    setCourses(MOCK_COURSES);
    setEnrollments(MOCK_ENROLLMENTS);
    setCertificates(MOCK_CERTIFICATES);
    setNotifications(MOCK_NOTIFICATIONS);
    setCoupons(MOCK_COUPONS);
    setWebsiteContent(MOCK_WEBSITE_CONTENT);
    setSettings(DEFAULT_ADMIN_SETTINGS);
    setActivityLogs(MOCK_ACTIVITY_LOGS);
    setAdminUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Members
  const addMember = useCallback((m: Omit<Member, 'id' | 'created_at'>) => {
    const newMember: Member = { ...m, id: `mem-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, created_at: new Date().toISOString().split('T')[0] };
    setMembers(prev => [newMember, ...prev]);
    logActivity('Beneficiary Registered', `Admin registered ${newMember.full_name} manually.`, 'Users');
  }, [logActivity]);

  const updateMember = useCallback((id: string, updated: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } as Member : m));
    logActivity('Beneficiary Updated', `Updated details for member ${id}.`, 'Users');
  }, [logActivity]);

  const deleteMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    logActivity('Beneficiary Deleted', `Removed beneficiary ${id} from record systems.`, 'Users');
  }, [logActivity]);

  // Teachers
  const addTeacher = useCallback((t: Omit<Teacher, 'id' | 'rating'>) => {
    const newTeacher: Teacher = { ...t, id: `t-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, rating: 5.0 };
    setTeachers(prev => [newTeacher, ...prev]);
    logActivity('Teacher Added', `Assigned instructor role to ${newTeacher.full_name}.`, 'Users');
  }, [logActivity]);

  const updateTeacher = useCallback((id: string, updated: Partial<Teacher>) => {
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...updated } as Teacher : t));
    logActivity('Teacher Updated', `Updated details for instructor ${id}.`, 'Users');
  }, [logActivity]);

  const deleteTeacher = useCallback((id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
    logActivity('Teacher Deleted', `Removed instructor ${id} from the workspace.`, 'Users');
  }, [logActivity]);

  // Courses
  const addCourse = useCallback((c: Omit<AdminCourse, 'id' | 'seats_enrolled'>) => {
    const newCourse: AdminCourse = { ...c, id: `c-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, seats_enrolled: 0 };
    setCourses(prev => [newCourse, ...prev]);
    logActivity('Course Created', `New course program "${newCourse.title}" drafted.`, 'BookOpen');
  }, [logActivity]);

  const updateCourse = useCallback((id: string, updated: Partial<AdminCourse>) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updated } as AdminCourse : c));
    logActivity('Course Updated', `Updated details/settings for "${id}".`, 'BookOpen');
  }, [logActivity]);

  const deleteCourse = useCallback((id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    logActivity('Course Removed', `Archived and deleted course program "${id}".`, 'BookOpen');
  }, [logActivity]);

  // Enrollments
  const addEnrollment = useCallback((e: Omit<Enrollment, 'id' | 'enrolled_date'>) => {
    const newEnrollment: Enrollment = { ...e, id: `enr-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, enrolled_date: new Date().toISOString().split('T')[0] };
    setEnrollments(prev => [newEnrollment, ...prev]);
    setCourses(prev => prev.map(c => c.id === e.course_id ? { ...c, seats_enrolled: c.seats_enrolled + 1 } : c));
    logActivity('Enrollment Created', `Enrolled member in course program.`, 'Calendar');
  }, [logActivity]);

  const updateEnrollment = useCallback((id: string, updated: Partial<Enrollment>) => {
    setEnrollments(prev => prev.map(e => e.id === id ? { ...e, ...updated } as Enrollment : e));
  }, []);

  const approveEnrollment = useCallback((id: string) => {
    setEnrollments(prev => prev.map(e => {
      if (e.id === id) {
        logActivity('Enrollment Approved', `Approved admission application ${id}.`, 'CheckCircle');
        return { ...e, status: 'Enrolled' as const, doc_verified: true, admin_notes: `Application approved on ${new Date().toLocaleDateString()}` };
      }
      return e;
    }));
  }, [logActivity]);

  const rejectEnrollment = useCallback((id: string, reason: string) => {
    setEnrollments(prev => prev.map(e => {
      if (e.id === id) {
        logActivity('Application Rejected', `Rejected enrollment application ${id}. Reason: ${reason}`, 'Bell');
        return { ...e, status: 'Dropped' as const, admin_notes: `Application rejected. Reason: ${reason}` };
      }
      return e;
    }));
  }, [logActivity]);

  const markEnrollmentCompleted = useCallback((id: string) => {
    setEnrollments(prev => prev.map(e => {
      if (e.id === id) {
        logActivity('Course Completed', `Marked program completed for enrollment ${id}.`, 'Award');
        return { ...e, status: 'Completed' as const };
      }
      return e;
    }));
  }, [logActivity]);

  const markEnrollmentDropped = useCallback((id: string) => {
    setEnrollments(prev => prev.map(e => {
      if (e.id === id) {
        logActivity('Course Dropped', `Member dropped/withdrew from enrollment ${id}.`, 'Bell');
        return { ...e, status: 'Dropped' as const };
      }
      return e;
    }));
  }, [logActivity]);

  // Certificates
  const addCertificate = useCallback((cert: Omit<AdminCertificate, 'id'>) => {
    const newCert: AdminCertificate = { ...cert, id: `cert-${Date.now()}-${crypto.randomUUID().slice(0, 8)}` };
    setCertificates(prev => [newCert, ...prev]);
  }, []);

  const generateCertificateForEnrollment = useCallback((enrId: string) => {
    setEnrollments(prev => {
      const enr = prev.find(e => e.id === enrId);
      if (!enr) return prev;
      const certNo = `MH-SKILL-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const newCert: AdminCertificate = {
        id: `cert-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        course_id: enr.course_id,
        member_id: enr.member_id,
        certificate_no: certNo,
        issue_date: new Date().toISOString().split('T')[0],
        status: 'generated',
      };
      setCertificates(certs => [newCert, ...certs]);
      logActivity('Certificate Auto-Generated', `Created certification serial ${certNo} for enrollment ${enrId}.`, 'Award');
      return prev;
    });
  }, [logActivity]);

  const approveCertificate = useCallback((id: string) => {
    setCertificates(prev => prev.map(c => c.id === id ? { ...c, status: 'accepted' as const } : c));
    logActivity('Certificate Approved', `Approved and released certificate ${id}.`, 'Award');
  }, [logActivity]);

  const rejectCertificate = useCallback((id: string) => {
    setCertificates(prev => prev.filter(c => c.id !== id));
    logActivity('Certificate Voided', `Voided certificate ID: ${id}.`, 'Bell');
  }, [logActivity]);

  // Notifications
  const addNotification = useCallback((n: Omit<AdminNotification, 'id' | 'created_at'>) => {
    const newNotif: AdminNotification = {
      ...n,
      id: `notif-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setNotifications(prev => [newNotif, ...prev]);
    logActivity('Campaign Broadcasted', `Broadcasted notification "${newNotif.title}" to target group: ${newNotif.target}.`, 'Bell');
  }, [logActivity]);

  // Coupons
  const addCoupon = useCallback((coupon: Coupon) => {
    setCoupons(prev => [coupon, ...prev]);
    logActivity('Promo Coupon Added', `Added new promo rate structure: ${coupon.code}.`, 'Award');
  }, [logActivity]);

  const updateCoupon = useCallback((code: string, updated: Partial<Coupon>) => {
    setCoupons(prev => prev.map(c => c.code === code ? { ...c, ...updated } as Coupon : c));
    logActivity('Promo Coupon Updated', `Updated coupon values/limits for code ${code}.`, 'Award');
  }, [logActivity]);

  const deleteCoupon = useCallback((code: string) => {
    setCoupons(prev => prev.filter(c => c.code !== code));
    logActivity('Promo Coupon Deleted', `Archived promo code ${code} from active operations.`, 'Bell');
  }, [logActivity]);

  // Website Content
  const updateWebsiteContent = useCallback((tab: keyof WebsiteContent, updatedItems: WebsiteContent[keyof WebsiteContent]) => {
    setWebsiteContent(prev => ({ ...prev, [tab]: updatedItems }));
    logActivity('Website Content Modified', `Edited and saved updates on public CMS portal: ${tab}.`, 'BookOpen');
  }, [logActivity]);

  // Settings
  const updateSettings = useCallback((domain: keyof AdminSettings, subSettings: any) => {
    setSettings(prev => ({
      ...prev,
      [domain]: { ...prev[domain], ...subSettings },
    }));
    logActivity('System Parameters Updated', `Updated parameters in settings under "${domain}".`, 'Users');
  }, [logActivity]);

  // Reset
  const resetAllData = useCallback(() => {
    setMembers(MOCK_MEMBERS);
    setTeachers(MOCK_TEACHERS);
    setCourses(MOCK_COURSES);
    setEnrollments(MOCK_ENROLLMENTS);
    setCertificates(MOCK_CERTIFICATES);
    setNotifications(MOCK_NOTIFICATIONS);
    setCoupons(MOCK_COUPONS);
    setWebsiteContent(MOCK_WEBSITE_CONTENT);
    setSettings(DEFAULT_ADMIN_SETTINGS);
    setActivityLogs(MOCK_ACTIVITY_LOGS);
    setAdminUser(null);
    localStorage.removeItem(STORAGE_KEY);
    logActivity('Data Reset', 'All admin data has been reset to defaults.', 'Users');
  }, [logActivity]);

  return (
    <AdminContext.Provider value={{
      members, teachers, courses, enrollments, certificates,
      notifications, coupons, websiteContent, settings, activityLogs, adminUser, mounted,
      loginAdmin, logoutAdmin, resetAdmin,
      addMember, updateMember, deleteMember,
      addTeacher, updateTeacher, deleteTeacher,
      addCourse, updateCourse, deleteCourse,
      addEnrollment, updateEnrollment, approveEnrollment, rejectEnrollment, markEnrollmentCompleted, markEnrollmentDropped,
      addCertificate, generateCertificateForEnrollment, approveCertificate, rejectCertificate,
      addNotification,
      addCoupon, updateCoupon, deleteCoupon,
      updateWebsiteContent, updateSettings, logActivity, resetAllData,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (ctx === undefined) throw new Error('useAdmin must be used within an AdminProvider');
  return ctx;
}
