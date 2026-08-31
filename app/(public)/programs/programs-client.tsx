'use client';
import { useState, useMemo, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, BookOpen, Clock, Users, CheckCircle2, Award,
  Lightbulb, Globe, CheckCircle, Sparkles, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export interface PublicCourse {
  id: string;
  slug: string;
  title: string;
  category: string;
  level: string;
  instructor: {
    name: string;
    role: string;
    image: string;
  };
  duration: string;
  seatsLeft: number | 'Unlimited';
  seatsTotal?: number | null;
  image: string;
  description: string;
}

export interface PublicProgram {
  id: string;
  title: string;
  category: string;
  description: string;
  goal: number;
  raised: number;
  image: string;
}

interface ProgramsClientProps {
  courses: PublicCourse[];
  strategicPrograms: PublicProgram[];
  featuredProgram: PublicProgram | null;
}

export default function ProgramsClient({ courses, strategicPrograms, featuredProgram }: ProgramsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'training' | 'field'>('training');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCourseCategory, setActiveCourseCategory] = useState<string>('All');
  const [activeFieldCategory, setActiveFieldCategory] = useState<string>('All');

  const [subscribingEmail, setSubscribingEmail] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCourseCategory === 'All' || c.category === activeCourseCategory;
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchQuery, activeCourseCategory]);

  const filteredFieldPrograms = useMemo(() => {
    return strategicPrograms.filter(p => {
      const matchesCategory = activeFieldCategory === 'All' || p.category === activeFieldCategory;
      return matchesCategory;
    });
  }, [activeFieldCategory]);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (subscribingEmail.trim()) {
      setSubscribing(true);
      try {
        const res = await fetch('/api/public/newsletter-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: subscribingEmail, source: 'programs' }),
        });
        if (!res.ok) throw new Error('Failed');
      } catch (err) {
        toast({ title: 'Subscription Failed', description: 'Unable to subscribe right now. Please try again later.', variant: 'error' });
        setSubscribing(false);
        return;
      }
      setSubscribeSuccess(true);
      setSubscribingEmail('');
      setSubscribing(false);
      setTimeout(() => setSubscribeSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-0" id="programs-page-root">

      {/* Tab Navigation Selector at the top of the page */}
      <div className="bg-gray-50/50 border-b border-gray-100 py-4 sticky top-[80px] z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="inline-flex p-1 bg-gray-100 rounded-full shadow-inner border border-gray-200/50">
            <button
              onClick={() => { setActiveTab('training'); setSearchQuery(''); }}
              className={`px-6 py-2.5 rounded-full font-display font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'training'
                  ? 'bg-white text-brand-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              id="tab-btn-training"
            >
              <BookOpen className="h-4 w-4" />
              Training &amp; Academy
            </button>
            <button
              onClick={() => { setActiveTab('field'); setSearchQuery(''); }}
              className={`px-6 py-2.5 rounded-full font-display font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'field'
                  ? 'bg-white text-brand-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              id="tab-btn-field"
            >
              <Globe className="h-4 w-4" />
              Strategic Field Operations
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: TRAINING & CERTIFICATION CATALOG */}
      {activeTab === 'training' && (
        <div className="animate-in fade-in duration-300" id="training-view">

          {/* Header */}
          <section className="bg-white pt-12 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                <div className="lg:col-span-8 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-brand-primary border border-emerald-100 font-display font-semibold text-xs uppercase tracking-wider">
                    Knowledge for Impact
                  </div>
                  <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 tracking-tight leading-tight">
                    Empowering Change-Makers
                  </h1>
                  <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-2xl">
                    Access certified professional training designed to equip you with the strategic skills needed to tackle global challenges in public health, AI technology, and humanitarian leadership.
                  </p>
                </div>

                <div className="lg:col-span-4 w-full">
                  <div className="relative" id="course-search-container">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search catalog..."
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary shadow-sm transition-all"
                      id="course-search-input"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-12 border-b border-gray-100 pb-4" id="course-filters">
                {['All', 'Health', 'Tech', 'Leadership', 'Environment'].map((cat) => {
                  const isActive = activeCourseCategory === cat;
                  const label = cat === 'All' ? 'All Courses' : cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCourseCategory(cat)}
                      className={`px-4.5 py-2 rounded-full font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                        isActive
                          ? 'bg-black text-white shadow-md'
                          : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-600'
                      }`}
                      id={`course-filter-btn-${cat}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Course Grid */}
          <section className="bg-white pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {filteredCourses.length === 0 ? (
                <div className="text-center py-16 space-y-4" id="no-courses-found">
                  <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
                  <h3 className="font-display font-semibold text-lg text-gray-900">No training programs match your search</h3>
                  <p className="text-sm text-gray-400">Try checking your spelling, selecting a different category, or resetting filters.</p>
                  <button
                    onClick={() => { setActiveCourseCategory('All'); setSearchQuery(''); }}
                    className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-lg hover:bg-brand-primary-hover"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="course-cards-grid">
                  {filteredCourses.map((c) => (
                    <Link
                      key={c.id}
                      href={`/programs/${c.slug}`}
                      className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                      id={`course-card-${c.id}`}
                    >
                      <div>
                        <div className="aspect-[16/10] overflow-hidden relative bg-gray-100">
                          {c.image?.trim() ? (
                            <img
                              src={c.image}
                              alt={c.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <span className="text-4xl font-bold text-gray-400 font-display">
                                {c.title.trim().charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div className="absolute top-4 left-4 flex gap-1.5 flex-wrap">
                            <span className="bg-emerald-700 text-white font-mono font-bold text-[9px] tracking-widest px-2.5 py-1 rounded-md uppercase">
                              {c.category}
                            </span>
                            <span className="bg-white/95 backdrop-blur-sm text-gray-800 font-display font-bold text-[9px] tracking-wider px-2.5 py-1 rounded-md border border-gray-100 flex items-center gap-1">
                              <Award className="h-3 w-3 text-brand-primary" /> CERTIFICATE
                            </span>
                          </div>
                        </div>

                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full uppercase">
                              {c.level}
                            </span>
                          </div>

                          <h3 className="font-display font-bold text-lg text-gray-950 group-hover:text-brand-primary transition-colors leading-snug">
                            {c.title}
                          </h3>

                          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed line-clamp-2">
                            {c.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 pt-0 space-y-4">
                        <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50">
                          {c.instructor?.image?.trim() ? (
                            <img
                              src={c.instructor.image}
                              alt={c.instructor.name}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-[10px] text-brand-primary shrink-0">
                              {(c.instructor?.name || '?').trim().charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 leading-none">{c.instructor.name}</h4>
                            <span className="text-[10px] text-gray-400 font-semibold">{c.instructor.role}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs font-semibold py-1 border-t border-b border-gray-50">
                          <span className="text-gray-400 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> {c.duration}
                          </span>

                          {c.seatsLeft === 'Unlimited' ? (
                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              Unlimited
                            </span>
                          ) : c.seatsLeft <= 5 ? (
                            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0 text-rose-500" /> ! {c.seatsLeft} seats left
                            </span>
                          ) : (
                            <span className="text-brand-primary bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Users className="h-3 w-3 shrink-0" /> {c.seatsLeft} seats left
                            </span>
                          )}
                        </div>

                        <span className="w-full inline-flex items-center justify-center px-4 py-3 bg-brand-primary group-hover:bg-brand-primary-hover text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow-md">
                          View Details
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* "Why Train" Features Section */}
          <section className="bg-gradient-to-b from-white to-gray-50/70 py-24 border-t border-gray-100" id="section-why-train">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight">Why Train with CompassionGlobal?</h2>
                <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                  We combine rigorous scholarly structure with real-world, field-first experience to design an educational ecosystem that triggers authentic humanitarian impact.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="why-train-features">
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-center sm:text-left">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-brand-primary mx-auto sm:mx-0">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-gray-900">Recognized Certifications</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Our modular programs are internationally accredited and recognized by elite humanitarian organizations and global NGOs.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-center sm:text-left">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-brand-primary mx-auto sm:mx-0">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-gray-900">Expert Mentors</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Learn directly from active field experts who have decades of leadership experience managing large-scale global initiatives.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-center sm:text-left">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-brand-primary mx-auto sm:mx-0">
                    <Globe className="h-6 w-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-gray-900">Global Alumni Network</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Join a highly active professional guild of thousands of change-makers sharing operational insights across 120 nations.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Call to action panel */}
          <section className="bg-white pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-brand-navy rounded-[2.5rem] p-8 sm:p-16 text-white text-center space-y-6 relative overflow-hidden" id="cta-journey-box">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(52,211,153,0.1),transparent_50%)] pointer-events-none" />

                <div className="max-w-2xl mx-auto space-y-4 relative z-10">
                  <h2 className="font-display font-bold text-3xl sm:text-4xl">Ready to start your journey?</h2>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Get monthly updates on fully-funded scholarship opportunities, new courses, and professional field placements directly in your inbox.
                  </p>
                </div>

                <div className="max-w-md mx-auto pt-4 relative z-10" id="course-subs-container">
                  {subscribeSuccess ? (
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl flex items-center justify-center gap-2 text-brand-mint" id="course-subs-success">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-semibold">Subscribed successfully! Watch your inbox.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        value={subscribingEmail}
                        onChange={(e) => setSubscribingEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-mint/50 focus:border-brand-mint"
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 bg-[#47e3a2] hover:bg-[#39cb8e] text-gray-900 font-semibold text-sm rounded-xl shadow-md transition-colors cursor-pointer shrink-0"
                      >
                        Subscribe
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>
      )}

      {/* VIEW 2: STRATEGIC PROGRAMS & OPERATIONS */}
      {activeTab === 'field' && (
        <div className="animate-in fade-in duration-300" id="field-view">

          {/* Header */}
          <section className="bg-white pt-12 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="space-y-4 max-w-3xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-brand-primary border border-emerald-100 font-display font-semibold text-xs uppercase tracking-wider">
                  Our Commitment
                </div>
                <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 tracking-tight leading-tight">
                  Strategic Programs for Global Change
                </h1>
                <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
                  We focus on sustainable, long-term solutions that empower local communities. From rural education to emergency climate relief, our work is driven by community needs and global expertise.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-12 border-b border-gray-100 pb-4" id="field-filters">
                {['All', 'Health', 'Education', 'Environment', 'Emergency Relief'].map((cat) => {
                  const isActive = activeFieldCategory === cat;
                  const label = cat === 'All' ? 'All Programs' : cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveFieldCategory(cat)}
                      className={`px-4.5 py-2 rounded-full font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                        isActive
                          ? 'bg-black text-white shadow-md'
                          : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-600'
                      }`}
                      id={`field-filter-btn-${cat}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Featured Initiative Banner Card */}
          {featuredProgram && (
          <section className="bg-white pb-12" id="section-featured-field">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-[#FAFBF9] rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12" id="featured-field-box">
                <div className="lg:col-span-6 aspect-[16/10] lg:aspect-auto min-h-[300px] bg-gray-100 relative">
                  {featuredProgram.image?.trim() ? (
                    <img
                      src={featuredProgram.image}
                      alt={featuredProgram.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Sparkles className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-6 left-6 bg-brand-primary text-white font-mono font-bold text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-md flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Featured Initiative
                  </div>
                </div>

                <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="text-xs font-semibold text-emerald-700 font-mono tracking-widest uppercase flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" /> {featuredProgram.category}
                    </div>
                    <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 tracking-tight">{featuredProgram.title}</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {featuredProgram.description}
                    </p>
                  </div>

                  {featuredProgram.goal > 0 && (
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-500">Goal: ${featuredProgram.goal.toLocaleString()}</span>
                        <span className="text-brand-primary">{Math.round((featuredProgram.raised / featuredProgram.goal) * 100)}% Funded</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-150 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary rounded-full" style={{ width: `${Math.min(100, Math.round((featuredProgram.raised / featuredProgram.goal) * 100))}%` }} />
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Secondary Cards Grid */}
          <section className="bg-white pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="field-operations-grid">
                {filteredFieldPrograms.map((p) => {
                  const percent = Math.round((p.raised / p.goal) * 100);
                  return (
                    <div key={p.id} className="group bg-[#FAFBF9] rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between" id={`field-card-${p.id}`}>
                      <div>
                        <div className="aspect-[16/10] overflow-hidden bg-gray-100 relative">
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
                          <span className="absolute top-4 left-4 bg-white text-emerald-800 font-mono font-bold text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-md border border-gray-150 shadow-sm">
                            {p.category}
                          </span>
                        </div>

                        <div className="p-6 space-y-3">
                          <h3 className="font-display font-bold text-base text-gray-950 group-hover:text-brand-primary transition-colors">
                            {p.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed line-clamp-3">
                            {p.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 pt-0 space-y-4">
                        <div className="space-y-1 pt-3 border-t border-gray-100">
                          <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                            <span>Raised: ${p.raised.toLocaleString()}</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-primary rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Amplifying Impact Bottom Banner */}
          <section className="bg-white pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-brand-navy rounded-[2.5rem] p-8 sm:p-16 text-white text-center space-y-6 relative overflow-hidden" id="amplifying-box">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none" />

                <div className="max-w-2xl mx-auto space-y-4">
                  <h2 className="font-display font-bold text-3xl sm:text-4xl">Amplifying Impact Through Collaboration</h2>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Corporate partners, family trusts, and philanthropic institutions play a critical role in scaling our field operations safely. Let&apos;s build a more compassionate world together.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <button
                    onClick={() => router.push('/contact?subject=Partnership%20Inquiry')}
                    className="px-6 py-3 bg-[#47e3a2] hover:bg-[#39cb8e] text-gray-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Become a Partner
                  </button>
                  <a
                    href="mailto:partnerships@compassionglobal.org"
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl transition-all cursor-pointer uppercase tracking-wider inline-flex items-center"
                  >
                    Contact Partnerships
                  </a>
                </div>
              </div>
            </div>
          </section>

        </div>
      )}
 
    </div>
  );
}
