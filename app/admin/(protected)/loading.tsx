import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Desktop Sidebar Skeleton */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar flex-shrink-0 border-r border-white/10">
        {/* Logo area */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/15 rounded-lg animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-white/15 rounded animate-pulse" />
            <div className="h-2 w-16 bg-white/10 rounded animate-pulse" />
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {Array.from({ length: 11 }, (_, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${i === 0 ? 'bg-sidebar-active' : ''}`}
            >
              <div className="w-4 h-4 bg-white/15 rounded animate-pulse shrink-0" />
              <div className="h-3 bg-white/15 rounded animate-pulse" style={{ width: `${50 + ((i * 13) % 30)}%` }} />
            </div>
          ))}
        </nav>

        {/* User area */}
        <div className="p-3 border-t border-white/10 bg-black/10 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/15 rounded-full animate-pulse shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="h-3 w-20 bg-white/15 rounded animate-pulse" />
            <div className="h-2 w-14 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-card h-14 border-b border-border px-4 md:px-6 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <div className="w-9 h-9 border border-border rounded-lg lg:hidden" />
            <Skeleton className="h-5 w-40 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-32 rounded-lg hidden sm:block" />
            <Skeleton className="w-9 h-9 rounded-lg border border-border" />
            <div className="flex items-center gap-2.5 pl-3 border-l border-border">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="hidden md:block space-y-1.5">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-2 w-14 rounded" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6 bg-background">
          <div className="space-y-5">
            {/* Page title */}
            <Skeleton className="h-7 w-48 rounded" />

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                  <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-6 w-12 rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Table area */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <Skeleton className="h-5 w-36 rounded" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-28 rounded-lg" />
                  <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
              </div>
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-center gap-4 py-2">
                    <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 rounded" style={{ width: `${40 + ((i * 13) % 30)}%` }} />
                      <Skeleton className="h-3 rounded" style={{ width: `${20 + ((i * 7) % 20)}%` }} />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full shrink-0" />
                    <Skeleton className="h-7 w-7 rounded shrink-0" />
                    <Skeleton className="h-7 w-7 rounded shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
