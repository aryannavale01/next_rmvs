import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";
import * as crypto from "node:crypto";

const DIRECT_URL = process.env.DIRECT_URL!;
if (!DIRECT_URL) throw new Error("DIRECT_URL is required");

const prisma = new PrismaClient({
  datasources: { db: { url: DIRECT_URL } },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uuid(): string {
  return crypto.randomUUID();
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function dateStr(n: number): string {
  return daysAgo(n).toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// User seed (existing)
// ---------------------------------------------------------------------------

async function ensureUser(
  email: string,
  name: string,
  password: string,
  role: "admin" | "member",
): Promise<string | null> {
  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
    'SELECT id FROM "User" WHERE email = $1',
    email,
  );
  if (existing.length > 0) {
    console.log(`  SKIP (exists): ${email}`);
    return existing[0].id;
  }

  const id = crypto.randomBytes(16).toString("hex");
  const now = new Date();

  await prisma.$executeRawUnsafe(
    'INSERT INTO "User" (id, email, "emailVerified", name, role, "mustChangePassword", "lastLoginAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5::"Role", $6, $7, $8, $9)',
    id,
    email,
    true,
    name,
    role === "admin" ? "ADMIN" : "MEMBER",
    role === "admin",
    now,
    now,
    now,
  );

  const hashedPw = await hashPassword(password);
  const accountId = crypto.randomBytes(12).toString("hex");

  await prisma.$executeRawUnsafe(
    'INSERT INTO "Account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
    crypto.randomBytes(16).toString("hex"),
    id,
    accountId,
    "credential",
    hashedPw,
    now,
    now,
  );

  try {
    await prisma.$executeRawUnsafe(
      'INSERT INTO profiles (id, full_name, email, role, updated_at) VALUES ($1, $2, $3, $4::user_role, $5) ON CONFLICT (id) DO NOTHING',
      id,
      name,
      email,
      role,
      now,
    );
  } catch {
    // Trigger already handled it
  }

  console.log(`  CREATED: ${email} (${role})`);
  return id;
}

// ---------------------------------------------------------------------------
// Profile enrichment
// ---------------------------------------------------------------------------

async function enrichProfile(userId: string) {
  console.log("  Enriching profile...");

  await prisma.$executeRawUnsafe(
    `UPDATE profiles SET
      full_name = 'Rajesh Kumar',
      phone = '+91-9876543210',
      gender = 'male'::gender,
      dob = '1990-05-15',
      aadhaar_number = '1234-5678-9012',
      pan_number = 'ABCPD1234E',
      address_line1 = '42 Gandhi Nagar',
      district = 'Pune',
      state = 'Maharashtra',
      pincode = '411001',
      qualification = 'Graduate',
      updated_at = NOW()
    WHERE id = $1`,
    userId,
  );

  console.log("  DONE: profile enriched");
}

// ---------------------------------------------------------------------------
// Course seed
// ---------------------------------------------------------------------------

const COURSES = [
  {
    id: uuid(),
    title: "Community Health Worker Training",
    slug: "community-health-worker-training",
    category: "health" as const,
    level: "beginner" as const,
    description:
      "Comprehensive training for community health workers covering primary healthcare, maternal health, nutrition, and disease prevention in rural communities.",
    duration: "8 weeks",
    price: 0,
    mode: "hybrid" as const,
    location: "Pune, Maharashtra",
    startDate: dateStr(-30),
    endDate: dateStr(26),
    seatsTotal: 30,
    instructorName: "Dr. Priya Sharma",
    instructorRole: "Senior Health Consultant",
    benefits: ["Free certification", "Job placement assistance", "Stipend provided"],
    eligibility: ["18+ years", "10th pass minimum", "Community resident"],
    requiredDocuments: ["Aadhaar Card", "10th Marksheet", "Photo"],
    visibility: "both" as const,
    status: "active" as const,
  },
  {
    id: uuid(),
    title: "Digital Literacy for Women",
    slug: "digital-literacy-for-women",
    category: "tech" as const,
    level: "beginner" as const,
    description:
      "Learn essential digital skills including smartphone usage, internet safety, UPI payments, and basic computer operations designed specifically for women in rural areas.",
    duration: "6 weeks",
    price: 0,
    mode: "online" as const,
    location: null,
    startDate: dateStr(-15),
    endDate: dateStr(27),
    seatsTotal: 50,
    instructorName: "Anita Desai",
    instructorRole: "Digital Skills Trainer",
    benefits: ["Free smartphone access", "Certificate", "Ongoing support group"],
    eligibility: ["16+ years", "No prior tech experience needed"],
    requiredDocuments: ["Aadhaar Card", "Photo"],
    visibility: "both" as const,
    status: "active" as const,
  },
  {
    id: uuid(),
    title: "Women's Leadership Program",
    slug: "womens-leadership-program",
    category: "leadership" as const,
    level: "intermediate" as const,
    description:
      "Empower women to become community leaders through public speaking, project management, financial literacy, and grassroots advocacy skills.",
    duration: "10 weeks",
    price: 0,
    mode: "offline" as const,
    location: "Nashik, Maharashtra",
    startDate: dateStr(14),
    endDate: dateStr(84),
    seatsTotal: 25,
    instructorName: "Sunita Kulkarni",
    instructorRole: "Leadership Coach",
    benefits: ["Mentorship program", "Networking opportunities", "Certificate"],
    eligibility: ["21+ years", "Active community member", "Basic literacy"],
    requiredDocuments: ["Aadhaar Card", "Photo", "Recommendation letter"],
    visibility: "programs" as const,
    status: "active" as const,
  },
  {
    id: uuid(),
    title: "Environmental Sustainability Workshop",
    slug: "environmental-sustainability-workshop",
    category: "environment" as const,
    level: "advanced" as const,
    description:
      "Advanced workshop on sustainable agriculture, waste management, water conservation, and renewable energy solutions for rural development.",
    duration: "12 weeks",
    price: 5000,
    mode: "hybrid" as const,
    location: "Satara, Maharashtra",
    startDate: dateStr(30),
    endDate: dateStr(114),
    seatsTotal: 20,
    instructorName: "Prof. Ramesh Patil",
    instructorRole: "Environmental Scientist",
    benefits: ["Field visits", "Equipment provided", "Certificate", "Project funding"],
    eligibility: ["18+ years", "Science background preferred", "Community worker"],
    requiredDocuments: ["Aadhaar Card", "12th Marksheet", "Photo"],
    visibility: "both" as const,
    status: "active" as const,
  },
  {
    id: uuid(),
    title: "Holistic Wellness & Yoga Therapy",
    slug: "holistic-wellness-yoga-therapy",
    category: "health" as const,
    level: "intermediate" as const,
    description:
      "Comprehensive wellness program covering traditional yoga practices, pranayama, meditation, Ayurveda basics, and therapeutic applications for stress management and holistic health.",
    duration: "12 weeks",
    price: 5000,
    mode: "hybrid" as const,
    location: "Pune, Maharashtra",
    startDate: dateStr(7),
    endDate: dateStr(91),
    seatsTotal: 25,
    instructorName: "Dr. Meera Iyer",
    instructorRole: "Yoga Therapist & Ayurveda Practitioner",
    benefits: ["Yoga certification", "Wellness toolkit", "Certificate", "Monthly wellness kit"],
    eligibility: ["18+ years", "Basic fitness level", "Medical fitness certificate"],
    requiredDocuments: ["Aadhaar Card", "Photo", "Medical Fitness Certificate"],
    visibility: "both" as const,
    status: "active" as const,
  },
];

async function seedCourses() {
  console.log("  Seeding courses...");
  for (const c of COURSES) {
    const exists = await prisma.$queryRawUnsafe<{ id: string }[]>(
      "SELECT id FROM courses WHERE slug = $1",
      c.slug,
    );
    if (exists.length > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE courses SET
          title = $1, category = $2::course_category, level = $3::course_level,
          description = $4, duration = $5, price = $6,
          mode = $7::training_mode, location = $8,
          start_date = $9::date, end_date = $10::date,
          seats_total = $11,
          instructor_name = $12, instructor_role = $13,
          benefits = $14, eligibility = $15, required_documents = $16,
          visibility = $17::course_visibility, status = $18::course_status,
          updated_at = NOW()
        WHERE slug = $19`,
        c.title,
        c.category,
        c.level,
        c.description,
        c.duration,
        c.price,
        c.mode,
        c.location,
        c.startDate,
        c.endDate,
        c.seatsTotal,
        c.instructorName,
        c.instructorRole,
        c.benefits,
        c.eligibility,
        c.requiredDocuments,
        c.visibility,
        c.status,
        c.slug,
      );
      console.log(`    UPDATED: ${c.title}`);
      continue;
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO courses (
        id, title, slug, category, level, description, duration,
        price, mode, location, start_date, end_date,
        seats_total,
        instructor_name, instructor_role,
        benefits, eligibility, required_documents,
        visibility, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4::course_category, $5::course_level, $6, $7,
        $8, $9::training_mode, $10, $11::date, $12::date,
        $13,
        $14, $15,
        $16, $17, $18,
        $19::course_visibility, $20::course_status, NOW(), NOW()
      )`,
      c.id,
      c.title,
      c.slug,
      c.category,
      c.level,
      c.description,
      c.duration,
      c.price,
      c.mode,
      c.location,
      c.startDate,
      c.endDate,
      c.seatsTotal,
      c.instructorName,
      c.instructorRole,
      c.benefits,
      c.eligibility,
      c.requiredDocuments,
      c.visibility,
      c.status,
    );
    console.log(`    CREATED: ${c.title}`);
  }
}

// ---------------------------------------------------------------------------
// Syllabus seed
// ---------------------------------------------------------------------------

async function seedSyllabus() {
  console.log("  Seeding syllabus...");

  const COURSE_SYLLABUS: { slug: string; lessons: { title: string; description: string; lessonType: string; durationMinutes: number; isFreePreview: boolean }[] }[] = [
    {
      slug: "community-health-worker-training",
      lessons: [
        { title: "Introduction to Community Health", description: "Overview of community health systems, roles of health workers, and the Indian public healthcare structure.", lessonType: "video", durationMinutes: 45, isFreePreview: true },
        { title: "Primary Healthcare Fundamentals", description: "Understanding primary healthcare delivery, referral systems, and patient triage at the village level.", lessonType: "text", durationMinutes: 60, isFreePreview: false },
        { title: "Maternal & Child Health", description: "Antenatal care, safe delivery practices, postnatal care, immunization schedules, and ICDS coordination.", lessonType: "video", durationMinutes: 75, isFreePreview: false },
        { title: "Nutrition & Diet Planning", description: "Identifying malnutrition, supplementary feeding programs, BMI tracking, and dietary counseling for mothers and children.", lessonType: "text", durationMinutes: 50, isFreePreview: false },
        { title: "Water, Sanitation & Hygiene (WASH)", description: "Safe drinking water practices, toilet usage awareness, handwashing protocols, and community hygiene drives.", lessonType: "video", durationMinutes: 40, isFreePreview: false },
        { title: "Communicable Disease Control", description: "Malaria, TB, dengue, and waterborne disease prevention, surveillance techniques, and reporting workflows.", lessonType: "text", durationMinutes: 55, isFreePreview: false },
        { title: "Non-Communicable Disease Awareness", description: "Hypertension, diabetes, and cancer screening basics, lifestyle counseling, and referral pathways.", lessonType: "text", durationMinutes: 45, isFreePreview: false },
        { title: "First Aid & Emergency Response", description: "CPR, wound management, fracture immobilization, burn treatment, and snakebite first response.", lessonType: "video", durationMinutes: 60, isFreePreview: false },
        { title: "Midterm Assessment", description: "Written exam covering Weeks 1–7 topics. Minimum 60% required to proceed.", lessonType: "quiz", durationMinutes: 90, isFreePreview: false },
        { title: "Health Data Collection & Reporting", description: "Using HMIS forms, family survey techniques, data entry into eVIN and other government portals.", lessonType: "text", durationMinutes: 50, isFreePreview: false },
        { title: "Community Mobilization", description: "Running health camps, SHG meetings, awareness rallies, and engaging Panchayat leaders in health drives.", lessonType: "video", durationMinutes: 45, isFreePreview: false },
        { title: "Field Practicum", description: "Supervised field visit to 3 villages — conduct health surveys, document findings, and present to the panel.", lessonType: "assignment", durationMinutes: 240, isFreePreview: false },
        { title: "Final Assessment & Certification", description: "Comprehensive exam + viva voce. Pass with 60% to receive the Community Health Worker certificate.", lessonType: "quiz", durationMinutes: 120, isFreePreview: false },
      ],
    },
    {
      slug: "digital-literacy-for-women",
      lessons: [
        { title: "Getting Started with Smartphones", description: "Understanding smartphone basics — touchscreen navigation, home screens, installing apps, and settings configuration.", lessonType: "video", durationMinutes: 30, isFreePreview: true },
        { title: "Using the Internet Safely", description: "What the internet is, how to browse safely, identifying fake news, and avoiding online scams.", lessonType: "text", durationMinutes: 40, isFreePreview: false },
        { title: "WhatsApp & Communication Tools", description: "Sending messages, voice notes, sharing photos, creating groups, and privacy settings on WhatsApp.", lessonType: "video", durationMinutes: 35, isFreePreview: false },
        { title: "UPI & Digital Payments", description: "Setting up Google Pay, PhonePe, or Paytm. Sending/receiving money, QR codes, and transaction safety.", lessonType: "video", durationMinutes: 45, isFreePreview: false },
        { title: "Email & Online Forms", description: "Creating a Gmail account, composing emails, attaching files, and filling government application forms online.", lessonType: "text", durationMinutes: 40, isFreePreview: false },
        { title: "Google Search & Information Literacy", description: "How to search effectively, evaluate sources, use Google Maps, and find government schemes online.", lessonType: "text", durationMinutes: 35, isFreePreview: false },
        { title: "Online Safety & Privacy", description: "Password management, two-factor authentication, privacy settings on social media, and reporting cybercrime.", lessonType: "text", durationMinutes: 30, isFreePreview: false },
        { title: "Midterm Quiz", description: "Quick quiz on smartphone basics, internet safety, and digital payments.", lessonType: "quiz", durationMinutes: 30, isFreePreview: false },
        { title: "Using Government Services Online", description: "Navigating UMANG, DigiLocker, Aadhaar services, ration card portals, and applying for certificates online.", lessonType: "video", durationMinutes: 45, isFreePreview: false },
        { title: "Video Calling & Virtual Meetings", description: "Setting up and using Google Meet, Zoom, or WhatsApp video calls for family and work purposes.", lessonType: "video", durationMinutes: 25, isFreePreview: false },
        { title: "Basic Computer Skills", description: "Introduction to laptops/desktops — using a mouse, keyboard shortcuts, file management, and Microsoft Word basics.", lessonType: "text", durationMinutes: 50, isFreePreview: false },
        { title: "Final Project", description: "Complete a practical task: register for a government scheme online, send an email with attachments, and make a UPI payment.", lessonType: "assignment", durationMinutes: 90, isFreePreview: false },
      ],
    },
    {
      slug: "womens-leadership-program",
      lessons: [
        { title: "Introduction to Leadership", description: "Defining leadership styles, self-assessment exercises, and identifying personal strengths and growth areas.", lessonType: "video", durationMinutes: 40, isFreePreview: true },
        { title: "Public Speaking & Communication", description: "Overcoming stage fear, structuring a speech, voice modulation, and persuasive communication techniques.", lessonType: "video", durationMinutes: 55, isFreePreview: false },
        { title: "Project Management Basics", description: "Planning community projects, setting goals, creating timelines, budgeting, and monitoring progress.", lessonType: "text", durationMinutes: 50, isFreePreview: false },
        { title: "Financial Literacy", description: "Personal budgeting, understanding bank accounts, savings schemes, microfinance, and self-help group economics.", lessonType: "text", durationMinutes: 45, isFreePreview: false },
        { title: "Understanding Gender Rights", description: "Constitutional rights for women, POSH Act, domestic violence laws, and accessing legal aid services.", lessonType: "text", durationMinutes: 50, isFreePreview: false },
        { title: "Negotiation & Conflict Resolution", description: "Win-win negotiation tactics, mediating community disputes, and building consensus among stakeholders.", lessonType: "video", durationMinutes: 45, isFreePreview: false },
        { title: "Midterm Presentation", description: "Each participant delivers a 5-minute speech on a community issue they are passionate about.", lessonType: "assignment", durationMinutes: 120, isFreePreview: false },
        { title: "Grassroots Advocacy & Campaigning", description: "Designing awareness campaigns, petition writing, engaging local media, and working with elected representatives.", lessonType: "text", durationMinutes: 50, isFreePreview: false },
        { title: "Building Networks & Mentorship", description: "Finding mentors, building professional networks, leveraging social media for advocacy, and peer support systems.", lessonType: "video", durationMinutes: 40, isFreePreview: false },
        { title: "Emotional Intelligence & Self-Care", description: "Managing stress, building resilience, work-life balance, and mental health awareness for community leaders.", lessonType: "text", durationMinutes: 35, isFreePreview: false },
        { title: "Capstone Project Presentation", description: "Design and present a community improvement project proposal to a panel of judges and local leaders.", lessonType: "assignment", durationMinutes: 180, isFreePreview: false },
        { title: "Final Assessment", description: "Written exam + peer evaluation. Must pass to receive the Women's Leadership certificate.", lessonType: "quiz", durationMinutes: 90, isFreePreview: false },
      ],
    },
    {
      slug: "environmental-sustainability-workshop",
      lessons: [
        { title: "State of the Environment", description: "Global and local environmental challenges — climate change, biodiversity loss, pollution, and India's sustainability commitments.", lessonType: "video", durationMinutes: 50, isFreePreview: true },
        { title: "Sustainable Agriculture Practices", description: "Organic farming, crop rotation, vermicomposting, zero-budget natural farming, and soil health management.", lessonType: "video", durationMinutes: 65, isFreePreview: false },
        { title: "Water Conservation Techniques", description: "Rainwater harvesting, watershed management, drip irrigation, check dams, and jal jeevan mission integration.", lessonType: "text", durationMinutes: 55, isFreePreview: false },
        { title: "Waste Management & Recycling", description: "Solid waste segregation, composting at home, plastic recycling chains, e-waste management, and Swachh Bharat alignment.", lessonType: "video", durationMinutes: 50, isFreePreview: false },
        { title: "Renewable Energy for Rural Areas", description: "Solar panels, biogas plants, wind energy basics, subsidy programs, and successful rural case studies.", lessonType: "text", durationMinutes: 55, isFreePreview: false },
        { title: "Midterm Assessment", description: "Written exam covering Weeks 1–5 topics. Minimum 60% required to proceed.", lessonType: "quiz", durationMinutes: 90, isFreePreview: false },
        { title: "Biodiversity & Ecosystem Services", description: "Local biodiversity mapping, medicinal plants, pollinator protection, and community forest management.", lessonType: "text", durationMinutes: 50, isFreePreview: false },
        { title: "Environmental Policy & Governance", description: "Key environmental laws, RTI for environmental issues, pollution control boards, and community legal tools.", lessonType: "text", durationMinutes: 45, isFreePreview: false },
        { title: "Carbon Footprint & Climate Action", description: "Calculating personal and community carbon footprints, local climate action planning, and tree plantation drives.", lessonType: "video", durationMinutes: 40, isFreePreview: false },
        { title: "Field Visit — Waste Management Plant", description: "Guided visit to a local recycling facility or composting center. Document observations and write a field report.", lessonType: "assignment", durationMinutes: 180, isFreePreview: false },
        { title: "Community Sustainability Project", description: "Design a sustainability initiative for your village — water, waste, or energy focused. Present proposal to the panel.", lessonType: "assignment", durationMinutes: 120, isFreePreview: false },
        { title: "Final Assessment & Certification", description: "Comprehensive exam + project defense. Pass with 60% to receive the Environmental Sustainability certificate.", lessonType: "quiz", durationMinutes: 120, isFreePreview: false },
      ],
    },
    {
      slug: "holistic-wellness-yoga-therapy",
      lessons: [
        { title: "Foundations of Yoga Philosophy", description: "Introduction to Patanjali's Yoga Sutras, the eight limbs of yoga, and the connection between mind, body, and breath.", lessonType: "video", durationMinutes: 40, isFreePreview: true },
        { title: "Pranayama (Breathing Techniques)", description: "Nadi Shodhana, Kapalabhati, Bhramari, and Ujjayi — theory, demonstration, and guided practice.", lessonType: "video", durationMinutes: 50, isFreePreview: false },
        { title: "Hatha Yoga Asanas — Beginner Series", description: "Surya Namaskar, Tadasana, Trikonasana, Virabhadrasana series, and seated forward bends with proper alignment.", lessonType: "video", durationMinutes: 60, isFreePreview: false },
        { title: "Anatomy for Yoga Practitioners", description: "Skeletal structure, major muscle groups, joint mobility, and how asanas affect the musculoskeletal system.", lessonType: "text", durationMinutes: 55, isFreePreview: false },
        { title: "Meditation & Mindfulness", description: "Guided meditation techniques, body scan, mindfulness in daily life, and managing anxiety through awareness.", lessonType: "video", durationMinutes: 45, isFreePreview: false },
        { title: "Introduction to Ayurveda", description: "Dosha theory (Vata, Pitta, Kapha), daily routines (Dinacharya), seasonal practices, and dietary guidelines.", lessonType: "text", durationMinutes: 50, isFreePreview: false },
        { title: "Midterm Practice Exam", description: "Practical demonstration of 5 asanas + 2 pranayama techniques + short written quiz.", lessonType: "quiz", durationMinutes: 90, isFreePreview: false },
        { title: "Therapeutic Yoga for Common Ailments", description: "Yoga sequences for back pain, diabetes management, hypertension, thyroid disorders, and knee issues.", lessonType: "video", durationMinutes: 60, isFreePreview: false },
        { title: "Yoga for Women's Health", description: "Menstrual health, pregnancy-safe practices (prenatal yoga), menopause management, and hormonal balance.", lessonType: "text", durationMinutes: 45, isFreePreview: false },
        { title: "Ayurvedic Diet & Lifestyle", description: "Seasonal eating, detox practices (Panchakarma basics), herbal remedies, and cooking with Ayurvedic principles.", lessonType: "text", durationMinutes: 40, isFreePreview: false },
        { title: "Stress Management & Holistic Health", description: "Identifying stress triggers, lifestyle modifications, sleep hygiene, and integrating yoga into daily routines.", lessonType: "video", durationMinutes: 45, isFreePreview: false },
        { title: "Teaching Methodology", description: "How to structure a yoga class, cueing techniques, modifications for different body types, and class safety.", lessonType: "video", durationMinutes: 55, isFreePreview: false },
        { title: "Practicum — Teach a Peer Class", description: "Each participant teaches a 20-minute yoga session to classmates. Peer and instructor feedback provided.", lessonType: "assignment", durationMinutes: 120, isFreePreview: false },
        { title: "Final Assessment & Certification", description: "Practical exam (asana sequence + pranayama) + written exam on Ayurveda + teaching demo. Must pass all three.", lessonType: "quiz", durationMinutes: 150, isFreePreview: false },
      ],
    },
  ];

  for (const { slug, lessons } of COURSE_SYLLABUS) {
    const courseRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      "SELECT id FROM courses WHERE slug = $1",
      slug,
    );
    if (courseRows.length === 0) {
      console.log(`    SKIP: course ${slug} not found`);
      continue;
    }
    const courseId = courseRows[0].id;

    const existingCount = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      "SELECT COUNT(*) as count FROM course_syllabus WHERE course_id = $1",
      courseId,
    );
    if (existingCount[0].count > 0) {
      console.log(`    SKIP: ${slug} already has ${existingCount[0].count} lessons`);
      continue;
    }

    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i];
      await prisma.$executeRawUnsafe(
        `INSERT INTO course_syllabus (id, course_id, title, description, lesson_type, sort_order, is_free_preview, duration_minutes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5::lesson_type, $6, $7, $8, NOW(), NOW())`,
        crypto.randomUUID(),
        courseId,
        l.title,
        l.description,
        l.lessonType,
        i + 1,
        l.isFreePreview,
        l.durationMinutes,
      );
    }
    console.log(`    CREATED: ${slug} (${lessons.length} lessons)`);
  }
}

