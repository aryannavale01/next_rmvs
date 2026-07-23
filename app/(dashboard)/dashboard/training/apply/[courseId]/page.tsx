'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDashboard, TRANSLATIONS } from '@/lib/dashboard-context';
import {
  ChevronLeft, Laptop, Check, Percent, Upload, AlertCircle,
  FileCheck, RefreshCw, Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/components/ui/toast';

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

  const [attachedFiles, setAttachedFiles] = useState<{
    aadhaar?: { name: string; date: string };
    pan?: { name: string; date: string };
  }>({});

  const [docErrors, setDocErrors] = useState<{ aadhaar?: string; pan?: string }>({});
  const [uploadingDoc, setUploadingDoc] = useState<'aadhaar' | 'pan' | null>(null);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'compressing' | 'uploading'>('idle');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
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
          <p className="text-sm text-muted-foreground">Course not found.</p>
        </div>
      </div>
    );
  }

  const couponDiscounts: Record<string, number> = { FREE2026: 100, DISCOUNT50: 50, SKILLUP: 20 };
  const basePrice = course.price;
  const discountPercent = appliedCoupon?.discount || 0;
  const discountAmount = Math.round((basePrice * discountPercent) / 100);
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleCouponValidate = () => {
    const code = couponCode.trim().toUpperCase();
    if (couponDiscounts[code] !== undefined) {
      setAppliedCoupon({ code, discount: couponDiscounts[code] });
    } else {
      setAppliedCoupon(null);
      toast({ title: 'Invalid Coupon', description: 'The coupon code entered is not valid.', variant: 'error' });
    }
  };

  const handleFileAttach = async (type: 'aadhaar' | 'pan', file: File) => {
    setUploadingDoc(type);
    setDocErrors(prev => ({ ...prev, [type]: undefined }));

    try {
      // Client-side compression for images
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

      // Upload to server
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
        [type]: { name: file.name, date: new Date().toISOString().split('T')[0] },
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDocErrors({});

    const errors: typeof docErrors = {};
    if (!attachedFiles.aadhaar) {
      errors.aadhaar = 'Aadhaar Card document is mandatory to register under government schemes.';
    }
    if (course.price > 0 && !attachedFiles.pan && finalPrice > 0) {
      errors.pan = 'PAN Card document is required for paid course tax audits.';
    }

    if (Object.keys(errors).length > 0) {
      setDocErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      applyToCourse(
        course.id,
        appliedCoupon?.code,
        discountAmount,
        finalPrice,
        {
          aadhaar: attachedFiles.aadhaar?.name,
          pan: attachedFiles.pan?.name,
        },
      );
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => router.push('/dashboard/applications'), 2000);
    }, 1200);
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
        <ChevronLeft size={16} /> Back to Course
      </button>

      <div className="bg-card border border-border rounded-xl p-5">
        <h1 className="text-lg font-bold text-foreground">Apply for Admission</h1>
        <p className="text-sm text-muted-foreground mt-1">Course: <strong>{course.title}</strong></p>
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
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Why do you want to join this course?</label>
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
              {attachedFiles.aadhaar ? (
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
              {attachedFiles.pan ? (
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
                <span className="text-xs font-semibold text-success-text">Coupon {appliedCoupon.code} applied — {appliedCoupon.discount}% off</span>
                <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="ml-auto text-xs text-destructive hover:underline">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Enter coupon code"
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <button type="button" onClick={handleCouponValidate} className="px-4 py-2 text-xs font-bold bg-primary-light text-primary rounded-lg hover:bg-primary/10">Validate</button>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Application Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Course Fee</span><span className="font-semibold text-foreground">₹{basePrice}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Discount ({appliedCoupon?.code})</span><span className="font-semibold text-success-text">-₹{discountAmount}</span></div>}
            <div className="border-t border-border pt-2 flex justify-between text-sm"><span className="font-bold text-foreground">Total Payable</span><span className="font-bold text-primary">₹{finalPrice}</span></div>
          </div>
        </div>

        {/* Submit - Mobile */}
        <button type="submit" disabled={isSubmitting}
          className="lg:hidden w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-colors flex items-center justify-center gap-2">
          {isSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Submitting...</> : 'Submit Application'}
        </button>
      </form>

      {/* Submit - Desktop (outside form, linked via form attribute) */}
      <div className="hidden lg:block">
        <button type="submit" form="apply-form" disabled={isSubmitting}
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-colors flex items-center justify-center gap-2">
          {isSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Submitting Application...</> : 'Submit Application'}
        </button>
      </div>
    </motion.div>
  );
}
