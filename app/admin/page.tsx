'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/admin-context';

export default function AdminRootPage() {
  const router = useRouter();
  const { adminUser, mounted } = useAdmin();

  useEffect(() => {
    if (!mounted) return;
    if (adminUser) {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/admin/login');
    }
  }, [mounted, adminUser, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
