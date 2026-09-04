"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle, UserPlus, Phone } from "lucide-react";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { validatePassword } from "@/lib/password-validation";
import { isSafeRedirect } from "@/lib/redirect";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const redirectTo = isSafeRedirect(searchParams.get("redirectTo") || "", "/dashboard");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState("");
  const [emailChecking, setEmailChecking] = useState(false);

  // Ask the server whether this email is already registered, so we can warn the
  // user before they hit "Create Account" (Better Auth's sign-up endpoint does
  // not return a clear "already exists" error — it silently returns the user).
  const checkEmailExists = async (email: string): Promise<boolean> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;
    try {
      const res = await fetch("/api/public/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      if (!res.ok) return false; // Fail-open: don't block registration on a check error
      const data = (await res.json()) as { exists?: boolean };
      return Boolean(data.exists);
    } catch {
      return false;
    }
  };

  const handleEmailBlur = async () => {
    const email = form.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setEmailChecking(true);
    const exists = await checkEmailExists(email);
    setEmailChecking(false);
    if (exists) {
      setErrors((prev) => ({
        ...prev,
        email: "This email is already registered. Please sign in or use a different email address.",
      }));
    } else {
      setErrors((prev) => {
        if (prev.email?.includes("already registered")) {
          const next = { ...prev };
          delete next.email;
          return next;
        }
        return prev;
      });
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field] && !(field === "email" && errors[field].includes("already registered"))) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (apiError) setApiError("");
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!form.fullName.trim()) next.fullName = "Full name is required.";

    if (!form.email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Please enter a valid email address.";
    }

    if (!form.phone.trim()) {
      next.phone = "Phone number is required.";
    } else if (!/^(\+?91[\s-]?)?[6-9]\d{9}$/.test(form.phone.replace(/[\s-]/g, ""))) {
      next.phone = "Please enter a valid 10-digit phone number.";
    }

    if (!form.password) {
      next.password = "Password is required.";
    } else {
      const passwordResult = validatePassword(form.password);
      if (!passwordResult.valid) {
        next.password = passwordResult.errors[0];
      }
    }

    if (!form.confirmPassword) {
      next.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setApiError("");

    try {
      // Reliable duplicate check against the DB (Better Auth's sign-up does not
      // error on an already-registered email).
      const alreadyExists = await checkEmailExists(form.email);
      if (alreadyExists) {
        setApiError("This email is already registered. Please sign in or use a different email address.");
        setErrors((prev) => ({
          ...prev,
          email: "This email is already registered. Please sign in or use a different email address.",
        }));
        return;
      }

      const { error } = await authClient.signUp.email({
        email: form.email,
        password: form.password,
        name: form.fullName,
        // phone is not declared in better-auth's additionalFields (it lives on the
        // Profile model), but better-auth forwards extra body fields to the
        // databaseHooks context, where the user.create.after hook reads it.
        ...({ phone: form.phone.trim() } as object),
      } as Parameters<typeof authClient.signUp.email>[0] & { phone?: string });

      if (error) {
        // Detect duplicate / already-registered email addresses (defensive fallback
        // in case the pre-check missed or the server refuses) and surface a clear message.
        const msg = (error.message || "").toLowerCase();
        const isDuplicate =
          msg.includes("already exist") ||
          msg.includes("already registered") ||
          msg.includes("already in use") ||
          msg.includes("email_already") ||
          msg.includes("duplicate") ||
          error.status === 409 ||
          error.code === "EMAIL_ALREADY_EXISTS";

        if (isDuplicate) {
          setApiError("This email is already registered. Please sign in or use a different email address.");
          return;
        }

        setApiError(error.message || "Registration failed. Please try again.");
        return;
      }

      try { localStorage.setItem("cg_has_account", "1"); } catch {}

      // Email verification is required — always land on the success screen so
      // the user verifies their email (dev logs the token) before signing in.
      // Auto-redirecting into /dashboard immediately after signup is unreliable
      // because the verification-gated session may not be active yet.
      setSuccess(true);
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.06)_0%,_transparent_60%)]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="bg-card py-10 px-6 shadow-xl border border-border rounded-2xl text-center">
            <div className="w-14 h-14 bg-success-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Account Created!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your account has been created successfully. You can now log in with your credentials.
            </p>
            <Link
              href={`/login${redirectTo !== '/dashboard' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-colors"
            >
              Proceed to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.06)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(37,99,235,0.03)_0%,_transparent_50%)]" />

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
          Create Account
        </h2>
        <p className="mt-2 text-center text-xs text-muted-foreground max-w-xs mx-auto">
          Join as a member to access courses, certificates, and more.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="bg-card py-8 px-6 shadow-xl border border-border rounded-2xl">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {apiError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 bg-destructive-bg border border-destructive/30 text-destructive-text rounded-lg text-xs flex items-center gap-2"
                role="alert"
              >
                <p>{apiError}</p>
              </motion.div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="Enter full name"
                autoComplete="name"
                className="block w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-destructive-text">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="Enter phone number"
                  autoComplete="tel"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-destructive-text">{errors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="Enter email address"
                autoComplete="email"
                className="block w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive-text">{errors.email}</p>
              )}
              {emailChecking && (
                <p className="mt-1 text-xs text-muted-foreground">Checking availability...</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
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
              {errors.password && (
                <p className="mt-1 text-xs text-destructive-text">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                className="block w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-destructive-text">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:text-primary-hover font-semibold transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
