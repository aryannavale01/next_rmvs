'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import {
  Member,
  Teacher,
  AdminUser,
} from './admin-types';
import { fetcher, SWR_DEFAULTS } from './swr-fetcher';
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from './admin-stepup';

const STORAGE_KEY = 'adminState';

interface AdminContextType {
  members: Member[];
  teachers: Teacher[];
  adminUser: AdminUser | null;
  mounted: boolean;
  showDeleted: boolean;
  setShowDeleted: (v: boolean) => void;
  showDeletedTeachers: boolean;
  setShowDeletedTeachers: (v: boolean) => void;

  logoutAdmin: () => void;
  resetAdmin: () => void;

  addMember: (data: Record<string, unknown>) => Promise<{ temporaryPassword: string }>;
  refreshMembers: () => Promise<void>;
  updateMember: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  restoreMember: (id: string) => Promise<void>;
  changeMemberStatus: (id: string, status: string, reason?: string) => Promise<void>;
  verifyDocument: (memberId: string, docId: string) => Promise<void>;
  rejectDocument: (memberId: string, docId: string, reason: string) => Promise<void>;

  addTeacher: (data: Record<string, unknown>) => Promise<Teacher>;
  refreshTeachers: () => Promise<void>;
  updateTeacher: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  restoreTeacher: (id: string) => Promise<void>;
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
  const [showDeleted, setShowDeleted] = useState(false);
  const membersUrl = showDeleted ? '/api/admin/members?includeDeleted=true' : '/api/admin/members';
  const { data: membersRes, mutate: mutateMembers } = useSWR<{ data: Member[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(membersUrl, fetcher, SWR_DEFAULTS);
  const members = membersRes?.data ?? [];

  const [showDeletedTeachers, setShowDeletedTeachers] = useState(false);
  // Fetch a large page so client-side search/filter/sort/pagination operate on the full dataset.
  const teachersUrl = showDeletedTeachers ? '/api/admin/teachers?includeDeleted=true&pageSize=100' : '/api/admin/teachers?pageSize=100';
  const { data: teachersRes, mutate: mutateTeachers } = useSWR<{ data: Teacher[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(teachersUrl, fetcher, SWR_DEFAULTS);
  const teachers = teachersRes?.data ?? [];

  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => loadState()?.adminUser ?? null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Fetch real session from Better Auth on mount to populate adminUser
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    if (path === '/login' || path === '/admin/login') return;

    fetch('/api/user/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          setAdminUser({
            username: data.user.name || data.user.email?.split('@')[0] || 'Administrator',
            email: data.user.email || '',
          });
        }
      })
      .catch(() => { /* session cookie absent or invalid — middleware will redirect if needed */ });
  }, []);

  // Persist admin user to localStorage
  useEffect(() => {
    saveState({ adminUser });
  }, [adminUser]);

  const logoutAdmin = useCallback(() => {
    setAdminUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const resetAdmin = useCallback(() => {
    setAdminUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Members — fetch-based
  const addMember = useCallback(async (data: Record<string, unknown>): Promise<{ temporaryPassword: string }> => {
    if (!(await requireStepUpClient('/admin/members', 'create_member'))) {
      throw new Error('STEP_UP_PENDING');
    }
    const res = await fetch('/api/admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create member' }));
      if (isStepUpRequiredResponse(res.status, err.error)) {
        redirectToStepUp('/admin/members', 'create_member');
        throw new Error('STEP_UP_PENDING');
      }
      const message = err.error || 'Failed to create member';
      if (err.details && typeof err.details === 'object') {
        const fieldErrors = Object.entries(err.details)
          .filter(([, msgs]) => Array.isArray(msgs) && msgs.length > 0)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
          .join('; ');
        throw new Error(fieldErrors ? `${message} — ${fieldErrors}` : message);
      }
      throw new Error(message);
    }
    const result = await res.json();
    await mutateMembers();
    return result;
  }, [mutateMembers]);

  const refreshMembers = useCallback(async () => {
    await mutateMembers();
  }, [mutateMembers]);

  const updateMember = useCallback(async (id: string, data: Record<string, unknown>): Promise<void> => {
    if (!(await requireStepUpClient('/admin/members', 'member_update'))) {
      // Redirecting to the step-up verification page; caller should abort quietly.
      throw new Error('STEP_UP_PENDING');
    }
    const res = await fetch(`/api/admin/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update member' }));
      if (isStepUpRequiredResponse(res.status, err.error)) {
        redirectToStepUp('/admin/members', 'member_update');
        throw new Error('STEP_UP_PENDING');
      }
      const message = err.error || 'Failed to update member';
      if (err.details && typeof err.details === 'object') {
        const fieldErrors = Object.entries(err.details)
          .filter(([, msgs]) => Array.isArray(msgs) && msgs.length > 0)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
          .join('; ');
        throw new Error(fieldErrors ? `${message} — ${fieldErrors}` : message);
      }
      throw new Error(message);
    }
    await mutateMembers();
  }, [mutateMembers]);

  const deleteMember = useCallback(async (id: string) => {
    if (!(await requireStepUpClient('/admin/members', 'delete_user'))) {
      // Redirecting to step-up verification; caller should abort quietly.
      throw new Error('STEP_UP_PENDING');
    }
    let res: Response;
    try {
      res = await fetch(`/api/admin/members/${id}/delete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'TimeoutError') {
        throw new Error('The server took too long to respond. Please try again.');
      }
      throw e;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete member' }));
      if (isStepUpRequiredResponse(res.status, err.error)) {
        redirectToStepUp('/admin/members', 'delete_user');
        throw new Error('STEP_UP_PENDING');
      }
      // Already deleted (e.g. a retry after a timed-out first attempt) — treat as done.
      if (res.status === 400 && typeof err.error === 'string' && err.error.toLowerCase().includes('already deleted')) {
        await mutateMembers();
        return;
      }
      throw new Error(err.error || 'Failed to delete member');
    }
    await mutateMembers();
  }, [mutateMembers]);

  const restoreMember = useCallback(async (id: string) => {
    if (!(await requireStepUpClient('/admin/members', 'member_restore'))) {
      throw new Error('STEP_UP_PENDING');
    }
    let res: Response;
    try {
      res = await fetch(`/api/admin/members/${id}/restore`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'TimeoutError') {
        throw new Error('The server took too long to respond. Please try again.');
      }
      throw e;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to restore member' }));
      if (isStepUpRequiredResponse(res.status, err.error)) {
        redirectToStepUp('/admin/members', 'member_restore');
        throw new Error('STEP_UP_PENDING');
      }
      throw new Error(err.error || 'Failed to restore member');
    }
    await mutateMembers();
  }, [mutateMembers]);

  const changeMemberStatus = useCallback(async (id: string, status: string, reason?: string) => {
    if (!(await requireStepUpClient('/admin/members', 'member_status_change'))) {
      throw new Error('Step-up verification required');
    }
    const res = await fetch(`/api/admin/members/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to change status' }));
      if (isStepUpRequiredResponse(res.status, err.error)) {
        redirectToStepUp('/admin/members', 'member_status_change');
        throw new Error(err.error || 'Failed to change status');
      }
      throw new Error(err.error || 'Failed to change status');
    }
    await mutateMembers();
  }, [mutateMembers]);

  const verifyDocument = useCallback(async (memberId: string, docId: string) => {
    const res = await fetch(`/api/admin/members/${memberId}/documents/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to verify document' }));
      throw new Error(err.error || 'Failed to verify document');
    }
  }, []);

  const rejectDocument = useCallback(async (memberId: string, docId: string, reason: string) => {
    const res = await fetch(`/api/admin/members/${memberId}/documents/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', rejectionReason: reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to reject document' }));
      throw new Error(err.error || 'Failed to reject document');
    }
  }, []);

  // Teachers — real DB via API
  const refreshTeachers = useCallback(async () => { await mutateTeachers(); }, [mutateTeachers]);

  const teacherApiError = useCallback((err: any, fallback: string): Error => {
    const msg = typeof err?.error === 'string' && err.error ? err.error : fallback;
    const details = err?.details && typeof err.details === 'object'
      ? Object.entries(err.details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`).join('; ')
      : null;
    return new Error(details ? `${msg} (${details})` : msg);
  }, []);

  const addTeacher = useCallback(async (data: Record<string, unknown>): Promise<Teacher> => {
    if (!(await requireStepUpClient('/admin/teachers', 'create_teacher'))) {
      throw new Error('STEP_UP_PENDING');
    }
    const res = await fetch('/api/admin/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (isStepUpRequiredResponse(res.status, err.error)) {
        redirectToStepUp('/admin/teachers', 'create_teacher');
        throw new Error('STEP_UP_PENDING');
      }
      throw teacherApiError(err, 'Failed to create teacher');
    }
    await mutateTeachers();
    return res.json();
  }, [mutateTeachers, teacherApiError]);

  const updateTeacher = useCallback(async (id: string, data: Record<string, unknown>) => {
    if (!(await requireStepUpClient('/admin/teachers', 'update_teacher'))) {
      throw new Error('STEP_UP_PENDING');
    }
    let res: Response;
    try {
      res = await fetch(`/api/admin/teachers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(15000),
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'TimeoutError') {
        throw new Error('The server took too long to respond. Please try again.');
      }
      throw e;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (isStepUpRequiredResponse(res.status, err.error)) {
        redirectToStepUp('/admin/teachers', 'update_teacher');
        throw new Error('STEP_UP_PENDING');
      }
      throw teacherApiError(err, 'Failed to update teacher');
    }
    await mutateTeachers();
  }, [mutateTeachers, teacherApiError]);

  const deleteTeacher = useCallback(async (id: string) => {
    if (!(await requireStepUpClient('/admin/teachers', 'delete_teacher'))) {
      throw new Error('STEP_UP_PENDING');
    }
    let res: Response;
    try {
      res = await fetch(`/api/admin/teachers/${id}/delete`, {
        method: 'PATCH',
        signal: AbortSignal.timeout(15000),
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'TimeoutError') {
        throw new Error('The server took too long to respond. Please try again.');
      }
      throw e;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete teacher' }));
      if (isStepUpRequiredResponse(res.status, err.error)) {
        redirectToStepUp('/admin/teachers', 'delete_teacher');
        throw new Error('STEP_UP_PENDING');
      }
      // Already deleted (e.g. a retry after a timed-out first attempt) — treat as done.
      if (res.status === 400 && typeof err.error === 'string' && err.error.toLowerCase().includes('already deleted')) {
        await mutateTeachers();
        return;
      }
      throw new Error(err.error || 'Failed to delete teacher');
    }
    await mutateTeachers();
  }, [mutateTeachers]);

  const restoreTeacher = useCallback(async (id: string) => {
    if (!(await requireStepUpClient('/admin/teachers', 'restore_teacher'))) {
      throw new Error('STEP_UP_PENDING');
    }
    let res: Response;
    try {
      res = await fetch(`/api/admin/teachers/${id}/restore`, {
        method: 'PATCH',
        signal: AbortSignal.timeout(15000),
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'TimeoutError') {
        throw new Error('The server took too long to respond. Please try again.');
      }
      throw e;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to restore teacher' }));
      if (isStepUpRequiredResponse(res.status, err.error)) {
        redirectToStepUp('/admin/teachers', 'restore_teacher');
        throw new Error('STEP_UP_PENDING');
      }
      // Already restored — treat as done.
      if (res.status === 400 && typeof err.error === 'string' && err.error.toLowerCase().includes('not deleted')) {
        await mutateTeachers();
        return;
      }
      throw new Error(err.error || 'Failed to restore teacher');
    }
    await mutateTeachers();
  }, [mutateTeachers]);

  return (
    <AdminContext.Provider value={{
      members, teachers, adminUser, mounted,
      showDeleted, setShowDeleted,
      showDeletedTeachers, setShowDeletedTeachers,
      logoutAdmin, resetAdmin,
      addMember, refreshMembers, updateMember, deleteMember, restoreMember, changeMemberStatus,
      verifyDocument, rejectDocument,
      addTeacher, refreshTeachers, updateTeacher, deleteTeacher, restoreTeacher,
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
