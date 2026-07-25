'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/admin-context';
import {
  ChevronLeft, Video, HelpCircle, ClipboardList, FileText,
} from 'lucide-react';

export default function AdminCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { courses, enrollments, members, teachers, updateCourse } = useAdmin();

  const course = courses.find(c => c.id === courseId);

  const [detailTab, setDetailTab] = useState<'overview' | 'syllabus' | 'enrollments'>('overview');

  if (!course) {
    return (
      <div className="space-y-4 font-sans">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/training')} className="p-2 rounded-lg hover:bg-muted border border-border" aria-label="Back to training list">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-bold text-foreground">Training Not Found</h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          The requested training does not exist or has been removed.
        </div>
      </div>
    );
  }

  const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
  const instructor = teachers.find(t => t.id === course.teacher_id);

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/training')} className="p-2 rounded-lg hover:bg-muted border border-border" aria-label="Back to training list">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">{course.title}</h2>
          <p className="text-xs text-muted-foreground">{course.category} &middot; {course.mode}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${course.status === 'Published' ? 'bg-success-bg text-success-text' : 'bg-warning-bg text-warning-text'}`}>{course.status}</span>
          <button onClick={() => updateCourse(course.id, { status: course.status === 'Published' ? 'Draft' : 'Published' })} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${course.status === 'Published' ? 'border-warning/30 text-warning-text hover:bg-warning-bg' : 'border-success/30 text-success-text hover:bg-success-bg'}`}>
            {course.status === 'Published' ? 'Unpublish' : 'Publish'}
          </button>
          <button onClick={() => updateCourse(course.id, { auto_approve: !course.auto_approve })} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${course.auto_approve ? 'border-primary bg-primary-light text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
            Auto-Approve: {course.auto_approve ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border rounded-xl">
        <div role="tablist" className="flex border-b border-border">
          {(['overview', 'syllabus', 'enrollments'] as const).map(tab => (
            <button key={tab} id={`tab-${tab}`} role="tab" aria-selected={detailTab === tab} aria-controls={`tabpanel-${tab}`} onClick={() => setDetailTab(tab)}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${detailTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="p-6">
          {detailTab === 'overview' && (
            <div id="tabpanel-overview" role="tabpanel" aria-labelledby="tab-overview" className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-background border border-border rounded-lg p-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Instructor</p>
                  <p className="text-sm font-bold text-foreground mt-1">{instructor?.full_name || 'Not assigned'}</p>
                </div>
                <div className="bg-background border border-border rounded-lg p-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Location</p>
                  <p className="text-sm font-bold text-foreground mt-1">{course.location || 'N/A'}</p>
                </div>
                <div className="bg-background border border-border rounded-lg p-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Duration</p>
                  <p className="text-sm font-bold text-foreground mt-1">{course.duration || 'N/A'}</p>
                </div>
              </div>
              {course.meta_description && (
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm text-foreground">{course.meta_description}</p>
                </div>
              )}
              {course.benefits.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Benefits</h4>
                  <div className="flex flex-wrap gap-2">
                    {course.benefits.map((b, i) => (
                      <span key={i} className="text-xs bg-success-bg text-success-text px-2.5 py-1 rounded-full font-semibold">{b}</span>
                    ))}
                  </div>
                </div>
              )}
              {course.eligibility && (
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Eligibility</h4>
                  <p className="text-sm text-foreground">{course.eligibility}</p>
                </div>
              )}
              {course.required_docs.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Required Documents</h4>
                  <div className="flex flex-wrap gap-2">
                    {course.required_docs.map((d, i) => (
                      <span key={i} className="text-xs bg-primary-light text-primary px-2.5 py-1 rounded-full font-semibold">{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {detailTab === 'syllabus' && (
            <div id="tabpanel-syllabus" role="tabpanel" aria-labelledby="tab-syllabus" className="space-y-2">
              {course.syllabus.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No syllabus added</p>}
              {course.syllabus.map((les, i) => {
                const icon = les.type === 'Video' ? <Video className="w-4 h-4" /> : les.type === 'Quiz' ? <HelpCircle className="w-4 h-4" /> : les.type === 'Assignment' ? <ClipboardList className="w-4 h-4" /> : <FileText className="w-4 h-4" />;
                return (
                  <div key={les.id} className="flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-3">
                    <span className="text-xs font-bold text-muted-foreground w-6">{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{les.title}</p>
                      <p className="text-[10px] text-muted-foreground">{les.type}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold">{les.duration}</span>
                  </div>
                );
              })}
            </div>
          )}
          {detailTab === 'enrollments' && (
            <div id="tabpanel-enrollments" role="tabpanel" aria-labelledby="tab-enrollments">
              {courseEnrollments.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No enrollments yet</p>}
              {courseEnrollments.length > 0 && (
                <div className="space-y-2">
                  {courseEnrollments.map(e => {
                    const member = members.find(m => m.id === e.member_id);
                    const statusColor = e.status === 'Enrolled' ? 'bg-success-bg text-success-text' : e.status === 'Completed' ? 'bg-primary-light text-primary' : e.status === 'Pending' ? 'bg-warning-bg text-warning-text' : 'bg-destructive-bg text-destructive-text';
                    return (
                      <div key={e.id} className="flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-3">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
                          {member?.full_name.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{member?.full_name || 'Unknown'}</p>
                          <p className="text-[10px] text-muted-foreground">Enrolled: {e.enrolled_date}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColor}`}>{e.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
