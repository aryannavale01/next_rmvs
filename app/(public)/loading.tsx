import { Skeleton } from '@/components/ui/skeleton';

export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-background animate-skeleton-fade-in">
      <div className="h-16 bg-card border-b border-border px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="hidden md:flex items-center gap-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        <div className="space-y-4 max-w-2xl">
          <Skeleton className="h-10 w-3/4 rounded" />
          <Skeleton className="h-5 w-1/2 rounded" />
          <Skeleton className="h-12 w-40 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
