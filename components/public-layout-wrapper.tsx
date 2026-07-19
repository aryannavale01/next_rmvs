'use client';

import { useState } from 'react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import SearchModal from '@/components/public/SearchModal';
import { ToastProvider } from '@/components/ui/toast';

export default function PublicLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar openSearch={() => setIsSearchOpen(true)} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
        {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}
      </div>
    </ToastProvider>
  );
}
