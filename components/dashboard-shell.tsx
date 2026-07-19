'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDashboard, TRANSLATIONS } from '@/lib/dashboard-context';
import { useToast } from '@/components/ui/toast';
import {
  LayoutDashboard,
  User,
  GraduationCap,
  FileText,
  Award,
  Bell,
  History,
  Globe,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, notifications, profile } = useDashboard();
  const { toast } = useToast();
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const navItems = [
    { name: t.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { name: t.myProfile, href: '/dashboard/profile', icon: User },
    { name: t.training, href: '/dashboard/training', icon: GraduationCap },
    { name: t.applications, href: '/dashboard/applications', icon: FileText },
    { name: t.certificates, href: '/dashboard/certificates', icon: Award },
    { name: t.notifications, href: '/dashboard/notifications', icon: Bell, badgeCount: notifications.filter(n => !n.read).length },
    { name: t.activity, href: '/dashboard/activity', icon: History }
  ];

  const isItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  const getPageTitle = () => {
    if (pathname === '/dashboard') return t.dashboard;
    if (pathname?.startsWith('/dashboard/profile')) return t.myProfile;
    if (pathname?.startsWith('/dashboard/training/apply')) return `${t.training} - Apply`;
    if (pathname?.startsWith('/dashboard/training/')) return `${t.training} - Details`;
    if (pathname?.startsWith('/dashboard/training')) return t.training;
    if (pathname?.startsWith('/dashboard/applications')) return t.applications;
    if (pathname?.startsWith('/dashboard/certificates')) return t.certificates;
    if (pathname?.startsWith('/dashboard/notifications')) return t.notifications;
    if (pathname?.startsWith('/dashboard/activity')) return t.activity;
    return "Dashboard";
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-primary-light selection:text-primary">
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-light/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-light/30 rounded-full blur-3xl"></div>
      </div>

      <aside
        id="desktop-sidebar"
        className="hidden md:flex flex-col shrink-0 bg-sidebar text-sidebar-foreground transition-all duration-300 relative z-30 h-full w-64"
      >
        <div className="flex items-center justify-between px-6 mb-8 pt-6 flex-row">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-primary/20"
              style={{ mixBlendMode: 'screen' }}
            >
              U
            </div>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-bold text-xl tracking-tight whitespace-nowrap text-white"
            >
              Gov Portal
            </motion.span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-800">
          {navItems.map((item) => {
            const active = isItemActive(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                }}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 group relative ${
                  active
                    ? 'bg-sidebar-active text-white border-l-[3px] border-sidebar-foreground shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-sidebar-active/40'
                }`}
              >
                <item.icon
                  size={18}
                  className={`shrink-0 transition-transform duration-200 ${
                    active ? 'text-white' : 'text-slate-400 group-hover:text-white group-hover:scale-105'
                  }`}
                />
                <span className="text-sm truncate">{item.name}</span>
                {item.badgeCount && item.badgeCount > 0 && (
                  <span
                    className="ml-auto flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 py-0.5 bg-destructive text-white"
                  >
                    {item.badgeCount}
                  </span>
                )}
              </a>
            );
          })}

          <div className="h-px bg-slate-800 my-4" />

          <div className="px-1 py-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Globe size={14} className="shrink-0" />
              <span>{t.language}</span>
            </div>
            <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg">
              {(['en', 'hi', 'mr'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`text-xs font-semibold py-1 px-1.5 rounded transition-all flex-1 ${
                    language === lang
                      ? 'bg-sidebar-active text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`Switch to ${lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/20 hover:text-destructive transition-all"
            title="Sign Out"
          >
            <LogOut size={16} className="shrink-0" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-sidebar text-sidebar-foreground z-50 flex flex-col md:hidden shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between px-6 pt-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20"
                    style={{ mixBlendMode: 'screen' }}
                  >
                    U
                  </div>
                  <span className="font-bold text-xl tracking-tight text-white">
                    Gov Portal
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-sidebar-active text-muted-foreground hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-1">
                {navItems.map((item) => {
                  const active = isItemActive(item.href);
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(item.href);
                        setIsMobileOpen(false);
                      }}
                      className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-sidebar-active text-white border-l-[3px] border-sidebar-foreground'
                          : 'text-slate-400 hover:bg-sidebar-active/40 hover:text-white'
                      }`}
                    >
                      <item.icon size={20} className={active ? 'text-white' : 'text-slate-400'} />
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.badgeCount && item.badgeCount > 0 ? (
                        <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-destructive text-white">
                          {item.badgeCount}
                        </span>
                      ) : null}
                    </a>
                  );
                })}

                <div className="h-px bg-slate-800 my-6" />

                <div className="px-4 py-2 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Globe size={14} />
                    <span>{t.language}</span>
                  </div>
                  <div className="flex bg-slate-800/50 p-1 rounded-lg gap-1">
                    {(['en', 'hi', 'mr'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`text-xs font-semibold py-2 rounded transition-all flex-1 ${
                          language === lang ? 'bg-sidebar-active text-white shadow' : 'text-slate-400'
                        }`}
                      >
                        {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
                      </button>
                    ))}
                  </div>
                </div>
              </nav>

              <div className="p-4 border-t border-slate-800 mt-auto">
                <button
                  onClick={() => {
                    setIsMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/20 hover:text-destructive transition-all"
                >
                  <LogOut size={16} />
                  <span>{t.logout}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        <header id="main-header" className="h-16 flex items-center justify-between px-4 md:px-8 bg-card border-b border-border sticky top-0 z-20 shadow-sm backdrop-blur-md bg-card/90">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 rounded-lg hover:bg-primary-light text-foreground md:hidden transition-colors"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground truncate">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-6 border-l border-border h-8">
              <a
                href="/dashboard/profile"
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/dashboard/profile');
                }}
                className="flex items-center gap-3 hover:opacity-95 transition-opacity"
              >
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-foreground leading-none">
                    {profile.firstName} {profile.lastName}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-none mt-1 truncate max-w-[120px]">
                    {profile.email}
                  </span>
                </div>
                {profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt="User profile"
                    className="h-10 w-10 rounded-full object-cover border-2 border-primary-light shrink-0 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center font-bold text-primary border-2 border-primary-light shrink-0 uppercase shadow-sm">
                    {profile.firstName[0]}
                    {profile.lastName[0]}
                  </div>
                )}
              </a>
            </div>
          </div>
        </header>

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>

        <main id="main-content" className="flex-1 p-4 md:p-8 overflow-y-auto z-10">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
