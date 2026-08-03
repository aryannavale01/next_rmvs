import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/session';
import DashboardLayoutWrapper from '@/components/dashboard-layout-wrapper';
import DbUnavailableInterstitial from '@/components/db-unavailable-interstitial';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuth();
  if (!auth.success) {
    if (auth.error === 'DATABASE_UNAVAILABLE') {
      return <DbUnavailableInterstitial />;
    }
    redirect('/login');
  }
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
