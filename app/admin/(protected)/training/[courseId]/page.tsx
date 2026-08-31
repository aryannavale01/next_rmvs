'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { AdminCourse } from '@/lib/admin-types';
import {
  ChevronLeft, Pencil, Video, HelpCircle, ClipboardList, FileText, Loader2, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from '@/lib/admin-stepup';
import { useToast } from '@/components/ui/toast';

export default function AdminCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [teachers, setTeachers] = useState<{ id: string; fullName: string }[]>([]);
  const [course, setCourse] = useState<AdminCourse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCourse = useCallback(async () => {
    await Promise.resolve().then(() => {
      setLoading(true);
    });
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data.course ?? null);
      } else {
        setCourse(null);
      }
    } catch {
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchCourse();
    });
  }, [fetchCourse]);

  useEffect(() => {
    fetch('/api/admin/teachers/list')
      .then(r => r.json())
      .then(d => setTeachers(d.data || []))
      .catch((err) => { console.error('Failed to load teachers:', err); });
  }, []);

  const [detailTab, setDetailTab] = useState<'overview' | 'syllabus' | 'enrollments'>('overview');
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const handleUpdate = useCallback(async (patch: Record<string, unknown>) => {
    if (!(await requireStepUpClient('/admin/training', 'update_course'))) return;
    setUpdating(true);
    try {
      let res: Response;
      try {
        res = await fetch(`/api/admin/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
          signal: AbortSignal.timeout(15000),
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === 'TimeoutError') {
          throw new Error('The server took too long to respond. Please try again.');
        }
        throw e;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (isStepUpRequiredResponse(res.status, err.error)) {
          redirectToStepUp(`/admin/training/${courseId}`, 'update_course');
          return;
        }
        throw new Error(err.error || 'Failed to update the training.');
      }
      const describe = () => {
        if (patch.status !== undefined) return patch.status === 'Published' ? 'Training is now published.' : 'Training moved back to draft.';
        if (patch.auto_approve !== undefined) return `Auto-approve is now ${patch.auto_approve ? 'on' : 'off'}.`;
        return 'Changes saved.';
      };
      toast({ title: 'Training Updated', description: describe(), variant: 'success' });
      await fetchCourse();
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err?.message || 'Could not update the training.', variant: 'error' });
    } finally {
      setUpdating(false);
    }
  }, [courseId, fetchCourse, toast]);

  if (loading) {
    return (
      <div className="space-y-4 font-sans">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/training')} className="p-2 rounded-lg hover:bg-muted border border-border" aria-label="Back">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-bold text-foreground">Training</h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4 font-sans">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/training')} className="p-2 rounded-lg hover:bg-muted border border-border" aria-label="Back">
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

  const instructor = teachers.find(t => t.id === course.teacher_id);

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/training')} className="p-2 rounded-lg hover:bg-muted border border-border" aria-label="Back">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">{course.title}</h2>
          <p className="text-xs text-muted-foreground">{course.category} &middot; {course.mode}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${course.status === 'Published' ? 'bg-success-bg text-success-text' : 'bg-warning-bg text-warning-text'}`}>{course.status}</span>
          <button onClick={() => router.push(`/admin/training?editCourseId=${course.id}`)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-primary text-primary hover:bg-primary-light">
            <Pencil className="w-3 h-3" /> Edit
          </button>
          <button onClick={() => handleUpdate({ status: course.status === 'Published' ? 'Draft' : 'Published' })} disabled={updating}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border disabled:opacity-50 ${course.status === 'Published' ? 'border-warning/30 text-warning-text hover:bg-warning-bg' : 'border-success/30 text-success-text hover:bg-success-bg'}`}>
            {course.status === 'Published' ? 'Unpublish' : 'Publish'}
          </button>
          <button onClick={() => handleUpdate({ auto_approve: !course.auto_approve })} disabled={updating}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border disabled:opacity-50 ${course.auto_approve ? 'border-primary bg-primary-light text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
            {updating ? 'Saving…' : `Auto-Approve: ${course.auto_approve ? 'On' : 'Off'}`}
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
                  <p className="text-sm font-bold text-foreground mt-1">{instructor?.fullName || 'Not assigned'}</p>
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
                const Icon = les.type === 'Video' ? Video : les.type === 'Quiz' ? HelpCircle : les.type === 'Assignment' ? ClipboardList : FileText;
                return (
                  <div key={les.id} className="flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-3">
                    <span className="text-xs font-bold text-muted-foreground w-6">{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center"><Icon className="w-4 h-4" /></div>
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
            <div id="tabpanel-enrollments" role="tabpanel" aria-labelledby="tab-enrollments" className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                {course.seats_enrolled} enrolled / {course.seats_total} seats
              </p>
              <Link
                href={`/admin/enrollments/${course.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary bg-primary-light rounded-lg hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Manage Enrollments
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
