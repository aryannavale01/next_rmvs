'use client';

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
  syllabus: { title: string; duration: string; type: 'video' | 'quiz' | 'document' | 'practical'; isFreePreview?: boolean }[];
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
    aadhaar?: { name: string; date: string };
    pan?: { name: string; date: string };
    rationCard?: { name: string; date: string };
  };
}

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  certificateNo: string;
  completionDate: string;
  status: 'pending' | 'accepted' | 'generated';
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
  time: string;
  group: 'Today' | 'Yesterday' | 'Earlier';
  read: boolean;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'enrollment' | 'document' | 'coupon' | 'certificate' | 'profile';
  group: 'All' | 'Today' | 'This Week' | 'This Month';
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
  documents: {
    aadhaar: { uploaded: boolean; name: string; date: string };
    pan: { uploaded: boolean; name: string; date: string };
    rationCard: { uploaded: boolean; name: string; date: string };
  };
}

// Initial Mock Data
export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Pradhan Mantri Kaushal Vikas Yojana - IT Helpdesk Associate',
    category: 'Technology',
    level: 'Beginner',
    duration: '12 Weeks',
    mode: 'Hybrid',
    location: 'National Skill Center, Mumbai',
    startDate: '2026-08-01',
    endDate: '2026-10-24',
    seatsLeft: 5,
    totalSeats: 30,
    price: 0,
    instructor: {
      name: 'Dr. Ramesh Patil',
      designation: 'Senior IT Consultant & Skill Trainer',
      rating: 4.8,
      photo: 'https://picsum.photos/seed/ramesh/150/150'
    },
    description: 'Learn foundational IT support skills, operating system maintenance, troubleshooting, and basic network administration under the PMKVY scheme.',
    longDescription: 'This comprehensive certification program is designed to equip students with critical skills required for entry-level roles in tech support, helpdesk coordination, and client-facing IT assistance. Supported directly by national skill initiatives, it provides hands-on practical experience, real-world case studies, and a direct pipeline to local placement networks.',
    syllabus: [
      { title: 'Introduction to Operating Systems and Hardware', duration: '2 Hours', type: 'video', isFreePreview: true },
      { title: 'Troubleshooting Common OS & Application Failures', duration: '3 Hours', type: 'video', isFreePreview: true },
      { title: 'Practical Lab: Networking Basics and LAN Diagnostics', duration: '4 Hours', type: 'practical' },
      { title: 'Module 1 Assessment', duration: '1 Hour', type: 'quiz' },
      { title: 'Customer Support Communication & Helpdesk Ticketing Tools', duration: '3 Hours', type: 'video' },
      { title: 'Final Project: Resolving Real-time Network Incident Scenarios', duration: '5 Hours', type: 'practical' }
    ]
  },
  {
    id: 'course-2',
    title: 'Deen Dayal Upadhyaya Grameen Kaushalya Yojana - Full Stack Web Development',
    category: 'Skill Dev',
    level: 'Intermediate',
    duration: '16 Weeks',
    mode: 'Online',
    location: 'Virtual Classroom (Mumbai Hub)',
    startDate: '2026-08-15',
    endDate: '2026-12-05',
    seatsLeft: 12,
    totalSeats: 50,
    price: 4999,
    instructor: {
      name: 'Sanjay Deshmukh',
      designation: 'Lead Software Engineer & Mentor',
      rating: 4.9,
      photo: 'https://picsum.photos/seed/sanjay/150/150'
    },
    description: 'Master HTML, CSS, JavaScript, React, and Node.js with database integrations. Includes live mentor feedback and portfolio assistance.',
    longDescription: 'Prepare for high-demand software engineering jobs with our rural development skill training initiative. From core UI styling with modern frameworks to back-end RESTful API designs, database management, and deployment techniques, this course takes you from beginner to job-ready full stack web developer.',
    syllabus: [
      { title: 'Web Architectures & HTML5/CSS3 Semantic Styling', duration: '3 Hours', type: 'video', isFreePreview: true },
      { title: 'JavaScript Essentials: Arrays, Objects & Async Programming', duration: '4 Hours', type: 'video', isFreePreview: true },
      { title: 'React Fundamentals & State Management Hooks', duration: '5 Hours', type: 'video' },
      { title: 'React Performance Assessment', duration: '1.5 Hours', type: 'quiz' },
      { title: 'Backend APIs with Node.js and Express Frameworks', duration: '6 Hours', type: 'practical' },
      { title: 'Relational Database Queries & Drizzle ORM Integrations', duration: '4 Hours', type: 'video' },
      { title: 'Capped Portfolio Project: Production E-commerce App', duration: '8 Hours', type: 'practical' }
    ]
  },
  {
    id: 'course-3',
    title: 'National Skill Development - Solar Panel Installation & Maintenance',
    category: 'Skill Dev',
    level: 'Beginner',
    duration: '8 Weeks',
    mode: 'Offline',
    location: 'Green Energy Hub, Pune',
    startDate: '2026-09-01',
    endDate: '2026-10-26',
    seatsLeft: 0,
    totalSeats: 25,
    price: 1500,
    instructor: {
      name: 'Anjali Bhore',
      designation: 'Renewable Systems Engineer',
      rating: 4.7,
      photo: 'https://picsum.photos/seed/anjali/150/150'
    },
    description: 'Learn site analysis, safety procedures, electrical wiring, inverter configuration, and maintenance of solar photovoltaic systems.',
    longDescription: 'This physical laboratory intensive course targets the rapidly growing solar sector. Students will learn the engineering mechanics of solar arrays, safety compliance for working at heights, electrical wiring protocols, standard diagnostic tools, and routine maintenance practices, leading to certified eco-technician credentials.',
    syllabus: [
      { title: 'Photovoltaic Basics & Site Planning Criteria', duration: '2 Hours', type: 'video', isFreePreview: true },
      { title: 'Safety Measures and Scaffolding Certification', duration: '4 Hours', type: 'practical' },
      { title: 'Wiring Protocols: Series, Parallel & Battery Connections', duration: '5 Hours', type: 'practical' },
      { title: 'Grid Ties, Inverters & Solar Charge Controllers', duration: '3 Hours', type: 'video' },
      { title: 'Final Certification Exam & Installation Evaluation', duration: '2 Hours', type: 'quiz' }
    ]
  },
  {
    id: 'course-4',
    title: 'Advanced Precision Agriculture & Smart Farming Systems',
    category: 'Agriculture',
    level: 'Advanced',
    duration: '10 Weeks',
    mode: 'Hybrid',
    location: 'Agricultural Tech Lab, Nashik',
    startDate: '2026-08-10',
    endDate: '2026-10-18',
    seatsLeft: 8,
    totalSeats: 20,
    price: 3200,
    instructor: {
      name: 'Prof. Milind Shinde',
      designation: 'Agritech Researcher & Agronomist',
      rating: 4.9,
      photo: 'https://picsum.photos/seed/milind/150/150'
    },
    description: 'Optimize crop yields using soil sensors, drone telemetry, satellite soil maps, automatic irrigation controls, and automated greenhouse tools.',
    longDescription: 'Equip modern farms with data-driven technologies. This advanced program introduces sensors for nitrogen mapping, localized pesticide distribution, smart weather station APIs, and predictive growth algorithms to drastically cut input costs and increase total harvest quality.',
    syllabus: [
      { title: 'Sensor Integration & Soil Moisture Telemetry APIs', duration: '3 Hours', type: 'video', isFreePreview: true },
      { title: 'Drone Imaging & NDVI Vegetative Index Mapping', duration: '4 Hours', type: 'video' },
      { title: 'Micro-Irrigation Automation and Smart Valve Circuits', duration: '5 Hours', type: 'practical' },
      { title: 'Predictive Harvest Forecasting Algorithms', duration: '3 Hours', type: 'video' },
      { title: 'Agritech Field Deployment Case Study', duration: '6 Hours', type: 'practical' }
    ]
  },
  {
    id: 'course-5',
    title: 'Digital Literacy & Cyber Security Basic Course',
    category: 'Basic Digital',
    level: 'Beginner',
    duration: '6 Weeks',
    mode: 'Online',
    location: 'Virtual Classroom (Nagpur Hub)',
    startDate: '2026-07-25',
    endDate: '2026-09-05',
    seatsLeft: 20,
    totalSeats: 100,
    price: 0,
    instructor: {
      name: 'Pratibha Joshi',
      designation: 'Cyber Security Awareness Lead',
      rating: 4.6,
      photo: 'https://picsum.photos/seed/pratibha/150/150'
    },
    description: 'Learn safe internet surfing, secure digital payments, identifying online phishing scams, and standard system firewall configurations.',
    longDescription: 'Ensure digital safety for your family and profession. Designed specifically to demystify online utilities, digital banking services, UPI safety, smart credential hygiene, and how to stay protected from modern malware and online identity theft schemes.',
    syllabus: [
      { title: 'Safe Internet Browsing & Smart Account Setup', duration: '2 Hours', type: 'video', isFreePreview: true },
      { title: 'Demystifying UPI, Net Banking & Mobile Payments', duration: '2.5 Hours', type: 'video', isFreePreview: true },
      { title: 'Identifying Phishing Emails and Social Engineering', duration: '3 Hours', type: 'video' },
      { title: 'Basic Security Tools: Antivirus & Firewall Adjustments', duration: '4 Hours', type: 'practical' },
      { title: 'Digital Safety Certification Exam', duration: '1 Hour', type: 'quiz' }
    ]
  },
  {
    id: 'scheme-1',
    title: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)',
    category: 'Skill Subsidies',
    level: 'Beginner',
    duration: '12 Weeks',
    mode: 'Hybrid',
    location: 'National Skill Center, Delhi & Mumbai Hubs',
    startDate: '2026-08-01',
    endDate: '2026-10-24',
    seatsLeft: 14,
    totalSeats: 50,
    price: 0,
    instructor: {
      name: 'Dr. Ramesh Patil',
      designation: 'Senior IT Consultant & Skill Trainer',
      rating: 4.8,
      photo: 'https://picsum.photos/seed/ramesh/150/150'
    },
    description: 'Free technical skill certifications with direct job-placement linkups, 100% sponsored by the Ministry of Skill Development & Entrepreneurship.',
    longDescription: 'Under the PMKVY 4.0 scheme, youth can enroll in high-demand industrial and technical skills. This program provides comprehensive job placements, stipend links, and recognized digital skill certificates with no registration fee.',
    syllabus: [
      { title: 'Intro to PMKVY Technical Certification Framework', duration: '1.5 Hours', type: 'video', isFreePreview: true },
      { title: 'Core Trade Skill Assessment', duration: '2 Hours', type: 'quiz' }
    ]
  },
  {
    id: 'scheme-2',
    title: 'Aatmanirbhar Bharat Rojgar Yojana (ABRY)',
    category: 'Employment Incentives',
    level: 'Intermediate',
    duration: '24 Weeks',
    mode: 'Online',
    location: 'All Authorized Centers',
    startDate: '2026-09-01',
    endDate: '2027-02-15',
    seatsLeft: 30,
    totalSeats: 100,
    price: 0,
    instructor: {
      name: 'Sanjay Deshmukh',
      designation: 'Lead Software Engineer & Mentor',
      rating: 4.9,
      photo: 'https://picsum.photos/seed/sanjay/150/150'
    },
    description: 'Financial incentives for registered employers to generate and hire local personnel, expanding the smart technical workforce in emerging cities.',
    longDescription: 'ABRY is designed to boost employment generation and incentivize creation of new jobs. Registered employees and apprentices receive wage benefits, EPF subsidy support, and structural placement training.',
    syllabus: [
      { title: 'Overview of employment benefits under ABRY', duration: '1 Hour', type: 'video', isFreePreview: true },
      { title: 'Digital Literacy and Workplace Ethics', duration: '3 Hours', type: 'video' }
    ]
  },
  {
    id: 'scheme-3',
    title: 'PM Street Vendor AtmaNirbhar Nidhi (PM SVANidhi)',
    category: 'Micro Finance',
    level: 'Beginner',
    duration: '4 Weeks',
    mode: 'Hybrid',
    location: 'Municipal Corporation Centers',
    startDate: '2026-08-10',
    endDate: '2026-09-10',
    seatsLeft: 8,
    totalSeats: 40,
    price: 0,
    instructor: {
      name: 'Pratibha Joshi',
      designation: 'Financial Literacy Lead',
      rating: 4.7,
      photo: 'https://picsum.photos/seed/pratibha/150/150'
    },
    description: 'Collateral-free working capital microloans up to ₹50,000 paired with complete digital literacy and marketing integration programs.',
    longDescription: 'Empower small street micro-entrepreneurs. SVANidhi program offers micro-credits starting from ₹10,000 to ₹50,000 with a 7% interest subsidy and complete cashback incentives on digital payment transactions.',
    syllabus: [
      { title: 'Micro-Credit Applications & Interest Subsidies', duration: '2 Hours', type: 'video', isFreePreview: true },
      { title: 'Digital Accounting & UPI Transactions for Vendors', duration: '4 Hours', type: 'practical' }
    ]
  }
];

