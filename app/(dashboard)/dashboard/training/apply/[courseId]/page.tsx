'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDashboard, TRANSLATIONS } from '@/lib/dashboard-context';
import {
  ChevronLeft, Laptop, Check, Percent, Upload, AlertCircle,
  FileCheck, RefreshCw, Trash2, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/components/ui/toast';
import type { DocumentInfo } from '@/lib/store';

export default function ApplyCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { courses, profile, applyToCourse, language } = useDashboard();
  const { toast } = useToast();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const course = courses.find(c => c.id === courseId);

  const [formData, setFormData] = useState({
    fullName: profile ? `${profile.firstName} ${profile.lastName}`.trim() : '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    aadhaar: profile?.aadhaarNo || '',
    education: '',
    address: '',
    motivation: '',
  });

  const [profileDocs, setProfileDocs] = useState<{
    aadhaar: DocumentInfo;
    pan: DocumentInfo;
  }>({
    aadhaar: profile?.documents?.aadhaar || { recordId: null, uploaded: false, name: null, date: null, signedUrl: null, status: 'not_uploaded', verifiedDate: null },
    pan: profile?.documents?.pan || { recordId: null, uploaded: false, name: null, date: null, signedUrl: null, status: 'not_uploaded', verifiedDate: null },
  });

  const refreshProfileDocs = useCallback(() => {
    if (profile?.documents) {
      setProfileDocs({ aadhaar: profile.documents.aadhaar, pan: profile.documents.pan });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.documents?.aadhaar?.recordId, profile?.documents?.aadhaar?.uploaded, profile?.documents?.aadhaar?.status, profile?.documents?.pan?.recordId, profile?.documents?.pan?.uploaded, profile?.documents?.pan?.status]);

  useEffect(() => { refreshProfileDocs(); }, [refreshProfileDocs]);

  const [attachedFiles, setAttachedFiles] = useState<{
    aadhaar?: { name: string; date: string; recordId: string };
    pan?: { name: string; date: string; recordId: string };
  }>({});

  const [docErrors, setDocErrors] = useState<{ aadhaar?: string; pan?: string }>({});
  const [uploadingDoc, setUploadingDoc] = useState<'aadhaar' | 'pan' | null>(null);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'compressing' | 'uploading'>('idle');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountType: string; discountValue: number } | null>(null);
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!course) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Training not found.</p>
        </div>
      </div>
    );
  }

  const basePrice = course.price;
  const discountPercent = appliedCoupon
    ? (appliedCoupon.discountType === 'percentage' ? appliedCoupon.discountValue : 0)
    : 0;
  const discountAmount = appliedCoupon
    ? (appliedCoupon.discountType === 'percentage'
        ? Math.round((basePrice * appliedCoupon.discountValue) / 100)
        : Math.min(appliedCoupon.discountValue, basePrice))
    : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const COUPON_MESSAGES: Record<string, string> = {
    not_found: 'Coupon expired or invalid.',
    inactive: 'Coupon expired or invalid.',
    not_yet_valid: 'Coupon expired or invalid.',
    expired: 'Coupon expired or invalid.',
    wrong_course: 'Coupon expired or invalid.',
    exhausted: 'Coupon expired or invalid.',
    user_limit_reached: 'Coupon expired or invalid.',
    below_min_amount: 'Coupon expired or invalid.',
    course_not_found: 'Coupon expired or invalid.',
  };

  const handleCouponValidate = async () => {
    const code = couponCode.trim();
    if (!code) return;
    setCouponValidating(true);
    setCouponError(null);
    setAppliedCoupon(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, courseId }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({ code: code.toUpperCase(), discountType: data.discountType, discountValue: data.discountValue });
      } else {
        setCouponError(COUPON_MESSAGES[data.reason] || 'Coupon expired or invalid.');
      }
    } catch {
      setCouponError('Coupon expired or invalid.');
    } finally {
      setCouponValidating(false);
    }
  };

  const handleFileAttach = async (type: 'aadhaar' | 'pan', file: File) => {
    setUploadingDoc(type);
    setDocErrors(prev => ({ ...prev, [type]: undefined }));

    try {
      let uploadFile: File = file;
      if (file.type.startsWith('image/')) {
        setUploadPhase('compressing');
        const imageCompression = (await import('browser-image-compression')).default;
        uploadFile = await imageCompression(file, {
          maxSizeMB: 8,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        });
      }

      setUploadPhase('uploading');
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('documentType', type);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setAttachedFiles(prev => ({
        ...prev,
        [type]: { name: file.name, date: new Date().toISOString().split('T')[0], recordId: data.recordId },
      }));
    } catch (err: any) {
      setDocErrors(prev => ({ ...prev, [type]: err.message || 'Upload failed' }));
    } finally {
      setUploadingDoc(null);
      setUploadPhase('idle');
    }
  };

  const handleFileRemove = (type: 'aadhaar' | 'pan') => {
    setAttachedFiles(prev => { const n = { ...prev }; delete n[type]; return n; });
  };

  const isDocOnFile = (type: 'aadhaar' | 'pan'): boolean => {
    const doc = profileDocs[type];
    return doc.uploaded === true && doc.recordId !== null && doc.status !== 'rejected';
  };

  const isDocRejected = (type: 'aadhaar' | 'pan'): boolean => {
    return profileDocs[type].status === 'rejected';
  };

  const hasRejectedDocs = isDocRejected('aadhaar') || (course.price > 0 && finalPrice > 0 && isDocRejected('pan'));

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocErrors({});

    if (hasRejectedDocs) {
      const errors: typeof docErrors = {};
      if (isDocRejected('aadhaar')) errors.aadhaar = 'This document was rejected — please update it in your profile before applying.';
      if (course.price > 0 && finalPrice > 0 && isDocRejected('pan')) errors.pan = 'This document was rejected — please update it in your profile before applying.';
      setDocErrors(errors);
      return;
    }

    const errors: typeof docErrors = {};
    if (!isDocOnFile('aadhaar') && !attachedFiles.aadhaar) {
      errors.aadhaar = 'Aadhaar Card document is mandatory to register under government schemes.';
    }
    if (course.price > 0 && finalPrice > 0 && !isDocOnFile('pan') && !attachedFiles.pan) {
      errors.pan = 'PAN Card document is required for paid training tax audits.';
    }

    if (Object.keys(errors).length > 0) {
      setDocErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const success = await applyToCourse(
      course.id,
      appliedCoupon?.code,
      discountAmount,
      finalPrice,
      {
        aadhaar: isDocOnFile('aadhaar')
          ? { name: profileDocs.aadhaar.name || undefined, recordId: profileDocs.aadhaar.recordId || undefined }
          : attachedFiles.aadhaar
            ? { name: attachedFiles.aadhaar.name, recordId: attachedFiles.aadhaar.recordId }
            : undefined,
        pan: isDocOnFile('pan')
          ? { name: profileDocs.pan.name || undefined, recordId: profileDocs.pan.recordId || undefined }
          : attachedFiles.pan
            ? { name: attachedFiles.pan.name, recordId: attachedFiles.pan.recordId }
            : undefined,
      },
    );
    setIsSubmitting(false);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => router.push('/dashboard/applications'), 2000);
    }
  };

  if (showSuccess) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mb-4">
          <Check size={32} className="text-success" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Application Submitted!</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Your application for <strong>{course.title}</strong> has been submitted successfully. You will be notified once it is reviewed.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft size={16} /> Back to Training
      </button>

      <div className="bg-card border border-border rounded-xl p-5">
        <h1 className="text-lg font-bold text-foreground">Apply for Admission</h1>
        <p className="text-sm text-muted-foreground mt-1">Training: <strong>{course.title}</strong></p>
      </div>

      <form id="apply-form" onSubmit={handleFormSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Laptop size={16} className="text-primary" /> Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Full Name</label>
              <input type="text" value={formData.fullName} onChange={e => setFormData(f => ({ ...f, fullName: e.target.value }))} required
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} required
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Phone</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} required
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Aadhaar Number</label>
              <input type="text" value={formData.aadhaar} onChange={e => setFormData(f => ({ ...f, aadhaar: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Education Qualification</label>
              <input type="text" value={formData.education} onChange={e => setFormData(f => ({ ...f, education: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Address</label>
              <input type="text" value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Why do you want to join this training?</label>
              <textarea value={formData.motivation} onChange={e => setFormData(f => ({ ...f, motivation: e.target.value }))} rows={3}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileCheck size={16} className="text-primary" /> Required Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aadhaar */}
            <div className={`border rounded-lg p-4 ${docErrors.aadhaar ? 'border-destructive' : 'border-border'}`}>
              <p className="text-xs font-bold text-foreground mb-2">Aadhaar Card *</p>
              {isDocRejected('aadhaar') ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Document rejected</p>
                      <p className="text-xs text-gray-500">Please update it in your profile before applying.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => router.push('/dashboard/profile')} className="text-xs font-medium text-blue-600 hover:underline shrink-0">Fix</button>
                </div>
              ) : isDocOnFile('aadhaar') ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Aadhaar Card on file</p>
                      <p className="text-xs text-gray-500">{profileDocs.aadhaar.name} · Uploaded {profileDocs.aadhaar.date}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => router.push('/dashboard/profile')} className="text-xs font-medium text-blue-600 hover:underline shrink-0">Replace</button>
                </div>
              ) : attachedFiles.aadhaar ? (
                <div className="flex items-center gap-2 bg-success-bg/50 rounded-lg p-3">
                  <FileCheck size={16} className="text-success shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{attachedFiles.aadhaar.name}</p>
                    <p className="text-[10px] text-muted-foreground">Uploaded {attachedFiles.aadhaar.date}</p>
                  </div>
                  <button type="button" onClick={() => handleFileRemove('aadhaar')} className="p-1 hover:bg-destructive/10 rounded">
                    <Trash2 size={14} className="text-destructive" />
                  </button>
                </div>
              ) : uploadingDoc === 'aadhaar' ? (
                <div className="flex flex-col items-center gap-2 border-2 border-dashed border-primary/30 rounded-lg p-6">
                  <RefreshCw size={20} className="text-primary animate-spin" />
                  <span className="text-xs text-primary font-semibold">
                    {uploadPhase === 'compressing' ? 'Compressing...' : 'Uploading...'}
                  </span>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                  <Upload size={20} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Click to upload Aadhaar</span>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files?.[0] && handleFileAttach('aadhaar', e.target.files[0])} />
                </label>
              )}
              {docErrors.aadhaar && <p className="text-[10px] text-destructive mt-2">{docErrors.aadhaar}</p>}
            </div>

            {/* PAN */}
            <div className={`border rounded-lg p-4 ${docErrors.pan ? 'border-destructive' : 'border-border'}`}>
              <p className="text-xs font-bold text-foreground mb-2">PAN Card {course.price > 0 ? '*' : '(Optional)'}</p>
              {isDocRejected('pan') ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Document rejected</p>
                      <p className="text-xs text-gray-500">Please update it in your profile before applying.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => router.push('/dashboard/profile')} className="text-xs font-medium text-blue-600 hover:underline shrink-0">Fix</button>
                </div>
              ) : isDocOnFile('pan') ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">PAN Card on file</p>
                      <p className="text-xs text-gray-500">{profileDocs.pan.name} · Uploaded {profileDocs.pan.date}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => router.push('/dashboard/profile')} className="text-xs font-medium text-blue-600 hover:underline shrink-0">Replace</button>
                </div>
              ) : attachedFiles.pan ? (
                <div className="flex items-center gap-2 bg-success-bg/50 rounded-lg p-3">
                  <FileCheck size={16} className="text-success shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{attachedFiles.pan.name}</p>
                    <p className="text-[10px] text-muted-foreground">Uploaded {attachedFiles.pan.date}</p>
                  </div>
                  <button type="button" onClick={() => handleFileRemove('pan')} className="p-1 hover:bg-destructive/10 rounded">
                    <Trash2 size={14} className="text-destructive" />
                  </button>
                </div>
              ) : uploadingDoc === 'pan' ? (
                <div className="flex flex-col items-center gap-2 border-2 border-dashed border-primary/30 rounded-lg p-6">
                  <RefreshCw size={20} className="text-primary animate-spin" />
                  <span className="text-xs text-primary font-semibold">
                    {uploadPhase === 'compressing' ? 'Compressing...' : 'Uploading...'}
                  </span>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                  <Upload size={20} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Click to upload PAN</span>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files?.[0] && handleFileAttach('pan', e.target.files[0])} />
                </label>
              )}
              {docErrors.pan && <p className="text-[10px] text-destructive mt-2">{docErrors.pan}</p>}
            </div>
          </div>
        </div>

        {/* Coupon */}
        {basePrice > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Percent size={16} className="text-primary" /> Coupon Code
            </h3>
            {appliedCoupon ? (
              <div className="flex items-center gap-2 bg-success-bg/50 rounded-lg p-3">
                <Check size={16} className="text-success" />
                <span className="text-xs font-semibold text-success-text">Coupon {appliedCoupon.code} applied — {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% off` : `₹${appliedCoupon.discountValue} off`}</span>
                <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="ml-auto text-xs text-destructive hover:underline">Remove</button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  <button type="button" onClick={handleCouponValidate} disabled={couponValidating} className="px-4 py-2 text-xs font-bold bg-primary-light text-primary rounded-lg hover:bg-primary/10 disabled:opacity-50">{couponValidating ? 'Checking...' : 'Validate'}</button>
                </div>
                {couponError && <p className="text-xs text-destructive font-medium">{couponError}</p>}
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Application Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Training Fee</span><span className="font-semibold text-foreground">₹{basePrice}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Discount ({appliedCoupon?.code})</span><span className="font-semibold text-success-text">-₹{discountAmount}</span></div>}
            <div className="border-t border-border pt-2 flex justify-between text-sm"><span className="font-bold text-foreground">Total Payable</span><span className="font-bold text-primary">₹{finalPrice}</span></div>
          </div>
        </div>

        {/* Submit - Mobile */}
        <button type="submit" disabled={isSubmitting || hasRejectedDocs}
          className="lg:hidden w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Submitting...</> : hasRejectedDocs ? 'Fix rejected documents first' : 'Submit Application'}
        </button>
      </form>

      {/* Submit - Desktop (outside form, linked via form attribute) */}
      <div className="hidden lg:block">
        <button type="submit" form="apply-form" disabled={isSubmitting || hasRejectedDocs}
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Submitting Application...</> : hasRejectedDocs ? 'Fix rejected documents first' : 'Submit Application'}
        </button>
      </div>
    </motion.div>
  );
}
