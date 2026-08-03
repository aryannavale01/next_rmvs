'use client';

import { useState, useMemo, useEffect } from 'react';
import { Coupon } from '@/lib/admin-types';
import {
  Ticket, Search, Plus, Pencil, Trash2, X, Copy, Check, Percent,
  BarChart3,
} from 'lucide-react';
import MetricCards from '@/components/MetricCards';
import { EmptyState } from '@/components/ui/empty-state';
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from '@/lib/admin-stepup';

const COUPON_ACTION = 'manage_coupons';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/coupons').then(r => r.json()),
      fetch('/api/admin/courses').then(r => r.json()),
    ]).then(([cData, coData]) => {
      setCoupons(Array.isArray(cData) ? cData : []);
      setCourses(Array.isArray(coData) ? coData : []);
    }).catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const emptyForm = {
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    expiresAt: '',
    validFrom: '',
    maxUses: 100,
    perUserLimit: 1,
    minAmount: 0,
    courseId: '',
    isActive: true,
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    let list = [...coupons];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    return list;
  }, [coupons, search]);

  const counts = useMemo(() => ({
    total: coupons.length,
    active: coupons.filter(c => c.isActive).length,
    expired: coupons.filter(c => !c.isActive).length,
    totalRedemptions: coupons.reduce((s, c) => s + c.usedCount, 0),
  }), [coupons]);

  const openAdd = () => { setForm(emptyForm); setEditCoupon(null); setShowModal(true); };

  const openEdit = (c: Coupon) => {
    setForm({
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '',
      validFrom: c.validFrom ? c.validFrom.split('T')[0] : '',
      maxUses: c.maxUses ?? 100,
      perUserLimit: c.perUserLimit ?? 1,
      minAmount: c.minAmount ?? 0,
      courseId: c.courseId ?? '',
      isActive: c.isActive,
    });
    setEditCoupon(c);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.description) return;
    if (!(await requireStepUpClient('/admin/coupons', COUPON_ACTION))) return;
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: form.discountValue,
      expiresAt: form.expiresAt || null,
      validFrom: form.validFrom || null,
      maxUses: form.maxUses || null,
      perUserLimit: form.perUserLimit || null,
      minAmount: form.minAmount || null,
      courseId: form.courseId || null,
      isActive: form.isActive,
    };

    try {
      if (editCoupon) {
        const res = await fetch(`/api/admin/coupons/${editCoupon.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          if (isStepUpRequiredResponse(res.status, data.error)) {
            redirectToStepUp('/admin/coupons', COUPON_ACTION);
            return;
          }
          setError(data.error || 'Failed to update coupon');
          return;
        }
      } else {
        const res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          if (isStepUpRequiredResponse(res.status, data.error)) {
            redirectToStepUp('/admin/coupons', COUPON_ACTION);
            return;
          }
          setError(data.error || 'Failed to create coupon');
          return;
        }
      }
      const refreshed = await fetch('/api/admin/coupons').then(r => r.json());
      setCoupons(Array.isArray(refreshed) ? refreshed : []);
      setShowModal(false);
    } catch {
      setError('Failed to save coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await requireStepUpClient('/admin/coupons', COUPON_ACTION))) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        if (isStepUpRequiredResponse(res.status, data.error)) {
          redirectToStepUp('/admin/coupons', COUPON_ACTION);
          return;
        }
        setError(data.error || 'Failed to delete coupon');
        setDeleteConfirm(null);
        return;
      }
      const data = await res.json();
      if (data.deactivated) {
        setError('Coupon has redemptions — deactivated instead of deleted.');
      }
      const refreshed = await fetch('/api/admin/coupons').then(r => r.json());
      setCoupons(Array.isArray(refreshed) ? refreshed : []);
    } catch {
      setError('Failed to delete coupon');
    }
    setDeleteConfirm(null);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const toggleStatus = async (c: Coupon) => {
    if (!(await requireStepUpClient('/admin/coupons', COUPON_ACTION))) return;
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (isStepUpRequiredResponse(res.status, data.error)) {
          redirectToStepUp('/admin/coupons', COUPON_ACTION);
          return;
        }
        setError(data.error || 'Failed to toggle status');
        return;
      }
      const refreshed = await fetch('/api/admin/coupons').then(r => r.json());
      setCoupons(Array.isArray(refreshed) ? refreshed : []);
    } catch {
      setError('Failed to toggle status');
    }
  };

  const getCourseTitle = (courseId: string | null) => {
    if (!courseId) return 'Global';
    const course = courses.find(co => co.id === courseId);
    return course ? course.title : courseId;
  };

  const formatDiscount = (c: Coupon) => {
    return c.discountType === 'percentage' ? `${c.discountValue}%` : `\u20B9${c.discountValue.toLocaleString()}`;
  };

  const formatDate = (d: string | null) => {
    if (!d) return '\u2014';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-4 font-sans">
      {error && (
        <div className="bg-destructive-bg/50 border border-destructive/20 rounded-xl p-3 text-sm text-destructive flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-destructive hover:underline">Dismiss</button>
        </div>
      )}

      <MetricCards
        activeFilter="total"
        onFilterChange={() => {}}
        columns={4}
        cards={[
          { id: 'total', label: 'Total Coupons', value: counts.total, icon: Ticket },
          { id: 'active', label: 'Active', value: counts.active, icon: Check },
          { id: 'expired', label: 'Inactive', value: counts.expired, icon: X },
          { id: 'redemptions', label: 'Total Redemptions', value: counts.totalRedemptions, icon: BarChart3 },
        ]}
      />

      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search coupons by code or description..."
            className="flex-1 text-sm outline-none placeholder:text-muted-foreground min-w-0" />
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">
          <Plus className="w-3.5 h-3.5" /> Add Coupon
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Code</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Discount</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Valid Until</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Usage</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12">
                  <EmptyState icon={Ticket} title="No coupons" description="Create promo codes to offer discounts on courses." />
                </td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-primary-light/30 transition-colors">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground font-mono">{c.code}</span>
                      <button onClick={() => handleCopy(c.code)} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Copy code">
                        {copiedCode === c.code ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{getCourseTitle(c.courseId)}</p>
                  </td>
                  <td className="px-3 py-3 text-sm text-foreground max-w-[200px] truncate">{c.description}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-foreground">
                      {c.discountType === 'percentage' ? <Percent className="w-3 h-3 text-muted-foreground" /> : null}
                      {formatDiscount(c)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{formatDate(c.expiresAt)}</td>
                  <td className="px-3 py-3 text-sm text-foreground">{c.usedCount}/{c.maxUses ?? '∞'}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => toggleStatus(c)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-colors ${c.isActive ? 'bg-success-bg text-success-text hover:bg-success/10' : 'bg-destructive-bg text-destructive-text hover:bg-destructive/10'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary" aria-label="Edit coupon"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive" aria-label="Delete coupon"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">{editCoupon ? 'Edit Coupon' : 'Add New Coupon'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md hover:bg-muted" aria-label="Close modal"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Code *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    disabled={!!editCoupon}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono disabled:bg-muted disabled:text-muted-foreground" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Status</label>
                  <select value={form.isActive ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card">
                    <option value="true">Active</option><option value="false">Inactive</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Description *</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Discount Type</label>
                  <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'percentage' | 'fixed' }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card">
                    <option value="percentage">Percentage</option><option value="fixed">Fixed</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Value {form.discountType === 'percentage' ? '(%)' : `(\u20B9)`}</label>
                  <input type="number" min="0" max={form.discountType === 'percentage' ? 100 : undefined} value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Expiry Date</label>
                  <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Max Uses</label>
                  <input type="number" min="0" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Per-User Limit</label>
                  <input type="number" min="1" value={form.perUserLimit} onChange={e => setForm(f => ({ ...f, perUserLimit: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Min Order Value ({`\u20B9`})</label>
                  <input type="number" min="0" value={form.minAmount} onChange={e => setForm(f => ({ ...f, minAmount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Training</label>
                  <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card">
                    <option value="">Global (All Trainings)</option>
                    {courses.map(co => (
                      <option key={co.id} value={co.id}>{co.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">{editCoupon ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-2">Delete Coupon?</h3>
            <p className="text-xs text-muted-foreground mb-6">This will permanently remove the coupon (or deactivate if it has redemptions).</p>
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