export const INITIAL_PROFILE: Profile = {
  firstName: 'Aryan',
  lastName: 'Navale',
  email: 'aryannavale99@gmail.com',
  phone: '+91 98765 43210',
  aadhaarNo: '5432 1098 7654',
  panNo: 'ABCDE1234F',
  rationCardNo: 'RC987654321',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  documents: {
    aadhaar: { uploaded: true, name: 'Aadhaar_Card_Aryan.pdf', date: '2026-06-12' },
    pan: { uploaded: true, name: 'PAN_Card_Aryan.pdf', date: '2026-06-12' },
    rationCard: { uploaded: false, name: '', date: '' }
  }
};

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    courseId: 'course-1',
    courseTitle: 'Pradhan Mantri Kaushal Vikas Yojana - IT Helpdesk Associate',
    appliedDate: '2026-07-01',
    status: 'Under Review',
    documents: {
      aadhaar: { name: 'Aadhaar_Card_Aryan.pdf', date: '2026-07-01' },
      pan: { name: 'PAN_Card_Aryan.pdf', date: '2026-07-01' }
    }
  },
  {
    id: 'app-2',
    courseId: 'course-5',
    courseTitle: 'Digital Literacy & Cyber Security Basic Course',
    appliedDate: '2026-06-15',
    status: 'Course Completed',
    documents: {
      aadhaar: { name: 'Aadhaar_Card_Aryan.pdf', date: '2026-06-15' }
    }
  }
];

