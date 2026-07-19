'use client';

import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center mx-auto">
          <FileQuestion className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">404</h1>
          <p className="text-lg font-semibold text-foreground">Page not found</p>
          <p className="text-sm text-muted-foreground mt-2">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Link
            href="/"
            className="px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-hover transition-colors"
          >
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-5 py-2.5 border border-border text-foreground font-semibold text-sm rounded-lg hover:bg-primary-light transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
