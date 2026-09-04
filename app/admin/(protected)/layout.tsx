import { redirect } from 'next/navigation';
import { requireOtpVerified } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AdminLayoutWrapper from '@/components/admin-layout-wrapper';
import DbUnavailableInterstitial from '@/components/db-unavailable-interstitial';
import { getOrgConfig } from '@/lib/org-config';
import { safeBrandColor } from '@/lib/brand-color';

export const dynamic = 'force-dynamic';

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireOtpVerified();
  if (!auth.success) {
    if (auth.error === 'DATABASE_UNAVAILABLE') {
      return <DbUnavailableInterstitial />;
    }
    if (auth.error === 'Forbidden') {
      redirect('/unauthorized');
    }
    if (auth.error === 'OTP_REQUIRED') {
      redirect('/admin/verify-otp');
    }
    redirect('/admin/login');
  }

  const config = await getOrgConfig();

  const user = await prisma.user.findUnique({
    where: { id: auth.session.user.id },
    select: { mustChangePassword: true, twoFactorEnabled: true },
  });

  if (user?.mustChangePassword) {
    redirect('/force-password-change');
  }

  if (config.enable2FA && !user?.twoFactorEnabled) {
    redirect('/admin/setup-2fa');
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `:root { --brand-primary: ${safeBrandColor(config.brandColor)}; --brand-primary-hover: ${safeBrandColor(config.brandColor)}dd; }` }} />
      <AdminLayoutWrapper siteName={config.siteName} logoText={config.logoText} brandColor={config.brandColor}>{children}</AdminLayoutWrapper>
    </>
  );
}
