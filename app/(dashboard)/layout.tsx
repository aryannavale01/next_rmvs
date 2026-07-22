import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/session';
import DashboardLayoutWrapper from '@/components/dashboard-layout-wrapper';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuth();
  if (!auth.success) {
    redirect('/login');
  }
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
