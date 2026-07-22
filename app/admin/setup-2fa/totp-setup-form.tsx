'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldAlert, ShieldCheck, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { authClient } from '@/lib/auth-client';
import QRCode from 'qrcode';

type SetupStep = 'password' | 'qr' | 'verify' | 'done';

export default function TOTPSetupForm() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>('password');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpURI, setTotpURI] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState('');
  const [secretCopied, setSecretCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (totpURI) {
      QRCode.toDataURL(totpURI, { width: 200, margin: 2 }, (err, url) => {
        if (!err) setQrDataUrl(url);
      });
    }
  }, [totpURI]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      const { data, error: authError } = await authClient.twoFactor.enable({
        password,
        issuer: 'CompassionGlobal',
      });
      if (authError) {
        setError(authError.message || 'Failed to initiate 2FA setup. Check your password.');
        return;
      }
      if (data) {
        setTotpURI((data as Record<string, unknown>).totpURI as string);
        setBackupCodes((data as Record<string, unknown>).backupCodes as string[]);
        setStep('qr');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!totpCode || totpCode.length < 6) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await authClient.twoFactor.verifyTotp({
        code: totpCode,
      });
      if (authError) {
        setError(authError.message || 'Invalid code. Please try again.');
        return;
      }
      setStep('done');
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 2000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    const secret = totpURI.split('secret=')[1]?.split('&')[0] || '';
    navigator.clipboard.writeText(secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  if (step === 'done') {
    return (
      <div className="bg-[#12121a] py-8 px-6 shadow-2xl border border-white/5 rounded-2xl text-center">
        <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">2FA Enabled Successfully</h3>
        <p className="text-sm text-gray-400">Redirecting to admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#12121a] py-8 px-6 shadow-2xl border border-white/5 rounded-2xl">
      {step === 'password' && (
        <form className="space-y-5" onSubmit={handlePasswordSubmit} noValidate>
          <p className="text-xs text-gray-400">
            Enter your password to begin 2FA setup.
          </p>
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
            <label htmlFor="setup-password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="setup-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="block w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Continue
              </>
            )}
          </button>
        </form>
      )}

      {step === 'qr' && (
        <div className="space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Step 1: Add to Authenticator App</h3>
            <p className="text-xs text-gray-400">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), or manually enter the secret key.
            </p>
            <div className="bg-white p-4 rounded-lg flex justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="TOTP QR Code"
                  className="w-48 h-48"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-xs">
                  Generating QR code...
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-gray-400 bg-white/5 p-2 rounded break-all">
                {totpURI.split('secret=')[1]?.split('&')[0] || ''}
              </code>
              <button
                type="button"
                onClick={copySecret}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                {secretCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {backupCodes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Backup Codes</h3>
              <p className="text-xs text-gray-400">
                Save these backup codes in a secure location. Each can be used once if you lose access to your authenticator.
              </p>
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-1">
                  {backupCodes.map((code, i) => (
                    <code key={i} className="text-xs text-gray-300 font-mono">{code}</code>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Step 2: Verify Code</h3>
            <p className="text-xs text-gray-400">
              Enter the 6-digit code from your authenticator app to complete setup.
            </p>
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
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="block w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-center font-mono tracking-[0.5em] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={loading || totpCode.length < 6}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify & Enable
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
