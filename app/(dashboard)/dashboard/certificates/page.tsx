'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard, TRANSLATIONS } from '@/lib/dashboard-context';
import {
  Award,
  Calendar,
  Download,
  FileCheck,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/dashboard-ui';

export default function CertificatesPage() {
  const router = useRouter();
  const { certificates, applications, generateCertificate, language } = useDashboard();
  const { toast } = useToast();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Track which courseId is compiling
  const [compilingId, setCompilingId] = useState<string | null>(null);

  const getInitials = (title: string) => {
    return title
      .split(' ')
      .filter(w => w.length > 2 && w !== 'and' && w !== 'for')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  };

  // Find all courses with 'Course Completed' status
  const completedCourses = applications.filter(app => app.status === 'Course Completed');

  // Filter completed courses that do not have generated certificates yet
  const eligibleCourses = completedCourses.filter(completed => {
    return !certificates.some(cert => cert.courseId === completed.courseId);
  });

  const handleCompile = (courseId: string) => {
    setCompilingId(courseId);
    setTimeout(() => {
      generateCertificate(courseId);
      setCompilingId(null);
    }, 1500);
  };

  const getAccentStripStyle = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-primary';
      case 'pending':
        return 'bg-primary-light';
      default:
        return 'bg-success';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-primary-light text-primary border-primary/10';
      case 'pending':
        return 'bg-primary-light text-primary border-primary/10';
      default:
        return 'bg-success-bg text-success-text border-success/10';
    }
  };

  // 1. IF ABSOLUTELY NOTHING (0 CERTIFICATES & 0 READY TO GENERATE) -> SHOW PROPER EMPTY STATE
  if (certificates.length === 0 && eligibleCourses.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Page Subtitle/Context */}
        <div className="-mt-2">
          <p className="text-sm text-muted-foreground">
            View, download, and generate certificates for your completed courses
          </p>
        </div>

        {/* Stats Row with 0 values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-success-bg flex items-center justify-center text-success-text shrink-0">
              <Award size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">0</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Certificates</div>
            </div>
          </div>

          <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center text-primary shrink-0">
              <Clock size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">0</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pending Generation</div>
            </div>
          </div>
        </div>

        {/* Full Empty State */}
        <div className="pt-4">
          <EmptyState
            icon={Award}
            title="No certificates yet"
            description="You do not currently have any active digital certificates generated. Completed course credentials will appear here automatically."
            actionText="Browse Courses"
            onAction={() => router.push('/dashboard/training')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Page Subtitle/Context */}
      <div className="-mt-4 pb-2 border-b border-border">
        <p className="text-sm text-muted-foreground">
          View, download, and generate certificates for your completed courses
        </p>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Certificates */}
        <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-success-bg flex items-center justify-center text-success-text shrink-0">
            <Award size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{certificates.length}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Certificates</div>
          </div>
        </div>

        {/* Stat 2: Pending Generation */}
        <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center text-primary shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{eligibleCourses.length}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pending Generation</div>
          </div>
        </div>
      </div>

      {/* GENERATED CERTIFICATES SECTION */}
      <div className="space-y-6">
        <h3 className="font-bold text-foreground text-base flex items-center gap-2 border-b border-border pb-3">
          <Award size={18} className="text-primary" />
          {t.certificatesGenerated}
        </h3>

        {certificates.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center max-w-lg mx-auto shadow-sm">
            <p className="text-sm text-muted-foreground">
              No certificates have been generated yet. Use the &quot;Ready to Generate&quot; panel below to compile your completed course certificates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert, idx) => {
              const accentColorClass = getAccentStripStyle(cert.status);
              const statusBadgeStyle = getStatusBadgeStyle(cert.status);
              
              return (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-56 relative"
                >
                  {/* Subtle 4px top accent strip */}
                  <div className={`h-1.5 w-full ${accentColorClass}`} />

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Top metadata */}
                      <div className="flex justify-between items-center gap-3 mb-3.5">
                        <div className="w-9 h-9 rounded bg-primary-light border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                          {getInitials(cert.courseTitle)}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusBadgeStyle}`}>
                          {cert.status}
                        </span>
                      </div>

                      {/* Course Title */}
                      <h4 className="text-sm font-bold text-foreground leading-snug line-clamp-1" title={cert.courseTitle}>
                        {cert.courseTitle}
                      </h4>

                      {/* Serial Number & Completion Date */}
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground mt-3 font-semibold">
                        <div>
                          <span className="block text-[9px] text-muted-foreground font-bold uppercase tracking-wide">ID Number</span>
                          <span className="block text-foreground font-mono mt-0.5">{cert.certificateNo}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-muted-foreground font-bold uppercase tracking-wide">Issue Date</span>
                          <span className="block text-foreground mt-0.5">{cert.completionDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t border-border mt-4">
                      {/* View Certificate */}
                      <button
                        onClick={() => toast({ title: 'Certificate View', description: `Viewing certificate ${cert.certificateNo} — verified by the Ministry of Skill Development.`, variant: 'info' })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border hover:border-primary hover:bg-primary-light/50 text-xs font-bold text-foreground hover:text-primary transition-colors"
                      >
                        <FileCheck size={14} />
                        View Cert
                      </button>

                      {/* Download PDF */}
                      <button
                        onClick={() => toast({ title: 'Downloading Certificate', description: `Certificate PDF for serial ${cert.certificateNo}`, variant: 'success' })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                      >
                        <Download size={14} />
                        Download PDF
                      </button>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* READY TO GENERATE SECTION */}
      {eligibleCourses.length > 0 && (
        <div className="space-y-6 pt-2">
          <h3 className="font-bold text-foreground text-base flex items-center gap-2 border-b border-border pb-3">
            <Sparkles size={18} className="text-primary" />
            Ready to Generate
          </h3>
          <p className="text-xs text-muted-foreground -mt-3">
            You have completed courses that are ready for digital certificate compilation. Select &quot;Generate Certificate&quot; to issue your credentials.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eligibleCourses.map((eligible) => (
              <div
                key={eligible.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow transition-shadow duration-200"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-light border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                      {getInitials(eligible.courseTitle)}
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full border border-primary/10 uppercase tracking-wider">
                      Ready
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                    {eligible.courseTitle}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 font-semibold">
                    <Calendar size={12} />
                    Completed on: {eligible.appliedDate}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => handleCompile(eligible.courseId)}
                    disabled={compilingId !== null}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-primary hover:bg-primary-hover disabled:bg-primary/30 text-white transition-colors shadow-sm"
                  >
                    {compilingId === eligible.courseId ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Award size={14} />
                        Generate Certificate
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
