'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  HeartHandshake, MapPin, Mail, Phone,
  CheckCircle2, ShieldCheck, Users,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Office {
  id: string;
  name: string;
  location: string;
  address: string;
  contactEmail: string;
  phone: string;
  description: string;
}

interface VolunteerClientProps {
  offices: Office[];
  heroImage?: string;
}

export default function VolunteerClient({ offices, heroImage }: VolunteerClientProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Education', hours: '5', motivation: '', agree: false });
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.agree) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/volunteer-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          hoursPerWeek: formData.hours,
          motivation: formData.motivation,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({ name: '', email: '', role: 'Education', hours: '5', motivation: '', agree: false });
      }, 4000);
    } catch {
      toast({ title: 'Error', description: 'Failed to submit application. Please try again.', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-0" id="volunteer-page-root">

      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/50 to-white pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-brand-primary border border-emerald-200/40">
                <HeartHandshake className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Join our ranks</span>
              </div>
              <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 tracking-tight leading-none">
                Volunteer With <br />
                <span className="text-brand-primary">Rupashree Mahila Vikas Sanstha</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-lg">
                Whether your skill is beauty &amp; wellness training, digital literacy, agriculture, or event support — help us bring skill development to more women across Junnar Taluka.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-brand-primary shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">12k+ Registered Volunteers</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-brand-primary shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Fully Insured &amp; Supported</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="aspect-[16/10] bg-gray-100 rounded-[2rem] overflow-hidden shadow-md border border-gray-100">
                <img
                  src={heroImage || "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80"}
                  alt="Volunteers supporting a community training session in Junnar Taluka"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. APPLICATION FORM */}
      <section className="py-20 bg-white border-y border-gray-100" id="section-volunteer-form">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-8 sm:p-12 shadow-sm space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 tracking-tight">Volunteer Application Form</h2>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Tell us how you&apos;d like to help</p>
            </div>

            {success ? (
              <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-4 animate-in zoom-in-95" id="volunteer-form-success">
                <CheckCircle2 className="h-12 w-12 text-brand-primary mx-auto" />
                <h3 className="font-display font-bold text-xl text-gray-900">Application Received!</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
                  Thank you, <span className="font-semibold text-gray-800">{formData.name}</span>! Our volunteer onboarding coordinators in your regional hub will review your skills and email you at <span className="font-semibold text-gray-800">{formData.email}</span> within 2 business days to schedule a virtual interview.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" id="form-volunteer">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Areas of Specialization</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary cursor-pointer"
                    >
                      <option value="Education">Digital Education &amp; Tutoring</option>
                      <option value="Health">Community Public Health Nursing</option>
                      <option value="Environment">Silviculture &amp; Reforestation mapping</option>
                      <option value="Logistics">Disaster Relief Logistics</option>
                      <option value="Finance">Financial Audit &amp; Data Entry</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Hours available per week</label>
                    <select
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary cursor-pointer"
                    >
                      <option value="2">2 - 5 hours</option>
                      <option value="5">5 - 10 hours</option>
                      <option value="15">10 - 20 hours</option>
                      <option value="40">Full Time placement (Field HQ)</option>
                    </select>
                  </div>

                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Brief Statement of Skills &amp; Experience</label>
                  <textarea
                    required
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    placeholder="Tell us about yourself, your skills, or languages spoken..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
                  />
                </div>

                <div className="flex items-start gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="volunteer-agree"
                    required
                    checked={formData.agree}
                    onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 cursor-pointer"
                  />
                  <label htmlFor="volunteer-agree" className="text-xs text-gray-500 leading-normal cursor-pointer select-none">
                    I agree to the <Link href="/volunteer/code-of-conduct" className="font-semibold text-brand-primary hover:underline">Volunteer Code of Conduct</Link> and consent to a background/reference check.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  id="btn-volunteer-submit"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 3. OPERATIONAL OFFICES GRID */}
      <section className="py-24 bg-white" id="section-offices">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
            <h2 className="font-display font-bold text-3xl text-gray-900 tracking-tight">Our Office</h2>
            <p className="text-sm text-gray-500">Connect with our team in Junnar Taluka.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="offices-grid">
            {offices.map((office) => (
              <div key={office.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-start hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-brand-primary">
                  <MapPin className="h-5 w-5" />
                </div>

                <div className="space-y-2 flex-1">
                  <h3 className="font-display font-semibold text-base text-gray-950">{office.name}</h3>
                  <p className="text-xs text-gray-500">{office.location}</p>
                  {office.description && <p className="text-xs text-gray-400 leading-relaxed">{office.description}</p>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400 font-medium pt-2 border-t border-gray-100/50">
                    {office.contactEmail && (
                      <span className="flex items-center gap-1.5 hover:text-brand-primary transition-colors cursor-pointer">
                        <Mail className="h-3.5 w-3.5 text-brand-primary" /> {office.contactEmail}
                      </span>
                    )}
                    {office.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-brand-primary" /> {office.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {offices.length === 0 && (
              <div className="col-span-2 text-center py-12 text-gray-400 text-sm">
                Office details coming soon — contact us at ashwininavale83@gmail.com.
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
