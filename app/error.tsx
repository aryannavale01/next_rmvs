'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Root error boundary:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <ErrorState
          title="Something went wrong"
          description="An unexpected error occurred. Please try again."
          developerError={error.digest || error.message}
          onRetry={reset}
          retryLabel="Try Again"
        />
      </div>
    </div>
  );
}
