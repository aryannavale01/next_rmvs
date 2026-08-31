import { FileText } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Compassion Global',
  description: 'Terms of service for Compassion Global NGO ERP system.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Last updated: August 20, 2026</p>

        <div className="prose prose-sm prose-foreground max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-bold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing or using the Compassion Global platform, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform. These terms apply to all users including members, volunteers, administrators, and visitors.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">2. Account Responsibilities</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to provide accurate, current, and complete information during registration and to keep your profile information up to date. Notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">3. Platform Use</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The platform is provided for organizational management, training coordination, volunteer tracking, and related nonprofit operations. You agree to use it only for lawful purposes and in accordance with these terms. You may not attempt to gain unauthorized access to any part of the platform, interfere with its operation, or use it to transmit harmful content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">4. Intellectual Property</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All content, design, code, and materials on the platform are owned by or licensed to Compassion Global. You may not copy, modify, distribute, or create derivative works without prior written consent. Training materials accessed through the platform are for personal educational use only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">5. Certificates and Credentials</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Certificates issued through the platform represent completion of training programs administered by Compassion Global. Certificates may be revoked if obtained through fraudulent means or if the underlying training requirements are found to have been unfulfilled. Certificate verification is available to authorized parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">6. Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The platform is provided &ldquo;as is&rdquo; without warranties of any kind. Compassion Global shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount you paid for platform access, if any.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">7. Termination</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at our discretion, including for violations of these terms. Upon termination, your right to access the platform ceases immediately. We may retain certain data as required by law or for legitimate operational purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">8. Changes to Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may update these terms from time to time. Material changes will be communicated through platform notifications or email. Continued use of the platform after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">9. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For questions about these terms, contact us at{' '}
              <a href="mailto:legal@compassionglobal.org" className="text-primary hover:underline">legal@compassionglobal.org</a>{' '}
              or through our <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
