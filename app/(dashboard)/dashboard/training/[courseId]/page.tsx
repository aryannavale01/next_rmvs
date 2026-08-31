'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import {
  ChevronLeft, Clock, Users, MapPin, Star, BookOpen,
  Calendar, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { motion } from 'motion/react';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { courses, applications } = useDashboardData();

  const course = courses.find(c => c.id === courseId);
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  if (!course) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push('/dashboard/training')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={16} /> Back to Training
        </button>
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Training not found.</p>
        </div>
      </div>
    );
  }

  const isApplied = applications.some(a => a.courseId === course.id);
  const enrolled = applications.some(a => a.courseId === course.id && a.status === 'Approved');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <button onClick={() => router.push('/dashboard/training')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft size={16} /> Back to Training
      </button>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-full uppercase tracking-wider">{course.category}</span>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">{course.level}</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">{course.title}</h1>
          </div>
          <div className="flex flex-col gap-2 min-w-[200px]">
            {isApplied ? (
              <button
                onClick={() => router.push('/dashboard/applications')}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-lg bg-success-bg text-success-text border border-success/20"
              >
                {enrolled ? 'Enrolled' : 'Application Submitted'}
              </button>
            ) : (
              <button
                onClick={() => router.push(`/dashboard/training/apply/${course.id}`)}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors"
              >
                Apply for Admission
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Clock size={18} className="mx-auto mb-2 text-primary" />
          <p className="text-xs font-bold text-foreground">{course.duration}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Users size={18} className="mx-auto mb-2 text-primary" />
          <p className="text-xs font-bold text-foreground">{course.seatsLeft}/{course.totalSeats}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Seats Left</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <MapPin size={18} className="mx-auto mb-2 text-primary" />
          <p className="text-xs font-bold text-foreground">{course.location || 'Online'}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Location</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Calendar size={18} className="mx-auto mb-2 text-primary" />
          <p className="text-xs font-bold text-foreground">{course.startDate} - {course.endDate}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Schedule</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <BookOpen size={16} className="text-primary" /> Instructor
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm">
            {course.instructor.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{course.instructor.name}</p>
            <p className="text-[10px] text-muted-foreground">{course.instructor.designation}</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Star size={14} className="text-warning fill-warning" />
            <span className="text-xs font-bold text-foreground">{course.instructor.rating}</span>
          </div>
        </div>
      </div>

      {course.syllabus.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <BookOpen size={16} className="text-primary" /> Syllabus
          </h3>
          <div className="space-y-2">
            {course.syllabus.map((lesson, i) => (
              <div key={i} className="bg-background border border-border rounded-lg">
                <button
                  onClick={() => setExpandedLesson(expandedLesson === i ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="text-xs font-bold text-muted-foreground w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{lesson.title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{lesson.type}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                  {expandedLesson === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expandedLesson === i && (
                  <div className="px-4 pb-4 pl-[3.25rem] space-y-3">
                    {lesson.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{lesson.description}</p>
                    )}
                    {lesson.videoUrl && (
                      <video controls src={lesson.videoUrl} className="w-full rounded-lg border border-border max-h-64 bg-black" />
                    )}
                    {lesson.content && (
                      <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap bg-muted/40 p-3 rounded-lg border border-border">
                        {lesson.content}
                      </div>
                    )}
                    {!lesson.description && !lesson.videoUrl && !lesson.content && (
                      <p className="text-xs text-muted-foreground italic">Lesson materials will appear here once your instructor publishes them.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-foreground">
            {course.price === 0 ? 'Free' : `₹${course.price}`}
          </p>
          <p className="text-[10px] text-muted-foreground">{course.seatsLeft > 0 ? `${course.seatsLeft} seats available` : 'No seats available'}</p>
        </div>
        {!isApplied && course.seatsLeft > 0 && (
          <button
            onClick={() => router.push(`/dashboard/training/apply/${course.id}`)}
            className="py-2.5 px-6 text-xs font-bold rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors"
          >
            Apply Now
          </button>
        )}
      </div>
    </motion.div>
  );
}