// ---------------------------------------------------------------------------
// Coupon seed
// ---------------------------------------------------------------------------

async function seedCoupons() {
  console.log("  Seeding coupons...");

  const COURSE_COUPONS: { slug: string; coupons: { code: string; discountType: string; discountValue: number; description: string; maxUses: number; perUserLimit: number }[] }[] = [
    {
      slug: "environmental-sustainability-workshop",
      coupons: [
        { code: "GREEN20", discountType: "percentage", discountValue: 20, description: "20% off Environmental Sustainability Workshop", maxUses: 100, perUserLimit: 1 },
        { code: "ECO500", discountType: "fixed", discountValue: 500, description: "₹500 off Environmental Sustainability Workshop", maxUses: 50, perUserLimit: 1 },
      ],
    },
    {
      slug: "holistic-wellness-yoga-therapy",
      coupons: [
        { code: "FREE", discountType: "percentage", discountValue: 100, description: "100% off — free enrollment for Holistic Wellness & Yoga Therapy", maxUses: 10, perUserLimit: 1 },
        { code: "WELLNESS50", discountType: "percentage", discountValue: 50, description: "50% off Holistic Wellness & Yoga Therapy", maxUses: 50, perUserLimit: 1 },
        { code: "YOGA25", discountType: "percentage", discountValue: 25, description: "25% off Holistic Wellness & Yoga Therapy", maxUses: 100, perUserLimit: 1 },
      ],
    },
  ];

  for (const { slug, coupons } of COURSE_COUPONS) {
    const courseRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      "SELECT id FROM courses WHERE slug = $1",
      slug,
    );
    if (courseRows.length === 0) {
      console.log(`    SKIP: course ${slug} not found`);
      continue;
    }
    const courseId = courseRows[0].id;

    const existing = await prisma.$queryRawUnsafe<{ code: string }[]>(
      "SELECT code FROM coupons WHERE course_id = $1",
      courseId,
    );
    const existingCodes = new Set(existing.map((r) => r.code));

    for (const c of coupons) {
      if (existingCodes.has(c.code)) {
        console.log(`    SKIP (exists): ${c.code}`);
        continue;
      }
      await prisma.$executeRawUnsafe(
        `INSERT INTO coupons (
          id, code, course_id, is_active, expires_at, valid_from,
          max_uses, used_count, per_user_limit,
          discount_type, discount_value, description, created_at, updated_at
        ) VALUES ($1, $2, $3, true, $4, $5, $6, 0, $7, $8::discount_type, $9, $10, NOW(), NOW())`,
        uuid(),
        c.code,
        courseId,
        daysAgo(-90),
        daysAgo(0),
        c.maxUses,
        c.perUserLimit,
        c.discountType,
        c.discountValue,
        c.description,
      );
      console.log(`    CREATED: ${c.code} (${c.discountType} ${c.discountValue}%)`);
    }
  }
}

