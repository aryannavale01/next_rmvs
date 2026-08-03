"use client";

/**
 * Full-page interstitial shown when a page's auth/session check fails because
 * of a transient database/pooler outage. The admin is still signed in — we
 * deliberately do NOT redirect to /login (that would read as "logged out").
 */
export default function DbUnavailableInterstitial() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.08)_0%,_transparent_60%)]" />
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2.5">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20">
            C
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Compassion<span className="text-blue-400">Global</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white">
          Connection temporarily lost
        </h2>
        <p className="mt-3 text-center text-sm text-gray-500 max-w-xs mx-auto">
          You are still signed in. The database is briefly unavailable — this
          happens during short service blips. Please try again in a moment.
        </p>
        <div className="mt-8">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] focus:ring-blue-500 transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
