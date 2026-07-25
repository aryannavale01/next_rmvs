'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMyCourses } from '@/lib/hooks/useMyCourses';
import { TRANSLATIONS } from '@/lib/dashboard-context';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { MyCourse } from '@/lib/store';
import {
  BookOpen,
  Clock,
  ArrowLeft,
  Award,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CourseCardSkeleton, EmptyState } from '@/components/dashboard-ui';

type FilterTab = 'all' | 'in_progress' | 'completed' | 'pending' | 'not_started';

const STATUS_CONFIG: Record<MyCourse['displayStatus'], { label: string; style: string; color: string }> = {
  pending: { label: 'Pending', style: 'bg-warning-bg text-warning-text border-warning/20', color: '#eab308' },
  under_review: { label: 'Under Review', style: 'bg-warning-bg text-warning-text border-warning/20', color: '#eab308' },
  not_started: { label: 'Not Started', style: 'bg-muted text-muted-foreground border-border', color: '#9ca3af' },
  in_progress: { label: 'In Progress', style: 'bg-primary-light text-primary border-primary/20', color: 'var(--color-primary)' },
  completed: { label: 'Completed', style: 'bg-success-bg text-success-text border-success/20', color: '#22c55e' },
};

const CATEGORY_COLOR: Record<string, string> = {
  Technology: 'bg-primary-light text-primary border-primary/20',
  'Skill Dev': 'bg-primary-light text-primary border-primary/20',
  Agriculture: 'bg-primary-light text-primary border-primary/20',
  'Basic Digital': 'bg-secondary-blue/20 text-primary border-secondary-blue/30',
};

function getInitials(title: string) {
  return title
    .split(' ')
    .filter((w) => w.length > 2 && w !== 'and' && w !== 'for')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MyCoursesPage() {
  const router = useRouter();
  const { myCourses, isLoading } = useMyCourses();
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!mounted) {
      const frame = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [mounted]);

  const filterCounts = {
    all: myCourses.length,
    in_progress: myCourses.filter((c) => c.displayStatus === 'in_progress').length,
    completed: myCourses.filter((c) => c.displayStatus === 'completed').length,
    pending: myCourses.filter((c) => c.displayStatus === 'pending' || c.displayStatus === 'under_review').length,
    not_started: myCourses.filter((c) => c.displayStatus === 'not_started').length,
  };

  const filteredCourses = myCourses.filter((course) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return course.displayStatus === 'pending' || course.displayStatus === 'under_review';
    return course.displayStatus === activeFilter;
  });

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'pending', label: 'Pending' },
    { key: 'not_started', label: 'Not Started' },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/training')}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to Training"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen size={20} className="text-primary" />
              {t.myCourses}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track progress on your enrolled training
            </p>
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      {myCourses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterTabs.map((tab) => {
            const count = filterCounts[tab.key];
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`px-1 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                      isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* CONTENT */}
      {!mounted || isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </div>
      ) : myCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No trainings yet"
          description="You have not enrolled in any training. Browse our catalog to find programs that match your interests."
          actionText="Browse Training"
          onAction={() => router.push('/dashboard/training')}
        />
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={`No ${activeFilter === 'all' ? '' : STATUS_CONFIG[activeFilter === 'pending' ? 'pending' : activeFilter].label.toLowerCase()} trainings`}
          description="No trainings match this filter. Try selecting a different category above."
          actionText="View All"
          onAction={() => setActiveFilter('all')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCourses.map((course, idx) => {
              const statusConfig = STATUS_CONFIG[course.displayStatus];
              const showProgress = course.displayStatus === 'in_progress' || course.displayStatus === 'completed';

              return (
                <motion.div
                  key={course.applicationId}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
                >
                  <div>
                    {/* TOP BADGES */}
                    <div className="flex justify-between items-center gap-2 mb-4">
                      {course.category && (
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            CATEGORY_COLOR[course.category] || 'bg-primary-light text-primary border-primary/20'
                          }`}
                        >
                          {course.category}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusConfig.style}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* TITLE & INITIALS */}
                    <div className="flex gap-3 items-start mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-light border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0 uppercase shadow-sm">
                        {getInitials(course.title)}
                      </div>
                      <div className="min-w-0">
                        <h4
                          className="text-sm font-bold text-foreground leading-snug line-clamp-2"
                          title={course.title}
                        >
                          {course.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {course.duration}
                          </span>
                          <span className="w-1 h-1 bg-border rounded-full" />
                          <span>{course.mode}</span>
                        </div>
                      </div>
                    </div>

                    {/* DATES */}
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-4">
                      <Calendar size={11} />
                      <span>
                        {course.startDate
                          ? `${formatDate(course.startDate)} — ${formatDate(course.endDate)}`
                          : `Applied ${formatDate(course.appliedDate)}`}
                      </span>
                    </div>

                    {/* PROGRESS BAR — only for in_progress / completed */}
                    {showProgress && course.progress && (
                      <div className="mb-1">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[11px] font-semibold text-foreground">
                            {course.progress.percentComplete}% complete
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {course.displayStatus === 'completed'
                              ? 'Training ended'
                              : `${course.progress.daysRemaining} days left`}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="h-2 rounded-full transition-all"
                            style={{
                              backgroundColor: statusConfig.color,
                              width: `${course.progress.percentComplete}%`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progress.percentComplete}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {course.displayStatus === 'completed'
                            ? 'Training duration has ended'
                            : `${course.progress.daysElapsed} of ${course.progress.totalDays} days elapsed`}
                        </p>
                      </div>
                    )}

                    {/* NOT STARTED info */}
                    {course.displayStatus === 'not_started' && course.startDate && (
                      <div className="bg-muted/50 border border-border rounded-lg p-3 mb-1">
                        <p className="text-[11px] text-muted-foreground font-medium">
                          Training starts {formatDate(course.startDate)}
                        </p>
                      </div>
                    )}

                    {/* PENDING info */}
                    {(course.displayStatus === 'pending' || course.displayStatus === 'under_review') && (
                      <div className="bg-warning-bg/30 border border-warning/10 rounded-lg p-3 mb-1">
                        <p className="text-[11px] text-warning-text font-medium">
                          {course.displayStatus === 'pending'
                            ? 'Your application is pending review'
                            : 'Your application is under review'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ACTION */}
                  <div className="border-t border-border pt-4 mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {course.hasCertificate && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-success-text bg-success-bg px-2 py-0.5 rounded">
                          <Award size={10} />
                          Certificate
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => router.push(`/dashboard/training/${course.courseId}`)}
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      {t.viewDetails}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
