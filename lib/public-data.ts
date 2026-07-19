export type Page = 'mission' | 'programs' | 'impact' | 'resources' | 'volunteer' | 'donate' | 'about';

export interface Milestone {
  id: string;
  year: number;
  title: string;
  description: string;
}

export interface Leader {
  id: string;
  name: string;
  role: string;
  image: string;
  department: string;
  bio: string;
}

export interface Course {
  id: string;
  title: string;
  category: 'Health' | 'Tech' | 'Leadership' | 'Environment';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor: {
    name: string;
    role: string;
    image: string;
  };
  duration: string;
  seatsLeft: number | 'Unlimited';
  seatsTotal?: number;
  image: string;
  description: string;
}

export interface Program {
  id: string;
  title: string;
  category: 'Health' | 'Education' | 'Environment' | 'Emergency Relief';
  description: string;
  goal: number;
  raised: number;
  image: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Programs' | 'Events' | 'Videos' | 'Archive';
  image: string;
  description: string;
  isVideo?: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  category: string;
  description: string;
  readTime: string;
  date: string;
  image: string;
  author: string;
}

export interface Newsletter {
  id: string;
  title: string;
  date: string;
  readTime: string;
  image: string;
}

export const milestones: Milestone[] = [
  {
    id: 'm1',
    year: 2010,
    title: 'The Foundation',
    description: 'CompassionGlobal was founded by a small group of humanitarian experts focused on field-first intervention in Southeast Asia.'
  },
  {
    id: 'm2',
    year: 2015,
    title: 'Scaling Education',
    description: "Launched the 'Global Scholars' program, providing full tuition and vocational training to over 5,000 students in Sub-Saharan Africa."
  },
  {
    id: 'm3',
    year: 2022,
    title: 'Digital Infrastructure',
    description: 'Implemented real-time financial tracking for all donors, ensuring every cent is accounted for and impact-driven.'
  }
];

export const leaders: Leader[] = [
  {
    id: 'l1',
    name: 'Dr. Elena Vance',
    role: 'Chief Executive Officer',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80',
    department: 'Executive',
    bio: 'Over 20 years leading international relief efforts with a PhD in Development Economics.'
  },
  {
    id: 'l2',
    name: 'Marcus Thorne',
    role: 'Director of Operations',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&h=400&q=80',
    department: 'Operations',
    bio: 'Specialist in logistics and emergency relief supply chains across challenging geographies.'
  },
  {
    id: 'l3',
    name: 'Sarah Chen',
    role: 'Chief Impact Officer',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80',
    department: 'Impact Evaluation',
    bio: 'Dedicated to quantitative evaluation of programs to ensure absolute transparency and efficiency.'
  },
  {
    id: 'l4',
    name: 'Amir Rahmani',
    role: 'Finance Director',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80',
    department: 'Finance',
    bio: 'Former audit director specializing in NGO regulatory compliance and transparent tracking.'
  }
];

export const courses: Course[] = [
  {
    id: 'c1',
    title: 'Advanced Community Health Nursing',
    category: 'Health',
    level: 'Intermediate',
    instructor: {
      name: 'Dr. Sarah Kinte',
      role: 'Public Health Lead',
      image: 'https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&w=150&h=150&q=80'
    },
    duration: '8 weeks',
    seatsLeft: 12,
    seatsTotal: 40,
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    description: 'Equip yourself with clinical skills to lead health interventions in remote communities around the globe.'
  },
  {
    id: 'c2',
    title: 'Data Science for Social Impact',
    category: 'Tech',
    level: 'Advanced',
    instructor: {
      name: 'Marcus Chen',
      role: 'Senior AI Researcher',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80'
    },
    duration: '12 weeks',
    seatsLeft: 2,
    seatsTotal: 20,
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    description: 'Learn to leverage big data and AI to solve humanitarian crises, optimize aid routing, and project climate effects.'
  },
  {
    id: 'c3',
    title: 'Strategic NGO Leadership',
    category: 'Leadership',
    level: 'Beginner',
    instructor: {
      name: 'Prof. Amara Okafor',
      role: 'Director of Advocacy',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80'
    },
    duration: '4 weeks',
    seatsLeft: 'Unlimited',
    image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=600&q=80',
    description: 'Master the fundamentals of organizational management, fundraising, and global networking for sustainable development.'
  }
];

