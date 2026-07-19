'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Globe, Mail, Share2, Send, CheckCircle } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-white border-t border-gray-100" id="footer-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div className="space-y-6">
            <Link
              href="/"
              className="flex items-center space-x-2 group focus:outline-none"
              id="footer-logo-btn"
            >
              <Globe className="h-6 w-6 text-brand-primary group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-display font-bold text-xl tracking-tight text-gray-950">
                Compassion<span className="text-brand-primary">Global</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
              Empowering local communities through sustainable education, healthcare, and infrastructure initiatives since 1994. Dedicated to absolute financial transparency.
            </p>
            <div className="flex space-x-3">
              <a href="https://compassionglobal.org" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-brand-primary rounded-full transition-colors cursor-pointer" aria-label="Website" id="footer-social-web">
                <Globe className="h-4 w-4" />
              </a>
              <a href="mailto:info@compassionglobal.org" className="p-2 bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-brand-primary rounded-full transition-colors cursor-pointer" aria-label="Email" id="footer-social-mail">
                <Mail className="h-4 w-4" />
              </a>
              <button onClick={() => { navigator.clipboard?.writeText(window.location.href); }} className="p-2 bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-brand-primary rounded-full transition-colors cursor-pointer" aria-label="Share" id="footer-social-share">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-display font-semibold text-xs tracking-wider text-gray-900 uppercase mb-4">
              Organization
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-gray-500 hover:text-brand-primary" id="footer-link-about">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/impact" className="text-sm text-gray-500 hover:text-brand-primary" id="footer-link-transparency">
                  Financial Transparency
                </Link>
              </li>
              <li>
                <Link href="/volunteer" className="text-sm text-gray-500 hover:text-brand-primary" id="footer-link-careers">
                  Careers & Volunteering
                </Link>
              </li>
              <li>
                <Link href="/programs" className="text-sm text-gray-500 hover:text-brand-primary" id="footer-link-programs">
                  Programs Overview
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-xs tracking-wider text-gray-900 uppercase mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/volunteer" className="text-sm text-gray-500 hover:text-brand-primary" id="footer-link-contact">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-500 hover:text-brand-primary" id="footer-link-privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-500 hover:text-brand-primary" id="footer-link-offices">
                  Global Offices
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-500 hover:text-brand-primary" id="footer-link-terms">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-display font-semibold text-xs tracking-wider text-gray-900 uppercase">
              Stay Connected
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Join our monthly newsletter to receive real-time impact updates from our global team.
            </p>
            {subscribed ? (
              <div className="flex items-center space-x-2 text-brand-primary bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 animate-in fade-in duration-200" id="footer-success-alert">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="text-xs font-medium text-brand-primary-hover">Thank you! Subscribed successfully.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative mt-2" id="footer-newsletter-form">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all pr-12"
                  id="footer-newsletter-input"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 p-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  aria-label="Submit email"
                  id="footer-newsletter-submit"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0" id="footer-bottom-bar">
          <p className="text-xs text-gray-400 text-center sm:text-left">
            &copy; 2026 CompassionGlobal NGO. Dedicated to sustainable change. Registered 501(c)(3) organization.
          </p>
          <div className="flex space-x-6 text-xs text-gray-400">
            <span>Language: English (US)</span>
            <span>Region: Global</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
