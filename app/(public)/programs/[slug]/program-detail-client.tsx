'use client';

import Link from 'next/link';
import {
  Clock, Users, MapPin, Award, BookOpen, ChevronLeft, ChevronDown, ChevronUp,
  GraduationCap, FileText, CheckCircle, LogIn, UserPlus, ExternalLink,
} from 'lucide-react';
import { useState } from 'react';

interface SyllabusItem {
  id: string;
  title: string;
  description: string | null;
  lessonType: string;
  durationMinutes: number | null;
  isFreePreview: boolean;
}

interface TeacherData {
  fullName: string;
  profilePhoto: string | null;
  designation: string;
  bio: string | null;
  rating: number | null;
  experienceYears: number | null;
  specializations: string[];
}

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  category: string;
  level: string;
  mode: string;
  description: string;
  duration: string;
  location: string | null;
  image: string | null;
  seatsTotal: number | null;
  seatsLeft: number | 'Unlimited';
  benefits: string[];
  eligibility: string[];
  requiredDocuments: string[];
  instructor: {
    name: string;
    role: string;
    image: string;
    teacher: TeacherData | null;
  };
  syllabus: SyllabusItem[];
}

type EnrollmentStatus = 'not_applied' | 'applied' | 'enrolled';

interface ProgramDetailClientProps {
  course: CourseDetail;
  enrollmentStatus: EnrollmentStatus;
  applicationStatus: string | null;
  isLoggedIn: boolean;
}

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Application Pending',
  under_review: 'Under Review',
  documents_verified: 'Documents Verified',
  seat_reserved: 'Seat Reserved',
  rejected: 'Application Rejected',
  waitlisted: 'Waitlisted',
  deleted: 'Application Withdrawn',
};

const LESSON_TYPE_ICONS: Record<string, string> = {
  video: 'Video',
  text: 'Reading',
  quiz: 'Quiz',
  assignment: 'Assignment',
};