export const INITIAL_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-1',
    courseId: 'course-5',
    courseTitle: 'Digital Literacy & Cyber Security Basic Course',
    certificateNo: 'CERT-2026-DLCS-0042',
    completionDate: '2026-07-10',
    status: 'generated'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Application Received',
    description: 'Your application for Pradhan Mantri Kaushal Vikas Yojana - IT Helpdesk Associate has been successfully submitted and is under review.',
    type: 'success',
    time: '2 hours ago',
    group: 'Today',
    read: false
  },
  {
    id: 'notif-2',
    title: 'Action Required: Aadhaar Verification',
    description: 'Your identity proof verification is complete. Please upload your Ration Card in Profile to qualify for secondary scheme benefits.',
    type: 'warning',
    time: '1 day ago',
    group: 'Yesterday',
    read: false
  },
  {
    id: 'notif-3',
    title: 'Certificate Available',
    description: 'Congratulations! Your official completion certificate for Digital Literacy & Cyber Security Basic Course is now generated and ready for download.',
    type: 'info',
    time: '5 days ago',
    group: 'Earlier',
    read: true
  },
  {
    id: 'notif-4',
    title: 'New Agrotech Course Open',
    description: 'Advanced Precision Agriculture & Smart Farming Systems enrollment has begun. Special subsidies are available for registered state farmers.',
    type: 'info',
    time: '1 week ago',
    group: 'Earlier',
    read: true
  }
];

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    title: 'Applied for IT Helpdesk Associate',
    description: 'Submitted application with Aadhaar and PAN cards uploaded successfully.',
    time: '2026-07-18T01:15:00-07:00',
    type: 'enrollment',
    group: 'Today'
  },
  {
    id: 'act-2',
    title: 'Validated Coupon Code "FREE2026"',
    description: 'Applied full course fee subsidy code on check-out successfully.',
    time: '2026-07-18T00:45:00-07:00',
    type: 'coupon',
    group: 'Today'
  },
  {
    id: 'act-3',
    title: 'Downloaded Completion Certificate',
    description: 'Exported Digital Literacy & Cyber Security certificate as PDF file.',
    time: '2026-07-17T15:20:00-07:00',
    type: 'certificate',
    group: 'Today'
  },
  {
    id: 'act-4',
    title: 'Updated Phone Number on Profile',
    description: 'Modified primary mobile contact to +91 98765 43210.',
    time: '2026-07-14T10:30:00-07:00',
    type: 'profile',
    group: 'This Week'
  },
  {
    id: 'act-5',
    title: 'Passed Security Assessment Exam',
    description: 'Scored 92% in final cyber awareness quiz, fulfilling course completion.',
    time: '2026-07-10T11:45:00-07:00',
    type: 'certificate',
    group: 'This Month'
  }
];

