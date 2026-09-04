"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ScanLine, ArrowRight } from "lucide-react";

// Accepts either a bare verification code or a full /verify/<code> URL that the
// user may have copied from a certificate / email.
function extractCode(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const segment = url.pathname.split("/").filter(Boolean).pop() ?? "";
      return segment;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

export default function VerifyLookupClient() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = extractCode(value);
    if (!code || code.length < 8) {
      setError(
        "Please enter a valid verification code (at least 8 characters). It is printed on the certificate next to the QR code.",
      );
      return;
    }
    setError(null);
    router.push(`/verify/${encodeURIComponent(code)}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-1">
        <ScanLine size={18} className="text-primary" />
        <h2 className="font-bold text-slate-900">Enter your verification code</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        You can type the code or paste the full verification URL from your certificate.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. aB3x... or https://…/verify/aB3x..."
            aria-label="Certificate verification code or URL"
            className="flex-1 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors shrink-0"
          >
            <ShieldCheck size={16} />
            Verify Now
            <ArrowRight size={16} />
          </button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
