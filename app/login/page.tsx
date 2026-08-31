"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ShieldAlert, LogIn } from "lucide-react";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { isSafeRedirect } from "@/lib/redirect";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = isSafeRedirect(searchParams.get("redirectTo") || "", "/dashboard");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await authClient.signIn.email({
        email,
        password,
      });

      if (authError) {
        setError("Invalid email or password.");
        return;
      }

      const userRole = (data?.user as Record<string, unknown>)?.role;
      if (userRole === "ADMIN") {
        // The sign-in already succeeded server-side, but this portal is member-only.
        // Sign the session back out so the admin is not left with an active session.
        setError("This portal is for members only. Admins use the admin login.");
        try {
          await authClient.signOut();
        } catch { /* best-effort sign out */ }
        return;
      }

      try { localStorage.setItem("cg_has_account", "1"); } catch {}

      // Full page navigation ensures cookies from the sign-in response
      // are included in the request headers for middleware verification
      window.location.href = redirectTo;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.activeElement instanceof HTMLElement) {
        (document.activeElement as HTMLElement).blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center items-center gap-2.5">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
            C
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Compassion<span className="text-primary">Global</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-foreground">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-xs text-muted-foreground max-w-xs mx-auto">
          Sign in to access your courses, certificates, and member dashboard.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="bg-card py-8 px-6 shadow-xl border border-border rounded-2xl">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 bg-destructive-bg border border-destructive/30 text-destructive-text rounded-lg text-xs flex items-center gap-2"
                role="alert"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                className="block w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="block w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-1.5 text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary-hover font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary hover:text-primary-hover font-semibold transition-colors"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.06)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(37,99,235,0.03)_0%,_transparent_50%)]" />

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
