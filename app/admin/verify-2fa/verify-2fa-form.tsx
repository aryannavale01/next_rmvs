'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { authClient } from '@/lib/auth-client';

export default function Verify2FAForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code || code.length < 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await authClient.twoFactor.verifyTotp({
        code,
      });

      if (authError) {
        setError(authError.message || 'Invalid code. Please try again.');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#12121a] py-8 px-6 shadow-2xl border border-white/5 rounded-2xl">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-red-950/50 border border-red-800/30 text-red-400 rounded-lg text-xs flex items-center gap-2"
            role="alert"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <div>
          <label htmlFor="totp-code" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Authentication Code
          </label>
          <input
            id="totp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="block w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-center font-mono text-2xl tracking-[0.5em] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#12121a] focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Verify
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
