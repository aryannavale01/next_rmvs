import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="h-screen flex overflow-hidden bg-background animate-skeleton-fade-in">
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar flex-shrink-0 p-4 space-y-3">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-8 h-8 rounded-lg bg-white/10" />
          <Skeleton className="h-5 w-24 bg-white/10" />
        </div>
        {Array.from({ length: 11 }, (_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg bg-white/10" />
        ))}
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card h-14 border-b border-border px-4 md:px-6 flex items-center justify-between flex-shrink-0">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-32 rounded-lg hidden sm:block" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-10 w-48 rounded-lg" />
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