// ---------------------------------------------------------------------------
// BeneficiaryDocument seed
// ---------------------------------------------------------------------------

async function seedDocuments(userId: string) {
  console.log("  Seeding documents...");

  const existing = await prisma.$queryRawUnsafe<{ type: string }[]>(
    "SELECT type FROM beneficiary_documents WHERE profile_id = $1",
    userId,
  );
  const existingTypes = new Set(existing.map((r) => r.type));

  const docs = [
    { type: "aadhaar", label: "Aadhaar", status: "verified", fileUrl: `${userId}/aadhaar/1700000000000.webp` },
    { type: "pan", label: "Pan", status: "pending", fileUrl: `${userId}/pan/1700000000001.pdf` },
    { type: "rationCard", label: "Rationcard", status: "not_uploaded", fileUrl: null },
  ];

  for (const d of docs) {
    if (existingTypes.has(d.type)) {
      console.log(`    SKIP (exists): ${d.type}`);
      continue;
    }
    await prisma.$executeRawUnsafe(
      `INSERT INTO beneficiary_documents (id, profile_id, type, label, file_url, status, uploaded_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::document_status, $7, NOW())`,
      uuid(),
      userId,
      d.type,
      d.label,
      d.fileUrl,
      d.status,
      d.fileUrl ? daysAgo(10) : null,
    );
    console.log(`    CREATED: ${d.type} (${d.status})`);
  }
}

