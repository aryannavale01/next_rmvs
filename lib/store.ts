'use client';

/**
 * @deprecated This module stores data in localStorage as a client-side mirror
 * of server-side database data. This creates data duplication, sync issues,
 * and data loss risk (clearing browser data loses everything). All components
 * should use server API routes (e.g., /api/admin/*) for data operations.
 * This file is retained for backward compatibility only.
 */

export interface Course {
  id: string;
  title: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  location: string;
  startDate: string;
  endDate: string;
  seatsLeft: number;
  totalSeats: number;
  price: number; // 0 for free
    syllabus: { title: string; description?: string; duration: string; type: 'video' | 'quiz' | 'document' | 'practical'; isFreePreview?: boolean; content?: string; videoUrl?: string }[];
  instructor: { name: string; designation: string; rating: number; photo: string };
  description: string;
  longDescription: string;
}

export interface Application {
  id: string;
  courseId: string;
  courseTitle: string;
  appliedDate: string;
  status: 'Documents Under Verification' | 'Under Review' | 'Approved' | 'Course Completed';
  couponApplied?: string;
  discountAmount?: number;
  finalPrice?: number;
  documents: {
    aadhaar?: { name: string; date: string; recordId?: string };
    pan?: { name: string; date: string; recordId?: string };
    rationCard?: { name: string; date: string; recordId?: string };
  };
}

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  certificateNo: string;
  completionDate: string;
  status: 'pending' | 'accepted' | 'generated' | 'revoked';
  photoUrlHQ?: string;
  verificationCode?: string;
  verificationUrl?: string;
  memberName?: string;
  pdfStoragePath?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
  time: string;
  group: 'Today' | 'Yesterday' | 'Earlier';
  read: boolean;
  link?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'enrollment' | 'document' | 'coupon' | 'certificate' | 'profile';
  group: 'All' | 'Today' | 'This Week' | 'This Month';
}

export interface MyCourse {
  applicationId: string;
  courseId: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  mode: string;
  startDate: string | null;
  endDate: string | null;
  appliedDate: string;
  displayStatus: 'pending' | 'under_review' | 'not_started' | 'in_progress' | 'completed';
  progress: {
    percentComplete: number;
    totalDays: number;
    daysElapsed: number;
    daysRemaining: number;
  } | null;
  hasCertificate: boolean;
  certificateId: string | null;
}

export type DocumentStatus = 'not_uploaded' | 'pending' | 'verified' | 'rejected';

export interface DocumentInfo {
  recordId: string | null;
  uploaded: boolean;
  name: string | null;
  date: string | null;
  signedUrl: string | null;
  status: DocumentStatus;
  verifiedDate: string | null;
}

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  aadhaarNo: string;
  panNo: string;
  rationCardNo: string;
  photoUrl?: string;
  photoUrlHQ?: string;
  photoBlurDataUrl?: string;
  documents: {
    aadhaar: DocumentInfo;
    pan: DocumentInfo;
    rationCard: DocumentInfo;
  };
}

export const INITIAL_PROFILE: Profile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  aadhaarNo: '',
  panNo: '',
  rationCardNo: '',
  photoUrl: '',
  photoUrlHQ: '',
  photoBlurDataUrl: '',
  documents: {
    aadhaar: { recordId: null, uploaded: false, name: null, date: null, signedUrl: null, status: 'not_uploaded', verifiedDate: null },
    pan: { recordId: null, uploaded: false, name: null, date: null, signedUrl: null, status: 'not_uploaded', verifiedDate: null },
    rationCard: { recordId: null, uploaded: false, name: null, date: null, signedUrl: null, status: 'not_uploaded', verifiedDate: null }
  }
};

export function getStoredState() {
  if (typeof window === 'undefined') {
    return {
      profile: INITIAL_PROFILE,
      applications: [] as Application[],
      certificates: [] as Certificate[],
      notifications: [] as AppNotification[],
      activities: [] as Activity[],
      courses: [] as Course[],
      language: 'en'
    };
  }

  const profile = JSON.parse(localStorage.getItem('db_profile') || JSON.stringify(INITIAL_PROFILE));
  if (profile.photoUrl && profile.photoUrl.startsWith('/api/')) {
    profile.photoUrl = '';
  }
  if (profile.photoUrlHQ && profile.photoUrlHQ.startsWith('/api/')) {
    profile.photoUrlHQ = '';
  }
  const applications = JSON.parse(localStorage.getItem('db_applications') || '[]');
  const certificates = JSON.parse(localStorage.getItem('db_certificates') || '[]');
  const notifications = JSON.parse(localStorage.getItem('db_notifications') || '[]');
  const activities = JSON.parse(localStorage.getItem('db_activities') || '[]');
  const courses = JSON.parse(localStorage.getItem('db_courses') || '[]');
  const language = localStorage.getItem('db_language') || 'en';

  return { profile, applications, certificates, notifications, activities, courses, language };
}

export function saveStoredState(state: {
  profile?: Profile;
  applications?: Application[];
  certificates?: Certificate[];
  notifications?: AppNotification[];
  activities?: Activity[];
  courses?: Course[];
  language?: string;
}) {
  if (typeof window === 'undefined') return;

  if (state.profile) localStorage.setItem('db_profile', JSON.stringify(state.profile));
  if (state.applications) localStorage.setItem('db_applications', JSON.stringify(state.applications));
  if (state.certificates) localStorage.setItem('db_certificates', JSON.stringify(state.certificates));
  if (state.notifications) localStorage.setItem('db_notifications', JSON.stringify(state.notifications));
  if (state.activities) localStorage.setItem('db_activities', JSON.stringify(state.activities));
  if (state.courses) localStorage.setItem('db_courses', JSON.stringify(state.courses));
  if (state.language) localStorage.setItem('db_language', state.language);

  // Dispatch a storage event to keep tabs/components updated in real-time
  window.dispatchEvent(new Event('dashboard-state-update'));
}
