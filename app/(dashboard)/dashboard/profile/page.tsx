'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDashboard, TRANSLATIONS } from '@/lib/dashboard-context';
import {
  User,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function ProfilePage() {
  const { profile, updateProfile, language } = useDashboard();
  const { toast } = useToast();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Personal Info Form State
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [aadhaarNo, setAadhaarNo] = useState(profile.aadhaarNo);
  const [panNo, setPanNo] = useState(profile.panNo);
  const [rationCardNo, setRationCardNo] = useState(profile.rationCardNo);

  const [personalSuccess, setPersonalSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  // Document Upload State
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'compressing' | 'uploading'>('idle');
  const [docErrors, setDocErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Profile Picture Upload State
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPhase, setPhotoPhase] = useState<'idle' | 'compressing' | 'uploading'>('idle');
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');
  const [imgLoadError, setImgLoadError] = useState<string | null>(null);
  const [photoVersion, setPhotoVersion] = useState(0);

  // Confirm dialogs
  const [showRemovePhotoConfirm, setShowRemovePhotoConfirm] = useState(false);
  const [deleteDocTarget, setDeleteDocTarget] = useState<'aadhaar' | 'pan' | 'rationCard' | null>(null);

  // Sync form fields when profile loads from server (DashboardProvider useEffect)
  useEffect(() => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setEmail(profile.email);
    setPhone(profile.phone);
    setAadhaarNo(profile.aadhaarNo);
    setPanNo(profile.panNo);
    setRationCardNo(profile.rationCardNo);
  }, [profile.firstName, profile.lastName, profile.email, profile.phone, profile.aadhaarNo, profile.panNo, profile.rationCardNo]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setPhotoError('Image size must be less than 20MB');
      setTimeout(() => setPhotoError(''), 4000);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file');
      setTimeout(() => setPhotoError(''), 4000);
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoError('');
    setPhotoSuccess('');

    try {
      // Client-side compression — skip if file already small
      setPhotoPhase('compressing');
      let uploadFile: File = file;
      if (file.size > 1.5 * 1024 * 1024) {
        try {
          const imageCompression = (await import('browser-image-compression')).default;
          uploadFile = await imageCompression(file, {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
          });
        } catch (compressionErr) {
          console.warn('[photo] Client compression failed, sending original:', compressionErr);
          // Fall back to original file — server-side sharp will handle compression
        }
      }

      // Upload to server
      setPhotoPhase('uploading');
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('documentType', 'profilePhoto');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      updateProfile({
        photoUrl: data.photoUrl || data.signedUrl,
        photoUrlHQ: data.photoUrlHQ || '',
        photoBlurDataUrl: data.photoBlurDataUrl || '',
      });
      setImgLoadError(null);
      setPhotoVersion(Date.now());
      setPhotoSuccess('Profile picture updated successfully!');
      setTimeout(() => setPhotoSuccess(''), 4000);
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to upload photo');
      setTimeout(() => setPhotoError(''), 5000);
    } finally {
      setIsUploadingPhoto(false);
      setPhotoPhase('idle');
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    try {
      const res = await fetch('/api/upload?documentType=profilePhoto', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      updateProfile({ photoUrl: '', photoUrlHQ: '', photoBlurDataUrl: '' });
      setPhotoSuccess('Profile picture removed successfully');
      setTimeout(() => setPhotoSuccess(''), 4000);
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to remove photo');
      setTimeout(() => setPhotoError(''), 5000);
    }
    setShowRemovePhotoConfirm(false);
  };

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setPersonalSuccess(false);

    setTimeout(() => {
      updateProfile({
        firstName,
        lastName,
        email,
        phone,
        aadhaarNo,
        panNo,
        rationCardNo
      });
      setIsSaving(false);
      setPersonalSuccess(true);
      setTimeout(() => setPersonalSuccess(false), 3000);
    }, 600);
  };

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordApiError, setPasswordApiError] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    setPasswordApiError('');

    if (!currentPassword) {
      errors.current = 'Current password is required';
    }

    if (!newPassword) {
      errors.new = 'New password is required';
    } else if (newPassword.length < 6) {
      errors.new = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirm = 'Please confirm your new password';
    } else if (confirmPassword !== newPassword) {
      errors.confirm = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    setPasswordSuccess(false);

    if (Object.keys(errors).length > 0) return;

    setPasswordLoading(true);
    try {
      const { authClient } = await import('@/lib/auth-client');
      const { error: authError } = await authClient.changePassword({
        currentPassword,
        newPassword,
      });

      if (authError) {
        setPasswordApiError(authError.message || 'Failed to change password. Please check your current password.');
        return;
      }

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch {
      setPasswordApiError('Network error. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const triggerUpload = (docType: 'aadhaar' | 'pan' | 'rationCard') => {
    fileInputRef.current[docType]?.click();
  };

  const handleFileUpload = async (docType: 'aadhaar' | 'pan' | 'rationCard', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(docType);
    setDocErrors(prev => ({ ...prev, [docType]: '' }));

    try {
      // Client-side compression for images only
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
      formData.append('documentType', docType);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      const nextDocs = { ...profile.documents };
      nextDocs[docType] = {
        uploaded: true,
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        signedUrl: data.signedUrl,
      };
      updateProfile({ documents: nextDocs });
    } catch (err: any) {
      setDocErrors(prev => ({ ...prev, [docType]: err.message || 'Upload failed' }));
      setTimeout(() => setDocErrors(prev => ({ ...prev, [docType]: '' })), 5000);
    } finally {
      setUploadingDoc(null);
      setUploadPhase('idle');
      if (fileInputRef.current[docType]) fileInputRef.current[docType]!.value = '';
    }
  };

  const handleDeleteDoc = (docType: 'aadhaar' | 'pan' | 'rationCard') => {
    setDeleteDocTarget(docType);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* 2-COLUMN GRID (Personal Info & Documents vs Password) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PERSONAL INFORMATION (SPAN 2) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary">
                <User size={20} />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">{t.personalInfo}</h3>
                <p className="text-xs text-muted-foreground">Update your primary registration data and contact coordinates</p>
              </div>
            </div>

            {/* PROFILE PICTURE UPLOAD AREA */}
            <div className="mb-8 p-5 bg-background border border-border rounded-xl flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group shrink-0">
                {profile.photoUrl && profile.photoUrl !== imgLoadError ? (
                  <img
                    src={`${profile.photoUrl}?v=${photoVersion}`}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    width={96}
                    height={96}
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.retried) {
                        img.dataset.retried = '1';
                        img.src = `${profile.photoUrl}?v=${photoVersion}&retry=${Date.now()}`;
                      } else {
                        setImgLoadError(profile.photoUrl || null);
                      }
                    }}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary-blue flex items-center justify-center font-bold text-white text-3xl shadow-md border-4 border-white uppercase">
                    {profile.firstName?.[0] || 'U'}
                    {profile.lastName?.[0] || 'P'}
                  </div>
                )}
                
                      {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <RefreshCw size={24} className="animate-spin text-white" />
                    <span className="absolute -bottom-5 text-[10px] text-muted-foreground font-semibold">
                      {photoPhase === 'compressing' ? 'Compressing...' : 'Uploading...'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <h4 className="text-sm font-bold text-foreground">Profile Picture</h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Upload a professional passport-sized photo (JPEG or PNG, max 2MB). This is used for generating course completion certificates.
                </p>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <Upload size={12} />
                    {profile.photoUrl ? 'Replace Photo' : 'Upload Photo'}
                  </button>
                  
                  {profile.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setShowRemovePhotoConfirm(true)}
                      disabled={isUploadingPhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive-bg hover:bg-destructive/10 text-destructive-text text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  )}
                </div>

                {/* Status messages */}
                {photoSuccess && (
                  <p className="text-success-text text-[11px] font-semibold flex items-center justify-center sm:justify-start gap-1">
                    <CheckCircle2 size={12} />
                    {photoSuccess}
                  </p>
                )}
                {photoError && (
                  <p className="text-destructive text-[11px] font-semibold flex items-center justify-center sm:justify-start gap-1">
                    <AlertCircle size={12} />
                    {photoError}
                  </p>
                )}
              </div>
            </div>

            <form onSubmit={handlePersonalSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* First Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 rounded-lg outline-none transition-all"
                    required
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 rounded-lg outline-none transition-all"
                    required
                  />
                </div>

                {/* Email address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 rounded-lg outline-none transition-all"
                    required
                  />
                </div>

                {/* Phone number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Mobile Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 rounded-lg outline-none transition-all"
                    required
                  />
                </div>

                {/* Aadhaar No */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Aadhaar Card Number</label>
                  <input
                    type="text"
                    value={aadhaarNo}
                    onChange={(e) => setAadhaarNo(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 rounded-lg outline-none transition-all"
                    placeholder="e.g. 1234 5678 9012"
                    required
                  />
                </div>

                {/* PAN No */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">PAN Card Number</label>
                  <input
                    type="text"
                    value={panNo}
                    onChange={(e) => setPanNo(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 rounded-lg outline-none transition-all"
                    placeholder="e.g. ABCDE1234F"
                    required
                  />
                </div>

                {/* Ration Card No */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Ration Card Number (Optional for subsidies)</label>
                  <input
                    type="text"
                    value={rationCardNo}
                    onChange={(e) => setRationCardNo(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 rounded-lg outline-none transition-all"
                    placeholder="e.g. RC12345678"
                  />
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-border gap-4">
                <AnimatePresence>
                  {personalSuccess && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-success-text text-xs font-medium"
                    >
                      <CheckCircle2 size={16} />
                      Profile details saved successfully!
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-colors ml-auto flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    t.saveChanges
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* IDENTITY DOCUMENTS CARD */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">{t.identityDocs}</h3>
                <p className="text-xs text-muted-foreground">Provide legal identification papers for course admissions and state subsidies</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {([
                { key: 'aadhaar', label: 'Aadhaar Card ID', color: 'bg-primary-light text-primary border-primary/20' },
                { key: 'pan', label: 'PAN Card ID', color: 'bg-primary-light text-primary border-primary/20' },
                { key: 'rationCard', label: 'Ration Card ID', color: 'bg-warning-bg text-warning-text border-warning/20' }
              ] as const).map((doc) => {
                const stateDoc = profile.documents[doc.key];
                const isUploading = uploadingDoc === doc.key;
                
                return (
                  <div
                    key={doc.key}
                    className="border border-border rounded-xl p-4 flex flex-col justify-between h-44 bg-background/50 hover:bg-card transition-colors duration-200"
                  >
                    <input
                      type="file"
                      ref={(el) => { fileInputRef.current[doc.key] = el; }}
                      onChange={(e) => handleFileUpload(doc.key, e)}
                      accept="application/pdf,image/*"
                      className="hidden"
                    />

                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-foreground leading-none">{doc.label}</span>
                        {stateDoc.uploaded ? (
                          <span className="text-[10px] font-semibold text-success-text bg-success-bg px-2 py-0.5 rounded-full border border-success/10">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-destructive bg-destructive-bg px-2 py-0.5 rounded-full border border-destructive/10">
                            Missing
                          </span>
                        )}
                      </div>

                      {isUploading ? (
                        <div className="space-y-2 py-2">
                          <div className="flex justify-between text-[10px] text-primary font-semibold">
                            <span>{uploadPhase === 'compressing' ? 'Compressing...' : 'Uploading file...'}</span>
                            <span className="animate-pulse">Busy</span>
                          </div>
                          <div className="w-full bg-primary-light h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full animate-[shimmer_1.5s_infinite] w-3/4" />
                          </div>
                          {docErrors[doc.key] && (
                            <p className="text-[10px] text-destructive font-semibold">{docErrors[doc.key]}</p>
                          )}
                        </div>
                      ) : stateDoc.uploaded ? (
                        <div className="py-2">
                          <p className="text-xs font-semibold text-foreground truncate" title={stateDoc.name}>
                            {stateDoc.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Uploaded: {stateDoc.date}
                          </p>
                        </div>
                      ) : (
                        <div className="py-2 flex items-center justify-center text-center">
                          <p className="text-[11px] text-muted-foreground max-w-[120px] leading-snug">
                            No file attached. Upload to apply for courses.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons as requested:Upload/View/Download/Replace - use icons with styling */}
                    <div className="flex items-center gap-1.5 pt-3 border-t border-border mt-auto">
                      {stateDoc.uploaded ? (
                        <>
                          {/* View — opens signed URL in new tab */}
                          <a
                            href={stateDoc.signedUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              if (!stateDoc.signedUrl) {
                                e.preventDefault();
                                toast({ title: 'Document not available', description: 'Re-upload to view this document', variant: 'info' });
                              }
                            }}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            title="View Document"
                          >
                            <FileCheck size={14} />
                          </a>

                          {/* Download — fetches file from signed URL */}
                          <button
                            onClick={async () => {
                              if (!stateDoc.signedUrl) {
                                toast({ title: 'Document not available', description: 'Re-upload to download', variant: 'info' });
                                return;
                              }
                              try {
                                const response = await fetch(stateDoc.signedUrl);
                                const blob = await response.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = stateDoc.name || 'document';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                toast({ title: 'Download Complete', description: stateDoc.name, variant: 'success' });
                              } catch {
                                toast({ title: 'Download Failed', description: 'Could not download file', variant: 'error' });
                              }
                            }}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            title="Download"
                          >
                            <Download size={14} />
                          </button>

                          {/* Replace */}
                          <button
                            onClick={() => triggerUpload(doc.key)}
                            disabled={isUploading}
                            className="p-1.5 rounded-md hover:bg-primary-light text-primary hover:text-primary transition-colors shrink-0"
                            title="Replace Document"
                          >
                            <RefreshCw size={14} />
                          </button>

                          {/* Remove */}
                          <button
                            onClick={() => handleDeleteDoc(doc.key)}
                            className="p-1.5 rounded-md hover:bg-destructive-bg text-destructive hover:text-destructive transition-colors shrink-0 ml-auto"
                            title="Remove Document"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => triggerUpload(doc.key)}
                          disabled={isUploading}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-primary/30 hover:border-primary hover:bg-primary-light/50 text-xs font-semibold text-primary transition-all duration-200"
                        >
                          <Upload size={12} />
                          Upload File
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CHANGE PASSWORD (SPAN 1) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm self-start">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">{t.changePassword}</h3>
              <p className="text-xs text-muted-foreground">Cycle credentials regularly for enhanced database safety</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Current Password</label>
              <div className="relative">
                <input
                  type={showPass.current ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full text-sm px-3 py-2 bg-card border rounded-lg outline-none transition-all pr-10 ${
                    passwordErrors.current ? 'border-destructive focus:ring-destructive/10' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/30'
                  }`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle current password visibility"
                >
                  {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordErrors.current && (
                <p className="text-destructive text-[11px] font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  {passwordErrors.current}
                </p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">New Password</label>
              <div className="relative">
                <input
                  type={showPass.new ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full text-sm px-3 py-2 bg-card border rounded-lg outline-none transition-all pr-10 ${
                    passwordErrors.new ? 'border-destructive focus:ring-destructive/10' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/30'
                  }`}
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle new password visibility"
                >
                  {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordErrors.new && (
                <p className="text-destructive text-[11px] font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  {passwordErrors.new}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPass.confirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full text-sm px-3 py-2 bg-card border rounded-lg outline-none transition-all pr-10 ${
                    passwordErrors.confirm ? 'border-destructive focus:ring-destructive/10' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/30'
                  }`}
                  placeholder="Verify new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle confirm password visibility"
                >
                  {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordErrors.confirm && (
                <p className="text-destructive text-[11px] font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  {passwordErrors.confirm}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {passwordLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>

            <AnimatePresence>
              {passwordApiError && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-destructive-bg border border-destructive/20 text-destructive text-xs rounded-lg p-3 flex gap-2 items-start mt-2"
                >
                  <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                  <span>{passwordApiError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {passwordSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-success-bg border border-success/20 text-success-text text-xs rounded-lg p-3 flex gap-2 items-start mt-2"
                >
                  <CheckCircle2 size={16} className="text-success-text shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Password Updated!</span>
                    <p className="text-[10px] text-success-text mt-0.5">Your credentials have been changed successfully.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

      </div>
      <ConfirmDialog
        open={showRemovePhotoConfirm}
        onClose={() => setShowRemovePhotoConfirm(false)}
        onConfirm={handleRemovePhoto}
        title="Remove Profile Picture"
        description="Are you sure you want to remove your profile picture?"
        confirmLabel="Remove"
      />
      <ConfirmDialog
        open={!!deleteDocTarget}
        onClose={() => setDeleteDocTarget(null)}
        onConfirm={async () => {
          if (!deleteDocTarget) return;
          try {
            const res = await fetch(`/api/upload?documentType=${deleteDocTarget}`, { method: 'DELETE' });
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || 'Delete failed');
            }
            const nextDocs = { ...profile.documents };
            nextDocs[deleteDocTarget] = { uploaded: false, name: '', date: '' };
            updateProfile({ documents: nextDocs });
            toast({ title: 'Document Removed', description: 'Document deleted successfully', variant: 'success' });
          } catch (err: any) {
            toast({ title: 'Delete Failed', description: err.message || 'Could not remove document', variant: 'error' });
          }
          setDeleteDocTarget(null);
        }}
        title="Remove Document"
        description={`Are you sure you want to remove your uploaded ${deleteDocTarget === 'aadhaar' ? 'Aadhaar' : deleteDocTarget === 'pan' ? 'PAN' : 'Ration Card'} document?`}
        confirmLabel="Remove"
      />
    </motion.div>
  );
}