// ---------------------------------------------------------------------------
// CourseApplication seed
// ---------------------------------------------------------------------------

async function seedApplications(userId: string) {
  console.log("  Seeding applications...");

  const existing = await prisma.$queryRawUnsafe<{ course_id: string }[]>(
    "SELECT course_id FROM course_applications WHERE profile_id = $1",
    userId,
  );
  const existingCourseIds = new Set(existing.map((r) => r.course_id));

  const slugs = [
    { slug: "community-health-worker-training", status: "seat_reserved", daysAgo: 60 },
    { slug: "digital-literacy-for-women", status: "pending", daysAgo: 30 },
    { slug: "womens-leadership-program", status: "under_review", daysAgo: 10 },
  ];

  for (const a of slugs) {
    const rows = await prisma.$queryRawUnsafe<{ id: string; title: string }[]>(
      "SELECT id, title FROM courses WHERE slug = $1",
      a.slug,
    );
    if (rows.length === 0) continue;
    if (existingCourseIds.has(rows[0].id)) {
      console.log(`    SKIP (exists): ${a.slug}`);
      continue;
    }
    await prisma.$executeRawUnsafe(
      `INSERT INTO course_applications (id, profile_id, course_id, applied_date, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::application_status, NOW(), NOW())`,
      uuid(),
      userId,
      rows[0].id,
      daysAgo(a.daysAgo),
      a.status,
    );
    console.log(`    CREATED: application for ${rows[0].title} (${a.status})`);
  }
}

