'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import useSWR from 'swr';
import { fetcher, SWR_DEFAULTS } from './swr-fetcher';
import {
  getStoredState,
  saveStoredState,
  Course,
  Application,
  Certificate,
  AppNotification,
  Activity,
  Profile,
  INITIAL_PROFILE,
} from './store';
import { makeId, makeCertificateNo, getTodayIsoDate, getCurrentIsoString } from './purity-helpers';

interface DashboardResponse {
  applications: Application[];
  certificates: Certificate[];
  notifications: AppNotification[];
  activities: Activity[];
}

interface CoursesResponse {
  courses: Course[];
}

interface DashboardContextType {
  profile: Profile;
  applications: Application[];
  certificates: Certificate[];
  notifications: AppNotification[];
  activities: Activity[];
  courses: Course[];
  language: 'en' | 'hi' | 'mr';
  loading: boolean;
  error: { dashboard?: string; courses?: string } | null;
  updateProfile: (updated: Partial<Profile>) => Promise<void>;
  applyToCourse: (
    courseId: string,
    couponCode?: string,
    discountAmount?: number,
    finalPrice?: number,
    docs?: { aadhaar?: { name?: string; recordId?: string }; pan?: { name?: string; recordId?: string }; rationCard?: { name?: string; recordId?: string } }
  ) => Promise<boolean>;
  generateCertificate: (courseId: string) => void;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  setLanguage: (lang: 'en' | 'hi' | 'mr') => void;
  addActivity: (title: string, description: string, type: Activity['type']) => void;
  resetDashboard: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const TRANSLATIONS = {
  en: {
    dashboard: "Dashboard",
    myProfile: "My Profile",
    training: "Training",
    applications: "Applications",
    certificates: "Certificates",
    notifications: "Notifications",
    activity: "Activity",
    language: "Language",
    logout: "Logout",
    welcome: "Welcome back",
    saveChanges: "Save Changes",
    personalInfo: "Personal Information",
    identityDocs: "Identity Documents",
    changePassword: "Change Password",
    searchCourse: "Search training...",
    category: "Category",
    level: "Level",
    all: "All",
    browse: "Browse Training",
    myCourses: "My Trainings",
    viewDetails: "View Details",
    enrolled: "Enrolled",
    completed: "Completed",
    dropped: "Dropped",
    seatsLeft: "seats left",
    soldOut: "Sold Out",
    free: "Free",
    back: "Back",
    teacherInfo: "Instructor",
    syllabus: "Syllabus",
    documentsVerified: "Documents Under Verification",
    underReview: "Under Review",
    approved: "Approved",
    courseCompleted: "Training Completed",
    generateCert: "Generate Certificate",
    downloadCert: "Download Certificate",
    testimonial: "Review & Testimonial",
    couponCode: "Coupon Code",
    validate: "Validate",
    appliedSuccess: "Coupon applied successfully!",
    originalPrice: "Original Price",
    discount: "Discount",
    finalPrice: "Final Price",
    nowFree: "This training is now FREE!",
    uploadZone: "Drag & drop files here or click to upload",
    submitApplication: "Submit Training Application",
    noApplications: "No training applications found.",
    certificatesGenerated: "My Generated Certificates",
    eligibleCertificates: "Eligible for Certificate Generation",
    noCertificates: "No certificates available yet.",
    today: "Today",
    yesterday: "Yesterday",
    earlier: "Earlier",
    markAllRead: "Mark all as read",
    filterTab: "Filters",
    timeline: "Activity Log",
    profileComplete: "Profile Complete",
    completeProfile: "Complete Profile",
    upcomingTraining: "Upcoming Training",
    noUpcomingTraining: "No upcoming training enrollments.",
    browseTraining: "Browse Training",
    certificatePreview: "Certificate Preview",
    certificateOfCompletion: "Certificate of Completion",
    recipientName: "Recipient",
    certificateId: "Certificate ID",
    issueDate: "Issue Date",
    allFieldsComplete: "All fields complete!",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    myProfile: "मेरी प्रोफ़ाइल",
    training: "प्रशिक्षण",
    applications: "आवेदन",
    certificates: "प्रमाण पत्र",
    notifications: "सूचनाएं",
    activity: "गतिविधि",
    language: "भाषा",
    logout: "लॉगआउट",
    welcome: "स्वागत है",
    saveChanges: "परिवर्तन सहेजें",
    personalInfo: "व्यक्तिगत जानकारी",
    identityDocs: "पहचान दस्तावेज",
    changePassword: "पासवर्ड बदलें",
    searchCourse: "प्रशिक्षण खोजें...",
    category: "श्रेणी",
    level: "स्तर",
    all: "सभी",
    browse: "प्रशिक्षण देखें",
    myCourses: "मेरे प्रशिक्षण",
    viewDetails: "विवरण देखें",
    enrolled: "नामांकित",
    completed: "पूर्ण",
    dropped: "छोड़ दिया",
    seatsLeft: "सीटें बची हैं",
    soldOut: "पूरी भरी हुई",
    free: "निःशुल्क",
    back: "पीछे जाएं",
    teacherInfo: "प्रशिक्षक",
    syllabus: "पाठ्यक्रम",
    documentsVerified: "दस्तावेज़ सत्यापन के अधीन",
    underReview: "समीक्षा के अधीन",
    approved: "स्वीकृत",
    courseCompleted: "प्रशिक्षण पूरा हुआ",
    generateCert: "प्रमाण पत्र बनाएं",
    downloadCert: "प्रमाण पत्र डाउनलोड करें",
    testimonial: "समीक्षा और प्रशंसापत्र",
    couponCode: "कूपन कोड",
    validate: "सत्यापित करें",
    appliedSuccess: "कूपन सफलतापूर्वक लागू किया गया!",
    originalPrice: "मूल मूल्य",
    discount: "छूट",
    finalPrice: "अंतिम मूल्य",
    nowFree: "यह प्रशिक्षण अब मुफ़्त है!",
    uploadZone: "दस्तावेज़ यहाँ खींचें या अपलोड करने के लिए क्लिक करें",
    submitApplication: "प्रशिक्षण के लिए आवेदन करें",
    noApplications: "कोई प्रशिक्षण आवेदन नहीं मिला।",
    certificatesGenerated: "मेरे प्रमाण पत्र",
    eligibleCertificates: "प्रमाण पत्र बनाने के योग्य",
    noCertificates: "कोई प्रमाण पत्र अभी तक उपलब्ध नहीं है।",
    today: "आज",
    yesterday: "कल",
    earlier: "पहले",
    markAllRead: "सभी को पढ़ा हुआ चिह्नित करें",
    filterTab: "फ़िल्टर",
    timeline: "गतिविधि लॉग",
    profileComplete: "प्रोफ़ाइल पूर्ण",
    completeProfile: "प्रोफ़ाइल पूर्ण करें",
    upcomingTraining: "आगामी प्रशिक्षण",
    noUpcomingTraining: "कोई आगामी प्रशिक्षण नामांकन नहीं।",
    browseTraining: "प्रशिक्षण देखें",
    certificatePreview: "प्रमाण पत्र पूर्वावलोकन",
    certificateOfCompletion: "पूर्णता प्रमाण पत्र",
    recipientName: "प्राप्तकर्ता",
    certificateId: "प्रमाण पत्र आईडी",
    issueDate: "जारी करने की तिथि",
    allFieldsComplete: "सभी फ़ील्ड पूर्ण!",
  },
  mr: {
    dashboard: "डॅशबोर्ड",
    myProfile: "माझी प्रोफाइल",
    training: "प्रशिक्षण",
    applications: "अर्ज",
    certificates: "प्रमाणपत्रे",
    notifications: "सूचना",
    activity: "प्रक्रिया",
    language: "भाषा",
    logout: "लॉगआउट",
    welcome: "स्वागत आहे",
    saveChanges: "बदल जतन करा",
    personalInfo: "वैयक्तिक माहिती",
    identityDocs: "ओळख दस्तऐवज",
    changePassword: "पासवर्ड बदला",
    searchCourse: "प्रशिक्षण शोधा...",
    category: "वर्ग",
    level: "स्तर",
    all: "सर्व",
    browse: "प्रशिक्षण पहा",
    myCourses: "माझे प्रशिक्षण",
    viewDetails: "तपशील पहा",
    enrolled: "प्रवेशित",
    completed: "पूर्ण झाले",
    dropped: "सोडले",
    seatsLeft: "जागा शिल्लक",
    soldOut: "सर्व जागा भरल्या",
    free: "मोफत",
    back: "मागे",
    teacherInfo: "प्रशिक्षक",
    syllabus: "अभ्यासक्रम",
    documentsVerified: "दस्तऐवज पडताळणी अंतर्गत",
    underReview: "पुनरावलोकना अंतर्गत",
    approved: "मंजूर",
    courseCompleted: "प्रशिक्षण पूर्ण झाला",
    generateCert: "प्रमाणपत्र तयार करा",
    downloadCert: "प्रमाणपत्र डाउनलोड करा",
    testimonial: "पुनरावलोकन आणि अभिप्राय",
    couponCode: "कूपन कोड",
    validate: "तपासणी करा",
    appliedSuccess: "कूपन यशस्वीरित्या लागू केले!",
    originalPrice: "मूळ किंमत",
    discount: "सवलत",
    finalPrice: "अंतिम किंमत",
    nowFree: "हे प्रशिक्षण आता मोफत आहे!",
    uploadZone: "दस्तऐवज येथे ड्रॅग करा किंवा अपलोड करण्यासाठी क्लिक करा",
    submitApplication: "प्रशिक्षणासाठी अर्ज करा",
    noApplications: "कोणतेही प्रशिक्षण अर्ज आढळले नाहीत.",
    certificatesGenerated: "माझी प्रमाणपत्रे",
    eligibleCertificates: "प्रमाणपत्र मिळण्यास पात्र प्रशिक्षण",
    noCertificates: "अद्याप कोणतीही प्रमाणपत्रे उपलब्ध नाहीत.",
    today: "आज",
    yesterday: "काल",
    earlier: "पूर्वी",
    markAllRead: "सर्व वाचलेले म्हणून चिन्हांकित करा",
    filterTab: "फिल्टर",
    timeline: "कृतीचा इतिहास",
    profileComplete: "प्रोफाइल पूर्ण",
    completeProfile: "प्रोफाइल पूर्ण करा",
    upcomingTraining: "आगामी प्रशिक्षण",
    noUpcomingTraining: "कोणतीही आगामी प्रशिक्षण नावांकन नाही.",
    browseTraining: "प्रशिक्षण पहा",
    certificatePreview: "प्रमाणपत्र पूर्वावलोकन",
    certificateOfCompletion: "पूर्णता प्रमाणपत्र",
    recipientName: "प्राप्तकर्ता",
    certificateId: "प्रमाणपत्र आयडी",
    issueDate: "जारी करण्याची तारीख",
    allFieldsComplete: "सर्व फील्ड पूर्ण!",
  }
};

export function DashboardProvider({ children }: { children: ReactNode }) {
  const initialStored = useMemo(() => getStoredState(), []);

  const [language, setLanguageState] = useState<'en' | 'hi' | 'mr'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('db_language') as 'en' | 'hi' | 'mr') || 'en';
    }
    return 'en';
  });

  const dashboardSWR = useSWR<DashboardResponse>('/api/dashboard', fetcher, SWR_DEFAULTS);
  const coursesSWR = useSWR<CoursesResponse>('/api/dashboard/courses', fetcher, SWR_DEFAULTS);
  const profileSWR = useSWR<Profile>('/api/profile', fetcher, SWR_DEFAULTS);

  const isLoadingAll = dashboardSWR.isLoading && coursesSWR.isLoading && profileSWR.isLoading;

  const profile = useMemo((): Profile => {
    if (profileSWR.data) {
      return {
        ...initialStored.profile,
        ...profileSWR.data,
        photoUrl: profileSWR.data.photoUrl || initialStored.profile.photoUrl,
        photoUrlHQ: profileSWR.data.photoUrlHQ || initialStored.profile.photoUrlHQ,
        photoBlurDataUrl: profileSWR.data.photoBlurDataUrl || initialStored.profile.photoBlurDataUrl,
        documents: {
          ...initialStored.profile.documents,
          ...profileSWR.data.documents,
        },
      };
    }
    return initialStored.profile;
  }, [profileSWR.data, initialStored.profile]);

  const applications = useMemo((): Application[] => {
    return dashboardSWR.data?.applications ?? initialStored.applications;
  }, [dashboardSWR.data, initialStored.applications]);

  const certificates = useMemo((): Certificate[] => {
    return dashboardSWR.data?.certificates ?? initialStored.certificates;
  }, [dashboardSWR.data, initialStored.certificates]);

  const notifications = useMemo((): AppNotification[] => {
    return dashboardSWR.data?.notifications ?? initialStored.notifications;
  }, [dashboardSWR.data, initialStored.notifications]);

  const activities = useMemo((): Activity[] => {
    return dashboardSWR.data?.activities ?? initialStored.activities;
  }, [dashboardSWR.data, initialStored.activities]);

  const courses = useMemo((): Course[] => {
    return coursesSWR.data?.courses ?? initialStored.courses;
  }, [coursesSWR.data, initialStored.courses]);

  const error = useMemo(() => {
    if (dashboardSWR.error || coursesSWR.error) {
      return {
        dashboard: dashboardSWR.error ? 'Failed to load dashboard data.' : undefined,
        courses: coursesSWR.error ? 'Failed to load training data.' : undefined,
      };
    }
    return null;
  }, [dashboardSWR.error, coursesSWR.error]);

  const updateProfile = useCallback(async (updated: Partial<Profile>) => {
    const merged = { ...profile, ...updated };
    if (updated.documents) {
      merged.documents = { ...profile.documents, ...updated.documents };
    }

    profileSWR.mutate(
      (current) => ({
        ...(current ?? INITIAL_PROFILE),
        ...updated,
        documents: updated.documents ? { ...(current ?? INITIAL_PROFILE).documents, ...updated.documents } : (current ?? INITIAL_PROFILE).documents,
      }),
      { revalidate: false }
    );
    saveStoredState({ profile: merged });

    const hasPersonalFields = 'firstName' in updated || 'lastName' in updated || 'email' in updated || 'phone' in updated || 'aadhaarNo' in updated || 'panNo' in updated || 'rationCardNo' in updated;
    if (hasPersonalFields) {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to save profile' }));
        throw new Error(err.error || 'Failed to save profile');
      }
      const serverProfile = await res.json();
      profileSWR.mutate(serverProfile, { revalidate: false });
      saveStoredState({ profile: serverProfile });
    }
  }, [profile, profileSWR]);

  const applyToCourse = useCallback(async (
    courseId: string,
    couponCode?: string,
    _discountAmount = 0,
    _finalPrice?: number,
    docs?: { aadhaar?: { name?: string; recordId?: string }; pan?: { name?: string; recordId?: string }; rationCard?: { name?: string; recordId?: string } }
  ): Promise<boolean> => {
    const course = courses.find((c: Course) => c.id === courseId);
    if (!course) return false;

    const alreadyApplied = applications.some((a: Application) => a.courseId === courseId);
    if (alreadyApplied) return false;

    const todayStr = getTodayIsoDate();
    const profileDocAadhaar = profile.documents.aadhaar;
    const profileDocPan = profile.documents.pan;
    const profileDocRation = profile.documents.rationCard;

    const serverDocuments: Record<string, { name: string; date: string; recordId?: string }> = {};
    if (docs?.aadhaar?.recordId) {
      serverDocuments.aadhaar = { name: docs.aadhaar.name || profileDocAadhaar.name || 'aadhaar', date: todayStr, recordId: docs.aadhaar.recordId };
    } else if (profileDocAadhaar.uploaded && profileDocAadhaar.recordId) {
      serverDocuments.aadhaar = { name: profileDocAadhaar.name || 'aadhaar', date: profileDocAadhaar.date || todayStr, recordId: profileDocAadhaar.recordId };
    }
    if (docs?.pan?.recordId) {
      serverDocuments.pan = { name: docs.pan.name || profileDocPan.name || 'pan', date: todayStr, recordId: docs.pan.recordId };
    } else if (profileDocPan.uploaded && profileDocPan.recordId) {
      serverDocuments.pan = { name: profileDocPan.name || 'pan', date: profileDocPan.date || todayStr, recordId: profileDocPan.recordId };
    }
    if (docs?.rationCard?.recordId) {
      serverDocuments.rationCard = { name: docs.rationCard.name || profileDocRation.name || 'rationCard', date: todayStr, recordId: docs.rationCard.recordId };
    } else if (profileDocRation.uploaded && profileDocRation.recordId) {
      serverDocuments.rationCard = { name: profileDocRation.name || 'rationCard', date: profileDocRation.date || todayStr, recordId: profileDocRation.recordId };
    }

    const optimisticApp: Application = {
      id: makeId('app'),
      courseId,
      courseTitle: course.title,
      appliedDate: todayStr,
      status: 'Documents Under Verification',
      couponApplied: couponCode,
      discountAmount: _discountAmount,
      finalPrice: _finalPrice !== undefined ? _finalPrice : course.price,
      documents: {
        aadhaar: serverDocuments.aadhaar ? { name: serverDocuments.aadhaar.name, date: serverDocuments.aadhaar.date, recordId: serverDocuments.aadhaar.recordId } : undefined,
        pan: serverDocuments.pan ? { name: serverDocuments.pan.name, date: serverDocuments.pan.date, recordId: serverDocuments.pan.recordId } : undefined,
        rationCard: serverDocuments.rationCard ? { name: serverDocuments.rationCard.name, date: serverDocuments.rationCard.date, recordId: serverDocuments.rationCard.recordId } : undefined,
      },
    };

    dashboardSWR.mutate(
      (current) => ({
        applications: [optimisticApp, ...(current?.applications ?? [])],
        certificates: current?.certificates ?? [],
        notifications: current?.notifications ?? [],
        activities: current?.activities ?? [],
      }),
      { revalidate: false }
    );

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, couponCode: couponCode || undefined, documents: Object.keys(serverDocuments).length > 0 ? serverDocuments : undefined }),
      });

      if (!res.ok) {
        dashboardSWR.mutate();
        return false;
      }

      dashboardSWR.mutate();
      coursesSWR.mutate();
      return true;
    } catch {
      dashboardSWR.mutate();
      return false;
    }
  }, [courses, applications, profile, dashboardSWR, coursesSWR]);

  const generateCertificate = useCallback((courseId: string) => {
    const course = courses.find((c: Course) => c.id === courseId);
    if (!course) return;

    const exists = certificates.some((c: Certificate) => c.courseId === courseId);
    if (exists) return;

    const newCert: Certificate = {
      id: makeId('cert'),
      courseId,
      courseTitle: course.title,
      certificateNo: makeCertificateNo(courseId),
      completionDate: getTodayIsoDate(),
      status: 'generated',
      photoUrlHQ: profile.photoUrlHQ || undefined,
    };

    const newNotif: AppNotification = {
      id: makeId('notif'),
      title: 'Certificate Generated Successfully',
      description: `Your digital certificate for ${course.title} has been compiled and is ready for download.`,
      type: 'success',
      time: 'Just now',
      group: 'Today',
      read: false,
    };

    dashboardSWR.mutate(
      (current) => ({
        certificates: [newCert, ...(current?.certificates ?? [])],
        notifications: [newNotif, ...(current?.notifications ?? [])],
        applications: (current?.applications ?? []).map((a: Application) => a.courseId === courseId ? { ...a, status: 'Course Completed' as const } : a),
        activities: current?.activities ?? [],
      }),
      { revalidate: false }
    );
  }, [courses, certificates, profile.photoUrlHQ, dashboardSWR]);

  const markAsRead = useCallback(async (id: string) => {
    dashboardSWR.mutate(
      (current) => ({
        applications: current?.applications ?? [],
        certificates: current?.certificates ?? [],
        notifications: (current?.notifications ?? []).map(n => n.id === id ? { ...n, read: true } : n),
        activities: current?.activities ?? [],
      }),
      { revalidate: false }
    );

    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });

      if (!res.ok) {
        dashboardSWR.mutate();
        return;
      }

      dashboardSWR.mutate();
    } catch {
      dashboardSWR.mutate();
    }
  }, [dashboardSWR]);

  const markAllAsRead = useCallback(async () => {
    dashboardSWR.mutate(
      (current) => ({
        applications: current?.applications ?? [],
        certificates: current?.certificates ?? [],
        notifications: (current?.notifications ?? []).map(n => ({ ...n, read: true })),
        activities: current?.activities ?? [],
      }),
      { revalidate: false }
    );

    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });

      if (!res.ok) {
        dashboardSWR.mutate();
        return;
      }

      dashboardSWR.mutate();
    } catch {
      dashboardSWR.mutate();
    }
  }, [dashboardSWR]);

  const setLanguage = useCallback((lang: 'en' | 'hi' | 'mr') => {
    setLanguageState(lang);
    localStorage.setItem('db_language', lang);
  }, []);

  const addActivity = useCallback((title: string, description: string, type: Activity['type']) => {
    const newActivity: Activity = {
      id: makeId('act'),
      title,
      description,
      time: getCurrentIsoString(),
      type,
      group: 'Today',
    };

    dashboardSWR.mutate(
      (current) => ({
        applications: current?.applications ?? [],
        certificates: current?.certificates ?? [],
        notifications: current?.notifications ?? [],
        activities: [newActivity, ...(current?.activities ?? [])],
      }),
      { revalidate: false }
    );
  }, [dashboardSWR]);

  const resetDashboard = useCallback(() => {
    const keys = ['db_profile', 'db_applications', 'db_certificates', 'db_notifications', 'db_activities', 'db_courses', 'db_language'];
    keys.forEach((key) => localStorage.removeItem(key));
    setLanguageState('en');
    dashboardSWR.mutate();
    coursesSWR.mutate();
    profileSWR.mutate();
  }, [dashboardSWR, coursesSWR, profileSWR]);

  const value = useMemo(() => ({
    profile,
    applications,
    certificates,
    notifications,
    activities,
    courses,
    language,
    loading: isLoadingAll,
    error,
    updateProfile,
    applyToCourse,
    generateCertificate,
    markAllAsRead,
    markAsRead,
    setLanguage,
    addActivity,
    resetDashboard,
  }), [
    profile, applications, certificates, notifications, activities, courses,
    language, isLoadingAll, error,
    updateProfile, applyToCourse, generateCertificate,
    markAllAsRead, markAsRead, setLanguage, addActivity, resetDashboard,
  ]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
