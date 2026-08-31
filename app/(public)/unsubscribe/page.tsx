'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { CheckCircle, AlertTriangle, Mail } from 'lucide-react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const already = searchParams.get('already') === 'true';
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-6">
        {success ? (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Unsubscribed</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              You have been successfully unsubscribed from our newsletter. You will no longer receive email communications from us.
            </p>
          </>
        ) : already ? (
          <>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Already Unsubscribed</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              This email address has already been unsubscribed from our newsletter.
            </p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Something Went Wrong</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              {error === 'not_found'
                ? 'This email address was not found in our subscriber list.'
                : error === 'invalid_email'
                  ? 'The email address provided is invalid.'
                  : error === 'invalid_token'
                    ? 'This unsubscribe link is invalid or has expired. Please use the unsubscribe link from a recent email, or contact support.'
                    : 'We encountered an error processing your request. Please try again later.'}
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-gray-400" />
            </div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Unsubscribe</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              If you arrived here from an email link, your unsubscribe request is being processed.
            </p>
          </>
        )}

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-sm rounded-xl transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