// ---------------------------------------------------------------------------
// CourseEnrollment seed
// ---------------------------------------------------------------------------

async function seedEnrollments(userId: string) {
  console.log("  Seeding enrollments...");

  const existing = await prisma.$queryRawUnsafe<{ course_id: string }[]>(
    "SELECT course_id FROM course_enrollments WHERE profile_id = $1",
    userId,
  );
  if (existing.length > 0) {
    console.log("    SKIP (exists): enrollments");
    return;
  }

  const rows = await prisma.$queryRawUnsafe<{ id: string; title: string }[]>(
    "SELECT id, title FROM courses WHERE slug = $1",
    "community-health-worker-training",
  );
  if (rows.length === 0) {
    console.log("    SKIP: course not found");
    return;
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO course_enrollments (
      id, profile_id, course_id, enrollment_date, status,
      attendance, documents_verified, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5::enrollment_status, $6, $7, NOW(), NOW())`,
    uuid(),
    userId,
    rows[0].id,
    daysAgo(45),
    "enrolled",
    72,
    true,
  );
  console.log(`    CREATED: enrollment for ${rows[0].title}`);
}

// ---------------------------------------------------------------------------
// Certificate seed
// ---------------------------------------------------------------------------

async function seedCertificates(userId: string) {
  console.log("  Seeding certificates...");

  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
    "SELECT id FROM certificates WHERE profile_id = $1",
    userId,
  );
  if (existing.length > 0) {
    console.log("    SKIP (exists): certificates");
    return;
  }

  const rows = await prisma.$queryRawUnsafe<{ id: string; instructor_name: string }[]>(
    "SELECT id, instructor_name FROM courses WHERE slug = $1",
    "community-health-worker-training",
  );
  if (rows.length === 0) {
    console.log("    SKIP: course not found");
    return;
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO certificates (
      id, certificate_number, profile_id, course_id,
      teacher_name, issue_date, completion_date, generation_date,
      status, published_status, language, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::certificate_status, $10::published_status, $11, NOW())`,
    uuid(),
    "CGO-2025-001",
    userId,
    rows[0].id,
    rows[0].instructor_name,
    daysAgo(5),
    daysAgo(5),
    daysAgo(5),
    "generated",
    "pending",
    "English",
  );
  console.log("    CREATED: CGO-2025-001");
}

