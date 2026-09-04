'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Heart, ArrowRight, CheckCircle2, Shield, BarChart3, Globe, HeartHandshake,
  Users, CheckSquare, Sparkles, Star, ArrowUpRight, X, Eye, FileText,
  Building2, GraduationCap, Leaf, Megaphone, HandHeart, Landmark, Lightbulb, Stethoscope, Camera
} from 'lucide-react';
import ScrollAnimate, { StaggerItem } from '@/components/public/ScrollAnimate';
import { useToast } from '@/components/ui/toast';

type Leader = { id: string; name: string; role: string; image: string; department: string; bio: string };

type TestimonialData = { id: string; name: string; role: string; quote: string; rating: number; initials: string; avatarUrl: string };

const partnerIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HeartHandshake, Globe, Users, Shield, BarChart3, Sparkles, Star,
  Building2, GraduationCap, Leaf, Megaphone, HandHeart, Landmark, Lightbulb, Stethoscope, Heart
};

type MissionPageClientProps = {
  milestones: { id: string; year: number; title: string; description: string }[];
  leaders: Leader[];
  programs: { id: string; title: string; category: string; description: string; goal: number; raised: number; image: string }[];
  partners: { id: string; name: string; icon: string }[];
  testimonials: TestimonialData[];
  settings: Record<string, string>;
  heroImages: string[];
};

