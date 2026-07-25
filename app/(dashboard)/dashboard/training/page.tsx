'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TRANSLATIONS } from '@/lib/dashboard-context';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useLanguage } from '@/lib/hooks/useLanguage';
import {
  Search,
  BookOpen,
  Clock,
  Laptop,
  MapPin,
  Compass,
  ChevronRight,
  Filter,
  ArrowUpDown,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CourseCardSkeleton, EmptyState } from '@/components/dashboard-ui';

export default function TrainingPage() {
  const router = useRouter();
  const { courses, applications } = useDashboardData();
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Tabs: 'browse' | 'my-courses'
  const [activeTab, setActiveTab] = useState<'browse' | 'my-courses'>('browse');
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sortBy, setSortBy] = useState('recommended');

  const handleTabChange = (tab: 'browse' | 'my-courses') => {
    setActiveTab(tab);
    setLoading(true);
  };

  useEffect(() => {
    if (loading) {
      const frame = requestAnimationFrame(() => setLoading(false));
      return () => cancelAnimationFrame(frame);
    }
  }, [loading]);

  const getInitials = (title: string) => {
    return title
      .split(' ')
      .filter(w => w.length > 2 && w !== 'and' && w !== 'for')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  };

  // Filter & Sort Logic for Browse Courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'duration') {
      const durA = parseInt(a.duration) || 0;
      const durB = parseInt(b.duration) || 0;
      return durA - durB;
    }
    return 0; // recommended / default
  });

  // Categories list
  const categories = ['All', 'Technology', 'Skill Dev', 'Agriculture', 'Basic Digital'];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // Map courses to My Courses based on user applications
  const myEnrolledCourses = applications.map(app => {
    const course = courses.find(c => c.id === app.courseId);
    return {
      appId: app.id,
      courseId: app.courseId,
      title: app.courseTitle,
      appliedDate: app.appliedDate,
      appStatus: app.status,
      courseDetails: course
    };
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Technology':
        return 'bg-primary-light text-primary border-primary/20';
      case 'Skill Dev':
        return 'bg-primary-light text-primary border-primary/20';
      case 'Agriculture':
        return 'bg-primary-light text-primary border-primary/20';
      case 'Basic Digital':
        return 'bg-secondary-blue/20 text-primary border-secondary-blue/30';
      default:
        return 'bg-primary-light text-primary border-primary/20';
    }
  };

  const getMyCourseStatusStyle = (status: string) => {
    switch (status) {
      case 'Course Completed':
        return { text: t.completed, style: 'bg-success-bg text-success-text border-success/20' };
      case 'Dropped':
        return { text: t.dropped, style: 'bg-destructive-bg text-destructive-text border-destructive/20' };
      default:
        return { text: t.enrolled, style: 'bg-primary-light text-primary border-primary/20' };
    }
  };

  return (
    <div className="space-y-8">
      {/* SEGMENTED TAB PIL CONTROLS */}
      <div className="flex justify-center">
        <div role="tablist" className="bg-border p-1 rounded-xl flex w-full max-w-md shadow-sm border border-border/50">
          <button
            id="tab-browse"
            role="tab"
            aria-selected={activeTab === 'browse'}
            aria-controls="tabpanel-browse"
            onClick={() => handleTabChange('browse')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
              activeTab === 'browse'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Compass size={16} />
            {t.browse}
          </button>
          <button
            id="tab-my-courses"
            role="tab"
            aria-selected={activeTab === 'my-courses'}
            aria-controls="tabpanel-my-courses"
            onClick={() => handleTabChange('my-courses')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
              activeTab === 'my-courses'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen size={16} />
            {t.myCourses}
            {myEnrolledCourses.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white leading-none">
                {myEnrolledCourses.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* RENDER BROWSE TAB */}
      {activeTab === 'browse' && (
        <div id="tabpanel-browse" role="tabpanel" aria-labelledby="tab-browse" className="space-y-6">
          {/* SEARCH & FILTERS TOOLBAR */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              
              {/* Search input (6 cols) */}
              <div className="relative md:col-span-5">
                <Search className="absolute left-3.5 top-3 text-muted-foreground" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchCourse}
                  className="w-full text-sm pl-11 pr-4 py-2.5 bg-background/60 border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 rounded-lg outline-none transition-all"
                />
              </div>

              {/* Category selector (2 cols) */}
              <div className="md:col-span-2 relative">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground absolute left-3 top-3 pointer-events-none">
                  <Filter size={12} />
                  <span>Category:</span>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs pl-20 pr-3 py-2.5 bg-background/60 border border-border rounded-lg outline-none focus:border-primary transition-all cursor-pointer font-semibold text-foreground"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>
                      {c === 'All' ? t.all : c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level selector (2 cols) */}
              <div className="md:col-span-2 relative">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground absolute left-3 top-3 pointer-events-none">
                  <GraduationCap size={12} />
                  <span>Level:</span>
                </div>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full text-xs pl-14 pr-3 py-2.5 bg-background/60 border border-border rounded-lg outline-none focus:border-primary transition-all cursor-pointer font-semibold text-foreground"
                >
                  {levels.map(l => (
                    <option key={l} value={l}>
                      {l === 'All' ? t.all : l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort by (3 cols) */}
              <div className="md:col-span-3 relative">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground absolute left-3 top-3 pointer-events-none">
                  <ArrowUpDown size={12} />
                  <span>Sort:</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full text-xs pl-12 pr-3 py-2.5 bg-background/60 border border-border rounded-lg outline-none focus:border-primary transition-all cursor-pointer font-semibold text-foreground"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="duration">Duration Length</option>
                </select>
              </div>

            </div>
          </div>

          {/* COURSES CARD GRID */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CourseCardSkeleton />
              <CourseCardSkeleton />
              <CourseCardSkeleton />
            </div>
          ) : filteredCourses.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No courses match search criteria"
              description="Refine your query, adjust filters, or browse other categories to find fitting technical schemes."
              actionText="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedLevel('All');
                setSortBy('recommended');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course, idx) => {
                const isSoldOut = course.seatsLeft === 0;
                
                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-[390px] shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex justify-between items-center gap-2 mb-4">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryColor(course.category)}`}>
                          {course.category}
                        </span>

                        {isSoldOut ? (
                          <span className="text-[10px] font-bold text-destructive-text bg-destructive-bg border border-destructive/10 px-2 py-0.5 rounded-full">
                            {t.soldOut}
                          </span>
                        ) : course.seatsLeft <= 5 ? (
                          <span className="text-[10px] font-bold text-warning bg-warning-bg border border-warning/20 px-2 py-0.5 rounded-full animate-pulse">
                            {course.seatsLeft} {t.seatsLeft}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-muted-foreground bg-muted border-border px-2 py-0.5 rounded-full">
                            {course.seatsLeft} Vacancies
                          </span>
                        )}
                      </div>

                      {/* Title & Initials */}
                      <div className="flex gap-3 items-start mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-light border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0 uppercase shadow-sm">
                          {getInitials(course.title)}
                        </div>
                        <h4 className="text-sm font-bold text-foreground leading-snug line-clamp-2" title={course.title}>
                          {course.title}
                        </h4>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                        {course.description}
                      </p>

                      {/* Metadata row */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground font-medium border-t border-border pt-3">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-muted-foreground" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Laptop size={12} className="text-muted-foreground" />
                          <span>{course.mode}</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2 truncate">
                          <MapPin size={12} className="text-muted-foreground shrink-0" />
                          <span className="truncate">{course.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Area: Price & Action */}
                    <div className="border-t border-border pt-4 mt-auto flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase leading-none">Course Fee</span>
                        <span className={`text-base font-bold mt-1 leading-none ${course.price === 0 ? 'text-success-text' : 'text-primary'}`}>
                          {course.price === 0 ? t.free : `₹${course.price.toLocaleString()}`}
                        </span>
                      </div>

                      <button
                        onClick={() => router.push(`/dashboard/training/${course.id}`)}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                      >
                        {t.viewDetails}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* RENDER MY COURSES TAB */}
      {activeTab === 'my-courses' && (
        <div id="tabpanel-my-courses" role="tabpanel" aria-labelledby="tab-my-courses" className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <CourseCardSkeleton />
            </div>
          ) : myEnrolledCourses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={t.noApplications}
              description="You have not enrolled or applied in any Government courses yet. Visit the 'Browse Courses' tab to secure placement positions."
              actionText={t.browse}
              onAction={() => setActiveTab('browse')}
            />
          ) : (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-foreground text-base flex items-center gap-2 border-b border-border pb-4 mb-6">
                <BookOpen size={18} className="text-primary" />
                My Enrolled Courses & Modules
              </h3>

              <div className="divide-y divide-gray-100">
                {myEnrolledCourses.map((enrolled) => {
                  const statusInfo = getMyCourseStatusStyle(enrolled.appStatus);
                  
                  return (
                    <div
                      key={enrolled.appId}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-background/40 px-2 rounded-lg transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/training/${enrolled.courseId}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary-light border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0 uppercase group-hover:scale-102 transition-transform">
                          {getInitials(enrolled.title)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-foreground truncate pr-4 group-hover:text-primary transition-colors">
                            {enrolled.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {enrolled.courseDetails?.duration || '12 Weeks'}
                            </span>
                            <span className="w-1 h-1 bg-border rounded-full" />
                            <span>Applied: {enrolled.appliedDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusInfo.style}`}>
                          {statusInfo.text}
                        </span>
                        
                        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all hidden md:block" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
