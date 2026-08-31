export interface Member {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  category: string | null;
  qualification: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'blocked' | 'deleted';
  assignedVolunteer: string | null;
  createdAt: string;
  profileImage: string | null;
}

export interface Teacher {
  id: string;
  fullName: string;
  profilePhoto: string | null;
  designation: string;
  qualification: string | null;
  specializations: string[];
  experienceYears: number | null;
  email: string;
  mobile: string;
  village: string | null;
  taluka: string | null;
  district: string | null;
  state: string;
  pincode: string | null;
  status: 'active' | 'inactive' | 'on_leave' | 'resigned' | 'deleted';
  teacherType: 'trainer' | 'volunteer' | 'guest_faculty';
  joinedDate: string;
  lastUpdated: string;
  aadhaar: string | null;
  pan: string | null;
  bankAccount: string | null;
  totalStudents: number;
  certifications: number;
  bio: string | null;
  createdAt: string;
}

export interface TeacherDetail extends Teacher {
  documents: {
    id: string;
    type: string;
    label: string;
    status: string;
    uploadedDate: string | null;
    createdAt: string | null;
  }[];
  courses: {
    id: string;
    batch: string | null;
    startDate: string | null;
    endDate: string | null;
    totalStudents: number;
    completionRate: number;
    status: string;
    course: { id: string; title: string } | null;
  }[];
}

export interface SyllabusLesson {
  id: string;
  title: string;
  type: 'Video' | 'Text' | 'Quiz' | 'Assignment';
  duration: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiresAt: string | null;
  validFrom: string | null;
  maxUses: number | null;
  usedCount: number;
  perUserLimit: number | null;
  minAmount: number | null;
  courseId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCourse {
  id: string;
  title: string;
  category: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  location: string;
  teacher_id: string;
  start_date: string;
  end_date: string;
  duration: string;
  seats_total: number;
  seats_enrolled: number;
  access_code_required: boolean;
  auto_approve: boolean;
  price: number;
  currency: string;
  coupons: Coupon[];
  required_docs: string[];
  syllabus: SyllabusLesson[];
  status: 'Draft' | 'Published';
  meta_description: string;
  benefits: string[];
  eligibility: string;
}

export interface Enrollment {
  id: string;
  member_id: string;
  course_id: string;
  enrolled_date: string;
  status: 'Enrolled' | 'Completed' | 'Dropped' | 'Pending';
  doc_verified: boolean;
  admin_notes: string;
}

export interface AdminCertificate {
  id: string;
  course_id: string;
  member_id: string;
  certificate_no: string;
  issue_date: string;
  status: 'generated' | 'accepted' | 'pending';
}

export interface AdminNotification {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: string;
  created_at: string;
}

export interface AdminActivityLog {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export interface WebsiteItem {
  id: string;
  title: string;
  description?: string;
  image?: string;
  visibility: 'Homepage Only' | 'Programs Page Only' | 'Both Pages';
  details?: string;
}

export interface WebsiteContent {
  courses: WebsiteItem[];
  programs: WebsiteItem[];
  leadership: WebsiteItem[];
  testimonials: WebsiteItem[];
  contact_social: {
    address: string;
    email: string;
    phone: string;
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
  };
  gallery: WebsiteItem[];
  resources: WebsiteItem[];
  locations: WebsiteItem[];
}

export interface GeneralSettings {
  siteName: string;
  description: string;
  logo: string;
  timezone: string;
  language: string;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass?: string;
  senderName: string;
  senderEmail: string;
  notifNewRegistration: boolean;
  notifApplication: boolean;
  notifCertificate: boolean;
}

export interface SecuritySettings {
  pwMinLength: number;
  pwRequiresSpecial: boolean;
  pwRequiresNumber: boolean;
  pwRequiresUppercase: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enable2FA: boolean;
}

export interface AppearanceSettings {
  theme: 'Light' | 'Dark' | 'System';
  brandColor: string;
  sidebarCollapsedDefault: boolean;
  fontSize: 'Small' | 'Medium' | 'Large';
}

export interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  autoBackup: boolean;
  backupFrequency: 'Daily' | 'Weekly' | 'Monthly';
  backupRetention: number;
}

export interface AdminSettings {
  general: GeneralSettings;
  email: EmailSettings;
  security: SecuritySettings;
  appearance: AppearanceSettings;
  system: SystemSettings;
}

export interface AdminUser {
  username: string;
  email: string;
}

export interface AdminState {
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
}
