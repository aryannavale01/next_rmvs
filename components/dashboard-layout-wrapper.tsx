'use client';

import { DashboardProvider } from '@/lib/dashboard-context';
import DashboardShell from '@/components/dashboard-shell';
import { ToastProvider } from '@/components/ui/toast';

export default function DashboardLayoutWrapper({ children, siteName = '' }: { children: React.ReactNode; siteName?: string }) {
  return (
    <ToastProvider>
      <DashboardProvider orgName={siteName}>
        <DashboardShell>{children}</DashboardShell>
      </DashboardProvider>
    </ToastProvider>
  );
}
