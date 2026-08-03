import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/session';
import ForcePasswordChangeForm from './force-password-change-form';
import DbUnavailableInterstitial from '@/components/db-unavailable-interstitial';

export const dynamic = 'force-dynamic';

export default async function ForcePasswordChangePage() {
  const auth = await requireAdmin();
  if (!auth.success) {
    if (auth.error === 'DATABASE_UNAVAILABLE') {
      return <DbUnavailableInterstitial />;
    }
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.08)_0%,_transparent_60%)]" />
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2.5">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20">
            C
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Compassion<span className="text-blue-400">Global</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white">
          Change Your Password
        </h2>
        <p className="mt-2 text-center text-xs text-gray-500 max-w-xs mx-auto">
          Your temporary password must be changed before accessing the admin dashboard.
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <ForcePasswordChangeForm />
      </div>
    </div>
  );
}
