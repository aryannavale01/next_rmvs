'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function CourseCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between animate-pulse" style={{ height: 360 }}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
        <div className="flex gap-4 items-center pt-2">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </div>
      <div className="pt-4 border-t border-border">
        <Skeleton className="h-6 w-24 rounded mb-3" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4 animate-pulse">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3 rounded" />
        <Skeleton className="h-6 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="relative pl-8 space-y-8 animate-pulse before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-border">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative">
          <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-border border-4 border-card" />
          <div className="space-y-2 pl-2">
            <Skeleton className="h-4 w-1/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { EmptyState } from '@/components/ui/empty-state';
