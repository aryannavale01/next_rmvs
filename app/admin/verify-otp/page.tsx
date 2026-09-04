"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, ShieldCheck, MailCheck, LogOut, RefreshCw, Timer } from "lucide-react";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { isSafeRedirect } from "@/lib/redirect";

const RESEND_COOLDOWN_SECONDS = 30;

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = isSafeRedirect(searchParams.get("redirectTo") || "", "/admin");

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(true);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [delivered, setDelivered] = useState<boolean | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const sendCode = useCallback((isResend: boolean, isInitial = true) => {
    Promise.resolve()
      .then(() => {
        if (!isInitial) {
          setError("");
          setSending(true);
        }
        if (isResend) setNotice("Sending a new code…");
      })
      .then(() => fetch("/api/admin/auth/send-otp", { method: "POST" }))
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setSending(false);
          setError(data.error || "Unable to send a code right now.");
          return null;
        }
        return data as { email?: string; delivered?: boolean };
      })
      .then((data) => {
        if (!data) return;
        setMaskedEmail(data.email ?? null);
        setDelivered(data.delivered ?? null);
        setNotice("");
        if (isResend) setCooldown(RESEND_COOLDOWN_SECONDS);
      })
      .catch(() => setError("Network error. Please try again."))
      .finally(() => setSending(false));
  }, []);

  useEffect(() => {
    sendCode(false, true);
  }, [sendCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code. Please try again.");
        return;
      }
      window.location.href = redirectTo;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const canResend = cooldown <= 0 && !sending;

  return (
    <div className="bg-[#12121a] py-8 px-6 shadow-2xl border border-white/5 rounded-2xl">
      <div className="flex items-center justify-center mb-5">
        <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400">
          <MailCheck className="w-6 h-6" />
        </div>
      </div>

      <h3 className="text-center text-lg font-semibold text-white mb-1">Check your email</h3>
      <p className="text-center text-xs text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
        {sending && !maskedEmail
          ? "Sending your one-time code…"
          : maskedEmail
            ? `We sent a 6-digit code to ${maskedEmail}. It expires in 5 minutes.`
            : "One more step to secure your session."}
      </p>

      {notice && (
        <div className="mb-4 p-3 bg-blue-950/50 border border-blue-800/30 text-blue-300 rounded-lg text-xs flex items-center gap-2">
          <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-4 p-3 bg-red-950/50 border border-red-800/30 text-red-400 rounded-lg text-xs flex items-center gap-2"
          role="alert"
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <form className="space-y-5" onSubmit={handleVerify} noValidate>
        <div>
          <label htmlFor="otp-code" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            One-Time Code
          </label>
          <input
            id="otp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            disabled={sending && !maskedEmail}
            className="block w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-center font-mono text-2xl tracking-[0.5em] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            autoFocus
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || code.length < 6 || (sending && !maskedEmail)}
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
                Verify & Continue
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-white/5 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => sendCode(true, false)}
          disabled={!canResend}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {canResend ? "Resend code" : `Resend code in ${cooldown}s`}
        </button>
        {cooldown === 0 && !canResend && (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
            <Timer className="w-3 h-3" /> Codes expire after 5 minutes
          </span>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cancel and sign out
        </button>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.08)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(37,99,235,0.04)_0%,_transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center items-center gap-2.5">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20">
            C
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Compassion<span className="text-blue-400">Global</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white">
          Secure Admin Access
        </h2>
        <p className="mt-2 text-center text-xs text-gray-500 max-w-xs mx-auto">
          Verify your identity with a one-time code sent to your email.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <Suspense fallback={null}>
          <VerifyOtpForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
