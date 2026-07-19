'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Public route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <ErrorState
          title="Page unavailable"
          description={error.digest || 'This page encountered an error. Please try again.'}
          onRetry={reset}
        />
      </div>
    </div>
  );
}
