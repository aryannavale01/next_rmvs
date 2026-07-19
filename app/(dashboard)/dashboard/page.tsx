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
  TrendingUp,
  FileCheck,
  ShieldCheck,
  Percent,
  Sparkles,
  BookmarkCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { StatSkeleton } from '@/components/dashboard-ui';

export default function DashboardHome() {
  const router = useRouter();
  const { profile, applications, certificates, notifications, language } = useDashboard();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Derive stats dynamically
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

  const governmentSchemes = [
    {
      id: 'scheme-1',
      title: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)',
      description: 'Free technical skill certifications with direct job-placement linkups, 100% sponsored by the Ministry of Skill Development & Entrepreneurship.',
      category: 'Skill Subsidies',
      date: 'Active till Nov 2026',
      icon: Sparkles,
      color: 'bg-primary-light text-primary'
    },
    {
      id: 'scheme-2',
      title: 'Aatmanirbhar Bharat Rojgar Yojana (ABRY)',
      description: 'Financial incentives for registered employers to generate and hire local personnel, expanding the smart technical workforce in emerging cities.',
      category: 'Employment Incentives',
      date: 'Extended Dec 2026',
      icon: TrendingUp,
      color: 'bg-secondary-blue/20 text-primary'
    },
    {
      id: 'scheme-3',
      title: 'PM Street Vendor AtmaNirbhar Nidhi (PM SVANidhi)',
      description: 'Collateral-free working capital microloans up to ₹50,000 paired with complete digital literacy and marketing integration programs.',
      category: 'Micro Finance',
      date: 'Ongoing Program',
      icon: Percent,
      color: 'bg-secondary-blue/20 text-primary'
    }
  ];

  if (!mounted) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Banner Skeleton */}
        <div className="h-28 bg-card border border-border rounded-xl flex items-center px-6 animate-pulse gap-4">
          <div className="w-14 h-14 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted rounded w-1/4" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>

        {/* Content Rows Skeleton */}
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
      {/* WELCOME BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full border-4 border-primary-light flex items-center justify-center bg-primary-light text-primary font-bold text-xl uppercase shrink-0">
            {profile.firstName[0]}
            {profile.lastName[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {t.welcome}, {profile.firstName}
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

      {/* STATS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Applied Courses */}
        <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center text-primary shrink-0">
            <FileText size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{appliedCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.applications}</div>
          </div>
        </div>

        {/* Stat 2: Completed Courses */}
        <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center text-primary shrink-0">
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{completedCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.completed}</div>
          </div>
        </div>

        {/* Stat 3: Certificates */}
        <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center text-primary shrink-0">
            <Award size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{certificateCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.certificates}</div>
          </div>
        </div>

        {/* Stat 4: Notifications */}
        <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-secondary-blue/20 flex items-center justify-center text-primary shrink-0">
            <Bell size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{unreadCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.notifications}</div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
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
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary transition-colors"
          >
            <div className="text-primary">
              <action.icon size={22} />
            </div>
            <span className="text-sm font-semibold text-foreground">{action.label}</span>
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
            {applications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No active course applications. Browse our training modules to start.
              </div>
            ) : (
              applications.slice(0, 3).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
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
            {unreadCount > 0 && <button className="h-2 w-2 rounded-full bg-primary"></button>}
          </div>
          <div className="flex-1 overflow-hidden p-2 space-y-1 min-h-[180px]">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.slice(0, 3).map((notif) => (
                <div key={notif.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors">
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

      {/* GOVERNMENT SCHEMES & SUBSIDIES */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          Recent & Popular Schemes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {governmentSchemes.map((scheme) => {
            return (
              <div
                key={scheme.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow transition-shadow duration-200"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full border border-primary/20 uppercase tracking-wider">
                      {scheme.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {scheme.date}
                    </span>
                  </div>

                  <div className="flex gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg ${scheme.color} flex items-center justify-center shrink-0 shadow-sm`}>
                      <scheme.icon size={18} />
                    </div>
                    <h4 className="text-sm font-bold text-foreground leading-snug">
                      {scheme.title}
                    </h4>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {scheme.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-semibold">Subsidized Admission</span>
                    <span className="text-[11px] text-success-text font-bold bg-success-bg px-2 py-0.5 rounded">100% Free</span>
                  </div>

                  <button
                    onClick={() => router.push('/dashboard/training')}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-primary hover:bg-primary-hover text-white transition-all hover:shadow-sm"
                  >
                    Browse Courses
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </motion.div>
  );
}
