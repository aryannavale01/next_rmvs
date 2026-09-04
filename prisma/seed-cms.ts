import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

const DIRECT_URL = process.env.DIRECT_URL;
if (!DIRECT_URL) throw new Error("DIRECT_URL is required");

const prisma = new PrismaClient({
  datasources: { db: { url: DIRECT_URL } },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function seedSiteSettings() {
  console.log("  Seeding site settings...");
  const settings = [
    // Homepage
    { key: "home_hero_heading", value: "Empowering Rural Women Through Skill Development & Education", label: "Hero Heading", category: "homepage" },
    { key: "home_hero_description", value: "Rupashree Mahila Vikas Sanstha (RMVS) is dedicated to uplifting rural and tribal women in Junnar Taluka through PMKVY-linked skill training, digital literacy, and sustainable livelihood programmes since 2014.", label: "Hero Description", category: "homepage" },
    { key: "home_mission_text", value: "Our mission is to create sustainable livelihood opportunities for rural and tribal women through skill development, digital literacy, and community health programmes, enabling them to become financially independent.", label: "Mission Text", category: "homepage" },
    { key: "home_vision_text", value: "A empowered rural India where every woman has access to quality skill training and economic opportunities, enabling her to lead her family and community towards prosperity.", label: "Vision Text", category: "homepage" },
    { key: "home_stat_volunteers", value: "120+", label: "Volunteers Stat", category: "homepage" },
    { key: "home_stat_families_helped", value: "2,500+", label: "Families Helped Stat", category: "homepage" },
    { key: "home_stat_programs", value: "15+", label: "Programs Stat", category: "homepage" },
    { key: "home_stat_families_supported", value: "1,800+", label: "Families Supported Stat", category: "homepage" },
    { key: "home_stat_students", value: "1,520+", label: "Students Trained Stat", category: "homepage" },
    { key: "home_stat_trees", value: "5,000+", label: "Trees Planted Stat", category: "homepage" },
    { key: "home_efficiency", value: "89%", label: "Efficiency", category: "homepage" },
    { key: "home_lives_impacted", value: "1,520+", label: "Lives Impacted", category: "homepage" },
    { key: "home_transparency_statement", value: "Every rupee donated is tracked and reported. We publish quarterly financial statements and undergo annual third-party audits to ensure complete transparency.", label: "Transparency Statement", category: "homepage" },
    { key: "home_report_title", value: "Annual Financial Report 2025", label: "Report Title", category: "homepage" },
    { key: "home_report_funds", value: "92%", label: "Funds to Programs", category: "homepage" },
    { key: "home_report_efficiency", value: "8%", label: "Administrative Cost", category: "homepage" },
    { key: "home_report_summary", value: "In FY 2025-26, RMVS deployed 92% of all funds directly into field programmes across Junnar Taluka. Administrative costs were held to 8% through lean operations and volunteer-driven logistics.", label: "Report Summary", category: "homepage" },
    { key: "home_impact_story_title", value: "From Dropout to Digital Entrepreneur", label: "Impact Story Title", category: "homepage" },
    { key: "home_impact_story_description", value: "Sunita, a 22-year-old from Kaldare village, completed our Digital Literacy programme and now runs a successful online tailoring business serving customers across Maharashtra.", label: "Impact Story Description", category: "homepage" },
    { key: "home_impact_story_image", value: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80", label: "Impact Story Image", category: "homepage" },
    { key: "home_impact_story_author", value: "Rajesh Kumar, Programme Coordinator", label: "Impact Story Author", category: "homepage" },
    { key: "home_impact_story_body", value: "When Sunita first came to our training centre in Kaldare, she had never used a smartphone. After completing the 8-week Digital Literacy programme, she learned to use social media for marketing, online payment systems, and basic accounting software. Today, her tailoring business earns ₹15,000/month — triple what she earned before.", label: "Impact Story Body", category: "homepage" },
    { key: "home_impact_story_quote", value: "RMVS didn't just teach me to use a computer — they taught me to dream bigger.", label: "Impact Story Quote", category: "homepage" },
    { key: "home_newsletter_heading", value: "Stay Connected with RMVS", label: "Newsletter Heading", category: "homepage" },
    { key: "home_newsletter_description", value: "Subscribe to our quarterly newsletter for updates on training programmes, success stories, and community impact across Junnar Taluka.", label: "Newsletter Description", category: "homepage" },

    // About
    { key: "about_stat_countries", value: "1", label: "Countries", category: "about" },
    { key: "about_stat_aid", value: "₹1.2 Cr", label: "Aid Distributed", category: "about" },
    { key: "about_stat_lives", value: "1,520+", label: "Lives Changed", category: "about" },
    { key: "about_stat_audits", value: "10", label: "Years of Operations", category: "about" },
    { key: "about_values_heading", value: "Our Core Values", label: "Values Heading", category: "about" },
    { key: "about_values_description", value: "These principles guide every programme, partnership, and decision at RMVS.", label: "Values Description", category: "about" },
    { key: "about_value_1_title", value: "Community First", label: "Value 1 Title", category: "about" },
    { key: "about_value_1_description", value: "Every programme is designed with and for the communities we serve, ensuring local ownership and long-term sustainability.", label: "Value 1 Description", category: "about" },
    { key: "about_value_1_label", value: "🤝", label: "Value 1 Icon", category: "about" },
    { key: "about_value_2_title", value: "Transparency", label: "Value 2 Title", category: "about" },
    { key: "about_value_2_description", value: "We publish quarterly financial reports and undergo annual third-party audits so every donor knows exactly how their contribution is used.", label: "Value 2 Description", category: "about" },
    { key: "about_value_2_label", value: "🔍", label: "Value 2 Icon", category: "about" },
    { key: "about_value_3_title", value: "Empowerment", label: "Value 3 Title", category: "about" },
    { key: "about_value_3_description", value: "We don't create dependency — we build skills, confidence, and economic independence so women can lead their own development.", label: "Value 3 Description", category: "about" },
    { key: "about_value_3_label", value: "💪", label: "Value 3 Icon", category: "about" },
    { key: "about_value_4_title", value: "Innovation", label: "Value 4 Title", category: "about" },
    { key: "about_value_4_description", value: "From digital literacy to AI-assisted agriculture, we bring cutting-edge tools to rural communities that need them most.", label: "Value 4 Description", category: "about" },
    { key: "about_value_4_label", value: "💡", label: "Value 4 Icon", category: "about" },

    // Legal
    { key: "legal_registration_statement", value: "Rupashree Mahila Vikas Sanstha (RMVS) is registered under the Maharashtra Public Trusts Act, 1950 (Reg. No. E-2843/Pune) and is recognised under Sections 12A and 80G of the Income Tax Act, 1961. FCRA registration pending with the Ministry of Home Affairs.", label: "Registration Statement", category: "legal" },
    { key: "donate_tax_note", value: "All donations to RMVS are eligible for tax exemption under Section 80G of the Income Tax Act, 1961. You will receive an 80G certificate for your donation.", label: "Tax Exemption Note", category: "legal" },

    // Contact
    { key: "contact_phone", value: "+91 98765 43210", label: "Contact Phone", category: "contact" },
    { key: "contact_email", value: "info@rmvs-india.org", label: "Contact Email", category: "contact" },
    { key: "contact_address", value: "RMVS Head Office, Kaldare Village, Junnar Taluka, Pune District, Maharashtra 412411", label: "Contact Address", category: "contact" },
    { key: "office_hours", value: "Monday - Saturday: 9:00 AM - 6:00 PM | Sunday: Closed", label: "Office Hours", category: "contact" },
    { key: "social_facebook", value: "https://facebook.com/rmvsindia", label: "Facebook URL", category: "contact" },
    { key: "social_instagram", value: "https://instagram.com/rmvs.india", label: "Instagram URL", category: "contact" },
    { key: "social_youtube", value: "https://youtube.com/@rmvsindia", label: "YouTube URL", category: "contact" },

    // Volunteer
    { key: "volunteer_hero_image", value: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80", label: "Volunteer Hero Image", category: "volunteer" },

    // General
    { key: "general.siteName", value: "Rupashree Mahila Vikas Sanstha", label: "Site Name", category: "general" },
    { key: "general.description", value: "RMVS is a Pune-registered public trust empowering rural and tribal women in Junnar Taluka through PMKVY-linked skill training, digital literacy, and women farmer livelihood programmes since 2014.", label: "Site Description", category: "general" },

    // Appearance
    { key: "appearance.brandColor", value: "#059669", label: "Brand Color", category: "appearance" },
  ];

  let created = 0;
  for (const s of settings) {
    const result = await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, label: s.label, category: s.category },
      create: s,
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
  }
  console.log(`    ${created} new settings created, ${settings.length - created} updated`);
}

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

async function seedPrograms() {
  console.log("  Seeding programs...");
  const programs = [
    { id: "a0000000-0000-0000-0000-000000000001", title: "Future Leaders Initiative", category: "Education", description: "Providing sustainable educational infrastructure and digital literacy to rural communities.", goal: 45000, raised: 33750, image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80", isStrategic: false, visibility: "both" as const },
    { id: "a0000000-0000-0000-0000-000000000002", title: "Pure Water Network", category: "Environment", description: "Engineering sustainable water access solutions for high-need regions globally.", goal: 92000, raised: 84640, image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80", isStrategic: false, visibility: "both" as const },
    { id: "a0000000-0000-0000-0000-000000000003", title: "Mobile Health Clinics", category: "Health", description: "Bringing professional medical care to remote areas through mobile surgical units.", goal: 12000, raised: 4800, image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80", isStrategic: false, visibility: "both" as const },
    { id: "a0000000-0000-0000-0000-000000000004", title: "The Great Green Wall Restoration", category: "Environment", description: "Our flagship environmental programme aims to restore 100,000 hectares of vital ecosystems across the Sahel region.", goal: 2500000, raised: 2050000, image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80", isStrategic: true, visibility: "programs" as const },
    { id: "a0000000-0000-0000-0000-000000000005", title: "Remote Medical Outposts", category: "Health", description: "Bringing life-saving healthcare and vaccination programmes to the most isolated communities.", goal: 450000, raised: 288000, image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80", isStrategic: true, visibility: "programs" as const },
    { id: "a0000000-0000-0000-0000-000000000006", title: "Code the Future Academy", category: "Education", description: "Equipping young minds with digital literacy and programming skills to break the cycle of poverty through technology.", goal: 120000, raised: 110400, image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80", isStrategic: true, visibility: "programs" as const },
    { id: "a0000000-0000-0000-0000-000000000007", title: "Crisis Response Logistics", category: "Emergency Relief", description: "Maintaining a global supply chain to deliver food, water, and shelter within 48 hours of any disaster.", goal: 800000, raised: 320000, image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80", isStrategic: true, visibility: "programs" as const },
  ];

  let created = 0;
  for (const p of programs) {
    const exists = await prisma.program.findUnique({ where: { id: p.id } });
    if (exists) {
      await prisma.program.update({ where: { id: p.id }, data: { title: p.title, category: p.category, description: p.description, goal: p.goal, raised: p.raised, image: p.image, isStrategic: p.isStrategic, visibility: p.visibility } });
    } else {
      await prisma.program.create({ data: { ...p, goal: p.goal, raised: p.raised } });
      created++;
    }
  }
  console.log(`    ${created} created, ${programs.length - created} updated`);
}

// ---------------------------------------------------------------------------
// Leaders
// ---------------------------------------------------------------------------

async function seedLeaders() {
  console.log("  Seeding leaders...");
  const leaders = [
    { id: "d0000000-0000-0000-0000-000000000001", name: "Dr. Elena Vance", role: "Chief Executive Officer", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80", department: "Executive", bio: "Over 20 years leading international relief efforts with a PhD in Development Economics.", quote: "True change happens when we invest in people, not just projects." },
    { id: "d0000000-0000-0000-0000-000000000002", name: "Marcus Thorne", role: "Director of Operations", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&h=400&q=80", department: "Operations", bio: "Specialist in logistics and emergency relief supply chains across challenging geographies.", quote: "Operational excellence saves lives — there is no room for inefficiency in humanitarian work." },
    { id: "d0000000-0000-0000-0000-000000000003", name: "Sarah Chen", role: "Chief Impact Officer", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80", department: "Impact Evaluation", bio: "Dedicated to quantitative evaluation of programmes to ensure absolute transparency and efficiency.", quote: "What gets measured gets improved. Our donors deserve nothing less than full accountability." },
    { id: "d0000000-0000-0000-0000-000000000004", name: "Amir Rahmani", role: "Finance Director", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80", department: "Finance", bio: "Former audit director specializing in NGO regulatory compliance and transparent tracking.", quote: "Financial integrity is the backbone of trust between an organisation and its stakeholders." },
  ];

  let created = 0;
  for (const l of leaders) {
    const exists = await prisma.leader.findUnique({ where: { id: l.id } });
    if (exists) {
      await prisma.leader.update({ where: { id: l.id }, data: { name: l.name, role: l.role, image: l.image, department: l.department, bio: l.bio, quote: l.quote } });
    } else {
      await prisma.leader.create({ data: l });
      created++;
    }
  }
  console.log(`    ${created} created, ${leaders.length - created} updated`);
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

async function seedTestimonials() {
  console.log("  Seeding testimonials...");
  const testimonials = [
    { id: "e0000000-0000-0000-0000-000000000001", initials: "DC", name: "David Chen", role: "Global Philanthropist", quote: "CompassionGlobal sets the absolute gold standard for NGO transparency. Every donation is tracked and reported.", rating: 5 },
    { id: "e0000000-0000-0000-0000-000000000002", initials: "SW", name: "Sarah Williams", role: "Lead Volunteer", quote: "Being a lead volunteer in Sub-Saharan Africa has changed my life. The impact we create together is immeasurable.", rating: 5 },
    { id: "e0000000-0000-0000-0000-000000000003", initials: "ER", name: "Dr. Elena Rodriguez", role: "Partner Organisation", quote: "Their commitment to local autonomy is what makes their programmes actually work long-term. A model for others.", rating: 5 },
    { id: "e0000000-0000-0000-0000-000000000004", initials: "PM", name: "Priya More", role: "Programme Graduate", quote: "RMVS training programme gave me the skills and confidence to start my own tailoring business. My family's income has doubled.", rating: 5 },
    { id: "e0000000-0000-0000-0000-000000000005", initials: "AK", name: "Anil Kulkarni", role: "Village Sarpanch, Kaldare", quote: "The digital literacy programme transformed our village. Young women who couldn't use a phone are now running online businesses.", rating: 5 },
  ];

  let created = 0;
  for (const t of testimonials) {
    const exists = await prisma.testimonial.findUnique({ where: { id: t.id } });
    if (exists) {
      await prisma.testimonial.update({ where: { id: t.id }, data: t });
    } else {
      await prisma.testimonial.create({ data: t });
      created++;
    }
  }
  console.log(`    ${created} created, ${testimonials.length - created} updated`);
}

// ---------------------------------------------------------------------------
// Gallery Items
// ---------------------------------------------------------------------------

async function seedGalleryItems() {
  console.log("  Seeding gallery items...");
  const items = [
    { id: "70000000-0000-0000-0000-000000000001", title: "Sahel Environmental Assessment", category: "Programs", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80", description: "Volunteers and local stewards map soil erosion rates in Senegal.", isVideo: false },
    { id: "70000000-0000-0000-0000-000000000002", title: "Hope in the Market", category: "Events", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80", description: "A local merchant shares details about her micro-financed business expansion.", isVideo: false },
    { id: "70000000-0000-0000-0000-000000000003", title: "Clinical Care Standards", category: "Archive", image: "https://images.unsplash.com/photo-1605684954278-9f5151585b0a?auto=format&fit=crop&w=600&q=80", description: "Medical teams prepare sterile instruments in our mobile health surgical clinics.", isVideo: false },
    { id: "70000000-0000-0000-0000-000000000004", title: "Digital Literacy for Children", category: "Videos", image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80", description: "A young student explores interactive mathematics courses using customized solar tablets.", isVideo: true },
    { id: "70000000-0000-0000-0000-000000000005", title: "Eco-Friendly Head Office", category: "Programs", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80", description: "Our carbon-neutral administration and innovation facility in Rwanda.", isVideo: false },
    { id: "70000000-0000-0000-0000-000000000006", title: "Water Well Celebration", category: "Events", image: "https://images.unsplash.com/photo-1518887570146-0612132dd618?auto=format&fit=crop&w=600&q=80", description: "Children celebrate clean, disease-free running water.", isVideo: false },
    { id: "70000000-0000-0000-0000-000000000007", title: "Women's Skill Training Camp", category: "Programs", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80", description: "Trainees learning tailoring and embroidery at our Junnar training centre.", isVideo: false },
    { id: "70000000-0000-0000-0000-000000000008", title: "Community Health Check-up", category: "Events", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80", description: "Free health screening camp organised for tribal villages near Junnar.", isVideo: false },
  ];

  let created = 0;
  for (const item of items) {
    const exists = await prisma.galleryItem.findUnique({ where: { id: item.id } });
    if (exists) {
      await prisma.galleryItem.update({ where: { id: item.id }, data: item });
    } else {
      await prisma.galleryItem.create({ data: item });
      created++;
    }
  }
  console.log(`    ${created} created, ${items.length - created} updated`);
}

// ---------------------------------------------------------------------------
// Blog Posts
// ---------------------------------------------------------------------------

async function seedBlogPosts() {
  console.log("  Seeding blog posts...");
  const posts = [
    {
      id: "b0000000-0000-0000-0000-000000000001",
      title: "The Future of Food Security: How Local Solutions are Shaping Global Policy",
      category: "Featured Story",
      description: "Across three continents, our latest initiative is empowering smallholder farmers with regenerative techniques and digital market access.",
      content: "Food security remains one of the most pressing challenges of our time. In Junnar Taluka, where agriculture is the primary livelihood, climate change and water scarcity threaten farming communities. Our latest initiative is working with 500 smallholder farmers across three villages to introduce drought-resistant crop varieties, micro-irrigation systems, and digital market linkages that connect them directly to buyers — eliminating exploitative middlemen. Early results show a 35% increase in crop yields and a 40% improvement in farmer incomes within the first season.",
      readTime: "8 min read",
      date: new Date("2026-06-01"),
      image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80",
      author: "Elena Rodriguez",
    },
    {
      id: "b0000000-0000-0000-0000-000000000002",
      title: "PMKVY Training Camp: 120 Women Certified in Beauty & Wellness",
      category: "News",
      description: "A record-breaking PMKVY-linked training camp saw 120 women from Junnar and surrounding villages complete certification in beauty and wellness skills.",
      content: "Over the past three months, RMVS partnered with the National Skill Development Corporation (NSDC) to deliver a comprehensive 12-week beauty and wellness training programme. Participants learned hair styling, skin care, mehndi art, and salon management. Of the 120 graduates, 45 have already started home-based businesses, while 30 have been placed in salons across Pune district. This is our largest single-batch achievement since RMVS was founded in 2014.",
      readTime: "5 min read",
      date: new Date("2026-05-15"),
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      author: "Rajesh Kumar",
    },
    {
      id: "b0000000-0000-0000-0000-000000000003",
      title: "Digital Literacy programme reaches 500th student milestone",
      category: "Impact",
      description: "Our Digital Literacy for Rural Communities programme has now trained over 500 students across 12 villages in Junnar Taluka.",
      content: "Launched in 2022, the Digital Literacy programme has grown from a small pilot in Kaldare village to a full-scale initiative covering 12 villages. Students learn basic computer skills, internet safety, digital payments, and social media marketing. The programme has been particularly impactful for women entrepreneurs who now use digital tools to grow their businesses. Our 500th graduate, Sunita Patil from Ale phata, has started an online tailoring business that serves customers across Maharashtra.",
      readTime: "6 min read",
      date: new Date("2026-04-20"),
      image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80",
      author: "Ananya Gupta",
    },
  ];

  let created = 0;
  for (const post of posts) {
    const exists = await prisma.blogPost.findUnique({ where: { id: post.id } });
    if (exists) {
      await prisma.blogPost.update({ where: { id: post.id }, data: post });
    } else {
      await prisma.blogPost.create({ data: post });
      created++;
    }
  }
  console.log(`    ${created} created, ${posts.length - created} updated`);
}

// ---------------------------------------------------------------------------
// Newsletters
// ---------------------------------------------------------------------------

async function seedNewsletters() {
  console.log("  Seeding newsletters...");
  const newsletters = [
    { id: "f0000000-0000-0000-0000-000000000001", title: "Innovation in Education: The Digital Leap", date: new Date("2024-05-01"), readTime: "12 min read", image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80" },
    { id: "f0000000-0000-0000-0000-000000000002", title: "Resilient Health Systems: Quarterly Review", date: new Date("2024-04-01"), readTime: "15 min read", image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80" },
    { id: "f0000000-0000-0000-0000-000000000003", title: "Climate Action & Global Conservation", date: new Date("2024-03-01"), readTime: "10 min read", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80" },
    { id: "f0000000-0000-0000-0000-000000000004", title: "Empowering Local Economies Through Micro-Grants", date: new Date("2024-02-01"), readTime: "8 min read", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80" },
    { id: "f0000000-0000-0000-0000-000000000005", title: "2023 Annual Impact Report & 2024 Roadmap", date: new Date("2024-01-01"), readTime: "20 min read", image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=600&q=80" },
    { id: "f0000000-0000-0000-0000-000000000006", title: "Clean Water: Reaching the Final Mile", date: new Date("2023-12-01"), readTime: "12 min read", image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80" },
  ];

  let created = 0;
  for (const nl of newsletters) {
    const exists = await prisma.newsletter.findUnique({ where: { id: nl.id } });
    if (exists) {
      await prisma.newsletter.update({ where: { id: nl.id }, data: nl });
    } else {
      await prisma.newsletter.create({ data: nl });
      created++;
    }
  }
  console.log(`    ${created} created, ${newsletters.length - created} updated`);
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

async function seedLocations() {
  console.log("  Seeding locations...");
  const locations = [
    { id: "00000000-0000-0000-0000-000000000001", name: "RMVS Head Office", location: "Kaldare Village, Junnar Taluka, Pune", type: "hub" as const, coordinator: "Rajesh Kumar", staffCount: 12, activePrograms: ["Digital Literacy", "Tailoring Training", "Community Health"], contactEmail: "junnar@rmvs-india.org", coordinates: "19.1974° N, 73.8643° E", description: "Our main training and operations centre serving women across Junnar Taluka.", phone: "+91 98765 43210", address: "RMVS Campus, Kaldare Village, Junnar, Pune District, Maharashtra 412411" },
    { id: "00000000-0000-0000-0000-000000000002", name: "Ale Phata Training Centre", location: "Ale Phata, Junnar Taluka, Pune", type: "hub" as const, coordinator: "Sunita Deshmukh", staffCount: 6, activePrograms: ["Beauty & Wellness", "Financial Literacy"], contactEmail: "ale@rmvs-india.org", coordinates: "19.2156° N, 73.9012° E", description: "Sub-centre focused on beauty & wellness training for women in Ale and surrounding villages." },
    { id: "00000000-0000-0000-0000-000000000003", name: "Narayangaon Field Office", location: "Narayangaon, Junnar Taluka, Pune", type: "office" as const, contactEmail: "narayangaon@rmvs-india.org", description: "Field coordination office for agricultural training programmes in northern Junnar." },
    { id: "00000000-0000-0000-0000-000000000004", name: "Pune Liaison Office", location: "Pune, Maharashtra", type: "office" as const, contactEmail: "pune@rmvs-india.org", phone: "+91 20 2567 8900", address: "401, Saket Society, Aundh, Pune 411007", description: "Liaison and donor relations office for Pune city and metropolitan area." },
    { id: "00000000-0000-0000-0000-000000000005", name: "Mumbai Support Centre", location: "Mumbai, Maharashtra", type: "office" as const, contactEmail: "mumbai@rmvs-india.org", phone: "+91 22 4567 8901", address: "204, Maker Tower, Cuffe Parade, Mumbai 400005", description: "Fundraising, advocacy, and corporate partnership office in Mumbai." },
    { id: "00000000-0000-0000-0000-000000000006", name: "Delhi Advocacy Desk", location: "New Delhi", type: "office" as const, contactEmail: "delhi@rmvs-india.org", phone: "+91 11 2345 6789", address: "305, Signature Tower, South Delhi, New Delhi 110001", description: "Policy advocacy and government liaison office for central schemes and partnerships." },
  ];

  let created = 0;
  for (const loc of locations) {
    const exists = await prisma.location.findUnique({ where: { id: loc.id } });
    if (exists) {
      await prisma.location.update({ where: { id: loc.id }, data: loc });
    } else {
      await prisma.location.create({ data: loc });
      created++;
    }
  }
  console.log(`    ${created} created, ${locations.length - created} updated`);
}

// ---------------------------------------------------------------------------
// Contact Info & Social Links
// ---------------------------------------------------------------------------

async function seedContactInfo() {
  console.log("  Seeding contact info & social links...");
  const contactId = "10000000-0000-0000-0000-000000000001";

  const exists = await prisma.contactInfo.findUnique({ where: { id: contactId } });
  if (!exists) {
    await prisma.contactInfo.create({
      data: {
        id: contactId,
        email: "info@rmvs-india.org",
        phone: "+91 98765 43210",
        socialLinks: {
          create: [
            { label: "Email", icon: "Mail", href: "mailto:info@rmvs-india.org" },
            { label: "Facebook", icon: "Facebook", href: "https://facebook.com/rmvsindia" },
            { label: "Instagram", icon: "Instagram", href: "https://instagram.com/rmvs.india" },
            { label: "YouTube", icon: "Youtube", href: "https://youtube.com/@rmvsindia" },
          ],
        },
      },
    });
    console.log("    Created contact info with social links");
  } else {
    console.log("    Contact info already exists, skipping");
  }
}

// ---------------------------------------------------------------------------
// Schemes
// ---------------------------------------------------------------------------

async function seedSchemes() {
  console.log("  Seeding schemes...");
  const schemes = [
    { id: "20000000-0000-0000-0000-000000000001", title: "PM Kisan Samman Nidhi", description: "Direct income support of Rs. 6,000/year for farmers through direct benefit transfer.", icon: "Users", category: "Agriculture", date: new Date("2026-09-01"), link: "https://pmkisan.gov.in" },
    { id: "20000000-0000-0000-0000-000000000002", title: "National Rural Livelihood Mission (NRLM)", description: "Skill training and self-employment opportunities for rural women through self-help groups.", icon: "Users", category: "Women Empowerment", date: new Date("2026-08-15"), link: "https://ajeevika.gov.in" },
    { id: "20000000-0000-0000-0000-000000000003", title: "Stand-Up India Scheme", description: "Bank loans between Rs. 10 lakh to Rs. 1 crore for SC/ST and women entrepreneurs.", icon: "GraduationCap", category: "Entrepreneurship", date: new Date("2026-09-10"), link: "https://www.standupmitra.in" },
    { id: "20000000-0000-0000-0000-000000000004", title: "Ayushman Bharat", description: "Health coverage up to Rs. 5 lakh per family per year for secondary and tertiary hospitalisation.", icon: "Heart", category: "Health", date: new Date("2026-08-20"), link: "https://www.pmjay.gov.in" },
    { id: "20000000-0000-0000-0000-000000000005", title: "National Scholarship Portal (NSP)", description: "Central and state scholarship schemes for SC/ST/OBC/minority students from Class 1 to PhD.", icon: "BookOpen", category: "Education", date: new Date("2026-09-05"), link: "https://scholarships.gov.in" },
    { id: "20000000-0000-0000-0000-000000000006", title: "PM Vishwakarma Yojana", description: "End-to-end support for artisans and craftspeople in 18 traditional trades with skill training and toolkit incentives.", icon: "Lightbulb", category: "Entrepreneurship", date: new Date("2026-10-01"), link: "https://www.pm-vishwakarma.gov.in" },
  ];

  let created = 0;
  for (const s of schemes) {
    const exists = await prisma.scheme.findUnique({ where: { id: s.id } });
    if (exists) {
      await prisma.scheme.update({ where: { id: s.id }, data: s });
    } else {
      await prisma.scheme.create({ data: s });
      created++;
    }
  }
  console.log(`    ${created} created, ${schemes.length - created} updated`);
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

async function seedMilestones() {
  console.log("  Seeding milestones...");
  const milestones = [
    { id: "50000000-0000-0000-0000-000000000001", year: 2014, title: "The Foundation", description: "RMVS was registered as a public trust in Pune with a vision to empower rural and tribal women through skill development." },
    { id: "50000000-0000-0000-0000-000000000002", year: 2017, title: "PMKVY Partnership", description: "Became an authorised training partner under Pradhan Mantri Kaushal Vikas Yojana, enabling nationally recognised certifications for our graduates." },
    { id: "50000000-0000-0000-0000-000000000003", year: 2020, title: "Digital Literacy Launch", description: "Launched the Digital Literacy for Rural Communities programme, bridging the digital divide for women in Junnar Taluka." },
    { id: "50000000-0000-0000-0000-000000000004", year: 2022, title: "1,000 Women Trained", description: "Crossed the milestone of training 1,000 women across beauty & wellness, tailoring, digital literacy, and agricultural programmes." },
    { id: "50000000-0000-0000-0000-000000000005", year: 2024, title: "Multi-Village Expansion", description: "Expanded operations to 12 villages across Junnar Taluka with two new training centres in Ale Phata and Narayangaon." },
    { id: "50000000-0000-0000-0000-000000000006", year: 2025, title: "1,520+ Women Empowered", description: "Reached 1,520+ women trained with a 78% placement/entrepreneurship rate. Launched online course platform for wider access." },
  ];

  let created = 0;
  for (const m of milestones) {
    const exists = await prisma.milestone.findUnique({ where: { id: m.id } });
    if (exists) {
      await prisma.milestone.update({ where: { id: m.id }, data: m });
    } else {
      await prisma.milestone.create({ data: m });
      created++;
    }
  }
  console.log(`    ${created} created, ${milestones.length - created} updated`);
}

// ---------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------

async function seedPartners() {
  console.log("  Seeding partners...");
  const partners = [
    { id: "60000000-0000-0000-0000-000000000001", name: "National Skill Development Corporation (NSDC)", icon: "Award" },
    { id: "60000000-0000-0000-0000-000000000002", name: "Maharashtra State Rural Livelihood Mission", icon: "Heart" },
    { id: "60000000-0000-0000-0000-000000000003", name: "District Planning Committee, Pune", icon: "Building2" },
    { id: "60000000-0000-0000-0000-000000000004", name: "Tata Trusts", icon: "HandHeart" },
    { id: "60000000-0000-0000-0000-000000000005", name: "UN Women India", icon: "Globe" },
    { id: "60000000-0000-0000-0000-000000000006", name: "Bajaj Foundation", icon: "Building" },
  ];

  let created = 0;
  for (const p of partners) {
    const exists = await prisma.partner.findUnique({ where: { id: p.id } });
    if (exists) {
      await prisma.partner.update({ where: { id: p.id }, data: p });
    } else {
      await prisma.partner.create({ data: p });
      created++;
    }
  }
  console.log(`    ${created} created, ${partners.length - created} updated`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Seeding CMS Content ===\n");

  await seedSiteSettings();
  await seedPrograms();
  await seedLeaders();
  await seedTestimonials();
  await seedGalleryItems();
  await seedBlogPosts();
  await seedNewsletters();
  await seedLocations();
  await seedContactInfo();
  await seedSchemes();
  await seedMilestones();
  await seedPartners();

  // Print summary
  const counts = await Promise.all([
    prisma.siteSetting.count(),
    prisma.program.count(),
    prisma.leader.count(),
    prisma.testimonial.count(),
    prisma.galleryItem.count(),
    prisma.blogPost.count(),
    prisma.newsletter.count(),
    prisma.location.count(),
    prisma.contactInfo.count(),
    prisma.socialLink.count(),
    prisma.scheme.count(),
    prisma.milestone.count(),
    prisma.partner.count(),
  ]);

  console.log("\n=== CMS Seed Complete — Final Counts ===");
  console.log(`  SiteSettings:    ${counts[0]}`);
  console.log(`  Programs:        ${counts[1]}`);
  console.log(`  Leaders:         ${counts[2]}`);
  console.log(`  Testimonials:    ${counts[3]}`);
  console.log(`  Gallery Items:   ${counts[4]}`);
  console.log(`  Blog Posts:      ${counts[5]}`);
  console.log(`  Newsletters:     ${counts[6]}`);
  console.log(`  Locations:       ${counts[7]}`);
  console.log(`  Contact Info:    ${counts[8]}`);
  console.log(`  Social Links:    ${counts[9]}`);
  console.log(`  Schemes:         ${counts[10]}`);
  console.log(`  Milestones:      ${counts[11]}`);
  console.log(`  Partners:        ${counts[12]}`);
  console.log("");
}

main()
  .catch((e) => {
    console.error("CMS seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
