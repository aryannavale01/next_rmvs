'use client';

import { DashboardProvider } from '@/lib/dashboard-context';
import DashboardShell from '@/components/dashboard-shell';
import { ToastProvider } from '@/components/ui/toast';

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DashboardProvider>
        <DashboardShell>{children}</DashboardShell>
      </DashboardProvider>
    </ToastProvider>
  );
}
