'use client';

import { useState, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TRANSLATIONS } from '@/lib/dashboard-context';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useLanguage } from '@/lib/hooks/useLanguage';
import {
  FileText,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { EmptyState } from '@/components/dashboard-ui';

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { applications } = useDashboardData();
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const highlightCompleted = searchParams.get('filter') === 'completed' && applications.some(a => a.status === 'Course Completed');

  const getInitials = (title: string) => {
    return title
      .split(' ')
      .filter(w => w.length > 2 && w !== 'and' && w !== 'for')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  };

  const steps = [
    { label: 'Verified', key: 'Documents Under Verification' },
    { label: 'Review', key: 'Under Review' },
    { label: 'Approved', key: 'Approved' },
    { label: 'Completed', key: 'Course Completed' }
  ];

  const getStepIndex = (status: string) => {
    const keys = steps.map(s => s.key);
    return keys.indexOf(status);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Course Completed':
        return 'bg-success-bg text-success-text border-success-text/20';
      case 'Approved':
        return 'bg-primary-light text-primary border-primary/20';
      case 'Under Review':
        return 'bg-warning-bg text-warning-text border-warning-text/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      {applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t.noApplications}
          description="You do not currently have any active or previous course enrollment applications. Browse national schemes to register."
          actionText={t.browse}
          onAction={() => router.push('/dashboard/training')}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                Submitted Applications History
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Track verification workflows, counselor review, and completion flags</p>
            </div>
            
            <span className="text-xs font-semibold bg-background border border-border px-3 py-1 rounded-lg text-muted-foreground">
              Total Applications: {applications.length}
            </span>
          </div>

          <div className="space-y-6">
            {applications.map((app, idx) => {
              const currentStepIdx = getStepIndex(app.status);
              
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => router.push(`/dashboard/training/${app.courseId}`)}
                  className={`border rounded-xl p-5 bg-background/30 transition-all duration-200 cursor-pointer group flex flex-col justify-between gap-5 ${
                    highlightCompleted && app.status === 'Course Completed'
                      ? 'border-primary/40 bg-primary-light/30 shadow-sm ring-1 ring-primary/10'
                      : 'border-border hover:border-primary/30 hover:bg-card'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex gap-4 items-start min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-primary-light border border-primary/20 flex items-center justify-center font-bold text-primary text-base shrink-0 group-hover:scale-102 transition-transform">
                        {getInitials(app.courseTitle)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors truncate pr-4">
                          {app.courseTitle}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Applied Date: {app.appliedDate}
                          </span>
                          {app.couponApplied && (
                            <>
                              <span className="w-1 h-1 bg-border rounded-full" />
                              <span className="text-success-text bg-success-bg px-1.5 py-0.5 rounded border border-success/10 text-[10px] uppercase font-bold">
                                Coupon: {app.couponApplied}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start md:self-auto justify-between w-full md:w-auto">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusStyle(app.status)}`}>
                        {t[app.status === 'Documents Under Verification' ? 'documentsVerified' : app.status === 'Under Review' ? 'underReview' : app.status === 'Approved' ? 'approved' : 'courseCompleted'] || app.status}
                      </span>
                      <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all hidden md:block" />
                    </div>
                  </div>

                  {/* MINI INLINE STEPPER FOR STATUS */}
                  <div className="border-t border-border/80 pt-4">
                    <div className="flex items-center justify-between gap-2 max-w-2xl">
                      {steps.map((step, sIdx) => {
                        const active = sIdx <= currentStepIdx;
                        const isLastActive = sIdx === currentStepIdx;
                        
                        return (
                          <Fragment key={sIdx}>
                            {/* Circle dot and label stacked */}
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
                                  isLastActive
                                    ? 'bg-primary border-primary text-white font-bold ring-4 ring-primary/20'
                                    : active
                                    ? 'bg-primary-light border-primary-light text-primary'
                                    : 'bg-card border-border text-muted-foreground'
                                }`}
                              >
                                {active && !isLastActive ? (
                                  <CheckCircle2 size={10} className="text-primary" />
                                ) : (
                                  <span className="text-[9px] font-bold">{sIdx + 1}</span>
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-semibold ${
                                  isLastActive ? 'text-primary font-bold' : active ? 'text-muted-foreground' : 'text-muted-foreground/50'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>

                            {/* Line connecting */}
                            {sIdx < steps.length - 1 && (
                              <div
                                className={`h-0.5 flex-1 rounded-full hidden sm:block ${
                                  sIdx < currentStepIdx ? 'bg-primary' : 'bg-muted'
                                }`}
                              />
                            )}
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
