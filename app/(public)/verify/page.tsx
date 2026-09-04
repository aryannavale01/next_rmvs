import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  ScanLine,
  FileCheck2,
  Search,
  CheckCircle2,
  HelpCircle,
  Award,
} from "lucide-react";
import { getOrgConfig } from "@/lib/org-config";
import { generatePageMetadata } from "@/lib/seo";
import { safeBrandColor } from "@/lib/brand-color";
import VerifyLookupClient from "./verify-lookup-client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: "Verify a Certificate",
    description:
      "Verify the authenticity of any certificate issued under the MH-SKILL program by Rupashree Mahila Vikas Sanstha (RMVS). Enter your verification code to see the live status.",
    path: "/verify",
  });
}

const STEPS = [
  {
    icon: FileCheck2,
    title: "Find your code",
    body: "Your verification code is printed on your certificate next to the QR code (e.g. a 22-character unique string).",
  },
  {
    icon: ScanLine,
    title: "Enter or scan",
    body: "Type the code below, or scan the QR code on your certificate with your phone camera to jump straight here.",
  },
  {
    icon: ShieldCheck,
    title: "See live status",
    body: "Instantly confirm whether the certificate is authentic, pending, or revoked — straight from our records.",
  },
];

const FAQS = [
  {
    q: "What is a certificate verification code?",
    a: "Every certificate issued by RMVS under the MH-SKILL program carries a unique, cryptographically-random verification code. It cannot be guessed or reused, which is how third parties (employers, universities, government offices) confirm a certificate is genuine.",
  },
  {
    q: "What do the different statuses mean?",
    a: "Verified means the certificate is authentic and officially published. Pending means it has been generated but not yet released. Revoked means it was withdrawn and is no longer valid - the reason is shown on the result page.",
  },
  {
    q: "Where do I find my verification code?",
    a: "Look at the bottom-right corner of your certificate PDF, near the QR code. The code also appears in your member dashboard under Certificates.",
  },
  {
    q: "My certificate shows as Pending - what should I do?",
    a: "Pending certificates are still being processed or awaiting official release. If a reasonable time has passed since you received it, please contact us through the Contact page.",
  },
];

export default async function VerifyLandingPage() {
  const config = await getOrgConfig();
  const brandColor = safeBrandColor(config.brandColor);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${brandColor} 0%, #0f172a 100%)`,
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-semibold tracking-wide uppercase mb-6">
            <ShieldCheck size={14} />
            Official Certificate Verification
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight leading-tight">
            Verify a Certificate Instantly
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/85 max-w-xl mx-auto">
            Confirm the authenticity of any {config.siteName} certificate issued under the
            MH-SKILL program. Enter your verification code below.
          </p>
        </div>
      </section>

      {/* Lookup Card */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <VerifyLookupClient />
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center font-display text-slate-900 mb-10">
          How verification works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center"
            >
              <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4 bg-primary/10">
                <step.icon size={22} className="text-primary" />
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Step {i + 1}
              </div>
              <h3 className="font-bold text-slate-900">{step.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security note */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex gap-4 items-start">
          <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
              <Award size={16} /> Tamper-evident &amp; authentic
            </h3>
            <p className="text-sm text-emerald-800 mt-1 leading-relaxed">
              Each certificate is bound to a unique code stored in our secure database. The code
              forms part of a QR code on the PDF, so anyone can verify a certificate&apos;s
              authenticity in seconds - no account or login required.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-center font-display text-slate-900 mb-10 flex items-center justify-center gap-2">
            <HelpCircle size={22} className="text-primary" />
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group bg-white rounded-xl border border-slate-200 p-5 open:shadow-sm"
              >
                <summary className="cursor-pointer font-semibold text-slate-900 list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900 font-display">
          Need help or further verification?
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          For official verifications, certificates, or any dispute, reach our team directly.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 mt-5 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors"
        >
          <Search size={16} />
          Contact the team
        </Link>
      </section>
    </div>
  );
}
