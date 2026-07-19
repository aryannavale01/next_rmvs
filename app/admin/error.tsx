'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorState } from '@/components/ui/error-state';
import { useAdmin } from '@/lib/admin-context';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const { logoutAdmin } = useAdmin();

  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-4">
        <ErrorState
          title="Admin panel error"
          description={error.digest || 'An error occurred in the admin panel.'}
          onRetry={reset}
        />
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              logoutAdmin();
              router.replace('/admin/login');
            }}
            className="text-sm text-destructive hover:text-destructive/80 font-semibold"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
