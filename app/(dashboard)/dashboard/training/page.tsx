'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TRANSLATIONS } from '@/lib/dashboard-context';
import { ALL_CATEGORY_LABELS } from '@/lib/course-categories';
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
} from 'lucide-react';
import { motion } from 'motion/react';
import { CourseCardSkeleton, EmptyState } from '@/components/dashboard-ui';

export default function TrainingPage() {
  const router = useRouter();
  const { courses, applications } = useDashboardData();
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sortBy, setSortBy] = useState('recommended');

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
  const categories = ['All', ...ALL_CATEGORY_LABELS];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const enrolledCount = applications.length;

  const getCategoryColor = (_cat: string) => {
    return 'bg-primary-light text-primary border-primary/20';
  };

  return (
    <div className="space-y-8">
      {/* PAGE HEADER WITH MY COURSES BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Compass size={20} className="text-primary" />
            {t.browse}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Explore available training programs
          </p>
        </div>
        {enrolledCount > 0 && (
          <button
            onClick={() => router.push('/dashboard/training/my-courses')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-light hover:bg-primary-light text-primary border border-primary/20 text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <BookOpen size={16} />
            {t.myCourses}
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white leading-none">
              {enrolledCount}
            </span>
          </button>
        )}
      </div>

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
          <div className="md:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs pl-3 pr-3 py-2.5 bg-background/60 border border-border rounded-lg outline-none focus:border-primary transition-all cursor-pointer font-semibold text-foreground"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Level selector (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full text-xs pl-3 pr-3 py-2.5 bg-background/60 border border-border rounded-lg outline-none focus:border-primary transition-all cursor-pointer font-semibold text-foreground"
            >
              {levels.map(l => (
                <option key={l} value={l}>
                  {l === 'All' ? 'All Levels' : l}
                </option>
              ))}
            </select>
          </div>

          {/* Sort by (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-xs pl-3 pr-3 py-2.5 bg-background/60 border border-border rounded-lg outline-none focus:border-primary transition-all cursor-pointer font-semibold text-foreground"
            >
              <option value="recommended">Sort: Recommended</option>
              <option value="price-low">Sort: Price Low → High</option>
              <option value="price-high">Sort: Price High → Low</option>
              <option value="duration">Sort: Duration</option>
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
          title="No trainings match search criteria"
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
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase leading-none">Training Fee</span>
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
  );
}
