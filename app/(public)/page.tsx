'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Heart, ArrowRight, CheckCircle2, Shield, BarChart3, Globe, HeartHandshake,
  Users, CheckSquare, Sparkles, Star, ArrowUpRight, X, Eye, FileText
} from 'lucide-react';
import { milestones, leaders, programs, partners } from '@/lib/public-data';
import { Leader } from '@/lib/public-data';
import ScrollAnimate, { StaggerItem } from '@/components/public/ScrollAnimate';
import { useToast } from '@/components/ui/toast';

export default function MissionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null);
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [showImpactReport, setShowImpactReport] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [mariaEmail, setMariaEmail] = useState('');
  const [mariaSubscribed, setMariaSubscribed] = useState(false);

  const handleMariaSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (mariaEmail.trim()) {
      setMariaSubscribed(true);
      setMariaEmail('');
      setTimeout(() => setMariaSubscribed(false), 4000);
    }
  };

  return (
    <div className="space-y-0" id="mission-page-root">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F5F8F6] to-white pt-10 pb-20 lg:pt-16 lg:pb-28" id="section-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <ScrollAnimate variant="fadeInLeft" className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-brand-primary border border-emerald-200/50" id="badge-purpose">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-xs font-display font-semibold tracking-wider uppercase">Our Purpose</span>
              </div>
              
              <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-gray-900 tracking-tight leading-[1.08]" id="hero-heading">
                Empowering local <br className="hidden sm:inline" />
                communities for <br />
                <span className="text-brand-primary relative inline-block">
                  global change.
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl" id="hero-description">
                At CompassionGlobal, we believe that sustainable impact begins with deep listening and professional execution. Our mission is to dismantle systemic barriers through education, healthcare, and economic initiative.
              </p>
              
              {/* Mission & Vision Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2" id="hero-cards-grid">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h3 className="font-display font-bold text-base text-gray-900 mb-2">Our Mission</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    To deliver high-impact, transparent solutions that foster self-reliance in underserved regions.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h3 className="font-display font-bold text-base text-gray-900 mb-2">Our Vision</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    A world where every individual has the professional support and resources to thrive with dignity.
                  </p>
                </div>
              </div>
            </ScrollAnimate>
            
            {/* Right Asset Container (Dark Emerald holding Framed Image) */}
            <ScrollAnimate variant="fadeInRight" className="lg:col-span-5 flex justify-center" id="hero-asset-container">
              <div className="relative w-full max-w-md aspect-square bg-[#063426] rounded-[2.5rem] flex items-center justify-center p-8 sm:p-12 shadow-xl overflow-hidden group">
                {/* Decorative glow */}
                <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 to-transparent pointer-events-none" />
                
                {/* Framed Image */}
                <div className="relative bg-[#FAFAFA] p-4 pb-8 rounded-xl shadow-lg border border-white/25 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500 w-full">
                  <div className="aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden relative">
                    <img
                      src="https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=800&q=80"
                      alt="CompassionGlobal Team Fieldwork"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <span className="font-mono text-[9px] tracking-widest text-gray-400 uppercase">
                      CompassionGlobal Field Assessment
                    </span>
                  </div>
                </div>
              </div>
            </ScrollAnimate>

          </div>
        </div>
      </section>

      {/* 2. JOIN OUR GLOBAL MOVEMENT SECTION */}
      <section className="bg-gradient-to-r from-emerald-50/40 via-[#F3F7F5] to-emerald-50/30 py-20 border-y border-emerald-50/50" id="section-movement">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Texts */}
            <ScrollAnimate variant="fadeInLeft" className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/50 text-brand-primary border border-emerald-200/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider">Join Our Global Movement</span>
              </div>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight leading-tight">
                Empowering Humanity Through <span className="text-brand-primary">Compassion.</span>
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                We are dedicated to fostering sustainable change through professional excellence and radical transparency. Join us in building a future where every community thrives.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button 
                  onClick={() => router.push('/donate')} 
                  className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-medium rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
                  id="movement-donate"
                >
                  <Heart className="h-4 w-4 fill-white" />
                  Donate Now
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('section-timeline');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }} 
                  className="px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium rounded-full shadow-sm transition-all cursor-pointer"
                  id="movement-mission"
                >
                  Our Mission
                </button>
              </div>
            </ScrollAnimate>
 
            {/* Right Metrics Cards Block */}
            <ScrollAnimate variant="stagger" className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4" id="movement-cards">
              <StaggerItem className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 text-brand-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div className="font-display font-bold text-3xl text-gray-900">12k+</div>
                <div className="text-sm font-semibold text-gray-800 mt-1">Active Volunteers</div>
                <p className="text-xs text-gray-400 mt-1">Mobilized globally across 20+ countries.</p>
              </StaggerItem>
 
              <StaggerItem className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 text-brand-primary">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div className="font-display font-bold text-3xl text-gray-900">50,000</div>
                <div className="text-sm font-semibold text-gray-800 mt-1">Families Helped</div>
                <p className="text-xs text-gray-400 mt-1">Direct support and livelihood expansion.</p>
              </StaggerItem>
 
              <StaggerItem className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-md hover:-translate-y-1 transition-all duration-300 sm:col-span-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-brand-primary shrink-0">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-bold text-3xl text-gray-900">120+</span>
                      <span className="text-sm font-semibold text-gray-800">Programs Running</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Empowering community initiatives through structured aid modules.</p>
                  </div>
                </div>
              </StaggerItem>
            </ScrollAnimate>
 
          </div>
        </div>
      </section>

      {/* 3. CORE METRICS ROW */}
      <section className="bg-white py-12 border-b border-gray-100" id="section-metrics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimate variant="stagger" className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center" id="metrics-grid">
            <StaggerItem className="space-y-1">
              <div className="font-display font-bold text-3xl text-brand-primary">85,000</div>
              <div className="text-xs font-mono tracking-widest text-gray-400 uppercase">Families Supported</div>
              <div className="w-12 h-0.5 bg-emerald-100 mx-auto mt-2" />
            </StaggerItem>
            <StaggerItem className="space-y-1">
              <div className="font-display font-bold text-3xl text-brand-primary">12,400</div>
              <div className="text-xs font-mono tracking-widest text-gray-400 uppercase">Students Educated</div>
              <div className="w-12 h-0.5 bg-emerald-100 mx-auto mt-2" />
            </StaggerItem>
            <StaggerItem className="space-y-1">
              <div className="font-display font-bold text-3xl text-brand-primary">250,000</div>
              <div className="text-xs font-mono tracking-widest text-gray-400 uppercase">Trees Planted</div>
              <div className="w-12 h-0.5 bg-emerald-100 mx-auto mt-2" />
            </StaggerItem>
          </ScrollAnimate>
        </div>
      </section>
 
      {/* 4. TIMELINE SECTION */}
      <section className="py-24 bg-[#FAFAF9]" id="section-timeline">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <ScrollAnimate variant="fadeInUp" className="text-center space-y-3 mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900">A Legacy of Transparency</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">Key milestones on our journey to 20 countries.</p>
          </ScrollAnimate>
 
          {/* Timeline diagram */}
          <div className="relative" id="timeline-diagram">
            {/* Center vertical green line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-[2px] bg-emerald-700/30" />
 
            {/* Milestones loop */}
            <ScrollAnimate variant="stagger" className="space-y-12">
              {milestones.map((m, idx) => {
                const isLeft = idx % 2 === 0;
                const isActive = activeMilestone === m.id;
                return (
                  <StaggerItem 
                    key={m.id} 
                    variant={isLeft ? 'fadeInLeft' : 'fadeInRight'}
                    className={`relative flex flex-col sm:flex-row items-center justify-between ${isLeft ? '' : 'sm:flex-row-reverse'}`}
                    id={`timeline-item-${m.id}`}
                  >
                    {/* Left/Right Text Content Card */}
                    <div 
                      className="w-full sm:w-[45%] text-center sm:text-left space-y-2 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setActiveMilestone(m.id)}
                      onMouseLeave={() => setActiveMilestone(null)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-xl text-brand-primary">{m.year}</span>
                        <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">Phase {idx + 1}</span>
                      </div>
                      <h4 className="font-display font-semibold text-lg text-gray-900">{m.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{m.description}</p>
                    </div>
 
                    {/* Circle Node on center line */}
                    <div className={`absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white shadow-sm transition-all duration-300 z-10 ${
                      isActive ? 'bg-emerald-600 scale-125' : 'bg-brand-primary'
                    }`} />
 
                    {/* Empty placeholder to occupy space on opposite side for flex-row */}
                    <div className="hidden sm:block w-[45%]" />
                  </StaggerItem>
                );
              })}
            </ScrollAnimate>
          </div>
        </div>
      </section>

      {/* 5. OUR CORE PROGRAMS SECTION */}
      <section className="py-24 bg-white border-b border-gray-100" id="section-core-programs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimate variant="fadeInUp" className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div className="space-y-2">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight">Our Core Programs</h2>
              <p className="text-sm text-gray-500 max-w-xl">Targeted initiatives designed for measurable, long-term impact on global communities.</p>
            </div>
            <button 
              onClick={() => router.push('/programs')}
              className="inline-flex items-center text-sm font-semibold text-brand-primary hover:text-brand-primary-hover gap-1 mt-4 sm:mt-0 cursor-pointer group"
              id="btn-all-programs"
            >
              View All Programs 
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </ScrollAnimate>
 
          {/* Programs Grid */}
          <ScrollAnimate variant="stagger" className="grid grid-cols-1 md:grid-cols-3 gap-8" id="programs-card-grid">
            {programs.map((p) => {
              const percent = Math.round((p.raised / p.goal) * 100);
              return (
                <StaggerItem key={p.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300" id={`program-card-${p.id}`}>
                  <div>
                    {/* Program Image */}
                    <div className="aspect-[16/10] bg-gray-100 overflow-hidden relative">
                      <img 
                        src={p.image} 
                        alt={p.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-brand-primary font-display font-bold text-xs tracking-wide px-3 py-1 rounded-full border border-gray-100">
                        {p.category}
                      </span>
                    </div>
 
                    {/* Program details */}
                    <div className="p-6 space-y-4">
                      <h3 className="font-display font-bold text-lg text-gray-900 group-hover:text-brand-primary transition-colors">{p.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{p.description}</p>
                    </div>
                  </div>
 
                  {/* Program funding meter & action */}
                  <div className="p-6 pt-0 space-y-4">
                    {/* Goal Meter */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-500">Raised: ${p.raised.toLocaleString()}</span>
                        <span className="text-brand-primary">{percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-primary rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
 
                    <button 
                      onClick={() => router.push('/donate')}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                      id={`btn-learn-program-${p.id}`}
                    >
                      Learn More
                    </button>
                  </div>
                </StaggerItem>
              );
            })}
          </ScrollAnimate>
        </div>
      </section>

      {/* 6. IMPACT STORY & ENERGETIC MINT NEWSLETTER CARD */}
      <section className="py-24 bg-[#FAFAF9]" id="section-impact-story">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Story block */}
            <ScrollAnimate variant="fadeInLeft" className="lg:col-span-8 bg-white p-8 sm:p-12 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-8 items-center justify-between" id="story-block">
              {/* Photo */}
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-md shrink-0 relative">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80" 
                  alt="Maria Portrait" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
 
              {/* Story Description */}
              <div className="space-y-6 flex-1 text-center sm:text-left">
                <div className="text-xs font-mono font-bold tracking-widest text-emerald-600 uppercase">Impact Story</div>
                <h3 className="font-display font-bold text-2xl text-gray-900 tracking-tight">Maria&apos;s Journey: From Micro-loan to Market Leader</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto sm:mx-0">
                  Discover how sustainable financial support and local specialized mentoring transformed a single mother&apos;s weaving workshop into a vibrant local community cornerstone.
                </p>
                <button 
                  onClick={() => setShowStory(true)}
                  className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  id="btn-read-story"
                >
                  <Eye className="h-4 w-4" />
                  Read Full Story
                </button>
              </div>
            </ScrollAnimate>
 
            {/* Subscribe block */}
            <ScrollAnimate variant="fadeInRight" className="lg:col-span-4 bg-[#41E39E] p-8 sm:p-10 rounded-3xl shadow-sm flex flex-col justify-between text-gray-900 relative overflow-hidden" id="mint-subscribe-block">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/15 rounded-full translate-x-12 -translate-y-12 pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <h3 className="font-display font-bold text-2xl text-gray-900 tracking-tight">Stay Informed.</h3>
                <p className="text-sm text-emerald-950 leading-relaxed">
                  Join 50k+ impact-driven individuals receiving our monthly transparency reports and global project updates directly to their inbox.
                </p>
              </div>
 
              <div className="mt-8 relative z-10" id="maria-subscribe-form-container">
                {mariaSubscribed ? (
                  <div className="bg-white/95 p-4 rounded-2xl flex items-center gap-2 border border-white text-brand-primary shadow-sm" id="maria-success">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span className="text-xs font-bold">Successfully subscribed! Welcome aboard.</span>
                  </div>
                ) : (
                  <form onSubmit={handleMariaSubscribe} className="space-y-3">
                    <input
                      type="email"
                      value={mariaEmail}
                      onChange={(e) => setMariaEmail(e.target.value)}
                      placeholder="Your email address"
                      required
                      className="w-full px-4 py-3 bg-white placeholder-gray-400 text-gray-900 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 shadow-sm border border-transparent"
                    />
                    <button 
                      type="submit"
                      className="w-full px-4 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-sm rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      Subscribe Now
                    </button>
                  </form>
                )}
              </div>
            </ScrollAnimate>
 
          </div>
        </div>
      </section>

      {/* 7. RADICAL TRANSPARENCY / MEASURABLE IMPACT NAVY BLOCK */}
      <section className="bg-brand-navy py-24 text-white relative overflow-hidden" id="section-transparency">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Content */}
            <ScrollAnimate variant="fadeInLeft" className="lg:col-span-6 space-y-8">
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white tracking-tight leading-none" id="transparency-heading">
                Radical Transparency.<br />
                Measurable Impact.
              </h2>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-xl">
                We pride ourselves on our &apos;A&apos; rating for financial transparency. 92 cents of every dollar donated goes directly to field programs. We provide quarterly reports that detail every outcome.
              </p>
 
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-8 pt-2" id="transparency-metrics">
                <div className="space-y-1">
                  <div className="font-display font-bold text-4xl sm:text-5xl text-brand-mint">92%</div>
                  <div className="text-[10px] font-mono tracking-wider text-gray-400 uppercase">Program Efficiency</div>
                </div>
                <div className="space-y-1">
                  <div className="font-display font-bold text-4xl sm:text-5xl text-brand-mint">1.2M+</div>
                  <div className="text-[10px] font-mono tracking-wider text-gray-400 uppercase">Lives Impacted</div>
                </div>
              </div>
 
              {/* Report trigger */}
              <button 
                onClick={() => setShowImpactReport(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-primary text-white font-semibold text-sm hover:bg-brand-primary-hover transition-colors shadow-lg shadow-emerald-950/40 cursor-pointer group"
                id="btn-report"
              >
                Read Our 2023 Impact Report
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </ScrollAnimate>
 
            {/* Right Transparent Grid */}
            <ScrollAnimate variant="stagger" className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4" id="transparency-grid">
              
              <StaggerItem className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 hover:border-white/20 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-brand-mint">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base text-white">Verified Audits</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Annual third-party audits ensure absolute financial integrity across all regional branches.
                </p>
              </StaggerItem>
 
              <StaggerItem className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 hover:border-white/20 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-brand-mint">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base text-white">Data Driven</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Real-time KPI monitoring is enforced for every single project inside our global portfolio.
                </p>
              </StaggerItem>
 
              <StaggerItem className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 hover:border-white/20 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-brand-mint">
                  <Globe className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base text-white">Global Scale</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Currently operating in over 20 countries with highly specialized, certified local teams.
                </p>
              </StaggerItem>
 
              <StaggerItem className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 hover:border-white/20 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-brand-mint">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base text-white">Shared Values</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Partnering exclusively with grassroots organizations that meet our strict, clean ethics bar.
                </p>
              </StaggerItem>
 
            </ScrollAnimate>
 
          </div>
        </div>
      </section>

      {/* 8. OUR LEADERSHIP SECTION */}
      <section className="py-24 bg-white" id="section-leaders">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimate variant="fadeInUp" className="text-center space-y-3 mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight">Our Leadership</h2>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              A global collective of strategists, humanitarians, and innovators dedicated to excellence.
            </p>
          </ScrollAnimate>
 
          {/* Leaders Grid */}
          <ScrollAnimate variant="stagger" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" id="leaders-grid">
            {leaders.map((leader) => (
              <StaggerItem 
                key={leader.id}
                onClick={() => setSelectedLeader(leader)}
                className="group bg-[#FAFAF9] rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
                id={`leader-card-${leader.id}`}
              >
                {/* Photo container */}
                <div className="aspect-[4/5] bg-gray-200 relative overflow-hidden">
                  <img
                    src={leader.image}
                    alt={leader.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-semibold flex items-center gap-1">
                      View Bio &amp; Profile <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
 
                {/* Details */}
                <div className="p-5 space-y-1">
                  <h3 className="font-display font-bold text-base text-gray-900 group-hover:text-brand-primary transition-colors">
                    {leader.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {leader.role}
                  </p>
                  <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-100 mt-1">
                    {leader.department}
                  </span>
                </div>
              </StaggerItem>
            ))}
          </ScrollAnimate>
        </div>
      </section>

      {/* 9. VOICES OF TRUST TESTIMONIALS */}
      <section className="py-24 bg-[#FAFAF9] border-t border-gray-100" id="section-testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimate variant="fadeInUp" className="text-center mb-16 space-y-2">
            <h2 className="font-display font-bold text-3xl text-gray-900">Voices of Trust</h2>
            <p className="text-sm text-gray-500">Real feedback from our global community of donors, volunteers, and partners.</p>
          </ScrollAnimate>
 
          <ScrollAnimate variant="stagger" className="grid grid-cols-1 md:grid-cols-3 gap-8" id="testimonials-grid">
            
            <StaggerItem className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex text-emerald-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-emerald-500 text-emerald-500" />)}
              </div>
              <p className="text-sm text-gray-500 italic leading-relaxed">
                &quot;CompassionGlobal sets the absolute gold standard for NGO transparency. Their real-time monitoring and dedication to field-first results is unmatched in the industry.&quot;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-xs text-brand-primary shrink-0">DC</div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">David Chen</h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Global Philanthropist</p>
                </div>
              </div>
            </StaggerItem>
 
            <StaggerItem className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex text-emerald-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-emerald-500 text-emerald-500" />)}
              </div>
              <p className="text-sm text-gray-500 italic leading-relaxed">
                &quot;Being a lead volunteer in Sub-Saharan Africa has changed my life. The local offices are highly supportive, and our programs are truly tailored to regional needs.&quot;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-xs text-brand-primary shrink-0">SW</div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Sarah Williams</h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Lead Volunteer</p>
                </div>
              </div>
            </StaggerItem>
 
            <StaggerItem className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex text-emerald-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-emerald-500 text-emerald-500" />)}
              </div>
              <p className="text-sm text-gray-500 italic leading-relaxed">
                &quot;Their commitment to local autonomy is what makes their programs actually work long-term. They are not interested in short-term fixes, but genuine sustainable progress.&quot;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-xs text-brand-primary shrink-0">ER</div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Dr. Elena Rodriguez</h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Partner Organization</p>
                </div>
              </div>
            </StaggerItem>
 
          </ScrollAnimate>
        </div>
      </section>
 
      {/* 10. PARTNERS LOGO CAROUSEL */}
      <section className="bg-white py-16 border-t border-gray-100" id="section-partners">
        <ScrollAnimate variant="fadeInUp" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="font-mono text-xs font-bold tracking-widest text-gray-400 uppercase">Trusted By Global Institutions</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 opacity-50 hover:opacity-75 transition-opacity" id="partners-list">
            {partners.map((partner) => (
              <div key={partner.name} className="flex items-center space-x-2 grayscale hover:grayscale-0 transition-all cursor-pointer" id={`partner-logo-${partner.name}`}>
                <span className="font-display font-bold text-sm tracking-widest text-gray-600 uppercase">
                  {partner.name}
                </span>
              </div>
            ))}
          </div>
        </ScrollAnimate>
      </section>

      {/* MODAL: LEADER BIO */}
      {selectedLeader && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" id="modal-leader">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setSelectedLeader(null)}
              className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
              id="close-leader-modal"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-6">
                <img 
                  src={selectedLeader.image} 
                  alt={selectedLeader.name} 
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-2xl object-cover shadow"
                />
                <div>
                  <h3 className="font-display font-bold text-xl text-gray-900">{selectedLeader.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">{selectedLeader.role}</p>
                  <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 border border-emerald-100 font-semibold rounded-full mt-1.5">
                    {selectedLeader.department}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-gray-400">Professional Profile</h4>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl">
                  {selectedLeader.bio} Dr. Vance/Marcus/Sarah/Amir have dedicated their entire careers to improving field logistics and administrative efficiency. Under their collective guidance, CompassionGlobal has scaled operations safely and efficiently across over 20 nations.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setSelectedLeader(null)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close Profile
                </button>
                <a 
                  href={`mailto:${selectedLeader.name.toLowerCase().replace(/[^a-z]/g, '')}@compassionglobal.org`}
                  className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-1"
                >
                  Contact Office
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPACT STORY DETAIL */}
      {showStory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" id="modal-story">
          <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setShowStory(false)}
              className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-full transition-colors cursor-pointer"
              aria-label="Close Story"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-gray-100">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80" 
                  alt="Maria Portrait" 
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-2xl object-cover shadow shrink-0"
                />
                <div className="text-center sm:text-left">
                  <h3 className="font-display font-bold text-2xl text-gray-900">Maria&apos;s Full Story</h3>
                  <p className="text-sm text-emerald-600 font-medium">From Micro-loan to Community Flourish</p>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 text-sm text-gray-600 leading-relaxed" id="story-paragraphs">
                <p>
                  Maria lived in a small village in East Africa, caring for three children alone. With custom textile skills passed down through generations, she dreamed of launching a structured weaving business but was locked out of traditional banking due to systemic barriers.
                </p>
                <p>
                  In 2021, Maria connected with CompassionGlobal&apos;s local economic development office. Rather than simply giving charity, we offered her an initial micro-finance credit line of $250 combined with direct professional training in bookkeeping, inventory management, and global trade loops.
                </p>
                <p>
                  Within 12 months, Maria had repaid her loan in full, tripled her workshop outputs, and hired four other local mothers. Today, her boutique textile business exports beautiful handwoven designs globally, supporting over twelve families in her region and funding education tuition for school children.
                </p>
                <p className="font-semibold text-gray-900 italic">
                  &quot;CompassionGlobal did not just give me money; they gave me respect, trust, and the professional business keys to design my own independent future.&quot;
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setShowStory(false)}
                  className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Awesome, Close Story
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPACT REPORT DETAILS */}
      {showImpactReport && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" id="modal-report">
          <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setShowImpactReport(false)}
              className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-full transition-colors cursor-pointer"
              aria-label="Close Report"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100 text-brand-primary">
                <div className="p-3 bg-emerald-50 rounded-2xl">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-2xl text-gray-900">2023 Annual Impact Report</h3>
                  <p className="text-xs text-emerald-600 font-mono font-bold tracking-wider uppercase">Publication ID: CG-AR2023-V1</p>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto text-sm text-gray-600 leading-relaxed">
                <p className="font-semibold text-gray-900">
                  We are proud to share that CompassionGlobal maintained its standard-setting rating for financial responsibility:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400 block font-medium">Total Funds Raised</span>
                    <span className="text-lg font-bold text-gray-900">$18.4M USD</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400 block font-medium">Audited Efficiency Rate</span>
                    <span className="text-lg font-bold text-brand-primary">92.4% Direct Field Aid</span>
                  </div>
                </div>
                <p>
                  Our initiatives have expanded education centers across three additional countries, planted over 250k native trees in vital reforestation corridors, and delivered critical medicine via 24 solar-powered mobile health units. Every cent is registered and traceable online.
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400 font-medium">Download PDF (4.8MB)</span>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowImpactReport(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      toast({ title: 'Download Started', description: 'Check your browser files for CG_Annual_Report_2023.pdf', variant: 'success' });
                      setShowImpactReport(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Download Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
