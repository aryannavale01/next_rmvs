'use client';

import { useState, FormEvent } from 'react';
import { 
  HeartHandshake, MapPin, Mail, Phone, Clock,
  CheckCircle2, ShieldCheck, Users,
} from 'lucide-react';

export default function VolunteerPage() {
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Education', hours: '5', motivation: '', agree: false });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.agree) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({ name: '', email: '', role: 'Education', hours: '5', motivation: '', agree: false });
      }, 4000);
    }
  };

  const offices = [
    { country: 'Senegal (Regional Hub)', address: 'Rue de Louga, Point E, Dakar', email: 'dakar.office@compassionglobal.org', phone: '+221 33 824 1020', hours: '08:00 - 17:00 UTC' },
    { country: 'Rwanda (Admin HQ)', address: 'KG 541 St, Nyarutarama, Kigali', email: 'kigali.office@compassionglobal.org', phone: '+250 252 584 900', hours: '08:00 - 17:00 CAT' },
    { country: 'United States (Advocacy)', address: '1201 Connecticut Ave NW, Washington, DC', email: 'dc.office@compassionglobal.org', phone: '+1 202 555 0192', hours: '09:00 - 18:00 EST' },
    { country: 'Peru (South America Hub)', address: 'Av. Arequipa 3420, San Isidro, Lima', email: 'lima.office@compassionglobal.org', phone: '+51 1 614 7000', hours: '08:00 - 17:00 PET' }
  ];

  return (
    <div className="space-y-0" id="volunteer-page-root">
      
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/50 to-white pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Texts */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-brand-primary border border-emerald-200/40">
                <HeartHandshake className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Join our ranks</span>
              </div>
              <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 tracking-tight leading-none">
                Mobilize with <br />
                <span className="text-brand-primary">CompassionGlobal</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-lg">
                Join 12,000+ active volunteers worldwide dismantling systemic barriers. Whether your talent is public health, digital mentoring, organic agriculture, or logistics, we have a place for you.
              </p>

              {/* Specs */}
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

            {/* Photo illustration */}
            <div className="lg:col-span-6">
              <div className="aspect-[16/10] bg-gray-100 rounded-[2rem] overflow-hidden shadow-md border border-gray-100">
                <img 
                  src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80" 
                  alt="Volunteers planting in garden" 
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
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 tracking-tight">Volunteer Mobilization Form</h2>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Phase 1 Application</p>
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
                    I agree to the <span className="font-semibold text-gray-700 hover:underline">Volunteer Code of Conduct</span>, safety guidelines, and consent to reference and background verification.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                  id="btn-volunteer-submit"
                >
                  Submit Application Packet
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
            <h2 className="font-display font-bold text-3xl text-gray-900 tracking-tight">Our Regional Offices</h2>
            <p className="text-sm text-gray-500">Connect directly with our local specialized administrative hubs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="offices-grid">
            {offices.map((office) => (
              <div key={office.country} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-start hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-brand-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                
                <div className="space-y-2 flex-1">
                  <h3 className="font-display font-semibold text-base text-gray-950">{office.country}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{office.address}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400 font-medium pt-2 border-t border-gray-100/50">
                    <span className="flex items-center gap-1.5 hover:text-brand-primary transition-colors cursor-pointer">
                      <Mail className="h-3.5 w-3.5 text-brand-primary" /> {office.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-brand-primary" /> {office.phone}
                    </span>
                    <span className="flex items-center gap-1.5 sm:col-span-2">
                      <Clock className="h-3.5 w-3.5 text-brand-primary" /> Office Hours: {office.hours}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
