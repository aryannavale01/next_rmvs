'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <ErrorState
          title="Dashboard error"
          description={error.digest || 'Something went wrong loading this page. Please try again.'}
          onRetry={reset}
        />
      </div>
    </div>
  );
}