// ---------------------------------------------------------------------------
// Notification seed
// ---------------------------------------------------------------------------

async function seedNotifications(userId: string) {
  console.log("  Seeding notifications...");

  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
    "SELECT id FROM notifications WHERE profile_id = $1 LIMIT 1",
    userId,
  );
  if (existing.length > 0) {
    console.log("    SKIP (exists): notifications");
    return;
  }

  const notifications = [
    { title: "Application Approved", description: "Your application for Community Health Worker Training has been approved. Enrollment is now open.", type: "success", read: true, daysAgo: 45 },
    { title: "Document Verification Pending", description: "Your PAN card is under review. Please allow 2-3 business days.", type: "warning", read: false, daysAgo: 5 },
    { title: "Course Starting Soon", description: "Women's Leadership Program begins in 2 weeks. Complete your pre-workshop reading.", type: "info", read: false, daysAgo: 3 },
    { title: "Certificate Generated", description: "Your certificate for Community Health Worker Training is ready for download.", type: "success", read: true, daysAgo: 2 },
  ];

  for (const n of notifications) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO notifications (id, profile_id, title, description, type, "read", timestamp, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      uuid(),
      userId,
      n.title,
      n.description,
      n.type,
      n.read,
      daysAgo(n.daysAgo),
    );
  }
  console.log(`    CREATED: ${notifications.length} notifications`);
}

