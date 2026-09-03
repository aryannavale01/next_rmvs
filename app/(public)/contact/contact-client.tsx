'use client';

import { useState, FormEvent } from 'react';
import { MapPin, Mail, Phone, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Turnstile } from '@marsidev/react-turnstile';

interface Office {
  id: string;
  name: string;
  location: string;
  address: string;
  contactEmail: string;
  phone: string;
  description: string;
}

interface ContactClientProps {
  phone: string;
  email: string;
  address: string;
  officeHours: string;
  facebook: string;
  instagram: string;
  youtube: string;
  offices: Office[];
}

export default function ContactClient({ phone, email, address, officeHours, facebook, instagram, youtube, offices }: ContactClientProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, turnstileToken }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', email: '', subject: '', message: '' });
      }, 4000);
    } catch {
      toast({ title: 'Error', description: 'Failed to send message. Please try again.', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-0">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/50 to-white pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-brand-primary border border-emerald-200/40">
            <Mail className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Get in Touch</span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 tracking-tight leading-none">
            Contact <span className="text-brand-primary">Us</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-xl mx-auto">
            Have a question about our training programmes, government scheme partnerships, or volunteering opportunities? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* CONTACT INFO + FORM */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Left: Contact Info */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-6">
                <h2 className="font-display font-bold text-2xl text-gray-900 tracking-tight">Reach Out</h2>

                <div className="space-y-5">
                  {phone && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-brand-primary shrink-0">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone</h4>
                        <p className="text-sm text-gray-600">{phone}</p>
                      </div>
                    </div>
                  )}

                  {email && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-brand-primary shrink-0">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email</h4>
                        <a href={`mailto:${email}`} className="text-sm text-gray-600 hover:text-brand-primary transition-colors">{email}</a>
                      </div>
                    </div>
                  )}

                  {address && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-brand-primary shrink-0">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Address</h4>
                        <p className="text-sm text-gray-600">{address}</p>
                      </div>
                    </div>
                  )}

                  {officeHours && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-brand-primary shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Office Hours</h4>
                        <p className="text-sm text-gray-600">{officeHours}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Links */}
              {(facebook || instagram || youtube) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Follow Us</h4>
                  <div className="flex gap-3">
                    {facebook && (
                      <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-emerald-50 flex items-center justify-center text-gray-400 hover:text-brand-primary transition-colors">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </a>
                    )}
                    {instagram && (
                      <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-emerald-50 flex items-center justify-center text-gray-400 hover:text-brand-primary transition-colors">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      </a>
                    )}
                    {youtube && (
                      <a href={youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-emerald-50 flex items-center justify-center text-gray-400 hover:text-brand-primary transition-colors">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Google Maps Embed */}
              {address && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Find Us</h4>
                  <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    <iframe
                      title="Office Location"
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Contact Form */}
            <div className="lg:col-span-7">
              <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-8 sm:p-10 shadow-sm">
                <h2 className="font-display font-bold text-xl text-gray-900 tracking-tight mb-6">Send a Message</h2>

                {submitted ? (
                  <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-4 animate-in zoom-in-95">
                    <CheckCircle2 className="h-12 w-12 text-brand-primary mx-auto" />
                    <h3 className="font-display font-bold text-xl text-gray-900">Message Sent!</h3>
                    <p className="text-sm text-gray-500">Thank you, {formData.name}. We&apos;ll get back to you at {formData.email} within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Full Name *</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Email *</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Subject</label>
                      <input type="text" value={formData.subject} onChange={e => setFormData(f => ({ ...f, subject: e.target.value }))} placeholder="How can we help?" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Message *</label>
                      <textarea required value={formData.message} onChange={e => setFormData(f => ({ ...f, message: e.target.value }))} placeholder="Tell us about your inquiry..." rows={5} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none" />
                    </div>
                    {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                      <div className="flex justify-center">
                        <Turnstile
                          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                          onSuccess={(token) => setTurnstileToken(token)}
                          onExpire={() => setTurnstileToken('')}
                        />
                      </div>
                    )}
                    <button type="submit" disabled={submitting || (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken)} className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                      <Send className="h-4 w-4" />
                      {submitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REGIONAL OFFICES */}
      {offices.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
              <h2 className="font-display font-bold text-3xl text-gray-900 tracking-tight">Our Office</h2>
              <p className="text-sm text-gray-500">Connect with our team in Junnar Taluka.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {offices.map(office => (
                <div key={office.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-brand-primary shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-base text-gray-950">{office.name}</h3>
                      <p className="text-xs text-gray-500">{office.location}</p>
                    </div>
                  </div>
                  {office.description && <p className="text-xs text-gray-400 leading-relaxed">{office.description}</p>}
                  <div className="space-y-1 text-xs text-gray-400 font-medium pt-2 border-t border-gray-100/50">
                    {office.contactEmail && <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-brand-primary" /> {office.contactEmail}</p>}
                    {office.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-brand-primary" /> {office.phone}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