export default function MissionPageClient({ milestones, leaders, programs, partners, testimonials, settings, heroImages }: MissionPageClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null);
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [showImpactReport, setShowImpactReport] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [newsletterEmail, setMariaEmail] = useState('');
  const [newsletterSubscribed, setMariaSubscribed] = useState(false);
  const [newsletterSubscribing, setMariaSubscribing] = useState(false);

  const handleNewsletterSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setMariaSubscribing(true);
      try {
        const res = await fetch('/api/public/newsletter-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newsletterEmail, source: 'homepage' }),
        });
        if (!res.ok) throw new Error('Failed');
      } catch (err) {
        toast({ title: 'Subscription Failed', description: 'Unable to subscribe right now. Please try again later.', variant: 'error' });
        setMariaSubscribing(false);
        return;
      }
      setMariaSubscribed(true);
      setMariaEmail('');
      setMariaSubscribing(false);
      setTimeout(() => setMariaSubscribed(false), 4000);
    }
  };

  return (
    <div className="space-y-0" id="mission-page-root">
      
      {/* 1. HERO SECTION — Minimal Rounded Floating Card Frame */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F5F8F6] to-white px-6 md:px-10 lg:px-16 pt-8 md:pt-12 lg:pt-20 pb-16 md:pb-24 lg:pb-28" id="section-hero">
        {/* Soft organic background accents */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-100/60 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-brand-mint/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">

            {/* Left Content */}
            <ScrollAnimate variant="fadeInLeft" className="lg:col-span-7 space-y-7">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm text-brand-primary border border-emerald-200/60 shadow-sm" id="badge-purpose">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary" />
                </span>
                <span className="text-xs font-display font-semibold tracking-wide text-emerald-800">Serving communities since 2014</span>
              </div>

              <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[3.6rem] text-gray-900 tracking-tight leading-[1.08]" id="hero-heading">
                {settings.home_hero_heading ? settings.home_hero_heading.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i === 0 && (
                      <>
                        {' '}
                        <span className="relative inline-block">
                          <span className="relative z-10 text-brand-primary">{'Empowerment'}</span>
                          <span className="absolute left-0 right-0 bottom-0.5 h-3 bg-brand-mint/40 -z-0 rounded-full" />
                        </span>
                        <br className="hidden sm:inline" />
                      </>
                    )}
                  </span>
                )) : (
                  <>Women&apos;s Development Is Our Only Mission</>
                )}
              </h1>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl" id="hero-description">
                {settings.home_hero_description || 'Founded in 2014 in Kaldare village, Junnar Taluka, Rupashree Mahila Vikas Sanstha has trained 1,520+ women and girls across Pune district through government-linked skill development, digital literacy, and self-employment programmes — helping them become financially, socially, and mentally self-reliant.'}
              </p>

              {/* CTA */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => router.push('/donate')}
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-sm rounded-full shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 translate-y-0 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  id="hero-cta-donate"
                >
                  <Heart className="h-4 w-4 fill-white" />
                  Support a woman today
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('section-core-programs');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-emerald-50/60 text-gray-700 font-semibold text-sm rounded-full border border-gray-200 hover:border-emerald-200 transition-colors duration-300 cursor-pointer"
                  id="hero-cta-programs"
                >
                  Explore our programmes
                </button>
              </div>

              {/* Mission & Vision Cards — human, friendly rounded cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3" id="hero-cards-grid">
                <div className="group bg-white p-6 rounded-3xl border border-gray-100 hover:border-brand-primary/20 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-lg">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3 text-brand-primary">
                    <HandHeart className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold text-base text-gray-900 mb-1.5">Our Mission</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {settings.home_mission_text || 'To economically empower women and support the sustainable development of women farmers across rural and tribal Maharashtra.'}
                  </p>
                </div>

                <div className="group bg-white p-6 rounded-3xl border border-gray-100 hover:border-brand-primary/20 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-lg">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3 text-brand-primary">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold text-base text-gray-900 mb-1.5">Our Vision</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {settings.home_vision_text || 'A society where every woman — empowered physically, socially, and mentally — can stand on her own feet with dignity and self-reliance.'}
                  </p>
                </div>
              </div>
            </ScrollAnimate>

            {/* Right Asset — Floating Frame with Polaroid Photo Cards */}
            <ScrollAnimate variant="fadeInRight" className="lg:col-span-5 flex justify-center" id="hero-asset-container">
              <div className="relative w-full max-w-md">
                {/* Colored backdrop frame */}
                <div className="relative rounded-[2.5rem] bg-brand-primary p-8 sm:p-10 lg:p-12 shadow-2xl shadow-brand-primary/20">
                  {/* Organic inner shapes */}
                  <div className="absolute -top-8 -right-6 w-32 h-32 rounded-[2.5rem] bg-white/10 rotate-12 pointer-events-none" />
                  <div className="absolute -bottom-6 -left-8 w-24 h-24 rounded-full bg-brand-mint/20 pointer-events-none" />

                  {heroImages.length === 1 ? (
                    /* Single centered photo card — slightly tilted, hand-placed feel */
                    <div className="relative max-w-[20rem] mx-auto rotate-[-1.5deg] hover:rotate-0 transition-transform duration-500">
                      <div className="group bg-[#fbfaf7] p-3.5 pb-7 sm:p-4 sm:pb-8 rounded-2xl border border-white shadow-xl transition-transform duration-300 hover:translate-y-[-5px]">
                        <div className="aspect-[4/3] bg-gray-200 rounded-xl overflow-hidden">
                          <img
                            src={heroImages[0]}
                            alt="Rupashree Mahila Vikas Sanstha skill training session for women in Junnar"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="mt-4 text-center text-[11px] sm:text-xs text-gray-500 font-medium italic font-display">
                          Skill development training, Junnar Taluka
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Multi-image stacked overlap — front card larger, back card peeking behind */
                    <div className="relative max-w-[24rem] mx-auto">
                      {heroImages.slice(1).map((src, i) => (
                        <div
                          key={`back-${i}`}
                          className="absolute rounded-xl border border-white/80 shadow-md overflow-hidden"
                          style={{
                            top: `${12 + i * 6}px`,
                            left: `${-8 - i * 5}px`,
                            width: '56%',
                            transform: `rotate(${-4 - i * 2}deg)`,
                            zIndex: 1,
                          }}
                        >
                          <div className="aspect-[4/3] bg-gray-300 w-full">
                            <img src={src} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      ))}
                      <div className="relative z-10 rotate-[-1.5deg] hover:rotate-0 transition-transform duration-500">
                        <div className="group bg-[#fbfaf7] p-3.5 pb-7 sm:p-4 sm:pb-8 rounded-2xl border border-white shadow-xl transition-transform duration-300 hover:translate-y-[-5px]">
                          <div className="aspect-[4/3] bg-gray-200 rounded-xl overflow-hidden">
                            <img
                              src={heroImages[0]}
                              alt="Rupashree Mahila Vikas Sanstha skill training session for women in Junnar"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="mt-4 text-center text-[11px] sm:text-xs text-gray-500 font-medium italic font-display">
                            Skill development training, Junnar Taluka
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Small camera label chip */}
                  <div className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1.5 text-[10px] font-medium text-white/90 border border-white/20">
                    <Camera className="h-3 w-3" />
                    On the ground
                  </div>

                  {/* Floating stat bubble */}
                  {settings.home_stat_volunteers && (
                  <div className="absolute -top-5 -left-5 bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-3 text-center rotate-[-4deg]">
                    <div className="font-display font-bold text-xl text-brand-primary leading-none">{settings.home_stat_volunteers}</div>
                    <div className="text-[9px] text-gray-500 font-medium mt-1">Women trained</div>
                  </div>
                  )}
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
                <span className="text-xs font-semibold uppercase tracking-wider">Join Our Mission</span>
              </div>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight leading-tight">
                Empowering Rural Women, <span className="text-brand-primary">One Skill at a Time</span>
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                From beauty & wellness training to digital literacy, we run government-linked skill programmes that create real, lasting livelihoods for rural and tribal women in Junnar Taluka, Pune.
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
                  Our Story
                </button>
              </div>
            </ScrollAnimate>
 
            {/* Right Metrics Cards Block */}
            <ScrollAnimate variant="stagger" className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4" id="movement-cards">
              {settings.home_stat_volunteers && (
                <StaggerItem className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 text-brand-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="font-display font-bold text-3xl text-gray-900">{settings.home_stat_volunteers}</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">Women &amp; Girls Trained</div>
                </StaggerItem>
              )}
 
              {settings.home_stat_families_helped && (
                <StaggerItem className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 text-brand-primary">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                  <div className="font-display font-bold text-3xl text-gray-900">{settings.home_stat_families_helped}</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">Government Schemes Partnered</div>
                </StaggerItem>
              )}
 
              {settings.home_stat_programs && (
                <StaggerItem className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-md hover:-translate-y-1 transition-all duration-300 sm:col-span-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-brand-primary shrink-0">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display font-bold text-3xl text-gray-900">{settings.home_stat_programs}</span>
                        <span className="text-sm font-semibold text-gray-800">Years of Grassroots Work</span>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              )}
            </ScrollAnimate>
 
          </div>
        </div>
      </section>

      {/* 3. CORE METRICS ROW */}
      {(settings.home_stat_families_supported || settings.home_stat_students || settings.home_stat_trees) && (
        <section className="bg-white py-12 border-b border-gray-100" id="section-metrics">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimate variant="stagger" className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center" id="metrics-grid">
              {settings.home_stat_families_supported && (
                <StaggerItem className="space-y-1">
                  <div className="font-display font-bold text-3xl text-brand-primary">{settings.home_stat_families_supported}</div>
                  <div className="text-xs font-mono tracking-widest text-gray-400 uppercase">PMKVY Beauty &amp; Wellness Trainees</div>
                  <div className="w-12 h-0.5 bg-emerald-100 mx-auto mt-2" />
                </StaggerItem>
              )}
              {settings.home_stat_students && (
                <StaggerItem className="space-y-1">
                  <div className="font-display font-bold text-3xl text-brand-primary">{settings.home_stat_students}</div>
                  <div className="text-xs font-mono tracking-widest text-gray-400 uppercase">Gram Panchayat Livelihood Trainees</div>
                  <div className="w-12 h-0.5 bg-emerald-100 mx-auto mt-2" />
                </StaggerItem>
              )}
              {settings.home_stat_trees && (
                <StaggerItem className="space-y-1">
                  <div className="font-display font-bold text-3xl text-brand-primary">{settings.home_stat_trees}</div>
                  <div className="text-xs font-mono tracking-widest text-gray-400 uppercase">Saplings Planted, Green Mission Drive</div>
                  <div className="w-12 h-0.5 bg-emerald-100 mx-auto mt-2" />
                </StaggerItem>
              )}
            </ScrollAnimate>
          </div>
        </section>
      )}
 
      {/* 4. TIMELINE SECTION */}
      <section className="py-24 bg-[#FAFAF9]" id="section-timeline">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <ScrollAnimate variant="fadeInUp" className="text-center space-y-3 mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900">Our Journey Since 2014</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">From one beauty-parlour training initiative to a multi-scheme women&apos;s empowerment organisation.</p>
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
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight">Our Core Programmes</h2>
              <p className="text-sm text-gray-500 max-w-xl">Government-linked skill development and livelihood training designed for lasting impact in rural Maharashtra.</p>
            </div>
            <button 
              onClick={() => router.push('/programs')}
              className="inline-flex items-center text-sm font-semibold text-brand-primary hover:text-brand-primary-hover gap-1 mt-4 sm:mt-0 cursor-pointer group"
              id="btn-all-programs"
            >
              View All Programmes 
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
                      {p.image?.trim() ? (
                        <img 
                          src={p.image} 
                          alt={p.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <span className="text-4xl font-bold text-gray-400 font-display">
                            {p.title.trim().charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
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
 
                    {/* Program funding */}
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
                    </div>
                </StaggerItem>
              );
            })}
          </ScrollAnimate>
        </div>
      </section>

      {/* 5b. OUR IMPACT — ASYMMETRIC BENTO CARDS INSIDE ROUNDED CONTAINER */}
      <section className="py-24 bg-white" id="section-impact-cards">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimate variant="fadeInUp" className="text-center space-y-3 mb-12">
            <span className="inline-block text-xs font-mono font-bold tracking-widest text-emerald-600 uppercase">Our Impact</span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight">Measurable Change, Real Livelihoods</h2>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">Every training, every sapling, every scheme joined — real numbers behind our work in Junnar Taluka.</p>
          </ScrollAnimate>

          {/* Rounded container */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-50/80 via-[#F3F7F5] to-white border border-emerald-100/70 shadow-sm p-5 sm:p-6 md:p-8">
            {/* Organic inner accents */}
            <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-brand-mint/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-emerald-100/60 blur-3xl pointer-events-none" />

            <ScrollAnimate variant="stagger" className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5" id="impact-bento-grid">

              {/* LARGE HIGHLIGHT CARD — Women Trained Since 2014 (2x2) */}
              {settings.home_lives_impacted && (
                <StaggerItem className="group relative lg:col-span-2 lg:row-span-2 bg-brand-primary text-white rounded-3xl p-7 sm:p-9 overflow-hidden flex flex-col justify-between shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300" id="impact-card-lives">
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 translate-x-10 -translate-y-10 pointer-events-none" />
                  <div className="absolute bottom-6 left-6 w-20 h-20 rounded-[1.5rem] bg-white/5 rotate-12 pointer-events-none" />

                  <div className="relative z-10 w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white">
                    <Users className="h-6 w-6" />
                  </div>

                  <div className="relative z-10 space-y-2">
                    <div className="font-display font-bold text-6xl sm:text-7xl leading-none">{settings.home_lives_impacted}</div>
                    <div className="text-sm font-semibold text-emerald-50/90 uppercase tracking-wide">Women Trained Since 2014</div>
                    <p className="text-xs text-white/70 leading-relaxed max-w-xs">
                      From beauty &amp; wellness to digital literacy — government-linked skills that create lasting livelihoods.
                    </p>
                  </div>

                  <div className="relative z-10 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    Growing every batch
                  </div>
                </StaggerItem>
              )}

              {/* FAMILIES SUPPORTED — PMKVY Beauty & Wellness Trainees */}
              {settings.home_stat_families_supported && (
                <StaggerItem className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between" id="impact-card-families">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-brand-primary mb-4">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-4xl text-gray-900 group-hover:text-brand-primary transition-colors">{settings.home_stat_families_supported}</div>
                    <div className="text-xs font-semibold text-gray-800 mt-1">PMKVY Beauty &amp; Wellness Trainees</div>
                    <div className="w-8 h-0.5 bg-emerald-100 mt-3" />
                  </div>
                </StaggerItem>
              )}

              {/* SCHEMES PARTNERED */}
              {settings.home_stat_families_helped && (
                <StaggerItem className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between" id="impact-card-schemes">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-brand-primary mb-4">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-4xl text-gray-900 group-hover:text-brand-primary transition-colors">{settings.home_stat_families_helped}</div>
                    <div className="text-xs font-semibold text-gray-800 mt-1">Government Schemes Partnered</div>
                    <div className="w-8 h-0.5 bg-emerald-100 mt-3" />
                  </div>
                </StaggerItem>
              )}

              {/* LIVELIHOOD TRAINEES */}
              {settings.home_stat_students && (
                <StaggerItem className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between" id="impact-card-students">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-brand-primary mb-4">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-4xl text-gray-900 group-hover:text-brand-primary transition-colors">{settings.home_stat_students}</div>
                    <div className="text-xs font-semibold text-gray-800 mt-1">Gram Panchayat Livelihood Trainees</div>
                    <div className="w-8 h-0.5 bg-emerald-100 mt-3" />
                  </div>
                </StaggerItem>
              )}

              {/* SAPLINGS PLANTED */}
              {settings.home_stat_trees && (
                <StaggerItem className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between" id="impact-card-trees">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-brand-primary mb-4">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-4xl text-gray-900 group-hover:text-brand-primary transition-colors">{settings.home_stat_trees}</div>
                    <div className="text-xs font-semibold text-gray-800 mt-1">Saplings Planted, Green Drive</div>
                    <div className="w-8 h-0.5 bg-emerald-100 mt-3" />
                  </div>
                </StaggerItem>
              )}

              {/* PROGRAM EFFICIENCY — wide bottom card */}
              {settings.home_efficiency && (
                <StaggerItem className="group lg:col-span-4 bg-white/70 border border-dashed border-emerald-200 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-5 hover:bg-white transition-colors duration-300" id="impact-card-efficiency">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-brand-primary shrink-0">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="font-display font-bold text-4xl text-brand-primary">{settings.home_efficiency}</span>
                      <span className="text-sm font-semibold text-gray-800">Program Efficiency</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Funds channelled directly into programme delivery for measurable, accountable impact.</p>
                  </div>
                </StaggerItem>
              )}

            </ScrollAnimate>
          </div>
        </div>
      </section>

      {/* 6. IMPACT STORY & ENERGETIC MINT NEWSLETTER CARD */}
      <section className="py-24 bg-[#FAFAF9]" id="section-impact-story">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Story block */}
            {settings.home_impact_story_title && (
              <ScrollAnimate variant="fadeInLeft" className="lg:col-span-8 bg-white p-8 sm:p-12 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-8 items-center justify-between" id="story-block">
                {/* Photo */}
                {settings.home_impact_story_image && (
                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-md shrink-0 relative">
                    <img
                      src={settings.home_impact_story_image}
                      alt={settings.home_impact_story_author || settings.home_impact_story_title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
 
                {/* Story Description */}
                <div className="space-y-6 flex-1 text-center sm:text-left">
                  <div className="text-xs font-mono font-bold tracking-widest text-emerald-600 uppercase">Impact Story</div>
                  <h3 className="font-display font-bold text-2xl text-gray-900 tracking-tight">{settings.home_impact_story_title}</h3>
                  {settings.home_impact_story_description && (
                    <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto sm:mx-0">
                      {settings.home_impact_story_description}
                    </p>
                  )}
                  {settings.home_impact_story_body && (
                    <button
                      onClick={() => setShowStory(true)}
                      className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      id="btn-read-story"
                    >
                      <Eye className="h-4 w-4" />
                      Read Full Story
                    </button>
                  )}
                </div>
              </ScrollAnimate>
            )}
 
            {/* Subscribe block */}
            <ScrollAnimate variant="fadeInRight" className="lg:col-span-4 bg-[#41E39E] p-8 sm:p-10 rounded-3xl shadow-sm flex flex-col justify-between text-gray-900 relative overflow-hidden" id="mint-subscribe-block">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/15 rounded-full translate-x-12 -translate-y-12 pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <h3 className="font-display font-bold text-2xl text-gray-900 tracking-tight">{settings.home_newsletter_heading || 'Stay Informed'}</h3>
                {settings.home_newsletter_description && (
                  <p className="text-sm text-emerald-950 leading-relaxed">
                    {settings.home_newsletter_description}
                  </p>
                )}
              </div>
 
              <div className="mt-8 relative z-10" id="newsletter-subscribe-form-container">
                {newsletterSubscribed ? (
                  <div className="bg-white/95 p-4 rounded-2xl flex items-center gap-2 border border-white text-brand-primary shadow-sm" id="newsletter-success">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span className="text-xs font-bold">Thank you! You&apos;re subscribed.</span>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubscribe} className="space-y-3">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setMariaEmail(e.target.value)}
                      placeholder="Your email address"
                      required
                      className="w-full px-4 py-3 bg-white placeholder-gray-400 text-gray-900 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 shadow-sm border border-transparent"
                    />
                    <button 
                      type="submit"
                      className="w-full px-4 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-sm rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      Subscribe
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
                Registered, Recognised, Accountable
              </h2>
              {settings.home_transparency_statement && (
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-xl">
                  {settings.home_transparency_statement}
                </p>
              )}
 
              {/* Metrics */}
              {(settings.home_efficiency || settings.home_lives_impacted) && (
                <div className="grid grid-cols-2 gap-8 pt-2" id="transparency-metrics">
                  {settings.home_efficiency && (
                    <div className="space-y-1">
                      <div className="font-display font-bold text-4xl sm:text-5xl text-brand-mint">{settings.home_efficiency}</div>
                      <div className="text-[10px] font-mono tracking-wider text-gray-400 uppercase">Program Efficiency</div>
                    </div>
                  )}
                  {settings.home_lives_impacted && (
                    <div className="space-y-1">
                      <div className="font-display font-bold text-4xl sm:text-5xl text-brand-mint">{settings.home_lives_impacted}</div>
                      <div className="text-[10px] font-mono tracking-wider text-gray-400 uppercase">Women Trained Since 2014</div>
                    </div>
                  )}
                </div>
              )}
 
              {/* Report trigger */}
              {settings.home_report_title && (
                <button
                  onClick={() => setShowImpactReport(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-primary text-white font-semibold text-sm hover:bg-brand-primary-hover transition-colors shadow-lg shadow-emerald-950/40 cursor-pointer group"
                  id="btn-report"
                >
                   View Our Registrations
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </ScrollAnimate>

            {/* Right Transparent Grid */}
            <ScrollAnimate variant="stagger" className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4" id="transparency-grid">
              
              <StaggerItem className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 hover:border-white/20 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-brand-mint">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base text-white">ISO 9001:2015 Certified</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Our internal processes are certified under ISO 9001:2015 Quality Management Systems, supporting consistent, accountable programme delivery.
                </p>
              </StaggerItem>
 
              <StaggerItem className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 hover:border-white/20 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-brand-mint">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base text-white">Verified Beneficiaries</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Every training programme is tracked against government scheme records — 1,520+ women trained through 8 documented schemes since 2014.
                </p>
              </StaggerItem>
 
              <StaggerItem className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 hover:border-white/20 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-brand-mint">
                  <Globe className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base text-white">Local Roots</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Based in Kaldare village, Junnar Taluka, we work directly across Pune district&apos;s rural and tribal gram panchayats.
                </p>
              </StaggerItem>
 
              <StaggerItem className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 hover:border-white/20 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-brand-mint">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base text-white">Shared Values</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  We partner exclusively with recognised government bodies — including PMKVY, DDU-GKY, NITI Aayog, and the Maharashtra State Skill Development Society.
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
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight">Our Governing Committee</h2>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              The seven-member committee guiding RMVS&apos;s work across Junnar Taluka.
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
                      {leader.image?.trim() ? (
                    <img
                      src={leader.image}
                      alt={leader.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200">
                      <span className="text-5xl font-bold text-emerald-800 font-display">
                        {leader.name.trim().charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-semibold flex items-center gap-1">
                      View Profile <ArrowUpRight className="h-3.5 w-3.5" />
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
            {testimonials.map((t) => (
              <StaggerItem key={t.id} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex text-emerald-500">
                  {[...Array(Math.max(1, Math.min(5, t.rating)))].map((_, i) => <Star key={i} className="h-4 w-4 fill-emerald-500 text-emerald-500" />)}
                </div>
                <p className="text-sm text-gray-500 italic leading-relaxed">
                  &quot;{t.quote}&quot;
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                  {t.avatarUrl ? (
                    <img src={t.avatarUrl} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-xs text-brand-primary shrink-0">{t.initials || t.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{t.name}</h4>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t.role}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </ScrollAnimate>
        </div>
      </section>
 
      {/* 10. PARTNERS LOGO CAROUSEL */}
      <section className="bg-white py-16 border-t border-gray-100" id="section-partners">
        <ScrollAnimate variant="fadeInUp" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="font-mono text-xs font-bold tracking-widest text-gray-400 uppercase">Our Government &amp; Scheme Partners</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 opacity-50 hover:opacity-75 transition-opacity" id="partners-list">
            {partners.map((partner) => {
              const IconComp = partnerIconMap[partner.icon] || HeartHandshake;
              return (
                <div key={partner.name} className="flex items-center space-x-2 grayscale hover:grayscale-0 transition-all cursor-pointer" id={`partner-logo-${partner.name}`}>
                  <IconComp className="w-5 h-5 text-gray-600" />
                  <span className="font-display font-bold text-sm tracking-widest text-gray-600 uppercase">
                    {partner.name}
                  </span>
                </div>
              );
            })}
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
                {selectedLeader.image?.trim() ? (
                  <img 
                    src={selectedLeader.image} 
                    alt={selectedLeader.name} 
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-2xl object-cover shadow"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 shadow shrink-0">
                    <span className="text-2xl font-bold text-emerald-800 font-display">
                      {selectedLeader.name.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-display font-bold text-xl text-gray-900">{selectedLeader.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">{selectedLeader.role}</p>
                  <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 border border-emerald-100 font-semibold rounded-full mt-1.5">
                    {selectedLeader.department}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-gray-400">Committee Profile</h4>
                {selectedLeader.bio && (
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl">
                    {selectedLeader.bio}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setSelectedLeader(null)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <a 
                  href={`mailto:${selectedLeader.name.toLowerCase().replace(/[^a-z]/g, '')}@compassionglobal.org`}
                  className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-1"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPACT STORY DETAIL */}
      {showStory && settings.home_impact_story_title && (
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
                {settings.home_impact_story_image && (
                  <img
                    src={settings.home_impact_story_image}
                    alt={settings.home_impact_story_author || settings.home_impact_story_title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-2xl object-cover shadow shrink-0"
                  />
                )}
                <div className="text-center sm:text-left">
                  <h3 className="font-display font-bold text-2xl text-gray-900">{settings.home_impact_story_title}</h3>
                  {settings.home_impact_story_author && (
                    <p className="text-sm text-emerald-600 font-medium">{settings.home_impact_story_author}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 text-sm text-gray-600 leading-relaxed" id="story-paragraphs">
                {settings.home_impact_story_body.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
                {settings.home_impact_story_quote && (
                  <p className="font-semibold text-gray-900 italic">
                    &quot;{settings.home_impact_story_quote}&quot;
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setShowStory(false)}
                  className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPACT REPORT DETAILS */}
      {showImpactReport && settings.home_report_title && (
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
                  <h3 className="font-display font-bold text-2xl text-gray-900">{settings.home_report_title}</h3>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto text-sm text-gray-600 leading-relaxed">
                {(settings.home_report_funds || settings.home_report_efficiency) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    {settings.home_report_funds && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-400 block font-medium">Total Funds Raised</span>
                        <span className="text-lg font-bold text-gray-900">{settings.home_report_funds}</span>
                      </div>
                    )}
                    {settings.home_report_efficiency && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-400 block font-medium">Program Efficiency</span>
                        <span className="text-lg font-bold text-brand-primary">{settings.home_report_efficiency}</span>
                      </div>
                    )}
                  </div>
                )}
                {settings.home_report_summary && (
                  <p>{settings.home_report_summary}</p>
                )}
              </div>

              <div className="flex justify-end items-center pt-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowImpactReport(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Close
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
