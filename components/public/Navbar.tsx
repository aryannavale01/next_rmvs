'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, Search, Menu, X, Heart } from 'lucide-react';

interface NavbarProps {
  openSearch: () => void;
}

const navItems = [
  { label: 'Our Mission', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Programs', href: '/programs' },
  { label: 'Impact', href: '/impact' },
  { label: 'Resources', href: '/resources' },
  { label: 'Volunteer', href: '/volunteer' },
];

export default function Navbar({ openSearch }: NavbarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsOpen(false);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="navbar-container">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-2 group focus:outline-none"
              id="navbar-logo-btn"
            >
              <Globe className="h-7 w-7 text-brand-primary group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-display font-bold text-2xl tracking-tight text-gray-900">
                Compassion<span className="text-brand-primary">Global</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <div className="flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative py-2 text-[15px] font-medium transition-colors focus:outline-none cursor-pointer ${
                    isActive(item.href)
                      ? 'text-brand-primary font-semibold'
                      : 'text-gray-600 hover:text-brand-primary'
                  }`}
                  id={`nav-item-${item.href}`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={openSearch}
                className="p-2 text-gray-500 hover:text-brand-primary hover:bg-gray-50 rounded-full transition-all cursor-pointer"
                aria-label="Search Catalog"
                id="nav-search-btn"
              >
                <Search className="h-5 w-5" />
              </button>

              <Link
                href="/donate"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-brand-primary text-white font-medium text-[15px] hover:bg-brand-primary-hover shadow-sm transition-all hover:shadow-md cursor-pointer group"
                id="nav-donate-btn"
              >
                <Heart className="mr-1.5 h-4 w-4 fill-white text-white group-hover:scale-110 transition-transform duration-200" />
                Donate Now
              </Link>
            </div>
          </div>

          <div className="flex items-center md:hidden space-x-2">
            <button
              onClick={openSearch}
              className="p-2 text-gray-500 hover:text-brand-primary rounded-full"
              id="mobile-nav-search"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-600 hover:text-brand-primary rounded-md focus:outline-none"
              aria-expanded={isOpen}
              id="mobile-nav-toggle"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 animate-in fade-in slide-in-from-top-5 duration-200" id="mobile-menu-panel">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-emerald-50 text-brand-primary font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-brand-primary'
                }`}
                id={`mobile-nav-item-${item.href}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 pb-2 border-t border-gray-100 px-4">
              <Link
                href="/donate"
                onClick={() => setIsOpen(false)}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-brand-primary text-white font-medium text-base hover:bg-brand-primary-hover shadow-sm transition-all"
                id="mobile-nav-donate-btn"
              >
                <Heart className="mr-2 h-5 w-5 fill-white text-white" />
                Donate Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
