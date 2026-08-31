import { Shield } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Compassion Global',
  description: 'Privacy policy for Compassion Global NGO ERP system.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Last updated: August 20, 2026</p>

        <div className="prose prose-sm prose-foreground max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-bold text-foreground">1. Information We Collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Compassion Global collects information you provide directly, including your name, email address, phone number, and organizational affiliation when you register for an account, enroll in training programs, apply as a volunteer, or contact us. We also collect usage data such as pages visited, actions taken within the platform, and device/browser information for security and analytics purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">2. How We Use Your Information</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use your information to operate and improve our platform, process enrollments and applications, send administrative communications (including enrollment updates, certificate notifications, and system announcements), ensure platform security, and generate anonymized impact statistics. We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">3. Data Sharing</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your data may be shared with trusted service providers who assist in platform operations (hosting, email delivery, analytics), and with authorized administrators and staff of Compassion Global who require access to fulfill their roles. All third-party providers are contractually bound to protect your data. We may disclose information when required by law or to protect the safety of our community.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">4. Data Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We implement industry-standard security measures including encryption in transit (TLS), encrypted storage, role-based access controls, and regular security audits. While we strive to protect your information, no method of electronic transmission or storage is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">5. Your Rights</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You have the right to access, correct, or delete your personal data. You can update your profile information through the member dashboard. To request account deletion or data export, contact our support team. You may also opt out of non-essential communications at any time through your notification preferences.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">6. Cookies and Tracking</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session management. Analytics cookies may be used to understand platform usage patterns. You can manage cookie preferences through your browser settings. Disabling essential cookies may impair platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">7. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For privacy-related inquiries, contact us at{' '}
              <a href="mailto:privacy@compassionglobal.org" className="text-primary hover:underline">privacy@compassionglobal.org</a>{' '}
              or through our <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
