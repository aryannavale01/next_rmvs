'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard, TRANSLATIONS } from '@/lib/dashboard-context';
import {
  GraduationCap,
  Award,
  Bell,
  FileText,
  Search,
  User,
  ArrowRight,
  FileCheck,
  BookOpen,
  BookmarkCheck,
  Calendar,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { StatSkeleton } from '@/components/dashboard-ui';

export default function DashboardHome() {
  const router = useRouter();
  const { profile, applications, certificates, notifications, courses, language, loading, error, markAsRead } = useDashboard();
  const [mounted, setMounted] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const appliedCount = applications.length;
  const completedCount = applications.filter(a => a.status === 'Course Completed').length;
  const certificateCount = certificates.length;
  const unreadCount = notifications.filter(n => !n.read).length;

  const getInitials = (title: string) => {
    return title
      .split(' ')
      .filter(w => w.length > 2 && w !== 'and' && w !== 'for')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  };

  const featuredCourses = courses.slice(0, 3);

  const profileFields = [
    { label: 'Name', filled: !!(profile.firstName && profile.lastName) },
    { label: 'Email', filled: !!profile.email },
    { label: 'Phone', filled: !!profile.phone },
    { label: 'Aadhaar', filled: !!profile.aadhaarNo },
    { label: 'PAN', filled: !!profile.panNo },
    { label: 'Photo', filled: !!profile.photoUrl },
    { label: 'Aadhaar Doc', filled: profile.documents.aadhaar.uploaded },
    { label: 'PAN Doc', filled: profile.documents.pan.uploaded },
  ];
  const filledCount = profileFields.filter(f => f.filled).length;
  const completionPct = Math.round((filledCount / profileFields.length) * 100);
  const missingFields = profileFields.filter(f => !f.filled);

  const upcomingTrainings = applications
    .filter(a => a.status === 'Approved')
    .map(a => ({
      ...a,
      course: courses.find(c => c.id === a.courseId),
    }))
    .filter(a => a.course)
    .sort((a, b) => (a.course!.startDate || '').localeCompare(b.course!.startDate || ''))
    .slice(0, 5);

  if (!mounted) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="h-28 bg-card border border-border rounded-xl flex items-center px-6 animate-pulse gap-4">
          <div className="w-14 h-14 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted rounded w-1/4" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-[240px] bg-card border border-border rounded-xl animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-[240px] bg-card border border-border rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* ERROR BANNERS */}
      {error?.dashboard && (
        <div className="bg-destructive-bg border border-destructive/20 text-destructive-text px-4 py-3 rounded-xl text-sm font-medium">
          {error.dashboard}
        </div>
      )}
      {error?.courses && !error.dashboard && (
        <div className="bg-warning-bg border border-warning/20 text-warning-text px-4 py-3 rounded-xl text-sm font-medium">
          {error.courses}
        </div>
      )}

      {/* WELCOME BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          {profile.photoUrl && profile.photoUrl !== photoError ? (
            <img
              src={profile.photoUrl}
              alt={`${profile.firstName} ${profile.lastName}`}
              width={64}
              height={64}
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.retried) {
                  img.dataset.retried = '1';
                  img.src = profile.photoUrl + '?retry=' + Date.now();
                } else {
                  setPhotoError(profile.photoUrl || null);
                }
              }}
              className="h-16 w-16 rounded-full object-cover border-4 border-primary-light shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-full border-4 border-primary-light flex items-center justify-center bg-primary-light text-primary font-bold text-xl uppercase shrink-0">
              {profile.firstName[0] || '?'}
              {profile.lastName[0] || ''}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {t.welcome}, {profile.firstName || 'User'}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              All your training modules, applications, and legal certifications are verified and synchronized.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard/profile')}
          className="inline-flex items-center gap-2 self-start sm:self-center text-xs font-semibold px-4 py-2 bg-primary-light hover:bg-primary-light text-primary rounded-lg transition-colors"
        >
          <User size={14} />
          {t.myProfile}
        </button>
      </div>

      {/* PROFILE COMPLETION */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">{t.profileComplete}</h3>
          <span className={`text-xs font-bold ${completionPct === 100 ? 'text-success-text' : 'text-primary'}`}>{completionPct}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${completionPct === 100 ? 'bg-success' : 'bg-primary'}`}
            style={{ width: `${completionPct}%` }}
          />
        </div>
        {completionPct === 100 ? (
          <div className="flex items-center gap-2 text-success-text text-xs font-semibold">
            <CheckCircle2 size={14} />
            {t.allFieldsComplete}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Missing:</span>
            {missingFields.map(f => (
              <span key={f.label} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning-bg text-warning-text border border-warning/20">
                {f.label}
              </span>
            ))}
            <button
              onClick={() => router.push('/dashboard/profile')}
              className="ml-auto text-xs font-semibold text-primary hover:text-primary-hover"
            >
              {t.completeProfile} →
            </button>
          </div>
        )}
      </div>

      {/* STATS CARDS GRID — all clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => router.push('/dashboard/applications')}
          className="bg-card p-5 rounded-xl border border-border flex items-center gap-4 hover:border-primary/30 hover:shadow-sm transition-all text-left cursor-pointer"
        >
          <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center text-primary shrink-0">
            <FileText size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{appliedCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.applications}</div>
          </div>
        </button>

        <button
          onClick={() => router.push('/dashboard/applications?filter=completed')}
          className="bg-card p-5 rounded-xl border border-border flex items-center gap-4 hover:border-primary/30 hover:shadow-sm transition-all text-left cursor-pointer"
        >
          <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center text-primary shrink-0">
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{completedCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.completed}</div>
          </div>
        </button>

        <button
          onClick={() => router.push('/dashboard/certificates')}
          className="bg-card p-5 rounded-xl border border-border flex items-center gap-4 hover:border-primary/30 hover:shadow-sm transition-all text-left cursor-pointer"
        >
          <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center text-primary shrink-0">
            <Award size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{certificateCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.certificates}</div>
          </div>
        </button>

        <button
          onClick={() => router.push('/dashboard/notifications')}
          className="bg-card p-5 rounded-xl border border-border flex items-center gap-4 hover:border-primary/30 hover:shadow-sm transition-all text-left cursor-pointer"
        >
          <div className="h-12 w-12 rounded-full bg-secondary-blue/20 flex items-center justify-center text-primary shrink-0">
            <Bell size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{unreadCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.notifications}</div>
          </div>
        </button>
      </div>

      {/* QUICK ACTIONS ROW — solid blue */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.browse, path: '/dashboard/training', icon: Search },
          { label: t.myProfile, path: '/dashboard/profile', icon: User },
          { label: t.certificates, path: '/dashboard/certificates', icon: Award },
          { label: t.activity, path: '/dashboard/activity', icon: BookmarkCheck }
        ].map((action, idx) => (
          <button
            key={idx}
            onClick={() => router.push(action.path)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary hover:bg-primary-hover text-white transition-colors"
          >
            <div className="text-white">
              <action.icon size={22} />
            </div>
            <span className="text-sm font-semibold">{action.label}</span>
          </button>
        ))}
      </div>

      {/* ROW 2: RECENT APPLICATIONS & NOTIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RECENT APPLICATIONS */}
        <div className="bg-card rounded-xl border border-border flex flex-col">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <FileCheck size={18} className="text-primary shrink-0" />
              Recent Applications
            </h3>
            <button
              onClick={() => router.push('/dashboard/applications')}
              className="text-sm font-semibold text-primary hover:text-primary-hover"
            >
              View All
            </button>
          </div>
          <div className="flex-1 overflow-hidden p-2 space-y-1 min-h-[180px]">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm animate-pulse">Loading...</div>
            ) : applications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No active training applications. Browse our training modules to start.
              </div>
            ) : (
              applications.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  onClick={() => router.push(`/dashboard/training/${app.courseId}`)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0 uppercase">
                      {getInitials(app.courseTitle)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-foreground truncate pr-2">
                        {app.courseTitle}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Applied on {app.appliedDate}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase shrink-0 ${
                    app.status === 'Course Completed' || app.status === 'Approved'
                      ? 'bg-success-bg text-success-text'
                      : 'bg-primary-light text-primary'
                  }`}>
                    {app.status === 'Documents Under Verification' ? 'VERIFYING' : app.status === 'Under Review' ? 'PENDING' : app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RECENT NOTIFICATIONS */}
        <div className="bg-card rounded-xl border border-border flex flex-col">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Bell size={18} className="text-primary shrink-0" />
              Recent Notifications
            </h3>
            {unreadCount > 0 && <div className="h-2 w-2 rounded-full bg-primary"></div>}
          </div>
          <div className="flex-1 overflow-hidden p-2 space-y-1 min-h-[180px]">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm animate-pulse">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.slice(0, 3).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markAsRead(notif.id);
                    if (notif.link && notif.link.startsWith('/')) {
                      router.push(notif.link);
                    }
                  }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center text-primary shrink-0">
                    <Bell size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-foreground truncate pr-2">{notif.title}</span>
                      <span className="text-[10px] text-muted-foreground font-medium shrink-0">{notif.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{notif.description}</p>
                  </div>
                  {!notif.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0"></div>}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* UPCOMING TRAINING */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          {t.upcomingTraining}
        </h3>

        {upcomingTrainings.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <GraduationCap size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">{t.noUpcomingTraining}</p>
            <button
              onClick={() => router.push('/dashboard/training')}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover"
            >
              <Search size={14} />
              {t.browseTraining}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTrainings.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/dashboard/training/${item.courseId}`)}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate">{item.courseTitle}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{item.course?.category}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary border border-primary/20 shrink-0 ml-2">
                    {item.course?.mode}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-semibold">
                  {item.course?.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {item.course.startDate}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {item.course?.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </motion.div>
  );
}
