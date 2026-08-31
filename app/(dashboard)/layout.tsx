import { redirect } from 'next/navigation';
import { requireMember } from '@/lib/session';
import { getOrgConfig } from '@/lib/org-config';
import DashboardLayoutWrapper from '@/components/dashboard-layout-wrapper';
import DbUnavailableInterstitial from '@/components/db-unavailable-interstitial';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireMember();
  if (!auth.success) {
    if (auth.error === 'DATABASE_UNAVAILABLE') {
      return <DbUnavailableInterstitial />;
    }
    redirect('/admin/login');
  }
  const config = await getOrgConfig();
  return <DashboardLayoutWrapper siteName={config.siteName}>{children}</DashboardLayoutWrapper>;
}
