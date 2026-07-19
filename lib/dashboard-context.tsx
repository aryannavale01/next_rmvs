'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getStoredState,
  saveStoredState,
  Course,
  Application,
  Certificate,
  AppNotification,
  Activity,
  Profile
} from './store';
import { makeId, makeCertificateNo, getTodayIsoDate, getCurrentIsoString } from './purity-helpers';

interface DashboardContextType {
  profile: Profile;
  applications: Application[];
  certificates: Certificate[];
  notifications: AppNotification[];
  activities: Activity[];
  courses: Course[];
  language: 'en' | 'hi' | 'mr';
  updateProfile: (updated: Partial<Profile>) => void;
  applyToCourse: (
    courseId: string,
    couponCode?: string,
    discountAmount?: number,
    finalPrice?: number,
    docs?: { aadhaar?: string; pan?: string; rationCard?: string }
  ) => boolean;
  generateCertificate: (courseId: string) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  setLanguage: (lang: 'en' | 'hi' | 'mr') => void;
  addActivity: (title: string, description: string, type: Activity['type']) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Localized translation text helper
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
    searchCourse: "Search course...",
    category: "Category",
    level: "Level",
    all: "All",
    browse: "Browse Courses",
    myCourses: "My Courses",
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
    courseCompleted: "Course Completed",
    generateCert: "Generate Certificate",
    downloadCert: "Download Certificate",
    testimonial: "Review & Testimonial",
    couponCode: "Coupon Code",
    validate: "Validate",
    appliedSuccess: "Coupon applied successfully!",
    originalPrice: "Original Price",
    discount: "Discount",
    finalPrice: "Final Price",
    nowFree: "This course is now FREE!",
    uploadZone: "Drag & drop files here or click to upload",
    submitApplication: "Submit Course Application",
    noApplications: "No course applications found.",
    certificatesGenerated: "My Generated Certificates",
    eligibleCertificates: "Eligible for Certificate Generation",
    noCertificates: "No certificates available yet.",
    today: "Today",
    yesterday: "Yesterday",
    earlier: "Earlier",
    markAllRead: "Mark all as read",
    filterTab: "Filters",
    timeline: "Activity Log",
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
    searchCourse: "पाठ्यक्रम खोजें...",
    category: "श्रेणी",
    level: "स्तर",
    all: "सभी",
    browse: "पाठ्यक्रम देखें",
    myCourses: "मेरे पाठ्यक्रम",
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
    courseCompleted: "पाठ्यक्रम पूरा हुआ",
    generateCert: "प्रमाण पत्र बनाएं",
    downloadCert: "प्रमाण पत्र डाउनलोड करें",
    testimonial: "समीक्षा और प्रशंसापत्र",
    couponCode: "कूपन कोड",
    validate: "सत्यापित करें",
    appliedSuccess: "कूपन सफलतापूर्वक लागू किया गया!",
    originalPrice: "मूल मूल्य",
    discount: "छूट",
    finalPrice: "अंतिम मूल्य",
    nowFree: "यह पाठ्यक्रम अब मुफ़्त है!",
    uploadZone: "दस्तावेज़ यहाँ खींचें या अपलोड करने के लिए क्लिक करें",
    submitApplication: "पाठ्यक्रम के लिए आवेदन करें",
    noApplications: "कोई पाठ्यक्रम आवेदन नहीं मिला।",
    certificatesGenerated: "मेरे प्रमाण पत्र",
    eligibleCertificates: "प्रमाण पत्र बनाने के योग्य",
    noCertificates: "कोई प्रमाण पत्र अभी तक उपलब्ध नहीं है।",
    today: "आज",
    yesterday: "कल",
    earlier: "पहले",
    markAllRead: "सभी को पढ़ा हुआ चिह्नित करें",
    filterTab: "फ़िल्टर",
    timeline: "गतिविधि लॉग",
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
    searchCourse: "कोर्स शोधा...",
    category: "वर्ग",
    level: "स्तर",
    all: "सर्व",
    browse: "कोर्सेस पहा",
    myCourses: "माझे कोर्सेस",
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
    courseCompleted: "कोर्स पूर्ण झाला",
    generateCert: "प्रमाणपत्र तयार करा",
    downloadCert: "प्रमाणपत्र डाउनलोड करा",
    testimonial: "पुनरावलोकन आणि अभिप्राय",
    couponCode: "कूपन कोड",
    validate: "तपासणी करा",
    appliedSuccess: "कूपन यशस्वीरित्या लागू केले!",
    originalPrice: "मूळ किंमत",
    discount: "सवलत",
    finalPrice: "अंतिम किंमत",
    nowFree: "हा कोर्स आता मोफत आहे!",
    uploadZone: "दस्तऐवज येथे ड्रॅग करा किंवा अपलोड करण्यासाठी क्लिक करा",
    submitApplication: "कोर्ससाठी अर्ज करा",
    noApplications: "कोणतेही अर्ज आढळले नाहीत.",
    certificatesGenerated: "माझी प्रमाणपत्रे",
    eligibleCertificates: "प्रमाणपत्र मिळण्यास पात्र कोर्सेस",
    noCertificates: "अद्याप कोणतीही प्रमाणपत्रे उपलब्ध नाहीत.",
    today: "आज",
    yesterday: "काल",
    earlier: "पूर्वी",
    markAllRead: "सर्व वाचलेले म्हणून चिन्हांकित करा",
    filterTab: "फिल्टर",
    timeline: "कृतीचा इतिहास",
  }
};

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => getStoredState());

  useEffect(() => {
    const handleUpdate = () => {
      setState(getStoredState());
    };

    window.addEventListener('dashboard-state-update', handleUpdate);
    return () => {
      window.removeEventListener('dashboard-state-update', handleUpdate);
    };
  }, []);

  const updateProfile = (updated: Partial<Profile>) => {
    const nextProfile = { ...state.profile, ...updated };
    // update documents object based on uploaded state
    if (updated.documents) {
      nextProfile.documents = { ...state.profile.documents, ...updated.documents };
    }
    const nextState = { ...state, profile: nextProfile };
    setState(nextState);
    saveStoredState({ profile: nextProfile });
    addActivity('Updated Profile Details', 'Modified personal identification and contact info on profile.', 'profile');
  };

  const applyToCourse = (
    courseId: string,
    couponCode?: string,
    discountAmount = 0,
    finalPrice?: number,
    docs?: { aadhaar?: string; pan?: string; rationCard?: string }
  ): boolean => {
    const course = state.courses.find((c: Course) => c.id === courseId);
    if (!course) return false;

    // Check if already applied
    const alreadyApplied = state.applications.some((a: Application) => a.courseId === courseId);
    if (alreadyApplied) return false;

    const todayStr = getTodayIsoDate();
    // Add new application
    const newApp: Application = {
      id: makeId('app'),
      courseId,
      courseTitle: course.title,
      appliedDate: todayStr,
      status: 'Documents Under Verification',
      couponApplied: couponCode,
      discountAmount,
      finalPrice: finalPrice !== undefined ? finalPrice : course.price,
      documents: {
        aadhaar: docs?.aadhaar ? { name: docs.aadhaar, date: todayStr } : (state.profile.documents.aadhaar.uploaded ? { name: state.profile.documents.aadhaar.name, date: state.profile.documents.aadhaar.date } : undefined),
        pan: docs?.pan ? { name: docs.pan, date: todayStr } : (state.profile.documents.pan.uploaded ? { name: state.profile.documents.pan.name, date: state.profile.documents.pan.date } : undefined),
        rationCard: docs?.rationCard ? { name: docs.rationCard, date: todayStr } : undefined
      }
    };

    const nextApplications = [newApp, ...state.applications];
    
    // Decrement seatsLeft of course
    const nextCourses = state.courses.map((c: Course) => {
      if (c.id === courseId) {
        return { ...c, seatsLeft: Math.max(0, c.seatsLeft - 1) };
      }
      return c;
    });

    // Create custom notification
    const newNotif: AppNotification = {
      id: makeId('notif'),
      title: 'Application Received',
      description: `Your application for ${course.title} has been successfully submitted and is under verification.`,
      type: 'success',
      time: 'Just now',
      group: 'Today',
      read: false
    };

    const nextNotifs = [newNotif, ...state.notifications];

    setState(prev => ({
      ...prev,
      applications: nextApplications,
      courses: nextCourses,
      notifications: nextNotifs
    }));

    saveStoredState({
      applications: nextApplications,
      courses: nextCourses,
      notifications: nextNotifs
    });

    addActivity(
      `Applied for ${course.title}`,
      `Submitted course application form${couponCode ? ` with coupon ${couponCode} applied` : ''}.`,
      'enrollment'
    );

    return true;
  };

  const generateCertificate = (courseId: string) => {
    const course = state.courses.find((c: Course) => c.id === courseId);
    if (!course) return;

    // Check if already has a certificate
    const exists = state.certificates.some((c: Certificate) => c.courseId === courseId);
    if (exists) return;

    const newCert: Certificate = {
      id: makeId('cert'),
      courseId,
      courseTitle: course.title,
      certificateNo: makeCertificateNo(courseId),
      completionDate: getTodayIsoDate(),
      status: 'generated'
    };

    const nextCertificates = [newCert, ...state.certificates];

    // Create notification
    const newNotif: AppNotification = {
      id: makeId('notif'),
      title: 'Certificate Generated Successfully',
      description: `Your digital certificate for ${course.title} has been compiled and is ready for download.`,
      type: 'success',
      time: 'Just now',
      group: 'Today',
      read: false
    };

    const nextNotifs = [newNotif, ...state.notifications];

    // Update application status to Course Completed if enrolled
    const nextApplications = state.applications.map((a: Application) => {
      if (a.courseId === courseId) {
        return { ...a, status: 'Course Completed' as const };
      }
      return a;
    });

    setState(prev => ({
      ...prev,
      certificates: nextCertificates,
      notifications: nextNotifs,
      applications: nextApplications
    }));

    saveStoredState({
      certificates: nextCertificates,
      notifications: nextNotifs,
      applications: nextApplications
    });

    addActivity(
      `Generated Certificate`,
      `Created legal completion certificate for ${course.title}.`,
      'certificate'
    );
  };

  const markAllAsRead = () => {
    const nextNotifs = state.notifications.map((n: AppNotification) => ({ ...n, read: true }));
    setState(prev => ({ ...prev, notifications: nextNotifs }));
    saveStoredState({ notifications: nextNotifs });
  };

  const markAsRead = (id: string) => {
    const nextNotifs = state.notifications.map((n: AppNotification) => n.id === id ? { ...n, read: true } : n);
    setState(prev => ({ ...prev, notifications: nextNotifs }));
    saveStoredState({ notifications: nextNotifs });
  };

  const setLanguage = (lang: 'en' | 'hi' | 'mr') => {
    setState(prev => ({ ...prev, language: lang }));
    saveStoredState({ language: lang });
  };

  const addActivity = (title: string, description: string, type: Activity['type']) => {
    const newActivity: Activity = {
      id: makeId('act'),
      title,
      description,
      time: getCurrentIsoString(),
      type,
      group: 'Today'
    };

    const nextActivities = [newActivity, ...state.activities];
    setState(prev => ({ ...prev, activities: nextActivities }));
    saveStoredState({ activities: nextActivities });
  };

  return (
    <DashboardContext.Provider
      value={{
        ...state,
        language: state.language as 'en' | 'hi' | 'mr',
        updateProfile,
        applyToCourse,
        generateCertificate,
        markAllAsRead,
        markAsRead,
        setLanguage,
        addActivity
      }}
    >
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