export function getStoredState() {
  if (typeof window === 'undefined') {
    return {
      profile: INITIAL_PROFILE,
      applications: INITIAL_APPLICATIONS,
      certificates: INITIAL_CERTIFICATES,
      notifications: INITIAL_NOTIFICATIONS,
      activities: INITIAL_ACTIVITIES,
      courses: INITIAL_COURSES,
      language: 'en'
    };
  }

  const profile = JSON.parse(localStorage.getItem('db_profile') || JSON.stringify(INITIAL_PROFILE));
  const applications = JSON.parse(localStorage.getItem('db_applications') || JSON.stringify(INITIAL_APPLICATIONS));
  const certificates = JSON.parse(localStorage.getItem('db_certificates') || JSON.stringify(INITIAL_CERTIFICATES));
  const notifications = JSON.parse(localStorage.getItem('db_notifications') || JSON.stringify(INITIAL_NOTIFICATIONS));
  const activities = JSON.parse(localStorage.getItem('db_activities') || JSON.stringify(INITIAL_ACTIVITIES));
  let courses = JSON.parse(localStorage.getItem('db_courses') || '[]');
  if (courses.length === 0 || !courses.some((c: any) => c.id === 'scheme-1')) {
    courses = INITIAL_COURSES;
    localStorage.setItem('db_courses', JSON.stringify(INITIAL_COURSES));
  }
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
