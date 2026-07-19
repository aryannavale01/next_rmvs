'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Award, Calendar, Target, ShieldCheck,
  MapPin, Mail, Globe, ArrowRight, X, Heart, Sparkles,
  CheckCircle, ChevronRight, Building, BarChart3,
} from 'lucide-react';
import { milestones, leaders } from '@/lib/public-data';
import { Milestone, Leader } from '@/lib/public-data';
import ScrollAnimate, { StaggerItem } from '@/components/public/ScrollAnimate';

// Custom regional hubs data for our interactive section
interface RegionalHub {
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

const REGIONAL_HUBS: RegionalHub[] = [
  {
    id: 'hub1',
    name: 'East Africa Logistics Hub',
    location: 'Nairobi, Kenya',
    coordinator: 'Dr. John Kiprop',
    staffCount: 42,
    activePrograms: ['Sahel Restoration', 'Mobile Nursing Clinics', 'Solar Classrooms'],
    contactEmail: 'nairobi@compassionglobal.org',
    coordinates: '1.2921° S, 36.8219° E',
    description: 'Our primary operations base for Sub-Saharan Africa, serving as the central supply-chain node for medicine, reforestation kits, and training materials.'
  },
  {
    id: 'hub2',
    name: 'Southeast Asia Field Office',
    location: 'Phnom Penh, Cambodia',
    coordinator: 'Sophea Meade',
    staffCount: 28,
    activePrograms: ['Code the Future Academy', 'Water Infrastructure Solutions', 'Micro-grants'],
    contactEmail: 'phnompenh@compassionglobal.org',
    coordinates: '11.5564° N, 104.9282° E',
    description: 'Focused on digital literacy and vocational software training, alongside sustainable water filtration installations in rural Mekong regions.'
  },
  {
    id: 'hub3',
    name: 'West Africa Corridor',
    location: 'Dakar, Senegal',
    coordinator: 'Moussa Diouf',
    staffCount: 19,
    activePrograms: ['Great Green Wall Planting', 'Maternal Health Initiatives'],
    contactEmail: 'dakar@compassionglobal.org',
    coordinates: '14.7167° N, 17.4677° W',
    description: 'Coordinating regional silviculture experts and local women cooperatives to cultivate and protect native acacia corridors.'
  },
  {
    id: 'hub4',
    name: 'European Administrative Office',
    location: 'Geneva, Switzerland',
    coordinator: 'Claire Laurent',
    staffCount: 12,
    activePrograms: ['Global Donor Advocacy', 'Audit & Compliance Coordination'],
    contactEmail: 'geneva@compassionglobal.org',
    coordinates: '46.2044° N, 6.1432° E',
    description: 'Responsible for international compliance, coordination with third-party audit teams, and representing regional reports to the UN and global stakeholders.'
  }
];

export default function AboutPage() {
  const router = useRouter();
  // States for interactive timeline, team filtering, and detailed modal/drawer
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone>(milestones[0]);
  const [activeDepartment, setActiveDepartment] = useState<string>('All');
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [selectedHub, setSelectedHub] = useState<RegionalHub>(REGIONAL_HUBS[0]);

  // Extract unique departments for the filtering buttons
  const departments = useMemo(() => {
    const list = new Set(leaders.map(l => l.department));
    return ['All', ...Array.from(list)];
  }, []);

  // Filtered leaders list
  const filteredLeaders = useMemo(() => {
    if (activeDepartment === 'All') return leaders;
    return leaders.filter(l => l.department === activeDepartment);
  }, [activeDepartment]);

  return (
    <div className="space-y-0 animate-in fade-in duration-300" id="about-page-root">
      
      {/* SECTION 1: HERO & CORE PURPOSE */}
      <section className="bg-gradient-to-b from-emerald-50/40 via-[#FDFEFF] to-white pt-16 pb-12 sm:pt-20 sm:pb-16 text-center" id="about-hero">
        <ScrollAnimate variant="fadeInUp" delay={0.1} className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/60 text-brand-primary border border-emerald-200/40 mb-4 animate-in fade-in zoom-in duration-500">
            <Sparkles className="h-4 w-4 text-brand-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">Who We Are</span>
          </div>
          
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-gray-900 tracking-tight leading-tight">
            We Build Paths to <br />
            <span className="text-brand-primary">Dignity and Self-Reliance</span>
          </h1>
          
          <p className="mt-6 text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            CompassionGlobal is a registered 501(c)(3) non-governmental organization. We combine deep local partnerships with rigorous, technology-driven operations to fund and deploy sustainable solutions worldwide.
          </p>

          {/* Core Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm" id="about-metrics-bar">
            <div className="text-center space-y-1">
              <span className="block font-display font-bold text-3xl sm:text-4xl text-gray-900">15+</span>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Countries Active</span>
            </div>
            <div className="text-center space-y-1 border-l border-gray-100">
              <span className="block font-display font-bold text-3xl sm:text-4xl text-brand-primary">92%</span>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Direct Aid Routing</span>
            </div>
            <div className="text-center space-y-1 border-l border-gray-100">
              <span className="block font-display font-bold text-3xl sm:text-4xl text-gray-900">250K+</span>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lives Empowered</span>
            </div>
            <div className="text-center space-y-1 border-l border-gray-100">
              <span className="block font-display font-bold text-3xl sm:text-4xl text-brand-primary">100%</span>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Audits Cleared</span>
            </div>
          </div>
        </ScrollAnimate>
      </section>

      {/* SECTION 2: OUR CORE VALUES */}
      <section className="bg-white py-16 sm:py-24 border-t border-gray-100" id="about-values">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimate variant="fadeInUp" className="text-center space-y-3 max-w-xl mx-auto mb-16">
            <h2 className="font-display font-bold text-3xl text-gray-900 tracking-tight">Our Foundational Values</h2>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
              We hold ourselves to strict structural mandates to guarantee that every single dollar contributed yields lasting, certified local growth.
            </p>
          </ScrollAnimate>

          <ScrollAnimate variant="stagger" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" id="values-grid">
            {/* Value 1 */}
            <StaggerItem className="bg-[#FCFDFC] p-8 rounded-3xl border border-gray-100 hover:border-emerald-200/70 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between" id="value-card-transparency">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-gray-900">Radical Transparency</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  We live-track resources down to local procurement logs. We publish third-party compliance reviews every quarter without exception.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-50 mt-6 flex items-center text-[10px] text-brand-primary font-bold uppercase tracking-wider font-mono">
                Certified Integrity <CheckCircle className="h-3.5 w-3.5 ml-1" />
              </div>
            </StaggerItem>

            {/* Value 2 */}
            <StaggerItem className="bg-[#FCFDFC] p-8 rounded-3xl border border-gray-100 hover:border-emerald-200/70 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between" id="value-card-autonomy">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-gray-900">Local Sovereignty</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  We do not dictate programs from afar. Every initiative is conceptualized, designed, and executed by regional leaders who own the long-term stewardship.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-50 mt-6 flex items-center text-[10px] text-brand-primary font-bold uppercase tracking-wider font-mono">
                Community Owned <CheckCircle className="h-3.5 w-3.5 ml-1" />
              </div>
            </StaggerItem>

            {/* Value 3 */}
            <StaggerItem className="bg-[#FCFDFC] p-8 rounded-3xl border border-gray-100 hover:border-emerald-200/70 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between" id="value-card-rigor">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-gray-900">Scientific Rigor</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  We measure soil chemistry, school retention curves, and public medical statistics to iterate our models iteratively based on evidence.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-50 mt-6 flex items-center text-[10px] text-brand-primary font-bold uppercase tracking-wider font-mono">
                Data-Proven Models <CheckCircle className="h-3.5 w-3.5 ml-1" />
              </div>
            </StaggerItem>

            {/* Value 4 */}
            <StaggerItem className="bg-[#FCFDFC] p-8 rounded-3xl border border-gray-100 hover:border-emerald-200/70 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between" id="value-card-focus">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-gray-900">Relentless Focus</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  We avoid multi-campaign bloat. We prioritize high-impact sectors—clinical nursing, clean running water, reforestation, and digital education.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-50 mt-6 flex items-center text-[10px] text-brand-primary font-bold uppercase tracking-wider font-mono">
                Targeted Interventions <CheckCircle className="h-3.5 w-3.5 ml-1" />
              </div>
            </StaggerItem>
          </ScrollAnimate>
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE MILESTONES TIMELINE */}
      <section className="bg-gray-50/50 py-16 sm:py-24 border-y border-gray-100" id="about-timeline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side timeline description & details */}
            <ScrollAnimate variant="fadeInLeft" className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/50 text-brand-primary">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">Our History &amp; Growth</span>
              </div>
              <h2 className="font-display font-bold text-3xl text-gray-900 tracking-tight leading-tight">
                Our Journey Since Inception
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Click on any milestone year to reveal key field logs, specific operations established, and direct community indicators achieved during that growth chapter.
              </p>
 
              {/* Dynamic Display of Selected Milestone */}
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
 
                {/* Simulated quote or log entry for realistic detail */}
                <div className="border-l-2 border-brand-primary pl-4 py-1 text-xs text-gray-500 italic">
                  &quot;Deploying structured frameworks allowed us to verify our early field-testing with direct compliance, proving to our early donor networks that absolute transparency is possible.&quot;
                </div>
              </div>
            </ScrollAnimate>
 
            {/* Right side interactive vertical nodes */}
            <ScrollAnimate variant="fadeInRight" className="lg:col-span-7">
              <div className="relative pl-8 sm:pl-12 border-l border-gray-200 space-y-12 py-4" id="timeline-nodes-container">
                {milestones.map((milestone) => {
                  const isSelected = selectedMilestone.id === milestone.id;
                  return (
                    <button
                      key={milestone.id}
                      type="button"
                      onClick={() => setSelectedMilestone(milestone)}
                      className={`w-full text-left relative focus:outline-none block group cursor-pointer`}
                      id={`milestone-node-${milestone.id}`}
                    >
                      {/* Node Bullet */}
                      <span className={`absolute -left-12 sm:-left-16 top-1.5 w-8 h-8 rounded-full border-4 flex items-center justify-center font-display font-bold text-xs transition-all duration-300 ${
                        isSelected
                          ? 'bg-brand-primary border-emerald-100 text-white scale-110 shadow-md shadow-brand-primary/20'
                          : 'bg-white border-gray-200 text-gray-400 group-hover:border-emerald-100 group-hover:text-brand-primary'
                      }`}>
                        {milestones.indexOf(milestone) + 1}
                      </span>
 
                      {/* Content Box */}
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
            <h2 className="font-display font-bold text-3xl text-gray-900 tracking-tight">Our Leadership Team</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Meet our team of logistics managers, certified field medical advisors, and conservation specialists operating with full accountability.
            </p>
 
            {/* Interactive Filters */}
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
 
          {/* Leaders Grid */}
          <ScrollAnimate variant="stagger" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" id="leaders-cards-grid">
            {filteredLeaders.map((leader) => (
              <StaggerItem
                key={leader.id}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-100 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                id={`leader-card-${leader.id}`}
              >
                <div>
                  {/* Image container */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden group">
                    <img
                      src={leader.image}
                      alt={leader.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 text-[10px] font-bold text-emerald-950 bg-brand-mint rounded-full uppercase tracking-wider shadow-sm font-mono">
                      {leader.department}
                    </span>
                  </div>
 
                  {/* Text Container */}
                  <div className="p-6 space-y-2">
                    <h3 className="font-display font-bold text-gray-900 text-base">{leader.name}</h3>
                    <p className="text-xs text-brand-primary font-medium">{leader.role}</p>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                      {leader.bio}
                    </p>
                  </div>
                </div>
 
                {/* Button to click and view profile */}
                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => setSelectedLeader(leader)}
                    className="w-full py-2.5 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-brand-primary font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    id={`leader-btn-bio-${leader.id}`}
                  >
                    View Biography
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
            
            {/* Left Column: List of Hubs */}
            <ScrollAnimate variant="fadeInLeft" className="lg:col-span-5 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/50 text-brand-primary border border-emerald-200/20">
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider font-mono">Global Footprint</span>
                </div>
                <h2 className="font-display font-bold text-3xl text-gray-900 tracking-tight leading-tight">
                  Regional Logistical Offices
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We deploy localized operational bases directly inside the primary geographical sectors we support, keeping administrative cost low.
                </p>
 
                {/* Vertically clickable regional buttons */}
                <div className="space-y-3" id="regional-hubs-menu">
                  {REGIONAL_HUBS.map((hub) => {
                    const isCurrent = selectedHub.id === hub.id;
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
 
            {/* Right Column: Dynamic Spotlight Detail Box */}
            <ScrollAnimate variant="fadeInRight" className="lg:col-span-7">
              <div className="bg-white rounded-3xl border border-gray-200/80 p-8 shadow-md flex flex-col justify-between h-full space-y-8 animate-in fade-in duration-300" id="hub-spotlight-box">
                <div className="space-y-6">
                  {/* Spotlight Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                    <div>
                      <span className="text-[10px] text-brand-primary font-extrabold uppercase font-mono tracking-widest block">ACTIVE HUB FOCUS</span>
                      <h3 className="font-display font-bold text-xl text-gray-950 mt-1">{selectedHub.name}</h3>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs font-mono text-gray-500">{selectedHub.coordinates}</span>
                    </div>
                  </div>
 
                  {/* Hub Description */}
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    {selectedHub.description}
                  </p>
 
                  {/* Coordinator & Staff Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100/70">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Regional Director</span>
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-brand-primary" /> {selectedHub.coordinator}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Full-time Logistics Crew</span>
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-brand-primary" /> {selectedHub.staffCount} Dedicated Experts
                      </span>
                    </div>
                  </div>
 
                  {/* Active programs in this Hub */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Regional Operations</span>
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
 
                {/* Contact Regional Hub Button */}
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
                    Deploy to this Hub
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </ScrollAnimate>
 
          </div>
 
        </div>
      </section>
 
      {/* SECTION 6: HIGH-CONVERTING BOTTOM CALL TO ACTION */}
      <section className="bg-gradient-to-br from-[#063426] via-[#04241B] to-black py-20 text-white text-center relative overflow-hidden" id="about-cta">
        {/* Abstract design elements */}
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <ScrollAnimate variant="scaleUp" className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/20 text-brand-mint border border-brand-primary/30 mx-auto">
            <Heart className="h-3.5 w-3.5 fill-brand-mint text-brand-mint" />
            <span className="text-xs font-semibold uppercase tracking-wider">Join Our Vision</span>
          </div>
 
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight max-w-2xl mx-auto">
            Be part of the solution today
          </h2>
          
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Whether you choose to support a clinical medical outpost, register as a skilled digital educator, or fund water pipelines—your involvement changes live corridors.
          </p>
 
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6" id="about-cta-btns">
            <button
              onClick={() => { router.push('/donate'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer group"
              id="cta-donate-btn"
            >
              <Heart className="mr-2 h-4 w-4 fill-white text-white group-hover:scale-110 transition-transform duration-200" />
              Support Active Field Work
            </button>
            <button
              onClick={() => { router.push('/volunteer'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white hover:text-white border border-white/20 font-bold text-sm transition-all cursor-pointer"
              id="cta-volunteer-btn"
            >
              Register as Volunteer
            </button>
          </div>
        </ScrollAnimate>
      </section>

      {/* DETAIL MODAL: Human Leader Detailed Biography & Profile card */}
      {selectedLeader && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" id="leader-modal-overlay">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative text-gray-900 p-8 space-y-6" id="leader-modal-content">
            
            {/* Close button */}
            <button
              onClick={() => setSelectedLeader(null)}
              className="absolute top-5 right-5 p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full transition-colors cursor-pointer"
              aria-label="Close Profile"
              id="close-leader-modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Profile Brief header card */}
            <div className="flex items-center gap-5 pb-5 border-b border-gray-100">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden shadow-inner shrink-0">
                <img
                  src={selectedLeader.image}
                  alt={selectedLeader.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="px-2.5 py-0.5 text-[9px] font-bold text-emerald-950 bg-brand-mint rounded-full uppercase tracking-wider font-mono">
                  {selectedLeader.department}
                </span>
                <h3 className="font-display font-bold text-xl text-gray-900 mt-1">{selectedLeader.name}</h3>
                <p className="text-xs text-brand-primary font-medium">{selectedLeader.role}</p>
              </div>
            </div>

            {/* Profile Bio details */}
            <div className="space-y-4 text-xs leading-relaxed text-gray-600">
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Professional Biography</span>
                <p className="text-gray-600 font-medium leading-relaxed">
                  {selectedLeader.bio}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Operational Mandate</span>
                <p>
                  As {selectedLeader.role}, {selectedLeader.name.split(' ')[0]} oversees deep logistical oversight inside the {selectedLeader.department} unit, guaranteeing 100% compliance with non-profit standards and direct field disbursement tracking.
                </p>
              </div>

              {/* Dynamic simulated quotes for enhanced realistic feel */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <span className="text-[10px] text-brand-primary font-bold uppercase tracking-wider block font-mono">Personal Quote</span>
                <p className="italic font-medium text-gray-500">
                  &quot;Humanitarian logistics is not just about supplying materials; it is about building durable networks of respect and professional capability that stay long after our corridors conclude.&quot;
                </p>
              </div>
            </div>

            {/* Actions row */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
              <a
                href={`mailto:${selectedLeader.name.toLowerCase().replace(/\s+/g, '')}@compassionglobal.org`}
                className="py-3 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-brand-primary font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 text-center"
              >
                <Mail className="h-4 w-4" /> Contact Office
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
