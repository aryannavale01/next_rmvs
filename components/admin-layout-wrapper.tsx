'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AdminProvider, useAdmin } from '@/lib/admin-context';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  Award,
  Bell,
  Lock,
  Tag,
  Globe,
  Settings,
  Menu,
  X,
  LogOut,
  Search,
  Command,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToastProvider } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { id: 'members', label: 'Members', icon: Users, href: '/admin/members' },
  { id: 'teachers', label: 'Teachers', icon: GraduationCap, href: '/admin/teachers' },
  { id: 'training', label: 'Training', icon: ClipboardList, href: '/admin/training' },
  { id: 'enrollments', label: 'Enrollments', icon: FileText, href: '/admin/enrollments' },
  { id: 'certificates', label: 'Certificates', icon: Award, href: '/admin/certificates' },
  { id: 'notifications', label: 'Notifications', icon: Bell, href: '/admin/notifications' },
  { id: 'activity-logs', label: 'Activity Logs', icon: Lock, href: '/admin/activity-logs' },
  { id: 'coupons', label: 'Coupons', icon: Tag, href: '/admin/coupons' },
  { id: 'website-content', label: 'Website Content', icon: Globe, href: '/admin/website-content' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings' },
];

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Overview Metrics',
  '/admin/members': 'Beneficiaries',
  '/admin/teachers': 'NGO Instructors',
  '/admin/training': 'Course Programs',
  '/admin/enrollments': 'Admissions & Stats',
  '/admin/certificates': 'Credentials & Seals',
  '/admin/notifications': 'SMS & Email Broadcast',
  '/admin/activity-logs': 'Security Audit Logs',
  '/admin/coupons': 'Promo Coupons',
  '/admin/website-content': 'Landing CMS',
  '/admin/settings': 'Organization Settings',
};

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { members, teachers, courses } = useAdmin();
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else onClose();
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const q = query.toLowerCase();
  const results: { type: string; name: string; detail: string; href: string }[] = [];

  if (q.length > 0) {
    members.forEach(m => {
      if (m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) {
        results.push({ type: 'Member', name: m.full_name, detail: `${m.village}, ${m.district}`, href: '/admin/members' });
      }
    });
    teachers.forEach(t => {
      if (t.full_name.toLowerCase().includes(q) || t.specialization.toLowerCase().includes(q)) {
        results.push({ type: 'Teacher', name: t.full_name, detail: t.specialization, href: '/admin/teachers' });
      }
    });
    courses.forEach(c => {
      if (c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)) {
        results.push({ type: 'Course', name: c.title, detail: c.category, href: '/admin/training' });
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-xl shadow-2xl border border-border w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search members, teachers, courses..."
            className="flex-1 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-primary-light border border-border rounded">
            ESC
          </kbd>
        </div>
        {q.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No results found.</p>
            )}
            {results.slice(0, 10).map((r, i) => (
              <button
                key={i}
                onClick={() => { router.push(r.href); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-primary-light transition-colors cursor-pointer"
              >
                <span className="text-[10px] font-bold uppercase text-primary bg-primary-light px-1.5 py-0.5 rounded">{r.type}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.detail}</p>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
              </button>
            ))}
          </div>
        )}
        {q.length === 0 && (
          <div className="p-6 text-center">
            <Command className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Type to search across all data</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarContent({ pathname, adminUser, onLogout, onNav }: { pathname: string | null; adminUser: { username?: string; email?: string } | null; onLogout: () => void; onNav?: () => void }) {
  return (
    <>
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-lg shrink-0">
          CG
        </div>
        <div className="min-w-0">
          <h1 className="font-extrabold text-[11px] tracking-wider uppercase text-white">CompassionGlobal</h1>
          <span className="text-[9px] font-bold tracking-widest text-secondary-blue uppercase">ADMIN ERP</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onNav?.()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-foreground/70 hover:bg-card/5 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 flex items-center justify-between bg-black/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-extrabold text-white text-xs shrink-0">
            {adminUser?.username?.[0] || 'A'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[11px] truncate text-white">{adminUser?.username || 'Administrator'}</p>
            <span className="text-[9px] font-bold text-secondary-blue tracking-wider uppercase block">Supervisor</span>
          </div>
        </div>
        <button onClick={onLogout} className="p-2 text-destructive hover:text-destructive hover:bg-card/5 rounded-lg shrink-0" title="Sign out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminUser, logoutAdmin, resetAdmin, mounted, notifications } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isLoginPage = pathname === '/login' || pathname === '/admin/login';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  const currentPage = PAGE_TITLES[pathname || ''] || 'Admin Panel';
  const unreadCount = notifications.filter(n => !n.created_at.includes('2026-07-12')).length || 0;

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background text-foreground font-sans antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-white flex-shrink-0 border-r border-white/10">
        <SidebarContent pathname={pathname} adminUser={adminUser} onLogout={handleLogout} />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-sidebar text-white z-50 flex flex-col lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-end p-3">
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-card/10 text-muted-foreground hover:text-white" aria-label="Close sidebar">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent pathname={pathname} adminUser={adminUser} onLogout={handleLogout} onNav={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-card h-14 border-b border-border px-4 md:px-6 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 border border-border rounded-lg hover:bg-primary-light lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="w-4 h-4 text-foreground" />
            </button>
            <h1 className="text-sm md:text-base font-bold tracking-tight text-foreground">{currentPage}</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-primary-light border border-border rounded-lg hover:bg-primary-light transition-colors cursor-pointer"
            >
              <Search className="w-3 h-3" />
              <span>Search</span>
              <kbd className="text-[10px] font-mono bg-card border border-border rounded px-1">⌘K</kbd>
            </button>

            <button className="p-2 hover:bg-primary-light rounded-lg relative border border-border" aria-label="Notifications">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full" />
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l border-border">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold text-white text-xs">
                {adminUser?.username?.[0] || 'A'}
              </div>
              <div className="hidden md:block text-left text-xs leading-none">
                <p className="font-extrabold text-foreground">{adminUser?.username || 'Administrator'}</p>
                <span className="text-[9px] text-muted-foreground font-bold tracking-wider mt-0.5 block uppercase">NGO ERP Coor</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6 bg-background">
          {children}
        </main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          try {
            const { authClient } = await import('@/lib/auth-client');
            await authClient.signOut();
          } catch {
            // proceed with local logout even if API fails
          }
          logoutAdmin();
          resetAdmin();
          router.replace('/admin/login');
        }}
        title="Sign Out"
        description="Disconnect administrative control session?"
        confirmLabel="Sign Out"
      />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AdminProvider>
        <AdminShell>{children}</AdminShell>
      </AdminProvider>
    </ToastProvider>
  );
}