// ---------------------------------------------------------------------------
// Activity seed
// ---------------------------------------------------------------------------

async function seedActivities(userId: string) {
  console.log("  Seeding activities...");

  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
    "SELECT id FROM activities WHERE profile_id = $1 LIMIT 1",
    userId,
  );
  if (existing.length > 0) {
    console.log("    SKIP (exists): activities");
    return;
  }

  const activities = [
    { title: "Applied for Community Health Training", description: "Submitted application for Community Health Worker Training program.", category: "enrollment", daysAgo: 60 },
    { title: "Uploaded Aadhaar Card", description: "Identity document uploaded and verified successfully.", category: "document", daysAgo: 50 },
    { title: "Profile Updated", description: "Personal information and contact details updated.", category: "profile", daysAgo: 30 },
  ];

  for (const a of activities) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO activities (id, profile_id, title, description, category, timestamp, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      uuid(),
      userId,
      a.title,
      a.description,
      a.category,
      daysAgo(a.daysAgo),
    );
  }
  console.log(`    CREATED: ${activities.length} activities`);
}

// ---------------------------------------------------------------------------
// Bulk test data for Training Operations Dashboard
// ---------------------------------------------------------------------------

type Scale = "small" | "medium" | "large";

function getScaleConfig(scale: Scale) {
  switch (scale) {
    case "small":
      return { users: 10, appsPerUser: [1, 3] as [number, number], enrolledPct: 0.2 };
    case "medium":
      return { users: 50, appsPerUser: [1, 4] as [number, number], enrolledPct: 0.15 };
    case "large":
      return { users: 200, appsPerUser: [2, 5] as [number, number], enrolledPct: 0.12 };
  }
}

