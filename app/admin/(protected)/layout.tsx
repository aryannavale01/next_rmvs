import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AdminLayoutWrapper from '@/components/admin-layout-wrapper';

export const dynamic = 'force-dynamic';

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdmin();
  if (!auth.success) {
    if (auth.error === 'Forbidden') {
      redirect('/unauthorized');
    }
    redirect('/admin/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.session.user.id },
    select: { mustChangePassword: true, twoFactorEnabled: true },
  });

  if (user?.mustChangePassword) {
    redirect('/force-password-change');
  }

  // 2FA enforcement: redirect admins without 2FA to setup page
  if (!user?.twoFactorEnabled) {
    redirect('/admin/setup-2fa');
  }

  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
