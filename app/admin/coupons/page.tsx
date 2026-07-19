'use client';

import { useState, useMemo } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { Coupon } from '@/lib/admin-types';
import {
  Ticket, Search, Plus, Pencil, Trash2, X, Copy, Check, Percent,
  BarChart3,
} from 'lucide-react';
import MetricCards from '@/components/MetricCards';
import { EmptyState } from '@/components/ui/empty-state';

export default function AdminCouponsPage() {
  const { coupons, courses, addCoupon, updateCoupon, deleteCoupon } = useAdmin();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const emptyForm: Omit<Coupon, 'uses_count'> & { uses_count: number } = {
    code: '',
    description: '',
    type: 'Percentage',
    value: 0,
    expiry_date: '',
    max_uses: 100,
    uses_count: 0,
    per_user_limit: 1,
    min_order_value: 0,
    course_id: 'global',
    status: 'Active',
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
    active: coupons.filter(c => c.status === 'Active').length,
    expired: coupons.filter(c => c.status === 'Inactive').length,
    totalRedemptions: coupons.reduce((s, c) => s + c.uses_count, 0),
  }), [coupons]);

  const openAdd = () => { setForm(emptyForm); setEditCoupon(null); setShowModal(true); };

  const openEdit = (c: Coupon) => {
    setForm({ ...c });
    setEditCoupon(c);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.code || !form.description) return;
    if (editCoupon) {
      updateCoupon(editCoupon.code, form);
    } else {
      addCoupon(form as Coupon);
    }
    setShowModal(false);
  };

  const handleDelete = (code: string) => {
    deleteCoupon(code);
    setDeleteConfirm(null);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const toggleStatus = (c: Coupon) => {
    updateCoupon(c.code, { status: c.status === 'Active' ? 'Inactive' : 'Active' });
  };

  const getCourseTitle = (courseId: string) => {
    if (courseId === 'global') return 'Global';
    const course = courses.find(co => co.id === courseId);
    return course ? course.title : courseId;
  };

  const formatDiscount = (c: Coupon) => {
    return c.type === 'Percentage' ? `${c.value}%` : `\u20B9${c.value.toLocaleString()}`;
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Stat Cards */}
      <MetricCards
        activeFilter="total"
        onFilterChange={() => {}}
        columns={4}
        cards={[
          { id: 'total', label: 'Total Coupons', value: counts.total, icon: Ticket },
          { id: 'active', label: 'Active', value: counts.active, icon: Check },
          { id: 'expired', label: 'Expired', value: counts.expired, icon: X },
          { id: 'redemptions', label: 'Total Redemptions', value: counts.totalRedemptions, icon: BarChart3 },
        ]}
      />

      {/* Toolbar */}
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

      {/* Table */}
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
                <tr key={c.code} className="hover:bg-primary-light/30 transition-colors">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground font-mono">{c.code}</span>
                      <button onClick={() => handleCopy(c.code)} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Copy code">
                        {copiedCode === c.code ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{getCourseTitle(c.course_id)}</p>
                  </td>
                  <td className="px-3 py-3 text-sm text-foreground max-w-[200px] truncate">{c.description}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-foreground">
                      {c.type === 'Percentage' ? <Percent className="w-3 h-3 text-muted-foreground" /> : null}
                      {formatDiscount(c)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{c.expiry_date || '\u2014'}</td>
                  <td className="px-3 py-3 text-sm text-foreground">{c.uses_count}/{c.max_uses}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => toggleStatus(c)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-colors ${c.status === 'Active' ? 'bg-success-bg text-success-text hover:bg-success/10' : 'bg-destructive-bg text-destructive-text hover:bg-destructive/10'}`}>
                      {c.status}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary" aria-label="Edit coupon"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteConfirm(c.code)} className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive" aria-label="Delete coupon"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
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
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Coupon['status'] }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card">
                    <option>Active</option><option>Inactive</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Description *</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Discount Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Coupon['type'] }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card">
                    <option>Percentage</option><option>Fixed</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Value {form.type === 'Percentage' ? '(%)' : `(\u20B9)`}</label>
                  <input type="number" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Expiry Date</label>
                  <input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Max Uses</label>
                  <input type="number" min="0" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Per-User Limit</label>
                  <input type="number" min="1" value={form.per_user_limit} onChange={e => setForm(f => ({ ...f, per_user_limit: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Min Order Value ({`\u20B9`})</label>
                  <input type="number" min="0" value={form.min_order_value} onChange={e => setForm(f => ({ ...f, min_order_value: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Course</label>
                  <select value={form.course_id} onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card">
                    <option value="global">Global (All Courses)</option>
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

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-2">Delete Coupon?</h3>
            <p className="text-xs text-muted-foreground mb-1">This will permanently remove coupon</p>
            <p className="text-xs font-mono font-bold text-foreground mb-6">{deleteConfirm}</p>
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
