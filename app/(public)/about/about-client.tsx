'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Award, Calendar, Target, ShieldCheck,
  MapPin, Mail, Globe, ArrowRight, X, Heart, Sparkles,
  CheckCircle, ChevronRight, Building, BarChart3,
  FileText, Download,
} from 'lucide-react';
import ScrollAnimate, { StaggerItem } from '@/components/public/ScrollAnimate';

export interface ComplianceDoc {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  year: number | null;
  displayOrder: number;
}

export interface MilestoneData {
  id: string;
  year: number;
  title: string;
  description: string;
}

export interface LeaderData {
  id: string;
  name: string;
  role: string;
  image: string;
  department: string;
  bio: string;
  quote: string;
}

export interface LocationData {
  id: string;
  name: string;
  location: string;
  coordinator: string;
  staffCount: number;
  activePrograms: string[];
  contactEmail: string;
  coordinates: string;
  description: string;
}

export default function AboutClient({
  complianceDocs,
  milestones: milestonesData,
  leaders: leadersData,
  locations,
  settings,
}: {
  complianceDocs: ComplianceDoc[];
  milestones: MilestoneData[];
  leaders: LeaderData[];
  locations: LocationData[];
  settings: Record<string, string>;
}) {
  const router = useRouter();
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneData | null>(milestonesData[0] ?? null);
  const [activeDepartment, setActiveDepartment] = useState<string>('All');
  const [selectedLeader, setSelectedLeader] = useState<LeaderData | null>(null);
  const [selectedHub, setSelectedHub] = useState<LocationData | null>(locations[0] ?? null);

  const departments = useMemo(() => {
    const list = new Set(leadersData.map(l => l.department));
    return ['All', ...Array.from(list)];
  }, [leadersData]);

  const filteredLeaders = useMemo(() => {
    if (activeDepartment === 'All') return leadersData;
    return leadersData.filter(l => l.department === activeDepartment);
  }, [activeDepartment, leadersData]);

  return (
    <div className="space-y-0 animate-in fade-in duration-300" id="about-page-root">
      
      {/* SECTION 1: HERO & CORE PURPOSE */}
      <section className="bg-gradient-to-b from-emerald-50/40 via-[#FDFEFF] to-white pt-16 pb-12 sm:pt-20 sm:pb-16 text-center" id="about-hero">
        <ScrollAnimate variant="fadeInUp" delay={0.1} className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/60 text-brand-primary border border-emerald-200/40 mb-4 animate-in fade-in zoom-in duration-500">
            <Sparkles className="h-4 w-4 text-brand-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">Our Story</span>
          </div>
          
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-gray-900 tracking-tight leading-tight">
            From One Beauty Parlour to a <br />
            <span className="text-brand-primary">Movement for Women&apos;s Self-Reliance</span>
          </h1>
          
          <p className="mt-6 text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            {settings.legal_registration_statement && <>{settings.legal_registration_statement} </>}
            Rupashree Mahila Vikas Sanstha began with one woman&apos;s small business in Junnar and grew into a registered public trust delivering government-linked skill training to over 1,500 women across Pune district.
          </p>

          {(settings.about_stat_countries || settings.about_stat_aid || settings.about_stat_lives || settings.about_stat_audits) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm" id="about-metrics-bar">
              {settings.about_stat_countries && (
                <div className="text-center space-y-1">
                  <span className="block font-display font-bold text-3xl sm:text-4xl text-gray-900">{settings.about_stat_countries}</span>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Founded</span>
                </div>
              )}
              {settings.about_stat_aid && (
                <div className="text-center space-y-1 border-l border-gray-100">
                  <span className="block font-display font-bold text-3xl sm:text-4xl text-brand-primary">{settings.about_stat_aid}</span>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Registrations Held</span>
                </div>
              )}
              {settings.about_stat_lives && (
                <div className="text-center space-y-1 border-l border-gray-100">
                  <span className="block font-display font-bold text-3xl sm:text-4xl text-gray-900">{settings.about_stat_lives}</span>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Women Trained</span>
                </div>
              )}
              {settings.about_stat_audits && (
                <div className="text-center space-y-1 border-l border-gray-100">
                  <span className="block font-display font-bold text-3xl sm:text-4xl text-brand-primary">{settings.about_stat_audits}</span>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">ISO Certified</span>
                </div>
              )}
            </div>
          )}
        </ScrollAnimate>
      </section>

      {/* SECTION 2: OUR CORE VALUES */}
      <section className="bg-white py-16 sm:py-24 border-t border-gray-100" id="about-values">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimate variant="fadeInUp" className="text-center space-y-3 max-w-xl mx-auto mb-16">
            <h2 className="font-display font-bold text-3xl text-gray-900 tracking-tight">{settings.about_values_heading || 'Our Objectives'}</h2>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
              {settings.about_values_description || 'Every programme we run serves one of five founding objectives: vocational training, all-age skill development, community camps and workshops, government scheme outreach, and rural health awareness.'}
            </p>
          </ScrollAnimate>

          <ScrollAnimate variant="stagger" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" id="values-grid">
            {[1, 2, 3, 4].map((i) => {
              const title = settings[`about_value_${i}_title`];
              const desc = settings[`about_value_${i}_description`];
              const label = settings[`about_value_${i}_label`];
              if (!title && !desc) return null;
              const icons = [ShieldCheck, Users, BarChart3, Target];
              const Icon = icons[i - 1] || ShieldCheck;
              return (
                <StaggerItem key={i} className="bg-[#FCFDFC] p-8 rounded-3xl border border-gray-100 hover:border-emerald-200/70 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between" id={`value-card-${i}`}>
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                  {label && (
                    <div className="pt-4 border-t border-gray-50 mt-6 flex items-center text-[10px] text-brand-primary font-bold uppercase tracking-wider font-mono">
                      {label} <CheckCircle className="h-3.5 w-3.5 ml-1" />
                    </div>
                  )}
                </StaggerItem>
              );
            })}
          </ScrollAnimate>
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE MILESTONES TIMELINE */}
      <section className="bg-gray-50/50 py-16 sm:py-24 border-y border-gray-100" id="about-timeline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <ScrollAnimate variant="fadeInLeft" className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/50 text-brand-primary">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">Our History &amp; Growth</span>
              </div>
              <h2 className="font-display font-bold text-3xl text-gray-900 tracking-tight leading-tight">
                Our Journey Since Inception
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Explore key milestones — from Ashwini Navale&apos;s first beauty parlour in 2011 to founding Rupashree Shetkari Utpadak Company for women farmers in 2021.
              </p>
 
              {selectedMilestone && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/60 shadow-sm space-y-4 animate-in fade-in duration-300" id="selected-milestone-panel">
                <div className="flex items-center justify-between">
                  <span className="px-3.5 py-1 text-xs font-bold text-brand-primary bg-emerald-50 rounded-full font-mono">
                    Established in {selectedMilestone.year}
                  </span>
                  <Award className="h-5 w-5 text-brand-primary" />
                </div>
                <h3 className="font-display font-bold text-lg text-gray-900">
                  {selectedMilestone.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {selectedMilestone.description}
                </p>
 
                <div className="border-l-2 border-brand-primary pl-4 py-1 text-xs text-gray-500 italic">
                  &quot;Since founding RMVS, I&apos;ve watched women move from dependency to confidence — earning their own income and standing on their own feet. There&apos;s more work ahead, and many new initiatives still to launch for the women of our region.&quot; — Ashwini Navale, Founder &amp; Chairperson
                </div>
              </div>
              )}
            </ScrollAnimate>
 
            <ScrollAnimate variant="fadeInRight" className="lg:col-span-7">
              <div className="relative pl-8 sm:pl-12 border-l border-gray-200 space-y-12 py-4" id="timeline-nodes-container">
                {milestonesData.map((milestone) => {
                  const isSelected = selectedMilestone?.id === milestone.id;
                  return (
                    <button
                      key={milestone.id}
                      type="button"
                      onClick={() => setSelectedMilestone(milestone)}
                      className={`w-full text-left relative focus:outline-none block group cursor-pointer`}
                      id={`milestone-node-${milestone.id}`}
                    >
                      <span className={`absolute -left-12 sm:-left-16 top-1.5 w-8 h-8 rounded-full border-4 flex items-center justify-center font-display font-bold text-xs transition-all duration-300 ${
                        isSelected
                          ? 'bg-brand-primary border-emerald-100 text-white scale-110 shadow-md shadow-brand-primary/20'
                          : 'bg-white border-gray-200 text-gray-400 group-hover:border-emerald-100 group-hover:text-brand-primary'
                      }`}>
                        {milestonesData.indexOf(milestone) + 1}
                      </span>
 
                      <div className={`p-6 rounded-2xl border transition-all duration-300 ${
                        isSelected
                          ? 'bg-white border-brand-primary shadow-sm ring-1 ring-brand-primary/10'
                          : 'bg-white/40 hover:bg-white border-gray-100 hover:border-gray-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className={`font-display font-extrabold text-lg sm:text-xl ${
                            isSelected ? 'text-brand-primary' : 'text-gray-400 group-hover:text-gray-700'
                          }`}>
                            {milestone.year}
                          </span>
                          <span className="text-gray-200">|</span>
                          <span className="font-semibold text-gray-800 text-sm sm:text-base group-hover:text-brand-primary transition-colors">
                            {milestone.title}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {milestone.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollAnimate>
 
          </div>
 
        </div>
      </section>

      {/* SECTION 4: INTERACTIVE HUMANITARIAN LEADERS & EXPERTS */}
      <section className="bg-white py-16 sm:py-24" id="about-leaders">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <ScrollAnimate variant="fadeInUp" className="text-center space-y-4 max-w-xl mx-auto mb-12">
            <h2 className="font-display font-bold text-3xl text-gray-900 tracking-tight">Our Governing Committee</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Seven women leading skill development, outreach, and governance for RMVS across Junnar Taluka.
            </p>
 
            <div className="flex flex-wrap gap-2 justify-center pt-4" id="leader-department-filters">
              {departments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setActiveDepartment(dept)}
                  className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                    activeDepartment === dept
                      ? 'bg-brand-primary border-brand-primary text-white shadow-sm'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600'
                  }`}
                  id={`filter-dept-${dept.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </ScrollAnimate>
 
          <ScrollAnimate variant="stagger" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" id="leaders-cards-grid">
            {filteredLeaders.map((leader) => (
              <StaggerItem
                key={leader.id}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-100 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                id={`leader-card-${leader.id}`}
              >
                <div>
                  <div className="aspect-square bg-gray-100 relative overflow-hidden group">
                    {leader.image?.trim() ? (
                      <img
                        src={leader.image}
                        alt={leader.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-mint to-emerald-200">
                        <span className="text-4xl font-bold text-emerald-800 font-display">
                          {leader.name.trim().charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 text-[10px] font-bold text-emerald-950 bg-brand-mint rounded-full uppercase tracking-wider shadow-sm font-mono">
                      {leader.department}
                    </span>
                  </div>
 
                  <div className="p-6 space-y-2">
                    <h3 className="font-display font-bold text-gray-900 text-base">{leader.name}</h3>
                    <p className="text-xs text-brand-primary font-medium">{leader.role}</p>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                      {leader.bio}
                    </p>
                  </div>
                </div>
 
                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => setSelectedLeader(leader)}
                    className="w-full py-2.5 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-brand-primary font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    id={`leader-btn-bio-${leader.id}`}
                  >
                    View Profile
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </StaggerItem>
            ))}
          </ScrollAnimate>
 
        </div>
      </section>

      {/* SECTION 5: INTERACTIVE GLOBAL HUB SPOTLIGHT */}
      <section className="bg-gray-50/40 py-16 sm:py-24 border-t border-gray-100" id="about-global-hubs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            
            <ScrollAnimate variant="fadeInLeft" className="lg:col-span-5 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/50 text-brand-primary border border-emerald-200/20">
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider font-mono">Where We Work</span>
                </div>
                <h2 className="font-display font-bold text-3xl text-gray-900 tracking-tight leading-tight">
                  Our Office in Junnar Taluka
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We operate from Kaldare village, serving surrounding gram panchayats across Junnar Taluka, Pune district.
                </p>
 
                <div className="space-y-3" id="regional-hubs-menu">
                  {locations.map((hub) => {
                    const isCurrent = selectedHub?.id === hub.id;
                    return (
                      <button
                        key={hub.id}
                        type="button"
                        onClick={() => setSelectedHub(hub)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between group transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-white border-brand-primary shadow-sm'
                            : 'bg-[#FCFDFC]/60 hover:bg-white border-gray-100 hover:border-gray-200'
                        }`}
                        id={`btn-hub-menu-${hub.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-brand-primary animate-pulse' : 'bg-gray-300'}`} />
                          <div>
                            <span className="block text-xs font-bold text-gray-900">{hub.location}</span>
                            <span className="block text-[10px] text-gray-400 font-mono font-medium">{hub.name}</span>
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-transform ${isCurrent ? 'text-brand-primary translate-x-0.5' : 'text-gray-300 group-hover:text-gray-600'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </ScrollAnimate>
 
            <ScrollAnimate variant="fadeInRight" className="lg:col-span-7">
              {selectedHub ? (
              <div className="bg-white rounded-3xl border border-gray-200/80 p-8 shadow-md flex flex-col justify-between h-full space-y-8 animate-in fade-in duration-300" id="hub-spotlight-box">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                    <div>
                      <span className="text-[10px] text-brand-primary font-extrabold uppercase font-mono tracking-widest block">HEAD OFFICE</span>
                      <h3 className="font-display font-bold text-xl text-gray-950 mt-1">{selectedHub.name}</h3>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs font-mono text-gray-500">{selectedHub.coordinates}</span>
                    </div>
                  </div>
 
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    {selectedHub.description}
                  </p>
 
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100/70">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Chairperson</span>
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-brand-primary" /> {selectedHub.coordinator}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Committee Members</span>
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-brand-primary" /> {selectedHub.staffCount} Members
                      </span>
                    </div>
                  </div>
 
                  <div className="space-y-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Programmes</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedHub.activePrograms.map((program) => (
                        <span
                          key={program}
                          className="px-3 py-1 bg-emerald-50 text-brand-primary text-[11px] font-bold rounded-lg border border-emerald-100/50"
                        >
                          {program}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
 
                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-mono font-semibold text-gray-500">{selectedHub.contactEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { router.push('/volunteer'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    id="hub-volunteer-btn"
                  >
                    Contact This Office
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              ) : (
              <div className="bg-white rounded-3xl border border-gray-200/80 p-8 shadow-md flex items-center justify-center h-full min-h-[300px]">
                <p className="text-sm text-gray-400">Office details coming soon — contact us at ashwininavale83@gmail.com.</p>
              </div>
              )}
            </ScrollAnimate>
 
          </div>
 
        </div>
      </section>

      {/* SECTION 6: COMPLIANCE & TRANSPARENCY DOCUMENTS */}
      {complianceDocs.length > 0 && (
        <section className="bg-white py-16 sm:py-24 border-t border-gray-100" id="about-compliance">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <ScrollAnimate variant="fadeInUp" className="text-center space-y-3 max-w-xl mx-auto mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/60 text-brand-primary border border-emerald-200/40">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">Verified &amp; Certified</span>
              </div>
              <h2 className="font-display font-bold text-3xl text-gray-900 tracking-tight">Transparency &amp; Compliance</h2>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                Rupashree Mahila Vikas Sanstha is a registered public charitable trust recognised by multiple state and central government bodies. Download our registration and empanelment certificates below.
              </p>
            </ScrollAnimate>

            <ScrollAnimate variant="stagger" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="compliance-docs-grid">
              {complianceDocs.map((doc) => (
                <StaggerItem
                  key={doc.id}
                  className="bg-[#FCFDFC] p-6 rounded-2xl border border-gray-100 hover:border-emerald-200/70 hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
                  id={`compliance-doc-${doc.id}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shrink-0">
                        {doc.mimeType === 'application/pdf' ? (
                          <FileText className="h-5 w-5" />
                        ) : (
                          <Award className="h-5 w-5" />
                        )}
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-50 rounded-full uppercase tracking-wider font-mono">
                        {doc.typeLabel}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-gray-900 leading-snug">{doc.title}</h3>
                      {doc.year && (
                        <span className="text-[10px] text-gray-400 font-mono font-medium mt-1 block">Year: {doc.year}</span>
                      )}
                    </div>
                    {doc.description && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{doc.description}</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-50 mt-4">
                    {doc.fileUrl ? (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-emerald-50 hover:bg-brand-primary text-brand-primary hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                        id={`compliance-dl-${doc.id}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {doc.mimeType === 'application/pdf' ? 'View PDF' : 'Download'}
                      </a>
                    ) : (
                      <span className="w-full py-2.5 bg-gray-50 text-gray-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed">
                        <FileText className="h-3.5 w-3.5" />
                        File unavailable
                      </span>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </ScrollAnimate>

          </div>
        </section>
      )}

      {/* SECTION 7: HIGH-CONVERTING BOTTOM CALL TO ACTION */}
      <section className="bg-gradient-to-br from-[#063426] via-[#04241B] to-black py-20 text-white text-center relative overflow-hidden" id="about-cta">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <ScrollAnimate variant="scaleUp" className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/20 text-brand-mint border border-brand-primary/30 mx-auto">
            <Heart className="h-3.5 w-3.5 fill-brand-mint text-brand-mint" />
            <span className="text-xs font-semibold uppercase tracking-wider">Get Involved</span>
          </div>
  
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight max-w-2xl mx-auto">
            Be Part of the Next Chapter
          </h2>
          
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Whether you want to support a skill training batch, volunteer as a trainer, or fund a women farmers&apos; initiative — your involvement helps rural women in Junnar Taluka build lasting self-reliance.
          </p>
 
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6" id="about-cta-btns">
            <button
              onClick={() => { router.push('/donate'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer group"
              id="cta-donate-btn"
            >
              <Heart className="mr-2 h-4 w-4 fill-white text-white group-hover:scale-110 transition-transform duration-200" />
              Support Our Work
            </button>
            <button
              onClick={() => { router.push('/volunteer'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white hover:text-white border border-white/20 font-bold text-sm transition-all cursor-pointer"
              id="cta-volunteer-btn"
            >
              Become a Volunteer
            </button>
          </div>
        </ScrollAnimate>
      </section>

      {/* DETAIL MODAL: Human Leader Detailed Biography & Profile card */}
      {selectedLeader && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" id="leader-modal-overlay">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative text-gray-900 p-8 space-y-6" id="leader-modal-content">
            
            <button
              onClick={() => setSelectedLeader(null)}
              className="absolute top-5 right-5 p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full transition-colors cursor-pointer"
              aria-label="Close Profile"
              id="close-leader-modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-5 pb-5 border-b border-gray-100">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden shadow-inner shrink-0">
                {selectedLeader.image?.trim() ? (
                  <img
                    src={selectedLeader.image}
                    alt={selectedLeader.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-mint to-emerald-200">
                    <span className="text-2xl font-bold text-emerald-800 font-display">
                      {selectedLeader.name.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <span className="px-2.5 py-0.5 text-[9px] font-bold text-emerald-950 bg-brand-mint rounded-full uppercase tracking-wider font-mono">
                  {selectedLeader.department}
                </span>
                <h3 className="font-display font-bold text-xl text-gray-900 mt-1">{selectedLeader.name}</h3>
                <p className="text-xs text-brand-primary font-medium">{selectedLeader.role}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-gray-600">
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Biography</span>
                <p className="text-gray-600 font-medium leading-relaxed">
                  {selectedLeader.bio}
                </p>
              </div>

              {selectedLeader.quote && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <span className="text-[10px] text-brand-primary font-bold uppercase tracking-wider block font-mono">In Their Words</span>
                  <p className="italic font-medium text-gray-500">
                    &quot;{selectedLeader.quote}&quot;
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
              <a
                href={`mailto:${selectedLeader.name.toLowerCase().replace(/\s+/g, '')}@compassionglobal.org`}
                className="py-3 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-brand-primary font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 text-center"
              >
                <Mail className="h-4 w-4" /> Contact Us
              </a>
              <button
                onClick={() => { setSelectedLeader(null); router.push('/volunteer'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer text-center"
              >
                Support {selectedLeader.name.split(' ')[0]}&apos;s Team
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
