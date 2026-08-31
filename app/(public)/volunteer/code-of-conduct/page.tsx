import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Volunteer Code of Conduct — Compassion Global',
  description: 'Code of conduct and behavioral expectations for volunteers at Compassion Global.',
};

export default function CodeOfConductPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Volunteer Code of Conduct</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Effective: August 2026</p>

        <div className="prose prose-sm prose-foreground max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-bold text-foreground">1. Our Commitment</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Compassion Global is dedicated to creating a safe, respectful, and inclusive environment for all volunteers, staff, beneficiaries, and partners. Every volunteer represents our organization and is expected to uphold the highest standards of integrity and compassion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">2. Respect and Inclusion</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Volunteers shall treat all individuals with dignity and respect, regardless of age, gender, race, ethnicity, religion, disability, sexual orientation, or socioeconomic status. Discrimination, harassment, bullying, or any form of disrespectful behavior will not be tolerated.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">3. Professional Conduct</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Volunteers are expected to be punctual, reliable, and committed to their assigned responsibilities. If you are unable to fulfill a scheduled commitment, notify your supervisor as early as possible. Maintain professionalism in all interactions with beneficiaries, colleagues, and external partners.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">4. Confidentiality</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Volunteers may have access to sensitive information about beneficiaries, staff, and organizational operations. All such information must be kept strictly confidential. Unauthorized disclosure of personal data, organizational strategies, or beneficiary information is a serious violation of this code.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">5. Safety and Well-being</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The safety of our beneficiaries — especially children and vulnerable populations — is paramount. Volunteers must follow all safeguarding policies, including never being alone with a minor without another adult present, reporting any concerns immediately, and complying with background verification requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">6. Conflict of Interest</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Volunteers must avoid situations where personal interests conflict with their responsibilities to Compassion Global. Any potential conflicts of interest must be disclosed to your supervisor immediately. Volunteers may not use their position for personal gain or to benefit family members or friends.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">7. Use of Resources</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Organizational resources — including equipment, supplies, funds, and digital systems — are to be used exclusively for authorized purposes. Volunteers may not take or misappropriate any organizational property or funds.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">8. Reporting Violations</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you witness or experience a violation of this code, report it immediately to your supervisor, the volunteer coordinator, or through our <Link href="/contact" className="text-primary hover:underline">contact page</Link>. All reports will be investigated promptly and handled confidentially. Retaliation against individuals who report concerns in good faith is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">9. Consequences</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Violations of this code may result in disciplinary action, including verbal or written warnings, suspension from volunteer activities, or permanent dismissal. Serious violations — particularly those involving safety, fraud, or legal matters — may be reported to the appropriate authorities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">10. Acknowledgment</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By volunteering with Compassion Global, you acknowledge that you have read, understood, and agree to abide by this Code of Conduct. You understand that this code may be updated periodically and that you are responsible for staying informed of any changes.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/volunteer" className="text-primary hover:underline text-sm font-medium">
            ← Back to Volunteer
          </Link>
        </div>
      </div>
    </div>
  );
}