export default function ProgramDetailClient({
  course,
  enrollmentStatus,
  applicationStatus,
  isLoggedIn,
}: ProgramDetailClientProps) {
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const ctaBaseUrl = `/dashboard/training/apply/${course.id}`;

  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-300">

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link href="/programs" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-brand-primary transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Programs
        </Link>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Left: Course info */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-700 text-white font-mono font-bold text-[10px] tracking-widest px-3 py-1 rounded-md uppercase">
                {course.category}
              </span>
              <span className="bg-gray-100 text-gray-600 font-mono font-bold text-[10px] tracking-wider px-3 py-1 rounded-md uppercase">
                {course.level}
              </span>
              <span className="bg-blue-50 text-blue-700 font-mono font-bold text-[10px] tracking-wider px-3 py-1 rounded-md uppercase flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> {course.mode}
              </span>
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
              {course.description}
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-brand-primary" /> {course.duration}
              </span>
              {course.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand-primary" /> {course.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-brand-primary" />
                {course.seatsLeft === 'Unlimited' ? 'Unlimited seats' : `${course.seatsLeft} seats left`}
              </span>
            </div>
          </div>

          {/* Right: CTA sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-gray-50 rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6 lg:sticky lg:top-28">

              {/* Enrollment CTA */}
              {!isLoggedIn ? (
                <div className="space-y-3">
                  <Link
                    href={`/login?redirectTo=${encodeURIComponent(ctaBaseUrl)}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    <LogIn className="h-4 w-4" />
                    Login to Enroll
                  </Link>
                  <Link
                    href={`/register?redirectTo=${encodeURIComponent(ctaBaseUrl)}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-600 hover:text-brand-primary hover:border-brand-primary/30 font-medium text-sm rounded-xl transition-all"
                  >
                    <UserPlus className="h-4 w-4" />
                    New here? Create an account
                  </Link>
                </div>
              ) : enrollmentStatus === 'enrolled' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span className="text-sm font-semibold text-emerald-800">Enrolled</span>
                  </div>
                  <Link
                    href={`/dashboard/training/${course.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm rounded-xl shadow-md transition-all"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Course
                  </Link>
                </div>
              ) : enrollmentStatus === 'applied' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                    <span className="text-sm font-semibold text-amber-800">
                      {APPLICATION_STATUS_LABELS[applicationStatus || 'pending'] || 'Application Submitted'}
                    </span>
                  </div>
                  <Link
                    href="/dashboard/applications"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 hover:text-brand-primary hover:border-brand-primary/30 font-medium text-sm rounded-xl transition-all"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Application
                  </Link>
                </div>
              ) : (
                <Link
                  href={ctaBaseUrl}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <GraduationCap className="h-4 w-4" />
                  Enroll Now
                </Link>
              )}

              {/* Course meta */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-400">Duration</span>
                  <span className="font-semibold text-gray-700">{course.duration}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-400">Mode</span>
                  <span className="font-semibold text-gray-700">{course.mode}</span>
                </div>
                {course.location && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-400">Location</span>
                    <span className="font-semibold text-gray-700">{course.location}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Seats</span>
                  <span className="font-semibold text-gray-700">
                    {course.seatsLeft === 'Unlimited' ? 'Unlimited' : `${course.seatsLeft} / ${course.seatsTotal ?? '—'}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instructor */}
      {(course.instructor.teacher || course.instructor.name) && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-gray-100">
          <h2 className="font-display font-bold text-xl text-gray-900 mb-6">Your Instructor</h2>
          <div className="flex items-start gap-5 bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <img
              src={course.instructor.teacher?.profilePhoto || course.instructor.image || '/placeholder-avatar.svg'}
              alt={course.instructor.teacher?.fullName || course.instructor.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-gray-200"
            />
            <div className="space-y-2">
              <h3 className="font-display font-bold text-lg text-gray-900">
                {course.instructor.teacher?.fullName || course.instructor.name}
              </h3>
              <p className="text-xs text-gray-400 font-semibold">
                {course.instructor.teacher?.designation || course.instructor.role}
              </p>
              {course.instructor.teacher?.bio && (
                <p className="text-sm text-gray-500 leading-relaxed">{course.instructor.teacher.bio}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-gray-400 pt-1">
                {course.instructor.teacher?.rating != null && course.instructor.teacher.rating > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-amber-500">★</span> {course.instructor.teacher.rating.toFixed(1)}
                  </span>
                )}
                {course.instructor.teacher?.experienceYears != null && (
                  <span>{course.instructor.teacher.experienceYears} years experience</span>
                )}
                {course.instructor.teacher?.specializations?.length ? (
                  <span>{course.instructor.teacher.specializations.join(', ')}</span>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Benefits & Eligibility */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {course.benefits.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-gray-900">What You&apos;ll Gain</h2>
              <ul className="space-y-3">
                {course.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {course.eligibility.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-gray-900">Eligibility</h2>
              <ul className="space-y-3">
                {course.eligibility.map((e, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Required Documents */}
      {course.requiredDocuments.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-gray-100">
          <h2 className="font-display font-bold text-xl text-gray-900 mb-4">Required Documents</h2>
          <div className="flex flex-wrap gap-2">
            {course.requiredDocuments.map((doc, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
                <FileText className="h-3.5 w-3.5 text-brand-primary" />
                {doc}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Syllabus */}
      {course.syllabus.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-gray-100">
          <h2 className="font-display font-bold text-xl text-gray-900 mb-6">Course Syllabus</h2>
          <div className="space-y-3">
            {course.syllabus.map((lesson) => (
              <div key={lesson.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {LESSON_TYPE_ICONS[lesson.lessonType] || lesson.lessonType}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{lesson.title}</span>
                    {lesson.isFreePreview && (
                      <span className="text-[10px] font-bold text-brand-primary bg-emerald-50 px-2 py-0.5 rounded-full">
                        Free Preview
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {lesson.durationMinutes && (
                      <span className="text-xs text-gray-400">{lesson.durationMinutes} min</span>
                    )}
                    {expandedLesson === lesson.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </button>
                {expandedLesson === lesson.id && lesson.description && (
                  <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                    {lesson.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
