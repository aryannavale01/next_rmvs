'use client';

import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function DashboardNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center mx-auto">
          <FileQuestion className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">404</h1>
          <p className="text-lg font-semibold text-foreground">Page not found</p>
          <p className="text-sm text-muted-foreground mt-2">
            This dashboard page does not exist.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-hover transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