export const programs: Program[] = [
  {
    id: 'p1',
    title: 'Future Leaders Initiative',
    category: 'Education',
    description: 'Providing sustainable educational infrastructure and digital literacy to rural communities.',
    goal: 45000,
    raised: 33750,
    image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'p2',
    title: 'Pure Water Network',
    category: 'Environment',
    description: 'Engineering sustainable water access solutions for high-need regions globally.',
    goal: 92000,
    raised: 84640,
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'p3',
    title: 'Mobile Health Clinics',
    category: 'Health',
    description: 'Bringing professional medical care to remote areas through mobile surgical units.',
    goal: 12000,
    raised: 4800,
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80'
  }
];

export const strategicPrograms: Program[] = [
  {
    id: 'sp1',
    title: 'The Great Green Wall Restoration',
    category: 'Environment',
    description: 'Our flagship environmental program aims to restore 100,000 hectares of vital ecosystems across the Sahel region by integrating traditional wisdom with modern silviculture.',
    goal: 2500000,
    raised: 2050000,
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'sp2',
    title: 'Remote Medical Outposts',
    category: 'Health',
    description: 'Bringing life-saving healthcare and vaccination programs to the most isolated communities on the continent.',
    goal: 450000,
    raised: 288000,
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'sp3',
    title: 'Code the Future Academy',
    category: 'Education',
    description: 'Equipping young minds with digital literacy and programming skills to break the cycle of poverty through technology.',
    goal: 120000,
    raised: 110400,
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'sp4',
    title: 'Crisis Response Logistics',
    category: 'Emergency Relief',
    description: 'Maintaining a global supply chain to deliver food, water, and shelter within 48 hours of any disaster.',
    goal: 800000,
    raised: 320000,
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
  }
];

export const galleryItems: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Sahel Environmental Assessment',
    category: 'Programs',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
    description: 'Volunteers and local stewards map soil erosion rates in Senegal to optimize planting locations.'
  },
  {
    id: 'g2',
    title: 'Hope in the Market',
    category: 'Events',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    description: 'A glowing local merchant shares details about her micro-financed small business expansion.'
  },
  {
    id: 'g3',
    title: 'Clinical Care Standards',
    category: 'Archive',
    image: 'https://images.unsplash.com/photo-1605684954278-9f5151585b0a?auto=format&fit=crop&w=600&q=80',
    description: 'Medical teams prepare sterile instruments in our mobile health surgical clinics.'
  },
  {
    id: 'g4',
    title: 'Digital Literacy for Children',
    category: 'Videos',
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80',
    description: 'A young student explores interactive mathematics courses using customized solar tablets.',
    isVideo: true
  },
  {
    id: 'g5',
    title: 'Eco-Friendly Head Office',
    category: 'Programs',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    description: 'Our carbon-neutral administration and innovation facility in Rwanda utilizes 100% solar power.'
  },
  {
    id: 'g6',
    title: 'Water Well Celebration',
    category: 'Events',
    image: 'https://images.unsplash.com/photo-1518887570146-0612132dd618?auto=format&fit=crop&w=600&q=80',
    description: 'Children celebrate clean, disease-free running water in their local community center.'
  }
];

export const blogPosts: BlogPost[] = [
  {
    id: 'b1',
    title: 'The Future of Food Security: How Local Solutions are Shaping Global Policy',
    category: 'Featured Story',
    description: 'Across three continents, our latest initiative is empowering smallholder farmers with regenerative techniques and digital market access. Discover the data-driven impact behind our 2024 results.',
    readTime: '8 min read',
    date: 'June 2026',
    image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
    author: 'Elena Rodriguez'
  }
];

export const newsletters: Newsletter[] = [
  {
    id: 'nl1',
    title: 'Innovation in Education: The Digital Leap',
    date: 'May 2024',
    readTime: '12 min read',
    image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'nl2',
    title: 'Resilient Health Systems: Quarterly Review',
    date: 'April 2024',
    readTime: '15 min read',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'nl3',
    title: 'Climate Action & Global Conservation',
    date: 'March 2024',
    readTime: '10 min read',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'nl4',
    title: 'Empowering Local Economies Through Micro-Grants',
    date: 'February 2024',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'nl5',
    title: '2023 Annual Impact Report & 2024 Roadmap',
    date: 'January 2024',
    readTime: '20 min read',
    image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'nl6',
    title: 'Clean Water: Reaching the Final Mile',
    date: 'December 2023',
    readTime: '12 min read',
    image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80'
  }
];

export const partners = [
  { name: 'GLOBAL CARE', icon: 'HeartHandshake' },
  { name: 'ECOTRUST', icon: 'Leaf' },
  { name: 'MEDCORP', icon: 'PlusCircle' },
  { name: 'EDULIFT', icon: 'GraduationCap' },
  { name: 'NATIONWIDE', icon: 'Building' }
];