const APPLICATION_STATUSES: { status: string; weight: number }[] = [
  { status: "pending", weight: 25 },
  { status: "under_review", weight: 20 },
  { status: "documents_verified", weight: 15 },
  { status: "seat_reserved", weight: 15 },
  { status: "waitlisted", weight: 10 },
  { status: "rejected", weight: 15 },
];

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedBulkTestData() {
  const scale: Scale = (process.env.SEED_SCALE as Scale) || "small";
  if (!["small", "medium", "large"].includes(scale)) {
    console.log(`  Invalid SEED_SCALE "${scale}", defaulting to "small"`);
  }
  const config = getScaleConfig(scale === "small" ? scale : scale);
  console.log(`\n=== Seeding Bulk Test Data (scale: ${scale}, ~${config.users} users) ===\n`);

  const courseRows = await prisma.$queryRawUnsafe<{ id: string; slug: string; seats_total: number }[]>(
    "SELECT id, slug, seats_total FROM courses WHERE status = 'active'"
  );
  if (courseRows.length === 0) {
    console.log("  SKIP: no active courses found");
    return;
  }

  const existingBulkCount = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    "SELECT COUNT(*) as count FROM course_applications WHERE profile_id IN (SELECT id FROM profiles WHERE email LIKE 'test.bulk_%@example.com')"
  );
  if (existingBulkCount[0].count > BigInt(10)) {
    console.log(`  SKIP: ${existingBulkCount[0].count} bulk test applications already exist`);
    return;
  }

  const BATCH_SIZE = 50;
  let totalApps = 0;
  let totalEnrollments = 0;

  for (let batchStart = 0; batchStart < config.users; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, config.users);
    const userIds: string[] = [];

    for (let i = batchStart; i < batchEnd; i++) {
      const userId = uuid();
      const email = `test.bulk_${i}@example.com`;
      const name = `Test User ${i}`;
      const now = new Date();

      await prisma.$executeRawUnsafe(
        'INSERT INTO "User" (id, email, "emailVerified", name, role, "mustChangePassword", "createdAt", "updatedAt") VALUES ($1, $2, true, $3, $4::"Role", false, $5, $6) ON CONFLICT DO NOTHING',
        userId, email, name, "MEMBER", now, now
      );

      try {
        await prisma.$executeRawUnsafe(
          'INSERT INTO profiles (id, full_name, email, role, district, state, updated_at) VALUES ($1, $2, $3, $4::user_role, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
          userId, name, email, "member",
          ["Pune", "Nashik", "Satara", "Mumbai", "Nagpur"][i % 5],
          "Maharashtra", now
        );
      } catch { /* trigger may handle it */ }

      userIds.push(userId);
    }

    for (const userId of userIds) {
      const numApps = randomBetween(config.appsPerUser[0], config.appsPerUser[1]);
      const usedCourseIds = new Set<string>();

      for (let a = 0; a < numApps; a++) {
        const course = courseRows[randomBetween(0, courseRows.length - 1)];
        if (usedCourseIds.has(course.id)) continue;
        usedCourseIds.add(course.id);

        const statusObj = weightedRandom(APPLICATION_STATUSES);
        const appliedDaysAgo = randomBetween(1, 90);
        const appId = uuid();

        const seatReservedAt = statusObj.status === "seat_reserved" ? daysAgo(appliedDaysAgo - randomBetween(1, 5)) : null;
        const waitlistedAt = statusObj.status === "waitlisted" ? daysAgo(appliedDaysAgo - 1) : null;
        const reviewNotes = ["Approved after document verification", "Documents look good", "Waiting for recommendation letter", "Incomplete application", "Duplicate application detected", null][randomBetween(0, 5)];

        await prisma.$executeRawUnsafe(
          `INSERT INTO course_applications (id, profile_id, course_id, applied_date, status, has_testimonial, notes, coupon_applied, payment_status, documents, seat_reserved_at, waitlisted_at, review_notes, converted_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5::application_status, $6, $7, false, 'pending'::payment_status, $8::jsonb, $9, $10, $11, $12, NOW(), NOW())
           ON CONFLICT (profile_id, course_id) DO NOTHING`,
          appId,
          userId,
          course.id,
          daysAgo(appliedDaysAgo),
          statusObj.status,
          Math.random() > 0.8,
          `Application note for ${statusObj.status}`,
          JSON.stringify([
            { type: "aadhaar", status: Math.random() > 0.3 ? "verified" : "pending" },
            { type: "photo", status: "verified" },
          ]),
          seatReservedAt,
          waitlistedAt,
          reviewNotes,
          statusObj.status === "seat_reserved" && Math.random() > 0.5 ? daysAgo(appliedDaysAgo - randomBetween(2, 7)) : null,
        );
        totalApps++;

        if (statusObj.status === "seat_reserved" && Math.random() < config.enrolledPct) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO course_enrollments (id, profile_id, course_id, enrollment_date, status, attendance, documents_verified, batch_label, seat_number, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5::enrollment_status, $6, true, $7, $8, NOW(), NOW())
             ON CONFLICT DO NOTHING`,
            uuid(),
            userId,
            course.id,
            daysAgo(appliedDaysAgo - randomBetween(3, 10)),
            Math.random() > 0.3 ? "enrolled" : "in_progress",
            randomBetween(40, 95),
            `Batch ${new Date().getFullYear()}-${String(Math.floor(Math.random() * 4) + 1).padStart(2, "0")}`,
            randomBetween(1, course.seats_total ?? 30),
          );
          totalEnrollments++;
        }
      }
    }

    console.log(`  Batch ${batchStart + 1}-${batchEnd}: created ${userIds.length} users`);
  }

  console.log(`\n  Total: ${totalApps} applications, ${totalEnrollments} enrollments across ${config.users} users`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Seeding Users ===\n");

  const superadminPassword = process.env.SUPERADMIN_PASSWORD;
  if (!superadminPassword) {
    throw new Error("SUPERADMIN_PASSWORD environment variable is required");
  }
  const adminId = await ensureUser("admin@compassionglobal.org", "Super Admin", superadminPassword, "admin");
  const memberId = await ensureUser("test.member@example.com", "Rajesh Kumar", "Testuser@123", "member");

  if (!memberId) {
    console.log("\n  Test member already exists — enriching profile and seeding dashboard data...");
    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      'SELECT id FROM "User" WHERE email = $1',
      "test.member@example.com",
    );
    if (existing.length === 0) {
      console.error("  FATAL: test.member@example.com not found");
      return;
    }
    const id = existing[0].id;
    await enrichProfile(id);
    await seedCourses();
    await seedSyllabus();
    await seedCoupons();
    await seedDocuments(id);
    await seedApplications(id);
    await seedEnrollments(id);
    await seedCertificates(id);
    await seedNotifications(id);
    await seedActivities(id);
  } else {
    console.log("\n=== Seeding Dashboard Data ===\n");
    await enrichProfile(memberId);
    await seedCourses();
    await seedSyllabus();
    await seedCoupons();
    await seedDocuments(memberId);
    await seedApplications(memberId);
    await seedEnrollments(memberId);
    await seedCertificates(memberId);
    await seedNotifications(memberId);
    await seedActivities(memberId);
  }

  await seedBulkTestData();

  console.log("\n=== Seed Complete ===");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
